/**
 * runtime overwrite settings
 * =============================================================================
 *
 *
 * @author akahuku@gmail.com
 * @version $Id: RuntimeOverwriteSettings.js 300 2013-06-06 16:31:37Z akahuku $
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

	var SHA1;
	var SimilarityComputer;
	var u;

	function RuntimeOverwriteSettings (extension) {
		var ROS_URL_MAX = 30;
		var ROS_MATCH_RATIO = 0.8;

		var similarityComputer = SimilarityComputer.create();
		var cache;

		function getKeyParts (url, path) {
			var re = /^([^?#]*)([?#].*)?$/.exec(url);
			var query = re[2] || '';
			return {
				url:extension.isDev ? url : SHA1.calc(url),
				urlBase:extension.isDev ? re[1] : SHA1.calc(re[1]),
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
				cache = u.parseJson(extension.storage.getItem('ros'), []);
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

				if (qscore >= ROS_MATCH_RATIO && qscore > qscoreMax
				&&  pscore >= ROS_MATCH_RATIO && pscore > pscoreMax) {
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

			while (cache.length > ROS_URL_MAX) {
				cache.pop();
			}

			extension.storage.setItem('ros', JSON.stringify(cache));
		}

		this.get = get;
		this.set = set;
	}

	function create (extension) {
		return new RuntimeOverwriteSettings(extension);
	}

	if (global.SHA1) {
		SHA1 = global.SHA1;
	}
	else if (typeof require == 'function') {
		SHA1 = require('./sha1').SHA1;
	}

	if (global.SimilarityComputer) {
		SimilarityComputer = global.SimilarityComputer;
	}
	else if (typeof require == 'function') {
		SimilarityComputer = require('./SimilarityComputer').SimilarityComputer;
	}

	if (global.WasaviUtils) {
		u = global.WasaviUtils;
	}
	else if (typeof require == 'function') {
		u = require('./WasaviUtils').WasaviUtils;
	}

	exports.RuntimeOverwriteSettings = {create:create};
})(this);

// vim:set ts=4 sw=4 fenc=UTF-8 ff=unix ft=javascript fdm=marker :
