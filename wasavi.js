/**
 * wasavi: vi clone implemented in javascript
 * =============================================================================
 *
 *
 * @author akahuku@gmail.com
 * @version $Id: wasavi.js 96 2012-02-28 07:24:40Z akahuku $
 *
 *
 * Copyright (c) 2012 akahuku@gmail.com
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     1. Redistributions of source code must retain the above copyright
 *        notice, this list of conditions and the following disclaimer.
 *     2. Redistributions in binary form must reproduce the above
 *        copyright notice, this list of conditions and the following
 *        disclaimer in the documentation and/or other materials
 *        provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

(function () {

	/*
	 * constants
	 * ----------------
	 */

	/*@const*/var VERSION = '0.1.' + (/\d+/.exec('$Revision: 96 $') || [1])[0];
	/*@const*/var VERSION_DESC = '$Id: wasavi.js 96 2012-02-28 07:24:40Z akahuku $';
	/*@const*/var CONTAINER_ID = 'wasavi_container';
	/*@const*/var EDITOR_CORE_ID = 'wasavi_editor';
	/*@const*/var LINE_INPUT_ID = 'wasavi_footer_input';
	/*@const*/var IS_GECKO = navigator.product == 'Gecko' && navigator.userAgent.indexOf('Gecko/') != -1;
	/*@const*/var MONOSPACE_FONT_FAMILY = '"Consolas","Monaco","Courier New","Courier",monospace';
	/*@const*/var BRACKETS = '[{(<>)}]';
	/*@const*/var ACCEPTABLE_TYPES = {
		text:     'enableText',
		search:   'enableSearch',
		tel:      'enableTel',
		url:      'enableUrl',
		email:    'enableEmail',
		password: 'enablePassword',
		number:   'enableNumber'
	};
	/*@const*/var SPECIAL_KEYS = {
		'-127':  '<delete>',
		33:  '<pageup>',
		34:  '<pagedown>',
		35:  '<end>',
		36:  '<home>',
		37:  '<left>',
		38:  '<up>',
		39:  '<right>',
		40:  '<down>',
		45:  '<insert>',
		112: '<f1>', 113:  '<f2>', 114:  '<f3>', 115:  '<f4>',
		116: '<f5>', 117:  '<f6>', 118:  '<f7>', 119:  '<f8>',
		120: '<f9>', 121: '<f10>', 122: '<f11>', 123: '<f12>'
	};
	/*@const*/var SPECIAL_KEYS_REVERSED = reverseObject(SPECIAL_KEYS);
	/*@const*/var WEBKIT_KEY_IDENTIFIERS_REVERSED = {
		'U+0008':  -8,
		'U+0009':  -9,
		'U+001B':  -27,
		'Delete':  -127,
		'PageUp':  33,
		'PageDown':34,
		'End':	   35,
		'Home':    36,
		'Left':    37,
		'Up':	   38,
		'Right':   39,
		'Down':    40,
		'Insert':  45,
		'F1':112, 'F2': 113, 'F3': 114, 'F4': 115,
		'F5':116, 'F6': 117, 'F7': 118, 'F8': 119,
		'F9':120, 'F10':121, 'F11':122, 'F12':123
	};
	/*@const*/var WEBKIT_CTRL_SPECIAL_KEYS_REVERSED = {
		'U+00DB': 27,	// ^[
		'U+0036': 30,	// ^^
		'U+00BB': 31	// ^_
	};
	/*@const*/var LATIN1_PROPS = {
		0x0000:'Cc', 0x0001:'Cc', 0x0002:'Cc', 0x0003:'Cc', 0x0004:'Cc', 0x0005:'Cc', 0x0006:'Cc', 0x0007:'Cc',
		0x0008:'Cc', 0x0009:'Zs', 0x000A:'Cc', 0x000B:'Cc', 0x000C:'Cc', 0x000D:'Cc', 0x000E:'Cc', 0x000F:'Cc',
		0x0010:'Cc', 0x0011:'Cc', 0x0012:'Cc', 0x0013:'Cc', 0x0014:'Cc', 0x0015:'Cc', 0x0016:'Cc', 0x0017:'Cc',
		0x0018:'Cc', 0x0019:'Cc', 0x001A:'Cc', 0x001B:'Cc', 0x001C:'Cc', 0x001D:'Cc', 0x001E:'Cc', 0x001F:'Cc',
		0x0020:'Zs', 0x0021:'Po', 0x0022:'Po', 0x0023:'Po', 0x0024:'Sc', 0x0025:'Po', 0x0026:'Po', 0x0027:'Po',
		0x0028:'Ps', 0x0029:'Pe', 0x002A:'Po', 0x002B:'Sm', 0x002C:'Po', 0x002D:'Pd', 0x002E:'Po', 0x002F:'Po',
		0x0030:'Ld', 0x0031:'Ld', 0x0032:'Ld', 0x0033:'Ld', 0x0034:'Ld', 0x0035:'Ld', 0x0036:'Ld', 0x0037:'Ld',
		0x0038:'Ld', 0x0039:'Ld', 0x003A:'Po', 0x003B:'Po', 0x003C:'Sm', 0x003D:'Sm', 0x003E:'Sm', 0x003F:'Po',
		0x0040:'Po', 0x0041:'Lu', 0x0042:'Lu', 0x0043:'Lu', 0x0044:'Lu', 0x0045:'Lu', 0x0046:'Lu', 0x0047:'Lu',
		0x0048:'Lu', 0x0049:'Lu', 0x004A:'Lu', 0x004B:'Lu', 0x004C:'Lu', 0x004D:'Lu', 0x004E:'Lu', 0x004F:'Lu',
		0x0050:'Lu', 0x0051:'Lu', 0x0052:'Lu', 0x0053:'Lu', 0x0054:'Lu', 0x0055:'Lu', 0x0056:'Lu', 0x0057:'Lu',
		0x0058:'Lu', 0x0059:'Lu', 0x005A:'Lu', 0x005B:'Ps', 0x005C:'Po', 0x005D:'Pe', 0x005E:'Sk', 0x005F:'Pc',
		0x0060:'Sk', 0x0061:'Ll', 0x0062:'Ll', 0x0063:'Ll', 0x0064:'Ll', 0x0065:'Ll', 0x0066:'Ll', 0x0067:'Ll',
		0x0068:'Ll', 0x0069:'Ll', 0x006A:'Ll', 0x006B:'Ll', 0x006C:'Ll', 0x006D:'Ll', 0x006E:'Ll', 0x006F:'Ll',
		0x0070:'Ll', 0x0071:'Ll', 0x0072:'Ll', 0x0073:'Ll', 0x0074:'Ll', 0x0075:'Ll', 0x0076:'Ll', 0x0077:'Ll',
		0x0078:'Ll', 0x0079:'Ll', 0x007A:'Ll', 0x007B:'Ps', 0x007C:'Sm', 0x007D:'Pe', 0x007E:'Sm', 0x007F:'Cc'
	};
	/*@const*/var EXFLAGS = {
		addr1: 1,
		addr2: 2,
		addr2All: 4,
		addr2None: 8,
		addrZero: 16,
		addrZeroDef: 32,
		printDefault: 64,
		clearFlag: 128,
		newScreen: 256
	};

	/*
	 * classes
	 * ----------------
	 */

	/*@constructor*/function VariableItem (name, type, defaultValue, subSetter) {
		this.name = name;
		this.type = type;
		this.isLateBind = type == 'r';
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
					if (typeof v != 'boolean') { throw new Error('invalid boolean value'); }
					break;
				case 'i':
					v = Number(v);
					if (typeof v != 'number' || isNaN(v)) { throw new Error('invalid integer value'); }
					break;
				case 's':
					v = String(v);
					if (typeof v != 'string') { throw new Error('invalid string value'); }
					break;
				case 'r':
					if (typeof v != 'string') { throw new Error('invalid regex source string value'); }
					break;
				default:
					throw new Error('*invalid type for value getter*');
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
			case 'i': case 's': case 'r':
				return '  ' + this.name + '=' + this.nativeValue.toString();
			default:
				throw new Error('*invalid type for visibleString*');
			}
		},
		getBinder: function () {
			switch (this.type) {
			case 'r':
				return (function (v) {
					return function () {
						return getFindRegex(v.nativeValue);
					}
				})(this);
			default:
				throw new Error('*invalid type for getBinder*');
			}
		}
	};
	/*@constructor*/function Configurator (internals, abbrevs) {
		var vars = {};
		var names = {};
		function init () {
			internals.sort(function (a, b) {
				return a.name.localeCompare(b.name);
			});
			internals.forEach(function (v, i) {
				names[v.name] = i;
				if (v.isLateBind) {
					v.value = v.nativeValue;
					vars.__defineGetter__(v.name, v.getBinder());
				}
				else {
					v.value = v.nativeValue;
					vars[v.name] = v.value;
				}
			});
		}
		function getItem (name) {
			if (/^no/.test(name)) {
				name = name.substring(2);
			}
			if (name in abbrevs) {
				name = abbrevs[name];
			}
			if (name in names) {
				return internals[names[name]];
			}
		}
		this.getInfo = function (name) {
			var item = getItem(name);
			if (item) {
				return {name:item.name, type:item.type};
			}
		};
		this.getData = function (name, reformat) {
			var item = getItem(name);
			if (item) {
				return reformat ? item.visibleString : item.value;
			}
		};
		this.setData = function (name, value) {
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
		};
		this.dump = function (all) {
			var result = ['*** options ***'];
			var phaseThreshold = 20;
			var gap = 1;
			for (var i = 0; i < 2; i++) {
				var maxLength = 0;
				var tmp = [];
				for (var j = 0; j < internals.length; j++) {
					var item = internals[j];
					var line = item.visibleString;
					if (!all && item.value == item.defaultValue) {
						continue;
					}
					if (i == 0 && line.length <= phaseThreshold - gap
					||	i == 1 && line.length >  phaseThreshold - gap) {
						tmp.push(line);
						if (line.length > maxLength) {
							maxLength = line.length;
						}
					}
				}
				if (i == 0) {
					var cols = Math.max(1, Math.floor((backlog.cols + gap - 3) / (maxLength + gap)));
					var rows = Math.floor((tmp.length + cols - 1) / cols);
					for (var j = 0; j < rows; j++) {
						var tmpline = '';
						for (var k = 0; k < cols; k++) {
							var index = k * rows + j;
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
		};
		this.__defineGetter__('vars', function () { return vars; });
		init();
	}

	/*@constructor*/function Position (row, col) {
		this.row = row;
		this.col = col;
	}
	Position.prototype = {
		toString: function () {
			return JSON.stringify(this);
		},
		clone: function () {
			return new Position(this.row, this.col);
		},
		round: function (t) {
			this.row = Math.max(0, Math.min(this.row, t.rowLength - 1));
			this.col = Math.max(0, Math.min(this.col, t.rows(this.row).length - (this.row == t.rowLength - 1 ? 0 : 1)));
			return this;
		},
		isp: function (o) {
			return o && (o instanceof Position || 'row' in o && 'col' in o);
		},
		eq: function (o) {
			return this.isp(o) && this.row == o.row && this.col == o.col;
		},
		ne: function (o) {
			return this.isp(o) && (this.row != o.row || this.col != o.col);
		},
		gt: function (o) {
			return this.isp(o) && (this.row > o.row || this.col > o.col);
		},
		lt: function (o) {
			return this.isp(o) && (this.row < o.row || this.col < o.col);
		},
		ge: function (o) {
			return this.isp(o) && (this.row >= o.row || this.col >= o.col);
		},
		le: function (o) {
			return this.isp(o) && (this.row <= o.row || this.col <= o.col);
		}
	};

	/*@constructor*/function RegisterItem () {
		this.isLineOrient = false;
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
			data = (data || '').toString();
			if (this.isLineOrient) {
				this.data = data.replace(/\n$/, '') + '\n';
			}
			else {
				this.data = data;
			}
		},
		appendData: function (data) {
			data = (data || '').toString();
			if (this.isLineOrient) {
				this.data += data.replace(/\n$/, '') + '\n';
			}
			else {
				this.data += data;
			}
		}
	};

	/*@constructor*/function Registers () {
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

		var unnamed = new RegisterItem();
		var named = {};
		var storageKey = 'wasavi_registers';

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
			setLocalStorage(storageKey, serialize());
		}
		function load () {
			getLocalStorage(storageKey, function (value) {
				restore(value || '');
			});
		}
		function isWritable (name) {
			return /^[1-9a-zA-Z@]$/.test(name);
		}
		function isReadable (name) {
			return /^["1-9a-z@.:*\/]$/.test(name);
		}
		function exists (name) {
			return isReadable(name) && (name == '"' || named[name]);
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
			// unnamed register
			if (typeof name != 'string' || name == '') {
				// case of several deletion operation or data of two or more lines,
				// update "1 too.
				if (state == 'normal'
				&& prefixInput.operation == 'd'
				&& '%`/?()Nn{}'.indexOf(prefixInput.motion) >= 0
				||	(data.match(/\n/g) || []).length >= 2) {
					set('1', data, isLineOrient);
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
				else if (/^[2-9a-z]$/.test(name)) {
					findItem(name).set(data, isLineOrient);
					unnamed.set(data, isLineOrient);
				}
				else if (/^[@.:*\/]$/.test(name) && !isInteractive) {
					findItem(name).set(data, isLineOrient);
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
				return findItem(name);
			}
			return new RegisterItem();
		}
		function dump () {
			function dumpItem (item) {
				var orientString = item.isLineOrient ? _('line') : _('char');
				return _('[{0} orient]\n"{1}"', orientString, toVisibleString(item.data));
			}
			var a = [_('*** registers ***')];
			a.push('""	' + dumpItem(unnamed));
			for (var i in named) {
				named[i] && a.push('"' + i + '	' + dumpItem(named[i]));
			}
			return a;
		}

		this.__defineGetter__('storageKey', function () { return storageKey; });
		this.set = set;
		this.get = get;
		this.isWritable = isWritable;
		this.isReadable = isReadable;
		this.exists = exists;
		this.dump = dump;
		this.save = save;
		this.load = load;

		load();
	}

	/*@constructor*/function PrefixInput () {
		var register;
		var operation;
		var motion;
		var count1;
		var count2;
		var trailer;
		var isEmpty;
		var isLocked;

		function reset () {
			if (isLocked) return;
			register = '';
			operation = '';
			motion = '';
			count1 = '';
			count2 = '';
			trailer = '';
			isEmpty = true;
			isLocked = false;
		}
		function appendRegister (v) {
			if (isLocked) return;
			register += v;
			isEmpty = false;
		}
		function appendOperation (v) {
			if (isLocked) return;
			operation += v;
			isEmpty = false;
		}
		function appendMotion (v) {
			if (isLocked) return;
			motion += v;
			isEmpty = false;
		}
		function appendTrailer (v) {
			if (isLocked) return;
			trailer += v;
			isEmpty = false;
		}
		function appendCommand (v) {
			if (isLocked) return;
			if (operation == '') {
				operation = v;
			}
			else {
				motion = v;
			}
			isEmpty = false;
		}
		function appendCount (v) {
			if (isLocked) return;
			if (operation == '') {
				count1 += v;
			}
			else {
				count2 += v;
			}
			isEmpty = false;
		}
		function setRegister (v) {
			if (isLocked) return;
			if (register == '') { register = v; isEmpty = false; }
		}
		function setOperation (v) {
			if (isLocked) return;
			if (operation == '') { operation = v; isEmpty = false; }
		}
		function setMotion (v) {
			if (isLocked) return;
			if (motion == '') { motion = v; isEmpty = false; }
		}
		function setTrailer (v) {
			if (isLocked) return;
			if (trailer == '') { trailer = v; isEmpty = false; }
		}
		function setLocked (v) {
			isLocked = v;
		}

		this.__defineGetter__('register', function () { return register.substring(1) || ''; });
		this.__defineGetter__('operation', function () { return operation; });
		this.__defineGetter__('motion', function () { return motion; });
		this.__defineGetter__('count1', function () { return count1 || 0; });
		this.__defineGetter__('count2', function () { return count2 || 0; });
		this.__defineGetter__('count', function () { return (count1 || 1) * (count2 || 1); });
		this.__defineGetter__('trailer', function () { return trailer; });
		this.__defineGetter__('isEmpty', function () { return isEmpty; });
		this.__defineGetter__('isEmptyOperation', function () { return operation == ''; });
		this.__defineGetter__('isCountSpecified', function () { return !!(count1 || count2); });
		this.__defineGetter__('isLocked', function () { return isLocked; });

		this.__defineSetter__('register', setRegister);
		this.__defineSetter__('operation', setOperation);
		this.__defineSetter__('motion', setMotion);
		this.__defineSetter__('trailer', setTrailer);
		this.__defineSetter__('isLocked', setLocked);

		this.toString = function () {
			return register + count1 + operation + count2 + motion + trailer;
		};
		this.toVisibleString = function () {
			return [register, count1, operation, count2, motion, trailer]
				.map(function (s) { return toVisibleString(s); })
				.join('');
		};

		this.reset = reset;
		this.appendCommand = appendCommand;
		this.appendCount = appendCount;
		this.appendRegister = appendRegister;
		this.appendOperation = appendOperation;
		this.appendMotion = appendMotion;
		this.appendTrailer = appendTrailer;

		reset();
	}

	/*@constructor*/function CursorUI (editor, comCursor, editCursor) {
		var cursorType = 'command';
		var focused = false;
		var visible = false;
		var wrapper = null;
		var isInComposition = false;

		/*@constructor*/function CommandWrapper (mode) {
			var cursorBlinkTimer;

			function handleBlink () {
				var s = document.defaultView.getComputedStyle(comCursor, '');
				if (s.visibility == 'visible') {
					comCursor.style.visibility = 'hidden';
				}
				else {
					comCursor.style.visibility = 'visible';
				}
			}
			function startBlink () {
				stopBlink();
				cursorBlinkTimer = setInterval(handleBlink, 500);
			}
			function stopBlink () {
				cursorBlinkTimer && clearInterval(cursorBlinkTimer);
				cursorBlinkTimer = null;
			}
			this.hide = function () {
				comCursor.style.display = 'none';
				stopBlink();
			};
			this.show = function () {
				comCursor.style.display = 'block';
				comCursor.style.visibility = 'visible';

				var c = ' ';
				if (!editor.isEndOfText(editor.selectionStart)
				&& !editor.isNewline(editor.selectionStart)
				&&	editor.charAt(editor.selectionStart) != '\t') {
					c = editor.charAt(editor.selectionStart);
				}
				comCursor.childNodes[0].textContent = c;

				var coord = getCoord();
				coord.left += editor.elm.clientLeft;
				coord.top += editor.elm.clientTop;
				coord.left -= editor.elm.scrollLeft;
				coord.top -= editor.elm.scrollTop;
				comCursor.style.left = coord.left + 'px';
				comCursor.style.top = coord.top + 'px';
				comCursor.style.color = 'white';
				comCursor.style.backgroundColor = 'black';
				startBlink();

				document.activeElement.blur();
			};
			this.lostFocus = function () {
				stopBlink();
				comCursor.style.display = 'block';
				comCursor.style.visibility = 'visible';
				comCursor.style.backgroundColor = 'gray';
				comCursor.style.color = 'white';
			};
			this.compositionUpdate =
			this.compositionComplete = function () {};
		}

		/*@constructor*/function EditWrapper (mode) {
			var leading;

			function getCompositionSpan () {
				return document.querySelector('#wasavi_editor > div > span.wasavi_composition');
			}
			function createCompositionSpan () {
				var span = getCompositionSpan();
				if (!span) {
					span = document.createElement('span');
					span.className = 'wasavi_composition';

					var n = editor.selectionStart;
					var r = document.createRange();
					var node = editor.rowTextNodes(n);
					r.setStart(node, 0);
					r.setEnd(node, n.col);
					r.surroundContents(span);
					r.detach();
				}
				return span;
			}
			function removeCompositionSpan () {
				var span = getCompositionSpan();
				if (span) {
					var length = span.textContent.length;
					var r = document.createRange();
					var pa = span.parentNode;
					r.selectNodeContents(span);
					var f = r.extractContents();
					r.setStartBefore(span);
					r.insertNode(f);
					r.selectNode(span);
					r.deleteContents();
					pa.normalize();
					r.detach();
				}
			}
			this.compositionUpdate = function (data) {
				var span = getCompositionSpan();
				if (span) {
					span.textContent = leading + data;
				}
			}
			this.compositionComplete = function (data) {
				getCompositionSpan().textContent = leading;
				removeCompositionSpan();
				executeViCommand(data, true);
			};
			this.hide = function () {
				editCursor.style.display = 'none';
				removeCompositionSpan();
			};
			this.show = function () {
				if (runLevel || isInComposition) {
					return;
				}
				editCursor.style.display = 'block';

				var s = editor.selectionStart;
				var c = $(CONTAINER_ID).getBoundingClientRect();
				var r = editor.rowNodes(s).getBoundingClientRect();

				editCursor.style.left = (r.left - c.left) + 'px';
				editCursor.style.top = (r.top - c.top) + 'px';
				editCursor.style.width = (r.right - r.left) + 'px';
				editCursor.style.height = (docClientHeight() - r.top - 1) + 'px';

				removeCompositionSpan();
				var span = createCompositionSpan();
				editCursor.value = leading = span.textContent;
				editCursor.selectionStart = editCursor.value.length;
				editCursor.selectionEnd = editCursor.value.length;

				editCursor.focus();
			};
			this.lostFocus = function () {};
		}
		function syncPosition () {
			fixPosition();
			var caretdiv = $('wasavi_multiline_scaler');
			var n = editor.selectionStart;
			caretdiv.textContent = editor.rows(n);

			var eb = editor.rowNodes(0).getBoundingClientRect();
			var rb = editor.rowNodes(n.row).getBoundingClientRect();
			var span = document.createElement('span');
			var r = document.createRange();

			if (caretdiv.textContent.length) {
				var col = Math.min(n.col, caretdiv.firstChild.length - 1);
				r.setStart(caretdiv.firstChild, col);
				r.setEnd(caretdiv.firstChild, col + 1);
			}
			else {
				r.selectNodeContents(caretdiv);
			}
			r.surroundContents(span);
			r.detach();

			span.id = 'wasavi_caret';
			span.style.color = 'HighlightText';
			span.style.backgroundColor = 'Highlight';
			span.dataset.rowLeft = rb.left - eb.left;
			span.dataset.rowTop = rb.top - eb.top;
			if (/^[\r\n\t]?$/.test(span.textContent)) {
				span.textContent = ' ';
			}
		}

		function ensureVisible (smooth) {
			syncPosition();

			var caret = getCoord();
			var elm = editor.elm;
			var viewBottom = elm.scrollTop + elm.clientHeight;

			if (caret.top < elm.scrollTop && caret.bottom <= viewBottom) {
				if (smooth) {
					scroller.run(caret.top);
				}
				else {
					editor.scrollTop = caret.top;
				}
			}
			else if (caret.bottom > viewBottom && caret.top >= elm.scrollTop) {
				if (smooth) {
					scroller.run(caret.bottom - elm.clientHeight);
				}
				else {
					editor.scrollTop = caret.bottom - elm.clientHeight;
				}
			}
		}

		function getCoord () {
			var div = $('wasavi_multiline_scaler');
			var caret = $('wasavi_caret');
			var b = caret.getBoundingClientRect();
			var rowLeft = caret.dataset.rowLeft - 0;
			var rowTop = caret.dataset.rowTop - 0;
			var result = {
				left:	b.left	 + div.scrollLeft - div.offsetLeft - div.clientLeft + rowLeft,
				right:	b.right  + div.scrollLeft - div.offsetLeft - div.clientLeft + rowLeft,
				top:	b.top	 + div.scrollTop  - div.offsetTop  - div.clientTop	+ rowTop,
				bottom: b.bottom + div.scrollTop  - div.offsetTop  - div.clientTop	+ rowTop
			};
			return result;
		}
		function fixPosition () {
			if (editor.selected) {return;}

			var needFix1 = !isEditing();
			var needFix2 = !requestedState.inputMode || !isEditing(requestedState.inputMode.mode);
			if (needFix1 && needFix2) {
				var n = editor.selectionStart;
				var fixed = false;
				if (n.col > 0 
				&& n.row == editor.rowLength - 1 
				&& n.col >= editor.rows(n).length) {
					n.col = Math.max(0, editor.rows(n).length - 1);
					fixed = true;
				}
				if (n.col > 0 && editor.isNewline(n)) {
					n.col--;
					fixed = true;
				}
				if (fixed) {
					editor.setSelectionRange(n);
				}
			}
		}
		function update (opts) {
			if (opts) {
				if ('visible' in opts) {
					visible = opts.visible;
				}
				if ('focused' in opts) {
					focused = opts.focused;
				}
				if ('type' in opts) {
					if (!wrapper || opts.type != cursorType) {
						wrapper && wrapper.hide();
						wrapper = null;
						cursorType = opts.type;
					}
				}
			}

			if (!wrapper) {
				switch (cursorType) {
				default:
					wrapper = new CommandWrapper(cursorType);
					break;

				case 'edit':
				case 'edit-overwrite':
					wrapper = new EditWrapper(cursorType);
					compositionStartPos = editor.selectionStart;
					break;
				}
			}

			if (!visible) {
				wrapper.hide();
			}
			else {
				if (focused) {
					wrapper.show();
				}
				else {
					wrapper.lostFocus();
				}
			}
		}
		function handleCompositionStart (e) {
			isInComposition = true;
			wrapper.compositionUpdate(e.data);
		}
		function handleCompositionUpdate (e) {
			wrapper.compositionUpdate(e.data);
		}
		function handleCompositionEnd (e) {
			wrapper.compositionComplete(e.data);
			isInComposition = false;
			ensureVisible();
			update();
		}
		function handleInput (e) {
			e.preventDefault();
			e.stopPropagation();
			e.returnValue = false;
		}
		function setupEventHandlers (method) {
			editCursor[method]('compositionstart', handleCompositionStart, false);
			editCursor[method]('compositionupdate', handleCompositionUpdate, false);
			editCursor[method]('compositionend', handleCompositionEnd, false);
			editCursor[method]('textInput', handleInput, false);
		}

		this.ensureVisible = ensureVisible;
		this.getCoord = getCoord;
		this.fixPosition = fixPosition;
		this.update = update;
		this.setupEventHandlers = setupEventHandlers;

		this.__defineGetter__('type', function () { return cursorType; });
		this.__defineGetter__('focused', function () { return focused; });
		this.__defineGetter__('visible', function () { return visible; });
		this.__defineGetter__('commandCursor', function () { return comCursor; });
		this.__defineGetter__('editCursor', function () { return editCursor; });
		this.__defineGetter__('isInComposition', function () { return isInComposition; });
	}

	/*@constructor*/function RegexConverter () {
		var flips = {
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
		function convert (s) {
			if (typeof s == 'string') {
				return s.replace(/\[(?:[^\]]|\\\])*\]|\\[?+<>{}()]|\(\?|[?+{}()$]/g, function ($0) {
					return flips[$0] || $0;
				});
			}
			else if (s instanceof RegExp) {
				return s.source;
			}
			throw new Error('invalid regex source');
		}
		function getRegex (s, opts) {
			var result;
			try {
				result = new RegExp(convert(s), opts || '');
			}
			catch (e) {
				result = null;
			}
			return result;
		}
		function getCS (s) {
			if (config.vars.smartcase && /[A-Z]/.test(s)) {
				return 'i';
			}
			return config.vars.ignorecase ? 'i' : '';
		}
		function getDefaultOption () {
			return {
				wrapscan: config.vars.wrapscan,
				magic: config.vars.magic
			};
		}
		this.toJsRegexString = convert;
		this.toJsRegex = getRegex;
		this.getCS = getCS;
		this.getDefaultOption = getDefaultOption;
	}

	/*@constructor*/function Marks (editor) {
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

				marks[i] = (new Position(row, col)).round(editor);
			}
		}
		function save () {
			targetElement.dataset.wasaviMarks = serialize();
		}
		function isValidName (name) {
			return /^[a-zA-Z']$/.test(name);
		}
		function set (name, pos) {
			if (isValidName(name)) {
				marks[name] = pos;
			}
			//dump();
			save();
		}
		function get (name) {
			if (isValidName(name) && name in marks) {
				return marks[name];
			}
		}
		function update2 (pos, func) {
			function setMarks () {
				var usedMarks = {};
				var r = document.createRange();
				for (var i in marks) {
					var m = marks[i];
					if (m.row > pos.row || m.row == pos.row && m.col >= pos.col) {
						usedMarks[i] = true;
						var node = editor.rowTextNodes(m);
						r.setStart(node, m.col);
						r.setEnd(node, m.col);
						var span = document.createElement('span');
						span.className = 'wasavi_mark';
						span.dataset.index = i;
						r.insertNode(span);
					}
				}
				return usedMarks;
			}
			function releaseMarks (usedMarks) {
				var nodes = document.querySelectorAll('#wasavi_editor > div > span.wasavi_mark');
				for (var i = 0, goal = nodes.length; i < goal; i++) {
					var span = nodes[i];
					var index = span.dataset.index;
					var m = marks[index];
					marks[index].row = editor.indexOf(span.parentNode);
					marks[index].col = calcColumn(span);
					var pa = span.parentNode;
					pa.removeChild(span);
					pa.normalize();
					delete usedMarks[index];
				}

				var ss = editor.selectionStart;
				for (var i in usedMarks) {
					marks[i] = ss;
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
			var usedMarks;
			try {
				usedMarks = setMarks();
				func && func();
			}
			finally {
				releaseMarks(usedMarks);
				save();
			}
		}
		function dump () {
			var a = [
			//     mark  line   col  text
			//     a    00000  0000  aaaaaaaaaa
				_('*** marks ***'),
				_('mark  line   col   text'),
				  '====  =====  ====  ===='];
			for (var i in marks) {
				a.push(
					' ' + i + '  ' +
					'  ' + ('    ' + (marks[i].row + 1)).substr(-5) +
					'  ' + ('   ' + (marks[i].col)).substr(-4) +
					'  ' + toVisibleString(editor.rows(marks[i]))
				);
			}
			return a;
		}
		this.set = set;
		this.get = get;
		this.update2 = update2;
		this.dump = dump;
		this.save = save;

		restore(targetElement.dataset.wasaviMarks || '');
	}

	/*@constructor*/function RegexFinderInfo () {
		var head;
		var direction;
		var offset;
		var scrollTop;
		var scrollLeft;
		var pattern;
		var verticalOffset;
		var text;

		function push (o) {
			head = o.head || '';
			direction = o.direction || 0;
			offset = o.offset || 0;
			scrollTop = o.scrollTop || 0;
			scrollLeft = o.scrollLeft || 0;
		}
		function setPattern (p, withOffset) {
			pattern = p;
			verticalOffset = undefined;

			if (withOffset) {
				var fragments = p.split(head);
				if (fragments.length >= 2 && fragments[fragments.length - 2].substr(-1) != '\\') {
					var re = /\s*([-+]?\d+)\s*$/.exec(fragments[fragments.length - 1]);
					if (re) {
						verticalOffset = parseInt(re[1], 10);
					}
					fragments.pop();
					pattern = fragments.join(head);
				}
			}
		}
		this.__defineGetter__('head', function () { return head; });
		this.__defineGetter__('direction', function () { return direction; });
		this.__defineGetter__('offset', function () { return offset; });
		this.__defineGetter__('scrollTop', function () { return scrollTop; });
		this.__defineGetter__('scrollLeft', function () { return scrollLeft; });
		this.__defineGetter__('pattern', function () { return pattern; });
		this.__defineGetter__('verticalOffset', function () { return verticalOffset; });
		this.__defineGetter__('text', function () { return text; });
		this.__defineSetter__('text', function (v) { texti = v; });
		this.push = push;
		this.setPattern = setPattern;
	}

	/*@constructor*/function Editor (element) {
		this.elm = $(element);
		this.isLineOrientSelection = false;
	}
	Editor.prototype = new function () {
		function arg2pos (args) {
			if (args[0] instanceof Position) {
				return args[0].clone();
			}
			else {
				return new Position(args[0], args[1]);
			}
		}
		function popLastArg (args, type) {
			type || (type = 'function');
			if (args.length && typeof args[args.length -1] == type) {
				var func = args[args.length - 1];
				args.pop();
				return func;
			}
		}
		function setRange (r, pos, isEnd) {
			var iter = document.createNodeIterator(
				this.elm.childNodes[pos.row], NodeFilter.SHOW_TEXT, null, false);
			var totalLength = 0;
			var node;
			while ((node = iter.nextNode())) {
				var next = totalLength + node.nodeValue.length;
				if (totalLength <= pos.col && pos.col < next) {
					if (isEnd) {
						r.setEnd(node, pos.col - totalLength);
					}
					else {
						r.setStart(node, pos.col - totalLength);
					}
					break;
				}
				totalLength = next;
			}
		}
		function select (s, e) {
			if (arguments.length == 0) {
				s = this.selectionStart;
				e = this.selectionEnd;
			}
			else if (arguments.length != 2) {
				throw 'select: invalid length of argument';
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
				throw 'selectRows: invalid length of argument';
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
					throw new Error('isEndOfText: argument row (' + row + ') out of range.');
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
					throw new Error('isNewline: argument row (' + row + ') out of range.');
				}
				var node = this.elm.childNodes[a.row].textContent;
				if (a.col < node.length - 1 || a.row == this.elm.childNodes.length - 1) {
					return false;
				}
				return true;
			},

			// getter
			rows: function (arg) {
				var row = arg;
				if (arg instanceof Position) {
					row = arg.row;
				}
				if (row < 0 || row >= this.elm.childNodes.length) {
					throw new Error('rows: argument row (' + row + ') out of range.');
				}
				return this.elm.childNodes[row].textContent.replace(/\n$/, '');
			},
			rowNodes: function (arg) {
				var row = arg;
				if (arg instanceof Position) {
					row = arg.row;
				}
				if (row < 0 || row >= this.elm.childNodes.length) {
					throw new Error('rowNodes: argument row (' + row + ') out of range.');
				}
				return this.elm.childNodes[row];
			},
			rowTextNodes: function (arg) {
				var row = arg;
				if (arg instanceof Position) {
					row = arg.row;
				}
				if (row < 0 || row >= this.elm.childNodes.length) {
					throw new Error('rowTextNodes: argument row (' + row + ') out of range.');
				}
				var node = this.elm.childNodes[row];
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

				return cp <= 0x7f ? getLatin1Prop(cp).charAt(0) : getUnicodeBlock(cp);
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
				var content = r.r.toString();
				if (content.length && content.charAt(content.length - 1) != '\n') {
					content += '\n';
				}
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
				||	a.col == node.length - 1 && node.charAt(a.col) == '\n') {
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
				var re = /^\s*/.exec(this.elm.childNodes[a.row].textContent);
				a.col = re ? re[0].length : 0;
				return a;
			},
			getIndent: function () {
				var a = arg2pos(arguments);
				var re = /^\s*/.exec(this.rows(a));
				return re[0];
			},
			getBackIndent: function () {
				var a = arg2pos(arguments);
				var result = '';
				while (--a.row > 0) {
					var line = this.rows(a);
					if (line != '') {
						var re = /^\s*/.exec(line);
						result = re[0];
						break;
					}
				}
				return result;
			},

			// setter
			setRow: function (arg, text) {
				var row = arg;
				if (arg instanceof Position) {
					row = arg.row;
				}
				this.elm.childNodes[row].textContent = text.replace(/\n$/, '') + '\n';
			},
			setSelectionRange: function () {
				if (arguments.length == 1) {
					if (arguments[0] instanceof Position) {
						this.selectionStart = arguments[0].clone();
						this.selectionEnd = arguments[0].clone();
					}
					else if (typeof arguments[0] == 'number') {
						this.selectionStart = this.linearPositionToBinaryPosition(arguments[0]);
					}
				}
				else if (arguments.length > 1) {
					if (arguments[0] instanceof Position) {
						this.selectionStart = arguments[0].clone();
					}
					else if (typeof arguments[0] == 'number') {
						this.selectionStart = this.linearPositionToBinaryPosition(arguments[0]);
					}
					if (arguments[1] instanceof Position) {
						this.selectionEnd = arguments[1].clone();
					}
					else if (typeof arguments[1] == 'number') {
						this.selectionEnd = this.linearPositionToBinaryPosition(arguments[1]);
					}
				}
			},

			// method
			focus: function () {
				return this.elm.focus();
			},
			insertChars: function (arg, text) {
				var iter = document.createNodeIterator(
					this.elm.childNodes[arg.row],
					NodeFilter.SHOW_TEXT, null, false);
				var totalLength = 0;
				var node;

				while ((node = iter.nextNode())) {
					var next = totalLength + node.nodeValue.length;
					if (totalLength <= arg.col && arg.col < next) {
						var li = arg.col - totalLength;
						node.insertData(li, text);
						arg.col += text.length;
						break;
					}
					totalLength = next;
				}

				return arg;
			},
			overwriteChars: function (arg, text) {
				var iter = document.createNodeIterator(
					this.elm.childNodes[arg.row], NodeFilter.SHOW_TEXT, null, false);
				var totalLength = 0;
				var node;
				var textOffset = 0;
				var canOverwrite = false;
				var rowTextLength = this.rows(arg).length;

				while ((node = iter.nextNode())) {
					var next = totalLength + node.nodeValue.length;
					if (totalLength <= arg.col && arg.col < next) {
						canOverwrite = true;
					}

					if (!canOverwrite) {
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

					if (textOffset >= text.length) {
						done = true;
					}

					totalLength = next;
				}

				fixLineTail(this.elm.childNodes[arg.row]);

				return arg;
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
				func && func(content);

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
				func && func(content);
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
				var e = new Position(
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
					div1, NodeFilter.SHOW_TEXT, null, false);
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
				if (n instanceof Position) {
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
					this.elm, NodeFilter.SHOW_TEXT, null, false);
				var totalLength = 0;
				var pa;
				var node;
				var row = -1;

				while ((node = iter.nextNode())) {
					if (node.parentNode != pa) {
						pa = node.parentNode;
						row++;
					}
					var next = totalLength + node.nodeValue.length;
					if (totalLength <= n && n < next) {
						result = new Position(row, n - totalLength);
						break;
					}
					totalLength = next;
				}

				return result;
			},
			binaryPositionToLinearPosition: function (a) {
				var r = document.createRange();
				r.setStart(this.elm.childNodes[0].firstChild, 0);
				r.setEnd(this.elm.childNodes[a.row].firstChild, a.col);
				var result = r.toString().length;
				r.detach();
				return result;
			},
			emphasis: function (s, length) {
				if (s == undefined) {
					s = this.selectionStart;
				}
				else if (typeof s == 'number') {
					s = this.linearPositionToBinaryPosition(s);
				}

				var e = this.offsetBy(s, length);

				if (s.row > e.row || s.row == e.row && s.col > e.col) {
					var tmp = s;
					s = e;
					e = tmp;
				}

				this.unEmphasis();
				var r = document.createRange();

				if (s.row == e.row) {
					r.setStart(this.elm.childNodes[s.row].firstChild, s.col);
					r.setEnd(this.elm.childNodes[s.row].firstChild, e.col);
					r.surroundContents(createSpan());
				}
				else {
					// start
					r.setStart(this.elm.childNodes[s.row].firstChild, s.col);
					r.setEnd(this.elm.childNodes[s.row].firstChild, this.elm.childNodes[s.row].textContent.length);
					r.surroundContents(createSpan());

					// middle
					for (var i = s.row + 1; i < e.row; i++) {
						r.selectNodeContents(this.elm.childNodes[i]);
						r.surroundContents(createSpan());
					}

					// end
					r.setStart(this.elm.childNodes[e.row].firstChild, 0);
					r.setEnd(this.elm.childNodes[e.row].firstChild, e.col);
					r.surroundContents(createSpan());
				}

				r.detach();

				function createSpan () {
					var span = document.createElement('span');
					span.className = 'wasavi_em';
					return span;
				}
			},
			unEmphasis: function () {
				var nodes = document.querySelectorAll('span.wasavi_em');
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
			offsetBy: function (s, offset) {
				var row = s.row;
				var col = s.col;
				var last = this.elm.childNodes.length - 1;
				while (offset > 0) {
					var node = this.elm.childNodes[row].textContent;
					if (row == last && node.substr(-1) == '\n') {
						node = node.substring(node.length - 1);
					}
					var rest = node.length - col;
					col += offset;
					offset -= rest;
					if (col >= node.length) {
						if (row == last) {
							col = node.length;
							offset = 0;
						}
						else {
							row++;
							col = 0;
						}
					}
				}
				return new Position(row, col);
			},

			// getter properties
			get rowLength () {
				return this.elm.childNodes.length;
			},
			get value () {
				var result = this.elm.textContent;
				if (result.length && result.substr(-1) == '\n') {
					result = result.substring(0, result.length - 1);
				}
				return result;
			},
			get selected () {
				return this.selectionStart.ne(this.selectionEnd);
			},
			get selectionStart () {
				return new Position(this.selectionStartRow, this.selectionStartCol);
			},
			get selectionStartRow () {
				return this.elm.dataset.wasaviSelStartRow - 0;
			},
			get selectionStartCol () {
				return this.elm.dataset.wasaviSelStartCol - 0;
			},
			get selectionEnd () {
				return new Position(this.selectionEndRow, this.selectionEndCol);
			},
			get selectionEndRow () {
				return this.elm.dataset.wasaviSelEndRow - 0;
			},
			get selectionEndCol () {
				return this.elm.dataset.wasaviSelEndCol - 0;
			},
			get scrollTop () {
				return this.elm.scrollTop;
			},
			get scrollLeft () {
				return this.elm.scrollLeft;
			},

			// setter properties
			set value (v) {
				var html =
					'<div>' + v
						.replace(/&/g, '&amp;')
						.replace(/</g, '&lt;')
						.replace(/>/g, '&gt;')
						.replace(/\r\n/g, '\n')
						.replace(/\u007f/g, '\u2421')
						.replace(/[\u0000-\u0008\u000b-\u001b]/g, function (a) {
							return String.fromCharCode(0x2400 + a.charCodeAt(0));
						})
						.replace(/\n/g, '\n</div><div>') +
					'\n</div>';
				this.elm.innerHTML = html;
			},
			set selectionStart (v) {
				if (typeof v == 'number') {
					v = this.linearPositionToBinaryPosition(v) || new Position(0, 0);
				}
				if (v instanceof Position) {
					this.elm.dataset.wasaviSelStartRow = v.row;
					this.elm.dataset.wasaviSelStartCol = v.col;
				}
			},
			set selectionEnd (v) {
				if (typeof v == 'number') {
					v = this.linearPositionToBinaryPosition(v) || new Position(0, 0);
				}
				if (v instanceof Position) {
					this.elm.dataset.wasaviSelEndRow = v.row;
					this.elm.dataset.wasaviSelEndCol = v.col;
				}
			},
			set scrollTop (v) {
				this.elm.removeEventListener('scroll', handleScroll, false);
				this.elm.scrollTop = v;
				this.elm.addEventListener('scroll', handleScroll, false);
			},
			set scrollLeft (v) {
				this.elm.removeEventListener('scroll', handleScroll, false);
				this.elm.scrollLeft = v;
				this.elm.addEventListener('scroll', handleScroll, false);
			}
		};
	};

	/*@constructor*/function Scroller (editor) {
		var running = false;
		var consumeMsecs = 250;
		var timerPrecision = 1;
		var lastRan = 0;
		var distance;
		var scrollTopStart;
		var scrollTopDest;
		this.run = function (dest, callback) {
			if (running) {
				return;
			}
			if (!config.vars.smooth) {
				editor.scrollTop = dest;
				callback && callback();
				return;
			}
			scrollTopStart = editor.scrollTop;
			scrollTopDest = dest;

			if (scrollTopStart != scrollTopDest) {
				distance = scrollTopDest - scrollTopStart;
				running = true;
				lastRan = +Date.now();
				(function () {
					var now = +Date.now();
					var y = scrollTopStart + ((now - lastRan) / consumeMsecs) * distance;

					if (distance > 0 && y >= scrollTopDest
					||	distance < 0 && y <= scrollTopDest) {
						editor.scrollTop = scrollTopDest;
						callback && callback();
						cursor.ensureVisible();
						cursor.update({visible:true});
						$('wasavi_footer_modeline').style.display == '' && showPrefixInput(editor);
						running = false;
					}
					else {
						editor.scrollTop = parseInt(y);
						setTimeout(arguments.callee, timerPrecision);
					}
				})();
			}
		};
		this.__defineGetter__('running', function () {
			return running;
		});
		this.__defineGetter__('consumeMsecs', function () {
			return consumeMsecs;
		});
		this.__defineGetter__('timerPrecision', function () {
			return timerPrecision;
		});
		this.__defineSetter__('consumeMsecs', function (v) {
			consumeMsecs = v;
		});
		this.__defineSetter__('timerPrecision', function (v) {
			timerPrecision = v;
		});
	}

	/*@constructor*/function ExCommand (name, shortName, syntax, flags, handler) {
		this.name = name;
		this.shortName = shortName;
		this.handler = handler;
		this.syntax = syntax;
		this.rangeCount = flags & 0x00000003;
		this.flags = {
			addr2All:	  !!(flags & EXFLAGS.addr2All),
			addr2None:	  !!(flags & EXFLAGS.addr2None),
			addrZero:	  !!(flags & EXFLAGS.addrZero),
			addrZeroDef:  !!(flags & EXFLAGS.addrZeroDef),
			printDefault: !!(flags & EXFLAGS.printDefault),
			clearFlag:	  !!(flags & EXFLAGS.clearFlag)
		};
	}
	ExCommand.prototype = {
		buildArgs: function (t, range, line, syntax) {
			function argv_exp0 (s) {
				result.argv.push(s);
			}
			function argv_exp3 (s) {
				while ((s = s.replace(/^\s+/, '')) != '') {
					var re = /(?:\u0016.|\S)*/.exec(s);
					result.argv.push(re[0]);
					s = s.substring(re[0].length);
				}
			}

			var result = {};
			var needCheckRest = true;
			syntax || (syntax = this.syntax);
			result.range = range;
			result.flagoff = 0;
			result.flags = {};
			result.argv = [];

syntax_expansion_loop:
			for (var i = 0; i < syntax.length; i++) {
				var ch = syntax.charAt(i);

				if (ch == '!') {
					if (line.charAt(0) == '!') {
						line = line.substring(1);
						result.flags.force = true;
					}
					continue;
				}
				else if (ch == 'm') {
					var j = 1;
					while (line.charAt(0) == this.name && this.name.length == 1) {
						line = line.substring(1);
						j++;
					}
					argv_exp0(j);
					continue;
				}

				line = line.replace(/^\s+/, '');
				if (line == '') {
					break;
				}

				switch (ch) {
				case '1':
flag1_loop:
					for (var j = 0; j < line.length; j++) {
						switch (line.charAt(j)) {
						case '+':
							result.flagoff++;
							break;
						case '-':
						case '^':
							result.flagoff--;
							break;
						case '#':
							result.flags.hash = true;
							break;
						case 'l':
							result.flags.list = true;
							break;
						case 'p':
							result.flags.print = true;
							break;
						default:
							break flag1_loop;
						}
					}
					line = line.substring(j);
					break;

				case '2':
				case '3':
flag23_loop:
					for (var j = 0; j < line.length; j++) {
						switch (line.charAt(j)) {
						case '-':
							result.flags.dash = true;
							break;
						case '.':
							result.flags.dot = true;
							break;
						case '+':
							result.flags.plus = true;
							break;
						case '-':
							result.flags.carat = true;
							break;
						case '=':
							if (ch == '3') {
								result.flags.equal = true;
								break;
							}
							/* FALLTHRU */
						default:
							break flag23_loop;
						}
					}
					line = line.substring(j);
					break;

				case 'b':
					if (/[+\-^#]+\s*$/.test(line)
					&& syntax.indexOf('1') >= 0) {
						break;
					}
					if (/\d/.test(line.charAt(0))) {
						break;
					}
					result.register = line.charAt(0);
					result.flags.register = true;
					line = line.substring(1);
					break;

				case 'c': // c[01+a]
					ch = syntax.charAt(++i);

					var re = /^\d+/.exec(line);
					if (!re && ch == '+') {
						re = /^([\-+])\d+/.exec(line);
					}
					if (!re) {
						break;
					}
					line = line.substring(re[0].length);
					re = parseInt(re[0], 10);
					if (isNaN(re)) {
						return _('Bad address.');
					}
					if (re == 0 && ch != '0') {
						return _('Count may not be zero.');
					}
					if (ch == 'a') {
						result.range[0] = result.range[1];
						result.range[1] = Math.max(0, Math.min(result.range[0] + re - 1, t.rowLength - 1));
					}
					result.count = re;
					result.flags.count = true;
					break;

				case 'f':
					/*not implemented*/
					break;
				case 'l':
					var dest = exParseRange(t, line, 1, true);
					if (typeof dest == 'string') {
						return dest;
					}
					if (dest.rows.length == 0) {
						return _('Address not specified.');
					}
					if (typeof dest.rows == 'string') {
						return dest.rows;
					}
					if (dest.rows[0] >= t.rowLength) {
						return _('Wrong address specified.');
					}
					line = dest.rest;
					result.lineNumber = dest.rows[0];
					break;

				case 'S':
					/*not implemented*/
					if (line != '') {
						argv_exp1(line);
						needCheckRest = false;
						break syntax_expansion_loop;
					}
					/*FALLTHRU*/

				case 's':
					argv_exp0(line);
					needCheckRest = false;
					break syntax_expansion_loop;

				case 'W':
					var re = /(?:\u0016.|\S)*/.exec(line);
					argv_exp0(re[0]);
					line = line.substring(re[0].length);
					line = line.replace(/^[ \t]+/, '');
					if (line == '') {
						return _('Missing 2nd word.');
					}
					var re = /(?:\u0016.|\S)*/.exec(line);
					argv_exp0(re[0]);
					line = line.substring(re[0].length);
					needCheckRest = false;
					break syntax_expansion_loop;

				case 'w': // w(N|\d)[or]
					argv_exp3(line);
					ch = syntax.charAt(++i);
					if (/\d/.test(ch)) {
						var tmp = ch - 0;
						ch = syntax.charAt(++i);
						if ((ch != 'o' || result.argv.length != 0) && result.argv.length != tmp) {
							return _('Arguments count mismatch.');
						}
					}
					needCheckRest = false;
					break syntax_expansion_loop;

				default:
					return _('Internal syntax table error.');
				}
			}

			if (needCheckRest) {
				line = line.replace(/^\s+/, '');
				if (line != '' || /[lr]/.test(syntax.substring(i))) {
					return _('Invalid argument');
				}
			}

			return result;
		},
		run: function (t, range, s, sups) {
			var args = this.buildArgs(t, range, s);
			if (typeof args == 'string') {
				return {error:this.name + ': ' + args};
			}
			if (sups instanceof Array) {
				sups.push.apply(sups, args.argv);
				args.argv = sups;
			}
			var result;
			try {
				result = this.handler.call(this, t, args);
			}
			catch (e) {
				result = e.toString();
			}
			if (typeof result == 'string') {
				return {error:this.name + ': ' + result};
			}
			return {flags:args.flags, offset:args.flagoff};
		}
	};

	/*@constructor*/function MapManager () {

		/*@constructor*/function MapItem (name, rules, sequences) {
			this.register = function () {
				for (var i = 0; i < arguments.length; i += 2) {
					var lhs = arguments[i + 0];
					var rhs = arguments[i + 1];
					rules[lhs] = rhs;
					sequences[lhs] = createSequences(lhs);
				}
				function createSequences (lhs) {
					var result = [];
					for (var i = 0; i < lhs.length; i++) {
						if (lhs.charAt(i) == '<') {
							var re = /<[^>]+>/.exec(lhs.substring(i));
							if (re) {
								var key = re[0].toLowerCase()
								if (key in SPECIAL_KEYS_REVERSED) {
									result.push(-SPECIAL_KEYS_REVERSED[key]);
									i += re[0].length - 1;
									continue;
								}
							}
						}
						else if (lhs.charAt(i) == '#') {
							var re = /#(\d{1,2})/.exec(lhs.substring(i));
							if (re) {
								var key = '<f' + re[1] + '>';
								if (key in SPECIAL_KEYS_REVERSED) {
									result.push(-SPECIAL_KEYS_REVERSED[key]);
									i += re[0].length - 1;
									continue;
								}
							}
						}
						result.push(lhs.charAt(i));
					}
					return result;
				}
			};
			this.remove = function () {
				for (var i = 0; i < arguments.length; i++) {
					var lhs = arguments[i];
					delete rules[lhs];
				}
			};
			this.isMapped = function (key) {
				return key in rules;
			};
			this.toArray = function () {
				var result = [];
				for (var i in rules) {
					result.push([i, rules[i]]);
				}
				return result;
			};
			this.__defineGetter__('name', function () { return name; });
		}

		/*@const*/var NEST_MAX = 100;
		/*@const*/var MAP_INDICES = {
			 'command':0,
			 'edit':1,
			 'edit-overwrite':1
		 };

		var rules = [{}, {}];
		var sequences = [{}, {}];
		var maps = [
			new MapItem('command', rules[0], sequences[0]),
			new MapItem('edit', rules[1], sequences[1])
		];
		var depth = 0;
		var stack = [];
		var timer;
		var currentMap = null;
		var index = 0;

		maps[0].register(
			'<f1>', '\u001biF1 key pressed.',
			'#2', '\u001biF2 key pressed.',
			'Q', ':q!'
		);
		maps[1].register(
			'Q', 'hello, world'
		);

		function reset () {
			timer = currentMap = null;
			depth = index = 0;
		}
		function getMap (arg) {
			if (arg === 'command') {
				return maps[0];
			}
			else if (arg === 'edit') {
				return maps[1];
			}
		}
		function process (keyCode, handler) {
			function firstPropName (obj) {
				if (obj instanceof Object) {
					for (var i in obj) {
						return i;
					}
				}
			}
			function expandDelayed (lhs, rhs) {
				timer = setTimeout(function () {
					expand(rhs);
					reset();
				}, 1000);
			}
			function expand (rhs) {
				if (depth < NEST_MAX) {
					depth++;
					stack.push([currentMap, index]);
					currentMap = null;
					index = 0;
					try {
						for (var i = 0; i < rhs.length; i++) {
							process(rhs.charCodeAt(i), handler);
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

			timer && clearTimeout(timer);
			timer = null;

			var mapIndex;
			if (inputMode in MAP_INDICES) {
				mapIndex = MAP_INDICES[inputMode];
			}
			else {
				handler && handler(keyCode);
				return;
			}

			var srcmap = currentMap || rules[mapIndex];
			var dstmap = {};
			var found = 0;
			var propCompleted;
			var propOvered;

			for (var i in srcmap) {
				var seq = sequences[mapIndex][i];
				if (seq[index] == keyCode) {
					dstmap[i] = srcmap[i];
					found++;
					if (index == seq.length - 1 && propCompleted == undefined) {
						propCompleted = i;
					}
				}
				if (index == seq.length && propOvered == undefined) {
					propOvered = i;
				}
			}

			var firstprop = firstPropName(dstmap);

			if (found) {
				currentMap = dstmap;
				index++;

				if (found == 1 && index == sequences[mapIndex][firstprop].length) {
					expand(dstmap[firstprop]);
					reset();
				}
				else if (propCompleted != undefined && found > 1) {
					expandDelayed(propCompleted, dstmap[propCompleted]);
				}
			}
			else {
				if (propOvered != undefined) {
					expand(srcmap[propOvered]);
				}
				handler && handler(keyCode);
				reset();
			}
		}

		this.__defineGetter__('commandMap', function () { return maps[0]; });
		this.__defineGetter__('editMap', function () { return maps[1]; });
		this.reset = reset;
		this.getMap = getMap;
		this.process = process;
	}

	/*@constructor*/function Backlog (container, con, scaler) {
		var buffer = [];
		this.push = function (arg) {
			arg instanceof Array ?
				buffer.push.apply(buffer, arg) :
				buffer.push(arg);
		};
		this.show = function () {
			container.style.visibility = 'visible';
		};
		this.hide = function () {
			container.style.visibility = 'hidden';
		};
		this.clear = function () {
			buffer.length = 0;
		};
		this.write = function (byLine, preserveMessage) {
			if (!this.visible) {
				this.show();
				con.value = multiply('\n', this.rows);
			}

			var totalHeight = 0;
			while (buffer.length) {
				if (con.value.length && con.value.substr(-1) != '\n') {
					con.value += '\n';
				}
				var line = buffer.shift();
				scaler.textContent = line;
				if (totalHeight + scaler.offsetHeight > con.clientHeight || byLine) {
					if (totalHeight == 0) {
						con.value += line;
						con.setSelectionRange(con.value.length, con.value.length);
						con.scrollTop = con.scrollHeight - con.clientHeight;
					}
					else {
						buffer.unshift(line);
					}
					break;
				}
				else {
					con.value += line;
					con.setSelectionRange(con.value.length, con.value.length);
					con.scrollTop = con.scrollHeight - con.clientHeight;
					totalHeight += scaler.offsetHeight;
				}
			}

			if (state != 'console-wait') {
				pushInputMode('console-wait', 'backlog');
			}
			if (!preserveMessage) {
				if (buffer.length) {
					showMessage(_('More...'), false, true);
				}
				else {
					showMessage(
						_('Press any key to continue, or enter more ex command:'),
						false, true);
				}
			}
		};
		this.__defineGetter__('queued', function () {
			return buffer.length > 0;
		});
		this.__defineGetter__('rows', function () {
			scaler.textContent = '0';
			return Math.floor(con.offsetHeight / scaler.offsetHeight);
		});
		this.__defineGetter__('cols', function () {
			scaler.innerHTML = '';
			var span = scaler.appendChild(document.createElement('span'));
			span.textContent = '0';
			return Math.floor(con.offsetWidth / span.offsetWidth);
		});
		this.__defineGetter__('visible', function () {
			return document.defaultView.getComputedStyle(container, '').visibility != 'hidden';
		});
	}

	/*@constructor*/function Bell () {
		var a = new Audio();
		var src = '';
		var enabled = false;
		if (a.canPlayType('audio/ogg')) {
			src = 'beep.ogg';
			enabled = true;
		}
		else if (a.canPlayType('audio/mpeg')) {
			src = 'beep.mp3';
			enabled = true;
		}
		if (enabled) {
			if (window.chrome && window.chrome.extension) {
				src = chrome.extension.getURL(src);
			}
			a.src = src;
			this.play = function () {
				var vol = Math.max(0, Math.min(config.vars.bellvolume, 100));
				if (enabled && vol > 0) {
					!a.ended && a.pause();
					a.loop = false;
					a.volume = vol / 100;
					a.currentTime = 0;
					a.play();
				}
			};
		}
		else {
			this.play = function () {};
		}
	}

	/*@constructor*/function SubstituteWorker () {
		this.patternString = '';
		this.pattern = null;
		this.replFn = null;
		this.isGlobal = false;
		this.isConfirm = false;
		this.text = '';
		this.textPreLength = 0;
		this.textRowCount = 0;
		this.foundCount = 0;
		this.substCount = 0;
		this.re;
		this.currentPos;
		this.prevPos;
		this.prevOffset;
	}
	SubstituteWorker.prototype = {
		run: function (t, range, pattern, repl, options) {
			pattern || (pattern = '');
			repl || (repl = '');
			options || (options = '');
			var count, re, replFn;

			// pattern and replacemnt
			if (pattern == '' && repl == '') {
				repl = '~';
			}
			if (pattern == '') {
				if ((pattern = lastSubstituteInfo.pattern || '') == '') {
					return _('No previous substitution.');
				}
			}
			if (repl == '%' || repl == '~') {
				if ((repl = lastSubstituteInfo.replacement) == undefined) {
					return _('No previous substitution.');
				}
			}

			// options and count
			while ((options = options.replace(/^\s+/, '')).length) {
				switch (options.charAt(0)) {
				case 'g':
					this.isGlobal = true;
					options = options.substring(1);
					break;
				case 'c':
					this.isConfirm = true;
					options = options.substring(1);
					break;
				default:
					if ((re = /^\d+/.exec(options))) {
						count = parseInt(re[0], 10);
						options = options.substring(re[0].length);
					}
				}
			}
			if (count != undefined) {
				a.range[0] = a.range[1];
				a.range[1] = Math.max(0, Math.min(a.range[0] + count - 1, t.rowLength - 1));
			}

			lastRegexFindCommand.push({direction:1});
			lastRegexFindCommand.setPattern(pattern);
			lastSubstituteInfo.pattern = pattern;
			lastSubstituteInfo.replacement = repl;
			this.patternString = pattern;
			this.pattern = getFindRegex(pattern);
			this.pattern.lastIndex = 0;
			registers.set('/', lastRegexFindCommand.pattern);
			this.replFn = this.getReplacements(repl);
			if (!this.replFn) {
				return _('Internal Error: invalid replace function');
			}

			var rg = document.createRange();
			rg.setStartBefore(t.rowNodes(0));
			rg.setEndBefore(t.rowNodes(range[0]));
			this.textPreLength = rg.toString().length;
			this.textRowCount = range[1] - range[0] + 1;

			rg.setStartBefore(t.rowNodes(range[0]));
			rg.setEndAfter(t.rowNodes(range[1]));
			this.text = rg.toString();
			if (range[1] == t.rowLength - 1 && this.text.substr(-1) == '\n') {
				this.text = this.text.substring(0, this.text.length - 1);
			}
			rg.detach();

			this.substCount = 0;
			this.foundCount = 0;
			this.isConfirm ? this.kontinue(t) : this.burst(t);
		},
		burst: function (t) {
			var prevOffset, prevRow, re;
			var nullNewline = {length:0};

			if ((re = this.pattern.exec(this.text))) {
				var row, col;
				var pos = t.linearPositionToBinaryPosition(re.index + this.textPreLength);
				row = pos.row;
				col = pos.col;
				this.doSubstitute(t, re, row, col);
				prevOffset = re.index;
				prevRow = row;
				this.foundCount++;

				while ((re = this.pattern.exec(this.text))) {
					var delta = (this.text.substring(prevOffset, re.index).match(/\n/g) || nullNewline).length;
					row = prevRow + delta;
					if (this.isGlobal || row != prevRow) {
						col = re.index - (Math.max(-1, this.text.lastIndexOf('\n', re.index - 1)) + 1);
						this.doSubstitute(t, re, row, col);
					}
					prevOffset = re.index;
					prevRow = row;
					this.foundCount++;
				}
			}

			t.setSelectionRange(t.getLineTopOffset2(t.selectionStart));
			if (this.foundCount) {
				this.showResult();
			}
			else {
				this.showNotFound();
			}
		},
		kontinue: function (t, action) {
			var nullNewline = {length:0};

			if (action == undefined) {
				if ((this.re = this.pattern.exec(this.text))) {
					var pos = t.linearPositionToBinaryPosition(this.re.index + this.textPreLength);
					this.currentPos = pos;
					this.prevPos = new Position(-1, -1);
					this.foundCount++;
					t.setSelectionRange(pos);
					cursor.ensureVisible();
					t.emphasis(pos, this.re[0].length);
					requestInputMode('console-wait', 'ex-s');
					requestShowMessage(_('Substitute? ([y]es, [n]o, [q]uit)'), false, true);
				}
				else {
					this.showNotFound();
				}
			}
			else {
				if (this.re) {
					t.unEmphasis();

					switch (action.toLowerCase()) {
					case 'y':
						if (this.isGlobal || this.currentPos.row != this.prevPos.row) {
							this.doSubstitute(t, this.re, this.currentPos.row, this.currentPos.col);
						}
						/*FALLTHRU*/
					case 'n':
						this.prevOffset = this.re.index;
						this.prevPos = this.currentPos;
						this.re = this.pattern.exec(this.text);
						break;
					case 'q':
					case '\u001b':
						this.re = null;
						break;
					default:
						bell.play();
						break;
					}
				}
				if (this.re) {
					var delta = (this.text.substring(this.prevOffset, this.re.index).match(/\n/g) || nullNewline).length;
					var pos = new Position(
						this.prevPos.row + delta,
						this.re.index -
							(Math.max(-1, this.text.lastIndexOf('\n', this.re.index - 1)) + 1));
					this.currentPos = pos;
					this.foundCount++;
					t.setSelectionRange(pos);
					cursor.ensureVisible();
					t.emphasis(pos, this.re[0].length);
					return true;
				}
				else {
					this.re = this.pattern = this.replFn =
					this.text = this.currentPos = this.prevOffset = this.prevPos.row = null;
					popInputMode();
					cursor.ensureVisible();
					t.setSelectionRange(t.getLineTopOffset2(t.selectionStart));
					this.showResult(true);
					return false;
				}
			}
		},
		doSubstitute: function (t, re, row, col) {
			var replaced = this.replFn(re);
			t.selectionStart = new Position(row, col);
			t.selectionEnd = t.offsetBy(t.selectionStart, re[0].length);
			insert(t, replaced);
			this.text =
				this.text.substring(0, re.index) +
				replaced +
				this.text.substring(re.index + re[0].length);
			this.pattern.lastIndex += Math.max(replaced.length - re[0].length, 1);
			this.substCount++;
		},
		showResult: function (immediate) {
			if (this.substCount) {
				var line = _('{0} {substitution:0} on {1} {line:1}.', this.substCount, this.textRowCount);
				immediate ? showMessage(line) : requestShowMessage(line);
				isEditCompleted = true;
			}
		},
		showNotFound: function () {
			requestShowMessage(_('Pattern not found: {0}', this.patternString));
		},
		nullString: function () {
			return '';
		},
		getReplacements: function (repl) {
			/*
			 * Meta characters in replacement string are:
			 *
			 * &		matched text
			 * \0 - \9	back reference in the matched text
			 * \u, \l	capitalize the next letter
			 *
			 *				\uabc -> Abc
			 *				\u\0 -> Def
			 *					(if \0 equals 'def')
			 *
			 * \U, \L	capitalize whole letter till \e, \E or end of replacement string
			 *
			 *				\Uabc\E -> ABC
			 *				\U\0 -> DEF
			 *					(if \0 equals 'def')
			 *
			 * \e, \E	end of \u, \l, \U, \L
			 */
			if (repl == '') {
				return this.nullString;
			}
			var result, codes = [];
			var specialEscapes = {'n':'\\n', 't':'\\t'};
			var specialLetters = {'"':'\\"', '\\':'\\\\'};
			loop(0, 0, 0);
			try {
				var code =
					'var _ = Array.prototype.slice.call(arguments);' +
					'return ' + codes.join(' ') + ';';
				result = new Function(code);
			}
			catch (e) {
				result = null;
			}
			return result;

			function loop (callDepth, interruptMode, start) {
				var newOperand = true;
				var operator = '';
				for (var i = start; i < repl.length; i++) {
					var ch = repl.charAt(i);
					switch (ch) {
					case '&':
						codes.push(operator);
						codes.push('_[0]');
						operator = '+';
						break;
					case '\\':
						var fallthru = false;
						if (++i >= repl.length) {
							return i;
						}
						ch = repl.charAt(i);
						if (/^[0-9]$/.test(ch)) {
							codes.push(operator);
							codes.push('_[' + ch + ']');
							operator = '+';
						}
						else {
							switch (ch) {
							case 'u':
								codes.push(operator);
								codes.push('String.prototype.toUpperCase.call(');
								i = loop(callDepth + 1, 1, i + 1);
								codes.push(')');
								operator = '+';
								break;
							case 'l':
								codes.push(operator);
								codes.push('String.prototype.toLowerCase.call(');
								i = loop(callDepth + 1, 1, i + 1);
								codes.push(')');
								operator = '+';
								break;
							case 'U':
								codes.push(operator);
								codes.push('String.prototype.toUpperCase.call(');
								i = loop(callDepth + 1, 2, i + 1);
								codes.push(')');
								operator = '+';
								break;
							case 'L':
								codes.push(operator);
								codes.push('String.prototype.toUpperCase.call(');
								i = loop(callDepth + 1, 2, i + 1);
								codes.push(')');
								operator = '+';
								break;
							case 'e': case 'E':
								if (callDepth && interruptMode == 2) {
									return i;
								}
								break;
							default:
								if (specialEscapes[ch]) {
									ch = specialEscapes[ch];
								}
								fallthru = true;
							}
						}
						if (!fallthru) {
							newOperand = true;
							break;
						}
					default:
						var code = ch.charCodeAt(0);
						if (specialLetters[ch]) {
							ch = specialLetters[ch];
						}
						else if (code >= 0x00 && code <= 0x1f || code == 0x7f) {
							ch = toVisibleControl(code);
						}
						if (newOperand || codes.length == 0) {
							codes.push(operator);
							codes.push('"' + ch + '"');
							newOperand = false;
							operator = '+';
						}
						else {
							var last = codes[codes.length - 1];
							last = last.substring(0, last.length - 1) + ch + last.substr(-1);
							codes[codes.length - 1] = last;
						}
						if (callDepth && interruptMode == 1) {
							return i;
						}
					}
				}
				return i;
			}
		}
	};

	/*@constructor*/function LineInputHistories (maxSize, names) {
		var s = {};
		var name;
		var storageKey = 'wasavi_lineinput_histories';

		function serialize () {
			return JSON.stringify(serializeGeneral({s:s}));
		}
		function restore (src) {
			src = unserializeGeneral(src);
			if (!src || !(src instanceof Object)) return;

			var tmp = {};
			for (var name in s) {
				if (!(name in src)) continue;
				if (!(src[name] instanceof Object)) continue;
				if (!(src[name].lines instanceof Array)) continue;

				tmp[name] = {};
				tmp[name].lines = src[name].lines.filter(function (s) {
					return typeof s == 'string';
				}).slice(-maxSize);
				tmp[name].current = tmp[name].length - 1;
			}
			s = extend(s, tmp);
		}
		function save () {
			setLocalStorage(storageKey, serialize());
		}
		function load () {
			getLocalStorage(storageKey, function (value) {
				restore(value || '');
			});
		}
		function init () {
			names.forEach(function (name) {
				s[name] = {lines:[], current:-1};
			});
			load();
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
		}
		function next () {
			if (s[name].current < s[name].lines.length) {
				++s[name].current;
				if (s[name].current < s[name].lines.length) {
					return s[name].lines[s[name].current];
				}
			}
		}

		this.__defineGetter__('isInitial', function () {
			return s[name].current == s[name].lines.length;
		});
		this.__defineSetter__('isInitial', function (v) {
			s[name].current = s[name].lines.length;
		});
		this.__defineGetter__('defaultName', function () {
			return name;
		});
		this.__defineSetter__('defaultName', function (v) {
			if (v in s) {
				name = v;
				s[name].current = s[name].lines.length;
			}
			else {
				throw new Error('LineInputHistories: unregistered name: ' + name);
			}
		});
		this.__defineGetter__('storageKey', function () { 
			return storageKey; 
		});

		this.push = push;
		this.prev = prev;
		this.next = next;
		this.save = save;
		this.load = load;

		init();
	}

	/*@constructor*/function EditLogger (editor, max) {
		this.init(editor, max);
	}
	EditLogger.ITEM_TYPE = {
		INSERT: 0,
		OVERWRITE: 1,
		DELETE: 2,
		SHIFT: 3,
		UNSHIFT: 4
	};
	EditLogger.prototype = new function () {
		/*@constructor*/function EditLogItemBase () {
			this.position;
			this.data;
			this.inputMethod = 'insertChars';
		}
		EditLogItemBase.prototype = {
			type: 'Base',
			_init: function (p, d) {
				this.position = p.clone();
				this.data = d.replace(/\u000d/g, '\n');
			},
			_dump: function (depth) {
				return multiply(' ', depth) +
					'+ ' + this.type + '\n' +
					multiply(' ', depth) + '  ' +
					'position:' + this.position.toString() +
					', data:"' + toVisibleString(this.data) + '"';
			},
			_ensureValidPosition: function (t, p) {
				return p.row >= 0 && p.row < t.rowLength
					&& p.col >= 0 && p.col <= t.rows(p).length;
			},
			init: function () {
				this._init.apply(this, arguments);
			},
			dump: function (depth) {
				return this._dump(depth);
			},
			toString: function () {
				return '[object EditLogItem' + this.type + ']';
			}
		};
		/*
		 * insert: point, data
		 *
		 *     edit, and redo operation:
		 *     abcdefghijklmn -> abcABCdefghijklmn
		 *        ^                    ^
		 *        ABC
		 *
		 *     undo operation:
		 *     abcABCdefghijklmn -> abcdefghijklmn
		 *        ^                    ^
		 */
		/*@constructor*/function EditLogItemInsert () {}
		EditLogItemInsert.prototype = extend(new EditLogItemBase, {
			type: 'Insert',
			init: function (p, d) {
				this._init.apply(this, arguments);
			},
			undo: function (t) {
				if (!this._ensureValidPosition(t, this.position)) {
					console.log(this.toString() + ': bad position!');
					return 0;
				}
				var ss = this.position;
				var se = this.position2 || t.offsetBy(ss, this.data.length);
				if (t.getSelection(ss, se) != this.data) {
					console.log(this.toString() + ': bad consistency!');
					return 0;
				}
				marks.update2(t.selectionStart, function () {
					t.deleteRange(ss, se);
				});
				t.setSelectionRange(ss);
				return 1;
			},
			redo: function (t) {
				if (!this._ensureValidPosition(t, this.position)) {
					console.log(this.toString() + ': bad position!');
					return 0;
				}
				var data = this.data;
				var inputMethod = this.inputMethod;
				t.setSelectionRange(this.position);
				marks.update2(this.position, function () {
					var re = data.match(/\n|[^\n]+/g);
					if (!re) return;
					for (var i = 0; i < re.length; i++) {
						re[i] == '\n' ?
							isMultilineTextInput(targetElement) && t.divideLine() :
							t.setSelectionRange(t[inputMethod](t.selectionStart, re[i]));
					}
				});
				t.setSelectionRange(this.position);
				return 1;
			}
		});
		/*@constructor*/function EditLogItemOverwrite () {}
		EditLogItemOverwrite.prototype = extend(new EditLogItemBase, {
			type: 'Overwrite',
			init: function (p, d, d2) {
				this._init.apply(this, arguments);
				this.data2 = d2;
				this.inputMethod = 'overwriteChars';
			},
			undo: function (t) {
				return EditLogItemInsert.prototype.undo.apply(this, arguments);
			},
			redo: function (t) {
				return EditLogItemInsert.prototype.redo.apply(this, arguments);
			},
			dump: function (depth) {
				return this._dump(depth) +
					', data2:"' + toVisibleString(this.data2) + '"';
			}
		});
		/*
		 * delete: point, data
		 *
		 *     edit, and redo operation:
		 *     abcdefghijklmn -> abcghijklmn
		 *        ^                 ^
		 *        def
		 *
		 *     undo operation:
		 *     abcghijklmn -> abcdefghijklmn
		 *        ^              ^
		 *        def
		 */
		/*@constructor*/function EditLogItemDelete () {}
		EditLogItemDelete.prototype = extend(new EditLogItemBase, {
			type: 'Delete',
			init: function (p, d, p2, lo) {
				this._init.apply(this, arguments);
				this.position2 = p2.clone();
				this.isLineOrient = !!lo;
			},
			undo: function (t) {
				return EditLogItemInsert.prototype.redo.apply(this, arguments);
			},
			redo: function (t) {
				t.isLineOrientSelection = this.isLineOrient;
				return EditLogItemInsert.prototype.undo.apply(this, arguments);
			},
			dump: function (depth) {
				return this._dump(depth) +
					', position2:' + this.position2.toString() +
					', isLineOrient:' + this.isLineOrient;
			}
		});
		/*
		 * shift: point, count
		 */
		/*@constructor*/function EditLogItemShift () {}
		EditLogItemShift.prototype = extend(new EditLogItemBase, {
			type: 'Shift',
			init: function (p, d, rc, sc) {
				this._init.apply(this, arguments);
				this.rowCount = rc;
				this.shiftCount = sc;
			},
			undo: function (t) {
				if (!this._ensureValidPosition(t, this.position)) {
					console.log(this.toString() + ': bad position!');
					return 0;
				}
				var p = this.position;
				var count = Math.min(p.row + this.rowCount, t.rowLength) - p.row;
				var shiftCount = this.shiftCount;
				marks.update2(this.position, function () {
					var s = multiply('\t', shiftCount);
					var p1 = new Position(p.row, 0);
					var p2 = new Position(p.row, s.length);
					for (var i = 0; i < count; i++) {
						if (t.rows(p1).indexOf(s) == 0) {
							t.deleteRange(p1, p2);
						}
						p1.row++;
						p2.row++;
					}
				});
				t.setSelectionRange(t.getLineTopOffset2(p));
				return 1;
			},
			redo: function (t) {
				if (!this._ensureValidPosition(t, this.position)) {
					console.log(this.toString() + ': bad position!');
					return 0;
				}
				var p = this.position;
				var count = Math.min(p.row + this.rowCount, t.rowLength) - p.row;
				var shiftCount = this.shiftCount;
				marks.update2(this.position, function () {
					var s = multiply('\t', shiftCount);
					var p1 = new Position(p.row, 0);
					for (var i = 0; i < count; i++) {
						t.insertChars(p1, s);
						p1.row++;
						p1.col = 0;
					}
				});
				t.setSelectionRange(t.getLineTopOffset2(p));
				return 1;
			},
			dump: function (depth) {
				return this._dump(depth) +
					', count:' + this.count;
			}
		});
		/*
		 * unshift: point, count
		 */
		/*@constructor*/function EditLogItemUnshift () {}
		EditLogItemUnshift.prototype = extend(new EditLogItemBase, {
			type: 'Unshift',
			init: function () {
				EditLogItemShift.prototype.init.apply(this, arguments);
			},
			undo: function () {
				return EditLogItemShift.prototype.redo.apply(this, arguments);
			},
			redo: function () {
				return EditLogItemShift.prototype.undo.apply(this, arguments);
			},
			dump: function () {
				return EditLogItemShift.prototype.dump.apply(this, arguments);
			}
		});
		/*
		 * edit log item cluster
		 */
		/*@constructor*/function EditLogItemCluster () {
			this.items = [];
			this.nestLevel = 0;
		}
		EditLogItemCluster.prototype = {
			push: function (item) {
				this.items.push(item);
			},
			undo: function (t) {
				var result = 0;
				for (var i = this.items.length - 1; i >= 0; i--) {
					result += this.items[i].undo(t) || 0;
				}
				return result;
			},
			redo: function (t) {
				var result = 0;
				for (var i = 0; i < this.items.length; i++) {
					result += this.items[i].redo(t) || 0;
				}
				return result;
			},
			trim: function (max) {
				while (this.items.length > max) {
					this.items.shift();
				}
			},

			toString: function () {
				return '[object EditLogItemCluster]';
			},
			dump: function (depth) {
				depth || (depth = 0);
				var result = [multiply(' ', depth) + this.toString()];
				this.items.forEach(function (o) {
					result.push(o.dump(depth + 1));
				});
				return result.join('\n');
			},
			get length () {
				return this.items.length;
			},
			set length (v) {
				this.items.length = v;
			},
			get representer () {
				if (this.items.length > 1) {
					return this;
				}
				else if (this.items.length == 1) {
					return this.items[0];
				}
			}
		};

		var pool = [
			EditLogItemInsert,
			EditLogItemOverwrite,
			EditLogItemDelete,
			EditLogItemShift,
			EditLogItemUnshift
		];

		return {
			init: function (editor, max) {
				this.editor = editor;
				this.max = max;
				this.logs = new EditLogItemCluster;
				this.cluster = null;
				this.currentPosition = this.logs.length - 1;
			},
			open: function (func) {
				if (this.cluster) {
					this.cluster.nestLevel++;
				}
				else {
					this.cluster = new EditLogItemCluster();
				}
				this.logs.items.length = this.currentPosition + 1;
				if (func) {
					try {
						func();
					}
					finally {
						this.close();
					}
				}
			},
			write: function (type) {
				if (this.cluster && pool[type]) {
					var args = Array.prototype.slice.call(arguments, 1);
					var item = new pool[type];
					item.init.apply(item, args);
					this.cluster.push(item);
				}
				else {
					throw new Error('invalid undo item type');
				}
			},
			close: function () {
				if (this.cluster) {
					if (--this.cluster.nestLevel < 0) {
						var representer = this.cluster.representer;
						if (representer) {
							this.logs.push(representer);
							this.logs.trim(this.max);
							this.currentPosition = this.logs.length - 1;
						}
						this.cluster = null;
						//logt3(this.logs.dump());
					}
				}
				else {
					throw new Exeception('edit logger doesn\'t open');
				}
			},
			undo: function () {
				if (!this.cluster && this.currentPosition >= 0) {
					return this.logs.items[this.currentPosition--].undo(this.editor);
				}
				else {
					return false;
				}
			},
			redo: function () {
				if (!this.cluster && this.currentPosition < this.logs.length - 1) {
					return this.logs.items[++this.currentPosition].redo(this.editor);
				}
				else {
					return false;
				}
			},
			get logMax () {
				return this.max;
			},
			set logMax (v) {
				if (typeof v != 'number' || v < 0) {
					throw new Exeception('invalid logMax');
				}
				this.max = v;
				this.logs.trim(this.max);
				this.currentPosition = this.logs.length - 1;
			},
			get clusterNestLevel () {
				return this.cluster ? this.cluster.nestLevel : -1;
			}
		};
	};

	/*@constructor*/function TextBlockRegex () {
		var paragraphs;
		var sections;
		var sentenceForwardRegex =  /[.!?][)\]"']*(?:[ \t]+|\n)|[^\n]\n(?=\n+)|\n\s*(?=\S)|$/g;
		var sentenceBackwardRegex = /[.!?][)\]"']*(?:[ \t]+|\n)|[^\n]\n(?=\n+)|\n\s*(?=\S)|^/g;
		var paragraphForwardRegex;
		var paragraphBackwardRegex;
		var sectionForwardRegex;
		var sectionBackwardRegex;

		function getRegexFragment (m) {
			var result = [];
			m.replace(/..?/g, function ($0) {
				result.push($0.replace(/^\s+|\s+$/g, ''));
				return $0;
			})
			return result.join('|');
		}

		function getSentenceForward () {
			return sentenceForwardRegex;
		}
		function getSentenceBackward () {
			return sentenceBackwardRegex;
		}
		function getParagraphForward () {
			if (!paragraphForwardRegex) {
				// /[^\n]\n(?=\n+)|\n(?=\.(?:IP|LP|PP|QP|P|LI|pp|lp|ip|bp)\b)|$/g;
				var section = getSectionForward();
				var s = getRegexFragment(paragraphs);
				var r = '[^\\n]\\n(?=\\n+)|\\n(?=\\.(?:' + s + ')\\b)|' + section.source;
				paragraphForwardRegex = new RegExp(r, 'g');
			}
			return paragraphForwardRegex;
		}
		function getParagraphBackward () {
			if (!paragraphBackwardRegex) {
				// /[^\n](?:\n+)(?=\n)|\n(?=\.(?:IP|LP|PP|QP|P|LI|pp|lp|ip|bp)\b)|^/g;
				var section = getSectionBackward();
				var s = getRegexFragment(paragraphs);
				var r = '[^\\n](?:\\n+)(?=\\n)|\\n(?=\\.(?:' + s + ')\\b)|' + section.source;
				paragraphBackwardRegex = new RegExp(r, 'g');
			}
			return paragraphBackwardRegex;
		}
		function getSectionForward () {
			if (!sectionForwardRegex) {
				// /\n(?=\f|\{)|\n(?=\.(?:NH|SH|H|HU|nh|sh)\b)|$/g
				var s = getRegexFragment(sections);
				var r = '\\n(?=\\f|\\{)|\\n(?=\\.(?:' + s + ')\\b)|$';
				sectionForwardRegex = new RegExp(r, 'g');
			}
			return sectionForwardRegex;
		}
		function getSectionBackward () {
			if (!sectionBackwardRegex) {
				// /\n(?=\f|\{)|\n(?=\.(?:NH|SH|H|HU|nh|sh)\b)|^/g
				var s = getRegexFragment(sections);
				var r = '\\n(?=\\f|\\{)|\\n(?=\\.(?:' + s + ')\\b)|^';
				sectionBackwardRegex = new RegExp(r, 'g');
			}
			return sectionBackwardRegex;
		}

		function setParagraphMacros (m) {
			if (!/^[a-zA-Z ]+$/.test(m)) {
				throw new Error(_('invalid paragraph format: ' + m));
			}
			paragraphs = m;
			paragraphRegex = sectionRegex = null;
		}
		function setSectionMacros (m) {
			if (!/^[a-zA-Z ]+$/.test(m)) {
				throw new Error(_('invalid section format: ' + m));
			}
			sections = m;
			sectionRegex = null;
		}

		this.__defineGetter__('sentenceForward', getSentenceForward);
		this.__defineGetter__('sentenceBackward', getSentenceBackward);
		this.__defineGetter__('paragraphForward', getParagraphForward);
		this.__defineGetter__('paragraphBackward', getParagraphBackward);
		this.__defineGetter__('sectionForward', getSectionForward);
		this.__defineGetter__('sectionBackward', getSectionBackward);

		this.setParagraphMacros = setParagraphMacros;
		this.setSectionMacros = setSectionMacros;
	}

	/*@constructor*/function PairBracketsIndicator (c, t, n) {
		var timer;
		var count;
		var visible;

		function init () {
			t.emphasis(n, 1);
			count = Math.max(1, Math.min(config.vars.matchtime, 10));
			visible = true;
			setColor();
			timer = setTimeout(handleTimeout, 1000 * 0.1);
		}
		function handleTimeout () {
			count--;
			if (count <= 0) {
				timer = null;
				t.unEmphasis();
			}
			else {
				visible = !visible;
				setColor();
				timer = setTimeout(arguments.callee, 1000 * 0.1);
			}
		}
		function setColor () {
			var nodes = document.querySelectorAll('span.wasavi_em');
			for (var i = 0; i < nodes.length; i++) {
				if (visible) {
					nodes[i].style.color = 'white';
					nodes[i].style.backgroundColor = 'black';
				}
				else {
					nodes[i].style.color = 'black';
					nodes[i].style.backgroundColor = 'transparent';
				}
			}
		}
		function clear () {
			if (timer) {
				clearTimeout(timer);
				count = 0;
				handleTimeout();
			}
		}
		this.clear = clear;
		init();
	}
	PairBracketsIndicator.getObject = function (c, t) {
		if (BRACKETS.substring(BRACKETS.length / 2).indexOf(c) >= 0) {
			var result = motionFindMatchedBracket('', t, 1, c);
			if (result) {
				return new PairBracketsIndicator(c, t, result);
			}
			else {
				requestBell();
			}
		}
	};

	/*
	 * utility functions
	 * ----------------
	 */

	function $ (arg) {
		return typeof arg == 'string' ? document.getElementById(arg) : arg;
	}
	function $call (func) {
		typeof func == 'function' && func();
	}
	function _ () {
		var args = Array.prototype.slice.call(arguments);
		var format = args.shift();
		format = format.replace(/\{(?:([a-z]+):)?(\d+)\}/ig, function ($0, $1, $2) {
			if ($1 == undefined || $1 == '') {
				return args[$2];
			}
			if (args[$2] == 1) {
				return $1;
			}
			// simple plural fix for english
			if (/[hos]$/.test($1)) {
				return $1 + 'es';
			}
			if (/[^aeiou]y$/i.test($1)) {
				return $1.substr(0, $1.length - 1) + 'ies';
			}
			return $1 + 's';
		});
		return format;
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
	function isSinglelineTextInput (target) {
		return target.nodeName.toLowerCase() == 'input'
			&& target.type in ACCEPTABLE_TYPES
			&& enableList[ACCEPTABLE_TYPES[target.type]];
	}
	function reverseObject (o) {
		var result = {};
		for (var i in o) { result[o[i]] = i; }
		return result;
	}
	function style (src, styles) {
		for (var i in styles) {
			src.style[i] = styles[i];
		}
	}
	function chr (c, useSpecial) {
		if (typeof c != 'number') {
			return '';
		}
		if (c >= 0) {
			return String.fromCharCode(c);
		}
		if (useSpecial && SPECIAL_KEYS[-c]) {
			return SPECIAL_KEYS[-c];
		}
		else {
			return '';
		}
	}
	function keyName (c) {
		if (typeof c == 'string') {
			c = c.charCodeAt(0);
		}
		if (typeof c != 'number') {
			return c;
		}
		if (c >= 0 && c <= 0x1f) {
			return '^' + String.fromCharCode('@'.charCodeAt(0) + c);
		}
		if (c == 0x7f) {
			return '<delete>';
		}
		if (c < 0 && SPECIAL_KEYS[-c]) {
			return SPECIAL_KEYS[-c];
		}
		return String.fromCharCode(c);
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
		if (times <= 0) { return ''; }
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
		var result = '';
		for (var i = 0; i < s.length; i++) {
			var code = s.charCodeAt(i);
			if (/[\u0000-\u001f\u007f]/.test(s.charAt(i))) {
				if (code == 0x007f) {
					result += '<del>';
				}
				else {
					result += '^' + String.fromCharCode(code + 64);
				}
			}
			else {
				result += String.fromCharCode(code);
			}
		}
		return result;
	}
	function toVisibleControl (code) {
		// U+2400 - U+243F: Unicode Control Pictures
		return String.fromCharCode(code == 0x7f ? 0x2421 : 0x2400 + code);
	}
	function docScrollLeft () {
		return Math.max(document.documentElement.scrollLeft, document.body.scrollLeft);
	}
	function docScrollTop () {
		return Math.max(document.documentElement.scrollTop, document.body.scrollTop);
	}
	function docClientWidth () {
		return Math.min(document.documentElement.clientWidth, document.body.clientWidth)
	}
	function docClientHeight () {
		return Math.min(document.documentElement.clientHeight, document.body.clientHeight)
	}
	function logt3 (line) {
		var t3 = $('t3');
		if (t3) {
			var top = t3.value.length ? /^[^\n]+/.exec(t3.value)[0] : '';
			line = line.replace(/[\r\n]+$/, '');
			top = top.replace(/[\r\n]+$/, '');
			if (line != top) {
				t3.value = line + '\n' + t3.value;
				console.log(line);
			}
		}
		else {
			console.log(line);
		}
	}
	function getHighestZindex () {
		var iter = document.createNodeIterator(document.body, NodeFilter.SHOW_ELEMENT, null, false);
		var node;
		var result = 0;
		while ((node = iter.nextNode())) {
			var z = (node.style.zIndex || getComputedStyle(node, '').zIndex) - 0;
			if (z > result) {
				result = z;
			}
		}
		return result;
	}

	/*
	 * low-level functions for application management
	 * ----------------
	 */

	function getLocalStorage (keyName, callback) {
		if (window.chrome && chrome.extension) {
			chrome.extension.sendRequest({type:'get-storage', key:keyName}, function (res) {
				callback && callback(res.value);
			});
		}
		else if (window.localStorage) {
			callback && callback(localStorage.getItem(keyName));
		}
	}
	function setLocalStorage (keyName, value) {
		if (window.chrome && chrome.extension) {
			chrome.extension.sendRequest({type:'set-storage', key:keyName, value:value});
		}
		else if (window.localStorage) {
			localStorage.setItem(keyName, value);
		}
	}
	function getEditorCore () {
		return new Editor(EDITOR_CORE_ID);
	}
	function getLineInput () {
		return $(LINE_INPUT_ID);
	}
	function isEditing (mode) {
		mode || (mode = inputMode);
		return mode == 'edit' || mode == 'edit-overwrite';
	}
	function install (target) {

		function getFontStyle (s, fontFamilyOverride) {
			return [s.fontStyle, s.fontVariant, s.fontWeight, s.fontSize,
				'/' + s.lineHeight, (fontFamilyOverride || s.fontFamily)].join(' ');
		}
		function getBorderStyle (s) {
			var result = [];
			var r1 = /^\d+$/;
			var r2 = /([a-z])([A-Z])/g;
			var r3 = /([a-z])-([a-z])/g;
			var r4 = /^border[\-A-Z]/;
			for (var i in s) {
				var name = i;
				if (r1.test(name)) {
					name = s[i];
				}
				if (r4.test(name)) {
					var nameHyphened = name.replace(r2, function ($0, $1, $2) {
						return $1 + '-' + $2.toLowerCase();
					});
					var nameCameled = name.replace(r3, function ($0, $1, $2) {
						return $1 + $2.toUpperCase();
					});
					s[nameCameled] != '' && result.push('  ' + nameHyphened + ':' + s[nameCameled]);
				}
			}
			return result.join(';') + ';';
		}
		function getOverTextMarker (cnt, font, forecolor, backcolor) {
			var result = '';
			var canvas = cnt.appendChild(document.createElement('canvas'));
			try {
				canvas.height = lineHeight;
				var ctx = canvas.getContext('2d');
				ctx.font = font;
				canvas.width = ctx.measureText('~').width;
				ctx.fillStyle = backcolor;
				ctx.fillRect(0, 0, canvas.width, canvas.height);
				ctx.fillStyle = forecolor;
				ctx.textBaseline = 'top';
				ctx.textAlign = 'left';
				ctx.fillText('~', 0, 0);
				result = canvas.toDataURL('image/png');
			}
			finally {
				canvas.parentNode.removeChild(canvas);
			}
			return result;
		}

		// hack for opera: ensure repaint
		if (window.opera) {
			scrollBy(0, 1); scrollBy(0, -1);
		}

		/*
		 * DOM structure:
		 *
		 * div#wasavi_container
		 *	 |
		 *	 + style#wasavi_global_styles [style sheet]
		 *	 |
		 *	 + div#wasavi_editor [main editor screen]
		 *	 |
		 *	 + div#wasavi_footer
		 *	 |	 |
		 *	 |	 + div#wasavi_footer_modeline [modeline]
		 *	 |	 |
		 *	 |	 + div#wasavi_footer_alter
		 *	 |		 |
		 *	 |		 + table
		 *	 |			 |
		 *	 |			 + tbody
		 *	 |			   |
		 *	 |			   + tr
		 *	 |				   |
		 *	 |				   + td#wasavi_footer_input_indicator [header indicator]
		 *	 |				   |
		 *	 |				   + td
		 *	 |					   |
		 *	 |					   + input#wasavi_footer_input [line input editor]
		 *	 |
		 *	 + div#wasavi_console_container
		 *	 |	 |
		 *	 |	 + textarea#wasavi_console
		 *	 |
		 *	 + div#wasavi_multiline_scaler
		 *	 |
		 *	 + span#wasavi_singleline_scaler
		 *	 |
		 *	 + div#wasavi_console_scaler
		 *	 |
		 *	 + div#wasavi_command_cursor [normal mode cursor]
		 *	 |	 |
		 *	 |	 + span#wasavi_command_cursor_inner
		 *	 |
		 *	 + textarea#wasavi_edit_cursor [edit mode cursor]
		 *
		 */

		// container
		var cnt = document.body.appendChild(document.createElement('div'));
		cnt.id = CONTAINER_ID;

		//
		var s = document.defaultView.getComputedStyle(target, '');
		var hue = config.vars.modelinehue < 0 ? Math.floor(Math.random() * 360) : config.vars.modelinehue;
		var hsl = 'hsl(' + [hue, '100%', '33%'].join(',') + ')';
		var modeLineGradient = 'linear-gradient(top, ' + hsl + ' 0%,#000 100%);';
		var fontFamily = config.vars.monospace ? MONOSPACE_FONT_FAMILY : s.fontFamily;
		var borderStyles = getBorderStyle(s);

		// scale line height
		var heightScaler = document.body.appendChild(document.createElement('span'));
		style(heightScaler, {
			font: getFontStyle(s, fontFamily),
			textDecoration:'none',
			textShadow:'none',
			letterSpacing: s.letterSpacing
		});
		heightScaler.textContent = '0';
		lineHeight = heightScaler.offsetHeight;
		heightScaler.parentNode.removeChild(heightScaler);

		// over text marker
		var otm = getOverTextMarker(cnt, getFontStyle(s, fontFamily), '#000', '#fff');

		// style
		var styleElement = cnt.appendChild(document.createElement('style'));
		styleElement.type = 'text/css';
		styleElement.id = 'wasavi_global_styles';
		styleElement.appendChild(document.createTextNode([
			'#wasavi_container {',
			'  position:absolute;',
			'  background-color:#000;',
			'  z-index:' + Math.min(getHighestZindex() + 100, 0x7fffffff) + ';',
			'}',
			'#wasavi_editor {',
			'  display:block;',
			'  margin:0;',
			'  padding:' + s.padding + ';',
			borderStyles,
			'  border-color:silver;',
			'  border-style:solid;',
			'  border-radius:0;',
			'  box-sizing:border-box;',
			'  font:' + getFontStyle(s, MONOSPACE_FONT_FAMILY) + ';',
			'  text-decoration:none;',
			'  text-shadow:none;',
			'  letter-spacing:' + s.letterSpacing + ';',
			'  width:' + target.offsetWidth + 'px;',
			'  height:' + target.offsetHeight + 'px;',
			'  background:#fff url(' + otm + ') repeat-y;',
			'  overflow-x:hidden;',
			'  overflow-y:scroll',
			'}',
			'#wasavi_multiline_scaler {',
			'  position:fixed;',
			'  overflow:scroll;',
			'  padding:' + s.padding + ';',
			borderStyles,
			'  border-color:silver;',
			'  border-style:solid;',
			'  box-sizing:border-box;',
			'  font:' + getFontStyle(s, fontFamily) + ';',
			'  text-decoration:none;',
			'  text-shadow:none;',
			'  letter-spacing:' + s.letterSpacing + ';',
			'  width:' + target.offsetWidth + 'px;',
			'  height:' + target.offsetHeight + 'px;',
			'  left:0px;',
			'  top:0px;',
			'  white-space:pre-wrap;',
			'  overflow-x:auto;',
			'  overflow-y:scroll;',
			'  visibility:hidden',
			'}',
			'#wasavi_singleline_scaler {',
			'  position:fixed;',
			'  margin:0;',
			'  padding:0;',
			'  font:' + getFontStyle(s, fontFamily) + ';',
			'  text-decoration:none;',
			'  text-shadow:none;',
			'  letter-spacing:' + s.letterSpacing + ';',
			'  white-space:pre;',
			'  color:#fff;',
			'  background-color:#000;',
			'  left:0px;',
			'  top:0px;',
			'  visibility:hidden',
			'}',
			'#wasavi_console_scaler {',
			'  position:fixed;',
			'  padding:0;',
			'  border:none;',
			'  font-family:' + fontFamily + ';',
			'  font-size:10pt;',
			'  line-height:1;',
			'  left:0px;',
			'  top:0px;',
			'  white-space:pre-wrap;',
			'  overflow-x:auto;',
			'  color:#fff;',
			'  background-color:#000;',
			'  visibility:hidden',
			'}',
			'#wasavi_editor > div {',
			'  margin:0;',
			'  padding:0;',
			'  min-height:' + lineHeight + 'px;',
			'  white-space:pre-wrap;',
			'  background-color:#fff;',
			'  color:#000;',
			'}',
			'#wasavi_editor > div:nth-child(odd) {',
			'  background-color:rgb(248,248,248);',
			'}',
			'#wasavi_editor > div > span.wasavi_em {',
			'  color:highlighttext;',
			'  background-color:highlight;',
			'}',
			'#wasavi_editor > div > span.wasavi_composition {',
			'  color:#ffffee;',
			'  background-color:#ffffee;',
			'}',
			'#wasavi_footer {',
			'  color:#fff;',
			window.opera  ? '  background:-o-'		+ modeLineGradient : '',
			window.chrome ? '  background:-webkit-' + modeLineGradient : '',
			IS_GECKO	  ? '  background:-moz-'	+ modeLineGradient : '',
			//'  background:'						  + modeLineGradient,
			'  padding:2px 2px 1px 2px;',
			'  font-family:' + MONOSPACE_FONT_FAMILY + ';',
			'  font-size:10pt;',
			'  line-height:1;',
			'  overflow:hidden',
			'}',
			'#wasavi_footer_modeline {',
			'  text-align:right;',
			'  padding:0 8px 1px 0;',
			'  font-size:small;',
			'  white-space:pre;',
			'}',
			'#wasavi_footer_alter {',
			'  display:none',
			'}',
			'#wasavi_footer_alter>table {',
			'  padding:0;',
			'  margin:0;',
			'  border-collapse:collapse;',
			'  border:none;',
			'  width:' + (target.offsetWidth - 4) + 'px;',
			'  background-color:transparent',
			'}',
			'#wasavi_footer_alter>table td {',
			'  border:none;',
			'  padding:0;',
			'}',
			'#wasavi_footer_input_indicator {',
			'  width:1%;',
			'  padding:0;',
			'  background-color:rgba(0,0,0,0.5)',
			'}',
			'#wasavi_footer_input_container {',
			//'  width:99%;',
			'  padding:0;',
			'  background-color:transparent',
			'}',
			'#wasavi_footer_input {',
			'  display:block;',
			'  margin:0;',
			'  padding:0;',
			'  border:none;',
			'  outline:none;',
			'  color:#fff;',
			'  background-color:rgba(0,0,0,0.5);',
			'  font-family:' + MONOSPACE_FONT_FAMILY + ';',
			'  font-size:10pt;',
			'  line-height:1;',
			'  width:100%',
			'}',
			'#wasavi_console_container {',
			'  visibility:hidden;',
			'  position:absolute;',
			'  margin:0;',
			'  padding:6px;',
			'  left:8px; top:8px;',
			'  box-sizing:border-box;',
			'  border:none;',
			'  border-radius:8px;',
			'  width:' + (target.offsetWidth - 16) + 'px;',
			'  height:' + (target.offsetHeight - 16) + 'px;',
			'  background-color:rgba(0,0,0,0.8);',
			'}',
			'#wasavi_console {',
			'  margin:0;',
			'  padding:0;',
			'  border:none;',
			'  outline:none;',
			'  color:#fff;',
			'  background-color:transparent;',
			'  width:100%;',
			'  height:' + (target.offsetHeight - (16 + 12)) + 'px;',
			'  font-family:' + MONOSPACE_FONT_FAMILY + ';',
			'  font-size:10pt;',
			'  line-height:1;',
			'  overflow-y:hidden;',
			'  white-space:pre-wrap;',
			window.chrome ? '  resize:none;' : '',
			'}',
			'#wasavi_command_cursor {',
			'  position:absolute;',
			'  margin:0;',
			'  padding:0;',
			'  font:' + getFontStyle(s, fontFamily) + ';',
			'  text-decoration:none;',
			'  text-shadow:none;',
			'  letter-spacing:' + s.letterSpacing + ';',
			'  color:#fff;',
			'  background-color:#000;',
			'  left:0px;',
			'  top:0px;',
			'  overflow-y:hidden',
			'}',
			'#wasavi_command_cursor_inner {',
			'  margin:0;',
			'  padding:0;',
			'  white-space:pre',
			'}',
			'#wasavi_edit_cursor {',
			'  position:absolute;',
			'  display:none;',
			'  margin:0;',
			'  padding:0;',
			'  border:none;',
			'  background-color:transparent;',
			'  font:' + getFontStyle(s, fontFamily) + ';',
			'  text-decoration:none;',
			'  text-shadow:none;',
			'  letter-spacing:' + s.letterSpacing + ';',
			'  overflow-y:hidden;',
			window.chrome ? '  resize:none;' : '',
			'  outline:none;',
			'}',
			'#wasavi_cover {',
			'  position:fixed;',
			'  left:0; top:0; right:0; bottom:0;',
			'  background-color:rgba(0,0,0,0.0)',
			'}'
		].join('')));

		// editor
		var editorElement = cnt.appendChild(document.createElement('div'));
		editorElement.id = EDITOR_CORE_ID;
		editorElement.dataset.wasaviEditor = '1';
		var editor = new Editor(editorElement);

		// caret position scaler
		var caretdiv = cnt.appendChild(document.createElement('div'));
		caretdiv.id = 'wasavi_multiline_scaler';

		// text length scaler
		var textspan = cnt.appendChild(document.createElement('span'));
		textspan.id = 'wasavi_singleline_scaler';
		textspan.textContent = '#';

		// console scaler
		var conscaler = cnt.appendChild(document.createElement('div'));
		conscaler.id = 'wasavi_console_scaler';
		conscaler.textContent = '#';

		// footer container
		var footer = cnt.appendChild(document.createElement('div'));
		footer.id = 'wasavi_footer';

		// footer (default indicator)
		var footerDefault = footer.appendChild(document.createElement('div'));
		footerDefault.id = 'wasavi_footer_modeline';
		footerDefault.textContent = '#';

		// footer (alter: line input)
		var footerAlter = footer.appendChild(document.createElement('div'));
		footerAlter.id = 'wasavi_footer_alter';

		// footer alter contents
		var footerAlterRow = footerAlter.appendChild(document.createElement('table'))
			.appendChild(document.createElement('tbody'))
			.appendChild(document.createElement('tr'));

		// footer alter contents: indicator
		var footerIndicator = footerAlterRow.appendChild(document.createElement('td'));
		footerIndicator.id = 'wasavi_footer_input_indicator';
		footerIndicator.textContent = '/';

		// footer alter contents: line input container
		var footerLineInputContainer = footerAlterRow.appendChild(document.createElement('td'));
		footerLineInputContainer.id = 'wasavi_footer_input_container';

		// footer alter contents: line input
		var footerInput = footerLineInputContainer.appendChild(document.createElement('input'));
		footerInput.type = 'text';
		footerInput.id = 'wasavi_footer_input';
		footerInput.spellcheck = false;

		// footer background
		footer.dataset.goalHeight = footer.offsetHeight;
		footer.dataset.currentHeight = '1';
		footer.style.height = '0';

		// console window
		var conwincnt = cnt.appendChild(document.createElement('div'));
		conwincnt.id = 'wasavi_console_container';
		var conwin = conwincnt.appendChild(document.createElement('textarea'));
		conwin.id = 'wasavi_console';
		conwin.spellcheck = false;
		conscaler.style.width = conwin.offsetWidth + 'px';

		// command cursor
		var cc = cnt.appendChild(document.createElement('div'));
		cc.id = 'wasavi_command_cursor';

		var ccInner = cc.appendChild(document.createElement('span'));
		ccInner.id = 'wasavi_command_cursor_inner';

		// textarea for insert mode
		var ec = cnt.appendChild(document.createElement('textarea'));
		ec.id = 'wasavi_edit_cursor';
		ec.spellcheck = false;

		// screen cover
		var cover = cnt.appendChild(document.createElement('div'));
		cover.id = 'wasavi_cover';

		// positioning
		var rect = target.getBoundingClientRect();
		style(cnt, {
			left: (rect.left + docScrollLeft()) + 'px',
			top: (rect.top + docScrollTop()) + 'px'
		});

		// initialize variables
		targetElement = target;
		terminated = false;
		writeOnTermination = true;
		state = 'normal';
		runLevel = 0;
		inputModeStack = [];
		inputMode = 'command';
		inputModeSub = '';
		prefixInput = new PrefixInput;
		idealWidthPixels = -1;
		backlog = new Backlog(conwincnt, conwin, conscaler);
		editedString = '';
		isTextDirty = false;
		isEditCompleted = false;
		isVerticalMotion = false;
		isWordMotion = false;
		isSmoothScrollRequested = false;
		isReadonlyWarned = false;
		isSimpleCommandUpdateRequested = false;
		lastSimpleCommand = '';
		lastHorzFindCommand = {direction:0, letter:'', stopBefore:false};
		lastRegexFindCommand = new RegexFinderInfo;
		lastSubstituteInfo = {};
		requestedState = {};

		editor.value = target.value;
		editor.selectionStart = target.value
			.substring(0, target.selectionStart)
			.replace(/\r\n/g, '\n').length;
		editor.selectionEnd = editor.selectionStart;
		editor.scrollTop = target.scrollTop;
		editor.scrollLeft = target.scrollLeft;

		marks = new Marks(editor);
		cursor = new CursorUI(editor, cc, ec);
		scroller = new Scroller(editor);
		editLogger = new EditLogger(editor, config.vars.undolevels);
		target.readOnly && config.setData('readonly');
		setupEventHandlers(true);

		refreshIdealWidthPixels(editor);
		showMessage(
			_('"{0}" {1}{2} {line:2}, {3} {character:3}.',
			targetElement.nodeName + (targetElement.id != '' ? '#' + targetElement.id : ''),
			target.readOnly ? _('[readonly] ') : '',
			editor.rowLength,
			target.value.length));

		// animation
		(function () {
			footer.style.height = footer.dataset.currentHeight + 'px';
			if (+footer.dataset.currentHeight >= +footer.dataset.goalHeight) {
				cnt.style.boxShadow = '0 1px 8px 4px #444';

				cursor.ensureVisible();
				cursor.update({type:inputMode, focused:true, visible:true});

				exGlobalSpecified = false;
				editLogger.open(function () {
					var result = executeExCommand(editor, exrc);
					if (typeof result == 'string') {
						showMessage(result, true);
					}
				});

				var ev = document.createEvent('Event');
				ev.initEvent('wasavi_start', true, true);
				document.dispatchEvent(ev);
			}
			else {
				footer.dataset.currentHeight = +footer.dataset.currentHeight + 1;
				setTimeout(arguments.callee, 10);
			}
		})();
	}
	function uninstall (editor, save) {
		var cnt = $(CONTAINER_ID);
		var cover = $('wasavi_cover');

		// apply the edited content to target textarea
		if (save && isTextDirty) {
			targetElement.value = editor.value;
			targetElement.selectionStart = editor.selectionStart;
			targetElement.selectionEnd = editor.selectionEnd;
			targetElement.scrollTop = editor.scrollTop;
			targetElement.scrollLeft = editor.scrollLeft;
		}

		// remove all event handlers
		setupEventHandlers(false);

		// clear all objects and arrays
		inputModeStack = null;
		prefixInput = null;
		backlog = null;
		lastHorzFindCommand = null;
		lastRegexFindCommand = null;
		lastSubstituteInfo = null;
		requestedState = null;
		marks = null;
		cursor = null;
		scroller = null;
		editLogger = null;

		removeChild(cnt);

		//
		targetElement.focus();
		targetElement = null;

		// fire terminate event
		var ev = document.createEvent('Event');
		ev.initEvent('wasavi_terminate', true, true);
		document.dispatchEvent(ev);
	}
	function setupEventHandlers (install) {
		var method = install ? 'addEventListener' : 'removeEventListener';

		// window
		window[method]('focus', handleWindowFocus, false);
		window[method]('blur', handleWindowBlur, false);

		// document
		if (!injectKeyevents) {
			window.chrome && document[method]('keydown', handleKeydown, true);
			                 document[method]('keypress', handleKeydown, true);
		}

		var editor = $(EDITOR_CORE_ID);
		if (editor) {
			editor[method]('mousedown', handleMousedown, false);
			editor[method]('mouseup', handleMouseup, false);
			editor[method]('scroll', handleScroll, false);
		}

		var cover = $('wasavi_cover');
		if (cover) {
			cover[method]('mousedown', handleCoverMousedown, false);
			cover[method]('click', handleCoverClick, false);
			cover[method]('mousewheel', handleCoverMousewheel, false);
		}

		var input = getLineInput();
		if (input) {
			input[method]('input', handleInput, false);
		}

		cursor.setupEventHandlers(method);
	}
	function setInputMode (newInputMode, newInputModeSub, initial) {
		var newState;
		if (/^(?:command|edit|edit-overwrite|wait-a-letter|wait-register)$/.test(newInputMode)) {
			newState = 'normal';
		}
		else if (newInputMode == 'line-input') {
			newState = 'line-input';
		}
		else if (newInputMode == 'console-wait') {
			newState = 'console-wait';
		}
		if (newState != state) {
			switch (newState) {
			case 'normal':
				state = newState;
				inputMode = newInputMode;
				cursor.update({focused:true, visible:!backlog.visible});
				var editor = getEditorCore();
				showPrefixInput(editor);
				editor.focus();
				break;
			case 'line-input':
				state = newState;
				inputMode = newInputMode;
				cursor.update({focused:false, visible:!backlog.visible});
				showLineInput(initial);
				break;
			case 'console-wait':
				state = newState;
				inputMode = newInputMode;
				cursor.update({visible:!backlog.visible});
				break;
			}
		}
		else {
			inputMode = newInputMode;
		}
		inputModeSub = newInputModeSub || '';
	}
	function pushInputMode (mode, modeSub, initial) {
		inputModeStack.push(inputMode);
		setInputMode(mode, modeSub, initial);
	}
	function popInputMode () {
		if (inputModeStack.length) {
			setInputMode(inputModeStack.pop());
		}
		else {
			setInputMode('command');
		}
	}
	function showPrefixInput (t, message) {
		if (state != 'normal') {return;}
		var line = $('wasavi_footer_modeline');
		var alter = $('wasavi_footer_alter');
		line.style.display = '';
		alter.style.display = 'none';
		line.style.textAlign = 'right';
		line.style.fontWeight = 'normal';
		line.style.color = '#fff';
		line.style.backgroundColor = 'transparent';
		line.textContent = message || prefixInput.toString() ||
			// 000000,0000xxx000%
			(('     ' + (t.selectionStartRow + 1)).substr(-6) +
			 ',' + ((t.selectionStartCol + 1) + '   ').substr(0, 4) +
			 '   ' + (t.elm.scrollHeight <= t.elm.clientHeight ? 'All' : ('  ' + Math.floor((t.selectionStartRow + 1) / t.rowLength * 100.)).substr(-3) + '%'));
	}
	function showMessage (message, emphasis, pseudoCursor) {
		if (state != 'normal' && state != 'console-wait') {return;}
		var line = $('wasavi_footer_modeline');
		var alter = $('wasavi_footer_alter');
		line.style.display = '';
		alter.style.display = 'none';
		line.style.textAlign = 'left';
		line.style.fontWeight = 'bold';
		line.style.color = '#fff';
		var pa = line;
		if (emphasis) {
			line.innerHTML = '';
			var span = line.appendChild(document.createElement('span'));
			span.style.backgroundColor = '#f00';
			span.textContent = message;
			pa = span;
		}
		else {
			line.style.backgroundColor = 'transparent';
			line.textContent = message;
		}
		if (pseudoCursor) {
			var blink = pa.appendChild(document.createElement('blink'));
			blink.textContent = '\u2588';
		}
	}
	function showLineInput (initial) {
		if (state != 'line-input') {return;}
		var line = $('wasavi_footer_alter');
		var alter = $('wasavi_footer_modeline');
		var input = getLineInput();
		line.style.display = 'block';
		alter.style.display = 'none';
		$('wasavi_footer_input_indicator').textContent = initial;
		input.value = '';
		input.dataset.current = '';
		input.focus();
	}
	function requestShowPrefixInput (message) {
		if (!requestedState.modeline) {
			requestedState.modeline = {type:'prefix', message:message};
		}
	}
	function requestShowMessage (message, emphasis, pseudoCursor) {
		if (!requestedState.modeline) {
			requestedState.modeline = {
				type:'message',
				message:message,
				emphasis:!!emphasis,
				pseudoCursor:!!pseudoCursor
			};
		}
	}
	function requestBell () {
		requestedState.bell = true;
	}
	function requestInputMode (mode, modeSub, initial) {
		if (!requestedState.inputMode) {
			requestedState.inputMode = {mode:mode, modeSub:modeSub || '', initial:initial || ''};
		}
	}
	function requestLogEditing () {
		requestedState.logEditing = true;
	}
	function requestSimpleCommandUpdate () {
		if (runLevel == 0) {
			isSimpleCommandUpdateRequested = true;
		}
	}
	function executeViCommand (/*, keepRunLevel*/) {
		var editor = getEditorCore();
		var input = getLineInput();
		var e = document.createEvent('UIEvent');
		var args = Array.prototype.slice.call(arguments);
		var keepRunLevel = false;

		if (args.length && typeof args[args.length - 1] == 'boolean') {
			keepRunLevel = args.pop();
		}

		!keepRunLevel && runLevel++;
		try {
			for (var j = 0; j < args.length; j++) {
				switch (typeof args[j]) {
				case 'number':
					e.initUIEvent('wasavi_command', false, true, window, 0);
					mapManager.process(args[j], function (keyCode) {
						processInput(keyCode, e);
					});
					break;
				case 'string':
					var cmd = args[j];
					for (var i = 0, goal = cmd.length; i < goal; i++) {
						e.initUIEvent('wasavi_command', false, true, window, 0);
						mapManager.process(cmd.charCodeAt(i), function (keyCode) {
							processInput(keyCode, e);
						});
					}
					break;
				}
			}
		}
		finally {
			!keepRunLevel && runLevel--;
		}
	}
	function processInput (code, e) {
		function completeSelectionRange (t, ss, se) {
			if (t.selectionStart.gt(ss) && t.selectionStart.gt(se)) {
				t.setSelectionRange(t.selectionStart);
			}
			else if (t.selectionEnd.lt(ss) && t.selectionEnd.lt(se)) {
				t.setSelectionRange(t.selectionEnd);
			}
			else if (t.selectionStart.ne(ss) && t.selectionEnd.eq(se)) {
				t.setSelectionRange(t.selectionStart);
			}
			else if (t.selectionStart.eq(ss) && t.selectionEnd.ne(se)) {
				t.setSelectionRange(t.selectionEnd);
			}
		}
		function doEditComplete () {
			isTextDirty = true;
			lastRegexFindCommand.text = null;
			if (config.vars.readonly && !isReadonlyWarned) {
				isReadonlyWarned = true;
				requestShowMessage(_('Warning: changing readonly element.'), true);
				requestBell();
			}
		}
		function execCommandMap (t, key, subkey, code) {
			var map = commandMap;
			var ss = t.selectionStart;
			var se = t.selectionEnd;
			var result = execMap(t, e, map, key, subkey, code);

			if (result) {
				var canContinue = true;

				if (prefixInput.operation.length) {
					canContinue = execMap(t, e, map, prefixInput.operation, '@op', code);
				}
				if (canContinue !== false) {
					isEditCompleted && doEditComplete();
					completeSelectionRange(t, ss, se);

					cursor.ensureVisible(isSmoothScrollRequested);
					cursor.update(scroller.running || state != 'normal' ?
						{visible:false} : {focused:true, visible:true});

					t.isLineOrientSelection =
					isEditCompleted =
					isVerticalMotion =
					isWordMotion =
					isSmoothScrollRequested = false;

					if (isSimpleCommandUpdateRequested) {
						lastSimpleCommand = prefixInput.toString();
						isSimpleCommandUpdateRequested = false;
					}

					prefixInput.reset();
					requestShowPrefixInput();
				}
			}
		}
		function execEditMap (t, key, subkey, code) {
			if (editMap[key]) {
				var ss = t.selectionStart;
				var se = t.selectionEnd;
				execMap(t, e, editMap, key, subkey, code);
				completeSelectionRange(t, ss, se);
				cursor.ensureVisible();
				cursor.update({focused:true, visible:true});

				return true;
			}
			return false;
		}
		function execLineInputEditMap (t, key, subkey, code) {
			if (lineInputEditMap[key]) {
				execMap(t, e, lineInputEditMap, key, subkey, code);
				return true;
			}
			return false;
		}
		function processAbbrevs (t, force) {
			if (!('keyCode' in e)) return;

			var regex = config.vars.iskeyword;
			var target, last;

			if (force) {
				if (editedString.length < 1) return;
				target = editedString;
				last = '';
			}
			else {
				if (editedString.length < 2) return;
				target = editedString.substring(0, editedString.length - 1);
				last = editedString.substr(-1);
				if (!(regex.test(target.substr(-1)) && !regex.test(last))) return;
			}

			for (var i in abbrevs) {
				if (target.substr(-i.length) != i) continue;

				var canTransit = false;
				if (regex.test(i.charAt(0))) {
					if (i.length == 1) {
						if (t.selectionStartCol - i.length <= 1
						||	target.length - i.length <= 0
						||	/\s/.test(target.substr(-(i.length + 1), 1))) {
							canTransit = true;
						}
					}
					else {
						if (t.selectionStartCol - i.length <= 1
						||	target.length - i.length <= 0
						||	!regex.test(target.substr(-(i.length + 1), 1))) {
							canTransit = true;
						}
					}
				}
				else {
					if (t.selectionStartCol - i.length <= 1
					||	target.length - i.length <= 0
					||	regex.test(target.substr(-(i.length + 1), 1))
					||	/\s/.test(target.substr(-(i.length + 1), 1))) {
						canTransit = true;
					}
				}
				if (!canTransit) continue;

				editedString = target + multiply('\u0008', i.length) + abbrevs[i] + last;
				deleteChars(t, i.length + 1);
				(inputMode == 'edit' ? insert : overwrite)(t, abbrevs[i] + last);
				break;
			}
		}
		function logEditing (t) {
			editedString != '' && editLogger.open(function () {
				if (inputMode == 'edit') {
					editLogger.write(EditLogger.ITEM_TYPE.INSERT, editStartPosition, editedString);
				}
				else {
					editLogger.write(
						EditLogger.ITEM_TYPE.OVERWRITE,
						editStartPosition, editedString,
						t.rows(editStartPosition).substr(editStartPosition.col, editedString.length)
					);
				}
			});
		}

		var editor = getEditorCore();
		var input = getLineInput();
		var letter = chr(code);
		var mapkey = chr(code, true);
		var subkey = inputMode;
		var result = false;

		switch (inputModeSub) {
		case 'wait-a-letter':
			mapkey = chr(lastKeyCode, true);
			subkey = inputModeSub;
			inputModeSub = '';
			break;

		case 'wait-register':
			if (registers.isReadable(letter)) {
				mapkey = chr(lastKeyCode, true);
				subkey = inputModeSub;
				inputModeSub = '';
			}
			else {
				inputModeSub = '';
				lastKeyCode = code;
				return true;
			}
			break;

		case 'backlog':
			if (backlog.queued) {
				if (letter == 'q') {
					backlog.clear();
					backlog.hide();
					popInputMode();
					inputModeSub = '';
					return true;
				}
				else if (letter == ':') {
					popInputMode();
					subkey = inputMode;
					inputModeSub = '';
					break;
				}
				else {
					backlog.write(letter == '\u000d');
					return true;
				}
			}
			else {
				letter != ':' && backlog.hide();
				popInputMode();
				subkey = inputMode;
				inputModeSub = '';
				if (letter == '\u000d' ||  letter == ' ' ||  state != 'normal') {
					return true;
				}
			}
			break;

		case 'ex-s':
			if (!substituteWorker.kontinue(editor, letter)) {
				substituteWorker = null;
				inputModeSub = '';
			}
			return true;

		default:
			inputModeSub = '';
		}

		switch (inputMode) {
		case 'command':
			execCommandMap(editor, mapkey, subkey, code);
			result = true;
			break;

		case 'edit':
		case 'edit-overwrite':
			cursor.update({visible:false});

			if (subkey == inputMode && code == 0x1b) {
				processAbbrevs(editor, true);

				for (var i = 1; i < prefixInput.count; i++) {
					executeViCommand(editedString);
				}

				logEditing(editor);
				editLogger.clusterNestLevel >= 0 && editLogger.close();

				var n = editor.selectionStart;
				n.col = Math.max(n.col - 1, 0);
				editor.setSelectionRange(n);

				popInputMode();
				prefixInput.isLocked = false;
				prefixInput.trailer = editedString;
				registers.set('.', editedString);

				cursor.ensureVisible();
				cursor.update({type:inputMode, visible:true});

				if (runLevel == 0 && isSimpleCommandUpdateRequested) {
					lastSimpleCommand = prefixInput.toString() + letter;
					isSimpleCommandUpdateRequested = false;
				}

				(isEditCompleted || editedString != '') && doEditComplete();
				editedString = '';
				prefixInput.reset();
				isEditCompleted = isVerticalMotion = isWordMotion = false;
				isSmoothScrollRequested = false;
				requestShowPrefixInput();
			}
			else {
				if (runLevel == 0) {
					editedString += letter;
				}
				if (config.vars.showmatch) {
					pairBracketsIndicator && pairBracketsIndicator.clear();
					pairBracketsIndicator = PairBracketsIndicator.getObject(letter, editor);
				}
				if (execEditMap(editor, mapkey, subkey, code)) {
					//
				}
				else if (isEditing() && (code == 0x08 || code == 0x0a || code >= 32)) {
					(inputMode == 'edit' ? insert : overwrite)(editor, letter);
					processAbbrevs(editor);

					if (runLevel == 0) {
						cursor.ensureVisible();
						cursor.update({visible:true});
					}
				}
			}
			result = true;
			break;

		case 'line-input':
			var canEscape = code == 0x1b
				|| code == 0x08 && input.selectionStart == 0 && input.selectionEnd == 0;

			input.dataset.current = input.value;

			if (subkey == inputMode && canEscape) {
				mapkey = prefixInput.motion || prefixInput.operation;
				backlog.hide();
				execMap(
					editor, e, commandMap,
					mapkey, '@' + inputMode + '-escape', input.value);
				popInputMode();
				prefixInput.reset();
				requestShowPrefixInput();
			}
			else if (subkey == inputMode && (code == 0x0d || code == 0x0a)) {
				var line = input.value.replace(/[\u2400-\u243f]/g, function (a) {
					return String.fromCharCode(a.charCodeAt(0) & 0x00ff);
				});
				prefixInput.trailer = line + chr(code);
				mapkey = prefixInput.motion || prefixInput.operation;
				execMap(
					editor, e, commandMap,
					mapkey, '@' + inputMode + '-reset', line);
				execCommandMap(editor, mapkey, subkey, line);

				popInputMode();
				prefixInput.reset();
			}
			else if (execLineInputEditMap(input, mapkey, subkey, code)) {
				setTimeout(function () {
					var input = getLineInput();
					if (input.value != input.dataset.current) {
						var e = document.createEvent('Event');
						e.initEvent('input', false, false);
						input.dispatchEvent(e);
					}
				}, 1);
			}
			else {
				if (code >= 0 && code < 32) {
					letter = toVisibleControl(code);
					code = letter.charCodeAt(0);
				}
				if (code >= 32) {
					lineInputHistories.isInitial = true;
					input.value =
						input.value.substring(0, input.selectionStart) +
						letter +
						input.value.substring(input.selectionEnd);
					input.selectionStart += letter.length;
					input.selectionEnd = input.selectionStart;
					processInputSupplement(e);
				}
			}
			result = true;
			break;

		default:
			result = true;
		}

		if (terminated) {
			uninstall(editor, writeOnTermination);
		}
		else {
			if (requestedState.inputMode) {
				pushInputMode(
					requestedState.inputMode.mode,
					requestedState.inputMode.modeSub,
					requestedState.inputMode.initial);
				requestedState.inputMode = null;
			}
			var messageUpdated = false;
			if (requestedState.modeline) {
				switch (requestedState.modeline.type) {
				case 'prefix':
					showPrefixInput(editor, requestedState.modeline.message);
					break;
				case 'message':
					messageUpdated = true;
					showMessage(
						requestedState.modeline.message,
						requestedState.modeline.emphasis,
						requestedState.modeline.pseudoCursor
					);
					break;
				}
				requestedState.modeline = null;
				config.vars.errorbells && requestBell();
			}
			if (requestedState.logEditing) {
				logEditing(editor);
				editedString = '';
				requestedState.logEditing = false;
			}
			if (requestedState.bell) {
				bell.play();
				requestedState.bell = false;
			}
			if (runLevel == 0 && state == 'normal' && (backlog.queued || backlog.visible)) {
				backlog.write(false, messageUpdated);
			}
		}

		lastKeyCode = code;
		return result;
	}
	function processInputSupplement (e) {
		switch (inputMode) {
		case 'line-input':
			var editor = getEditorCore();
			var input = getLineInput();
			var key = prefixInput.motion || prefixInput.operation;
			execMap(editor, e, commandMap, key, '@' + inputMode + '-reset', input.value);
			execMap(editor, e, commandMap, key, '@' + inputMode + '-notify', input.value);
			break;
		}
	}
	function execMap (t, e, map, key, subkey, code) {
		if (map[key]) {
			subkey || (subkey = '');
			switch (typeof map[key]) {
			case 'function':
				if (subkey == '' || subkey == inputMode) {
					return map[key](chr(code) || code, t, e);
				}
				break;
			case 'object':
				if (subkey != '' && subkey in map[key]) {
					return map[key][subkey](chr(code) || code, t, e);
				}
				break;
			}
			return true;
		}
		return false;
	}
	function getFileInfo (t) {
		var result = [];

		// file name
		if (targetElement.id != '') {
			result.push('"' + targetElement.nodeName + '#' + targetElement.id + '"');
		}
		else {
			result.push('"' + targetElement.nodeName + '"');
		}

		// modified
		if (isTextDirty) {
			result.push(_('modified:'));
		}

		// read only
		if (config.vars.readonly) {
			result.push(_('readonly:'));
		}

		// current line number
		result.push(_('line {0} of {1}', t.selectionStartRow + 1, t.rowLength));

		// ratio of caret position
		result.push(_('[{0}%]', parseInt(t.selectionStartRow / t.rowLength * 100.0)));

		return result.join(' ');
	}
	function getFindRegex (src) {
		var result;
		var pattern = '';
		var caseSensibility = false;
		var magic = false;
		if (src instanceof RegExp) {
			return src;
		}
		else if (typeof src == 'string') {
			pattern = src;
		}
		else if (typeof src == 'object') {
			if ('csOverride' in src) {
				caseSensibility = src.csOverride;
			}
			if ('magicOverride' in src) {
				magic = src.magicOverride;
			}
			if ('pattern' in src) {
				pattern = src.pattern;
			}
			else if ('regex' in src && src.regex instanceof RegExp) {
				pattern = src.regex.source;
				magic = true;
			}
		}
		if (caseSensibility === false) {
			caseSensibility =
				config.vars.smartcase && !/[A-Z]/.test(pattern) || config.vars.ignorecase ? 'i' : '';
		}
		try {
			result = new RegExp(
				magic ? pattern : regexConverter.toJsRegexString(pattern),
				caseSensibility + 'gm');
		}
		catch (e) {
			result = null;
		}
		return result;
	}

	/*
	 * low-level functions for editor functionality
	 * ----------------
	 */

	function refreshIdealWidthPixels (t) {
		if (idealWidthPixels < 0) {
			var n = t.selectionStart;
			var textspan = $('wasavi_singleline_scaler');
			textspan.textContent = t.rows(n).substr(0, n.col);
			idealWidthPixels = textspan.offsetWidth;
		}
	}
	function getCurrentViewPositionIndices (t) {
		function getNodeIndex (vertOffset) {
			var a = t.elm.getBoundingClientRect();
			var result = document.elementFromPoint(
				a.left + t.elm.clientLeft + parseInt(s.paddingLeft, 10),
				a.top + t.elm.clientTop + (vertOffset || parseInt(s.paddingTop, 10))
			);

			if (result && result.parentNode && result.parentNode.id == EDITOR_CORE_ID) {
				return t.indexOf(result);
			}

			return -1;
		}

		var cover = $('wasavi_cover');
		var coverDisplay = cover.style.display;
		var cursorDisplay = cursor.visible;
		var s = document.defaultView.getComputedStyle(t.elm, '');
		var sl = docScrollLeft();
		var st = docScrollTop();

		cover.style.display = 'none';
		cursor.update({visible:false});
		try {
			return {
				top: getNodeIndex(),
				bottom: getNodeIndex(t.elm.clientHeight - t.elm.clientTop - 1)
			};
		}
		finally {
			cover.style.display = coverDisplay;
			cursor.update({visible:cursorDisplay});
		}
	}
	function inputEscape () {
		inputMode == 'command' && requestBell();
		prefixInput.reset();
		requestShowPrefixInput();
	}
	function inputDigit (c, t) {
		prefixInput.appendCount(c);
		requestShowPrefixInput();
	}
	function operationDefault (c, t) {
		if (prefixInput.isEmptyOperation) {
			prefixInput.operation = c;
			requestShowPrefixInput();
		}
		else if (prefixInput.operation == c) {
			return true;
		}
		else {
			inputEscape();
		}
	}

	/*
	 * low-level functions for cursor motion
	 * ----------------
	 */

	function motionLeft (c, t, count) {
		count || (count = 1);
		var n = t.selectionStart;
		n.col <= 0 && requestBell();
		n.col = Math.max(n.col - count, 0);
		t.selectionStart = n;
		prefixInput.motion = c;
		idealWidthPixels = -1;
		return true;
	}
	function motionRight (c, t, count) {
		count || (count = 1);
		var n = t.selectionEnd;
		length = t.rows(n).length;
		n.col >= length - 1 && requestBell();
		n.col = Math.min(n.col + count, length);
		t.selectionEnd = n;
		prefixInput.motion = c;
		idealWidthPixels = -1;
		return true;
	}
	function motionLineStart (c, t, realTop) {
		t.selectionStart = realTop ?
			t.getLineTopOffset(t.selectionStart) :
			t.getLineTopOffset2(t.selectionStart);
		prefixInput.motion = c;
		idealWidthPixels = -1;
		return true;
	}
	function motionLineEnd (c, t) {
		t.selectionEnd = t.getLineTailOffset(t.selectionEnd);
		prefixInput.motion = c;
		idealWidthPixels = -1;
		return true;
	}
	function motionNextWord (c, t, count, bigWord, wordEnd) {
		var n = t.selectionEnd;
		count || (count = 1);
		n.col >= t.rows(n).length - 1 && n.row >= t.rowLength - 1 && requestBell();

		function doBigWord () {
			for (var i = 0; i < count; i++) {
				var prop = t.charClassAt(n, true);
				var foundSpace = prop === 'Z';

				while (!t.isEndOfText(n)) {
					if (t.isNewline(n)) {
						if (!prefixInput.isEmptyOperation) {
							break;
						}
						var tmp = t.rightPos(n);
						if (t.isNewline(tmp)) {
							n = tmp;
							break;
						}
					}

					n = t.rightPos(n);

					var nextprop = t.charClassAt(n, true);
					if (nextprop === 'Z' && !foundSpace) {
						foundSpace = true;
					}
					else if (nextprop !== 'Z' && foundSpace) {
						break;
					}
				}
			}
		}

		function doWord () {
			for (var i = 0; i < count; i++) {
				var prop = t.charClassAt(n, true);

				while (!t.isEndOfText(n)) {
					if (t.isNewline(n)) {
						if (!prefixInput.isEmptyOperation) {
							break;
						}
						var tmp = t.rightPos(n);
						if (t.isNewline(tmp)) {
							n = tmp;
							break;
						}
					}

					n = t.rightPos(n);

					var nextprop = t.charClassAt(n, true);
					if (prop !== nextprop && nextprop !== 'Z') {
						break;
					}
					prop = nextprop;
				}
			}
		}

		function doBigWordEnd () {
			for (var i = 0; i < count; i++) {
				var prop = t.charClassAt(n, true);
				var startn = n;

				while (!t.isEndOfText(n)) {
					var prevn = n;
					n = t.rightPos(n);

					var nextprop = t.charClassAt(n, true);
					if (prop !== nextprop && nextprop === 'Z' && t.getSelection(startn, n).length > 1) {
						n = prevn;
						break;
					}

					if (t.isNewline(n)) {
						if (!prefixInput.isEmptyOperation) {
							break;
						}
						var tmp = t.rightPos(n);
						if (t.isNewline(tmp)) {
							n = tmp;
							break;
						}
					}

					prop = nextprop;
				}
			}
		}

		function doWordEnd () {
			for (var i = 0; i < count; i++) {
				var prop = t.charClassAt(n, true);
				var startn = n;

				while (!t.isEndOfText(n)) {
					var prevn = n;
					n = t.rightPos(n);

					var nextprop = t.charClassAt(n, true);
					if (prop !== nextprop && prop !== 'Z' && t.getSelection(startn, n).length > 1) {
						n = prevn;
						break;
					}

					if (t.isNewline(n)) {
						if (!prefixInput.isEmptyOperation) {
							break;
						}
						var tmp = t.rightPos(n);
						if (t.isNewline(tmp)) {
							n = tmp;
							break;
						}
					}

					prop = nextprop;
				}
			}
		}

		if (prefixInput.isEmptyOperation || !t.isNewline(n)) {
			if (bigWord) {
				wordEnd ? doBigWordEnd() : doBigWord();
			}
			else {
				wordEnd ? doWordEnd() : doWord();
			}
		}

		t.selectionEnd = n;
		prefixInput.motion = c;
		idealWidthPixels = -1;
		isWordMotion = true;
		return true;
	}
	function motionPrevWord (c, t, count, bigWord) {
		var n = t.selectionStart;
		count || (count = 1);
		n.col <= 0 && n.row <= 0 && requestBell();

		if (bigWord) {
			for (var i = 0; i < count; i++) {
				n = t.leftPos(n);
				var prop = t.charClassAt(n, true);
				var nonSpaceFound = prop !== 'Z';

				while (n.row > 0 || n.col > 0) {
					if (t.isNewline(n) && t.isNewline(t.leftPos(n))) { break; }

					var prevn = n;
					n = t.leftPos(n);
					if (n.eq(prevn)) { break; }

					var nextprop = t.charClassAt(n, true);
					if (nextprop !== 'Z' && !nonSpaceFound) {
						nonSpaceFound = true;
					}
					else if (nextprop === 'Z' && nonSpaceFound) {
						n = prevn;
						break;
					}
					prop = nextprop;
				}
			}
		}
		else {
			for (var i = 0; i < count; i++) {
				n = t.leftPos(n);
				var prop = t.charClassAt(n, true);
				var nonSpaceFound = prop !== 'Z';

				while (n.row > 0 || n.col > 0) {
					if (t.isNewline(n) && t.isNewline(t.leftPos(n))) { break; }

					var prevn = n;
					n = t.leftPos(n);
					if (n.eq(prevn)) { break; }

					var nextprop = t.charClassAt(n, true);
					if (nextprop !== 'Z' && !nonSpaceFound) {
						nonSpaceFound = true;
					}
					else if (prop !== nextprop) {
						n = prevn;
						break;
					}
					prop = nextprop;
				}
			}
		}

		t.selectionStart = n;
		prefixInput.motion = c;
		idealWidthPixels = -1;
		isWordMotion = true;
		return true;
	}
	function motionFindForward (c, t, count, stopBefore) {
		var n = t.selectionEnd;
		count || (count = 1);

		var startn = n.clone();
		var found = true;
		for (var i = 0; i < count; i++) {
			var index = t.rows(n).indexOf(c, n.col + 1);
			if (index >= 0) {
				n.col = index;
			}
			else {
				found = false;
				break;
			}
		}
		if (found) {
			if (stopBefore) {
				n.col--;
			}
			t.selectionEnd = n;
		}
		else {
			requestBell();
		}
		lastHorzFindCommand.direction = 1;
		lastHorzFindCommand.letter = c;
		lastHorzFindCommand.stopBefore = stopBefore;
		idealWidthPixels = -1;
		return true;
	}
	function motionFindBackward (c, t, count, stopBefore) {
		var n = t.selectionStart;
		count || (count = 1);

		var startn = n.clone();
		var found = true;
		for (var i = 0; i < count; i++) {
			var index = t.rows(n).lastIndexOf(c, n.col - 1);
			if (index >= 0) {
				n.col = index;
			}
			else {
				found = false;
				break;
			}
		}
		if (found) {
			if (stopBefore) {
				n.col++;
			}
			t.selectionStart = n;
		}
		else {
			requestBell();
		}
		lastHorzFindCommand.direction = -1;
		lastHorzFindCommand.letter = c;
		lastHorzFindCommand.stopBefore = stopBefore;
		idealWidthPixels = -1;
		return true;
	}
	function motionFindMatchedBracket (c, t, count, closeBracket) {
		function findBracket () {
			var i = 0;
			while (!t.isEndOfText(n) && !t.isNewline(n)) {
				var index = BRACKETS.indexOf(t.charAt(n));
				if (index != -1 && ++i == count) {
					return index;
				}
				n = t.rightPos(n);
			}
			return -1;
		}
		function findMatchForward (current, match) {
			var depth = 0;
			var prevn = n;
			n = t.rightPos(n);
			while (!t.isEndOfText(n) && n.ne(prevn)) {
				switch (t.charAt(n)) {
				case current:
					depth++;
					break;
				case match:
					if (depth == 0) {
						return n;
					}
					else {
						depth--;
					}
					break;
				}
				prevn = n;
				n = t.rightPos(n);
			}
		}
		function findMatchBackward (current, match) {
			var depth = 0;
			var prevn = n;
			n = t.leftPos(n);
			while ((n.row > 0 || n.col >= 0) && n.ne(prevn)) {
				switch (t.charAt(n)) {
				case current:
					depth++;
					break;
				case match:
					if (depth == 0) {
						return n;
					}
					else {
						depth--;
					}
					break;
				}
				prevn = n;
				n = t.leftPos(n);
			}
		}

		count || (count = 1);
		prefixInput.motion = c;

		var n = t.selectionStart;
		var currentIndex;

		if (closeBracket) {
			currentIndex = BRACKETS.indexOf(closeBracket);
			if (currentIndex < BRACKETS.length / 2) {
				currentIndex = -1;
			}
		}
		else {
			currentIndex = findBracket();
		}

		if (currentIndex > -1) {
			var matchChar = BRACKETS.charAt(BRACKETS.length - 1 - currentIndex);
			var result = currentIndex >= BRACKETS.length / 2 ?
				findMatchBackward(BRACKETS.charAt(currentIndex), matchChar) :
				findMatchForward(BRACKETS.charAt(currentIndex), matchChar);
			return result;
		}
	}
	function motionFindByRegexFacade (pattern, t, count, direction, verticalOffset) {
		var result;
		switch (direction) {
		case -1:
			result = motionFindByRegexBackward(pattern, t, count);
			break;
		case 1:
			result = motionFindByRegexForward(pattern, t, count);
			break;
		default:
			return;
		}

		if (result) {
			//isSmoothScrollRequested = true;
			t.extendSelectionTo(result.offset);

			if (verticalOffset != undefined) {
				switch (direction) {
				case -1:
					var n = t.selectionStart;
					n.row = Math.max(0, Math.min(n.row + verticalOffset, t.rowLength - 1));
					t.selectionStart = t.getLineTopOffset2(n);
					break;
				case 1:
					var n = t.selectionEnd;
					n.row = Math.max(0, Math.min(n.row + verticalOffset, t.rowLength - 1));
					t.selectionEnd = t.getLineTopOffset2(n);
					break;
				}
				isVerticalMotion = true;
			}
		}
		else {
			prefixInput.reset();
			requestShowMessage(_('Pattern not found: {0}', pattern), true);
		}
		return true;
	}
	function motionFindByRegexForward (c, t, count, opts) {
		count || (count = 1);
		opts || (opts = regexConverter.getDefaultOption());
		var text = lastRegexFindCommand.text;
		var n = t.binaryPositionToLinearPosition(t.selectionEnd);
		var startn = n;
		var len = 0;
		var regex = getFindRegex(c);
		var wrapped = false;
		var re;
		if (typeof text != 'string') {
			lastRegexFindCommand.text = text = t.value;
		}
		if (regex && regex.source.length) {
			regex.lastIndex = opts.includeCurrentChar ? n : n + 1;
			for (var i = 0; i < count; i++) {
				var loop;
				do {
					loop = false;
					re = regex.exec(text);
					if (re) {
						var newn = regex.lastIndex - re[0].length;
						if (text.charAt(newn) == '\n' && newn - 1 == startn) {
							loop = true;
						}
						else {
							n = newn;
							len = re[0].length;
						}
					}
					else {
						if (opts.wrapscan && !wrapped) {
							wrapped = true;
							regex.lastIndex = 0;
							loop = true;
						}
						else {
							return;
						}
					}
				} while (loop);
			}
		}
		idealWidthPixels = -1;
		wrapped && requestShowMessage(_('Search wrapped'));
		return {offset:n, matchLength:len};
	}
	function motionFindByRegexBackward (c, t, count, opts) {
		count || (count = 1);
		opts || (opts = regexConverter.getDefaultOption());
		var text = lastRegexFindCommand.text;
		var n = t.binaryPositionToLinearPosition(t.selectionStart);
		var len = 0;
		var regex = getFindRegex(c);
		var wrapped = false;
		function getLineTop (n) {
			while (--n >= 0 && text.charCodeAt(n) != 0x0a) {}
			n++;
			return n;
		}
		function leftPos (n) {
			if (n <= 0) { return 0; }
			n--;
			if (text.charCodeAt(n) == 0x0a) { n--; }
			return n;
		}
		function doBackSearch () {
			var result = false;
			while (true) {
				var re;
				var foundAt = -1;
				while ((re = regex.exec(text)) && regex.lastIndex - re[0].length < n) {
					len = re[0].length;
					foundAt = regex.lastIndex - len;
					if (len == 0) {
						regex.lastIndex++;
					}
				}
				if (foundAt >= 0) {
					n = foundAt;
					result = n < startn;
					regex.lastIndex = linetop;
					break;
				}
				else {
					var tmp = getLineTop(leftPos(linetop));
					if (tmp >= linetop) {
					   break;
					}
					else {
					   n = linetop;
					   linetop = tmp;
					   regex.lastIndex = linetop;
					}
				}
			}
			return result;
		}
		if (typeof text != 'string') {
			lastRegexFindCommand.text = text = t.value;
		}
		if (regex && regex.source.length) {
			var startn = n;
			var linetop = getLineTop(n);
			regex.lastIndex = linetop;
			for (var i = 0; i < count; i++) {
				var loop;
				do {
					loop = false;
					if (!doBackSearch()) {
						if (opts.wrapscan && !wrapped) {
							wrapped = true;
							startn = n = text.length;
							linetop = getLineTop(n);
							regex.lastIndex = linetop;
							loop = true;
						}
						else {
							return;
						}
					}
				} while (loop);
			}
		}
		idealWidthPixels = -1;
		wrapped && requestShowMessage(_('Search wrapped'));
		return {offset:n, matchLength:len};
	}
	function motionForwardBlock (c, t, count, regex, isLineOrient) {
		var opts = regexConverter.getDefaultOption();
		opts.wrapscan = false;
		opts.includeCurrentChar = true;

		var result = motionFindByRegexForward(regex, t, count, opts);
		if (result) {
			var n = t.linearPositionToBinaryPosition(result.offset + result.matchLength);
			isLineOrient ?
				t.setSelectionRange(t.getLineTopOffset2(n)) :
				t.extendSelectionTo(n);
			isSmoothScrollRequested = true;
			isVerticalMotion = true;
		}

		return result;
	}
	function motionBackwardBlock (c, t, count, regex, isLineOrient) {

		function doit () {
			var n = t.binaryPositionToLinearPosition(t.selectionStart);
			var result;
			for (var i = 0; i < 2; i++) {
				result = motionFindByRegexBackward(regex, t, 1, opts);
				if (!result) {
					break;
				}
				if (i == 1 || result.offset + result.matchLength < n) {
					t.extendSelectionTo(result.offset + result.matchLength);
					break;
				}
				t.selectionStart = result.offset;
			}
			return result;
		}

		var startn = t.selectionStart;
		var result;
		var opts = regexConverter.getDefaultOption();
		opts.wrapscan = false;

		for (var i = 0; i < count; i++) {
			result = doit();
			if (!result) {
				t.selectionStart = startn;
				break;
			}
		}
		if (result) {
			var n = t.linearPositionToBinaryPosition(result.offset + result.matchLength);
			isLineOrient ?
				t.setSelectionRange(t.getLineTopOffset2(n)) :
				t.extendSelectionTo(n);
			isSmoothScrollRequested = true;
			isVerticalMotion = true;
		}

		return result;
	}
	function motionReplaceOne (c, t, count) {
		count || (count = 1);

		var done = false;
		var n = t.selectionStart;
		if (!t.selected) {
			if (count <= t.getLineTailOffset(n).col - n.col) {
				if (c == '\r' || c == '\n') {
					t.selectionEnd = new Position(n.row, n.col + 1);
					insert(t, '\n' + t.getIndent(n));
				}
				else {
					t.selectionEnd = new Position(n.row, n.col + count);
					insert(t, multiply(c, count));
				}
				done = true;
			}
		}
		else {
			insert(t, multiply(c, t.getSelection(n, t.selectionEnd).length));
			done = true;
		}

		if (done) {
			n = t.selectionStart;
			n.col = Math.max(n.col - 1, 0);
			t.setSelectionRange(n);
		}

		isEditCompleted = true;
		prefixInput.motion = c;
		idealWidthPixels = -1;
		return true;
	}
	function motionUp (c, t, count) {
		var textspan = $('wasavi_singleline_scaler');
		var n = t.selectionStart;

		count || (count = 1);
		refreshIdealWidthPixels(t);
		n.row <= 0 && requestBell();
		n.row = Math.max(n.row - count, 0);

		var width = 0;
		var widthp = 0;
		var line = t.rows(n);
		var index = 0;

		textspan.textContent = '';

		while (index < line.length && !t.isNewline(n.row, index)) {
			textspan.textContent += line.substr(index++, 1);
			width = textspan.offsetWidth;
			if (width >= idealWidthPixels) {
				if (Math.abs(widthp - idealWidthPixels) < Math.abs(width - idealWidthPixels)) {
					index--;
				}
				break;
			}
			widthp = width;
		}
		n.col = index;
		t.selectionStart = n;
		prefixInput.motion = c;
		isVerticalMotion = true;
		return true;
	}
	function motionDown (c, t, count) {
		var textspan = $('wasavi_singleline_scaler');
		var n = t.selectionEnd;

		count || (count = 1);
		refreshIdealWidthPixels(t);
		n.row >= t.rowLength - 1 && requestBell();
		n.row = Math.min(n.row + count, t.rowLength - 1);

		var width = 0;
		var widthp = 0;
		var line = t.rows(n);
		var index = 0;

		textspan.textContent = '';

		while (index < line.length && !t.isNewline(n.row, index)) {
			textspan.textContent += line.substr(index++, 1);
			width = textspan.offsetWidth;
			if (width >= idealWidthPixels) {
				if (Math.abs(widthp - idealWidthPixels) < Math.abs(width - idealWidthPixels)) {
					index--;
				}
				break;
			}
			widthp = width;
		}
		n.col = index;
		t.selectionEnd = n;
		prefixInput.motion = c;
		isVerticalMotion = true;
		return true;
	}
	function scrollView (c, t, count) {
		function down (count) {
			var index = Math.min(v.top + count, t.rowLength - 1);
			var y = Math.min(
				t.rowNodes(index).offsetTop - t.elm.clientTop,
				t.elm.scrollHeight - t.elm.clientHeight
			);

			scroller.run(y, function () {
				var v2 = getCurrentViewPositionIndices(t);
				if (v2.top > t.selectionStartRow) {
					t.setSelectionRange(t.getLineTopOffset2(v2.top, 0));
				}
			});
		}
		function up (count) {
			var index = Math.max(v.top - count, 0);
			var y = Math.max(t.rowNodes(index).offsetTop - t.elm.clientTop, 0);

			scroller.run(y, function () {
				var v2 = getCurrentViewPositionIndices(t);
				if (v2.bottom < t.selectionStartRow) {
					t.setSelectionRange(t.getLineTopOffset2(v2.bottom, 0));
				}
			});
		}
		var v = getCurrentViewPositionIndices(t);
		if (typeof count == 'function') {
			count = count(v);
		}
		if (count != 0) {
			count > 0 ? down(count) : up(-count);
		}
		prefixInput.motion = c;
		return true;
	}

	/*
	 * low-level functions for text modification
	 * ----------------
	 */

	function deleteSelection (t) {
		if (!t.selected && !t.isLineOrientSelection) return 0;

		var result = 0;
		(isEditing() ? $call : editLogger.open).call(editLogger, function () {
			marks.update2(t.selectionStart, function () {
				result = t.deleteRange(function (content) {
					!isEditing() && editLogger.write(
						EditLogger.ITEM_TYPE.DELETE,
						t.selectionStart, content, t.selectionEnd, t.isLineOrientSelection
					);
				});
			});
		});
		return result;
	}
	function insert (t, s, keepPosition) {
		if (s == '') return;

		deleteSelection(t);

		(isEditing() ? $call : editLogger.open).call(editLogger, function () {
			var startn = t.selectionStart;
			!isEditing() && editLogger.write(
				EditLogger.ITEM_TYPE.INSERT, 
				startn, s, keepPosition
			);
			marks.update2(startn, function () {
				var re = s.match(/\n|[^\n]+/g);
				if (!re) return;
				for (var i = 0; i < re.length; i++) {
					switch (re[i]) {
					case '\n':
						isMultilineTextInput(targetElement) && t.divideLine();
						break;

					default:
						t.setSelectionRange(t.insertChars(t.selectionStart, re[i]));
						break;
					}
				}
				isEditCompleted = true;
			});
			keepPosition && t.setSelectionRange(startn);
		});
	}
	function overwrite (t, s, keepPosition) {
		if (s == '') return;

		deleteSelection(t);

		(isEditing() ? $call : editLogger.open).call(editLogger, function () {
			var startn = t.selectionStart;
			editLogger.write(
				EditLogger.ITEM_TYPE.OVERWRITE,
				startn, s, t.rows(startn).substr(startn, s.length)
			);
			marks.update2(startn, function () {
				var re = s.match(/\n|[^\n]+/g);
				if (!re) return;
				for (var i = 0; i < re.length; i++) {
					switch (re[i]) {
					case '\n':
						isMultilineTextInput(targetElement) && t.divideLine();
						break;

					default:
						t.setSelectionRange(t.overwriteChars(t.selectionStart, re[i]));
						break;
					}
				}
				isEditCompleted = true;
			});
			keepPosition && t.setSelectionRange(startn);
		});
	}
	function shift (t, rowCount, shiftCount) {
		rowCount || (rowCount = 1);
		shiftCount || (shiftCount = 1);
		editLogger.open(function () {
			var startn = t.selectionStart;
			editLogger.write(EditLogger.ITEM_TYPE.SHIFT, startn, '', rowCount, shiftCount);
			marks.update2(startn, function () {
				var s = multiply('\t', shiftCount);
				var p1 = new Position(startn.row, 0);
				for (var i = 0; i < rowCount; i++) {
					t.insertChars(p1, s);
					p1.row++;
					p1.col = 0;
				}
			});
			if (rowCount >= config.vars.report) {
				requestShowMessage(_('Shifted {0} {line:0}.', rowCount));
			}
		});
		isEditCompleted = true;
	}
	function unshift (t, rowCount, shiftCount) {
		rowCount || (rowCount = 1);
		shiftCount || (shiftCount = 1);
		editLogger.open(function () {
			var startn = t.selectionStart;
			editLogger.write(EditLogger.ITEM_TYPE.UNSHIFT, startn, '', rowCount, shiftCount);
			marks.update2(startn, function () {
				var s = multiply('\t', shiftCount);
				var p1 = new Position(startn.row, 0);
				var p2 = new Position(startn.row, s.length);
				for (var i = 0; i < rowCount; i++) {
					if (t.rows(p1).indexOf(s) == 0) {
						t.deleteRange(p1, p2);
					}
					p1.row++;
					p2.row++;
				}
			});
			if (rowCount >= config.vars.report) {
				requestShowMessage(_('Unshifted {0} {line:0}.', rowCount));
			}
		});
		isEditCompleted = true;
	}
	function deleteChars (t, count, forward) {
		if (t.selected) {
			deleteSelection(t);
		}
		else {
			count || (count = 1);

			if (forward) {
				var n = t.selectionEnd;
				var tail = t.getLineTailOffset(n);
				n.col = Math.min(tail.col, n.col + count);
				t.selectionEnd = n;
				deleteSelection(t);
			}
			else {
				var n = t.selectionStart;
				n.col = Math.max(0, n.col - count);
				t.selectionStart = n;
				deleteSelection(t);
			}
		}
		isEditCompleted = true;
		return true;
	}
	function joinLines (t, count, asis) {
		count || (count = 1);
		editLogger.open(function () {
			var asisIndex = {index:0};
			for (var i = 0; i < count; i++) {
				if (t.selectionStartRow >= t.rowLength - 1) {return}

				var t1 = t.rows(t.selectionStartRow);
				var t2 = t.rows(t.selectionStartRow + 1);
				var re = asis ? asisIndex : /^\s*/.exec(t2);

				t.selectionStart = new Position(t.selectionStartRow, t1.length);
				t.selectionEnd = new Position(t.selectionStartRow + 1, re.index);
				deleteSelection(t);

				if (asis || /\s+$/.test(t1) || ')]}'.indexOf(t2.charAt(re.index)) >= 0) {
					// do nothing
				}
				else if (/\.!\?$/.test(t1)) {
					insert(t, '  ', true);
				}
				else {
					insert(t, ' ', true);
				}
			}
		});
		isEditCompleted = true;
		return true;
	}
	function toggleCase (t, count) {
		count || (count = 1);

		var n = t.selectionStart;
		var text = t.rows(n);
		var smalla = 'a'.charCodeAt(0);

		count = Math.min(count, text.length - n.col);
		text = text.substring(0, n.col) +
			text.substring(n.col, n.col + count).replace(/[a-z]/ig, function (a) {
				return a.charCodeAt(0) >= smalla ? a.toUpperCase() : a.toLowerCase();
			}) +
			text.substring(n.col + count);
		t.setRow(n, text);
		n.col += count;
		t.setSelectionRange(n);

		isEditCompleted = true;
		return true;
	}
	function yank (t, count, isLineOrient, isWordMotion) {
		var result = 0;
		if (isLineOrient || t.isLineOrientSelection) {
			count || (count = 1);
			result = t.selectRows(count);
			var content = t.getSelectionRows();
			registers.set(prefixInput.register, content, true, true);
		}
		else {
			var content = t.getSelection();
			result = content.length;
			if (isWordMotion) {
				content = content.replace(/^\s+|\s+$/, '');
			}
			registers.set(prefixInput.register, content, false, true);
		}
		return result;
	}
	function paste (t, count, isForward, isForceLineOrient, register) {
		var item = registers.get(register || prefixInput.register);
		var data = item.data;
		var isLineOrient = item.isLineOrient;
		var n = t.selectionStart;
		count || (count = 1);
		item.isLineOrient = isForceLineOrient || item.isLineOrient;

		if (data != '') {
			if (item.isLineOrient) {
				if (t.selected) {
					t.deleteRange();
					t.divideLine();
				}
				else {
					if (isForward) {
						if (n.row >= t.rowLength - 1) {
							t.setSelectionRange(t.getLineTailOffset(n));
							t.divideLine();
							n = t.selectionStart;
						}
						else {
							n.row++;
							n.col = 0;
							t.setSelectionRange(n);
						}
					}
					else {
						n.col = 0;
						t.setSelectionRange(n);
					}
				}
				if (t.selectionStartRow == t.rowLength - 1) {
					data = data.replace(/\n$/, '');
				}
				for (var i = 0; i < count; i++) {
					insert(t, data);
				}
				t.setSelectionRange(t.getLineTopOffset2(n));
			}
			else {
				if (!t.selected && isForward) {
					n = t.rightPos(n);
					t.setSelectionRange(n);
				}
				for (var i = 0; i < count; i++) {
					insert(t, data);
				}
			}
			isEditCompleted = true;
		}
		item.isLineOrient = isLineOrient;
		return true;
	}
	function startEdit (c, t, isAppend, isAlter) {
		if (!t.selected) {
			requestInputMode('edit');

			var n;
			switch ((isAppend ? 2 : 0) + (isAlter ? 1 : 0)) {
				case 0:// insert
					n = t.selectionStart;
					break;
				case 1:// insert at top
					n = t.getLineTopOffset2(t.selectionStart);
					break;
				case 2:// append
					n = t.selectionEnd;
					n.col = Math.min(n.col + 1, t.rows(n).length);
					break;
				case 3:// append at tail
					n = t.getLineTailOffset(t.selectionEnd);
					break;
			}
			t.setSelectionRange(n);
			cursor.ensureVisible();
			cursor.update({type:'edit'});
			config.vars.showmode && requestShowMessage(_('--INSERT--'));
			prefixInput.operation = c;
			prefixInput.isLocked = true;
			editedString = '';
			editStartPosition = t.selectionStart;
			return false;
		}
		else {
			inputEscape();
		}
	}
	function openLine (c, t, after) {
		var n, isTopOfText = false;
		if (after) {
			t.selectionStart = n = t.selectionEnd;
		}
		else {
			n = t.getLineTopOffset(t.selectionStart);
			if (n.row == 0 && n.col == 0) {
				isTopOfText = true;
			}
			else {
				n = t.leftPos(n);
				t.setSelectionRange(n);
			}
		}
		if (isTopOfText) {
			t.setSelectionRange(new Position(0, 0));
			insert(t, '\n', true);
		}
		else {
			var indent = config.vars.autoindent ? t.getIndent(t.selectionStart) : '';
			n = t.getLineTailOffset(n);
			t.setSelectionRange(n);
			insert(t, '\n' + indent);
		}
		isEditCompleted = true;
		return startEdit(c, t, false, false);
	}

	/*
	 * ex command functions
	 * ----------------
	 */

	function exParseRange (t, s, requiredCount, allowZeroAddress) {
		var rows = [];
		var ss = t.selectionStart;
		var error = false;
		var re;

		if ((re = /^[ \t]*%/.exec(s))) {
			rows.push(0, t.rowLength - 1);
			s = s.substring(re[0].length);
		}
		else {
			while (true) {
				s = s.replace(/^[ \t]+/, '');

				var found = false;
				var regexSpecified = false;

				if (s.charAt(0) == '.') {
					rows.push(t.selectionStartRow);
					s = s.substring(1);
					found = true;
				}
				else if (s.charAt(0) == '$') {
					rows.push(t.rowLength - 1);
					s = s.substring(1);
					found = true;
				}
				else if ((re = /^\d+/.exec(s))) {
					var n = re[0] - 1;
					if (n < 0) {
						n = allowZeroAddress ? -1 : 0;
					}
					rows.push(n);
					s = s.substring(re[0].length);
					found = true;
				}
				else if ((re = /^'([a-z`'])/.exec(s))) {
					var mark = marks.get(re[1]);
					if (mark == undefined) {
						error = true;
						break;
					}
					else {
						rows.push(mark.row);
						s = s.substring(re[0].length);
						found = true;
					}
				}
				else if ((re = /^\/((?:\\\/|[^\/])*)\//.exec(s))) {
					var regex = getFindRegex(re[1]);
					if (!regex) {
						error = _('Invalid regex pattern.');
						break;
					}
					else {
						regexSpecified = true;
						lastRegexFindCommand.push({direction:1});
						lastRegexFindCommand.setPattern(re[1]);

						var result = motionFindByRegexForward(regex, t, 1);
						if (result) {
							rows.push(t.linearPositionToBinaryPosition(result.offset).row);
							s = s.substring(re[0].length);
							found = true;
						}
						else {
							error = _('Pattern not found: {0}', re[1]);
							break;
						}
					}
				}
				else if ((re = /^\?((?:\\\?|[^?])*)\?/.exec(s))) {
					var regex = getFindRegex(re[1]);
					if (!regex) {
						error = _('Invalid regex pattern.');
						break;
					}
					else {
						regexSpecified = true;
						lastRegexFindCommand.push({direction:-1});
						lastRegexFindCommand.setPattern(re[1]);

						var result = motionFindByRegexBackward(regex, t, 1);
						if (result) {
							rows.push(t.linearPositionToBinaryPosition(result.offset));
							s = s.substring(re[0].length);
							found = true;
						}
						else {
							error = _('Pattern not found: {0}', re[1]);
							break;
						}
					}
				}
				else if ((re = /^[\+\-]\d+/.exec(s))) {
					rows.push(t.selectionStartRow + parseInt(re[0], 10));
					s = s.substring(re[0].length);
					found = true;
				}

				if (found) {
					if ((re = /^[\+\-]\d*/.exec(s))) {
						var offset = parseInt(re[0], 10) || (/^\+/.test(re[0]) ? 1 : -1);
						rows[rows.length - 1] += offset;
						if (regexSpecified) {
							lastRegexFindCommand.verticalOffset = offset;
						}
						s = s.substring(re[0].length);
					}

					if (rows[rows.length - 1] < 0) {
						rows[rows.length - 1] = allowZeroAddress ? -1 : 0;
					}
					if (rows[rows.length - 1] >= t.rowLength) {
						rows[rows.length - 1] = t.rowLength - 1;
					}

					s = s.replace(/^[ \t]+/, '');
				}

				if (s.charAt(0) == ',') {
					s = s.substring(1);
					!found && rows.push(t.selectionStartRow);
				}
				else if (s.charAt(0) == ';') {
					t.setSelectionRange(new Position(rows[rows.length - 1], 0));
					s = s.substring(1);
					!found && rows.push(t.selectionStartRow);
				}
				else {
					break;
				}
			}
		}

		rows.last = function (t, count, isGlobal) {
			var result = [];
			count = Math.min(count, 2);
			if (count == 1) {
				if (this.length >= 1) {
					result = [this[this.length - 1]];
				}
				else {
					result = [t.selectionStartRow];
				}
			}
			else if (count == 2) {
				if (this.length >= 2) {
					result = [ this[this.length - 2], this[this.length - 1] ];
				}
				else if (this.length == 1) {
					result = [ this[0], this[0] ];
				}
				else {
					if (isGlobal) {
						result = [0, t.rowLength - 1];
					}
					else {
						result = [ t.selectionStartRow, t.selectionStartRow ];
					}
				}
				if (result[1] < result[0]) {
					return _('The second address is smaller than the first.');
				}
			}
			result.specifiedAddresses = Math.min(this.length, 2);
			return result;
		};

		t.setSelectionRange(ss);

		return error || {
			rows: requiredCount == undefined ? rows : rows.last(t, requiredCount),
			rest: s
		};
	}
	function exGlobal (t, a) {
		var r = a.range;
		var inverted = !!a.flags.force;
		var pattern = a.argv[0];
		var command = a.argv[1];

		if (pattern == '') {
			if (!registers.exists('/') || (pattern = registers.get('/').data) == '') {
				return _('No previous search pattern.');
			}
		}
		else {
			lastRegexFindCommand.push({direction:1});
			lastRegexFindCommand.setPattern(pattern);
			registers.set('/', lastRegexFindCommand.pattern);
		}
		pattern = getFindRegex(pattern);

		// initialize text
		var textPreLength;
		var text;
		var rg = document.createRange();
		rg.setStartBefore(t.rowNodes(0));
		rg.setEndBefore(t.rowNodes(r[0]));
		textPreLength = rg.toString().length;

		rg.setStartBefore(t.rowNodes(r[0]));
		rg.setEndAfter(t.rowNodes(r[1]));
		text = rg.toString();
		if (r[1] == t.rowLength - 1 && text.substr(-1) == '\n') {
			text = text.substring(0, text.length - 1);
		}
		rg.detach();
		rg = null;

		// pass 1
		var re;
		var items = [];
		var prevOffset;
		var prevRow;
		var nullNewline = {length:0};
		pattern.lastIndex = 0;
		if (inverted) {
			var rangeStartRow = t.indexOf(t.rowNodes(r[0]));
			re = pattern.exec(text);
			if (re) {
				var pos = pattern.lastIndex - re[0].length;
				var row, delta;
				row = t.linearPositionToBinaryPosition(pos + textPreLength).row;
				items.push(row - rangeStartRow);
				prevOffset = pos;
				prevRow = row;

				while ((re = pattern.exec(text))) {
					pos = pattern.lastIndex - re[0].length;
					delta = (text.substring(prevOffset, pos).match(/\n/g) || nullNewline).length;
					row = prevRow + delta;
					delta && items.push(row - rangeStartRow);
					prevOffset = pos;
					prevRow = row;
				}

				var tmp = [];
				for (var i = r[0]; i < r[1]; i++) {
					tmp.push(t.rowNodes(i));
				}
				for (var i = items.length - 1; i >= 0; i--) {
					delete tmp[items[i]];
				}
				items = tmp;
			}
		}
		else {
			re = pattern.exec(text);
			if (re) {
				var pos = pattern.lastIndex - re[0].length;
				var row, delta;
				row = t.linearPositionToBinaryPosition(pos + textPreLength).row;
				items.push(t.rowNodes(row));
				prevOffset = pos;
				prevRow = row;

				while ((re = pattern.exec(text))) {
					pos = pattern.lastIndex - re[0].length;
					delta = (text.substring(prevOffset, pos).match(/\n/g) || nullNewline).length;
					row = prevRow + delta;
					delta && items.push(t.rowNodes(row));
					prevOffset = pos;
					prevRow = row;
				}
			}
		}

		// pass 2
		try {
			for (var i = 0, goal = items.length; i < goal; i++) {
				if (items[i].parentNode) {
					t.setSelectionRange(new Position(t.indexOf(items[i]), 0));
					var result = executeExCommand(t, command);
					if (typeof result == 'string') {
						return result;
					}
				}
				else {
					delete items[i];
					i--;
					goal--;
				}
			}
		}
		finally {
			t.setSelectionRange(t.getLineTopOffset2(t.selectionStart));
		}
	}
	function exSetMark (t, a) {
		var name = a.argv[0];
		if (name.length > 1) {
			return _('Mark names must be a single character.');
		}
		marks.set(name, new Position(a.range[0], 0));
	}
	function exCopy (t, a) {
		var rg = document.createRange();
		rg.setStartBefore(t.rowNodes(a.range[0]));
		rg.setEndAfter(t.rowNodes(a.range[1]));
		var f = rg.cloneContents();
		var dest = a.lineNumber;
		marks.update2(new Position(dest, 0), function () {
			dest < 0 ?
				rg.setStartBefore(t.rowNodes(0)) :
				rg.setStartAfter(t.rowNodes(dest));
			rg.insertNode(f);
		});
		rg.detach();
		t.setSelectionRange(t.getLineTopOffset2(dest + (r[1] - r[0]) + 1, 0));
		isEditCompleted = true;
	}
	function exQuit (isForce) {
		if (isForce) {
			writeOnTermination = false;
			terminated = true;
		}
		else {
			if (isTextDirty) {
				return _('The text has been modified; use :quit! to discard any changes.');
			}
			else {
				terminated = true;
			}
		}
	}
	function exWrite (t, a, isForce, isAppend, target) {
		target = (target || '').replace(/^\s+|\s+$/g, '');

		if (target == '') {
			if (isAppend) {
				return _('Element id to be written doesn\'t specified.');
			}
			target = targetElement;
		}

		target = $(target);
		if (!target) {
			return _('Specified element is invalid.');
		}
		if (!isMultilineTextInput(target) && !isSinglelineTextInput(target)) {
			return _('Specified element is not editable.');
		}
		if (isForce) {
			target.readOnly = false;
			config.setData('noreadonly');
		}
		else {
			if (config.vars.readonly && target == targetElement) {
				return _('readonly option is set (use "!" to override).');
			}
			if (target.readOnly) {
				return _('Element to be written has readonly attribute (use "!" to override).');
			}
		}

		var orient = t.isLineOrientSelection;
		var ss = t.selectionStart;
		var se = t.selectionEnd;
		try {
			t.isLineOrientSelection = true;
			t.selectionStart = new Position(a.range[0], 0);
			t.selectionEnd = new Position(a.range[1], 0);

			var content = t.getSelection();
			if (a.range[1] == t.rowLength - 1) {
				content = content.replace(/\n$/, '');
			}
			if (isAppend) {
				if (target.value == '') {
					target.value = content;
				}
				else {
					target.value = target.value + '\n' + content;
				}
			}
			else {
				target.value = content;
			}
			if (a.range[0] == 0 && a.range[1] == t.rowLength - 1 && target == targetElement) {
				isTextDirty = false;
			}
		}
		finally {
			t.isLineOrientSelection = orient;
			t.selectionStart = ss;
			t.selectionEnd = se;
		}
	}
	function exExecuteRegister (t, a) {
		var register = a.flags.register ? a.register : '@';
		if (!registers.isReadable(register)) {
			return _('Invalid register name: {0}', register);
		}
		if (!registers.exists(register)) {
			return _('Register {0} is empty.', register);
		}
		t.setSelectionRange(new Position(a.range[0], 0));
		var command = register.get(register).data;
		var result = executeExCommand(command);
		if (typeof result == 'string') {
			return result;
		}
		registers.set('@', command, true);
	}
	function executeExCommand (t, source) {
		// @see http://pubs.opengroup.org/onlinepubs/9699919799/utilities/ex.html#tag_20_40_13_03

		var resultMessage;
		var lastTerminator;
		var commandName = '';
		var commandArg = '';
		var commandArgSups;
		var commandObj = null;
		var range = null;

		function getRegex (delimiter) {
			delimiter = '\\u' + ('000' + delimiter.charCodeAt(0).toString(16)).substr(-4);
			return new RegExp('\\n|' + delimiter, 'g');
		}

		function skipblank () {
			var re = /^[ \t]+/.exec(source);
			if (re) {
				commandArg += re[0];
				source = source.substring(re[0].length);
			}
		}
		function skipto (regex, opts) {
			opts || (opts = {});
			var escapeChars = opts.escapeChars || '\\';
			var discard = opts.discard;
			var re = regex.exec(source);
			if (re) {
				do {
					var index = regex.lastIndex - re[0].length;
					if (index == 0 || escapeChars.indexOf(source.charAt(index - 1)) < 0) {
						if (!discard) {
							if (commandArgSups) {
								commandArgSups.push(source.substring(0, index));
							}
							else {
								commandArg += source.substring(0, index);
							}
						}
						source = source.substring(index);
						return;
					}
				} while ((re = regex.exec(source)));
			}
			if (!discard) {
				commandArg = source;
			}
			source = '';
		}

		function skipto2 (regex, delimiter) {
			var escapeChars = '\\';
			var re = regex.exec(source);
			var found = 0;
			var fragmentStart = 0;
			if (re) {
				do {
					var index = regex.lastIndex - re[0].length;
					if (index == 0 || escapeChars.indexOf(source.charAt(index - 1)) < 0) {
						found++;
						commandArgSups.push(source.substring(fragmentStart, index));
						fragmentStart = regex.lastIndex;
						if (re[0] == '\n' || re[0] == delimiter && found == 2) {
							source = source.substring(index);
							return;
						}
					}
				} while ((re = regex.exec(source)));
			}
			commandArg = source;
			source = '';
		}

		function run () {
			var r;
			if (commandObj.rangeCount == 0) {
				if (range.rows.length) {
					resultMessage = _('{0}: extra range specified.', commandObj.name);
					return false;
				}
				r = [];
			}
			else {
				r = range.rows.last(t, commandObj.rangeCount, commandObj.flags.addr2All);
				if (typeof r == 'string') {
					resultMessage = r;
					return false;
				}
				if (!commandObj.flags.addrZero) {
					r = r.map(function (o) {
						return Math.max(0, o);
					});
				}
			}

			var result = commandObj.run(t, r, commandArg, commandArgSups);
			if (result.error) {
				resultMessage = result.error || _('{0}: unknown error.', commandObj.name);
				return false;
			}
			else if (result.flags.hash || result.flags.list || result.flags.print) {
				var n = Math.max(0, Math.min(t.selectionStartRow + result.flagoff, t.rowLength - 1));
				t.setSelectionRange(t.getLineTopOffset2(n, 0));
				exPrintRow(t, n.row, n.row, result.flags);
			}

			return true;
		}

		if (/[\\\u0016]$/.test(source)) {
			source = source.substring(0, source.length - 1);
		}
		if (!/\n$/.test(source)) {
			source += '\n';
		}

		while (source.length) {
			commandName = commandArg = '';
			commandObj = null;

			// 1. Leading <colon> characters shall be skipped.
			// 2. Leading <blank> characters shall be skipped.
			source = source.replace(/^[: \t]+/, '');

			// 3. If the leading character is a double-quote character, the characters up to and
			// including the next non- <backslash>-escaped <newline> shall be discarded, and any
			// subsequent characters shall be parsed as a separate command.
			if (/^"/.test(source)) {
				skipto(/\n/g, {discard:true});
				lastTerminator = source.charAt(0);
				source = source.substring(1);
				continue;
			}

			// 4. Leading characters that can be interpreted as addresses shall be evaluate;
			// see Addressing in ex
			// (http://pubs.opengroup.org/onlinepubs/9699919799/utilities/ex.html#tag_20_40_13_02).
			range = exParseRange(t, source, undefined, true);
			if (typeof range == 'string') {
				resultMessage = range;
				break;
			}
			source = range.rest;

			// 5. Leading <blank> characters shall be skipped.
			source = source.replace(/^[: \t]+/, '');

			// 6. If the next character is a <vertical-line> character or a <newline>:
			//
			//	 a. If the next character is a <newline>:
			//
			//	   i. If ex is in open or visual mode, the current line shall be set to the last
			//	   address specified, if any.
			//
			//	   ii. Otherwise, if the last command was terminated by a <vertical-line> character,
			//	   no action shall be taken; for example, the command "||<newline>" shall execute
			//	   two implied commands, not three.
			//
			//	   iii. Otherwise, step 6.b. shall apply.
			//
			//	 b. Otherwise, the implied command shall be the print command. The last #, p, and l
			//	 flags specified to any ex command shall be remembered and shall apply to this
			//	 implied command. Executing the ex number, print, or list command shall set the
			//	 remembered flags to #, nothing, and l, respectively, plus any other flags
			//	 specified for that execution of the number, print, or list command.
			//
			//	 If ex is not currently performing a global or v command, and no address or count
			//	 is specified, the current line shall be incremented by 1 before the command is
			//	 executed. If incrementing the current line would result in an address past the
			//	 last line in the edit buffer, the command shall fail, and the increment shall not
			//	 happen.
			//
			//	 c. The <newline> or <vertical-line> character shall be discarded and any
			//	 subsequent characters shall be parsed as a separate command.
			if (source.charAt(0) == '|' || source.charAt(0) == '\n') {
				switch (source.charAt(0)) {
				case '\n':
					if (range && range.rows.length) {
						commandObj = exCommandDefault;
					}
					else if (lastTerminator == undefined || lastTerminator == '|') {
						break;
					}
					/* FALLTHRU */

				case '|':
					commandObj = exCommandDefault;
					break;
				}

				lastTerminator = source.charAt(0);
				source = source.substring(1);

				if (commandObj && !run()) {
					break;
				}

				continue;
			}

			// 7. The command name shall be comprised of the next character (if the character
			// is not alphabetic), or the next character and any subsequent alphabetic characters
			// (if the character is alphabetic), with the following exceptions:
			//
			//	 a. Commands that consist of any prefix of the characters in the command name
			//	 delete, followed immediately by any of the characters 'l' , 'p' , '+' , '-' , or
			//	 '#' shall be interpreted as a delete command, followed by a <blank>, followed by
			//	 the characters that were not part of the prefix of the delete command. The maximum
			//	 number of characters shall be matched to the command name delete; for example,
			//	 "del" shall not be treated as "de" followed by the flag l.
			//
			//	 b. Commands that consist of the character 'k' , followed by a character that can
			//	 be used as the name of a mark, shall be equivalent to the mark command followed
			//	 by a <blank>, followed by the character that followed the 'k' .
			//
			//	 c. Commands that consist of the character 's' , followed by characters that could
			//	 be interpreted as valid options to the s command, shall be the equivalent of the
			//	 s command, without any pattern or replacement values, followed by a <blank>,
			//	 followed by the characters after the 's' .
			if (/^[a-z]/i.test(source)) {
				if (/^(?:k\s*[a-zA-Z]|s\s*[^a-zA-Z \\|\n"])/.test(source)) {
					commandName = source.charAt(0);
					source = source.substring(1);
				}
				else {
					var re = /^[a-z]+/i.exec(source);
					commandName = re[0];
					source = source.substring(re[0].length);
				}
			}
			else {
				commandName = source.charAt(0);
				source = source.substring(1);
			}

			// 8.The command name shall be matched against the possible command names, and a
			// command name that contains a prefix matching the characters specified by the user
			// shall be the executed command. In the case of commands where the characters
			// specified by the user could be ambiguous, the executed command shall be as
			// follows:
			//
			//	 a:  append    n:  next    t:  t
			//	 c:  change    p:  print   u:  undo
			//	 ch: change    pr: print   un: undo
			//	 e:  edit	   r:  read    v:  v
			//	 m:  move	   re: read    w:  write
			//	 ma: mark	   s:  s
			//
			// Implementation extensions with names causing similar ambiguities shall not be
			// checked for a match until all possible matches for commands specified by
			// POSIX.1-2008 have been checked.
			for (var i = 0; i < exCommands.length; i++) {
				if (commandName.indexOf(exCommands[i].shortName) == 0
				&&	exCommands[i].name.indexOf(commandName) == 0) {
					for (var j = 0; j < exCommands[i].name.length; j++) {
						if (commandName.charCodeAt(j) != exCommands[i].name.charCodeAt(j)) {
							source = commandName.substring(j) + source;
							break;
						}
					}
					commandObj = exCommands[i];
					commandName = exCommands[i].name;
					break;
				}
			}

			// 9. (wasavi supports neither '!' nor 'read' command)

			// 10. Otherwise, if the command is an edit, ex, or next command, or a visual command
			// while in open or visual mode, the next part of the command shall be parsed as
			// follows:
			//
			//	 a. Any '!' character immediately following the command shall be skipped and be
			//	 part of the command.
			//
			//	 b. Any leading <blank> characters shall be skipped and be part of the command.
			//
			//	 c. If the next character is a '+' , characters up to the first non- <backslash>-
			//	 escaped <newline> or non- <backslash>-escaped <blank> shall be skipped and be part
			//	 of the command.
			//
			//	 d. The rest of the command shall be determined by the steps specified in paragraph
			//	 12.
			if (/^(?:edit|ex|next|visual)$/.test(commandName)) {
				if (source.charAt(0) == '!') {
					commandArg += source.charAt(0);
					source = source.substring(1);
				}
				skipblank();
				if (source.charAt(0) == '+') {
					skipto(/[\n \t]/g);
				}
				paragraph12();
			}

			// 11. Otherwise, if the command is a global, open, s, or v command, the next part of
			// the command shall be parsed as follows:
			//
			//	 a. Any leading <blank> characters shall be skipped and be part of the command.
			//
			//	 b. If the next character is not an alphanumeric, double-quote, <newline>,
			//	 <backslash>, or <vertical-line> character:
			//
			//	   i. The next character shall be used as a command delimiter.
			//
			//	   ii. If the command is a global, open, or v command, characters up to the first
			//	   non- <backslash>-escaped <newline>, or first non- <backslash>-escaped delimiter
			//	   character, shall be skipped and be part of the command.
			//
			//	   iii. If the command is an s command, characters up to the first non- <backslash>
			//	   -escaped <newline>, or second non- <backslash>-escaped delimiter character,
			//	   shall be skipped and be part of the command.
			//
			//	 c. If the command is a global or v command, characters up to the first non-
			//	 <backslash>-escaped <newline> shall be skipped and be part of the command.
			//
			//	 d. Otherwise, the rest of the command shall be determined by the steps specified
			//	 in paragraph 12.
			else if (/^(?:global|open|s|v)$/.test(commandName)) {
				skipblank();
				if (/^(?:[^a-zA-Z"\n\\|])/.test(source)) {
					var delimiter = source.charAt(0);
					commandArgSups = [];
					source = source.substring(1);

					if (commandName != 's') {
						skipto(getRegex(delimiter));
					}
					else {
						skipto2(getRegex(delimiter), delimiter);
					}
					if (source.charAt(0) == delimiter) {
						source = source.substring(1);
					}
				}
				if (/^(?:global|v)$/.test(commandName)) {
					if (exGlobalSpecified) {
						requestShowMessage(
							_('Cannot use the global or v command recursively.'),
							true);
						break;
					}
					exGlobalSpecified = true;
					skipto(/\n/g);
					lastTerminator = source.charAt(0);
					source = source.substring(1);
				}
				else {
					paragraph12();
				}
			}

			// 12. Otherwise:
			//
			//	 a. If the command was a map, unmap, abbreviate, or unabbreviate command,
			//	 characters up to the first non- <control>-V-escaped <newline>, <vertical-line>,
			//	 or double-quote character shall be skipped and be part of the command.
			//
			//	 b. Otherwise, characters up to the first non- <backslash>-escaped <newline>,
			//	 <vertical-line>, or double-quote character shall be skipped and be part of the
			//	 command.
			//
			//	 c. If the command was an append, change, or insert command, and the step 12.b.
			//	 ended at a <vertical-line> character, any subsequent characters, up to the next
			//	 non- <backslash>-escaped <newline> shall be used as input text to the command.
			//
			//	 d. If the command was ended by a double-quote character, all subsequent
			//	 characters, up to the next non- <backslash>-escaped <newline>, shall be discarded.
			//
			//	 e. The terminating <newline> or <vertical-line> character shall be discarded and
			//	 any subsequent characters shall be parsed as a separate ex command.
			else {
				function paragraph12 () {
					if (/^(?:map|unmap|abbreviate|unabbreviate)$/.test(commandName)) {
						skipto(/[\n|"]/g, {escapeChars:'\u0016'});
					}
					else {
						skipto(/[\n|"]/g);
					}
					if (/^(?:append|change|insert)$/.test(commandName) && source.charAt(0) == '|') {
						skipto(/\n/g);
					}
					if (source.charAt(0) == '"') {
						skipto(/\n/g, {discard:true});
					}
					if (commandName == 'print' && commandArg == '') {
						commandArg = 'p';
					}
					lastTerminator = source.charAt(0);
					source = source.substring(1);
				}
				paragraph12();
			}

			// execute...
			if (commandObj && !run()) {
				break;
			}
			if (!commandObj && commandName != '') {
				resultMessage = _('{0}: unknown command.', commandName);
				break;
			}
		}
		return resultMessage;
	}
	function exPrintRow (t, from, to, flags) {
		if (flags.hash) {
			for (var i = from; i <= to; i++) {
				var line = ('     ' + (i + 1)).substr(-6) + '  ' + t.rows(i);
				backlog.push(line);
			}
		}
		else if (flags.list) {
			for (var i = from; i <= to; i++) {
				var line = toVisibleString(t.rows(i));
				backlog.push(line);
			}
		}
		else if (flags.print) {
			for (var i = from; i <= to; i++) {
				var line = t.rows(i);
				backlog.push(line);
			}
		}
	}

	/*
	 * variables
	 * ----------------
	 */

	// persistent variables

	var exrc = '';
	var exGlobalSpecified = false;
	var substituteWorker;
	var exCommandDefault = new ExCommand('$default', '$default', 'ca1', 2, function (t, a) {
		exPrintRow(t, a.range[0], a.range[1], a.flags);
		t.setSelectionRange(t.getLineTopOffset2(new Position(a.range[1], 0)));
		a.flags.hash = a.flags.list = a.flags.print = false;
	});
	var exCommands = [
		new ExCommand('abbreviate', 'ab', 'W', 0, function (t, a) {
			switch (a.argv.length) {
			case 0:
				var maxWidth = 0;
				var count = 0;
				for (var i in abbrevs) {
					if (i.length > maxWidth) {
						maxWidth = i.length;
					}
					count++;
				}
				if (count) {
					var list = [_('*** abbreviations ***')];
					for (var i in abbrevs) {
						list.push(
							i + multiply(' ', maxWidth - i.length) +
							'	' + toVisibleString(abbrevs[i])
						);
					}
					list.sort();
					backlog.push(list);
				}
				else {
					backlog.push(_('no abbreviations are defined.'));
				}
				break;

			case 2:
				var rhs = a.argv[0];
				var lhs = a.argv[1];
				if (!config.vars.iskeyword.test(rhs.substr(-1))) {
					return _('The keyword of abbreviation must end with a word character.');
				}
				abbrevs[rhs] = lhs;
				break;
			}
		}),
		new ExCommand('copy', 'co', 'l1', 2 | EXFLAGS.printDefault, function (t, a) {
			return exCopy.apply(this, arguments);
		}),
		new ExCommand('delete', 'd', 'bca1', 2 | EXFLAGS.printDefault, function (t, a) {
			var r = a.range;
			var rg = document.createRange();
			rg.setStartBefore(t.rowNodes(r[0]));
			rg.setEndAfter(t.rowNodes(r[1]));
			registers.set(a.flags.register ? a.register : '', rg.toString(), true, true);
			marks.update2(new Position(r[0], 0), function () {
				rg.deleteContents();
			});
			rg.detach();
			if (t.rowLength == 0) {
				var div = t.elm.appendChild(document.createElement('div'));
				div.appendChild(document.createTextNode('\n'));
			}
			var deleted = r[1] - r[0] + 1;
			if (deleted >= config.vars.report) {
				requestShowMessage(_('Deleted {0} {line:0}.', deleted));
			}
			var n = new Position(Math.min(r[0], t.rowLength - 1), 0);
			t.setSelectionRange(t.getLineTopOffset2(n));
			isEditCompleted = true;
		}),
		new ExCommand('global', 'g', '!s', 2 | EXFLAGS.addr2All, function (t, a) {
			return exGlobal(t, a);
		}),
		new ExCommand('join', 'j', '!ca1', 2 | EXFLAGS.printDefault, function (t, a) {
			var r = a.range;
			r[1] += r[0] == r[1] ? 1 : 0;
			r[1] = Math.min(r[1], t.rowLength - 1);
			t.setSelectionRange(new Position(r[0], 0));
			joinLines(t, r[1] - r[0] + 1, a.flags.force);
			t.setSelectionRange(t.getLineTopOffset2(r[0], 0));
			isEditCompleted = true;
		}),
		new ExCommand('k', 'k', 'w1r', 1, function (t, a) {
			return exSetMark(t, a);
		}),
		new ExCommand('map', 'map', '!W', 0, function (t, a) {
			var mapName = a.flags.force ?  _('edit') : _('command');
			if (a.argv.length != 2) {
				var map = mapManager.getMap(mapName).toArray();
				var maxWidth = 0;
				if (map.length) {
					map.map(function (o) {
						if (o[0].length > maxWidth) {
							maxWidth = o[0].length;
						}
					});
					var list = [_('*** {0} mode map ***', mapName)];
					map.map(function (o) {
						list.push(
							o[0] + multiply(' ', maxWidth - o[0].length) +
							'	' + toVisibleString(o[1]));
					});
					backlog.push(list);
				}
				else {
					backlog.push(_('no mappings for {0} mode are defined.', mapName));
				}
			}
			else {
				var lhs = a.argv[0];
				var rhs = a.argv[1];

				// reject some mappings: :, <escape>, <nl>
				if (!a.flags.force && /^[:\u001b\u000a]$/.test(lhs)) {
					return _('Key {0} cannot be remapped.', toVisibleString(lhs));
				}

				mapManager.getMap(mapName).register(lhs, rhs);
			}
		}),
		new ExCommand('mark', 'ma', 'w1r', 1, function (t, a) {
			return exSetMark(t, a);
		}),
		new ExCommand('marks', 'marks', '', 0, function (t, a) {
			backlog.push(marks.dump());
		}),
		new ExCommand('move', 'm', 'l', 2 | EXFLAGS.printDefault, function (t, a) {
			var r = a.range;
			var dest = a.lineNumber;
			if (dest >= r[0] && dest < r[1]) {
				return _('Destination is in inside source.');
			}
			if (dest == r[1]) {
				return;
			}

			var rg = document.createRange();
			rg.setStartBefore(t.rowNodes(r[0]));
			rg.setEndAfter(t.rowNodes(r[1]));
			var f = rg.cloneContents();
			marks.update2(new Position(dest, 0), function () {
				var rg2 = document.createRange();
				dest < 0 ?
					rg2.setStartBefore(t.rowNodes(0)) :
					rg2.setStartAfter(t.rowNodes(dest));
				rg2.insertNode(f);
				rg2.detach();
				rg.deleteContents();
			});
			rg.detach();

			var row = dest;
			if (dest < r[0]) {
				row += r[1] - r[0] + 1;
			}
			t.setSelectionRange(t.getLineTopOffset2(row, 0));
			isEditCompleted = true;
		}),
		new ExCommand('print', 'p', 'ca1', 2 | EXFLAGS.clearFlag, function (t, a) {
			return exCommandDefault.handler.apply(this, arguments);
		}),
		new ExCommand('put', 'pu', 'b', 1 | EXFLAGS.printDefault | EXFLAGS.addrZero | EXFLAGS.addrZeroDef, function (t, a) {
			t.setSelectionRange(new Position(Math.max(0, a.range[0]), 0));
			paste( t, 1, a.range[0] >= 0, true,
				a.flags.register ? a.register : null);
			t.setSelectionRange(t.getLineTopOffset2(t.selectionStart, 0));
			isEditCompleted = true;
		}),
		new ExCommand('quit', 'q', '!', 0, function (t, a) {
			return exQuit(a.flags.force);
		}),
		new ExCommand('redo', 'r', '', 0, function (t, a) {
			var result = editLogger.redo();
			if (result === false) {
				requestBell();
				return _('No redo item.');
			}
			else {
				requestShowMessage(
					_('{0} {operation:0} have executed again.', result));
			}
		}),
		new ExCommand('s', 's', 's', 2, function (t, a) {
			return (new SubstituteWorker).run(t, a.range, a.argv[0], a.argv[1], a.argv[2]);
		}),
		new ExCommand('&', '&', 's', 2, function (t, a) {
			return (new SubstituteWorker).run(t, a.range, '', '~', a.argv[0]);
		}),
		new ExCommand('~', '~', 's', 2, function (t, a) {
			var pattern;
			if (!registers.exists('/') || (pattern = registers.get('/').data) == '') {
				return _('No previous search pattern.');
			}
			return (new SubstituteWorker).run(t, a.range, pattern, '~', a.argv[0]);
		}),
		new ExCommand('set', 'se', 'wN', 0, function (t, a) {
			var messages;
			var logToConsole = false;
			var emphasis = false;
			if (a.argv.length == 0) {
				messages = config.dump();
				logToConsole = true;
			}
			else if (a.argv.some(function (o) { return o == 'all';})) {
				messages = config.dump(true);
				logToConsole = true;
			}
			else {
				messages = [];
				for (var i = 0; i < a.argv.length; i++) {
					var arg = a.argv[i];
					var re = /^([^=? \t]+)[ \t]*([=?])/.exec(arg) || ['', arg, ''];
					var info = config.getInfo(re[1]);
					if (!info) {
						messages.push(_('Unknown option: {0}', re[1]));
						emphasis = true;
						continue;
					}
					if (re[2] == '?') {
						messages.push(config.getData(re[1], true));
					}
					else if (i + 1 < a.argv.length && a.argv[i + 1] == '?') {
						messages.push(config.getData(re[1], true));
						i++;
					}
					else {
						var result = config.setData(
							re[1],
							re[2] == '=' ? arg.substring(re[1].length + 1) : undefined);
						if (typeof result == 'string') {
							messages.push(result);
							emphasis = true;
						}
					}
				}
				if (messages.length == 1) {
					messages = messages[0];
				}
				else {
					logToConsole = true;
				}
			}
			if (logToConsole) {
				backlog.push(messages);
			}
			else {
				requestShowMessage(messages, emphasis);
			}
		}),
		new ExCommand('sushi', 'sushi', '', 0, function (t, a) {
			requestShowMessage('Whassup?');
		}),
		new ExCommand('registers', 'reg', '', 0, function (t, a) {
			backlog.push(registers.dump());
		}),
		new ExCommand('to', 't', 'l1', 2 | EXFLAGS.printDefault, function (t, a) {
			return exCopy(t, a);
		}),
		new ExCommand('unabbreviate', 'una', 'w1r', 0, function (t, a) {
			var lhs = a.argv[0];
			if (!(lhs in abbrevs)) {
				return _('{0} is not an abbreviation.', lhs);
			}
			delete abbrevs[lhs];
		}),
		new ExCommand('undo', 'u', '', 0, function (t, a) {
			var result = editLogger.undo();
			if (result === false) {
				requestBell();
				return _('No undo item.');
			}
			else {
				requestShowMessage(
					_('{0} {operation:0} have canceled.', result));
			}
		}),
		new ExCommand('unmap', 'unm', '!w1r', 0, function (t, a) {
			var mapName = a.flags.force ?  _('edit') : _('command');
			var lhs = a.argv[0];
			var map = mapManager.getMap(mapName);
			if (!map.isMapped(lhs)) {
				return _('{0} is not mapped.', lhs);
			}
			map.remove(lhs);
		}),
		new ExCommand('version', 'ver', '', 0, function (t, a) {
			requestShowMessage('wasavi/' + VERSION + ' ' + VERSION_DESC);
		}),
		new ExCommand('vglobal', 'v', 's', 2 | EXFLAGS.addr2All, function (t, a) {
			a.flags.force = true;
			return exGlobal(t, a);
		}),
		new ExCommand('write', 'w', '!s', 2 | EXFLAGS.addr2All | EXFLAGS.addrZeroDef, function (t, a) {
			var re = /^\s*(>>)?\s*(.*)/.exec(a.argv[0] || '');
			return exWrite(t, a, !!a.flags.force, re[1] == '>>', re[2]);

		}),
		new ExCommand('wq', 'wq', '!s', 2 | EXFLAGS.addr2All | EXFLAGS.addrZeroDef, function (t, a) {
			var re = /^\s*(>>)?\s*(.*)/.exec(a.argv[0] || '');
			var result = exWrite(t, a, !!a.flags.force, re[1] == '>>', re[2]);
			return typeof result == 'string' ? result : exQuit();
		}),
		new ExCommand('xit', 'x', '!s', 2 | EXFLAGS.addr2All | EXFLAGS.addrZeroDef, function (t, a) {
			if (isTextDirty) {
				var result = exWrite(t, a, !!a.flags.force, false, a.argv[0]);
				return typeof result == 'string' ? result : exQuit();
			}
			else {
				return exQuit(!!a.flags.force);
			}
		}),
		new ExCommand('yank', 'ya', 'bca', 2 | EXFLAGS.addr2, function (t, a) {
			var r = a.range;
			var rg = document.createRange();
			rg.setStartBefore(t.rowNodes(r[0]));
			rg.setEndAfter(t.rowNodes(r[1]));
			registers.set(a.flags.register ? a.register : '', rg.toString(), true, true);
			rg.detach();
			var yanked = r[1] - r[0] + 1;
			if (yanked >= config.vars.report) {
				requestShowMessage(_('Yanked {0} {line:0}.', yanked));
			}
		}),
		new ExCommand('>', '>', 'mca1', 2, function (t, a) {
			t.setSelectionRange(new Position(a.range[0], 0));
			shift(t, a.range[1] - a.range[0] + 1, a.argv[0].length);
			t.setSelectionRange(t.getLineTopOffset2(a.range[1], 0));
		}),
		new ExCommand('<', '<', 'mca1', 2, function (t, a) {
			t.setSelectionRange(new Position(a.range[0], 0));
			unshift(t, a.range[1] - a.range[0] + 1, a.argv[0].length);
			t.setSelectionRange(t.getLineTopOffset2(a.range[1], 0));
		}),
		new ExCommand('@', '@', 'b', 1, function (t, a) {
			return exExecuteRegister(t, a);
		}),
		new ExCommand('*', '*', 'b', 1, function (t, a) {
			return exExecuteRegister(t, a);
		})
	].sort(function (a, b) { return a.name.length - b.name.length; });

	var injectKeyevents = false;
	var registers = new Registers;
	var regexConverter = new RegexConverter;
	var mapManager = new MapManager;
	var bell = new Bell;
	var textBlockRegex = new TextBlockRegex();
	var abbrevs = {};
	var config = new Configurator(
		[
			/* defined by POSIX */
			new VariableItem('autoindent', 'b', true),    // O
			new VariableItem('autoprint', 'b', true),     // not used
			new VariableItem('autowrite', 'b', false),    // not used
			new VariableItem('beautify', 'b', false),     // not used
			new VariableItem('directory', 's', '/tmp/'),  // not used
			new VariableItem('edcompatible', 'b', false), // not used
			new VariableItem('errorbells', 'b', false),   // O
			new VariableItem('exrc', 'b', false),         // not used
			new VariableItem('ignorecase', 'b', true),    // O
			new VariableItem('list', 'b', false),         // not used
			new VariableItem('magic', 'b', true),         // O
			new VariableItem('mesg', 'b', true),          // not used
			new VariableItem('number', 'b', false),
			new VariableItem('paragraphs', 's', 'IPLPPPQPP LIpplpipbp', function (v) {
				textBlockRegex.setParagraphMacros(v);
				return v;
			}),                                           // O
			new VariableItem('prompt', 'b', true),        // O
			new VariableItem('readonly', 'b', false),     // O
			new VariableItem('redraw', 'b', true),        // not used
			new VariableItem('remap', 'b', true),         // not used
			new VariableItem('report', 'i', 5),           // O
			new VariableItem('scroll', 'i', 0),           // O
			new VariableItem('sections', 's', 'NHSHH HUnhsh', function (v) {
				textBlockRegex.setSectionMacros(v);
				return v;
			}),                                           // O
			new VariableItem('shell', 's', '/bin/sh'),    // not used
			new VariableItem('shiftwidth', 'i', 8),
			new VariableItem('showmatch', 'b', true),     // O
			new VariableItem('showmode', 'b', true),      // O
			new VariableItem('slowopen', 'b', false),     // not used
			new VariableItem('tabstop', 'i', 8),
			new VariableItem('taglength', 'i', 0),        // not used
			new VariableItem('tags', 's', 'tags'),        // not used
			new VariableItem('term', 's', 'dom'),         // not used
			new VariableItem('terse', 'b', false),        // not used
			new VariableItem('warn', 'b', true),          // not used
			new VariableItem('window', 'i', 24),
			new VariableItem('wrapmargin', 'i', 0),
			new VariableItem('wrapscan', 'b', true),      // O
			new VariableItem('writeany', 'b', false),     // not used

			/* defined by wasavi */
			new VariableItem('modelinehue', 'i', -1),     // O
			new VariableItem('smooth', 'b', true),        // O
			new VariableItem('bellvolume', 'i', 25),      // O
			new VariableItem('history', 'i', 20),         // O
			new VariableItem('monospace', 'i', 20),       // O

			/* defined by vim */
			new VariableItem('iskeyword', 'r', '^[a-zA-Z0-9_]+$'), // O
			new VariableItem('searchincr', 'b', true),             // O
			new VariableItem('smartcase', 'b', true),              // O
			new VariableItem('undolevels', 'i', 20, function (v) {
				if (editLogger) {
					editLogger.logMax = v;
				}
				return v;
			}),                                           // O

			/* defined by nvi */
			//new VariableItem('altwerase', 'b', false),
			//new VariableItem('backup', 's', ''),
			//new VariableItem('cdpath', 's', ':'),
			//new VariableItem('cedit', 's', ''),
			//new VariableItem('columns', 'i',	80),
			//new VariableItem('combined', 'b', false),
			//new VariableItem('comment', 'b', false),
			//new VariableItem('escapetime', 'i', 6),
			//new VariableItem('extended', 'b', false),
			//new VariableItem('filec', 's', ''),
			//new VariableItem('fileencoding', 's', ''),
			//new VariableItem('flash', 'b', true),
			//new VariableItem('hardtabs', 'i', 0),
			//new VariableItem('iclower', 'b', false),
			//new VariableItem('inputencoding', 's', ''),
			//new VariableItem('keytime', 'i', 6),
			//new VariableItem('leftright', 'b', false),
			//new VariableItem('lines', 'i', 25),
			//new VariableItem('lisp', 'b', false),
			//new VariableItem('lock', 'b', true),
			new VariableItem('matchtime', 'i', 5),
			//new VariableItem('modeline', 'b', false),
			//new VariableItem('msgcat', 's', '/usr/share/vi/catalog/'),
			//new VariableItem('noprint', 's', ''),
			//new VariableItem('octal', 'b', false),
			//new VariableItem('open', 'b', true),
			//new VariableItem('optimize', 'b', true),
			//new VariableItem('path', 's', ''),
			//new VariableItem('print', 's', ''),
			//new VariableItem('recdir', 's', '/var/tmp/vi.recover'),
			//new VariableItem('ruler', 'b', false),
			//new VariableItem('secure', 'b', false),
			//new VariableItem('shellmeta', 's', '~{[*?$`\'"\\'),
			//new VariableItem('sidescroll', 'i', 16),
			//new VariableItem('sourceany', 'b', false),
			//new VariableItem('tildeop', 'b', false),
			//new VariableItem('timeout', 'b', true),
			//new VariableItem('ttywerase', 'b', false),
			//new VariableItem('verbose', 'b', false),
			//new VariableItem('w1200', 'i', 0),
			//new VariableItem('w300', 'i', 0),
			//new VariableItem('w9600', 'i', 0),
			//new VariableItem('windowname', 'b', false),
			//new VariableItem('wraplen', 'i', 0),
		],
		{
			'ai':   'autoindent',		'ap':  'autoprint',		'aw':   'autowrite',
			'bf':   'beautify',			'co':  'columns',		'dir':  'tmp_directory',
			'eb':   'errorbells',		'ed':  'edcompatible',	'ex':   'exrc',
			'fe':   'fileencoding',		'ht':  'hardtabs',		'ic':   'ignorecase',
			'ie':   'inputencoding',	'li':  'lines',			'modelines': 'modeline',
			'nu':   'number',			'opt': 'optimize',		'para': 'paragraphs',
			're':   'redraw',			'ro':  'readonly',		'scr':  'scroll',
			'sect': 'sections',			'sh':  'shell',			'slow': 'slowopen',
			'sm':   'showmatch',		'smd': 'showmode',		'sw':   'shiftwidth',
			'tag':  'tags',				'tl':  'taglength',		'to':   'timeout',
			'ts':   'tabstop',			'tty': 'term',			'ttytype': 'term',
			'ul':   'undolevels',		'w':   'window',		'wa':   'writeany',
			'wi':   'window',			'wl':   'wraplen',		'wm':   'wrapmargin',
			'ws':   'wrapscan'
		}
	);
	var enableList = {
		enableTextArea: true,
		enableText: false,
		enableSearch: false,
		enableTel: false,
		enableUrl: false,
		enableEmail: false,
		enablePassword: false,
		enableNumber: false
	};
	var lineInputHistories = new LineInputHistories(config.vars.history, ['/', ':']);

	// instance variables
	var targetElement;
	var terminated;
	var writeOnTermination;
	var marks;
	var cursor;
	var scroller;
	var editLogger;
	var runLevel;
	var state;
	var prefixInput;
	var inputModeStack;
	var inputMode;
	var inputModeSub;
	var editStartPosition;
	var editedString;
	var requestedState;
	var lineHeight;
	var idealWidthPixels;
	var backlog;
	var pairBracketsIndicator;

	var isTextDirty;
	var isEditCompleted;
	var isVerticalMotion;
	var isWordMotion;
	var isSmoothScrollRequested;
	var isReadonlyWarned;

	var lastKeyCode;
	var lastSimpleCommand;
	var lastHorzFindCommand;
	var lastRegexFindCommand;
	var lastSubstituteInfo;

	/*
	 * editor functions mapping
	 * ----------------
	 */

	var commandMap = {
		// escape
		'\u001b': inputEscape,

		// digits
		'1': inputDigit, '2': inputDigit, '3': inputDigit, '4': inputDigit, '5': inputDigit,
		'6': inputDigit, '7': inputDigit, '8': inputDigit, '9': inputDigit,

		// register specifier
		'"': {
			'command': function (c, t) {
				if (prefixInput.isEmpty) {
					inputModeSub = 'wait-register';
					prefixInput.register = c;
					requestShowPrefixInput(_('{0}: register (a-z,A-Z,1-9)', keyName(c)));
				}
				else {
					inputEscape();
				}
			},
			'wait-register': function (c, t) {
				prefixInput.appendRegister(c);
				requestShowPrefixInput();
			}
		},

		/*
		 * operators
		 */

		'c': {
			'command': operationDefault,
			'@op': function (c, t) {
				if (c == prefixInput.operation || isVerticalMotion) {
					t.isLineOrientSelection = true;
					yank(t, prefixInput.count);
					editLogger.open();
					var rowLength = t.rowLength;
					var deleted = deleteSelection(t);
					if (deleted >= config.vars.report) {
						requestShowMessage(_('Changing {0} {line:0}.', deleted));
					}
					insert(t, t.getBackIndent(t.selectionStart));
					t.isLineOrientSelection = false;
					if (t.rowLength + deleted == rowLength) {
						insert(t, '\n', true);
					}
					prefixInput.motion = c;
				}
				else {
					yank(t, prefixInput.count);
					deleteSelection(t);
				}
				isEditCompleted = true;
				requestSimpleCommandUpdate();
				return startEdit(c, t, false, false);
			}
		},
		'd': {
			'command': operationDefault,
			'@op': function (c, t) {
				var isLineOrient = c == prefixInput.operation || isVerticalMotion;
				t.isLineOrientSelection = isLineOrient;
				yank(t, prefixInput.count);
				var deleted = deleteSelection(t);
				if (isLineOrient) {
					t.setSelectionRange(t.getLineTopOffset2(t.selectionStart));
					if (deleted >= config.vars.report) {
						requestShowMessage(_('Deleted {0} {line:0}.', deleted));
					}
				}
				isEditCompleted = true;
				prefixInput.motion = c;
				requestSimpleCommandUpdate();
			}
		},
		'y': {
			'command': operationDefault,
			'@op': function (c, t) {
				var isLineOrient = c == prefixInput.operation || isVerticalMotion;
				var n = t.selectionStart;
				t.isLineOrientSelection = isLineOrient;
				var yanked = yank(t, prefixInput.count);
				if (isLineOrient && yanked >= config.vars.report) {
					requestShowMessage(_('Yanked {0} {line:0}.', yanked));
				}
				t.setSelectionRange(n);
				prefixInput.motion = c;
				requestSimpleCommandUpdate();
			}
		},
		'C': function (c, t) {
			if (prefixInput.isEmptyOperation) {
				t.selectionEnd = t.getLineTailOffset(t.selectionEnd);
				deleteSelection(t);
				requestSimpleCommandUpdate();
				return startEdit(c, t, false, false);
			}
			else {
				inputEscape();
			}
		},
		'D': function (c, t) {
			if (prefixInput.isEmptyOperation) {
				t.selectionEnd = t.getLineTailOffset(t.selectionEnd);
				deleteSelection(t);
				if (t.isNewline(t.selectionStart)) {
					var n = t.leftPos(t.selectionStart);
					if (n != t.selectionStart && !t.isNewline(n)) {
						t.setSelectionRange(n);
					}
				}
				isEditCompleted = true;
				prefixInput.operation = c;
				requestSimpleCommandUpdate();
				return true;
			}
			else {
				inputEscape();
			}
		},
		'Y': function (c, t) {
			if (prefixInput.isEmptyOperation) {
				var n = t.selectionStart;
				t.isLineOrientSelection = true;
				var yanked = yank(t, prefixInput.count);
				if (yanked >= config.vars.report) {
					requestShowMessage(_('Yanked {0} {line:0}.', yanked));
				}
				t.setSelectionRange(n);
				prefixInput.motion = c;
				requestSimpleCommandUpdate();
				return true;
			}
			else {
				inputEscape();
			}
		},
		'r': {
			'command': function (c, t) {
				if (prefixInput.isEmptyOperation) {
					prefixInput.motion = c;
					inputModeSub = 'wait-a-letter';
					requestShowPrefixInput(_('{0}: replace a char', keyName(c)));
					requestSimpleCommandUpdate();
				}
				else {
					inputEscape();
				}
			},
			'wait-a-letter': function (c, t) {
				if (c != '\u001b') {
					motionReplaceOne(c, t, prefixInput.count);
				}
				return true;
			}
		},
		'a': function (c, t) {
			if (prefixInput.isEmptyOperation) {
				requestSimpleCommandUpdate();
				return startEdit(c, t, true);
			}
			else {
				inputEscape();
			}
		},
		'A': function (c, t) {
			if (prefixInput.isEmptyOperation) {
				requestSimpleCommandUpdate();
				return startEdit(c, t, true, true);
			}
			else {
				inputEscape();
			}
		},
		'i': function (c, t) {
			if (prefixInput.isEmptyOperation) {
				requestSimpleCommandUpdate();
				return startEdit(c, t, false);
			}
			else {
				inputEscape();
			}
		},
		'I': function (c, t) {
			if (prefixInput.isEmptyOperation) {
				requestSimpleCommandUpdate();
				return startEdit(c, t, false, true);
			}
			else {
				inputEscape();
			}
		},
		'o': function (c, t) {
			if (prefixInput.isEmptyOperation) {
				requestSimpleCommandUpdate();
				return openLine(c, t, true);
			}
			else {
				inputEscape();
			}
		},
		'O': function (c, t) {
			if (prefixInput.isEmptyOperation) {
				requestSimpleCommandUpdate();
				return openLine(c, t, false);
			}
			else {
				inputEscape();
			}
		},
		'R': function (c, t) {
			if (prefixInput.isEmptyOperation && !t.selected) {
				requestInputMode('edit-overwrite');
				cursor.update({type:'edit-overwrite'});
				config.vars.showmode && requestShowMessage(_('--OVERWRITE--'));
				prefixInput.operation = c;
				prefixInput.isLocked = true;
				editedString = '';
				requestSimpleCommandUpdate();
			}
			else {
				inputEscape();
			}
		},
		// equivalents to :& (repeat last executed :s)
		'&': function (c, t) {
			if (prefixInput.isEmptyOperation) {
				var range = [];
				range.push(t.selectionStartRow);
				range.push(range[0] + prefixInput.count - 1);
				(new SubstituteWorker).run(t, range, '', '~', '');
				return true;
			}
			else {
				inputEscape();
			}
		},
		// S: substitute text for whole lines (equivalents to cc)
		'S': function (c, t) {
			if (prefixInput.isEmptyOperation) {
				prefixInput.operation = c;
				return this['c']['@op'].apply(this, arguments);
			}
			else {
				inputEscape();
			}
		},
		// s: substitute characters
		's': function (c, t) {
			if (prefixInput.isEmptyOperation) {
				deleteChars(t, prefixInput.count, true);
				requestSimpleCommandUpdate();
				return startEdit(c, t, false, false);
			}
			else {
				inputEscape();
			}
		},
		// equivalents to :x
		//	 ZZ
		'Z': {
			'command': function (c, t) {
				if (prefixInput.isEmptyOperation) {
					prefixInput.operation = c;
					inputModeSub = 'wait-a-letter';
					requestShowPrefixInput();
				}
				else {
					inputEscape();
				}
			},
			'wait-a-letter': function (c, t) {
				if (c == prefixInput.operation) {
					terminated = true;
					return true;
				}
				else {
					inputEscape();
				}
			},
			'@op': function (c, t) {
				prefixInput.appendOperation(c);
			}
		},
		// unshift
		'<': {
			'command': operationDefault,
			'@op': function (c, t) {
				var count = Math.min(t.selectionEndRow + prefixInput.count, t.rowLength) -
					t.selectionStartRow;
				unshift(t, count);
				t.setSelectionRange(t.selectionStart);
				isVerticalMotion = true;
				prefixInput.motion = c;
				requestSimpleCommandUpdate();
			}
		},
		// shift
		'>': {
			'command': operationDefault,
			'@op': function (c, t) {
				var count = Math.min(t.selectionEndRow + prefixInput.count, t.rowLength) -
					t.selectionStartRow;
				shift(t, count);
				t.setSelectionRange(t.selectionStart);
				isVerticalMotion = true;
				prefixInput.motion = c;
				requestSimpleCommandUpdate();
			}
		},

		/*
		 * motions
		 */

		// backwards lines, to first non-white character
		'-': function (c, t) {
			var n = t.selectionStart;
			n.row = Math.max(n.row - prefixInput.count, 0);
			t.selectionStart = t.getLineTopOffset2(n);
			isVerticalMotion = true;
			prefixInput.motion = c;
			return true;
		},
		'+': function (c, t) {
			var n = t.selectionEnd;
			n.row = Math.min(n.row + prefixInput.count, t.rowLength - 1);
			t.selectionEnd = t.getLineTopOffset2(n);
			isVerticalMotion = true;
			prefixInput.motion = c;
			return true;
		},
		// jump to fist non-blank position on current line
		'^': function (c, t) {
			return motionLineStart(c, t, false);
		},
		'<home>': function (c, t) {
			return this['^'].apply(this, arguments);
		},
		// jump to end of line
		'$': function (c, t) {
			if (t.selectionStartRow + prefixInput.count - 1 >= t.rowLength) {
				return inputEscape();
			}
			if (prefixInput.count > 1) {
				motionDown(c, t, prefixInput.count - 1);
			}
			return motionLineEnd(c, t);
		},
		'<end>': function (c, t) {
			return this['$'].apply(this, arguments);
		},
		// jump to matching <, (, {, or [
		'%': function (c, t) {
			var result = motionFindMatchedBracket(c, t, prefixInput.count);
			if (result) {
				t.extendSelectionTo(result);
				idealWidthPixels = -1;
				isSmoothScrollRequested = true;
				if (!prefixInput.isEmptyOperation) {
					t.selectionEnd = t.rightPos(t.selectionEnd);
				}
				return true;
			}
			else {
				inputEscape();
			}
		},
		// direct jump to specified column
		'|': function (c, t) {
			var n = t.selectionStart;
			n.col = Math.min(prefixInput.count - 1, t.rows(n).length);
			t.extendSelectionTo(n);
			prefixInput.motion = c;
			idealWidthPixels = -1;
			return true;
		},
		// invert of last find
		',': function (c, t) {
			prefixInput.motion = c;
			lastHorzFindCommand.direction *= -1;
			switch (lastHorzFindCommand.direction) {
			case -1:
				return motionFindBackward(
					lastHorzFindCommand.letter,
					t, 1,
					lastHorzFindCommand.stopBefore);
			case 1:
				return motionFindForward(
					lastHorzFindCommand.letter,
					t, 1,
					lastHorzFindCommand.stopBefore);
			}
		},
		// repeat last find
		';': function (c, t) {
			prefixInput.motion = c;
			switch (lastHorzFindCommand.direction) {
			case -1:
				return motionFindBackward(
					lastHorzFindCommand.letter,
					t, prefixInput.count,
					lastHorzFindCommand.stopBefore);
			case 1:
				return motionFindForward(
					lastHorzFindCommand.letter,
					t, prefixInput.count,
					lastHorzFindCommand.stopBefore);
			}
		},
		// down, line orient
		'_': function (c, t) {
			if (t.selectionStartRow + prefixInput.count - 1 >= t.rowLength) {
				return inputEscape();
			}
			if (prefixInput.count > 1) {
				motionDown(c, t, prefixInput.count - 1);
				t.selectionEnd = t.getLineTopOffset2(t.selectionEnd);
			}
			isVerticalMotion = true;
			return true;
		},
		// search forward
		'/': {
			'command': function (c, t) {
				prefixInput.motion = c;
				lineInputHistories.defaultName = '/';
				requestInputMode('line-input', '', c);
				lastRegexFindCommand.push({
					head: c,
					direction: 1,
					offset: t.selectionStart,
					scrollTop: t.scrollTop,
					scrollLeft: t.scrollLeft
				});
			},
			'line-input': function (c, t) {
				var pattern;
				if (c != '') {
					lastRegexFindCommand.setPattern(c, true);
					registers.set('/', lastRegexFindCommand.pattern, false);
					pattern = lastRegexFindCommand.pattern;
				}
				else {
					if (!registers.exists('/') || (pattern = registers.get('/').data) == '') {
						requestShowMessage(_('No previous search pattern.'), true);
						return true;
					}
				}
				lineInputHistories.push(pattern);
				return motionFindByRegexFacade(
					pattern, t, prefixInput.count, 1, lastRegexFindCommand.verticalOffset);
			},
			'@line-input-notify': function (c, t) {
				if (config.vars.searchincr) {
					lastRegexFindCommand.setPattern(c, true);
					var r = motionFindByRegexForward(lastRegexFindCommand.pattern, t, 1);
					if (r) {
						cursor.update({visible:false});
						t.setSelectionRange(r.offset, r.offset + r.matchLength);
						t.emphasis(r.offset, r.matchLength);
						cursor.ensureVisible();
					}
				}
			},
			'@line-input-reset': function (c, t) {
				t.unEmphasis();
				t.setSelectionRange(lastRegexFindCommand.offset);
				t.scrollTop = lastRegexFindCommand.scrollTop;
				t.scrollLeft = lastRegexFindCommand.scrollLeft;
			},
			'@line-input-escape': function (c, t) {
				t.unEmphasis();
				t.setSelectionRange(lastRegexFindCommand.offset);
				t.scrollTop = lastRegexFindCommand.scrollTop;
				t.scrollLeft = lastRegexFindCommand.scrollLeft;
				cursor.update({visible:true});
				cursor.ensureVisible();
			}
		},
		// search backward
		'?': {
			'command': function (c, t) {
				prefixInput.motion = c;
				lineInputHistories.defaultName = '/';
				requestInputMode('line-input', '', c);
				lastRegexFindCommand.push({
					head: c,
					direction: -1,
					offset: t.selectionStart,
					scrollTop: t.scrollTop,
					scrollLeft: t.scrollLeft
				});
			},
			'line-input': function (c, t) {
				var pattern;
				if (c != '') {
					lastRegexFindCommand.setPattern(c, true);
					registers.set('/', lastRegexFindCommand.pattern, false);
					pattern = lastRegexFindCommand.pattern;
				}
				else {
					if (!registers.exists('/') || (pattern = registers.get('/').data) == '') {
						requestShowMessage(_('No previous search pattern.'), true);
						return true;
					}
				}
				lineInputHistories.push(pattern);
				return motionFindByRegexFacade(
					pattern, t, prefixInput.count, -1, lastRegexFindCommand.verticalOffset);
			},
			'@line-input-notify': function (c, t) {
				if (config.vars.searchincr) {
					lastRegexFindCommand.setPattern(c, true);
					var r = motionFindByRegexBackward(lastRegexFindCommand.pattern, t, 1);
					if (r) {
						cursor.update({visible:false});
						t.setSelectionRange(r.offset, r.offset + r.matchLength);
						t.emphasis(r.offset, r.matchLength);
						cursor.ensureVisible();
					}
				}
			},
			'@line-input-reset': function (c, t) {
				t.unEmphasis();
				t.setSelectionRange(lastRegexFindCommand.offset);
				t.scrollTop = lastRegexFindCommand.scrollTop;
				t.scrollLeft = lastRegexFindCommand.scrollLeft;
			},
			'@line-input-escape': function (c, t) {
				t.unEmphasis();
				t.setSelectionRange(lastRegexFindCommand.offset);
				t.scrollTop = lastRegexFindCommand.scrollTop;
				t.scrollLeft = lastRegexFindCommand.scrollLeft;
				cursor.update({visible:true});
				cursor.ensureVisible();
			}
		},
		// return to line specified by following mark, first white position on line, line orient motion
		"'": {
			'command': function (c, t) {
				prefixInput.motion = c;
				inputModeSub = 'wait-a-letter';
				requestShowPrefixInput(_('{0}: return to mark', keyName(c)));
			},
			'wait-a-letter': function (c, t) {
				prefixInput.appendMotion(c);
				var offset = marks.get(c);
				if (offset != undefined) {
					t.extendSelectionTo(t.getLineTopOffset2(offset));
					isVerticalMotion = true;
					isSmoothScrollRequested = true;
					idealWidthPixels = -1;
					return true;
				}
				else {
					inputEscape();
					requestShowMessage(_('Mark {0} is not set.', c), true);
				}
			}
		},
		// return to marked line at remembered column, character orient motion
		'`': {
			'command': function (c, t) {
				prefixInput.motion = c;
				inputModeSub = 'wait-a-letter';
				requestShowPrefixInput(_('{0}: return to mark', keyName(c)));
			},
			'wait-a-letter': function (c, t) {
				prefixInput.appendMotion(c);
				var offset = marks.get(c);
				if (offset != undefined) {
					t.extendSelectionTo(offset);
					isSmoothScrollRequested = true;
					return true;
				}
				else {
					inputEscape();
					requestShowMessage(_('Mark {0} is not set.', c), true);
				}
			}
		},
		// back an sentence
		'(': function (c, t) {
			prefixInput.motion = c;
			motionBackwardBlock(
				c, t, prefixInput.count,
				textBlockRegex.sentenceBackward
			);
			return true;
		},
		// forward an sentence
		')': function (c, t) {
			prefixInput.motion = c;
			motionForwardBlock(
				c, t, prefixInput.count,
				textBlockRegex.sentenceForward
			);
			return true;
		},
		// back an paragraph
		'{': function (c, t) {
			prefixInput.motion = c;
			motionBackwardBlock(
				c, t, prefixInput.count,
				textBlockRegex.paragraphBackward,
				prefixInput.isEmptyOperation
			);
			return true;
		},
		// forward an paragraph
		'}': function (c, t) {
			prefixInput.motion = c;
			motionForwardBlock(
				c, t, prefixInput.count,
				textBlockRegex.paragraphForward,
				prefixInput.isEmptyOperation
			);
			return true;
		},
		// move to previous section
		'[': {
			'command': function (c, t) {
				prefixInput.motion = c;
				inputModeSub = 'wait-a-letter';
				requestShowPrefixInput();
			},
			'wait-a-letter': function (c, t) {
				if (c == prefixInput.motion) {
					prefixInput.appendMotion(c);
					motionBackwardBlock(
						c, t, prefixInput.count,
						textBlockRegex.sectionBackward,
						prefixInput.isEmptyOperation
					);
					return true;
				}
				else {
					inputEscape();
				}
			}
		},
		// move to next section
		']': {
			'command': function (c, t) {
				prefixInput.motion = c;
				inputModeSub = 'wait-a-letter';
				requestShowPrefixInput();
			},
			'wait-a-letter': function (c, t) {
				if (c == prefixInput.motion) {
					prefixInput.appendMotion(c);
					motionForwardBlock(
						c, t, prefixInput.count,
						textBlockRegex.sectionForward,
						prefixInput.isEmptyOperation
					);
					return true;
				}
				else {
					inputEscape();
				}
			}
		},
		'\u000d'/*enter*/: function (c, t) {
			return this['+'].apply(this, arguments);
		},
		'0': function (c, t) {
			if (prefixInput.count1 == '' && prefixInput.count2 == '') {
				return motionLineStart(c, t, true);
			}
			else {
				return inputDigit(c, t);
			}
		},
		'j': function (c, t) {
			return motionDown(c, t, prefixInput.count);
		},
		'\u000e'/*^N*/: function (c, t) {
			return this['j'].apply(this, arguments);
		},
		'<down>': function (c, t) {
			return this['j'].apply(this, arguments);
		},
		'k': function (c, t) {
			return motionUp(c, t, prefixInput.count);
		},
		'\u0010'/*^P*/: function (c, t) {
			return this['k'].apply(this, arguments);
		},
		'<up>': function (c, t) {
			return this['k'].apply(this, arguments);
		},
		'h': function (c, t) {
			return motionLeft(c, t, prefixInput.count);
		},
		'<left>': function (c, t) {
			return this['h'].apply(this, arguments);
		},
		'\u0008'/*^H*/: function (c, t) {
			return this['h'].apply(this, arguments);
		},
		'l': function (c, t) {
			return motionRight(c, t, prefixInput.count);
		},
		' ': function (c, t, e) {
			return this[e.shiftKey ? 'h' : 'l'].apply(this, arguments);
		},
		'<right>': function (c, t) {
			return this['l'].apply(this, arguments);
		},
		'w': function (c, t) {
			if (prefixInput.operation == 'c') {
				motionNextWord(c, t, prefixInput.count, false, true);
				return t.isNewline(t.selectionEnd) ? true : motionRight('', t);
			}
			else {
				return motionNextWord(c, t, prefixInput.count, false);
			}
		},
		'W': function (c, t) {
			if (prefixInput.operation == 'c') {
				motionNextWord(c, t, prefixInput.count, true, true);
				return motionRight('', t);
			}
			else {
				return motionNextWord(c, t, prefixInput.count, true);
			}
		},
		'b': function (c, t) {
			return motionPrevWord(c, t, prefixInput.count, false);
		},
		'B': function (c, t) {
			return motionPrevWord(c, t, prefixInput.count, true);
		},
		'e': function (c, t) {
			return motionNextWord(c, t, prefixInput.count, false, true);
		},
		'E': function (c, t) {
			return motionNextWord(c, t, prefixInput.count, true, true);
		},
		'g': {
			'command': function (c, t) {
				prefixInput.motion = c;
				inputModeSub = 'wait-a-letter';
				requestShowPrefixInput(keyName(c));
			},
			'wait-a-letter': function (c, t) {
				var result = false;
				switch (c) {
				case 'g':
					var count = prefixInput.count;
					var n = new Position(count - 1, 0);
					t.setSelectionRange(t.getLineTopOffset2(n));

					var node = t.rowNodes(n);
					var viewHeightHalf = parseInt((t.elm.clientHeight - lineHeight) / 2)
					scroller.run(Math.max(0, node.offsetTop - viewHeightHalf));

					isVerticalMotion = true;
					idealWidthPixels = -1;
					prefixInput.appendMotion(c);
					result = true;
					break;
				}
				return result;
			}
		},
		'H': function (c, t) {
			var v = getCurrentViewPositionIndices(t);
			var index = Math.min(v.top + prefixInput.count - 1, v.bottom);
			t.extendSelectionTo(t.getLineTopOffset2(index, 0));
			isVerticalMotion = true;
			idealWidthPixels = -1;
			prefixInput.motion = c;
			return true;
		},
		'M': function (c, t) {
			var v = getCurrentViewPositionIndices(t);
			var index = parseInt((v.top + v.bottom) / 2);
			t.extendSelectionTo(t.getLineTopOffset2(index, 0));
			isVerticalMotion = true;
			idealWidthPixels = -1;
			prefixInput.motion = c;
			return true;
		},
		'L': function (c, t) {
			var v = getCurrentViewPositionIndices(t);
			var index = Math.max(v.bottom - prefixInput.count + 1, v.top);
			t.extendSelectionTo(t.getLineTopOffset2(index, 0));
			isVerticalMotion = true;
			idealWidthPixels = -1;
			prefixInput.motion = c;
			return true;
		},
		'G': function (c, t) {
			var index = prefixInput.isCountSpecified ?
				Math.max(Math.min(prefixInput.count, t.rowLength), 1) : t.rowLength;
			t.extendSelectionTo(t.getLineTopOffset2(index - 1, 0));
			isVerticalMotion = true;
			isSmoothScrollRequested = true;
			idealWidthPixels = -1;
			prefixInput.motion = c;
			return true;
		},
		'f': {
			'command': function (c, t) {
				prefixInput.motion = c;
				inputModeSub = 'wait-a-letter';
				requestShowPrefixInput(_('{0}: find forward', keyName(c)));
			},
			'wait-a-letter': function (c, t) {
				prefixInput.appendMotion(c);
				return motionFindForward(c, t, prefixInput.count);
			}
		},
		'F': {
			'command': function (c, t) {
				prefixInput.motion = c;
				inputModeSub = 'wait-a-letter';
				requestShowPrefixInput(_('{0}: find backward', keyName(c)));
			},
			'wait-a-letter': function (c, t) {
				prefixInput.appendMotion(c);
				return motionFindBackward(c, t, prefixInput.count);
			}
		},
		't': {
			'command': function (c, t) {
				prefixInput.motion = c;
				inputModeSub = 'wait-a-letter';
				requestShowPrefixInput(_('{0}: find forward', keyName(c)));
			},
			'wait-a-letter': function (c, t) {
				prefixInput.appendMotion(c);
				return motionFindForward(c, t, prefixInput.count, true);
			}
		},
		'T': {
			'command': function (c, t) {
				prefixInput.motion = c;
				inputModeSub = 'wait-a-letter';
				requestShowPrefixInput(_('{0}: find backward', keyName(c)));
			},
			'wait-a-letter': function (c, t) {
				prefixInput.appendMotion(c);
				return motionFindBackward(c, t, prefixInput.count, true);
			}
		},
		// search next match for current pattern
		'n': function (c, t) {
			prefixInput.motion = c;
			if (registers.exists('/')) {
				isSmoothScrollRequested = true;
				return motionFindByRegexFacade(
					registers.get('/').data, t, prefixInput.count,
					lastRegexFindCommand.direction,
					lastRegexFindCommand.verticalOffset);
			}
			else {
				requestShowMessage(_('No previous search pattern.'), true);
			}
		},
		// search previous match for current pattern
		'N': function (c, t) {
			prefixInput.motion = c;
			if (registers.exists('/')) {
				isSmoothScrollRequested = true;
				return motionFindByRegexFacade(
					registers.get('/').data, t, prefixInput.count,
					-lastRegexFindCommand.direction,
					lastRegexFindCommand.verticalOffset);
			}
			else {
				requestShowMessage(_('No previous search pattern.'), true);
			}
		},

		/*
		 * scrollers (independent motions)
		 */

		// scroll up half (height of screen) lines
		'\u0015'/*^U*/: function (c, t) {
			if (prefixInput.isEmptyOperation) {
				return scrollView(c, t, function (v) {
					if (config.vars.scroll > 0) {
						return -config.vars.scroll * prefixInput.count;
					}
					else {
						return -parseInt((v.bottom - v.top + 1) / 2) * prefixInput.count;
					}
				});
			}
			else {
				inputEscape();
			}
		},
		// scroll down half (height of screen) lines
		'\u0004'/*^D*/: function (c, t) {
			if (prefixInput.isEmptyOperation) {
				return scrollView(c, t, function (v) {
					if (config.vars.scroll > 0) {
						return config.vars.scroll * prefixInput.count;
					}
					else {
						return parseInt((v.bottom - v.top + 1) / 2) * prefixInput.count;
					}
				});
			}
			else {
				inputEscape();
			}
		},
		// scroll up 1 line
		'\u0019'/*^D*/: function (c, t) {
			if (prefixInput.isEmptyOperation) {
				var ss = config.vars.smooth;
				config.vars.smooth = false;
				try {
					return scrollView(c, t, -prefixInput.count);
				}
				finally {
					config.vars.smooth = ss;
				}
			}
			else {
				inputEscape();
			}
		},
		// scroll down 1 line
		'\u0005'/*^E*/: function (c, t) {
			if (prefixInput.isEmptyOperation) {
				var ss = config.vars.smooth;
				config.vars.smooth = false;
				try {
					return scrollView(c, t, prefixInput.count);
				}
				finally {
					config.vars.smooth = ss;
				}
			}
			else {
				inputEscape();
			}
		},
		// scroll up (height of screen - 2) lines
		'\u0002'/*^B*/: function (c, t) {
			if (prefixInput.isEmptyOperation) {
				return scrollView(c, t, function (v) {
					return -(Math.max(parseInt((v.bottom - v.top + 1) - 2), 1)) * prefixInput.count;
				});
			}
			else {
				inputEscape();
			}
		},
		'<pageup>': function (c, t) {
			return this['\u0002'].apply(this, arguments);
		},
		// scroll down (height of screen - 2) lines
		'\u0006'/*^F*/: function (c, t) {
			if (prefixInput.isEmptyOperation) {
				return scrollView(c, t, function (v) {
					return Math.max(parseInt((v.bottom - v.top + 1) - 2), 1) * prefixInput.count;
				});
			}
			else {
				inputEscape();
			}
		},
		'<pagedown>': function (c, t) {
			return this['\u0006'].apply(this, arguments);
		},
		// z: screen adjustment
		//	 z<CR> (top of the screen)
		//	 z.    (center of the screen)
		//	 zz
		//	 z-    (bottom of the screen)
		'z': {
			'command': function (c, t) {
				if (prefixInput.isEmptyOperation) {
					prefixInput.operation = c;
					inputModeSub = 'wait-a-letter';
					requestShowPrefixInput(keyName(c) + ': screen adjustment');
				}
				else {
					inputEscape();
				}
			},
			'wait-a-letter': function (c, t) {
				prefixInput.motion = c;
				return true;
			},
			'@op': function (c, t) {
				var motion = prefixInput.motion;
				var line = prefixInput.isCountSpecified ?
					Math.max(Math.min(prefixInput.count, t.rowLength), 1) - 1 :
					t.selectionStartRow;
				var current = t.rowNodes(line).offsetTop - t.elm.clientTop;
				var n = new Position(line, 0);

				if (motion == prefixInput.operation) {
					motion = '.';
				}

				switch (motion) {
				case '\u000d':
					t.scrollLeft = 0;
					scroller.run(current, function () {
						t.setSelectionRange(t.getLineTopOffset2(n));
						idealWidthPixels = -1;
					});
					break;

				case '.':
					t.scrollLeft = 0;
					scroller.run(
						Math.max(current - parseInt((t.elm.clientHeight - lineHeight) / 2), 0),
						function () {
							t.setSelectionRange(t.getLineTopOffset2(n));
							idealWidthPixels = -1;
						}
					);
					break;

				case '-':
					t.scrollLeft = 0;
					scroller.run(
						Math.max(current - (t.elm.clientHeight - lineHeight), 0),
						function () {
							t.setSelectionRange(t.getLineTopOffset2(n));
							idealWidthPixels = -1;
						}
					);
					break;
				}
			}
		},

		/*
		 * edit commands
		 */

		'x': function (c, t) {
			if (prefixInput.isEmptyOperation) {
				prefixInput.operation = c;
				requestSimpleCommandUpdate();
				return deleteChars(t, prefixInput.count, true);
			}
			else {
				inputEscape();
			}
		},
		'\u007f'/*delete*/: function (c, t) {
			return this['x'].apply(this, arguments);
		},
		'X': function (c, t) {
			if (prefixInput.isEmptyOperation) {
				prefixInput.operation = c;
				requestSimpleCommandUpdate();
				return deleteChars(t, prefixInput.count, false);
			}
			else {
				inputEscape();
			}
		},
		'p': function (c, t) {
			if (prefixInput.isEmptyOperation) {
				prefixInput.operation = c;
				requestSimpleCommandUpdate();
				return paste(t, prefixInput.count, true);
			}
			else {
				inputEscape();
			}
		},
		'P': function (c, t) {
			if (prefixInput.isEmptyOperation) {
				prefixInput.operation = c;
				requestSimpleCommandUpdate();
				return paste(t, prefixInput.count, false);
			}
			else {
				inputEscape();
			}
		},
		'J': function (c, t) {
			if (prefixInput.isEmptyOperation && t.selectionStartRow + prefixInput.count <= t.rowLength - 1) {
				prefixInput.operation = c;
				requestSimpleCommandUpdate();
				return joinLines(t, prefixInput.count);
			}
			else {
				inputEscape();
			}
		},
		'.': function (c, t) {
			if (lastSimpleCommand.length) {
				if (prefixInput.isCountSpecified) {
					lastSimpleCommand = lastSimpleCommand.replace(
						/^(".)?(\d+)?/, function ($0, $1) { return $1 + prefixInput.count; });
				}
				executeViCommand(lastSimpleCommand);
				lastSimpleCommand = lastSimpleCommand.replace(
					/^(")([1-8])/, function ($0, $1, $2) { return $1 + (parseInt($2, 10) + 1); });
			}
			return true;
		},
		'u': function (c, t) {
			if (prefixInput.isEmptyOperation) {
				var result = editLogger.undo();
				if (result === false) {
					requestBell();
					requestShowMessage(_('No undo item.'));
				}
				else {
					requestShowMessage(
						_('{0} {operation:0} have canceled.', result));
					return true;
				}
			}
			else {
				inputEscape();aaa
			}
		},
		'\u0012'/*^R*/: function (c, t) {
			if (prefixInput.isEmptyOperation) {
				var result = editLogger.redo();
				if (result === false) {
					requestShowMessage('No redo item.');
					requestBell();
				}
				else {
					requestShowMessage(
						_('{0} {operation:0} have executed again.', result));
					return true;
				}
			}
			else {
				inputEscape();
			}
		},
		'U': null,
		'~': function (c, t) {
			if (prefixInput.isEmptyOperation && !t.selected) {
				prefixInput.operation = c;
				requestSimpleCommandUpdate();
				return toggleCase(t, prefixInput.count);
			}
			else {
				inputEscape();
			}
		},
		// clear screen
		'\u000c'/*^L*/: function (c, t) {
			$(CONTAINER_ID).style.display = 'none';
			setTimeout(function () { $(CONTAINER_ID).style.display = ''; }, 100);
		},
		// display file information
		'\u0007'/*^G*/: function (c, t) {
			requestShowMessage(getFileInfo(t));
		},
		// marks
		'm': {
			'command': function (c, t) {
				if (prefixInput.isEmptyOperation) {
					prefixInput.operation = c;
					inputModeSub = 'wait-a-letter';
					requestShowPrefixInput(_('{0}: mark', keyName(c)));
				}
				else {
					inputEscape();
				}
			},
			'wait-a-letter': function (c, t) {
				marks.set(c, t.selectionStart);
				return true;
			},
			'@op': function (c, t) {
				prefixInput.appendOperation(c);
			}
		},
		// execute register contents as vi command
		'@': {
			'command': function (c, t) {
				if (prefixInput.isEmptyOperation) {
					inputModeSub = 'wait-a-letter';
					prefixInput.register = c;
					requestShowPrefixInput(_('{0}: register (a-z,A-Z,1-9)', keyName(c)));
				}
				else {
					inputEscape();
				}
			},
			'wait-a-letter': function (c, t) {
				if (!registers.isReadable(c)) {
					requestShowMessage(_('Invalid register name: {0}', c), true);
					return;
				}
				if (!registers.exists(c)) {
					requestShowMessage(_('Register {0} is empty.', c), true);
					return;
				}
				var command = register.get(c).data;
				if (prefixInput.isCountSpecified) {
					command = command.replace(
						/^(".)?(\d+)?/, function ($0, $1) { return $1 + prefixInput.count; });
				}
				var result = executeViCommand(command);
				registers.set('@', command);
			}
		},
		/*
		 * available ex commands:
		 *
		 * adopted
		 * for wasavi  full spell        syntax
		 * ==========  ================  ========================
		 * O           abbreviate        ab[breviate] [lhs rhs]
		 * ?           append            [1addr] a[ppend][!]
		 *             args              [ar]gs
		 *             cd                cd[!][directory]
		 * ?           change            [2addr] c[hange][!]
		 *             chdir             chd[ir][!][directory]
		 * O           copy              [2addr] co[py] 1addr [flags]
		 * O           delete            [2addr] d[elete][buffer][count][flags]
		 *             edit              e[edit]![+command][file]
		 *             ex                ex[!][+command][file]
		 *             file              f[ile][file]
		 * O           global            [2addr] g[lobal] /pattern/ [commands]
		 * ?           insert            [1addr] i[nsert][!]
		 * O           join              [2addr] j[oin][!][count][flags]
		 * O           k                 [1addr] k character
		 *             list              [2addr] l[ist][count][flags]
		 * O           map               map[!][lhs rhs]
		 * O           mark              [1addr] ma[rk] character
		 * O           move              [2addr] m[ove] 1addr [flags]
		 *             next              n[ext][!][+command][file ...]
		 *             open              [1addr] o[open] /pattern/ [flags]
		 *             preserve          pre[serve]
		 * O           print             [2addr] p[rint][count][flags]
		 * O           put               [1addr] pu[t][buffer]
		 * O           quit              q[uit][!]
		 *             read              [1addr] r[ead][!][file]
		 *             recover           rec[over][!] file
		 *             rewind            rew[ind][!]
		 * O           set               se[t][option[=[value]] ...][nooption ...][option? ...][all]
		 *             shell             sh[ell]
		 *             source            so[urce] file
		 *             stop              st[op][!]
		 *             suspend           su[spend][!]
		 * O           substitute        [2addr] s[ubstitute][/pattern/repl/[options][count][flags]]
		 * O           &                 [2addr] &[options][count][flags]
		 * O           ~                 [2addr] ~[options][count][flags]
		 * O           to                [2addr] t[o] 1addr [flags]
		 * O           unabbreviate      una[bbrev] lhs
		 * O           undo              u[ndo]
		 * O           unmap             unm[ap][!] lhs
		 * O           v                 [2addr] v /pattern/ [commands]
		 * O           version           ve[rsion]
		 *             visual            [1addr] vi[sual][type][count][flags]
		 * O           write             [2addr] w[rite][!][>>][file]
		 * O           wq                [2addr] wq[!][>>][file]
		 * O           xit               [2addr] x[it][!][file]
		 * O           yank              [2addr] ya[nk][buffer][count]
		 *             z                 [1addr] z[!][type ...][count][flags]
		 * O           @                 [2addr] @ buffer
		 * O           *                 [2addr] * buffer
		 * O           |                 command separator
		 * O           "                 comment
		 *             =                 [1addr] =[flags]
		 *             !                 [addr]! command
		 * O           <                 [2addr] <[< ...][count][flags]
		 * O           >                 [2addr] >[> ...][count][flags]
		 */
		':': {
			'command': function (c, t) {
				if (prefixInput.isEmptyOperation) {
					prefixInput.operation = c;
					lineInputHistories.defaultName = ':';
					requestInputMode('line-input', '', config.vars.prompt ? c : '');
				}
				else {
					inputEscape();
				}
			},
			'line-input': function (c, t) {
				prefixInput.trailer = c;
				exGlobalSpecified = false;
				editLogger.open(function () {
					var result = executeExCommand(t, c);
					if (typeof result == 'string') {
						requestShowMessage(result, true);
					}
				});
				registers.set(':', c);
				lineInputHistories.push(c);
				return true;
			}
		},



		/*
		 * not implemented
		 */

		// back to command mode
		/*'q': null,*/ /* not implemented */
		// back to command mode
		/*'Q': null,*/ /* not implemented */
		// ^^  return to previous file
		/*'\u001e': null,*/ /* not implemented */
		// ^]  takes word after cursor as tag
		/*'\u001d': null,*/ /* not implemented */
		// ^Z  suspend
		/*'\u001a': null,*/ /* not implemented */
		// filter through a command
		/*'!': null,*/ /* not implemented */
	};

	var editMap = {
		'\u0008'/*backspace*/: function (c, t) {
			deleteChars(t, 1, false);
		},
		'\u007f'/*delete*/: function (c, t) {
			deleteChars(t, 1, true);
		},
		'\u0009'/*tab*/: function (c, t) {
			insert(t, '\t');
		},
		'\u000d'/*enter*/: function (c, t) {
			var indent = config.vars.autoindent ? t.getIndent(t.selectionStart) : '';
			insert(t, '\n' + indent);
			cursor.ensureVisible();
			cursor.update();
		},
		'\u0016'/*^V*/: {
			'edit': function (c, t) {
				inputModeSub = 'wait-a-letter';
				requestShowPrefixInput(_('{0}: literal input', keyName(c)));
			},
			'edit-overwrite': function (c, t) {
				inputModeSub = 'wait-a-letter';
				requestShowPrefixInput(_('{0}: literal input', keyName(c)));
			},
			'wait-a-letter': function (c, t) {
				var code = c.charCodeAt(0);
				if (code >= 0x00 && code <= 0x1f || code == 0x7f) {
					c = toVisibleControl(code);
				}
				(inputMode == 'edit' ? insert : overwrite)(t, c);
				cursor.ensureVisible();
				cursor.update();
			}
		},
		'<left>': function (c, t) {
			requestLogEditing();
			motionLeft(c, t, 1);
		},
		'<up>': function (c, t) {
			requestLogEditing();
			motionUp(c, t, 1);
		},
		'<right>': function (c, t) {
			requestLogEditing();
			motionRight(c, t, 1);
		},
		'<down>': function (c, t) {
			requestLogEditing();
			motionDown(c, t, 1);
		},
		'<home>': function (c, t) {
			requestLogEditing();
			motionLineStart(c, t, false);
		},
		'<end>': function (c, t) {
			requestLogEditing();
			motionLineEnd(c, t);
		},
		'<pageup>': function (c, t) {
			requestLogEditing();
			scrollView(c, t, function (v) {
				return -(Math.max(parseInt((v.bottom - v.top + 1) - 2), 1));
			});
		},
		'<pagedown>': function (c, t) {
			requestLogEditing();
			return scrollView(c, t, function (v) {
				return Math.max(parseInt((v.bottom - v.top + 1) - 2), 1);
			});
		}
	};

	var lineInputEditMap = {
		'\u0008'/*backspace*/: function (c, t) {
			if (t.selectionStart == t.selectionEnd) {
				var n = Math.max(t.selectionStart - 1, 0);
				t.value = t.value.substring(0, n) + t.value.substring(t.selectionEnd);
				t.selectionStart = t.selectionEnd = n;
			}
			else {
				t.value = t.value.substring(0, t.selectionStart) + t.value.substring(t.selectionEnd);
				t.selectionEnd = t.selectionStart;
			}
			lineInputHistories.isInitial = true;
		},
		'\u0009'/*tab*/: function (c, t) {
			// todo: some completion?
			lineInputHistories.isInitial = true;
		},
		'\u007f'/*delete*/: function (c, t) {
			if (t.selectionStart == t.selectionEnd) {
				var n = Math.max(t.selectionStart, t.value.length - 1);
				t.value = t.value.substring(0, t.selectionStart) + t.value.substring(t.selectionEnd + 1);
				t.selectionStart = t.selectionEnd = n;
			}
			else {
				t.value = t.value.substring(0, t.selectionStart) + t.value.substring(t.selectionEnd);
				t.selectionEnd = t.selectionStart;
			}
			lineInputHistories.isInitial = true;
		},
		'\u000e'/*^N*/: function (c, t) {
			if (lineInputHistories.isInitial) {
				requestBell();
			}
			else {
				var line = lineInputHistories.next();
				if (line == undefined) {
					line = t.dataset.wasaviLineInputCurrent;
				}
				if (line == undefined) {
					requestBell();
				}
				else {
					t.value = line;
					t.selectionStart = line.length;
					t.selectionEnd = line.length;
				}
			}
		},
		'\u0010'/*^P*/: function (c, t) {
			if (lineInputHistories.isInitial) {
				t.dataset.wasaviLineInputCurrent = t.value;
			}
			var line = lineInputHistories.prev();
			if (line == undefined) {
				requestBell();
			}
			else {
				t.value = line;
				t.selectionStart = line.length;
				t.selectionEnd = line.length;
			}
		},
		'\u0015'/*^U*/: function (c, t) {
			t.value = '';
			t.selectionStart = t.selectionEnd = 0;
			lineInputHistories.isInitial = true;
		},
		'\u0016'/*^V*/: {
			'line-input': function (c, t) {
				inputModeSub = 'wait-a-letter';
			},
			'wait-a-letter': function (c, t) {
				var code = c.charCodeAt(0);
				if (code >= 0x00 && code <= 0x1f || code == 0x7f) {
					c = toVisibleControl(code);
				}
				t.value = t.value.substring(0, t.selectionStart) +
					c + t.value.substring(t.selectionEnd);
				t.selectionStart = t.selectionStart + 1;
				t.selectionEnd = t.selectionStart;
				lineInputHistories.isInitial = true;
			}
		},
		'\u0017'/*^W*/: function (c, t) {
			if (t.selectionStart == t.selectionEnd) {
				var re = /\b(\w+|\W+)$/.exec(t.value.substring(0, t.selectionStart));
				if (re) {
					var n = Math.max(t.selectionStart - re[0].length, 0);
					t.value = t.value.substring(0, n) + t.value.substring(t.selectionEnd);
					t.selectionStart = t.selectionEnd = n;
				}
			}
			else {
				t.value = t.value.substring(0, t.selectionStart) + t.value.substring(t.selectionEnd);
				t.selectionEnd = t.selectionStart;
			}
			lineInputHistories.isInitial = true;
		}
	};

	/*
	 * event handlers
	 * ----------------
	 */

	// window
	function handleWindowFocus (e) {
		handleCoverClick(e);
	}
	function handleWindowBlur (e) {
		cursor.update({focused:false});
	}

	// editor (document)
	function handleDocumentFocus (e) {
		!$(CONTAINER_ID)
		&& e.target.dataset
		&& (e.target.dataset.wasaviEditor || '') == ''
		&& (isMultilineTextInput(e.target) || isSinglelineTextInput(e.target))
		&& install(e.target);
	}
	function handleKeydown (e) {
		if (scroller.running) {
			e.preventDefault();
			e.stopPropagation();
			e.returnValue = false;
			return;
		}

		/*logt3(['type', 'charCode', 'keyCode', 'which', 'keyIdentifier', 'ctrlKey'].map(function (i) {
			return i + ':' + e[i];
		}).join('\t'));*/

		if (cursor.isInComposition) {
			return;
		}

		var keyCode;
		function fixCtrl (code) {
			if (code != undefined) {
				keyCode = code;
			}
			if (e.ctrlKey && keyCode >= 64 && keyCode <= 95) {
				keyCode -= 64;
				return true;
			}
			else if (e.ctrlKey && keyCode >= 96 && keyCode <= 127) {
				keyCode -= 96;
				return true;
			}
		}
		if (window.chrome && 'keyIdentifier' in e) {
			if (e.type == 'keydown') {
				if (e.keyCode >= 16 && e.keyCode <= 18) {
					return;
				}
				if (e.keyIdentifier != '' && WEBKIT_KEY_IDENTIFIERS_REVERSED[e.keyIdentifier]) {
					keyCode = -WEBKIT_KEY_IDENTIFIERS_REVERSED[e.keyIdentifier];
				}
				else if (e.ctrlKey && WEBKIT_CTRL_SPECIAL_KEYS_REVERSED[e.keyIdentifier]) {
					keyCode = WEBKIT_CTRL_SPECIAL_KEYS_REVERSED[e.keyIdentifier];
				}
				else if (!fixCtrl(e.keyCode)) {
					return;
				}
			}
			else {
				fixCtrl(e.charCode);
			}
		}
		else {
			if (SPECIAL_KEYS[e.keyCode] && e.which != e.keyCode) {
				keyCode = -e.keyCode;
			}
			else {
				fixCtrl(e.charCode || e.keyCode);
			}
		}

		mapManager.process(keyCode, function (keyCode) {
			if (processInput(keyCode, e)) {
				e.preventDefault();
				e.stopPropagation();
				e.returnValue = false;
			}
		});
	}
	function handleInput (e) {
		processInputSupplement(e);
	}
	function handleMousedown (e) {
	}
	function handleMouseup (e) {
	}
	function handleScroll (e) {
	}

	// cover
	function handleCoverMousedown (e) {
		e.preventDefault();
		e.stopPropagation();
		e.returnValue = false;
	}
	function handleCoverClick (e) {
		switch (state) {
		case 'normal':
			cursor.update({focused:!isEditing(), visible:!backlog.visible});
			break;
		case 'line-input':
			cursor.update({focused:false, visible:!backlog.visible});
			getLineInput().focus();
			break;
		}
	}
	function handleCoverMousewheel (e) {
		e.preventDefault();
		e.stopPropagation();
		e.returnValue = false;
		switch (state) {
		case 'normal':
			var delta = 0;
			if (e.wheelDelta) {
				delta = 3 * (e.wheelDelta > 0 ? -1 : 1);
			}
			else if (e.detail) {
				delta = e.detail;
			}
			if (delta) {
				executeViCommand(Math.abs(delta) + (delta > 0 ? '\u0005' : '\u0019'), true);
			}
			break;
		}
	}

	/*
	 * external interface
	 * ----------------
	 */

	window.Wasavi = new function () {
		function getRunning () {
			return !!$(CONTAINER_ID);
		}
		function ensureRunning () {
			if (!getRunning()) { throw new Exeception('wasavi is not running'); }
		}
		return {
			get version () {
				return VERSION;
			},
			get running () {
				return getRunning();
			},
			get injectKeyevents () {
				return injectKeyevents;
			},
			set injectKeyevents (v) {
				if (!getRunning()) {
					injectKeyevents = v;
				}
			},
			get state () {
				return this.running ? state : undefined;
			},
			get inputMode () {
				return this.running ? inputMode : undefined;
			},
			get scrollTop () {
				ensureRunning();
				return getEditorCore().scrollTop;
			},
			get scrollLeft () {
				ensureRunning();
				return getEditorCore().scrollLeft;
			},
			get col () {
				ensureRunning();
				return getEditorCore().selectionStartCol;
			},
			get row () {
				ensureRunning();
				return getEditorCore().selectionStartRow;
			},
			get enableList () {
				return enableList;
			},
			set enableList (v) {
				if (!v || typeof v != 'object') {
					return;
				}
				for (var i in enableList) {
					if (i in v) {
						enableList[i] = !!v[i];
					}
				}
			},
			get exrc () {
				return exrc;
			},
			set exrc (v) {
				exrc = String(v);
			},
			run: function (element) {
				element = $(element);
				if (!$(CONTAINER_ID)
				&& element
				&& element.dataset
				&& (element.dataset.wasaviEditor || '') == ''
				&& (isMultilineTextInput(element) || isSinglelineTextInput(element))) {
					install(element);
				}
			},
			send: function () {
				ensureRunning();
				var args = Array.prototype.slice.call(arguments);
				args.push(true);
				executeViCommand.apply(window, args);
			},
			kill: function () {
				ensureRunning();
				uninstall(getEditorCore(), false);
			},
			notifyKeyevent: function (e) {
				if (getRunning() && injectKeyevents) {
					handleKeydown(e);
				}
			},
			notifyUpdateStorage: function (keys) {
				if (getRunning()) {
					keys.forEach(function (key) {
						switch (key) {
						case registers.storageKey:
							storageKey.load();
							break;
						case lineInputHistories.storageKey:
							lineInputHistories.load();
							break;
						}
					});
				}
			},
			SPECIAL_KEYS: new function () {
				var result = {};
				for (var i in SPECIAL_KEYS_REVERSED) {
					result[i.replace(/^<|>$/, '').toUpperCase()] = -SPECIAL_KEYS_REVERSED[i];
				}
				result.ENTER = 13;
				result.ESCAPE = 27;
				return result;
			}
		};
	};

	/*
	 * startup
	 * ----------------
	 */

	/*document.addEventListener('DOMContentLoaded', function () {
		document.addEventListener('DOMFocusIn',handleDocumentFocus, true);
	}, false);*/

	console.log(VERSION_DESC);

})();

// vim:set ts=4 sw=4 fileencoding=UTF-8 fileformat=unix filetype=javascript :
