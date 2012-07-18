// ==UserScript==
// @include http://*/*
// @include https://*/*
// ==/UserScript==
//
/**
 * wasavi: vi clone implemented in javascript
 * =============================================================================
 *
 *
 * @author akahuku@gmail.com
 * @version $Id: extension_wrapper.js 160 2012-07-17 13:39:09Z akahuku $
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
	/*const*/var IS_GECKO =
		window.navigator.product == 'Gecko'
		&& window.navigator.userAgent.indexOf('Gecko/') != -1;
	/*const*/var IS_FX_JETPACK =
		 typeof global.getInterface == 'function'
		 && /^\s*function\s+getInterface\s*\([^)]*\)\s*\{\s*\[native\s+code\]\s*\}\s*$/.test(
			global.getInterface.toString().replace(/[\s\r\n\t]+/g, ' '));

	var extensionId =
		window.chrome ? chrome.extension.getURL('').split('/')[2] :
		window.opera  ? widget.preferences['widget-id'] :
		IS_FX_JETPACK ? 'jid1-bmmwunrx3u5hqq@jetpack' :
		'';
	var extensionHostname =
		window.chrome ? extensionId :
		window.opera  ? extensionId :
		IS_FX_JETPACK ? extensionId
			.toLowerCase()
			.replace(/@/g, '-at-')
			.replace(/\./g, '-dot-') :
		'';
	var optionsPageUrl =
		window.chrome ? 'chrome-extension://' + extensionHostname + '/options.html' :
		window.opera  ? 'widget://' + extensionHostname + '/options.html' :
		IS_FX_JETPACK ? 'resource://' + extensionHostname + '/wasavi/data/options.html' :
		'';
	var framePageUrl =
		window.chrome ? 'chrome-extension://' + extensionHostname + '/wasavi_frame.html' :
		window.opera  ? 'widget://' + extensionHostname + '/wasavi_frame.html' :
		IS_FX_JETPACK ? 'resource://' + extensionHostname + '/wasavi/data/wasavi_frame.html' :
		'';
		

	/**
	 * extension wrapper base class
	 * ----------------
	 */

	function ExtensionWrapper () {}
	ExtensionWrapper.prototype = {
		clipboardData: '',
		setMessageListener: function (handler) {},
		sendRequest: function (data, callback) {},
		postMessage: function (data, callback) {
			if (this.tabId != undefined) {
				data || (data = {});
				data.tabId = this.tabId;
				this.sendRequest(data, callback);
			}
		},
		connect: function () {
			this.sendRequest({type:'init'});
		},
		getMessage: function (messageId) {},
		setClipboard: function (data) {
			this.postMessage({type:'set-clipboard', data:data});
		},
		getClipboard: function (callback) {
			var result = '';
			var self = this;
			this.postMessage({type:'get-clipboard'}, function (req) {
				result = self.clipboardData = (req.data || '').replace(/\r\n/g, '\n');
				callback && callback(result);
			});
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

	ExtensionWrapper.IS_GECKO = IS_GECKO;
	ExtensionWrapper.IS_FX_JETPACK = IS_FX_JETPACK;
	ExtensionWrapper.CAN_COMMUNICATE_WITH_EXTENSION =
		 window.chrome && chrome.extension
		 || global.opera && global.opera.extension
		 || IS_GECKO && IS_FX_JETPACK;

	ExtensionWrapper.extensionId = extensionId;
	ExtensionWrapper.extensionHostname = extensionHostname;
	ExtensionWrapper.optionsPageUrl = optionsPageUrl;
	ExtensionWrapper.framePageUrl = {
		internalAvailable:false,
		internal:      framePageUrl,
		external:      'http://wasavi.appsweets.net/',
		externalSecure:'https://ss1.xrea.com/wasavi.appsweets.net/',
		eq: function (u1, u2) {
			return u1.replace(/\?.*/, '') == u2.replace(/\?.*/, '');
		},
		get isInternal () {
			return this.eq(window.location.href, this.internal);
		},
		get isExternal () {
			return this.eq(window.location.href, this.external)
			    || this.eq(window.location.href, this.externalSecure);
		},
		get isAny () {
			return this.isInternal || this.isExternal;
		}
	};
	ExtensionWrapper.isTopFrame = (function () {
		return window.self == window.top;
		/*
		var result;
		try { result = !!!window.frameElement; } catch (e) {} 
		return result;
		 */
	})();



	/**
	 * extension wrapper class for chrome
	 * ----------------
	 */

	function ChromeExtensionWrapper () {
		var theObj = this;
		var onMessageHandler;
		this.constructor = ExtensionWrapper;
		this.runType = 'chrome-extension';
		this.sendRequest = function (data, callback) {
			callback ? chrome.extension.sendRequest(data, callback) :
					   chrome.extension.sendRequest(data);
		};
		this.setMessageListener = function (handler) {
			onMessageHandler = handler;
		};
		this.getMessage = function (messageId) {
			return chrome.i18n.getMessage(messageId);
		};
		chrome.extension.onRequest.addListener(function (req, sender, res) {
			if (req && req.type == 'init-response') {
				theObj.tabId = req.tabId;
			}
			onMessageHandler && onMessageHandler(req);
		});
	}
	ChromeExtensionWrapper.prototype = ExtensionWrapper.prototype;

	/**
	 * extension wrapper class for opera
	 * ----------------
	 */

	function OperaExtensionWrapper () {
		var theObj = this;
		var onMessageHandler;
		this.constructor = ExtensionWrapper;
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
		this.setMessageListener = function (handler) {
			onMessageHandler = handler;
		};
		opera.extension.onmessage = function (e) {
			if (e.data && e.data.type == 'init-response') {
				theObj.tabId = e.data.tabId;
			}
			onMessageHandler && onMessageHandler(e.data);
		};
	}
	OperaExtensionWrapper.prototype = ExtensionWrapper.prototype;

	/**
	 * extension wrapper class for firefox (Add-on SDK)
	 * ----------------
	 */

	function FirefoxJetpackExtensionWrapper () {
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

		var theObj = this;
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
				if (data && data.__messageId - i == 0) {
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
			if (data && data.type == 'init-response') {
				theObj.tabId = data.tabId;
			}
			if ('__messageId' in data) {
				handleMessage(data);
			}
			else {
				onMessageHandler && onMessageHandler(data);
			}
		});
		setInterval(handleMessage, 1000 * 60 * 2);

		this.constructor = ExtensionWrapper;
		this.runType = 'firefox-jetpack-extension';
		this.sendRequest = function (data, callback) {
			if (callback) {
				var id = getNewMessageId();
				callbacks[id] = new MessageCallbackQueueItem(callback);
				data.__messageId = id;
			}
			self.postMessage(data);
		};
		this.setMessageListener = function (handler) {
			onMessageHandler = handler;
		};
	}
	FirefoxJetpackExtensionWrapper.prototype = ExtensionWrapper.prototype;

	ExtensionWrapper.framePageUrl.isExternal &&
		document.documentElement.setAttribute('data-wasavi-present', 1);
	global.WasaviExtensionWrapper = ExtensionWrapper;

})(this);

// vim:set ts=4 sw=4 fileencoding=UTF-8 fileformat=unix filetype=javascript :
