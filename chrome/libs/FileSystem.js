/**
 * online storage interface
 * =============================================================================
 *
 *
 * @author akahuku@gmail.com
 * @version $Id: FileSystem.js 300 2013-06-06 16:31:37Z akahuku $
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

	function FileSystemBase () {
		var backend = '*null*';
		this.ls = this.write = this.read = function () {};
		this.match = function () {return false;};
		this.__defineGetter__('isAuthorized', function () {return true;});
		this.__defineGetter__('backend', function () {return backend;});
		this.__defineGetter__('state', function () {return 'authorized';});
	}

	function FileSystemDropbox (consumerKey, consumerSecret, extension) {
		var WRITE_DELAY_SECS = 10;
		var backend = 'dropbox';

		var oauthCallbackUrl = 'http://wasavi.appsweets.net/authorized.html?fs=' + backend;
		var oauthOpts = {
			consumerKey:      consumerKey,
			consumerSecret:   consumerSecret,
			requestTokenUrl:  'https://api.dropbox.com/1/oauth/request_token',
			authorizationUrl: 'https://www.dropbox.com/1/oauth/authorize',
			accessTokenUrl:   'https://api.dropbox.com/1/oauth/access_token'
		};
		var oauth = OAuth(oauthOpts);
		if (!oauth) {
			throw new Error('cannot instanciate jsOauth.');
		}
		oauth.requestTransport = function () {
			return extension.createTransport();
		};

		var state = 'no-request-token';
		var lastError;
		var uid;
		var locale;
		var operationQueue = [];

		var writeTimer;
		var writeBuffer = {};

		function isAuthorized () {
			return state == 'authorized';
		}

		function response (data, tabId, operation) {
			if (isAuthorized()) {
				if (!tabId || !operation) return;
				data.type = 'fileio-' + operation + '-response';
			}
			else {
				if (!tabId) {
					if (operationQueue.length == 0) return;
					tabId = operationQueue[0].tabId;
				}
				data.type = 'authorize-response';
			}
			extension.sendRequest(tabId, data);
		}

		function handleOAuthError (data) {
			if (typeof data == 'object') {
				var jsonData = u.parseJson(data.text);
				if (jsonData.error) {
					if (typeof jsonData.error == 'string') {
						lastError = jsonData.error;
					}
					else if (typeof jsonData.error == 'object') {
						for (var i in jsonData.error) {
							lastError = jsonData.error[i];
							break;
						}
					}
				}
				else {
					switch (data.status) {
					case 404:
						lastError = 'File not found.';
						break;
					default:
						lastError = 'Unknown error.';
						break;
					}
				}
			}
			else {
				lastError = data + '';
			}

			lastError = backend + ': ' + lastError;
			extension.isDev && console.error('wasavi background: file system error: ' + lastError);

			var lastTabId;
			while (operationQueue.length) {
				var op = operationQueue.shift();
				lastTabId = op.tabId;
				response({error:lastError}, op.tabId, op.method);
			}
			if (lastTabId) {
				extension.focusTab(lastTabId);
			}

			if (state != 'authorized') {
				state = 'no-request-token';
			}
		}

		function runQueue () {
			if (!isAuthorized()) {
				handleOAuthError('Not authorized');
				return;
			}
			var lastTabId;
			for (var op; operationQueue.length;) {
				op = operationQueue.shift();
				lastTabId = op.tabId;
				switch (op.method) {
				case 'ls':    ls(op.path, op.tabId); break;
				case 'write': write(op.path, op.content, op.tabId); break;
				case 'read':  read(op.path, op.tabId); break;
				}
			}
			if (lastTabId) {
				extension.focusTab(lastTabId);
			}
		}

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
				result.push(
					OAuth.urlEncode(i) +
					'=' +
					OAuth.urlEncode(q[i]));
			}
			return result.join('&');
		}

		function setQuery (url, q) {
			var base = u.baseUrl(url);
			var query = objectToQuery(q);
			return query == '' ? base : (base + '?' + query);
		}

		function authorize (tabId) {
			var thisFunc = authorize;
			switch (state) {
			case 'error':
				handleOAuthError(lastError);
				break;

			case 'no-request-token':
				lastError = undefined;
				state = 'fetching-request-token';
				response({state:'authorizing', phase:'1/3'});
				oauth.setAccessToken('', '');
				oauth.post(
					oauthOpts.requestTokenUrl, null,
					function (data) {
						state = 'confirming-user-authorization';

						var token = oauth.parseTokenRequest(
							data, data.responseHeaders['Content-Type'] || undefined);
						oauth.setAccessToken([token.oauth_token, token.oauth_token_secret]);

						var q = queryToObject(oauthOpts.authorizationUrl);
						q.oauth_token = token.oauth_token;
						q.oauth_callback = oauthCallbackUrl;
						oauth.setCallbackUrl(oauthCallbackUrl);

						extension.openTabWithUrl(
							setQuery(oauthOpts.authorizationUrl, q),
							function (id, url) {
								extension.tabWatcher.add(id, url, function (newUrl) {
									//if (!newUrl) return;
									if (state != 'confirming-user-authorization') return;

									extension.closeTab(id);
									oauth.setCallbackUrl('');
									if (u.baseUrl(newUrl) == u.baseUrl(oauthCallbackUrl)) {
										var q = queryToObject(newUrl);
										if (q.fs != backend) return;
										if (q.oauth_token == oauth.getAccessTokenKey()) {
											state = 'no-access-token';
											uid = q.uid;
											thisFunc();
										}
										else {
											operationQueue = [{method:'authorize', tabId:tabId}];
											handleOAuthError('Invalid authentication.');
										}
									}
									else {
										operationQueue = [{method:'authorize', tabId:tabId}];
										handleOAuthError('Authentication declined: ' + u.baseUrl(newUrl));
									}
								});
							}
						);
					},
					function (data) {
						operationQueue = [{method:'authorize', tabId:tabId}];
						handleOAuthError(data);
					}
				);
				break;

			case 'no-access-token':
				lastError = undefined;
				state = 'fetching-access-token';
				response({state:'authorizing', phase:'2/3'});
				oauth.post(
					oauthOpts.accessTokenUrl, null,
					function (data) {
						state = 'pre-authorized';
						var token = oauth.parseTokenRequest(
							data, data.responseHeaders['Content-Type'] || undefined);
						oauth.setAccessToken([token.oauth_token, token.oauth_token_secret]);
						oauth.setVerifier('');
						thisFunc();
					},
					function (data) {
						operationQueue = [{method:'authorize', tabId:tabId}];
						handleOAuthError(data);
					}
				);
				break;

			case 'pre-authorized':
				lastError = undefined;
				state = 'fetching-account-info';
				response({state:'authorizing', phase:'3/3'});
				oauth.getJSON(
					'https://api.dropbox.com/1/account/info',
					function (data) {
						if (data.uid == uid) {
							state = 'authorized';
							saveAccessTokenPersistents(
								oauth.getAccessTokenKey(),
								oauth.getAccessTokenSecret(),
								data.uid, data.country);
							runQueue();
						}
						else {
							operationQueue = [{method:'authorize', tabId:tabId}];
							handleOAuthError('User unmatch.');
						}
					},
					function (data) {
						operationQueue = [{method:'authorize', tabId:tabId}];
						handleOAuthError(data);
						state = 'no-request-token';
					}
				);
				break;
			}
		}

		function getInternalPath (path) {
			path = path.replace(/^dropbox:\//, '');
			path = path.replace(/^\//, '');
			return path;
		}

		function getExternalPath (path) {
			if (path.charAt(0) != '/') {
				path = '/' + path;
			}
			return backend + ':/' + path;
		}

		function getCanonicalPath (path) {
			return path.split('/').map(OAuth.urlEncode).join('/');
		}

		function match (url) {
			return /^dropbox:/.test(url);
		}

		function ls (path, tabId) {
			if (isAuthorized()) {
			}
			else {
				operationQueue.push({method:'ls', path:path, tabId:tabId});
				authorize(tabId);
			}
		}

		function write (path, content, tabId) {
			if (isAuthorized()) {
				response({state:'writing', progress:0}, tabId, 'write');
				oauth.onModifyTransport = function (xhr) {
					if (!xhr.upload) return;
					xhr.upload.onprogress = xhr.upload.onload = function (e) {
						if (!e.lengthComputable) return;
						response(
							{state:'writing', progress:e.loaded / e.total},
							tabId, 'write');
					};
				};
				oauth.request({
					method:'PUT',
					url:'https://api-content.dropbox.com/1/files_put/dropbox/'
						+ getCanonicalPath(getInternalPath(path))
						+ '?locale=' + locale,
					data:content,							// TODO: make binary data
					headers:{'Content-Type':'text/plain'},	// TODO: specify encoding
					success:function (data) {
						var meta = u.parseJson(data.text);
						response(
							{
								state:'complete',
								meta:{
									path:getExternalPath(meta.path),
									charLength:content.length
								}
							},
							tabId, 'write'
						);
					},
					failure:function (data) {
						operationQueue = [{method:'write', path:path, tabId:tabId}];
						handleOAuthError(data);
					}
				});
			}
			else {
				operationQueue.push({method:'write', path:path, content:content, tabId:tabId});
				authorize(tabId);
			}
		}

		function writeLater (path, content, tabId) {
			if (!writeTimer) {
				writeTimer = setTimeout(function () {
					for (var i in writeBuffer) {
						write(i, writeBuffer[i].content, writeBuffer[i].tabId);
					}
					writeBuffer = {};
					writeTimer = null;
				}, 1000 * WRITE_DELAY_SECS);
			}
			writeBuffer[path] = {tabId:tabId, content:content};
			response({state:'buffered'}, tabId, 'write');
		}

		function read (path, tabId) {
			if (isAuthorized()) {
				response({state:'reading', progress:0}, tabId, 'read');
				oauth.onModifyTransport = function (xhr) {
					xhr.onprogress = xhr.onload = function (e) {
						if (!e.lengthComputable) return;
						response(
							{state:'reading', progress:e.loaded / e.total},
							tabId, 'read');
					};
				};
				oauth.get(
					'https://api-content.dropbox.com/1/files/dropbox/'
						+ getCanonicalPath(getInternalPath(path)),
					function (data) {
						var meta = u.parseJson(data.responseHeaders['x-dropbox-metadata']);
						if (!/^text\//.test(meta.mime_type)) {
							handleOAuthError({error:'Unknown MIME type: ' + meta.mime_type});
							return;
						}
						if (meta.is_dir) {
							handleOAuthError({error:'Cannot edit a directory.'});
							return;
						}
						response({
							state:'complete',
							content:data.text,
							meta:{
								status:data.status,
								path:getExternalPath(meta.path),
								charLength:data.text.length
							}
						}, tabId, 'read');
					},
					function (data) {
						if (data.status == 404) {
							response({
								state:'complete',
								content:'',
								meta:{
									status:data.status,
									path:getExternalPath(path),
									charLength:0
								}
							}, tabId, 'read');
						}
						else {
							operationQueue = [{method:'read', path:path, tabId:tabId}];
							handleOAuthError(data);
						}
					}
				);
			}
			else {
				operationQueue.push({method:'read', path:path, tabId:tabId});
				authorize(tabId);
			}
		}

		function accessTokenKeyName () {
			return 'filesystem.' + backend + '.tokens';
		}

		function restoreAcessTokenPersistents () {
			var obj = u.parseJson(extension.storage.getItem(accessTokenKeyName()));
			if (obj.key && obj.secret && obj.uid && obj.locale) {
				oauth.setAccessToken(obj.key, obj.secret);
				uid = obj.uid;
				locale = obj.locale;
				state = 'pre-authorized';
			}
		}

		function saveAccessTokenPersistents (key, secret, uid, locale) {
			extension.storage.setItem(
				accessTokenKeyName(),
				JSON.stringify({key:key, secret:secret, uid:uid, locale:locale}));
		}

		this.ls = ls;
		this.write = writeLater;
		this.read = read;
		this.match = match;
		this.__defineGetter__('isAuthorized', isAuthorized);
		this.__defineGetter__('backend', function () {return backend;});
		this.__defineGetter__('state', function () {return state;});

		restoreAcessTokenPersistents();
	}

	function create (name, key, secret, extension) {
		switch (name) {
		case 'dropbox':
			return new FileSystemDropbox(key, secret, extension);
		default:
			return new FileSystemBase;
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
