// ==UserScript==
// @include http://*/*
// @include widget://*/*
// ==/UserScript==
//
/**
 * wasavi: vi clone implemented in javascript
 * =============================================================================
 *
 *
 * @author akahuku@gmail.com
 * @version $Id: agent.js 100 2012-04-18 10:47:31Z akahuku $
 *
 *
 * Copyright (c) 2012 akahuku@gmail.com
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     1. Redistributions of source code must retain the above copyright
 *        notice, this list of conditions and the following disclaimer.
 *     2. Redistributions in binary form must reproduce the above
 *        copyright notice, this list of conditions and the following
 *        disclaimer in the documentation and/or other materials
 *        provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

function evalEx (code) {
	eval(code);
}

(function (global) {
	var IS_FX_JETPACK = window.navigator.product == 'Gecko'
		&& window.navigator.userAgent.indexOf('Gecko/') != -1;
	var extensionId;
	var tabId;
	var enableList;
	var exrc;
	var extension;

	/**
	 * extension wrapper base class
	 */

	function ExtensionWrapper () {
		this.sendRequest = function (data, callback) {};
		this.addMessageListener = function (handler) {};
		this.isOptionsPage = false;
	}
	ExtensionWrapper.prototype = {
		getOrigin: function () {
			var result = window.location.protocol + '//' + window.location.hostname;
			if (window.location.port != '') {
				result += ':' + window.location.port;
			}
			return result;
		}
	};
	ExtensionWrapper.create = function () {
		if (window.chrome) {
			return new ChromeExtensionWrapper;
		}
		else if (window.opera) {
			return new OperaExtensionWrapper;
		}
		else if (IS_FX_JETPACK) {
			return new FirefoxJetpackExtensionWrapper;
		}
		return new ExtensionWrapper;
	};

	/**
	 * extension wrapper class for chrome
	 */

	function ChromeExtensionWrapper () {
		this.runType = 'chrome-extension';
		this.sendRequest = function (data, callback) {
			if (callback) {
				chrome.extension.sendRequest(data, callback);
			}
			else {
				chrome.extension.sendRequest(data);
			}
		};
		this.addMessageListener = function (handler) {
			chrome.extension.onRequest.addListener(function (req, sender, res) {
				handler(req);
			});
		};
		this.__defineGetter__('isOptionsPage', function () {
			return location.hostname == extensionId
				&& location.pathname == '/options.html';
		});
	}

	/**
	 * extension wrapper class for opera
	 */

	function OperaExtensionWrapper () {
		this.runType = 'opera-extension';
		this.sendRequest = function (data, callback) {
			if (callback) {
				var ch = new MessageChannel;
				ch.port1.onmessage = function (e) {
					callback && callback(e.data);
					ch.port1.close();
					ch = null;
				};
				ch.port1.start();
				opera.extension.postMessage(data, [ch.port2]);
			}
			else {
				opera.extension.postMessage(data);
			}
		};
		this.addMessageListener = function (handler) {
			opera.extension.onmessage = function (e) {
				handler(e.data);
			};
		};
		this.__defineGetter__('isOptionsPage', function () {
			return window.location.hostname == extensionId
				&& window.location.pathname == '/options.html';
		});
	}

	/**
	 * extension wrapper class for firefox (Add-on SDK)
	 */

	function MessageCallbackQueueItem (callback) {
		this.callback = callback;
		this.time = +new Date;
	}
	MessageCallbackQueueItem.prototype = {
		toString:function () {
			return '[object MessageCallbackQueueItem(' +
				this.time + ': ' +
				this.callback.toString().replace(/[\s\r\n\t]+/g, ' ').substring(0, 100) +
				')]';
		},
		run:function () {
			typeof this.callback == 'function' && this.callback.apply(null, arguments);
		}
	};
	function FirefoxJetpackExtensionWrapper () {
		var messageId = 0;
		var callbacks = {};
		var onMessageHandler;

		function getNewMessageId () {
			messageId = (messageId + 1) & 0xffff;
			return messageId;
		}

		function handleMessage (data) {
			var now = +new Date;
			var callbacksCurrent = callbacks;
			var callbacksNext = {};

			callbacks = {};

			for (var i in callbacksCurrent) {
				if (data && data.__messageId == i) {
					callbacksCurrent[i].run(data);
				}
				else if (now - callbacksCurrent[i].time < 60 * 1000) {
					callbacksNext[i] = callbacksCurrent[i];
				}
			}
			for (var i in callbacksNext) {
				callbacks[i] = callbacksNext[i];
			}
		}

		self.on('message', function (data) {
			handleMessage(data);
			delete data.__messageId;
			onMessageHandler && onMessageHandler(data);
		});
		setInterval(handleMessage, 1000 * 60 * 2);

		this.runType = 'firefox-jetpack-extension';
		this.sendRequest = function (data, callback) {
			if (callback) {
				var id = getNewMessageId();
				callbacks[id] = new MessageCallbackQueueItem(callback);
				data.__messageId = id;
			}
			self.postMessage(data);
		};
		this.addMessageListener = function (handler) {
			onMessageHandler = handler;
		};
		this.__defineGetter__('isOptionsPage', function () {
			return location.hostname == extensionId.toLowerCase().replace(/@/g, '-at-')
				&& location.pathname == '/wasavi/data/options.html';
		});
	}

	/**
	 * request sender
	 */

	function sendReq (data, callback) {
		data || (data = {});
		if (tabId != undefined) {
			data.tabId = tabId;
		}
		extension.sendRequest(data, callback);
	}

	/**
	 * wasavi runner
	 */

	function run (element, res) {
		if (!global.Wasavi && res) {
			if (res.source) {
				evalEx(res.source);
			}
			else if (res.error) {
				console.log('Wasavi agent: loading failed: ' + res.error);
			}
		}
		if (global.Wasavi && !global.Wasavi.running) {
			if (enableList) {
				global.Wasavi.enableList = enableList;
				enableList = null;
			}
			if (exrc) {
				global.Wasavi.exrc = exrc;
				exrc = null;
			}
			global.Wasavi.injectKeyevents = true;
			global.Wasavi.runType = extension.runType;
			global.Wasavi.run(element);
			return true;
		}
		return false;
	}

	/**
	 * keydown handler
	 */

	function handleKeydown (e) {
		if (global.Wasavi && global.Wasavi.running) {
			global.Wasavi.notifyKeyevent(e);
			return;
		}

		if (!e || !e.target) return;
		if (e.target.nodeName != 'TEXTAREA' && e.target.nodeName != 'INPUT') return;

		var key, isCtrl;

		if      ('key' in e)           { key = e.key; }
		else if ('keyIdentifier' in e) { key = e.keyIdentifier; }
		else if (e.keyCode == e.which) { key = e.keyCode; }
		else                           { key = 0; }

		if      ('ctrlKey' in e)     { isCtrl = e.ctrlKey; }
		else if (e.getModifierState) { isCtrl = e.getModifierState('Control'); }
		else                         { isCtrl = false; }

		if (isCtrl && key == 'Enter' || isCtrl && key === 13 
		|| key == 'Insert' || key === 45) {
			e.preventDefault();

			if (global.Wasavi) {
				run(e.target);
			}
			else {
				sendReq({type:'load'}, function (res) {
					run(e.target, res) || console.log(
						'Wasavi: internal error: Wasavi loading failed.');
				});
			}
		}
	}

	/**
	 * keypress handler
	 */

	function handleKeypress (e) {
		if (global.Wasavi && global.Wasavi.running) {
			global.Wasavi.notifyKeyevent(e);
		}
	}

	/**
	 * DOMContentLoaded on options page handler
	 */

	function handleOptionsPageLoaded () {
		for (var i in enableList) {
			var el = document.getElementById(i);
			if (el && el.nodeName == 'INPUT' && el.type == 'checkbox') {
				el.checked = enableList[i];
			}
		}

		var el = document.getElementById('exrc');
		if (el && el.nodeName == 'TEXTAREA') {
			el.value = exrc;
		}

		var el = document.getElementById('save');
		if (el) {
			el.addEventListener('click', function (e) {
				for (var i in enableList) {
					var el = document.getElementById(i);
					if (el && el.nodeName == 'INPUT' && el.type == 'checkbox') {
						enableList[i] = el.checked;
					}
				}

				var el = document.getElementById('exrc');
				if (el && el.nodeName == 'TEXTAREA') {
					exrc = el.value;
				}

				sendReq(
					{
						type:'set-storage', 
						items: [
							{key:'targets', value:JSON.stringify(enableList)},
							{key:'exrc', value:exrc}
						],
					},
					function () {
						var saveResult = document.getElementById('save-result');
						if (saveResult) {
							saveResult.textContent = 'saved.';
							setTimeout(function () {
								saveResult.textContent = '';
							}, 1000 * 2);
						}
					}
				);
			}, false);
		}
	}

	/**
	 * extension initializer handler
	 */

	function handleInitializedMessage (req) {
		var needFireEvent = tabId == undefined && req && 'tabId' in req && req.tabId != undefined;
		extensionId = req.extensionId;
		tabId = req.tabId;
		enableList = req.targets;
		exrc = req.exrc;
		needFireEvent && handleAgentInitialized();
	}

	/**
	 * agent initializer handler
	 */

	function handleAgentInitialized () {
		//
		window.addEventListener('keydown', handleKeydown, true);
		window.addEventListener('keypress', handleKeypress, true);

		//
		if (extension.isOptionsPage) {
			if (document.readyState == 'complete' || document.readyState == 'interactive') {
				handleOptionsPageLoaded();
			}
			else {
				document.addEventListener('DOMContentLoaded', handleOptionsPageLoaded, false);
			}
		}
		else {
			createPageAgent();
		}

		window.self == window.top && console.log(
			'wasavi agent: running on ' + window.location.href.replace(/[#?].*$/, ''));
	}

	/**
	 * extension message handler
	 */

	function handleMessage (req) {
		if (!req) return;
		if (!req.type) return;

		switch (req.type) {
		case 'init-response':
			handleInitializedMessage(req);
			break;

		case 'update-storage':
			if (global.Wasavi && global.Wasavi.running) {
				global.Wasavi.notifyUpdateStorage(req.keys);
			}
			break;
		}
	}

	/**
	 * page agent. this function is executed in page script context.
	 */

	function pageAgent () {
		var wasaviRunning = false;

		function removeSelf () {
			var ss = document.getElementsByTagName('script');
			if (ss.length) {
				ss = ss[ss.length - 1];
				ss.parentNode.removeChild(ss);
			}
		}

		function hookEventListener (host) {
			var addOriginal = host.addEventListener;
			var removeOriginal = host.removeEventListener;
			var listeners = [];

			function isHookEvent (eventName) {
				return eventName == 'keydown' || eventName == 'keypress';
			}

			host.addEventListener = function (eventName, listener, useCapture) {
				if (!isHookEvent(eventName)) {
					addOriginal.call(this, eventName, listener, useCapture);
					return;
				}

				var key = eventName + '_' + !!useCapture;
				if (!listeners[key]) {
					listeners[key] = [];
				}
				if (!listeners[key].some(function (o) { return o[0] == listener; })) {
					var wrappedListener = function (e) {
						!wasaviRunning && listener && listener(e);
					};
					listeners[key].push([listener, wrappedListener]);
					addOriginal.call(this, eventName, wrappedListener, useCapture);
				}
			};
			host.removeEventListener = function (eventName, listener, useCapture) {
				if (!isHookEvent(eventName)) {
					removeOriginal.call(this, eventName, listener, useCapture);
					return;
				}

				var key = eventName + '_' + !!useCapture;
				if (!listeners[key]) {
					return;
				}
				listeners[key] = listeners[key].filter(function (o) {
					if (o[0] == listener) {
						removeOriginal.call(this, eventName, o[1], useCapture);
						return false;
					}
					return true;
				}, this);
			};
		}

		document.addEventListener('wasavi_start', function (e) {
			wasaviRunning = true;
			console.log('wasavi agent: wasavi started');
		}, false);

		document.addEventListener('wasavi_terminate', function (e) {
			wasaviRunning = false;
			console.log('wasavi agent: wasavi terminated');
		}, false);

		hookEventListener(window);
		hookEventListener(document);
		removeSelf();
	}

	function createPageAgent () {
		var s = document.createElement('script');
		s.type = 'text/javascript';
		s.text = '(' + pageAgent.toString().replace('^(function)[^(]*/', '$1') + ')();';
		document.documentElement.appendChild(s);
	}

	function dumpObject (obj) {
		var a = [];
		var ss = '';
		switch (typeof obj) {
		case 'number':
		case 'boolean':
		case 'string':
			ss = obj.toString();
			break;
		default:
			if (obj == null) {
				ss = '(null)';
			}
			else if (obj == undefined) {
				ss = '(undefined)';
			}
			else {
				for (var i in obj) {
					var s;
					try {
						s = i + ': ' + (obj[i] || '')
							.toString()
							.replace(/[\s\r\n\t]+/g, ' ')
							.substring(0, 100);
					}
					catch (e) {
						if (obj[i] == null) {
							s = '(null)';
						}
						else if (obj[i] == undefined) {
							s = '(undefined)';
						}
					}
					a.push(s);
				}
				ss = obj.toString();
			}
		}
		console.log('*** agent.js dump Object: ' + ss + ' ***\n\t' + a.join('\n\t'));
	}

	/**
	 * bootstrap
	 */

	extension = ExtensionWrapper.create();
	extension.addMessageListener(handleMessage);

	sendReq({type:'init'});

	global.WasaviAgent = {
		sendRequest:sendReq
	};
	//dumpObject(global);

})(this);

// vim:set ts=4 sw=4 fileencoding=UTF-8 fileformat=unix filetype=javascript :
