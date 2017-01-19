/**
 * runtime overwrite settings
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

	function RuntimeOverwriteSettings (options) {
		var ROS_URL_MAX = 30;
		var ROS_MATCH_RATIO = 0.8;

		var ext = require('./kosian/Kosian').Kosian();
		var SHA1 = require('./kosian/SHA1').SHA1;
		var similarityComputer = require('./SimilarityComputer').SimilarityComputer();
		var cache;
		options || (options = {
			urlMax: ROS_URL_MAX,
			matchRatio: ROS_MATCH_RATIO
		});

		function getKeyParts (url, path) {
			var re = /^([^?#]*)([?#].*)?$/.exec(url);
			var query = re[2] || '';
			return {
				url:ext.isDev ? url : SHA1.calc(url),
				urlBase:ext.isDev ? re[1] : SHA1.calc(re[1]),
				query:query,
				queryData:similarityComputer.getNgram(query),
				nodePath:path
			};
		}

		function findCacheIndex (keyParts) {
			for (var i = 0, goal = cache.length; i < goal; i++) {
				if (cache[i].url == keyParts.url) {
					return i;
				}
			}
			return false;
		}

		function get (url, nodePath) {
			nodePath || (nodePath = '');
			if (nodePath == '') return '';

			if (!cache) {
				cache = ext.utils.parseJson(ext.storage.getItem('ros'), []);
			}
			if (!('length' in cache)) {
				cache = [];
			}

			var keyParts = getKeyParts(url, nodePath);
			var index = -1, qscoreMax = 0, pscoreMax = 0;
			for (var i = 0, goal = cache.length; i < goal; i++) {
				if (keyParts.url == cache[i].url) {
					index = i;
					break;
				}
				if (keyParts.urlBase != cache[i].urlBase) continue;

				var qscore = similarityComputer.getNgramRatio2(
					keyParts.query, cache[i].query,
					keyParts.queryData, cache[i].queryData);
				var pscore = similarityComputer.getLevenshteinRatio(
					keyParts.nodePath, cache[i].nodePath);

				if (qscore >= options.matchRatio && qscore > qscoreMax
				&&  pscore >= options.matchRatio && pscore > pscoreMax) {
					index = i;
					qscoreMax = qscore;
					pscoreMax = pscore;
				}
			}

			if (index >= 0) {
				var item = cache.splice(index, 1)[0];
				cache.unshift(item);
				return item.script;
			}

			return '';
		}

		function set (url, nodePath, script) {
			nodePath || (nodePath = '');
			if (nodePath == '') return;

			if (!cache) {
				cache = [];
			}

			var keyParts = getKeyParts(url, nodePath);
			var index = findCacheIndex(keyParts);
			var item = index === false ? keyParts : cache.splice(index, 1)[0];
			item.script = script;
			cache.unshift(item);

			while (cache.length > options.urlMax) {
				cache.pop();
			}

			ext.storage.setItem('ros', JSON.stringify(cache));
		}

		this.get = get;
		this.set = set;
	}

	function create (options) {
		return new RuntimeOverwriteSettings(options);
	}

	exports.RuntimeOverwriteSettings = create;
})(this);

// vim:set ts=4 sw=4 fenc=UTF-8 ff=unix ft=javascript fdm=marker :
