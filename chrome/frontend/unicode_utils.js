// ==UserScript==
// @include http://wasavi.appsweets.net/
// @include https://ss1.xrea.com/wasavi.appsweets.net/
// ==/UserScript==
//
/**
 * wasavi: vi clone implemented in javascript
 * =============================================================================
 *
 *
 * @author akahuku@gmail.com
 * @version $Id: unicode_utils.js 428 2013-10-10 14:33:51Z akahuku $
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

var unicodeUtils = (function () {
	/*const*/var LATIN1_PROPS = [
		'Cc', 'Cc', 'Cc', 'Cc', 'Cc', 'Cc', 'Cc', 'Cc',
		'Cc', 'Zs', 'Cc', 'Cc', 'Cc', 'Cc', 'Cc', 'Cc',
		'Cc', 'Cc', 'Cc', 'Cc', 'Cc', 'Cc', 'Cc', 'Cc',
		'Cc', 'Cc', 'Cc', 'Cc', 'Cc', 'Cc', 'Cc', 'Cc',
		'Zs', 'Po', 'Po', 'Po', 'Sc', 'Po', 'Po', 'Po', //  !"#$%&'
		'Ps', 'Pe', 'Po', 'Sm', 'Po', 'Pd', 'Po', 'Po', // ()*+,-./
		'Ld', 'Ld', 'Ld', 'Ld', 'Ld', 'Ld', 'Ld', 'Ld', // 01234567
		'Ld', 'Ld', 'Po', 'Po', 'Sm', 'Sm', 'Sm', 'Po', // 89:;<=>?
		'Po', 'Lu', 'Lu', 'Lu', 'Lu', 'Lu', 'Lu', 'Lu', // @ABCDEFG
		'Lu', 'Lu', 'Lu', 'Lu', 'Lu', 'Lu', 'Lu', 'Lu', // HIJKLMNO
		'Lu', 'Lu', 'Lu', 'Lu', 'Lu', 'Lu', 'Lu', 'Lu', // PQRSTUVW
		'Lu', 'Lu', 'Lu', 'Ps', 'Po', 'Pe', 'Sk', 'Pc', // XYZ[\]^_
		'Sk', 'Ll', 'Ll', 'Ll', 'Ll', 'Ll', 'Ll', 'Ll', // `abcdefg
		'Ll', 'Ll', 'Ll', 'Ll', 'Ll', 'Ll', 'Ll', 'Ll', // hijklmno
		'Ll', 'Ll', 'Ll', 'Ll', 'Ll', 'Ll', 'Ll', 'Ll', // pqrstuvw
		'Ll', 'Ll', 'Ll', 'Ps', 'Sm', 'Pe', 'Sm', 'Cc'  // xyz{|}~
	];

	// letters of General_Category == Zs, in UnicodeData.txt of Unicode 6.2.0
	/*const*/var REGEX_ZS = new RegExp('[' + [
		'\\u0020', '\\u00A0', '\\u1680', '\\u180E',
		'\\u2000', '\\u2001', '\\u2002', '\\u2003',
		'\\u2004', '\\u2005', '\\u2006', '\\u2007',
		'\\u2008', '\\u2009', '\\u200A', '\\u202F',
		'\\u205F', '\\u3000'
	].join('') + ']');

	// letters of General_Category == Pe, in UnicodeData.txt of Unicode 6.2.0
	/*const*/var REGEX_PE = new RegExp('[' + [
		'\\u0029', '\\u005D', '\\u007D', '\\u0F3B',
		'\\u0F3D', '\\u169C', '\\u2046', '\\u207E',
		'\\u208E', '\\u232A', '\\u2769', '\\u276B',
		'\\u276D', '\\u276F', '\\u2771', '\\u2773',
		'\\u2775', '\\u27C6', '\\u27E7', '\\u27E9',
		'\\u27EB', '\\u27ED', '\\u27EF', '\\u2984',
		'\\u2986', '\\u2988', '\\u298A', '\\u298C',
		'\\u298E', '\\u2990', '\\u2992', '\\u2994',
		'\\u2996', '\\u2998', '\\u29D9', '\\u29DB',
		'\\u29FD', '\\u2E23', '\\u2E25', '\\u2E27',
		'\\u2E29', '\\u3009', '\\u300B', '\\u300D',
		'\\u300F', '\\u3011', '\\u3015', '\\u3017',
		'\\u3019', '\\u301B', '\\u301E', '\\u301F',
		'\\uFD3F', '\\uFE18', '\\uFE36', '\\uFE38',
		'\\uFE3A', '\\uFE3C', '\\uFE3E', '\\uFE40',
		'\\uFE42', '\\uFE44', '\\uFE48', '\\uFE5A',
		'\\uFE5C', '\\uFE5E', '\\uFF09', '\\uFF3D',
		'\\uFF5D', '\\uFF60', '\\uFF63'
	].join('') + ']');

	// letters of STerm in PropList.txt of Unicode 6.2.0
	/*const*/var REGEX_STERM = new RegExp('[' + [
		'\\u0021',        '\\u002E',        '\\u003F',        '\\u055C',
		'\\u055E',        '\\u0589',        '\\u061F',        '\\u06D4',
		'\\u0700-\\u0702','\\u07F9',        '\\u0964-\\u0965','\\u104A-\\u104B',
		'\\u1362',        '\\u1367-\\u1368','\\u166E',        '\\u1735-\\u1736',
		'\\u1803',        '\\u1809',        '\\u1944-\\u1945','\\u1AA8-\\u1AAB',
		'\\u1B5A-\\u1B5B','\\u1B5E-\\u1B5F','\\u1C3B-\\u1C3C','\\u1C7E-\\u1C7F',
		'\\u203C-\\u203D','\\u2047-\\u2049','\\u2E2E',        '\\u3002',
		'\\uA4FF',        '\\uA60E-\\uA60F','\\uA6F3',        '\\uA6F7',
		'\\uA876-\\uA877','\\uA8CE-\\uA8CF','\\uA92F',        '\\uA9C8-\\uA9C9',
		'\\uAA5D-\\uAA5F','\\uAAF0-\\uAAF1','\\uABEB',        '\\uFE52',
		'\\uFE56-\\uFE57','\\uFF01',        '\\uFF0E',        '\\uFF1F',
		'\\uFF61'
	].join('') + ']');

	// letters of Terminal_Punctuation in PropList.txt of Unicode 6.2.0
	/*const*/var REGEX_PTERM = new RegExp('[' + [
		'\\u0021',        '\\u002C',        '\\u002E',        '\\u003A-\\u003B',
		'\\u003F',        '\\u037E',        '\\u0387',        '\\u0589',
		'\\u05C3',        '\\u060C',        '\\u061B',        '\\u061F',
		'\\u06D4',        '\\u0700-\\u070A','\\u070C',        '\\u07F8-\\u07F9',
		'\\u0830-\\u083E','\\u085E',        '\\u0964-\\u0965','\\u0E5A-\\u0E5B',
		'\\u0F08',        '\\u0F0D-\\u0F12','\\u104A-\\u104B','\\u1361-\\u1368',
		'\\u166D-\\u166E','\\u16EB-\\u16ED','\\u17D4-\\u17D6','\\u17DA',
		'\\u1802-\\u1805','\\u1808-\\u1809','\\u1944-\\u1945','\\u1AA8-\\u1AAB',
		'\\u1B5A-\\u1B5B','\\u1B5D-\\u1B5F','\\u1C3B-\\u1C3F','\\u1C7E-\\u1C7F',
		'\\u203C-\\u203D','\\u2047-\\u2049','\\u2E2E',        '\\u3001-\\u3002',
		'\\uA4FE-\\uA4FF','\\uA60D-\\uA60F','\\uA6F3-\\uA6F7','\\uA876-\\uA877',
		'\\uA8CE-\\uA8CF','\\uA92F',        '\\uA9C7-\\uA9C9','\\uAA5D-\\uAA5F',
		'\\uAADF',        '\\uAAF0-\\uAAF1','\\uABEB',        '\\uFE50-\\uFE52',
		'\\uFE54-\\uFE57','\\uFF01',        '\\uFF0C',        '\\uFF0E',
		'\\uFF1A-\\uFF1B','\\uFF1F',        '\\uFF61',        '\\uFF64'
	].join('') + ']');

	// ideographic letters
	/*const*/var REGEX_HAN_FAMILY = new RegExp('[' + [
		/* Chinese */
		'\\u3100-\\u312F',		// Bopomofo
		'\\u31A0-\\u31BF',		// Bopomofo Extended
		'\\u4E00-\\u9FCF',		// CJK Unified Ideographs (Han)
		'\\u3400-\\u4DBF',		// CJK Extension-A
		//'\\u20000-\\u2A6DF',	// CJK Extension-B
		//'\\u2A700-\\u2B73F',	// CJK Extension-C
		//'\\u2B740-\\u2B81F',	// CJK Extension-D
		'\\uF900-\\uFAFF',		// CJK Compatibility Ideographs
		//'\\u2F800-\\u2FA1F',	// CJK Compatibility Ideographs Supplement
		'\\u2F00-\\u2FDF',		// CJK Radicals / KangXi Radicals
		'\\u2E80-\\u2EFF',		// CJK Radicals Supplement
		'\\u31C0-\\u31EF',		// CJK Strokes
		'\\u2FF0-\\u2FFF',		// Ideographic Description Characters

		/* Korean */
		'\\u1100-\\u11FF',		// Hangul Jamo
		'\\uA960-\\uA97F',		// Hangul Jamo Extended-A
		'\\uD7B0-\\uD7FF',		// Hangul Jamo Extended-B
		'\\u3130-\\u318F',		// Hangul Compatibility Jamo
		'\\uFFA0-\\uFFDC',		// Halfwidth Jamo
		'\\uAC00-\\uD7AF',		// Hangul Syllables

		/* Japanese */
		'\\u3040-\\u309F',		// Hiragana
		'\\u30A0-\\u30FF',		// Katakana
		'\\u31F0-\\u31FF',		// Katakana Phonetic Extensions
		//'\\u1B000-\\u1B0FF',	// Kana Supplement
		'\\uFF65-\\uFF9F',		// Halfwidth Katakana
		'\\u3190-\\u319F',		// Kanbun

		/* Lisu */
		'\\uA4D0-\\uA4FF',		// Lisu

		/* Miao */
		//'\\u16F00-\\u16F9F',	// Miao

		/* Yi */
		'\\uA000-\\uA48F',		// Yi Syllables
		'\\uA490-\\uA4CF'			// Yi Radicals
	].join('') + ']');

	// line break property in Unicode 6.2.0
	/*const*/var BREAK_PROP = {
		OP:  0, CL:  1, CP:  2, QU:  3, GL:  4, NS:  5, EX:  6, SY:  7,
		IS:  8, PR:  9, PO: 10, NU: 11, AL: 12, HL: 13, ID: 14, IN: 15,
		HY: 16, BA: 17, BB: 18, B2: 19, ZW: 20, CM: 21, WJ: 22, H2: 23,
		H3: 24, JL: 25, JV: 26, JT: 27, RI: 28,

		BK:245, CR:246, LF:247, SG:248, CB:249, SP:250, NL:251, SA:252,
		AI:253, CJ:254, XX:255
	};

	// line break pair table in Unicode 6.2.0
	/*const*/var BREAK_PAIRS_TABLE = [
		'44444444444444444444434444444',
		'04411444411000001100424000000',
		'04411444411111001100424000000',
		'44411144411111111111424111111',
		'14411144411111111111424111111',
		'04411144400000001100424000000',
		'04411144400000001100424000000',
		'04411144400100001100424000000',
		'04411144400111001100424000000',
		'14411144400111101100424111110',
		'14411144400111001100424000000',
		'14411144411111011100424000000',
		'14411144400111011100424000000',
		'14411144400111011100424000000',
		'04411144401000011100424000000',
		'04411144400000011100424000000',
		'04410144400100001100424000000',
		'04410144400000001100424000000',
		'14411144411111111111424111111',
		'04411144400000001104424000000',
		'00000000000000000000400000000',
		'14411144400111011100424000000',
		'14411144411111111111424111111',
		'04411144401000011100424000110',
		'04411144401000011100424000010',
		'04411144401000011100424111100',
		'04411144401000011100424000110',
		'04411144401000011100424000010',
		'04411144400000001100424000001'
	];

	// line break action in Unicode 6.2.0
	/*const*/var BREAK_ACTION = {
		DIRECT:0,				// _: B / A
		INDIRECT:1,				// %: B x A and B SP+ / A
		COMBINING_INDIRECT:2,	// #: B x A and B SP+ / A (if A is class CM)
		COMBINING_PROHIBITED:3,	// @: B SP* x A (if A is class CM)
		PROHIBITED:4,			// ^: B SP* x A
		EXPLICIT:5				// !: B / A
	};

	/*
	 * classes
	 */

	function StringStream (s) {
		this.s = s || '';
		this.index = 0;
		this.goal = this.s.length;
	}
	StringStream.prototype = {
		get isEnd () {
			return this.index >= this.goal;
		},
		getItem: function () {
			var result = {
				codePoint:0,
				index:this.index,
				length:1
			};
			var cp = this.s.charCodeAt(this.index++), cp2;
			if (isHighSurrogate(cp)
			&& this.goal > this.index
			&& isLowSurrogate((cp2 = this.s.charCodeAt(this.index)))) {
				cp = toUCS32(cp, cp2);
				result.length++;
				this.index++;
			}
			// special wasavi behavior: control codes are stored as Unicode
			// Control Pitcures.
			else if (cp >= 0x2400 && cp <= 0x241f) {
				cp = cp & 0x00ff;
			}
			else if (cp == 0x2421) {
				cp = 0x007f;
			}
			result.codePoint = cp;
			return result;
		}
	};

	function LineBreakArray (s, dictData) {
		this.stream = new StringStream(s);
		this.dictData = dictData;
		this.items = [];
		this.cache = {};
	}
	LineBreakArray.prototype = {
		getProp: function (cp) {
			if (cp in this.cache) {
				return this.cache[cp];
			}

			var units = 7;
			var left = 0, right = ((this.dictData.length / units) >> 0) - 1;
			var middle, index, startcp, endcp;
			while (left <= right) {
				middle = ((left + right) / 2) >> 0;
				index = middle * units;
				startcp = pick3(this.dictData, index);
				endcp = pick3(this.dictData, index + 3);

				if (endcp < cp) {
					left = middle + 1;
				}
				else if (startcp > cp) {
					right = middle - 1;
				}
				else if (startcp <= cp && cp <= endcp) {
					return this.cache[cp] = this.dictData.charCodeAt(index + 6);
				}
			}
			return this.cache[cp] = BREAK_PROP.XX;
		},
		get: function (index) {
			while (this.items.length <= index && !this.stream.isEnd) {
				var item = this.stream.getItem();
				var prop = this.getProp(item.codePoint);
				// LB1 rule
				switch (prop) {
				case BREAK_PROP.AI:
				case BREAK_PROP.SG:
				case BREAK_PROP.XX:
					prop = BREAK_PROP.AL;
					break;
				case BREAK_PROP.SA:
					// TODO: distinguish general category: Mn/Mc
					prop = BREAK_PROP.AL;
					break;
				case BREAK_PROP.CJ:
					prop = BREAK_PROP.NS;
					break;
				case BREAK_PROP.CB:
					// experimental
					prop = BREAK_PROP.ID;
					break;
				}
				item.breakProp = prop;
				this.items.push(item);
			}
			return this.items[index] || false;
		}
	};

	function LineBreaker (dictData) {
		function findComplexBreak (props, prop, index, count) {
			if (count == 0) return 0;
			for (var i = 1; i < count; i++) {
				props.get(index + i - 1).breakAction = BREAK_ACTION.PROHIBITED;
				if (props.get(index + i).breakProp != BREAK_PROP.SA) {
					break;
				}
			}
			return i;
		}
		function run (s, callback) {
			var props = new LineBreakArray(s, dictData);
			if (props.get(0) === false) return props.items;
			typeof callback != 'function' && (callback = function () {});

			// class of 'before' character
			var prop = props.get(0).breakProp;

			// treat SP at start of input as if it followed a WJ
			if (prop == BREAK_PROP.SP) {
				prop = BREAK_PROP.WJ;
			}
			if (prop == BREAK_PROP.LF) {
				prop = BREAK_PROP.BK;
			}
			if (prop == BREAK_PROP.NL) {
				prop = BREAK_PROP.BK;
			}

			// loop over all pairs in the string up to a hard break
			for (var i = 1;
			props.get(i) !== false
			&& prop != BREAK_PROP.BK
			&& (prop != BREAK_PROP.CR || props.get(i).breakProp == BREAK_PROP.LF);
			i++) {
				var curProp = props.get(i).breakProp;

				// handle BK, NL and LF explicitly
				if (curProp == BREAK_PROP.BK
				||  curProp == BREAK_PROP.NL
				||  curProp == BREAK_PROP.LF) {
					props.get(i - 1).breakAction = BREAK_ACTION.PROHIBITED;
					prop = BREAK_PROP.BK;
					if (callback(props.get(i - 1)) === true) break;
					continue;
				}

				// handle CR explicitly
				if (curProp == BREAK_PROP.CR) {
					props.get(i - 1).breakAction = BREAK_ACTION.PROHIBITED;
					prop = BREAK_PROP.CR;
					if (callback(props.get(i - 1)) === true) break;
					continue;
				}

				// handle spaces explicitly
				if (curProp == BREAK_PROP.SP) {
					// apply rule LB7: x SP
					props.get(i - 1).breakAction = BREAK_ACTION.PROHIBITED;

					if (callback(props.get(i - 1)) === true) break;

					// do not update prop
					continue;
				}

				// handle complex scripts in a separate function
				if (curProp == BREAK_PROP.SA) {
					i += findComplexBreak(
						props, prop, i - 1, props.length - (i - 1));

					if (callback(props.get(i - 1)) === true) break;

					if (props.get(i) !== false) {
						prop = props.get(i).breakProp;
						continue;
					}
				}

				// look up pair table information in BREAK_PAIRS_TABLE [before, after];
				var breakAction;
				if (prop in BREAK_PAIRS_TABLE && curProp in BREAK_PAIRS_TABLE) {
					breakAction = BREAK_PAIRS_TABLE[prop].charAt(curProp) - 0;
				}
				else {
					breakAction = BREAK_ACTION.DIRECT;
				}

				// save break action in output array
				props.get(i - 1).breakAction = breakAction;

				// resolve indirect break
				if (breakAction == BREAK_ACTION.INDIRECT) {
					if (props.get(i - 1).breakProp == BREAK_PROP.SP) {
						props.get(i - 1).breakAction = BREAK_ACTION.INDIRECT;
					}
					else {
						props.get(i - 1).breakAction = BREAK_ACTION.PROHIBITED;
					}
				}

				// resolve combining mark break
				else if (breakAction == BREAK_ACTION.COMBINING_INDIRECT) {
					// do not break before CM
					props.get(i - 1).breakAction = BREAK_ACTION.PROHIBITED;
					if (props.get(i - 1).breakProp == BREAK_PROP.SP) {
						// new: space is not a base
						props.get(i - 1).breakAction = BREAK_ACTION.COMBINING_INDIRECT;
						/*
						// legacy: keep SP CM together
						props.get(i - 1).breakAction = BREAK_ACTION.PROHIBITED;
						if (i > 1) {
							props.get(i - 2).breakAction =
								props.get(i - 2).breakProp == BREAK_PROP.SP ?
									BREAK_ACTION.INDIRECT : BREAK_ACTION.DIRECT;
						}
						*/
						if (callback(props.get(i - 1)) === true) break;
					}
					else {
						if (callback(props.get(i - 1)) === true) break;
						continue;
					}
				}

				// this is the case OP SP* CM
				else if (breakAction == BREAK_ACTION.COMBINING_PROHIBITED) {
					// no break allowed
					props.get(i - 1).breakAction = BREAK_ACTION.COMBINING_PROHIBITED;
					if (props.get(i - 1).breakProp != BREAK_PROP.SP) {
						if (callback(props.get(i - 1)) === true) break;

						// apply rule LB9: X CM* -> X
						continue;
					}
				}

				// save prop of 'before' character (unless bypassed by 'continue')
				prop = curProp;
				if (callback(props.get(i - 1)) === true) break;
			}

			// always break at the end
			props.get(i - 1).breakAction = BREAK_ACTION.EXPLICIT;

			// purge invalid item
			while (!('breakAction' in props.items.lastItem)) {
				props.items.pop();
			}

			// return result
			return props.items;
			/*
			var last = props.items.lastItem;
			if (last.index + last.length >= s.length) {
				return props.items;
			}
			else {
				return props.items.concat(run(
					s.substring(last.index + last.length),
					callback
				));
			}
			*/
		}
		function dump (s, props) {
			var result = [];
			var fragment = '';
			for (var i = 0, goal = props.length; i < goal; i++) {
				fragment += s.substr(props[i].index, props[i].length);

				switch (props[i].breakAction) {
				case BREAK_ACTION.DIRECT:
				case BREAK_ACTION.INDIRECT:
				case BREAK_ACTION.COMBINING_INDIRECT:
				case BREAK_ACTION.EXPLICIT:
					result.push(
						'"' + toVisibleString(fragment) + '"' +
						' (' + props[i].breakAction + ')');
					fragment = '';
					break;
				}
			}
			return result.join('\n');
		}

		publish(this, run, dump);
	}

	function FfttDictionary (dictData) {
		var data = {}, cache = {};
		var handlers = {
			general: function (cp, data) {
				var index = find(cp, data, 3);
				if (index === false) return false;
				var result = {};
				result[data.charAt(index + 2)] = true;
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
					var index = find(cp, data, 5);
					if (index === false) return false;
					var result = {}, bits = pick3(data, index + 2);
					for (var i in packmap) {
						if (bits & (i - 0)) {
							result[packmap[i]] = true;
						}
					}
					return result;
				};
			})()
		};

		// private
		function nop () {}
		function find (cp, data, units) {
			var left = 0, right = ((data.length / units) >> 0) - 1;
			var middle, index, target;
			while (left <= right) {
				middle = ((left + right) / 2) >> 0;
				index = middle * units;
				target = pick2(data, index);

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
		function init () {
			if (!dictData) return;
			for (var i in dictData) {
				var m = 'add' + i + 'Data';
				m in this && this[m](dictData[i]);
			}
		}

		// public
		function addGeneralData (/*binary string*/d) {
			if (typeof d == 'string') {
				data.general = d;
			}
		}
		function addHanJaData (/*binary string*/d) {
			if (typeof d == 'string') {
				data.han_ja = d;
			}
		}
		function addData (/*string*/name, /*any*/d, /*function*/handler) {
			name = '' + name;
			data[name] = d;
			handlers[name] = typeof handler == 'function' ? handler : nop;
		}
		function get (/*string*/ch) {
			var result = false;
			if (ch.charCodeAt(0) <= 0x7f) {
				return result;
			}
			if (ch in cache) {
				return cache[ch];
			}
			for (var j in data) {
				var o = handlers[j](ch.charCodeAt(0), data[j]);
				if (!o) continue;
				if (result) {
					for (var k in o) {
						result[k] = o[k];
					}
				}
				else {
					result = o;
				}
			}
			return cache[ch] = result;
		}
		function match (/*string*/ch, /*string*/target) {
			var o = this.get(ch);
			return o && target in o;
		}

		//
		publish(this,
			addGeneralData, addHanJaData, addData,
			get, match
		);
		init.call(this);
	}

	/*
	 * functions
	 */

	function pick2 (data, index) {
		return data.charCodeAt(index)
			|  data.charCodeAt(index + 1) << 8;
	}
	function pick3 (data, index) {
		return data.charCodeAt(index)
			|  data.charCodeAt(index + 1) << 8
			|  data.charCodeAt(index + 2) << 16;
	}
	function getLatin1Prop (cp) {
		return cp <= 0x7f ? LATIN1_PROPS[cp] : '';
	}
	function getUnicodeBlock (cp) {
		if (cp >= 0x0000 && cp <= 0x007f) return   1;	// Basic Latin
		if (cp >= 0x0080 && cp <= 0x00ff) return   1;	// Latin-1 Supplement
		if (cp >= 0x0100 && cp <= 0x017f) return   1;	// Latin Extended-A
		if (cp >= 0x0180 && cp <= 0x024f) return   1;	// Latin Extended-B
		if (cp >= 0xa720 && cp <= 0xa7ff) return   1;	// Latin Extended-D
		if (cp >= 0x1e00 && cp <= 0x1eff) return   1;	// Latin Extended Additional
		if (cp >= 0x2c60 && cp <= 0x2c7f) return   1;	// Latin Extended-C

		if (cp >= 0x0250 && cp <= 0x02af) return   5;	// IPA Extensions
		if (cp >= 0x02b0 && cp <= 0x02ff) return   6;	// Spacing Modifier Letters

		if (cp >= 0x0300 && cp <= 0x036f) return   7;	// Combining Diacritical Marks
		if (cp >= 0x1dc0 && cp <= 0x1dff) return   7;	// Combining Diacritical Marks Supplement
		if (cp >= 0x20d0 && cp <= 0x20ff) return   7;	// Combining Diacritical Marks for Symbols

		if (cp >= 0x0370 && cp <= 0x03ff) return   8;	// Greek and Coptic
		if (cp >= 0x1f00 && cp <= 0x1fff) return   8;	// Greek Extended

		if (cp >= 0x0400 && cp <= 0x04ff) return   9;	// Cyrillic
		if (cp >= 0x0500 && cp <= 0x052f) return   9;	// Cyrillic Supplement
		if (cp >= 0x2de0 && cp <= 0x2dff) return   9;	// Cyrillic Extended-A
		if (cp >= 0xa640 && cp <= 0xa69f) return   9;	// Cyrillic Extended-B

		if (cp >= 0x0530 && cp <= 0x058f) return  11;	// Armenian
		if (cp >= 0x0590 && cp <= 0x05ff) return  12;	// Hebrew

		if (cp >= 0x0600 && cp <= 0x06ff) return  13;	// Arabic
		if (cp >= 0x0750 && cp <= 0x077f) return  13;	// Arabic Supplement
		if (cp >= 0xfb50 && cp <= 0xfdff) return  13;	// Arabic Presentation Forms-A
		if (cp >= 0xfe70 && cp <= 0xfeff) return  13;	// Arabic Presentation Forms-B

		if (cp >= 0x0700 && cp <= 0x074f) return  14;	// Syriac
		if (cp >= 0x0780 && cp <= 0x07bf) return  16;	// Thaana
		if (cp >= 0x07c0 && cp <= 0x07ff) return  17;	// NKo
		if (cp >= 0x0800 && cp <= 0x083f) return  18;	// Samaritan

		if (cp >= 0x0900 && cp <= 0x097f) return  19;	// Devanagari
		if (cp >= 0xa8e0 && cp <= 0xa8ff) return  19;	// Devanagari Extended

		if (cp >= 0x0980 && cp <= 0x09ff) return  20;	// Bengali
		if (cp >= 0x0a00 && cp <= 0x0a7f) return  21;	// Gurmukhi
		if (cp >= 0x0a80 && cp <= 0x0aff) return  22;	// Gujarati
		if (cp >= 0x0b00 && cp <= 0x0b7f) return  23;	// Oriya
		if (cp >= 0x0b80 && cp <= 0x0bff) return  24;	// Tamil
		if (cp >= 0x0c00 && cp <= 0x0c7f) return  25;	// Telugu
		if (cp >= 0x0c80 && cp <= 0x0cff) return  26;	// Kannada
		if (cp >= 0x0d00 && cp <= 0x0d7f) return  27;	// Malayalam
		if (cp >= 0x0d80 && cp <= 0x0dff) return  28;	// Sinhala
		if (cp >= 0x0e00 && cp <= 0x0e7f) return  29;	// Thai
		if (cp >= 0x0e80 && cp <= 0x0eff) return  30;	// Lao
		if (cp >= 0x0f00 && cp <= 0x0fff) return  31;	// Tibetan

		if (cp >= 0x1000 && cp <= 0x109f) return  32;	// Myanmar
		if (cp >= 0xaa60 && cp <= 0xaa7f) return  32;	// Myanmar Extended-A

		if (cp >= 0x10a0 && cp <= 0x10ff) return  33;	// Georgian
		if (cp >= 0x2d00 && cp <= 0x2d2f) return  33;	// Georgian Supplement

		if (cp >= 0x1100 && cp <= 0x11ff) return  34;	// Hangul Jamo
		if (cp >= 0x3130 && cp <= 0x318f) return  34;	// Hangul Compatibility Jamo
		if (cp >= 0xa960 && cp <= 0xa97f) return  34;	// Hangul Jamo Extended-A
		if (cp >= 0xac00 && cp <= 0xd7af) return  34;	// Hangul Syllables
		if (cp >= 0xd7b0 && cp <= 0xd7ff) return  34;	// Hangul Jamo Extended-B

		if (cp >= 0x1200 && cp <= 0x137f) return  35;	// Ethiopic
		if (cp >= 0x1380 && cp <= 0x139f) return  35;	// Ethiopic Supplement
		if (cp >= 0x2d80 && cp <= 0x2ddf) return  35;	// Ethiopic Extended

		if (cp >= 0x13a0 && cp <= 0x13ff) return  37;	// Cherokee

		if (cp >= 0x1400 && cp <= 0x167f) return  38;	// Unified Canadian Aboriginal Syllabics
		if (cp >= 0x18b0 && cp <= 0x18ff) return  38;	// Unified Canadian Aboriginal Syllabics Extended

		if (cp >= 0x1680 && cp <= 0x169f) return  39;	// Ogham
		if (cp >= 0x16a0 && cp <= 0x16ff) return  40;	// Runic
		if (cp >= 0x1700 && cp <= 0x171f) return  41;	// Tagalog
		if (cp >= 0x1720 && cp <= 0x173f) return  42;	// Hanunoo
		if (cp >= 0x1740 && cp <= 0x175f) return  43;	// Buhid
		if (cp >= 0x1760 && cp <= 0x177f) return  44;	// Tagbanwa
		if (cp >= 0x1780 && cp <= 0x17ff) return  45;	// Khmer
		if (cp >= 0x1800 && cp <= 0x18af) return  46;	// Mongolian
		if (cp >= 0x1900 && cp <= 0x194f) return  48;	// Limbu
		if (cp >= 0x1950 && cp <= 0x197f) return  49;	// Tai Le
		if (cp >= 0x1980 && cp <= 0x19df) return  50;	// New Tai Lue
		if (cp >= 0x19e0 && cp <= 0x19ff) return  51;	// Khmer Symbols
		if (cp >= 0x1a00 && cp <= 0x1a1f) return  52;	// Buginese
		if (cp >= 0x1a20 && cp <= 0x1aaf) return  53;	// Tai Tham
		if (cp >= 0x1b00 && cp <= 0x1b7f) return  54;	// Balinese
		if (cp >= 0x1b80 && cp <= 0x1bbf) return  55;	// Sundanese
		if (cp >= 0x1c00 && cp <= 0x1c4f) return  56;	// Lepcha
		if (cp >= 0x1c50 && cp <= 0x1c7f) return  57;	// Ol Chiki
		if (cp >= 0x1cd0 && cp <= 0x1cff) return  58;	// Vedic Extensions

		if (cp >= 0x1d00 && cp <= 0x1d7f) return  59;	// Phonetic Extensions
		if (cp >= 0x1d80 && cp <= 0x1dbf) return  59;	// Phonetic Extensions Supplement

		if (cp >= 0x2000 && cp <= 0x206f) return  64;	// General Punctuation
		if (cp >= 0x2070 && cp <= 0x209f) return  65;	// Superscripts and Subscripts
		if (cp >= 0x20a0 && cp <= 0x20cf) return  66;	// Currency Symbols
		if (cp >= 0x2100 && cp <= 0x214f) return  68;	// Letterlike Symbols
		if (cp >= 0x2150 && cp <= 0x218f) return  69;	// Number Forms

		if (cp >= 0x2190 && cp <= 0x21ff) return  70;	// Arrows
		if (cp >= 0x27f0 && cp <= 0x27ff) return  70;	// Supplemental Arrows-A
		if (cp >= 0x2900 && cp <= 0x297f) return  70;	// Supplemental Arrows-B

		if (cp >= 0x2200 && cp <= 0x22ff) return  71;	// Mathematical Operators
		if (cp >= 0x2a00 && cp <= 0x2aff) return  71;	// Supplemental Mathematical Operators

		if (cp >= 0x2300 && cp <= 0x23ff) return  72;	// Miscellaneous Technical
		if (cp >= 0x2400 && cp <= 0x243f) return  73;	// Control Pictures
		if (cp >= 0x2440 && cp <= 0x245f) return  74;	// Optical Character Recognition
		if (cp >= 0x2460 && cp <= 0x24ff) return  75;	// Enclosed Alphanumerics
		if (cp >= 0x2500 && cp <= 0x257f) return  76;	// Box Drawing
		if (cp >= 0x2580 && cp <= 0x259f) return  77;	// Block Elements
		if (cp >= 0x25a0 && cp <= 0x25ff) return  78;	// Geometric Shapes
		if (cp >= 0x2600 && cp <= 0x26ff) return  79;	// Miscellaneous Symbols
		if (cp >= 0x2700 && cp <= 0x27bf) return  80;	// Dingbats

		if (cp >= 0x27c0 && cp <= 0x27ef) return  81;	// Miscellaneous Mathematical Symbols-A
		if (cp >= 0x2980 && cp <= 0x29ff) return  81;	// Miscellaneous Mathematical Symbols-B

		if (cp >= 0x2800 && cp <= 0x28ff) return  83;	// Braille Patterns
		if (cp >= 0x2b00 && cp <= 0x2bff) return  87;	// Miscellaneous Symbols and Arrows
		if (cp >= 0x2c00 && cp <= 0x2c5f) return  88;	// Glagolitic
		if (cp >= 0x2c80 && cp <= 0x2cff) return  90;	// Coptic
		if (cp >= 0x2d30 && cp <= 0x2d7f) return  92;	// Tifinagh
		if (cp >= 0x2e00 && cp <= 0x2e7f) return  95;	// Supplemental Punctuation
		if (cp >= 0x2e80 && cp <= 0x2eff) return  96;	// CJK Radicals Supplement
		if (cp >= 0x2f00 && cp <= 0x2fdf) return  97;	// Kangxi Radicals
		if (cp >= 0x2ff0 && cp <= 0x2fff) return  98;	// Ideographic Description Characters
		if (cp >= 0x3000 && cp <= 0x303f) return  99;	// CJK Symbols and Punctuation
		if (cp >= 0x3040 && cp <= 0x309f) return 100;	// Hiragana
		if (cp >= 0x30a0 && cp <= 0x30ff) return 101;	// Katakana

		if (cp >= 0x3100 && cp <= 0x312f) return 102;	// Bopomofo
		if (cp >= 0x31a0 && cp <= 0x31bf) return 102;	// Bopomofo Extended

		if (cp >= 0x3190 && cp <= 0x319f) return 104;	// Kanbun
		if (cp >= 0x31c0 && cp <= 0x31ef) return 106;	// CJK Strokes
		if (cp >= 0x31f0 && cp <= 0x31ff) return 107;	// Katakana Phonetic Extensions
		if (cp >= 0x3200 && cp <= 0x32ff) return 108;	// Enclosed CJK Letters and Months
		if (cp >= 0x3300 && cp <= 0x33ff) return 109;	// CJK Compatibility
		if (cp >= 0x3400 && cp <= 0x4dbf) return 110;	// CJK Unified Ideographs Extension A
		if (cp >= 0x4dc0 && cp <= 0x4dff) return 111;	// Yijing Hexagram Symbols
		if (cp >= 0x4e00 && cp <= 0x9fff) return 112;	// CJK Unified Ideographs

		if (cp >= 0xa000 && cp <= 0xa48f) return 113;	// Yi Syllables
		if (cp >= 0xa490 && cp <= 0xa4cf) return 113;	// Yi Radicals

		if (cp >= 0xa4d0 && cp <= 0xa4ff) return 115;	// Lisu
		if (cp >= 0xa500 && cp <= 0xa63f) return 116;	// Vai
		if (cp >= 0xa6a0 && cp <= 0xa6ff) return 118;	// Bamum
		if (cp >= 0xa700 && cp <= 0xa71f) return 119;	// Modifier Tone Letters
		if (cp >= 0xa800 && cp <= 0xa82f) return 121;	// Syloti Nagri
		if (cp >= 0xa830 && cp <= 0xa83f) return 122;	// Common Indic Number Forms
		if (cp >= 0xa840 && cp <= 0xa87f) return 123;	// Phags-pa
		if (cp >= 0xa880 && cp <= 0xa8df) return 124;	// Saurashtra
		if (cp >= 0xa900 && cp <= 0xa92f) return 126;	// Kayah Li
		if (cp >= 0xa930 && cp <= 0xa95f) return 127;	// Rejang
		if (cp >= 0xa980 && cp <= 0xa9df) return 129;	// Javanese
		if (cp >= 0xaa00 && cp <= 0xaa5f) return 130;	// Cham
		if (cp >= 0xaa80 && cp <= 0xaadf) return 132;	// Tai Viet
		if (cp >= 0xabc0 && cp <= 0xabff) return 133;	// Meetei Mayek
		if (cp >= 0xd800 && cp <= 0xdb7f) return 136;	// High Surrogates             // TBD
		if (cp >= 0xdb80 && cp <= 0xdbff) return 137;	// High Private Use Surrogates // TBD
		if (cp >= 0xdc00 && cp <= 0xdfff) return 138;	// Low Surrogates              // TBD
		if (cp >= 0xe000 && cp <= 0xf8ff) return 139;	// Private Use Area
		if (cp >= 0xf900 && cp <= 0xfaff) return 140;	// CJK Compatibility Ideographs
		if (cp >= 0xfb00 && cp <= 0xfb4f) return 141;	// Alphabetic Presentation Forms
		if (cp >= 0xfe00 && cp <= 0xfe0f) return 143;	// Variation Selectors         // TBD
		if (cp >= 0xfe10 && cp <= 0xfe1f) return 144;	// Vertical Forms
		if (cp >= 0xfe20 && cp <= 0xfe2f) return 145;	// Combining Half Marks
		if (cp >= 0xfe30 && cp <= 0xfe4f) return 146;	// CJK Compatibility Forms
		if (cp >= 0xfe50 && cp <= 0xfe6f) return 147;	// Small Form Variants
		if (cp >= 0xff00 && cp <= 0xffef) return 149;	// Halfwidth and Fullwidth Forms
		if (cp >= 0xfff0 && cp <= 0xffff) return 150;	// Specials
		return 0;
	}
	function isSpace (ch) {
		return REGEX_ZS.test(ch.charAt(0));
	}
	function isClosedPunct (ch) {
		return REGEX_PE.test(ch.charAt(0));
	}
	function isSTerm (ch) {
		return REGEX_STERM.test(ch.charAt(0));
	}
	function isPTerm (ch) {
		return REGEX_PTERM.test(ch.charAt(0));
	}
	function isIdeograph (ch) {
		return REGEX_HAN_FAMILY.test(ch.charAt(0));
	}
	function isHighSurrogate (cp) {
		return cp >= 0xd800 && cp <= 0xdb7f;
	}
	function isLowSurrogate (cp) {
		return cp >= 0xdc00 && cp <= 0xdfff;
	}
	function toUCS32 (hcp, lcp) {
		return ((hcp & 0x03c0) + 0x0040) << 10
			| (hcp & 0x003f) << 10
			| (lcp & 0x03ff);
	}
	function canBreak (act) {
		return act == BREAK_ACTION.DIRECT
			|| act == BREAK_ACTION.INDIRECT
			|| act == BREAK_ACTION.COMBINING_INDIRECT
			|| act == BREAK_ACTION.EXPLICIT;
	}

	return Object.freeze({
		BREAK_PROP:BREAK_PROP,
		BREAK_ACTION:BREAK_ACTION,

		LineBreaker:LineBreaker,
		FfttDictionary:FfttDictionary,

		getUnicodeBlock:getUnicodeBlock,
		getLatin1Prop:getLatin1Prop,
		isSpace:isSpace,
		isClosedPunct:isClosedPunct,
		isSTerm:isSTerm,
		isPTerm:isPTerm,
		isIdeograph:isIdeograph,
		isHighSurrogate:isHighSurrogate,
		isLowSurrogate:isLowSurrogate,
		toUCS32:toUCS32,
		canBreak:canBreak
	});
})();

// vim:set ts=4 sw=4 fenc=UTF-8 ff=unix ft=javascript fdm=marker :
