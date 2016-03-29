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
 * Copyright 2012-2016 akahuku, akahuku@gmail.com
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
 * prototype extension
 * ----------------
 */

Object.defineProperties(Array.prototype, {
	firstItem: {
		get:function () {return this[0]},
		set:function (v) {
			if (this.length) {
				this[0] = v;
			}
		}
	},
	lastItem: {
		get:function () {return this[this.length - 1]},
		set:function (v) {
			if (this.length) {
				this[this.length - 1] = v;
			}
		}
	}
});

/*
 * utility functions
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
function parseJson (src) {
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
	while (result.length < times) {
		result += result;
	}
	return result.length == times ? result : result.substring(0, letter.length * times);
}
function toVisibleString (s) {
	return (s || '')
		.replace(/[\u0000-\u001f\u007f]/g, function (a) {
			return a.charCodeAt(0) == 0x7f ? '^_' : '^' + String.fromCharCode(a.charCodeAt(0) + 64);
		})
		.replace(/\ue000/g, 'Fn:');
}
function toVisibleControl (s) {
	return typeof s == 'number' ?
		_toVisibleControl(s) :
		(s || '').replace(/[\u0000-\u001f\u007f]/g, function (a) {
			return _toVisibleControl(a.charCodeAt(0));
		});
}
function toNativeControl (s) {
	return typeof s == 'number' ?
		_toNativeControl(s) :
		(s || '').replace(/[\u2400-\u241f\u2421]/g, function (a) {
			return _toNativeControl(a.charCodeAt(0));
		});
}
function _toVisibleControl (code) {
	// U+2400 - U+243F: Unicode Control Pictures
	if (code == 0x7f) {
		return String.fromCharCode(0x2421);
	}
	if (code >= 0x00 && code <= 0x1f) {
		return String.fromCharCode(0x2400 + code);
	}
	return String.fromCharCode(code);
}
function _toNativeControl (code) {
	if (code == 0x2421) {
		return '\u007f';
	}
	if (code >= 0x2400 && code <= 0x241f) {
		return String.fromCharCode(code & 0x00ff);
	}
	return String.fromCharCode(code);
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
			if (arguments[2] === null) {
				elm.removeAttribute(name);
			}
			else {
				result = arguments[2].toString();
				elm.setAttribute(name, result);
			}
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
}
function _ () {
	var args = toArray(arguments);
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
function stacktrace () {
	var x = {};
	var result = '';
	try {
		x.y.z += 0;
	}
	catch (e) {
		if (e.stack) {
			result = e.stack;
			if (IS_GECKO) {
				result = result
					.replace(/\n\+/g, ' -> ')
					.replace(/(@).+?(:\d+:\d+)/g, '$1$2');
			}
			else if (window.opera) {
				result = result
					.replace(/^[^\n]+\n/, '')
					.replace(/@/g, '\t@')
					.replace(/<anonymous function:\s*([^>]+)>/g, '<$1>')
					.replace(/\(\[arguments not available\]\)/g, '(?)');
			}
		}
	}
	return result;
}
function getObjectType (a) {
    return Object.prototype.toString.call(a).replace(/^\[object\s+|\]$/g, '');
}
function isObject (a) {
	return getObjectType(a) == 'Object';
}
function isString (a) {
	return getObjectType(a) == 'String';
}
function isNumber (a) {
	return getObjectType(a) == 'Number';
}
function isBoolean (a) {
	return getObjectType(a) == 'Boolean';
}
function isArray (a) {
	// TODO: accept ducktyping?
	return getObjectType(a) == 'Array';
}
function isFunction (a) {
	return getObjectType(a) == 'Function';
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
				enumerable:true,
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
						enumerable:true
					});
					break;
				case 'Array':
					Object.defineProperty(target, j, {
						get:arguments[i][j][0],
						set:arguments[i][j][1],
						configurable:false,
						enumerable:true
					});
					break;
				default:
					Object.defineProperty(target, j, {
						value:arguments[i][j],
						configurable:false,
						enumerable:true,
						writable:false
					});
					break;
				}
			}
			break;
		}
	}
}
function toArray (arg, index) {
	return Array.prototype.slice.call(arg, index || 0);
}
function expr (source) {
	var tokens = [];
	var i = 0;

	function add () {
		var r = mul();
loop:	while (true) {
			switch (tokens[i++]) {
			case '+': r += mul(); break;
			case '-': r -= mul(); break;
			default: --i; break loop;
			}
		}
		return r;
	}
	function mul () {
		var r = fact();
loop:	while (true) {
			switch (tokens[i++]) {
			case '*': r *= fact(); break;
			case '/': r /= fact(); break;
			case '%': r %= fact(); break;
			default: --i; break loop;
			}
		}
		return r;
	}
	function fact () {
		var r = tokens[i++];
		if (r == '(') {
			r = add();
			if (tokens[i++] != ')') {
				throw new Error(_('Missing ")".'));
			}
		}
		else {
			var sign = '';
			if (r == '+' || r == '-') {
				sign = r;
				r = tokens[i++];
			}
			r = parseFloat(sign + r);
			if (isNaN(r)) {
				throw new Error(_('Missing a number.'));
			}
		}
		return r;
	}

	try {
		var regex = /^([()+\-*\/%]|(?:0|[1-9][0-9]*)\.[0-9]*(?:e[+-]?[0-9]+)*|\.[0-9]+(?:e[+-]?[0-9]+)*|(?:0|[1-9][0-9]*)(?:e[+-]?[0-9]+)*|0x[0-9a-f]+)\s*/i;
		var re;

		source = source.replace(/^\s+/, '');
		while ((re = regex.exec(source))) {
			tokens.push(re[1]);
			source = source.substring(re[0].length);
		}
		if (source != '') {
			throw new Error(_('Invalid token: {0}', source.charAt(0)));
		}
		if (tokens.length == 0) {
			return {};
		}

		var result = add();
		if (i < tokens.length) {
			throw new Error(_('Extra token: {0}', tokens[i].charAt(0)));
		}
		return {result: result};
	}
	catch (e) {
		return {error: e.message};
	}
}
var strftime = (function (global) {
	var weekdays = {
		long:'Sunday Monday Tuesday Wednesday Thursday Friday Saturday'.split(' '),
		short:'Sun Mon Tue Wed Thu Fri Sat'.split(' ')
	};
	var months = {
		long:'January February March April May June July August September October November December'.split(' '),
		short:'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ')
	};
	var nummap = {
		'_':function (s,w) {return s.length < w ? (multiply(' ', w) + s).substr(-w) : s},
		'-':function (s,w) {return s.replace(/^[ 0]+/, '') || '0'},
		'0':function (s,w) {return s.length < w ? (multiply('0', w) + s).substr(-w) : s}
	};
	var strmap = {
		'^':function (s) {return s.toUpperCase()},
		'#':function (s) {
			return s.replace(/./g, function ($0) {
				var l = $0.toLowerCase();
				var u = $0.toUpperCase();
				if (l != $0) return l;
				if (u != $0) return u;
				return $0;
			});
		}
	};
	var translators = {
		'%':function () {return '%'},
		a:function (d,l,f,w) {return ff(Intl.DateTimeFormat(l, {weekday:'short'}).format(d), f)},
		A:function (d,l,f,w) {return ff(Intl.DateTimeFormat(l, {weekday:'long'}).format(d), f)},
		b:function (d,l,f,w) {return ff(Intl.DateTimeFormat(l, {month:'short'}).format(d), f)},
		B:function (d,l,f,w) {return ff(Intl.DateTimeFormat(l, {month:'long'}).format(d), f)},
		c:function (d,l,f,w) {return ff(d.toLocaleString(), f)},
		C:function (d,l,f,w) {return ff(d.getFullYear().toString().substring(0, 2), setdef(f, '0'), w)},
		d:function (d,l,f,w) {return ff(d.getDate(), setdef(f, '0'), w || 2)},
		D:function (d,l,f,w) {return 'mdy'.split('').map(function(a){return this[a](d, l, f)}, this).join('/')},
		e:function (d,l,f,w) {return ff(d.getDate(), setdef(f, '_'), w || 2)},
		F:function (d,l,f,w) {return 'Ymd'.split('').map(function(a){return this[a](d, l, f)}, this).join('-')},
		g:function (d,l,f,w) {return ff((parseInt(this.G(d, '-', 0), 10)) % 100, setdef(f, '0'), w || 2)},
		G:function (d,l,f,w) {
			var y = d.getFullYear();
			var V = parseInt(this.V(d, '-', 0), 10);
			var W = parseInt(this.W(d, '-', 0), 10);
			if (W > V) y++;
			else if (W == 0 && V >= 52) y--;
			return ff(y, setdef(f, '0'), w || 4);
		},
		h:function (d,l,f,w) {return this.b(d,l,f,w)},
		H:function (d,l,f,w) {return ff(d.getHours(), setdef(f, '0'), w || 2)},
		I:function (d,l,f,w) {return ff(d.getHours() % 12, setdef(f, '0'), w || 2)},
		j:function (d,l,f,w) {return ff((Math.ceil((d.getTime() - (new Date(d.getFullYear(), 0, 1)).getTime()) / (24 * 60 * 60 * 1000))), setdef(f, '0'), w || 3)},
		k:function (d,l,f,w) {return ff(d.getHours(), setdef(f, '_'), w || 2)},
		l:function (d,l,f,w) {return ff(d.getHours() % 12, setdef(f, '_'), w || 2)},
		m:function (d,l,f,w) {return ff(d.getMonth() + 1, setdef(f, '0'), w || 2)},
		M:function (d,l,f,w) {return ff(d.getMinutes(), setdef(f, '0'), w || 2)},
		n:function (d,l,f,w) {return '\n'},
		p:function (d,l,f,w) {return ff(d.getHours() < 12 ? 'AM' : 'PM', f)},
		P:function (d,l,f,w) {return ff(this.p(d).toLowerCase(), f)},
		r:function (d,l,f,w) {return [this.I(d, l, '', 0), ':', this.M(d, l, '', 0), ':', this.S(d, l, '', 0), ' ', this.p(d, l, '', 0)].join('')},
		R:function (d,l,f,w) {return 'HM'.split('').map(function(a){return this[a](d, l, f)}, this).join(':')},
		s:function (d,l,f,w) {return ff(Math.floor(d.getTime() / 1000), setdef(f, '-'), 0)},
		S:function (d,l,f,w) {return ff(d.getSeconds(), setdef(f, '0'), w || 2)},
		t:function (d,l,f,w) {return '\t'},
		T:function (d,l,f,w) {return 'HMS'.split('').map(function(a){return this[a](d, l, f)}, this).join(':')},
		u:function (d,l,f,w) {return ff(d.getDay() == 0 ? 7 : d.getDay(), setdef(f, '0'), w || 0)},
		U:function (d,l,f,w) {return ff(Math.floor(((parseInt(this.j(d, l, '-', 0), 10)) + (6 - d.getDay())) / 7), setdef(f, '0'), w || 2)},
		V:function (d,l,f,w) {
			var woy = parseInt(this.W(d, l, '-', 0), 10);
			var dow1_1 = (new Date('' + d.getFullYear() + '/1/1')).getDay();
			var idow = woy + (dow1_1 > 4 || dow1_1 <= 1 ? 0 : 1);
			if (idow == 53 && (new Date('' + d.getFullYear() + '/12/31')).getDay() < 4) {
				idow = 1;
			}
			else if (idow === 0) {
				idow = this.V(new Date('' + (d.getFullYear() - 1) + '/12/31'), l, '-', 0);
			}
			return ff(idow, setdef(f, '0'), w || 2);
		},
		w:function (d,l,f,w) {return ff(d.getDay(), setdef(f, '0'), w || 1)},
		W:function (d,l,f,w) {return ff(parseInt(((parseInt(this.j(d, '-', 0), 10)) + (7 - this.u(d, '-', 0))) / 7, 10), setdef(f, '0'), w || 2)},
		x:function (d,l,f,w) {return ff(d.toLocaleDateString(), f)},
		X:function (d,l,f,w) {return ff(d.toLocaleTimeString(), f)},
		y:function (d,l,f,w) {return ff(d.getFullYear() % 100, setdef(f, '0'), w || 2)},
		Y:function (d,l,f,w) {return ff(d.getFullYear(), setdef(f, '0'), w || 4)},
		z:function (d,l,f,w) {
			var t = d.getTimezoneOffset();
			var sign = t < 0 ? '+' : '-';
			t = Math.abs(t);
			return sign + ('00' + Math.floor(t / 60)).substr(-2) + ('00' + (t % 60)).substr(-2);
		},
		Z:function (d,l,f,w) {return ff(Intl.DateTimeFormat(l, {timeZoneName:'long'}).format(d), f)}
	}
	function setdef (f, def) {
		f = (f || '').replace(/[^_\-0^#]/g, '');
		return f == '' ? def : f;
	}
	function ff (s, f, w) {
		s = '' + s;
		if (isNumber(w) && w > 1 && /^\d+$/.test(s) && f in nummap) {
			s = nummap[f](s, w);
		}
		else if (f in strmap) {
			s = strmap[f](s);
		}
		return s;
	}
	function strftime () {
		var format = arguments[0];
		var datetime = arguments[1] || new Date;
		var locale;
		if (!isString(format)) return false;
		if (!(datetime instanceof Date)) return false;
		return format
			.replace(/%\{locale:([^}]+)\}/g, function ($0, alocale) {
				if (locale == undefined) {
					locale = alocale;
				}
				else if (isArray(locale)) {
					locale.push(alocale);
				}
				else {
					locale = [locale];
					locale.push(alocale);
				}
				return '';
			})
			.replace(/%([_\-0^#]?)(\d*)(.)/g, function ($0, f, w, key) {
				try {
					return key in translators ?
						translators[key](datetime, locale, f, parseInt(w, 10) || 0) :
						key;
				}
				catch (e) {
					return $0;
				}
			});
	}
	if (typeof Intl == 'undefined') {
		global.Intl = {
			DateTimeFormat:function (locale, opts) {
				return {
					format:function (d) {
						if ('weekday' in opts) return weekdays[opts.weekday][d.getDay()];
						if ('month' in opts) return months[opts.month][d.getMonth()];
						return '*Intl-fallback*';
					}
				}
			}
		};
	}
	return strftime;
})(this);
function minmax (min, value, max) {
	return Math.max(min, Math.min(value, max));
}

// vim:set ts=4 sw=4 fenc=UTF-8 ff=unix ft=javascript fdm=marker :
