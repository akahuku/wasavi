/**
 * wasavi: vi clone implemented in javascript
 * =============================================================================
 *
 *
 * @author akahuku@gmail.com
 * @version $Id: fftt.js 241 2012-12-11 07:40:16Z akahuku $
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

exports.FfttDictionary = function () {
	var data = {}, cache = {};
	var handlers = {
		general: function (cp, data) {
			var result = {}, index = find(cp, data, 3);
			if (index === false) return false;
			result[String.fromCharCode(data[index + 2])] = true;
			return result;
		},
		han_ja: (function () {
			var packmap = {
				 0x000001: 'a'
				,0x000002: 'b'
				,0x000004: 'c'
				,0x000008: 'd'
				,0x000010: 'e'
				,0x000020: 'f'
				,0x000040: 'g'
				,0x000080: 'h'
				,0x000100: 'i'
				,0x000200: 'j'
				,0x000400: 'k'
				// omitted: l
				,0x000800: 'm'
				,0x001000: 'n'
				,0x002000: 'o'
				,0x004000: 'p'
				// omitted: q
				,0x008000: 'r'
				,0x010000: 's'
				,0x020000: 't'
				,0x040000: 'u'
				// omitted: v
				,0x080000: 'w'
				// omitted: x
				,0x100000: 'y'
				,0x200000: 'z'
			};
			return function (cp, data) {
				var result = {}, index = find(cp, data, 5);
				if (index === false) return false;
				var bits = data[index + 2] | data[index + 3] << 8 | data[index + 4] << 16;
				for (var i in packmap) {
					if (bits & (i - 0)) {
						result[packmap[i]] = true;
					}
				}
				return result;
			};
		})()
	};

	function nop () {}

	function find (cp, data, units) {
		var left = 0, right = ((data.length / units) >> 0) - 1;
		var middle, index, target;
		while (left <= right) {
			middle = ((left + right) / 2) >> 0;
			index = middle * units;
			target = data[index] | data[index + 1] << 8;

			if (target < cp) {
				left = middle + 1;
			}
			else if (target > cp) {
				right = middle - 1;
			}
			else {
				return index;
			}
		}
		return false;
	}

	this.addGeneralData = function (/*ArrayBuffer*/d) {
		if (d instanceof ArrayBuffer) {
			data.general = new Uint8Array(d);
		}
	};
	this.addHanJaData = function (/*ArrayBuffer*/d) {
		if (d instanceof ArrayBuffer) {
			data.han_ja = new Uint8Array(d);
		}
	};
	this.addData = function (/*string*/name, /*any*/d, /*function*/handler) {
		name = '' + name;
		data[name] = d;
		handlers[name] = typeof handler == 'function' ? handler : nop;
	};
	this.get = function (/*string*/s) {
		var result = {};
		if (typeof s != 'string') {
			s = '';
		}
		for (var i = 0, goal = s.length; i < goal; i++) {
			var ch = s.charAt(i);

			if (ch.charCodeAt(0) <= 0x7f || ch in result) {
				continue;
			}
			if (ch in cache) {
				if (cache[ch] !== false) {
					result[ch] = cache[ch];
				}
				continue;
			}
			for (var j in data) {
				var o = handlers[j](ch.charCodeAt(0), data[j]);
				if (!o) continue;
				if (result[ch]) {
					for (var k in o) {
						result[ch][k] = o[k];
					}
				}
				else {
					result[ch] = o;
				}
			}

			cache[ch] = result[ch] || false;
		}
		return result;
	};
};

// vim:set ts=4 sw=4 fenc=UTF-8 ff=unix ft=javascript fdm=marker :
