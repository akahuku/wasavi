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
 * @version $Id: utils.js 430 2013-10-18 21:11:01Z akahuku $
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
 * prototype extension {{{ 1
 * ----------------
 */

Object.defineProperty(Array.prototype, 'lastItem', {
	get:function () {return this[this.length - 1]},
	set:function (v) {
		if (this.length) {
			this[this.length - 1] = v;
		}
	}
});

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
	return target.nodeName != 'INPUT';
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
function multiply (letter, times) {
	if (letter == '' || times <= 0) return '';
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
		s = toHyphen(s);
		s = 'data-' + s;
		s = s.toLowerCase();
		datasetNameCache[s] = s;
		return s;
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
	t.selectionStart = ss + ch.length;
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
function setTabStop (ts) {
	var editor = $(EDITOR_CORE_ID);
	if (!editor) return;

	ts || (ts = 8);
	var editorStyle = document.defaultView.getComputedStyle(editor, '');
	['OTabSize', 'MozTabSize', 'WebkitTabSize', 'MsTabSize', 'tabSize'].some(function (pn) {
		if (!(pn in editorStyle)) return false;
		editor.style[pn] = ts;
		['wasavi_singleline_scaler'].forEach(function (en) {
			en = $(en);
			if (en) en.style[pn] = ts;
		});
		return true;
	});
}
function stacktrace () {
	var x = {};
	var result = '';
	try {
		x.y.z += 0;
	}
	catch (e) {
		if (window.opera && e.stack) {
			result = e.stack
				.replace(/^[^\n]+\n/, '')
				.replace(/@/g, '\t@')
				.replace(/<anonymous function:\s*([^>]+)>/g, '<$1>')
				.replace(/\(\[arguments not available\]\)/g, '(?)');
		}
	}
	return result;
}
function getObjectType (a) {
    return Object.prototype.toString.call(a).replace(/^\[object\s+|\]$/g, '');
}
function publish () {
	if (arguments.length < 1) return;
	var target = arguments[0];
	for (var i = 1; i < arguments.length; i++) {
		switch (getObjectType(arguments[i])) {
		case 'Function':
			Object.defineProperty(target, arguments[i].name, {
				value:arguments[i],
				configurable:false,
				enumerable:false,
				writable:false
			});
			break;

		case 'Object':
			for (var j in arguments[i]) {
				switch (getObjectType(arguments[i][j])) {
					case 'Function':
					Object.defineProperty(target, j, {
						get:arguments[i][j],
						configurable:false,
						enumerable:false
					});
					break;
					case 'Array':
					Object.defineProperty(target, j, {
						get:arguments[i][j][0],
						set:arguments[i][j][1],
						configurable:false,
						enumerable:false
					});
					break;
					case 'Object':
					Object.defineProperty(target, j, arguments[i][j]);
					break;
				}
			}
			break;
		}
	}
}

// vim:set ts=4 sw=4 fenc=UTF-8 ff=unix ft=javascript fdm=marker :
