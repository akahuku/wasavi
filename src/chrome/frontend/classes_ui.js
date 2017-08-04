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

Wasavi.Theme = function (app) {
	var container;
	var fontStyle;
	var lineHeight;
	var useStripe;
	var currentColorSetName;
	var colors = {
		statusHue:-1,
		background:'',
		overTextMarkerFg:'',
		warnedStatusFg:'', warnedStatusBg:'',
		invertFg:'', invertBg:'',
		blurFg:'', blurBg:'',

		rowBgOdd:['#wasavi_editor>div:nth-child(4n+3)', ''],
		editCursorFg:['#wasavi_edit_cursor', ''],
		statusFg:['#wasavi_footer', ''],
		lineNumberFg:['#wasavi_editor>div:before', ''],
		lineNumberBg:['#wasavi_editor>div:before', ''],
		rowFg:['#wasavi_editor>div', ''],
		rowBg:['#wasavi_editor>div', ''],
		highlightFg:['#wasavi_editor>div span.' + Wasavi.EMPHASIS_CLASS, ''],
		highlightBg:['#wasavi_editor>div span.' + Wasavi.EMPHASIS_CLASS, ''],
		lineInputFg:['#wasavi_footer_input,#wasavi_footer_input_indicator', ''],
		lineInputBg:['#wasavi_footer_input,#wasavi_footer_input_indicator', ''],
		consoleFg:['#wasavi_console', ''],
		consoleBg:['#wasavi_console_container', ''],
		boundFg:['#wasavi_editor>div span.' + Wasavi.BOUND_CLASS, ''],
		boundBg:['#wasavi_editor>div span.' + Wasavi.BOUND_CLASS, '']
	};
	var colorSets = {
		solarized: {
			statusHue:'#eee8d5',
			background:'#fdf6e3',
			overTextMarkerFg:'#93a1a1',
			warnedStatusFg:'#fdf6e3', warnedStatusBg:'#dc322f',
			invertFg:'#fdf6e3', invertBg:'#657b83',
			blurFg:'#fdf6e3', blurBg:'#eee8d5',

			rowBgOdd:'#fdf6e3',
			editCursorFg:'#657b83',
			statusFg:'#586e75',
			lineNumberFg:'#93a1a1', lineNumberBg:'#eee8d5',
			rowFg:'#657b83', rowBg:'#fdf6e3',
			highlightFg:'#fdf6e3', highlightBg:'#93a1a1',
			lineInputFg:'#fdf6e3', lineInputBg:'rgba(0,0,0,0.5)',
			consoleFg:'#fdf6e3', consoleBg:'rgba(0,0,0,0.8)',
			boundFg:'#fdf6e3', boundBg:'#93a1a1'
		},
		solarized_dark: {
			statusHue:'#073642',
			background:'#002b36',
			overTextMarkerFg:'#586e75',
			warnedStatusFg:'#fdf6e3', warnedStatusBg:'#dc322f',
			invertFg:'#002b36', invertBg:'#839496',
			blurFg:'#002b36', blurBg:'#eee8d5',

			rowBgOdd:'#002b36',
			editCursorFg:'#839496',
			statusFg:'#586e75',
			lineNumberFg:'#586e75', lineNumberBg:'#eee8d5',
			rowFg:'#839496', rowBg:'#002b36',
			highlightFg:'#002b36', highlightBg:'#586e75',
			lineInputFg:'#002b36', lineInputBg:'rgba(255,255,255,0.5)',
			consoleFg:'#002b36', consoleBg:'rgba(159,205,74,0.9)',
			boundFg:'#002b36', boundBg:'#586e75'
		},
		blight: {
			statusHue:'#4f6881',
			background:'white',
			overTextMarkerFg:'#888',
			warnedStatusFg:'white', warnedStatusBg:'#f00',
			invertFg:'white', invertBg:'#333',
			blurFg:'white', blurBg:'gray',

			rowBgOdd:'#f3f6fa',
			editCursorFg:'black',
			statusFg:'white',
			lineNumberFg:'#888', lineNumberBg:'#fff',
			rowFg:'black', rowBg:'white',
			highlightFg:'highlighttext', highlightBg:'highlight',
			lineInputFg:'white', lineInputBg:'rgba(0,0,0,0.5)',
			consoleFg:'white', consoleBg:'rgba(0,0,0,0.8)',
			boundFg:'white', boundBg:'#8495a7'
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
			consoleFg:'black', consoleBg:'rgba(159,205,74,0.9)',
			boundFg:'black', boundBg:'#f5b338'
		},
		// contributed by @biell
		matrix: {
			statusHue:'#2ba',
			background:'#050505',
			overTextMarkerFg:'#2ba',
			warnedStatusFg:'#fff', warnedStatusBg:'#e30',
			invertFg:'#000', invertBg:'#1e4',
			blurFg:'#0f0', blurBg:'#050505',

			rowBgOdd:'#0a0a0a',
			editCursorFg:'#2ba',
			statusFg:'#000',
			lineNumberFg:'#2ba', lineNumberBg:'#080808',
			rowFg:'#0f0', rowBg:'#050505',
			highlightFg:'highlight', highlightBg:'highlighttext',
			lineInputFg:'#0f0', lineInputBg:'rgba(0,0,0,0.9)',
			consoleFg:'#0f0', consoleBg:'#111',
			boundFg:'#0f0', boundBg:'#233'
		}
	};

	function getCSSRules () {
		var pieces = {};
		for (var i in colors) {
			if (!(colors[i] instanceof Array)) continue;
			if (i == 'rowBgOdd' && !useStripe) continue;
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
			ctx.font = fontStyle;
			canvas.width = ctx.measureText('~').width;
			canvas.height = window.screen.height;

			ctx.font = fontStyle;
			ctx.fillStyle = backcolor;
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			ctx.fillStyle = forecolor;
			ctx.textBaseline = 'top';
			ctx.textAlign = 'left';

			for (var i = 0, goal = canvas.height; i < goal; i += lineHeight) {
				ctx.fillText('~', 0, i);
			}
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
			return 'linear-gradient(top,hsl(' + key + ',100%,33%) 0%,#000 100%);';
		case 'string':
			return key;
		}
		return '#888';
	}
	function doSelect (colorSet) {
		var newColors = {};
		for (var i in colors) {
			if (!(i in colorSet)) return false;
			newColors[i] = colors[i] instanceof Array ?
				[colors[i][0], colorSet[i]] : colorSet[i];
		}
		colors = newColors;
		return true;
	}
	function select (colorSetName) {
		if (!colorSetName || colorSetName == '' || !(colorSetName in colorSets)) {
			colorSetName = 'blight';
		}
		if (colorSetName == currentColorSetName) {
			return;
		}
		currentColorSetName = colorSetName;
		return doSelect(colorSets[colorSetName]);
	}
	function update () {
		if (!container || !colors || colors.background == '') return;

		var styles = getCSSRules();

		var otm = getOverTextMarker(colors.overTextMarkerFg, colors.background);
		styles.push(
			'#wasavi_editor{',
			'background:' + colors.background + ' url(' + otm + ') left top no-repeat;',
			'}');

		var statuslineBackground = getStatuslineBackground(colors.statusHue);
		styles.push(
			'#wasavi_footer_status_container,',
			'#wasavi_footer_input_container{',
			'background:' + statuslineBackground + ';',
			'}');

		var node = getStyleElement();
		emptyNodeContents(node);
		node.appendChild(document.createTextNode(styles.join('\n')));

		this.colors = getMirror();
	}
	function dispose () {
		app = container = null;
	}

	this.colors = getMirror();

	publish(this,
		select, update, dispose,
		{
			container:[function () {}, function (v) {container = v}],
			fontStyle:[function () {}, function (v) {fontStyle = v}],
			lineHeight:[function () {}, function (v) {lineHeight = v}],
			useStripe:[function () {}, function (v) {useStripe = v}],
			colorSets:function () {return Object.keys(colorSets)}
		}
	);
};

