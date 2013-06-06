/**
 * utilities
 * =============================================================================
 *
 *
 * @author akahuku@gmail.com
 * @version $Id: WasaviUtils.js 300 2013-06-06 16:31:37Z akahuku $
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

'use strict';

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
	}
};

// vim:set ts=4 sw=4 fenc=UTF-8 ff=unix ft=javascript fdm=marker :
