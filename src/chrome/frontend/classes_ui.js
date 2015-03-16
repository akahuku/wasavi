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

'use strict';

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

		rowBgOdd:['#wasavi_editor>div:nth-child(odd)', ''],
		editCursorFg:['#wasavi_edit_cursor', ''],
		statusFg:['#wasavi_footer', ''],
		lineNumberFg:['#wasavi_editor.n>div:before', ''],
		lineNumberBg:['#wasavi_editor.n>div:before', ''],
		rowFg:['#wasavi_editor>div', ''],
		rowBg:['#wasavi_editor>div', ''],
		highlightFg:['#wasavi_editor>div span.' + EMPHASIS_CLASS, ''],
		highlightBg:['#wasavi_editor>div span.' + EMPHASIS_CLASS, ''],
		lineInputFg:['#wasavi_footer_input,#wasavi_footer_input_indicator', ''],
		lineInputBg:['#wasavi_footer_input,#wasavi_footer_input_indicator', ''],
		consoleFg:['#wasavi_console', ''],
		consoleBg:['#wasavi_console_container', ''],
		boundFg:['#wasavi_editor>div span.' + BOUND_CLASS, ''],
		boundBg:['#wasavi_editor>div span.' + BOUND_CLASS, '']
	};
	var colorSets = {
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
			consoleFg:'black', consoleBg:'rgba(159,205,74,0.8)',
			boundFg:'black', boundBg:'#f5b338'
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
			return CSS_PREFIX + 'linear-gradient(top,hsl(' + key + ',100%,33%) 0%,#000 100%);';
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
	function play (key) {
		app.extensionChannel.postMessage({
			type: 'play-sound',
			key: key || 'beep'
		});
	}

	publish(this, play);
};

Wasavi.CursorUI = function (app, comCursor, input, comFocusHolder) {
	var buffer = app.buffer;
	var cursorType = 'command';
	var locked = false;
	var focused = false;
	var visible = false;
	var wrapper = null;
	var wrappers = {};
	var fixed = document.defaultView.getComputedStyle($(CONTAINER_ID), '')
		.position == 'fixed';

	/*constructor*/function CommandWrapper () {
		var cursorBlinkTimer;

		function getCursorSpan () {
			var spans = buffer.getSpans(CURSOR_SPAN_CLASS);
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
					span.style.color = app.theme.colors.invertFg;
					span.style.backgroundColor = app.theme.colors.invertBg;
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
		function locate () {
			var ch = buffer.charAt(buffer.selectionStart);
			if (ch != '' && /[^\u0000-\u001f\u007f]/.test(ch)) {
				comCursor.style.display = 'none';
				var span = getCursorSpan() || buffer.emphasis(undefined, 1, CURSOR_SPAN_CLASS)[0];
				span.style.color = app.theme.colors.invertFg;
				span.style.backgroundColor = app.theme.colors.invertBg;
				span.setAttribute('data-blink-active', '1');
			}
			else {
				buffer.unEmphasis(CURSOR_SPAN_CLASS);
				comCursor.style.display = 'block';
				comCursor.style.visibility = 'visible';
				comCursor.childNodes[0].textContent = ' ';
				var coord = getCommandCursorCoord();
				coord.left -= fixed ? docScrollLeft() : 0;
				coord.top -= fixed ? docScrollTop() : 0;
				comCursor.style.left = (coord.left - buffer.elm.scrollLeft) + 'px';
				comCursor.style.top = (coord.top - buffer.elm.scrollTop) + 'px';
				comCursor.style.height = app.lineHeight + 'px';
				comCursor.style.color = app.theme.colors.invertFg;
				comCursor.style.backgroundColor = app.theme.colors.invertBg;
			}
			buffer.adjustBackgroundImage(app.lineHeight);
			buffer.adjustLineNumber(app.config.vars.relativenumber);
			buffer.adjustWrapGuide(app.config.vars.textwidth, app.charWidth);
			buffer.updateActiveRow();
		}

		this.reset = function () {
			cursorBlinkTimer = undefined;
		};
		this.hide = function () {
			stopBlink();
			buffer.unEmphasis(CURSOR_SPAN_CLASS);
			comCursor.style.display = 'none';
		};
		this.show = function () {
			locate();
			comFocusHolder.focus();
			startBlink();
		};
		this.lostFocus = function () {
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
		this.compositionUpdate =
		this.compositionComplete = function () {};
	}

	/*constructor*/function EditWrapper () {
		this.hide = function () {
			window.getSelection().removeAllRanges();
			var n = buffer.selectionStart;
			var node = buffer.rowNodes(n);
			node.removeAttribute('contenteditable');
			node.blur();
		};
		this.show = function () {
			buffer.adjustBackgroundImage(app.lineHeight);
			buffer.adjustLineNumber(app.config.vars.relativenumber);
			buffer.updateActiveRow();

			var n = buffer.selectionStart;
			var node = buffer.rowNodes(n);
			node.contentEditable = 'true';
			node.focus();
			app.keyManager.editable.setSelectionRange(node, n.col);
		};
		this.reset =
		this.compositionUpdate =
		this.compositionComplete =
		this.windup =
		this.lostFocus =
		this.dispose = function () {};
	}

	/*constructor*/function LineInputWrapper () {
		this.show = function () {
			input.focus();
		};
		this.reset =
		this.hide =
		this.windup =
		this.lostFocus =
		this.dispose =
		this.compositionUpdate =
		this.compositionComplete = function () {};
	}

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
					var fixed = false;
					var text = buffer.rows(n);
					if (n.col >= text.length) {
						n.col = text.length - 1;
						fixed = true;
					}
					fixed && buffer.setSelectionRange(n);
				}
			}
		}

		var lineNumberWidth = 0;
		if (app.config.vars.number) {
			lineNumberWidth = Math.min(6, (buffer.rowLength + '').length);
		}
		else if (app.config.vars.relativenumber) {
			lineNumberWidth = 2;
		}
		buffer.adjustLineNumberWidth(lineNumberWidth, app.config.vars.relativenumber);

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
				cursorType = 'command';
				wrapper = wrappers[cursorType]
					|| (wrappers[cursorType] = new CommandWrapper());
				break;

			case 'edit':
			case 'overwrite':
				cursorType = 'edit';
				wrapper = wrappers[cursorType]
					|| (wrappers[cursorType] = new EditWrapper());
				break;

			case 'line_input':
				cursorType = 'line_edit';
				wrapper = wrappers[cursorType]
					|| (wrappers[cursorType] = new LineInputWrapper());
				break;
			}
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
		var result = wrapper.compositionComplete(e.data);
		return result;
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
			type:function () {return cursorType},
			focused:function () {return focused},
			visible:function () {return visible},
			commandCursor:function () {return comCursor},
			locked:[function () {return locked}, function (v) {locked = v}]
		}
	);
};

