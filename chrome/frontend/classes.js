// ==UserScript==
// @include http://wasavi.appsweets.net/
// @include https://ss1.xrea.com/wasavi.appsweets.net/
// ==/UserScript==

/**
 * wasavi: vi clone implemented in javascript
 * =============================================================================
 *
 *
 * @author akahuku@gmail.com
 * @version $Id: classes.js 440 2013-11-07 09:53:47Z akahuku $
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

Wasavi.Position = function (row, col) {
	this.row = row;
	this.col = col;
}
Wasavi.Position.prototype = {
	toString: function () {
		return '[object Position(' + this.row + ',' + this.col + ')]';
	},
	clone: function () {
		return new Wasavi.Position(this.row, this.col);
	},
	round: function (t) {
		this.row = Math.max(0, Math.min(this.row, t.rowLength - 1));
		this.col = Math.max(0, Math.min(this.col, t.rows(this.row).length - (this.row == t.rowLength - 1 ? 0 : 1)));
		return this;
	},
	isp: function (o) {
		return o && (o instanceof Wasavi.Position || 'row' in o && 'col' in o);
	},
	eq: function (o) {
		return this.isp(o) && this.row == o.row && this.col == o.col;
	},
	ne: function (o) {
		return this.isp(o) && (this.row != o.row || this.col != o.col);
	},
	gt: function (o) {
		return this.isp(o) && (this.row > o.row || this.row == o.row && this.col > o.col);
	},
	lt: function (o) {
		return this.isp(o) && (this.row < o.row || this.row == o.row && this.col < o.col);
	},
	ge: function (o) {
		return this.isp(o) && (this.row > o.row || this.row == o.row && this.col >= o.col);
	},
	le: function (o) {
		return this.isp(o) && (this.row < o.row || this.row == o.row && this.col <= o.col);
	}
};

Wasavi.L10n = function (app, catalog) {
	var pluralFunctions;

	function getId (m) {
		return m.toLowerCase()
			.replace(/\{(\d+)\}/g, '@$1')
			.replace(/\{(\w+):\d+\}/g, '$1')
			.replace(/[^A-Za-z0-9_@ ]/g, '')
			.replace(/ +/g, '_');
	}
	function compile (expr) {
		pluralFunctions = [];

		var nodes = (expr || '').split(/\s*,\s*/);
		for (var i = 0, goal = nodes.length; i < goal; i++) {
			var re = /^(\w+)\(([^)]+)\)$/.exec(nodes[i]);
			if (!re) continue;
			pluralFunctions.push({name:re[1], value:re[2]});
		}
	}
	function getPluralSuffix (n) {
		for (var i = 0, goal = pluralFunctions.length; i < goal; i++) {
			switch (pluralFunctions[i].name) {
			case 'isone':
				if (n == 1) return pluralFunctions[i].value;
				break;
			}
		}
		return '';
	}
	function getPluralNoun (word, n) {
		var suffix = getPluralSuffix(n - 0);
		var id = '_plural_' + word + (suffix == '' ? '' : ('@' + suffix));
		if (catalog) {
			return id in catalog ? catalog[id].message : word;
		}
		else if (app.extensionChannel) {
			return app.extensionChannel.getMessage(id) || word;
		}
		return word;
	}
	function getMessage (messageId) {
		if (catalog) {
			if (messageId in catalog) {
				return catalog[messageId].message;
			}
			var id = getId(messageId);
			if (id in catalog) {
				catalog[messageId] = catalog[id];
				delete catalog[id];
				return catalog[messageId].message;
			}
		}
		else if (app.extensionChannel) {
			return app.extensionChannel.getMessage(getId(messageId)) || messageId;
		}
		return messageId;
	}
	function getTranslator () {
		return function () {
			var args = Array.prototype.slice.call(arguments);
			var format = getMessage(args.shift());
			return format.replace(/\{(?:([a-z]+):)?(\d+)\}/ig, function ($0, $1, $2) {
				return $1 == undefined || $1 == '' ?
					args[$2] : getPluralNoun($1, args[$2]);
			});
		};
	}
	function init () {
		var PLURAL_FUNCTION_SIGNATURE = '_plural_rule@function';
		var expressionString;

		if (catalog && PLURAL_FUNCTION_SIGNATURE in catalog) {
			expressionString = catalog[PLURAL_FUNCTION_SIGNATURE].message;
		}
		if (!expressionString && app.extensionChannel) {
			expressionString = app.extensionChannel.getMessage(PLURAL_FUNCTION_SIGNATURE);
		}

		compile(expressionString);
	}
	function dispose () {
		app = null;
	}

	publish(this, getMessage, getTranslator, dispose);
	init();
}

Wasavi.Configurator = function (app, internals, abbrevs) {
	function VariableItem (name, type, defaultValue, subSetter, isDynamic) {
		this.name = name;
		this.type = type;
		this.isLateBind = type == 'r';
		this.isDynamic = !!isDynamic;
		this.defaultValue = defaultValue;
		this.subSetter = subSetter;
		this.nativeValue = defaultValue;
	}
	VariableItem.prototype = {
		get value () {
			return this.nativeValue;
		},
		set value (v) {
			try {
				switch (this.type) {
				case 'b':
					v = Boolean(v);
					if (typeof v != 'boolean') throw new Error(_('Invalid boolean value'));
					break;
				case 'i':
					if (typeof v == 'string' && !/^[0-9]+$/.test(v)) {
						throw new Error(_('Invalid integer value'));
					}
					v = parseInt(v, 10);
					if (typeof v != 'number' || isNaN(v)) {
						throw new Error(_('Invalid integer value'));
					}
					break;
				case 'I':
					if (!/^[-+]?[0-9]+$/.test(v)) {
						throw new Error(_('Invalid integer value'));
					}
					v = parseInt(v, 10);
					if (typeof v != 'number' || isNaN(v)) {
						throw new Error(_('Invalid integer value'));
					}
					break;
				case 's':
					v = String(v);
					if (typeof v != 'string') throw new Error(_('Invalid string value'));
					break;
				case 'r':
					if (typeof v != 'string') throw new Error(_('Invalid regex source string value'));
					break;
				default:
					throw new Error('*Invalid type for value getter: ' + this.type + ' *');
				}
				if (this.subSetter) {
					v = this.subSetter(v);
				}
				this.nativeValue = v;
			}
			catch (e) {
				throw e;
			}
		},
		get visibleString () {
			switch (this.type) {
			case 'b':
				return (this.nativeValue ? '  ' : 'no') + this.name;
			case 'i': case 'I': case 's': case 'r':
				return '  ' + this.name + '=' + this.nativeValue.toString();
			default:
				throw new Error('*invalid type for visibleString: ' + this.type + ' *');
			}
		},
		getBinder: function () {
			switch (this.type) {
			case 'r':
				return (function (v) {
					return function () {
						return app.low.getFindRegex(v.nativeValue);
					}
				})(this);
			default:
				throw new Error('*invalid type for getBinder: ' + this.type + ' *');
			}
		}
	};

	var vars = {};
	var names = {};
	function init () {
		internals = internals.sort(function (a, b) {
			return a[0].localeCompare(b[0]);
		})
		.map(function (value, i) {
			for (var j = value.length; j < 4; j++) {
				value.push(undefined);
			}
			var v = new VariableItem(value[0], value[1], value[2], value[3], value[4]);
			names[v.name] = i;
			if (v.isLateBind) {
				v.value = v.nativeValue;
				Object.defineProperty(vars, v.name, {
					get:v.getBinder(),
					configurable:false,
					enumerable:true
				});
			}
			else {
				v.value = v.nativeValue;
				vars[v.name] = v.value;
			}
			return v;
		});
	}
	function getItem (name) {
		if (/^no/.test(name)) {
			name = name.substring(2);
		}
		if (name in abbrevs) {
			name = abbrevs[name];
		}
		return name in names ? internals[names[name]] : null;
	}

	//
	function getInfo (name) {
		var item = getItem(name);
		return item ? {name:item.name, type:item.type} : null;
	}
	function getData (name, reformat) {
		var item = getItem(name);
		return item ? (reformat ? item.visibleString : item.value) : null;
	}
	function setData (name, value) {
		var off = false;
		if (/^no/.test(name)) {
			name = name.substring(2);
			off = true;
		}
		var item = getItem(name);
		if (!item) {
			return _('Unknown option: {0}', name);
		}
		if (item.type == 'b') {
			if (value !== undefined) {
				return _('An extra value assigned to {0} option.', item.name);
			}
			item.value = !off;
		}
		else if (off) {
			return _('{0} option is not a boolean.', item.name);
		}
		else {
			try {
				item.value = value;
			}
			catch (e) {
				return e.message;
			}
		}
		vars[item.name] = item.value;
		return null;
	}
	function dump (cols, all) {
		var result = [_('*** options ***')];
		var phaseThreshold = 20;
		var gap = 1;
		for (var i = 0; i < 2; i++) {
			var maxLength = 0;
			var tmp = [];
			for (var j = 0; j < internals.length; j++) {
				var item = internals[j];
				var line = item.visibleString;
				if (!all && item.value == item.defaultValue) continue;
				if (i == 0 && line.length <= phaseThreshold - gap
				||  i == 1 && line.length >  phaseThreshold - gap) {
					tmp.push(line);
					if (line.length > maxLength) {
						maxLength = line.length;
					}
				}
			}
			if (i == 0) {
				var c = Math.max(1, Math.floor((cols + gap - 3) / (maxLength + gap)));
				var r = Math.floor((tmp.length + c - 1) / c);
				for (var j = 0; j < r; j++) {
					var tmpline = '';
					for (var k = 0; k < c; k++) {
						var index = k * r + j;
						if (index < tmp.length) {
							tmpline += tmp[index] +
								multiply(' ', maxLength + gap - tmp[index].length);
						}
					}
					result.push(tmpline);
				}
			}
			else {
				tmp.length && result.push(' ');
				for (var j = 0; j < tmp.length; j++) {
					result.push(tmp[j]);
				}
			}
		}
		return result;
	}
	function dumpData () {
		var result = [];
		var ab = reverseObject(abbrevs);
		for (var i = 0, goal = internals.length; i < goal; i++) {
			var v = internals[i];
			var type = '';
			switch (v.type) {
			case 'b': type = 'boolean'; break;
			case 'i': type = 'integer'; break;
			case 'I': type = 'natural number'; break;
			case 's': type = 'string'; break;
			case 'r': type = 'string (regal expression)'; break;
			}
			var tmp = {
				name:v.name,
				type:type,
				defaultValue:v.defaultValue
			};
			if (v.name in ab) {
				tmp.abbrev = ab[v.name];
			}
			result.push(tmp);
		}
		return result;
	}
	function dumpScript (modifiedOnly) {
		var result = [];
		for (var i = 0, goal = internals.length; i < goal; i++) {
			var v = internals[i];
			if (modifiedOnly && v.value == v.defaultValue) continue;
			if (v.isDynamic) continue;
			result.push('set ' + v.visibleString);
		}
		return result;
	}

	publish(this,
		getInfo, getData, setData, dump, dumpData, dumpScript,
		{
			vars:function () {return vars},
			abbrevs:function () {return abbrevs}
		}
	);
	init();
};

Wasavi.RegexConverter = function (app) {
	var flips = {
		// vi metacharacter -> js metacharacter
		'\\<': '\\b',
		'\\>': '\\b',
		'\\{': '{',
		'\\}': '}',
		'\\(': '(',
		'\\)': ')',
		'\\?': '?',
		'\\+': '+',
		'{':   '\\{',
		'}':   '\\}',
		'(':   '\\(',
		')':   '\\)',
		'(?':  '\\(\\?',
		'?':   '\\?',
		'+':   '\\+'
	};
	function toJsRegexString (s) {
		if (typeof s == 'string') {
			return s.replace(/\[(?:[^\]]|\\\])*\]|\\[?+<>{}()]|\(\?|[?+{}()]/g, function ($0) {
				return flips[$0] || $0;
			});
		}
		else if (s instanceof RegExp) {
			return s.source;
		}
		throw new Error('invalid regex source');
	}
	function toJsRegex (s, opts) {
		var result;
		try {
			result = new RegExp(toJsRegexString(s), opts || '');
		}
		catch (e) {
			result = null;
		}
		return result;
	}
	function getCS (s) {
		if (app.config.vars.smartcase && /[A-Z]/.test(s)) {
			return 'i';
		}
		return app.config.vars.ignorecase ? 'i' : '';
	}
	function getDefaultOption () {
		return {
			wrapscan: app.config.vars.wrapscan,
			magic: app.config.vars.magic
		};
	}

	publish(this, toJsRegexString, toJsRegex, getCS, getDefaultOption);
};

