/**
 * synchronized storage wrapper for wasavi
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

(function (global) {
	'use strict';

	function SyncStorage (options) {
		this.options = options || {};
		this.ext = require('./kosian/Kosian').Kosian();
	}

	SyncStorage.prototype = {
		clear: function (callback) {this.ext.emit(callback)},
		get: function (keys, callback) {this.ext.emit(callback, {})},
		getBytesInUse: function (keys, callback) {this.ext.emit(callback, 0)},
		remove: function (keys, callback) {this.ext.emit(callback)},
		set: function (items, callback) {this.ext.emit(callback)}
	};

	function ChromeSyncStorage (options) {
		SyncStorage.apply(this, arguments);
		chrome.identity.onSignInChanged.addListener(function (info, signedIn) {
			this.ext.emit(this.options.onSignInChanged);
		}.bind(this))
	}
	ChromeSyncStorage.prototype = Object.create(SyncStorage.prototype, {
		clear: {value: function (callback) {
			return chrome.storage.sync.clear(callback);
		}},
		get: {value: function (keys, callback) {
			return chrome.storage.sync.get(keys, callback);
		}},
		getBytesInUse: {value: function (keys, callback) {
			return chrome.storage.sync.getBytesInUse(keys, callback);
		}},
		remove: {value: function (keys, callback) {
			return chrome.storage.sync.remove(keys, callback);
		}},
		set: {value: function (items, callback) {
			return chrome.storage.sync.set(items, callback);
		}}
	});
	ChromeSyncStorage.prototype.constructor = SyncStorage;

	exports.SyncStorage = function (options) {
		let isChrome = false;
		do {
			if (!global.chrome) break;
			if (!('storage' in chrome)) break;
			if (!('sync' in chrome.storage)) break;
			if (!('identity' in chrome)) break;
			if (!('onSignInChanged' in chrome.identity)) break;
			if (typeof chrome.identity.onSignInChanged != 'object') break;
			if (!('addListener' in chrome.identity.onSignInChanged)) break;
			if (typeof chrome.identity.onSignInChanged.addListener != 'function') break;

			isChrome = true;
		} while (false);

		return isChrome ?
			new ChromeSyncStorage(options) :
			new SyncStorage(options);
	};
})(this);

// vim:set ts=4 sw=4 fenc=UTF-8 ff=unix ft=javascript fdm=marker :
