/**
 * page-memorandum manager for wasavi
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

	function Memorandum (options) {
		var URL_MAX = 10;

		var ext = require('./kosian/Kosian').Kosian();
		var SHA1 = require('./kosian/SHA1').SHA1;
		options || (options = {urlMax: URL_MAX});

		function get (url) {
			var content = ext.storage.getItem(getKey(url));
			if (content) {
				content = content.substring(content.indexOf('\t') + 1);
			}
			return content;
		}

		function set (url, content) {
			ext.storage.setItem(getKey(url), Date.now() + '\t' + content);
			purge();
		}

		function exists (url) {
			return ext.storage.exists(getKey(url));
		}

		function getKey (url) {
			return 'memo-' + SHA1.calc(url.replace(/#[^#]*/, ''));
		}

		function purge () {
			var keys = ext.storage.keys()
				.filter(function (key) {return key.indexOf('memo-') == 0})
				.sort(function (a, b) {
					return parseInt(ext.storage.getItem(a), 10) - parseInt(ext.storage.getItem(b), 10);
				});

			while (keys.length > options.urlMax) {
				ext.storage.setItem(keys[0], undefined);
				keys.shift();
			}
		}

		this.get = get;
		this.set = set;
		this.exists = exists;
	}

	exports.Memorandum = function (options) {
		return new Memorandum(options);
	};
})(this);

// vim:set ts=4 sw=4 fenc=UTF-8 ff=unix ft=javascript fdm=marker :
