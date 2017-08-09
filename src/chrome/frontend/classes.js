/**
 * wasavi: vi clone implemented in javascript
 * =============================================================================
 *
 *
 * @author akahuku@gmail.com
 */
/**
 * Copyright 2012-2017 akahuku, akahuku@gmail.com
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

(function (g) {

'use strict';

const Wasavi = g.Wasavi;

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
		this.row = minmax(0, this.row, t.rowLength - 1);
		this.col = minmax(0, this.col, t.rows(this.row).length - (this.row == t.rowLength - 1 ? 0 : 1));
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
			var args = toArray(arguments);
			var format = getMessage(args.shift());
			return format.replace(/\{(?:([a-z]+):)?(\d+)\}/ig, function ($0, $1, $2) {
				return $1 == undefined || $1 == '' ?
					toVisibleString(args[$2]) : getPluralNoun($1, args[$2]);
			});
		};
	}
	function init () {
		const PLURAL_FUNCTION_SIGNATURE = '_plural_rule@function';
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
	function VariableItem (name, type, defaultValue, subSetter, opts) {
		opts || (opts = {});
		this.name = name;
		this.type = type;
		this.isLateBind = type == 'r';
		this.isDynamic = 'isDynamic' in opts ? !!opts.isDynamic : false;
		this.isAsync = 'isAsync' in opts ? !!opts.isAsync : false;
		this.defaultValue = defaultValue;
		this.subSetter = subSetter;
		this.nativeValue = defaultValue;
		this.snapshots = undefined;
		this.assignState = 0;
	}
	VariableItem.prototype = {
		ASSIGN_STATE_INITIAL: 0,
		ASSIGN_STATE_WARNED: 1,
		ASSIGN_STATE_ERRORED: 2,

		get value () {
			return this.nativeValue;
		},
		get visibleString () {
			switch (this.type) {
			case 'b':
				return (this.nativeValue ? '  ' : 'no') + this.name;
			case 'i': case 'I': case 's': case 'r':
				var value = this.nativeValue.toString();
				if (/[\s"']/.test(value)) {
					value = "'" + value.replace(/["']/g, '\\$&') + "'";
				}
				return '  ' + this.name + '=' + value;
			default:
				throw new TypeError('*invalid type for visibleString: ' + this.type + ' *');
			}
		},
		getInfo: function () {
			var that = this;
			return {
				get name () {return that.name},
				get type () {return that.type},
				get isLateBind () {return that.isLateBind},
				get isDynamic () {return that.isDynamic},
				get isAsync () {return that.assignState ? false : that.isAsync},
				get defaultValue () {return that.defaultValue}
			};
		},
		setValue: function (v) {
			try {
				this.assignState = this.ASSIGN_STATE_INITIAL;

				switch (this.type) {
				case 'b':
					v = Boolean(v);
					if (typeof v != 'boolean') throw new TypeError(_('Invalid boolean value'));
					break;
				case 'i':
					if (typeof v == 'string' && !/^[0-9]+$/.test(v)) {
						throw new TypeError(_('Invalid integer value'));
					}
					v = parseInt(v, 10);
					if (typeof v != 'number' || isNaN(v)) {
						throw new TypeError(_('Invalid integer value'));
					}
					break;
				case 'I':
					if (!/^[-+]?[0-9]+$/.test(v)) {
						throw new TypeError(_('Invalid integer value'));
					}
					v = parseInt(v, 10);
					if (typeof v != 'number' || isNaN(v)) {
						throw new TypeError(_('Invalid integer value'));
					}
					break;
				case 's':
					v = String(v);
					if (typeof v != 'string') throw new TypeError(_('Invalid string value'));
					break;
				case 'r':
					if (typeof v != 'string') throw new TypeError(_('Invalid regex source string value'));
					break;
				default:
					throw new TypeError('*Invalid type for value getter: ' + this.type + ' *');
				}

				if (this.subSetter) {
					v = this.subSetter(v);
					if (v == undefined) {
						this.assignState = this.ASSIGN_STATE_WARNED;
						return v;
					}
				}

				if (v instanceof Promise) {
					return v.then(v => {
						this.nativeValue = v;
						return this;
					});
				}

				return this.nativeValue = v;
			}
			catch (e) {
				this.assignState = this.ASSIGN_STATE_ERRORED;
				throw e;
			}
		},
		getBinder: function () {
			switch (this.type) {
			case 'r':
				return (function (v) {
					return function () {
						return app.low.getFindRegex({
							pattern: v.nativeValue,
							csOverride: '',
							globalOverride: '',
							multilineOverride: ''
						});
					}
				})(this);
			default:
				throw new TypeError('*invalid type for getBinder: ' + this.type + ' *');
			}
		},
		reset: function () {
			if (this.isDynamic) return;
			this.nativeValue = this.defaultValue;
		},
		saveSnapshot: function (name) {
			if (this.isDynamic) return;

			if (!this.snapshots) {
				this.snapshots = {};
			}

			this.snapshots[name] = this.value;
		},
		loadSnapshot: function (name) {
			if (this.isDynamic) return;
			if (!this.snapshots) return;
			if (!(name in this.snapshots)) return;

			this.nativeValue = this.snapshots[name];
		}
	};

	var vars = {};
	var names = {};
	function init () {
		internals = internals.sort(function (a, b) {
			return a[0].localeCompare(b[0]);
		})
		.map(function (value, i) {
			for (var j = value.length; j < 5; j++) {
				value.push(undefined);
			}
			var v = new VariableItem(value[0], value[1], value[2], value[3], value[4]);
			names[v.name] = i;
			if (v.isLateBind) {
				v.setValue(v.nativeValue);
				Object.defineProperty(vars, v.name, {
					get:v.getBinder(),
					configurable:false,
					enumerable:true
				});
			}
			else {
				try {v.setValue(v.nativeValue)} catch (e) {}
				vars[v.name] = v.value;
			}
			return v;
		});
	}
	function getItem (name) {
		name = name.replace(/^(?:no|inv)/, '');
		if (name in abbrevs) {
			name = abbrevs[name];
		}
		return name in names ? internals[names[name]] : null;
	}

	//
	function getInfo (name) {
		var item = getItem(name);
		return item ? item.getInfo() : null;
	}
	function getData (name, reformat) {
		var item = getItem(name);
		return item ? (reformat ? item.visibleString : item.value) : null;
	}
	function setData (name, value, skipSubSetter) {
		var result;
		var off = false;
		var invert = false;
		if (/^no/.test(name)) {
			name = name.substring(2);
			off = true;
		}
		else if (/^inv/.test(name)) {
			name = name.substring(3);
			invert = off = true;
		}
		var item = getItem(name);
		if (!item) {
			return _('Unknown option: {0}', name);
		}
		if (item.type == 'b') {
			if (value !== undefined) {
				return _('An extra value assigned to {0} option.', item.name);
			}
			if (invert) {
				result = item.setValue(!item.value);
			}
			else {
				result = item.setValue(!off);
			}
		}
		else if (off) {
			return _('{0} option is not a boolean.', item.name);
		}
		else {
			var subSetter;
			if (skipSubSetter) {
				subSetter = item.subSetter;
				item.subSetter = null;
			}

			try {
				result = item.setValue(value);
			}
			catch (e) {
				return e.message;
			}
			finally {
				if (subSetter) {
					item.subSetter = subSetter;
				}
			}
		}

		if (result instanceof Promise) {
			return result.then(item => {
				return vars[item.name] = item.value;
			});
		}
		else {
			vars[item.name] = item.value;
			return null;
		}
	}
	function dump (cols, all) {
		const phaseThreshold = 20;
		const gap = 1;
		var result = [_('*** options ***')];
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
					result.push(toVisibleString(tmp[j]));
				}
			}
		}
		return result;
	}
	function dumpData () {
		var index = [];
		var content = [];
		var ab = reverseObject(abbrevs);
		index.push('** version: ' + app.version + '**', '', '');
		for (var i = 0, goal = internals.length; i < goal; i++) {
			var v = internals[i];
			index.push('* <a href="#wasavi-option-' + v.name + '">' + v.name + '</a>');
			content.push('<a href="#" name="wasavi-option-' + v.name + '">#</a> ' + v.name);
			content.push('--------');
			content.push('');
			switch (v.type) {
			case 'b': content.push('* type: boolean'); break;
			case 'i': content.push('* type: integer (greater or equals to 0)'); break;
			case 'I': content.push('* type: natural number'); break;
			case 's': content.push('* type: string'); break;
			case 'r': content.push('* type: string (regal expression)'); break;
			}
			content.push('* default value: `' + v.defaultValue + '`');
			v.name in ab && content.push('* abbreviation: `' + ab[v.name] + '`');
			content.push('');
		}
		index.push('');
		return [].concat(index, content).join('\n');
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
	function reset (name) {
		if (name == undefined) {
			for (var i = 0, goal = internals.length; i < goal; i++) {
				internals[i].reset();
			}
		}
		else {
			var item = getItem(name);
			item && item.reset();
		}
	}
	function saveSnapshot (snapshot) {
		for (var i = 0, goal = internals.length; i < goal; i++) {
			internals[i].saveSnapshot(snapshot);
		}
	}
	function loadSnapshot (snapshot, name) {
		if (name == undefined) {
			for (var i = 0, goal = internals.length; i < goal; i++) {
				internals[i].loadSnapshot(snapshot);
			}
		}
		else {
			var item = getItem(name);
			item && item.loadSnapshot(snapshot);
		}
	}
	function dispose () {
		app = internals = abbrevs = vars = names = null;
	}

	publish(this,
		getInfo, getData, setData, dump, dumpData, dumpScript,
		reset, saveSnapshot, loadSnapshot, dispose,
		{
			vars:function () {return vars},
			abbrevs:function () {return abbrevs}
		}
	);
	init();
};

Wasavi.RegexConverter = function (app) {
	const SPECIAL_SPACE = '[\u0009\u000b\u000c\u0020\u00a0\u2000-\u200b\u2028\u2029\u3000]';
	const SPECIAL_NONSPACE = '[\u0000-\u0008\u000a\u000d-\u001f\u0021-\u009f\u00a1-\u1fff\u200c-\u2027\u202a-\u2fff\u3001-\uffff]';
	const META_MAP = {
		backslashed:{
			// index 0: vi regex -> js regex mapping (outside of character class)
			// index 1: vi regex -> invalidated vi regex mapping
			// index 2: vi regex -> vi regex mapping (inside of character class)
			'\\\\': ['\\\\', '\\\\\\\\'],
			'\\<': ['\\b', '\\\\<', ''],	// TODO: this map is INCORRECT.
			'\\>': ['\\b', '\\\\>', ''],	// TODO: this map is INCORRECT.
			'\\{': ['{', '\\\\{'],
			'\\}': ['}', '\\\\}'],
			'\\(': ['(', '\\\\('],
			'\\)': [')', '\\\\)'],
			'\\?': ['?', '\\\\?'],
			'\\+': ['+', '\\\\+'],
			'\\|': ['|', '\\\\|'],
			'\\s': [SPECIAL_SPACE, '\\\\s', SPECIAL_SPACE.replace(/^\[|\]$/g, '')],
			'\\S': [SPECIAL_NONSPACE, '\\\\S', SPECIAL_NONSPACE.replace(/^\[|\]$/g, '')]
		},

		nonbackslashed:{
			'{': ['\\{', '{'],
			'}': ['\\}', '}'],
			'(': ['\\(', '('],
			')': ['\\)', ')'],
			'?': ['\\?', '?'],
			'+': ['\\+', '+'],
			'|': ['\\|', '|']
		},

		common:{
			'.': ['.', '\\.'],
			'*': ['*', '\\*'],
			'[': ['[', '\\['],
			']': [']', '\\]'],
			'^': ['^', '\\^'],
			'$': ['$', '\\$']
		}
	};
	function parse (s, forceLiteral) {
		var result = [];
		var isInClass = false;
		var index = forceLiteral ? 1 : 0;
		for (var i = 0, goal = s.length; i < goal; i++) {
			var ch = s.charAt(i);
			if (ch == '\\') {
				if (++i >= goal) {
					throw new SyntaxError('a backslash cannot be end');
				}
			}
			if (isInClass) {
				if (ch == '\\') {
					ch += s.charAt(i);
					result.push(META_MAP.backslashed[ch][2] || ch);
				}
				else if (ch == ']') {
					result.push(ch);
					isInClass = false;
				}
				else {
					result.push(ch);
				}
			}
			else {
				if (ch == '\\') {
					ch += s.charAt(i);
					if (ch in META_MAP.backslashed) {
						if (ch == '\\?' && result.lastItem == '(') {
							result.push(META_MAP.backslashed[ch][1]);
						}
						else {
							result.push(META_MAP.backslashed[ch][index]);
						}
					}
					else {
						if (forceLiteral) {
							result.push(ch.replace(/\\/g, '\\\\'));
						}
						else {
							result.push(ch);
						}
					}
				}
				else if (ch in META_MAP.nonbackslashed) {
					result.push(META_MAP.nonbackslashed[ch][index]);
				}
				else if (ch in META_MAP.common) {
					result.push(META_MAP.common[ch][index]);
					if (ch == '[' && !forceLiteral) {
						isInClass = true;
					}
				}
				else {
					result.push(ch);
				}
			}
		}
		if (isInClass) {
			throw new SyntaxError('unclosed character class');
		}
		return result.join('');
	}
	function fixup (s) {
		return s.replace(/\\s/g, SPECIAL_SPACE);
	}
	function toJsRegexString (s) {
		if (typeof s == 'string') {
			return parse(s);
		}
		else if (s instanceof RegExp) {
			return s.source;
		}
		throw new SyntaxError('invalid regex source');
	}
	function toLiteralString (s) {
		return parse(s, true);
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
			wrapscan: app.config.vars.wrapscan
		};
	}

	publish(
		this,
		fixup,
		toJsRegexString, toJsRegex, toLiteralString,
		getCS, getDefaultOption,
		{
			SPECIAL_SPACE: () => SPECIAL_SPACE,
			SPECIAL_NONSPACE: () => SPECIAL_NONSPACE
		}
	);
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
				var re = /^("(?:=[^\n]*|.))?([1-9][0-9]*)?(g?.)([1-9][0-9]*)?(g?.)(.*)$/.exec(arg);
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

				var re = /^("(?:=[^\n]*|.))?([1-9][0-9]*)?(g?.)(.*)$/.exec(arg);
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

				throw new TypeError('PrefixInput: invalid initializer: ' + arg);

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
	let head;
	let direction;
	let offset;
	let scrollTop;
	let scrollLeft;
	let pattern;
	let verticalOffset;
	let text;
	let updateBound;
	let internalRegex;

	function parseFindString (s, delimiter) {
		let result = {
			pattern: s,
			offset: undefined
		};
		let regex = /\\.|[\S\s]/g;
		let re;
		while ((re = regex.exec(s))) {
			if (re[0] == delimiter) {
				result.pattern = s.substring(0, re.index);

				let trailer = /^\s*([+\-]?)(\d*)/.exec(s.substring(re.index + re[0].length));
				if (trailer && (trailer[1] != '' || trailer[2] != '')) {
					if (trailer[2] == '') {
						trailer[2] = '1';
					}
					result.offset = parseInt(trailer[1] + trailer[2], 10);
				}

				break;
			}
		}
		return result;
	}
	function push (o) {
		head = o.head || '';
		direction = o.direction || 0;
		offset = o.offset || 0;
		scrollTop = o.scrollTop || 0;
		scrollLeft = o.scrollLeft || 0;
		updateBound = o.updateBound || false;
		internalRegex = undefined;
	}
	function setPattern (p, withOffset) {
		pattern = p;
		verticalOffset = undefined;

		if (withOffset) {
			let parsed = parseFindString(p, head);
			pattern = parsed.pattern;
			verticalOffset = parsed.offset;
		}
	}

	publish(this,
		push, setPattern,
		{
			head: () => head,
			direction: () => direction,
			offset: () => offset,
			scrollTop: () => scrollTop,
			scrollLeft: () => scrollLeft,
			pattern: () => pattern,
			verticalOffset: () => verticalOffset,
			text: [() => text, (v) => text = v],
			updateBound: () => updateBound,
			internalRegex: [() => internalRegex, (v) => internalRegex = v]
		}
	);
};

Wasavi.LineInputHistories = function (app, maxSize, names, value) {
	const storageKey = 'wasavi_lineinput_histories';
	var s;
	var name;
	var isLatest = false;

	function serialize () {
		return {s:s};
	}
	function restore (src) {
		if (!isObject(src)) return;

		var tmp = {};
		if (isObject(src.s)) {
			src = src.s;
			for (var na in src) {
				if (!isObject(src[na])) continue;
				if (!isArray(src[na].lines)) continue;
				if (!isNumber(src[na].current)) continue;

				tmp[na] = {};
				tmp[na].lines = src[na].lines.filter(isString).slice(-maxSize);
				tmp[na].current = minmax(-1, Math.floor(src[na].current), tmp[na].lines.length - 1);
			}
		}
		s = extend(s, tmp);
	}
	function save () {
		app.low.setLocalStorage(storageKey, serialize());
		isLatest = true;
	}
	function load (value) {
		if (isLatest) {
			isLatest = false;
			return;
		}

		s = {};
		names.forEach(function (na) {s[na] = {lines:[], current:-1}});
		restore(value || '');
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
						throw new TypeError('LineInputHistories: unregistered name: ' + name);
					}
				}
			],
			storageKey:function () {return storageKey}
		}
	);
	load(value);
	value = null;
};

Wasavi.MapManager = function MapManager (app, opts) {
	function MapGroup (name) {
		this.name = name;
		this.rules = {};
		this.sequences = {};
		this.sequencesExpanded = {};
		this.options = {};
	}

	MapGroup.prototype = {
		get length () {
			return Object.keys(this.rules).length;
		},
		register: function (lhs, rhs, remap) {
			this.rules[lhs] = rhs;
			this.sequences[lhs] = app.keyManager.createSequences(lhs);
			this.sequencesExpanded[lhs] = app.keyManager.createSequences(rhs);
			this.options[lhs] = {remap: !!remap};
		},
		remove: function () {
			for (let i = 0; i < arguments.length; i++) {
				let lhs = arguments[i];
				delete this.rules[lhs];
				delete this.sequences[lhs];
				delete this.sequencesExpanded[lhs];
				delete this.options[lhs];
			}
		},
		removeAll: function () {
			for (let lhs in this.rules) {
				this.remove(lhs);
			}
		},
		isMapped: function (lhs) {
			return lhs in this.rules;
		},
		toArray: function () {
			let result = [];
			for (let lhs in this.rules) {
				result.push({
					lhs: lhs,
					rhs: this.rules[lhs],
					options: this.options[lhs]
				});
			}
			return result;
		}
	};

	const maps = {
		normal: new MapGroup('NORMAL'),
		bound:  new MapGroup('BOUND'),
		input:  new MapGroup('INPUT')
	};

	const modeToTypeTable = {
		command:    'normal',

		bound:      'bound',
		bound_line: 'bound',

		insert:     'input',
		overwrite:  'input'
	};

	const RECURSE_MAX = 100;
	const WAIT_TIMEOUT_MSECS = 1000;

	let currentMapType = undefined;
	let currentSequence = undefined;
	let currentIndex = 0;
	let waitingMapInfo = undefined;
	let recurseDepth = 0;

	opts || (opts = {});

	function markExpanded (items) {
		for (var i = 0, goal = items.length; i < goal; i++) {
			items[i].mapExpanded =
			items[i].isCompositioned = true;
		}
		items.firstItem.isCompositionedFirst = true;
		items.lastItem.isCompositionedLast = true;
	}

	function markExpandedNoremap (items) {
		for (var i = 0, goal = items.length; i < goal; i++) {
			items[i].isNoremap =
			items[i].mapExpanded =
			items[i].isCompositioned = true;
		}
		items.firstItem.isCompositionedFirst = true;
		items.lastItem.isCompositionedLast = true;
	}

	function resetMapping () {
		currentMapType = currentSequence = undefined;
		currentIndex = recurseDepth = 0;
		waitingMapInfo = undefined;
	}

	function expand (sequencesExpanded, expandOptions) {
		resetMapping();

		if (recurseDepth < RECURSE_MAX) {
			recurseDepth++;
			if (!opts.onexpand) return;

			let remap = app.config.vars.remap && expandOptions.remap;
			let sequences = sequencesExpanded.map(seq => {
				seq = seq.clone();
				if (expandOptions.overrideMap) {
					seq.overrideMap = expandOptions.overrideMap;
				}

				if (remap) {
					seq.mapExpanded = seq.isCompositioned = true;
				}
				else {
					seq.isNoremap = seq.mapExpanded = seq.isCompositioned = true;
				}

				return seq;
			});

			sequences.firstItem.isCompositionedFirst = true;
			sequences.lastItem.isCompositionedLast = true;

			if (expandOptions.extraEvent) {
				let seq = expandOptions.extraEvent.clone();

				if (!remap) {
					seq.isNoremap = true;
				}

				if (expandOptions.extraOverrideMap) {
					seq.overrideMap = expandOptions.extraOverrideMap;
				}

				sequences.push(seq);
			}

			opts.onexpand(sequences);
		}
		else {
			opts.onrecursemax && opts.onrecursemax();
		}
	}

	function process (mode, e) {
		return new Promise(resolve => {
			if (!e || !('code' in e)) {
				throw new Error('MapManager: invalid keyboard event argument');
			}

			let mapType = e.overrideMap || modeToTypeTable[mode];

			if (waitingMapInfo) {
				clearTimeout(waitingMapInfo.timer);
				waitingMapInfo.timer = undefined;
			}

			if (waitingMapInfo && mapType && mapType != currentMapType) {
				let wmapType = waitingMapInfo.mapType;
				let wlhs = waitingMapInfo.lhs;
				expand(
					maps[wmapType].sequencesExpanded[wlhs],
					{
						extraEvent: e,
						overrideMap: waitingMapInfo.mapType,
						extraOverrideMap: mapType,
						remap: maps[wmapType].options[wlhs].remap
					});

				resolve();
				return;
			}

			currentMapType = mapType;

			let dst = {};
			let fullMatchedLhs;
			let foundCount = 0;

			/*
			 * filter the matching sequence from current map
			 */

			if (mapType) {
				let code = e.code;
				let src = currentSequence || maps[mapType].sequences;

				for (let lhs in src) {
					let sequence = src[lhs];
					if (currentIndex < sequence.length && sequence[currentIndex].code == code) {
						dst[lhs] = src[lhs];
						foundCount++;

						/*
						 * save that matched the whole sequence
						 */

						if (currentIndex == sequence.length - 1) {
							fullMatchedLhs = lhs;
						}
					}
				}
			}

			/*
			 * is there a matched sequence?
			 */

			if (foundCount) {
				currentSequence = dst;
				currentIndex++;

				if (fullMatchedLhs != undefined) {
					// unique match
					if (foundCount == 1) {
						/*
						 * example
						 *
						 * input:
						 *   a
						 *
						 * initial map:
						 *   lhs    rhs
						 *   ---    ---
						 *   a      gg
						 *   b      B
						 *   bb     ^
						 *
						 * filtered map:
						 *   lhs    rhs
						 *   ---    ---
						 *   a      gg   * fullMatchedLhs
						 */

						expand(
							maps[mapType].sequencesExpanded[fullMatchedLhs],
							{
								overrideMap: currentMapType,
								remap: maps[mapType].options[fullMatchedLhs].remap
							});
					}

					// full matched but ambiguous
					else {
						/*
						 * example
						 *
						 * input:
						 *   b
						 *
						 * initial map:
						 *   lhs    rhs
						 *   ---    ---
						 *   a      gg
						 *   b      B
						 *   bb     ^
						 *
						 * filtered map:
						 *   lhs    rhs
						 *   ---    ---
						 *   b      B    * fullMatchedLhs
						 *   bb     ^
						 */

						waitingMapInfo = {
							mapType: mapType,
							lhs: fullMatchedLhs,
							index: currentIndex,
							timer: setTimeout(() => {
								let mapType = waitingMapInfo.mapType;
								let lhs = waitingMapInfo.lhs;
								expand(
									maps[mapType].sequencesExpanded[lhs],
									{
										remap: maps[mapType].options[lhs].remap
									});
							}, WAIT_TIMEOUT_MSECS)
						};
					}
				}
				else {
					/*
					 * example
					 *
					 * input:
					 *   b
					 *
					 * initial map:
					 *   lhs    rhs
					 *   ---    ---
					 *   a      gg
					 *   bb     B
					 *   bbb    ^
					 *
					 * filtered map:
					 *   lhs    rhs
					 *   ---    ---
					 *   bb     B
					 *   bbb    ^
					 *
					 */

					waitingMapInfo = {
						mapType: mapType,
						lhs: Object.keys(currentSequence)[0].substring(0, currentIndex),
						index: currentIndex,
						timer: setTimeout(() => {
							let mapType = waitingMapInfo.mapType;
							let lhs = waitingMapInfo.lhs;
							let index = waitingMapInfo.index;
							expand(
								app.keyManager.createSequences(lhs),
								{
									remap: false
								});
						}, WAIT_TIMEOUT_MSECS)
					};
				}

				resolve();
			}

			/*
			 * no matched sequences
			 */

			else {
				if (waitingMapInfo) {
					let wmapType = waitingMapInfo.mapType;
					let wlhs = waitingMapInfo.lhs;
					let windex = waitingMapInfo.index;
					let sequences = wlhs in currentSequence ?
						maps[wmapType].sequencesExpanded[wlhs] :
						app.keyManager.createSequences(wlhs);
					expand(
						sequences,
						{
							extraEvent: e,
							overrideMap: wmapType,
							extraOverrideMap: mapType,
							remap: false
						});

					resolve();
				}
				else {
					resolve(e);
				}
			}
		});
	}

	publish(this, markExpanded, markExpandedNoremap, process, {
		maps: () => maps,
		onexpand: [() => opts.onexpand, (v) => {opts.onexpand = v}],
		onrecursemax: [() => opts.onrecursemax, (v) => {opts.onrecursemax = v}],
		isWaiting: () => currentSequence != undefined
	});
};

