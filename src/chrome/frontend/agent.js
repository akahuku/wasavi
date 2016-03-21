// ==UserScript==
// @include http://*/*
// @include https://*/*
// @exclude http://wasavi.appsweets.net/
// @exclude http://wasavi.appsweets.net/?testmode
// @exclude https://ss1.xrea.com/wasavi.appsweets.net/
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
 * Copyright 2012-2016 akahuku, akahuku@gmail.com
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

typeof WasaviExtensionWrapper != 'undefined'
&& !WasaviExtensionWrapper.urlInfo.isExternal
&& (function (global) {

// consts <<<1
var EXTENSION_SPECIFIER = 'data-texteditor-extension';
var EXTENSION_CURRENT = 'data-texteditor-extension-current';
var MARKS_ID = 'data-wasavi-marks';
var FULLSCREEN_MARGIN = 8;
var MIN_WIDTH_PIXELS = 320;
var MIN_HEIGHT_PIXELS = 240;
var BOOT_WAIT_TIMEOUT_MSECS = 1000 * 5;
var INSTANCE_MAX = 0x10000;
var ACCEPTABLE_TYPES = {
	textarea: 'enableTextArea',
	text:     'enableText',
	search:   'enableSearch',
	tel:      'enableTel',
	url:      'enableUrl',
	email:    'enableEmail',
	password: 'enablePassword',
	number:   'enableNumber',
	body:     'enablePage'
};

// page global variables <<<1
var extension = WasaviExtensionWrapper.create();
var isTestFrame = /^http:\/\/127\.0\.0\.1(:\d+)?\/test_frame\.html/.test(window.location.href);
var isOptionsPage = window.location.href == extension.urlInfo.optionsUrl;
var allowedElements;
var shortcutCode;
var fontFamily;
var quickActivation;
var devMode;
var logMode;
var blacklist;
var statusLineHeight;
var wasaviAgentsHash = {};
var diag = {
	_messages: null,
	_lastPush: null,
	init: function () {
		this._messages = [];
		this._lastPush = Date.now();
		return this;
	},
	push: function (s) {
		if (!this._messages) return;
		var now = Date.now();
		this._messages.push(((now - this._lastPush) / 1000).toFixed(3) + 's\t' + s);
		this._lastPush = now;
	},
	out: function () {
		if (!this._messages) return;
		error(this._messages.join('\n'));
		this._messages = null;
	}
};

// utility functions <<<1
function log () {
	logMode && console.log('wasavi agent: ' + Array.prototype.slice.call(arguments).join(' '));
}
function info () {
	logMode && console.info('wasavi agent: ' + Array.prototype.slice.call(arguments).join(' '));
}
function error () {
	logMode && console.error('wasavi agent: ' + Array.prototype.slice.call(arguments).join(' '));
}

function _ () {
	return Array.prototype.slice.call(arguments);
}

function getUniqueClass () {
	var result;
	do {
		result = 'wasavi_tmp_' + Math.floor(Math.random() * 0x10000);
	} while (document.getElementsByClassName(result).length > 0);
	return result;
}

function fireCustomEvent (name, detail, target) {
	var ev = document.createEvent('CustomEvent');
	ev.initCustomEvent(name, false, false, detail);
	(target || document).dispatchEvent(ev);
}

var setValue = (function () {
	function toDivs (f, value) {
		var length = 0;
		value = value.split('\n');

		for (var i = 0, goal = value.length; i < goal; i++) {
			f.appendChild(document.createElement('div'))
				.appendChild(document.createTextNode(value[i]));
			length += value[i].length + 1;
		}

		return length;
	}

	function toTextAndBreaks (f, value) {
		var length = 0;
		value = value.split('\n');

		for (var i = 0, goal = value.length - 1; i < goal; i++) {
			f.appendChild(document.createTextNode(value[i]));
			f.appendChild(document.createElement('br'));
			length += value[i].length + 1;
		}

		if (value.length >= 1) {
			f.appendChild(document.createTextNode(value[value.length - 1]));
			length += value[i].length;
		}

		return length;
	}

	function toPlainText (f, value) {
		f.appendChild(document.createTextNode(value));
		return value.length;
	}

	return function setValue (element, value, isForce) {
		value || (value = '');

		if (element.classList.contains('CodeMirror')
		 || element.classList.contains('ace_editor')) {
			if (typeof value != 'string') {
				return _('Invalid text format.');
			}
			var className = getUniqueClass();
			element.classList.add(className);
			fireCustomEvent('WasaviRequestSetContent', className + '\t' + value);
			element.classList.remove(className);
			return value.length;
		}
		else if (/^(?:INPUT|TEXTAREA)$/.test(element.nodeName)) {
			if (element.readOnly) {
				if (isForce) {
					element.readOnly = false;
				}
				else {
					return _('Element to be written has readonly attribute (use "!" to override).');
				}
			}
			if (element.disabled) {
				if (isForce) {
					element.disabled = false;
				}
				else {
					return _('Element to be written has disabled attribute (use "!" to override).');
				}
			}
			if (typeof value != 'string') {
				return _('Invalid text format.');
			}
			try {
				element.value = value;
				return value.length;
			}
			catch (e) {
				return _('Exception while saving: {0}', e.message);
			}
		}
		else if (element.nodeName == 'BODY') {
			return _('Cannot rewrite the page itself.');
		}
		else {
			/*
			 * There are various newline formats in content editable element:
			 *
			 *   - DIV elements: <div></div><div></div> ...
			 *   - Text and BR elements: #text <br> #text ...
			 *   - Plain texts: #text (newline is '\n')
			 *
			 * These are different depending on sites, so we have to choice
			 * the correct format by list...
			 */

			var r = document.createRange();
			r.selectNodeContents(element);
			r.deleteContents();

			var f = document.createDocumentFragment();
			var length;

			if (/\bworkflowy\.com$/.test(window.location.hostname)) {
				length = toPlainText(f, value);
			}
			else {
				length = toTextAndBreaks(f, value);
			}

			try {
				element.appendChild(f)
				return length;
			}
			catch (e) {
				return _('Exception while saving: {0}', e.message);
			}
		}
	};
})();

function toPlainText (input) {
	function hr2rule (node) {
		var nodes = node.getElementsByTagName('hr');
		var rule = '--------------------------------------------------------------------------------';
		while (nodes.length) {
			var newNode = document.createElement('div');
			nodes[0].parentNode.replaceChild(newNode, nodes[0]);
			newNode.textContent = rule;
		}
	}

	function getStyle (node, prop) {
		if (node.style[prop]) return node.style[prop];
		if (node.nodeName == 'SCRIPT') return 'none';
		var style = node.ownerDocument.defaultView.getComputedStyle(node, '');
		return style[prop];
	}

	function isBlock (display) {
		return 'table-row block list-item'.indexOf(display) >= 0;
	}

	function isForceInline (display) {
		return 'table-row'.indexOf(display) >= 0;
	}

	function newBlock (nodeName) {
		var text = '';
		if (t.length && !/\n$/.test(t[t.length - 1].text)) {
			text = '\n';
		}
		t.push({text: text, display: '', nodeName: nodeName || ''});
	}

	function loop (node) {
		var display = getStyle(node, 'display');
		if (display == 'none') {
			return '';
		}

		var block = isBlock(display);
		var forceInline = isForceInline(display);

		if (block) {
			newBlock(node.nodeName);
			t[t.length - 1].display = display;
			t[t.length - 1].whiteSpace = getStyle(node, 'whiteSpace');
		}

		var c, last = -1;
		for (var i = 0, goal = node.childNodes.length; i < goal; i++) {
			c = node.childNodes[i];
			if (c.nodeType == 3) {
				if (last >= 0 && last != t.length - 1) {
					newBlock();
					t[t.length - 1].display = getStyle(c.parentNode, 'display');
					t[t.length - 1].whiteSpace = getStyle(c.parentNode, 'whiteSpace');
					t[t.length - 1].nodeName = c.parentNode.nodeName;
				}
				var nodeValue = c.nodeValue;
				if (forceInline) {
					nodeValue = ' ' + nodeValue.replace(/\n/g, ' ');
				}
				last = t.length - 1;
				t[last].text += nodeValue;
			}
			else if (c.nodeName == 'BR') {
				if (!/\n$/.test(t[t.length - 1])) {
					t[t.length - 1].text += '\n';
				}
			}
			else if (c.childNodes.length) {
				loop(c);
			}
		}
		return t;
	}

	function normalize () {
		t.forEach(function (b, i) {
			if (/pre/.test(b.whiteSpace)) {
				b.text = b.text
					.replace(/^\s+|\s+$/g, '');
			}
			else {
				b.text = b.text
					.replace(/^[\t ]+|[\t ]+$/g, '')
					.replace(/[\t ]+/g, ' ');
			}
		});
	}

	function getResult () {
		var result = t
			.map(function (b) {return b.text})
			.join('')
			.replace(/^\s+|\s+$/g, '');
		return result;
	}

	var t = [];
	var inputTmp = input.cloneNode(true);
	input.parentNode.insertBefore(inputTmp, input.nextSibling);
	try {
		hr2rule(inputTmp);
		newBlock();
		loop(inputTmp);
		normalize();
		return getResult();
	}
	finally {
		inputTmp.parentNode.removeChild(inputTmp);
	}
}

function getMutationObserver (type, mediator) {
	return window.MutationObserver
	|| window.WebKitMutationObserver
	|| window.OMutationObserver
	|| window.MozMutationObserver
	|| function (handler) {
		return {
			element: null,
			observe: function (element) {
				this.element = element;
				this.element && this.element.addEventListener(
					'DOM' + type, mediator, false);
			},
			disconnect: function () {
				this.element && this.element.removeEventListener(
					'DOM' + type, mediator, false);
				this.element = null;
			},
			toString: function () {
				return '[object WasaviPseudoMutationObserver]';
			}
		};
	};
}

function getFocusables (sentinel) {
	var ordered = [];
	var unordered = [];
	var nodes = document.evaluate([
		'//a[@href]',
		'//link[@href]',
		'//button[not(@disabled)]',
		'//input[not(@disabled)][@type!="hidden"]',
		'//select[not(@disabled)]',
		'//textarea[not(@disabled)]',
		'//command[not(disalbed)]',
		'//*[@tabIndex>=0]'
	].join('|'), document.body, null, window.XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

	for (var i = 0, goal = nodes.snapshotLength; i < goal; i++) {
		var node = nodes.snapshotItem(i);
		var s = document.defaultView.getComputedStyle(node, '');
		if (s.visibility != 'visible') continue;
		if (node == sentinel) continue;

		var ti = parseInt(node.getAttribute('tabIndex'));
		(!isNaN(ti) && ti > 0 ? ordered : unordered).push(node);
	}

	return ordered.concat(unordered);
}

function assign () {
	var args = Array.prototype.slice.call(arguments);
	var element = args.shift();
	for (var i = 0, goal = args.length; i < goal; i += 2) {
		var styleName = args[i];
		var value = args[i + 1];
		if (element.style[styleName] == value) continue;
		element.style[styleName] = value;
	}
}

function createElementRemoveListener (element, callback) {
	function fireRemoved () {
		callback({target: element});
	}

	function handleRemove (records) {
		element
		&& records.some(function (r) {
			return r.removedNodes
				&& Array.prototype.indexOf.call(r.removedNodes, element) >= 0;
		})
		&& fireRemoved();
	}

	function connect () {
		var target = /\bWasaviPseudoMutationObserver\b/.test(mo.toString()) ?
				element : element.parentNode;
		mo.observe(target, {childList: true});
	}

	function disconnect () {
		mo.disconnect();
	}

	var mo = getMutationObserver('NodeRemoved', fireRemoved);

	mo = new mo(handleRemove);
	connect();
	return {connect: connect, disconnect: disconnect};
}

function createElementResizeListener (element, callback) {
	function fireIfResized () {
		if (timer) return;
		timer = setTimeout(function () {
			timer = null;
			var resized = false;
			if (element.offsetWidth != width) {
				resized = true;
				width = element.offsetWidth;
			}
			if (element.offsetHeight != height) {
				resized = true;
				height = element.offsetHeight;
			}
			resized && callback({target: element});
		}, 100);
	}

	function attrModified (e) {
		e.attrName == 'style' && fireIfResized();
	}

	function connect () {
		mo.observe(element, {attributes: true, attributeFilter: ['style']});
		window.addEventListener('resize', fireIfResized, false);
		element.addEventListener('mouseup', fireIfResized, false);
	}

	function disconnect () {
		mo.disconnect();
		window.removeEventListener('resize', fireIfResized, false);
		element.removeEventListener('mouseup', fireIfResized, false);
	}

	var mo = getMutationObserver('AttrModified', attrModified);
	var width = element.offsetWidth;
	var height = element.offsetHeight;
	var timer;

	mo = new mo(fireIfResized);
	connect();
	return {connect: connect, disconnect: disconnect, fire: fireIfResized};
}

//

function isAcceptable (key) {
	return key in ACCEPTABLE_TYPES && allowedElements[ACCEPTABLE_TYPES[key]];
}

function isLaunchableElement (target) {
	return target.isContentEditable && allowedElements.enableContentEditable
		|| target.nodeName == 'BODY' && allowedElements.enablePage
		|| /^(?:TEXTAREA|INPUT)$/.test(target.nodeName) && isAcceptable(target.type);
}

function doesTargetAllowLaunch (target) {
	/*
	 * <textarea>
	 * <textarea data-texteditor-extension="auto">
	 *     one of extensions installed into browser is executed.
	 *
	 * <textarea data-texteditor-extension="none">
	 *     no extension is executed.
	 *
	 * <textarea data-texteditor-extension="wasavi">
	 *     wasavi extension is executed.
	 */

	var current = target.getAttribute(EXTENSION_CURRENT);
	var spec = target.getAttribute(EXTENSION_SPECIFIER);
	if (current !== null) return false;
	if (spec !== null && spec !== 'auto' && spec !== extension.name) return false;
	return true;
}

function matchWithShortcut (e) {
	return shortcutCode && shortcutCode.some(function (code) {
		for (var i in code) {
			if (!(i in e)) return false;
			if (e[i] !== code[i]) return false;
		}
		return true;
	});
}

function getFullscreenRect () {
	var cover = document.body.appendChild(document.createElement('div'));
	cover.style.position = 'fixed';
	cover.style.left = cover.style.top =
	cover.style.right = cover.style.bottom = FULLSCREEN_MARGIN + 'px';
	var result = cover.getBoundingClientRect();
	cover.parentNode.removeChild(cover);
	return result;
}

// classes <<<1
var Agent = (function () {

	// private functions
	function isFixedPosition (element) {
		if (element == document.body) return true;
		var isFixed = false;
		for (var tmp = element; tmp && tmp != document.documentElement; tmp = tmp.parentNode) {
			var s = document.defaultView.getComputedStyle(tmp, '');
			if (s && s.position == 'fixed') {
				isFixed = true;
				break;
			}
		}
		return isFixed;
	}

	function findPseudoTextAreaContainer (element) {
		var result = null;
		for (var e = element; e; e = e.parentNode) {
			if (!e.classList) continue;
			if (e.classList.contains('CodeMirror')
			||  e.classList.contains('ace_editor')) {
				result = e;
				break;
			}
		}
		return result;
	}

	function getFontStyle (s, fontFamilyOverride) {
		return [
			s.fontStyle, s.fontVariant, s.fontWeight,
			s.fontSize + '/' + s.lineHeight,
			(fontFamilyOverride || s.fontFamily)
		].join(' ');
	}

	function getNodePath (element) {
		var result = [];
		for (var node = element; node && node.parentNode; node = node.parentNode) {
			var nodeName = node.nodeName.toLowerCase();
			var index = Array.prototype.indexOf.call(
				node.parentNode.getElementsByTagName(node.nodeName), node);
			result.unshift(nodeName + '[' + index + ']');
		}
		return result.join(' ');
	}

	function getBodyContent () {
		var content = [], el, s;

		// title
		if ((el = document.querySelector('title, h1')) && (s = el.textContent) != '') {
			content.push(el.textContent);
		}

		// url
		if ((el = document.querySelector('link[rel="canonical"]')) && (s = el.getAttribute('href')) != '') {
			content.push(s);
		}
		else {
			content.push(window.location.href);
		}

		// description
		if ((el = document.querySelector('meta[name="description"]')) && (s = el.getAttribute('content')) != '') {
			content.push('', s);
		}

		// selection
		if ((s = window.getSelection().toString()
			.replace(/(?:\r\n|\r|\n)/g, '\n')
			.replace(/\n{2,}/g, '\n')) != '') {
			content.push('', s);
		}

		return content.join('\n');
	}

	function locate (iframe, target, opts) {
		opts || (opts = {});
		var isFullscreen = !!opts.isFullscreen;

		if (isFullscreen) {
			var rect = getFullscreenRect();
			assign(
				iframe,
				'position', 'fixed',
				'left', FULLSCREEN_MARGIN + 'px',
				'top', FULLSCREEN_MARGIN + 'px',
				'width', rect.width + 'px',
				'height', rect.height + 'px');

			return rect;
		}
		else {
			var rect = target.getBoundingClientRect();
			rect = {
				left:   rect.left,
				top:    rect.top,
				width:  Math.max(MIN_WIDTH_PIXELS, rect.width),
				height: Math.max(MIN_HEIGHT_PIXELS, rect.height + statusLineHeight)
			};
			rect.right = rect.left + rect.width;
			rect.bottom = rect.top + rect.height;

			var position = 'fixed';
			var centerLeft, centerTop, offsetLeft = 0, offsetTop = 0;

			if (!isFixedPosition(target)) {
				position = 'absolute';
				offsetLeft = Math.max(document.documentElement.scrollLeft, document.body.scrollLeft);
				offsetTop = Math.max(document.documentElement.scrollTop, document.body.scrollTop);
			}
			centerLeft = rect.left + offsetLeft + rect.width / 2;
			centerTop = rect.top + offsetTop + rect.height / 2;

			var result = {
				left:   Math.max(0, Math.floor(centerLeft - rect.width / 2)),
				top:    Math.max(0, Math.floor(centerTop - rect.height / 2)),
				width:  rect.width,
				height: rect.height
			};

			var crect = getFullscreenRect();
			crect = {
				left:   crect.left   + offsetLeft,
				top:    crect.top    + offsetTop,
				right:  crect.right  + offsetLeft,
				bottom: crect.bottom + offsetTop,
				width:  crect.width,
				height: crect.height
			}

			if (result.width > crect.width) result.width = crect.width;
			if (result.height > crect.height) result.height = crect.height;

			if (result.left < crect.left) result.left = crect.left;
			if (result.top  < crect.top ) result.top  = crect.top;
			if (result.left + result.width > crect.right) result.left = crect.right - result.width;
			if (result.top + result.height > crect.bottom) result.top = crect.bottom - result.height;

			assign(
				iframe,
				'position', position,
				'left', result.left + 'px',
				'top', result.top + 'px',
				'width', result.width + 'px',
				'height', result.height + 'px');

			return result;
		}
	}

	// private methods
	function prepare () {
		var element = this.targetElement;
		var pseudoTextArea = findPseudoTextAreaContainer(element);

		fireCustomEvent('WasaviStarting', 0);
		diag.init().push('agent: entering prepare()');
		window.addEventListener('message', handlePostMessage, false);

		if (pseudoTextArea) {
			element = this.targetElement = pseudoTextArea;

			var className = getUniqueClass();
			element.classList.add(className);

			this.getContentCallback = function (content) {
				if (this.wasaviFrameTimeoutTimer) {
					clearTimeout(this.wasaviFrameTimeoutTimer);
					this.wasaviFrameTimeoutTimer = null;
				}
				this.getContentCallback = null;
				run.call(this, {value: content});
			};

			this.wasaviFrameTimeoutTimer = setTimeout(function (that) {
				that.wasaviFrameTimeoutTimer = null;
				element.classList.remove(className);
				cleanup.call(that);
				error('retrieving the content of pseudo textarea timed out.');
				diag.out();
			}, BOOT_WAIT_TIMEOUT_MSECS, this);

			setTimeout(function () {
				fireCustomEvent('WasaviRequestGetContent', className);
			}, 1);
		}

		else if (/^(?:INPUT|TEXTAREA)$/.test(element.nodeName)) {
			run.call(this, {
				value: element.value,
				readOnly: element.readOnly || element.disabled
			});
		}

		else if (element.isContentEditable) {
			run.call(this, {
				value: toPlainText(element)
			});
		}

		else if (element.nodeName == 'BODY') {
			run.call(this, {
				value: getBodyContent()
			});
		}

		diag.push('agent: leaving prepare()');
	}

	function run (overrides) {
		diag.push('agent: entering run()');

		/*
		 * boot sequence:
		 *
		 * background		agent		wasavi
		 *     |              |           |
		 *     |              |..........>|
		 *     |              |(create iframe)
		 *     |              |           |
		 *     |<.........................|
		 *     |(background recoginizes the iframe)
		 *     |              |           |
		 *     |<-------------|           |
		 *     |"push-payload"            |
		 *     |              |           |
		 *     |<-------------------------|
		 *     |           "init"         |
		 *     |              |           |
		 *     |------------------------->|
		 *     |       "init-response"    |
		 *     |              |           |
		 *     |              |<----------|
		 *     |              |"initialized"
		 *     |              |           |
		 *
		 */

		var element = this.targetElement;

		// create iframe
		this.targetElement.setAttribute(EXTENSION_CURRENT, extension.name);
		this.wasaviFrame = document.createElement('iframe');
		assign(
			this.wasaviFrame,
			'border', 'none',
			'overflow', 'hidden',
			'visibility', 'hidden',
			'zIndex', 0x7fffffff);
		this.wasaviFrame.src = extension.urlInfo.frameSource;
		document.body.appendChild(this.wasaviFrame);

		// set up some properties
		this.widthOwn = this.heightOwn = null;
		this.isFullscreen = false;
		this.isSyncSize = true;

		// register some event listeners
		this.targetElementRemoveListener = createElementRemoveListener(
			this.wasaviFrame,
			(function () {
				cleanup.call(this);
				error('wasavi terminated abnormally.');
				diag.out();
			}).bind(this)
		);
		this.wasaviFrameTimeoutTimer = setTimeout(function (that) {
			cleanup.call(that);
			that.wasaviFrameTimeoutTimer = null;
		}, BOOT_WAIT_TIMEOUT_MSECS, this);

		// build boot data payload and post it
		var rect = locate(this.wasaviFrame, element);
		var payload = {
			type: 'push-payload',
			parentTabId: extension.tabId,
			parentInternalId: extension.internalId,
			frameId: this.frameId,
			url: window.location.href,
			title: document.title,
			testMode: isTestFrame,
			id: element.id,
			nodeName: element.nodeName,
			nodePath: getNodePath(element),
			isContentEditable: element.isContentEditable,
			elementType: element.type,
			selectionStart: element.selectionStart || 0,
			selectionEnd: element.selectionEnd || 0,
			scrollTop: element.scrollTop || 0,
			scrollLeft: element.scrollLeft || 0,
			readOnly: false,
			value: '',
			rect: {width: rect.width, height: rect.height},
			fontStyle: getFontStyle(document.defaultView.getComputedStyle(element, ''), fontFamily),
			marks: element.getAttribute(MARKS_ID)
		}
		if (overrides) {
			for (var i in overrides) {
				payload[i] = overrides[i];
			}
		}
		extension.postMessage(payload);

		diag.push('agent: leaving runCore()');
	}

	function blurFromFrame () {
		try {
			this.wasaviFrame.contentWindow
			&& this.wasaviFrame.contentWindow.blur
			&& this.wasaviFrame.contentWindow.blur();
		} catch (e) {}

		try {
			this.wasaviFrame.blur && this.wasaviFrame.blur();
		} catch (e) {}
	}

	function cleanup (value, isImplicit) {
		if (this.targetElement) {
			if (typeof value == 'string') {
				setValue(this.targetElement, value);
			}
			!isImplicit && this.targetElement.focus();
			this.targetElement.removeAttribute(EXTENSION_CURRENT);
			this.targetElement = null;
		}
		if (this.targetElementRemoveListener) {
			this.targetElementRemoveListener = this.targetElementRemoveListener.disconnect();
		}
		if (this.wasaviFrame) {
			if (this.wasaviFrame.parentNode) {
				this.wasaviFrame.parentNode.removeChild(this.wasaviFrame);
			}
			this.wasaviFrame = null;
		}
		if (this.stateClearTimer) {
			clearTimeout(this.stateClearTimer);
			this.stateClearTimer = null;
		}
		if (this.targetElementResizeListener) {
			this.targetElementResizeListener = this.targetElementResizeListener.disconnect();
		}

		if (Object.keys(wasaviAgentsHash).length == 1) {
			window.removeEventListener('beforeunload', handleBeforeUnload, false);
		}

		this.isFullscreen = this.isSyncSize = null;
		this.getContentCallback = null;

		delete wasaviAgentsHash[this.frameId];
	}
	
	function handleTargetResize (e) {
		if (!this.wasaviFrame || !this.targetElement) return;
		locate(this.wasaviFrame, this.targetElement, {
			isFullscreen: this.isFullscreen,
			width: this.widthOwn,
			height: this.heightOwn
		});
	}

	// public methods
	function notifyToChild (payload) {
		if (!this.wasaviFrameInternalId) return;
		extension.postMessage({
			type: 'transfer',
			to: this.wasaviFrameInternalId,
			payload: payload
		});
	}

	function setStateClearTimer (callback, msec) {
		if (this.stateClearTimer) {
			clearTimeout(this.stateClearTimer);
			this.stateClearTimer = null;
		}
		if (typeof callback == 'function') {
			this.stateClearTimer = setTimeout(function (that) {
				that.stateClearTimer = null;
				try {
					callback(that);
				}
				catch (e) {
				}
			}, msec || 500, this);
		}
	}

	function initialized (req) {
		if (!this.wasaviFrame) return;
		this.wasaviFrameInternalId = req.childInternalId;
		this.wasaviFrame.style.boxShadow = '0 3px 8px 4px rgba(0,0,0,0.5)';
		this.wasaviFrame.setAttribute('data-wasavi-state', 'running');
		this.targetElementResizeListener = createElementResizeListener(
			this.targetElement,
			handleTargetResize.bind(this));

		if (Object.keys(wasaviAgentsHash).length == 1) {
			window.addEventListener('beforeunload', handleBeforeUnload, false);
		}

		if (isTestFrame) {
			if (!document.getElementById('wasavi_frame')) {
				this.wasaviFrame.id = 'wasavi_frame';
			}
			document.getElementById('test-log').value = '';
		}

		this.notifyToChild({type: 'got-initialized'});
	}

	function ready (req) {
		this.wasaviFrame.style.visibility = 'visible';
		document.activeElement != this.wasaviFrame && this.focusMe(req);
		info('wasavi started');
		fireCustomEvent('WasaviStarted', 0);

		clearTimeout(this.wasaviFrameTimeoutTimer);
		this.wasaviFrameTimeoutTimer = null;

		window.removeEventListener('message', handlePostMessage, false);

		diag.out();
	}

	function windowState (req) {
		switch (req.state) {
		case 'maximized':
		case 'normal':
			this.isFullscreen = req.state == 'maximized';
			locate(this.wasaviFrame, this.targetElement, {
				isFullscreen: this.isFullscreen
			});
			this.notifyToChild({
				type: 'relocate',
				state: req.state
			});
			break;
		}
	}

	function focusMe (req) {
		try {
			this.wasaviFrame.focus && this.wasaviFrame.focus();
		} catch (e) {}

		try {
			this.wasaviFrame.contentWindow
			&& this.wasaviFrame.contentWindow.focus
			&& this.wasaviFrame.contentWindow.focus();
		} catch (e) {}

		this.notifyToChild({type: 'focus-me-response'});
	}

	function focusChanged (req) {
		var focusables = getFocusables(this.wasaviFrame);
		var index = focusables.indexOf(this.targetElement);
		try {
			if (index >= 0) {
				var next = req.direction == 1 ?
					(index + 1) % focusables.length :
					(index + focusables.length - 1) % focusables.length;

				blurFromFrame.call(this);

				if (next == this.targetElement) {
					document.body.focus();
				}
				else {
					focusables[next].focus();
				}
			}
			else {
				document.body.focus();
			}
		}
		catch (e) {}
	}

	function blinkMe (req) {
		this.wasaviFrame.style.visibility = 'hidden';
		setTimeout(function (frame) {
			frame.style.visibility = '';
		}, 500, this.wasaviFrame);
	}

	function setSize (req) {
		if ('isSyncSize' in req) {
			this.isSyncSize = req.isSyncSize;
			if (this.isSyncSize) {
				this.widthOwn = this.heightOwn = null;
			}
			else {
				this.widthOwn = this.targetElement.offsetWidth;
				this.heightOwn = this.targetElement.offsetHeight;
			}
		}
		if ('width' in req) {
			if (this.isSyncSize) {
				this.targetElement.style.width = req.width + 'px';
				this.widthOwn = null;
			}
			else {
				this.widthOwn = req.width;
			}
		}
		if ('height' in req) {
			if (this.isSyncSize) {
				this.targetElement.style.height = req.height + 'px';
				this.heightOwn = null;
			}
			else {
				this.heightOwn = req.height;
			}
		}
		this.targetElementResizeListener.fire();
		this.notifyToChild({
			type: 'relocate',
			isSyncSize: req.isSyncSize
		});
	}

	function terminated (req) {
		if (isTestFrame) {
			this.setStateClearTimer(null);
			document.querySelector('h1').style.color = '';
		}
		if (req.marks) {
			this.targetElement.setAttribute(MARKS_ID, req.marks);
		}
		if (req.isSubmitRequested
		&& this.targetElement
		&& this.targetElement.form
		&& this.targetElement.form.action != '') {
			setTimeout(function (form) {
				var submitter = form.querySelector(
					'input[type="submit"],button[type="submit"]');
				if (submitter) {
					submitter.click();
				}
				else {
					form.submit();
				}
			}, 1, this.targetElement.form);
		}
		cleanup.call(this, req.value, req.isImplicit);
		info('wasavi terminated');
		fireCustomEvent('WasaviTerminated', Object.keys(wasaviAgentsHash).length);
	}

	function read (req) {
		var value = this.targetElement.isContentEditable ?
			toPlainText(this.targetElement) : this.targetElement.value;

		this.notifyToChild({
			type: 'read-response',
			state: 'complete',
			meta: {
				path: '',
				bytes: value.length
			},
			content: value
		});
	}

	function write (req) {
		var payload = {type: 'write-response'};
		try {
			var result = setValue(this.targetElement, req.value, req.isForce);
			if (typeof result == 'number') {
				var ev;

				if (/^(?:INPUT|TEXTAREA)$/.test(this.targetElement.nodeName)) {
					// input event
					// NOTE: input event constructor is fluid.
					ev = document.createEvent('Event');
					ev.initEvent('input', true, false);
					this.targetElement.dispatchEvent(ev);

					// change event
					ev = document.createEvent('Event');
					ev.initEvent('change', true, false);
					this.targetElement.dispatchEvent(ev);
				}

				payload.state = 'complete';
				payload.meta = {
					path: req.path,
					bytes: result
				};
			}
			else if (result instanceof Array) {
				payload.error = result;
			}
			else {
				payload.error = _('Internal state error.');
			}
		}
		catch (ex) {
			payload.error = _('Internal exception: ' + ex.message);
		}
		finally {
			payload.exstate = {
				isBuffered: req.isBuffered
			};

			this.notifyToChild(payload);
		}
	}

	function requestBlur (req) {
		this.wasaviFrame.blur();
		document.body.focus();
	}

	// constructor
	function Agent (element, frameId) {
		this.targetElement = element;
		this.frameId = frameId;
		this.targetElementRemoveListener = null;
		this.targetElementResizeListener = null;
		this.wasaviFrame = null;
		this.wasaviFrameInternalId = null;
		this.wasaviFrameTimeoutTimer = null;
		this.widthOwn = null;
		this.heightOwn = null;
		this.isFullscreen = false;
		this.isSyncSize = false;
		this.getContentCallback = null;
		this.stateClearTimer = null;
		prepare.call(this);
	}

	Agent.prototype = {
		notifyToChild:      notifyToChild,
		setStateClearTimer: setStateClearTimer,

		initialized:  initialized,
		ready:        ready,
		windowState:  windowState,
		focusMe:      focusMe,
		focusChanged: focusChanged,
		blinkMe:      blinkMe,
		setSize:      setSize,
		terminated:   terminated,
		read:         read,
		write:        write,
		requestBlur:  requestBlur
	};

	return Agent;
})();

// agent manager functions <<<1
function startAgent (targetElement) {
	for (var i = 0; i < INSTANCE_MAX; i++) {
		if (i in wasaviAgentsHash) continue;
		wasaviAgentsHash[i] = new Agent(targetElement, i);
		break;
	}
}

function findAgent (target, property) {
	property || (property = 'targetElement');
	for (var i in wasaviAgentsHash) {
		if (wasaviAgentsHash[i][property] == target) {
			return wasaviAgentsHash[i];
		}
	}
	return null;
}

function keylog () {
	var t = document.getElementById('test-log');
	if (!t) return;
	t.value += '\n' + Array.prototype.slice.call(arguments).join('\t');
	t.scrollTop = t.scrollHeight - t.clientHeight;
}

function parseBlacklist (blacklist) {
	var result = {
		fullBlocked: false,
		selectors: [],
		includes: function (element) {
			return this.fullBlocked || this.selectors.some(function (s) {
				try {
					return Array.prototype.indexOf.call(
						document.querySelectorAll(s), element) >= 0;
				}
				catch (e) {}
			});
		}
	};
	(blacklist || '').split('\n').some(function (line) {
		line = line.replace(/^\s+|\s+$/g, '');
		if (line == '' || /^[#;]/.test(url)) return;

		var delimiter = /\s+/.exec(line);
		if (delimiter) {
			line = [
				line.substring(0, delimiter.index),
				line.substring(delimiter.index + delimiter[0].length)
			];
		}
		else {
			line = [line, ''];
		}
		try {
			var url = new RegExp('^' + line[0]
				.replace(/[\\^$+.()|{}]/g, function ($0) {return '\\' + $0})
				.replace(/\?/g, '.')
				.replace(/\*/g, '.+?'), 'i');

			if (url.test(window.location.href)) {
				if (line[1] == '') {
					result.fullBlocked = true;
					return true;
				}
				else {
					result.selectors.push(line[1]);
				}
			}
		}
		catch (e) {}
	});
	return result;
}

function connect (callback) {
	var connected = false;
	var retryRest = 5;
	var wait = 1000;
	var eventName = isOptionsPage ? 'init-options' : 'init-agent';
	var gotInit = function (req) {
		if (connected) return;
		connected = true;
		callback(req);
	};
	var checkIfConnectedOrRetry = function () {
		if (connected || retryRest <= 0) return;
		retryRest--;
		wait += 1000;
		setTimeout(function () {checkIfConnectedOrRetry()}, wait);
		extension.connect(eventName, gotInit);
	}

	checkIfConnectedOrRetry();
}

function createPageAgent (listenKeydown, usePageContextScript) {
	var parent = document.head || document.body || document.documentElement;
	if (!parent) return;

	window.addEventListener('focus', handleTargetFocus, true);

	if (listenKeydown) {
		window.addEventListener('keydown', handleKeydown, true);
	}

	if (usePageContextScript) {
		var s = document.createElement('script');
		s.onload = function () {
			this.onload = null;
			this.parentNode && this.parentNode.removeChild(this);
		};
		s.type = 'text/javascript';
		s.src = extension.getPageContextScriptSrc();
		parent.appendChild(s);
	}
}

// event listeners <<<1
function handleKeydown (e) {
	if (!e || !e.target || !allowedElements) return;
	if (e.keyCode == 16 || e.keyCode == 17 || e.keyCode == 18) return;

	var target = e.target;
	if (blacklist.includes(target)) return;
	if (!isLaunchableElement(target)) return;
	if (!doesTargetAllowLaunch(target)) return;
	if (!matchWithShortcut(e)) return;
	if (findAgent(target)) return;

	e.preventDefault();
	e.stopPropagation();
	startAgent(target);
}

function handleTargetFocus (e) {
	if (!quickActivation || !e || !e.target || !allowedElements) return;

	var target = e.target;
	if (blacklist.includes(target)) return;
	if (!isLaunchableElement(target)) return;
	if (!doesTargetAllowLaunch(target)) return;
	if (findAgent(target)) return;

	e.preventDefault();
	startAgent(target);
}

function handleRequestLaunch () {
	if (!allowedElements) return;
	if (typeof document.hasFocus == 'function' && !document.hasFocus()) return;

	var target = document.activeElement;
	if (blacklist.includes(target)) return;
	if (!isLaunchableElement(target)) return;
	if (!doesTargetAllowLaunch(target)) return;
	if (findAgent(target)) return;

	startAgent(target);
}

function handleBeforeUnload (e) {
	if (Object.keys(wasaviAgentsHash).length) {
		return e.returnValue = 'wasavi: Unexpected closing. Are you sure?';
	}
}

function handleAgentInitialized (req) {
	if (isOptionsPage) {
		window.WasaviOptions.extension = extension;
		window.WasaviOptions.initPage(req);
	}

	if (extension.isTopFrame() && document.querySelector('textarea')) {
		info('running on ', window.location.href.replace(/[#?].*$/, ''));
	}
}

function handleResponseGetContent (e) {
	var index = e.detail.indexOf('\t');
	if (index < 0) return;

	var className = e.detail.substring(0, index);
	var target = document.getElementsByClassName(className)[0];
	if (!target) return;

	var agent = findAgent(target);
	if (!agent || !agent.getContentCallback) return;

	agent.getContentCallback(e.detail.substring(index + 1));
}

var handleBackendMessage = (function () {
	function updateStorage (agent, req) {
		var logbuf = [];
		var qaBlacklist;
		for (var i in req.items) {
			var value = req.items[i];
			switch (i) {
			case 'targets':
				allowedElements = value;
				logbuf.push(i);
				break;

			case 'shortcutCode':
				shortcutCode = value;
				logbuf.push(i);
				break;

			case 'quickActivation':
				quickActivation = value;
				logbuf.push(i);
				break;

			case 'logMode':
				logMode = value;
				logbuf.push(i);
				break;

			case 'qaBlacklist':
				qaBlacklist = value;
				logbuf.push(i);
				break;
			}
		}
		blacklist = parseBlacklist(qaBlacklist);
		logbuf.length && log(
			'update-storage: consumed ', logbuf.join(', '));
	}

	function requestRun (agent, req) {
		handleRequestLaunch();
	}

	function ping (agent, req) {
	}

	function notifyKeydown (agent, req) {
		if (!isTestFrame) return;
		agent.setStateClearTimer(null);
		if (agent.wasaviFrame.getAttribute('data-wasavi-command-state') != 'busy') {
			agent.wasaviFrame.setAttribute('data-wasavi-command-state', 'busy');
			document.querySelector('h1').style.color = 'red';
			keylog('', '', 'command start, frame #' + req.frameId);
		}
		keylog.apply(null, ['key', 'keyCode', 'eventType'].map(function (a) {
			return (a in req) ? req[a] : '';
		}));
	}

	function notifyError (agent, req) {
		if (!isTestFrame) return;
		keylog(
			'error on ' + document.querySelector('h1').textContent,
			req.fileName + '(' + req.lineNumber + ')',
			req.message);
	}

	function notifyState (agent, req) {
		if (!isTestFrame) return;
		agent.setStateClearTimer(function (agent) {
			agent.wasaviFrame.setAttribute('data-wasavi-state', JSON.stringify(req.state));
			agent.wasaviFrame.setAttribute('data-wasavi-input-mode', req.state.inputMode);
			agent.wasaviFrame.removeAttribute('data-wasavi-command-state');

			keylog('notify-state');
		});
	}

	function commandCompleted (agent, req) {
		if (!isTestFrame) return;
		agent.setStateClearTimer(function (agent) {
			try {
				agent.wasaviFrame.setAttribute('data-wasavi-state', JSON.stringify(req.state));
				agent.wasaviFrame.setAttribute('data-wasavi-input-mode', req.state.inputMode);
				agent.wasaviFrame.setAttribute('data-wasavi-line-input', req.state.lineInput);

				document.querySelector('h1').style.color = '';

				var state = document.getElementById('state');
				state.textContent = '';
				['running', 'state', 'inputMode', 'row', 'col', 'lastMessage'].forEach(function (p) {
					state.appendChild(document.createElement('div')).textContent =
						p + ': ' + req.state[p];
				});
			}
			finally {
				agent.wasaviFrame.removeAttribute('data-wasavi-command-state');
				keylog('*** sequence point (' + req.state.inputMode + ') ***');

			}
		});
	}

	var handlerMap = {
		/*
		 * messages transferred from wasavi
		 */

		'initialized':       function initialized (agent, req)  { agent.initialized(req) },
		'ready':             function ready (agent, req)        { agent.ready(req) },
		'window-state':      function windowState (agent, req)  { agent.windowState(req) },
		'focus-me':          function focusMe (agent, req)      { agent.focusMe(req) },
		'focus-changed':     function focusChanged (agent, req) { agent.focusChanged(req) },
		'blink-me':          function blinkMe (agent, req)      { agent.blinkMe(req) },
		'set-size':          function setSize (agent, req)      { agent.setSize(req) },
		'terminated':        function terminated (agent, req)   { agent.terminated(req) },
		'read':              function read (agent, req)         { agent.read(req) },
		'write':             function write (agent, req)        { agent.write(req) },
		'request-blur':      function requestBlur (agent, req)  { agent.requestBlur(req) },

		/*
		 * messages from backend
		 */

		'update-storage':    updateStorage,
		'request-run':       requestRun,
		'ping':              ping,

		/*
		 * following cases are for functionality test.
		 * available only on http://127.0.0.1/test_frame.html
		 */

		'notify-keydown':    notifyKeydown,
		'notify-error':      notifyError,
		'notify-state':      notifyState,
		'command-completed': commandCompleted,
	};

	return function (req) {
		if (!req || !req.type) return;

		logMode && log(
			'got "' + req.type + '" message from backend:',
			JSON.stringify(req).substring(0, 200));

		if (!(req.type in handlerMap)) return;

		if ('frameId' in req) {
			if (!(req.frameId in wasaviAgentsHash)) return;
			handlerMap[req.type](wasaviAgentsHash[req.frameId], req);
		}
		else {
			handlerMap[req.type](null, req);
		}
	};
})();

function handlePostMessage (e) {
	if (window.chrome) {
		if (e.origin != 'chrome-extension://' + chrome.runtime.id) return;
	}
	else if (window.opera) {
		if (e.origin != 'http://wasavi.appsweets.net'
		&&  e.origin != 'https://ss1.xrea.com') return;
	}
	else if (WasaviExtensionWrapper.IS_GECKO) {
		// on Firefox, e.origin is always null. maybe a bug?
	}
	diag.push('wasavi: ' + e.data);
}

function handleConnect (req) {
	if (!req || !('tabId' in req) || !req.tabId) {
		if (logMode) {
			var missing = '?';
			if (!req) {
				missing = 'empty req object';
			}
			else if (!('tabId' in req)) {
				missing = 'missing req.tabId';
			}
			error(
				'wasavi agent: got init-response message',
				' (' + missing + ').');
		}
		return;
	}

	extension.tabId = req.tabId;
	allowedElements = req.targets;
	shortcutCode = req.shortcutCode;
	fontFamily = req.fontFamily;
	quickActivation = req.quickActivation;
	devMode = req.devMode;
	logMode = req.logMode;
	blacklist = parseBlacklist(req.qaBlacklist);
	statusLineHeight = req.statusLineHeight;

	extension.ensureRun(handleAgentInitialized, req);
}

// bootstrap <<<1
createPageAgent(true, true);
extension.setMessageListener(handleBackendMessage);
document.addEventListener('WasaviRequestLaunch', handleRequestLaunch, false);
document.addEventListener('WasaviResponseGetContent', handleResponseGetContent, false);
connect(handleConnect);

})(this);

// vim:set ts=4 sw=4 fileencoding=UTF-8 fileformat=unix filetype=javascript fdm=marker fmr=<<<,>>> :
