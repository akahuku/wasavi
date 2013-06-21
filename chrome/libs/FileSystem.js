/**
 * online storage interface
 * =============================================================================
 *
 *
 * @author akahuku@gmail.com
 * @version $Id: FileSystem.js 318 2013-06-21 19:43:25Z akahuku $
 */
/**
 * Copyright 2012 akahuku, akahuku@gmail.com
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

(function (global) {
	'use strict';

	var OAuth;
	var u;

	/*
	 * oauth utilities
	 */

	function queryToObject (url) {
		var index = url.indexOf('?');
		if (index < 0) {
			return {};
		}
		var result = {};
		url.substring(index + 1).split('&').forEach(function (s) {
			var index = s.indexOf('=');
			var key, value;
			if (index < 0) {
				key = s;
				value = '';
			}
			else {
				key = s.substring(0, index);
				value = s.substring(index + 1);
			}
			key = OAuth.urlDecode(key);
			value = OAuth.urlEncode(value);
			result[key] = value;
		});
		return result;
	}

	function objectToQuery (q) {
		var result = [];
		for (var i in q) {
			if (q[i] == undefined) continue;
			result.push(
				OAuth.urlEncode(i) +
				'=' +
				OAuth.urlEncode(q[i]));
		}
		return result.join('&');
	}

	function getFullUrl (url, q) {
		var base = u.baseUrl(url);
		var query = objectToQuery(q);
		return query == '' ? base : (base + '?' + query);
	}

	function getCanonicalPath (path) {
		return path.split('/').map(OAuth.urlEncode).join('/');
	}

	/*
	 * task queue class
	 */

	function TaskQueue (fs, authorize, ls, read, write) {
		var queue = [];
		var timer;

		function processQueue () {
			timer = null;

			if (queue.length == 0) return;

			var top = queue.shift();
			switch (top.task) {
			case 'authorize':
				if (fs.isAuthorized && top.state == 'authorized') {
					runQueue();
				}
				else {
					queue.unshift(top);
					authorize(top);
				}
				break;
			case 'ls':
				ls(top);
				break;
			case 'write':
				write(top);
				break;
			case 'read':
				read(top);
				break;
			}
		}

		function runQueue (data) {

			if (!fs.isAuthorized) {
				if (queue.length == 0 || queue[0].task != 'authorize') {
					queue.unshift({
						task:'authorize',
						state:'initial-state',
						tabId:data && data.tabId
					});
				}
				else {
					if (data && 'tabId' in data) {
						queue[0].tabId = data.tabId;
					}
				}
			}

			if (data) {
				queue.push(data);
			}

			if (!timer) {
				timer = u.setTimeout.call(global, processQueue, 100);
			}
		}

		function getTopTask () {
			return queue[0];
		}

		this.run = runQueue;
		this.__defineGetter__('topTask', getTopTask);
	}

	/*
	 * file system base class
	 */

	function FileSystem (consumerKey, consumerSecret, extension) {
		this.extension = extension;
	}

	FileSystem.prototype = {
		backend:'*null*',
		isAuthorized:false,
		write:function () {},
		read:function () {},
		ls:function (path, tabId, callback) {callback({})},
		response: function (task, data) {
			data.type = 'fileio-' + task.task + '-response';
			this.extension.sendRequest(task.tabId, data);
		},
		getInternalPath:function (path) {
			var schema = this.backend + ':/';
			if (path.indexOf(schema) == 0) {
				path = path.substring(schema.length);
			}
			if (path.charAt(0) == '/') {
				path = path.substring(1);
			}
			return path;
		},
		getExternalPath:function (path) {
			if (path.charAt(0) != '/') {
				path = '/' + path;
			}
			return this.backend + ':/' + path;
		},
		accessTokenKeyName:function () {
			return 'filesystem.' + this.backend + '.tokens';
		},
		match:function (url) {
			return url.indexOf(this.backend + ':') == 0;
		},
		clearCredential:function () {
			this.extension.storage.setItem(accessTokenKeyName(), undefined);
		}
	};

	/*
	 * file system class for dropbox
	 */

	function FileSystemDropbox (consumerKey, consumerSecret, extension) {

		/*
		 * privates
		 */

		function responseError (task, data) {
			var errorMessage = false;

			if (typeof data == 'object') {
				if (errorMessage === false && 'text' in data) {
					var jsonData = u.parseJson(data.text);

					switch (u.objectType(jsonData.error)) {
					case 'String':
						errorMessage = jsonData.error;
						break;

					case 'Object':
						errorMessage = jsonData.error[Object.keys(jsonData.error)[0]];
						break;
					}
				}
				if (errorMessage === false && 'status' in data) {
					switch (data.status) {
					case 404:
						errorMessage = 'File not found.';
						break;
					}
				}
				if (errorMessage === false && 'wasavi_filesystem_error' in data) {
					errorMessage = data.wasavi_filesystem_error;
				}
			}
			else {
				errorMessage = data + '';
			}

			errorMessage = self.backend + ': ' + errorMessage;
			extension.isDev && console.error('wasavi background: file system error: ' + errorMessage);
			self.response(task, {error:errorMessage});
		}

		function restoreAcessTokenPersistents () {
			var obj = extension.storage.getItem(self.accessTokenKeyName());
			if (obj && obj.key && obj.secret && obj.uid && obj.locale) {
				oauth.setAccessToken(obj.key, obj.secret);
				uid = obj.uid;
				locale = obj.locale;
				taskQueue.run();
				taskQueue.topTask.state = 'pre-authorized';
			}
		}

		function saveAccessTokenPersistents (key, secret, uid, locale) {
			extension.storage.setItem(
				self.accessTokenKeyName(),
				{key:key, secret:secret, uid:uid, locale:locale});
		}

		/*
		 * tasks
		 */

		function authorize (task) {

			function handleDefaultError (message) {
				self.isAuthorized = false;
				task.state = 'error';
				task.message = message;
				taskQueue.run();
			}

			if (task.task != 'authorize') {
				return handleDefaultError('Not a authentication task: ' + task.task);
			}

			switch (task.state) {
			case 'error':
				responseError(task, {wasavi_filesystem_error:task.message});
				break;

			case 'initial-state':
				task.state = 'fetching-request-token';
				self.response(task, {state:'authorizing', phase:'1/3'});
				oauth.setAccessToken('', '');
				oauth.post(
					OAUTH_OPTS.requestTokenUrl, null,
					function (data) {
						if (task.state != 'fetching-request-token') {
							return handleDefaultError(
								'Invalid authentication state (expect:f-r-t): ' + task.state
							);
						}

						task.state = 'confirming-user-authorization';

						var token = oauth.parseTokenRequest(
							data, data.responseHeaders['Content-Type'] || undefined);
						oauth.setAccessToken([token.oauth_token, token.oauth_token_secret]);

						var q = queryToObject(OAUTH_OPTS.authorizationUrl);
						q.oauth_token = token.oauth_token;
						q.oauth_callback = OAUTH_CALLBACK_URL;
						oauth.setCallbackUrl(OAUTH_CALLBACK_URL);

						extension.openTabWithUrl(
							getFullUrl(OAUTH_OPTS.authorizationUrl, q),
							function (id, url) {
								if (task.state != 'confirming-user-authorization') {
									return handleDefaultError(
										'Invalid authentication state (expect:c-u-a): ' + task.state
									);
								}

								task.state = 'waiting-tab-switch';
								extension.tabWatcher.add(
									id, url,
									function (newUrl) {
										if (task.state != 'waiting-tab-switch') {
											return handleDefaultError(
												'Invalid authentication state (expect:w-t-s): ' + task.state
											);
										}

										extension.closeTab(id);
										oauth.setCallbackUrl('');

										if (u.baseUrl(newUrl) != u.baseUrl(OAUTH_CALLBACK_URL)) {
											return handleDefaultError(
												'Authentication declined: ' + u.baseUrl(newUrl)
											);
										}

										var q = queryToObject(newUrl);
										if (q.fs != self.backend
										||  q.oauth_token != oauth.getAccessTokenKey()) {
											return handleDefaultError(
												'Access token missmatch: ' + q.fs
											);
										}

										task.state = 'no-access-token';
										uid = q.uid;
										taskQueue.run();
									}
								);
							}
						);
					},
					handleDefaultError
				);
				break;

			case 'no-access-token':
				task.state = 'fetching-access-token';
				self.response(task, {state:'authorizing', phase:'2/3'});
				oauth.post(
					OAUTH_OPTS.accessTokenUrl, null,
					function (data) {
						if (task.state != 'fetching-access-token') {
							return handleDefaultError(
								'Invalid authentication state (expect:f-a-t): ' + task.state
							);
						}

						task.state = 'pre-authorized';
						var token = oauth.parseTokenRequest(
							data, data.responseHeaders['Content-Type'] || undefined);
						oauth.setAccessToken([token.oauth_token, token.oauth_token_secret]);
						oauth.setVerifier('');
						taskQueue.run();
					},
					handleDefaultError
				);
				break;

			case 'pre-authorized':
				task.state = 'fetching-account-info';
				self.response(task, {state:'authorizing', phase:'3/3'});
				oauth.getJSON(
					'https://api.dropbox.com/1/account/info',
					function (data) {
						if (task.state != 'fetching-account-info') {
							return handleDefaultError(
								'Invalid authentication state (expect:f-a-i): ' + task.state
							);
						}

						if (data.uid != uid) {
							return handleDefaultError('User unmatch.');
						}

						task.state = 'authorized';
						saveAccessTokenPersistents(
							oauth.getAccessTokenKey(),
							oauth.getAccessTokenSecret(),
							data.uid, data.country);
						self.isAuthorized = true;
						taskQueue.run();
					},
					handleDefaultError
				);
				break;
			}
		}

		function ls (task) {
			var path = getCanonicalPath(self.getInternalPath(task.path));
			var callback = task.callback;

			var q = {locale:locale, list:'true'};
			var key = path || '/';

			if (key in lsCache) {
				q.hash = lsCache[key].data.hash;
			}

			oauth.get(
				getFullUrl('https://api.dropbox.com/1/metadata/dropbox/' + path, q),
				function (data) {
					if (data.status == 304) {
						data = lsCache[key].data;
						lsCache[key].timestamp = Date.now();
					}
					else {
						data = u.parseJson(data.text);
						lsCache[key] = {
							data:data,
							timestamp:Date.now()
						};
					}

					Object.keys(lsCache)
						.filter(function (p) {
							return Date.now() - lsCache[p].timestamp > LS_CACHE_TTL_MSECS;
						})
						.forEach(function (p) {
							delete lsCache[p];
						});

					task.callback(data);
				},
				function (data) {
					task.callback({});
				}
			);
		}

		function writeTimer () {
			writeTimer = null;

			for (var i in writeBuffer) {
				writeCore(writeBuffer[i]);
			}

			writeBuffer = {};
		}

		function writeCore (task) {
			self.response(task, {
				state:'writing',
				progress:0
			});

			oauth.onModifyTransport = function (xhr) {
				if (!xhr.upload) return;
				xhr.upload.onprogress = xhr.upload.onload = function (e) {
					if (!e.lengthComputable) return;
					self.response(task, {
						state:'writing',
						progress:e.loaded / e.total
					});
				};
			};
			oauth.request({
				method:'PUT',
				url:'https://api-content.dropbox.com/1/files_put/dropbox/'
					+ getCanonicalPath(self.getInternalPath(task.path))
					+ '?locale=' + locale,
				data:task.content,						// TODO: make binary data
				headers:{'Content-Type':'text/plain'},	// TODO: specify encoding
				success:function (data) {
					var meta = u.parseJson(data.text);
					self.response(task, {
						state:'complete',
						meta:{
							path:self.getExternalPath(meta.path),
							charLength:task.content.length
						}
					});
				},
				failure:function (data) {
					responseError(task, data);
				}
			});
		}

		function write (task) {
			if (!writeTimer) {
				writeTimer = u.setTimeout.call(global, writeTimer, 1000 * WRITE_DELAY_SECS);
			}
			writeBuffer[task.path] = task;
			self.response(task, {state:'buffered'});
		}

		function read (task) {
			self.response(task, {
				state:'reading',
				progress:0
			});

			oauth.onModifyTransport = function (xhr) {
				xhr.onprogress = xhr.onload = function (e) {
					if (!e.lengthComputable) return;
					self.response(task, {
						state:'reading',
						progress:e.loaded / e.total
					});
				};
			};
			oauth.get(
				'https://api-content.dropbox.com/1/files/dropbox/'
					+ getCanonicalPath(self.getInternalPath(task.path)),
				function (data) {
					var meta = u.parseJson(data.responseHeaders['x-dropbox-metadata']);
					if (!/^text\//.test(meta.mime_type)) {
						responseError(task, 'Unknown MIME type: ' + meta.mime_type);
						return;
					}
					if (meta.is_dir) {
						responseError(task, 'Cannot edit a directory.');
						return;
					}
					self.response(task, {
						state:'complete',
						content:data.text,
						meta:{
							status:data.status,
							path:self.getExternalPath(meta.path),
							charLength:data.text.length
						}
					});
				},
				function (data) {
					if (data.status == 404) {
						self.response(task, {
							state:'complete',
							content:'',
							meta:{
								status:data.status,
								path:self.getExternalPath(task.path),
								charLength:0
							}
						});
					}
					else {
						responseError(task, data);
					}
				}
			);
		}

		/*
		 * init #1
		 */

		var self = this;
		var taskQueue = new TaskQueue(this, authorize, ls, read, write);

		FileSystem.apply(this, arguments);
		this.backend = 'dropbox';

		/*
		 * consts
		 */

		var OAUTH_CALLBACK_URL = 'http://wasavi.appsweets.net/authorized.html?fs=' + self.backend;
		var OAUTH_OPTS = {
			consumerKey:      consumerKey,
			consumerSecret:   consumerSecret,
			requestTokenUrl:  'https://api.dropbox.com/1/oauth/request_token',
			authorizationUrl: 'https://www.dropbox.com/1/oauth/authorize',
			accessTokenUrl:   'https://api.dropbox.com/1/oauth/access_token'
		};
		var WRITE_DELAY_SECS = 10;
		var LS_CACHE_TTL_MSECS = 1000 * 60 * 15;

		/*
		 * vars
		 */

		var oauth = OAuth(OAUTH_OPTS);
		if (!oauth) {
			throw new Error('cannot instanciate jsOauth.');
		}
		oauth.requestTransport = function () {
			return extension.createTransport();
		};

		var uid;
		var locale;
		var lsCache = {};
		var writeTimer;
		var writeBuffer = {};

		/*
		 * init #2
		 */

		this.ls = function (path, tabId, callback) {
			taskQueue.run({
				task:'ls',
				tabId:tabId,
				path:path,
				callback:callback
			});
		};
		this.write = function (path, content, tabId) {
			taskQueue.run({
				task:'write',
				tabId:tabId,
				path:path,
				content:content
			});
		};
		this.read = function (path, tabId) {
			taskQueue.run({
				task:'read',
				tabId:tabId,
				path:path
			});
		};

		restoreAcessTokenPersistents();
	}

	FileSystemDropbox.prototype = Object.create(FileSystem.prototype);
	FileSystemDropbox.prototype.constructor = FileSystemDropbox;

	/*
	 *
	 */

	function create (name, key, secret, extension) {
		switch (name) {
		case 'dropbox':
			return new FileSystemDropbox(key, secret, extension);
		default:
			return new FileSystem;
		}
	}

	if (global.OAuth) {
		OAuth = global.OAuth;
	}
	else if (typeof require == 'function') {
		OAuth = require('./jsOAuth').OAuth;
	}

	if (global.WasaviUtils) {
		u = global.WasaviUtils;
	}
	else if (typeof require == 'function') {
		u = require('./WasaviUtils').WasaviUtils;
	}

	exports.FileSystem = {create:create};
})(this);

// vim:set ts=4 sw=4 fenc=UTF-8 ff=unix ft=javascript fdm=marker :
