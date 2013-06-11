/**
 * background side hotkey manager
 * =============================================================================
 *
 *
 * @author akahuku@gmail.com
 * @version $Id: Hotkey.js 306 2013-06-11 01:09:53Z akahuku $
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

(function () {
	'use strict';

	var DEFAULT_HOTKEYS_DESC =  '<insert>,<c-enter>';

	var wasaviKeyTable = {
		// 0 - 9
		// a - z
		'backspace':8, 'bs':8,
		'tab':9,
		'enter':13, 'return':13, 'ret':13,
		'pageup':33,
		'pagedown':34,
		'end':35,
		'home':36,
		'left':37,
		'up':38,
		'right':39,
		'down':40,
		'insert':45, 'ins':45,
		'delete':46, 'del':46,
		'f1':112, 'f2':113, 'f3':114, 'f4':115,
		'f5':116, 'f6':117, 'f7':118, 'f8':119,
		'f9':120, 'f10':121, 'f11':122, 'f12':123
	};

	// null hotkey
	function Hotkey (emit) {
		this.onPress = null;
	}

	Hotkey.prototype = {
		canProcess:false,
		register:function (hotkeys) {
			return this.parseHotkeys(hotkeys);
		},
		parseHotkeys:function (hotkeys) {
			var result = [];

			hotkeys = (hotkeys || '').replace(/^\s+|\s+$/g, '') || DEFAULT_HOTKEYS_DESC;
			hotkeys.toLowerCase().split(/\s*,\s*/).forEach(function (sc) {
				var re = /^<([^>]+)>$/.exec(sc);
				if (!re) return;

				var modifiers = re[1].split('-');
				var key = modifiers.pop();
				if (!(key in wasaviKeyTable)) return;

				var codes = {keyCode:wasaviKeyTable[key], shiftKey:false, ctrlKey:false};
				modifiers.forEach(function (m) {
					switch (m.toLowerCase()) {
					case 's':
						codes['shiftKey'] = true;
						break;
					case 'c':
						codes['ctrlKey'] = true;
						break;
					}
				});

				result.push(codes);
			});

			if (result.length == 0) {
				result = this.parseHotkeys('');
			}

			return result;
		},
		handlePress:function () {
		}
	};

	// chrome
	function HotkeyChrome (emit) {
		return new Hotkey(emit);
	}

	// opera
	function HotkeyOpera (emit) {
		return new Hotkey(emit);
	}
	
	// firefox
	function HotkeyFirefox (emit) {
		this.constructor = Hotkey;
		this.onPress = null;
		this.emit = emit;
		this.tabs = require('sdk/tabs');
		this.hotkeyFactory = require('sdk/hotkeys').Hotkey;
		this.hotkeyObjects = null;
		this.handlePressBinded = this.handlePress.bind(this);
	}

	HotkeyFirefox.prototype = {
		canProcess:true,
		translateTable:{
			'enter':'return',
			'ret':'return',
			'ins':'insert',
			'del':'delete'
		},
		register:function (hotkeys) {
			if (this.hotkeyObjects) {
				this.hotkeysObject.forEach(function (hotkey) {
					hotkey.destroy();
				}, this);
			}

			this.hotkeyObjects = [];
			this.parseHotkeys(hotkeys).forEach(function (hotkey) {
				this.hotkeyObjects.push(this.hotkeyFactory({
					combo:hotkey,
					onPress:this.handlePressBinded
				}));
			}, this);
		},
		parseHotkeys:function (hotkeys) {
			var result = [];

			hotkeys = (hotkeys || '').replace(/^\s+|\s+$/g, '') || DEFAULT_HOTKEYS_DESC;
			hotkeys.toLowerCase().split(/\s*,\s*/).forEach(function (sc) {
				var re = /^<([^>]+)>$/.exec(sc);
				if (!re) return;

				var modifiers = re[1].split('-');
				var key = modifiers.pop();
				if (key in this.translateTable) {
					key = this.translateTable[key];
				}
				if (!(key in wasaviKeyTable)) return;

				var codes = {shift:false, control:false, alt:false, meta:false, accel:false};
				modifiers.forEach(function (m) {
					switch (m.toLowerCase()) {
					case 's':
						codes.shift = true;
						break;
					case 'c':
						codes.control = true;
						break;
					case 'a':
						codes.alt = true;
						break;
					case 'm':
						codes.meta = true;
						break;
					case 'x':
						codes.accel = true;
						break;
					}
				});

				codes = Object.keys(codes).filter(function (m) {return codes[m]});
				if (codes.length) {
					codes.push(key);
					result.push(codes.join('-'));
				}
			}, this);

			if (result.length == 0) {
				result = this.parseHotkeys('');
			}

			return result;
		},
		handlePress:function () {
			if (this.emit) {
				this.emit(this.onPress, this);
			}
			else if (this.onPress) {
				this.onPress(this);
			}
		}
	};

	function init () {
		for (var i = '0'.charCodeAt(0), goal = '9'.charCodeAt(0); i <= goal; i++) {
			wasaviKeyTable[i] = String.fromCharCode(i);
		}
		for (var i = 'a'.charCodeAt(0), goal = 'z'.charCodeAt(0); i <= goal; i++) {
			wasaviKeyTable[i] = String.fromCharCode(i);
		}
	}

	function create (window, emit) {
		if (window.chrome) {
			return new HotkeyChrome(emit);
		}
		else if (window.opera) {
			return new HotkeyOpera(emit);
		}
		else if (window.jetpack) {
			return new HotkeyFirefox(emit);
		}
	}

	init();
	exports.Hotkey = {
		create:create,
		getObjectsForDOM:function (hotkeys) {return Hotkey.prototype.parseHotkeys(hotkeys)},
		get DEFAULT_HOTKEYS_DESC () {return DEFAULT_HOTKEYS_DESC}
	};
})();

// vim:set ts=4 sw=4 fenc=UTF-8 ff=unix ft=javascript fdm=marker :