Wasavi.Bell = function (app) {
	function play (key, forcePlay) {
		if (!forcePlay && app.config.vars.visualbell) {
			let cover = $('wasavi_cover');
			cover.classList.add('visualbell');
			cover.addEventListener('animationend', function animationend (e) {
				e.target.removeEventListener(e.type, animationend);
				e.target.classList.remove('visualbell');
			});
		}
		else {
			app.extensionChannel.postMessage({
				type: 'play-sound',
				key: key || 'beep',
				volume: app.config.vars.bellvolume
			});
		}
	}

	publish(this, play);
};

Wasavi.CursorUI = function (app, comCursor, comCursorLine, comCursorColumn, comFocusHolder, input) {
	var buffer = app.buffer;
	var locked = false;
	var focused = false;
	var visible = false;
	var wrapper = null;
	var wrappers = {};

	/*constructor*/function CursorBase () {
	}
	CursorBase.prototype = {
		reset: function () {},
		hide: function () {},
		show: function () {},
		lostFocus: function () {},
		windup: function () {},
		compositionUpdate: function () {},
		compositionComplete: function () {},
		dispose: function () {}
	};

	/*constructor*/function CommandCursor () {
		var cursorBlinkTimer;

		function getCursorSpan () {
			var spans = buffer.getSpans(Wasavi.CURSOR_SPAN_CLASS);
			return spans.length ? spans[0] : null;
		}
		function startBlink () {
			stopBlink();
			if (app.config.vars.cursorblink) {
				cursorBlinkTimer = setInterval(function () {
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
							span.style.color = app.theme.colors.invertFg;
							span.style.backgroundColor = app.theme.colors.invertBg;
							span.setAttribute('data-blink-active', '1');
						}
					}
					else {
						var s = document.defaultView.getComputedStyle(comCursor, '');
						comCursor.style.visibility = s.visibility == 'visible' ? 'hidden' : 'visible';
					}
				}, 500);
			}
		}
		function stopBlink () {
			cursorBlinkTimer && clearInterval(cursorBlinkTimer);
			cursorBlinkTimer = null;
		}
		function locate () {
			var ch = buffer.charAt(buffer.selectionStart);
			var cursorLine = 0;
			var cursorColumn = 0;
			if (ch != '' && /[^\u0000-\u001f\u007f]/.test(ch)) {
				comCursor.style.display = 'none';

				var span = getCursorSpan();
				if (!span) {
					var clusters = buffer.getGraphemeClusters();
					span = buffer.emphasis(
						undefined,
						clusters.clusterAt(clusters.getClusterIndexFromUTF16Index(buffer.selectionStartCol)).length,
						Wasavi.CURSOR_SPAN_CLASS)[0];
				}

				span.style.color = app.theme.colors.invertFg;
				span.style.backgroundColor = app.theme.colors.invertBg;
				span.setAttribute('data-blink-active', '1');

				var coord = span.getBoundingClientRect();
				cursorLine = coord.bottom;
				cursorColumn = coord.left;
			}
			else {
				buffer.unEmphasis(Wasavi.CURSOR_SPAN_CLASS);
				comCursor.style.display = 'block';
				comCursor.style.visibility = 'visible';
				comCursor.childNodes[0].textContent = ' ';

				var coord = getCommandCursorCoord();
				comCursor.style.left = (coord.left - buffer.elm.scrollLeft) + 'px';
				comCursor.style.top = (coord.top - buffer.elm.scrollTop) + 'px';
				comCursor.style.height = app.lineHeight + 'px';
				comCursor.style.color = app.theme.colors.invertFg;
				comCursor.style.backgroundColor = app.theme.colors.invertBg;

				cursorLine = coord.bottom - buffer.elm.scrollTop;
				cursorColumn = coord.left - buffer.elm.scrollLeft;
			}

			if (app.config.vars.cursorline && app.inputMode == 'command') {
				comCursorLine.style.display = '';
				comCursorLine.style.top = cursorLine + 'px';
			}
			else {
				comCursorLine.style.display = 'none';
			}

			if (app.config.vars.cursorcolumn && app.inputMode == 'command') {
				comCursorColumn.style.display = '';
				comCursorColumn.style.left = cursorColumn + 'px';
			}
			else {
				comCursorColumn.style.display = 'none';
			}

			buffer.adjustBackgroundImage();
			buffer.adjustLineNumber(app.config.vars.relativenumber);
			buffer.adjustWrapGuide(app.config.vars.textwidth, app.charWidth);
			buffer.updateActiveRow();
		}

		this.reset = function () {
			cursorBlinkTimer = undefined;
		};
		this.hide = function () {
			stopBlink();
			buffer.unEmphasis(Wasavi.CURSOR_SPAN_CLASS);
			comCursor.style.display =
			comCursorLine.style.display =
			comCursorColumn.style.display = 'none';
		};
		this.show = function () {
			if (app.backlog.visible) return;

			locate();
			comFocusHolder.focus();
			startBlink();
		};
		this.lostFocus = function () {
			if (app.backlog.visible) return;

			locate();
			stopBlink();
			var span = getCursorSpan();
			if (span) {
				span.style.color = app.theme.colors.blurFg;
				span.style.backgroundColor = app.theme.colors.blurBg;
			}
			else {
				comCursor.style.color = app.theme.colors.blurFg;
				comCursor.style.backgroundColor = app.theme.colors.blurBg;
			}
		};
		this.dispose = function () {
			stopBlink();
		};
		this.windup = this.hide;
	}
	CommandCursor.prototype = Object.create(CursorBase.prototype);
	CommandCursor.prototype.constructor = CursorBase;

	/*constructor*/function InputCursor () {
		this.hide = function () {
			window.getSelection().removeAllRanges();
			var n = buffer.selectionStart;
			var node = buffer.rowNodes(n);
			node.removeAttribute('contenteditable');
			node.blur();
		};
		this.show = function () {
			buffer.adjustBackgroundImage(app.lineHeight);
			buffer.adjustLineNumber();
			buffer.updateActiveRow();

			var n = buffer.selectionStart;
			var node = buffer.rowNodes(n);
			node.contentEditable = 'true';
			node.focus();
			app.keyManager.editable.setSelectionRange(node, n.col);
		};
	}
	InputCursor.prototype = Object.create(CursorBase.prototype);
	InputCursor.prototype.constructor = CursorBase;

	/*constructor*/function LineInputCursor () {
		this.show = function () {
			input.focus();
		};
	}
	LineInputCursor.prototype = Object.create(CursorBase.prototype);
	LineInputCursor.prototype.constructor = CursorBase;

	function getCommandCursorCoord () {
		var r = buffer.charRectAt(buffer.selectionStart);
		var result = {
			left:r.left + buffer.scrollLeft,
			top:r.top + buffer.scrollTop,
			right:(r.right == r.left ? r.left + app.charWidth : r.right) + buffer.scrollLeft,
			bottom:(r.bottom == r.top ? r.top + app.lineHeight : r.bottom) + buffer.scrollTop
		};
		return result;
	}
	function ensureVisible (smooth) {
		if (!buffer.selected) {
			var needFix1 = !app.low.isEditing();
			var needFix2 = !app.requestedState.inputMode || !app.low.isEditing(app.requestedState.inputMode.mode);
			if (needFix1 && needFix2) {
				var n = buffer.selectionStart;
				if (n.col > 0) {
					var clusters = buffer.getGraphemeClusters(n);
					if (n.col >= clusters.rawIndexAt(clusters.length)) {
						n.col = clusters.rawIndexAt(clusters.length - 1);
						buffer.setSelectionRange(n);
					}
				}
			}
		}

		buffer.adjustLineNumberClass(
			app.config.vars.number, app.config.vars.relativenumber);

		var caret = getCommandCursorCoord();
		var elm = buffer.elm;
		var viewBottom = elm.scrollTop + elm.clientHeight;

		if (caret.top < elm.scrollTop && caret.bottom <= viewBottom) {
			if (smooth) {
				app.scroller.run(caret.top);
			}
			else {
				buffer.scrollTop = caret.top;
			}
		}
		else if (caret.bottom > viewBottom && caret.top >= elm.scrollTop) {
			if (smooth) {
				app.scroller.run(caret.bottom - elm.clientHeight);
			}
			else {
				buffer.scrollTop = caret.bottom - elm.clientHeight;
			}
		}
	}
	function getTypeInfo (mode) {
		var type;
		var ctor;

		switch (mode) {
		default:
			type = 'command';
			ctor = CommandCursor;
			break;

		case 'edit':
		case 'overwrite':
			type = 'input';
			ctor = InputCursor;
			break;

		case 'line_input':
			type = 'line_input';
			ctor = LineInputCursor;
			break;

		case 'ex_s_prompt':
			type = 'null';
			ctor = CursorBase;
			break;
		}

		return {
			type: type,
			ctor: ctor
		};
	}

	function update (opts) {
		if (locked) return;

		var typeInfo;

		if (opts) {
			if ('visible' in opts) {
				visible = opts.visible;
			}
			if ('focused' in opts) {
				focused = opts.focused;
			}
			if ('type' in opts) {
				typeInfo = getTypeInfo(opts.type);
				if (!wrapper || typeInfo.type != wrapper.type) {
					wrapper && wrapper.hide();
				}
				else {
					typeInfo = undefined;
				}
			}
		}

		if (typeInfo) {
			wrapper = wrappers[typeInfo.type]
				|| (wrappers[typeInfo.type] = new typeInfo.ctor);
			wrapper.type = typeInfo.type
			wrapper.reset();
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
		wrapper.compositionUpdate(e.data);
	}
	function handleCompositionUpdate (e) {
		wrapper.compositionUpdate(e.data);
	}
	function handleCompositionEnd (e) {
		setTimeout(function () {
			buffer.ensureNewline(buffer.selectionStart);
		}, 1);
		return wrapper.compositionComplete(e.data);
	}
	function setupEventHandlers (install) {
		var method = install ? 'addListener' : 'removeListener';
		app.keyManager[method]('compositionstart', handleCompositionStart);
		app.keyManager[method]('compositionupdate', handleCompositionUpdate);
		app.keyManager[method]('compositionend', handleCompositionEnd);
	}
	function windup () {
		wrapper.windup();
	}
	function dispose () {
		wrapper && wrapper.dispose();
		app = buffer = comCursor = wrapper = null;
	}

	publish(this,
		ensureVisible, update, setupEventHandlers, windup, dispose,
		{
			type:function () {return wrapper ? wrapper.type : null},
			focused:function () {return focused},
			visible:function () {return visible},
			commandCursor:function () {return comCursor},
			locked:[function () {return locked}, function (v) {locked = v}]
		}
	);
};

