/**
 * string similarity utility
 * =============================================================================
 *
 *
 * @author akahuku@gmail.com
 * @version $Id: SimilarityComputer.js 300 2013-06-06 16:31:37Z akahuku $
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

	function SimilarityComputer (unitSize) {
		this.unitSize = unitSize || 3;
	}

	SimilarityComputer.prototype = {
		getNgram: function (text) {
			text = text.replace(/\s/g, '');
			var result = {};
			for (var i = 0, goal = text.length - (this.unitSize - 1); i < goal; i++) {
				result[text.substr(i, this.unitSize)] = 1;
			}
			return result;
		},

		getCommonLength: function (t1ngram, t2ngram) {
			var result = 0;
			for (var i in t1ngram) {
				i in t2ngram && result++;
			}
			return result;
		},

		getUnionLength: function (t1ngram, t2ngram) {
			return Object.keys(t1ngram).length + Object.keys(t2ngram).length;
		},

		getNgramRatio: function (t1, t2) {
			var t1ngram, t2ngram;

			if (t1 && t2 && typeof t1 == 'object' && typeof t2 == 'object') {
				t1ngram = t1;
				t2ngram = t2;
			}
			else if (typeof t1 == 'string' && typeof t2 == 'string') {
				if (t1.length < this.unitSize || t2.length < this.unitSize) {
					return this.getLevenshteinRatio(t1, t2);
				}
				t1ngram = this.getNgram(t1 + '');
				t2ngram = this.getNgram(t2 + '');
			}
			else {
				throw new Error('invalid arguments');
			}

			var commonLength = this.getCommonLength(t1ngram, t2ngram);
			var unionLength = this.getUnionLength(t1ngram, t2ngram);
			var result = 2.0 * commonLength / unionLength;
			return result;
		},

		getLevenshteinRatio: function (t1, t2) {
			if (t1 == '' && t2 == '') return 1.0;

			var x = t1.length;
			var y = t2.length;
			var m = [];
			for (var i = 0; i <= x; i++) {
				m[i] = [];
				m[i][0] = i;
			}
			for (var i = 0; i <= y; i++) {
				m[0][i] = i;
			}
			for (var i = 1; i <= x; i++) {
				for (var j = 1; j <= y; j++) {
					var cost = t1.charAt(i - 1) == t2.charAt(j - 1) ? 0 : 1;
					m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + cost);
				}
			}
			var result = 1.0 - (m[x][y] / Math.max(x, y));
			return result;
		},

		getNgramRatio2: function (t1, t2, t1data, t2data) {
			if (t1.length < this.unitSize || t2.length < this.unitSize) {
				return this.getNgramRatio(t1, t2);
			}
			else {
				return this.getNgramRatio(t1data, t2data);
			}
		}
	};

	function create (unitSize) {
		return new SimilarityComputer(unitSize);
	}

	exports.SimilarityComputer = {create:create};
})();

// vim:set ts=4 sw=4 fenc=UTF-8 ff=unix ft=javascript fdm=marker :
