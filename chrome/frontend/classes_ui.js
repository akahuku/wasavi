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
 * @version $Id: classes_ui.js 263 2012-12-26 15:33:25Z akahuku $
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

Wasavi.Theme = function (app) {
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
				if (!(i in colorSet)) return false;
				newColors[i] = colors[i] instanceof Array ?
					[colors[i][0], colorSet[i]] : colorSet[i];
			}
			colors = newColors;
			return true;
		}
		colorSet || (colorSet = '');
		if (colorSet == '' || !(colorSet in colorSets)) {
			colorSet = 'blight';
		}
		return select(colorSets[colorSet]);
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
		app = container = null;
		emptyNodeContents(getStyleElement());
	}

	this.select = select;
	this.update = update;
	this.dispose = dispose;

	this.__defineSetter__('container', function (v) {container = v;});
	this.__defineSetter__('fontStyle', function (v) {fontStyle = v;});
	this.__defineSetter__('lineHeight', function (v) {lineHeight = v;});
};

Wasavi.Bell = function (app, loadCallback) {
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

		if (app.extensionChannel) {
			app.extensionChannel.postMessage({type:'bell', file:src + '.txt'}, function (res) {
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

	a.addEventListener('load', function handleBellLoaded () {
		a.removeEventListener('load', handleBellLoaded, false);
		enabled = true;
	}, false);

	this.play = function () {
		if (src == '' || !enabled) return;
		var vol = Math.max(0, Math.min(app.config.vars.bellvolume, 100));
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
};

Wasavi.CursorUI = function (app, comCursor, editCursor) {
	var buffer = app.buffer;
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
		this.hide = function () {
			stopBlink();
			buffer.unEmphasis(CURSOR_SPAN_CLASS);
			comCursor.style.display = 'none';
		};
		this.show = function () {
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
			startBlink();
		};
		this.lostFocus = function () {
			this.show();
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
		this.compositionUpdate =
		this.compositionComplete = function () {};
	}

	/*constructor*/function EditWrapper (mode) {
		var leading;

		function getCompositionSpan () {
			var spans = buffer.getSpans(COMPOSITION_CLASS);
			return spans.length ? spans[0] : null;
		}
		function createCompositionSpan () {
			var n = buffer.selectionStart;
			var span = getCompositionSpan();
			if (!span) {
				if (n.col == 0) {
					span = document.createElement('span');
					span.className = COMPOSITION_CLASS;
					var node = buffer.rowNodes(n);
					node.insertBefore(span, node.firstChild);
				}
				else {
					span = buffer.emphasis(
						new Wasavi.Position(n.row, 0), n.col, COMPOSITION_CLASS)[0];
				}
			}
			var s = document.defaultView.getComputedStyle(span, '');
			span.style.color = s.backgroundColor;
			span.style.backgroundColor = s.backgroundColor;
			return span;
		}
		function removeCompositionSpan () {
			buffer.unEmphasis(COMPOSITION_CLASS);
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
			app.low.executeViCommand(data, true);
			if (app.recordedStrokes) {
				app.recordedStrokes.strokes += data;
			}
		};
		this.hide = function () {
			editCursor.style.display = 'none';
			removeCompositionSpan();
		};
		this.show = function () {
			if (app.runLevel || inComposition) {
				return;
			}
			editCursor.style.display = 'block';

			var s = buffer.selectionStart;
			var c = $(CONTAINER_ID).getBoundingClientRect();
			var r = buffer.rowNodes(s).getBoundingClientRect();

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

			buffer.adjustBackgroundImage(app.lineHeight);
			buffer.adjustLineNumber(app.config.vars.relativenumber);
			buffer.updateActiveRow();
		};
		this.lostFocus = function () {};
		this.dispose = function () {};
	}
	function getCommandCursorCoord () {
		var r = buffer.charRectAt(buffer.selectionStart);
		var result3 = {
			left:r.left + buffer.scrollLeft,
			top:r.top + buffer.scrollTop,
			right:(r.right == r.left ? r.left + app.charWidth : r.right) + buffer.scrollLeft,
			bottom:(r.bottom == r.top ? r.top + app.lineHeight : r.bottom) + buffer.scrollTop
		};
		return result3;
	}
	function ensureVisible (smooth) {
		if (!buffer.selected) {
			var needFix1 = !app.low.isEditing();
			var needFix2 = !app.requestedState.inputMode || !app.low.isEditing(app.requestedState.inputMode.mode);
			if (needFix1 && needFix2) {
				var n = buffer.selectionStart;
				var fixed = false;
				if (n.col > 0
				&& n.row == buffer.rowLength - 1
				&& n.col >= buffer.rows(n).length) {
					n.col = Math.max(0, buffer.rows(n).length - 1);
					fixed = true;
				}
				if (n.col > 0 && buffer.isNewline(n)) {
					n.col--;
					fixed = true;
				}
				if (fixed) {
					buffer.setSelectionRange(n);
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
		app = buffer = comCursor = editCursor = wrapper = null;
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
	this.run = function (dest, callback) {
		if (running || !app.targetElement || !cursor || !modeLine) {
			return;
		}
		if (!app.config.vars.smooth || cursor.locked) {
			buffer.scrollTop = dest;
			callback && callback();
			return;
		}
		scrollTopStart = buffer.scrollTop;
		scrollTopDest = dest;

		if (scrollTopStart != scrollTopDest) {
			distance = scrollTopDest - scrollTopStart;
			running = true;
			lastRan = +Date.now();
			(function doScroll () {
				var now = +Date.now();
				var y = scrollTopStart + ((now - lastRan) / consumeMsecs) * distance;

				if (!app.targetElement || !cursor || !modeLine) {
					running = false;
					app.keyManager.sweep();
					return;
				}

				if (distance > 0 && y >= scrollTopDest
				||  distance < 0 && y <= scrollTopDest) {
					buffer.scrollTop = scrollTopDest;
					callback && callback();
					cursor.ensureVisible();
					cursor.update({visible:true});
					modeLine.style.display == '' && app.low.showPrefixInput();
					app.low.fireCommandCompleteEvent();
					running = false;
					app.keyManager.sweep();
				}
				else {
					buffer.scrollTop = parseInt(y);
					setTimeout(doScroll, timerPrecision);
				}
			})();
		}
	};
	this.dispose = function () {
		app = buffer = cursor = modeLine = null;
	};
	this.__defineGetter__('running', function () {return running;});
	this.__defineGetter__('consumeMsecs', function () {return consumeMsecs;});
	this.__defineGetter__('timerPrecision', function () {return timerPrecision;});
	this.__defineSetter__('consumeMsecs', function (v) {consumeMsecs = v;});
	this.__defineSetter__('timerPrecision', function (v) {timerPrecision = v;});
};

Wasavi.Backlog = function (app, container, con, scaler) {
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

		if (app.state != 'console-wait') {
			app.low.pushInputMode('console-wait', 'backlog');
		}
		if (!preserveMessage) {
			app.low.showMessage(
				buffer.length ? _('More...') :
								_('Press any key to continue, or enter more ex command:'),
				false, true, true);
		}
	};
	this.dispose = function () {
		app = container = con = scaler = null;
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
};

// vim:set ts=4 sw=4 fenc=UTF-8 ff=unix ft=javascript fdm=marker :