Wasavi.Scroller = function (app, cursor, modeLine) {
	let buffer = app.buffer;
	let running = false;
	let consumeMsecs = 250;
	let timerPrecision = 1;
	let lastRan = 0;
	let distance;
	let scrollTopStart;
	let scrollTopDest;
	let scrollTimer;

	function run (dest) {
		return new Promise(resolve => {
			if (!app.targetElement || !cursor || !modeLine) {
				resolve(true);
				return;
			}

			scrollTopStart = buffer.scrollTop;
			scrollTopDest = Math.max(0, dest);

			if (scrollTopStart == scrollTopDest || !app.config.vars.smooth || cursor.locked) {
				buffer.scrollTop = scrollTopDest;
				resolve(true);
				return;
			}

			distance = scrollTopDest - scrollTopStart;
			running = true;
			lastRan = Date.now();
			scrollTimer = setInterval(() => {
				let now = Date.now();
				let y = scrollTopStart + ((now - lastRan) / consumeMsecs) * distance;

				if (distance > 0 && y >= scrollTopDest
				||  distance < 0 && y <= scrollTopDest) {
					clearInterval(scrollTimer);
					scrollTimer = undefined;
					buffer.scrollTop = scrollTopDest;
					running = false;
					resolve(true);
				}
				else {
					buffer.scrollTop = Math.floor(y);
				}
			}, timerPrecision);
		});
	}

	function dispose () {
		app = buffer = cursor = modeLine = null;
	}

	publish(this,
		run, dispose,
		{
			running:function () {return running},
			consumeMsecs:[
				function () {return consumeMsecs},
				function (v) {consumeMsecs = v}
			],
			timerPrecision:[
				function () {return timerPrecision},
				function (v) {timerPrecision = v}
			]
		}
	);
};

