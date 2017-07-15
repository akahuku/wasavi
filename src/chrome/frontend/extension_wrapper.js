/**
 * wasavi: vi clone implemented in javascript
 * =============================================================================
 *
 *
 * @author akahuku@gmail.com
 */
/**
 * Copyright 2012-2017 akahuku, akahuku@gmail.com
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

!this.WasaviExtensionWrapper && (function (global) {
	/* <<<1 consts */
	const IS_GECKO = 'InstallTrigger' in global;
	const IS_FX_WEBEXT = IS_GECKO && global.chrome && global.chrome.extension;
	/* >>> */

	/* <<<1 vars */
	var extensionName = 'wasavi';
	var externalFrameURL = 'http://wasavi.appsweets.net/';
	var externalSecureFrameURL = 'https://wasavi.appsweets.net/';
	/* >>> */

	/**
	 * <<<1 url information class
	 * ----------------
	 */

	function UrlInfo (optionsUrl, internalUrl) {
		this.optionsUrl = optionsUrl;
		this.internalUrl = internalUrl;
	}

	UrlInfo.prototype = {
		eq: function (u1, u2) {
			return (u1 || '').replace(/\?.*/, '')
				== (u2 || '').replace(/\?.*/, '');
		},
		get externalUrl () {return externalFrameURL},
		get externalSecureUrl () {return externalSecureFrameURL},
		get isInternal () {
			return this.eq(window.location.href, this.internalUrl);
		},
		get isExternal () {
			return this.eq(window.location.href, this.externalUrl)
			    || this.eq(window.location.href, this.externalSecureUrl);
		},
		get isAny () {
			return this.isInternal || this.isExternal;
		},
		get frameSource () {
			if (this.internalUrl) {
				return this.internalUrl;
			}
			else {
				return window.location.protocol == 'https:' ?
					this.externalSecureUrl : this.externalUrl;
			}
		}
	};
	/* >>> */

	/**
	 * <<<1 extension wrapper base class
	 * ----------------
	 */

	function ExtensionWrapper () {
		this.tabId = null;
		this.requestNumber = 0;
	}
	ExtensionWrapper.prototype = {
		get name () {return extensionName},
		isTopFrame: function () {return global.window == window.top},
		postMessage: function (data, callback) {
			var type;
			var requestNumber = this.getNewRequestNumber();

			data || (data = {});

			if ('type' in data) {
				type = data.type;
				delete data.type;
			}

			this.doPostMessage({
				type:type || 'unknown-command',
				tabId:this.tabId,
				requestNumber:requestNumber,
				data:data
			}, callback);

			return requestNumber;
		},
		doPostMessage: function (data, callback) {},
		connect: function (type, callback) {
			this.doConnect();
			this.doPostMessage({
				type:type || 'init',
				tabId:this.tabId,
				requestNumber:this.getNewRequestNumber(),
				data:{url:window.location.href}
			}, callback);
		},
		doConnect: function () {},
		disconnect: function () {
			this.doDisconnect();
		},
		doDisconnect: function () {},
		setMessageListener: function (handler) {},
		addMessageListener: function (handler) {},
		removeMessageListener: function (handler) {},
		runCallback: function () {
			var args = Array.prototype.slice.call(arguments);
			var callback = args.shift();
			if (typeof callback != 'function') {
				return;
			}
			return callback.apply(null, args);
		},
		getUniqueId: function () {
			return this.name
				+ '_' + Date.now()
				+ '_' + Math.floor(Math.random() * 0x10000);
		},
		getNewRequestNumber: function () {
			this.requestNumber = (this.requestNumber + 1) & 0xffff;
			return this.requestNumber;
		},
		getMessage: function (messageId) {},
		setClipboard: function (data) {
			if (IS_GECKO) {
				let buffer = document.getElementById('wasavi_fx_clip');
				buffer.value = data;
				buffer.focus();
				buffer.select();
				document.execCommand('cut');
			}
			else {
				this.postMessage({type:'set-clipboard', data:data});
			}
		},
		getClipboard: function () {
			var self = this;
			var args = Array.prototype.slice.call(arguments);
			var callback = args.shift();
			this.postMessage({type:'get-clipboard'}, function (req) {
				let clipboardData = (req && req.data || '').replace(/\r\n/g, '\n');
				args.unshift(clipboardData);
				callback.apply(null, args);
			});
		},
		getPageContextScriptSrc: function (path) {
			return '';
		},
		ensureRun: function () {
			var args = Array.prototype.slice.call(arguments);
			var callback = args.shift();
			var doc;
			try {
				doc = document;
				doc.body;
			}
			catch (e) {
				return;
			}
			if (doc.readyState == 'interactive'
			||  doc.readyState == 'complete') {
				callback.apply(null, args);
				callback = args = null;
			}
			else {
				doc.addEventListener(
					'DOMContentLoaded',
					function handleDCL (e) {
						doc.removeEventListener(e.type, handleDCL, false);
						callback.apply(null, args);
						e = callback = args = null;
					},
					false
				);
			}
		}
	};

	ExtensionWrapper.create = function (opts) {
		opts || (opts = {});
		'extensionName' in opts && (extensionName = opts.extensionName);
		'externalFrameURL' in opts && (externalFrameURL = opts.externalFrameURL);
		'externalSecureUrl' in opts && (externalSecureUrl = opts.externalSecureUrl);
		
		if (window.chrome) return new ChromeExtensionWrapper;
		if (global.chrome) return new ChromeExtensionWrapper;
		return new ExtensionWrapper;
	};
	ExtensionWrapper.IS_GECKO = IS_GECKO;
	ExtensionWrapper.IS_FX_WEBEXT = IS_FX_WEBEXT;
	ExtensionWrapper.urlInfo = new UrlInfo;
	/* >>> */

	/**
	 * <<<1 extension wrapper class for chrome
	 * ----------------
	 */

	function ChromeExtensionWrapper () {
		ExtensionWrapper.apply(this, arguments);

		var that = this;
		var onMessageHandlers = [];

		function handleMessage (req, sender, response) {
			for (const handler of onMessageHandlers) {
				handler(req, sender, response);
			}
		}

		this.constructor = ExtensionWrapper;
		this.runType = 'chrome-extension';
		this.doPostMessage = function (data, callback) {
			try {
				chrome.runtime.sendMessage(data, callback);
			}
			catch (e) {}
		};
		this.doConnect = function () {
			chrome.runtime.onMessage.addListener(handleMessage);
		};
		this.doDisconnect = function () {
			onMessageHandlers.length = 0;
			chrome.runtime.onMessage.removeListener(handleMessage);
		};
		this.setMessageListener = function (handler) {
			onMessageHandlers = [handler];
		};
		this.addMessageListener = function (handler) {
			var index = onMessageHandlers.indexOf(handler);
			if (index < 0) {
				onMessageHandlers.push(handler);
			}
		};
		this.removeMessageListener = function (handler) {
			var index = onMessageHandlers.indexOf(handler);
			if (index >= 0) {
				onMessageHandlers.splice(index, 1);
			}
		};
		this.getMessage = function (messageId) {
			return chrome.i18n.getMessage(messageId);
		};
		this.getPageContextScriptSrc = function () {
			return chrome.runtime.getURL('scripts/page_context.js');
		};
		this.urlInfo = new function () {
			return new UrlInfo(
				chrome.runtime.getURL('options.html'),
				chrome.runtime.getURL('wasavi.html')
			);
		};
	}
	ChromeExtensionWrapper.prototype = ExtensionWrapper.prototype;
	/* >>> */

	/* <<<1 bootstrap */
	ExtensionWrapper.urlInfo.isExternal &&
		document.documentElement.setAttribute('data-wasavi-present', 1);
	global.WasaviExtensionWrapper = ExtensionWrapper;
	/* >>> */

})(this);

// vim:set ts=4 sw=4 fenc=UTF-8 ff=unix ft=javascript fdm=marker fmr=<<<,>>> :
