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
 * @version $Id: extension_wrapper.js 414 2013-09-27 13:13:51Z akahuku $
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

'use strict';

(function (global) {
	/*const*/var EXTENSION_NAME = 'wasavi';
	/*const*/var IS_GECKO =
		window.navigator.product == 'Gecko'
		&& window.navigator.userAgent.indexOf('Gecko/') != -1;
	/*const*/var IS_FX_JETPACK =
		 typeof global.getInterface == 'function'
		 && /^\s*function\s+getInterface\s*\([^)]*\)\s*\{\s*\[native\s+code\]\s*\}\s*$/.test(
			global.getInterface.toString().replace(/[\s\r\n\t]+/g, ' '));
	/*const*/var EXTERNAL_FRAME_URL = 'http://wasavi.appsweets.net/';
	/*const*/var EXTERNAL_SECURE_FRAME_URL = 'https://ss1.xrea.com/wasavi.appsweets.net/';

	/**
	 * url information class
	 * ----------------
	 */

	function UrlInfo (optionsUrl, internalUrl, canUseInternal, canUseExtensionContent) {
		this.externalUrl = EXTERNAL_FRAME_URL;
		this.externalSecureUrl = EXTERNAL_SECURE_FRAME_URL;

		this.optionsUrl = optionsUrl;
		this.internalUrl = internalUrl;
		this.canUseInternal = canUseInternal;
		this.canUseExtensionContent = canUseExtensionContent;
	}

	UrlInfo.prototype = {
		eq: function (u1, u2) {
			return u1.replace(/\?.*/, '') == u2.replace(/\?.*/, '');
		},
		get isInternal () {
			return this.eq(window.location.href, this.internalUrl)
				|| /^data:text\/html;charset=UTF-8;class=wasavi;base64,/.test(window.location.href);
		},
		get isExternal () {
			return this.eq(window.location.href, this.externalUrl)
			    || this.eq(window.location.href, this.externalSecureUrl);
		},
		get isAny () {
			return this.isInternal || this.isExternal;
		},
		get frameSource () {
			if (this.canUseInternal) {
				return this.canUseExtensionContent ?
					this.internalUrl : false;
			}
			else {
				return window.location.protocol == 'https:' ?
					this.externalSecureUrl : this.externalUrl;
			}
		}
	};

	/**
	 * extension wrapper base class
	 * ----------------
	 */

	function ExtensionWrapper () {}
	ExtensionWrapper.prototype = {
		get name () {return EXTENSION_NAME},
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
		connect: function (type) {
			this.sendRequest({type:type || 'init', url:window.location.href});
		},
		getMessage: function (messageId) {},
		setClipboard: function (data) {
			this.postMessage({type:'set-clipboard', data:data});
		},
		getClipboard: function () {
			var self = this;
			var args = Array.prototype.slice.call(arguments);
			var callback = args.shift();
			this.postMessage({type:'get-clipboard'}, function (req) {
				self.clipboardData = (req && req.data || '').replace(/\r\n/g, '\n');
				if (callback) {
					args.unshift(self.clipboardData);
					callback.apply(null, args);
				}
			});
		},
		getExtensionFileURL: function (path, callback) {
			callback && callback();
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
	ExtensionWrapper.HOTKEY_ENABLED = IS_GECKO && IS_FX_JETPACK;
	ExtensionWrapper.IS_TOP_FRAME = (function () {
		if (IS_GECKO) {
			var result = false;
			try { result = !!!window.frameElement; } catch (e) {}
			return result;
		}
		else {
			return window.self == window.top;
		}
	})();
	ExtensionWrapper.urlInfo = new UrlInfo;

	/**
	 * extension wrapper class for chrome
	 * ----------------
	 */

	function ChromeExtensionWrapper () {
		function handleMessage (req) {
			if (req && req.type == 'init-response') {
				theObj.tabId = req.tabId;
			}
			onMessageHandler && onMessageHandler(req);
		}

		var extensionId = chrome.extension.getURL('').split('/')[2];
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
		this.disconnect = function () {
			onMessageHandler = null;
			chrome.extension.onRequest.removeListener(handleMessage);
		};
		this.urlInfo = new UrlInfo(
			'chrome-extension://' + extensionId + '/options.html',
			'chrome-extension://' + extensionId + '/wasavi_frame.html',
			true, true
		);
		this.getExtensionFileURL = function (path, callback) {
			if (!callback) return;
			var url = chrome.runtime.getURL(path);
			callback(url);
		};

		chrome.extension.onRequest.addListener(handleMessage);
	}
	ChromeExtensionWrapper.prototype = ExtensionWrapper.prototype;

	/**
	 * extension wrapper class for opera
	 * ----------------
	 */

	function OperaExtensionWrapper () {
		function handleMessage (e) {
			if (e.data && e.data.type == 'init-response') {
				theObj.tabId = e.data.tabId;
			}
			onMessageHandler && onMessageHandler(e.data);
		};

		var extensionId =  widget.preferences['widget-id'];
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
		this.disconnect = function () {
			onMessageHandler = null;
			opera.extension.onmessage = null;
		};
		this.urlInfo = new UrlInfo(
			'widget://' + extensionId + '/options.html',
			'widget://' + extensionId + '/wasavi_frame.html',
			false, false
		);
		this.getExtensionFileURL = function (path, callback) {
			if (!callback) return;

			var file = opera.extension.getFile(path);
			if (!file) {
				callback();
				return;
			}

			var r = new FileReader();
			r.onload = function (e) {
				callback(r.result)
				file = r = callback = null;
			};
			r.onerror = function (e) {
				callback()
				file = r = callback = null;
			};
			r.readAsDataURL(file);
		};

		opera.extension.onmessage = handleMessage;
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

		var extensionId = 'jid1-bmmwunrx3u5hqq@jetpack';
		var extensionHostname = extensionId
			.toLowerCase()
			.replace(/@/g, '-at-')
			.replace(/\./g, '-dot-');
		var theObj = this;
		var messageId = 0;
		var callbacks = {};
		var onMessageHandler;

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
		this.disconnect = function () {
			onMessageHandler = null;
			self.on('message', null);
		};
		this.urlInfo = new UrlInfo(
			'resource://' + extensionHostname + '/wasavi/data/options.html',
			'resource://' + extensionHostname + '/wasavi/data/wasavi_frame.html',
			true, false
		);

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
	}
	FirefoxJetpackExtensionWrapper.prototype = ExtensionWrapper.prototype;

	//
	ExtensionWrapper.urlInfo.isExternal &&
		document.documentElement.setAttribute('data-wasavi-present', 1);
	global.WasaviExtensionWrapper = ExtensionWrapper;

})(this);

// vim:set ts=4 sw=4 fileencoding=UTF-8 fileformat=unix filetype=javascript fdm=marker :