Wasavi.Scroller = function (app, cursor, modeLine) {
	var buffer = app.buffer;
	var running = false;
	var consumeMsecs = 250;
	var timerPrecision = 1;
	var lastRan = 0;
	var distance;
	var scrollTopStart;
	var scrollTopDest;

	function run (dest, callback) {
		if (running || !app.targetElement || !cursor || !modeLine) {
			return;
		}
		if (dest < 0) {
			dest = 0;
		}
		scrollTopStart = buffer.scrollTop;
		scrollTopDest = dest;
		if (scrollTopStart == scrollTopDest || !app.config.vars.smooth || cursor.locked) {
			buffer.scrollTop = dest;
			app.low.notifyActivity('', '', 'scroller exit (no effect)');
			callback && callback();
			return;
		}
		distance = scrollTopDest - scrollTopStart;
		app.keyManager.lock();
		running = true;
		lastRan = +Date.now();
		(function doScroll () {
			var now = +Date.now();
			var y = scrollTopStart + ((now - lastRan) / consumeMsecs) * distance;

			if (!app.targetElement || !cursor || !modeLine) {
				app.low.notifyActivity('', '', 'scroller exit (illegal state)');
				app.low.notifyCommandComplete();
				running = false;
				app.keyManager.unlock();
				return;
			}

			if (distance > 0 && y >= scrollTopDest
			||  distance < 0 && y <= scrollTopDest) {
				buffer.scrollTop = scrollTopDest;
				callback && callback();
				cursor.ensureVisible();
				cursor.update({visible:true});
				modeLine.style.display == '' && app.low.showPrefixInput();
				app.low.notifyActivity('', '', 'scroller exit (scrolled)');
				app.low.notifyCommandComplete();
				running = false;
				app.keyManager.unlock();
			}
			else {
				buffer.scrollTop = parseInt(y);
				setTimeout(doScroll, timerPrecision);
			}
		})();
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

Wasavi.Backlog = function (app, container, con, scaler) {
	var buffer = [];

	function push (arg) {
		arg instanceof Array ?
			buffer.push.apply(buffer, arg) :
			buffer.push(arg);
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
	function write (byLine, preserveMessage) {
		if (!getVisible()) {
			show();
			con.value = multiply('\n', getRows());
		}

		var totalHeight = 0;
		var goalHeight = parseInt(con.clientHeight / scaler.offsetHeight) * scaler.offsetHeight;
		while (buffer.length) {
			if (con.value.length && con.value.substr(-1) != '\n') {
				con.value += '\n';
			}
			if (app.lastMessage.length && app.lastMessage.substr(-1) != '\n') {
				app.lastMessage += '\n';
			}
			var line = '';
			if (app.isInteractive) {
				line = buffer.shift();
			}
			else {
				line = buffer.join('\n');
				buffer.length = 0;
			}
			scaler.textContent = line;
			if (app.isInteractive && (totalHeight + scaler.offsetHeight > goalHeight || byLine)) {
				if (totalHeight == 0) {
					con.value += line;
					con.setSelectionRange(con.value.length, con.value.length);
					con.scrollTop = con.scrollHeight - con.clientHeight;
					app.lastMessage += toNativeControl(line);
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
				app.lastMessage += toNativeControl(line);
			}
		}

		if (!preserveMessage) {
			app.low.showMessage(
				buffer.length ? _('More...') :
								_('Press any key to continue, or enter more ex command:'),
				false, true, true);
		}
	}
	function dispose () {
		app = container = con = scaler = null;
	}

	function getBuffer () {
		return buffer;
	}
	function getQueued () {
		return buffer.length > 0;
	}
	function getRows () {
		scaler.textContent = '0';
		return Math.floor(con.offsetHeight / scaler.offsetHeight);
	}
	function getCols () {
		emptyNodeContents(scaler);
		var span = scaler.appendChild(document.createElement('span'));
		span.textContent = '0';
		return Math.floor(con.offsetWidth / span.offsetWidth);
	}
	function getVisible () {
		return document.defaultView.getComputedStyle(container, '').visibility != 'hidden';
	}

	publish(this,
		push, show, hide, clear, write, dispose,
		{
			buffer:getBuffer,
			queued:getQueued,
			rows:getRows,
			cols:getCols,
			visible:getVisible
		}
	);
};

Wasavi.Notifier = function (app, container) {
	var showTimer;
	var hideTimer;
	var delayIntervalMsecs = 1000;
	var hideIntervalMsecs = 2000;
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

// vim:set ts=4 sw=4 fenc=UTF-8 ff=unix ft=javascript fdm=marker :
