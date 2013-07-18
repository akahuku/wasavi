/**
 * resource loader
 * =============================================================================
 *
 *
 * @author akahuku@gmail.com
 * @version $Id: ResourceLoader.js 342 2013-07-18 02:02:38Z akahuku $
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

	var u;
	var self_;

	function ResourceLoader (transportGetter, locationGetter, emitter) {
		var data = {};
		emitter || (emitter = function (callback, data) {callback(data)});

		this.get = function (resourcePath, callback, opts) {
			function handleLoad () {
				var res = isText ? xhr.responseText : xhr.response;
				if (!opts.noCache) {
					data[resourcePath] = res;
				}
				emitter(callback, res);
				xhr.removeEventListener('load', handleLoad, false);
				xhr.removeEventListener('error', handleError, false);
				xhr = null;
			}

			function handleError () {
				var res = data[resourcePath] = false;
				emitter(callback, res);
				xhr.removeEventListener('load', handleLoad, false);
				xhr.removeEventListener('error', handleError, false);
				xhr = null;
			}

			callback || (callback = function () {});
			opts || (opts = {});

			if (!transportGetter || !locationGetter || !callback) {
				emitter(callback, '');
				return;
			}
			if (resourcePath in data) {
				emitter(callback, data[resourcePath]);
				return;
			}

			var xhr = transportGetter();
			var sync = 'sync' in opts && opts.sync;
			var isText;
			xhr.open('GET', locationGetter(resourcePath), !sync);
			if (opts.responseType && opts.responseType != 'text') {
				xhr.responseType = opts.responseType;
				isText = false;
			}
			else {
				xhr.responseType = 'text';
				xhr.overrideMimeType(opts.mimeType || 'text/plain;charset=UTF-8');
				isText = true;
			}
			xhr.addEventListener('load', handleLoad, false);
			xhr.addEventListener('error', handleError, false);

			try {
				xhr.send(null);
			}
			catch (e) {
				handleError();
			}
		};
	}

	function create (window, emitter) {
		if (window.XMLHttpRequest && window.location) {
			return new ResourceLoader(
				function () {
					return new window.XMLHttpRequest;
				},
				function (resourcePath) {
					return window.location.href.replace(/\/[^\/]*$/, '/') + resourcePath;
				},
				emitter
			);
		}
		else if (window.jetpack && self_) {
			return new ResourceLoader(
				function () {
					return u.createXHR();
				},
				function (resourcePath) {
					return self_.data.url(resourcePath);
				},
				emitter
			);
		}
		else {
			return new ResourceLoader;
		}
	}

	if (global.WasaviUtils) {
		u = global.WasaviUtils;
	}
	else if (typeof require == 'function') {
		u = require('./WasaviUtils').WasaviUtils;
		self_ = require('sdk/self');
	}

	exports.ResourceLoader = {create:create};
})(this);

// vim:set ts=4 sw=4 fenc=UTF-8 ff=unix ft=javascript fdm=marker :
