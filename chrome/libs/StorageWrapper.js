/**
 * json based storage wrapper
 * =============================================================================
 *
 *
 * @author akahuku@gmail.com
 * @version $Id: StorageWrapper.js 300 2013-06-06 16:31:37Z akahuku $
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

(function () {
	'use strict';

	function StorageWrapper () {
		this.getItem = function (key) {};
		this.setItem = function (key, value) {};
		this.clear = function () {};
	}

	function WebStorageWrapper () {
		this.constructor = StorageWrapper;
		this.getItem = function (key) {
			return localStorage.getItem(key)
		};
		this.setItem = function (key, value) {
			localStorage.setItem(key, value);
		};
		this.clear = function () {
			localStorage.clear();
		};
	}

	function JetpackStorageWrapper () {
		var ss = require('sdk/simple-storage');
		this.constructor = StorageWrapper;
		this.getItem = function (key) {
			var result = ss.storage[key];
			return result === undefined ? null : result;
		};
		this.setItem = function (key, value) {
			ss.storage[key] = value;
		};
		this.clear = function () {
			Object.keys(ss.storage).forEach(function (key) {
				delete ss.storage[key];
			});
		};
	}

	function create (window) {
		if (window.localStorage) {
			return new WebStorageWrapper;
		}
		else if (window.jetpack) {
			return new JetpackStorageWrapper;
		}
		else {
			return new StorageWrapper;
		}
	}

	exports.StorageWrapper = {create:create};
})();

// vim:set ts=4 sw=4 fenc=UTF-8 ff=unix ft=javascript fdm=marker :
