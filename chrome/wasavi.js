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
 * @version $Id: wasavi.js 197 2012-10-14 02:23:58Z akahuku $
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

(function (global) {

/*
 * extension interface {{{1
 * ----------------
 */

/*const*/var IS_GECKO =
	window.navigator.product == 'Gecko'
	&& window.navigator.userAgent.indexOf('Gecko/') != -1;

var extensionChannel;
var wasaviFrame;

if (global.WasaviExtensionWrapper
&&  WasaviExtensionWrapper.CAN_COMMUNICATE_WITH_EXTENSION
&&  WasaviExtensionWrapper.framePageUrl.isAny) {
	extensionChannel = WasaviExtensionWrapper.create();
	extensionChannel.setMessageListener(function (req) {
		if (!req) return;
		function run (callback) {
			if (document.readyState == 'interactive'
			||  document.readyState == 'complete') {
				/*
				 * an issue of security risk about innerHTML
				 * =========================================
				 * Assigning a string to innerHTML may cause security risk.
				 * But in this code, 'wasaviFrame' content is the resource
				 * within extension package at all the time, and not be manipulated
				 * from the outside.
				 * Thus we leave innerHTML.
				 */
				document.body.innerHTML = wasaviFrame;
				delete wasaviFrame;
				callback();
			}
			else {
				document.addEventListener('DOMContentLoaded', function (e) {
					document.removeEventListener(e.type, arguments.callee, false);
					/*
					 * an issue of innerHTML: see the comment above.
					 */
					document.body.innerHTML = wasaviFrame;
					delete wasaviFrame;
					callback();
				}, false);
			}
		}
		switch (req.type) {
		case 'init-response':
			exrc = req.exrc;
			fontFamily = req.fontFamily;
			quickActivation = req.quickActivation;
			fstab = req.fstab;
			l10n = new L10n(req.messageCatalog);
			wasaviFrame = req.wasaviFrame;
			testMode = req.testMode;
			devMode = req.devMode;
			document.documentElement.setAttribute(
				'lang', l10n.getMessage('wasavi_locale_code'));
			WasaviExtensionWrapper.isTopFrame && run(function() {global.Wasavi.run();});
			break;
		case 'run':
			testMode = req.testMode;
			req.dataset = {};
			req.getAttribute = function (name) {return this.dataset[name];};
			req.setAttribute = function (name, value) {this.dataset[name] = value;};
			run(function() {install(req);});
		}
	});
	extensionChannel.connect();
}



/*
 * application constants {{{1
 * ---------------------
 */

/*const*/var VERSION = '0.4.' + (/\d+/.exec('$Revision: 197 $') || [1])[0];
/*const*/var VERSION_DESC = '$Id: wasavi.js 197 2012-10-14 02:23:58Z akahuku $';
/*const*/var CONTAINER_ID = 'wasavi_container';
/*const*/var EDITOR_CORE_ID = 'wasavi_editor';
/*const*/var LINE_INPUT_ID = 'wasavi_footer_input';
/*const*/var BRACKETS = '[{(<"\'``\'">)}]';
/*const*/var CLOSE_BRACKETS = BRACKETS.substring(BRACKETS.length / 2);
/*const*/var CSS_PREFIX = window.chrome ? '-webkit-' :
	window.opera ? '-o-' : IS_GECKO ? '-moz-' : '';
/*const*/var ACCEPTABLE_TYPES = {
	textarea: true,
	text:     true,
	search:   true,
	tel:      true,
	url:      true,
	email:    true,
	password: true,
	number:   true
};
/*const*/var LATIN1_PROPS = [
	'Cc', 'Cc', 'Cc', 'Cc', 'Cc', 'Cc', 'Cc', 'Cc',
	'Cc', 'Zs', 'Cc', 'Cc', 'Cc', 'Cc', 'Cc', 'Cc',
	'Cc', 'Cc', 'Cc', 'Cc', 'Cc', 'Cc', 'Cc', 'Cc',
	'Cc', 'Cc', 'Cc', 'Cc', 'Cc', 'Cc', 'Cc', 'Cc',
	'Zs', 'Po', 'Po', 'Po', 'Sc', 'Po', 'Po', 'Po', //  !"#$%&'
	'Ps', 'Pe', 'Po', 'Sm', 'Po', 'Pd', 'Po', 'Po', // ()*+,-./
	'Ld', 'Ld', 'Ld', 'Ld', 'Ld', 'Ld', 'Ld', 'Ld', // 01234567
	'Ld', 'Ld', 'Po', 'Po', 'Sm', 'Sm', 'Sm', 'Po', // 89:;<=>?
	'Po', 'Lu', 'Lu', 'Lu', 'Lu', 'Lu', 'Lu', 'Lu', // @ABCDEFG
	'Lu', 'Lu', 'Lu', 'Lu', 'Lu', 'Lu', 'Lu', 'Lu', // HIJKLMNO
	'Lu', 'Lu', 'Lu', 'Lu', 'Lu', 'Lu', 'Lu', 'Lu', // PQRSTUVW
	'Lu', 'Lu', 'Lu', 'Ps', 'Po', 'Pe', 'Sk', 'Pc', // XYZ[\]^_
	'Sk', 'Ll', 'Ll', 'Ll', 'Ll', 'Ll', 'Ll', 'Ll', // `abcdefg
	'Ll', 'Ll', 'Ll', 'Ll', 'Ll', 'Ll', 'Ll', 'Ll', // hijklmno
	'Ll', 'Ll', 'Ll', 'Ll', 'Ll', 'Ll', 'Ll', 'Ll', // pqrstuvw
	'Ll', 'Ll', 'Ll', 'Ps', 'Sm', 'Pe', 'Sm', 'Cc'  // xyz{|}~
];
/*const*/var EXFLAGS = {
	addr2All: 1<<2,
	addr2None: 1<<3,
	addrZero: 1<<4,
	addrZeroDef: 1<<5,
	printDefault: 1<<6,
	clearFlag: 1<<7,
	newScreen: 1<<8,
	roundMax: 1<<9,
	updateJump: 1<<10,
	multiAsync: 1<<11
};
/*const*/var LINE_NUMBER_MARGIN_LEFT = 2;
/*const*/var LINE_NUMBER_MAX_WIDTH = 6;
/*const*/var COMPOSITION_CLASS = 'wasavi_composition';
/*const*/var MARK_CLASS = 'wasavi_mark';
/*const*/var EMPHASIS_CLASS = 'wasavi_em';

/*
 * classes {{{1
 * ----------------
 */

/*constructor*/function Theme () {
	var container;
	var fontStyle;
	var lineHeight;
	var colors = {
		statusHue:-1,
		background:'',
		overTextMarkerFg:'',
		warnedStatusFg:'', warnedStatusBg:'',
		invertFg:'', invertBg:'',
		blurFg:'', blurBg:'',

		rowBgOdd:['#wasavi_editor>div:nth-child(odd)', ''],
		editCursorFg:['#wasavi_edit_cursor', ''],
		statusFg:['#wasavi_footer', ''],
		lineNumberFg:['#wasavi_editor.n>div:before', ''],
		lineNumberBg:['#wasavi_editor.n>div:before', ''],
		rowFg:['#wasavi_editor>div', ''],
		rowBg:['#wasavi_editor>div', ''],
		highlightFg:['#wasavi_editor>div>span.' + EMPHASIS_CLASS, ''],
		highlightBg:['#wasavi_editor>div>span.' + EMPHASIS_CLASS, ''],
		lineInputFg:['#wasavi_footer_input,#wasavi_footer_input_indicator', ''],
		lineInputBg:['#wasavi_footer_input,#wasavi_footer_input_indicator', ''],
		consoleFg:['#wasavi_console', ''],
		consoleBg:['#wasavi_console_container', '']
	};
	var colorSets = {
		blight: {
			statusHue:-1,
			background:'white',
			overTextMarkerFg:'#888',
			warnedStatusFg:'white', warnedStatusBg:'#f00',
			invertFg:'white', invertBg:'black',
			blurFg:'white', blurBg:'gray',

			rowBgOdd:'#f3f6fa',
			editCursorFg:'black',
			statusFg:'white',
			lineNumberFg:'#888', lineNumberBg:'#fff',
			rowFg:'black', rowBg:'white',
			highlightFg:'highlighttext', highlightBg:'highlight',
			lineInputFg:'white', lineInputBg:'rgba(0,0,0,0.5)',
			consoleFg:'white', consoleBg:'rgba(0,0,0,0.8)'
		},
		charcoal: {
			statusHue:'#c2bfa5',
			background:'#333',
			overTextMarkerFg:'#add8e6',
			warnedStatusFg:'white', warnedStatusBg:'#f00',
			invertFg:'#333', invertBg:'#f0e68c',
			blurFg:'white', blurBg:'gray',

			rowBgOdd:'#444',
			editCursorFg:'white',
			statusFg:'black',
			lineNumberFg:'#ff0', lineNumberBg:'#333',
			rowFg:'#fff', rowBg:'#333',
			highlightFg:'highlight', highlightBg:'highlighttext',
			lineInputFg:'black', lineInputBg:'rgba(255,255,255,0.5)',
			consoleFg:'black', consoleBg:'rgba(159,205,74,0.8)'
		}
	};

	function getCSSRules () {
		var pieces = {};
		for (var i in colors) {
			if (!(colors[i] instanceof Array)) continue;
			var selector = colors[i][0];
			var rule = colors[i][1];
			(pieces[selector] || (pieces[selector] = []))
				.push((/Fg$/.test(i) ? 'color' : 'background-color') + ':' + rule);
		}

		var buffer = [];
		for (var i in pieces) {
			buffer.push(i + '{', pieces[i].join(';') + ';', '}');
		}

		return buffer;
	}
	function getImageFromCanvas (callback) {
		var result = '';
		var canvas = container.appendChild(document.createElement('canvas'));
		try {
			callback(canvas, canvas.getContext('2d'));
			result = canvas.toDataURL('image/png');
		}
		finally {
			canvas.parentNode.removeChild(canvas);
		}
		return result;
	}
	function getOverTextMarker (forecolor, backcolor) {
		return getImageFromCanvas(function (canvas, ctx) {
			canvas.height = lineHeight;
			ctx.fontStyle = fontStyle;
			canvas.width = ctx.measureText('~').width;
			ctx.fillStyle = backcolor;
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			ctx.fillStyle = forecolor;
			ctx.textBaseline = 'top';
			ctx.textAlign = 'left';
			ctx.fillText('~', 0, 0);
		});
	}
	function getBackgroundImage (backcolor) {
		return getImageFromCanvas(function (canvas, ctx) {
			canvas.width = canvas.height = 8;
			ctx.fillStyle = backcolor;
			ctx.fillRect(0, 0, canvas.width, canvas.height);
		});
	}
	function getMirror () {
		var result = {};
		for (var i in colors) {
			result[i] = colors[i] instanceof Array ? colors[i][1] : colors[i];
		}
		return result;
	}
	function getStyleElement () {
		return $('wasavi_theme_styles');
	}
	function getStatuslineBackground (key) {
		switch (typeof key) {
		case 'number':
			var n = new Date;
			key = key - 0 || 0;
			key = key < 0 ?
				Math.floor((n.getHours() * 3600 + n.getMinutes() * 60 + n.getSeconds()) / 240) :
				key % 360;
			return CSS_PREFIX + 'linear-gradient(top,hsl(' + key + ',100%,33%) 0%,#000 100%);';
		case 'string':
			return key;
		}
		return '#888';
	}
	function select (colorSet) {
		if (typeof colorSet == 'object') {
			var newColors = {};
			for (var i in colors) {
				if (!(i in colorSet)) return;
				newColors[i] = colors[i] instanceof Array ?
					[colors[i][0], colorSet[i]] : colorSet[i];
			}
			colors = newColors;
			return true;
		}
		else {
			colorSet || (colorSet = '');
			if (colorSet == '' || !(colorSet in colorSets)) {
				colorSet = 'blight';
			}
			return arguments.callee(colorSets[colorSet]);
		}
	}
	function update () {
		if (!container || !colors || colors.background == '') return;

		var styles = getCSSRules();

		var otm = getOverTextMarker(colors.overTextMarkerFg, colors.background);
		styles.push(
			'#wasavi_container{',
			'background:' + colors.background + ' url(' + otm + ') left top repeat-y;',
			'}');

		var bgImage = getBackgroundImage(colors.rowBg[1]);
		styles.push(
			'#wasavi_editor{',
			'background:url(' + bgImage + ') left top no-repeat;',
			'}');

		var statuslineBackground = getStatuslineBackground(colors.statusHue);
		styles.push(
			'#wasavi_footer{',
			'background:' + statuslineBackground,
			'}');

		var node = getStyleElement();
		emptyNodeContents(node);
		node.appendChild(document.createTextNode(styles.join('\n')));

		this.colors = getMirror();
	}
	function dispose () {
		container = null;
		emptyNodeContents(getStyleElement());
	}

	this.select = select;
	this.update = update;
	this.dispose = dispose;

	this.__defineSetter__('container', function (v) {container = v;});
	this.__defineSetter__('fontStyle', function (v) {fontStyle = v;});
	this.__defineSetter__('lineHeight', function (v) {lineHeight = v;});
}

/*constructor*/function KeyManager () {
	// consts
	var specialKeys = {
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
	var specialKeyCodes = {
		8:8,
		9:9,
		13:13,
		27:27,
		46:127
	};
	var translateTableWebkit = {
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

	var specialKeyName;
	var specialKeyCode;
	var eventHandlers = [];
	var bufferedStrokes = [];

	function install (handler) {
		addListener(handler);
		document.addEventListener('keydown', handleKeydown, true);
		document.addEventListener('keypress', handleKeypress, true);
	}
	function uninstall () {
		document.removeEventListener('keydown', handleKeydown, true);
		document.removeEventListener('keypress', handleKeypress, true);
	}
	function addListener (handler) {
		if (typeof handler != 'function') return;
		var index = eventHandlers.indexOf(handler);
		if (index < 0) {
			eventHandlers.push(handler);
		}
	}
	function removeListener (handler) {
		if (typeof handler != 'function') return;
		var index = eventHandlers.indexOf(handler);
		if (index >= 0) {
			eventHandlers.splice(index, 1);
		}
	}
	function dispose () {
		eventHandlers = [];
		uninstall();
	}
	function fire (e) {
		eventHandlers.forEach(function (handler) {
			handler(e);
		});
	}
	function handleKeydown (e) {
		if (e.shiftKey && e.keyCode == 16 || e.ctrlKey && e.keyCode == 17) return;
		if (window.chrome) {
			specialKeyName = false;

			// special keys
			if (specialKeyName === false) {
				var translated = translateTableWebkit[e.keyIdentifier.toLowerCase()];
				if (translated !== undefined) {
					specialKeyName = specialKeys[translated] || false;
					specialKeyCode = specialKeyCodes[translated] || -translated;
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
				handleKeypress(e);
			}
		}
		else {
			specialKeyName = e.keyCode == e.which && specialKeys[e.keyCode] ?
				specialKeys[e.keyCode] : false;
			specialKeyCode = specialKeyCodes[e.keyCode] || -e.keyCode;
		}
	}
	function handleKeypress (e) {
		e.preventDefault();

		var c = [];
		var baseKeyName;
		var logicalCharCode;

		if (specialKeyName) {
			e.shiftKey && c.push('s');
			e.ctrlKey  && c.push('c');
			baseKeyName = specialKeyName;
			c.push(specialKeyName);
			logicalCharCode = specialKeyCode;
		}
		else {
			var keyCode = e.keyCode || e.charCode;

			// ctrl code shortcuts: ctrl + *
			if (e.ctrlKey && keyCode >= 64 && keyCode <= 127) {
				baseKeyName = '^' + String.fromCharCode(keyCode & 0x5f);
				c.push(baseKeyName);
				logicalCharCode = keyCode & 0x1f;
			}
			// printable chars
			else if (keyCode >= 32 && keyCode <= 127) {
				baseKeyName = String.fromCharCode(keyCode);
				c.push(baseKeyName);
				logicalCharCode = keyCode;
			}
			// ctrl code directly
			else if (keyCode >= 0 && keyCode <= 31) {
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

		fire({
			code:             logicalCharCode,
			identifier:       baseKeyName,
			fullIdentifier:   c.join('-'),
			shift:            e.shiftKey,
			ctrl:             e.ctrlKey,
			nativeKeyCode:    e.keyCode,
			nativeCharCode:   e.charCode,
			nativeIdentifier: e.keyIdentifier
		});
	}
	function code2letter (c, useSpecial) {
		if (typeof c != 'number') return '';
		if (c >= 0) return String.fromCharCode(c);
		if (useSpecial && specialKeys[-c]) return '<' + specialKeys[-c] + '>';
		return '';
	}
	function keyName2code (name) {
		name = name.replace(/^<|>$/g, '').toLowerCase();

		for (var i in specialKeys) {
			if (specialKeys[i] == name) {
				return specialKeyCodes[i] || -i;
			}
		}
	}
	function push (e) {
		bufferedStrokes.push(e);
	}
	function sweep () {
		if (bufferedStrokes.length == 0) return;

		var e;
		var bs = bufferedStrokes.slice(0);
		bufferedStrokes.length = 0;
		while (bs.length) {
			fire(bs.shift());
		}
	}

	this.install = install;
	this.uninstall = uninstall;
	this.code2letter = code2letter;
	this.keyName2code = keyName2code;
	this.push = push;
	this.sweep = sweep;
	this.dispose = dispose;
}

/*constructor*/function VariableItem (name, type, defaultValue, subSetter) {
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
					return getFindRegex(v.nativeValue);
				}
			})(this);
		default:
			throw new Error('*invalid type for getBinder: ' + this.type + ' *');
		}
	}
};

/*constructor*/function Configurator (internals, abbrevs) {
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
		var result = [_('*** options ***')];
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
				||  i == 1 && line.length >  phaseThreshold - gap) {
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
	this.dumpData = function () {
		var result = [];
		var ab = reverseObject(abbrevs);
		for (var i = 0; i < internals.length; i++) {
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
	};
	this.__defineGetter__('vars', function () {return vars;});
	init();
}

/*constructor*/function Position (row, col) {
	this.row = row;
	this.col = col;
}
Position.prototype = {
	toString: function () {
		return '[object Position(' + this.row + ',' + this.col + ')]';
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

/*constructor*/function RegisterItem () {
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

/*constructor*/function Registers (loadCallback, ignoreStorage) {
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

	var unnamed;
	var named;
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
	function load (callback) {
		unnamed = new RegisterItem();
		named = {};
		getLocalStorage(storageKey, function (value) {
			!ignoreStorage && restore(value || '');
			callback && callback();
			callback = null;
		});
	}
	function isWritable (name) {
		return /^[1-9a-zA-Z@]$/.test(name);
	}
	function isReadable (name) {
		return /^["1-9a-z@.:*\/]$/.test(name);
	}
	function exists (name) {
		if (!isReadable(name)) {
			return false;
		}
		switch (name) {
		case "*":
			return extensionChannel && typeof extensionChannel.clipboardData == 'string';
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
			if (state == 'normal') {
				if (prefixInput.operation == 'd' && '%`/?()Nn{}'.indexOf(prefixInput.motion) >= 0
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
				name == '*' && extensionChannel && extensionChannel.setClipboard(item.data);
			}
			else if (/^[@.:\/]$/.test(name) && !isInteractive) {
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
			name == '*' && extensionChannel && item.set(extensionChannel.clipboardData);
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

	this.__defineGetter__('storageKey', function () {return storageKey;});
	this.set = set;
	this.get = get;
	this.isWritable = isWritable;
	this.isReadable = isReadable;
	this.exists = exists;
	this.dump = dump;
	this.dumpData = dumpData;
	this.save = save;
	this.load = load;

	load(loadCallback);
	loadCallback = null;
}

/*constructor*/function PrefixInput () {
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
				var re = /^(".)?([1-9][0-9]*)?(.)([1-9][0-9]*)?(.)(.*)$/.exec(arg);
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

				var re = /^(".)?([1-9][0-9]*)?(.)(.*)$/.exec(arg);
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
		return new PrefixInput({
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
	function _toVisibleString () {
		return [register, count1, operation, count2, motion, trailer]
			.map(function (s) {return toVisibleString(s);})
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

	this.__defineGetter__('register', function () {return register.substring(1) || '';});
	this.__defineGetter__('operation', function () {return operation;});
	this.__defineGetter__('motion', function () {return motion;});
	this.__defineGetter__('count1', function () {return count1 || 0;});
	this.__defineGetter__('count2', function () {return count2 || 0;});
	this.__defineGetter__('count', function () {return (count1 || 1) * (count2 || 1);});
	this.__defineGetter__('trailer', function () {return trailer;});
	this.__defineGetter__('isEmpty', function () {return isEmpty;});
	this.__defineGetter__('isEmptyOperation', function () {return operation == '';});
	this.__defineGetter__('isCountSpecified', function () {return !!(count1 || count2);});
	this.__defineGetter__('isLocked', function () {return isLocked;});

	this.__defineSetter__('register', setRegister);
	this.__defineSetter__('operation', setOperation);
	this.__defineSetter__('motion', setMotion);
	this.__defineSetter__('trailer', setTrailer);
	this.__defineSetter__('isLocked', setLocked);

	this.reset = reset;
	this.clone = clone;
	this.assign = assign;
	this.toString = toString;
	this.toVisibleString = _toVisibleString;

	this.appendCount = appendCount;
	this.appendRegister = appendRegister;
	this.appendOperation = appendOperation;
	this.appendMotion = appendMotion;
	this.appendTrailer = appendTrailer;

	init.apply(null, arguments);
}

/*constructor*/function CursorUI (editor, comCursor, editCursor) {
	var CURSOR_SPAN_CLASS = 'wasavi_command_cursor_span';
	var cursorType = 'command';
	var locked = false;
	var focused = false;
	var visible = false;
	var inComposition = false;
	var wrapper = null;
	var commandCursorOffsetLeft = false;
	var commandCursorOffsetTop = false;
	var fixed = document.defaultView.getComputedStyle($(CONTAINER_ID), '')
		.position == 'fixed';

	/*constructor*/function CommandWrapper (mode) {
		var cursorBlinkTimer;

		function getCursorSpan () {
			var spans = editor.getSpans(CURSOR_SPAN_CLASS);
			return spans.length ? spans[0] : null;
		}
		function handleBlink () {
			if (!comCursor) {
				stopBlink();
				return;
			}

			var span = getCursorSpan();
			if (span) {
				if (span.getAttribute('data-blink-active') == '1') {
					span.style.color = span.style.backgroundColor = '';
					span.setAttribute('data-blink-active', '0');
				}
				else {
					span.style.color = theme.colors.invertFg;
					span.style.backgroundColor = theme.colors.invertBg;
					span.setAttribute('data-blink-active', '1');
				}
			}
			else {
				var s = document.defaultView.getComputedStyle(comCursor, '');
				comCursor.style.visibility = s.visibility == 'visible' ? 'hidden' : 'visible';
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
			stopBlink();
			editor.unEmphasis(CURSOR_SPAN_CLASS);
			comCursor.style.display = 'none';
		};
		this.show = function () {
			var ch = editor.charAt(editor.selectionStart);
			if (ch != '' && /[^\u0000-\u001f\u007f]/.test(ch)) {
				comCursor.style.display = 'none';
				var span = getCursorSpan();
				if (!span) {
					span = editor.emphasis(undefined, 1, CURSOR_SPAN_CLASS)[0];
				}
				span.style.color = theme.colors.invertFg;
				span.style.backgroundColor = theme.colors.invertBg;
				span.setAttribute('data-blink-active', '1');
			}
			else {
				editor.unEmphasis(CURSOR_SPAN_CLASS);
				comCursor.style.display = 'block';
				comCursor.style.visibility = 'visible';
				comCursor.childNodes[0].textContent = ' ';
				var coord = getCommandCursorCoord();
				coord.left -= fixed ? docScrollLeft() : 0;
				coord.top -= fixed ? docScrollTop() : 0;
				comCursor.style.left = (coord.left - editor.elm.scrollLeft) + 'px';
				comCursor.style.top = (coord.top - editor.elm.scrollTop) + 'px';
				comCursor.style.height = lineHeight + 'px';
				comCursor.style.color = theme.colors.invertFg;
				comCursor.style.backgroundColor = theme.colors.invertBg;
			}
			editor.adjustBackgroundImage();
			startBlink();
		};
		this.lostFocus = function () {
			stopBlink();
			var span = getCursorSpan();
			if (span) {
				span.style.color = theme.colors.blurFg;
				span.style.backgroundColor = theme.colors.blurBg;
			}
			else {
				comCursor.style.display = 'block';
				comCursor.style.visibility = 'visible';
				comCursor.style.color = theme.colors.blurFg;
				comCursor.style.backgroundColor = theme.colors.blurBg;
			}
		};
		this.dispose = function () {
			stopBlink();
		};
		this.compositionUpdate =
		this.compositionComplete = function () {};
	}

	/*constructor*/function EditWrapper (mode) {
		var leading;

		function getCompositionSpan () {
			var spans = editor.getSpans(COMPOSITION_CLASS);
			return spans.length ? spans[0] : null;
		}
		function createCompositionSpan () {
			var n = editor.selectionStart;
			var span = getCompositionSpan();
			if (!span) {
				if (n.col == 0) {
					span = document.createElement('span');
					span.className = COMPOSITION_CLASS;
					var node = editor.rowNodes(n);
					node.insertBefore(span, node.firstChild);
				}
				else {
					span = editor.emphasis(
						new Position(n.row, 0), n.col, COMPOSITION_CLASS)[0];
				}
			}
			var s = document.defaultView.getComputedStyle(span, '');
			span.style.color = s.backgroundColor;
			span.style.backgroundColor = s.backgroundColor;
			return span;
		}
		function removeCompositionSpan () {
			editor.unEmphasis(COMPOSITION_CLASS);
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
			if (runLevel || inComposition) {
				return;
			}
			editCursor.style.display = 'block';

			var s = editor.selectionStart;
			var c = $(CONTAINER_ID).getBoundingClientRect();
			var r = editor.rowNodes(s).getBoundingClientRect();

			editCursor.style.left = Math.floor(r.left - c.left) + 'px';
			editCursor.style.top = Math.floor(r.top - c.top) + 'px';
			editCursor.style.width = Math.floor(r.right - r.left) + 'px';
			editCursor.style.height = Math.floor(docClientHeight() - r.top - 1) + 'px';

			removeCompositionSpan();
			var span = createCompositionSpan();
			editCursor.value = leading = span.textContent;
			editCursor.selectionStart = editCursor.value.length;
			editCursor.selectionEnd = editCursor.value.length;

			editCursor.focus();
		};
		this.lostFocus = function () {};
		this.dispose = function () {};
	}
	function getLineNumberWidth () {
		return Math.min(6, (editor.rowLength + '').length);
	}
	function getPaddingLeft (lineNumberWidth) {
		lineNumberWidth || (lineNumberWidth = getLineNumberWidth());
		if (!config.vars.number) return '0';
		return (LINE_NUMBER_MAX_WIDTH + charWidth * (lineNumberWidth + 1)) + 'px';
	}
	function syncPosition () {
		fixPosition();

		var caretdiv = $('wasavi_multiline_scaler');
		var lineNumberWidth = getLineNumberWidth();
		var newClass = config.vars.number ? ('n n' + lineNumberWidth) : '';

		if (editor.elm.className != newClass) {
			editor.elm.className = newClass;
		}

		var n = editor.selectionStart;
		caretdiv.textContent = editor.rows(n);
		caretdiv.style.paddingLeft = getPaddingLeft(lineNumberWidth);

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
		span.style.color = theme.colors.highlightFg;
		span.style.backgroundColor = theme.colors.highlightBg;
		if (/^[\r\n\t]?$/.test(span.textContent)) {
			span.textContent = ' ';
		}
	}

	function ensureVisible (smooth) {
		syncPosition();

		var caret = getCommandCursorCoord();
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

	function getCommandCursorCoord () {
		var div = $('wasavi_multiline_scaler');
		var caret = $('wasavi_caret');
		var currentRow = editor.rowNodes(editor.selectionStartRow);
		var s = document.defaultView.getComputedStyle(div, '');
		var result2 = {
			left:currentRow.offsetLeft + caret.offsetLeft - parseInt(s.paddingLeft, 10),
			top:currentRow.offsetTop + caret.offsetTop - parseInt(s.paddingTop, 10)
		};
		result2.right = result2.left + caret.offsetWidth;
		result2.bottom = result2.top + caret.offsetHeight;

		return result2;
	}
	function fixPosition () {
		if (editor.selected) return;

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
		if (locked) return;

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
		inComposition = true;
		wrapper.compositionUpdate(e.data);
	}
	function handleCompositionUpdate (e) {
		wrapper.compositionUpdate(e.data);
	}
	function handleCompositionEnd (e) {
		wrapper.compositionComplete(e.data);
		inComposition = false;
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
	function dispose () {
		wrapper && wrapper.dispose();
		editor = comCursor = editCursor = wrapper = null;
	}

	this.ensureVisible = ensureVisible;
	this.update = update;
	this.setupEventHandlers = setupEventHandlers;
	this.dispose = dispose;

	this.__defineGetter__('type', function () {return cursorType;});
	this.__defineGetter__('focused', function () {return focused;});
	this.__defineGetter__('visible', function () {return visible;});
	this.__defineGetter__('commandCursor', function () {return comCursor;});
	this.__defineGetter__('editCursor', function () {return editCursor;});
	this.__defineGetter__('inComposition', function () {return inComposition;});
	this.__defineGetter__('locked', function () {return locked;});
	this.__defineSetter__('locked', function (v) {locked = v;});
}

/*constructor*/function RegexConverter () {
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
	function convert (s) {
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

/*constructor*/function Marks (editor, ignoreStorage) {
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
		dataset(targetElement, 'wasaviMarks', serialize());
	}
	function isValidName (name) {
		return /^[a-z']$/.test(name);
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
	function get (name) {
		name = regalizeName(name);
		return isValidName(name) && name in marks ? marks[name] : undefined;
	}
	function update (pos, func) {
		function setMarks () {
			var usedMarks = {};
			var r = document.createRange();
			for (var i in marks) {
				var m = marks[i];
				if (m.row >= editor.rowLength
				||  m.row == editor.rowLength - 1 && m.col > editor.rows(m.row)) {
					m.row = m.col = 0;
				}
				if (m.row > pos.row || m.row == pos.row && m.col >= pos.col) {
					usedMarks[i] = true;

					var iter = document.createNodeIterator(
						editor.elm.childNodes[m.row],
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
			var nodes = editor.getSpans(MARK_CLASS);
			for (var i = 0, goal = nodes.length; i < goal; i++) {
				var span = nodes[i];
				var index = dataset(span, 'index');
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
			a.push(
				' ' + i + '  ' +
				'  ' + ('    ' + (marks[i].row + 1)).substr(-5) +
				'  ' + ('   ' + (marks[i].col)).substr(-4) +
				'  ' + toVisibleString(editor.rows(marks[i]))
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
		editor = null;
	}
	this.set = set;
	this.get = get;
	this.update = update;
	this.dump = dump;
	this.dumpData = dumpData;
	this.save = save;
	this.isValidName = isValidName;
	this.clear = clear;
	this.dispose = dispose;

	restore(!ignoreStorage && dataset(targetElement, 'wasaviMarks') || '');
}

/*constructor*/function RegexFinderInfo () {
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
	this.__defineGetter__('head', function () {return head;});
	this.__defineGetter__('direction', function () {return direction;});
	this.__defineGetter__('offset', function () {return offset;});
	this.__defineGetter__('scrollTop', function () {return scrollTop;});
	this.__defineGetter__('scrollLeft', function () {return scrollLeft;});
	this.__defineGetter__('pattern', function () {return pattern;});
	this.__defineGetter__('verticalOffset', function () {return verticalOffset;});
	this.__defineGetter__('text', function () {return text;});
	this.__defineSetter__('text', function (v) {text = v;});
	this.push = push;
	this.setPattern = setPattern;
}

/*constructor*/function Editor (element) {
	this.elm = $(element);
	if (!this.elm) {
		devMode && console.error('*** wasavi: Editor constructor: invalid element: ' + element);
	}
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
			if (arg instanceof Position) {
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
			if (arg instanceof Position) {
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
			if (arg instanceof Position) {
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

			return cp <= 0x7f ? getLatin1Prop(cp).charAt(0) : getUnicodeBlock(cp);
		},
		charRectAt: function () {
			var a = arg2pos(arguments);
			var result = this.emphasis(a, 1)[0].getBoundingClientRect();
			this.unEmphasis();
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
			var re = /^(\s*).*\n$/.exec(this.elm.childNodes[a.row].textContent);
			a.col = re ? re[1].length : 0;
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
		getSpans: function (className) {
			return document.querySelectorAll(
				'#wasavi_editor>div>span' + (className ? ('.' + className) : ''));
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
			if (arg instanceof Position) {
				row4 = arg.row;
			}
			this.elm.childNodes[row4].textContent = text.replace(/\n$/, '') + '\n';
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
			return $('wasavi_focus_holder').focus();
		},
		adjustBackgroundImage: function () {
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
		shift: function (row, rowCount, shiftCount, shiftWidth, tabWidth, indents) {
			if (rowCount < 1) return;
			if (shiftCount == 0) return;
			if (shiftWidth < 1) shiftWidth = 1;
			if (tabWidth < 1) tabWidth = 8;

			var tabExpanded = multiply(' ', tabWidth);
			var shifted = multiply(' ', shiftWidth * Math.abs(shiftCount));
			var shiftLeftRegex = new RegExp('^ {1,' + shiftWidth * Math.abs(shiftCount) + '}');
			var toTabRegex = new RegExp(' {' + tabWidth + '}', 'g');
			var currentIndents = [];
			var indentBuffer = '';

			function expandTab (row) {
				var node = row.firstChild;
				var total = 0;
				var elements = [];
				while (node) {
					if (node.nodeType == 3) {
						node.nodeValue = node.nodeValue.replace(/\t/g, tabExpanded);
						var index = node.nodeValue.search(/[^ \t]/);
						if (index >= 0) {
							total += index;
							break;
						}
						total += node.nodeValue.length;
						node = node.nextSibling;
					}
					else {
						var next = node.nextSibling;
						elements.push([total, node]);
						node.parentNode.removeChild(node);
						node = next;
					}
				}
				currentIndents.push(total);
				elements.length && row.normalize();
				return elements;
			}

			function shiftRight (row, elements) {
				var node = row.firstChild;
				if (node.nodeType != 3) return;

				node.insertData(0, shifted);
				for (var i = 0, goal = elements.length; i < goal; i++) {
					elements[i][0] += shifted.length;
				}
			}

			function shiftRight2 (row, elements, indent) {
				var node = row.firstChild;
				if (node.nodeType != 3) return;

				var q = indent - currentIndents[currentIndents.length - 1];
				if (q <= 0) return;

				if (indentBuffer.length < q) {
					indentBuffer = multiply(' ', q);
				}

				node.insertData(0, indentBuffer.substr(0, q));
				for (var i = 0, goal = elements.length; i < goal; i++) {
					elements[i][0] += q;
				}
			}

			function shiftLeft (row, elements) {
				var node = row.firstChild;
				if (node.nodeType != 3) return;

				var re = shiftLeftRegex.exec(node.nodeValue);
				if (re) {
					node.deleteData(0, re[0].length);
					for (var i = 0, goal = elements.length; i < goal; i++) {
						elements[i][0] += shifted.length;
					}
				}
			}

			function windup (row, elements) {
				var node = row.firstChild;
				if (node.nodeType != 3) return;

				var expandedIndex = 0;
				var tabbedIndex = 0;
				node.replaceData(
					0, node.nodeValue.length, node.nodeValue.replace(toTabRegex, function () {
						for (var i = 0, goal = elements.length; i < goal; i++) {
							if (elements[i][0] >= expandedIndex
							&&  elements[i][0] < expandedIndex + tabWidth) {
								elements[i][0] = tabbedIndex + 1;
							}
						}
						expandedIndex += tabWidth;
						tabbedIndex += 1;
						return '\t';
					})
				);

				for (var i = elements.length - 1; i >= 0; i--) {
					var offset = Math.min(elements[i][0], tabbedIndex);
					var element = elements[i][1];
					var text = row.firstChild;
					if (offset == text.nodeValue.length) {
						text.parentNode.insertBefore(element, text.nextSibling);
					}
					else if (offset < text.nodeValue.length) {
						var rest = text.splitText(offset);
						rest.parentNode.insertBefore(element, rest);
					}
				}
			}

			var goal = Math.min(row + rowCount, this.elm.childNodes.length);
			if (indents && shiftCount > 0) {
				for (var i = row, j = 0; i < goal; i++) {
					var node = this.elm.childNodes[i];
					var elements = expandTab(node);
					shiftRight2(node, elements, indents[j++]);
					windup(node, elements);
				}
			}
			else {
				var shifter = shiftCount < 0 ? shiftLeft : shiftRight;
				for (var i = row; i < goal; i++) {
					var node = this.elm.childNodes[i];
					var elements = expandTab(node);
					shifter(node, elements);
					windup(node, elements);
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
				this.elm, window.NodeFilter.SHOW_TEXT, null, false);
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
		emphasis: function (s, length, className) {
			if (s == undefined) {
				s = this.selectionStart;
			}
			else if (typeof s == 'number') {
				s = this.linearPositionToBinaryPosition(s);
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
						if (offset + length <= node.nodeValue.length) {
							r.setStart(node, offset);
							r.setEnd(node, offset + length);
							r.surroundContents(createSpan());
							length = 0;
							break whole;
						}
						else {
							r.setStart(node, offset);
							r.setEnd(node, node.nodeValue.length);
							r.surroundContents(createSpan());
							length -= node.nodeValue.length - offset;
							offset = 0;
						}
					}
				}
			}

			r.detach();
			return result;
		},
		unEmphasis: function (className) {
			var nodes = this.getSpans(className || EMPHASIS_CLASS);
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
			return new Position(row5, col);
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
			return new Position(this.selectionStartRow, this.selectionStartCol);
		},
		get selectionStartRow () {
			return dataset(this.elm, 'wasaviSelStartRow') - 0;
		},
		get selectionStartCol () {
			return dataset(this.elm, 'wasaviSelStartCol') - 0;
		},
		get selectionEnd () {
			return new Position(this.selectionEndRow, this.selectionEndCol);
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
				v = this.linearPositionToBinaryPosition(v) || new Position(0, 0);
			}
			if (v instanceof Position) {
				dataset(this.elm, 'wasaviSelStartRow', v.row);
				dataset(this.elm, 'wasaviSelStartCol', v.col);
			}
		},
		set selectionEnd (v) {
			if (typeof v == 'number') {
				v = this.linearPositionToBinaryPosition(v) || new Position(0, 0);
			}
			if (v instanceof Position) {
				dataset(this.elm, 'wasaviSelEndRow', v.row);
				dataset(this.elm, 'wasaviSelEndCol', v.col);
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

/*constructor*/function Scroller (editor, cursor, modeLine) {
	var running = false;
	var consumeMsecs = 250;
	var timerPrecision = 1;
	var lastRan = 0;
	var distance;
	var scrollTopStart;
	var scrollTopDest;
	this.run = function (dest, callback) {
		if (running || !targetElement || !cursor || !modeLine) {
			return;
		}
		if (!config.vars.smooth || cursor.locked) {
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

				if (!targetElement || !cursor || !modeLine) {
					running = false;
					keyManager.sweep();
					return;
				}

				if (distance > 0 && y >= scrollTopDest
				||  distance < 0 && y <= scrollTopDest) {
					editor.scrollTop = scrollTopDest;
					callback && callback();
					cursor.ensureVisible();
					cursor.update({visible:true});
					modeLine.style.display == '' && showPrefixInput(editor);
					fireCommandCompleteEvent();
					running = false;
					keyManager.sweep();
				}
				else {
					editor.scrollTop = parseInt(y);
					setTimeout(arguments.callee, timerPrecision);
				}
			})();
		}
	};
	this.dispose = function () {
		editor = cursor = modeLine = null;
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

/*constructor*/function ExCommand (name, shortName, syntax, flags, handler) {
	this.name = name;
	this.shortName = shortName;
	this.handler = handler;
	this.syntax = syntax;
	this.rangeCount = flags & 3;
	this.flags = {
		addr2All:     !!(flags & EXFLAGS.addr2All),
		addr2None:    !!(flags & EXFLAGS.addr2None),
		addrZero:     !!(flags & EXFLAGS.addrZero),
		addrZeroDef:  !!(flags & EXFLAGS.addrZeroDef),
		printDefault: !!(flags & EXFLAGS.printDefault),
		clearFlag:    !!(flags & EXFLAGS.clearFlag),
		roundMax:     !!(flags & EXFLAGS.roundMax),
		updateJump:   !!(flags & EXFLAGS.updateJump),
		multiAsync:   !!(flags & EXFLAGS.multiAsync)
	};
}
ExCommand.prototype = {
	clone: function () {
		return new ExCommand(
			this.name,
			this.shortName,
			this.syntax,
			JSON.parse(JSON.stringify(this.flags)),
			this.handler
		);
	},
	parseArgs: function (t, range, line, syntax) {
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
		function argv_fexp (s) {
			while ((s = s.replace(/^\s+/, '')) != '') {
				var re = /(?:\\(.)|\S)*/.exec(s);
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
				var j = 0;
				if (this.name.length == 1) {
					while (line.charAt(j) == this.name) {j++;}
					line = line.substring(j);
				}
				argv_exp0(j + 1);
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
				argv_fexp(line);
				needCheckRest = false;
				break syntax_expansion_loop;

			case 'l':
				var dest = this.parseRange(t, line, 1, true);
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
				var re;
				while (line != '' && (re = /(?:\u0016.|\S)*/.exec(line))) {
					argv_exp0(re[0]);
					line = line.substring(re[0].length).replace(/^[ \t]+/, '');
				}
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
				return _('Invalid argument.');
			}
		}

		return result;
	},
	parseRange: function (t, s, requiredCount, allowZeroAddress) {
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
					isJumpBaseUpdateRequested = true;
					found = true;
				}
				else if ((re = /^\d+/.exec(s))) {
					var n = re[0] - 1;
					if (n < 0) {
						n = allowZeroAddress ? -1 : 0;
					}
					rows.push(n);
					s = s.substring(re[0].length);
					isJumpBaseUpdateRequested = true;
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
						isJumpBaseUpdateRequested = true;
						found = true;
					}
				}
				else if ((re = /^\/((?:\\\/|[^\/])*)(?:\/|(?=\n$))/.exec(s))) {
					var pattern = re[1] == '' ? (lastRegexFindCommand.pattern || '') : re[1];
					var regex = pattern == '' ? null : getFindRegex(pattern);
					if (!regex) {
						if (re[1] == '' && pattern == '') {
							error = _('No previous search pattern.');
						}
						else {
							error = _('Invalid regex pattern.');
						}
						break;
					}
					else {
						regexSpecified = true;
						lastRegexFindCommand.push({direction:1});
						pattern != '' && lastRegexFindCommand.setPattern(pattern);

						motionLineEnd('', t);
						var result = motionFindByRegexForward(regex, t, 1);
						if (result) {
							rows.push(t.linearPositionToBinaryPosition(result.offset).row);
							s = s.substring(re[0].length);
							isJumpBaseUpdateRequested = true;
							found = true;
						}
						else {
							error = _('Pattern not found: {0}', pattern);
							break;
						}
					}
				}
				else if ((re = /^\?((?:\\\?|[^?])*)(?:\?|(?=\n$))/.exec(s))) {
					var pattern = re[1] == '' ? (lastRegexFindCommand.pattern || '') : re[1];
					var regex = pattern == '' ? null : getFindRegex(pattern);
					if (!regex) {
						if (re[1] == '' && pattern == '') {
							error = _('No previous search pattern.');
						}
						else {
							error = _('Invalid regex pattern.');
						}
						break;
					}
					else {
						regexSpecified = true;
						lastRegexFindCommand.push({direction:-1});
						pattern != '' && lastRegexFindCommand.setPattern(pattern);

						motionLineStart('', t, true);
						var result = motionFindByRegexBackward(regex, t, 1);
						if (result) {
							rows.push(t.linearPositionToBinaryPosition(result.offset).row);
							s = s.substring(re[0].length);
							isJumpBaseUpdateRequested = true;
							found = true;
						}
						else {
							error = _('Pattern not found: {0}', pattern);
							break;
						}
					}
				}
				else if ((re = /^[\+\-](\d*)/.exec(s))) {
					var offset = re[1] == '' ?
						(re[0].charAt(0) == '+' ? 1 : -1) :
						parseInt(re[0], 10);
					rows.push(t.selectionStartRow + offset);
					s = s.substring(re[0].length);
					found = true;
				}

				if (found) {
					if ((re = /^\s*[\+\-](\d*)/.exec(s))) {
						var offset = re[1] == '' ?
							(re[0].charAt(0) == '+' ? 1 : -1) :
							parseInt(re[0], 10);
						rows[rows.length - 1] += offset;
						if (regexSpecified) {
							lastRegexFindCommand.verticalOffset = offset;
						}
						s = s.substring(re[0].length);
					}

					if (rows[rows.length - 1] < 0) {
						rows[rows.length - 1] = allowZeroAddress ? -1 : 0;
					}

					s = s.replace(/^[ \t]+/, '');
				}

				if (s.charAt(0) == ',') {
					s = s.substring(1);
					!found && rows.push(t.selectionStartRow);
				}
				else if (s.charAt(0) == ';') {
					if (rows[rows.length - 1] >= t.rowLength) {
						error = _('Out of range.');
						break;
					}
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
	},
	buildArgs: function (t, range, s, sups) {
		var args = this.parseArgs(t, range, s);
		if (typeof args == 'string') {
			return this.name + ': ' + args;
		}
		if (sups instanceof Array) {
			sups.push.apply(sups, args.argv);
			args.argv = sups;
		}

		for (var i = 0, goal = args.range.length; i < goal; i++) {
			if (!this.flags.addrZero) {
				args.range[i] = Math.max(0, args.range[i]);
			}
			if (this.flags.roundMax) {
				args.range[i] = Math.min(t.rowLength - 1, args.range[i]);
			}
			else {
				if (args.range[i] >= t.rowLength) {
					return _('{0}: Out of range.', this.name);
				}
			}
		}
		return args;
	},
	run: function (t, args) {
		var result;
		try {
			result = this.handler(t, args);
		}
		catch (e) {
			result = e.toString();
		}
		if (typeof result == 'string') {
			return this.name + ': ' + result;
		}
		return {flags:args.flags, offset:args.flagoff};
	},
	toString: function () {
		return '[ExCommand ' + this.name + ']';
	}
};
ExCommand.defaultCommand = new ExCommand(
	'$default', '$default', 'ca1', 2 | EXFLAGS.roundMax,
	function (t, a) {
		ExCommand.printRow(t, a.range[0], a.range[1], a.flags);
		t.setSelectionRange(t.getLineTopOffset2(new Position(a.range[1], 0)));
		a.flags.hash = a.flags.list = a.flags.print = false;
	}
);
ExCommand.global = function (t, a) {
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
	var patternString = pattern;
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
	text = r[1] == t.rowLength - 1 ? trimTerm(rg.toString()) : rg.toString();
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
				if (pattern.lastIndex == prevOffset) {
					if (pattern.lastIndex < text.length) {
						pattern.lastIndex++;
						continue;
					}
					else {
						break;
					}
				}
				pos = pattern.lastIndex - re[0].length;
				delta = (text.substring(prevOffset, pos).match(/\n/g) || nullNewline).length;
				row = prevRow + delta;
				if (row > r[1]) break;
				delta && items.push(row - rangeStartRow);
				prevOffset = pos;
				prevRow = row;
			}

			if (items.length >= r[1] - r[0] + 1) {
				return _('Pattern found in every line: {0}', patternString);
			}
			var tmp = [], container = t.elm;
			for (var i = r[0]; i <= r[1]; i++) {
				tmp.push(container.childNodes[i]);
			}
			for (var i = items.length - 1; i >= 0; i--) {
				tmp.splice(items[i], 1);
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
				if (pattern.lastIndex == prevOffset) {
					if (pattern.lastIndex < text.length) {
						pattern.lastIndex++;
						continue;
					}
					else {
						break;
					}
				}
				pos = pattern.lastIndex - re[0].length;
				delta = (text.substring(prevOffset, pos).match(/\n/g) || nullNewline).length;
				row = prevRow + delta;
				if (row > r[1]) break;
				delta && items.push(t.rowNodes(row));
				prevOffset = pos;
				prevRow = row;
			}
		}
	}

	function dumpItems (title) {
		var result = [];
		for (var i = 0, goal = items.length; i < goal; i++) {
			if (items[i]) {
				result.push(i + ': "' + toVisibleString(items[i].textContent) + '"');
			}
			else {
				result.push(i + ': null');
			}
		}
	}

	// pass 2
	editLogger.open('global');
	try {
		//dumpItems('init');
		for (var i = 0, goal = items.length; i < goal; i++) {
			if (items[i].parentNode) {
				t.setSelectionRange(t.getLineTopOffset2(new Position(t.indexOf(items[i]), 0)));
				var result = executeExCommand(t, command);
				if (typeof result == 'string') {return result;}
			}
			else {
				items[i] = null;
			}
		}
	}
	finally {
		editLogger.close();
	}
};
ExCommand.setMark = function (t, a) {
	var name = a.argv[0];
	if (name.length > 1) {
		return _('Mark names must be a single character.');
	}
	if (!marks.isValidName(name)) {
		return _('Invalid mark name.');
	}
	marks.set(name, new Position(a.range[0], 0));
};
ExCommand.copy = function (t, a) {
	var rg = document.createRange();
	rg.setStartBefore(t.rowNodes(a.range[0]));
	rg.setEndAfter(t.rowNodes(a.range[1]));
	var content = rg.toString();
	rg.detach();
	t.setSelectionRange(new Position(a.lineNumber, 0));
	paste(t, 1, {
		isForward:true,
		isForceLineOrient:true,
		content:content
	});
	var copied = a.range[1] - a.range[0] + 1;
	if (copied >= config.vars.report) {
		requestShowMessage(_('Copied {0} {line:0}.', copied));
	}
	t.setSelectionRange(t.getLineTopOffset2(a.lineNumber + 1 + copied - 1, 0));
	isEditCompleted = true;
};
ExCommand.quit = function (isForce) {
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
};
ExCommand.parseWriteArg = function (t, a) {
	var re;
	var arg = a.argv[0] || '';
	var isCommand = false;
	var isAppend = false;
	var name = false;
	if (re = /^\s*(?!\\)!(.+)/.exec(arg)) {
		isCommand = true;
		name = re[1];
	}
	else if (re = /^\s*(>>)?(.*)/.exec(arg)) {
		isAppend = re[1] == '>>';
		name = re[2] || '';
	}
	if (name === false) {
		return _('Invalid argument.');
	}
	return {
		isCommand:isCommand,
		isAppend:isAppend,
		name:name
	};
};
ExCommand.write = function (t, a, isCommand, isAppend, path) {
	var isForce = !!a.flags.force;

	if (isCommand) {
		return _('Command redirection is not implemented.');
	}

	path || (path = fileName);
	if (path != '' && !WasaviExtensionWrapper.isTopFrame) {
		return _('Only stand alone form can write.');
	}
	if (isAppend) {
		return _('Appending is not implemented.');
	}

	var target = targetElement;

	if (isForce) {
		target.readOnly = false;
		config.setData('noreadonly');
	}
	else {
		if (config.vars.readonly && target == targetElement) {
			return _('Readonly option is set (use "!" to override).');
		}
		if (target.readOnly) {
			return _('Element to be written has readonly attribute (use "!" to override).');
		}
	}

	var rg = document.createRange();
	rg.setStartBefore(t.rowNodes(a.range[0]));
	rg.setEndAfter(t.rowNodes(a.range[1]));
	var content = toNativeControl(rg.toString());
	rg.detach();

	if (a.range[1] == t.rowLength - 1) {
		content = trimTerm(content);
	}
	if (extensionChannel) {
		extensionChannel.postMessage({
			type:'notify-to-parent',
			parentTabId:targetElement.parentTabId,
			payload:{
				type:'wasavi-saved',
				path:path,
				value:content.replace(/\n/g, preferredNewline)
			}
		});
	}
	if (a.range[0] == 0 && a.range[1] == t.rowLength - 1 && target == targetElement) {
		isTextDirty = false;
	}
};
ExCommand.read = function (t, a, content, meta) {
	if (meta.status == 404) {
		return _('Cannot open "{0}".', meta.path);
	}
	if (content == '') return;
	content = content.replace(/\r\n|\r/g, '\n');
	var startLine = Math.min(Math.max(-1, a.range[0]), t.rowLength - 1);
	t.setSelectionRange(new Position(startLine, 0));
	paste(t, 1, {
		isForward:true,
		isForceLineOrient:true,
		content:content
	});
	t.setSelectionRange(t.getLineTopOffset2(startLine + 1, 0));
};
ExCommand.edit = function (t, a, content, meta) {
	isTextDirty = false;
	fileName = meta.path;
	document.title = /[^\/]+$/.exec(fileName)[0] + ' - wasavi';
	var empty = [];
	var charCount = content.length;
	preferredNewline = [
		['\n',   (content.match(/(?:^|[^\r])\n/g) || empty).length],
		['\r',   (content.match(/\r(?!\n)/g) || empty).length],
		['\r\n', (content.match(/\r\n/g) || empty).length]
	].sort(function (a, b) {return b[1] - a[1];})[0][0];
	t.value = trimTerm(content.replace(/\r\n|\r/g, '\n'));
	editLogger.close().clear().open('excommand+edit');
	marks.clear();

	/*
	// exrc
	var exrcCommands = executeExCommand(t, exrc, false, true);
	if (typeof exrcCommands == 'string') {
		return exrcCommands;
	}
	exCommandExecutor.commands = Array.prototype.push.apply(
		exrcCommands.commands, exCommandExecutor.commands);
	 */

	// +command
	var initCommands = executeExCommand(t, a.initCommand, false, true);
	if (typeof initCommands == 'string') {
		return initCommands;
	}
	var terminator = ExCommand.defaultCommand.clone();
	if (initCommands.commands.length) {
		terminator.handler = function (t, a) {
			t.setSelectionRange(t.getLineTopOffset2(t.rowLength - 1, 0));
		};
	}
	else {
		terminator.handler = function (t, a) {
			t.setSelectionRange(t.getLineTopOffset2(0, 0));
		};
	}
	initCommands.commands.push([terminator, terminator.buildArgs(t, [], '')]);
	Array.prototype.unshift.apply(exCommandExecutor.commands, initCommands.commands);

	requestShowMessage(getFileIoResultInfo(t, charCount, meta.status == 404));
};
ExCommand.executeRegister = function (t, a) {
	var command;
	var register;

	if (a.flags.register) {
		register = a.register;
	}
	else if (!registers.exists('@') || (register = registers.get('@').data) == '') {
		return _('No previous execution.');
	}
	if (register == '@' || !registers.isReadable(register)) {
		return _('Invalid register name: {0}', register);
	}
	if (!registers.exists(register) || (command = registers.get(register).data) == '') {
		return _('Register {0} is empty.', register);
	}
	t.setSelectionRange(new Position(a.range[0], 0));
	var result = executeExCommand(t, command);
	if (typeof result == 'string') {
		return result;
	}
	registers.set('@', command, true);
};
ExCommand.printRow = function (t, from, to, flags) {
	function getLineNumber (i) {
		return ('     ' + (i + 1)).substr(-6) + '  ';
	}
	function getLineNumberNull () {
		return '';
	}
	var lg = flags.hash ? getLineNumber : getLineNumberNull;
	if (flags.list) {
		var escapeReplacements = {
			7: '\\a', 8: '\\b', 9: '\\t', 10: '\\n', 11: '\\v', 12: '\\f', 13: '\\r', 92:'\\\\'
		};
		for (var i = from; i <= to; i++) {
			var line = toNativeControl(t.rows(i));
			/*
			 * char code
			 * \\   5c
			 * \a   07
			 * \b   08
			 * \t   09
			 * \n   0a
			 * \v   0b
			 * \f   0c
			 * \r   0d
			 */
			line = line.replace(/[\u0007\u0008\u000a-\u000d\\]/g, function (s) {
				return escapeReplacements[s.charCodeAt(0)];
			});
			line = line.replace(/[\u0000-\u0008\u0010-\u001f\u007f]/g, function (s) {
				return '\\' + ('00' + s.charCodeAt(0).toString(8)).substr(-3);
			});
			line = line.replace(/\$/g, '\\$');
			line = line + '$';
			backlog.push(lg(i) + line);
		}
	}
	else if (flags.hash || flags.print) {
		for (var i = from; i <= to; i++) {
			var line = t.rows(i);
			backlog.push(lg(i) + line);
		}
	}
};
ExCommand.commands = [
	new ExCommand('abbreviate', 'ab', 'W', 0, function (t, a) {
		function dispAbbrev (ab) {
			var maxWidth = 0;
			var count = 0;
			for (var i in ab) {
				if (i.length > maxWidth) {
					maxWidth = i.length;
				}
				count++;
			}
			if (count) {
				var list = [_('*** abbreviations ***')];
				for (var i in ab) {
					list.push(
						i + multiply(' ', maxWidth - i.length) +
						'\t' + toVisibleString(abbrevs[i])
					);
				}
				list.sort();
				backlog.push(list);
			}
			else {
				backlog.push(_('No abbreviations are defined.'));
			}
		}
		switch (a.argv.length) {
		case 0:
			dispAbbrev(abbrevs);
			break;

		case 1:
			var lhs = a.argv[0];
			if (lhs == '[clear]') {
				abbrevs = {};
			}
			else {
				var tmp = {};
				if (lhs in abbrevs) {
					tmp[lhs] = abbrevs[lhs];
				}
				dispAbbrev(tmp);
			}
			break;

		default:
			var lhs = a.argv[0];
			var rhs = a.argv[1];
			if (!config.vars.iskeyword.test(lhs.substr(-1))) {
				return _('The keyword of abbreviation must end with a word character.');
			}
			abbrevs[lhs] = rhs;
			break;
		}
	}),
	new ExCommand('copy', 'co', 'l1', 2 | EXFLAGS.printDefault, function (t, a) {
		return ExCommand.copy(t, a);
	}),
	new ExCommand('delete', 'd', 'bca1', 2 | EXFLAGS.printDefault, function (t, a) {
		t.setSelectionRange(new Position(a.range[0], 0));
		t.isLineOrientSelection = true;
		var deleted = a.range[1] - a.range[0] + 1;
		yank(t, deleted, true, a.flags.register ? a.register : '');
		deleteSelection(t);
		if (deleted >= config.vars.report) {
			requestShowMessage(_('Deleted {0} {line:0}.', deleted));
		}
		var n = new Position(Math.min(a.range[0], t.rowLength - 1), 0);
		t.setSelectionRange(t.getLineTopOffset2(n));
		isEditCompleted = true;
	}),
	new ExCommand('edit', 'e', '!f', EXFLAGS.multiAsync, function (t, a) {
		if (!extensionChannel || !WasaviExtensionWrapper.isTopFrame) {
			return _('Only stand alone form can edit.');
		}
		if (!a.flags.force && isTextDirty) {
			return _('File is modified; write or use "!" to override.');
		}
		if (a.argv.length > 2) {
			return _('Too much arguments.');
		}
		var path = a.argv[0] || '';
		if (path.charAt(0) == '+') {
			a.initCommand = path.substring(1).replace(/\\(.)/g, '$1');
			path = a.argv[1] || '';
		}
		else {
			a.initCommand = '';
		}
		path = path.replace(/\\(.)/g, '$1');
		if (path == '' && fileName == '') {
			return _('File name is empty.');
		}
		extensionChannel.postMessage({
			type:'read',
			path:path
		});
	}),
	new ExCommand('file', 'f', 'f', 0, function (t, a) {
		if (!extensionChannel || !WasaviExtensionWrapper.isTopFrame) {
			return _('Only stand alone form can edit.');
		}
		if (a.argv.length > 1) {
			return _('Too much arguments.');
		}
		if (a.argv.length == 1) {
			var arg = a.argv[0].replace(/\\(.)/g, '$1');
			if (/(?:^|\/)\.{1,2}$/.test(arg)) {
				arg += '/';
			}

			var from = /^(.*\/)?([^\/]*)$/
				.exec(fileName)
				.map(function (a) {return a || '';});
			var to = /^(.*\/)?([^\/]*)$/
				.exec(arg)
				.map(function (a) {return a || '';});

			if (to[2] == '') {
				if (from[2] == '') {
					return _('File name is empty.');
				}
				to[2] = from[2];
			}
			if (to[1].charAt(0) == '/') {
				fileName = to[1] + to[2];
			}
			else {
				fileName = (from[1] != '' ? from[1] : '/') + to[1] + to[2];
			}

			fileName = fileName.replace(/\/\.\//g, '//');
			fileName = fileName.replace(/\/\//g, '/');
			while (/\/\.\.\//.test(fileName)) {
				fileName = fileName.replace(/(?:[^\/]*)\/\.\.\/([^\/]+)/, '$1');
			}
		}
		requestShowMessage(getFileInfo(t));
	}),
	new ExCommand('global', 'g', '!s', 2 | EXFLAGS.addr2All | EXFLAGS.updateJump, function (t, a) {
		return ExCommand.global(t, a);
	}),
	new ExCommand('join', 'j', '!c11', 2 | EXFLAGS.printDefault, function (t, a) {
		var head = a.range[0];
		var tail = Math.min(t.rowLength - 1, a.range[1] + (a.flags.count ? a.count - 1 : 0));
		t.setSelectionRange(new Position(head, 0));
		joinLines(t, tail - head, a.flags.force);
		t.setSelectionRange(t.getLineTopOffset2(head, 0));
		isEditCompleted = true;
	}),
	new ExCommand('k', 'k', 'w1r', 1, function (t, a) {
		return ExCommand.setMark(t, a);
	}),
	new ExCommand('map', 'map', '!W', 0, function (t, a) {
		var mapName = a.flags.force ? 'edit' : 'command';
		var map = mapManager.getMap(mapName);
		function dispMap (map) {
			var maxWidth = 0;
			if (map.length) {
				map.map(function (o) {
					if (o[0].length > maxWidth) {
						maxWidth = o[0].length;
					}
				});
				var list = ['*** ' + mapName + ' mode map ***'];
				map.map(function (o) {
					list.push(
						o[0] + multiply(' ', maxWidth - o[0].length) +
						'\t' + toVisibleString(o[1]));
				});
				backlog.push(list);
			}
			else {
				backlog.push(_('No mappings for {0} mode are defined.', mapName));
			}
		}
		if (a.argv.length == 0) {
			dispMap(map.toArray());
		}
		else {
			var lhs = a.argv[0] || '';
			var rhs = a.argv[1] || '';
			var remap = true;
			switch (lhs) {
			case '[clear]':
				map.removeAll();
				break;
			case '[noremap]':
				lhs = rhs;
				rhs = a.argv[2] || '';
				remap = false;
				/*FALLTHRU*/
			default:
				if (rhs == '') {
					dispMap(map.toArray().filter(function (o) {
						return o[0].indexOf(lhs) >= 0;
					}));
				}
				else {
					// reject some mappings for text input mode: <escape>, <nl>
					if (a.flags.force && /^[\u001b\u000a]$/.test(lhs)) {
						return _('Key {0} cannot be remapped.', toVisibleString(lhs));
					}
					// reject some mappings for command mode: :, <escape>
					if (!a.flags.force && /^[:\u001b]$/.test(lhs)) {
						return _('Key {0} cannot be remapped.', toVisibleString(lhs));
					}
					map.register(lhs, rhs, remap);
				}
				break;
			}
		}
	}),
	new ExCommand('mark', 'ma', 'w1r', 1, function (t, a) {
		return ExCommand.setMark(t, a);
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
		editLogger.open('move', function () {
			var rows = r[1] - r[0] + 1;

			if (dest == r[0] - 1 || dest == r[1]) {
				editLogger.write(EditLogger.ITEM_TYPE.NOP);
			}
			else {
				// delete
				t.isLineOrientSelection = true;
				t.setSelectionRange(new Position(r[0], 0));
				t.selectRows(rows);
				var content = t.getSelectionRows();
				deleteSelection(t);
				t.isLineOrientSelection = false;

				// fix destination position
				dest -= dest > r[1] ? rows : 0;

				// paste
				t.setSelectionRange(new Position(dest, 0));
				paste(t, 1, {
					isForward:true,
					isForceLineOrient:true,
					content:content
				});
			}

			if (rows >= config.vars.report) {
				requestShowMessage(_('Moved {0} {line:0}.', rows));
			}

			t.setSelectionRange(t.getLineTopOffset2(dest + rows, 0));
		});
		isEditCompleted = true;
	}),
	new ExCommand('options', 'opt', '', 0, function (t, a) {
		if (extensionChannel) {
			extensionChannel.postMessage({type:'open-options-page'});
		}
		else {
			return requestRegisterNotice(_('Don\'t know how to open options page.'));
		}
	}),
	new ExCommand('print', 'p', 'ca1', 2 | EXFLAGS.clearFlag, function (t, a) {
		a.flags.print = true;
		return ExCommand.defaultCommand.handler.apply(this, arguments);
	}),
	new ExCommand('put', 'pu', 'b', 1 | EXFLAGS.printDefault | EXFLAGS.addrZero | EXFLAGS.addrZeroDef, function (t, a) {
		var register = a.flags.register ? a.register : '"';
		if (!registers.exists(register)) {
			return _('Register {0} is empty.', register);
		}
		t.setSelectionRange(new Position(Math.min(Math.max(-1, a.range[0]), t.rowLength - 1), 0));
		paste(t, 1, {
			isForward:true,
			isForceLineOrient:true,
			register:register
		});
		t.setSelectionRange(t.getLineTopOffset2(t.selectionStart, 0));
	}),
	new ExCommand('quit', 'q', '!', 0, function (t, a) {
		return ExCommand.quit(a.flags.force);
	}),
	new ExCommand('read', 'r', 's', 1 | EXFLAGS.addrZero | EXFLAGS.addrZeroDef | EXFLAGS.multiAsync, function (t, a) {
		if (!extensionChannel) {
			return _('Extension system required.');
		}
		extensionChannel.postMessage({
			type:'read',
			path:a.argv[0]
		});
	}),
	new ExCommand('redo', 're', '', 0, function (t, a) {
		editLogger.close();
		var result = editLogger.redo();
		editLogger.open('excommand+redo');
		if (result === false) {
			return _('No redo item.');
		}
		else {
			requestShowMessage(
				_('{0} {operation:0} have executed again.', result));
			return;
		}
	}),
	new ExCommand('s', 's', 's', 2, function (t, a) {
		return (new SubstituteWorker).run(t, a.range, a.argv[0], a.argv[1], a.argv[2]);
	}),
	new ExCommand('&', '&', 's', 2, function (t, a) {
		return (new SubstituteWorker).run(t, a.range, '', '%', a.argv[0]);
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
		else if (a.argv.some(function (o) {return o == 'all';})) {
			messages = config.dump(true);
			logToConsole = true;
		}
		else {
			messages = [];
			for (var i = 0; i < a.argv.length; i++) {
				var arg = a.argv[i];
				var re = /^([^=?]+)([=?])/.exec(arg) || ['', arg, ''];
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
					if (re[2] == ''
					&& i + 1 < a.argv.length
					&& a.argv[i + 1].charAt(0) == '=') {
						re[0] = arg + '=';
						arg += a.argv[++i];
						re[2] = '=';
					}
					if (re[2] != '=' && info.type != 'b') {
						messages.push(config.getData(re[1], true));
					}
					else {
						var result = config.setData(
							re[1],
							re[2] == '=' ? arg.substring(re[0].length) : undefined);
						if (typeof result == 'string') {
							messages.push(result.replace(/\.$/, '') + ': ' + arg);
							emphasis = true;
							break;
						}
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
		lastRegexFindCommand.push({});
		lastRegexFindCommand.setPattern('');
		lastSubstituteInfo = {};
		requestShowMessage('Whassup?');
	}),
	new ExCommand('storage', 'st', '', 0, function (t, a) {
		var list = [];
		if (fstab.length) {
			list.push('*** available storages ***');
			fstab.forEach(function (fs) {
				list.push((fs.isDefault ? '*' : ' ') + fs.name);
			})
		}
		else {
			list.push('*** no available storages. ***');
		}
		backlog.push(list);
	}),
	new ExCommand('registers', 'reg', '', 0, function (t, a) {
		backlog.push(registers.dump());
	}),
	new ExCommand('to', 't', 'l1', 2 | EXFLAGS.printDefault, function (t, a) {
		return ExCommand.copy(t, a);
	}),
	new ExCommand('unabbreviate', 'una', 'w1r', 0, function (t, a) {
		var lhs = a.argv[0];
		if (lhs == '[all]') {
			abbrevs = {};
		}
		else if (!(lhs in abbrevs)) {
			return _('{0} is not an abbreviation.', lhs);
		}
		else {
			delete abbrevs[lhs];
		}
	}),
	new ExCommand('undo', 'u', '', 0 | EXFLAGS.updateJump, function (t, a) {
		editLogger.close();
		var result = editLogger.undo();
		editLogger.open('excommand+undo');
		if (result === false) {
			return _('No undo item.');
		}
		else {
			requestShowMessage(
				_('{0} {operation:0} have reverted.', result));
			return;
		}
	}),
	new ExCommand('unmap', 'unm', '!w1r', 0, function (t, a) {
		var lhs = a.argv[0];
		var map = mapManager.getMap(a.flags.force ? 'edit' : 'command');
		if (lhs == '[all]') {
			map.removeAll();
		}
		else if (!map.isMapped(lhs)) {
			return _('{0} is not mapped.', lhs);
		}
		else {
			map.remove(lhs);
		}
	}),
	new ExCommand('version', 'ver', '', 0, function (t, a) {
		requestShowMessage('wasavi/' + VERSION + ' ' + VERSION_DESC);
	}),
	new ExCommand('v', 'v', 's', 2 | EXFLAGS.addr2All | EXFLAGS.updateJump, function (t, a) {
		a.flags.force = true;
		return ExCommand.global(t, a);
	}),
	new ExCommand('write', 'w', '!s', 2 | EXFLAGS.addr2All | EXFLAGS.addrZeroDef, function (t, a) {
		var o = ExCommand.parseWriteArg(t, a);
		return typeof o == 'string' ? o : ExCommand.write(t, a, o.isCommand, o.isAppend, o.name);
	}),
	new ExCommand('wq', 'wq', '!s', 2 | EXFLAGS.addr2All | EXFLAGS.addrZeroDef, function (t, a) {
		var o = ExCommand.parseWriteArg(t, a);
		if (typeof o == 'string') return o;
		var result = ExCommand.write(t, a, o.isCommand, o.isAppend, o.name);
		return typeof result == 'string' ? result : ExCommand.quit();
	}),
	new ExCommand('xit', 'x', '!s', 2 | EXFLAGS.addr2All | EXFLAGS.addrZeroDef, function (t, a) {
		if (isTextDirty) {
			var result = ExCommand.write(t, a, false, false, a.argv[0]);
			return typeof result == 'string' ? result : ExCommand.quit();
		}
		else {
			return ExCommand.quit(!!a.flags.force);
		}
	}),
	new ExCommand('yank', 'ya', 'bca', 2, function (t, a) {
		var p = t.selectionStart;
		t.setSelectionRange(new Position(a.range[0], 0));
		yank(t, a.range[1] - a.range[0] + 1, true, a.flags.register ? a.register : '');
		t.setSelectionRange(p);
	}),
	new ExCommand('>', '>', 'mca1', 2, function (t, a) {
		t.setSelectionRange(new Position(a.range[0], 0));
		shift(t, a.range[1] - a.range[0] + 1, a.argv[0]);
		t.setSelectionRange(t.getLineTopOffset2(a.range[1], 0));
	}),
	new ExCommand('<', '<', 'mca1', 2, function (t, a) {
		t.setSelectionRange(new Position(a.range[0], 0));
		unshift(t, a.range[1] - a.range[0] + 1, a.argv[0]);
		t.setSelectionRange(t.getLineTopOffset2(a.range[1], 0));
	}),
	new ExCommand('@', '@', 'b', 1, function (t, a) {
		return ExCommand.executeRegister(t, a);
	}),
	new ExCommand('*', '*', 'b', 1, function (t, a) {
		return ExCommand.executeRegister(t, a);
	})
].sort(function (a, b) {return a.name.length - b.name.length;});

/*constructor*/function ExCommandExecutor (editor, isRoot, onFinish) {
	this.editor = editor;
	this.commands = [];
	this.editLogLevel = 0;
	this.isRoot = !!isRoot;
	this.isAsync = false;
	this.sGlobalSpecified = false;
	this.source = '';
	this.onFinish = onFinish || null;
	this.lastError = undefined;
	this.lastCommand = undefined;

	var running = false;
	this.__defineGetter__('running', function () {return running;});
	this.__defineSetter__('running', function (v) {
		if (v == running) return;
		running = v;
		$('wasavi_cover').className = v ? 'dim' : '';
	});
}
ExCommandExecutor.prototype = {
	_runCore: function (command, args) {
		var editor = this.editor;
		var ss = editor.selectionStart;
		var result = command.run(editor, args);
		if (typeof result == 'string') {
			this.lastError = result || _('{0}: unknown error.', command.name);
			return false;
		}
		if ((isJumpBaseUpdateRequested || command.flags.updateJump)
		&& editor.selectionStart.ne(ss)) {
			marks.set('\'', ss);
			isJumpBaseUpdateRequested = false;
		}
		if (result.flags.hash || result.flags.list || result.flags.print) {
			var n = Math.max(0, Math.min(
				editor.selectionStartRow + result.flagoff, t.rowLength - 1));
			editor.setSelectionRange(editor.getLineTopOffset2(n, 0));
			ExCommand.printRow(editor, n.row, n.row, result.flags);
		}
		this.lastError = undefined;
		return true;
	},
	_runAsyncWrapper: function () {
		var tc;
		try {
			if (this.commands.length) {
				this.lastCommand = tc = this.commands.shift();
				if (tc[0].flags.multiAsync && !this.isAsync) {
					this.lastError = _('{0}: Executed in synchronous context.', tc[0].name);
					this.commands.length = 0;
					this.lastCommand = tc = undefined;
				}
				else if (!this._runCore(tc[0], tc[1])) {
					this.commands.length = 0;
					this.lastCommand = tc = undefined;
				}
			}
		}
		finally {
			if (!tc || !tc[0] || !tc[0].flags.multiAsync) {
				this.runAsyncNext();
			}
		}
	},
	_isClipboardAccess: function (args) {
		return extensionChannel && args.flags.register && args.register == '*';
	},
	clear: function () {
		this.commands.length = 0;
		this.lastCommand = undefined;
		this.isAsync = false;
	},
	stop: function () {
		this.commands.length = 0;
		this.lastCommand = undefined;
		this.runAsyncNext();
	},
	add: function (ex, args) {
		this.commands.push([ex, args]);
		this.isAsync = this.isAsync || this._isClipboardAccess(args) || ex.flags.multiAsync;
	},
	runAsyncNext: function (injectExCommand, arg) {
		if (!this.isAsync) return;

		injectExCommand && arg && this.commands.unshift([injectExCommand, arg]);

		if (this.commands.length) {
			setTimeout((function (obj, fn, cmd) {return function () {
				if (obj._isClipboardAccess(cmd[1])) {
					extensionChannel.getClipboard(function () {fn.call(obj);});
				}
				else {
					fn.call(obj);
				}
			}})(this, this._runAsyncWrapper, this.commands[0]), 0);
		}
		else {
			if (this.editLogLevel > 0) {
				editLogger.close();
				this.running = false;
				this.editLogLevel--;
			}
			this.onFinish && this.onFinish(this);
			var e = document.createEvent('UIEvent');
			e.initUIEvent('wasavi_command', false, true, document.defaultView, 0);
			processInput(0, e);
			keyManager.sweep();
		}
	},
	run: function () {
		if (this.commands.length == 0) return true;

		if (this.isAsync && this.isRoot && isInteractive) {
			//devMode && console.log('*** starting ExCommandExecutor (async:' + this.editLogLevel + ') ***');
			if (this.editLogLevel == 0) {
				editLogger.open('excommand');
				this.running = true;

				this.editLogLevel++;
			}
			this.runAsyncNext();
		}
		else {
			this.running = true;
			if (this.isRoot) {
				editLogger.open('excommand');
			}
			try {
				for (var i = 0, goal = this.commands.length; i < goal; i++) {
					if (!this._runCore(this.commands[i][0], this.commands[i][1])) {
						return this.lastError;
					}
				}
			}
			finally {
				if (this.isRoot) {
					editLogger.close();
					this.onFinish && this.onFinish(this);
				}
				this.commands.length = 0;
				this.running = false;
			}
			return true;
		}
	},
	get lastCommandObj () {
		return this.lastCommand ? this.lastCommand[0] : null;
	},
	get lastCommandArg () {
		return this.lastCommand ? this.lastCommand[1] : null;
	}
};

/*constructor*/function MapManager () {

	/*constructor*/function MapItem (name, rules, sequences, sequencesExpanded, options) {
		this.register = function (lhs, rhs, remap) {
			rules[lhs] = rhs;
			sequences[lhs] = this.createSequences(lhs);
			sequencesExpanded[lhs] = this.createSequences(rhs);
			options[lhs] = {remap:!!remap};
		};
		this.createSequences = function (s) {
			var result = [];
			for (var i = 0; i < s.length; i++) {
				// ^V
				if (s.charAt(i) == '\u0016') {
					if (i < s.length - 1) {
						result.push(s.charCodeAt(i + 1));
						i++;
						continue;
					}
				}
				// key name
				else if (s.charAt(i) == '<') {
					var re = /<[^>]+>/.exec(s.substring(i));
					if (re) {
						var code = keyManager.keyName2code(re[0]);
						if (code != undefined) {
							result.push(code);
							i += re[0].length - 1;
							continue;
						}
					}
				}
				// function key name
				else if (s.charAt(i) == '#') {
					var re = /#(\d{1,2})/.exec(s.substring(i));
					if (re) {
						var code = keyManager.keyName2code('<f' + re[1] + '>');
						if (code != undefined) {
							result.push(code);
							i += re[0].length - 1;
							continue;
						}
					}
				}
				result.push(s.charCodeAt(i));
			}
			return result;
		};
		this.remove = function () {
			for (var i = 0; i < arguments.length; i++) {
				var lhs = arguments[i];
				delete rules[lhs];
				delete sequences[lhs];
				delete sequencesExpanded[lhs];
				delete options[lhs];
			}
		};
		this.removeAll = function () {
			for (var i in rules) {
				this.remove(i);
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
		this.__defineGetter__('name', function () {return name;});
	}

	/*const*/var NEST_MAX = 100;
	/*const*/var DELAY_TIMEOUT = 1000;
	/*const*/var MAP_INDICES = {
		 'command':0,
		 'edit':1,
		 'edit-overwrite':1
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
	function expand (rhs, remap, handler, context) {
		if (!handler) return;
		if (depth < NEST_MAX) {
			depth++;
			stack.push([currentMap, index]);
			currentMap = null;
			index = 0;
			try {
				if (config.vars.remap && remap) {
					for (var i = 0; i < rhs.length; i++) {
						process(rhs[i], handler);
					}
				}
				else {
					for (var i = 0; i < rhs.length; i++) {
						handler(rhs[i]);
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
	function firstPropName (obj) {
		if (obj instanceof Object) {
			for (var i in obj) {
				return i;
			}
		}
	}
	function process (keyCode, handler) {
		var delayed = resetDelayed();
		var mapIndex;
		if (inputMode in MAP_INDICES) {
			mapIndex = MAP_INDICES[inputMode];
		}
		if (mapIndex == undefined || keyCode == false) {
			delayed && expandDelayed(delayed, 'delayed #1');
			handler && handler(keyCode);
			return;
		}
		if (quickActivation && inputMode == 'command' && keyCode == 9) {
			handler && handler(keyCode);
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
			if (seq[index] == keyCode) {
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
			handler && handler(keyCode);
			reset();
		}
	}

	this.__defineGetter__('commandMap', function () {return maps[0];});
	this.__defineGetter__('editMap', function () {return maps[1];});
	this.reset = reset;
	this.getMap = getMap;
	this.process = process;
}

/*constructor*/function Backlog (container, con, scaler) {
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
		var goalHeight = parseInt(con.clientHeight / scaler.offsetHeight) * scaler.offsetHeight;
		while (buffer.length) {
			if (con.value.length && con.value.substr(-1) != '\n') {
				con.value += '\n';
			}
			if (lastMessage.length && lastMessage.substr(-1) != '\n') {
				lastMessage += '\n';
			}
			var line = '';
			if (isInteractive) {
				line = buffer.shift();
			}
			else {
				line = buffer.join('\n');
				buffer.length = 0;
			}
			scaler.textContent = line;
			if (isInteractive && (totalHeight + scaler.offsetHeight > goalHeight || byLine)) {
				if (totalHeight == 0) {
					con.value += line;
					con.setSelectionRange(con.value.length, con.value.length);
					con.scrollTop = con.scrollHeight - con.clientHeight;
					lastMessage += toNativeControl(line);
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
				lastMessage += toNativeControl(line);
			}
		}

		if (state != 'console-wait') {
			pushInputMode('console-wait', 'backlog');
		}
		if (!preserveMessage) {
			showMessage(
				buffer.length ? _('More...') :
								_('Press any key to continue, or enter more ex command:'),
				false, true, true);
		}
	};
	this.dispose = function () {
		container = con = scaler = null;
	};
	this.__defineGetter__('queued', function () {
		return buffer.length > 0;
	});
	this.__defineGetter__('rows', function () {
		scaler.textContent = '0';
		return Math.floor(con.offsetHeight / scaler.offsetHeight);
	});
	this.__defineGetter__('cols', function () {
		emptyNodeContents(scaler);
		var span = scaler.appendChild(document.createElement('span'));
		span.textContent = '0';
		return Math.floor(con.offsetWidth / span.offsetWidth);
	});
	this.__defineGetter__('visible', function () {
		return document.defaultView.getComputedStyle(container, '').visibility != 'hidden';
	});
}

/*constructor*/function Bell (loadCallback) {
	var a = new window.Audio();
	var src = '';
	var prefix = '';
	var enabled = false;

	function load (callback) {
		if (a.canPlayType('audio/ogg')) {
			src = 'beep.ogg';
			prefix = 'data:audio/ogg;base64,';
		}
		else if (a.canPlayType('audio/mpeg')) {
			src = 'beep.mp3';
			prefix = 'data:audio/mpeg;base64,';
		}
		else {
			src = prefix = '';
		}

		if (src == '') {
			enabled = false;
			return;
		}

		if (extensionChannel) {
			extensionChannel.postMessage({type:'bell', file:src + '.txt'}, function (res) {
				if (res && res.data != '') {
					a.src = prefix + res.data;
					enabled = true;
					callback && callback();
					callback = null;
				}
			});
		}
		else {
			a.src = src;
			enabled = true;
			callback && callback();
			callback = null;
		}
	}

	a.addEventListener('load', function () {
		a.removeEventListener('load', arguments.callee, false);
		enabled = true;
	}, false);

	this.play = function () {
		if (src == '' || !enabled) return;
		var vol = Math.max(0, Math.min(config.vars.bellvolume, 100));
		if (vol > 0) {
			try {
				!a.ended && a.pause();
				a.loop = false;
				a.volume = vol / 100;
				a.currentTime = 0;
				a.play();
			}
			catch (e) {}
		}
	};
	this.load = load;

	load(loadCallback);
	loadCallback = null;
}

/*constructor*/function SubstituteWorker () {
	this.patternString = '';
	this.pattern = null;
	this.replOpcodes = null;
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
		var count, re, tildeUsed;

		// pattern and replacemnt
		if (pattern == '' && repl == '') {
			if ((pattern = lastSubstituteInfo.pattern || '') == '') {
				return _('No previous substitution.');
			}
			repl = config.vars.magic ? '~' : '\\~';
		}
		else if (pattern == '' && repl != '') {
			if ((pattern = lastRegexFindCommand.pattern || '') == '') {
				return _('No previous search pattern.');
			}
		}
		if (repl == '%') {
			if (lastSubstituteInfo.replacement == undefined) {
				return _('No previous substitution.');
			}
			repl = lastSubstituteInfo.replacement;
		}
		repl.replace(/\\.|./g, function (a) {
			if (a == '\\~' && !config.vars.magic
			||  a == '~' && config.vars.magic) {
				tildeUsed = true;
			}
		});
		if (tildeUsed) {
			if (lastSubstituteInfo.replacement == undefined) {
				return _('No previous substitution.');
			}
			var tildeRegex = config.vars.magic ? /(?!\\)~/g : /\\~/g;
			repl = repl.replace(tildeRegex, lastSubstituteInfo.replacement);
		}

		// options
		re = /^\s*([gc]+)/.exec(options);
		if (re) {
			if (re[1].indexOf('g') >= 0) {
				this.isGlobal = true;
			}
			if (re[1].indexOf('c') >= 0) {
				this.isConfirm = true;
			}
			options = options.substring(re[0].length);
		}

		// count
		re = /^\s*(\d+)/.exec(options);
		if (re) {
			count = parseInt(re[1], 10);
			range[0] = range[1];
			range[1] = Math.max(0, Math.min(range[0] + count - 1, t.rowLength - 1));
			options = options.substring(re[0].length);
		}

		lastRegexFindCommand.push({direction:1});
		lastRegexFindCommand.setPattern(pattern);
		lastSubstituteInfo.pattern = pattern;
		lastSubstituteInfo.replacement = repl;
		this.patternString = pattern;
		this.pattern = getFindRegex(pattern);
		this.pattern.lastIndex = 0;
		registers.set('/', lastRegexFindCommand.pattern);
		this.replOpcodes = this.compileReplacer(repl);
		if (!this.replOpcodes) {
			return _('Internal Error: invalid replace function');
		}

		var rg = document.createRange();
		rg.setStartBefore(t.rowNodes(0));
		rg.setEndBefore(t.rowNodes(range[0]));
		this.textPreLength = rg.toString().length;
		this.textRowCount = range[1] - range[0] + 1;

		rg.setStartBefore(t.rowNodes(range[0]));
		rg.setEndAfter(t.rowNodes(range[1]));
		this.text = range[1] == t.rowLength - 1 ? trimTerm(rg.toString()) : rg.toString();
		rg.detach();

		this.substCount = 0;
		this.foundCount = 0;
		if (this.isConfirm) {
			substituteWorker = this;
			this.kontinue(t);
		}
		else {
			this.burst(t);
		}
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
				requestShowMessage(_('Substitute? ([y]es, [n]o, [q]uit)'), false, true, true);
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
				this.re = this.pattern = this.replOpcodes =
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
		var replaced = this.executeReplacer(re);
		t.selectionStart = new Position(row, col);
		t.selectionEnd = t.offsetBy(t.selectionStart, re[0].length);
		insert(t, replaced);
		this.text =
			this.text.substring(0, re.index) +
			replaced +
			this.text.substring(re.index + re[0].length);
		this.pattern.lastIndex += replaced.length - re[0].length;
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
	executeReplacer: function (re, opcodes) {
		opcodes || (opcodes = this.replOpcodes);
		if (!opcodes) return '';

		var result = [];
		for (var i = 0, goal = opcodes.length; i < goal; i++) {
			switch (opcodes[i].x) {
			case 0:
				result.push(opcodes[i].v);
				break;
			case 1:
				result.push(re[opcodes[i].v] || '');
				break;
			case 2:
				if (result.length) {
					var tmp = result[result.length - 1];
					tmp = tmp.charAt(0).toUpperCase() + tmp.substring(1);
					result[result.length - 1] = tmp;
				}
				break;
			case 3:
				if (result.length) {
					var tmp = result[result.length - 1];
					tmp = tmp.charAt(0).toLowerCase() + tmp.substring(1);
					result[result.length - 1] = tmp;
				}
				break;
			case 4:
				if (result.length) {
					result[result.length - 1] = result[result.length - 1].toUpperCase();
				}
				break;
			case 5:
				if (result.length) {
					result[result.length - 1] = result[result.length - 1].toLowerCase();
				}
				break;
			}
		}
		return result.join('');
	},
	compileReplacer: function (repl) {
		/*
		 * Meta characters in replacement string are:
		 *
		 * &        matched text
		 * \0 - \9  back reference in the matched text
		 * \u, \l   capitalize the next letter
		 *
		 *              \uabc -> Abc
		 *              \u\0 -> Def
		 *                  (if \0 equals 'def')
		 *
		 * \U, \L   capitalize whole letter till \e, \E or end of replacement string
		 *
		 *              \Uabc\E -> ABC
		 *              \U\0 -> DEF
		 *                  \0 equals 'def')
		 *
		 * \e, \E   end of \u, \l, \U, \L
		 */

		if (repl == '') return [];

		var result, stack = [];
		var specialEscapes = {'\\':'\\', 'n':'\n', 't':'\t'};
		var specialLetters = {'\r':'\n'};
		function loop (callDepth, interruptMode, start) {
			/*
			 * opcodes:
			 *   0: literal
			 *   1: backref
			 *   2: upper first
			 *   3: lower first
			 *   4: upper
			 *   5: lower
			 */
			var newOperand = true;
			for (var i = start; i < repl.length; i++) {
				var ch = repl.charAt(i);
				var ate = false;
				if (ch == '\\') {
					if (++i >= repl.length) {
						return i;
					}
					ch += repl.charAt(i);
				}
				switch (ch) {
				case '&': case '\\&':
					if (ch == '&'   && config.vars.magic
					||  ch == '\\&' && !config.vars.magic) {
						stack.push({x:1, v:0});
						ate = newOperand = true;
					}
					break;
				case '\\0': case '\\1': case '\\2': case '\\3': case '\\4':
				case '\\5': case '\\6': case '\\7': case '\\8': case '\\9':
					stack.push({x:1, v:ch.charAt(1)});
					ate = newOperand = true;
					break;
				case '\\u':
					i = loop(callDepth + 1, 1, i + 1);
					stack.push({x:2});
					ate = newOperand = true;
					break;
				case '\\l':
					i = loop(callDepth + 1, 1, i + 1);
					stack.push({x:3});
					ate = newOperand = true;
					break;
				case '\\U':
					i = loop(callDepth + 1, 2, i + 1);
					stack.push({x:4});
					ate = newOperand = true;
					break;
				case '\\L':
					i = loop(callDepth + 1, 2, i + 1);
					stack.push({x:5});
					ate = newOperand = true;
					break;
				case '\\e': case '\\E':
					if (callDepth && interruptMode == 2) return i;
					ate = newOperand = true;
					break;
				}
				if (!ate) {
					if (ch.length >= 2 && ch.charAt(0) == '\\') {
						ch = ch.charAt(1);
						ch = specialEscapes[ch] || ch;
					}
					var code = ch.charCodeAt(0);
					if (specialLetters[ch]) {
						ch = specialLetters[ch];
					}
					else if (code >= 0x00 && code != 0x09 && code != 0x0a && code <= 0x1f
					|| code == 0x7f) {
						ch = toVisibleControl(code);
					}
					if (newOperand || stack.length == 0) {
						stack.push({x:0, v:ch});
						newOperand = false;
					}
					else if (stack.length && stack[stack.length - 1].x == 0) {
						stack[stack.length - 1].v += ch;
					}
				}
				if (callDepth && interruptMode == 1) {
					return i;
				}
			}
			return i;
		}
		loop(0, 0, 0);
		return stack;
	}
};

/*constructor*/function LineInputHistories (maxSize, names, loadCallback, ignoreStorage) {
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
		var value = serialize();
		setLocalStorage(storageKey, serialize());
	}
	function load (callback) {
		s = {};
		names.forEach(function (na) {
			s[na] = {lines:[], current:-1};
		});
		getLocalStorage(storageKey, function (value) {
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

	load(loadCallback);
	loadCallback = null;
}

/*constructor*/function EditLogger (editor, max) {
	this.init(editor, max);
}
EditLogger.ITEM_TYPE = {
	NOP: 0,
	INSERT: 1,
	OVERWRITE: 2,
	DELETE: 3,
	SHIFT: 4,
	UNSHIFT: 5
};
EditLogger.prototype = new function () {
	/*constructor*/function EditLogItemBase () {
		this.position = undefined;
		this.data = undefined;
		this.inputMethod = 'insertChars';
	}
	EditLogItemBase.prototype = {
		type: 'Base',
		_init: function (p, d) {
			if (p != undefined) this.position = p.clone();
			if (d != undefined) this.data = d.replace(
				// /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, function (a) {
				/[\u0000-\u0008\u000b-\u001f\u007f]/g, function (a) {
					return toVisibleControl(a.charCodeAt(0));
				});
		},
		_dump: function (depth) {
			return multiply(' ', depth) +
				'+ ' + this.type + '\n' +
				multiply(' ', depth + 2) +
				'position:' + (this.position ? this.position.toString() : '(N/A)') +
				', data:' + (this.data != undefined ? ('"' + toVisibleString(this.data) + '"') : '(N/A)');
		},
		_ensureValidPosition: function (t, p) {
			return p.row >= 0 && p.row < t.rowLength
				&& p.col >= 0 && p.col <= t.rows(p).length;
		},
		_ensureValidPositionForAppend: function (t, p) {
			if (this.isLineOrient && p.row == t.rowLength) {
				return true;
			}
			return this._ensureValidPosition(t, p);
		},
		init: function () {
			this._init.apply(this, arguments);
		},
		undo: function () {
		},
		redo: function () {
		},
		restorePosition: function () {
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
	/*constructor*/function EditLogItemInsert () {}
	EditLogItemInsert.prototype = extend(new EditLogItemBase, {
		type: 'Insert',
		init: function (p, d) {
			this._init.apply(this, arguments);
		},
		undo: function (t, isClusterMember) {
			if (!this._ensureValidPosition(t, this.position)) {
				devMode && console.error(this.toString() + '#undo: bad position!');
				return 0;
			}

			var ss = this.position.clone();
			var se = this.position2 ? this.position2.clone() : t.offsetBy(ss, this.data.length);
			var data2 = this.hasOwnProperty('data2') ? this.data2 : false;

			if (this.hasOwnProperty('isLineOrient')) {
				t.isLineOrientSelection = this.isLineOrient;
			}
			else {
				t.isLineOrientSelection = false;
			}

			if (t.getSelection(ss, se) != this.data) {
				devMode && console.error([
					this.toString() + '#undo: bad consistency!',
					' position: ' + this.position,
					'position2: ' + (this.position2 || '(N/A)'),
					'       LO: ' + this.isLineOrient,
					'       ss: ' + ss,
					'       se: ' + se,
					'selection: ' + toVisibleString(t.getSelection(ss, se)),
					'this.data: ' + toVisibleString(this.data)
				].join('\n'));
				return 0;
			}

			marks.update(t.selectionStart, function () {
				t.deleteRange(ss, se);
			});
			data2 !== false && t.setRow(ss, data2);
			!isClusterMember && this.restorePosition(t);
			t.isLineOrientSelection = false;

			return 1;
		},
		redo: function (t, isClusterMember) {
			if (!this._ensureValidPositionForAppend(t, this.position)) {
				devMode && console.error([
					this.toString() + '#redo: bad position!',
					'this.position: ' + this.position,
					'  t.rowLength: ' + t.rowLength
				].join('\n'));
				return 0;
			}

			var self = this;
			marks.update(this.position, function () {
				var data = self.data;

				if (self.isLastLine) {
					data = trimTerm(data);
				}
				if (self.position.row == t.rowLength) {
					t.setSelectionRange(new Position(
						t.rowLength - 1,
						t.rows(t.rowLength - 1).length
					));
					t.divideLine();
				}
				else {
					t.setSelectionRange(self.position);
				}

				var re = data.match(/\n|[^\n]+/g);
				if (!re) return;

				for (var i = 0; i < re.length; i++) {
					re[i] == '\n' ?
						isMultilineTextInput(targetElement) && t.divideLine() :
						t.setSelectionRange(t[self.inputMethod](t.selectionStart, re[i]));
				}
			});
			if (this.marks) {
				for (var i in this.marks) {
					!marks.get(i) && marks.set(i, this.marks[i]);
				}
			}
			!isClusterMember && this.restorePosition(t);

			return 1;
		},
		restorePosition: function (t) {
			var n = this.position.clone();
			if (n.row >= t.rowLength) {
				n.row = t.rowLength - 1;
				t.setSelectionRange(t.getLineTopOffset2(n));
			}
			else {
				t.setSelectionRange(n);
			}
		}
	});
	/*
	 * overwrite: point, data, data2
	 *
	 *     * example data:
	 *
	 *       point:[0,3]
	 *       data:"ABC"
	 *       data2:"abcdefghijklmn"
	 *
	 *     * edit, and redo operation:
	 *
	 *       abcdefghijklmn -> abcABCghijklmn
	 *          ^                    ^
	 *          ABC
	 *
	 *     * undo operation:
	 *
	 *       abcABCdefghijklmn -> abcdefghijklmn
	 *          ^                    ^
	 */
	/*constructor*/function EditLogItemOverwrite () {}
	EditLogItemOverwrite.prototype = extend(new EditLogItemBase, {
		type: 'Overwrite',
		init: function (p, d, d2) {
			this._init.apply(this, arguments);
			this.data2 = d2;
			this.inputMethod = 'overwriteChars';
		},
		undo: function () {
			return EditLogItemInsert.prototype.undo.apply(this, arguments);
		},
		redo: function () {
			return EditLogItemInsert.prototype.redo.apply(this, arguments);
		},
		restorePosition: function () {
			return EditLogItemInsert.prototype.restorePosition.apply(this, arguments);
		},
		dump: function (depth) {
			var indent = '\n' + multiply(' ', depth + 2);
			return this._dump(depth) +
				indent + 'data2:"' + toVisibleString(this.data2) + '"';
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
	/*constructor*/function EditLogItemDelete () {}
	EditLogItemDelete.prototype = extend(new EditLogItemBase, {
		type: 'Delete',
		init: function (p, d, p2, lo, ll, ms) {
			this._init.apply(this, arguments);
			this.position2 = p2.clone();
			this.isLineOrient = !!lo;
			this.isLastLine = !!ll;
			this.marks = ms;
		},
		undo: function () {
			return EditLogItemInsert.prototype.redo.apply(this, arguments);
		},
		redo: function () {
			return EditLogItemInsert.prototype.undo.apply(this, arguments);
		},
		restorePosition: function () {
			return EditLogItemInsert.prototype.restorePosition.apply(this, arguments);
		},
		dump: function (depth) {
			var indent = '\n' + multiply(' ', depth + 2);
			return this._dump(depth) +
				indent + 'position2:' + this.position2.toString() +
				indent + 'isLineOrient:' + this.isLineOrient +
				indent + 'isLastLine:' + this.isLastLine;
		}
	});
	/*
	 * shift: point, count
	 */
	/*constructor*/function EditLogItemShift () {}
	EditLogItemShift.prototype = extend(new EditLogItemBase, {
		type: 'Shift',
		init: function (p, d, rc, sc, sw, ts) {
			this._init.apply(this, arguments);
			this.rowCount = rc;
			this.shiftCount = sc;
			this.shiftWidth = sw;
			this.tabStop = ts;
		},
		undo: function (t, isClusterMember) {
			if (!this._ensureValidPosition(t, this.position)) {
				devMode && console.error(this.toString() + '#undo: bad position!');
				return 0;
			}
			var s = this;
			marks.update(this.position, function () {
				t.shift(
					s.position.row,
					Math.min(s.position.row + s.rowCount, t.rowLength) - s.position.row,
					-s.shiftCount, s.shiftWidth, s.tabStop
				);
			});
			!isClusterMember && this.restorePosition(t);
			return 1;
		},
		redo: function (t, isClusterMember) {
			if (!this._ensureValidPosition(t, this.position)) {
				devMode && console.error(this.toString() + '#redo: bad position!');
				return 0;
			}
			var s = this;
			marks.update(this.position, function () {
				t.shift(
					s.position.row,
					Math.min(s.position.row + s.rowCount, t.rowLength) - s.position.row,
					s.shiftCount, s.shiftWidth, s.tabStop, s.indents
				);
			});
			!isClusterMember && this.restorePosition(t);
			return 1;
		},
		restorePosition: function (t) {
			var n = this.position.clone();
			if (n.row >= t.rowLength) {
				n.row = t.rowLength - 1;
			}
			t.setSelectionRange(t.getLineTopOffset2(n));
		},
		dump: function (depth) {
			var indent = '\n' + multiply(' ', depth + 2);
			return this._dump(depth) +
				indent + 'rc:' + this.rowCount +
				indent + 'sc:' + this.shiftCount +
				indent + 'sw:' + this.shiftWidth +
				indent + 'ts:' + this.tabStop;
		}
	});
	/*
	 * unshift: point, count
	 */
	/*constructor*/function EditLogItemUnshift () {}
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
		restorePosition: function () {
			return EditLogItemShift.prototype.restorePosition.apply(this, arguments);
		},
		dump: function () {
			return EditLogItemShift.prototype.dump.apply(this, arguments);
		}
	});
	/*
	 * edit log item cluster
	 */
	/*constructor*/function EditLogItemCluster () {
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
				result += this.items[i].undo(t, true) || 0;
			}
			result && this.items[0].restorePosition(t);
			return result;
		},
		redo: function (t) {
			var result = 0;
			for (var i = 0; i < this.items.length; i++) {
				result += this.items[i].redo(t, true) || 0;
			}
			result && this.items[0].restorePosition(t);
			return result;
		},
		restorePosition: function (t) {
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
		EditLogItemBase,
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
			this.clear();
		},
		clear: function () {
			this.logs = new EditLogItemCluster;
			this.cluster = null;
			this.currentPosition = this.logs.length - 1;
			return this;
		},
		open: function (tag, func) {
			if (this.cluster) {
				this.cluster.nestLevel++;
			}
			else {
				this.cluster = new EditLogItemCluster();
			}
			if (func) {
				try {
					func();
				}
				finally {
					this.close();
				}
			}
			return this;
		},
		write: function (type) {
			var item;
			if (this.cluster && pool[type]) {
				var args = Array.prototype.slice.call(arguments, 1);
				item = new pool[type];
				item.init.apply(item, args);
				this.cluster.push(item);
			}
			else {
				throw new Error('EditLogger: invalid undo item type');
			}
			return item;
		},
		close: function () {
			if (this.cluster) {
				if (--this.cluster.nestLevel < 0) {
					var representer = this.cluster.representer;
					if (representer) {
						this.logs.items.length = this.currentPosition + 1;
						this.logs.push(representer);
						this.logs.trim(this.max);
						this.currentPosition = this.logs.length - 1;
					}
					this.cluster = null;
					//devMode && console.log('*** editLogger dump ***\n' + this.logs.dump());
				}
			}
			else {
				throw new Error('EditLogger: edit logger doesn\'t open');
			}
			return this;
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
		dispose: function () {
			this.editor = null;
			this.logs = null;
			this.cluster = null;
		},
		get logMax () {
			return this.max;
		},
		set logMax (v) {
			if (typeof v != 'number' || v < 0) {
				throw new Exeception('EditLogger: invalid logMax');
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

/*constructor*/function PairBracketsIndicator (c, t, n) {
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
		var nodes = t.getSpans(EMPHASIS_CLASS);
		var fg = visible ? theme.colors.highlightFg : '';
		var bg = visible ? theme.colors.highlightBg : '';
		for (var i = 0; i < nodes.length; i++) {
			nodes[i].style.color = fg;
			nodes[i].style.backgroundColor = bg;
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
	this.dispose = clear;
	timer = setTimeout(init, 1);
}
PairBracketsIndicator.getObject = function (c, t, n) {
	if (c != '' && CLOSE_BRACKETS.indexOf(c) >= 0) {
		var result = searchUtils.findMatchedBracket(1, c, n);
		if (result) {
			return new PairBracketsIndicator(c, t, result);
		}
	}
	return null;
};

/*constructor*/function L10n (catalog) {
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
	function init () {
		var PLURAL_FUNCTION_SIGNATURE = '_plural_rule@function';
		var expressionString;

		if (catalog && PLURAL_FUNCTION_SIGNATURE in catalog) {
			expressionString = catalog[PLURAL_FUNCTION_SIGNATURE].message;
		}
		if (!expressionString && extensionChannel) {
			expressionString = extensionChannel.getMessage(PLURAL_FUNCTION_SIGNATURE);
		}

		compile(expressionString);
	}

	this.getMessage = function (messageId) {
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
		else if (extensionChannel) {
			return extensionChannel.getMessage(getId(messageId)) || messageId;
		}
		return messageId;
	};
	this.getPluralNoun = function (word, n) {
		var suffix = getPluralSuffix(n - 0);
		var id = '_plural_' + word + (suffix == '' ? '' : ('@' + suffix));
		if (catalog) {
			return id in catalog ? catalog[id].message : word;
		}
		else if (extensionChannel) {
			return extensionChannel.getMessage(id) || word;
		}
		return word;
	};

	init();
}

// almost methods in this class are ported from search.c of vim.
/*constructor*/function SearchUtils (editor) {
	var spaces = /[ \t]/;
	var paragraphs;
	var sections;

	function findNextQuote (line, col, quoteChar) {
		var escapeChar = config.vars.quoteescape;
		for (var goal = line.length; col < goal; col++) {
			var c = line.charAt(col);
			if (c == escapeChar) {
				col++;
			}
			else if (c == quoteChar) {
				return col;
			}
		}
		return -1;
	}
	function findPrevQuote (line, col, quoteChar) {
		var escapeChar = config.vars.quoteescape;
		while (col-- > 0) {
			var n = 0;
			while (col - n > 0 && line.charAt(col - n - 1) == escapeChar) {
				n++;
			}
			if (n & 1) {
				col -= n;
			}
			else if (line.charAt(col) == quoteChar) {
				return col;
			}
		}
		return 0;
	}
	function getSimpleCharClass (n, bigword) {
		n || (n = editor.selectionStart);
		var c = editor.charAt(n);
		if (spaces.test(c)) return 0;
		if (bigword) return 1;
		if (config.vars.iskeyword.test(c)) return 2;
		return editor.charClassAt(n);
	}
	function backToBoundary (bigword) {
		var n = editor.selectionStart;
		var sclass = getSimpleCharClass(n, bigword);
		while (true) {
			if (n.col == 0) break;
			n.col--;
			if (getSimpleCharClass(n, bigword) != sclass) {
				n.col++;
				break;
			}
		}
		editor.setSelectionRange(n);
	}
	function findFirstBlank (pos) {
		while (editor.decl(pos) != -1) {
			if (!spaces.test(editor.charAt(pos || editor.selectionStart))) {
				editor.incl(pos);
				break;
			}
		}
	}
	function findSentenceForward (count, atStartSent) {
		while (count--) {
			findSentenceBoundary(1, true);
			if (atStartSent) {
				findFirstBlank();
			}
			if (count == 0 || atStartSent) {
				editor.decl();
			}
			atStartSent = !atStartSent;
		}
	}
	function isInMacro (macros, s) {
		for (var i = 0, goal = macros.length; i < goal; i++) {
			var macro = macros[i];
			if (macro == '') continue;

			var s0 = s.charAt(1);
			var s1 = s.charAt(2);
			var matched1  = macro.charAt(0) == s0;
			var matched1s = macro.charAt(0) == ' ' && /^ ?$/.test(s0);
			var matched2  = macro.charAt(1) == s1;
			var matched2s = /^ ?$/.test(macro.charAt(1)) && (s0 == '' || /^ ?$/.test(s1));
			if ((matched1 || matched1s) && (matched2 || matched2s)) {
				return true;
			}
		}
		return false;
	}
	function isStartOfParagraphOrSection (pos, para, both) {
		var s = editor.rows(pos);
		para || (para = '');
		both = !!both;
		switch (s.charAt(0)) {
		case para: case '\u240c'/*form-feed-picture*/:
			return true;
		case '}':
			return both;
		case '.':
			return isInMacro(getSections(), s)
				|| !para && isInMacro(getParagraphs(), s);
		}
		return false;
	}
	function isWhiteCharOnly (pos) {
		return /^[ \t]*$/.test(editor.rows(pos));
	}
	function getSections () {
		if (!sections) {
			try {
				setSectionMacros(config.vars.sections);
			}
			catch (e) {
				sections = [];
			}
		}
		return sections;
	}
	function getParagraphs () {
		if (!paragraphs) {
			try {
				setParagraphMacros(config.vars.paragraphs);
			}
			catch (e) {
				paragraphs = [];
			}
		}
		return paragraphs;
	}

	/*
	 * public methods
	 */

	function findQuoteRange (line, firstCol, quoteChar) {
		var colStart = 0, colEnd;
		while (true) {
			colStart = findNextQuote(line, colStart, quoteChar);
			if (colStart < 0 || colStart > firstCol) return false;

			colEnd = findNextQuote(line, colStart + 1, quoteChar);
			if (colEnd < 0) return false;

			if (colStart <= firstCol && firstCol <= colEnd) break;

			colStart = colEnd + 1;
		}
		return {start:colStart, end:colEnd};
	}
	function findSentenceBoundary (count, isForward, isFindOnly) {
		var pos = editor.selectionStart;
		var iter = isForward ? editor.incl : editor.decl;
		var noSkip = false;

		while (count--) {
loop:			do {
				if (editor.isNewline(pos)) {
					do {
						if (iter.call(editor, pos) == -1) break;
					} while (editor.isNewline(pos));
					if (isForward) break loop;
				}
				else if (isForward && pos.col == 0 && isStartOfParagraphOrSection(pos, null, false)) {
					if (pos.row >= editor.rowLength - 1) {
						return false;
					}
					pos.row++;
					break loop;
				}
				else if (!isForward) {
					editor.decl(pos);
				}

				var foundDot = false;
				while (true) {
					var c = editor.charAt(pos);
					if (spaces.test(c) || (!isForward && /[.!?)\]"']/.test(editor.charAt(pos)))) {
						if (/[.!?]/.test(c)) {
							if (foundDot) break;
							foundDot = true;
						}
						if (editor.decl(pos) == -1) break;
						if (editor.isNewline(pos) && isForward) {
							editor.incl(pos);
							break loop;
						}
					}
					else {
						break;
					}
				}

				//
				var startRow = pos.row;
				var cpo_J = true;
				while (true) {
					var c = editor.charAt(pos);
					if (editor.isNewline(pos)
					|| pos.col == 0 && isStartOfParagraphOrSection(pos, null, false)) {
						if (!isForward && pos.row != startRow) {
							pos.row++;
						}
						break;
					}
					if (/[.!?]/.test(c)) {
						var tpos = pos.clone();
						while (true) {
							c = editor.inc(tpos);
							if (c == -1) break;
							c = editor.charAt(tpos);
							if (!/[)\]"']/.test(c)) break;
						}

						if (c === -1 || editor.isNewline(tpos)
						|| !cpo_J && spaces.test(c)
						|| cpo_J && (c == ' ' && editor.inc(tpos) >= 0 && editor.charAt(tpos) == ' ')) {
							pos = tpos;
							editor.isNewline(pos) && editor.inc(pos);
							break;
						}
					}
					if (iter.call(editor, pos) == -1) {
						if (count) return false;
						noSkip = true;
						break;
					}
				}
			} while (false);

			//
			if (!noSkip) {
				while (spaces.test(editor.charAt(pos))) {
					if (editor.incl(pos) == -1) break;
				}
			}
		}

		!isFindOnly && editor.setSelectionRange(pos);
		return pos;
	}
	function findParagraphBoundary (count, isForward, isFindOnly, what, both) {
		var pos = editor.selectionStart;
		var posix = true;
		var dir = isForward ? 1 : -1;
		pos.col = 0;
		while (count--) {
			var skipped = false;
			for (var first = true; ; first = false) {
				if (!editor.isNewline(pos)) {
					skipped = true;
				}
				if (!first && skipped) {
					if (isStartOfParagraphOrSection(pos, what, both)
					||  posix && !what && editor.rows(pos).charAt(0) == '{') {
						break;
					}
				}
				pos.row += dir;
				if (pos.row < 0 || pos.row >= editor.rowLength) {
					if (count) return false;
					pos.row -= dir;
					break;
				}
			}
		}
		if (both && editor.rows(pos).charAt(0) == '}') {
			pos.row++;
		}
		if (pos.row >= editor.rowLength - 1 && what != '}') {
			pos.col = editor.rows(pos).length;
			if (pos.col != 0) {
				pos.col--;
			}
		}
		else {
			pos.col = 0;
		}

		!isFindOnly && editor.setSelectionRange(pos);
		return pos;
	}
	function findMatchedBracket (count, bracketSpecified, initialPos) {
		function findBracket () {
			var i = 0;
			while (!editor.isEndOfText(n) && !editor.isNewline(n)) {
				var index = BRACKETS.indexOf(editor.charAt(n));
				if (index != -1 && ++i == count) {
					return index;
				}
				n = editor.rightPos(n);
			}
			return -1;
		}
		function findMatchForward (current, match) {
			var depth = 0;
			var prevn = n;
			n = editor.rightPos(n);
			while (!editor.isEndOfText(n) && n.ne(prevn)) {
				switch (editor.charAt(n)) {
				case current:
					depth++;
					break;
				case match:
					if (depth == 0) return n;
					depth--;
					break;
				}
				prevn = n;
				n = editor.rightPos(n);
			}
		}
		function findMatchBackward (current, match) {
			var depth = 0;
			var prevn = n;
			n = editor.leftPos(n);
			while ((n.row > 0 || n.col >= 0) && n.ne(prevn)) {
				switch (editor.charAt(n)) {
				case current:
					depth++;
					break;
				case match:
					if (depth == 0) return n;
					depth--;
					break;
				}
				prevn = n;
				n = editor.leftPos(n);
			}
		}

		var n = initialPos || editor.selectionStart;
		var currentIndex = bracketSpecified ?
			BRACKETS.indexOf(bracketSpecified) :
			findBracket();
		if (currentIndex <= -1) return;

		var baseChar = BRACKETS.charAt(currentIndex);
		var matchChar = BRACKETS.charAt(BRACKETS.length - 1 - currentIndex);
		count || (count = 1);
		if (baseChar == matchChar) {
			var range = findQuoteRange(editor.rows(n), n.col, baseChar);
			if (!range) return;
			n.col = n.col == range.start ? range.end : range.start;
			return n;
		}
		else {
			var dir = currentIndex >= BRACKETS.length / 2 ? -1 : 1;
			switch (dir) {
			case -1: return findMatchBackward(baseChar, matchChar);
			case  1: return findMatchForward(baseChar, matchChar);
			}
		}
	}
	function quote (count, quoteChar, includeAnchor) {
		var line = editor.rows(editor.selectionStartRow);
		var colStart = editor.selectionStartCol;
		var colEnd;
		if (line.charAt(colStart) == quoteChar) {
			var range = findQuoteRange(line, colStart, quoteChar);
			if (!range) return;
			colStart = range.start;
			colEnd = range.end;
		}
		else {
			colStart = findPrevQuote(line, colStart, quoteChar);
			if (line.charAt(colStart) != quoteChar) {
				colStart = findNextQuote(line, colStart, quoteChar);
				if (colStart < 0) return false;
			}

			colEnd = findNextQuote(line, colStart + 1, quoteChar);
			if (colEnd < 0) return false;
		}
		if (includeAnchor) {
			if (spaces.test(line.charAt(colEnd + 1))) {
				while (spaces.test(line.charAt(colEnd + 1))) {
					colEnd++;
				}
			}
			else {
				while (colStart > 0 && spaces.test(line.charAt(colStart - 1))) {
					colStart--;
				}
			}
		}
		if (!includeAnchor && count < 2) {
			colStart++;
		}
		if (includeAnchor || count >= 2) {
			colEnd++;
		}
		var row = editor.selectionStartRow;
		editor.setSelectionRange(new Position(row, colStart), new Position(row, colEnd));
		return true;
	}
	function word (count, bigword, includeAnchor) {
		bigword = bigword == 'W';
		backToBoundary(bigword);
		if (includeAnchor) {
			if (getSimpleCharClass(null, bigword) == 0) {
				motionNextWord('', editor, count, bigword, true);
				motionRight('', editor, 1);
			}
			else {
				motionNextWord('', editor, count, bigword);
			}
		}
		else {
			if (getSimpleCharClass(null, bigword) == 0) {
				motionNextWord('', editor, 1);
				editor.setSelectionRange(editor.selectionEnd);
			}
			motionNextWord('', editor, count, bigword, true);
			if (editor.selectionStartRow != editor.selectionEndRow
			||  editor.selectionEndCol - editor.selectionStartCol != 1) {
				motionRight('', editor, 1);
			}
		}
		return true;
	}
	function block (count, what, over, includeAnchor) {
		if (editor.charAt(editor.selectionStart) == what) {
			motionRight('', editor, 1);
			editor.setSelectionRange(editor.selectionEnd);
		}
		var origPos = editor.selectionStart;
		var startPos, endPos;
		do {
			startPos = findMatchedBracket(count, over);
			if (!startPos) break;

			editor.setSelectionRange(startPos);
			endPos = findMatchedBracket(count);
			if (!endPos) break;

			if (includeAnchor) {
				endPos = editor.rightPos(endPos);
			}
			else {
				startPos = editor.rightPos(startPos);
			}
		} while (false);

		if (startPos && endPos) {
			editor.setSelectionRange(startPos, endPos);
			return true;
		}
		else {
			editor.setSelectionRange(origPos);
			return false;
		}
	}
	function sentence (count, includeAnchor) {
		var startPos = editor.selectionStart;
		var startBlank = false;

		//
		findSentenceBoundary(1, true);

		//
		var pos = startPos.clone();
		while (spaces.test(editor.charAt(pos))) {
			editor.incl(pos);
		}
		if (pos.eq(editor.selectionStart)) {
			if (includeAnchor) {
				startBlank = true;
				findFirstBlank(startPos);
			}
			else {
				startPos = editor.selectionStart;
			}
		}
		else {
			findSentenceBoundary(1, false);
			startPos = editor.selectionStart;
		}

		//
		var nCount = includeAnchor ? count * 2 : (count - (startBlank ? 1 : 0));
		if (nCount > 0) {
			findSentenceForward(nCount, true);
		}
		else {
			editor.decl();
		}

		//
		if (includeAnchor) {
			if (startBlank) {
				findFirstBlank();
				if (spaces.test(editor.charAt(editor.selectionStart))) {
					editor.decl();
				}
			}
			else if (!spaces.test(editor.charAt(editor.selectionStart))) {
				findFirstBlank(startPos);
			}
		}

		//
		editor.incl();
		editor.setSelectionRange(startPos, editor.selectionStart);
		return true;
	}
	function paragraph (count, includeAnchor) {
		var origPos = editor.selectionStart;
		var startPos = new Position(editor.selectionStartRow, 0);
		var whiteInFront = isWhiteCharOnly(startPos);

		//
		var prevPos = new Position(startPos.row - 1, 0);
		while (startPos.row > 0) {
			if (whiteInFront) {
				if (!isWhiteCharOnly(prevPos)) break;
			}
			else {
				if (isWhiteCharOnly(prevPos)
				||  isStartOfParagraphOrSection(startPos, null, false)) break;
			}
			startPos.row--, prevPos.row--;
		}

		//
		if (!includeAnchor && isWhiteCharOnly(startPos)) {
			whiteInFront = false;
			while (startPos.row < editor.rowLength - 1
			&& isWhiteCharOnly(startPos)) {
				startPos.row++;
			}
		}

		//
		var endPos = startPos.clone();
		while (endPos.row < editor.rowLength && isWhiteCharOnly(endPos)) {
			endPos.row++;
		}
		endPos.row--;

		//
		var doWhite = false;
		var nextPos = new Position(endPos.row + 1, 0);
		for (var i = count - (!includeAnchor && whiteInFront ? 1 : 0); i--; ) {
			if (endPos.row >= editor.rowLength - 1) return false;
			if (!includeAnchor) {
				doWhite = isWhiteCharOnly(nextPos);
			}
			if (includeAnchor || !doWhite) {
				endPos.row++, nextPos.row++;
				while (endPos.row < editor.rowLength - 1
				&& !isWhiteCharOnly(nextPos)
				&& !isStartOfParagraphOrSection(nextPos, null, false)) {
					endPos.row++, nextPos.row++;
				}
			}
			if (i == 0 && whiteInFront && includeAnchor) {
				break;
			}
			if (includeAnchor || doWhite) {
				while (endPos.row < editor.rowLength - 1
				&& isWhiteCharOnly(nextPos)) {
					endPos.row++, nextPos.row++;
				}
			}
		}

		//
		if (!whiteInFront && !isWhiteCharOnly(endPos) && includeAnchor) {
			var prevPos = new Position(startPos.row - 1, 0);
			while (startPos.row > 0 && isWhiteCharOnly(prevPos)) {
				startPos.row--, prevPos.row--;
			}
		}

		//
		isVerticalMotion = true;
		editor.setSelectionRange(startPos, endPos);
		return true;
	}
	function dispatchRangeSymbol (count, targetChar, includeAnchor) {
		switch (targetChar) {
		case '"': case "'": case '`':
			return quote.apply(null, arguments);

		case '[': case ']':
			return block(count, '[', ']', includeAnchor);
		case '{': case '}': case 'B':
			return block(count, '{', '}', includeAnchor);
		case '<': case '>':
			return block(count, '<', '>', includeAnchor);
		case '(': case ')': case 'b':
			return block(count, '(', ')', includeAnchor);

		case 'w': case 'W':
			return word.apply(null, arguments);

		case 'p':
			return paragraph(count, includeAnchor);
		case 's':
			return sentence(count, includeAnchor);
		case 't':
			return false; // not implemented
		}
	}
	function setParagraphMacros (m) {
		if (!/^[a-zA-Z ]+$/.test(m) || m.length % 2) {
			throw new Error(_('Invalid paragraph format: {0}', m));
		}
		paragraphs = [];
		m.replace(/../g, function (a) {paragraphs.push(a);});
	}
	function setSectionMacros (m) {
		if (!/^[a-zA-Z ]+$/.test(m) || m.length % 2) {
			throw new Error(_('Invalid section format: {0}', m));
		}
		sections = [];
		m.replace(/../g, function (a) {sections.push(a);});
	}
	function dispose () {
		editor = null;
	}

	this.findQuoteRange = findQuoteRange;
	this.findSentenceBoundary = findSentenceBoundary;
	this.findParagraphBoundary = findParagraphBoundary;
	this.findMatchedBracket = findMatchedBracket;
	this.quote = quote;
	this.word = word;
	this.block = block;
	this.sentence = sentence;
	this.paragraph = paragraph;
	this.dispatchRangeSymbol = dispatchRangeSymbol;
	this.setParagraphMacros = setParagraphMacros;
	this.setSectionMacros = setSectionMacros;
	this.dispose = dispose;
}

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
function _ () {
	var args = Array.prototype.slice.call(arguments);
	var format = args.shift();
	if (l10n) {
		format = l10n.getMessage(format);
	}
	return format.replace(/\{(?:([a-z]+):)?(\d+)\}/ig, function ($0, $1, $2) {
		if ($1 == undefined || $1 == '') {
			return args[$2];
		}
		if (l10n) {
			return l10n.getPluralNoun($1, args[$2]);
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
		&& target.elementType in ACCEPTABLE_TYPES;
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
	return (s || '').replace(/[\u0000-\u001f\u007f]/g, function (a) {
		return a.charCodeAt(0) == 0x7f ? '^_' : '^' + String.fromCharCode(a.charCodeAt(0) + 64);
	});
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

/*
 * low-level functions for application management {{{1
 * ----------------
 */

function getLocalStorage (keyName, callback) {
	if (extensionChannel) {
		extensionChannel.postMessage({type:'get-storage', key:keyName}, function (res) {
			callback && callback(res.value);
		});
	}
	else if (window.localStorage) {
		callback && callback(window.localStorage.getItem(keyName));
	}
}
function setLocalStorage (keyName, value) {
	if (extensionChannel) {
		extensionChannel.postMessage({type:'set-storage', key:keyName, value:value});
	}
	else if (window.localStorage) {
		localStorage.setItem(keyName, value);
	}
}
function getEditorCore () {
	var result = new Editor(EDITOR_CORE_ID);
	if (!result || !result.elm) {
		devMode && console.error('*** getEditorCore: editor object or editor element cannot retrieve');
	}
	return result;
}
function isEditing (mode) {
	mode || (mode = inputMode);
	return mode == 'edit' || mode == 'edit-overwrite';
}
function install (x) {
	var count = 0;
	function load (loader) {
		loader();
		loader = null;
		++count;
	}
	function handleLoaded () {
		--count;
		count == 0 && installCore(x);
	}
	if (extensionChannel) {
		load(function () {
			registers = new Registers(handleLoaded, testMode);
		});
		load(function () {
			lineInputHistories = new LineInputHistories(
				config.vars.history, ['/', ':'], handleLoaded, testMode
			);
		});
		load(function () {
			bell = new Bell(handleLoaded);
		});
	}
	else {
		registers = new Registers;
		lineInputHistories = new LineInputHistories(config.vars.history, ['/', ':']);
		bell = new Bell;
		installCore(x);
	}
}
function installCore (x) {
	/*
	 * DOM structure:
	 *
	 * style#wasavi_global_styles [style sheet]
	 *
	 * div#wasavi_container
	 *   |
	 *   + div#wasavi_editor [main editor screen] [POSITIONING TARGET]
	 *   |
	 *   + div#wasavi_footer [POSITIONING TARGET]
	 *   |   |
	 *   |   + div#wasavi_footer_modeline
	 *   |   |   |
	 *   |   |   + table#wasavi_footer_modeline_table
	 *   |   |       |
	 *   |   |       + tbody
	 *   |   |         |
	 *   |   |         + tr
	 *   |   |             |
	 *   |   |             + td#wasavi_footer_file_indicator [file name indicator]
	 *   |   |             |
	 *   |   |             + td#wasavi_footer_prefix_indicator [prefix input indicator]
	 *   |   |
	 *   |   + div#wasavi_footer_alter
	 *   |       |
	 *   |       + table#wasavi_footer_alter_table
	 *   |           |
	 *   |           + tbody
	 *   |             |
	 *   |             + tr
	 *   |                 |
	 *   |                 + td#wasavi_footer_input_indicator [header indicator]
	 *   |                 |
	 *   |                 + td#wasavi_footer_input_container
	 *   |                     |
	 *   |                     + input#wasavi_footer_input [line input editor]
	 *   |
	 *   + div#wasavi_console_container [POSITIONING TARGET]
	 *   |   |
	 *   |   + textarea#wasavi_console
	 *   |
	 *   + div#wasavi_multiline_scaler
	 *   |
	 *   + span#wasavi_singleline_scaler
	 *   |
	 *   + div#wasavi_console_scaler
	 *   |
	 *   + div#wasavi_command_cursor [normal mode cursor]
	 *   |   |
	 *   |   + span#wasavi_command_cursor_inner
	 *   |
	 *   + textarea#wasavi_edit_cursor [edit mode cursor]
	 *   |
	 *   + div#wasavi_cover [cover element]
	 *
	 */

	// container
	var cnt = $(CONTAINER_ID);
	if (!cnt) throw new Error('wasavi container not found');

	//
	var borderStyles = 'border:none;';
	var paddingStyle = 'padding:0;';
	var fontStyle = 'font:' + x.fontStyle + ';';
	var boxSizingPrefix = IS_GECKO ? '-moz-' : '';

	// scale line height
	var scaler = document.body.appendChild(document.createElement('span'));
	style(scaler, {
		font: x.fontStyle,
		textDecoration:'none',
		textShadow:'none',
		letterSpacing: '100%',
		whiteSpace:'pre',
		lineHeight:1
	});
	scaler.textContent = '0';
	lineHeight = scaler.offsetHeight;
	charWidth = scaler.offsetWidth;
	scaler.parentNode.removeChild(scaler);

	// style
	var styleElement = $('wasavi_global_styles');
	styleElement.appendChild(document.createTextNode([
'body { visibility:visible; } \
#wasavi_container { \
line-height:1; \
text-align:left; \
text-indent:0; \
text-decoration:none; \
text-shadow:none; \
} \
#wasavi_editor { \
display:block; \
margin:0; \
' + paddingStyle + borderStyles + ' \
' + boxSizingPrefix + 'box-sizing:border-box; \
' + fontStyle + ' \
overflow-x:hidden; \
overflow-y:scroll; \
counter-reset:n; \
} \
#wasavi_multiline_scaler { \
position:fixed; \
overflow:scroll; \
' + paddingStyle + borderStyles + ' \
' + boxSizingPrefix + 'box-sizing:border-box; \
' + fontStyle + ' \
text-decoration:none; \
text-shadow:none; \
left:0px; \
bottom:0px; \
white-space:pre-wrap; \
overflow-x:auto; \
overflow-y:scroll; \
visibility:hidden; \
background-color:#fff; \
} \
#wasavi_singleline_scaler { \
position:fixed; \
margin:0; \
padding:0; \
' + fontStyle + ' \
text-decoration:none; \
text-shadow:none; \
white-space:pre; \
color:#fff; \
background-color:#000; \
left:0px; \
top:0px; \
visibility:hidden \
} \
#wasavi_console_scaler { \
position:fixed; \
padding:0; \
border:none; \
font-family:' + fontFamily + '; \
font-size:10pt; \
left:0; \
top:0; \
white-space:pre-wrap; \
overflow-x:auto; \
color:#fff; \
background-color:#000; \
line-height:1; \
visibility:hidden \
} \
#wasavi_editor > div { \
margin:0; \
padding:0; \
min-height:' + lineHeight + 'px; \
white-space:pre-wrap; \
} \
#wasavi_editor > div:nth-child(odd) { \
} \
#wasavi_editor > div > span.wasavi_em { \
} \
#wasavi_editor > div > span.wasavi_composition { \
} \
#wasavi_editor.n > div:before { \
display:block; \
float:left; \
margin:0; \
padding:0 ' + charWidth + 'px 0 0; \
text-align:right; \
' + fontStyle + ' \
counter-increment:n; \
content:counter(n); \
}',

		(function () {
			var result = [];
			for (var i = 1; i <= LINE_NUMBER_MAX_WIDTH; i++) {
				result.push(
					'#wasavi_editor.n' + i + ' > div:before {' +
					'min-width:' + (LINE_NUMBER_MARGIN_LEFT + charWidth * i) + 'px;' +
					'margin-left:-' + (LINE_NUMBER_MARGIN_LEFT + charWidth * (i + 1)) + 'px;' +
					'}'
				);
				result.push(
					'#wasavi_editor.n' + i + ' > div {' +
					'margin-left:' + (LINE_NUMBER_MARGIN_LEFT + charWidth * (i + 1)) + 'px;' +
					'}'
				);
			}
			return result.join('\n');
		})(),

'#wasavi_footer { \
padding:2px 2px 1px 2px; \
font-family:' + fontFamily + '; \
font-size:10pt; \
line-height:1; \
overflow:hidden; \
' + boxSizingPrefix + 'box-sizing:content-box; \
} \
#wasavi_footer_modeline { \
' + boxSizingPrefix + 'box-sizing:border-box; \
} \
#wasavi_footer_alter { \
' + boxSizingPrefix + 'box-sizing:border-box; \
} \
#wasavi_footer_modeline_table,#wasavi_footer_alter_table { \
padding:0; \
margin:0; \
border-collapse:collapse; \
border:none; \
background-color:transparent \
} \
#wasavi_footer_modeline>table td,#wasavi_footer_alter>table td { \
border:none; \
padding:0; \
line-height:1; \
white-space:pre; \
} \
#wasavi_footer_file_indicator { \
padding:0; \
line-height:1; \
text-align:left; \
} \
#wasavi_footer_prefix_indicator { \
width:1px; \
padding:0; \
line-height:1; \
text-align:right; \
} \
#wasavi_footer_input_indicator { \
width:1px; \
padding:0; \
line-height:1; \
background-color:rgba(0,0,0,0.5) \
} \
#wasavi_footer_input_container { \
padding:0; \
background-color:transparent \
} \
#wasavi_footer_input { \
display:block; \
margin:0; \
padding:0; \
border:none; \
outline:none; \
font-family:' + fontFamily + '; \
font-size:10pt; \
line-height:1; \
width:100% \
} \
#wasavi_console_container { \
visibility:hidden; \
position:absolute; \
margin:0; \
padding:6px; \
' + boxSizingPrefix + 'box-sizing:border-box; \
border:none; \
border-radius:8px; \
} \
#wasavi_console { \
margin:0; \
padding:0; \
border:none; \
outline:none; \
background-color:transparent; \
width:100%; \
font-family:' + fontFamily + '; \
font-size:10pt; \
overflow-y:hidden; \
white-space:pre-wrap; \
resize:none; \
line-height:1; \
} \
#wasavi_command_cursor { \
position:absolute; \
margin:0; \
padding:0; \
' + fontStyle + ' \
text-decoration:none; \
text-shadow:none; \
left:0px; \
top:0px; \
} \
#wasavi_command_cursor_inner { \
margin:0; \
padding:0; \
white-space:pre \
} \
#wasavi_edit_cursor { \
position:absolute; \
display:none; \
margin:0; \
padding:0; \
' + boxSizingPrefix + 'box-sizing:border-box; \
border:none; \
background-color:transparent; \
' + fontStyle + ' \
text-decoration:none; \
text-shadow:none; \
overflow-y:hidden; \
resize:none; \
outline:none; \
} \
#wasavi_cover { \
position:fixed; \
left:0; top:0; right:0; bottom:0; \
background-color:rgba(0,0,0,0.0) \
} \
#wasavi_cover.dim { \
' + (CSS_PREFIX ? CSS_PREFIX + 'transition:background-color 0.5s linear 0s;' : '') + ' \
background-color:rgba(0,0,0,0.25); \
} \
#wasavi_focus_holder { \
position:fixed; \
border:none; \
outline:none; \
resize:none; \
padding:0; \
left:-4px; \
top:0px; \
width:32px; \
height:32px; \
background-color:transparent; \
ime-mode:disabled; \
}'
	].join('')));

	// theme
	theme.container = cnt;
	theme.fontStyle = fontStyle;
	theme.lineHeight = lineHeight;
	theme.select();
	theme.update();

	// focus holder
	var focusHolder = document.createElement('textarea');
	document.body.insertBefore(focusHolder, document.body.firstChild);
	focusHolder.id = 'wasavi_focus_holder';

	// editor
	var editor = new Editor($(EDITOR_CORE_ID));

	// caret position scaler
	var caretdiv = $('wasavi_multiline_scaler');

	// text length scaler
	var textspan = $('wasavi_singleline_scaler');
	textspan.textContent = '#';

	// console scaler
	var conscaler = $('wasavi_console_scaler');
	conscaler.textContent = '#';

	// footer container
	var footer = $('wasavi_footer');

	// footer (default indicator)
	var footerDefault = $('wasavi_footer_modeline');
	$('wasavi_footer_file_indicator').textContent = '#';
	//footerDefault.textContent = '#';

	// footer (alter: line input)
	var footerAlter = $('wasavi_footer_alter');

	// footer alter contents
	var footerAlterTable = $('wasavi_footer_alter_table');
	var footerAlterRow = footerAlterTable.getElementsByTagName('tr')[0];

	// footer alter contents: indicator
	var footerIndicator = $('wasavi_footer_input_indicator');
	footerIndicator.textContent = '/';

	// footer alter contents: line input container
	var footerLineInputContainer = $('wasavi_footer_input_container');

	// footer alter contents: line input
	var footerInput = $('wasavi_footer_input');

	// console window
	var conwincnt = $('wasavi_console_container');
	var conwin = $('wasavi_console');
	conscaler.style.width = conwin.offsetWidth + 'px';

	// command cursor
	var cc = $('wasavi_command_cursor');
	var ccInner = $('wasavi_command_cursor_inner');
	ccInner.style.height = lineHeight + 'px';

	// textarea for insert mode
	var ec = $('wasavi_edit_cursor');

	// fix height
	if (footerDefault.offsetHeight < footerAlter.offsetHeight) {
		footerDefault.style.height = footerAlter.offsetHeight + 'px';
	}
	else if (footerAlter.offsetHeight < footerDefault.offsetHeight ) {
		footerAlter.style.height = footerDefault.offsetHeight + 'px';
	}
	footerAlter.style.display = 'none';

	/*
	 * visual settings
	 */

	setTabStop(config.vars.tabstop);
	setGeometory(x);

	/*
	 * initialize variables
	 */

	targetElement = x;
	fileName = '';
	preferredNewline = '\n';
	terminated = false;
	writeOnTermination = true;
	state = 'normal';
	runLevel = 0;
	strokeCount = 0;
	inputModeStack = [];
	inputMode = 'command';
	inputModeSub = '';
	prefixInput = new PrefixInput;
	idealWidthPixels = idealDenotativeWidthPixels = -1;
	isTextDirty = false;
	isEditCompleted = false;
	isVerticalMotion = false;
	isReadonlyWarned = false;
	isSmoothScrollRequested = false;
	isSimpleCommandUpdateRequested = false;
	isJumpBaseUpdateRequested = false;
	lastSimpleCommand = '';
	lastHorzFindCommand = {direction:0, letter:'', stopBefore:false};
	lastRegexFindCommand = new RegexFinderInfo;
	lastSubstituteInfo = {};
	lastMessage = '';
	requestedState = {};

	editor.value = x.value || '';
	editor.selectionStart = x.selectionStart || 0;
	editor.selectionEnd = x.selectionEnd || 0;

	marks = new Marks(editor, testMode);
	cursor = new CursorUI(editor, cc, ec);
	scroller = new Scroller(editor, cursor, footerDefault);
	editLogger = new EditLogger(editor, config.vars.undolevels);
	exCommandExecutor = new ExCommandExecutor(editor, true);
	backlog = new Backlog(conwincnt, conwin, conscaler);
	searchUtils = new SearchUtils(editor);
	config.setData(x.readOnly ? 'readonly' : 'noreadonly');

	refreshIdealWidthPixels(editor);
	showMessage(getFileIoResultInfo(editor, x.value.length, true));

	x.value = undefined;

	/*
	 * execute exrc
	 */

	isInteractive = false;
	var result = executeExCommand(editor, exrc, true);
	typeof result == 'string' && showMessage(result, true);
	exrc = '';

	/*
	 * show cursor
	 */

	cursor.ensureVisible();
	cursor.update({type:inputMode, focused:true, visible:true});

	/*
	 * set up channels
	 */

	if (extensionChannel) {
		fireEvent('initialized', {height:cnt.offsetHeight});
		extensionChannel.setMessageListener(handleExtensionChannelMessage);
	}

	/*
	 * set up event handlers
	 */

	setupEventHandlers(true);
}
function uninstall (editor, save, implicit) {
	// apply the edited content to target textarea
	if (save && isTextDirty) {
		targetElement.value = editor.value;
	}

	// remove all event handlers
	setupEventHandlers(false);

	// clear all objects
	inputModeStack = undefined;
	prefixInput = undefined;
	pairBracketsIndicator && pairBracketsIndicator.dispose();
	pairBracketsIndicator = undefined;
	backlog = backlog.dispose();
	searchUtils = searchUtils.dispose();
	lastHorzFindCommand = undefined;
	lastRegexFindCommand = undefined;
	lastSubstituteInfo = undefined;
	requestedState = undefined;
	marks.save();
	marks = marks.dispose();
	cursor = cursor.dispose();
	scroller = scroller.dispose();
	editLogger = editLogger.dispose();
	keyManager = keyManager.dispose();
	theme = theme.dispose();
	emptyNodeContents($('wasavi_global_styles'));

	//
	if (extensionChannel) {
		delete targetElement.getAttribute;
		delete targetElement.setAttribute;
		targetElement.tabId = extensionChannel.tabId;
		targetElement.isTopFrame = !!WasaviExtensionWrapper.isTopFrame;
		targetElement.isImplicit = !!implicit;
		fireEvent('terminated', targetElement);
		extensionChannel = null;
	}
	targetElement = null;
}
function setupEventHandlers (install) {
	var method = install ? 'addEventListener' : 'removeEventListener';

	// window
	window[method]('focus', handleWindowFocus, false);
	window[method]('blur', handleWindowBlur, false);
	window[method]('resize', handleWindowResize, false);

	// key manager
	install ? keyManager.install(handleKeydown2) :
			  keyManager.uninstall();

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

	var input = $(LINE_INPUT_ID);
	if (input) {
		input[method]('input', handleInput, false);
	}

	cursor.setupEventHandlers(method);
}
function setGeometory (target) {
	if (target == undefined) {
		target = targetElement;
	}
	if (!target) {
		return;
	}

	var container = $(CONTAINER_ID);
	var editor = $(EDITOR_CORE_ID);
	var footer = $('wasavi_footer');
	var conCon = $('wasavi_console_container');
	var con = $('wasavi_console');
	var conScaler = $('wasavi_console_scaler');
	var mScaler = $('wasavi_multiline_scaler');
	var fmodTable = $('wasavi_footer_modeline_table');
	var faltTable = $('wasavi_footer_alter_table');

	if (!container || !editor || !footer || !conCon || !con || !conScaler
	||  !mScaler || !fmodTable || !faltTable) {
		throw new Error(
			'setGeometory: invalid element: ' +
			[
				container, editor, footer, con, conScaler,
				mScaler, fmodTable, faltTable
			].join(', ')
		);
	}

	var rect = target.rect;

	if (isStandAlone) {
		rect.height -= footer.offsetHeight;
	}

	style(container, {
		width:rect.width + 'px',
		height:(rect.height + footer.offsetHeight) + 'px'
	});

	style(editor, {
		width:rect.width + 'px',
		height:rect.height + 'px'
	});

	style(footer, {
		width:(rect.width - 4) + 'px'
	});

	style(conCon, {
		left:'8px',
		top:'8px',
		width:(rect.width - 16) + 'px',
		height:(rect.height - 16) + 'px'
	});

	style(con, {
		height:(rect.height - (16 + 12)) + 'px'
	});

	style(conScaler, {
		width:(rect.width - 16) + 'px'
	});

	style(mScaler, {
		width:rect.width + 'px',
		height:rect.height + 'px'
	});

	style(fmodTable, {
		width:(rect.width - 4) + 'px'
	});

	style(faltTable, {
		width:(rect.width - 4) + 'px'
	});

	config.setData('lines', parseInt(editor.clientHeight / lineHeight));
	config.setData('columns', parseInt(editor.clientWidth / charWidth));
}
function setTabStop (ts) {
	var editor = $(EDITOR_CORE_ID);
	if (!editor) return;

	ts || (ts = 8);
	var editorStyle = document.defaultView.getComputedStyle(editor, '');
	['OTabSize', 'MozTabSize', 'WebkitTabSize', 'MsTabSize', 'tabSize'].some(function (pn) {
		if (!(ts in editorStyle)) return;
		editor.style[pn] = ts;
		['wasavi_singleline_scaler', 'wasavi_multiline_scaler'].forEach(function (en) {
			en = $(en);
			if (!en) return;
			en.style[pn] = ts;
		});
		return true;
	});
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
			cursor.update({visible:!backlog.visible && newInputModeSub != 'ex-s'});
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
function getCursorPositionString (t) {
	if (t.elm.scrollHeight <= t.elm.clientHeight) {
		return _('All');
	}
	if (t.elm.scrollTop == 0) {
		return _('Top');
	}
	var viewHeight = t.elm.scrollHeight - t.elm.clientHeight;
	if (t.elm.scrollTop + t.elm.clientHeight >= t.elm.scrollHeight) {
		return _('Bot');
	}
	return ('  ' + Math.floor(t.elm.scrollTop / viewHeight * 100.)).substr(-3) + '%';
}
function showPrefixInput (t, message) {
	if (state != 'normal') return;
	var line = $('wasavi_footer_modeline');
	var alter = $('wasavi_footer_alter');
	var indf = $('wasavi_footer_file_indicator');
	var indp = $('wasavi_footer_prefix_indicator');
	line.style.display = indf.style.display = indp.style.display = '';
	alter.style.display = 'none';
	indf.textContent = getFileNameString();
	indp.textContent = message || prefixInput.toString() ||
		// 000000,0000xxx000%
		(('     ' + (t.selectionStartRow + 1)).substr(-6) +
		 ',' + ((getLogicalColumn(t) + 1) + '   ').substr(0, 4) +
		 '   ' + getCursorPositionString(t));
}
function showMessage (message, emphasis, pseudoCursor, volatile_) {
	if (state != 'normal' && state != 'console-wait') return;
	var line = $('wasavi_footer_modeline');
	var alter = $('wasavi_footer_alter');
	var indf = $('wasavi_footer_file_indicator');
	var indp = $('wasavi_footer_prefix_indicator');
	line.style.display = indf.style.display = indp.style.display = '';
	alter.style.display = 'none';
	indf.style.fontWeight = 'bold';
	indp.textContent = '';
	var pa = line;
	if (emphasis) {
		emptyNodeContents(indf);
		var span = indf.appendChild(document.createElement('span'));
		span.style.color = theme.colors.warnedStatusFg;
		span.style.backgroundColor = theme.colors.warnedStatusBg;
		span.textContent = message;
		pa = span;
	}
	else {
		indf.textContent = message;
	}
	if (pseudoCursor) {
		var blink = indf.appendChild(document.createElement('blink'));
		blink.textContent = '\u2588';
	}
	if (message != '' && !volatile_) {
		lastMessage = toNativeControl(message);
	}
}
function showLineInput (initial) {
	if (state != 'line-input') return;
	var line = $('wasavi_footer_alter');
	var alter = $('wasavi_footer_modeline');
	var input = $(LINE_INPUT_ID);
	line.style.display = 'block';
	alter.style.display = 'none';
	$('wasavi_footer_input_indicator').textContent = initial;
	input.value = '';
	dataset(input, 'current', '');
	input.focus();
}
function requestShowPrefixInput (message) {
	if (!requestedState.modeline) {
		requestedState.modeline = {type:'prefix', message:message};
	}
	return message;
}
function requestShowMessage (message, emphasis, pseudoCursor, volatile_) {
	if (!requestedState.modeline) {
		requestedState.modeline = {
			type:'message',
			message:message,
			emphasis:!!emphasis,
			pseudoCursor:!!pseudoCursor,
			volatile_:!!volatile_
		};
	}
	return message;
}
function requestRegisterNotice (message) {
	if (!requestedState.notice) {
		requestedState.notice = {play:true};
		if (arguments.length) {
			result = requestedState.notice.message = message;
		}
	}
	return message;
}
function requestInputMode (mode, modeSub, initial, updateCursor) {
	if (!requestedState.inputMode) {
		requestedState.inputMode = {
			mode:mode,
			modeSub:modeSub || '',
			initial:initial || '',
			updateCursor:updateCursor
		};
	}
}
function logEditing (t, connect) {
	function resolveEscape (s) {
		var result = '';
		s.replace(/\u0016[\s\S]|[\s\S]/g, function (a) {
			result += a.charAt(a.length == 2 ? 1 : 0);
			return '';
		});
		result = result.replace(/[\u0008\u007f]/g, '');
		return result;
	}
	var s;
	if (editedStringCurrent != '' && (s = resolveEscape(editedStringCurrent)) != '') {
		editLogger.open('editing', function () {
			if (inputMode == 'edit') {
				editLogger.write(
					EditLogger.ITEM_TYPE.INSERT,
					editStartPosition, s
				);
			}
			else {
				editLogger.write(
					EditLogger.ITEM_TYPE.OVERWRITE,
					editStartPosition, s, overwroteString
				);
			}
		});
		editedStringCurrent = '';
		overwroteString = false;
		editStartPosition = null;
	}
	if (!connect && editLogger.clusterNestLevel >= 0) {
		editLogger.close();
		editLogger.open('log-editing');
	}
}
function requestSimpleCommandUpdate () {
	if (runLevel == 0) {
		isSimpleCommandUpdateRequested = true;
	}
}
function executeExCommand (t, source, isRoot, parseOnly) {
	// @see http://pubs.opengroup.org/onlinepubs/9699919799/utilities/ex.html#tag_20_40_13_03

	var resultMessage;
	var lastTerminator;
	var commandName = '';
	var commandArg = '';
	var commandArgSups;
	var commandObj = null;
	var range = null;
	var executor = isRoot ? exCommandExecutor : new ExCommandExecutor(t);

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

	function pushCommand () {
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
		}

		var args = commandObj.buildArgs(t, r, commandArg, commandArgSups);
		if (typeof args == 'string') {
			resultMessage = args || _('{0}: unknown syntax error.', commandObj.name);
			return false;
		}

		executor.add(commandObj, args);
		return true;
	}

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

	if (/[\\\u0016]$/.test(source)) {
		source = source.substring(0, source.length - 1);
	}
	if (!/\n$/.test(source)) {
		source += '\n';
	}
	if (isRoot) {
		exCommandExecutor.isGlobalSpecified = false;
	}

	executor.clear();
	executor.source = source.replace(/\n+$/, '');

	while (source.length && !terminated) {
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
		range = ExCommand.prototype.parseRange(t, source, undefined, true);
		if (typeof range == 'string') {
			resultMessage = range;
			break;
		}
		source = range.rest;

		// 5. Leading <blank> characters shall be skipped.
		source = source.replace(/^[: \t]+/, '');

		// 6. If the next character is a <vertical-line> character or a <newline>:
		//
		//   a. If the next character is a <newline>:
		//
		//     i. If ex is in open or visual mode, the current line shall be set to the last
		//     address specified, if any.
		//
		//     ii. Otherwise, if the last command was terminated by a <vertical-line> character,
		//     no action shall be taken; for example, the command "||<newline>" shall execute
		//     two implied commands, not three.
		//
		//     iii. Otherwise, step 6.b. shall apply.
		//
		//   b. Otherwise, the implied command shall be the print command. The last #, p, and l
		//   flags specified to any ex command shall be remembered and shall apply to this
		//   implied command. Executing the ex number, print, or list command shall set the
		//   remembered flags to #, nothing, and l, respectively, plus any other flags
		//   specified for that execution of the number, print, or list command.
		//
		//   If ex is not currently performing a global or v command, and no address or count
		//   is specified, the current line shall be incremented by 1 before the command is
		//   executed. If incrementing the current line would result in an address past the
		//   last line in the edit buffer, the command shall fail, and the increment shall not
		//   happen.
		//
		//   c. The <newline> or <vertical-line> character shall be discarded and any
		//   subsequent characters shall be parsed as a separate command.
		if (source.charAt(0) == '|' || source.charAt(0) == '\n') {
			switch (source.charAt(0)) {
			case '\n':
				isJumpBaseUpdateRequested = false;
				if (range && range.rows.length) {
					commandObj = ExCommand.defaultCommand;
					break;
				}
				if (lastTerminator == undefined || lastTerminator == '|') {
					break;
				}
				/*FALLTHRU*/

			case '|':
				commandObj = ExCommand.defaultCommand;
				commandArg = 'p';
				break;
			}

			lastTerminator = source.charAt(0);
			source = source.substring(1);

			if (commandObj && !pushCommand()) {
				break;
			}

			continue;
		}

		// 7. The command name shall be comprised of the next character (if the character
		// is not alphabetic), or the next character and any subsequent alphabetic characters
		// (if the character is alphabetic), with the following exceptions:
		//
		//   a. Commands that consist of any prefix of the characters in the command name
		//   delete, followed immediately by any of the characters 'l' , 'p' , '+' , '-' , or
		//   '#' shall be interpreted as a delete command, followed by a <blank>, followed by
		//   the characters that were not part of the prefix of the delete command. The maximum
		//   number of characters shall be matched to the command name delete; for example,
		//   "del" shall not be treated as "de" followed by the flag l.
		//
		//   b. Commands that consist of the character 'k' , followed by a character that can
		//   be used as the name of a mark, shall be equivalent to the mark command followed
		//   by a <blank>, followed by the character that followed the 'k' .
		//
		//   c. Commands that consist of the character 's' , followed by characters that could
		//   be interpreted as valid options to the s command, shall be the equivalent of the
		//   s command, without any pattern or replacement values, followed by a <blank>,
		//   followed by the characters after the 's' .
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
		//   a:  append    n:  next    t:  t
		//   c:  change    p:  print   u:  undo
		//   ch: change    pr: print   un: undo
		//   e:  edit      r:  read    v:  v
		//   m:  move      re: read    w:  write
		//   ma: mark      s:  s
		//
		// Implementation extensions with names causing similar ambiguities shall not be
		// checked for a match until all possible matches for commands specified by
		// POSIX.1-2008 have been checked.
		for (var i = 0, commands = ExCommand.commands; i < commands.length; i++) {
			if (commandName.indexOf(commands[i].shortName) == 0
			&&  commands[i].name.indexOf(commandName) == 0) {
				for (var j = 0; j < commands[i].name.length; j++) {
					if (commandName.charCodeAt(j) != commands[i].name.charCodeAt(j)) {
						source = commandName.substring(j) + source;
						break;
					}
				}
				commandObj = commands[i];
				commandName = commands[i].name;
				break;
			}
		}

		// 9. (wasavi supports neither '!' nor 'read' command)

		// 10. Otherwise, if the command is an edit, ex, or next command, or a visual command
		// while in open or visual mode, the next part of the command shall be parsed as
		// follows:
		//
		//   a. Any '!' character immediately following the command shall be skipped and be
		//   part of the command.
		//
		//   b. Any leading <blank> characters shall be skipped and be part of the command.
		//
		//   c. If the next character is a '+' , characters up to the first non- <backslash>-
		//   escaped <newline> or non- <backslash>-escaped <blank> shall be skipped and be part
		//   of the command.
		//
		//   d. The rest of the command shall be determined by the steps specified in paragraph
		//   12.
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
		//   a. Any leading <blank> characters shall be skipped and be part of the command.
		//
		//   b. If the next character is not an alphanumeric, double-quote, <newline>,
		//   <backslash>, or <vertical-line> character:
		//
		//     i. The next character shall be used as a command delimiter.
		//
		//     ii. If the command is a global, open, or v command, characters up to the first
		//     non- <backslash>-escaped <newline>, or first non- <backslash>-escaped delimiter
		//     character, shall be skipped and be part of the command.
		//
		//     iii. If the command is an s command, characters up to the first non- <backslash>
		//     -escaped <newline>, or second non- <backslash>-escaped delimiter character,
		//     shall be skipped and be part of the command.
		//
		//   c. If the command is a global or v command, characters up to the first non-
		//   <backslash>-escaped <newline> shall be skipped and be part of the command.
		//
		//   d. Otherwise, the rest of the command shall be determined by the steps specified
		//   in paragraph 12.
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
				if (exCommandExecutor.isGlobalSpecified) {
					resultMessage = _('Cannot use the global or v command recursively.');
					break;
				}
				exCommandExecutor.isGlobalSpecified = true;
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
		//   a. If the command was a map, unmap, abbreviate, or unabbreviate command,
		//   characters up to the first non- <control>-V-escaped <newline>, <vertical-line>,
		//   or double-quote character shall be skipped and be part of the command.
		//
		//   b. Otherwise, characters up to the first non- <backslash>-escaped <newline>,
		//   <vertical-line>, or double-quote character shall be skipped and be part of the
		//   command.
		//
		//   c. If the command was an append, change, or insert command, and the step 12.b.
		//   ended at a <vertical-line> character, any subsequent characters, up to the next
		//   non- <backslash>-escaped <newline> shall be used as input text to the command.
		//
		//   d. If the command was ended by a double-quote character, all subsequent
		//   characters, up to the next non- <backslash>-escaped <newline>, shall be discarded.
		//
		//   e. The terminating <newline> or <vertical-line> character shall be discarded and
		//   any subsequent characters shall be parsed as a separate ex command.
		else {
			paragraph12();
		}

		if (commandObj && !pushCommand()) {
			break;
		}
		if (!commandObj && commandName != '') {
			resultMessage = _('{0}: unknown command.', commandName);
			break;
		}
	}

	if (typeof resultMessage == 'string') {
		return resultMessage;
	}

	return parseOnly ? executor : executor.run();
}
function executeViCommand (/*, keepRunLevel*/) {
	var editor = getEditorCore();
	var input = $(LINE_INPUT_ID);
	var e = document.createEvent('UIEvent');
	var args = Array.prototype.slice.call(arguments);
	var keepRunLevel = false;

	if (args.length && typeof args[args.length - 1] == 'boolean') {
		keepRunLevel = args.pop();
	}

	var cursorState = {visible:cursor.visible};
	cursor.update({visible:false});
	cursor.locked = true;

	var prefixInputSaved = prefixInput.clone();
	prefixInput.reset();

	!keepRunLevel && runLevel++;

	try {
		for (var j = 0; j < args.length; j++) {
			switch (typeof args[j]) {
			case 'number':
				e.initUIEvent('wasavi_command', false, true, document.defaultView, 0);
				mapManager.process(args[j], function (keyCode) {
					processInput(keyCode, e);
				});
				break;
			case 'string':
				var cmd = args[j];
				for (var i = 0, goal = cmd.length; i < goal; i++) {
					e.initUIEvent('wasavi_command', false, true, document.defaultView, 0);
					mapManager.process(cmd.charCodeAt(i), function (keyCode) {
						processInput(keyCode, e);
					});
				}
				break;
			}
		}
		mapManager.process(false);
	}
	finally {
		!keepRunLevel && runLevel--;

		if (prefixInput) {
			prefixInput.assign(prefixInputSaved);
		}

		if (cursor) {
			cursor.locked = false;
			cursor.ensureVisible();
			cursor.update(cursorState);
		}
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
			requestShowMessage(requestRegisterNotice(_('Warning: changing readonly element.')), true);
		}
	}
	function execCommandMap (t, key, subkey, code) {
		testMode && fireEvent('command-start');
		lastMessage = '';

		var map = commandMap;
		var ss = t.selectionStart;
		var se = t.selectionEnd;
		var result = execMap(t, e, map, key, subkey, code);

		if (result) {
			var canContinue = true;

			if (prefixInput.operation.length) {
				canContinue = execMap(
					t, e, map, prefixInput.operation, '@op', code, {s:ss, e:se}
				);
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
				isSmoothScrollRequested = false;

				if (isSimpleCommandUpdateRequested) {
					lastSimpleCommand = prefixInput.toString();
					isSimpleCommandUpdateRequested = false;
				}

				if (!scroller.running) {
					needEmitEvent = true;
				}

				prefixInput.reset();
				requestShowPrefixInput();
			}
		}
		else {
			needEmitEvent = true;
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
		var regex = config.vars.iskeyword;
		var target, last;

		if (force) {
			if (editedStringCurrent.length < 1) return;
			target = editedStringCurrent;
			last = '';
		}
		else {
			if (editedStringCurrent.length < 2) return;
			target = editedStringCurrent.substring(0, editedStringCurrent.length - 1);
			last = editedStringCurrent.substr(-1);
			if (!(regex.test(target.substr(-1)) && !regex.test(last))) return;
		}

		for (var i in abbrevs) {
			if (target.substr(-i.length) != i) continue;

			var canTransit = false;
			if (regex.test(i.charAt(0))) {
				if (i.length == 1) {
					if (t.selectionStartCol - i.length <= 1
					||  target.length - i.length <= 0
					||  /\s/.test(target.substr(-(i.length + 1), 1))) {
						canTransit = true;
					}
				}
				else {
					if (t.selectionStartCol - i.length <= 1
					||  target.length - i.length <= 0
					||  !regex.test(target.substr(-(i.length + 1), 1))) {
						canTransit = true;
					}
				}
			}
			else {
				if (t.selectionStartCol - i.length <= 1
				||  target.length - i.length <= 0
				||  regex.test(target.substr(-(i.length + 1), 1))
				||  /\s/.test(target.substr(-(i.length + 1), 1))) {
					canTransit = true;
				}
			}
			if (!canTransit) continue;

			editedStringCurrent = target + multiply('\u0008', i.length) + abbrevs[i] + last;
			deleteChars(t, i.length + last.length, false, true);
			(inputMode == 'edit' ? insert : overwrite)(t, abbrevs[i] + last);
			break;
		}
	}

	var editor = getEditorCore();
	var input = $(LINE_INPUT_ID);
	var letter = keyManager.code2letter(code);
	var mapkey = keyManager.code2letter(code, true);
	var subkey = inputMode;
	var result = false;
	var needEmitEvent = false;

	switch (inputModeSub) {
	case 'wait-a-letter':
		mapkey = keyManager.code2letter(lastKeyCode, true);
		subkey = inputModeSub;
		inputModeSub = '';
		break;

	case 'wait-register':
		if (registers.isReadable(letter)) {
			mapkey = keyManager.code2letter(lastKeyCode, true);
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
				backlog.clear();
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
			if (letter == '\u000d' || letter == ' ' || state != 'normal') {
				return true;
			}
		}
		break;

	case 'ex-s':
		if (!substituteWorker.kontinue(editor, letter)) {
			substituteWorker = null;
			inputModeSub = '';
			cursor.ensureVisible();
			cursor.update({visible:true});
		}
		fireCommandCompleteEvent();
		return true;

	default:
		inputModeSub = '';
	}

	switch (inputMode) {
	case 'command':
		cursor.update({visible:false});
		execCommandMap(editor, mapkey, subkey, code);
		result = true;
		break;

	case 'edit':
	case 'edit-overwrite':
		cursor.update({visible:false});

		if (subkey == inputMode && code == 0x1b) {
			processAbbrevs(editor, true);

			var editedStringSaved = editedString;

			if (editRepeatCount > 1) {
				var editedStringFollowed = editedStringSuffix + editedStringSaved;
				for (var i = 1; i < editRepeatCount; i++) {
					executeViCommand(editedStringFollowed);
				}
			}

			logEditing(editor, true);

			var n = editor.selectionStart;
			n.col = Math.max(n.col - 1, 0);
			editor.setSelectionRange(n);

			popInputMode();
			prefixInput.isLocked = false;
			prefixInput.trailer = editedStringSaved;
			registers.set('.', editedStringSaved);

			cursor.ensureVisible();
			cursor.update({type:inputMode, visible:true});

			if (runLevel == 0 && isSimpleCommandUpdateRequested) {
				lastSimpleCommand = prefixInput.toString() + letter;
				isSimpleCommandUpdateRequested = false;
			}

			(isEditCompleted || editedStringSaved != '') && doEditComplete();
			editedString = editedStringCurrent = '';
			overwroteString = false;
			prefixInput.reset();
			isEditCompleted = isVerticalMotion = false;
			isSmoothScrollRequested = false;
			showMessage('');
			requestShowPrefixInput();
			editLogger.close();// edit-wrapper
			needEmitEvent = true;
			idealWidthPixels = -1;
		}
		else {
			var letterActual = code == 0x0d ? '\n' : letter;
			var prevPos = editor.selectionStart;
			editedString += letterActual;
			editedStringCurrent += letterActual;
			config.vars.showmatch && pairBracketsIndicator && pairBracketsIndicator.clear();

			if (execEditMap(editor, mapkey, subkey, code)) {
				//
			}
			else if (isEditing() && (code == 0x08 || code == 0x0a || code >= 32)) {
				if (!editStartPosition) {
					editStartPosition = editor.selectionStart;
				}

				(inputMode == 'edit' ? insert : overwrite)(editor, letterActual);
				processAbbrevs(editor);

				if (runLevel == 0) {
					cursor.ensureVisible();
					cursor.update({visible:true});
				}
			}
			if (config.vars.showmatch) {
				pairBracketsIndicator = PairBracketsIndicator.getObject(
					letterActual, editor, prevPos);
			}
			needEmitEvent = 'notify-state';
		}
		result = true;
		break;

	case 'line-input':
		var canEscape = code == 0x1b
			|| code == 0x08 && input.selectionStart == 0 && input.selectionEnd == 0;

		dataset(input, 'current', input.value);

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
			var line = toNativeControl(input.value);
			prefixInput.trailer = line + keyManager.code2letter(code);
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
				var input = $(LINE_INPUT_ID);
				if (input.value != dataset(input, 'current')) {
					var e = document.createEvent('Event');
					e.initEvent('input', false, false);
					input.dispatchEvent(e);
				}
			}, 1);
		}
		else {
			/*if (code >= 0 && code < 32) {
				letter = toVisibleControl(code);
				code = letter.charCodeAt(0);
			}*/
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
			var im = requestedState.inputMode;
			pushInputMode(im.mode, im.modeSub, im.initial);
			im.updateCursor && cursor.update({focused:true, visible:true});
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
					requestedState.modeline.pseudoCursor,
					requestedState.modeline.volatile_
				);
				break;
			}
			requestedState.modeline = null;
			config.vars.errorbells && requestRegisterNotice();
			needEmitEvent = true;
		}
		if (requestedState.notice) {
			if (requestedState.notice.play) {
				bell.play();
			}
			if (requestedState.notice.message) {
				lastMessage = toNativeControl(requestedState.notice.message);
				devMode && console.log(requestedState.notice.message);
			}
			requestedState.notice = null;
			needEmitEvent = true;
		}
		if (runLevel == 0 && state == 'normal' && (backlog.queued || backlog.visible)) {
			backlog.write(false, messageUpdated);
		}
		if (needEmitEvent !== false) {
			if (needEmitEvent === true) {
				fireCommandCompleteEvent();
			}
			else if (typeof needEmitEvent == 'string') {
				fireCommandCompleteEvent(needEmitEvent);
			}
		}
	}

	lastKeyCode = code;
	return result;
}
function processInputSupplement (e) {
	switch (inputMode) {
	case 'line-input':
		var editor = getEditorCore();
		var input = $(LINE_INPUT_ID);
		var key = prefixInput.motion || prefixInput.operation;
		execMap(editor, e, commandMap, key, '@' + inputMode + '-reset', input.value);
		execMap(editor, e, commandMap, key, '@' + inputMode + '-notify', input.value);
		break;
	}
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
function fireEvent (eventName, payload) {
	if (!extensionChannel) return;
	payload || (payload = {});
	payload.type = 'wasavi-' + eventName;
	extensionChannel.postMessage({
		type:'notify-to-parent',
		parentTabId:targetElement.parentTabId,
		payload:payload
	});
}
function fireCommandCompleteEvent (eventName) {
	if (testMode) {
		eventName || (eventName = 'command-completed');
		var pt = Wasavi.positionTop;
		fireEvent(eventName, {
			state:{
				running:    Wasavi.running,
				state:      Wasavi.state,
				inputMode:  Wasavi.inputMode,
				lastMessage:Wasavi.lastMessage,
				value:      Wasavi.value,
				row:        Wasavi.row,
				col:        Wasavi.col,
				topRow:     pt.row,
				topCol:     pt.col,
				rowLength:  Wasavi.rowLength,
				registers:  registers.dumpData(),
				marks:      marks.dumpData(),
				lines:      config.vars.lines
			}
		});
	}
}

/*
 * low-level functions for editor functionality {{{1
 * ----------------
 */

function execMap (t, e, map, key, subkey, code, pos) {
	if (map[key]) {
		subkey || (subkey = '');
		var opts = {
			e:e,
			selectionStart:pos && pos.s || t.selectionStart,
			selectionEnd:pos && pos.e || t.selectionEnd
		};
		switch (typeof map[key]) {
		case 'function':
			if (subkey == '' || subkey == inputMode) {
				return map[key].call(map, keyManager.code2letter(code) || code, t, opts);
			}
			break;
		case 'object':
			if (subkey != '' && subkey in map[key]) {
				return map[key][subkey].call(map, keyManager.code2letter(code) || code, t, opts);
			}
			break;
		}
		return true;
	}
	return false;
}
function getFileNameString () {
	if (extensionChannel && WasaviExtensionWrapper.isTopFrame) {
		if (fileName == '') {
			return _('*Untitled*');
		}
		else {
			return fileName;
		}
	}
	else {
		if (targetElement.id != '') {
			return targetElement.nodeName + '#' + targetElement.id;
		}
		else {
			return targetElement.nodeName;
		}
	}
}
function getCaretPositionString (t) {
	if (t.rowLength == 1 && t.rows(0) == '') {
		return _('--No lines in buffer--');
	}
	else {
		return _('line {0} of {1} ({2}%)',
			t.selectionStartRow + 1,
			t.rowLength,
			parseInt(t.selectionStartRow / t.rowLength * 100.0));
	}
}
function getNewlineType (newline) {
	return {'\r\n':'dos', '\r':'mac', '\n':'unix'}[newline] || '?';
}
function getFileIoResultInfo (t, charLength, isNew) {
	var result = [];
	var attribs = [];

	// file name
	result.push('"' + getFileNameString() + '"');

	// partial attributes
	attribs.push(getNewlineType(preferredNewline)); // newline type
	result.push('[' + attribs.join(', ') + ']');

	// current line number
	var rowLength = t.rowLength;
	if (t.rowLength == 1 && t.rows(0) == '') {
		rowLength = 0;
	}

	if (isNew) {
		result.push(_('New file'));
	}
	else {
		result.push(_('{0} {line:0}, {1} {character:1}.', rowLength, charLength));
	}

	return result.join(' ');
}
function getFileInfo (t) {
	var result = [];
	var attribs = [];

	// file name
	result.push('"' + getFileNameString() + '"');

	// attributes
	attribs.push(getNewlineType(preferredNewline)); // newline type
	isTextDirty && attribs.push(_('modified')); // modified
	config.vars.readonly && attribs.push(_('readonly')); // read only
	result.push('[' + attribs.join(', ') + ']');

	// current line number
	result.push(getCaretPositionString(t));

	return result.join(' ');
}
function getLogicalColumn (t) {
	var line = t.rows(t.selectionStartRow).substr(0, t.selectionStartCol);
	var textspan = $('wasavi_singleline_scaler');
	if (textspan.textContent != line) {
		textspan.textContent = line;
	}
	// TODO: use more trustworthy method
	return Math.floor(textspan.offsetWidth / charWidth + 0.5);
}
function refreshIdealWidthPixels (t) {
	if (idealWidthPixels < 0) {
		var n = t.selectionStart;
		var line = t.rows(n).substr(0, n.col);
		var textspan = $('wasavi_singleline_scaler');
		if (textspan.textContent != line) {
			textspan.textContent = line;
		}
		idealWidthPixels = textspan.offsetWidth;

		var curRect = t.charRectAt(n);
		idealDenotativeWidthPixels = curRect.left + parseInt((curRect.right - curRect.left) / 2);
	}
}
function getCurrentViewPositionIndices (t) {
	function findTopLineIndex (line) {
		var low = 0;
		var high = t.elm.childNodes.length - 1;
		var result = -1;
		while (low <= high) {
			var middle = parseInt((low + high) / 2);
			var node = t.elm.childNodes[middle];
			var top = node.offsetTop;
			var bottom = node.offsetTop + node.offsetHeight
			if (top == line && line < bottom) {
				result = middle;
				break;
			}
			else if (top < line && line < bottom) {
				result = middle + 1;
				break;
			}
			else if (bottom <= line) {
				low = middle + 1;
			}
			else {
				high = middle - 1;
			}
		}
		return result;
	}
	function findBottomLineIndex (line) {
		var low = 0;
		var high = t.elm.childNodes.length - 1;
		var result = -1;
		while (low <= high) {
			var middle = parseInt((low + high) / 2);
			var node = t.elm.childNodes[middle];
			var top = node.offsetTop;
			var bottom = node.offsetTop + node.offsetHeight
			if (top < line && line == bottom) {
				result = middle;
				break;
			}
			else if (top < line && line < bottom) {
				result = middle - 1;
				break;
			}
			else if (bottom <= line) {
				low = middle + 1;
			}
			else {
				high = middle - 1;
			}
		}
		return result;
	}

	var result = {};

	var top = findTopLineIndex(t.elm.scrollTop);
	if (top >= 0) {
		result.top = top;
	}
	else {
		result.top = 0;
	}

	var bottom = findBottomLineIndex(t.elm.scrollTop + t.elm.clientHeight - 1);
	if (bottom >= 0) {
		result.bottom = bottom;
	}
	else {
		result.bottom = t.rowLength - 1;
	}

	result.lines = parseInt(t.elm.clientHeight / lineHeight);

	return result;
}
function isDenotativeState () {
	return prefixInput.motion == 'g' && !config.vars.jkdenotative
		|| prefixInput.motion != 'g' &&  config.vars.jkdenotative;
}
function callDenotativeFunction () {
	return (isDenotativeState() ? motionUpDownDenotative : motionUpDown).apply(null, arguments);
}
function inputEscape () {
	if (arguments.length) {
		requestRegisterNotice(_('{0} canceled.', arguments[0]));
	}
	else {
		inputMode == 'command' && requestRegisterNotice(_('In command mode.'));
	}

	prefixInput.reset();
	requestShowPrefixInput();
}
function inputDigit (c, t) {
	prefixInput.appendCount(c);
	requestShowPrefixInput();
}
function operationDefault (c, t, o) {
	if (prefixInput.isEmptyOperation) {
		prefixInput.operation = c;
		requestShowPrefixInput();
	}
	else if (prefixInput.operation == c) {
		return true;
	}
	else {
		inputEscape(o.e.fullIdentifier);
	}
}

/*
 * low-level functions for cursor motion {{{1
 * ----------------
 */

function motionLeft (c, t, count) {
	count || (count = 1);
	var n = t.selectionStart;
	n.col <= 0 && requestRegisterNotice(_('Top of line.'));
	n.col = Math.max(n.col - count, 0);
	t.selectionStart = n;
	prefixInput.motion = c;
	idealWidthPixels = -1;
	return true;
}
function motionRight (c, t, count) {
	count || (count = 1);
	var n = t.selectionEnd;
	var length = t.rows(n).length;
	n.col >= length - 1 && requestRegisterNotice(_('Tail of line.'));
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
function motionLineStartDenotative (c, t, realTop) {
	var n = t.selectionStart;
	var curRect = t.charRectAt(n);
	while (--n.col >= 0) {
		var newRect = t.charRectAt(n);
		if (newRect.top < curRect.top) {
			n.col++;
			break;
		}
	}
	n.col = Math.max(n.col, 0);
	if (!realTop) {
		while (!t.isEndOfText(n) && !t.isNewline(n) && /\s/.test(t.charAt(n))) {
			n.col++;
		}
	}
	t.selectionStart = n;
	prefixInput.motion = c;
	idealWidthPixels = -1;
	return true;
}
function motionLineEndDenotative (c, t) {
	var n = t.selectionEnd;
	var curRect = t.charRectAt(n);
	while (!t.isEndOfText(n) && !t.isNewline(n)) {
		n.col++;
		var newRect = t.charRectAt(n);
		if (newRect.top > curRect.top) {
			n.col--;
			break;
		}
	}
	t.selectionEnd = n;
	prefixInput.motion = c;
	idealWidthPixels = -1;
	return true;
}
function motionNextWord (c, t, count, bigWord, wordEnd) {
	var n = t.selectionEnd;
	count || (count = 1);
	n.col >= t.rows(n).length - 1 && n.row >= t.rowLength - 1 && requestRegisterNotice(_('Tail of text.'));

	function doBigWord () {
		for (var i = 0; i < count; i++) {
			var prop = t.charClassAt(n, true);
			var foundSpace = prop === 'Z';

			while (!t.isEndOfText(n)) {
				if (t.isNewline(n)) {
					if (!prefixInput.isEmptyOperation && i + 1 == count) {
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
					if (!prefixInput.isEmptyOperation && i + 1 == count) {
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
	return true;
}
function motionPrevWord (c, t, count, bigWord) {
	var n = t.selectionStart;
	count || (count = 1);
	n.col <= 0 && n.row <= 0 && requestRegisterNotice(_('Top of text.'));

	if (bigWord) {
		for (var i = 0; i < count; i++) {
			n = t.leftPos(n);
			var prop = t.charClassAt(n, true);
			var nonSpaceFound = prop !== 'Z';

			while (n.row > 0 || n.col > 0) {
				if (t.isNewline(n) && t.isNewline(t.leftPos(n))) {break;}

				var prevn = n;
				n = t.leftPos(n);
				if (n.eq(prevn)) {break;}

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
				if (t.isNewline(n) && t.isNewline(t.leftPos(n))) {break;}

				var prevn = n;
				n = t.leftPos(n);
				if (n.eq(prevn)) {break;}

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
	return true;
}
function motionFindForward (c, t, count, stopBefore, continuous) {
	var n = t.selectionEnd;
	count || (count = 1);

	var startn = n.clone();
	var found = true;
	var line = t.rows(n);
	for (var i = 0; i < count; i++) {
		var index = line.indexOf(c, n.col + 1);
		if (index >= 0) {
			n.col = index;
			if (stopBefore
			&&  continuous
			&&  i == count - 1
			&&  startn.eq(new Position(n.row, n.col - 1))) {
				count++;
			}
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
		requestRegisterNotice(_('Next search target not found.'));
	}
	lastHorzFindCommand.direction = 1;
	lastHorzFindCommand.letter = c;
	lastHorzFindCommand.stopBefore = stopBefore;
	idealWidthPixels = -1;
	return true;
}
function motionFindBackward (c, t, count, stopBefore, continuous) {
	var n = t.selectionStart;
	count || (count = 1);

	var startn = n.clone();
	var found = true;
	var line = t.rows(n);
	for (var i = 0; i < count; i++) {
		var index = line.lastIndexOf(c, n.col - 1);
		if (index >= 0) {
			n.col = index;
			if (stopBefore
			&&  continuous
			&&  i == count - 1
			&&  startn.eq(new Position(n.row, n.col + 1))) {
				count++;
			}
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
		requestRegisterNotice(_('Previous search target not found.'));
	}
	lastHorzFindCommand.direction = -1;
	lastHorzFindCommand.letter = c;
	lastHorzFindCommand.stopBefore = stopBefore;
	idealWidthPixels = -1;
	return true;
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
	wrapped && requestShowMessage(_('Search wrapped.'), false, false, true);
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
		if (n <= 0) return 0;
		n--;
		if (text.charCodeAt(n) == 0x0a) {n--;}
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
	wrapped && requestShowMessage(_('Search wrapped.'), false, false, true);
	return {offset:n, matchLength:len};
}
function motionReplaceOne (c, t, count) {
	count || (count = 1);

	var done = false;
	var n = t.selectionStart;
	if (!t.selected) {
		if (count <= t.getLineTailOffset(n).col - n.col) {
			if (c == '\r' || c == '\n') {
				t.selectionEnd = new Position(n.row, n.col + count);
				insert(t, '\n' + t.getIndent(n));
			}
			else {
				t.selectionEnd = new Position(n.row, n.col + count);
				insert(t, multiply(c, count));
			}
			done = true;
		}
		else {
			requestRegisterNotice(_('Replace count too large.'));
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
function motionUpDown (c, t, count, isDown) {
	count || (count = 1);
	refreshIdealWidthPixels(t);
	var textspan = $('wasavi_singleline_scaler');
	var n = isDown ? t.selectionEnd : t.selectionStart;
	var goalWidth = idealWidthPixels;

	if (isDown) {
		n.row >= t.rowLength - 1 && requestRegisterNotice(_('Tail of text.'));
		n.row = Math.min(n.row + count, t.rowLength - 1);
	}
	else {
		n.row <= 0 && requestRegisterNotice(_('Top of text.'));
		n.row = Math.max(n.row - count, 0);
	}

	var width = 0;
	var widthp = 0;
	var line = t.rows(n);
	var index = 0;

	textspan.textContent = '';

	while (index < line.length && !t.isNewline(n.row, index)) {
		// TODO: more optimization
		textspan.textContent += line.substr(index++, 1);
		width = textspan.offsetWidth;
		if (width >= goalWidth) {
			index -= Math.abs(widthp - goalWidth) < Math.abs(width - goalWidth) ? 1 : 0;
			break;
		}
		widthp = width;
	}
	n.col = index;
	if (isDown) {
		t.selectionEnd = n;
	}
	else {
		t.selectionStart = n;
	}
	prefixInput.motion = c;
	isVerticalMotion = true;
	return true;
}
function motionUp (c, t, count) {
	return motionUpDown(c, t, count, false);
}
function motionDown (c, t, count) {
	return motionUpDown(c, t, count, true);
}
function motionUpDownDenotative (c, t, count, isDown) {
	count || (count = 1);
	refreshIdealWidthPixels(t);
	var n = isDown ? t.selectionEnd : t.selectionStart;
	var goalWidth = idealDenotativeWidthPixels;
	var overed = false;
	var dir = isDown ? 1 : -1;

	for (var i = 0; i < count; i++) {
		var curRect = t.charRectAt(n);
		var startn = n.clone();
		while (isDown && !t.isEndOfText(n) && !t.isNewline(n) && ++n.col >= 0
		|| !isDown && --n.col >= 0) {
			// TODO: more optimization
			var newRect = t.charRectAt(n);
			if (isDown && newRect.top > curRect.top
			||  !isDown && newRect.top < curRect.top) break;
		}
		if (isDown && t.isNewline(n) || !isDown && n.col < 0) {
			if (isDown && n.row >= t.rowLength - 1 || !isDown && n.row <= 0) {
				overed = i == 0;
				n = startn;
				break;
			}
			n.row += dir;
			n.col = isDown ? 0 : Math.max(t.rows(n).length - 1, 0);
		}

		var widthp = 0;
		while (isDown && !t.isEndOfText(n) && !t.isNewline(n)
		|| !isDown && n.col >= 0) {
			// TODO: more optimization
			var newRect = t.charRectAt(n);
			var width = newRect.left + parseInt((newRect.right - newRect.left) / 2);
			if (isDown && width >= goalWidth || !isDown && width <= goalWidth) {
				var closer = Math.abs(widthp - goalWidth) < Math.abs(width - goalWidth) ? 1 : 0;
				n.col += closer * -dir;
				break;
			}
			widthp = width;
			n.col += dir
		}
	}

	n.col = Math.max(0, Math.min(n.col, t.rows(n).length));
	if (isDown) {
		t.selectionEnd = n;
	}
	else {
		t.selectionStart = n;
	}
	prefixInput.motion = c;
	overed && requestRegisterNotice(isDown ? _('Tail of text.') : _('Top of text.'));
	return true;
}
function scrollView (c, t, count) {
	function down (count) {
		var index = Math.min(v.top + count, t.rowLength - 1);
		var dest = index == 0 ? 0 : t.rowNodes(index).offsetTop;
		scroller.run(dest, function () {
			var v2 = getCurrentViewPositionIndices(t);
			if (v2.top >= 0 && v2.top < t.rowLength && v2.top > t.selectionStartRow) {
				t.setSelectionRange(t.getLineTopOffset2(v2.top, 0));
			}
		});
	}
	function up (count) {
		var index = Math.max(v.top - count, 0);
		var dest = index == 0 ? 0 : t.rowNodes(index).offsetTop;
		scroller.run(dest, function () {
			var v2 = getCurrentViewPositionIndices(t);
			if (v2.bottom >= 0 && v2.bottom < t.rowLength && v2.bottom < t.selectionStartRow) {
				t.setSelectionRange(t.getLineTopOffset2(v2.bottom, 0));
			}
		});
	}
	var v = getCurrentViewPositionIndices(t);
	if (typeof count == 'function') {
		count = count(v);
	}
	if (typeof count == 'number' && !isNaN(count) && count != 0) {
		count > 0 ? down(count) : up(-count);
	}
	prefixInput.motion = c;
	return true;
}
function extendRightIfInclusiveMotion (t) {
	if (prefixInput.motion == ';' && lastHorzFindCommand.direction == 1
	||  prefixInput.motion == ',' && lastHorzFindCommand.direction == -1
	||  'eEft%'.indexOf(prefixInput.motion) >= 0) {
		if (!t.isNewline(t.selectionEnd)) {
			t.selectionEnd = t.rightPos(t.selectionEnd);
		}
	}
}

/*
 * low-level functions for text modification {{{1
 * ----------------
 */

function deleteSelection (t, isSubseq) {
	if (!t.selected && !t.isLineOrientSelection) return 0;

	var result = 0;
	(isSubseq ? $call : editLogger.open).call(editLogger, 'deleteSelection', function () {
		marks.update(t.selectionStart, function (foldedMarkRegisterer) {
			result = t.deleteRange(function (content, fragment) {
				var deleteMarks = fragment.querySelectorAll('span.' + MARK_CLASS);
				var deleteMarksDest = {};
				for (var i = 0; i < deleteMarks.length; i++) {
					var name = deleteMarks[i].getAttribute('data-index');
					var position = marks.get(name);
					position && (deleteMarksDest[name] = position.clone());
				}
				!t.isLineOrientSelection && foldedMarkRegisterer(fragment);
				!isSubseq && registers.set(prefixInput.register, content);
				editLogger.write(
					EditLogger.ITEM_TYPE.DELETE,
					t.selectionStart, content,
					t.selectionEnd, t.isLineOrientSelection,
					t.selectionEndRow == t.rowLength - 1 && t.selectionEndCol > 0,
					deleteMarksDest
				);
			});
		});
	});
	return result;
}
function insert (t, s, opts) {
	if (s == '' && !t.selected) return;

	opts || (opts = {});
	var keepPosition = !!opts.keepPosition;
	var isLineOrientedLast = !!opts.isLineOrientedLast;
	var isEditing_ = isEditing();

	(isEditing_ ? $call : editLogger.open).call(editLogger, 'insert', function () {
		deleteSelection(t, true);

		var startn = t.selectionStart;
		if (isLineOrientedLast
		&& s.length >= 2
		&& s.substr(-1) == '\n'
		&& t.selectionStartRow == t.rowLength - 1
		&& t.rowTextNodes(t.selectionStartRow).nodeValue.substring(t.selectionStartCol) == '\n') {
			s = s.substr(0, s.length - 1);
		}
		var re = s.match(/\u0008|\u007f|\n|[^\u0008\u007f\n]+/g);
		if (!re) return;

		for (var i = 0; i < re.length; i++) {
			switch (re[i]) {
			case '\u0008':
				deleteChars(t, 1, false, true);
				break;
			case '\u007f':
				deleteChars(t, 1, true, true);
				break;
			case '\n':
				!isEditing_ && editLogger.write(
					EditLogger.ITEM_TYPE.INSERT,
					t.selectionStart, re[i], keepPosition
				);
				marks.update(t.selectionStart, function () {
					isMultilineTextInput(targetElement) && t.divideLine();
				});
				break;
			default:
				!isEditing_ && editLogger.write(
					EditLogger.ITEM_TYPE.INSERT,
					t.selectionStart, re[i], keepPosition
				);
				marks.update(t.selectionStart, function () {
					t.setSelectionRange(t.insertChars(t.selectionStart, re[i]));
				});
				break;
			}
		}
		keepPosition && t.setSelectionRange(startn);
	});
}
function overwrite (t, s, opts) {
	if (s == '') return;

	opts || (opts = {});
	var keepPosition = !!opts.keepPosition;
	var isLineOrientedLast = !!opts.isLineOrientedLast;

	if (overwroteString === false) {
		overwroteString = t.rows(t.selectionStartRow);
	}

	(isEditing() ? $call : editLogger.open).call(editLogger, 'overwrite', function () {
		deleteSelection(t);

		var startn = t.selectionStart;
		!isEditing() && editLogger.write(
			EditLogger.ITEM_TYPE.OVERWRITE,
			startn, s, t.rows(startn)
		);
		marks.update(startn, function () {
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
	editLogger.open('shift', function () {
		var startn = t.selectionStart;
		editLogger.write(
			EditLogger.ITEM_TYPE.SHIFT, startn, '', rowCount, shiftCount,
			config.vars.shiftwidth, config.vars.tabstop
		);
		marks.update(startn, function () {
			t.shift(
				startn.row, rowCount, shiftCount,
				config.vars.shiftwidth, config.vars.tabstop
			);
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
	editLogger.open('unshift', function () {
		var startn = t.selectionStart;
		var editLogItem = editLogger.write(
			EditLogger.ITEM_TYPE.UNSHIFT, startn, '', rowCount, shiftCount,
			config.vars.shiftwidth, config.vars.tabstop
		);
		marks.update(startn, function () {
			editLogItem.indents = t.shift(
				startn.row, rowCount, -shiftCount,
				config.vars.shiftwidth, config.vars.tabstop
			);
		});
		if (rowCount >= config.vars.report) {
			requestShowMessage(_('Unshifted {0} {line:0}.', rowCount));
		}
	});
	isEditCompleted = true;
}
function deleteChars (t, count, isForward, isSubseq) {
	if (t.selected) {
		deleteSelection(t, isSubseq);
	}
	else {
		count || (count = 1);

		if (isForward) {
			var n = t.selectionEnd;
			var tail = t.getLineTailOffset(n);
			n.col = Math.min(tail.col, n.col + count);
			t.selectionEnd = n;
			deleteSelection(t, isSubseq);
		}
		else {
			var n = t.selectionStart;
			n.col = Math.max(0, n.col - count);
			t.selectionStart = n;
			deleteSelection(t, isSubseq);
		}
	}
	isEditCompleted = true;
	return true;
}
function joinLines (t, count, asis) {
	count || (count = 1);
	editLogger.open('joinLines', function () {
		var asisIndex = [{length:0}];
		for (var i = 0; i < count; i++) {
			if (t.selectionStartRow >= t.rowLength - 1) return;

			var t1 = t.rows(t.selectionStartRow);
			var t2 = t.rows(t.selectionStartRow + 1);
			var re = asis ? asisIndex : /^\s*/.exec(t2);

			t.selectionStart = new Position(t.selectionStartRow, t1.length);
			t.selectionEnd = new Position(t.selectionStartRow + 1, re[0].length);
			deleteSelection(t);

			if (asis || /\s+$/.test(t1) || ')]}'.indexOf(t2.charAt(re[0].length)) >= 0) {
				// do nothing
			}
			else if (/[.!?]$/.test(t1)) {
				insert(t, '  ', {keepPosition:true});
			}
			else {
				insert(t, ' ', {keepPosition:true});
			}
		}
	});
	isEditCompleted = true;
	return true;
}
function toggleCase (t, count) {
	var n = t.selectionStart;
	var text = t.rows(n);
	count || (count = 1);
	count = Math.min(count, text.length - n.col);
	editLogger.open('toggleCase', function () {
		var smalla = 'a'.charCodeAt(0);
		var replacedText = text.substr(n.col, count).replace(/[a-z]/ig, function (a) {
			return a.charCodeAt(0) >= smalla ? a.toUpperCase() : a.toLowerCase();
		});
		deleteChars(t, count, true, true);
		insert(t, replacedText);
	});
	isEditCompleted = true;
	return true;
}
function yank (t, count, isLineOrient, register) {
	var result = 0;
	if (isLineOrient || t.isLineOrientSelection) {
		count || (count = 1);
		result = t.selectRows(count);
		var content = t.getSelectionRows();
		registers.set(
			register == undefined ? prefixInput.register : register,
			content, true, true);
		if (result >= config.vars.report) {
			requestShowMessage(_('Yanked {0} {line:0}.', result));
		}
	}
	else {
		var content = t.getSelection();
		result = content.length;
		registers.set(
			register == undefined ? prefixInput.register : register,
			content, false, true);
	}
	return result;
}
function paste (t, count, opts) {
	count || (count = 1);
	opts || (opts = {});

	var item, data = '';
	if ('register' in opts) {
		var register = opts.register;
		if (register == undefined || register == '') {
			register = '"';
		}
		if (registers.exists(register)) {
			item = registers.get(register);
			data = item.data;
		}
		else {
			requestRegisterNotice(_('Register {0} is empty.', register));
			return true;
		}
	}
	else if ('content' in opts) {
		item = {};
		data = opts.content;
	}
	if (t.selected) {
		requestRegisterNotice(_('Internal state error.'));
		return true;
	}
	if (data.length == 0) {
		requestRegisterNotice(_('Putting data is empty.'));
		return true;
	}

	var isForward = !!opts.isForward;
	var isForceLineOrient = !!opts.isForceLineOrient;
	var n = t.selectionStart;

	if (item.isLineOrient || isForceLineOrient) {
		var originalLineOrient = item.isLineOrient;
		item.isLineOrient = true;
		if (data.substr(-1) != '\n') {
			data += '\n';
		}
		editLogger.open('paste#1', function () {
			if (isForward) {
				if (n.row >= t.rowLength - 1) {
					t.setSelectionRange(t.getLineTailOffset(n));
					insert(t, '\n', {isLineOrientLast:true});
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
			for (var i = 0, goal = count - 1; i < goal; i++) {
				insert(t, data);
			}
			insert(t, data, {isLineOrientedLast:true});
			t.setSelectionRange(t.getLineTopOffset2(n));
		});
		item.isLineOrient = originalLineOrient;
	}
	else {
		if (isForward) {
			n = t.rightPos(n);
			t.setSelectionRange(n);
		}
		editLogger.open('paste#2', function () {
			for (var i = 0; i < count; i++) {
				insert(t, data);
			}
		});
		if (isForward) {
			t.setSelectionRange(t.leftPos(t.selectionStart));
		}
	}
	isEditCompleted = true;
	return true;
}
function startEdit (c, t, opts, isAppend, isAlter) {
	if (!t.selected) {
		requestInputMode('edit', '', '', true);

		opts || (opts = {});
		var isAppend = !!opts.isAppend;
		var isAlter = !!opts.isAlter;
		var opened = !!opts.opened;

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
		config.vars.showmode && requestShowMessage(_('--INSERT--'), false, false, true);
		prefixInput.operation = c;
		prefixInput.isLocked = true;
		editedString = editedStringCurrent = '';
		overwroteString = false;
		editedStringSuffix = opened ? '\n' : '';
		editStartPosition = t.selectionStart;
		editRepeatCount = opts.repeatCount || 1;
		return false;
	}
	else {
		inputEscape(opts.e.fullIdentifier);
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
	editLogger.open('openLine');
	if (isTopOfText) {
		t.setSelectionRange(new Position(0, 0));
		insert(t, '\n', {keepPosition:true});
	}
	else {
		var indent = config.vars.autoindent ? t.getIndent(t.selectionStart) : '';
		n = t.getLineTailOffset(n);
		t.setSelectionRange(n);
		insert(t, '\n' + indent);
	}
	isEditCompleted = true;
	return startEdit(c, t, {repeatCount:prefixInput.count, opened:true});
}

/*
 * variables {{{1
 * ----------------
 */

// persistent variables

var exrc = '';
var fontFamily = 'monospace';
var quickActivation = false;
var testMode = false;
var devMode = false;
var fstab;
var substituteWorker;
var resizeHandlerInvokeTimer;
var keyManager = new KeyManager;
var regexConverter = new RegexConverter;
var mapManager = new MapManager;
var theme = new Theme;
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
		new VariableItem('number', 'b', false, function (v) {
			idealWidthPixels = -1;
			return v;
		}),											  // O
		new VariableItem('paragraphs', 's', 'IPLPPPQPP LIpplpipbp', function (v) {
			searchUtils && searchUtils.setParagraphMacros(v);
			return v;
		}),                                           // O
		new VariableItem('prompt', 'b', true),        // O
		new VariableItem('readonly', 'b', false),     // O
		new VariableItem('redraw', 'b', true),        // not used
		new VariableItem('remap', 'b', true),         // O
		new VariableItem('report', 'i', 5),           // O
		new VariableItem('scroll', 'i', 0),           // O
		new VariableItem('sections', 's', 'NHSHH HUnhsh', function (v) {
			searchUtils && searchUtils.setSectionMacros(v);
			return v;
		}),											  // O
		new VariableItem('shell', 's', '/bin/sh'),    // not used
		new VariableItem('shiftwidth', 'i', 4),       // O
		new VariableItem('showmatch', 'b', true),     // O
		new VariableItem('showmode', 'b', true),      // O
		new VariableItem('slowopen', 'b', false),     // not used
		new VariableItem('tabstop', 'i', 8, function (v) {
			setTabStop(v);
			return v;
		}),											  // O
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
		new VariableItem('theme', 's', '', function (v) {
			theme.select(v) && theme.update();
			return v;
		}),											  // O
		new VariableItem('smooth', 'b', true),        // O
		new VariableItem('bellvolume', 'i', 25),      // O
		new VariableItem('history', 'i', 20),         // O
		new VariableItem('monospace', 'i', 20),       // O
		new VariableItem('fullscreen', 'b', false, function (v) {
			!isStandAlone &&
			targetElement &&
			extensionChannel &&
			extensionChannel.postMessage({
				type:'notify-to-parent',
				parentTabId:targetElement.parentTabId,
				payload:{
					type:'wasavi-window-state',
					tabId:extensionChannel.tabId,
					state:v ? 'maximized' : 'normal',
					modelineHeight:$('wasavi_footer').offsetHeight
				}
			});
			return v;
		}),   // O
		new VariableItem('jkdenotative', 'b', false),  // O

		/* defined by vim */
		new VariableItem('iskeyword', 'r', '^[a-zA-Z0-9_]\\+$'),// O
		new VariableItem('searchincr', 'b', true),             // O
		new VariableItem('smartcase', 'b', true),              // O
		new VariableItem('undolevels', 'i', 20, function (v) {
			if (editLogger) {
				editLogger.logMax = v;
			}
			return v;
		}),                                           // O
		new VariableItem('quoteescape', 's', '\\'),   // O

		/* defined by nvi */
		//new VariableItem('altwerase', 'b', false),
		//new VariableItem('backup', 's', ''),
		//new VariableItem('cdpath', 's', ':'),
		//new VariableItem('cedit', 's', ''),
		new VariableItem('columns', 'i', 0),
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
		new VariableItem('lines', 'i', 0),
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
		ai: 'autoindent',		ap: 'autoprint',	aw: 'autowrite',
		bf: 'beautify',			co: 'columns',		dir: 'tmp_directory',
		eb: 'errorbells',		ed: 'edcompatible',	ex: 'exrc',
		fe: 'fileencoding',		ht: 'hardtabs',		ic: 'ignorecase',
		ie: 'inputencoding',	li: 'lines',		modelines: 'modeline',
		nu: 'number',			opt: 'optimize',	para: 'paragraphs',
		re: 'redraw',			ro: 'readonly',		scr: 'scroll',
		sect: 'sections',		sh: 'shell',		slow: 'slowopen',
		sm: 'showmatch',		smd: 'showmode',	sw: 'shiftwidth',
		tag: 'tags',			tl: 'taglength',	to: 'timeout',
		ts: 'tabstop',			tty: 'term',		ttytype: 'term',
		ul: 'undolevels',		w: 'window',		wa: 'writeany',
		wi: 'window',			wl: 'wraplen',		wm: 'wrapmargin',
		ws: 'wrapscan',

		isk: 'iskeyword',
		incsearch: 'searchincr', is: 'searchincr',
		scs: 'smartcase',
		ul: 'undolevels',
		qe: 'quoteescape',

		fs: 'fullscreen',		jk: 'jkdenotative'
	}
);
var isStandAlone = (function () {
	try {
		return window.chrome ? window.parent == window : !!!window.frameElement;
	} catch (e) {}
})();

// extension depend objects
var registers;
var lineInputHistories;
var bell;
var l10n;

// instance variables
var targetElement;
var fileName;
var preferredNewline;
var terminated;
var writeOnTermination;
var state;
var runLevel;
var strokeCount;
var marks;
var cursor;
var scroller;
var editLogger;
var prefixInput;
var inputModeStack;
var inputMode;
var inputModeSub;
var editStartPosition;
var editedString;
var editedStringCurrent;
var overwroteString;
var editedStringSuffix;
var editRepeatCount;
var requestedState;
var lineHeight;
var charWidth;
var idealWidthPixels;
var idealDenotativeWidthPixels;
var backlog;
var pairBracketsIndicator;
var exCommandExecutor;
var searchUtils;

var isTextDirty;
var isEditCompleted;
var isVerticalMotion;
var isReadonlyWarned;
var isInteractive;
var isSmoothScrollRequested;
var isSimpleCommandUpdateRequested;
var isJumpBaseUpdateRequested;

var lastKeyCode;
var lastSimpleCommand;
var lastHorzFindCommand;
var lastRegexFindCommand;
var lastSubstituteInfo;
var lastMessage;

/*
 * editor functions mapping {{{1
 * ----------------
 */

var commandMap = {
	// internal special
	'\u0000': function (c, t) {
		return true;
	},

	// escape
	'\u001b': inputEscape,

	// digits
	'1': inputDigit, '2': inputDigit, '3': inputDigit, '4': inputDigit, '5': inputDigit,
	'6': inputDigit, '7': inputDigit, '8': inputDigit, '9': inputDigit,

	// register specifier
	'"': {
		'command': function (c, t, o) {
			if (prefixInput.isEmpty) {
				inputModeSub = 'wait-register';
				prefixInput.register = c;
				requestShowPrefixInput(_('{0}: register (a-z,A-Z,1-9)', o.e.fullIdentifier));
			}
			else {
				inputEscape(o.e.fullIdentifier);
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

	c: {
		'command': operationDefault,
		'@op': function (c, t) {
			if (c == prefixInput.operation) {
				this._.apply(this, arguments);
			}
			if (requestedState.notice) {
				return;
			}

			t.regalizeSelectionRelation();
			var origin = t.selectionStart;
			var isLineOrient = c == prefixInput.operation || isVerticalMotion;
			var actualCount = t.selectionEndRow - t.selectionStartRow + 1;
			var deleted = 0;

			// special change behavior followed vim.
			if (!isLineOrient && t.selectionEndCol == 0 && actualCount > 1) {
				var leading = t.rows(t.selectionStartRow)
					.substring(0, t.selectionStartCol);
				if (!/\S/.test(leading)) {
					isLineOrient = true;
				}

				actualCount--;
				t.selectionEnd = t.leftPos(t.selectionEnd);
			}

			editLogger.open('change op');

			t.isLineOrientSelection = isLineOrient;
			if (isLineOrient) {
				var selfIndent = t.getIndent(origin);
				t.selectionEnd = t.selectionStart;
				t.isLineOrientSelection = true;
				yank(t, actualCount);
				deleted = deleteSelection(t);
				if (deleted >= config.vars.report) {
					requestShowMessage(_('Changing {0} {line:0}.', deleted));
				}
				t.isLineOrientSelection = false;

				if (t.rowLength == 1 && t.rows(0) == '') {
					var indent = config.vars.autoindent ? selfIndent : '';
					insert(t, indent);
				}
				else if (origin.row >= t.rowLength) {
					var n = t.selectionStart;
					var indent = config.vars.autoindent ? t.getIndent(n) : '';
					n = t.getLineTailOffset(n);
					t.setSelectionRange(n);
					insert(t, '\n' + indent);
				}
				else {
					var indent = config.vars.autoindent ? t.getBackIndent(t.selectionStart) : '';
					insert(t, indent);
					insert(t, '\n', {keepPosition:true});
				}
			}
			else {
				extendRightIfInclusiveMotion(t);
				yank(t, actualCount);
				deleteSelection(t);
			}

			isEditCompleted = true;
			requestSimpleCommandUpdate();
			return startEdit(c, t);
		}
	},
	d: {
		'command': operationDefault,
		'@op': function (c, t) {
			if (c == prefixInput.operation) {
				this._.apply(this, arguments);
			}
			if (requestedState.notice) {
				return;
			}

			t.regalizeSelectionRelation();
			var origin = t.selectionStart;
			var isLineOrient = c == prefixInput.operation || isVerticalMotion;
			var actualCount = t.selectionEndRow - t.selectionStartRow + 1;
			var deleted = 0;

			// special delete behavior followed vim.
			if (!isLineOrient && t.selectionEndCol == 0 && actualCount > 1) {
				var leading = t.rows(t.selectionStartRow)
					.substring(0, t.selectionStartCol);
				if (!/\S/.test(leading)) {
					isLineOrient = true;
				}

				actualCount--;
				t.selectionEnd = t.leftPos(t.selectionEnd);
			}

			t.isLineOrientSelection = isLineOrient;
			if (isLineOrient) {
				t.selectionEnd = t.selectionStart;
			}
			else {
				extendRightIfInclusiveMotion(t);
			}

			yank(t, actualCount);
			deleted = deleteSelection(t);

			if (isLineOrient) {
				origin.row = Math.min(origin.row, t.rowLength - 1);
				t.setSelectionRange(t.getLineTopOffset2(origin));

				if (deleted >= config.vars.report) {
					requestShowMessage(_('Deleted {0} {line:0}.', deleted));
				}
			}

			isEditCompleted = true;
			requestSimpleCommandUpdate();
			return true;
		}
	},
	y: {
		'command': operationDefault,
		'@op': function (c, t) {
			var ss = t.selectionStart;
			var se = t.selectionEnd;
			var origin = ss.lt(se) ? ss : se;

			if (c == prefixInput.operation) {
				this._.apply(this, arguments);
			}
			if (requestedState.notice) {
				return;
			}

			var isLineOrient = c == prefixInput.operation || isVerticalMotion;
			var actualCount = Math.abs(t.selectionEndRow - t.selectionStartRow) + 1;
			var yanked = 0;

			t.isLineOrientSelection = isLineOrient;
			if (isLineOrient) {
				// do nothing
			}
			else {
				extendRightIfInclusiveMotion(t);
			}

			yanked = yank(t);
			t.setSelectionRange(origin);
			requestSimpleCommandUpdate();
			return true;
		}
	},
	'<': {
		'command': operationDefault,
		'@op': function (c, t) {
			if (c == prefixInput.operation) {
				this._.apply(this, arguments);
			}
			if (requestedState.notice) {
				return;
			}

			t.regalizeSelectionRelation();
			var isLineOrient = c == prefixInput.operation || isVerticalMotion;
			var actualCount = t.selectionEndRow - t.selectionStartRow + 1;

			// special shift behavior followed vim.
			if (!isLineOrient && t.selectionEndCol == 0 && actualCount > 1) {
				actualCount--;
				t.selectionEnd = t.leftPos(t.selectionEnd);
			}

			unshift(t, actualCount);
			t.setSelectionRange(t.getLineTopOffset2(t.selectionStart));
			isVerticalMotion = true;
			prefixInput.motion = c;
			requestSimpleCommandUpdate();
			return true;
		}
	},
	'>': {
		'command': operationDefault,
		'@op': function (c, t, opts) {
			if (c == prefixInput.operation) {
				this._.apply(this, arguments);
			}
			if (requestedState.notice) {
				return;
			}

			t.regalizeSelectionRelation();
			var isLineOrient = c == prefixInput.operation || isVerticalMotion;
			var actualCount = t.selectionEndRow - t.selectionStartRow + 1;

			// special shift behavior followed vim.
			if (!isLineOrient && t.selectionEndCol == 0 && actualCount > 1) {
				actualCount--;
				t.selectionEnd = t.leftPos(t.selectionEnd);
			}

			shift(t, actualCount);
			t.setSelectionRange(t.getLineTopOffset2(t.selectionStart));
			isVerticalMotion = true;
			prefixInput.motion = c;
			requestSimpleCommandUpdate();
			return true;
		}
	},

	/*
	 * operator shortcuts
	 */

	// C: change to the end of the line (equivalents to c$)
	C: function (c, t, o) {
		if (prefixInput.isEmptyOperation) {
			this.$('', t);
			isVerticalMotion = false;
			prefixInput.operation = c;
			return this.c['@op'].call(this, '', t);
		}
		else {
			inputEscape(o.e.fullIdentifier);
		}
	},
	// D: delete the characters to the end of the line (equivalents to d$)
	D: function (c, t, o) {
		if (prefixInput.isEmptyOperation) {
			this.$('', t);
			isVerticalMotion = false;
			prefixInput.operation = c;
			return this.d['@op'].call(this, '', t);
		}
		else {
			inputEscape(o.e.fullIdentifier);
		}
	},
	// Y: yank the lines (equivalents to yy)
	Y: function (c, t, o) {
		if (prefixInput.isEmptyOperation) {
			prefixInput.operation = c;
			isVerticalMotion = true;
			return this.y['@op'].call(this, c, t);
		}
		else {
			inputEscape(o.e.fullIdentifier);
		}
	},

	/*
	 * motions
	 */

	// backwards lines, to first non-white character
	'-': function (c, t, o) {
		var n = t.selectionStart;
		if (n.row == 0) {
			return inputEscape(o.e.fullIdentifier);
		}
		n.row = Math.max(n.row - prefixInput.count, 0);
		t.selectionStart = t.getLineTopOffset2(n);
		isVerticalMotion = true;
		prefixInput.motion = c;
		return true;
	},
	'+': function (c, t, o) {
		var n = t.selectionEnd;
		if (n.row >= t.rowLength - 1) {
			return inputEscape(o.e.fullIdentifier);
		}
		n.row = Math.min(n.row + prefixInput.count, t.rowLength - 1);
		t.selectionEnd = t.getLineTopOffset2(n);
		isVerticalMotion = true;
		prefixInput.motion = c;
		return true;
	},
	// jump to fist non-blank position on current line
	'^': function (c, t) {
		return (isDenotativeState() ? motionLineStartDenotative : motionLineStart)(c, t, false);
	},
	'<home>': function (c, t) {
		return this['^'].apply(this, arguments);
	},
	// jump to end of line
	'$': function (c, t) {
		if (isDenotativeState()) {
			prefixInput.count > 1 && motionUpDownDenotative(c, t, prefixInput.count - 1, true);
			return motionLineEndDenotative(c, t, false);
		}
		var count = Math.min(prefixInput.count, t.rowLength - t.selectionStartRow);
		count > 1 && motionDown(c, t, count - 1);
		return motionLineEnd(c, t, false);
	},
	'<end>': function (c, t) {
		return this.$.apply(this, arguments);
	},
	// jump to matching <, (, {, or [
	'%': function (c, t, o) {
		prefixInput.motion = c;
		var result = searchUtils.findMatchedBracket(prefixInput.count);
		if (result) {
			marks.set('\'', t.selectionStart);
			t.extendSelectionTo(result);
			idealWidthPixels = -1;
			isSmoothScrollRequested = true;
			return true;
		}
		else {
			inputEscape(o.e.fullIdentifier);
		}
	},
	// direct jump to specified column
	'|': function (c, t) {
		// TODO: need to treat specified column index as logical number
		//       which in consideration of a proportinal font width.
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
		var result;
		switch (lastHorzFindCommand.direction) {
		case -1:
			result = motionFindForward(
				lastHorzFindCommand.letter,
				t, prefixInput.count,
				lastHorzFindCommand.stopBefore,
				true);
			lastHorzFindCommand.direction *= -1;
			break;
		case 1:
			result = motionFindBackward(
				lastHorzFindCommand.letter,
				t, prefixInput.count,
				lastHorzFindCommand.stopBefore,
				true);
			lastHorzFindCommand.direction *= -1;
			break;
		}
		return result;
	},
	// repeat last find
	';': function (c, t) {
		prefixInput.motion = c;
		var result;
		switch (lastHorzFindCommand.direction) {
		case -1:
			result = motionFindBackward(
				lastHorzFindCommand.letter,
				t, prefixInput.count,
				lastHorzFindCommand.stopBefore,
				true);
			break;
		case 1:
			result = motionFindForward(
				lastHorzFindCommand.letter,
				t, prefixInput.count,
				lastHorzFindCommand.stopBefore,
				true);
			break;
		}
		return result;
	},
	// down, line orient
	_: function (c, t) {
		var count = Math.min(prefixInput.count, t.rowLength - t.selectionStartRow);
		count > 1 && motionDown(c, t, count - 1);
		t.extendSelectionTo(t.getLineTopOffset2(t.selectionEnd));
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
		'command': function (c, t, o) {
			prefixInput.motion = c;
			inputModeSub = 'wait-a-letter';
			requestShowPrefixInput(_('{0}: return to mark', o.e.fullIdentifier));
		},
		'wait-a-letter': function (c, t, o) {
			prefixInput.appendMotion(c);
			var offset = marks.get(c);
			if (offset != undefined) {
				if ('\'`[]'.indexOf(c) >= 0) {
					marks.set('\'', t.selectionStart);
				}
				t.extendSelectionTo(t.getLineTopOffset2(offset));
				isVerticalMotion = true;
				isSmoothScrollRequested = true;
				idealWidthPixels = -1;
				return true;
			}
			else {
				inputEscape(o.e.fullIdentifier);
				requestShowMessage(_('Mark {0} is not set.', c), true);
			}
		}
	},
	// return to marked line at remembered column, character orient motion
	'`': {
		'command': function (c, t, o) {
			prefixInput.motion = c;
			inputModeSub = 'wait-a-letter';
			requestShowPrefixInput(_('{0}: return to mark', o.e.fullIdentifier));
		},
		'wait-a-letter': function (c, t, o) {
			prefixInput.appendMotion(c);
			var offset = marks.get(c);
			if (offset != undefined) {
				if ('\'`[]'.indexOf(c) >= 0) {
					marks.set('\'', t.selectionStart);
				}
				t.extendSelectionTo(offset);
				isSmoothScrollRequested = true;
				return true;
			}
			else {
				inputEscape(o.e.fullIdentifier);
				requestShowMessage(_('Mark {0} is not set.', c), true);
			}
		}
	},
	// back an sentence
	'(': function (c, t) {
		prefixInput.motion = c;
		var pos = searchUtils.findSentenceBoundary(prefixInput.count, false, true);
		if (pos) {
			marks.set('\'', t.selectionStart);
			t.selectionStart = pos;
			return true;
		}
		else {
			inputEscape(prefixInput.motion);
		}
	},
	// forward an sentence
	')': function (c, t) {
		prefixInput.motion = c;
		var pos = searchUtils.findSentenceBoundary(prefixInput.count, true, true);
		if (pos) {
			marks.set('\'', t.selectionStart);
			t.selectionEnd = pos;
			return true;
		}
		else {
			inputEscape(prefixInput.motion);
		}
	},
	// back a paragraph
	'{': function (c, t) {
		prefixInput.motion = c;
		var pos = searchUtils.findParagraphBoundary(prefixInput.count, false, true);
		if (pos) {
			marks.set('\'', t.selectionStart);
			t.selectionStart = pos;
			isVerticalMotion = prefixInput.isEmptyOperation;
			return true;
		}
		else {
			inputEscape(prefixInput.motion);
		}
	},
	// forward a paragraph
	'}': function (c, t) {
		prefixInput.motion = c;
		var pos = searchUtils.findParagraphBoundary(prefixInput.count, true, true);
		if (pos) {
			marks.set('\'', t.selectionStart);
			t.selectionEnd = pos;
			isVerticalMotion = prefixInput.isEmptyOperation;
			return true;
		}
		else {
			inputEscape(prefixInput.motion);
		}
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
				var pos = searchUtils.findParagraphBoundary(
					prefixInput.count, false, true, '{', false);
				if (pos) {
					marks.set('\'', t.selectionStart);
					t.selectionStart = t.getLineTopOffset2(pos);
					isVerticalMotion = prefixInput.isEmptyOperation;
					return true;
				}
			}
			inputEscape(prefixInput.motion);
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
				var pos = searchUtils.findParagraphBoundary(
					prefixInput.count, true, true, '{', !prefixInput.isEmptyOperation);
				if (pos) {
					marks.set('\'', t.selectionStart);
					t.selectionEnd = t.getLineTopOffset2(pos);
					isVerticalMotion = prefixInput.isEmptyOperation;
					return true;
				}
			}
			inputEscape(prefixInput.motion);
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
	j: function (c, t) {
		return callDenotativeFunction(c, t, prefixInput.count, true);
	},
	'\u000e'/*^N*/: function (c, t) {
		return this.j.apply(this, arguments);
	},
	'<down>': function (c, t) {
		return this.j.apply(this, arguments);
	},
	k: function (c, t) {
		return callDenotativeFunction(c, t, prefixInput.count);
	},
	'\u0010'/*^P*/: function (c, t) {
		return this.k.apply(this, arguments);
	},
	'<up>': function (c, t) {
		return this.k.apply(this, arguments);
	},
	h: function (c, t) {
		return motionLeft(c, t, prefixInput.count);
	},
	'<left>': function (c, t) {
		return this.h.apply(this, arguments);
	},
	'\u0008'/*^H*/: function (c, t) {
		return this.h.apply(this, arguments);
	},
	l: function (c, t) {
		return motionRight(c, t, prefixInput.count);
	},
	' ': function (c, t, opts) {
		return this[opts.e.shift ? 'h' : 'l'].apply(this, arguments);
	},
	'<right>': function (c, t) {
		return this.l.apply(this, arguments);
	},
	w: function (c, t) {
		if (prefixInput.operation == 'c') {
			motionNextWord(c, t, prefixInput.count, false, true);
			if (!t.isNewline(t.selectionEnd)) {
				t.selectionEnd = t.rightPos(t.selectionEnd);
			}
			return true;
		}
		else {
			return motionNextWord(c, t, prefixInput.count, false);
		}
	},
	W: function (c, t) {
		if (prefixInput.operation == 'c') {
			motionNextWord(c, t, prefixInput.count, true, true);
			if (!t.isNewline(t.selectionEnd)) {
				t.selectionEnd = t.rightPos(t.selectionEnd);
			}
			return true;
		}
		else {
			return motionNextWord(c, t, prefixInput.count, true);
		}
	},
	b: function (c, t) {
		motionPrevWord(c, t, prefixInput.count, false);
		if (prefixInput.operation == 'c' && t.selectionEndCol == 0) {
			t.selectionEnd = t.leftPos(t.selectionEnd);
		}
		return true;
	},
	B: function (c, t) {
		motionPrevWord(c, t, prefixInput.count, true);
		if (prefixInput.operation == 'c' && t.selectionEndCol == 0) {
			t.selectionEnd = t.leftPos(t.selectionEnd);
		}
		return true;
	},
	e: function (c, t) {
		return motionNextWord(c, t, prefixInput.count, false, true);
	},
	E: function (c, t) {
		return motionNextWord(c, t, prefixInput.count, true, true);
	},
	g: {
		'command': function (c, t, o) {
			prefixInput.motion = c;
			inputModeSub = 'wait-a-letter';
			requestShowPrefixInput(o.e.fullIdentifier);
		},
		'wait-a-letter': function (c, t) {
			var result = false;
			switch (c) {
			case 'g':
				var index = prefixInput.count;
				var n = new Position(index - 1, 0);
				marks.set('\'', t.selectionStart);
				if (prefixInput.isEmptyOperation) {
					t.setSelectionRange(t.getLineTopOffset2(n));
					var node = t.rowNodes(n);
					var viewHeightHalf = parseInt((t.elm.clientHeight - lineHeight) / 2)
					scroller.run(Math.max(0, node.offsetTop - viewHeightHalf));
				}
				else {
					t.extendSelectionTo(t.getLineTopOffset2(n));
				}
				isVerticalMotion = true;
				idealWidthPixels = -1;
				prefixInput.trailer = c;
				result = true;
				break;
			case 'j':
				prefixInput.trailer = c;
				result = this.j.apply(this, arguments);
				break;
			case 'k':
				prefixInput.trailer = c;
				result = this.k.apply(this, arguments);
				break;
			default:
				requestRegisterNotice(_('Unknown g-prefixed command: {0}', c));
				break;
			}
			return result;
		}
	},
	H: function (c, t) {
		var v = getCurrentViewPositionIndices(t);
		var index = Math.min(v.top + prefixInput.count - 1, v.bottom, t.rowLength - 1);
		marks.set('\'', t.selectionStart);
		t.extendSelectionTo(t.getLineTopOffset2(index, 0));
		isVerticalMotion = true;
		idealWidthPixels = -1;
		prefixInput.motion = c;
		return true;
	},
	M: function (c, t) {
		var v = getCurrentViewPositionIndices(t);
		var index = v.top + parseInt(v.lines / 2);
		marks.set('\'', t.selectionStart);
		t.extendSelectionTo(t.getLineTopOffset2(index, 0));
		isVerticalMotion = true;
		idealWidthPixels = -1;
		prefixInput.motion = c;
		return true;
	},
	L: function (c, t) {
		var v = getCurrentViewPositionIndices(t);
		var index = Math.max(v.bottom - prefixInput.count + 1, v.top, 0);
		marks.set('\'', t.selectionStart);
		t.extendSelectionTo(t.getLineTopOffset2(index, 0));
		isVerticalMotion = true;
		idealWidthPixels = -1;
		prefixInput.motion = c;
		return true;
	},
	G: function (c, t) {
		var index = prefixInput.isCountSpecified ?
			Math.max(Math.min(prefixInput.count, t.rowLength), 1) : t.rowLength;
		var n = new Position(index - 1, 0);
		marks.set('\'', t.selectionStart);
		if (prefixInput.isEmptyOperation) {
			t.setSelectionRange(t.getLineTopOffset2(n));
			var node = t.rowNodes(n);
			var viewHeightHalf = parseInt((t.elm.clientHeight - lineHeight) / 2)
			scroller.run(Math.max(0, node.offsetTop - viewHeightHalf));
		}
		else {
			t.extendSelectionTo(t.getLineTopOffset2(n));
		}
		isVerticalMotion = true;
		isSmoothScrollRequested = true;
		idealWidthPixels = -1;
		prefixInput.motion = c;
		return true;
	},
	f: {
		'command': function (c, t, o) {
			prefixInput.motion = c;
			inputModeSub = 'wait-a-letter';
			requestShowPrefixInput(_('{0}: find forward', o.e.fullIdentifier));
		},
		'wait-a-letter': function (c, t) {
			prefixInput.trailer = c;
			return motionFindForward(c, t, prefixInput.count);
		}
	},
	F: {
		'command': function (c, t, o) {
			prefixInput.motion = c;
			inputModeSub = 'wait-a-letter';
			requestShowPrefixInput(_('{0}: find backward', o.e.fullIdentifier));
		},
		'wait-a-letter': function (c, t) {
			prefixInput.trailer = c;
			return motionFindBackward(c, t, prefixInput.count);
		}
	},
	t: {
		'command': function (c, t, o) {
			prefixInput.motion = c;
			inputModeSub = 'wait-a-letter';
			requestShowPrefixInput(_('{0}: find forward', o.e.fullIdentifier));
		},
		'wait-a-letter': function (c, t) {
			prefixInput.trailer = c;
			return motionFindForward(c, t, prefixInput.count, true);
		}
	},
	T: {
		'command': function (c, t, o) {
			prefixInput.motion = c;
			inputModeSub = 'wait-a-letter';
			requestShowPrefixInput(_('{0}: find backward', o.e.fullIdentifier));
		},
		'wait-a-letter': function (c, t) {
			prefixInput.trailer = c;
			return motionFindBackward(c, t, prefixInput.count, true);
		}
	},
	// search next match for current pattern
	n: function (c, t) {
		if (registers.exists('/')) {
			prefixInput.motion = c;
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
	N: function (c, t) {
		if (registers.exists('/')) {
			prefixInput.motion = c;
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
	'\u0015'/*^U*/: function (c, t, o) {
		if (prefixInput.isEmptyOperation) {
			return scrollView(c, t, function (v) {
				if (config.vars.scroll > 0) {
					return -config.vars.scroll * prefixInput.count;
				}
				else {
					return -parseInt(v.lines / 2) * prefixInput.count;
				}
			});
		}
		else {
			inputEscape(o.e.fullIdentifier);
		}
	},
	// scroll down half (height of screen) lines
	'\u0004'/*^D*/: function (c, t, o) {
		if (prefixInput.isEmptyOperation) {
			return scrollView(c, t, function (v) {
				if (config.vars.scroll > 0) {
					return config.vars.scroll * prefixInput.count;
				}
				else {
					return parseInt(v.lines / 2) * prefixInput.count;
				}
			});
		}
		else {
			inputEscape(o.e.fullIdentifier);
		}
	},
	// scroll up 1 line
	'\u0019'/*^Y*/: function (c, t, o) {
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
			inputEscape(o.e.fullIdentifier);
		}
	},
	// scroll down 1 line
	'\u0005'/*^E*/: function (c, t, o) {
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
			inputEscape(o.e.fullIdentifier);
		}
	},
	// scroll up (height of screen - 2) lines
	'\u0002'/*^B*/: function (c, t, o) {
		if (prefixInput.isEmptyOperation) {
			return scrollView(c, t, function (v) {
				return -Math.max(v.lines - 2, 1) * prefixInput.count;
			});
		}
		else {
			inputEscape(o.e.fullIdentifier);
		}
	},
	'<pageup>': function (c, t) {
		return this['\u0002'].apply(this, arguments);
	},
	// scroll down (height of screen - 2) lines
	'\u0006'/*^F*/: function (c, t, o) {
		if (prefixInput.isEmptyOperation) {
			return scrollView(c, t, function (v) {
				return Math.max(parseInt(v.lines - 2), 1) * prefixInput.count;
			});
		}
		else {
			inputEscape(o.e.fullIdentifier);
		}
	},
	'<pagedown>': function (c, t) {
		return this['\u0006'].apply(this, arguments);
	},
	// z: screen adjustment
	//   z<CR> (top of the screen)
	//   z.    (center of the screen)
	//   zz
	//   z-    (bottom of the screen)
	z: {
		'command': function (c, t, o) {
			if (prefixInput.isEmptyOperation) {
				prefixInput.operation = c;
				inputModeSub = 'wait-a-letter';
				requestShowPrefixInput(_('{0}: screen adjustment', o.e.fullIdentifier));
			}
			else {
				inputEscape(o.e.fullIdentifier);
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
			var current = t.rowNodes(line).offsetTop;
			var n = new Position(line, 0);

			if (prefixInput.isCountSpecified) {
				marks.set('\'', t.selectionStart);
			}
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

			default:
				requestRegisterNotice(_('Unknown adjust command.'));
				break;
			}
		}
	},

	/*
	 * special key
	 */

	'\u0009'/*tab*/: function (c, t, opts) {
		if (extensionChannel && quickActivation) {
			extensionChannel.postMessage({
				type:'notify-to-parent',
				parentTabId:targetElement.parentTabId,
				payload:{type:'wasavi-focus-changed', direction:opts.e.shift ? -1 : 1}
			});
		}
	},

	/*
	 * edit commands
	 */

	x: function (c, t, o) {
		if (prefixInput.isEmptyOperation) {
			prefixInput.operation = c;
			requestSimpleCommandUpdate();
			return deleteChars(t, prefixInput.count, true);
		}
		else {
			inputEscape(o.e.fullIdentifier);
		}
	},
	'\u007f'/*delete*/: function (c, t) {
		return this.x.apply(this, arguments);
	},
	X: function (c, t, o) {
		if (prefixInput.isEmptyOperation) {
			prefixInput.operation = c;
			requestSimpleCommandUpdate();
			return deleteChars(t, prefixInput.count, false);
		}
		else {
			inputEscape(o.e.fullIdentifier);
		}
	},
	p: function (c, t, o) {
		if (prefixInput.isEmptyOperation) {
			prefixInput.operation = c;
			requestSimpleCommandUpdate();
			return paste(t, prefixInput.count, {
				isForward:true,
				register:prefixInput.register
			});
		}
		else {
			inputEscape(o.e.fullIdentifier);
		}
	},
	P: function (c, t, o) {
		if (prefixInput.isEmptyOperation) {
			prefixInput.operation = c;
			requestSimpleCommandUpdate();
			return paste(t, prefixInput.count, {
				register:prefixInput.register
			});
		}
		else {
			inputEscape(o.e.fullIdentifier);
		}
	},
	J: function (c, t, o) {
		if (prefixInput.isEmptyOperation && t.selectionStartRow + prefixInput.count <= t.rowLength - 1) {
			prefixInput.operation = c;
			requestSimpleCommandUpdate();
			return joinLines(t, prefixInput.count);
		}
		else {
			inputEscape(o.e.fullIdentifier);
		}
	},
	'.': function (c, t, o) {
		// . command repeats the last
		// !, <, >, A, C, D, I, J, O, P, R, S, X, Y,
		//          a, c, d, i, o, p, r, s,    x, y,
		// or ~ command.
		if (prefixInput.isEmptyOperation) {
			if (lastSimpleCommand.length) {
				if (prefixInput.isCountSpecified) {
					var p = new PrefixInput(lastSimpleCommand);
					lastSimpleCommand =
						p.register +
						prefixInput.count +
						p.operation +
						p.motion +
						p.trailer;
				}
				executeViCommand(lastSimpleCommand);
				lastSimpleCommand = lastSimpleCommand.replace(
					/^(")([1-8])/, function ($0, $1, $2) {return ($1 || '') + (parseInt($2, 10) + 1);});
			}
			return true;
		}
		else {
			inputEscape(o.e.fullIdentifier);
		}
	},
	u: function (c, t, o) {
		if (prefixInput.isEmptyOperation) {
			var result = editLogger.undo();
			if (result === false) {
				requestShowMessage(requestRegisterNotice(_('No undo item.')));
			}
			else {
				requestShowMessage(
					_('{0} {operation:0} have reverted.', result));
				return true;
			}
		}
		else {
			inputEscape(o.e.fullIdentifier);
		}
	},
	'\u0012'/*^R*/: function (c, t, o) {
		if (prefixInput.isEmptyOperation) {
			var result = editLogger.redo();
			if (result === false) {
				requestShowMessage(requestRegisterNotice(_('No redo item.')));
			}
			else {
				requestShowMessage(
					_('{0} {operation:0} have executed again.', result));
				return true;
			}
		}
		else {
			inputEscape(o.e.fullIdentifier);
		}
	},
	U: null,
	'~': function (c, t, o) {
		if (prefixInput.isEmptyOperation && !t.selected) {
			prefixInput.operation = c;
			requestSimpleCommandUpdate();
			return toggleCase(t, prefixInput.count);
		}
		else {
			inputEscape(o.e.fullIdentifier);
		}
	},
	// clear screen
	'\u000c'/*^L*/: function (c, t, o) {
		if (prefixInput.isEmptyOperation) {
			$(CONTAINER_ID).style.display = 'none';
			setTimeout(function () {$(CONTAINER_ID).style.display = '';}, 100);
		}
		else {
			inputEscape(o.e.fullIdentifier);
		}
	},
	// display file information
	'\u0007'/*^G*/: function (c, t, o) {
		if (prefixInput.isEmptyOperation) {
			requestShowMessage(getFileInfo(t));
		}
		else {
			inputEscape(o.e.fullIdentifier);
		}
	},
	// marks
	m: {
		'command': function (c, t, o) {
			if (prefixInput.isEmptyOperation) {
				prefixInput.operation = c;
				inputModeSub = 'wait-a-letter';
				requestShowPrefixInput(_('{0}: mark', o.e.fullIdentifier));
			}
			else {
				inputEscape(o.e.fullIdentifier);
			}
		},
		'wait-a-letter': function (c, t) {
			prefixInput.trailer = c;
			if (!marks.isValidName(c)) {
				requestRegisterNotice(_('Invalid mark name.'));
			}
			marks.set(c, t.selectionStart);
			return true;
		}
	},
	// execute register contents as vi command
	'@': {
		'command': function (c, t, o) {
			if (prefixInput.isEmptyOperation) {
				inputModeSub = 'wait-a-letter';
				prefixInput.operation = c;
				requestShowPrefixInput(_('{0}: register (a-z,A-Z,1-9)', o.e.fullIdentifier));
			}
			else {
				inputEscape(o.e.fullIdentifier);
			}
		},
		'wait-a-letter': function (c, t) {
			if (!registers.isReadable(c)) {
				requestShowMessage(_('Invalid register name: {0}', c), true);
				return inputEscape();
			}
			if (!registers.exists(c)) {
				requestShowMessage(_('Register {0} is not exist.', c), true);
				return inputEscape();
			}
			var command = registers.get(c).data;
			command = command.replace(/^\n+|\n+$/g, '');
			if (command == '') {
				requestShowMessage(_('Register {0} is empty.', c), true);
				return inputEscape();
			}
			prefixInput.trailer = c;
			if (prefixInput.isCountSpecified) {
				var p = new PrefixInput(command);
				command =
					p.register +
					prefixInput.count +
					p.operation +
					p.motion +
					p.trailer;
			}
			executeViCommand(command);
			registers.set('@', command);
			return true;
		}
	},
	r: {
		'command': function (c, t, o) {
			if (prefixInput.isEmptyOperation) {
				prefixInput.operation = c;
				inputModeSub = 'wait-a-letter';
				requestShowPrefixInput(_('{0}: replace a char', o.e.fullIdentifier));
			}
			else {
				inputEscape(o.e.fullIdentifier);
			}
		},
		'wait-a-letter': function (c, t) {
			if (c != '\u001b') {
				motionReplaceOne(c, t, prefixInput.count);
				requestSimpleCommandUpdate();
			}
			return true;
		}
	},
	a: {
		'command': function (c, t, o) {
			if (prefixInput.isEmptyOperation) {
				requestSimpleCommandUpdate();
				editLogger.open('edit-wrapper');
				return startEdit(c, t, {
					isAppend:c == 'a',
					repeatCount:prefixInput.count});
			}
			else {
				prefixInput.motion = c;
				inputModeSub = 'wait-a-letter';
				requestShowPrefixInput(_('{0}: range symbol', o.e.fullIdentifier));
			}
		},
		'wait-a-letter': function (c, t, o) {
			var result = searchUtils.dispatchRangeSymbol(
				prefixInput.count, c, prefixInput.motion == 'a');
			if (result) {
				prefixInput.appendMotion(c);
			}
			else {
				inputEscape(o.e.fullIdentifier);
			}
			return result;
		}
	},
	A: function (c, t, o) {
		if (prefixInput.isEmptyOperation) {
			requestSimpleCommandUpdate();
			editLogger.open('edit-wrapper');
			return startEdit(c, t, {
				isAppend:c == 'A',
				isAlter:true,
				repeatCount:prefixInput.count});
		}
		else {
			inputEscape(o.e.fullIdentifier);
		}
	},
	i: {
		'command': function (c, t, o) {
			return this.a.command.apply(this, arguments);
		},
		'wait-a-letter': function () {
			return this.a['wait-a-letter'].apply(this, arguments);
		}
	},
	I: function (c, t, o) {
		return this.A.apply(this, arguments);
	},
	o: function (c, t, o) {
		if (prefixInput.isEmptyOperation) {
			requestSimpleCommandUpdate();
			return openLine(c, t, c == 'o');
		}
		else {
			inputEscape(o.e.fullIdentifier);
		}
	},
	O: function (c, t, o) {
		return this.o.apply(this, arguments);
	},
	R: function (c, t, o) {
		if (prefixInput.isEmptyOperation && !t.selected) {
			requestInputMode('edit-overwrite');
			cursor.update({type:'edit-overwrite'});
			config.vars.showmode && requestShowMessage(_('--OVERWRITE--'), false, false, true);
			prefixInput.operation = c;
			prefixInput.isLocked = true;
			editedString = editedStringCurrent = editedStringSuffix = '';
			overwroteString = false;
			editStartPosition = t.selectionStart;
			editRepeatCount = prefixInput.count;
			editLogger.open('edit-wrapper');
			requestSimpleCommandUpdate();
		}
		else {
			inputEscape(o.e.fullIdentifier);
		}
	},
	// equivalents to :& (repeat last executed :s)
	'&': function (c, t, o) {
		if (prefixInput.isEmptyOperation) {
			var range = [];
			range.push(t.selectionStartRow + 1);
			range.push(Math.min(range[0] + prefixInput.count - 1, t.rowLength));
			var result = executeExCommand(t, range.join(',') + '&');
			typeof result == 'string' && requestShowMessage(result, true);
			return true;
		}
		else {
			inputEscape(o.e.fullIdentifier);
		}
	},
	// S: substitute text for whole lines (equivalents to cc)
	S: function (c, t, o) {
		if (prefixInput.isEmptyOperation) {
			prefixInput.operation = c;
			isVerticalMotion = true;
			return this.c['@op'].call(this, c, t);
		}
		else {
			inputEscape(o.e.fullIdentifier);
		}
	},
	// s: substitute characters
	s: function (c, t, o) {
		if (prefixInput.isEmptyOperation) {
			editLogger.open('substitute');
			deleteChars(t, prefixInput.count, true);
			requestSimpleCommandUpdate();
			return startEdit(c, t);
		}
		else {
			inputEscape(o.e.fullIdentifier);
		}
	},
	// equivalents to :x
	//   ZZ
	Z: {
		'command': function (c, t, o) {
			if (prefixInput.isEmptyOperation) {
				prefixInput.operation = c;
				inputModeSub = 'wait-a-letter';
				requestShowPrefixInput();
			}
			else {
				inputEscape(o.e.fullIdentifier);
			}
		},
		'wait-a-letter': function (c, t) {
			if (c == prefixInput.operation) {
				var result = executeExCommand(t, 'x');
				typeof result == 'string' && requestShowMessage(result, true);
				return true;
			}
			else {
				return inputEscape(prefixInput.operation);
			}
		},
		'@op': function (c, t) {
			prefixInput.appendOperation(c);
		}
	},
	':': {
		'command': function (c, t, o) {
			if (prefixInput.isEmptyOperation) {
				prefixInput.operation = c;
				lineInputHistories.defaultName = ':';
				requestInputMode('line-input', '', config.vars.prompt ? c : '');
			}
			else {
				inputEscape(o.e.fullIdentifier);
			}
		},
		'line-input': function (c, t) {
			prefixInput.trailer = c;
			if (!exCommandExecutor.onFinish) {
				exCommandExecutor.onFinish = function (executor) {
					executor.lastError && requestShowMessage(executor.lastError, true);
					registers.set(':', executor.source);
					lineInputHistories.push(executor.source);
				};
			}
			var result = executeExCommand(t, c, true);
			if (typeof result == 'string') {
				requestShowMessage(result, true);
				return true;
			}
			else {
				return result;
			}
		}
	}



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
		logEditing(t, true);
		deleteChars(t, 1, false, true);
	},
	'\u007f'/*delete*/: function (c, t) {
		logEditing(t, true);
		deleteChars(t, 1, true, true);
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
		'edit': function (c, t, o) {
			inputModeSub = 'wait-a-letter';
			requestShowPrefixInput(_('{0}: literal input', o.e.fullIdentifier));
		},
		'edit-overwrite': function (c, t, o) {
			inputModeSub = 'wait-a-letter';
			requestShowPrefixInput(_('{0}: literal input', o.e.fullIdentifier));
		},
		'wait-a-letter': function (c, t) {
			var code = c.charCodeAt(0);
			if (code == 0x0a) {
				this['\u000d'].apply(this, arguments);
			}
			else {
				if (code >= 0x00 && code != 0x09 && code <= 0x1f || code == 0x7f) {
					c = toVisibleControl(code);
				}
				(inputMode == 'edit' ? insert : overwrite)(t, c);
				cursor.ensureVisible();
				cursor.update();
			}
			requestShowPrefixInput('');
		}
	},

	'<left>': function (c, t) {
		logEditing(t);
		motionLeft(c, t, 1);
	},
	'<up>': function (c, t) {
		logEditing(t);
		motionUp(c, t, 1);
	},
	'<right>': function (c, t) {
		logEditing(t);
		motionRight(c, t, 1);
	},
	'<down>': function (c, t) {
		logEditing(t);
		motionDown(c, t, 1);
	},
	'<home>': function (c, t) {
		logEditing(t);
		motionLineStart(c, t, false);
	},
	'<end>': function (c, t) {
		logEditing(t);
		motionLineEnd(c, t);
	},
	'<pageup>': function (c, t) {
		logEditing(t);
		scrollView(c, t, function (v) {
			return -(Math.max(parseInt(v.lines - 2), 1));
		});
	},
	'<pagedown>': function (c, t) {
		logEditing(t);
		return scrollView(c, t, function (v) {
			return Math.max(parseInt(v.lines - 2), 1);
		});
	}
};

var lineInputEditMap = {
	'\u0001'/*^A*/: function (c, t) {
		t.selectionStart = t.selectionEnd = 0;
	},
	'\u0002'/*^B*/: function (c, t) {
		t.selectionStart = t.selectionEnd = Math.max(0, t.selectionStart - 1);
	},
	'\u0005'/*^E*/: function (c, t) {
		t.selectionStart = t.selectionEnd = t.value.length;
	},
	'\u0006'/*^F*/: function (c, t) {
		t.selectionStart = t.selectionEnd = Math.min(t.value.length, t.selectionEnd + 1);
	},
	'\u0008'/*^H, backspace*/: function (c, t) {
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
	'\u0009'/*^I, tab*/: function (c, t) {
		// TODO: some completion?
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
			requestRegisterNotice(_('Tail of history.'));
		}
		else {
			var line = lineInputHistories.next();
			if (line == undefined) {
				line = dataset(t, 'wasaviLineInputCurrent');
			}
			if (line == undefined) {
				requestRegisterNotice(_('Invalid history item.'));
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
			dataset(t, 'wasaviLineInputCurrent', t.value);
		}
		var line = lineInputHistories.prev();
		if (line == undefined) {
			requestRegisterNotice(_('Top of history.'));
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
	},
	'<left>': function () {
		this['\u0002'].apply(this, arguments);
	},
	'<right>': function (c, t) {
		this['\u0005'].apply(this, arguments);
	},
	'<up>': function () {
		this['\u0010'].apply(this, arguments);
	},
	'<down>': function () {
		this['\u000e'].apply(this, arguments);
	},
	'<home>': function () {
		this['\u0001'].apply(this, arguments);
	},
	'<end>': function () {
		this['\u0005'].apply(this, arguments);
	}
};

/*
 * event handlers {{{1
 * ----------------
 */

// window
function handleWindowFocus (e) {
	handleCoverClick(e);
}
function handleWindowBlur (e) {
	if (quickActivation) {
		uninstall(getEditorCore(), true, true);
	}
	else {
		cursor.update({focused:false});
	}
}
function handleWindowResize (e) {
	function relocate () {
		if (targetElement) {
			targetElement.rect.width =
				document.documentElement.clientWidth;
			targetElement.rect.height =
				document.documentElement.clientHeight -
				(isStandAlone ? 0 : $('wasavi_footer').offsetHeight);
			setGeometory();
		}
		resizeHandlerInvokeTimer = null;
	}
	if (isStandAlone) {
		if (!resizeHandlerInvokeTimer) {
			resizeHandlerInvokeTimer = setTimeout(relocate, 100);
		}
	}
	else {
		relocate();
	}
}

// editor (document)
function handleKeydown2 (e) {
	if (scroller.running || exCommandExecutor.running) {
		keyManager.push(e);
		testMode && fireEvent('notify-keydown', {
			keyCode:e.code,
			key:e.fullIdentifier,
			eventType:'busy now.'
		});
		return;
	}
	if (cursor.inComposition) {
		return;
	}
	isInteractive = true;
	(extensionChannel && prefixInput.toString() == '"*' ? extensionChannel.getClipboard : $call)
		.call(extensionChannel, function () {
			mapManager.process(e.code, function (code) {
				testMode && fireEvent('notify-keydown', {
					keyCode:e.code,
					key:e.fullIdentifier,
					eventType:''
				});
				processInput(code, e);
			});
		});
}
function handleInput (e) {
	processInputSupplement(e);
}
function handleMousedown (e) {}
function handleMouseup (e) {}
function handleScroll (e) {}

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
		$('wasavi_focus_holder').focus();
		break;
	case 'line-input':
		cursor.update({focused:false, visible:!backlog.visible});
		$(LINE_INPUT_ID).focus();
		break;
	}
	if (extensionChannel) {
		extensionChannel.postMessage({
			type:'notify-to-parent',
			parentTabId:targetElement.parentTabId,
			payload:{type:'wasavi-focus-me'}
		});
	}
}
function handleCoverMousewheel (e) {
	e.preventDefault();
	e.stopPropagation();
	e.returnValue = false;
	switch (state) {
	case 'normal':
		switch (inputMode) {
		case 'command':
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
		break;
	}
}

// frame channel
function handleExtensionChannelMessage (req) {
	if (!req) return;

	var t = getEditorCore();
	switch (req.type) {
	case 'relocate':
		targetElement.rect = req.rect;
		setGeometory();
		break;
	case 'authorize-response':
		if (req.error) {
			requestShowMessage(req.error, true, false);
			exCommandExecutor.stop();
			break;
		}
		showMessage(_('Obtaining access rights ({0})...', req.phase || '-'));
		break;
	case 'fileio-write-response':
		if (req.error) {
			showMessage(req.error, true, false);
			//exCommandExecutor.stop();
			break;
		}
		switch (req.state) {
		case 'buffered':
			showMessage(_('Buffered: {0}', fileName));
			break;
		case 'writing':
			showMessage(_('Writing ({0}%)', req.progress.toFixed(2)));
			break;
		case 'complete':
			showMessage(_('Written: {0}', getFileIoResultInfo(t, req.meta.charLength)));
			break;
		}
		//exCommandExecutor.runAsyncNext();
		break;
	case 'fileio-read-response':
		if (req.error) {
			showMessage(req.error, true, false);
			exCommandExecutor.stop();
			break;
		}
		switch (req.state) {
		case 'reading':
			showMessage(_('Reading ({0}%)', req.progress.toFixed(2)));
			break;
		case 'complete':
			var read = exCommandExecutor.lastCommandObj.clone();
			read.handler = function (t, a) {
				switch (this.name) {
				case 'read':
					return ExCommand.read(t, a, req.content, req.meta);
				case 'edit':
					return ExCommand.edit(t, a, req.content, req.meta);
				}
				return _('Invalid read handler.');
			};
			exCommandExecutor.runAsyncNext(read, exCommandExecutor.lastCommandArg);
			break;
		}
	}
}

/*
 * external interface {{{1
 * ----------------
 */

global.Wasavi = new function () {
	function getRunning () {
		return !!targetElement;
	}
	function ensureRunning () {
		if (!getRunning()) {throw new Error('wasavi is not running');}
	}
	return {
		/*
		 * properties
		 */

		get version () {
			return VERSION;
		},
		get running () {
			return getRunning();
		},
		get vars () {
			return config.vars;
		},
		get varData () {
			return config.dumpData();
		},
		get state () {
			ensureRunning();
			return state;
		},
		get inputMode () {
			ensureRunning();
			return inputMode;
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
		get position () {
			ensureRunning();
			return getEditorCore().selectionStart;
		},
		get positionTop () {
			ensureRunning();
			return new Position(getCurrentViewPositionIndices(getEditorCore()).top, 0);
		},
		get value () {
			ensureRunning();
			return getEditorCore().value;
		},
		get rowLength () {
			ensureRunning();
			return getEditorCore().elm.childNodes.length;
		},
		get lastMessage () {
			return lastMessage;
		},
		get lastSimpleCommand () {
			ensureRunning();
			return lastSimpleCommand;
		},

		/*
		 * methods
		 */

		run: function (width, height) {
			!getRunning() && install({
				id:'wasavi',
				nodeName:'textarea',
				value:'',
				selectionStart:0,
				selectionEnd:0,
				scrollTop:0,
				scrollLeft:0,
				readOnly:false,
				type:'textarea',
				rect:{
					width:width || document.documentElement.clientWidth,
					height:height || document.documentElement.clientHeight
				},
				fontStyle:'normal normal normal medium/1 "Consolas"',
				borderStyle:'',
				paddingStyle:'0',
				dataset:{},
				getAttribute: function (name) {return this.dataset[name];},
				setAttribute: function (name, value) {this.dataset[name] = value;}
			});
		},
		marks: function (name) {
			ensureRunning();
			return marks.get(name);
		},
		registers: function (name) {
			if (arguments.length) {
				if (!registers.isReadable(name)) {
					return;
				}
				if (!registers.exists(name)) {
					return;
				}
				return toNativeControl(registers.get(name).data);
			}
			else {
				return registers.dump();
			}
		}
	};
};

/*
 * startup {{{1
 * ----------------
 */

devMode && console.log(
	'wasavi.js (' + VERSION_DESC + '):' +
	'\n\trunning on ' + window.location.href.replace(/[?#].*$/, ''));

})(this);

// vim:set ts=4 sw=4 fenc=UTF-8 ff=unix ft=javascript fdm=marker :