Wasavi.Backlog = function (app, container, con) {
	var buffer = [];
	var charWidth;
	var charHeight;

	function append (line) {
		let el = con.appendChild(document.createElement('div'));
		el.className = 'backlog-row';

		if (line.emphasis) {
			let span = el.appendChild(document.createElement('span'));
			span.style.color = app.theme.colors.warnedStatusFg;
			span.style.backgroundColor = app.theme.colors.warnedStatusBg;
			span.textContent = line.text;
		}
		else {
			let components = line.text.split(/(\ue000(?:<[^>]+>|#\d{1,2}))/);
			components.forEach(component => {
				if (component.charAt(0) == '\ue000') {
					let span = el.appendChild(document.createElement('span'));
					span.className = 'special-key';
					span.style.backgroundColor = app.theme.colors.consoleFg;
					span.style.color = app.theme.colors.consoleBg;

					if (component.charAt(1) == '<') {
						span.textContent = component.substring(2, component.length - 1);
					}
					else {
						span.textContent = 'F' + component.substring(2);
					}
				}
				else {
					el.appendChild(document.createTextNode(component));
				}
			});
		}

		return el;
	}
	function ensureSetCharSize () {
		if (charWidth && charHeight) return;
		var span = con.appendChild(document.createElement('span'));
		try {
			span.textContent = '0';
			charWidth = span.offsetWidth;
			charHeight = span.offsetHeight;
		}
		finally {
			removeChild(span);
		}
	}

	function push (arg) {
		if (isArray(arg)) {
			arg.forEach(push);
		}
		else if (isObject(arg)) {
			if (!('text' in arg)) arg.text = '';
			buffer.push(arg);
		}
		else {
			buffer.push({text:'' + arg});
		}
	}
	function pushEmphasis (arg) {
		if (isArray(arg)) {
			arg.forEach(push);
		}
		else if (isObject(arg)) {
			if (!('text' in arg)) arg.text = '';
			arg.emphasis = true;
			buffer.push(arg);
		}
		else {
			buffer.push({text:'' + arg, emphasis:true});
		}
	}
	function show () {
		container.style.visibility = 'visible';
	}
	function hide () {
		container.style.visibility = 'hidden';
	}
	function clear () {
		buffer.length = 0;
	}
	function open (byLine) {
		var totalHeight = 0;
		var goalHeight = getRows() * charHeight;

		if (!getVisible()) {
			show();
			emptyNodeContents(con);
			var el = con.appendChild(document.createElement('div'));
			el.style.height = goalHeight + 'px';
		}

		while (buffer.length) {
			var line = buffer.shift();
			var el = append(line);

			if (totalHeight > 0
			&& (totalHeight + el.offsetHeight > goalHeight || byLine)) {
				buffer.unshift(line);
				removeChild(el);
				break;
			}
			else {
				app.lastMessage +=
					(app.lastMessage == '' || app.lastMessage.substr(-1) == '\n' ? '' : '\n') +
					toNativeControl(line.text);
				con.scrollTop = con.scrollHeight - con.clientHeight;
				totalHeight += el.offsetHeight;
			}
		}

		app.low.showMessageCore(
			buffer.length ? _('More...') :
							_('Press any key to continue, or enter more ex command:'),
			false, true, true);
	}
	function dispose () {
		app = container = con = null;
	}

	function getBuffer () {
		return buffer;
	}
	function getQueued () {
		return buffer.length > 0;
	}
	function getRows () {
		ensureSetCharSize();
		return Math.floor(con.offsetHeight / charHeight);
	}
	function getCols () {
		ensureSetCharSize();
		return Math.floor(con.offsetWidth / charWidth);
	}
	function getVisible () {
		return document.defaultView.getComputedStyle(container, '').visibility != 'hidden';
	}
	function getText () {
		return Array.prototype.map.call(
			con.getElementsByClassName('backlog-row'),
			function (o) {return o.textContent}
		)
		.join('\n');
	}

	publish(this,
		push, pushEmphasis, show, hide, clear, open, dispose,
		{
			buffer:getBuffer,
			queued:getQueued,
			rows:getRows,
			cols:getCols,
			visible:getVisible,
			text:getText
		}
	);
};

Wasavi.Notifier = function (app, container) {
	const delayIntervalMsecs = 500;
	const hideIntervalMsecs = 2000;
	var showTimer;
	var hideTimer;
	var registeredMessage;

	function register (message, intervalMsecs, delayMsecs) {
		registeredMessage = message;
		if (showTimer) return;
		showTimer = setTimeout(function () {
			showTimer = null;
			show(registeredMessage, intervalMsecs);
			registeredMessage = null;
		}, delayMsecs || delayIntervalMsecs);
	}
	function show (message, intervalMsecs) {
		hideTimer && clearTimeout(hideTimer);
		if (typeof message == 'function') {
			message(container);
		}
		else {
			container.textContent = message;
		}
		container.style.visibility = 'visible';
		hideTimer = setTimeout(function () {
			hideTimer = null;
			hide();
		}, intervalMsecs || hideIntervalMsecs);
	}
	function hide () {
		container.style.visibility = 'hidden';
		showTimer && clearTimeout(showTimer);
		hideTimer && clearTimeout(hideTimer);
		showTimer = hideTimer = null;
	}
	function dispose () {
		app = container = null;
	}

	publish(this, register, show, hide, dispose);
};

})(typeof global == 'object' ? global : window);

// vim:set ts=4 sw=4 fenc=UTF-8 ff=unix ft=javascript fdm=marker :
