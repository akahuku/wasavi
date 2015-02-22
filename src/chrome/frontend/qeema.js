// ==UserScript==
// @include http://wasavi.appsweets.net/
// @include http://wasavi.appsweets.net/?testmode
// @include https://ss1.xrea.com/wasavi.appsweets.net/
// ==/UserScript==

/**
 * qeema: integrated keyboard manager
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

(function (global) {
	'use strict';

	// {{{1 consts
	var WEBKIT_FUNCTION_KEYCODES = {
		8: 'backspace',
		9: 'tab',
		13: 'enter',
		19: 'pause',
		27: 'esc',
		32: 'space',
		33: 'pageup', 34: 'pagedown',
		35: 'end', 36: 'home',
		37: 'left', 38: 'up', 39: 'right', 40: 'down',
		45: 'insert', 46: 'delete',
		91: 'os',
		112: 'f1', 113:  'f2', 114:  'f3', 115:  'f4',
		116: 'f5', 117:  'f6', 118:  'f7', 119:  'f8',
		120: 'f9', 121: 'f10', 122: 'f11', 123: 'f12',
		145: 'scrolllock'
	};
	var PRESTO_FUNCTION_KEYCODES = WEBKIT_FUNCTION_KEYCODES;
	var GECKO_FUNCTION_KEYCODES = WEBKIT_FUNCTION_KEYCODES;
	var WEBKIT_CTRL_MAP = {
		32:  0,  65:  1,  66:  2,  67:  3,  68:  4,  69:  5,  70:  6,  71:  7,  72:  8,  73:  9,
		74: 10,  75: 11,  76: 12,  77: 13,  78: 14,  79: 15,  80: 16,  81: 17,  82: 18,  83: 19,
		84: 20,  85: 21,  86: 22,  87: 23,  88: 24,  89: 25,  90: 26, 219: 27, 220: 28, 221: 29
		// following ctrl codes are not able to be handled on Webkit
		// because its key stroke depends on keyboard layout:
		//
		//   30(0x1e): ^^ = Ctrl+Shift+6 on us keyboard
		//   31(0x1f): ^_ = Ctrl+Shift_- on us keyboard
	};
	var PRESTO_CTRL_MAP = WEBKIT_CTRL_MAP;
	var GECKO_CTRL_MAP = null;

	var FUNCTION_KEY_ALIASES = {
		'bs':       'backspace',
		'nl':       'enter',
		'newline':  'enter',
		'linefeed': 'enter',
		'return':   'enter',
		'escape':   'esc',
		'ins':      'insert',
		'del':      'delete',
		'spc':      'space',
		'bar':      '|'.charCodeAt(0),
		'bslash':   '\\'.charCodeAt(0)
	};
	var PRIOR_KEYS_MANIFEST = 'data-prior-keys';
	// }}}

	// {{{1 classes
	function VirtualInputEvent (nativeEvent, code, char, key, shift, ctrl, alt, isSpecial) {
		this.nativeEvent = nativeEvent;
		this.code = code;
		this.char = char;
		this.key = key;
		this.shift = shift;
		this.ctrl = ctrl;
		this.alt = alt;
		this.isSpecial = isSpecial;
		this.isCompositioned = false;
		this.isCompositionedFirst = false;
		this.isCompositionedLast = false;
	}
	VirtualInputEvent.prototype.preventDefault = function () {
		if (this.nativeEvent && !this.nativeEvent.defaultPrevented) {
			this.nativeEvent.preventDefault();
		}
	};

	function CompositionResult (e) {
		this.prefix = '';
		this.composition = '';
		if (e) {
			this.before = e.target.value;
			this.position = e.target.selectionStart;
		}
	}
	CompositionResult.prototype.run = function (e) {
		var t = e.target;
		t.value = this.before;
		t.selectionStart = this.position;
		t.selectionEnd = this.position;

		var data = this.prefix + this.composition;
		for (var i = 0, goal = data.length; i < goal; i++) {
			var ev = new VirtualInputEvent(
				e,
				data.charCodeAt(i), data.charAt(i), data.charAt(i),
				false, false, false,
				false
			);
			ev.isCompositioned = true;
			ev.isCompositionedFirst = i == 0;
			ev.isCompositionedLast = i == goal - 1;
			dequeue.push(ev);
		}

		sweep();
	};
	// }}}

	// {{{1 variables
	var listeners = {
		input: [],
		compositionstart: [],
		compositionupdate: [],
		compositionend: [],
		log: []
	};
	var nopObject = new VirtualInputEvent(
		null,
		0, '*nop*', '*nop*',
		false, false, false,
		false
	);
	var functionKeyCodes = null;
	var ctrlMap = null;
	var consumed;
	var lastReceivedEvent = '';
	var dequeue = [];
	var lockCount = 0;
	var isSweeping = false;
	var enableLog = false;
	var logs = {
		basic: false,
		composition: false,
		input: false
	};

	// for general composition
	var isInComposition = false;
	var compositionResult = null;
	var compositionFinishTimer;

	// for composition on WebKit
	var lastValue = '';

	// for composition on Presto
	var cop2 = {
		before: '',
		preEvents: []
	};
	// }}}

	// {{{1 privates
	function logit () {
		fire('log',
			{message: Array.prototype.slice.call(arguments).join('')}
		);
	}

	function getFunctionKeyCodes () {
		if (global.chrome) return WEBKIT_FUNCTION_KEYCODES;
		if (global.opera) return PRESTO_FUNCTION_KEYCODES;
		if (global.gecko) return GECKO_FUNCTION_KEYCODES;
	}

	function getKeydownListener () {
		if (global.chrome || global.opera) return keydown;
	}

	function getKeyupListener () {
		if (global.opera) return keyupPresto;
	}

	function getInputListener () {
		if (global.chrome) return inputWebkit;
		if (global.opera) return inputPresto;
		if (global.gecko) return inputGecko;
	}

	function getCtrlMap () {
		if (global.chrome) return WEBKIT_CTRL_MAP;
		if (global.opera) return PRESTO_CTRL_MAP;
		if (global.gecko) return GECKO_CTRL_MAP;
	}

	function getListenersSet () {
		return {
			keydown: getKeydownListener(),
			keypress: keypress,
			keyup: getKeyupListener(),
			compositionstart: compositionstart,
			compositionupdate: compositionupdate,
			compositionend: compositionend,
			input: getInputListener()
		};
	}

	function getModifiers (result, e) {
		e.shiftKey && result.push('S');
		e.ctrlKey  && result.push('C');
		e.altKey   && result.push('A');
	}

	function getIncreasePosition (before, current) {
		var length = current.length - before.length;
		if (length <= 0) {
			return -1;
		}

		/*
		 * before:  abcdefg
		 * current: abcXYZdefg
		 * length:  10 - 7 = 3
		 * goal:    10 - 3 + 1 = 8
		 *
		 * loop #0: '' + 'abc' + 'abcdefg' -> x
		 * loop #1: 'a' + 'bcX' + 'bcdefg' -> x
		 * loop #2: 'ab' + 'cXY' + 'cdefg' -> x
		 * loop #3: 'abc' + 'XYZ' + 'defg' -> found, return value: 3
		 * loop #4: 'abcd' + 'YZd' + 'efg' -> x
		 * loop #5: 'abcde' + 'Zde' + 'fg' -> x
		 * loop #6: 'abcdef' + 'def' + 'g' -> x
		 * loop #7: 'abcdefg' + 'efg' + '' -> x
		 */
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

	function fire (eventName, e) {
		var l = listeners[eventName];
		var prevented = false;
		for (var i = 0, goal = l.length; i < goal; i++) {
			if (l[i](e) === false && eventName == 'input') {
				e.preventDefault();
				if (consumed) {
					consumed.defaultPrevented = true;
				}
				prevented = true;
			}
		}

		if (prevented) {
			//removeCompositionCanceledChar(e);
			return false;
		}
		else {
			insertCompositionedChar(e);
			return true;
		}
	}

	function fireComposition (eventNameFragment, data) {
		var e = {data: data};
		var l = listeners['composition' + eventNameFragment];
		var prevented = false;
		for (var i = 0, goal = l.length; i < goal; i++) {
			if (l[i](e) === false) {
				prevented = true;
			}
		}
		return !prevented;
	}

	function fireCompositionStart (data) {
		return fireComposition('start', data);
	}

	function fireCompositionUpdate (data) {
		return fireComposition('update', data);
	}

	function fireCompositionEnd (data) {
		return fireComposition('end', data);
	}

	function isEditable (e) {
		var t = e.target || e.nativeEvent && e.nativeEvent.target;
		if (!t) return false;
		if (!('selectionStart' in t
			&& 'selectionEnd' in t
			&& 'value' in t)) return false;

		return true;
	}

	function insertCompositionedChar (e) {
		if (!(e instanceof VirtualInputEvent)) return;
		if (e.code < 0) return;
		if (!e.isCompositioned) return;
		if (!isEditable(e)) return;

		var t = e.nativeEvent.target;
		if (t.readOnly) return;

		var v = t.value;
		var p = t.selectionStart;

		t.value = v.substring(0, t.selectionStart) +
				  String.fromCharCode(e.code) +
				  v.substring(t.selectionEnd);
		t.selectionStart = p + 1;
		t.selectionEnd = p + 1;
	}

	function removeCompositionCanceledChar (e) {
		if (!(e instanceof VirtualInputEvent)) return;
		if (e.code < 0) return;
		if (!e.isCompositioned) return;
		if (!isEditable(e)) return;

		var t = e.nativeEvent.target;
		if (t.readOnly) return;

		var v = t.value;
		var p = e.position;
		var ss = t.selectionStart;
		var se = t.selectionEnd;

		if (p >= 0 && p < v.length) {
			t.value = v.substring(0, p) + v.substring(p + 1);
		}
		if (ss > p && ss > 0) {
			t.selectionStart = ss - 1;
		}
		if (se > p && se > 0) {
			t.selectionEnd = se - 1;
		}

		for (var i = 0; i < dequeue.length; i++) {
			var next = dequeue[i];
			if (!next.nativeEvent) break;
			if (next.nativeEvent.target != t) break;
			if (!('position' in next)) break;

			next.position--;
		}
	}

	function registerCompositionFinish (e) {
		compositionFinishTimer = setTimeout(function () {
			enableLog && logs.composition && logit(
				'[compositionResult invoker]'
			);

			compositionFinishTimer = null;
			compositionResult.run(e);
			compositionResult = null;
		}, 1);
	}
	// }}}

	// {{{1 internal listeners
	function compositionstart (e) {
		enableLog && logs.composition && logit(
			'[compositionstart] "', e.data, '"'
		);

		if (compositionFinishTimer) {
			clearTimeout(compositionFinishTimer);
			compositionFinishTimer = null;
		}

		if (compositionResult) {
			compositionResult.prefix += compositionResult.composition;
		}
		else {
			compositionResult = new CompositionResult(e);
		}

		lastReceivedEvent = e.type;
		isInComposition = true;
		fireCompositionStart(e.data);
	}

	function compositionupdate (e) {
		enableLog && logs.composition && logit(
			'[compositionupdate] "', e.data, '"'
		);

		lastReceivedEvent = e.type;
		fireCompositionUpdate(e.data);
	}

	function compositionend (e) {
		enableLog && logs.composition && logit(
			'[compositionend] "', e.data, '"'
		);

		lastReceivedEvent = e.type;
		fireCompositionEnd(e.data);
		if (compositionResult) {
			compositionResult.composition = e.data;
		}
		isInComposition = false;
	}

	function keydown (e) {
		if (e.shiftKey && e.keyCode == 16
		||  e.ctrlKey && e.keyCode == 17
		||  e.altKey && e.keyCode == 18) {
			return;
		}

		lastReceivedEvent = e.type;
		consumed = false;
		var etype = '[ keydown]';

		if (window.opera && e.keyCode == 229) {
			var value;
			if (!isInComposition) {
				if (!e.repeat && e.target.selectionStart > 0) {
					var t = e.target;
					value = t.value.substring(0, t.selectionStart - 1) +
							t.value.substring(t.selectionStart);
				}
				else {
					value = '';
				}
				cop2.before = value;
			}

			cop2.preEvents.push({
				repeat: e.repeat,
				inputEventCount: 0
			});

			enableLog && logs.composition && logit(
				' *** preEvents pushed at keydown event ***',
				value == undefined ? '' : (', original string initialized: "' + value + '"')
			);

			return;
		}

		enableLog && logs.basic && logit(
			etype,
			' keyCode:', e.keyCode,
			', which:', e.which,
			', charCode:', e.charCode,
			', shift:', e.shiftKey,
			', ctrl:', e.ctrlKey,
			', alt:', e.altKey
		);

		var charCode = 0;
		var keyCode = -e.keyCode;

		if (!(e.keyCode in functionKeyCodes)) {
			if (e.ctrlKey && !e.altKey && ctrlMap && e.keyCode in ctrlMap) {
				charCode = ctrlMap[e.keyCode];
				keyCode = 0;
				enableLog && logs.basic && logit(
					etype, ' found ctrl-shortcut'
				);
			}
			else {
				return;
			}
		}

		keypress({
			type: e.type,
			shiftKey: e.shiftKey,
			ctrlKey: e.ctrlKey,
			altKey: e.altKey,
			charCode: charCode,
			which: e.which,
			keyCode: keyCode,
			preventDefault: function () {e.preventDefault()}
		});

		consumed = {
			defaultPrevented: false
		};
	}

	function keypress (e) {
		lastReceivedEvent = e.type;

		var etype = '[keypress' +
			(e.type != 'keypress' ? ' (' + e.type + ' delegation)' : '') +
			']';

		if (e.type == 'keypress' && consumed) {
			if (consumed.defaultPrevented) {
				enableLog && logs.basic && logit(
					etype, ' ignoring consumed keypress and prevented default action.'
				);
				e.preventDefault();
			}
			else {
				enableLog && logs.basic && logit(
					etype, ' ignoring consumed keypress.'
				);
			}
			consumed = false;
			return;
		}

		enableLog && logs.basic && logit(
			etype,
			' keyCode:', e.keyCode,
			', which:', e.which,
			', charCode:', e.charCode,
			', shift:', e.shiftKey,
			', ctrl:', e.ctrlKey,
			', alt:', e.altKey
		);

		var c = [];
		var code;
		var char;
		var stroke;
		var isSpecial = false;
		var shiftKey = e.shiftKey;
		var ctrlKey = e.ctrlKey;
		var altKey = e.altKey;

		// special keys which processed by keydown listener (for Webkit, Presto)
		if (e.keyCode < 0) {
			code = e.keyCode >= -32 ? -e.keyCode : e.keyCode;
			getModifiers(c, e);
			char = '';
			stroke = functionKeyCodes[-e.keyCode];
			isSpecial = true;
		}

		// special keys (for Gecko)
		else if (e.charCode == 0) {
			code = e.keyCode < 32 ? e.keyCode : -e.keyCode;
			getModifiers(c, e);
			char = '';
			stroke = functionKeyCodes[e.keyCode];
			isSpecial = true;
		}

		// space is printable but allowed modifiers
		else if (e.charCode == 32) {
			code = ctrlKey && !altKey ? 0 : 32;
			getModifiers(c, e);
			char = String.fromCharCode(code);
			stroke = functionKeyCodes[e.charCode];
			isSpecial = true;
		}

		// others...
		else {
			code = e.charCode;

			// ctrl code directly
			if (code >= 0 && code <= 31) {
				char = String.fromCharCode(code);
				stroke = String.fromCharCode(code + 64).toLowerCase();
				getModifiers(c, e);
			}
			// ^@ - ^_
			else if (ctrlKey && !altKey) {
				if (code >= 64 && code <= 95 || code >= 97 && code <= 127) {
					code = code & 0x1f;
					char = String.fromCharCode(code);
					stroke = String.fromCharCode(code + 64).toLowerCase();
					getModifiers(c, e);
				}
				else {
					return;
				}
			}
			// printable chars
			else if (code >= 32) {
				char = String.fromCharCode(code);
				stroke = String.fromCharCode(code);
			}
		}

		if (stroke == undefined) return;

		c.push(stroke);

		var ev = new VirtualInputEvent(
			e,
			code, char, c.join('-'),
			shiftKey, ctrlKey, altKey, isSpecial);

		if (lockCount > 0 && code == 3) {
			fire('input', ev);
		}
		else {
			dequeue.push(ev);
			sweep();
		}
	}

	function keyup (e) {
		if (e.shiftKey && e.keyCode == 16
		||  e.ctrlKey && e.keyCode == 17
		||  e.altKey && e.keyCode == 18) {
			return;
		}

		enableLog && logs.basic && logit(
			'[  keyup]',
			' keyCode:', e.keyCode,
			', which:', e.which,
			', charCode:', e.charCode,
			', shift:', e.shiftKey,
			', ctrl:', e.ctrlKey,
			', alt:', e.altKey
		);
	}

	function keyupPresto (e) {
		// {{{2
		if (e.shiftKey && e.keyCode == 16
		||  e.ctrlKey && e.keyCode == 17
		||  e.altKey && e.keyCode == 18) {
			return;
		}

		var etype = '[   keyup]';

		if (cop2.preEvents.length) {
			var current = e.target.value;
			var item = cop2.preEvents.shift();
			var incPos = getIncreasePosition(cop2.before, current);
			var composition = current.substr(
				incPos, current.length - cop2.before.length);

			while (cop2.preEvents.length && cop2.preEvents[0].repeat) {
				cop2.preEvents.shift();
			}

			enableLog && logs.composition && logit([
				etype,
				'           before: "' + cop2.before + '"',
				'          current: "' + current + '"',
				'      composition: "' + composition + '"',
				'  inputEventCount: ' + item.inputEventCount,
				'           incPos: ' + incPos
			].join('\n'));

			if (isInComposition) {
				/*
				 * 1. implicit fix:
				 * [keydown]	keyCode: 229, which: 229
				 * [input]		value:"...X" (X is the character which raised fixation)
				 * [input]		value:"...X" (X is the character which raised fixation)
				 * [input]		value:"...X" (X is the character which raised fixation)
				 * [keyup]		keyCode: Y, which: Y
				 *
				 * 2. explicit fix:
				 * [keydown]	keyCode: 229, which: 229
				 * [input]		value:"..."
				 * [input]		value:"..."
				 * [keyup]		keyCode: 13, which: 13
				 *
				 * 3. selecting a candidate
				 * [keydown]	keyCode: 229, which: 229
				 * [input]		value:"..."
				 * [keyup]		keyCode: Y, which: Y
				 *
				 * 4. escaping a composition
				 * [keydown]	keyCode: 229, which: 229
				 * [keyup]		keyCode: 27, which: 27
				 *
				 */

				// implicit fix
				if (item.inputEventCount == 3) {
					// close current composition session
					e.data = composition.substr(0, composition.length - 1);
					compositionend(e);

					// open new composition session
					cop2.before = cop2.before.substring(0, incPos) +
								  composition.substr(0, composition.length - 1) +
								  cop2.before.substring(incPos + composition.length);

					e.data = '';
					compositionstart(e);
					compositionResult.prefix = '';

					e.data = composition.substr(-1);
					compositionupdate(e);
				}

				// explicit fix
				// canceling
				// composition extinction
				else if (item.inputEventCount == 2
				|| e.keyCode == 27 && cop2.inputEventCount == 0
				|| cop2.before == current) {
					e.data = composition;
					compositionend(e);

					var incPos2 = getIncreasePosition(
						compositionResult.before, current);
					if (incPos2 >= 0) {
						compositionResult.composition = current.substr(
							incPos2,
							current.length - compositionResult.before.length);
						registerCompositionFinish(e);
					}
				}

				// composition update
				else {
					e.data = composition;
					compositionupdate(e);
				}
			}
			
			// new composition session
			else {
				e.data = '';
				compositionstart(e);
				compositionResult.before = cop2.before;
				compositionResult.position--;

				e.data = composition;
				compositionupdate(e);
			}
		}

		enableLog && logs.basic && logit(
			etype,
			' keyCode:', e.keyCode,
			', which:', e.which,
			', charCode:', e.charCode,
			', shift:', e.shiftKey,
			', ctrl:', e.ctrlKey,
			', alt:', e.altKey
		);
		// }}}
	}

	function inputWebkit (e) {
		var etype = '[   input]';

		enableLog && logs.input && logit(
			etype, ' value:"', e.target.value, '"'
		);

		switch (lastReceivedEvent) {
		case 'keydown':
			var current = e.target.value;
			var pos = getIncreasePosition(lastValue, current);
			if (pos >= 0) {
				var s = current.substr(pos, current.length - lastValue.length);
				if (s != '') {
					fireCompositionStart('');
					fireCompositionUpdate(s);
					fireCompositionEnd(s);

					var cr = new CompositionResult;
					cr.composition = s;
					cr.before = lastValue;
					cr.position = pos;
					cr.run(e);
				}
			}
			break;

		case 'compositionend':
			registerCompositionFinish(e);
			break;
		}

		lastValue = e.target.value;
		lastReceivedEvent = e.type;
	}

	function inputPresto (e) {
		var etype = '[   input]';

		enableLog && logs.input && logit(
			etype, ' value:"', e.target.value + '"'
		);

		if (cop2.preEvents.length) {
			var last = cop2.preEvents[cop2.preEvents.length - 1];
			last.inputEventCount++;
		}

		lastReceivedEvent = e.type;
	}

	function inputGecko (e) {
		var etype = '[   input]';

		enableLog && logs.input && logit(
			etype, ' value:"', e.target.value, '"'
		);

		if (lastReceivedEvent == 'compositionend') {
			registerCompositionFinish(e);
		}

		lastReceivedEvent = e.type;
	}

	// }}}

	// {{{1 publics
	function install () {
		functionKeyCodes = getFunctionKeyCodes();
		if (functionKeyCodes) {
			ctrlMap = getCtrlMap();

			var listenersSet = getListenersSet();
			for (var i in listenersSet) {
				if (listenersSet[i]) {
					document.addEventListener(i, listenersSet[i], true);
				}
			}
		}
		return this;
	}

	function uninstall () {
		functionKeyCodes = null;
		ctrlMap = null;

		var listenersSet = getListenersSet();
		for (var i in listenersSet) {
			if (listenersSet[i]) {
				document.removeEventListener(i, listenersSet[i], true);
			}
		}
		return this;
	}

	function addListener () {
		var args = Array.prototype.slice.call(arguments);
		var type = 'input', listener;

		if (typeof args[0] == 'string') {
			type = args.shift();
		}
		if (!(type in listeners)) return;

		listener = args.shift();
		if (typeof listener != 'function') return;

		var index = listeners[type].indexOf(listener);
		if (index < 0) {
			listeners[type].push(listener);
		}

		return this;
	}

	function removeListener () {
		var args = Array.prototype.slice.call(arguments);
		var type = 'input', listener;

		if (typeof args[0] == 'string') {
			type = args.shift();
		}
		if (!(type in listeners)) return;

		listener = args.shift();
		if (typeof listener != 'function') return;

		var index = listeners[type].indexOf(listener);
		if (index >= 0) {
			listeners[type].splice(index, 1);
		}

		return this;
	}

	// code utils
	function code2letter (c, useSpecial) {
		if (typeof c != 'number') {
			return '';
		}
		if (c >= 0) {
			return String.fromCharCode(c);
		}
		if (useSpecial && -c in functionKeyCodes) {
			return '<' + functionKeyCodes[-c] + '>';
		}
		return '';
	}

	function toInternalString (e) {
		if (typeof e.code != 'number') {
			return '';
		}
		if (e.isSpecial && e.code < 0) {
			return '\ue000' + '<' + e.key + '>';
		}
		return String.fromCharCode(e.code);
	}

	function objectFromCode (c) {
		if (typeof c != 'number') {
			return null;
		}

		var identifier = '';
		var isSpecial = false;
		if (c >= 0) {
			identifier = String.fromCharCode(c);
		}
		else if (-c in functionKeyCodes) {
			identifier = functionKeyCodes[-c];
			isSpecial = true;
		}

		return new VirtualInputEvent(
			null,
			c, identifier, identifier,
			false, false, false,
			isSpecial
		);
	}

	function insertFnKeyHeader (s) {
		return s.replace(/(\u0016)?(<[^>]+>|#\d{1,2})/g, function ($0, $1) {
			return $1 == '\u0016' ? $0 : '\ue000' + $0;
		});
	}

	function parseKeyDesc (desc, escaped) {
		function doParse (desc) {
			var parts = desc.toLowerCase().split('-');
			var shift = false, ctrl = false, alt = false, name = '';

			while (parts.length > 1 && /^[sca]$/.test(parts[0])) {
				shift = parts[0] == 's' || shift;
				ctrl = parts[0] == 'c' || ctrl;
				alt = parts[0] == 'a' || alt;
				parts.shift();
			}

			name = parts[0];

			if (name in FUNCTION_KEY_ALIASES) {
				if (typeof FUNCTION_KEY_ALIASES[name] == 'number') {
					return {
						code:FUNCTION_KEY_ALIASES[name],
						name:name,
						shift:shift,
						ctrl:ctrl,
						alt:alt
					};
				}
				else {
					name = FUNCTION_KEY_ALIASES[name];
				}
			}

			for (var i in functionKeyCodes) {
				if (functionKeyCodes[i] == name) {
					return {
						code:-i,
						name:name,
						shift:shift,
						ctrl:ctrl,
						alt:alt
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
				obj.alt  && c.push('a');
				c.push(obj.name);
				return {
					consumed:consumed,
					prop: new VirtualInputEvent(
						null,
						obj.code, obj.name, c.join('-'),
						obj.shift, obj.ctrl, obj.alt,
						true
					)
				};
			}
		}
		return {
			consumed:1,
			prop: new VirtualInputEvent(
				null,
				desc.charCodeAt(0), desc.charAt(0), desc.charAt(0),
				false, false, false,
				false
			)
		};
	}

	// dequeue manipulators
	function createSequences (s, asComposition) {
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

			if (parseResult.prop) {
				if (asComposition) {
					parseResult.prop.isCompositioned = true;
				}
				result.push(parseResult.prop);
			}

			i += parseResult.consumed - 1;
		}

		if (asComposition && result.length) {
			result[0].isCompositionedFirst = true;
			result[result.length - 1].isCompositionedLast = true;
		}

		return result;
	}

	function setDequeue (method, args, callback) {
		var items = [];

		for (var i = 0, goal = args.length; i < goal; i++) {
			var s = args[i];

			if (typeof s == 'string') {
				items.push.apply(items, createSequences(s));
			}
			else if (typeof s == 'object') {
				if ('value' in s && s.asComposition) {
					items.push.apply(items, createSequences(s.value, true));
				}
				else {
					items.push(s);
				}
			}
		}

		callback && callback(items);
		dequeue[method].apply(dequeue, items);
	}

	function push () {
		var args = Array.prototype.slice.call(arguments);
		var callback;

		if (typeof args[args.length - 1] == 'function') {
			callback = args.pop();
		}

		setDequeue('push', args, callback);
	}

	function unshift () {
		var args = Array.prototype.slice.call(arguments);
		var callback;

		if (typeof args[args.length - 1] == 'function') {
			callback = args.pop();
		}

		setDequeue('unshift', args, callback);
	}

	function invalidate () {
		dequeue.length = 0;
	}

	function sweep () {
		if (isSweeping) return;

		isSweeping = true;
		try {
			while (lockCount == 0 && dequeue.length) {
				fire('input', dequeue.shift());
			}
		}
		finally {
			isSweeping = false;
		}
	}

	function lock () {
		lockCount++;
	}

	function unlock (reset) {
		if (reset) {
			lockCount = 0;
		}
		else {
			lockCount--;
			if (lockCount < 0) {
				console.error('lockCount error');
				lockCount = 0;
			}
		}
		if (lockCount == 0) {
			sweep();
		}
	}

	// shortcut manifest
	function clearManifest () {
		document.documentElement.removeAttribute(PRIOR_KEYS_MANIFEST);
	}

	function getManifest (asis) {
		var m = document.documentElement.getAttribute(PRIOR_KEYS_MANIFEST) || '';

		if (!asis) {
			m = m.split(/ +/)
				.map(function (k) {return k.replace('space', ' ')});
		}

		return m;
	}

	function setManifest (m) {
		if (typeof m == 'string') {
			;
		}
		else if (m instanceof Array) {
			m = m.map(function (k) {return k.replace(' ', 'space')}).join(' ');
		}
		else {
			return;
		}

		document.documentElement.setAttribute(PRIOR_KEYS_MANIFEST, m);
	}

	function addManifest () {
		var keys = Array.prototype.slice.call(arguments);

		var m = getManifest(true);
		m += m != '' ? ' ' : '';
		m += keys.map(function (k) {return k.replace(' ', 'space')})
			.join(' ');

		document.documentElement.setAttribute(PRIOR_KEYS_MANIFEST, m);
	}

	function regalizeManifest () {
		var m = getManifest();
		var hash = {};
		m.forEach(function (k) {hash[k] = 1});
		setManifest(Object.keys(hash));
	}

	// disposer
	function dispose () {
		for (var i in listeners) {
			listeners[i] = undefined;
		}
		uninstall();
	}
	// }}}

	// boot
	(function () {
		if (global.gecko) return;
		for (var i in global) {
			if (!/moz/i.test(i)) continue;
			global.gecko = true;
			break;
		}
	})();
	global.qeema = Object.create(Object.prototype, {
		install: {value:install},
		uninstall: {value:uninstall},
		addListener: {value:addListener},
		removeListener: {value:removeListener},

		code2letter: {value:code2letter},
		toInternalString: {value:toInternalString},
		objectFromCode: {value:objectFromCode},
		nopObject: {value:nopObject},
		insertFnKeyHeader: {value:insertFnKeyHeader},
		parseKeyDesc: {value:parseKeyDesc},

		createSequences: {value:createSequences},
		setDequeue: {value:setDequeue},
		push: {value:push},
		unshift: {value:unshift},
		invalidate: {value:invalidate},
		sweep: {value:sweep},
		lock: {value:lock},
		unlock: {value:unlock},
		dispose: {value:dispose},

		clearManifest: {value:clearManifest},
		getManifest: {value:getManifest},
		setManifest: {value:setManifest},
		addManifest: {value:addManifest},
		regalizeManifest: {value:regalizeManifest},

		isInComposition: {
			get: function () {return isInComposition}
		},
		isLocked: {
			get: function () {return lockCount > 0}
		},

		log: {
			get: function () {return enableLog},
			set: function (v) {enableLog = !!v}
		},
		logBasic: {
			get: function () {return logs.basic},
			set: function (v) {logs.basic = !!v}
		},
		logComposition: {
			get: function () {return logs.composition},
			set: function (v) {logs.composition = !!v}
		},
		logInput: {
			get: function () {return logs.input},
			set: function (v) {logs.input = !!v}
		}
	});
})(this);

// vim:set ts=4 sw=4 fenc=UTF-8 ff=unix ft=javascript fdm=marker :
