// ==UserScript==
// @include http://wasavi.appsweets.net/
// @include http://wasavi.appsweets.net/?testmode
// @include https://ss1.xrea.com/wasavi.appsweets.net/
// ==/UserScript==
//
/**
 * wasavi: vi clone implemented in javascript
 * =============================================================================
 *
 *
 * @author akahuku@gmail.com
 */
/**
 * Copyright 2012-2015 akahuku, akahuku@gmail.com
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
	// letters of General_Category == Zs, in UnicodeData.txt of Unicode 6.2.0
	// and tab (U+0009)
	/*const*/var REGEX_ZS = new RegExp('[' + [
		'\\u0009',
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
		'\\u2E80-\\u2EFF',		// CJK Radicals Supplement
		'\\u2F00-\\u2FDF',		// CJK Radicals / KangXi Radicals
		'\\u2FF0-\\u2FFF',		// Ideographic Description Characters
		'\\u3100-\\u312F',		// Bopomofo
		'\\u31A0-\\u31BF',		// Bopomofo Extended
		'\\u31C0-\\u31EF',		// CJK Strokes
		'\\u3400-\\u4DBF',		// CJK Extension-A
		'\\u4E00-\\u9FCF',		// CJK Unified Ideographs (Han)
		'\\uF900-\\uFAFF',		// CJK Compatibility Ideographs
		//'\\u20000-\\u2A6DF',	// CJK Extension-B
		//'\\u2A700-\\u2B73F',	// CJK Extension-C
		//'\\u2B740-\\u2B81F',	// CJK Extension-D
		//'\\u2F800-\\u2FA1F',	// CJK Compatibility Ideographs Supplement

		/* Korean */
		'\\u1100-\\u11FF',		// Hangul Jamo
		'\\u3130-\\u318F',		// Hangul Compatibility Jamo
		'\\uA960-\\uA97F',		// Hangul Jamo Extended-A
		'\\uAC00-\\uD7AF',		// Hangul Syllables
		'\\uD7B0-\\uD7FF',		// Hangul Jamo Extended-B
		'\\uFFA0-\\uFFDC',		// Halfwidth Jamo

		/* Japanese */
		'\\u3040-\\u309F',		// Hiragana
		'\\u30A0-\\u30FF',		// Katakana
		'\\u3190-\\u319F',		// Kanbun
		'\\u31F0-\\u31FF',		// Katakana Phonetic Extensions
		'\\uFF65-\\uFF9F',		// Halfwidth Katakana
		//'\\u1B000-\\u1B0FF',	// Kana Supplement

		/* Lisu */
		'\\uA4D0-\\uA4FF',		// Lisu

		/* Miao */
		//'\\u16F00-\\u16F9F',	// Miao

		/* Yi */
		'\\uA000-\\uA48F',		// Yi Syllables
		'\\uA490-\\uA4CF'			// Yi Radicals
	].join('') + ']');

	// [^ZLN] of General Category in Scripts.txt of Unicode 6.2.0
	/*const*/var REGEX_NON_LETTER = new RegExp('[' + [
		'\\u0000-\\u001f\\u0021-\\u002f\\u003a-\\u0040\\u005b-\\u0060\\u007b-\\u009f\\u00a1-\\u00a9',
		'\\u00ab-\\u00b1\\u00b4\\u00b6-\\u00b8\\u00bb\\u00bf\\u00d7\\u00f7\\u02c2-\\u02c5\\u02d2-\\u02df',
		'\\u02e5-\\u02eb\\u02ed\\u02ef-\\u036f\\u0375\\u037e\\u0384\\u0385\\u0387\\u03f6\\u0482-\\u0489',
		'\\u055a-\\u055f\\u0589\\u058a\\u058f\\u0591-\\u05c7\\u05f3\\u05f4\\u0600-\\u0604\\u0606-\\u061b',
		'\\u061e\\u061f\\u064b-\\u065f\\u066a-\\u066d\\u0670\\u06d4\\u06d6-\\u06e4\\u06e7-\\u06ed',
		'\\u06fd\\u06fe\\u0700-\\u070d\\u070f\\u0711\\u0730-\\u074a\\u07a6-\\u07b0\\u07eb-\\u07f3',
		'\\u07f6-\\u07f9\\u0816-\\u0819\\u081b-\\u0823\\u0825-\\u0827\\u0829-\\u082d\\u0830-\\u083e',
		'\\u0859-\\u085b\\u085e\\u08e4-\\u08fe\\u0900-\\u0903\\u093a-\\u093c\\u093e-\\u094f\\u0951-\\u0957',
		'\\u0962-\\u0965\\u0970\\u0981-\\u0983\\u09bc\\u09be-\\u09c4\\u09c7\\u09c8\\u09cb-\\u09cd',
		'\\u09d7\\u09e2\\u09e3\\u09f2\\u09f3\\u09fa\\u09fb\\u0a01-\\u0a03\\u0a3c\\u0a3e-\\u0a42',
		'\\u0a47\\u0a48\\u0a4b-\\u0a4d\\u0a51\\u0a70\\u0a71\\u0a75\\u0a81-\\u0a83\\u0abc\\u0abe-\\u0ac5',
		'\\u0ac7-\\u0ac9\\u0acb-\\u0acd\\u0ae2\\u0ae3\\u0af0\\u0af1\\u0b01-\\u0b03\\u0b3c\\u0b3e-\\u0b44',
		'\\u0b47\\u0b48\\u0b4b-\\u0b4d\\u0b56\\u0b57\\u0b62\\u0b63\\u0b70\\u0b82\\u0bbe-\\u0bc2',
		'\\u0bc6-\\u0bc8\\u0bca-\\u0bcd\\u0bd7\\u0bf3-\\u0bfa\\u0c01-\\u0c03\\u0c3e-\\u0c44\\u0c46-\\u0c48',
		'\\u0c4a-\\u0c4d\\u0c55\\u0c56\\u0c62\\u0c63\\u0c7f\\u0c82\\u0c83\\u0cbc\\u0cbe-\\u0cc4',
		'\\u0cc6-\\u0cc8\\u0cca-\\u0ccd\\u0cd5\\u0cd6\\u0ce2\\u0ce3\\u0d02\\u0d03\\u0d3e-\\u0d44',
		'\\u0d46-\\u0d48\\u0d4a-\\u0d4d\\u0d57\\u0d62\\u0d63\\u0d79\\u0d82\\u0d83\\u0dca\\u0dcf-\\u0dd4',
		'\\u0dd6\\u0dd8-\\u0ddf\\u0df2-\\u0df4\\u0e31\\u0e34-\\u0e3a\\u0e3f\\u0e47-\\u0e4f\\u0e5a\\u0e5b',
		'\\u0eb1\\u0eb4-\\u0eb9\\u0ebb\\u0ebc\\u0ec8-\\u0ecd\\u0f01-\\u0f1f\\u0f34-\\u0f3f\\u0f71-\\u0f87',
		'\\u0f8d-\\u0f97\\u0f99-\\u0fbc\\u0fbe-\\u0fcc\\u0fce-\\u0fda\\u102b-\\u103e\\u104a-\\u104f',
		'\\u1056-\\u1059\\u105e-\\u1060\\u1062-\\u1064\\u1067-\\u106d\\u1071-\\u1074\\u1082-\\u108d',
		'\\u108f\\u109a-\\u109f\\u10fb\\u135d-\\u1368\\u1390-\\u1399\\u1400\\u166d\\u166e\\u169b\\u169c',
		'\\u16eb-\\u16ed\\u1712-\\u1714\\u1732-\\u1736\\u1752\\u1753\\u1772\\u1773\\u17b4-\\u17d6',
		'\\u17d8-\\u17db\\u17dd\\u1800-\\u180d\\u18a9\\u1920-\\u192b\\u1930-\\u193b\\u1940\\u1944\\u1945',
		'\\u19b0-\\u19c0\\u19c8\\u19c9\\u19de-\\u19ff\\u1a17-\\u1a1b\\u1a1e\\u1a1f\\u1a55-\\u1a5e',
		'\\u1a60-\\u1a7c\\u1a7f\\u1aa0-\\u1aa6\\u1aa8-\\u1aad\\u1b00-\\u1b04\\u1b34-\\u1b44\\u1b5a-\\u1b7c',
		'\\u1b80-\\u1b82\\u1ba1-\\u1bad\\u1be6-\\u1bf3\\u1bfc-\\u1bff\\u1c24-\\u1c37\\u1c3b-\\u1c3f',
		'\\u1c7e\\u1c7f\\u1cc0-\\u1cc7\\u1cd0-\\u1ce8\\u1ced\\u1cf2-\\u1cf4\\u1dc0-\\u1de6\\u1dfc-\\u1dff',
		'\\u1fbd\\u1fbf-\\u1fc1\\u1fcd-\\u1fcf\\u1fdd-\\u1fdf\\u1fed-\\u1fef\\u1ffd\\u1ffe\\u200b-\\u2027',
		'\\u202a-\\u202e\\u2030-\\u205e\\u2060-\\u2064\\u206a-\\u206f\\u207a-\\u207e\\u208a-\\u208e',
		'\\u20a0-\\u20ba\\u20d0-\\u20f0\\u2100\\u2101\\u2103-\\u2106\\u2108\\u2109\\u2114\\u2116-\\u2118',
		'\\u211e-\\u2123\\u2125\\u2127\\u2129\\u212e\\u213a\\u213b\\u2140-\\u2144\\u214a-\\u214d',
		'\\u214f\\u2190-\\u23f3\\u2400-\\u2426\\u2440-\\u244a\\u249c-\\u24e9\\u2500-\\u26ff\\u2701-\\u2775',
		'\\u2794-\\u2b4c\\u2b50-\\u2b59\\u2ce5-\\u2cea\\u2cef-\\u2cf1\\u2cf9-\\u2cfc\\u2cfe\\u2cff',
		'\\u2d70\\u2d7f\\u2de0-\\u2e2e\\u2e30-\\u2e3b\\u2e80-\\u2e99\\u2e9b-\\u2ef3\\u2f00-\\u2fd5',
		'\\u2ff0-\\u2ffb\\u3001-\\u3004\\u3008-\\u3020\\u302a-\\u3030\\u3036\\u3037\\u303d-\\u303f',
		'\\u3099-\\u309c\\u30a0\\u30fb\\u3190\\u3191\\u3196-\\u319f\\u31c0-\\u31e3\\u3200-\\u321e',
		'\\u322a-\\u3247\\u3250\\u3260-\\u327f\\u328a-\\u32b0\\u32c0-\\u32fe\\u3300-\\u33ff\\u4dc0-\\u4dff',
		'\\ua490-\\ua4c6\\ua4fe\\ua4ff\\ua60d-\\ua60f\\ua66f-\\ua67e\\ua69f\\ua6f0-\\ua6f7\\ua700-\\ua716',
		'\\ua720\\ua721\\ua789\\ua78a\\ua802\\ua806\\ua80b\\ua823-\\ua82b\\ua836-\\ua839\\ua874-\\ua877',
		'\\ua880\\ua881\\ua8b4-\\ua8c4\\ua8ce\\ua8cf\\ua8e0-\\ua8f1\\ua8f8-\\ua8fa\\ua926-\\ua92f',
		'\\ua947-\\ua953\\ua95f\\ua980-\\ua983\\ua9b3-\\ua9cd\\ua9de\\ua9df\\uaa29-\\uaa36\\uaa43',
		'\\uaa4c\\uaa4d\\uaa5c-\\uaa5f\\uaa77-\\uaa79\\uaa7b\\uaab0\\uaab2-\\uaab4\\uaab7\\uaab8',
		'\\uaabe\\uaabf\\uaac1\\uaade\\uaadf\\uaaeb-\\uaaf1\\uaaf5\\uaaf6\\uabe3-\\uabed\\ufb1e',
		'\\ufb29\\ufbb2-\\ufbc1\\ufd3e\\ufd3f\\ufdfc\\ufdfd\\ufe00-\\ufe19\\ufe20-\\ufe26\\ufe30-\\ufe52',
		'\\ufe54-\\ufe66\\ufe68-\\ufe6b\\ufeff\\uff01-\\uff0f\\uff1a-\\uff20\\uff3b-\\uff40\\uff5b-\\uff65'
	].join('') + ']');

	// Scripts of Unicode 6.2.0
	/*const*/var SCRIPT_TABLE = [
		0x0041, 0x005a,  1, // Latin
		0x0061, 0x007a,  1, // Latin
		0x00aa, 0x00aa,  1, // Latin
		0x00ba, 0x00ba,  1, // Latin
		0x00c0, 0x00d6,  1, // Latin
		0x00d8, 0x00f6,  1, // Latin
		0x00f8, 0x02b8,  1, // Latin
		0x02e0, 0x02e4,  1, // Latin
		0x02ea, 0x02eb,  2, // Bopomofo
		0x0300, 0x036f,  3, // Inherited
		0x0370, 0x0373,  4, // Greek
		0x0375, 0x037d,  4, // Greek
		0x0384, 0x0384,  4, // Greek
		0x0386, 0x0386,  4, // Greek
		0x0388, 0x03e1,  4, // Greek
		0x03e2, 0x03ef,  5, // Coptic
		0x03f0, 0x03ff,  4, // Greek
		0x0400, 0x0484,  6, // Cyrillic
		0x0485, 0x0486,  3, // Inherited
		0x0487, 0x0527,  6, // Cyrillic
		0x0531, 0x0587,  7, // Armenian
		0x058a, 0x058f,  7, // Armenian
		0x0591, 0x05f4,  8, // Hebrew
		0x0600, 0x060b,  9, // Arabic
		0x060d, 0x061a,  9, // Arabic
		0x061e, 0x061e,  9, // Arabic
		0x0620, 0x063f,  9, // Arabic
		0x0641, 0x064a,  9, // Arabic
		0x064b, 0x0655,  3, // Inherited
		0x0656, 0x065f,  9, // Arabic
		0x066a, 0x066f,  9, // Arabic
		0x0670, 0x0670,  3, // Inherited
		0x0671, 0x06dc,  9, // Arabic
		0x06de, 0x06ff,  9, // Arabic
		0x0700, 0x074f, 10, // Syriac
		0x0750, 0x077f,  9, // Arabic
		0x0780, 0x07b1, 11, // Thaana
		0x07c0, 0x07fa, 12, // Nko
		0x0800, 0x083e, 13, // Samaritan
		0x0840, 0x085e, 14, // Mandaic
		0x08a0, 0x08fe,  9, // Arabic
		0x0900, 0x0950, 15, // Devanagari
		0x0951, 0x0952,  3, // Inherited
		0x0953, 0x0963, 15, // Devanagari
		0x0966, 0x097f, 15, // Devanagari
		0x0981, 0x09fb, 16, // Bengali
		0x0a01, 0x0a75, 17, // Gurmukhi
		0x0a81, 0x0af1, 18, // Gujarati
		0x0b01, 0x0b77, 19, // Oriya
		0x0b82, 0x0bfa, 20, // Tamil
		0x0c01, 0x0c7f, 21, // Telugu
		0x0c82, 0x0cf2, 22, // Kannada
		0x0d02, 0x0d7f, 23, // Malayalam
		0x0d82, 0x0df4, 24, // Sinhala
		0x0e01, 0x0e3a, 25, // Thai
		0x0e40, 0x0e5b, 25, // Thai
		0x0e81, 0x0edf, 26, // Lao
		0x0f00, 0x0fd4, 27, // Tibetan
		0x0fd9, 0x0fda, 27, // Tibetan
		0x1000, 0x109f, 28, // Myanmar
		0x10a0, 0x10fa, 29, // Georgian
		0x10fc, 0x10ff, 29, // Georgian
		0x1100, 0x11ff, 30, // Hangul
		0x1200, 0x1399, 31, // Ethiopic
		0x13a0, 0x13f4, 32, // Cherokee
		0x1400, 0x167f, 33, // Canadian_Aboriginal
		0x1680, 0x169c, 34, // Ogham
		0x16a0, 0x16ea, 35, // Runic
		0x16ee, 0x16f0, 35, // Runic
		0x1700, 0x1714, 36, // Tagalog
		0x1720, 0x1734, 37, // Hanunoo
		0x1740, 0x1753, 38, // Buhid
		0x1760, 0x1773, 39, // Tagbanwa
		0x1780, 0x17f9, 40, // Khmer
		0x1800, 0x1801, 41, // Mongolian
		0x1804, 0x1804, 41, // Mongolian
		0x1806, 0x18aa, 41, // Mongolian
		0x18b0, 0x18f5, 33, // Canadian_Aboriginal
		0x1900, 0x194f, 42, // Limbu
		0x1950, 0x1974, 43, // Tai_Le
		0x1980, 0x19df, 44, // New_Tai_Lue
		0x19e0, 0x19ff, 40, // Khmer
		0x1a00, 0x1a1f, 45, // Buginese
		0x1a20, 0x1aad, 46, // Tai_Tham
		0x1b00, 0x1b7c, 47, // Balinese
		0x1b80, 0x1bbf, 48, // Sundanese
		0x1bc0, 0x1bff, 49, // Batak
		0x1c00, 0x1c4f, 50, // Lepcha
		0x1c50, 0x1c7f, 51, // Ol_Chiki
		0x1cc0, 0x1cc7, 48, // Sundanese
		0x1cd0, 0x1cd2,  3, // Inherited
		0x1cd4, 0x1ce0,  3, // Inherited
		0x1ce2, 0x1ce8,  3, // Inherited
		0x1ced, 0x1ced,  3, // Inherited
		0x1cf4, 0x1cf4,  3, // Inherited
		0x1d00, 0x1d25,  1, // Latin
		0x1d26, 0x1d2a,  4, // Greek
		0x1d2b, 0x1d2b,  6, // Cyrillic
		0x1d2c, 0x1d5c,  1, // Latin
		0x1d5d, 0x1d61,  4, // Greek
		0x1d62, 0x1d65,  1, // Latin
		0x1d66, 0x1d6a,  4, // Greek
		0x1d6b, 0x1d77,  1, // Latin
		0x1d78, 0x1d78,  6, // Cyrillic
		0x1d79, 0x1dbe,  1, // Latin
		0x1dbf, 0x1dbf,  4, // Greek
		0x1dc0, 0x1dff,  3, // Inherited
		0x1e00, 0x1eff,  1, // Latin
		0x1f00, 0x1ffe,  4, // Greek
		0x200c, 0x200d,  3, // Inherited
		0x2071, 0x2071,  1, // Latin
		0x207f, 0x207f,  1, // Latin
		0x2090, 0x209c,  1, // Latin
		0x20d0, 0x20f0,  3, // Inherited
		0x2126, 0x2126,  4, // Greek
		0x212a, 0x212b,  1, // Latin
		0x2132, 0x2132,  1, // Latin
		0x214e, 0x214e,  1, // Latin
		0x2160, 0x2188,  1, // Latin
		0x2800, 0x28ff, 52, // Braille
		0x2c00, 0x2c5e, 53, // Glagolitic
		0x2c60, 0x2c7f,  1, // Latin
		0x2c80, 0x2cff,  5, // Coptic
		0x2d00, 0x2d2d, 29, // Georgian
		0x2d30, 0x2d7f, 54, // Tifinagh
		0x2d80, 0x2dde, 31, // Ethiopic
		0x2de0, 0x2dff,  6, // Cyrillic
		0x2e80, 0x2fd5, 55, // Han
		0x3005, 0x3005, 55, // Han
		0x3007, 0x3007, 55, // Han
		0x3021, 0x3029, 55, // Han
		0x302a, 0x302d,  3, // Inherited
		0x302e, 0x302f, 30, // Hangul
		0x3038, 0x303b, 55, // Han
		0x3041, 0x3096, 56, // Hiragana
		0x3099, 0x309a,  3, // Inherited
		0x309d, 0x309f, 56, // Hiragana
		0x30a1, 0x30fa, 57, // Katakana
		0x30fd, 0x30ff, 57, // Katakana
		0x3105, 0x312d,  2, // Bopomofo
		0x3131, 0x318e, 30, // Hangul
		0x31a0, 0x31ba,  2, // Bopomofo
		0x31f0, 0x31ff, 57, // Katakana
		0x3200, 0x321e, 30, // Hangul
		0x3260, 0x327e, 30, // Hangul
		0x32d0, 0x3357, 57, // Katakana
		0x3400, 0x4db5, 55, // Han
		0x4e00, 0x9fcc, 55, // Han
		0xa000, 0xa4c6, 58, // Yi
		0xa4d0, 0xa4ff, 59, // Lisu
		0xa500, 0xa62b, 60, // Vai
		0xa640, 0xa69f,  6, // Cyrillic
		0xa6a0, 0xa6f7, 61, // Bamum
		0xa722, 0xa787,  1, // Latin
		0xa78b, 0xa7ff,  1, // Latin
		0xa800, 0xa82b, 62, // Syloti_Nagri
		0xa840, 0xa877, 63, // Phags_Pa
		0xa880, 0xa8d9, 64, // Saurashtra
		0xa8e0, 0xa8fb, 15, // Devanagari
		0xa900, 0xa92f, 65, // Kayah_Li
		0xa930, 0xa95f, 66, // Rejang
		0xa960, 0xa97c, 30, // Hangul
		0xa980, 0xa9df, 67, // Javanese
		0xaa00, 0xaa5f, 68, // Cham
		0xaa60, 0xaa7b, 28, // Myanmar
		0xaa80, 0xaadf, 69, // Tai_Viet
		0xaae0, 0xaaf6, 70, // Meetei_Mayek
		0xab01, 0xab2e, 31, // Ethiopic
		0xabc0, 0xabf9, 70, // Meetei_Mayek
		0xac00, 0xd7fb, 30, // Hangul
		0xf900, 0xfad9, 55, // Han
		0xfb00, 0xfb06,  1, // Latin
		0xfb13, 0xfb17,  7, // Armenian
		0xfb1d, 0xfb4f,  8, // Hebrew
		0xfb50, 0xfd3d,  9, // Arabic
		0xfd50, 0xfdfc,  9, // Arabic
		0xfe00, 0xfe0f,  3, // Inherited
		0xfe20, 0xfe26,  3, // Inherited
		0xfe70, 0xfefc,  9, // Arabic
		0xff21, 0xff3a,  1, // Latin
		0xff41, 0xff5a,  1, // Latin
		0xff66, 0xff6f, 57, // Katakana
		0xff71, 0xff9d, 57, // Katakana
		0xffa0, 0xffdc, 30  // Hangul
	];

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
			if (ch == target) return true;
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
	 * variables
	 */

	var scriptClassCache = {};
	var generalSpaceRegexCache = {};

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
	function getScriptClass (cp) {
		//                    0: space
		// (script-id << 8) | 1: letter (word component)
		// (script-id << 8) | 2: other

		var ch = String.fromCharCode(cp);
		if (ch in scriptClassCache)  return scriptClassCache[ch];
		if (isSpace(ch)) return 0;

		var result = isNonLetter(ch) ? 2 : 1;
		var low = 0;
		var high = SCRIPT_TABLE.length / 3 - 1;
		var mid;
		while (low <= high) {
			mid = Math.floor((low + high) / 2);
			if (cp < SCRIPT_TABLE[mid * 3]) {
				high = mid - 1;
			}
			else if (cp > SCRIPT_TABLE[mid * 3 + 1]) {
				low = mid + 1;
			}
			else {
				mid *= 3;
				if (0 <= mid && mid < SCRIPT_TABLE.length - 2
				&& SCRIPT_TABLE[mid] <= cp && cp <= SCRIPT_TABLE[mid + 1]) {
					result |= SCRIPT_TABLE[mid + 2] << 8;
				}
				break;
			}
		}

//console.log('getScriptClass: "' + toVisibleString(ch) + '" (' + cp + ',0x' + cp.toString(16) + '): script/' + (result >> 8) + ', class/' + (result & 255));
		return scriptClassCache[ch] = result;
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
	function isNonLetter (ch) {
		return REGEX_NON_LETTER.test(ch.charAt(0));
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

	function getUnicodeGeneralSpaceRegex (source, opts) {
		var g = /g/.test(opts);
		if (source in generalSpaceRegexCache && !g) {
			return generalSpaceRegexCache[source];
		}
		var s = source;
		s = s.replace(/S/, REGEX_ZS.source);
		s = s.replace(/(\[[^\[\]]*)\[/g, '$1');
		s = s.replace(/\]([^\[\]]*\])/g, '$1');
		if (g) {
			return new RegExp(s, opts);
		}
		else {
			return generalSpaceRegexCache[source] = new RegExp(s, opts);
		}
	}

	return Object.freeze({
		BREAK_PROP:BREAK_PROP,
		BREAK_ACTION:BREAK_ACTION,

		LineBreaker:LineBreaker,
		FfttDictionary:FfttDictionary,

		getScriptClass:getScriptClass,
		isSpace:isSpace,
		isClosedPunct:isClosedPunct,
		isSTerm:isSTerm,
		isPTerm:isPTerm,
		isIdeograph:isIdeograph,
		isNonLetter:isNonLetter,
		isHighSurrogate:isHighSurrogate,
		isLowSurrogate:isLowSurrogate,
		toUCS32:toUCS32,
		canBreak:canBreak,
		getUnicodeGeneralSpaceRegex:getUnicodeGeneralSpaceRegex
	});
})();
var spc = unicodeUtils.getUnicodeGeneralSpaceRegex;

// vim:set ts=4 sw=4 fenc=UTF-8 ff=unix ft=javascript fdm=marker :
