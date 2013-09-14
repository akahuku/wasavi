/**
 * online storage interface
 * =============================================================================
 *
 *
 * @author akahuku@gmail.com
 * @version $Id: FileSystem.js 390 2013-09-14 20:07:04Z akahuku $
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

	/*
	 * consts
	 */

	var AUTH_CALLBACK_URL_BASE = 'http://wasavi.appsweets.net/authorized.html?fs=';
	var WRITE_DELAY_SECS = 10;

	/*
	 * vars
	 */

	var OAuth;
	var u;
	var _;

	/*
	 * utilities
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
		var query = objectToQuery(q);
		var result = query == '' ? url : (url + (url.indexOf('?') >= 0 ? '&' : '?') + query);
		return result;
	}

	function getCanonicalPath (path) {
		path = path.replace(/\\\//g, '_');
		path = path.replace(/\\(.)/g, '$1');
		path = path.replace(/\\/g, '');
		return path.split('/').map(OAuth.urlEncode).join('/');
	}

	function splitPath (path) {
		var re, regex = /(?:\\.|[^\/])*(?:\/|$)/g, result = [], foundLast = false;
		while (!foundLast && (re = regex.exec(path))) {
			foundLast = re[0].substr(-1) != '/';
			var tmp = foundLast ? re[0] : re[0].substr(0, re[0].length - 1);
			tmp = tmp.replace(/\\(.)/g, '$1');
			tmp != '' && result.push(tmp);
		}
		return result;
	}

	/*
	 * task queue class
	 */

	function TaskQueue (fs, authorize, ls, read, write) {
		var queue = [];
		var timer;

		function process () {
			timer = null;

			if (queue.length == 0) return;

			var top = queue.shift();
			switch (top.task) {
			case 'authorize':
				if (!fs.needAuthentication) {
					run();
					break;
				}
				if (top.state != 'error') {
					queue.unshift(top);
				}
				authorize(top);
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

		function push (data) {
			if (fs.needAuthentication) {
				if (queue.length == 0 || queue[0].task != 'authorize') {
					queue.unshift({
						task:'authorize',
						state:'initial-state',
						isAuthorized:false,
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
		}

		function run (data) {
			push(data);

			if (!timer) {
				timer = u.setTimeout(process, 100);
			}
		}

		function getTopTask () {
			return queue[0];
		}

		function initCredentials (keys, callback) {
			var obj = fs.loadCredentials();

			if (!obj) return;
			if (keys.some(function (key) {return !(key in obj)})) return;

			push();
			queue[0].state = 'pre-authorized';

			try {
				callback(obj);
			}
			catch (e) {
			}
		}

		fs.ls = function (path, tabId, callback) {
			run({
				task:'ls',
				tabId:tabId,
				path:this.getInternalPath(path),
				callback:callback
			});
		};
		fs.write = function (path, content, tabId) {
			run({
				task:'write',
				tabId:tabId,
				path:this.getInternalPath(path),
				content:content
			});
		};
		fs.read = function (path, tabId) {
			run({
				task:'read',
				tabId:tabId,
				path:this.getInternalPath(path)
			});
		};

		this.initCredentials = initCredentials;
		this.push = push;
		this.run = run;
		this.__defineGetter__('topTask', getTopTask);
	}

	/*
	 * file writing binder class
	 */

	function WriteBinder (fs, writeCore, delaySecs) {
		var writeTimer;
		var writeBuffer = {};

		function handleWriteTimer () {
			writeTimer = null;

			try {
				for (var i in writeBuffer) {
					writeCore(writeBuffer[i]);
				}
			}
			finally {
				writeBuffer = {};
				fs.taskQueue.run();
			}
		}

		function write (task) {
			if (!writeTimer) {
				writeTimer = u.setTimeout(handleWriteTimer, 1000 * delaySecs);
			}
			writeBuffer[task.path] = task;
			fs.response(task, {state:'buffered', path:task.path});
		}

		delaySecs || (delaySecs = WRITE_DELAY_SECS);
		this.write = write;
	}

	/*
	 * multipart/related handling class
	 */

	function MultiPart (metadata, content) {
		var USE_BASE64 = false;
		var result;
		var boundary;

		function getBody (s) {
			if (USE_BASE64) {
				s = encodeURIComponent(s);
				s = unescape(s);
				s = u.btoa(s);
				s = s.replace(/.{78}/g, '$&\r\n');
			}
			return s;
		}

		function getMetadataPart (metadata) {
			var m = {};
			for (var i in metadata) {
				if (metadata[i] != undefined) {
					m[i] = metadata[i];
				}
			}

			var s = [];
			s.push('Content-Type: application/json;charset=UTF-8');
			USE_BASE64 && s.push('Content-Transfer-Encoding: base64');
			s.push('');
			s.push(getBody(JSON.stringify(m, null, ' ')));
			return s.join('\r\n');
		}

		function getContentPart (content) {
			var s = [];
			s.push('Content-Type: ' + (metadata.mimeType || 'text/plain;charset=UTF-8'));
			USE_BASE64 && s.push('Content-Transfer-Encoding: base64');
			s.push('');
			s.push(getBody(content));
			return s.join('\r\n');
		}

		function main () {
			var metadataPart = getMetadataPart(metadata);
			var contentPart = getContentPart(content);

			metadata = content = null;

			do {
				boundary = [
					Math.floor(Math.random() * 10000),
					Math.floor(Math.random() * 10000),
					Math.floor(Math.random() * 10000)
				].join('_');
			} while (metadataPart.indexOf(boundary) >= 0 || contentPart.indexOf(boundary) >= 0);

			result = [
				'--' + boundary,
				metadataPart,
				'',
				'--' + boundary,
				contentPart,
				'',
				'--' + boundary + '--',
				''
			].join('\r\n');
		}

		main();

		this.__defineGetter__('result', function () {return result});
		this.__defineGetter__('boundary', function () {return boundary});
	}

	/*
	 * file system base class
	 */

	function FileSystem (consumerKey, consumerSecret, extension) {
		this.extension = extension;
	}

	FileSystem.prototype = {
		backend:'*null*',
		needAuthentication:true,
		isAuthorized:false,
		write:function () {},
		read:function () {},
		ls:function (path, tabId, callback) {callback({})},
		response: function (task, data) {
			data.type = 'fileio-' + task.task + '-response';
			this.extension.sendRequest(task.tabId, data);
		},
		responseError: function (task, data) {
			var errorMessage = false;

			switch (u.objectType(data)) {
			case 'Object':
				if (errorMessage === false && 'text' in data) {
					var jsonData = u.parseJson(data.text);

					switch (u.objectType(jsonData.error)) {
					case 'String':
						errorMessage = [jsonData.error];
						break;

					case 'Object':
						errorMessage = [jsonData.error[Object.keys(jsonData.error)[0]]];
						break;
					}
				}
				if (errorMessage === false && 'status' in data) {
					switch (data.status) {
					case 404:
						errorMessage = _('File not found.');
						break;
					}
				}
				if (errorMessage === false && 'wasavi_filesystem_error' in data) {
					errorMessage = data.wasavi_filesystem_error;
				}
				break;

			case 'Array':
				errorMessage = data;
				break;

			default:
				errorMessage = [data + ''];
				break;
			}

			this.extension.isDev && console.error(
				'wasavi background: file system error: ' + errorMessage.join(', '));
			this.response(task, {error:errorMessage});
		},
		getInternalPath:function (path) {
			var schema = this.backend + ':';
			if (path.indexOf(schema) == 0) {
				path = path.substring(schema.length);
			}
			return path;
		},
		getExternalPath:function (path) {
			if (path.charAt(0) != '/') {
				path = '/' + path;
			}
			return this.backend + ':' + path;
		},
		get authCallbackUrl () {
			return AUTH_CALLBACK_URL_BASE + this.backend;
		},
		match:function (url) {
			return url.indexOf(this.backend + ':') == 0;
		},
		get credentialKeyName () {
			return 'filesystem.' + this.backend + '.tokens';
		},
		saveCredentials:function (data) {
			this.extension.storage.setItem(this.credentialKeyName, data);
		},
		loadCredentials:function () {
			return this.extension.storage.getItem(this.credentialKeyName);
		},
		clearCredentials:function () {
			this.extension.storage.setItem(this.credentialKeyName, undefined);
		}
	};

	/*
	 * file system class for dropbox
	 */

	function FileSystemDropbox (consumerKey, consumerSecret, extension) {

		/*
		 * tasks
		 */

		function authorize (task) {

			function handleAuthError (message) {
				self.needAuthentication = false;
				self.isAuthorized = false;
				task.state = 'error';
				task.message = message;
				taskQueue.run();
			}

			if (task.task != 'authorize') {
				return handleAuthError(_('Not a authentication task: {0}', task.task));
			}

			switch (task.state) {
			case 'error':
				self.responseError(task, {
					wasavi_filesystem_error:task.message || _('Unknown file system error')
				});
				taskQueue.run();
				break;

			case 'initial-state':
				task.state = 'fetching-request-token';
				self.response(task, {state:'authorizing', phase:'1/3'});
				oauth.setAccessToken('', '');
				oauth.post(
					OAUTH_OPTS.requestTokenUrl, null,
					function (data) {
						if (task.state != 'fetching-request-token') {
							return handleAuthError(
								_('Invalid authentication state (frt): {0}', task.state)
							);
						}

						task.state = 'confirming-user-authorization';

						var token = oauth.parseTokenRequest(
							data, data.responseHeaders['Content-Type'] || undefined);
						oauth.setAccessToken([token.oauth_token, token.oauth_token_secret]);

						var q = queryToObject(OAUTH_OPTS.authorizationUrl);
						q.oauth_token = token.oauth_token;
						q.oauth_callback = self.authCallbackUrl;
						oauth.setCallbackUrl(self.authCallbackUrl);

						extension.openTabWithUrl(
							getFullUrl(OAUTH_OPTS.authorizationUrl, q),
							function (id, url) {
								if (task.state != 'confirming-user-authorization') {
									return handleAuthError(
										_('Invalid authentication state (cua): {0}', task.state)
									);
								}

								task.state = 'waiting-tab-switch';
								extension.tabWatcher.add(
									id, self.authCallbackUrl,
									function (newUrl) {
										if (task.state != 'waiting-tab-switch') {
											return handleAuthError(
												_('Invalid authentication state (wts): {0}', task.state)
											);
										}

										extension.closeTab(id);
										oauth.setCallbackUrl('');

										var q = queryToObject(newUrl);
										if (q.fs != self.backend
										||  q.oauth_token != oauth.getAccessTokenKey()) {
											return handleAuthError(
												_('Access token missmatch: {0}', q.fs)
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
					handleAuthError
				);
				break;

			case 'no-access-token':
				task.state = 'fetching-access-token';
				self.response(task, {state:'authorizing', phase:'2/3'});
				oauth.post(
					OAUTH_OPTS.accessTokenUrl, null,
					function (data) {
						if (task.state != 'fetching-access-token') {
							return handleAuthError(
								_('Invalid authentication state (fat): {0}', task.state)
							);
						}

						task.state = 'pre-authorized';
						var token = oauth.parseTokenRequest(
							data, data.responseHeaders['Content-Type'] || undefined);
						oauth.setAccessToken([token.oauth_token, token.oauth_token_secret]);
						oauth.setVerifier('');
						taskQueue.run();
					},
					handleAuthError
				);
				break;

			case 'pre-authorized':
				task.state = 'fetching-account-info';
				self.response(task, {state:'authorizing', phase:'3/3'});
				oauth.getJSON(
					'https://api.dropbox.com/1/account/info',
					function (data) {
						if (task.state != 'fetching-account-info') {
							return handleAuthError(
								_('Invalid authentication state (fai): {0}', task.state)
							);
						}

						if (data.uid != uid) {
							return handleAuthError(_('User unmatch.'));
						}

						task.state = 'authorized';
						self.saveCredentials({
							key:oauth.getAccessTokenKey(),
							secret:oauth.getAccessTokenSecret(),
							uid:data.uid,
							locale:data.country
						});
						self.needAuthentication = false;
						self.isAuthorized = true;
						taskQueue.run();
					},
					handleAuthError
				);
				break;
			}
		}

		function ls (task) {
			var path = getCanonicalPath(task.path);

			var q = {locale:locale, list:'true'};
			var key = path || '/';

			if (key in lsCache) {
				q.hash = lsCache[key].data.hash;
			}

			oauth.get(
				getFullUrl('https://api.dropbox.com/1/metadata/dropbox' + path, q),
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
					if (data.status == 401 || data.status == 403) {
						self.needAuthentication = true;
						self.isAuthorized = false;
						taskQueue.run(task);
					}
					else {
						task.callback({error:_('Invalid path.')});
					}
				}
			);

			taskQueue.run();
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
				'https://api-content.dropbox.com/1/files/dropbox'
					+ getCanonicalPath(task.path),
				function (data) {
					try {
						var meta = u.parseJson(data.responseHeaders['x-dropbox-metadata']);
						if (meta.is_dir) {
							return self.responseError(
								task, _('Cannot edit a directory.')
							);
						}
						if (!/^text\//.test(meta.mime_type)) {
							return self.responseError(
								task, _('Unknown MIME type: {0}', meta.mime_type)
							);
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
					}
					finally {
						taskQueue.run();
					}
				},
				function (data) {
					if (data.status == 401 || data.status == 403) {
						self.needAuthentication = true;
						self.isAuthorized = false;
						taskQueue.run(task);
					}
					else if (data.status == 404) {
						self.response(task, {
							state:'complete',
							content:'',
							meta:{
								status:data.status,
								path:self.getExternalPath(task.path),
								charLength:0
							}
						});
						taskQueue.run();
					}
					else {
						self.responseError(task, data);
						taskQueue.run();
					}
				}
			);
		}

		function write (task) {
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
				url:'https://api-content.dropbox.com/1/files_put/dropbox'
					+ getCanonicalPath(task.path)
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
					if (data.status == 401 || data.status == 403) {
						self.needAuthentication = true;
						self.isAuthorized = false;
						taskQueue.run(task);
					}
					else {
						self.responseError(task, data);
					}
				}
			});
		}

		/*
		 * consts
		 */

		var OAUTH_OPTS = {
			consumerKey:      consumerKey,
			consumerSecret:   consumerSecret,
			requestTokenUrl:  'https://api.dropbox.com/1/oauth/request_token',
			authorizationUrl: 'https://www.dropbox.com/1/oauth/authorize',
			accessTokenUrl:   'https://api.dropbox.com/1/oauth/access_token'
		};
		var LS_CACHE_TTL_MSECS = 1000 * 60 * 15;

		/*
		 * init #1
		 */

		var self = this;
		var writeBinder = new WriteBinder(this, write);
		var taskQueue = new TaskQueue(this, authorize, ls, read, writeBinder.write);

		FileSystem.apply(this, arguments);
		this.backend = 'dropbox';
		this.taskQueue = taskQueue;

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

		taskQueue.initCredentials(
			['key', 'secret', 'uid', 'locale'],
			function (obj) {
				oauth.setAccessToken(obj.key, obj.secret);
				uid = obj.uid;
				locale = obj.locale;
			}
		);
	}

	FileSystemDropbox.prototype = Object.create(FileSystem.prototype);
	FileSystemDropbox.prototype.constructor = FileSystemDropbox;

	/*
	 * file system class for google drive
	 */

	function FileSystemGDrive (key, secret, extension) {

		/*
		 * consts
		 */

		var MIME_TYPE_FOLDER = 'application/vnd.google-apps.folder';
		/*
		 * privates
		 */

		function request (url, opts, success, failure) {
			opts || (opts = {});
			var q = opts.query || {};

			var xhr = u.createXHR();
			xhr.open(opts.method || 'GET', getFullUrl(url, q));
			xhr.onreadystatechange = function () {
				if (xhr.readyState != 4) return;
				try {
					if (xhr.status >= 200 && xhr.status < 300
					|| xhr.status == 304
					|| xhr.status === 0) {
						success && success(u.parseJson(xhr.responseText), xhr);
					}
					else {
						xhr.onerror && xhr.onerror();
					}
				}
				catch (e) {
					extension.isDev && console.error(e.toString());
				}
				finally {
					xhr = success = failure = null;
				}
			};
			xhr.onerror = function () {
				if (extension.isDev) {
					var st, re
					try {st = xhr.status} catch (e) {st = 'Unknown status'}
					try {re = xhr.responseText} catch (e) {re = 'Unknown response'}
					console.log('request error: ' + st + ': ' + re);
				}
				try {
					failure && failure(xhr);
				}
				catch (ex) {
					extension.isDev && console.error(ex.toString());
				}
				finally {
					xhr = success = failure = null;
				}
			};
			if (opts.beforesend) {
				try {opts.beforesend(xhr)} catch (e) {
					extension.isDev && console.error(e.toString());
				}
			}
			try {
				if (!opts.ignoreAccessToken && tokenType != '' && accessToken != '') {
					xhr.setRequestHeader('Authorization', tokenType + ' ' + accessToken);
				}
				xhr.setRequestHeader('X-JavaScript-User-Agent', 'wasavi/' + extension.version);
				xhr.send(opts.content || null);
			}
			catch (e) {
				self.extension.isDev && console.error(e.toString());
				xhr && xhr.onerror();
			}
		}

		function buildPathOrderedMetadata (fragments, items) {
			var result;
			var nameHash = {};

			items.forEach(function (item) {
				if (item.title in nameHash) {
					nameHash[item.title].push(item);
				}
				else {
					nameHash[item.title] = [item];
				}
			});

			if (fragments.length >= 1
			&&  fragments[fragments.length - 1] in nameHash
			&&  nameHash[fragments[fragments.length - 1]].some(function (item) {
				result = [item];

				var parentId = item.parents[0].id;
				var foundRoot = item.parents[0].isRoot;
				var cont = true;

				for (var i = fragments.length - 2; cont && i >= 0; i--) {
					cont = fragments[i] in nameHash
					&& nameHash[fragments[i]].some(function (item2) {
						if (item2.id != parentId) return false;
						result.unshift(item2);
						parentId = item2.parents[0].id;
						foundRoot = item2.parents[0].isRoot;
						return true;
					});
				}

				return foundRoot;
			})) {
				return result;
			}

			return null;
		}

		function getMetadataFromPath (path, success, failure) {
			var params = {};
			var fragments = splitPath(path);
			if (fragments.length == 0) {
				request('https://www.googleapis.com/drive/v2/files/root', null,
					function (data, xhr) {
						success(fragments, [data], xhr);
					},
					failure
				);
			}
			else {
				params.q = '(' +
					fragments
						.map(function (f) {return 'title=\'' + f.replace(/\'/g, '\'') + '\''})
						.join(' OR ') +
					') AND trashed=false';

				request('https://www.googleapis.com/drive/v2/files', {query:params},
					function (data, xhr) {
						var result = buildPathOrderedMetadata(
							fragments, data.items
						);

						if (!result) {
							result = buildPathOrderedMetadata(
								Array.prototype.slice.call(fragments, 0, fragments.length - 1),
								data.items
							);
						}

						success(fragments, result || null, xhr);
					},
					failure
				);
			}
		}

		function getChildren (folderId, success, failure) {
			var params = {
				q:'\'' + folderId + '\' in parents AND trashed=false'
			};
			request('https://www.googleapis.com/drive/v2/files/', {query:params},
				function (data, xhr) {
					success(data.items, xhr);
				},
				failure
			);
		}

		function handleError (task, xhr) {
			if (xhr && (xhr.status == 401 || xhr.status == 403)) {
				self.needAuthentication = true;
				self.isAuthorized = false;
				accessToken = tokenType = '';
				taskQueue.run(task);
				return true;
			}
			return false;
		}

		/*
		 * tasks
		 */

		function authorize (task) {

			function handleAuthError (message) {
				accessToken = tokenType = '';
				self.needAuthentication = false;
				self.isAuthorized = false;
				task.state = 'error';
				task.message = message;
				taskQueue.run();
			}

			if (task.task != 'authorize') {
				return handleAuthError(_('Not a authentication task: {0}', task.task));
			}

			switch (task.state) {
			case 'error':
				self.responseError(task, {
					wasavi_filesystem_error:task.message
				});
				taskQueue.run();
				break;

			case 'initial-state':
				task.state = 'fetching-access-token';
				self.response(task, {state:'authorizing', phase:'1/3'});

				extension.openTabWithUrl(
					getFullUrl('https://accounts.google.com/o/oauth2/auth', {
						response_type:'token',
						scope:SCOPES.join(' '),
						client_id:key,
						redirect_uri:self.authCallbackUrl,
						approval_prompt:'force'
					}),
					function (id, url) {
						if (task.state != 'fetching-access-token') {
							return handleAuthError(
								_('Invalid authentication state (fat): {0}', task.state)
							);
						}

						task.state = 'waiting-tab-switch';
						extension.tabWatcher.add(
							id, self.authCallbackUrl,
							function (newUrl) {
								if (task.state != 'waiting-tab-switch') {
									return handleAuthError(
										_('Invalid authentication state (wts): {0}', task.state)
									);
								}

								extension.closeTab(id);

								var q = queryToObject(newUrl.replace('#', '&'));
								if ('error' in q) {
									return handleAuthError(
										_('Authentication declined: {0}', q.error)
									);
								}

								task.state = 'got-access-token';
								task.accessToken = q.access_token;
								task.tokenType = q.token_type;
								taskQueue.run();
							}
						);
					}
				);
				break;

			case 'got-access-token':
				task.state = 'validating-access-token';
				self.response(task, {state:'authorizing', phase:'2/3'});

				request(
					'https://www.googleapis.com/oauth2/v1/tokeninfo',
					{query:{access_token:task.accessToken}},
					function (data, xhr) {
						if (xhr.status != 200) {
							return handleAuthError(
								_('Invalid status code #{0}', xhr.status)
							);
						}
						if (task.state != 'validating-access-token') {
							return handleAuthError(
								_('Invalid authentication state (vat): {0}', task.state)
							);
						}
						if (data.audience !== key) {
							return handleAuthError(_('Invalid authentication audience'));
						}

						task.state = 'pre-authorized';
						taskQueue.run();
					},
					function (xhr) {
						handleAuthError();
					}
				);
				break;

			case 'pre-authorized':
				task.state = 'fetching-account-info';
				self.response(task, {state:'authorizing', phase:'3/3'});

				request(
					'https://www.googleapis.com/oauth2/v1/userinfo',
					{query:{access_token:task.accessToken}},
					function (data, xhr) {
						if (xhr.status != 200) {
							return handleAuthError(
								_('Invalid status code #{0}', xhr.status)
							);
						}
						if (task.state != 'fetching-account-info') {
							return handleAuthError(
								_('Invalid authentication state (fai): {0}', task.state)
							);
						}

						task.state = 'authorized';
						tokenType = task.tokenType;
						accessToken = task.accessToken;
						uid = data.id;
						locale = data.locale;
						self.saveCredentials({
							accessToken:task.accessToken,
							tokenType:task.tokenType
						});
						self.needAuthentication = false;
						self.isAuthorized = true;
						taskQueue.run();
					},
					function (xhr) {
						handleAuthError();
					}
				);
				break;
			}
		}

		function ls (task) {
			getMetadataFromPath(task.path,
				function (fragments, data, xhr) {
					if (!data || data.length == 0) {
						task.callback({error:_('Invalid path.')});
						return;
					}
					var prefix = Array.prototype.slice.call(fragments);
					getChildren(data[data.length - 1].id,
						function (items) {
							var contents = items.map(function (item) {
								return {
									path:prefix.concat(item.title),
									is_dir:item.mimeType == MIME_TYPE_FOLDER
								};
							});
							task.callback({
								is_dir:data[data.length - 1].mimeType == MIME_TYPE_FOLDER,
								contents:contents
							});
						},
						function (xhr) {
							handleError(task, xhr) || task.callback({error:_('Invalid path.')});
						}
					);
				},
				function (xhr) {
					handleError(task, xhr) || task.callback({error:_('Invalid path.')});
				}
			);

			taskQueue.run();
		}

		function read (task) {
			self.response(task, {
				state:'reading',
				progress:0
			});

			getMetadataFromPath(task.path,
				function (fragments, data, xhr) {
					// valid path and new file
					if (!data && fragments.length == 1 /* new file on the root directory */
					||  data && data.length < fragments.length /* new file on a sub directoru */
					) {
						self.response(task, {
							state:'complete',
							content:'',
							meta:{
								status:404,
								path:self.getExternalPath(task.path),
								charLength:0
							}
						});
						taskQueue.run();
						return;
					}

					// invalid (non-existent) path
					if (!data) {
						self.responseError(task, _('Invalid path.'));
						taskQueue.run();
						return;
					}

					// valid path and existent file
					var meta = data[data.length - 1];
					if (meta.mimeType == MIME_TYPE_FOLDER) {
						self.responseError(task, _('Cannot edit a directory.'));
						taskQueue.run();
						return;
					}
					if (!/^text\//.test(meta.mimeType)) {
						self.responseError(task, _('Unknown MIME type: {0}', meta.mimeType));
						taskQueue.run();
						return;
					}
					if (!('downloadUrl' in meta)) {
						self.responseError(task, _('Unable to download.'));
						taskQueue.run();
						return;
					}

					// load...
					request(
						meta.downloadUrl,
						{
							beforesend:function (xhr) {
								xhr.onprogress = function (e) {
									if (!e.lengthComputable) return;
									self.response(task, {
										state:'reading',
										progress:e.loaded / e.total
									});
								};
							}
						},
						function (data, xhr) {
							self.response(task, {
								state:'complete',
								content:xhr.responseText,
								meta:{
									status:xhr.status,
									path:self.getExternalPath(task.path),
									charLength:xhr.responseText.length
								}
							});
							taskQueue.run();
						},
						function (xhr) {
							if (handleError(task, xhr)) return;

							self.response(task, {
								state:'complete',
								content:'',
								meta:{
									status:xhr && xhr.status || 404,
									path:self.getExternalPath(task.path),
									charLength:0
								}
							});

							taskQueue.run();
						}
					);
				},
				function (xhr) {
					if (handleError(task, xhr)) return;
					self.responseError(task, _('Network Error'));
					taskQueue.run();
				}
			);
		}

		function write (task) {
			self.response(task, {
				state:'writing',
				progress:0
			});

			getMetadataFromPath(task.path,
				function (fragments, data, xhr) {
					var fileId = '';
					var parentId;
					var mimeType = 'text/plain;charset=UTF-8';
					var method = 'POST';

					// new file on the root directory
					if (!data && fragments.length == 1) {
						parentId = 'root';
					}
					// new file on a sub directory
					else if (data && data.length < fragments.length) {
						parentId = data[data.length - 1].id;
					}
					// invalid (non-existent) path
					else if (!data) {
						self.responseError(task, _('Invalid path.'));
						taskQueue.run();
						return;
					}
					// valid and exsitent file
					else {
						if (data[data.length - 1].mimeType == MIME_TYPE_FOLDER) {
							self.responseError(task, _('Cannot overwrite a directory.'));
							taskQueue.run();
							return;
						}
						fileId = '/' + data[data.length - 1].id;
						parentId = data.length >= 2 ? data[data.length - 2].id : 'root';
						mimeType = data[data.length - 1].mimeType;
						method = 'PUT';
					}

					var mp = new MultiPart(
						{
							parents:[
								{
									kind:'drive#file',
									id:parentId
								}
							],
							title:fragments[fragments.length - 1],
							mimeType:mimeType
						},
						task.content
					);

					// save...
					request(
						'https://www.googleapis.com/upload/drive/v2/files' + fileId,
						{
							method:method,
							query:{
								uploadType:'multipart'
							},
							content:mp.result,
							beforesend:function (xhr) {
								xhr.setRequestHeader(
									'Content-Type',
									'multipart/related;boundary="' + mp.boundary + '"');
								/*xhr.setRequestHeader(
									'Content-Length', mp.result.length);*/
								xhr.upload.onprogress = xhr.upload.onload = function (e) {
									if (!e.lengthComputable) return;
									self.response(task, {
										state:'writing',
										progress:e.loaded / e.total
									});
								};
							}
						},
						function (data, xhr) {
							self.response(task, {
								state:'complete',
								meta:{
									path:self.getExternalPath(task.path),
									charLength:task.content.length
								}
							});
						},
						function (xhr) {
							if (handleError(task, xhr)) return;
							self.responseError(task, _('Failed to save ({0})', xhr.status));
						}
					);
				},
				function (xhr) {
					if (handleError(task, xhr)) return;
					self.responseError(task, _('Network Error'));
				}
			);
		}

		/*
		 * consts
		 */

		var SCOPES = [
			'https://www.googleapis.com/auth/drive',
			'https://www.googleapis.com/auth/userinfo.profile'
		];

		/*
		 * init #1
		 */

		var self = this;
		var writeBinder = new WriteBinder(this, write);
		var taskQueue = new TaskQueue(this, authorize, ls, read, writeBinder.write);

		FileSystem.apply(this, arguments);
		this.backend = 'gdrive';
		this.taskQueue = taskQueue;

		/*
		 * vars
		 */

		var accessToken = '';
		var tokenType = '';
		var uid;
		var locale;

		/*
		 * init #2
		 */

		taskQueue.initCredentials(
			['accessToken', 'tokenType'],
			function (obj) {
				taskQueue.topTask.accessToken = obj.accessToken;
				taskQueue.topTask.tokenType = obj.tokenType;
			}
		);
	}

	FileSystemGDrive.prototype = Object.create(FileSystem.prototype);
	FileSystemGDrive.prototype.constructor = FileSystemGDrive;

	/*
	 *
	 */

	function create (name, key, secret, extension) {
		switch (name) {
		case 'dropbox':
			return new FileSystemDropbox(key, secret, extension);
		case 'gdrive':
			return new FileSystemGDrive(key, secret, extension);
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

	_ = u && u._ ? u._ : function (a) {return a};

	exports.FileSystem = {create:create};
})(this);

// vim:set ts=4 sw=4 fenc=UTF-8 ff=unix ft=javascript fdm=marker :
