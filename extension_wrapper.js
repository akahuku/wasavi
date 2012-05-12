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
 * @version $Id: extension_wrapper.js 115 2012-05-12 02:04:45Z akahuku $
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
		window.opera  ? 'wuid-4f897a84-0ecb-0471-0249-720a1e60a25b' :
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
		external:      'http://appsweets.net/wasavi/wasavi_frame.html',
		externalSecure:'https://ss1.xrea.com/appsweets.net/wasavi/wasavi_frame.html'
	};





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

	global.WasaviExtensionWrapper = ExtensionWrapper;

})(this);

// vim:set ts=4 sw=4 fileencoding=UTF-8 fileformat=unix filetype=javascript :
