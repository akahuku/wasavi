// ==UserScript==
// @include http://wasavi.appsweets.net/script_frame.html
// @include https://ss1.xrea.com/wasavi.appsweets.net/script_frame.html
// ==/UserScript==
//
/**
 * wasavi: vi clone implemented in javascript
 * =============================================================================
 *
 *
 * @author akahuku@gmail.com
 * @version $Id: script_frame.js 294 2013-02-16 14:56:06Z akahuku $
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

function install () {
	function init () {
		Object.defineProperty(window, 'wasavi', {
			value:new function () {
				var initialized = false;
				var key = false;
				var running = false;
				var lastId = 0;
				var contexts = {};

				function dispatchEvent (eventName, id, detail) {
					detail || (detail = {});
					detail.key = key;
					detail.errorMessage || (detail.errorMessage = '');
					detail.message || (detail.message = '');

					if (id && id in contexts) {
						detail.errorMessage = contexts[id].errorMessage;
						detail.message = contexts[id].message;
					}

					var ev = document.createEvent('CustomEvent');
					ev.initCustomEvent(eventName, false, false, detail);
					window.parent.dispatchEvent(ev);
				}

				function notifyScriptComplete (id, errorMessage, message) {
					dispatchEvent('WasaviScriptComplete', id, {
						errorMessage:errorMessage,
						message:message
					});
				}

				function requestCommand (id, type, detail) {
					if (!(id in contexts)) return;
					detail || (detail = {});
					detail.type = type;
					dispatchEvent('WasaviScriptRequest', id, detail);
					var doc = window.parent.document.documentElement;
					try {
						var result = JSON.parse(doc.getAttribute('data-script-result'));
						if (result.errorMessage) {
							throw new Error(result.errorMessage);
						}
						return result.result;
					}
					catch (e) {
						throw e;
					}
					finally {
						doc.removeAttribute('data-script-result');
					}
					return false;
				}

				function getLastId () {
					return Object.keys(contexts).sort(function (a, b) {return b - a})[0] - 0 || -1;
				}

				function getEncodedCode (code) {
					code = window.btoa(unescape(encodeURIComponent(code.replace(/\n\s*/g, '\n'))));
					code = 'data:text/javascript;base64,' + code;
					return code;
				}

				function handleScriptRequest (e) {
					var akey, code;

					if (e.detail === null
					|| e.detail === undefined
					|| typeof e.detail != 'object') {
						notifyScriptComplete(null, 'invalid script info');
						return;
					}

					akey = e.detail.key;
					code = e.detail.code;

					if (key === false) {
						key = akey;
						notifyScriptComplete(null, null, 'key initialized');
						return;
					}
					else if (akey !== key) {
						notifyScriptComplete(null, 'key unmatch');
						return;
					}

					running = true;
					lastId = (lastId + 1) & 0xffffff;
					contexts[lastId] = {
						isAsync:false,
						errorMessage:'',
						message:''
					};

					var script = document.createElement('script');
					script.onload = (function (scriptId) {
						return function () {
							this.onload = null;
							this.parentNode.removeChild(this);
							if (!contexts[scriptId].isAsync) {
								var context = contexts[scriptId];
								notifyScriptComplete(scriptId);
								delete contexts[scriptId];
							}
							running = contexts.length > 0;
						};
					})(lastId);
					script.type = 'text/javascript';
					script.src = getEncodedCode([
						'(function(scriptId){',
						'try{',
						code,
						'}catch(e){',
						'wasavi.getContext(scriptId).errorMessage = e.message;',
						'console.error("error in wasavi script: "+e)',
						'}',
						'})(' + lastId + ')'
					].join('\n'));
					document.head.appendChild(script);
				}

				window.addEventListener('WasaviScriptRequest', handleScriptRequest, false);

				return Object.defineProperties({}, {
					init:{
						value:function () {
							if (initialized) return;
							initialized = true;
							dispatchEvent('WasaviScriptInitialized');
						}
					},
					getContext:{
						value:function (id) {
							function ensureRunning () {
								if (!running) {
									throw new Error('Invalid running state');
								}
							}
							function ensureValidId () {
								if (!(id in contexts)) {
									throw new Error('Invalid script id: ' + id);
								}
							}
							return {
								get async () {
									ensureValidId();
									return contexts[id].isAsync;
								},
								set async (v) {
									ensureValidId();
									contexts[id].isAsync = !!v;
								},
								get errorMessage () {
									ensureValidId();
									return contexts[id].errorMessage;
								},
								set errorMessage (v) {
									ensureValidId();
									contexts[id].errorMessage = v + '';
								},
								get message () {
									ensureValidId();
									return contexts[id].message;
								},
								set message (v) {
									ensureValidId();
									contexts[id].message = v + '';
								},
								notifyScriptComplete: function () {
									ensureRunning();
									ensureValidId();
									notifyScriptComplete(id);
									delete contexts[id];
								},
								run:function (command) {
									return requestCommand(id, 'run-command', {data:command});
								},
								rows:function (index) {
									return requestCommand(id, 'rows', {data:index});
								},
								position:function () {
									return JSON.parse(requestCommand(id, 'position'));
								}
							}
						}
					}
				});
			}
		});
		window.wasavi.init();
	}

	var script = document.createElement('script');
	script.onload = function () {
		this.onload = null;
		this.parentNode.removeChild(this);
	};
	script.type = 'text/javascript';
	script.src =
		'data:text/javascript;base64,' +
		window.btoa(unescape(encodeURIComponent('(' + init.toString().replace(/\n\s*/g, '\n') + ')();')));
	document.head.appendChild(script);
}

switch (document.readyState) {
case 'interactive':
case 'complete':
	install();
	break;
default:
	document.addEventListener('DOMContentLoaded', install, false);
	break;
}

// vim:set ts=4 sw=4 fenc=UTF-8 ff=unix ft=javascript fdm=marker :
