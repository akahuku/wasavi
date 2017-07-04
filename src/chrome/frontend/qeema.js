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

(function (g) {
	'use strict';

	// <<<1 consts
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

	//
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

	//
	var WEBKIT_CODE_TO_CHAR_MAP = {
		8: 8,
		9: 9,
		13: 13,
		27: 27,
		32: 32,
		46: 127
	};
	var PRESTO_CODE_TO_CHAR_MAP = WEBKIT_CODE_TO_CHAR_MAP;
	var GECKO_CODE_TO_CHAR_MAP = WEBKIT_CODE_TO_CHAR_MAP;

	//
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
	var BIT_SHIFT = 0x8000;
	var BIT_CTRL  = 0x4000;
	var BIT_ALT   = 0x2000;
	var BIT_BASE  = 0x00ff;
	// >>>

	// <<<1 classes
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
	VirtualInputEvent.prototype.code2letter = function (c, useSpecial) {
		if (typeof c != 'number') {
			return '';
		}
		if (c >= 0) {
			return String.fromCharCode(c);
		}
		if (useSpecial && -c in functionKeyCodes) {
			return this.key;
		}
		return '';
	};
	VirtualInputEvent.prototype.toInternalString = function () {
		return /^<.+>$/.test(this.key) ?
			'\ue000' + this.key :
			this.char;
	};
	VirtualInputEvent.prototype.clone = function () {
		return new VirtualInputEvent(
			this.nativeEvent,
			this.code,
			this.char,
			this.key,
			this.shift,
			this.ctrl,
			this.alt,
			this.isSpecial);
	};

	function CompositionResult (e) {
		this.prefix = '';
		this.composition = '';
		if (e) {
			this.before = editable.value(e.target);
			this.position = editable.selectionStart(e.target);
		}
	}
	CompositionResult.prototype.run = function (e) {
		var t = e.target;
		var v = editable.value(t);
		editable.delete(t, this.position, this.prefix.length + this.composition.length);
		editable.setSelectionRange(t, this.position);
		pushCompositionedString(e, this.prefix + this.composition);
	};
	// >>>

	// <<<1 variables
	var listeners = {
		input: [],
		compositionstart: [],
		compositionupdate: [],
		compositionend: [],
		log: [],
		interrupt: []
	};
	var nopObject = new VirtualInputEvent(
		null,
		0, '*nop*', '*nop*',
		false, false, false,
		false
	);
	var functionKeyCodes = null;
	var functionKeyNames = null;
	var ctrlMap = null;
	var codeToCharMap = null;
	var charToCodeMap = null;
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
	var handlePasteEvent = true;
	var useGenerator = false;

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
	// >>>

	// <<<1 utils for content editable elements
	var editable = Object.freeze({
		isSimpleEdit: function (el) {
			return 'selectionStart' in el
				&& 'selectionEnd' in el
				&& 'value' in el;
		},
		isComplexEdit: function (el) {
			return el.isContentEditable;
		},
		getRoot: function (el) {
			var p;
			while (el) {
				if (!el.isContentEditable) {
					break;
				}
				p = el;
				el = el.parentNode;
			}
			return p;
		},
		value: function (el, value) {
			if (arguments.length == 1) {
				if (this.isSimpleEdit(el)) {
					return el.value;
				}
				else if (this.isComplexEdit(el)) {
					return this.getRoot(el).textContent;
				}
				return undefined;
			}
			else {
				if (this.isSimpleEdit(el)) {
					el.value = value;
				}
				else if (this.isComplexEdit(el)) {
					this.getRoot(el).textContent = value;
				}
			}
		},
		insert: function (el, pos, value) {
			if (this.isSimpleEdit(el)) {
				el.value = el.value.substring(0, pos) +
						   value +
						   el.value.substring(pos);
			}
			else if (this.isComplexEdit(el)) {
				var r = this.setSelectionRange(el, pos);
				r.insertNode(document.createTextNode(value));
				el.normalize();
			}
		},
		delete: function (el, pos, length) {
			if (this.isSimpleEdit(el)) {
				el.value = el.value.substring(0, pos) +
						   el.value.substring(pos + length);
			}
			else if (this.isComplexEdit(el)) {
				var r = this.setSelectionRange(el, pos, pos + length);
				r.deleteContents();
				el.normalize();
			}
		},
		selectionStart: function (el) {
			if (this.isSimpleEdit(el)) {
				return el.selectionStart;
			}
			else if (this.isComplexEdit(el)) {
				var caretRange = window.getSelection().getRangeAt(0);
				var r = document.createRange();

				r.setStartBefore(el.firstChild);
				r.setEnd(caretRange.startContainer, caretRange.startOffset);
				return r.toString().length;
			}
			return undefined;
		},
		selectionEnd: function (el) {
			if (this.isSimpleEdit(el)) {
				return el.selectionEnd;
			}
			else if (this.isComplexEdit(el)) {
				var caretRange = window.getSelection().getRangeAt(0);
				var r = document.createRange();

				r.setStartBefore(el.firstChild);
				r.setEnd(caretRange.endContainer, caretRange.endOffset);
				return r.toString().length;
			}
			return undefined;
		},
		setSelectionRange: function (el, start, end) {
			if (arguments.length == 2) {
				return this.doSetSelectionPos(el, start);
			}
			else if (arguments.length > 2) {
				return this.doSetSelectionRange(el, start, end);
			}
		},
		doSetSelectionPos: function (el, value) {
			if (this.isSimpleEdit(el)) {
				el.selectionStart = value;
				el.selectionEnd = value;
			}
			else if (this.isComplexEdit(el)) {
				el = this.getRoot(el);

				var iter = document.createNodeIterator(
					el, window.NodeFilter.SHOW_TEXT, null, false);
				var r = document.createRange();
				var total = 0;
				var node, nodep;
				while ((node = iter.nextNode())) {
					var next = total + node.nodeValue.length;
					if (total <= value && value < next) {
						r.setStart(node, value - total);
						r.setEnd(node, value - total);
						break;
					}
					nodep = node;
					total = next;
				}

				if (!node && nodep && value >= total) {
					r.setStartAfter(nodep);
					r.setEndAfter(nodep);
				}

				var s = window.getSelection();
				s.removeAllRanges();
				s.addRange(r);
				return r;
			}
		},
		doSetSelectionRange: function (el, start, end) {
			if (this.isSimpleEdit(el)) {
				el.selectionStart = start;
				el.selectionEnd = end;
			}
			else if (this.isComplexEdit(el)) {
				el = this.getRoot(el);

				var iter = document.createNodeIterator(
					el, window.NodeFilter.SHOW_TEXT, null, false);
				var r = document.createRange();
				var total = 0;
				var node, nodep;
				while ((node = iter.nextNode())) {
					var next = total + node.nodeValue.length;
					if (total <= start && start < next) {
						r.setStart(node, start - total);
					}
					if (total <= end && end < next) {
						r.setEnd(node, end - total);
					}
					nodep = node;
					total = next;
				}

				if (nodep) {
					if (start >= total) {
						r.setStartAfter(nodep);
					}

					if (end >= total) {
						r.setEndAfter(nodep);
					}
				}

				var s = window.getSelection();
				s.removeAllRanges();
				s.addRange(r);
				return r;
			}
		}
	});
	// >>>

	// <<<1 privates
	function logit () {
		fire('log',
			{message: Array.prototype.slice.call(arguments).join('')}
		);
	}

	function getFunctionKeyCodes () {
		if (g.chrome) return WEBKIT_FUNCTION_KEYCODES;
		if (g.opera) return PRESTO_FUNCTION_KEYCODES;
		if (g.gecko) return GECKO_FUNCTION_KEYCODES;
	}

	function getKeydownListener () {
		if (g.chrome || g.opera) return keydown;
	}

	function getKeyupListener () {
	}

	function getInputListener () {
		if (g.chrome) return inputWebkit;
		if (g.opera) return inputPresto;
		if (g.gecko) return inputGecko;
	}

	function getCtrlMap () {
		if (g.chrome) return WEBKIT_CTRL_MAP;
		if (g.opera) return PRESTO_CTRL_MAP;
		if (g.gecko) return GECKO_CTRL_MAP;
	}

	function getCodeToCharMap () {
		if (g.chrome) return WEBKIT_CODE_TO_CHAR_MAP;
		if (g.opera) return PRESTO_CODE_TO_CHAR_MAP;
		if (g.gecko) return GECKO_CODE_TO_CHAR_MAP;
	}

	function getListenersSet () {
		return {
			keydown: getKeydownListener(),
			keypress: keypress,
			keyup: getKeyupListener(),
			compositionstart: compositionstart,
			compositionupdate: compositionupdate,
			compositionend: compositionend,
			input: getInputListener(),
			paste: paste
		};
	}

	function getModifiers (result, e) {
		var gms = 'getModifierState' in e;
		(e.shiftKey || gms && e.getModifierState('Shift'))   && result.push('S');
		(e.ctrlKey  || gms && e.getModifierState('Control')) && result.push('C');
		(e.altKey   || gms && e.getModifierState('Alt'))     && result.push('A');
	}

	function isShift (e) {
		return e.shiftKey || 'getModifierState' in e && e.getModifierState('Shift');
	}

	function isCtrl (e) {
		return e.ctrlKey || 'getModifierState' in e && e.getModifierState('Control');
	}

	function isAlt (e) {
		return e.altKey || 'getModifierState' in e && e.getModifierState('Alt');
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
		if (t) {
			return editable.isSimpleEdit(t) || editable.isComplexEdit(t);
		}
		return false;
	}

	function isPasteKeyStroke (code, e) {
		return code == -45 && isShift(e) && !isCtrl(e) && !isAlt(e);
	}

	function insertCompositionedChar (e) {
		if (!(e instanceof VirtualInputEvent)) return;
		if (e.code < 0) return;
		if (!e.isCompositioned) return;
		if (!isEditable(e)) return;

		var t = e.nativeEvent.target;
		if (t.readOnly) return;

		var v = editable.value(t);
		var ss = editable.selectionStart(t);
		var se = editable.selectionEnd(t);

		if (ss > se) {
			var tmp = ss;
			ss = se;
			se = tmp;
		}

		if (ss != se) {
			editable.delete(t, ss, se - ss);
		}

		editable.insert(t, ss, String.fromCharCode(e.code));
		editable.setSelectionRange(t, ss + 1);
	}

	function removeCompositionCanceledChar (e) {
		if (!(e instanceof VirtualInputEvent)) return;
		if (e.code < 0) return;
		if (!e.isCompositioned) return;
		if (!isEditable(e)) return;

		var t = e.nativeEvent.target;
		if (t.readOnly) return;

		var v = editable.value(t);
		var p = e.position;
		var ss = editable.selectionStart(t);
		var se = editable.selectionEnd(t);

		if (p >= 0 && p < v.length) {
			setElementValue(v.substring(0, p) + v.substring(p + 1));
		}
		if (ss > p && ss > 0) {
			ss = ss - 1;
		}
		if (se > p && se > 0) {
			se = se - 1;
		}

		setSelectionRange(t, ss, se);

		for (var i = 0; i < dequeue.length; i++) {
			var next = dequeue[i];
			if (!next.nativeEvent) break;
			if (next.nativeEvent.target != t) break;
			if (!('position' in next)) break;

			next.position--;
		}
	}

	function pushCompositionedString (e, data) {
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
	}

	function flip (o) {
		var result = {};
		for (var i in o) {
			result[o[i]] = i;
		}
		return result;
	}

	function toOuterBase (s) {
		return s.replace('<', 'LT').replace('>', 'GT');
	}

	function toInnerBase (s) {
		return s.replace(/^lt$/i, '<').replace(/^gt$/i, '>');
	}
	// >>>

	// <<<1 internal listeners
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
			compositionResult.run(e);
			compositionResult = null;
		}
		isInComposition = false;
	}

	function keydown (e) {
		if (e.keyCode == 16 || e.keyCode == 17 || e.keyCode == 18) {
			return;
		}

		lastReceivedEvent = e.type;
		consumed = false;
		var etype = '[ keydown]';

		if (window.chrome) {
			if (e.keyCode == 229) {
				lastValue = editable.value(e.target);
			}
			else {
				lastValue = null;
			}
		}

		enableLog && logs.basic && logit(
			etype,
			' keyCode:', e.keyCode,
			', which:', e.which,
			', charCode:', e.charCode,
			', shift:', isShift(e),
			', ctrl:', isCtrl(e),
			', alt:', isAlt(e)
		);

		var charCode = 0;
		var keyCode = -e.keyCode;

		if (!(e.keyCode in functionKeyCodes)) {
			if (ctrlMap && e.keyCode in ctrlMap) {
				if (isCtrl(e) && !isAlt(e)) {
					charCode = ctrlMap[e.keyCode];
					keyCode = 0;
					enableLog && logs.basic && logit(etype, ' found ctrl-shortcut');
				}
				else if (!isCtrl(e) && isAlt(e)) {
					charCode = keyCode = -keyCode;
					enableLog && logs.basic && logit(etype, ' found alt + alphabet key');
				}
				else {
					return;
				}
			}
			else {
				return;
			}
		}

		keypress({
			type: e.type,
			shiftKey: isShift(e),
			ctrlKey: isCtrl(e),
			altKey: isAlt(e),
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
			', shift:', isShift(e),
			', ctrl:', isCtrl(e),
			', alt:', isAlt(e)
		);

		var c = [];
		var code;
		var char;
		var stroke;
		var isSpecial = false;
		var shiftKey = isShift(e);
		var ctrlKey = isCtrl(e);
		var altKey = isAlt(e);

		// special keys which processed by keydown listener (for Webkit, Presto)
		if (e.keyCode < 0) {
			code = codeToCharMap[-e.keyCode] || e.keyCode;
			getModifiers(c, e);
			if (code < 0 || c.length) {
				stroke = functionKeyCodes[-e.keyCode];
			}
			else {
				char = stroke = String.fromCharCode(code);
			}
			isSpecial = true;
		}

		// special keys (for Gecko)
		else if (e.charCode == 0) {
			code = codeToCharMap[e.keyCode] || -e.keyCode;
			getModifiers(c, e);
			if (code < 0 || c.length) {
				stroke = functionKeyCodes[e.keyCode];
			}
			else {
				char = stroke = String.fromCharCode(code);
			}
			isSpecial = true;
		}

		// space is printable but allowed modifiers
		else if (e.charCode == 32) {
			code = ctrlKey && !altKey ? 0 : 32;
			getModifiers(c, e);
			if (c.length) {
				stroke = functionKeyCodes[e.charCode];
			}
			else {
				char = stroke = String.fromCharCode(code);
			}
			isSpecial = true;
		}

		// others...
		else {
			code = e.charCode;

			// very very special behavior for Opera 12.16 on Linux:
			// translate invalid plus sign (+) to equal sign (=).
			// TODO: It is bad idea to patch strange browser behavior
			// by the following code.
			if (window.opera && window.navigator.platform == 'Linux'
			&& !shiftKey && !ctrlKey && !altKey && code == 43) {
				code = 61;
			}

			// with alt
			if (!ctrlKey && altKey) {
				stroke = String.fromCharCode(code).toUpperCase();
				code = stroke.charCodeAt(0);
				if (!(code >= 65 && code <= 90)) {
					code = -1;
				}
				getModifiers(c, e);
			}
			// ctrl code shortcut: ^@ - ^_
			else if (ctrlKey && !altKey
			&& (code >= 64 && code <= 95 || code >= 97 && code <= 127)) {
				code = code & 0x1f;
				char = stroke = String.fromCharCode(code);
			}
			// printable chars
			else {
				char = stroke = String.fromCharCode(code);
			}
		}

		if (stroke == undefined) return;
		if (isPasteKeyStroke(code, e)) return;

		c.push(toOuterBase(stroke));
		if (c.length > 1 || -code in functionKeyCodes) {
			code = -(Math.abs(code) +
				   (shiftKey ? BIT_SHIFT : 0) +
				   (ctrlKey ?  BIT_CTRL : 0) +
				   (altKey ?   BIT_ALT : 0));
			char = '';
			stroke = '<' + c.join('-') + '>';
		}
		var ev = new VirtualInputEvent(
			e,
			code, char, stroke,
			shiftKey, ctrlKey, altKey, isSpecial);

		if (lockCount > 0) {
			fire('interrupt', ev);
		}
		else {
			dequeue.push(ev);
			sweep();
		}
	}

	function keyup (e) {
		if (e.keyCode == 16 || e.keyCode == 17 || e.keyCode == 18) {
			return;
		}

		enableLog && logs.basic && logit(
			'[  keyup]',
			' keyCode:', e.keyCode,
			', which:', e.which,
			', charCode:', e.charCode,
			', shift:', isShift(e),
			', ctrl:', isCtrl(e),
			', alt:', isAlt(e)
		);
	}

	function inputWebkit (e) {
		if (!isEditable(e)) return;

		var etype = '[   input]';
		var current = editable.value(e.target);

		enableLog && logs.input && logit(
			etype, ' value:"', editable.value(e.target), '"'
		);

		if (lastValue !== null && !isInComposition && lastReceivedEvent == 'keydown') {
			var current = editable.value(e.target);
			var pos = getIncreasePosition(lastValue, current);
			var s = current.substr(pos, current.length - lastValue.length);
			if (pos >= 0 && s != '') {
				fireCompositionStart('');
				fireCompositionUpdate(s);
				fireCompositionEnd(s);

				var cr = new CompositionResult(e);
				cr.composition = s;
				cr.before = lastValue;
				cr.position = pos;
				cr.run(e);
			}
		}

		lastReceivedEvent = e.type;
	}

	function inputPresto (e) {
		var etype = '[   input]';

		enableLog && logs.input && logit(
			etype, ' value:"', editable.value(e.target), '"'
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
			etype, ' value:"', editable.value(e.target), '"'
		);

		lastReceivedEvent = e.type;
	}

	function paste (e) {
		if (!isEditable(e)) return;

		e.preventDefault();

		if (!handlePasteEvent) return;

		pushCompositionedString(e, e.clipboardData.getData('text/plain'));
	}
	// >>>

	// <<<1 publics
	function install (opts) {
		opts || (opts = {});
		[
			'log', 'logBasic', 'logComposition', 'logInput',
			'handlePasteEvent', 'useGenerator'
		].forEach(function (p) {
			if (p in opts) {
				this[p] = opts[p];
			}
		}, this);

		functionKeyCodes = getFunctionKeyCodes();
		if (functionKeyCodes) {
			ctrlMap = getCtrlMap();
			codeToCharMap = getCodeToCharMap();
			functionKeyNames = flip(functionKeyCodes);
			charToCodeMap = flip(codeToCharMap);

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
		codeToCharMap = null;
		functionKeyNames = null;
		charToCodeMap = null;

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
		if (typeof listener == 'function') {
			var index = listeners[type].indexOf(listener);
			if (index >= 0) {
				listeners[type].splice(index, 1);
			}
		}
		else {
			listeners[type].length = 0;
		}

		return this;
	}

	// code utils
	function objectFromCode (code) {
		var result = null;

		if (typeof code != 'number') {
			return result;
		}

		if (code < 0) {
			code = Math.abs(code);
			var m = {
				S: !!(code & BIT_SHIFT),
				C: !!(code & BIT_CTRL),
				A: !!(code & BIT_ALT)
			};

			code &= BIT_BASE;
			var base = code in functionKeyCodes ?
				functionKeyCodes[code] :
				String.fromCharCode(code);

			if (0 <= code && code < 32 && Object.keys(m).length == 0) {
				m.C = true;
				m.S = m.A = false;
			}

			var parts = Object.keys(m).filter(function (n) {return m[n]});
			parts.push(toOuterBase(base));
			result = parseKeyDesc('\ue000<' + parts.join('-') + '>');
		}
		else if (code < 32 && !(code in charToCodeMap)) {
			result = parseKeyDesc('\ue000<C-' + String.fromCharCode(64 + code) + '>');
		}
		else {
			result = parseKeyDesc(String.fromCharCode(code));
		}

		if (!result || !result.prop) {
			return null;
		}

		return result.prop;
	}

	function insertFnKeyHeader (s) {
		return s.replace(/(\u0016)?(<[^>]+>|#\d{1,2})/g, function ($0, $1) {
			return $1 == '\u0016' ? $0 : '\ue000' + $0;
		});
	}

	function doParse (desc) {
		var parts = desc.toLowerCase().split('-');
		var shift = false, ctrl = false, alt = false;

		while (parts.length > 1 && /^[sca]$/i.test(parts[0])) {
			shift = parts[0] == 's' || shift;
			ctrl = parts[0] == 'c' || ctrl;
			alt = parts[0] == 'a' || alt;
			parts.shift();
		}

		var name = toInnerBase(parts[0]);
		var result = {
			code:0,
			name:name,
			shift:shift,
			ctrl:ctrl,
			alt:alt,
			special:true
		};

		if (name in FUNCTION_KEY_ALIASES) {
			if (typeof FUNCTION_KEY_ALIASES[name] == 'number') {
				name = String.fromCharCode(FUNCTION_KEY_ALIASES[name]);
			}
			else {
				name = FUNCTION_KEY_ALIASES[name];
			}
		}

		if (name in functionKeyNames) {
			result.code = codeToCharMap[functionKeyNames[name]]
				|| -functionKeyNames[name];
			if (!ctrl && !shift && !alt && result.code in charToCodeMap) {
				result.key = String.fromCharCode(result.code);
			}
			return result;
		}

		if (alt) {
			result.code = -name.toUpperCase().charCodeAt(0);
			result.name = toOuterBase(result.name.toUpperCase());
			result.special = false;
			return result;
		}

		if (/^[@a-z\[\\\]_]$/.test(name) && ctrl && !shift && !alt) {
			result.code = name.charCodeAt(0) & 0x1f;
			result.key = String.fromCharCode(result.code);
			result.special = false;
			return result;
		}

		if (name.length == 1) {
			result.code = name.charCodeAt(0);
			result.name = toOuterBase(result.name);
			result.special = false;
			return result;
		}

		return null;
	}

	function parseKeyDesc (desc, escaped) {
		if (typeof desc != 'string') {
			desc = '' + desc;
		}
		if (!escaped) {
			var consumed = 0, re;
			if ((re = /^\ue000<([^>]+)>/.exec(desc))) {
				desc = re[1];
				consumed = re[0].length;
			}
			else if ((re = /^\ue000#(\d{1,2})/.exec(desc))) {
				desc = 'f' + re[1];
				consumed = re[0].length;
			}
			if (consumed) {
				var obj = doParse(desc);
				if (!obj) return {consumed:consumed};
				var code = obj.code;
				var char = code < 0 ? '' : String.fromCharCode(code);
				var key;
				if ('key' in obj) {
					key = obj.key;
				}
				else {
					key = [];
					obj.shift && key.push('S');
					obj.ctrl  && key.push('C');
					obj.alt   && key.push('A');
					if (code < 0 || key.length) {
						code = -(Math.abs(code) +
							   (obj.shift ? BIT_SHIFT : 0) +
							   (obj.ctrl ?  BIT_CTRL : 0) +
							   (obj.alt ?   BIT_ALT : 0));
					}
					key.push(obj.name);
					key = '<' + key.join('-') + '>';
				}
				return {
					consumed:consumed,
					prop: new VirtualInputEvent(
						null,
						code, char, key,
						obj.shift, obj.ctrl, obj.alt,
						obj.special
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
				charToCodeMap && desc.charCodeAt(0) in charToCodeMap
			)
		};
	}

	function isInputEvent (e) {
		return e instanceof VirtualInputEvent;
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
		if (dequeue.length == 0) return;

		isSweeping = true;
		if (useGenerator) {
			fire('input', function* () {
				while (dequeue.length) {
					yield dequeue.shift();
				}
				isSweeping = false;
			});
		}
		else {
			try {
				while (lockCount == 0 && dequeue.length) {
					fire('input', dequeue.shift());
				}
			}
			finally {
				isSweeping = false;
			}
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

	function getDocument () {
		var result = [];

		result.push(
			'Key stroke descriptor',
			'=====================',
			'',
			'## Syntax',
			'',
			'`<` **modifier***  **name** `>`',
			'',
			'## Modifier',
			'',
			'one of `S-` | `C-` | `A-`'
		);

		result.push(
			'',
			'## Name',
			'',
			'one of',
			''
		);
		for (var i in functionKeyNames) {
			var tmp = ['* `' + i + '`'];
			for (var j in FUNCTION_KEY_ALIASES) {
				var f = FUNCTION_KEY_ALIASES[j];
				if (f === i) {
					tmp.push('`' + j + '`');
				}
			}
			result.push(tmp.join(' '));
		}

		for (var i in FUNCTION_KEY_ALIASES) {
			var f = FUNCTION_KEY_ALIASES[i];
			if (typeof f == 'number') {
				result.push('* `' + i + '` (alias of `' + String.fromCharCode(f) + '`)');
			}
		}

		return result.join('\n');
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
	// >>>

	// boot
	(function () {
		if (g.gecko) return;
		for (var i in g) {
			if (!/moz/i.test(i)) continue;
			g.gecko = true;
			break;
		}
	})();

	(typeof global != 'undefined' ? global : g).qeema = Object.create(Object.prototype, {
		install: {value:install},
		uninstall: {value:uninstall},
		addListener: {value:addListener},
		removeListener: {value:removeListener},

		objectFromCode: {value:objectFromCode},
		nopObject: {value:nopObject},
		insertFnKeyHeader: {value:insertFnKeyHeader},
		parseKeyDesc: {value:parseKeyDesc},
		isInputEvent: {value:isInputEvent},
		VirtualInputEvent: {value:VirtualInputEvent},

		editable: {value:editable},

		createSequences: {value:createSequences},
		setDequeue: {value:setDequeue},
		push: {value:push},
		unshift: {value:unshift},
		invalidate: {value:invalidate},
		sweep: {value:sweep},
		lock: {value:lock},
		unlock: {value:unlock},
		getDocument: {value:getDocument},
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
		},

		handlePasteEvent: {
			get: function () {return handlePasteEvent},
			set: function (v) {handlePasteEvent = !!v}
		},
		useGenerator: {
			get: function () {return useGenerator},
			set: function (v) {useGenerator = !!v}
		}
	});

})(this);

// vim:set ts=4 sw=4 fenc=UTF-8 ff=unix ft=javascript fdm=marker fmr=<<<,>>> :
