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
 * @version $Id: utils.js 221 2012-11-18 15:52:02Z akahuku $
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

/*
/*
 * utility functions {{{1
 * ----------------
 */

function $ (arg) {
	return typeof arg == 'string' ? document.getElementById(arg) : arg;
}
function $call () {
	for (var i = 0, goal = arguments.length; i < goal; i++) {
		typeof arguments[i] == 'function' && arguments[i]();
	}
}
function extend (dest, src) {
	for (var p in src) {
		dest[p] = src[p];
	}
	return dest;
}
function serializeGeneral (obj) {
	if (obj == null) {
		return null;
	}
	else if (obj == undefined || typeof obj == 'function') {
		return undefined;
	}
	else if (typeof obj == 'boolean' || typeof obj == 'number') {
		return obj;
	}
	else if (obj instanceof RegExp) {
		return '""RegExp:' + obj.toString() + ':RegExp""';
	}
	else if (obj instanceof Date) {
		return '""Date:' + obj.getTime() + ':Date""';
	}
	else if (obj instanceof Array) {
		var result = [];
		for (var i = 0; i < obj.length; i++) {
			if (typeof obj[i] == 'function') {continue;}
			result.push(serializeGeneral(obj[i]));
		}
		return result;
	}
	else if (obj instanceof Object) {
		var result = {};
		for (var i in obj) {
			if (!obj.hasOwnProperty(i)) {continue;}
			if (typeof obj[i] == 'function') {continue;}
			result[i] = serializeGeneral(obj[i]);
		}
		return result;
	}
	else {
		return obj.toString();
	}
}
function unserializeGeneral (src) {
	try {
		src = JSON.parse(src);
	}
	catch (e) {
		src = null;
	}
	return src;
}
function removeChild () {
	for (var i = 0; i < arguments.length; i++) {
		var elm = $(arguments[i]);
		elm && elm.parentNode && elm.parentNode.removeChild(elm);
	}
}
function isMultilineTextInput (target) {
	return target.nodeName.toLowerCase() == 'textarea';
}
function reverseObject (o) {
	var result = {};
	for (var i in o) {result[o[i]] = i;}
	return result;
}
function style (src, styles) {
	for (var i in styles) {
		src.style[i] = styles[i];
	}
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
function getLatin1Prop (cp) {
	return cp <= 0x7f ? LATIN1_PROPS[cp] : '';
}
function multiply (letter, times) {
	if (times <= 0) return '';
	var result = letter;
	while (result.length * 2 <= times) {
		result += result;
	}
	while (result.length < times) {
		result += letter;
	}
	return result;
}
function toVisibleString (s) {
	return (s || '')
		.replace(/[\u0000-\u001f\u007f]/g, function (a) {
			return a.charCodeAt(0) == 0x7f ? '^_' : '^' + String.fromCharCode(a.charCodeAt(0) + 64);
		})
		.replace(/\ue000/g, 'Fn:');
}
function toVisibleControl (code) {
	// U+2400 - U+243F: Unicode Control Pictures
	if (code == 0x7f) {
		return String.fromCharCode(0x2421);
	}
	if (code >= 0x00 && code <= 0x1f) {
		return String.fromCharCode(0x2400 + code);
	}
	return String.fromCharCode(code);
}
function toNativeControl (s) {
	return s.replace(/[\u2400-\u241f]/g, function (a) {
		return String.fromCharCode(a.charCodeAt(0) & 0x00ff);
	}).replace(/\u2421/g, '\u007f');
}
function ensureNewline (s) {
	if (s.length && s.substr(-1) != '\n') {
		s += '\n';
	}
	return s;
}
function trimTerm (s, ch) {
	ch || (ch = '\n');
	if (s.length && s.substr(-1) == ch) {
		s = s.substring(0, s.length - 1);
	}
	return s;
}
function docScrollLeft () {
	return Math.max(document.documentElement.scrollLeft, document.body.scrollLeft);
}
function docScrollTop () {
	return Math.max(document.documentElement.scrollTop, document.body.scrollTop);
}
function docScrollWidth () {
	return Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
}
function docScrollHeight () {
	return Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
}
function docClientWidth () {
	return Math.min(document.documentElement.clientWidth, document.body.clientWidth)
}
function docClientHeight () {
	return Math.min(document.documentElement.clientHeight, document.body.clientHeight)
}
var dataset = (function () {
	var datasetNameCache = {};
	var nameRegex = /^[a-zA-Z]+$/;

	function toHyphen (s) {
		s = s.replace(/([a-z])([A-Z])/g, function ($0, $1, $2) {
			return $1 + '-' + $2.toLowerCase();
		});
		return s;
	}
	function getDatasetKey (s) {
		if (s in datasetNameCache) {
			return datasetNameCache[s];
		}
		else {
			s = toHyphen(s);
			s = 'data-' + s;
			s = s.toLowerCase();
			return datasetNameCache[s] = s;;
		}
	}

	return function (elm, name) {
		if (arguments.length < 2) {
			throw new Error('dataset: too few arguments.');
		}
		if (!elm) {
			throw new Error('dataset: invalid element.');
		}
		if (!nameRegex.test(name)) {
			throw new Error('dataset: invalid name.');
		}

		name = getDatasetKey(name);

		var result;

		if (arguments.length == 2) {
			result = elm.getAttribute(name);
		}
		else {
			result = arguments[2].toString();
			elm.setAttribute(name, result);
		}

		return result;
	};
})();
function emptyNodeContents (node) {
	node = $(node);
	if (!node) return;
	var r = document.createRange();
	r.selectNodeContents(node);
	r.deleteContents();
	r.detach();
}
function addClass (elem) {
	elem = $(elem);
	if (!elem) return;
	elem.className = (elem.className || '')
		.replace(/^\s+|\s+$/g, '')
		.split(/\s+/)
		.concat(Array.prototype.slice.call(arguments, 1))
		.reduce(function (r, v) {r.indexOf(v) < 0 && r.push(v); return r;}, [])
		.join(' ');
}
function removeClass (elem) {
	elem = $(elem);
	if (!elem) return;
	elem.className = (elem.className || '')
		.replace(/^\s+|\s+$/g, '')
		.split(/\s+/)
		.filter(function (v) {return this.indexOf(v) < 0;},
			Array.prototype.slice.call(arguments, 1))
		.join(' ');
}
function insertToLineInput (t, ch) {
	var ss = t.selectionStart;
	t.value = t.value.substring(0, t.selectionStart) + ch + t.value.substring(t.selectionEnd);
	t.selectionStart = ss + 1;
	t.selectionEnd = t.selectionStart;
}
function _ () {
	var args = Array.prototype.slice.call(arguments);
	var format = args.shift();
	return format.replace(/\{(?:([a-z]+):)?(\d+)\}/ig, function ($0, $1, $2) {
		if ($1 == undefined || $1 == '') {
			return args[$2];
		}
		// simple plural fix for english
		if (args[$2] == 1) {
			return $1;
		}
		if (/[hos]$/.test($1)) {
			return $1 + 'es';
		}
		if (/[^aeiou]y$/i.test($1)) {
			return $1.substr(0, $1.length - 1) + 'ies';
		}
		return $1 + 's';
	});
}

// vim:set ts=4 sw=4 fenc=UTF-8 ff=unix ft=javascript fdm=marker :