Wasavi.Registers = function (app, value) {
	/*
	 * available registers:
	 *
	 * - unnamed register
	 *  "       equiv to the last used register's content [vim compatible]
	 *
	 * - named register
	 *  1 - 9   implicit register, and its histories. 1 is latest.
	 *  a - z   general named register
	 *  A - Z   write: general named register for append
	 *          read: special purpose content,
	 *  @       last executed command via :@ in ex mode or @ in vi mode
	 *  .       last edited text (read only) [vim compatible]
	 *  :       last executed ex command (read only) [vim compatible]
	 *  *       system clipboard, if available [vim compatible]
	 *  +       system clipboard, if available [vim compatible]
	 *  /       last searched text (read only) [vim compatible]
	 *  ^       last input position (read only) [vim compatible]
	 *  =       last computed result of simple math-expression (readonly) [vim compatible]
	 *  ;       wasavi uses internally
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

	const storageKey = 'wasavi_registers';
	const writableRegex = /^[1-9a-zA-Z@]$/;
	const readableRegex = /^["1-9a-zA-Z@.:*+\/\^=;]$/;
	var unnamed;
	var named;
	var isLatest = false;

	function serialize () {
		return {unnamed:unnamed, named:named};
	}
	function restore (src) {
		if (!isObject(src)) return;
		if (!isObject(src.unnamed)) return;
		if (!isObject(src.named)) return;

		function doRestore (k, v) {
			if (!isReadable(k)) return;
			if (!isObject(v)) return;
			if (!isBoolean(v.isLineOrient)) return;
			if (!isString(v.data)) return;

			findItem(k).set(v.data, v.isLineOrient);
		}

		doRestore('"', src.unnamed);
		for (var i in src.named) {
			doRestore(i, src.named[i]);
		}
	}
	function save () {
		app.low.setLocalStorage(storageKey, serialize());
		isLatest = true;
	}
	function load (value) {
		if (isLatest) {
			isLatest = false;
			return;
		}

		unnamed = new RegisterItem();
		named = {};
		restore(value || '');
	}
	function isWritable (name) {
		return writableRegex.test(name.charAt(0));
	}
	function isReadable (name) {
		return readableRegex.test(name.charAt(0));
	}
	function isClipboard (name) {
		return '*+'.indexOf(name) >= 0;
	}
	function resolveAlias (name) {
		if (name == '+') {
			name = '*';
		}
		return name;
	}
	function exists (name) {
		name = resolveAlias(name.charAt(0));
		if (!isReadable(name)) {
			return false;
		}
		if (/^[A-Z"]$/.test(name)) {
			return true;
		}
		return !!named[name];
	}
	function findItem (name) {
		name = resolveAlias(name.charAt(0));
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

		name = resolveAlias(name);

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
				name == '*' && app.extensionChannel.setClipboard(item.data);
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
		name = resolveAlias(name.charAt(0));
		if (isReadable(name)) {
			var item;

			if (/^[A-Z]$/.test(name)) {
				item = new RegisterItem();

				switch (name) {
				case 'B':
					item.set(window.navigator.userAgent);
					break;
				case 'C':
					app.devMode && item.set(app.config.dumpData());
					break;
				case 'D':
					item.set(strftime(app.config.vars.datetime));
					break;
				case 'T':
					item.set(app.targetElement.title);
					break;
				case 'U':
					item.set(app.targetElement.url);
					break;
				case 'W':
					item.set('wasavi/' + app.version);
					break;
				}
			}
			else {
				item = findItem(name);
			}

			return item;
		}
		return new RegisterItem();
	}
	function dump () {
		function dumpItem (item) {
			const MAX_LENGTH = 32;
			var orientString = item.isLineOrient ? 'L' : 'C';
			var data = item.data;
			if (data.length > MAX_LENGTH) {
				data = data.substring(0, MAX_LENGTH) + '...';
			}
			return _('  {0}  {1}', orientString, toVisibleString(data));
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
		set, get, isWritable, isReadable, isClipboard,
		exists, dump, dumpData, save, load,
		{
			storageKey:function () {return storageKey},
			writableList:function () {
				return writableRegex.source
					.replace(/^\^\[/, '')
					.replace(/\]\$$/, '')
					.replace(/\\/g, '');
			},
			readableList:function () {
				return readableRegex.source
					.replace(/^\^\[/, '')
					.replace(/\]\$$/, '')
					.replace(/\\/g, '');
			}
		}
	);
	load(value);
	value = null;
};

Wasavi.Marks = function (app, value) {
	var buffer = app.buffer;
	var marks;

	function serialize () {
		var result = [];
		for (var i in marks) {
			result.push([i, marks[i].row, marks[i].col].join('\t'));
		}
		return window.btoa(result.join('\n'));
	}
	function unserialize (value) {
		var result = {};
		isString(value) && window.atob(value)
			.split('\n')
			.forEach(function (line) {
				line = line.split('\t');
				if (line[0].length) {
					result[line[0]] = {
						row: parseInt(line[1], 10),
						col: parseInt(line[2], 10)
					};
				}
			});
		return result;
	}
	function restore (src) {
		src = unserialize(src);

		for (var i in src) {
			if (!isValidName(i)) continue;
			if (!isObject(src[i])) continue;
			if (!isNumber(src[i].row)) continue;
			if (!isNumber(src[i].col)) continue;

			var row = src[i].row;
			var col = src[i].col;
			if (isNaN(row) || isNaN(col)) continue;

			marks[i] = (new Wasavi.Position(row, col)).round(buffer);
		}
	}
	function save () {
		return serialize();
	}
	function load (value) {
		marks = {};
		restore(value || '');
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
						buffer.rowNodes(m),
						window.NodeFilter.SHOW_TEXT, null, false);
					var totalLength = 0;
					var done = false;
					var node;

					while ((node = iter.nextNode())) {
						var next = totalLength + node.nodeValue.length;
						if (totalLength <= m.col && m.col < next) {
							r.setStart(node, m.col - totalLength);
							r.setEnd(node, m.col - totalLength);
							var span = document.createElement('span');
							span.className = Wasavi.MARK_CLASS;
							span.dataset.index = i;
							r.insertNode(span);
							done = true;
							break;
						}
						totalLength = next;
					}

					if (!done) {
						var span = document.createElement('span');
						span.className = Wasavi.MARK_CLASS;
						span.dataset.index = i;
						buffer.rowNodes(m).appendChild(span);
					}
				}
			}
			return usedMarks;
		}
		function releaseMarks (usedMarks) {
			var nodes = buffer.getSpans(Wasavi.MARK_CLASS);
			for (var i = 0, goal = nodes.length; i < goal; i++) {
				var span = nodes[i];
				var index = span.dataset.index;
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
			var marks = fragment.querySelectorAll('span.' + Wasavi.MARK_CLASS);
			for (var i = 0, goal = marks.length; i < goal; i++) {
				var index = marks[i].dataset.index;
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
		update, dump, dumpData, save, load, isValidName, clear, dispose
	);
	load(value);
};

Wasavi.Editor = function (element) {
	this.elm = $(element);
	if (!this.elm) {
		throw new TypeError('*** wasavi: Editor constructor: invalid element: ' + element);
	}
	this._ssrow = this._sscol = this._serow = this._secol = 0;
	this.isLineOrientSelection = false;

	this.unicodeCacheMax = 20;
	this._unicodeCache = null;
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
			this.rowNodes(pos), window.NodeFilter.SHOW_TEXT, null, false);
		var totalLength = 0;
		var done = false;
		var node, prevNode;
		while ((node = iter.nextNode())) {
			var next = totalLength + node.nodeValue.length;
			if (totalLength <= pos.col && pos.col < next) {
				isEnd ? r.setEnd(node, pos.col - totalLength) :
						r.setStart(node, pos.col - totalLength);
				prevNode = null;
				done = true;
				break;
			}
			totalLength = next;
			prevNode = node;
		}

		if (!done) {
			if (isEnd) {
				var rowNode = this.rowNodes(pos);
				var node = rowNode.lastChild;
				if (!node) {
					node = rowNode.appendChild(document.createTextNode(''));
				}
				node.nodeType == 1 ?
					r.setEndAfter(node) :
					r.setEnd(node, node.nodeValue.length);
			}
			else {
				r.setStartBefore(this.rowNodes(pos, true));
			}
		}
	}
	function select (s, e) {
		if (arguments.length == 0) {
			s = this.selectionStart;
			e = this.selectionEnd;
		}
		else if (arguments.length != 2) {
			throw new TypeError('select: invalid length of argument');
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
			throw new TypeError('selectRows: invalid length of argument');
		}

		if (s.row > e.row || s.row == e.row && s.col > e.col) {
			var tmp = s;
			s = e;
			e = tmp;
		}

		s.col = 0;
		e.col = this.isLineOrientSelection ?
			0 : this.rows(e).length;

		var r = document.createRange();
		r.setStartBefore(this.rowNodes(s));
		r.setEndAfter(this.rowNodes(e, true));
		return {r:r, s:s, e:e};
	}
	function appendText (text, sentinel) {
		var row = this.elm.insertBefore(document.createElement('div'), sentinel);
		row.textContent = text || '';
		return row;
	}
	function appendNewline (sentinel) {
		var newline = this.elm.insertBefore(document.createElement('span'), sentinel);
		newline.className = 'newline';
		newline.textContent = '\n';
		return newline;
	}
	function appendRow (text, sentinel) {
		var row = appendText.call(this, text, sentinel);
		var newline = appendNewline.call(this, sentinel);
		return row;
	}
	function ensureSentinelNewline (node) {
		if (node.lastChild && node.lastChild.nodeType == 3) {
			node.lastChild.appendData('\n');
		}
		else {
			node.appendChild(document.createTextNode('\n'));
		}
	}
	function removeSentinelNewline (node) {
		if (node.lastChild) {
			var lastChild = node.lastChild;
			switch (lastChild.nodeType) {
			case 1:
				removeSentinelNewline(lastChild);
				break;
			case 3:
				if (lastChild.nodeValue.length) {
					while (lastChild.nodeValue.substr(-1) == '\n') {
						lastChild.deleteData(lastChild.nodeValue.length - 1, 1);
					}
				}
				else {
					removeSentinelNewline(lastChild.previousSibling);
				}
				break;
			}
		}
	}
	return {
		// condition
		isEndOfText: function () {
			var a = arg2pos(arguments);
			var rowLength = this.rowLength;
			if (a.row < 0 || a.row >= rowLength) {
				throw new RangeError(`isEndOfText: argument row (${a.row}) out of range.`);
			}
			if (a.row < rowLength - 1) {
				return false;
			}
			if (a.row == rowLength - 1 && a.col < this.rows(rowLength - 1).length) {
				return false;
			}
			return true;
		},
		isNewline: function () {
			var a = arg2pos(arguments);
			var rowLength = this.rowLength;
			if (a.row < 0 || a.row >= rowLength) {
				throw new RangeError(`isNewline: argument row (${a.row}) out of range.`);
			}
			if (a.row == rowLength - 1 || a.col < this.rows(a).length) {
				return false;
			}
			return true;
		},

		// getter
		getValue: function (from, to, newline) {
			var result, rg;
			var rowLength = this.rowLength;

			if (typeof from != 'number' || from < 0) {
				from = 0;
			}
			if (typeof to != 'number' || to >= rowLength) {
				to = rowLength - 1;
			}

			rg = document.createRange();
			rg.setStartBefore(this.rowNodes(from));
			rg.setEndAfter(this.rowNodes(to));

			result = rg.toString();
			result = toNativeControl(result);

			if (isString(newline)) {
				result = result.replace(/\n/g, newline);
			}

			return result;
		},
		rowNodes: function (arg, newline) {
			var row = arg instanceof Wasavi.Position ? arg.row : arg;

			if (typeof row != 'number' || isNaN(row)) {
				throw new TypeError(`rowNodes: argument row is not a number`);
			}
			if (row < 0 || row >= this.rowLength) {
				throw new RangeError(`rowNodes: argument row (${row}) out of range`);
			}

			var result = this.elm.childNodes[row * 2 + (newline ? 1 : 0)];

			if (!result.firstChild) {
				result.appendChild(document.createTextNode(''));
			}

			return result;
		},
		rowTextNodes: function (arg) {
			return this.rowNodes(arg).firstChild;
		},
		rows: function (arg) {
			return this.rowNodes(arg).textContent;
		},
		charAt: function () {
			var a = arg2pos(arguments);
			if (a.row < 0 || a.row >= this.rowLength) {
				return undefined;
			}
			var content = this.rows(a);
			return a.col >= content.length ? '\n' : content.charAt(a.col);
		},
		charCodeAt: function () {
			return this.charAt.apply(this, arguments).charCodeAt(0);
		},
		charClassAt: function (a, treatNewlineAsSpace, extraWordRegex) {
			var ch = this.charAt(a);
			if (ch == undefined) {
				return undefined;
			}
			var cp = ch.charCodeAt(0);
			if (treatNewlineAsSpace && cp == 0x0a) {
				return 0;
			}
			if (extraWordRegex instanceof RegExp && extraWordRegex.test(ch)) {
				// treat as latin1 word component
				return 0x100 + 1;
			}
			return unicodeUtils.getScriptClass(cp);
		},
		charRectAt: function (position, length) {
			const CLASS_NAME = 'char-rect-at';
			try {
				var span = this.emphasis(position, length || 1, CLASS_NAME)[0];
				return span ?
					span.getBoundingClientRect() :
					this.rowNodes(position).getBoundingClientRect();
			}
			finally {
				this.unEmphasis(CLASS_NAME);
			}
		},
		ensureNewline: function () {
			var a = arg2pos(arguments);
			if (a.row < 0 || a.row >= Math.ceil(this.elm.childNodes.length / 2)) {
				return;
			}
			var newline = this.rowNodes(a, true);
			if (!newline || newline.className != 'newline') {
				appendNewline.call(this, newline);
			}
		},
		getSelectionRange: function () {
			return this.isLineOrientSelection ?
				selectRows.apply(this, arguments).r :
				select.apply(this, arguments).r;
		},
		getSelection: function () {
			if (this.isLineOrientSelection) {
				return this.getSelectionLinewise.apply(this, arguments);
			}
			else {
				var r = select.apply(this, arguments);
				var content = r.r.toString();
				return content;
			}
		},
		getSelectionLinewise: function () {
			var r = selectRows.apply(this, arguments);
			var content = r.r.toString();
			if (content.length && content.substr(-1) != '\n') {
				content += '\n';
			}
			return content;
		},
		leftPos: function () {
			var a = arg2pos(arguments);
			if (a.col == 0) {
				if (a.row > 0) {
					a.row--;
					a.col = this.rows(a).length;
				}
			}
			else {
				a.col--;
			}
			return a;
		},
		leftClusterPos: function () {
			var a = arg2pos(arguments);
			if (a.col == 0) {
				if (a.row > 0) {
					a.row--;
					a.col = this.rows(a).length;
				}
			}
			else {
				var clusters = this.getGraphemeClusters(a);
				var index = clusters.getClusterIndexFromUTF16Index(a.col);
				a.col = clusters.rawIndexAt(index - 1);
			}
			return a;
		},
		rightPos: function () {
			var a = arg2pos(arguments);
			var node = this.rows(a);
			if (a.col >= node.length) {
				if (a.row < this.rowLength - 1) {
					a.row++;
					a.col = 0;
				}
			}
			else {
				a.col++;
			}
			return a;
		},
		rightClusterPos: function () {
			var a = arg2pos(arguments);
			var node = this.rows(a);
			if (a.col >= node.length) {
				if (a.row < this.rowLength - 1) {
					a.row++;
					a.col = 0;
				}
			}
			else {
				var clusters = this.getGraphemeClusters(a);
				var index = clusters.getClusterIndexFromUTF16Index(a.col);
				a.col = clusters.rawIndexAt(index + 1);
			}
			return a;
		},
		indexOf: function (node) {
			var result = Array.prototype.indexOf.call(this.elm.children, node);
			return result >= 0 ? result >> 1 : result;
		},
		getLineTopOffset: function () {
			var a = arg2pos(arguments);
			a.col = 0;
			return a;
		},
		getLineTailOffset: function () {
			var a = arg2pos(arguments);
			a.col = this.rows(a).length;
			return a;
		},
		getLineTopOffset2: function () {
			var a = arg2pos(arguments);
			var re = spc('^(S*).*$').exec(this.rows(a));
			a.col = re ? re[1].length : 0;
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
			return a.row >= 0 ? spc('^S*').exec(this.rows(a))[0] : '';
		},
		getBackIndent: function () {
			var a = arg2pos(arguments);
			while (--a.row >= 0 &&
				(
					this.rowNodes(a).getAttribute('data-indent-ignore') == '1' ||
					this.rows(a) == ''
				)
			) {}
			return a.row >= 0 ? spc('^S*').exec(this.rows(a))[0] : '';
		},
		getSpans: function (className, start, end) {
			var q = ['#wasavi_editor>div'];
			if (typeof start == 'number') {
				if (start < 0) {
					start = this.rowLength + start;
					end = false;
				}
				// this factor "2" depends row structure
				q.push(':nth-child(n+' + (start * 2 + 1) + ')');
			}
			if (typeof end == 'number') {
				end = Math.min(end, this.rowLength - 1);
				// this factor "2" depends row structure
				q.push(':nth-child(-n+' + (end * 2 + 1) + ')');
			}
			if (q.length == 3 && start == end) {
				q.pop();
				q.pop();
				// this factor "2" depends row structure
				q.push(':nth-child(' + (start * 2 + 1) + ')');
			}
			q.push(' span');
			if (typeof className == 'string' && className != '') {
				q.push('.' + className);
			}
			return document.querySelectorAll(q.join(''));
		},
		// UAX#29
		invalidateUnicodeCache: function () {
			this._unicodeCache = null;
		},
		initUnicodeCache: function () {
			if (!this._unicodeCache) {
				this._unicodeCache = {
					clusters: [],
					clusterIndexes: [],
					words: [],
					wordsIndexes: []
				};
			}
			return this._unicodeCache;
		},
		getGraphemeClusters: function (n) {
			if (n == undefined) {
				n = this._ssrow;
			}
			else if (n instanceof Wasavi.Position) {
				n = n.row;
			}
			if (typeof n != 'number' || isNaN(n)) {
				throw new TypeError('Editor#getGraphemeClusters: invalid arg: ' + n);
			}
			var uc = this.initUnicodeCache();
			if (!uc.clusters[n]) {
				uc.clusters[n] = Unistring(this.rows(n));
				uc.clusterIndexes.push(n);
				while (uc.clusterIndexes.length > this.unicodeCacheMax) {
					var top = uc.clusterIndexes.shift();
					delete uc.clusters[top];
				}
			}
			return uc.clusters[n];
		},
		getWords: function (n) {
			if (n == undefined) {
				n = this._ssrow;
			}
			else if (n instanceof Wasavi.Position) {
				n = n.row;
			}
			if (typeof n != 'number' || isNaN(n)) {
				throw new TypeError('Editor#getWords: invalid arg: ' + n);
			}
			var uc = this.initUnicodeCache();
			if (!uc.words[n]) {
				uc.words[n] = Unistring.getWords(this.rows(n), true);
				uc.wordsIndexes.push(n);
				while (uc.wordsIndexes.length > this.unicodeCacheMax) {
					var top = uc.wordsIndexes.shift();
					delete uc.words[top];
				}
			}
			return uc.words[n];
		},
		getClosestOffsetToPixels: function (n, pixels) {
			var clusters = this.getGraphemeClusters(n);
			var index = clusters.getClusterIndexFromUTF16Index(n.col);
			if (clusters.length == 0 || index < 0) {
				n.col = 0;
				return n;
			}

			var node = $('wasavi_singleline_scaler');
			var row = this.rowLength - 1;
			node.textContent = this.rows(n);

			var r = document.createRange();
			r.setStart(node.firstChild, n.col);
			r.setEnd(node.firstChild, node.textContent.length);
			var right = document.createElement('span');
			right.className = 'closest';
			r.surroundContents(right);

			if (right && right.firstChild) {
				var width = 0;
				var widthp = 0;
				var delta = 1;
				var phase = 0;

				var rightText = right.firstChild;
				var left = right.parentNode.insertBefore(document.createElement('span'), right);
				var leftText = left.appendChild(document.createTextNode(''));

				left.className = 'closest';
				//left.style.backgroundColor = 'cyan';
				//right.style.backgroundColor = 'red';

				while (index < clusters.length) {
					var clusterLength = Math.min(delta, clusters.length - index);
					var fragment = clusters.substr(index, clusterLength).toString();
					var length = fragment.length;

					leftText.appendData(fragment);
					rightText.deleteData(0, length);

					index += delta;
					width = left.offsetWidth;

					if (width >= pixels) {
						if (phase == 2 || width == pixels) {
							index -= Math.abs(widthp - pixels) <= Math.abs(width - pixels) ? 1 : 0;
							break;
						}

						index -= delta;
						leftText.deleteData(
							leftText.nodeValue.length - length, length);
						rightText.insertData(0, fragment);
						if (phase == 1) {
							if (delta > 2) {
								delta = Math.max(1, delta >> 1);
							}
							else {
								delta = 1;
								phase = 2;
							}
						}
						else {
							phase = 1;
							delta = Math.max(1, delta >> 1);
						}
						continue;
					}

					widthp = width;
					if (phase == 0) {
						delta <<= 1;
					}
				}
			}

			node.textContent = '';
			n.col = clusters.rawIndexAt(minmax(0, index, clusters.length));
			return n;
		},

		// setter
		setRow: function (arg, text) {
			var row4 = arg;
			if (arg instanceof Wasavi.Position) {
				row4 = arg.row;
			}
			this.rowNodes(row4).textContent = trimTerm(text);
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
		adjustBackgroundImage: function () {
			var y = 0;
			if (this.rowLength) {
				var last = this.rowNodes(this.rowLength - 1);
				y = last.offsetTop + last.offsetHeight;
			}
			var desc = '0 ' + y + 'px';
			if (this.elm.style.backgroundPosition != desc) {
				this.elm.style.backgroundPosition = desc;
			}
		},
		adjustLineNumberClass: function (isAbsolute, isRelative) {
			var newClass = '';
			if (isAbsolute) {
				newClass = (isRelative ? 'nar' : 'na') +
					' n' + Math.min(
						Wasavi.LINE_NUMBER_MAX_WIDTH,
						(this.rowLength + '').length);
			}
			else if (isRelative) {
				newClass = 'nr n' + Wasavi.LINE_NUMBER_RELATIVE_WIDTH;
			}
			if (this.elm.classList.contains('list')) {
				newClass += ' list';
			}
			if (this.elm.className != newClass) {
				this.elm.className = newClass;
			}
		},
		adjustLineNumber: function () {
			var desc = 'na 0 nr ' + (this.selectionStartRow + 1);
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
			this.rowNodes(this.selectionStartRow).className = 'current';
		},
		insertChars: function (pos, text) {
			var rowNode = this.rowNodes(pos);
			var iter = document.createNodeIterator(
				rowNode, window.NodeFilter.SHOW_TEXT, null, false);
			var totalLength = 0;
			var node;

			ensureSentinelNewline(rowNode);
			try {
				while ((node = iter.nextNode())) {
					var next = totalLength + node.nodeValue.length;
					if (totalLength <= pos.col && pos.col < next) {
						var pnode = node.previousSibling;
						var index = pos.col - totalLength;

						if (index == 0
						&&  pnode
						&&  pnode.nodeName == 'SPAN'
						&&  pnode.className == Wasavi.MARK_CLASS) {
							pnode.parentNode.insertBefore(document.createTextNode(text), pnode);
						}
						else {
							node.insertData(index, text);
						}

						pos.col += text.length;
						break;
					}
					totalLength = next;
				}

				this.invalidateUnicodeCache();

				return pos;
			}
			finally {
				removeSentinelNewline(rowNode);
			}
		},
		overwriteChars: function (pos, text) {
			text = Unistring(text);

			var rowNode = this.rowNodes(pos);
			var iter = document.createNodeIterator(
				rowNode, window.NodeFilter.SHOW_TEXT, null, false);
			var totalLength = 0;
			var done = false;
			var node;

			while (text.length && (node = iter.nextNode())) {
				var next = totalLength + node.length;
				if (!(totalLength <= pos.col && pos.col < next)) {
					totalLength = next;
					continue;
				}

				var nodeText = Unistring(node.nodeValue);
				var nodeUTF16Offset = Math.max(pos.col - totalLength, 0);
				var nodeClusterOffset = nodeText.getClusterIndexFromUTF16Index(nodeUTF16Offset);
				var overwriteClusterCount = next >= this.rows(pos).length ?
					text.length :
					Math.min(nodeText.length - nodeClusterOffset, text.length);
				var overwriting = text.substr(0, overwriteClusterCount);

				node.nodeValue = Unistring('')
					.append(nodeText.substring(0, nodeClusterOffset))
					.append(overwriting)
					.append(nodeText.substring(nodeClusterOffset + overwriteClusterCount))
					.toString();
				pos.col += overwriting.toString().length;
				text = text.substr(overwriteClusterCount);
				totalLength += node.length;
				done = true;
			}

			if (!done) {
				if (rowNode.lastChild && rowNode.lastChild.nodeType == 3) {
					rowNode.lastChild.nodeValue += text;
				}
				else {
					rowNode.appendChild(document.createTextNode(text));
					rowNode.normalize();
				}
				pos.col += text.length;
			}

			this.invalidateUnicodeCache();

			return pos;
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
						if (node.nodeName != 'SPAN' || node.className != Wasavi.MARK_CLASS) {
							throw new TypeError('unknown node found');
						}
						var next = node.nextSibling;
						var markName = node.dataset.index;
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
				if (!node || node.nodeType != 3) return;
				node.insertData(0, shifted);
				for (var i = 0, goal = marks.length; i < goal; i++) {
					marks[i][0] += shifted.length;
				}
			}

			function shiftLeft (row, marks) {
				var node = row.firstChild;
				if (!node || node.nodeType != 3) return;
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
				if (!node || node.nodeType != 3) return;
				var indent, marksInfo;
				if (indentInfo instanceof Array) {
					indent = indentInfo[0];
					marksInfo = indentInfo[1];
				}
				else {
					indent = indentInfo;
				}
				node.nodeValue = indent + node.nodeValue.replace(spc('^S+'), '');
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
				if (!node || node.nodeType != 3) return;
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
					if (!text) continue;
					if (!mark) {
						mark = document.createElement('span');
						mark.className = Wasavi.MARK_CLASS;
						mark.dataset.index = marks[i][2];
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

			var goal = Math.min(row + rowCount, this.rowLength);
			var doShift, doCollectTabs;
			if (indents) {
				doCollectTabs = isExpandTab ? nop : collectTabs;
				for (var i = row, j = 0; i < goal; i++) {
					var node = this.rowNodes(i);
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
					var node = this.rowNodes(i);
					var marks = expandTab(node);
					doShift(node, marks);
					doCollectTabs(node, marks);
					restoreMarks(node, marks);
				}
			}

			this.invalidateUnicodeCache();

			return currentIndents;
		},
		deleteRange: (function () {
			function deleteCharwise (r, func) {
				var content = r.r.toString();
				var result = content.length;

				if (result == 0) {
					return result;
				}
				if (func) {
					func(content, r.r.cloneContents());
				}
				if (r.s.row == r.e.row) {
					r.r.deleteContents();
					this.rowNodes(r.s).normalize();
				}
				else {
					// multiple rows

					// top line
					var r2 = document.createRange();
					setRange.call(this, r2, r.s);
					setRange.call(this, r2, new Wasavi.Position(r.s.row, this.rows(r.s).length), true);
					r2.deleteContents();

					// bottom line
					setRange.call(this, r2, r.e);
					setRange.call(this, r2, new Wasavi.Position(r.e.row, this.rows(r.e).length), true);
					this.rowNodes(r.s).appendChild(r2.extractContents());
					this.rowNodes(r.s).normalize();

					// middle lines
					if (r.e.row - r.s.row >= 1) {
						r2.setStartBefore(this.rowNodes(r.s.row + 1));
						r2.setEndAfter(this.rowNodes(r.e.row).nextSibling);
						r2.deleteContents();
					}
				}
				return result;
			}
			function deleteLinewise (r, func) {
				var content = r.r.toString();
				var result = r.e.row - r.s.row + 1;

				if (func) {
					func(content, r.r.cloneContents());
				}
				r.r.deleteContents();
				if (this.rowLength == 0) {
					appendRow.call(this);
				}
				if (r.s.row >= this.rowLength) {
					r.s.row = this.rowLength - 1;
				}
				return result;
			}
			return function deleteRange () {
				var args = toArray(arguments);
				var func = popLastArg(args);
				var result, rangeInfo;

				if (this.isLineOrientSelection) {
					rangeInfo = selectRows.apply(this, args);
					result = deleteLinewise.call(this, rangeInfo, func);
				}
				else {
					rangeInfo = select.apply(this, args);
					result = deleteCharwise.call(this, rangeInfo, func);
				}

				this.selectionStart = rangeInfo.s;
				this.selectionEnd = rangeInfo.s;
				this.invalidateUnicodeCache();

				return result;
			};
		})(),
		selectRowsLinewise: function (count) {
			var s = this.selectionStart;
			var e = new Wasavi.Position(
				Math.min(
					this.selectionEndRow + count - 1,
					this.rowLength - 1),
				0);
			this.isLineOrientSelection = true;
			var r = selectRows.call(this, s, e);
			this.selectionStart = r.s;
			this.selectionEnd = r.e;
			return r.e.row - r.s.row + 1;
		},
		divideLine: function (n) {
			n || (n = this.selectionStart);
			var div1 = this.rowNodes(n);
			var div2 = appendRow.call(this, '', div1.nextSibling.nextSibling);
			var r = document.createRange();
			var iter = document.createNodeIterator(
				div1, window.NodeFilter.SHOW_TEXT, null, false);
			var totalLength = 0;
			var done = false;

			var node;
			while ((node = iter.nextNode())) {
				var next = totalLength + node.nodeValue.length;
				if (totalLength <= n.col && n.col < next) {
					r.setStart(node, n.col - totalLength);
					done = true;
					break;
				}
				else if (n.col == next) {
					r.setStartAfter(node);
					done = true;
					break;
				}
				totalLength = next;
			}

			div1.removeAttribute('contenteditable');

			if (done) {
				r.setEndAfter(div1.lastChild);
				div2.appendChild(r.extractContents());
			}

			n.col = 0;
			n.row++;

			this.selectionStart = n;
			this.selectionEnd = n;
			this.invalidateUnicodeCache();
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
				if (node.nodeValue == '\n') {
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
			return result;
		},
		emphasis: function (pos, length, className) {
			if (pos instanceof Wasavi.Position) {
				pos = pos.clone();
			}
			else {
				pos = this.selectionStart;
			}
			if (typeof length != 'number') {
				throw new TypeError('emphasis: length is not a number');
			}

			var isInRange = false;
			var offset = 0;
			var r = document.createRange();
			var result = [];
			className || (className = Wasavi.EMPHASIS_CLASS);

			function surroundWithSpan (r) {
				var span = document.createElement('span');
				span.className = className;

				r.surroundContents(span);

				// Chrome removes text node which includes only newline.
				if (!span.firstChild) {
					span.appendChild(document.createTextNode(''));
				}

				result.push(span);
			}

whole:
			for (; length >= 0 && pos.row >= 0 && pos.row < this.rowLength; pos.row++) {
				var rowNode = this.rowNodes(pos);
				var iter = document.createNodeIterator(
					rowNode, window.NodeFilter.SHOW_TEXT, null, false);
				var totalLength = 0;
				var node;

				ensureSentinelNewline(rowNode);
				try {
					while ((node = iter.nextNode())) {
						if (!isInRange) {
							var next = totalLength + node.nodeValue.length;
							if (totalLength <= pos.col && pos.col < next) {
								offset = pos.col - totalLength;
								isInRange = true;
							}
							totalLength = next;
						}
						if (isInRange) {
							var nodeLength = node.nodeValue.length;
							if (offset + length <= nodeLength) {
								r.setStart(node, offset);
								r.setEnd(node, offset + length);
								surroundWithSpan(r);
								length = -1;
								break whole;
							}
							else if (nodeLength > 0) {
								r.setStart(node, offset);
								r.setEnd(node, nodeLength);
								surroundWithSpan(r);
								length -= nodeLength - offset;
								offset = 0;
								node = iter.nextNode();
							}
						}
					}
				}
				finally {
					removeSentinelNewline(rowNode);
				}
			}

			return result;
		},
		unEmphasis: function (className, start, end) {
			var nodes = this.getSpans(className || Wasavi.EMPHASIS_CLASS, start, end);
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
			}
		},
		offsetBy: function (s, offset, treatLastLineAsNormal) {
			var row5 = s.row;
			var col = s.col;
			var last = this.rowLength - 1;
			while (offset > 0) {
				var text = this.rows(row5);
				if (treatLastLineAsNormal || row5 != last) {
					text += '\n';
				}
				var rest = text.length - col;
				col += offset;
				offset -= rest;
				if (col >= text.length) {
					if (row5 == last) {
						col = text.length;
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
		clipPosition: function () {
			function doClip (s) {
				var clipped = false;
				var n;
				if (s.row < 0) {
					s.row = 0;
					clipped = true;
				}
				else if (s.row > (n = this.rowLength - 1)) {
					s.row = n;
					clipped = true;
				}
				if (s.col < 0) {
					s.col = 0;
					clipped = true;
				}
				else if (s.col > (n = this.rows(s).length)) {
					s.col = n;
					clipped = true;
				}
				return clipped ? s : null;
			}
			var s = this.selectionStart;
			var e = this.selectionEnd;
			if (s.eq(e)) {
				s = doClip.call(this, s);
				if (s) {
					this.selectionStart = s;
					this.selectionEnd = s;
				}
			}
			else {
				s = doClip(this, s);
				e = doClip(this, e);
				s && (this.selectionStart = s);
				e && (this.selectionEnd = e);
			}
		},

		// getter properties
		get rowLength () {
			var length = this.elm.childNodes.length;
			return (length >> 1) + (length & 1);
		},
		get value () {
			return this.getValue(null, null, '\n');
		},
		get selected () {
			return this.selectionStart.ne(this.selectionEnd);
		},
		get selectionStart () {
			return new Wasavi.Position(this.selectionStartRow, this.selectionStartCol);
		},
		get selectionStartRow () {
			return this._ssrow;
		},
		get selectionStartCol () {
			return this._sscol;
		},
		get selectionEnd () {
			return new Wasavi.Position(this.selectionEndRow, this.selectionEndCol);
		},
		get selectionEndRow () {
			return this._serow;
		},
		get selectionEndCol () {
			return this._secol;
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
				//.replace(/\r?\n$/, '')
				.replace(/\r?\n/g, '\n')
				.replace(/[\u0000-\u0008\u000b-\u001f]/g, function (a) {
					return String.fromCharCode(0x2400 + a.charCodeAt(0));
				});

			var from = 0, to = 0;
			var limit = 65536;
			while ((to = v.indexOf('\n', from)) >= 0) {
				appendRow.call(this, v.substring(from, to));
				from = to + 1;
				limit--;
				if (limit <= 0) {
					throw new RangeError('Editor#value(set): exceeded the limit');
				}
			}

			appendRow.call(this, v.substring(from));
		},
		set selectionStart (v) {
			if (typeof v == 'number') {
				v = this.linearPositionToBinaryPosition(v) || new Wasavi.Position(0, 0);
			}
			if (v instanceof Wasavi.Position) {
				this._ssrow = v.row;
				this._sscol = v.col;
			}
		},
		set selectionEnd (v) {
			if (typeof v == 'number') {
				v = this.linearPositionToBinaryPosition(v) || new Wasavi.Position(0, 0);
			}
			if (v instanceof Wasavi.Position) {
				this._serow = v.row;
				this._secol = v.col;
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
		if (code == 8 && this.value.length > 0) {
			this.value = this.value.replace(/.$/, '');
			this.message = this.message.replace(/.$/, '');
			return null;
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
	this.count = this.countOrig = 1
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
		this.count = this.countOrig = count || 1;
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
		if (p.row == 0 && p.col == 0) {
			p.col--;
		}
		else {
			p = this.app.buffer.leftClusterPos(p);
		}
		this.app.marks.setInputOriginMark(p);
	},
	getStartPosition: function () {
		var p = this.app.marks.getInputOriginMark();
		if (p) {
			p = p.clone();
			if (p.col < 0) {
				p.col = 0;
			}
			else {
				p = this.app.buffer.rightClusterPos(p);
			}
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
	appendText: function (e) {
		var result;
		if (isString(e)) {
			result = e;
		}
		else if (this.app.keyManager.isInputEvent(e)) {
			result = e.code == 0x000d ? '\u000a' : e.code2letter(e.code);
		}
		else {
			return;
		}
		this.prevLengthText[0] = this.text.length;
		this.prevLengthText[1] = this.textFragment.length;
		this.text += result;
		this.textFragment += result;
		return result;
	},
	ungetText: function () {
		let t = this.text;
		let tf = this.textFragment;
		if (this.prevLengthText[0] !== undefined) {
			this.text = this.text.substring(0, this.prevLengthText[0]);
			this.prevLengthText[0] -= t.length - this.prevLengthText[0];
		}
		if (this.prevLengthText[1] !== undefined) {
			this.textFragment = this.textFragment.substring(0, this.prevLengthText[1]);
			this.prevLengthText[1] -= tf.length - this.prevLengthText[1];
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
	appendStroke: function (e) {
		var result;
		if (isString(e)) {
			result = e;
		}
		else if (this.app.keyManager.isInputEvent(e)) {
			if (e.code == 0x0d) {
				result = '\u000a';
			}
			else if (/^<.+>$/.test(e.key)) {
				result = '\ue000' + e.key;
			}
			else {
				result = e.key;
			}
		}
		else {
			return;
		}
		this.prevLengthStroke = this.stroke.length;
		this.stroke += result;
		return result;
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
			//result = result.replace(/[\u0008\u007f]/g, '');
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

	const COMPLETION_NOTIFY_TTL_SECS = 60;
	const COMPLETION_NOTIFY_DELAY_SECS = 0.1;
	const TIMEOUT_SECS = 30;

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
			var rest = /^(?:\\\||[^\|])*/.exec(value);
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
			appProxy.keyManager.unlock();
			appProxy.low.notifyActivity('', '', 'completion timed out');
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

Wasavi.StrokeRecorder = function () {
	var storage = {};

	function add (key, opts) {
		return storage[key] = extend({strokes:''}, opts || {});
	}

	function remove (key) {
		delete storage[key];
	}

	function items (key) {
		return key in storage ? storage[key] : null;
	}

	function appendStroke (stroke) {
		for (var i in storage) {
			storage[i].strokes += stroke;
		}
	}

	function dump () {
		return JSON.stringify(storage, null, ' ');
	}

	function dispose () {
		storage = null;
	}

	publish(this,
		add, remove, items, appendStroke, dump, dispose
	);
};

Wasavi.Surrounding = function (app) {
	const charwiseTagPrefix = /^[<Tt]$/;
	const linewiseTagPrefix = /^(?:[\u0014,]|<A-T>)$/;
	const singleCharsTable = '!#$%&*+,\\-.:;=?@^_|~"\'`';

	const basicTable = {
		'a':'<>',
		'b':'()',
		'B':'{  }',
		'r':'[]',
		't':'<>',
		'[':'[  ]',
		']':'[]',
		'{':'{  }',
		'}':'{}',
		'(':'(  )',
		')':'()'
	};

	const insertionTable = {
		'p':['\n', '\n\n'],
		's':[' ', ''],
		':':[':', '']
	};

	/*
	 * private methods
	 */

	function getPair (item) {
		var head = '', tail = '';
		if (isString(item)) {
			head = item.substr(0, Math.floor(item.length / 2));
			tail = item.substr(Math.floor(item.length / 2));
		}
		else if (isArray(item)) {
			head = item[0];
			tail = item[1];
		}
		else if (isObject(item)) {
			head = item.head;
			tail = item.tail;
		}
		return [head, tail];
	}

	function getPairFromId (id) {
		var head = '', tail = '';
		if (id in basicTable) {
			var pair = getPair(basicTable[id]);
			head = pair[0];
			tail = pair[1];
		}
		else if (singleCharsTable.indexOf(id) >= 0) {
			head = tail = id;
		}
		return [head, tail];
	}

	function getPairFromString (s) {
		var head = '', tail = '', extra = '';
		var re;
		if (/^ .+/.test(s)) {
			s = s.substring(1);
			extra = ' ';
		}
		if ((re = /^<([^ >]*)([^>]*)>$/.exec(s))) {
			head = re[0];
			tail = '</' + re[1] + '>';
		}
		else if (s in insertionTable) {
			var pair = getPair(insertionTable[s]);
			head = pair[0];
			tail = pair[1];
		}
		else {
			var pair = getPairFromId(s);
			head = pair[0];
			tail = pair[1];
		}

		if (extra != '' && (head != '' || tail != '')) {
			head = (head + ' ').replace(/ +$/, ' ');
			tail = (' ' + tail).replace(/^ +/, ' ');
		}

		return [head, tail];
	}

	function getPositions (id) {
		var pair = getPairFromId(id);

		if (pair[0] == '' && pair[1] == '') {
			return false;
		}

		if (id == 'r') {
			id = '[';
		}
		else if (id == 'a') {
			id = '<';
		}

		var buffer = app.buffer;
		var outerStart, outerEnd;
		var innerStart, innerEnd;

		// range symbol
		if ('"\'`[]{}<>()Bbt'.indexOf(id) >= 0) {
			var ss = buffer.selectionStart;

			// <a href="...">content</a>
			// ^             ^      ^   ^
			// |             |      |   +---- outerEnd
			// |             |      +-------- innerEnd
			// |             +--------------- innerStart
			// +----------------------------- outerStart

			// inner positions
			if (!app.searchUtils.dispatchRangeSymbol(1, id)) {
				buffer.setSelectionRange(ss);
				return false;
			}
			innerStart = buffer.selectionStart;
			innerEnd = buffer.selectionEnd;

			// outer positions
			if (!app.searchUtils.dispatchRangeSymbol(1, id, true)) {
				buffer.setSelectionRange(ss);
				return false;
			}
			outerStart = buffer.selectionStart;
			outerEnd = buffer.selectionEnd;

			// adjust the outerStart
			while (outerStart.col < innerStart.col) {
				if (!spc('S').test(buffer.charAt(outerStart))) {
					break;
				}
				outerStart.col++;
			}

			// adjust the outerEnd
			while (outerEnd.col - 1 > innerEnd.col) {
				outerEnd.col--;
				if (!spc('S').test(buffer.charAt(outerEnd))) {
					outerEnd.col++;
					break;
				}
			}
		}

		// simple one char
		else {
			var ss = buffer.selectionStart;
			var range = app.searchUtils.findQuoteRange(buffer.rows(ss), ss.col, id);
			if (!range) {
				return false;
			}

			outerStart = new Wasavi.Position(ss.row, range.start);
			innerStart = new Wasavi.Position(ss.row, range.start + 1);
			innerEnd = new Wasavi.Position(ss.row, range.end);
			outerEnd = new Wasavi.Position(ss.row, range.end + 1);
		}

		return {
			outerStart: outerStart,
			innerStart: innerStart,
			innerEnd: innerEnd,
			outerEnd: outerEnd
		};
	}

	function doInsertAsCharwise (pair) {
		const mark = 'surround-right';
		var buffer = app.buffer;
		var ss = buffer.selectionStart;
		var se = buffer.selectionEnd;

		buffer.isLineOrientSelection = false;

		// mark the position of right item
		app.marks.setPrivate(mark, se.clone());

		// insert left item
		buffer.setSelectionRange(ss);
		app.edit.insert(pair[0]);

		// insert right item
		buffer.setSelectionRange(app.marks.getPrivate(mark));
		app.edit.insert(pair[1]);

		// locate a cursor on the left item
		buffer.setSelectionRange(ss);
		app.marks.setPrivate(mark);
	}

	function doInsertAsLinewise (pair) {
		const mark = 'surround-left';
		var buffer = app.buffer;
		var ss = buffer.selectionStart;
		var se = buffer.selectionEnd;
		var indent = app.config.vars.autoindent ?
			buffer.getIndent(buffer.selectionStart) : '';

		buffer.isLineOrientSelection = false;

		// mark the position of left item
		app.marks.setPrivate(mark, ss.clone());

		// insert right item
		buffer.setSelectionRange(se);
		app.edit.insert('\n' + indent + pair[1].replace(spc('^S+'), ''));

		// insert left item
		var content = buffer.rows(ss);
		buffer.setSelectionRange(
			new Wasavi.Position(ss.row, 0),
			new Wasavi.Position(ss.row, /^[ \t]*/.exec(content)[0].length));
		app.edit.insert(indent + pair[0].replace(spc('S+$'), '') + '\n');

		// shift right the inner contents
		var indentExpanded = indent;
		var regex = /^\t+/;
		var re = regex.exec(indent);
		if (re) {
			indentExpanded = indentExpanded.replace(
				regex,
				multiply(' ', re[0].length * app.config.vars.tabstop));
		}
		var shiftCount = Math.floor(indentExpanded.length / app.config.vars.shiftwidth);
		buffer.setSelectionRange(app.marks.getPrivate(mark));
		app.edit.shift(se.row - ss.row + 1, shiftCount + 1);

		// locate a cursor on the left item
		buffer.setSelectionRange(ss);
		app.marks.setPrivate(mark);
	}

	function doRemoveSingleLine (outerStart, innerStart, innerEnd, outerEnd) {
		var buffer = app.buffer;

		buffer.isLineOrientSelection = false;

		// delete left item
		buffer.setSelectionRange(outerStart, innerStart);
		app.edit.deleteSelection();

		// delete right item
		innerEnd.col -= innerStart.col - outerStart.col;
		outerEnd.col -= innerStart.col - outerStart.col;
		buffer.setSelectionRange(innerEnd, outerEnd);
		app.edit.deleteSelection();

		// locate a cursor on the left item
		buffer.setSelectionRange(outerStart);
	}

	function doRemoveMultiLine (outerStart, innerStart, innerEnd, outerEnd) {
		var buffer = app.buffer;

		buffer.isLineOrientSelection = false;

		var line = buffer.rows(outerStart);
		var indent = spc('^S*').exec(line)[0];
		var mid = outerStart.clone();

		// left item
		if (spc('^S*$').test(line.substring(0, outerStart.col))
		&&  spc('^S*$').test(line.substring(innerStart.col))) {
			// orphan, delete a whole line
			buffer.isLineOrientSelection = true;
			buffer.setSelectionRange(
				new Wasavi.Position(outerStart.row, 0),
				new Wasavi.Position(outerStart.row, line.length + 1));
			app.edit.deleteSelection();
			buffer.isLineOrientSelection = false;

			innerEnd.row--;
			outerEnd.row--;
		}
		else {
			// not a orphan, delete left item and trailing spaces
			// ....{....zzz
			//     ^^^^^

			while (spc('^S$').test(line.charAt(innerStart.col))) {
				innerStart.col++;
			}
			buffer.setSelectionRange(outerStart, innerStart);
			app.edit.deleteSelection();

			mid.row++;
		}

		// middle block
		while (mid.row < outerEnd.row) {
			var re = spc('^S*').exec(buffer.rows(mid));

			buffer.setSelectionRange(
				new Wasavi.Position(mid.row, 0),
				new Wasavi.Position(mid.row, re[0].length));
			app.edit.insert(indent);

			mid.row++;
		}

		// right item
		var line = buffer.rows(outerEnd);
		if (spc('^S*$').test(line.substring(0, innerEnd.col))
		&&  spc('^S*$').test(line.substring(outerEnd.col))) {
			// orphan, delete a whole line
			buffer.isLineOrientSelection = true;
			buffer.setSelectionRange(
				new Wasavi.Position(outerEnd.row, 0),
				new Wasavi.Position(outerEnd.row, line.length + 1));
			app.edit.deleteSelection();
			buffer.isLineOrientSelection = false;
		}
		else {
			// not a orphan, delete leading spaces and right item
			// zzz....}....
			//    ^^^^^

			while (innerEnd.col > 0 && spc('^S$').test(line.charAt(innerEnd.col - 1))) {
				innerEnd.col--;
			}
			buffer.setSelectionRange(innerEnd, outerEnd);
			app.edit.deleteSelection();
		}

		// locate a cursor on the left item
		buffer.setSelectionRange(outerStart);
	}

	function doReplace (pair, outerStart, innerStart, innerEnd, outerEnd) {
		var buffer = app.buffer;
		var ss, se;
		const mark = 'surround-right';

		buffer.isLineOrientSelection = false;

		// mark the position of right item
		app.marks.setPrivate(mark + '-1', innerEnd.clone());
		app.marks.setPrivate(mark + '-2', outerEnd.clone());

		// replace left item
		ss = outerStart;
		se = innerStart;
		buffer.setSelectionRange(ss, se);
		if (spc('^S*$').test(buffer.rows(se).substring(se.col))) {
			pair[0] = pair[0].replace(spc('S*$'), '');
		}
		app.edit.insert(pair[0]);

		// replace right item
		ss = app.marks.getPrivate(mark + '-1');
		se = app.marks.getPrivate(mark + '-2');
		buffer.setSelectionRange(ss, se);
		if (spc('^S*$').test(buffer.rows(ss).substring(0, ss.col))) {
			pair[1] = pair[1].replace(spc('^S*'), '');
		}
		app.edit.insert(pair[1]);

		// locate a cursor on the left item
		buffer.setSelectionRange(outerStart);
		app.marks.setPrivate(mark + '-1');
		app.marks.setPrivate(mark + '-2');
	}

	/*
	 * public methods
	 */

	function insert (s, isLineOrient) {
		var pair = getPairFromString(s);
		if (pair[0] == '' && pair[1] == '') {
			return false;
		}

		app.editLogger.open('surround', function () {
			(isLineOrient ? doInsertAsLinewise : doInsertAsCharwise)(
				pair
			);
		});

		return true;
	}

	function remove (id) {
		var p = getPositions(id);
		if (!p) {
			return false;
		}

		app.editLogger.open('desurround', function () {
			(p.outerStart.row == p.outerEnd.row ? doRemoveSingleLine : doRemoveMultiLine)(
				p.outerStart, p.innerStart, p.innerEnd, p.outerEnd
			);
		});

		return true;
	}

	function replace (id, s) {
		var p = getPositions(id);
		if (!p) {
			return false;
		}

		var pair = getPairFromString(s);
		if (pair[0] == '' && pair[1] == '') {
			return false;
		}

		app.editLogger.open('resurround', function () {
			doReplace(
				pair, p.outerStart, p.innerStart, p.innerEnd, p.outerEnd
			);
		});

		return true;
	}

	function isCharwiseTagPrefix (line) {
		return charwiseTagPrefix.test(line);
	}

	function isLinewiseTagPrefix (line) {
		return linewiseTagPrefix.test(line);
	}

	function isTagPrefix (line) {
		return isCharwiseTagPrefix(line) || isLinewiseTagPrefix(line);
	}

	function dispose () {
		app = null;
	}

	publish(this,
		insert, remove, replace,
		isCharwiseTagPrefix, isLinewiseTagPrefix, isTagPrefix,
		dispose
	);
};

Wasavi.IncDec = function IncDec (app, defaultOpts) {
	/* privates */

	const UPPER_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	const LOWER_ALPHABET = 'abcdefghijklmnopqrstuvwxyz';

	const FORMAT_ALPHA = 'alpha';
	const FORMAT_BIN = 'bin';
	const FORMAT_HEX = 'hex';
	const FORMAT_OCTAL = 'octal';
	const FORMAT_DECIMAL = 'decimal';
	const FORMAT_DEFAULT = [FORMAT_BIN, FORMAT_OCTAL, FORMAT_HEX].join(',');

	const PATTERN_ALPHA = '(\\b[a-zA-Z]\\b)';
	const PATTERN_BIN = '(0b[01]+)';
	const PATTERN_HEX = '(0[xX][0-9a-fA-F]+)';
	const PATTERN_OCTAL = '(0[0-9]*)';
	const PATTERN_DECIMAL = '(-?[0-9]+)';

	function getAlphabetReplacement (result, item, count) {
		const alphabet = /[a-z]/.test(item.text) ? LOWER_ALPHABET : UPPER_ALPHABET;
		const alphabetIndex = item.text.charCodeAt(0) - alphabet.charCodeAt(0);

		count %= alphabet.length;

		if (count < 0) {
			result.replacement = alphabet.charAt((alphabetIndex + alphabet.length + count) % alphabet.length);
		}
		else {
			result.replacement = alphabet.charAt((alphabetIndex + count) % alphabet.length);
		}
	}

	function getBinaryReplacement (result, item, count) {
		const radix = 2;
		const headerLength = 2; // length of '0b'
		const originalLength = item.text.length - headerLength;

		var value = new Uint32Array([parseInt(item.text.substring(headerLength), radix) + count])[0].toString(radix);

		if (value.length < originalLength) {
			value = (multiply('0', originalLength) + value).substr(-originalLength);
		}

		result.replacement = item.text.substring(0, headerLength) + value;
	}

	function getHexReplacement (result, item, count) {
		const radix = 16;
		const headerLength = 2; // length of '0x' or '0X'
		const originalLength = item.text.length - headerLength;

		var value = new Uint32Array([parseInt(item.text.substring(headerLength), radix) + count])[0].toString(radix);

		if (value.length < originalLength) {
			value = (multiply('0', originalLength) + value).substr(-originalLength);
		}

		const reversed = item.text.substring(headerLength).split('').reverse().join('');
		var re = /[a-fA-F]/.exec(reversed);
		if (re) {
			value = /[a-f]/.test(re[0]) ? value.toLowerCase() : value.toUpperCase();
		}
		else {
			value = /^.x/.test(item.text) ? value.toLowerCase() : value.toUpperCase();
		}

		result.replacement = item.text.substring(0, headerLength) + value;
	}

	function getOctalReplacement (result, item, count) {
		const radix = 8;
		const headerLength = 1; // length of '0'
		const originalLength = item.text.length - headerLength;

		var value = new Uint32Array([parseInt(item.text.substring(headerLength), radix) + count])[0].toString(radix);

		if (value.length < originalLength) {
			value = (multiply('0', originalLength) + value).substr(-originalLength);
		}

		result.replacement = item.text.substring(0, headerLength) + value;
	}

	function getDecimalReplacement (result, item, count) {
		const radix = 10;

		var value = new Int32Array([parseInt(item.text, radix) + count])[0].toString(radix);

		result.replacement = value;
	}

	const replaceMap = {};
	replaceMap[FORMAT_ALPHA] =   getAlphabetReplacement;
	replaceMap[FORMAT_BIN] =     getBinaryReplacement;
	replaceMap[FORMAT_HEX] =     getHexReplacement;
	replaceMap[FORMAT_OCTAL] =   getOctalReplacement;
	replaceMap[FORMAT_DECIMAL] = getDecimalReplacement;

	/* publics */

	function extractTargets (s, pos, opts) {
		var optsHash = {};
		var patterns = [];
		var patternIndex = 1;
		var patternIndices = [];
		var matches = [];
		var pattern, re;

		if (opts == undefined) {
			opts = defaultOpts || {
				firstReturn: false,
				formats: FORMAT_DEFAULT
			};
		}

		if (opts.formats == undefined) {
			opts.formats = FORMAT_DEFAULT;
		}

		opts.formats.split(',').forEach(a => optsHash[a.replace(/^\s+|\s+$/g, '')] = 1);

		if (optsHash.alpha) {
			patterns.push(PATTERN_ALPHA);
			patternIndices[patternIndex++] = FORMAT_ALPHA;
		}
		if (optsHash.bin) {
			patterns.push(PATTERN_BIN);
			patternIndices[patternIndex++] = FORMAT_BIN;
		}
		if (optsHash.hex) {
			patterns.push(PATTERN_HEX);
			patternIndices[patternIndex++] = FORMAT_HEX;
		}
		if (optsHash.octal) {
			patterns.push(PATTERN_OCTAL);
			patternIndices[patternIndex++] = FORMAT_OCTAL;
		}

		patterns.push(PATTERN_DECIMAL);
		patternIndices[patternIndex++] = FORMAT_DECIMAL;

		pattern = new RegExp(patterns.join('|'), 'g');
		matches.foundIndex = -1;

		while ((re = pattern.exec(s))) {
			var item = {
				text: '',
				index: -1,
				match: false
			};

			for (var i = 1, goal = re.length; i < goal; i++) {
				if (re[i] != undefined) {
					item.text = re[i];
					item.index = re.index;
					item.type = patternIndices[i];
					if (item.type == FORMAT_OCTAL && /[89]/.test(item.text)) {
						item.type = FORMAT_DECIMAL;
					}
					break;
				}
			}

			if (re.index <= pos && pos < re.index + re[0].length) {
				item.match = true;
				matches.foundIndex = matches.length;
			}

			matches.push(item);

			if (opts.firstReturn && item.match) {
				break;
			}
		}

		return matches;
	}

	function getReplacement (matches, count) {
		var foundIndex = matches.foundIndex;

		if (typeof foundIndex != 'number') {
			throw new TypeError('incdec#getReplacement: foundIndex is not a number');
		}

		if (foundIndex < 0 || matches.length <= foundIndex) {
			return null;
		}

		var item = matches[foundIndex];
		var result = {
			index: item.index,
			text: item.text,
			replacement: item.text
		};

		if (item.type in replaceMap) {
			if (count) {
				replaceMap[item.type](result, item, count);
			}
		}
		else {
			throw new TypeError(`incdec#getReplacement: unknown type ${item.type}`);
		}

		return result;
	}

	function getAllReplacements (matches, count) {
		var oldFoundIndex = matches.foundIndex;
		var result = [];

		try {
			for (var i = 0, goal = matches.length; i < goal; i++) {
				matches.foundIndex = i;
				result.push(getReplacement(matches, count));
			}
		}
		finally {
			matches.foundIndex = oldFoundIndex;
		}

		return result;
	}

	function applyReplacement (rep) {
		var buffer = app.buffer;
		var editor = app.edit;
		var n = new Wasavi.Position(buffer.selectionStartRow, rep.index);

		buffer.isLineOrientSelection = false;
		buffer.setSelectionRange(n);

		if (rep.replacement.length == rep.text.length) {
			editor.overwrite(rep.replacement);
		}
		else if (rep.replacement.length > rep.text.length) {
			editor.overwrite(rep.replacement.substring(0, rep.text.length));
			editor.insert(rep.replacement.substring(rep.text.length));
		}
		else {
			editor.overwrite(rep.replacement);
			buffer.setSelectionRange(
				buffer.selectionStart,
				buffer.offsetBy(
					buffer.selectionStart, rep.text.length - rep.replacement.length));
			editor.deleteSelection();
		}
	}

	publish(this,
		extractTargets, getReplacement, getAllReplacements, applyReplacement
	);
};

Wasavi.SortWorker = function (app, t, a) {
	this.app = app;
	this.t = t;
	this.a = a;
	this.content = this.opts = null;
	this.terminalType = 0;
}
Wasavi.SortWorker.prototype = {
	dosort: function (content, key, regex, opts) {
		var callbacks = {
			i: function (a, b) {
				return a.toLowerCase().localeCompare(b.toLowerCase());
			},

			p: function (a, b) {
				var re = regex.exec(a);
				if (re) {
					a = a.substring(re.index + re[0].length);
				}
				var re = regex.exec(b);
				if (re) {
					b = b.substring(re.index + re[0].length);
				}
				return a.localeCompare(b);
			},
			pr: function (a, b) {
				var re = regex.exec(a);
				if (re) {
					a = re[0];
				}
				var re = regex.exec(b);
				if (re) {
					b = re[0];
				}
				return a.localeCompare(b);
			},
			pi: function (a, b) {
				var re = regex.exec(a);
				if (re) {
					a = a.substring(re.index + re[0].length);
				}
				var re = regex.exec(b);
				if (re) {
					b = b.substring(re.index + re[0].length);
				}
				return a.toLowerCase().localeCompare(b.toLowerCase());
			},
			pri: function (a, b) {
				var re = regex.exec(a);
				if (re) {
					a = re[0];
				}
				var re = regex.exec(b);
				if (re) {
					b = re[0];
				}
				return a.toLowerCase().localeCompare(b.toLowerCase());
			},

			c: function (a, b) {
				// TODO: expand tab?
				a = a.substring(opts.columnNumber);
				b = b.substring(opts.columnNumber);
				return a.localeCompare(b);
			},
			ci: function (a, b) {
				a = a.substring(opts.columnNumber);
				b = b.substring(opts.columnNumber);
				return a.toLowerCase().localeCompare(b.toLowerCase());
			}
		};
		return content.sort(callbacks[key]);
	},
	preSort: function (type, content) {
		switch (type) {
		case 1:
			content = content.replace(/\\\n/g, '\n');

			var spaces = {'\t':0, ' ':0};
			content.replace(spc('(S)\\n', 'g'), function ($0, s) {
				spaces[s]++;
			});

			var maxValueKey = Object.keys(spaces).reduce(function (v, key) {
				return spaces[key] > spaces[v] ? key : v
			});

			if (spaces[maxValueKey] > 0) {
				content = content.replace(spc('S$'), '');
				content += maxValueKey;
			}
			break;
		case 2:
			content = content.replace(/,\n/g, '\n');
			break;
		}
		return content;
	},
	postSort: function (type, content) {
		switch (type) {
		case 1:
			content = content
				.replace(/\n/g, '\\\n')
				.replace(/\s*$/, '');
			break;
		case 2:
			content = content.replace(/\n/g, ',\n');
			break;
		}
		return content;
	},

	parseArgs: function (arg) {
		var re;
		var s = arg != undefined ? arg : this.a.argv[0];
		var opts = {
			force:!!this.a.flags.force,
			ignoreCase:false,
			reuse:false,
			column:false,
			columnNumber:-1,
			pattern:null
		};
		while ((s = s.replace(spc('^S+'), '')) != '') {
			if ((re = /^i/.exec(s))) {
				opts.ignoreCase = true;
				s = s.substring(re[0].length);
			}
			else if ((re = /^r/.exec(s))) {
				opts.reuse = true;
				s = s.substring(re[0].length);
			}
			else if ((re = /^c([0-9]+)/.exec(s))) {
				opts.column = true;
				opts.columnNumber = parseInt(re[1], 10);
				s = s.substring(re[0].length);
			}
			else if (/^[^a-zA-Z0-9"\n\\|]/.test(s)) {
				var d = s.charAt(0);
				s = s.substring(1);
				re = (new RegExp('(?:\\\\.|[^' + d + '])*')).exec(s);
				opts.pattern = re[0].replace(new RegExp('\\\\' + d, 'g'), d);
				s = s.substring(re[0].length + 1);
				if (opts.pattern == '') {
					if ((opts.pattern = app.lastRegexFindCommand.pattern || '') == '') {
						return _('No previous search pattern.');
					}
				}
			}
			else {
				return _('Unknown sort argument: {0}', s);
			}
		}
		this.opts = opts;
		return true;
	},
	buildContent: function (content) {
		if (!content) {
			content = this.t.getValue(this.a.range[0], this.a.range[1], '\n');
		}

		content = trimTerm(content);
		var re = content.match(/\n/g);
		if (!re) return _('Single line can not be sorted.');
		this.rows = re.length + 1;

		var trailEscapes = (content.match(/\\\n/g) || []).length;
		var trailCommas = (content.match(/,\n/g) || []).length;
		if (trailEscapes == this.rows - 1) {
			this.terminalType = 1;
		}
		else if (trailCommas == this.rows - 1) {
			this.terminalType = 2;
		}
		else {
			this.terminalType = 0;
		}

		this.content = this.preSort(this.terminalType, content).split('\n');
		return true;
	},
	sort: function () {
		var opts = this.opts;
		var front = [];

		if (opts.pattern || opts.reuse || opts.ignoreCase || opts.column) {
			var regex, key = '', end = [];
			if (opts.pattern) {
				regex = this.app.low.getFindRegex({
					pattern:opts.pattern,
					csOverride:opts.ignoreCase ? 'i' : '',
					globalOverride:'',
					multilineOverride:''
				});
				if (!regex) {
					return _('Invalid regex pattern.');
				}
				key += 'p';
				if (opts.reuse) {
					key += 'r';
				}
				while (this.content.length) {
					var line = this.content.shift();
					(regex.test(line) ? end : front).push(line);
				}
				this.content = end;
			}
			else if (opts.column) {
				key += 'c';
			}

			if (opts.ignoreCase) {
				key += 'i';
			}

			this.content = this.dosort(this.content, key, regex, opts);
		}
		else {
			this.content = this.content.sort();
		}

		if (front.length) {
			this.content = front.concat(this.content);
		}
		if (opts.force) {
			this.content = this.content.reverse();
		}

		return true;
	},
	getContent: function () {
		var result = this.content.join('\n');
		this.content = null;
		result = this.postSort(this.terminalType, result) + '\n';
		return result;
	}
};

})(typeof global == 'object' ? global : window);

// vim:set ts=4 sw=4 fenc=UTF-8 ff=unix ft=javascript fdm=marker :
