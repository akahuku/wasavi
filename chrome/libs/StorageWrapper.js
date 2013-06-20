/**
 * json based storage wrapper
 * =============================================================================
 *
 *
 * @author akahuku@gmail.com
 * @version $Id: StorageWrapper.js 316 2013-06-19 20:16:38Z akahuku $
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

	function StorageWrapper () {}

	StorageWrapper.prototype = {
		getItem: function (key) {},
		setItem: function (key, value) {},
		clear: function () {},
		toExternal: function (value) {
			if (typeof value == 'string') {
				if (value.charAt(0) == '{' && value.substr(-1) == '}'
				||  value.charAt(0) == '[' && value.substr(-1) == ']') {
					try {value = JSON.parse(value)} catch (e) {}
				}
			}
			else if (value === null) {
				value = undefined;
			}
			return value;
		},
		toInternal: function (value) {
			switch (/^\[object\s+(.+)\]$/.exec(Object.prototype.toString.call(value))[1]) {
			case 'Object':
				/*FALLTHRU*/
			case 'Array':
				value = JSON.stringify(value);
				break;
			case 'Function':
				return;
			}
			return value;
		}
	};

	function WebStorageWrapper () {
		this.constructor = StorageWrapper;
	}

	WebStorageWrapper.prototype = {
		getItem: function (key) {
			return StorageWrapper.prototype.toExternal(localStorage.getItem(key));
		},
		setItem: function (key, value) {
			if (value === undefined) {
				localStorage.removeItem(key);
			}
			else {
				localStorage.setItem(key, StorageWrapper.prototype.toInternal(value));
			}
		},
		clear: function () {
			localStorage.clear();
		}
	};

	function JetpackStorageWrapper () {
		this.ss = require('sdk/simple-storage');
		this.constructor = StorageWrapper;
	}

	JetpackStorageWrapper.prototype = {
		getItem: function (key) {
			return StorageWrapper.prototype.toExternal(this.ss.storage[key]);
		},
		setItem: function (key, value) {
			if (value === undefined) {
				delete this.ss.storage[key];
			}
			else {
				this.ss.storage[key] = StorageWrapper.prototype.toInternal(value);
			}
		},
		clear: function () {
			Object.keys(this.ss.storage).forEach(function (key) {
				delete this.ss.storage[key];
			}, this);
		}
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