Wasavi.PrefixInput = function () {
	var register;
	var operation;
	var motion;
	var count1;
	var count2;
	var trailer;
	var isEmpty;
	var isLocked;

	function init () {
		if (arguments.length && typeof arguments[0] == 'string') {
			register = '';
			operation = '';
			motion = '';
			count1 = '';
			count2 = '';
			trailer = '';
			isEmpty = true;
			isLocked = false;

			do {
				var arg = arguments[0];
				var re = /^(".)?([1-9][0-9]*)?(g?.)([1-9][0-9]*)?(g?.)(.*)$/.exec(arg);
				if (re) {
					if (typeof re[1] == 'string' && re[1] != '') {
						register = re[1];
					}
					if (typeof re[2] == 'string' && re[2] != '') {
						count1 = re[2];
					}
					if (typeof re[3] == 'string' && re[3] != '') {
						operation = re[3];
					}
					if (typeof re[4] == 'string' && re[4] != '') {
						count2 = re[4];
					}
					if (typeof re[5] == 'string' && re[5] != '') {
						motion = re[5];
					}
					if (typeof re[6] == 'string' && re[6] != '') {
						trailer = re[6];
					}
					break;
				}

				var re = /^(".)?([1-9][0-9]*)?(g?.)(.*)$/.exec(arg);
				if (re) {
					if (typeof re[1] == 'string' && re[1] != '') {
						register = re[1];
					}
					if (typeof re[2] == 'string' && re[2] != '') {
						count2 = re[2];
					}
					if (typeof re[3] == 'string' && re[3] != '') {
						motion = re[3];
					}
					if (typeof re[4] == 'string' && re[4] != '') {
						trailer = re[4];
					}
					break;
				}

				throw new Error('PrefixInput: invalid initializer: ' + arg);

			} while (false);
		}
		else {
			var opts = arguments[0] || {};
			register = opts.register || '';
			operation = opts.operation || '';
			motion = opts.motion || '';
			count1 = opts.count1 || '';
			count2 = opts.count2 || '';
			trailer = opts.trailer || '';
			isEmpty = !!opts.isEmpty || true;
			isLocked = !!opts.isLocked || false;
		}
	}
	function reset () {
		if (isLocked) return;

		var list = {
			register:0,
			operation:0,
			motion:0,
			count1:0,
			count2:0,
			trailer:0,
			isEmpty:0,
			isLocked:0
		};

		if (arguments.length) {
			Array.prototype.forEach.call(arguments, function (a) {(a in list) && list[a]++;});
		}
		else {
			for (var a in list) {list[a]++;}
		}

		list['register']  && (register = '');
		list['operation'] && (operation = '');
		list['motion']    && (motion = '');
		list['count1']    && (count1 = '');
		list['count2']    && (count2 = '');
		list['trailer']   && (trailer = '');
		list['isEmpty']   && (isEmpty = true);
		list['isLocked']  && (isLocked = false);
	}
	function clone () {
		return new Wasavi.PrefixInput({
			register:register,
			operation:operation,
			motion:motion,
			count1:count1,
			count2:count2,
			trailer:trailer,
			isEmpty:isEmpty,
			isLocked:isLocked
		});
	}
	function assign (pi) {
		init({
			register:pi.register,
			operation:pi.operation,
			motion:pi.motion,
			count1:pi.count1,
			count2:pi.count2,
			trailer:pi.trailer,
			isEmpty:pi.isEmpty,
			isLocked:pi.isLocked
		});
	}
	function toString () {
		return register + count1 + operation + count2 + motion + trailer;
	}
	function toVisibleString () {
		return [register, count1, operation, count2, motion, trailer]
			.map(function (s) {return window.toVisibleString(s);})
			.join('');
	}

	function appendRegister (v) {
		if (isLocked || v == '') return;
		register += v;
		isEmpty = false;
	}
	function appendOperation (v) {
		if (isLocked || v == '') return;
		operation += v;
		isEmpty = false;
	}
	function appendMotion (v) {
		if (isLocked || v == '') return;
		motion += v;
		isEmpty = false;
	}
	function appendTrailer (v) {
		if (isLocked || v == '') return;
		trailer += v;
		isEmpty = false;
	}
	function appendCount (v) {
		if (isLocked || v == '') return;
		if (operation == '') {
			if (count1 == '' && !/^[1-9]$/.test(v)) return;
			if (count1 != '' && !/^[0-9]$/.test(v)) return;
			count1 += (v + '');
		}
		else {
			if (!/^[0-9]$/.test(v)) return;
			count2 += (v + '');
		}
		isEmpty = false;
	}

	function setRegister (v) {
		if (isLocked || v == '' || register != '') return;
		register = v;
		isEmpty = false;
	}
	function setOperation (v) {
		if (isLocked || v == '' || operation != '') return;
		operation = v;
		isEmpty = false;
	}
	function setMotion (v) {
		if (isLocked || v == '' || motion != '') return;
		motion = v;
		isEmpty = false;
	}
	function setTrailer (v) {
		if (isLocked || v == '' || trailer != '') return;
		trailer = v;
		isEmpty = false;
	}
	function setLocked (v) {
		isLocked = v;
	}

	publish(this,
		reset, clone, assign, toString, toVisibleString,
		appendCount, appendRegister, appendOperation, appendMotion, appendTrailer,
		{
			register: [function () {return register.substring(1) || ''}, setRegister],
			operation: [function () {return operation}, setOperation],
			motion: [function () {return motion}, setMotion],
			count1: function () {return count1 || 0},
			count2: function () {return count2 || 0},
			count: function () {return (count1 || 1) * (count2 || 1)},
			trailer: [function () {return trailer}, setTrailer],
			isEmpty: function () {return isEmpty},
			isEmptyOperation: function () {return operation == ''},
			isCountSpecified: function () {return !!(count1 || count2)},
			isLocked: [function () {return isLocked}, setLocked],
		}
	);
	init.apply(null, arguments);
};

Wasavi.RegexFinderInfo = function () {
	var head;
	var direction;
	var offset;
	var scrollTop;
	var scrollLeft;
	var pattern;
	var verticalOffset;
	var text;
	var updateBound;

	function push (o) {
		head = o.head || '';
		direction = o.direction || 0;
		offset = o.offset || 0;
		scrollTop = o.scrollTop || 0;
		scrollLeft = o.scrollLeft || 0;
		updateBound = o.updateBound || false;
	}
	function setPattern (p, withOffset) {
		pattern = p;
		verticalOffset = undefined;

		if (withOffset) {
			var fragments = p.split(head);
			if (fragments.length >= 2 && fragments[fragments.length - 2].substr(-1) != '\\') {
				var re = /\s*([-+]?\d+)\s*$/.exec(fragments.lastItem);
				if (re) {
					verticalOffset = parseInt(re[1], 10);
				}
				fragments.pop();
				pattern = fragments.join(head);
			}
		}
	}

	publish(this,
		push, setPattern,
		{
			head: function () {return head},
			direction: function () {return direction},
			offset: function () {return offset},
			scrollTop: function () {return scrollTop},
			scrollLeft: function () {return scrollLeft},
			pattern: function () {return pattern},
			verticalOffset: function () {return verticalOffset},
			text: [function () {return text}, function (v) {text = v}],
			updateBound: function () {return updateBound}
		}
	);
};

Wasavi.LineInputHistories = function (app, maxSize, names, loadCallback, ignoreStorage) {
	var s;
	var name;
	var storageKey = 'wasavi_lineinput_histories';

	function serialize () {
		return JSON.stringify(serializeGeneral({s:s}));
	}
	function restore (src) {
		src = unserializeGeneral(src);
		if (!src || !(src instanceof Object)) return;

		var tmp = {};
		if ('s' in src && src.s instanceof Object) {
			src = src.s;
			for (var na in src) {
				if (!(na in src)) continue;;
				if (!(src[na] instanceof Object)) continue;;
				if (!(src[na].lines instanceof Array)) continue;;
				if (typeof src[na].current != 'number') continue;

				tmp[na] = {};
				tmp[na].lines = src[na].lines.filter(function (s) {
					return typeof s == 'string';
				}).slice(-maxSize);
				tmp[na].current = Math.min(Math.max(-1, Math.floor(src[na].current)), tmp[na].lines.length - 1);
			}
		}
		s = extend(s, tmp);
	}
	function save () {
		app.low.setLocalStorage(storageKey, serialize());
	}
	function load (callback) {
		s = {};
		names.forEach(function (na) {
			s[na] = {lines:[], current:-1};
		});
		app.low.getLocalStorage(storageKey, function (value) {
			!ignoreStorage && restore(value || '');
			callback && callback();
			callback = null;
		});
	}
	function push (line) {
		line || (line = '');
		if (line != '') {
			s[name].lines = s[name].lines.filter(function (s) {
				return s != line;
			});
			s[name].lines.push(line);
			while (s[name].lines.length > maxSize) {
				s[name].lines.shift();
			}
			s[name].current = s[name].lines.length - 1;
			save();
		}
	}
	function prev () {
		if (s[name].current > 0) {
			return s[name].lines[--s[name].current];
		}
		return null;
	}
	function next () {
		if (s[name].current < s[name].lines.length) {
			++s[name].current;
			if (s[name].current < s[name].lines.length) {
				return s[name].lines[s[name].current];
			}
		}
		return null;
	}

	publish(this,
		push, prev, next, save, load,
		{
			isInitial:[
				function () {return s[name].current == s[name].lines.length},
				function (v) {s[name].current = s[name].lines.length}
			],
			defaultName:[
				function () {return name},
				function (v) {
					if (v in s) {
						name = v;
						s[name].current = s[name].lines.length;
					}
					else {
						throw new Error('LineInputHistories: unregistered name: ' + name);
					}
				}
			],
			storageKey:function () {return storageKey}
		}
	);
	load(loadCallback);
	loadCallback = null;
};

Wasavi.KeyManager = function () {
	/*const*/var SPECIAL_KEYS = {
		/*
		 * TODO:
		 * internal code of special keys shoud be the following form:
		 * 0x800000 + index (no modifier keys)
		 * 0x810000 + index (with shift key)
		 * 0x820000 + index (with ctrl key)
		 * 0x830000 + index (with shift,ctrl key)
		 */
		8: 'bs',
		9: 'tab',
		13: 'enter',
		27: 'esc',

		33:'pageup', 34:'pagedown', 35:'end',  36:'home',   37:'left',
		38:'up',     39:'right',    40:'down', 45:'insert', 46:'delete',

		112: 'f1', 113:  'f2', 114:  'f3', 115:  'f4',
		116: 'f5', 117:  'f6', 118:  'f7', 119:  'f8',
		120: 'f9', 121: 'f10', 122: 'f11', 123: 'f12'
	};
	/*const*/var SPECIAL_KEY_CODES = {
		8:8,
		9:9,
		13:13,
		27:27,
		46:127
	};
	/*const*/var TRANSLATE_TABLE_WEBKIT = {
		'u+0008':  8,  'backspace': 8,
		'u+0009':  9,  'tab':       9,
		'u+000d':  13, 'enter':     13,
		'u+001b':  27, 'esc':       27,

		'pageup':33, 'pagedown':34, 'end': 35, 'home':  36, 'left':  37,
		'up':    38, 'right':   39, 'down':40, 'insert':45, 'u+007f':46,

		'f1':112, 'f2': 113, 'f3': 114, 'f4': 115,
		'f5':116, 'f6': 117, 'f7': 118, 'f8': 119,
		'f9':120, 'f10':121, 'f11':122, 'f12':123
	};
	/*const*/var ENABLE_LOG = false;

	var target;
	var specialKeyName;
	var specialKeyCode;
	var inputEventHandlers = [];
	var lastReceivedEvent = '';
	var lastFiredEvent = '';
	var bufferedStrokes = [];

	// for general composition
	var lastValue = '';
	var isInComposition = false;
	var isPreserve = false;
	var keyDownCode = -1;
	var compositionResult = null;
	var compositStartEventHandlers = [];
	var compositUpdateEventHandlers = [];
	var compositEndEventHandlers = [];

	// for composition on opera
	var compositionStartPos = -1;
	var lastCompositionLength = -1;
	var inputEventInvokedCount = 0;
	var keydownStack = [];
	var keyupStack = [];

	// publics
	function install (handler) {
		addEventListener('input', handler);
		document.addEventListener('keydown', handleKeydown, true);
		document.addEventListener('keypress', handleKeypress, true);
		document.addEventListener('keyup', getKeyupHandler(), true);
		document.addEventListener('compositionstart', handleCompStart, true);
		document.addEventListener('compositionupdate', handleCompUpdate, true);
		document.addEventListener('compositionend', handleCompEnd, true);
		document.addEventListener('input', getInputHandler(), true);
	}
	function uninstall () {
		document.removeEventListener('keydown', handleKeydown, true);
		document.removeEventListener('keypress', handleKeypress, true);
		document.removeEventListener('keyup', getKeyupHandler(), true);
		document.removeEventListener('compositionstart', handleCompStart, true);
		document.removeEventListener('compositionupdate', handleCompUpdate, true);
		document.removeEventListener('compositionend', handleCompEnd, true);
		document.removeEventListener('input', getInputHandler(), true);
	}
	function addEventListener (type, handler) {
		if (typeof handler != 'function') return;
		var handlers = getHandlers(type);
		var index = handlers.indexOf(handler);
		if (index < 0) {
			handlers.push(handler);
		}
	}
	function removeEventListener (type, handler) {
		if (typeof handler != 'function') return;
		var handlers = getHandlers(type);
		var index = handlers.indexOf(handler);
		if (index >= 0) {
			handlers.splice(index, 1);
		}
	}
	function init (aleading) {
		if (!target) return;
		if (typeof aleading == 'object' && 'value' in aleading && 'selectionStart' in aleading) {
			var element = aleading;
			lastValue = aleading = element.value.substring(0, element.selectionStart);
			if (target != element && !isPreserve) {
				target.value = aleading;
			}
		}
		else {
			lastValue = target.value = aleading || '';
			if (!isPreserve) {
				target.value = lastValue;
			}
		}
		isInComposition = false;
		keyDownCode = -1;
		compositionResult = null;
		compositionStartPos = -1;
		lastCompositionLength = -1;
		inputEventInvokedCount = 0;
	}
	function dispose () {
		inputEventHandlers =
		compositStartEventHandlers =
		compositUpdateEventHandlers =
		compositEndEventHandlers = undefined;
		uninstall();
	}

	// event handlers
	function handleKeydown (e) {
		lastReceivedEvent = e.type;

		if (window.opera && e.keyCode == 229 && !e.__delayedTrace) {
			keydownStack.push([e, [], '']);
			//ENABLE_LOG && logit('[keydown] *** stacked: ' + e.keyCode + ', ' + keydownStack.length + ' ***');
			return;
		}

		keyDownCode = e.keyCode;
		inputEventInvokedCount = 0;
		if (e.shiftKey && e.keyCode == 16 || e.ctrlKey && e.keyCode == 17) return;
		ENABLE_LOG && logit('[keydown]\tkeyCode:' + e.keyCode + ', which:' + e.which + ', shift:' + e.shiftKey + ', ctrl:' + e.ctrlKey);
		if (window.chrome) {
			specialKeyName = false;

			// special keys
			if (specialKeyName === false) {
				var translated = TRANSLATE_TABLE_WEBKIT[e.keyIdentifier.toLowerCase()];
				if (translated !== undefined) {
					specialKeyName = SPECIAL_KEYS[translated] || false;
					specialKeyCode = SPECIAL_KEY_CODES[translated] || -translated;
				}
			}

			// ctrl code shortcuts: ctrl + *
			if (specialKeyName === false) {
				if (e.ctrlKey && (
					e.keyCode >= 64 && e.keyCode <= 95 ||
					e.keyCode >= 96 && e.keyCode <= 127 ||
					e.keyCode == 219)
				) {
					handleKeypress({
						shiftKey:e.shiftKey,
						ctrlKey:e.ctrlKey,
						keyCode:e.keyCode & 0x1f,
						preventDefault:function () {
							e.preventDefault();
						}
					});
				}
			}

			if (specialKeyName !== false) {
				if (isPasteKeyStroke(e)) return;
				handleKeypress(e);
			}
		}
		else {
			specialKeyName = e.keyCode == e.which && SPECIAL_KEYS[e.keyCode] ?
				SPECIAL_KEYS[e.keyCode] : false;
			specialKeyCode = SPECIAL_KEY_CODES[e.keyCode] || -e.keyCode;

			if (isPasteKeyStroke(e)) return;
			if (window.opera && specialKeyName !== false && e.keyCode != 13) {
				handleKeypress(e);
			}
		}
	}
	function handleKeypress (e) {
		'type' in e && (lastReceivedEvent = e.type);
		e.preventDefault();

		var c = [];
		var baseKeyName;
		var logicalCharCode;
		var isSpecial = false;

		if (specialKeyName) {
			if (isPasteKeyStroke(e)) return;
			e.shiftKey && c.push('s');
			e.ctrlKey  && c.push('c');
			baseKeyName = specialKeyName;
			c.push(specialKeyName);
			logicalCharCode = specialKeyCode;
			isSpecial = true;
		}
		else {
			var keyCode = e.keyCode || e.charCode;

			// ctrl code shortcuts: ctrl + *
			if (e.ctrlKey && (keyCode >= 64 && keyCode <= 95 || keyCode >= 97 && keyCode <= 127)) {
				baseKeyName = '^' + String.fromCharCode(keyCode & 0x5f);
				c.push(baseKeyName);
				logicalCharCode = keyCode & 0x1f;
			}
			else if (e.ctrlKey && keyCode == 32) {
				baseKeyName = '^@';
				c.push(baseKeyName);
				logicalCharCode = 0;
			}
			// printable chars
			else if (keyCode >= 32 && keyCode <= 127) {
				baseKeyName = String.fromCharCode(keyCode);
				c.push(baseKeyName);
				logicalCharCode = keyCode;
			}
			// ctrl code directly
			else if (keyCode >= 0 && keyCode <= 31) {
				if (window.opera
				&& keyCode != 8 && keyCode != 9 && keyCode != 13 && keyCode != 27) return;
				baseKeyName = '^' + String.fromCharCode(keyCode + 64);
				c.push(baseKeyName);
				logicalCharCode = keyCode;
			}
			// others
			else {
				baseKeyName = keyCode;
				c.push(baseKeyName);
				logicalCharCode = keyCode;
			}
		}

		fire('input', inputEventHandlers, {
			code:             logicalCharCode,
			identifier:       baseKeyName,
			fullIdentifier:   c.join('-'),
			shift:            e.shiftKey,
			ctrl:             e.ctrlKey,
			isSpecial:        isSpecial
		});
	}
	function handleKeyup (e) {
		/*if (e.keyCode == 16 || e.keyCode == 17) {
			return;
		}*/

		//ENABLE_LOG && logit('[  keyup]\tkeyCode:' + e.keyCode + ', which:' + e.which);
	}
	function handleKeyupOpera (e) {
		if (keydownStack.length) {
			keydownStack = keydownStack.filter(function (item) {return !item[0].repeat});
			if (keyupStack.length != keydownStack.length - 1 && !e.__delayedTrace) {
				keyupStack.push(e);
				//ENABLE_LOG && logit('[  keyup] *** stacked: ' + e.keyCode + ', ' + keydownStack.length + ' ***');
				return;
			}
			if (!e.__delayedTrace) {
				//ENABLE_LOG && logit('[  keyup] *** delayed tracing start. 1:' + keydownStack.length + ', 2:' + keyupStack.length + ' ***');
				while (keyupStack.length) {
					var keyup = keyupStack.shift();
					keyup.__delayedValue = e.target.value;
					var inputs = keydownStack.shift();
					inputs[0].__delayedTrace = true;
					handleKeydown(inputs[0]);
					for (var i = 0, goal = inputs[1].length; i < goal; i++) {
						inputs[1][i].__delayedTrace = true;
						keyup.__delayedValue = inputs[2];
						handleInputOpera(inputs[1][i]);
					}
					keyup.__delayedTrace = true;
					handleKeyupOpera(keyup);
				}
				//ENABLE_LOG && logit('[  keyup] *** delayed tracing end ***');
				if (keydownStack.length != 1 || keyupStack.length != 0) {
					//console.error('keyup: balance mismatch. 1:' + keydownStack.length + ', 2:' + keyupStack.length);
					return;
				}
				else {
					var inputs = keydownStack.shift();
					inputs[0].__delayedTrace = true;
					handleKeydown(inputs[0]);
					for (var i = 0, goal = inputs[1].length; i < goal; i++) {
						inputs[1][i].__delayedTrace = true;
						handleInputOpera(inputs[1][i]);
					}
				}
			}
		}

		if (e.keyCode == 16 || e.keyCode == 17) return;
		//ENABLE_LOG && logit('[  keyup]\tkeyCode:' + e.keyCode + ', which:' + e.which + ', __v:"' + e.__delayedValue + '", v:"' + e.target.value + '"');
		if (keyDownCode == 229 || isInComposition) {
			var value = e.__delayedValue || e.target.value;
			var composition, increment;

			if (isInComposition && inputEventInvokedCount == 3) {
				composition = value.substr(
					compositionStartPos,
					lastCompositionLength);
				bulkFire(composition);
				ENABLE_LOG && logit('[  keyup] composition end(1) with:"' + composition + '"');
				clear(e);
				compositionStartPos += lastCompositionLength;
				lastCompositionLength = value.length - lastValue.length;
				fire('compositionstart', compositStartEventHandlers, {data:''});
				ENABLE_LOG && logit('[  keyup] composition start(1)');
			}
			else if (isInComposition && inputEventInvokedCount == 2) {
				isInComposition = false;
				composition = value.substr(
					compositionStartPos,
					lastCompositionLength + value.length - lastValue.length);
				bulkFire(composition);
				ENABLE_LOG && logit('[  keyup] composition end(2) with:"' + composition + '"');
				clear(e);
				value = e.target.value;
			}
			else if (
				isInComposition &&
				(e.keyCode == 27 && inputEventInvokedCount == 0)
			) {
				isInComposition = false;
				fireCompositEnd('');
				ENABLE_LOG && logit('[  keyup] composition end(3)');
				clear(e);
				value = e.target.value;
			}
			else if (value != lastValue) {
				if (!isInComposition) {
					isInComposition = true;
					fire('compositionstart', compositStartEventHandlers, {data:''});
					ENABLE_LOG && logit('[  keyup] composition start(2)');
					compositionStartPos = getCompositionStartPos(lastValue, value);
					lastCompositionLength = 0;
				}
				increment = value.length - lastValue.length;
				lastCompositionLength += increment;
				if (lastCompositionLength > 0) {
					composition = value.substr(
						compositionStartPos,
						lastCompositionLength);
					fire('compositionupdate', compositUpdateEventHandlers, {data:composition});
				}
				else {
					isInComposition = false;
					fireCompositEnd('');
					ENABLE_LOG && logit('[  keyup] composition end(4)');
					clear(e);
					value = e.target.value;
				}
			}
			inputEventInvokedCount = 0;
			keyDownCode = -1;
			lastValue = value;
		}
	}
	function handleCompStart (e) {
		if (!ensureTarget(e)) return;
		lastReceivedEvent = e.type;
		isInComposition = true;
		fire('compositionstart', compositStartEventHandlers, {data:e.data});
	}
	function handleCompUpdate (e) {
		if (!ensureTarget(e)) return;
		lastReceivedEvent = e.type;
		fire('compositionupdate', compositUpdateEventHandlers, {data:e.data});
	}
	function handleCompEnd (e) {
		if (!ensureTarget(e)) return;
		lastReceivedEvent = e.type;
		compositionResult = e.data;
		isInComposition = false;
	}
	function handleInputChrome (e) {
		if (!ensureTarget(e)) return;
		ENABLE_LOG && logit('[  input]\tvalue:"' + e.target.value + '"');
		if (lastReceivedEvent == 'keydown') {
			var s = e.target.value.substring(lastValue.length);
			if (s != '') {
				fire('compositionstart', compositStartEventHandlers, {data:''});
				fire('compositionupdate', compositUpdateEventHandlers, {data:s});
				bulkFire(s);
			}
			clear(e);
		}
		else if (lastReceivedEvent == 'compositionend') {
			bulkFire(compositionResult);
			clear(e);
			compositionResult = null;
		}
		lastValue = e.target.value;
		lastReceivedEvent = e.type;
	}
	function handleInputOpera (e) {
		if (keydownStack.length && !e.__delayedTrace) {
			var last = keydownStack.lastItem;
			if (!last[0].repeat) {
				last[1].push(e);
				last[2] = e.target.value;
			}
			//ENABLE_LOG && logit('[  input] *** stacked: "' + e.target.value + '", ' + keydownStack.length + ' ***');
			return;
		}
		if (!ensureTarget(e)) return;
		ENABLE_LOG && logit('[  input]\tvalue:"' + e.target.value + '", activeElement:' + [
			document.activeElement.nodeName,
			document.activeElement.id,
			document.activeElement.style.display
		].join(', '));
		inputEventInvokedCount++;
		lastReceivedEvent = e.type;
	}
	function handleInputGecko (e) {
		if (!ensureTarget(e)) return;
		ENABLE_LOG && logit('[  input]\tvalue:"' + e.target.value + '"');
		if (lastReceivedEvent == 'compositionend') {
			bulkFire(compositionResult);
			clear(e);
			compositionResult = null;
		}
		lastReceivedEvent = e.type;
	}

	// privates
	function logit (s) {
		console.log(s);
	}
	function getCompositionStartPos (before, current) {
		var length = current.length - before.length;
		if (length <= 0) {
			return -1;
		}
		for (var i = 0, goal = (current.length - length) + 1; i < goal; i++) {
			var tmp = before.substring(0, i)
				+ current.substring(i, i + length)
				+ before.substring(i);
			if (tmp == current) {
				return i;
			}
		}
		return -1;
	}
	function getKeyupHandler () {
		if (window.opera) return handleKeyupOpera;
		return handleKeyup;
	}
	function getInputHandler () {
		if (window.chrome) return handleInputChrome;
		if (window.opera) return handleInputOpera;
		return handleInputGecko;
	}
	function getHandlers (type) {
		var handlers;
		switch (type) {
		case 'input':
			handlers = inputEventHandlers;
			break;
		case 'compositionstart':
			handlers = compositStartEventHandlers;
			break;
		case 'compositionupdate':
			handlers = compositUpdateEventHandlers;
			break;
		case 'compositionend':
			handlers = compositEndEventHandlers;
			break;
		default:
			handlers = [];
		}
		return handlers;
	}
	function fire (eventName, handlers, e) {
		lastFiredEvent = eventName;
		for (var i = 0, goal = handlers.length; i < goal; i++) {
			handlers[i](e);
		}
	}
	function fireCompositEnd (data) {
		lastFiredEvent = 'compositionend';
		var e = {data:data};
		for (var i = 0, goal = compositEndEventHandlers.length; i < goal; i++) {
			if (compositEndEventHandlers[i](e) === false) {
				return false;
			}
		}
		return true;
	}
	function bulkFire (data) {
		if (lastFiredEvent == 'compositionupdate' && !fireCompositEnd(data)) return;
		var e = {
			code:             0,
			identifier:       false,
			fullIdentifier:   false,
			shift:            false,
			ctrl:             false,
			isCompositioned:  true,
			isCompositionedFirst: false,
			isCompositionedLast: false
		};
		for (var i = 0, goal = data.length; i < goal; i++) {
			e.code = data.charCodeAt(i);
			e.identifier = e.fullIdentifier = data.charAt(i);
			e.isCompositionedFirst = i == 0;
			e.isCompositionedLast = i == goal - 1;
			fire('input', inputEventHandlers, e);
		}
	}
	function ensureTarget (e) {
		return !target || target == e.target;
	}
	function clear (e) {
		!isPreserve && init('');
	}
	function code2letter (c, useSpecial) {
		if (typeof c != 'number') return '';
		if (c >= 0) return String.fromCharCode(c);
		if (useSpecial && SPECIAL_KEYS[-c]) return '<' + SPECIAL_KEYS[-c] + '>';
		return '';
	}
	function toInternalString (e) {
		if (typeof e.code != 'number') return '';
		return e.isSpecial && e.code < 0 ?
			'\ue000' + '<' + e.fullIdentifier + '>' : String.fromCharCode(e.code);
	}
	function objectFromCode (c) {
		if (typeof c != 'number') return null;
		var identifier = c >= 0 ? String.fromCharCode(c) : SPECIAL_KEYS[-c] ? SPECIAL_KEYS[-c] : '';
		return {
			code: c,
			identifier: identifier,
			fullIdentifier: identifier,
			shift: false,
			ctrl: false,
			isSpecial: c < 0 && SPECIAL_KEYS[-c]
		};
	}
	function nopObjectFromCode () {
		return {
			code: 0,
			identifier: '*nop*',
			fullIdentifier: '*nop*',
			shift: false,
			ctrl: false,
			isSpecial: false
		};
	}
	function insertFnKeyHeader (s) {
		return s.replace(/(\u0016)?(<[^>]+>|#\d{1,2})/g, function ($0, $1) {
			return $1 == '\u0016' ? $0 : '\ue000' + $0;
		});
	}
	function parseKeyDesc (desc, escaped) {
		function doParse (desc) {
			var parts = desc.toLowerCase().split('-');
			var shift = false, ctrl = false, name = '';

			while (parts.length > 1 && (parts[0] == 's' || parts[0] == 'c')) {
				shift = parts[0] == 's' || shift;
				ctrl = parts[0] == 'c' || ctrl;
				parts.shift();
			}

			name = parts[0];

			for (var i in SPECIAL_KEYS) {
				if (SPECIAL_KEYS[i] == name) {
					return {
						code:SPECIAL_KEY_CODES[i] || -i,
						name:name,
						shift:shift,
						ctrl:ctrl
					};
				}
			}
			return null;
		}
		if (typeof desc == 'number') {
			desc = String.fromCharCode(desc);
		}
		if (!escaped) {
			var consumed = 0;
			var re = /^\ue000<([^>]+)>/.exec(desc);
			if (re) {
				desc = re[1];
				consumed = re[0].length;
			}
			else {
				re = /^\ue000#(\d{1,2})/.exec(desc);
				if (re) {
					desc = 'f' + re[1];
					consumed = re[0].length;
				}
			}
			if (consumed) {
				var obj = doParse(desc);
				if (!obj) return {consumed:consumed};
				var c = [];
				obj.shift && c.push('s');
				obj.ctrl  && c.push('c');
				c.push(obj.name);
				return {
					consumed:consumed,
					prop:{
						code:obj.code,
						identifier:obj.name,
						fullIdentifier:c.join('-'),
						shift:obj.shift,
						ctrl:obj.ctrl,
						isSpecial:true
					}
				};
			}
		}
		return {
			consumed:1,
			prop:{
				code:desc.charCodeAt(0),
				identifier:desc.charAt(0),
				fullIdentifier:desc.charAt(0),
				shift:false,
				ctrl:false,
				isSpecial:false
			}
		};
	}
	function createSequences (s) {
		var result = [];
		for (var i = 0, goal = s.length; i < goal; i++) {
			var parseResult;
			if (s.charAt(i) == '\u0016') {
				if (i >= s.length - 1) break;
				parseResult = parseKeyDesc(s.substring(++i), true);
			}
			else {
				parseResult = parseKeyDesc(s.substring(i));
			}
			parseResult.prop && result.push(parseResult.prop);
			i += parseResult.consumed - 1;
		}
		return result;
	}
	function push () {
		bufferedStrokes.push.apply(bufferedStrokes, arguments);
	}
	function sweep () {
		if (bufferedStrokes.length == 0) return;

		var bs = bufferedStrokes.slice(0);
		bufferedStrokes.length = 0;
		while (bs.length) {
			fire('input', inputEventHandlers, bs.shift());
		}
	}
	function pushSweep (s, asComposition) {
		push.apply(push, createSequences(s));
		if (asComposition && bufferedStrokes.length) {
			bufferedStrokes.forEach(function (a) {a.isCompositioned = true});
			bufferedStrokes[0].isCompositionedFirst = true;
			bufferedStrokes.lastItem.isCompositionedLast = true;
		}
		sweep();
	}
	function isPasteKeyStroke (e) {
		return specialKeyCode == -45 && e.shiftKey && !e.ctrlKey;
	}

	publish(this,
		install, uninstall, addEventListener, removeEventListener,
		init, code2letter, toInternalString, objectFromCode,
		nopObjectFromCode, insertFnKeyHeader, parseKeyDesc, createSequences,
		push, sweep, pushSweep, dispose,
		{
			preserve:[
				function () {return isPreserve},
				function (v) {isPreserve = !!v}
			],
			target:[
				function () {return target},
				function (v) {
					target = v;
					init(v.value);
				}
			],
			isInComposition:function () {return isInComposition}
		}
	);
};

Wasavi.MapManager = function (app) {

	function MapItem (name, rules, sequences, sequencesExpanded, options) {
		function register (lhs, rhs, remap) {
			rules[lhs] = rhs;
			sequences[lhs] = app.keyManager.createSequences(lhs);
			sequencesExpanded[lhs] = app.keyManager.createSequences(rhs);
			options[lhs] = {remap:!!remap};
		}
		function remove () {
			for (var i = 0; i < arguments.length; i++) {
				var lhs = arguments[i];
				delete rules[lhs];
				delete sequences[lhs];
				delete sequencesExpanded[lhs];
				delete options[lhs];
			}
		}
		function removeAll () {
			for (var i in rules) {
				remove(i);
			}
		}
		function isMapped (key) {
			return key in rules;
		}
		function toArray () {
			var result = [];
			for (var i in rules) {
				result.push([i, rules[i]]);
			}
			return result;
		}

		publish(this,
			register, remove, removeAll, isMapped, toArray,
			{name:function () {return name}});
	}

	/*const*/var NEST_MAX = 100;
	/*const*/var DELAY_TIMEOUT = 1000;
	/*const*/var MAP_INDICES = {
		 'command':0,
		 'edit':1,
		 'overwrite':1
	};

	var rules = [{}, {}];
	var sequences = [{}, {}];
	var sequencesExpanded = [{}, {}];
	var options = [{}, {}];
	var maps = [
		new MapItem('command', rules[0], sequences[0], sequencesExpanded[0], options[0]),
		new MapItem('edit', rules[1], sequences[1], sequencesExpanded[1], options[1])
	];
	var depth = 0;
	var stack = [];
	var delayedInfo = {
		timer:null,
		mapIndex: null,
		rule:null,
		handler:null
	};
	var lastMapIndex = null;
	var currentMap = null;
	var index = 0;

	function getMap (arg) {
		if (arg === 'command') {
			return maps[0];
		}
		else if (arg === 'edit') {
			return maps[1];
		}
		return null;
	}
	function resetDelayed () {
		var result;
		if (delayedInfo.timer) {
			clearTimeout(delayedInfo.timer);
			result = {
				index:delayedInfo.mapIndex,
				rule:delayedInfo.rule,
				handler:delayedInfo.handler
			};
			delayedInfo.timer = delayedInfo.mapIndex =
			delayedInfo.rule = delayedInfo.handler = null;
		}
		return result;
	}
	function reset () {
		resetDelayed();
		currentMap = null;
		index = 0;
	}
	function registerExpandDelayed (mapIndex, lhs, handler) {
		delayedInfo.mapIndex = mapIndex;
		delayedInfo.rule = lhs;
		delayedInfo.handler = handler;
		delayedInfo.timer = setTimeout(function () {
			reset();
			expandDelayed(mapIndex, lhs, handler);
		}, DELAY_TIMEOUT);
	}
	function expandDelayed () {
		var mapIndex, lhs, handler, context;
		if (typeof arguments[0] == 'object') {
			mapIndex = arguments[0].index;
			lhs = arguments[0].rule;
			handler = arguments[0].handler;
			context = arguments[1];
		}
		else {
			mapIndex = arguments[0];
			lhs = arguments[1];
			handler = arguments[2];
			context = arguments[3];
		}
		expand(
			sequencesExpanded[mapIndex][lhs],
			options[mapIndex][lhs].remap,
			handler, context || 'expand delayed'
		);
	}
	function expand (rhs, remap, handler) {
		if (!handler) return;
		if (depth < NEST_MAX) {
			depth++;
			stack.push([currentMap, index]);
			currentMap = null;
			index = 0;
			try {
				if (app.config.vars.remap && remap) {
					for (var i = 0; i < rhs.length; i++) {
						process(rhs[i], handler);
					}
				}
				else {
					for (var i = 0; i < rhs.length; i++) {
						handler(rhs[i].code, rhs[i]);
					}
				}
			}
			finally {
				var o = stack.pop();
				currentMap = o[0];
				index = o[1];
				depth--;
			}
		}
		else {
			requestShowMessage(_('Map expansion reached maximum recursion limit.'), true);
		}
	}
	function process (keyCode, handler) {
		var delayed = resetDelayed();
		var mapIndex, obj;
		if (app.inputMode in MAP_INDICES) {
			mapIndex = MAP_INDICES[app.inputMode];
		}
		if (typeof keyCode == 'object') {
			obj = keyCode;
			keyCode = obj.code;
		}
		else {
			obj = app.keyManager.nopObjectFromCode();
		}
		if (mapIndex == undefined || keyCode == false) {
			delayed && expandDelayed(delayed, 'delayed #1');
			handler && handler(keyCode, obj);
			return;
		}
		if (app.quickActivation && app.inputMode == 'command' && keyCode == 9) {
			handler && handler(keyCode, obj);
			return;
		}
		if (mapIndex != lastMapIndex) {
			delayed && expandDelayed(delayed, 'delayed #2');
			reset();
		}
		lastMapIndex = mapIndex;

		var srcmap = currentMap || rules[mapIndex];
		var dstmap = {};
		var found = 0;
		var propCompleted;

		for (var i in srcmap) {
			var seq = sequences[mapIndex][i];
			if (index < seq.length && seq[index].code == keyCode) {
				dstmap[i] = srcmap[i];
				found++;
				if (index == seq.length - 1 && propCompleted == undefined) {
					propCompleted = i;
				}
			}
		}

		if (found) {
			currentMap = dstmap;
			index++;
			if (propCompleted != undefined) {
				// unique match
				if (found == 1) {
					reset();
					expand(
						sequencesExpanded[mapIndex][propCompleted],
						options[mapIndex][propCompleted].remap,
						handler, 'unique');
				}
				// ambiguous match
				else {
					registerExpandDelayed(mapIndex, propCompleted, handler);
				}
			}
		}
		else {
			delayed && expandDelayed(delayed, 'delayed #3');
			handler && handler(keyCode, obj);
			reset();
		}
	}

	publish(this,
		reset, getMap, process,
		{
			commandMap:function () {return maps[0]},
			editMap:function () {return maps[1]}
		}
	);
};

Wasavi.Registers = function (app, loadCallback, ignoreStorage) {
	/*
	 * available registers:
	 *
	 * - unnamed register
	 *  "       equiv to the last used register's content [vim compatible]
	 *
	 * - named register
	 *  1 - 9   implicit register, and its histories. 1 is latest.
	 *  a - z   general named register
	 *  A - Z   general named register for append (write only)
	 *  @       last executed command via :@ in ex mode or @ in vi mode
	 *  .       last edited text (read only) [vim compatible]
	 *  :       last executed ex command (read only) [vim compatible]
	 *  *       system clipboard, if available [vim compatible]
	 *  /       last searched text (read only) [vim compatible]
	 */

	function RegisterItem () {
		this.isLineOrient = false;
		this.locked = false;
		this.data = '';
	}
	RegisterItem.prototype = {
		set: function (data, isLineOrient) {
			if (isLineOrient != undefined) {
				this.isLineOrient = isLineOrient;
			}
			this.setData(data);
		},
		setData: function (data) {
			if (this.locked) return;
			data = (data || '').toString();
			if (this.isLineOrient) {
				this.data = data.replace(/\n$/, '') + '\n';
			}
			else {
				this.data = data;
			}
		},
		appendData: function (data) {
			if (this.locked) return;
			data = (data || '').toString();
			if (this.isLineOrient) {
				this.data += data.replace(/\n$/, '') + '\n';
			}
			else {
				this.data += data;
			}
		}
	};

	var unnamed;
	var named;
	var storageKey = 'wasavi_registers';
	var writableRegex = /^[1-9a-zA-Z@]$/;
	var readableRegex = /^["1-9a-z@.:*\/\^]$/;

	function serialize () {
		return JSON.stringify(serializeGeneral({unnamed:unnamed, named:named}));
	}
	function restore (src) {
		src = unserializeGeneral(src);
		if (!src || (!src instanceof Object)) return;
		if (!('unnamed' in src)) return;
		if (!('named' in src) || !(src.named instanceof Object)) return;

		function doRestore (k, v) {
			if (!isReadable(k)) return;
			if (!v || !(v instanceof Object)) return;
			if (!('isLineOrient' in v) || typeof v.isLineOrient != 'boolean') return;
			if (!('data' in v) || typeof v.data != 'string') return;

			findItem(k).set(v.data, v.isLineOrient);
		}

		doRestore('"', src.unnamed);
		for (var i in src.named) {
			doRestore(i, src.named[i]);
		}
	}
	function save () {
		app.low.setLocalStorage(storageKey, serialize());
	}
	function load (callback) {
		unnamed = new RegisterItem();
		named = {};
		app.low.getLocalStorage(storageKey, function (value) {
			!ignoreStorage && restore(value || '');
			callback && callback();
			callback = null;
		});
	}
	function isWritable (name) {
		return writableRegex.test(name);
	}
	function isReadable (name) {
		return readableRegex.test(name);
	}
	function exists (name) {
		if (!isReadable(name)) {
			return false;
		}
		switch (name) {
		case "*":
			return app.extensionChannel && typeof app.extensionChannel.clipboardData == 'string';
		default:
			return name == '"' || named[name];
		}
	}
	function findItem (name) {
		if (name == '"') {
			return unnamed;
		}
		if (!named[name]) {
			named[name] = new RegisterItem();
		}
		return named[name];
	}
	function set (name, data, isLineOrient, isInteractive) {
		if (data == '') return;

		// unnamed register
		if (typeof name != 'string' || name == '') {
			// case of several deletion operation or data of two or more lines,
			// update "1 too.
			if (app.state == 'normal') {
				if (app.prefixInput.operation == 'd' && '%`/?()Nn{}'.indexOf(app.prefixInput.motion) >= 0
				||  (data.match(/\n/g) || []).length >= 2) {
					set('1', data, isLineOrient);
				}
			}
			unnamed.set(data, isLineOrient);
		}
		// named register
		else {
			if (name == '1') {
				for (var i = 9; i > 1; i--) {
					named[i] = named[i - 1];
				}
				named['1'] = undefined;
				findItem(name).set(data, isLineOrient);
				unnamed.set(data, isLineOrient);
			}
			else if (/^[2-9a-z*]$/.test(name)) {
				var item = findItem(name);
				item.set(data, isLineOrient);
				unnamed.set(data, isLineOrient);
				name == '*' && app.extensionChannel && app.extensionChannel.setClipboard(item.data);
			}
			else if (/^[@.:\/\^]$/.test(name) && !isInteractive) {
				var item = findItem(name);
				item.set(data, isLineOrient);
			}
			else if (/^[A-Z]$/.test(name)) {
				name = name.toLowerCase();
				findItem(name).appendData(data);
				unnamed.set(named[name].data, named[name].isLineOrient);
			}
		}
		save();
	}
	function get (name) {
		if (typeof name != 'string' || name == '') {
			return unnamed;
		}
		name = name.toLowerCase();
		if (isReadable(name)) {
			var item = findItem(name);
			name == '*' && app.extensionChannel && item.set(app.extensionChannel.clipboardData);
			return item;
		}
		return new RegisterItem();
	}
	function dump () {
		function dumpItem (item) {
			var orientString = item.isLineOrient ? 'L' : 'C';
			return _('  {0}  {1}', orientString, toVisibleString(item.data));
		}
		var a = [];
		a.push('""' + dumpItem(unnamed));
		for (var i in named) {
			named[i] && a.push('"' + i + dumpItem(named[i]));
		}
		a.sort();
		a.unshift(_('*** registers ***'));
		return a;
	}
	function dumpData () {
		function dumpItem (name, item) {
			return {
				isLineOrient:item.isLineOrient,
				name:name,
				data:toNativeControl(item.data)
			};
		}
		var a = [];
		a.push(dumpItem('"', unnamed));
		for (var i in named) {
			named[i] && a.push(dumpItem(i, named[i]));
		}
		a.sort(function (a, b) {return a.name.localeCompare(b.name);});
		return a;
	}

	publish(this,
		set, get, isWritable, isReadable, exists, dump, dumpData, save, load,
		{
			storageKey:function () {return storageKey},
			writableList:function () {
				return writableRegex.source
					.replace(/^\^\[/, '')
					.replace(/\]\$$/, '');
			},
			readableList:function () {
				return readableRegex.source
					.replace(/^\^\[/, '')
					.replace(/\]\$$/, '');
			}
		}
	);
	load(loadCallback);
	loadCallback = null;
};

Wasavi.Marks = function (app, ignoreStorage) {
	var buffer = app.buffer;
	var marks = {};

	function serialize () {
		return JSON.stringify(serializeGeneral({marks:marks}));
	}
	function restore (src) {
		src = unserializeGeneral(src);
		if (!src || (!src instanceof Object)) return;
		if (!('marks' in src) || !(src.marks instanceof Object)) return;

		for (var i in src.marks) {
			if (!isValidName(i)) continue;
			if (!src.marks[i] || !(src.marks[i] instanceof Object)) continue;
			if (!('row' in src.marks[i]) || !('col' in src.marks[i])) continue;

			var row = parseInt(src.marks[i].row);
			var col = parseInt(src.marks[i].col);
			if (isNaN(row) || isNaN(col)) continue;

			marks[i] = (new Wasavi.Position(row, col)).round(buffer);
		}
	}
	function save () {
		app.dataset('wasaviMarks', serialize());
	}
	function isValidName (name) {
		return /^[a-z'\^<>]/.test(name);
	}
	function regalizeName (name) {
		if (name == '`') {
			name = "'";
		}
		return name;
	}
	function set (name, pos) {
		name = regalizeName(name);
		if (isValidName(name)) {
			marks[name] = pos;
			save();
		}
	}
	function setPrivate (name, pos) {
		name = '$' + name;
		if (pos) {
			marks[name] = pos;
		}
		else {
			delete marks[name];
		}
	}
	function get (name) {
		name = regalizeName(name);
		return isValidName(name) && name in marks ? marks[name] : undefined;
	}
	function getPrivate (name) {
		name = '$' + name;
		return name in marks ? marks[name] : undefined;
	}
	function setJumpBaseMark (pos) {
		set("'", pos || app.buffer.selectionStart);
	}
	function setInputOriginMark (pos) {
		set('^', pos || app.buffer.selectionStart);
	}
	function getJumpBaseMark () {
		return get("'");
	}
	function getInputOriginMark () {
		return get('^');
	}
	function update (pos, func) {
		function setMarks () {
			var usedMarks = {};
			var r = document.createRange();
			for (var i in marks) {
				var m = marks[i];
				if (m.row >= buffer.rowLength
				||  m.row == buffer.rowLength - 1 && m.col > buffer.rows(m.row).length) {
					m.row = m.col = 0;
				}
				if (m.row > pos.row || m.row == pos.row && m.col >= pos.col) {
					usedMarks[i] = true;

					var iter = document.createNodeIterator(
						buffer.elm.childNodes[m.row],
						window.NodeFilter.SHOW_TEXT, null, false);
					var totalLength = 0;
					var node;

					while ((node = iter.nextNode())) {
						var next = totalLength + node.nodeValue.length;
						if (totalLength <= m.col && m.col < next) {
							r.setStart(node, m.col - totalLength);
							r.setEnd(node, m.col - totalLength);
							var span = document.createElement('span');
							span.className = MARK_CLASS;
							dataset(span, 'index', i);
							r.insertNode(span);
							break;
						}
						totalLength = next;
					}
				}
			}
			return usedMarks;
		}
		function releaseMarks (usedMarks) {
			var nodes = buffer.getSpans(MARK_CLASS);
			for (var i = 0, goal = nodes.length; i < goal; i++) {
				var span = nodes[i];
				var index = dataset(span, 'index');
				marks[index].row = buffer.indexOf(span.parentNode);
				marks[index].col = calcColumn(span);
				var pa = span.parentNode;
				pa.removeChild(span);
				pa.normalize();
				delete usedMarks[index];
			}

			var ss = buffer.selectionStart;
			for (var i in usedMarks) {
				if (i in foldedMarks) {
					marks[i] = ss;
				}
				else {
					delete marks[i];
				}
			}
		}
		function calcColumn (span) {
			var result = 0;
			var nodes = span.parentNode.childNodes;
			for (var i = 0, goal = nodes.length; i < goal && nodes[i] != span; i++) {
				var node = nodes[i];
				if (node.nodeType == 3) {
					result += node.nodeValue.length;
				}
			}
			return result;
		}
		function registerFoldedMark (fragment) {
			var marks = fragment.querySelectorAll('span.' + MARK_CLASS);
			for (var i = 0, goal = marks.length; i < goal; i++) {
				var index = dataset(marks[i], 'index');
				foldedMarks[index] = true;
			}
		}
		var usedMarks;
		var foldedMarks = {};
		try {
			usedMarks = setMarks();
			func && func(registerFoldedMark);
		}
		finally {
			releaseMarks(usedMarks);
			save();
		}
	}
	function clear () {
		marks = {};
	}
	function dump () {
		var a = [
		//     mark  line   col  text
		//     a    00000  0000  aaaaaaaaaa
			_('*** marks ***'),
			  'mark  line   col   text',
			  '====  =====  ====  ===='];
		for (var i in marks) {
			if (i.charAt(0) == '$') continue;
			a.push(
				' ' + i + '  ' +
				'  ' + ('    ' + (marks[i].row + 1)).substr(-5) +
				'  ' + ('   ' + (marks[i].col)).substr(-4) +
				'  ' + toVisibleString(buffer.rows(marks[i]))
			);
		}
		return a;
	}
	function dumpData () {
		var result = {};
		for (var i in marks) {
			result[i] = {
				row:marks[i].row,
				col:marks[i].col
			};
		}
		return result;
	}
	function dispose () {
		buffer = null;
	}

	publish(this,
		set, get, setPrivate, getPrivate,
		setJumpBaseMark, setInputOriginMark, getJumpBaseMark, getInputOriginMark,
		update, dump, dumpData, save, isValidName, clear, dispose
	);
	restore(!ignoreStorage && app.dataset('wasaviMarks') || '');
};

Wasavi.Editor = function (element) {
	this.elm = $(element);
	if (!this.elm) {
		throw new Error('*** wasavi: Editor constructor: invalid element: ' + element);
	}
	this.isLineOrientSelection = false;
};
Wasavi.Editor.prototype = new function () {
	function arg2pos (args) {
		if (args[0] instanceof Wasavi.Position) {
			return args[0].clone();
		}
		else {
			return new Wasavi.Position(args[0], args[1]);
		}
	}
	function popLastArg (args, type) {
		type || (type = 'function');
		if (args.length && typeof args.lastItem == type) {
			var func = args.lastItem;
			args.pop();
			return func;
		}
		return null;
	}
	function setRange (r, pos, isEnd) {
		var iter = document.createNodeIterator(
			this.elm.childNodes[pos.row], window.NodeFilter.SHOW_TEXT, null, false);
		var totalLength = 0;
		var node, prevNode;
		while ((node = iter.nextNode())) {
			var next = totalLength + node.nodeValue.length;
			if (totalLength <= pos.col && pos.col < next) {
				isEnd ? r.setEnd(node, pos.col - totalLength) :
						r.setStart(node, pos.col - totalLength);
				prevNode = null;
				break;
			}
			totalLength = next;
			prevNode = node;
		}
	}
	function select (s, e) {
		if (arguments.length == 0) {
			s = this.selectionStart;
			e = this.selectionEnd;
		}
		else if (arguments.length != 2) {
			throw new Error('select: invalid length of argument');
		}

		if (s.row > e.row || s.row == e.row && s.col > e.col) {
			var tmp = s;
			s = e;
			e = tmp;
		}

		var r = document.createRange();
		setRange.call(this, r, s);
		setRange.call(this, r, e, true);
		return {r:r, s:s, e:e};
	}
	function selectRows (s, e) {
		if (arguments.length == 0) {
			s = this.selectionStart;
			e = this.selectionEnd;
		}
		else if (arguments.length != 2) {
			throw new Error('selectRows: invalid length of argument');
		}

		if (s.row > e.row || s.row == e.row && s.col > e.col) {
			var tmp = s;
			s = e;
			e = tmp;
		}

		s.col = 0;
		e.col = this.elm.childNodes[e.row].textContent.length;

		var r = document.createRange();
		r.setStartBefore(this.elm.childNodes[s.row]);
		r.setEndAfter(this.elm.childNodes[e.row]);
		return {r:r, s:s, e:e};
	}
	function fixLineTail (rowNode, trim) {
		for (var node = rowNode.lastChild; node; node = node.previousSibling) {
			if (node.nodeType == 3) {
				if (trim) {
					node.nodeValue = node.nodeValue.replace(/\n$/, '');
				}
				else if (node.nodeValue.substr(-1) != '\n') {
					node.nodeValue += '\n';
				}
				return node;
			}
		}
		return null;
	}
	return {
		// condition
		isEndOfText: function () {
			var a = arg2pos(arguments);
			if (a.row < 0 || a.row >= this.elm.childNodes.length) {
				throw new Error('isEndOfText: argument row (' + a.row + ') out of range.');
			}
			if (a.row < this.elm.childNodes.length - 1) {
				return false;
			}
			if (a.row == this.elm.childNodes.length - 1
			&& a.col < this.elm.lastChild.textContent.length - 1) {
				return false;
			}
			return true;
		},
		isNewline: function () {
			var a = arg2pos(arguments);
			if (a.row < 0 || a.row >= this.elm.childNodes.length) {
				throw new Error('isNewline: argument row (' + a.row + ') out of range.');
			}
			var node = this.elm.childNodes[a.row].textContent;
			if (a.col < node.length - 1 || a.row == this.elm.childNodes.length - 1) {
				return false;
			}
			return true;
		},

		// getter
		rows: function (arg, context) {
			var row3 = arg;
			if (arg instanceof Wasavi.Position) {
				row3 = arg.row;
			}
			if (typeof row3 != 'number' || isNaN(row3)) {
				throw new Error('rows: argument row is not a number: ' + (context || ''));
			}
			if (row3 < 0 || row3 >= this.elm.childNodes.length) {
				throw new Error('rows: argument row (' + row3 + ') out of range: ' + (context || ''));
			}

			return trimTerm(this.elm.childNodes[row3].textContent);
		},
		rowNodes: function (arg, context) {
			var row1 = arg;
			if (arg instanceof Wasavi.Position) {
				row1 = arg.row;
			}
			if (typeof row1 != 'number' || isNaN(row1)) {
				throw new Error('rowsNodes: argument row is not a number: ' + (context || ''));
			}
			if (row1 < 0 || row1 >= this.elm.childNodes.length) {
				throw new Error('rowNodes: argument row (' + row1 + ') out of range: ' + (context || ''));
			}
			return this.elm.childNodes[row1];
		},
		rowTextNodes: function (arg, context) {
			var row2 = arg;
			if (arg instanceof Wasavi.Position) {
				row2 = arg.row;
			}
			if (typeof row2 != 'number' || isNaN(row2)) {
				throw new Error('rowTextNodes: argument row is not a number: ' + (context || ''));
			}
			if (row2 < 0 || row2 >= this.elm.childNodes.length) {
				throw new Error('rowTextNodes: argument row (' + row2 + ') out of range: ' + (context || ''));
			}
			var node = this.elm.childNodes[row2];
			if (!node.firstChild) {
				node.appendChild(document.createTextNode(''));
			}
			return node.firstChild;
		},
		charAt: function () {
			var a = arg2pos(arguments);
			return this.elm.childNodes[a.row].textContent.charAt(a.col);
		},
		charCodeAt: function () {
			var a = argspos(arguments);
			return this.elm.childNodes[a.row].textContent.charCodeAt(a.col);
		},
		charClassAt: function (a, treatNewlineAsSpace) {
			var text = this.elm.childNodes[a.row].textContent;
			var cp = text.charCodeAt(a.col);

			if (treatNewlineAsSpace && cp == 0x0a) {
				return 'Z';
			}

			return cp <= 0x7f ?
				unicodeUtils.getLatin1Prop(cp).charAt(0) :
				unicodeUtils.getUnicodeBlock(cp);
		},
		charRectAt: function () {
			var a = arg2pos(arguments);
			var className = 'char-rect-at';
			var result = this.emphasis(a, 1, className)[0].getBoundingClientRect();
			this.unEmphasis(className);
			return result;
		},
		getSelection: function () {
			if (this.isLineOrientSelection) {
				return this.getSelectionRows.apply(this, arguments);
			}
			else {
				var r = select.apply(this, arguments);
				var content = r.r.toString();
				r.r.detach();
				return content;
			}
		},
		getSelectionRows: function () {
			var r = selectRows.apply(this, arguments);
			var content = ensureNewline(r.r.toString());
			r.r.detach();
			return content;
		},
		leftPos: function () {
			var a = arg2pos(arguments);
			if (a.col == 0) {
				if (a.row > 0) {
					a.row--;
					a.col = this.elm.childNodes[a.row].textContent.length - 1;
				}
			}
			else {
				a.col--;
			}
			return a;
		},
		rightPos: function () {
			var a = arg2pos(arguments);
			var node = this.elm.childNodes[a.row].textContent;
			if (a.col >= node.length
			||  a.col == node.length - 1 && node.charAt(a.col) == '\n') {
				if (a.row < this.elm.childNodes.length - 1) {
					a.row++;
					a.col = 0;
				}
			}
			else {
				a.col++;
			}
			return a;
		},
		indexOf: function (node) {
			return Array.prototype.indexOf.call(this.elm.children, node);
		},
		getLineTopOffset: function () {
			var a = arg2pos(arguments);
			a.col = 0;
			return a;
		},
		getLineTailOffset: function () {
			var a = arg2pos(arguments);
			a.col = Math.max(0, this.elm.childNodes[a.row].textContent.length - 1);
			return a;
		},
		getLineTopOffset2: function () {
			var a = arg2pos(arguments);
			var re = /^([\t ]*).*\n$/.exec(this.elm.childNodes[a.row].textContent);
			a.col = re ? re[1].length : 0;
			return a;
		},
		getLineTopDenotativeOffset: function () {
			var a = arg2pos(arguments);
			a.col && a.col--;
			var curRect = this.charRectAt(a);
			while (--a.col >= 0) {
				var newRect = this.charRectAt(a);
				if (newRect.top < curRect.top) {
					a.col++;
					break;
				}
			}
			a.col = Math.max(a.col, 0);
			return a;
		},
		getLineTailDenotativeOffset: function () {
			var a = arg2pos(arguments);
			var curRect = this.charRectAt(a);
			while (!this.isEndOfText(a) && !this.isNewline(a)) {
				a.col++;
				var newRect = this.charRectAt(a);
				if (newRect.top > curRect.top) {
					a.col--;
					break;
				}
			}
			return a;
		},
		getIndent: function () {
			var a = arg2pos(arguments);
			while (a.row >= 0 &&
				(
					this.rowNodes(a).getAttribute('data-indent-ignore') == '1' ||
					this.rows(a) == ''
				)
			) {
				a.row--;
			}
			return a.row >= 0 ? /^[\t ]*/.exec(this.rows(a))[0] : '';
		},
		getBackIndent: function () {
			var a = arg2pos(arguments);
			while (--a.row >= 0 &&
				(
					this.rowNodes(a).getAttribute('data-indent-ignore') == '1' ||
					this.rows(a) == ''
				)
			) {}
			return a.row >= 0 ? /^[\t ]*/.exec(this.rows(a))[0] : '';
		},
		getSpans: function (className, start, end) {
			var q = ['#wasavi_editor>div'];
			if (typeof start == 'number') {
				if (start < 0) {
					start = this.elm.childNodes.length + start;
					end = false;
				}
				q.push(':nth-child(n+' + (start + 1) + ')');
			}
			if (typeof end == 'number') {
				end = Math.min(end, this.elm.childNodes.length - 1);
				q.push(':nth-child(-n+' + (end + 1) + ')');
			}
			if (q.length == 3 && start == end) {
				q.pop();
				q.pop();
				q.push(':nth-child(' + (start + 1) + ')');
			}
			q.push(' span');
			if (typeof className == 'string' && className != '') {
				q.push('.' + className);
			}
			return document.querySelectorAll(q.join(''));
		},
		// vim compatible cursor iterators
		inc: function (pos) {
			var p = pos || this.selectionStart;
			try {
				var s = this.rows(p);
				if (p.col < s.length) {
					p.col++;
					return p.col < s.length ? 0 : 2;
				}
				if (p.row < this.rowLength - 1) {
					p.col = 0;
					p.row++;
					return 1;
				}
				return -1;
			}
			finally {
				!pos && this.setSelectionRange(p);
			}
		},
		dec: function (pos) {
			var p = pos || this.selectionStart;
			try {
				if (p.col > 0) {
					p.col--;
					return 0;
				}
				if (p.row > 0) {
					p.row--;
					p.col = this.rows(p.row).length;
					return 1;
				}
				return -1;
			}
			finally {
				!pos && this.setSelectionRange(p);
			}
		},
		incl: function (pos) {
			var r = this.inc(pos);
			return r >= 1 && (pos && pos.col || !pos && this.selectionStartCol) ?
				this.inc(pos) : r;
		},
		decl: function (pos) {
			var r = this.dec(pos);
			return r == 1 && (pos && pos.col || !pos && this.selectionStartCol) ?
				this.dec(pos) : r;
		},

		// setter
		setRow: function (arg, text) {
			var row4 = arg;
			if (arg instanceof Wasavi.Position) {
				row4 = arg.row;
			}
			this.elm.childNodes[row4].textContent = text.replace(/\n$/, '') + '\n';
		},
		setSelectionRange: function () {
			if (arguments.length == 1) {
				if (arguments[0] instanceof Wasavi.Position) {
					this.selectionStart = arguments[0].clone();
					this.selectionEnd = arguments[0].clone();
				}
				else if (typeof arguments[0] == 'number') {
					this.selectionStart = this.linearPositionToBinaryPosition(arguments[0]);
				}
			}
			else if (arguments.length > 1) {
				if (arguments[0] instanceof Wasavi.Position) {
					this.selectionStart = arguments[0].clone();
				}
				else if (typeof arguments[0] == 'number') {
					this.selectionStart = this.linearPositionToBinaryPosition(arguments[0]);
				}
				if (arguments[1] instanceof Wasavi.Position) {
					this.selectionEnd = arguments[1].clone();
				}
				else if (typeof arguments[1] == 'number') {
					this.selectionEnd = this.linearPositionToBinaryPosition(arguments[1]);
				}
			}
		},

		// method
		focus: function () {
			return $('wasavi_focus_holder').focus();
		},
		adjustBackgroundImage: function (lineHeight) {
			var y = lineHeight;
			if (this.elm.childNodes.length) {
				var last = this.elm.childNodes[this.elm.childNodes.length - 1];
				y = last.offsetTop + last.offsetHeight;
			}
			var desc = '100% ' + y + 'px';
			if (this.elm.style.backgroundSize != desc) {
				this.elm.style.backgroundSize = desc;
			}
		},
		adjustLineNumberWidth: function (width, isRelative) {
			var newClass = width ? (('n n' + width) + ' ' + (isRelative ? 'r' : 'a')) : '';
			if (this.elm.className != newClass) {
				this.elm.className = newClass;
			}
		},
		adjustLineNumber: function (isRelative) {
			var desc = 'n ' + (isRelative ? (this.selectionStartRow + 1) : 0);
			if (this.elm.style.counterReset != desc) {
				this.elm.style.counterReset = desc;
			}
		},
		adjustWrapGuide: function (width, unit) {
			var o = $('wasavi_textwidth_guide'), display, left;
			if (!o) return;
			if (width <= 0) {
				display = 'none';
			}
			else {
				display = 'block';
				left = (this.elm.childNodes[0].offsetLeft + width * unit) + 'px';
			}
			if (display !== undefined && display != o.style.display) {
				o.style.display = display;
			}
			if (left !== undefined && left != o.style.left) {
				o.style.left = left;
				o.style.height = this.elm.offsetHeight + 'px';
				o.textContent = width;
			}
		},
		updateActiveRow: function () {
			Array.prototype.forEach.call(
				document.querySelectorAll('#wasavi_editor>div.current'),
				function (node) {node.removeAttribute('class');}
			);
			this.elm.childNodes[this.selectionStartRow].className = 'current';
		},
		insertChars: function (arg, text) {
			var iter = document.createNodeIterator(
				this.elm.childNodes[arg.row],
				window.NodeFilter.SHOW_TEXT, null, false);
			var totalLength = 0;
			var node;

			while ((node = iter.nextNode())) {
				var next = totalLength + node.nodeValue.length;
				if (totalLength <= arg.col && arg.col < next) {
					var pnode = node.previousSibling;
					var index = arg.col - totalLength;

					if (index == 0
					&&  pnode
					&&  pnode.nodeName == 'SPAN'
					&&  pnode.className == MARK_CLASS) {
						pnode.parentNode.insertBefore(document.createTextNode(text), pnode);
					}
					else {
						node.insertData(index, text);
					}

					arg.col += text.length;
					break;
				}
				totalLength = next;
			}

			return arg;
		},
		overwriteChars: function (arg, text) {
			var iter = document.createNodeIterator(
				this.elm.childNodes[arg.row], window.NodeFilter.SHOW_TEXT, null, false);
			var totalLength = 0;
			var node;
			var textOffset = 0;
			var rowTextLength = this.rows(arg).length;

			while (textOffset < text.length && (node = iter.nextNode())) {
				var next = totalLength + node.nodeValue.length;
				if (!(totalLength <= arg.col && arg.col < next)) {
					totalLength = next;
					continue;
				}

				var nodeValueOffset = Math.max(arg.col - totalLength, 0);
				var overwriteCount = 0;
				if (next >= rowTextLength) {
					overwriteCount = text.length - textOffset;
				}
				else {
					overwriteCount = Math.min(
						node.nodeValue.length - nodeValueOffset, text.length - textOffset);
				}

				node.nodeValue =
					node.nodeValue.substring(0, nodeValueOffset) +
					text.substring(textOffset, overwriteCount) +
					node.nodeValue.substring(nodeValueOffset + overwriteCount);
				arg.col += overwriteCount;
				textOffset += overwriteCount;
				totalLength = next;
			}

			fixLineTail(this.elm.childNodes[arg.row]);

			return arg;
		},
		shift: function (row, rowCount, shiftCount, shiftWidth, tabWidth, isExpandTab, indents) {
			if (rowCount < 1) return null;
			if (shiftWidth < 0) shiftWidth = 0;
			if (tabWidth < 1) tabWidth = 8;

			var shifted = multiply(' ', shiftWidth * Math.abs(shiftCount));
			var shiftLeftRegex = shifted.length ? new RegExp('^ {1,' + shifted.length + '}') : null;
			var currentIndents = [];

			function expandTab (row) {
				var marks = [];
				var marksInfo = {};
				var indentOriginal = '';
				var indentExpanded = '';
				var node = row.firstChild;
loop:			while (node) {
					switch (node.nodeType) {
					case 3:
						var left = '';
						var right = node.nodeValue;
						while (true) {
							var re;
							if ((re = /^\t/.exec(right))) {
								var nextTabCol = Math.floor(indentExpanded.length / tabWidth) * tabWidth +
												 tabWidth;
								var s = multiply(' ', nextTabCol - indentExpanded.length);
								indentOriginal += re[0];
								indentExpanded += s;
								left += s;
								right = right.substring(re[0].length);
							}
							else if ((re = /^ +/.exec(right))) {
								indentOriginal += re[0];
								indentExpanded += re[0];
								left += re[0];
								right = right.substring(re[0].length);
							}
							else if (right.length || !node.nextSibling) {
								node.nodeValue = left + right;
								break loop;
							}
							else {
								node.nodeValue = left + right;
								node = node.nextSibling;
								break;
							}
						}
						break;

					case 1:
						if (node.nodeName != 'SPAN' || node.className != MARK_CLASS) {
							throw new Error('unknown node found');
						}
						var next = node.nextSibling;
						var markName = dataset(node, 'index');
						marks.push([indentExpanded.length, node, markName]);
						marksInfo[markName] = indentOriginal.length;
						node.parentNode.removeChild(node);
						node = next;
						break;
					}
				}
				if (marks.length) {
					currentIndents.push([indentOriginal, marksInfo]);
				}
				else {
					currentIndents.push(indentOriginal);
				}
				row.normalize();
				return marks;
			}

			function shiftRight (row, marks) {
				var node = row.firstChild;
				if (node.nodeType != 3) return;
				node.insertData(0, shifted);
				for (var i = 0, goal = marks.length; i < goal; i++) {
					marks[i][0] += shifted.length;
				}
			}

			function shiftLeft (row, marks) {
				var node = row.firstChild;
				if (node.nodeType != 3) return;
				if (!shiftLeftRegex) return;
				var re = shiftLeftRegex.exec(node.nodeValue);
				if (!re) return;
				node.deleteData(0, re[0].length);
				for (var i = 0, goal = marks.length; i < goal; i++) {
					marks[i][0] = Math.max(0, marks[i][0] - re[0].length);
				}
			}

			function shiftByOriginalIndent (row, marks, indentInfo) {
				var node = row.firstChild;
				if (node.nodeType != 3) return;
				var indent, marksInfo;
				if (indentInfo instanceof Array) {
					indent = indentInfo[0];
					marksInfo = indentInfo[1];
				}
				else {
					indent = indentInfo;
				}
				node.nodeValue = indent + node.nodeValue.replace(/^[\t ]+/, '');
				if (!marksInfo) return;
				for (var i = 0, goal = marks.length; i < goal; i++) {
					var markName = marks[i][2];
					if (markName in marksInfo) {
						marks[i][0] = marksInfo[markName];
					}
					else {
						marks.push([marksInfo[markName], null, markName, false]);
					}
				}
			}

			function collectTabs (row, marks) {
				var node = row.firstChild;
				if (node.nodeType != 3) return;
				var re = /^ +/.exec(node.nodeValue);
				if (!re) return;
				var tabs = '';
				var left = re[0];
				var right = node.nodeValue.substring(re[0].length);
				var spaces = multiply(' ', tabWidth);
				var offsetExpanded = 0;
				var index;
				while ((index = left.indexOf(spaces)) === 0) {
					for (var i = 0, goal = marks.length; i < goal; i++) {
						if (marks[i][0] >= offsetExpanded) {
							marks[i][0] = Math.max(offsetExpanded, marks[i][0] - (tabWidth - 1));
						}
					}
					offsetExpanded += tabWidth;
					tabs += '\t';
					left = left.substring(spaces.length);
				}
				node.nodeValue = tabs + left + right;
			}

			function restoreMarks (row, marks) {
				if (marks.length == 0) return;
				marks.sort(function (a, b) {return b[0] - a[0]});
				for (var i = 0, goal = marks.length; i < goal; i++) {
					var offset = marks[i][0];
					var mark = marks[i][1];
					var text = row.firstChild;
					if (!mark) {
						mark = document.createElement('span');
						mark.className = MARK_CLASS;
						dataset(mark, 'index', marks[i][2]);
					}
					if (offset == text.nodeValue.length) {
						text.parentNode.insertBefore(mark, text.nextSibling);
					}
					else if (offset < text.nodeValue.length) {
						var rest = text.splitText(offset);
						rest.parentNode.insertBefore(mark, rest);
					}
				}
			}

			function nop () {}

			var goal = Math.min(row + rowCount, this.elm.childNodes.length);
			var doShift, doCollectTabs;
			if (indents) {
				doCollectTabs = isExpandTab ? nop : collectTabs;
				for (var i = row, j = 0; i < goal; i++) {
					var node = this.elm.childNodes[i];
					var marks = expandTab(node);
					shiftByOriginalIndent(node, marks, indents[j++]);
					doCollectTabs(node, marks);
					restoreMarks(node, marks);
				}
			}
			else {
				doShift = shiftCount == 0 ? nop : shiftCount < 0 ? shiftLeft : shiftRight;
				doCollectTabs = isExpandTab ? nop : collectTabs;
				for (var i = row; i < goal; i++) {
					var node = this.elm.childNodes[i];
					var marks = expandTab(node);
					doShift(node, marks);
					doCollectTabs(node, marks);
					restoreMarks(node, marks);
				}
			}

			return currentIndents;
		},
		deleteRange: function () {
			if (this.isLineOrientSelection) {
				return this.deleteRangeRows.apply(this, arguments);
			}
			var args = Array.prototype.slice.call(arguments);
			var func = popLastArg(args);
			var r = select.apply(this, args);
			var content = r.r.toString();
			var result = content.length;
			func && func(content, r.r.cloneContents());

			if (r.s.row == r.e.row) {
				r.r.deleteContents();
				r.r.detach();
				this.elm.childNodes[r.s.row].normalize();
			}
			else {
				r.r.detach();

				var r2 = document.createRange();
				setRange.call(this, r2, r.s);
				r2.setEndAfter(this.elm.childNodes[r.s.row].lastChild);
				r2.deleteContents();

				setRange.call(this, r2, r.e);
				r2.setEndAfter(this.elm.childNodes[r.e.row].lastChild);
				this.elm.childNodes[r.s.row].appendChild(r2.extractContents());
				this.elm.childNodes[r.s.row].normalize();

				if (r.e.row - r.s.row >= 1) {
					r2.setStartBefore(this.elm.childNodes[r.s.row + 1]);
					r2.setEndAfter(this.elm.childNodes[r.e.row]);
					r2.deleteContents();
				}

				r2.detach();
			}
			this.selectionStart = r.s;
			this.selectionEnd = r.s;

			return result;
		},
		deleteRangeRows: function () {
			var args = Array.prototype.slice.call(arguments);
			var func = popLastArg(args);
			var r = selectRows.apply(this, args);
			var content = r.r.toString();
			var result = r.e.row - r.s.row + 1;
			func && func(content, r.r.cloneContents());
			r.r.deleteContents();
			r.r.detach();
			if (this.elm.childNodes.length == 0) {
				this.elm
					.appendChild(document.createElement('div'))
					.appendChild(document.createTextNode('\n'));
			}
			if (r.s.row >= this.elm.childNodes.length) {
				r.s.row = this.elm.childNodes.length - 1;
			}
			this.selectionStart = r.s;
			this.selectionEnd = r.s;

			return result;
		},
		selectRows: function (count) {
			var s = this.selectionStart;
			var e = new Wasavi.Position(
				Math.min(this.selectionEndRow + count - 1,
				this.elm.childNodes.length - 1), 0);
			var r = selectRows.call(this, s, e);
			r.r.detach();
			this.selectionStart = r.s;
			this.selectionEnd = r.e;
			this.isLineOrientSelection = true;
			return r.e.row - r.s.row + 1;
		},
		divideLine: function (n) {
			n || (n = this.selectionStart);
			var div1 = this.elm.childNodes[n.row];
			var div2 = this.elm.insertBefore(document.createElement('div'), div1.nextSibling);
			var r = document.createRange();
			var iter = document.createNodeIterator(
				div1, window.NodeFilter.SHOW_TEXT, null, false);
			var totalLength = 0;
			var node;
			while ((node = iter.nextNode())) {
				var next = totalLength + node.nodeValue.length;
				if (totalLength <= n.col && n.col < next) {
					r.setStart(node, n.col - totalLength);
					break;
				}
				else if (n.col == next) {
					r.setStartAfter(node);
					break;
				}
				totalLength = next;
			}
			r.setEndAfter(div1.lastChild);
			div2.appendChild(r.extractContents());
			r.detach();
			fixLineTail(div1);
			fixLineTail(div2);
			n.row++;
			n.col = 0;
			this.selectionStart = n;
			this.selectionEnd = n;
		},
		extendSelectionTo: function (n) {
			var s = this.selectionStart;
			var e = this.selectionEnd;
			if (typeof n == 'number') {
				n = this.linearPositionToBinaryPosition(n);
			}
			if (n instanceof Wasavi.Position) {
				if (n.lt(s)) {
					this.selectionStart = n;
				}
				else if (n.gt(e)) {
					this.selectionEnd = n;
				}
			}
		},
		linearPositionToBinaryPosition: function (n) {
			var result;
			var iter = document.createNodeIterator(
				this.elm, window.NodeFilter.SHOW_TEXT, null, false);
			var totalLength = 0;
			var rowTopLength = 0;
			var node;
			var row = 0;

			while ((node = iter.nextNode())) {
				var next = totalLength + node.nodeValue.length;
				if (totalLength <= n && n < next) {
					result = new Wasavi.Position(row, n - rowTopLength);
					break;
				}
				if (node.nodeValue.substr(-1) == '\n') {
					row++;
					rowTopLength = next;
				}
				totalLength = next;
			}

			return result;
		},
		binaryPositionToLinearPosition: function (a) {
			var r = document.createRange();
			setRange.call(this, r, new Wasavi.Position(0, 0), false);
			setRange.call(this, r, a, true);
			var result = r.toString().length;
			r.detach();
			return result;
		},
		emphasis: function (s, e, className) {
			return typeof e == 'number' ?
				this.emphasis_p_length(s, e, className) :
				this.emphasis_p_p(s, e, className);
		},
		emphasis_p_length: function (s, length, className) {
			if (typeof s == 'number') {
				s = this.linearPositionToBinaryPosition(s);
			}
			else {
				s || (s = this.selectionStart);
			}

			var isInRange = false;
			var offset = 0;
			var r = document.createRange();
			var result = [];
			className || (className = EMPHASIS_CLASS);

			function createSpan () {
				var span = document.createElement('span');
				span.className = className;
				result.push(span);
				return span;
			}
whole:
			for (; length > 0 && s.row < this.elm.childNodes.length; s.row++) {
				var iter = document.createNodeIterator(
					this.elm.childNodes[s.row], window.NodeFilter.SHOW_TEXT, null, false);
				var totalLength = 0;
				var node;
				while ((node = iter.nextNode())) {
					if (!isInRange) {
						var next = totalLength + node.nodeValue.length;
						if (totalLength <= s.col && s.col < next) {
							offset = s.col - totalLength;
							isInRange = true;
						}
						totalLength = next;
					}
					if (isInRange) {
						var nodeLength = node.nodeValue.length;
						if (offset + length <= nodeLength) {
							r.setStart(node, offset);
							r.setEnd(node, offset + length);
							r.surroundContents(createSpan());
							length = 0;
							break whole;
						}
						else if (nodeLength > 0) {
							r.setStart(node, offset);
							r.setEnd(node, nodeLength);
							r.surroundContents(createSpan());
							length -= nodeLength - offset;
							offset = 0;
							node = iter.nextNode();
						}
					}
				}
			}

			r.detach();
			return result;
		},
		emphasis_p_p: function (s, e, className) {
			s || (s = this.selectionStart);
			e || (e = this.selectionEnd);
			className || (className = EMPHASIS_CLASS);

			if (s.gt(e)) {
				var t = s; s = e; e = t;
			}

			var result = [];
			var r = document.createRange();
			var f = document.createDocumentFragment();
			var snode = this.elm.childNodes[s.row];
			var enode = this.elm.childNodes[e.row];
			r.setStart(snode.firstChild, s.col);
			r.setEnd(enode.firstChild, e.col);
			f.appendChild(r.extractContents());

			function createSpan (content) {
				var span = document.createElement('span');
				span.className = className;
				span.textContent = content || '';
				result.push(span);
				return span;
			}

			if (f.childNodes.length >= 2) {
				snode.appendChild(createSpan(f.firstChild.textContent));
				enode.insertBefore(createSpan(f.lastChild.textContent), enode.firstChild);
				f.removeChild(f.firstChild);
				f.removeChild(f.lastChild);
				if (f.childNodes.length) {
					for (var i = 0, goal = f.childNodes.length; i < goal; i++) {
						f.childNodes[i].replaceChild(
							createSpan(f.childNodes[i].textContent), f.childNodes[i].firstChild);
					}
					r.insertNode(f);
				}
			}
			else {
				var span = createSpan();
				span.appendChild(f);
				r.insertNode(span);
			}

			r.detach();
			return result;
		},
		unEmphasis: function (className, start, end) {
			var nodes = this.getSpans(className || EMPHASIS_CLASS, start, end);
			if (nodes.length) {
				var r = document.createRange();
				for (var i = 0; i < nodes.length; i++) {
					var node = nodes[i];
					var pa = node.parentNode;
					r.selectNodeContents(node);
					var f = r.extractContents();
					r.setStartBefore(node);
					r.insertNode(f);
					r.selectNode(node);
					r.deleteContents();
					pa.normalize();
				}
				r.detach();
			}
		},
		offsetBy: function (s, offset, treatLastLineAsNormal) {
			var row5 = s.row;
			var col = s.col;
			var last = this.elm.childNodes.length - 1;
			while (offset > 0) {
				var node = this.elm.childNodes[row5].textContent;
				if (!treatLastLineAsNormal && row5 == last) {
					node = trimTerm(node);
				}
				var rest = node.length - col;
				col += offset;
				offset -= rest;
				if (col >= node.length) {
					if (row5 == last) {
						col = node.length;
						offset = 0;
					}
					else {
						row5++;
						col = 0;
					}
				}
			}
			return new Wasavi.Position(row5, col);
		},
		regalizeSelectionRelation: function () {
			var s = this.selectionStart;
			var e = this.selectionEnd;
			if (s.row > e.row || s.row == e.row && s.col > e.col) {
				this.selectionStart = e;
				this.selectionEnd = s;
			}
		},

		// getter properties
		get rowLength () {
			return this.elm.childNodes.length;
		},
		get value () {
			return trimTerm(toNativeControl(this.elm.textContent));
		},
		get selected () {
			return this.selectionStart.ne(this.selectionEnd);
		},
		get selectionStart () {
			return new Wasavi.Position(this.selectionStartRow, this.selectionStartCol);
		},
		get selectionStartRow () {
			return dataset(this.elm, 'wasaviSelStartRow') - 0;
		},
		get selectionStartCol () {
			return dataset(this.elm, 'wasaviSelStartCol') - 0;
		},
		get selectionEnd () {
			return new Wasavi.Position(this.selectionEndRow, this.selectionEndCol);
		},
		get selectionEndRow () {
			return dataset(this.elm, 'wasaviSelEndRow') - 0;
		},
		get selectionEndCol () {
			return dataset(this.elm, 'wasaviSelEndCol') - 0;
		},
		get scrollTop () {
			return this.elm.scrollTop;
		},
		get scrollLeft () {
			return this.elm.scrollLeft;
		},

		// setter properties
		set value (v) {
			emptyNodeContents(this.elm);
			v = v
				.replace(/\r\n/g, '\n')
				.replace(/[\u0000-\u0008\u000b-\u001f]/g, function (a) {
					return String.fromCharCode(0x2400 + a.charCodeAt(0));
				})
				.split('\n');
			for (var i = 0, goal = v.length; i < goal; i++) {
				var div = this.elm.appendChild(document.createElement('div'));
				div.textContent = v[i] + '\n';
			}
		},
		set selectionStart (v) {
			if (typeof v == 'number') {
				v = this.linearPositionToBinaryPosition(v) || new Wasavi.Position(0, 0);
			}
			if (v instanceof Wasavi.Position) {
				dataset(this.elm, 'wasaviSelStartRow', v.row);
				dataset(this.elm, 'wasaviSelStartCol', v.col);
			}
		},
		set selectionEnd (v) {
			if (typeof v == 'number') {
				v = this.linearPositionToBinaryPosition(v) || new Wasavi.Position(0, 0);
			}
			if (v instanceof Wasavi.Position) {
				dataset(this.elm, 'wasaviSelEndRow', v.row);
				dataset(this.elm, 'wasaviSelEndCol', v.col);
			}
		},
		set scrollTop (v) {
			this.elm.scrollTop = v;
		},
		set scrollLeft (v) {
			this.elm.scrollLeft = v;
		}
	};
};

Wasavi.LiteralInput = function () {
	this.value = '';
	this.radix = 10;
	this.pattern;
	this.processor = '0';
	this.maxLength = 0;
	this.message = '';
};
Wasavi.LiteralInput.prototype = {
	PROCESSOR_LITERAL: 'literal',
	PROCESSOR_CODEPOINT: 'codepoint',

	process: function (c) {
		return this['process_' + this.processor].call(this, c, c.charCodeAt(0));
	},
	process_0: function (c, code) {
		if (code >= 48 && code <= 57) {
			this.radix = 10;
			this.pattern = /^[0-9]$/;
			this.processor = this.PROCESSOR_CODEPOINT;
			this.maxLength = 3;
			this.message = _('dec:');
			return this.process.call(this, c);
		}
		else if (c == 'o' || c == 'O') {
			this.radix = 8;
			this.pattern = /^[0-7]$/;
			this.processor = this.PROCESSOR_CODEPOINT;
			this.message = _('oct:');
			this.maxLength = 3;
		}
		else if (c == 'x' || c == 'X') {
			this.radix = 16;
			this.pattern = /^[0-9a-f]$/i;
			this.processor = this.PROCESSOR_CODEPOINT;
			this.message = _('hex:');
			this.maxLength = 2;
		}
		else if (c == 'u' || c == 'U') {
			this.radix = 16;
			this.pattern = /^[0-9a-f]$/i;
			this.processor = this.PROCESSOR_CODEPOINT;
			this.message = _('unicode hex:');
			this.maxLength = c == 'u' ? 4 : 6;
		}
		else {
			this.processor = this.PROCESSOR_LITERAL;
			return this.process.call(this, c);
		}
		return null;
	},
	process_codepoint: function (c, code) {
		if (code == 27) {
			this.value = '';
			return this.getResult();
		}
		if (code == 10 || code == 13) {
			return this.getResult();
		}
		if (this.pattern.test(c)) {
			this.value += c;
			this.message += c;
			if (this.value.length >= this.maxLength) {
				return this.getResult();
			}
		}
		else {
			return this.getResult(c);
		}
		return null;
	},
	process_literal: function (c, code) {
		return {processor:this.processor, sequence:[c]};
	},
	getResult: function (c) {
		var result = {processor:this.processor};
		if (this.value != '') {
			var value = parseInt(this.value, this.radix);
			if (value < 0 || value > 0x10ffff) {
				result.error = _('Invalid codepoint.');
				return result;
			}
			result.sequence = this.toUTF16(value);
		}
		if (c != undefined) {
			result.trail = c;
		}
		return result;
	},
	toUTF16: function (cp) {
		/*
		 * U+10FFFF (1 0000 1111 1111 1111 1111)
		 *           * **** HHHH HHLL LLLL LLLL
		 *
		 * high surrogate: 1101 10_11 1111 1111
		 *                         ** **HH HHHH
		 *  low surrogate: 1101 11_11 1111 1111
		 *                         LL LLLL LLLL
		 */
		var p = (cp & 0x1f0000) >> 16;
		var o = cp & 0xffff;
		return p ?
			[
				String.fromCharCode(0xd800 | ((p - 1) << 6) | ((o & 0xfc00) >> 10)),
				String.fromCharCode(0xdc00 | (o & 0x03ff))
			] :
			[
				String.fromCharCode(o)
			];
	}
};

Wasavi.InputHandler = function (appProxy) {
	this.app = appProxy;
	this.inputHeadPosition = null;
	this.count = 1
	this.suffix = '';
	this.text = this.textFragment = this.stroke = '';
	this.overwritten = null;
	this.prevLengthText = [];
	this.prevLengthStroke = false;
	this.stackText = [];
	this.stackStroke = [];
};
Wasavi.InputHandler.prototype = {
	dispose: function () {
		this.app = this.inputHeadPosition = null;
	},
	reset: function (count, suffix, position, initStartPosition) {
		this.inputHeadPosition = position || null;
		this.count = count || 1;
		this.suffix = suffix || '';
		this.text = this.textFragment = this.stroke = '';
		this.overwritten = null;
		initStartPosition && this.setStartPosition(this.inputHeadPosition);
	},
	close: function () {
		this.flush();
		this.reset();
	},
	newState: function (position) {
		this.flush();
		this.inputHeadPosition = position || null;
		this.text = this.textFragment = this.stroke = '';
		this.overwritten = null;
		this.app.editLogger.close();
		this.app.editLogger.open('log-editing');
	},
	setStartPosition: function (pos) {
		var p = pos.clone();
		p.col--;
		this.app.marks.setInputOriginMark(p);
	},
	getStartPosition: function () {
		var p = this.app.marks.getInputOriginMark();
		if (p) {
			p = p.clone();
			p.col++;
		}
		return p;
	},
	invalidateHeadPosition: function () {
		this.inputHeadPosition = null;
	},
	pushText: function () {
		this.stackText.push([
			this.text.length, this.textFragment.length,
			this.prevLengthText[0], this.prevLengthText[1]
		]);
	},
	popText: function () {
		if (this.stackText.length == 0) {
			throw new Error('popText: stackText is empty.');
		}
		var o = this.stackText.pop();
		this.text = this.text.substring(0, o[0]);
		this.textFragment = this.textFragment.substring(0, o[1]);
		this.prevLengthText[0] = o[2];
		this.prevLengthText[1] = o[3];
	},
	updateText: function (e) {
		var result = e.code == 0x000d ? '\u000a' : this.app.keyManager.code2letter(e.code);
		this.prevLengthText[0] = this.text.length;
		this.prevLengthText[1] = this.textFragment.length;
		this.text += result;
		this.textFragment += result;
		return result;
	},
	ungetText: function () {
		if (this.prevLengthText[0] !== undefined) {
			this.text = this.text.substring(0, this.prevLengthText[0]);
		}
		if (this.prevLengthText[1] !== undefined) {
			this.textFragment = this.textFragment.substring(0, this.prevLengthText[1]);
		}
	},
	pushStroke: function () {
		this.stackStroke.push([
			this.stroke.length, this.prevLengthStroke
		]);
	},
	popStroke: function () {
		if (this.stackStroke.length == 0) {
			throw new Error('popStroke: stackStroke is empty.');
		}
		var o = this.stackStroke.pop();
		this.stroke = this.stroke.substring(0, o[0]);
		this.prevLengthStroke = o[1];
	},
	updateStroke: function (e) {
		this.prevLengthStroke = this.stroke.length;
		this.stroke += e.code == 0x000d ? '\u000a' : this.app.keyManager.toInternalString(e);
	},
	ungetStroke: function () {
		if (this.prevLengthStroke !== undefined) {
			this.stroke = this.stroke.substring(0, this.prevLengthStroke);
		}
	},
	updateHeadPosition: function () {
		if (this.inputHeadPosition === null) {
			this.inputHeadPosition = this.app.buffer.selectionStart;
		}
		return this.inputHeadPosition;
	},
	updateOverwritten: function () {
		if (this.overwritten === null) {
			this.overwritten = this.app.buffer.rows(this.app.buffer.selectionStartRow);
		}
		return this.overwritten;
	},
	flush: function () {
		function resolveEscape (s) {
			var result = s;
			result = result.replace(/\u0016[\s\S]|[\s\S]/g, function (a) {
				return a.charAt(a.length == 2 ? 1 : 0);
			});
			result = result.replace(/[\u0008\u007f]/g, '');
			return result;
		}
		var s;
		if (this.textFragment.length && (s = resolveEscape(this.textFragment)).length) {
			if (this.app.inputMode == 'edit') {
				this.app.editLogger.write(
					Wasavi.EditLogger.ITEM_TYPE.INSERT,
					this.inputHeadPosition, s
				);
			}
			else {
				this.overwritten !== null && this.app.editLogger.write(
					Wasavi.EditLogger.ITEM_TYPE.OVERWRITE,
					this.inputHeadPosition, s, this.overwritten
				);
				this.overwritten = null;
			}
			this.textFragment = '';
		}
	}
};

Wasavi.Completer = function (appProxy, alist) {

	function CompleteItem (patterns, index, onRequestCandidates, opts) {
		this.candidates = null;
		this.candidatesFiltered = null;
		this.currentIndex = -1;
		this.prefix = false;
		this.lastLoad = 0;
		this.lastInvert = null;

		this.patterns = patterns instanceof Array ? patterns : [patterns];
		this.index = index;
		this.onRequestCandidates = onRequestCandidates;
		this.ttlMsecs = 0;

		if (opts) {
			if ('onFoundContext' in opts) {
				this.onFoundContext = opts.onFoundContext;
			}
			if ('onSetPrefix' in opts) {
				this.onSetPrefix = opts.onSetPrefix;
			}
			if ('onComplete' in opts) {
				this.onComplete = opts.onComplete;
			}
			if ('ttlSecs' in opts) {
				this.ttlMsecs = (opts.ttlSecs || 0) * 1000;
			}
			if ('isVolatile' in opts) {
				this.isVolatile = !!opts.isVolatile;
			}
		}
	}
	CompleteItem.prototype = {
		get isCandidatesAvailable () {
			return this.candidates !== null
				&& (this.ttlMsecs == 0 || Date.now() - this.lastLoad < this.ttlMsecs);
		},

		//
		reset: function () {
			this.prefix = false;
			if (this.isVolatile) {
				this.candidates = null;
			}
		},
		prev: function () {
			return this.next(true);
		},
		next: function (invert) {
			var index;
			var result;

			if (!this.candidates) {
				return result;
			}
			if (!this.candidatesFiltered) {
				this.candidatesFiltered = this.updateFilteredCandidates();
			}
			if (!this.candidatesFiltered || this.candidatesFiltered.length == 0) {
				return result;
			}
			if (this.currentIndex < 0 || this.currentIndex >= this.candidatesFiltered.length) {
				this.currentIndex = this.findIndex();
			}

			invert = !!invert;
			if (typeof this.lastInvert == 'boolean' && this.lastInvert != invert) {
				this.currentIndex = (
					this.currentIndex +
					(invert ? this.candidatesFiltered.length - 2 : 2)
				) % this.candidatesFiltered.length;
			}

			index = this.currentIndex;
			result = this.candidatesFiltered[this.currentIndex];

			this.currentIndex = (
				this.currentIndex +
				(invert ? this.candidatesFiltered.length - 1 : 1)
			) % this.candidatesFiltered.length;

			this.lastInvert = invert;

			return {
				index:index,
				piece:result
			};
		},

		//
		findIndex: function () {
			var result = 0;
			for (var i = 0, goal = this.candidatesFiltered.length; i < goal; i++) {
				if (this.candidatesFiltered[i].indexOf(this.prefix) == 0) {
					result = i;
					break;
				}
			}
			return result;
		},
		setPrefix: function (prefix, force) {
			if (this.prefix === false || force) {
				if (this.onSetPrefix) {
					var tmp = this.onSetPrefix(prefix);
					if (typeof tmp == 'string') {
						prefix = tmp;
					}
				}
				this.prefix = prefix;
				this.currentIndex = -1;
				this.candidatesFiltered = null;
			}
		},
		updateFilteredCandidates: function () {
			return this.candidates.filter(function (a) {
				return a.indexOf(this.prefix) == 0;
			}, this);
		},
		requestCandidates: function (value, callback) {
			function initCandidates (candidates) {
				var saved = {
					candidates:this.candidates,
					currentIndex:this.currentIndex,
					lastLoad:this.lastLoad
				};

				this.candidates = candidates;
				this.currentIndex = -1;
				this.lastLoad = Date.now();

				if (!callback()) {
					this.candidates = saved.candidates;
					this.currentIndex = saved.currentIndex;
					this.lastLoad = saved.lastLoad;
				}
			}
			if (typeof this.onRequestCandidates == 'function') {
				this.onRequestCandidates(this.prefix, initCandidates.bind(this), value);
			}
			else {
				initCandidates.call(this, []);
			}
		}
	};

	function CompleteContext (item, pos, offset, pieceIndex, subPieceIndex, pieces, subPieces) {
		this.item = item;
		this.pos = pos;
		this.offset = offset;
		this.pieceIndex = pieceIndex;
		this.subPieceIndex = subPieceIndex;
		this.pieces = pieces;
		this.subPieces = subPieces;

		this.item.setPrefix(this.subPieces[this.subPieceIndex].substring(0, this.offset));
	}
	CompleteContext.prototype = {
		getResult: function (invert) {
			var completedPiece = this.item.next(invert);
			if (this.item.onComplete) {
				var tmp = this.item.onComplete(
					completedPiece ? completedPiece.piece : '',
					this.subPieces[this.subPieceIndex]
				);
				if (typeof tmp == 'string') {
					this.item.currentIndex = -1;
					this.item.setPrefix(tmp, true);
					completedPiece = this.item.next(invert);
				}
			}

			if (!completedPiece) {
				return false;
			}

			var subPieces = this.subPieces.slice(1);
			var pos = this.pos - this.offset + completedPiece.piece.length;

			subPieces[this.subPieceIndex - 1] = completedPiece.piece;
			this.offset = completedPiece.piece.length;

			var pieces = this.pieces.slice(0);
			pieces[this.pieceIndex] = subPieces.join('');

			return {
				pos:pos,
				value:pieces.join('|'),
				length:this.item.candidates.length,
				filteredLength:this.item.candidatesFiltered.length,
				completed:completedPiece
			}
		}
	};

	var COMPLETION_NOTIFY_TTL_SECS = 60;
	var COMPLETION_NOTIFY_DELAY_SECS = 0.1;
	var TIMEOUT_SECS = 30;

	var list;
	var running = false;
	var notifierTimer;
	var timeoutTimer;

	// privates
	function init (alist) {
		list = (alist || []).map(function (arg) {
			var o = Object.create(CompleteItem.prototype);
			return CompleteItem.apply(o, arg) || o;
		});
	}
	function getExCommandParseResult (value) {
		var result = [];

		do {
			if (/^\s"/.test(value)) {
				result.push({range:'', rest:value});
				break;
			}

			/*
			 * range :=
			 *     address? (delimiter address?)*
			 *
			 * address :=
			 *     main-address offset?
			 *
			 * main-address :=
			 *     .
			 *     $
			 *     \d+
			 *     '[a-z`']
			 *     / ... /
			 *     ? ... ?
			 *     [+-]\d*
			 *
			 * offset :=
			 *     [+-]\d*
			 *
			 * delimiter :=
			 *     ,
			 *     ;
			 */
			var range = /^(?:\s*(?:\.|\$|\d+|'[a-z`']|\/(?:\\\/|[^\/])*\/|\?(?:\\\?|[^\?])*\?|[+\-]\d*)(?:[+\-]\d*)?)?(?:(?:\s*[,;])(?:\s*(?:\.|\$|\d+|'[a-z`']|\/(?:\\\/|[^\/])*\/|\?(?:\\\?|[^\?])*\?|[+\-]\d*)(?:[+\-]\d*)?)?)*\s*/.exec(value);
			value = value.substring(range[0].length);

			/*
			 * rest
			 */
			var rest = /^(?:\u2416\||[^\|])*/.exec(value);
			value = value.substring(rest[0].length);
			result.push({range:range[0], rest:rest[0]});
			if (value.charAt(0) == '|') {
				value = value.substring(1);
				value == '' && result.push({range:'', rest:''});
			}
		} while (value.length);

		return result;
	}
	function findCompleteContext (value, pos) {
		var result = null, errorMessage = null;
		var commands = getExCommandParseResult(value);

		list.some(function (item) {
			var offset = 0;
			var pieces = [];

			commands.forEach(function (command) {
				var args = command.range + command.rest;
				pieces.push(args);

				var argsForMatch = multiply(' ', command.range.length) + command.rest;

				item.patterns.forEach(function (pattern) {
					var re = pattern.exec(argsForMatch);
					if (!re) return;

					re[1] = command.range;

					var subOffset = offset;
					for (var i = 1; i < re.length; subOffset += re[i++].length) {
						if (re[i] == undefined) re[i] = '';
						if (i != item.index || result) continue;
						if (!(subOffset <= pos && pos <= subOffset + re[i].length)) continue;

						if (item.onFoundContext) {
							var a = item.onFoundContext(re[i], pos - subOffset);
							a.subPieces.unshift(i, 1);
							re.splice.apply(re, a.subPieces);
							result = new CompleteContext(
								item, pos, a.cursorOffset,
								pieces.length - 1, i + a.subPieceIndex,
								pieces, re
							);
						}
						else {
							result = new CompleteContext(
								item, pos, pos - subOffset,
								pieces.length - 1, i,
								pieces, re
							);
						}
					}
					offset += args.length + 1;
				});
			});

			return !!result || errorMessage != null;
		});

		return errorMessage || result;
	}
	function startNotifierTimer (callback) {
		stopNotifierTimer();

		notifierTimer = setTimeout(function () {
			notifierTimer = null;
			appProxy.notifier.show(_('completing...'), 1000 * COMPLETION_NOTIFY_TTL_SECS);
		}, 1000 * COMPLETION_NOTIFY_DELAY_SECS);

		timeoutTimer = setTimeout(function () {
			timeoutTimer = null;
			stopNotifierTimer();
			running = false;
			callback(_('completion timed out'));
			callback.__timed_out__ = true;
		}, 1000 * TIMEOUT_SECS);
	}
	function stopNotifierTimer () {
		if (notifierTimer) {
			clearTimeout(notifierTimer);
			notifierTimer = null;
		}
		if (timeoutTimer) {
			clearTimeout(timeoutTimer);
			timeoutTimer = null;
		}
	}

	// publics
	function add (patterns, index, handler) {
		list.push(new CompleteItem(patterns, index, handler));
		return this;
	}
	function reset () {
		list.forEach(function (item) {
			item.reset();
		});
	}
	function run (value, pos, invert, callback) {
		if (running) {
			callback();
			return;
		}

		var ctx = findCompleteContext(value, pos);
		if (typeof ctx == 'string') {
			callback(ctx);
			return;
		}
		else if (!ctx) {
			callback();
			return;
		}

		if (ctx.item.isCandidatesAvailable) {
			callback(ctx.getResult(invert));
			return;
		}

		running = true;
		startNotifierTimer(callback);
		ctx.item.requestCandidates(value, function () {
			stopNotifierTimer();
			running = false;
			if (callback.__timed_out__) {
				return false;
			}
			else {
				callback(ctx.getResult(invert));
				return true;
			}
		});
	}
	function dispose () {
		appProxy = list = null;
	}

	publish(this,
		add, reset, run, dispose,
		{
			running:function () {return running}
		}
	);
	init(alist);
};

// vim:set ts=4 sw=4 fenc=UTF-8 ff=unix ft=javascript fdm=marker :
