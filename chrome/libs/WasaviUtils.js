/**
 * utilities
 * =============================================================================
 *
 *
 * @author akahuku@gmail.com
 * @version $Id: WasaviUtils.js 347 2013-07-25 04:40:17Z akahuku $
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

	var timers;
	var base64;

	if (typeof require == 'function') {
		timers = require('sdk/timers');
		base64 = require('sdk/base64');
	}
	else {
		timers = {
			setInterval: function () {return global.setInterval.apply(global, arguments)},
			setTimeout: function () {return global.setTimeout.apply(global, arguments)},
			clearInterval: function () {return global.clearInterval.apply(global, arguments)},
			clearTimeout: function () {return global.clearTimeout.apply(global, arguments)}
		};
		base64 = {
			decode: function () {return global.atob.apply(global, arguments)},
			encode: function () {return global.btoa.apply(global, arguments)}
		};
	}

	exports.WasaviUtils = {
		baseUrl: function (s) {
			return s.replace(/\?.*/, '');
		},

		parseJson: function (s, def) {
			if (typeof s != 'string') {
				return def || {};
			}

			var result;
			try {
				result = JSON.parse(s);
			}
			catch (e) {
				result = def || {};
			}

			return result;
		},

		countOf: function (o) {
			var result = 0;
			for (var i in o) result++;
			return result;
		},

		objectType: function (o) {
			return /^\[object\s+(.+)\]$/.exec(Object.prototype.toString.call(o))[1];
		},

		setInterval: timers.setInterval,
		setTimeout: timers.setTimeout,
		clearInterval: timers.clearInterval,
		clearTimeout: timers.clearTimeout,

		atob: base64.decode,
		btoa: base64.encode,

		createXHR: function () {
			if (typeof window == 'object' && window.XMLHttpRequest) {
				return new window.XMLHttpRequest;
			}
			if (typeof require == 'function') {
				/*
				 * XMLHttpRequest which SDK provides is very very limited.
				 * There is no responseType/response properties. So we use native xhr.
				 */
				var chrome = require('chrome');
				var Cc = chrome.Cc, Ci = chrome.Ci;
				var xhr = Cc['@mozilla.org/xmlextras/xmlhttprequest;1']
					.createInstance(Ci.nsIXMLHttpRequest);
				xhr.mozBackgroundRequest = true;
				return xhr;
			}
		},

		_: function () {
			return Array.prototype.slice.call(arguments);
		}
	};
})(this);

// vim:set ts=4 sw=4 fenc=UTF-8 ff=unix ft=javascript fdm=marker :
