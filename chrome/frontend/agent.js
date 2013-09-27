// ==UserScript==
// @include http://*/*
// @include https://*/*
// @exclude http://wasavi.appsweets.net/
// @exclude https://ss1.xrea.com/wasavi.appsweets.net/
// ==/UserScript==
//
/**
 * wasavi: vi clone implemented in javascript
 * =============================================================================
 *
 *
 * @author akahuku@gmail.com
 * @version $Id: agent.js 414 2013-09-27 13:13:51Z akahuku $
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

typeof WasaviExtensionWrapper != 'undefined'
&& !WasaviExtensionWrapper.urlInfo.isExternal
&& (function (global) {

/*const*/var EXTENSION_SPECIFIER = 'data-texteditor-extension';
/*const*/var EXTENSION_CURRENT = 'data-texteditor-extension-current';
/*const*/var FULLSCREEN_MARGIN = 8;
/*const*/var MIN_WIDTH_PIXELS = 320;
/*const*/var ACCEPTABLE_TYPES = {
	textarea: 'enableTextArea',
	text:     'enableText',
	search:   'enableSearch',
	tel:      'enableTel',
	url:      'enableUrl',
	email:    'enableEmail',
	password: 'enablePassword',
	number:   'enableNumber'
};

var extension;

var enableList;
var exrc;
var shortcut;
var shortcutCode;
var fontFamily;
var quickActivation;
var devMode;

var targetElement;
var wasaviFrame;
var extraHeight;
var isTestFrame;
var isFullscreen;
var stateClearTimer;
var targetElementResizedTimer;
var wasaviFrameTimeoutTimer;
var keyStrokeLog = [];
var mutationObserver;
var getValueCallback;

function _ () {
	return Array.prototype.slice.call(arguments);
}

function getUniqueClass () {
	var result;
	do {
		result = 'wasavi_tmp_' + Math.floor(Math.random() * 0x10000);
	}
	while (document.getElementsByClassName(result).length > 0);
	return result;
}

function locate (iframe, target, isFullscreen, extraHeight) {
	function isFixedPosition (element) {
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
	if (isFullscreen) {
		var div = document.body.appendChild(document.createElement('div'));
		div.style.position = 'fixed';
		div.style.left = div.style.top =
		div.style.right = div.style.bottom = FULLSCREEN_MARGIN + 'px';
		var rect = div.getBoundingClientRect();
		div.parentNode.removeChild(div);

		iframe.style.position = 'fixed';
		iframe.style.left = iframe.style.top = FULLSCREEN_MARGIN + 'px';
		iframe.style.width = rect.width + 'px';
		iframe.style.height = rect.height + 'px';

		return rect;
	}
	else {
		var rect = target.getBoundingClientRect();
		var position = 'fixed';
		var centerLeft, centerTop, offsetLeft = 0, offsetTop = 0;
		var widthAdjusted = Math.max(MIN_WIDTH_PIXELS, rect.width);
		var heightAdjusted = rect.height + (extraHeight || 0);

		if (!isFixedPosition(target)) {
			position = 'absolute';
			offsetLeft = Math.max(document.documentElement.scrollLeft, document.body.scrollLeft);
			offsetTop = Math.max(document.documentElement.scrollTop, document.body.scrollTop);
		}
		centerLeft = rect.left + offsetLeft + rect.width / 2;
		centerTop = rect.top + offsetTop + rect.height / 2;

		var result = {
			left: Math.max(0, Math.floor(centerLeft - widthAdjusted / 2)),
			top: Math.max(0, Math.floor(centerTop - rect.height / 2)),
			width: widthAdjusted,
			height: rect.height
		};

		iframe.style.position = position;
		iframe.style.left = result.left + 'px';
		iframe.style.top = result.top + 'px';
		iframe.style.width = widthAdjusted + 'px';
		iframe.style.height = heightAdjusted + 'px';

		return result;
	}
}

function run (element) {
	var isPseudoTextarea = false;
	for (var e = element; e; e = e.parentNode) {
		if (!e.classList) continue;
		if (e.classList.contains('CodeMirror') || e.classList.contains('ace_editor')) {
			element = e;
			isPseudoTextarea = true;
			break;
		}
	}
	extension.postMessage({type:'request-wasavi-frame'}, function (res) {
		if (isPseudoTextarea) {
			if (getValueCallback) {
				runCore(element, res.data, '');
				return;
			}
			getValueCallback = function (value) {runCore(element, res.data, value)};
			var className = getUniqueClass();
			element.classList.add(className);
			setTimeout(function () {
				getValueCallback = null;
				element.classList.remove(className);
			}, 1000 * 5);
			fireCustomEvent('WasaviRequestGetContent', {className:className});
		}
		else if (element.nodeName == 'INPUT' || element.nodeName == 'TEXTAREA') {
			runCore(element, res.data, element.value);
		}
		else if (element.isContentEditable) {
			runCore(element, res.data, toPlainText(element));
		}
	});
}

function runCore (element, frameSource, value) {
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
	 *     |              |"wasavi-initialized"
	 *     |              |           |
	 *
	 */

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

	//
	targetElement = element;
	targetElement.setAttribute(EXTENSION_CURRENT, extension.name);
	wasaviFrame = document.createElement('iframe');
	wasaviFrame.style.border = 'none';
	wasaviFrame.style.overflow = 'hidden';
	wasaviFrame.style.visibility = 'hidden';
	wasaviFrame.style.zIndex = 0x7fffffff;
	wasaviFrame.src = extension.urlInfo.frameSource || frameSource;

	document.body.appendChild(wasaviFrame);

	//
	var rect = locate(wasaviFrame, element);
	extension.postMessage({
		type:'push-payload',
		parentTabId:extension.tabId,
		url:window.location.href,
		testMode:isTestFrame,
		id:element.id,
		nodeName:element.nodeName,
		nodePath:getNodePath(element),
		isContentEditable:element.isContentEditable,
		elementType:element.type,
		selectionStart:element.selectionStart,
		selectionEnd:element.selectionEnd,
		scrollTop:element.scrollTop,
		scrollLeft:element.scrollLeft,
		readOnly:element.readOnly || element.disabled,
		value:value,
		rect:{width:rect.width, height:rect.height},
		fontStyle:getFontStyle(document.defaultView.getComputedStyle(element, ''), fontFamily)
	});

	//
	var mo = window.MutationObserver
	|| window.WebKitMutationObserver
	|| window.OMutationObserver
	|| window.MozMutationObserver;
	if (mo) {
		mutationObserver = new mo(handleWasaviFrameMutation);
		mutationObserver.observe(wasaviFrame.parentNode, {childList:true});
	}
	else {
		mutationObserver = null;
		wasaviFrame.addEventListener('DOMNodeRemoved', handleWasaviFrameRemoved, false);
	}

	//
	wasaviFrameTimeoutTimer = setTimeout(function () {
		wasaviFrame.parentNode.removeChild(wasaviFrame);
		wasaviFrameTimeoutTimer = null;
	}, 1000 * 5);
}

function cleanup (value, isImplicit) {
	if (targetElement) {
		if (value !== undefined) {
			setValue(targetElement, value);
		}
		!isImplicit && targetElement.focus();
		targetElement.removeAttribute(EXTENSION_CURRENT);
		targetElement = null;
	}
	if (mutationObserver) {
		mutationObserver.disconnect();
		mutationObserver = null;
	}
	if (wasaviFrame) {
		wasaviFrame.removeEventListener('DOMNodeRemoved', handleWasaviFrameRemoved, false);
		wasaviFrame.parentNode.removeChild(wasaviFrame);
		wasaviFrame = null;
	}
	if (stateClearTimer) {
		clearTimeout(stateClearTimer);
		stateClearTimer = null;
	}
	window.removeEventListener('resize', handleTargetResize, false);
	extraHeight = 0;
}

function focusToFrame (req) {
	if (!wasaviFrame) return;
	try {
		wasaviFrame.focus && wasaviFrame.focus();
	} catch (e) {}
	try {
		wasaviFrame.contentWindow
		&& wasaviFrame.contentWindow.focus
		&& wasaviFrame.contentWindow.focus();
	} catch (e) {}
	try {
		extension.postMessage({
			type:'notify-to-child',
			childTabId:req.childTabId,
			payload:{
				type:'focus-me-response'
			}
		});
	} catch (e) {}
}

function blurFromFrame () {
	if (!wasaviFrame) return;
	try {
		wasaviFrame.contentWindow
		&& wasaviFrame.contentWindow.blur
		&& wasaviFrame.contentWindow.blur();
	} catch (e) {}
	try {
		wasaviFrame.blur && wasaviFrame.blur();
	} catch (e) {}
}

function getFocusables () {
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
		if (node == wasaviFrame) continue;

		var ti = parseInt(node.getAttribute('tabIndex'));
		(!isNaN(ti) && ti > 0 ? ordered : unordered).push(node);
	}

	return ordered.concat(unordered);
}

function log (eventType, keyCode, key) {
	keyStrokeLog.unshift([keyCode, key, eventType].join('\t'));
}

function fireCustomEvent (name, detail, target) {
	var ev = document.createEvent('CustomEvent');
	ev.initCustomEvent(name, false, false, detail);
	(target || document).dispatchEvent(ev);
}

function setValue (element, value, isForce) {
	value || (value = '');

	if (element.classList.contains('CodeMirror')) {
		if (typeof value != 'string') {
			return _('Invalid text format.');
		}
		var className = getUniqueClass();
		element.classList.add(className);
		setTimeout(function () {
			element.classList.remove(className);
		}, 1000 * 5);
		fireCustomEvent('WasaviRequestSetContent', {className:className, content:value});
		return value.length;
	}
	else if (element.nodeName == 'INPUT' || element.nodeName == 'TEXTAREA') {
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
	else {
		if (Object.prototype.toString.call(value) != '[object Array]') {
			return _('Invalid text format.');
		}

		var r = document.createRange();
		r.selectNodeContents(element);
		r.deleteContents();
		r.detach();

		var f = document.createDocumentFragment();
		var length = 0;
		for (var i = 0, goal = value.length - 1; i < goal; i++) {
			f.appendChild(document.createTextNode(value[i]));
			f.appendChild(document.createElement('br'));
			length += value[i].length + 1;
		}
		if (value.length >= 1) {
			f.appendChild(document.createTextNode(value[value.length - 1]));
			length += value[i].length;
		}

		try {
			element.appendChild(f)
			return length;
		}
		catch (e) {
			return _('Exception while saving: {0}', e.message);
		}
	}
}

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
		t.push({text:'', display:'', nodeName:nodeName || ''});
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
				var nodeValue = c.nodeValue.replace(/^\s+|\s+$/g, '');
				if (forceInline) {
					nodeValue = ' ' + nodeValue.replace(/\n/g, ' ');
				}
				last = t.length - 1;
				t[last].text += nodeValue;
			}
			else if (c.nodeName == 'BR') {
				newBlock(c.nodeName);
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
					.replace(/^[\n ]+|[\n ]+$/g, '');
			}
			else {
				b.text = b.text
					.replace(/^[\n ]+|[\n ]+$/g, '')
					.replace(/\s+/g, ' ');
			}

			/*if (b.text != '' && b.display == 'block') {
				if (i > 0 && t[i - 1].nodeName != 'BR') {
					b.text = '\n' + b.text;
				}
				if (i < t.length - 1 && t[i + 1].nodeName != 'BR') {
					b.text = b.text + '\n';
				}
			}*/
		});
	}

	function getResult () {
		var result = [];
		t.forEach(function (b) {b.text != '' && result.push(b.text)});
		result = result.join('\n').replace(/\n\n+/g, '\n\n');
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

/**
 * unexpected wasavi frame deletion handler
 * ----------------
 */

function handleWasaviFrameMutation (records) {
	wasaviFrame
	&& records.some(function (r) {
		return r.removedNodes && Array.prototype.indexOf.call(r.removedNodes, wasaviFrame) >= 0;
	})
	&& handleWasaviFrameRemoved();
}

function handleWasaviFrameRemoved (e) {
	wasaviFrame = null;
	cleanup();
	devMode && console.error('wasavi terminated abnormally.');
}

/**
 * keydown handler
 * ----------------
 */

function handleKeydown (e) {
	if (targetElement || !e || !e.target || !enableList || e.keyCode == 16 || e.keyCode == 17) return;

	if (e.target.isContentEditable && enableList.enableContentEditable
	||  (e.target.nodeName == 'TEXTAREA' || e.target.nodeName == 'INPUT')
		&& e.target.type in ACCEPTABLE_TYPES
		&& enableList[ACCEPTABLE_TYPES[e.target.type]]) {

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

		var current = e.target.getAttribute(EXTENSION_CURRENT);
		var spec = e.target.getAttribute(EXTENSION_SPECIFIER);
		if (current !== null) return;
		if (spec !== null && spec !== 'auto' && spec !== extension.name) return;

		if (matchWithShortcut(e)) {
			fireCustomEvent('WasaviStarting', 0);
			e.preventDefault();
			run(e.target);
		}
	}
}

/**
 * focus handler
 * ----------------
 */

function handleTargetFocus (e) {
	if (targetElement || !e || !e.target || !enableList) return;

	if (e.target.isContentEditable && enableList.enableContentEditable
	||  (e.target.nodeName == 'TEXTAREA' || e.target.nodeName == 'INPUT')
		&& e.target.type in ACCEPTABLE_TYPES
		&& enableList[ACCEPTABLE_TYPES[e.target.type]]) {

		var current = e.target.getAttribute(EXTENSION_CURRENT);
		var spec = e.target.getAttribute(EXTENSION_SPECIFIER);
		if (current !== null) return;
		if (spec !== null && spec !== 'auto' && spec !== extension.name) return;

		e.preventDefault();
		run(e.target);
	}
}

/**
 * DOMContentLoaded handler on options page
 * ----------------
 */

function handleOptionsPageLoaded (req) {
	for (var i in enableList) {
		var el = document.getElementById(i);
		if (el && el.nodeName == 'INPUT' && el.type == 'checkbox') {
			el.checked = enableList[i];
		}
	}

	var el;
	el = document.getElementById('exrc');
	if (el && el.nodeName == 'TEXTAREA') {
		el.value = exrc;
	}

	el = document.getElementById('shortcut');
	if (el && el.nodeName == 'INPUT') {
		el.value = shortcut;
	}

	el = document.getElementById('font-family');
	if (el && el.nodeName == 'INPUT') {
		el.value = fontFamily;
	}

	el = document.getElementById('save');
	if (el) {
		el.addEventListener('click', handleOptionsSave, false);
	}

	el = document.getElementById('opt-init');
	if (el) {
		el.addEventListener('click', handleOptionsInit, false);
	}

	[
		'title',
		'exrc_head',
		'target_elements_head',
		'starting_type_head',
		'font_family_head',
		'exrc_desc',
		'quick_activation_on',
		'quick_activation_off',
		['target_elements_desc', function (node, message) {
			node.textContent = '';
			var ul = node.appendChild(document.createElement('ul'));
			message.replace(/^\s*\*\s*/, '').split(/\n\*\s*/).map(function (line) {
				var li = ul.appendChild(document.createElement('li'));
				li.textContent = line;
			});
		}],
		'preferred_storage_head',
		'init_head',
		'init_desc',
		'init_confirm',
		'save'
	]
	.forEach(function (key) {
		if (Object.prototype.toString.call(key) != '[object Array]') {
			key = [key];
		}

		var messageId = 'option_' + key[0];
		var callback = key[1] || function (node, message) {node.textContent = message};
		var fallbackMessage = '(translated message not found)';
		var message = req.messageCatalog ?
			(messageId in req.messageCatalog ? req.messageCatalog[messageId].message : fallbackMessage) :
			(extension.getMessage(messageId) || fallbackMessage);
		var nodes = document.evaluate(
			'//*[text()="__MSG_' + messageId + '__"]', document.documentElement, null,
			window.XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);

		for (var i = 0, goal = nodes.snapshotLength; i < goal; i++) {
			callback(nodes.snapshotItem(i), message);
		}
	});

	document.evaluate(
		'//*[@name="quick-activation"][@value="' + (quickActivation ? 1 : 0) + '"]',
		document.body, null,
		window.XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.checked = true;

	// transition
	var overlay = document.getElementById('overlay');
	var tend = function (e) {e.target.parentNode && e.target.parentNode.removeChild(e.target)};
	'transitionend webkitTransitionEnd oTransitionEnd msTransitionEnd'
		.split(' ').forEach(function (p) {overlay.addEventListener(p, tend, false)});
	overlay.className = 'overlay';
}

/**
 * save button handler
 * ----------------
 */

function handleOptionsSave () {
	var items = [];
	var tmpEnableList = {};
	var count = 0;

	for (var i in enableList) {
		var el = document.getElementById(i);
		if (el && el.nodeName == 'INPUT' && el.type == 'checkbox') {
			tmpEnableList[i] = el.checked;
			count++;
		}
	}
	if (count) {
		items.push({key:'targets', value:tmpEnableList});
	}

	var el = document.getElementById('exrc');
	if (el && el.nodeName == 'TEXTAREA') {
		items.push({key:'exrc', value:el.value});
	}

	var el = document.querySelector('input[name="quick-activation"]:checked');
	if (el) {
		items.push({key:'quickActivation', value:el.value == '1' ? '1' : '0'});
	}

	var el = document.getElementById('shortcut');
	if (el) {
		items.push({key:'shortcut', value:el.value});
	}

	var el = document.getElementById('font-family');
	if (el && el.nodeName == 'INPUT') {
		items.push({key:'fontFamily', value:el.value});
	}

	items.length && extension.postMessage(
		{type:'set-storage', items:items},
		function () {
			var saveResult = document.getElementById('save-result');
			if (saveResult) {
				saveResult.textContent = 'saved.';
				setTimeout(function () {
					saveResult.textContent = '';
				}, 1000 * 2);
			}
		}
	);
}

/**
 * init button handler
 * ----------------
 */

function handleOptionsInit () {
	var message = document.getElementById('opt-init-confirm').textContent;
	window.confirm(message) && extension.postMessage(
		{type:'init-options'},
		function () {
			location.reload();
		}
	);
}

/**
 * resize handler for target element
 * ----------------
 */

function handleTargetResize (e) {
	if (targetElementResizedTimer) return;
	targetElementResizedTimer = setTimeout(function () {
		if (wasaviFrame && targetElement) {
			locate(wasaviFrame, targetElement, isFullscreen, extraHeight);
		}
		targetElementResizedTimer = null;
	}, 100);
}

/**
 * shortcut key tester
 * ----------------
 */

function matchWithShortcut (e) {
	return shortcutCode.some(function (code) {
		for (var i in code) {
			if (!(i in e)) return false;
			if (e[i] !== code[i]) return false;
		}
		return true;
	});
}

/**
 * agent initializer
 * ----------------
 */

function handleAgentInitialized (req) {
	isTestFrame = window.location.href.indexOf('http://wasavi.appsweets.net/test_frame.html') == 0;

	if (window.location.href == extension.urlInfo.optionsUrl) {
		handleOptionsPageLoaded(req);
	}

	if (quickActivation) {
		window.addEventListener('focus', handleTargetFocus, true);
		window.removeEventListener('keydown', handleKeydown, true);
	}

	devMode
	&& WasaviExtensionWrapper.IS_TOP_FRAME
	&& document.querySelector('textarea')
	&& console.info(
		'wasavi agent: running on ' + window.location.href.replace(/[#?].*$/, ''));
}

/**
 * page agent
 * ----------------
 */

function createPageAgent (doHook) {
	var parent = document.head || document.body || document.documentElement;
	if (!parent) return;

	var code = '';

	// keyboard event hooking
	if (doHook) {
		code += " \
var wasaviRunning = false; \
function isHookEvent (en) {return en == 'keydown' || en == 'keypress'} \
function getKey (en, uc) {return en + '_' + !!uc} \
function hook (target) { \
	if (!target || !target.addEventListener || !target.removeEventListener) return; \
	var addOriginal = target.addEventListener, \
		removeOriginal = target.removeEventListener, \
		listeners = []; \
	target.addEventListener = function (en, fn, uc) { \
		if (!isHookEvent(en)) { \
			addOriginal.call(this, en, fn, uc); \
			return; \
		} \
		var key = getKey(en, uc); \
		!listeners[key] && (listeners[key] = []); \
		if (!listeners[key].some(function (o) {return o[0] == fn})) { \
			var wrappedListener = function (e) {!wasaviRunning && fn && fn(e)}; \
			listeners[key].push([fn, wrappedListener]); \
			addOriginal.call(this, en, wrappedListener, uc); \
		} \
	}; \
	target.removeEventListener = function (en, fn, uc) { \
		if (!isHookEvent(en)) { \
			removeOriginal.call(this, en, fn, uc); \
			return; \
		} \
		var key = getKey(en, uc); \
		if (!listeners[key]) return; \
		listeners[key] = listeners[key].filter(function (o) { \
			if (o[0] != fn) return true; \
			removeOriginal.call(this, en, o[1], uc); \
			return false; \
		}, this); \
	}; \
} \
hook(win.HTMLInputElement && win.HTMLInputElement.prototype); \
hook(win.HTMLTextAreaElement && win.HTMLTextAreaElement.prototype); \
hook(win.Node && win.Node.prototype); \
";
	}

	// launch event handlers and indirect content setter/getter
	code += "\
doc.addEventListener('WasaviStarting', function () {wasaviRunning = true}, false); \
doc.addEventListener('WasaviTerminated', function () {wasaviRunning = false}, false); \
doc.addEventListener('WasaviRequestGetContent', function (e) { \
	var node = doc.getElementsByClassName(e.detail.className)[0]; \
	if (!node) return; \
	var result = ''; \
	node.classList.remove(e.detail.className); \
	if (node.CodeMirror) \
		try {result = node.CodeMirror.getValue()} catch (ex) {result = ''} \
	else if (node.classList.contains('ace_editor') && win.ace) \
		try {result = win.ace.edit(node).getValue()} catch(ex) {result = ''} \
	var ev = doc.createEvent('CustomEvent'); \
	ev.initCustomEvent('WasaviResponseGetContent', false, false, result); \
	doc.dispatchEvent(ev); \
}, false); \
doc.addEventListener('WasaviRequestSetContent', function (e) { \
	var node = doc.getElementsByClassName(e.detail.className)[0]; \
	if (!node) return; \
	node.classList.remove(e.detail.className); \
	if (node.CodeMirror) \
		try {node.CodeMirror.setValue(e.detail.content)} catch (ex) {} \
	else if (node.classList.contains('ace_editor') && win.ace) \
		try {win.ace.edit(node).setValue(e.detail.content)} catch(ex) {} \
}, false); \
";

	var s = document.createElement('script');
	s.onload = function () {
		this.onload = null;
		this.parentNode.removeChild(this);
	};
	s.type = 'text/javascript';
	s.src = 'data:text/javascript;base64,' + window.btoa(
		'!function(win,doc){' +
		code +
		'}(window, document);'
	);
	parent.appendChild(s);
}

/**
 * handler for launch request event
 */

function handleRequestLaunch () {
	if (wasaviFrame || targetElement) return;
	if (typeof document.hasFocus == 'function' && !document.hasFocus()) return;

	var target = document.activeElement;
	if (target.isContentEditable && enableList.enableContentEditable
	||  (target.nodeName == 'TEXTAREA' || target.nodeName == 'INPUT')
		&& target.type in ACCEPTABLE_TYPES
		&& enableList[ACCEPTABLE_TYPES[target.type]]) {

		run(target);
	}
}

/**
 * handler for response from element content retriever
 */

function handleResponseGetContent (e) {
	if (getValueCallback) {
		getValueCallback(e.detail);
		getValueCallback = null;
	}
}

/**
 * bootstrap
 * ----------------
 */

extension = WasaviExtensionWrapper.create();

if (WasaviExtensionWrapper.HOTKEY_ENABLED) {
	createPageAgent(false);
}
else {
	window.addEventListener('keydown', handleKeydown, true);
	createPageAgent(true);
	
}

extension.setMessageListener(function (req) {
	if (!req || !req.type) return;
	switch (req.type) {
	/*
	 * messages from background
	 */
	case 'init-response':
		enableList = req.targets;
		exrc = req.exrc;
		shortcut = req.shortcut;
		shortcutCode = req.shortcutCode;
		fontFamily = req.fontFamily;
		quickActivation = req.quickActivation;
		extraHeight = 0;
		devMode = req.devMode;

		if (document.readyState == 'interactive' || document.readyState == 'complete') {
			handleAgentInitialized(req);
		}
		else {
			document.addEventListener('DOMContentLoaded', function handleDCL (e) {
				document.removeEventListener(e.type, handleDCL, false);
				handleAgentInitialized(req)
			}, false);
		}
		break;

	case 'update-storage':
		req.items.forEach(function (item) {
			switch (item.key) {
			case 'targets':
				enableList = item.value;
				break;

			case 'exrc':
				exrc = item.value;
				break;

			case 'shortcut':
				shortcut = item.value;
				break;

			case 'shortcutCode':
				shortcutCode = item.value;
				break;

			case 'quickActivate':
				quickActivation = item.value;
				break;
			}
		});
		break;

	case 'request-run':
		handleRequestLaunch();
		break;

	/*
	 * messages from wasavi iframe
	 */
	case 'wasavi-initialized':
		if (!wasaviFrame) break;
		var currentHeight = wasaviFrame.offsetHeight;
		var newHeight = req.height || targetElement.offsetHeight;
		extraHeight = newHeight - currentHeight;
		wasaviFrame.style.height = newHeight + 'px';
		wasaviFrame.style.boxShadow = '0 3px 8px 4px rgba(0,0,0,0.5)';
		wasaviFrame.setAttribute('data-wasavi-state', 'running');
		window.addEventListener('resize', handleTargetResize, false);

		if (isTestFrame) {
			wasaviFrame.id = 'wasavi_frame';
			document.getElementById('test-log').value = '';
		}

		try {
			extension.postMessage({
				type:'notify-to-child',
				childTabId:req.childTabId,
				payload:{type:'got-initialized'}
			});
		} catch (e) {}
		break;

	case 'wasavi-ready':
		if (!wasaviFrame) break;
		document.activeElement != wasaviFrame && focusToFrame(req);
		wasaviFrame.style.visibility = 'visible';
		devMode && console.info('wasavi started');
		fireCustomEvent('WasaviStarted', 0);

		clearTimeout(wasaviFrameTimeoutTimer);
		wasaviFrameTimeoutTimer = null;
		break;

	case 'wasavi-window-state':
		if (!wasaviFrame) break;
		switch (req.state) {
		case 'maximized':
		case 'normal':
			isFullscreen = req.state == 'maximized';
			locate(wasaviFrame, targetElement, isFullscreen, extraHeight);
			break;
		}
		break;

	case 'wasavi-focus-me':
		if (!wasaviFrame) break;
		focusToFrame(req);
		break;

	case 'wasavi-focus-changed':
		if (!wasaviFrame || !targetElement) break;
		var focusables = getFocusables();
		var index = focusables.indexOf(targetElement);
		try {
			if (index >= 0) {
				var next = req.direction == 1 ?
					(index + 1) % focusables.length :
					(index + focusables.length - 1) % focusables.length;

				blurFromFrame();

				if (next == targetElement) {
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
		break;

	case 'wasavi-blink-me':
		if (!wasaviFrame) break;
		wasaviFrame.style.visibility = 'hidden';
		wasaviFrame && setTimeout(function () {
			if (!wasaviFrame) return;
			wasaviFrame.style.visibility = '';
		}, 500);
		break;

	case 'wasavi-terminated':
		if (!wasaviFrame) break;
		if (isTestFrame) {
			if (stateClearTimer) {
				clearTimeout(stateClearTimer);
				stateClearTimer = null;
			}
			document.querySelector('h1').style.color = '';
		}
		cleanup(req.value, req.isImplicit);
		devMode && console.info('wasavi terminated');
		fireCustomEvent('WasaviTerminated', 0);
		break;

	case 'wasavi-read':
		if (!wasaviFrame) break;
		try {
			extension.postMessage({
				type:'notify-to-child',
				childTabId:req.childTabId,
				payload:{
					type:'fileio-read-response',
					state:'complete',
					meta:{
						path:'',
						charLength:targetElement.value.length
					},
					content:targetElement.value
				}
			});
		} catch (e) {}
		break;

	case 'wasavi-saved':
		if (!wasaviFrame) break;
		var result = setValue(targetElement, req.value, req.isForce);
		var payload = {type:'fileio-write-response'};
		if (typeof result == 'number') {
			payload.state = 'complete';
			payload.meta = {
				path:req.value.path,
				charLength:result
			};
		}
		else if (Object.prototype.toString.call(value) == '[object Array]') {
			payload.error = result;
		}
		else {
			payload.error = _('Internal state error.');
		}
		try {
			extension.postMessage({
				type:'notify-to-child',
				childTabId:req.childTabId,
				payload:payload
			});
		} catch (e) {}
		break;

	/*
	 * following cases are for functionality test.
	 * available only on http://wasavi.appsweets.net/test_frame.html
	 */
	case 'wasavi-notify-keydown':
		if (!isTestFrame) break;
		if (stateClearTimer) {
			clearTimeout(stateClearTimer);
			stateClearTimer = null;
			//log('notify-keydown: timer cleared', '', '');
		}
		log(req.eventType, req.keyCode, req.key);
		break;

	case 'wasavi-command-start':
		if (!isTestFrame) break;
		if (wasaviFrame.getAttribute('data-wasavi-command-state') != 'busy') {
			wasaviFrame.setAttribute('data-wasavi-command-state', 'busy');
			log('command-start', '', '');
		}
		document.querySelector('h1').style.color = 'red';
		break;

	case 'wasavi-notify-state':
		if (!isTestFrame) break;
		if (stateClearTimer) {
			clearTimeout(stateClearTimer);
		}
		stateClearTimer = setTimeout(function () {
			wasaviFrame.setAttribute('data-wasavi-state', JSON.stringify(req.state));
			wasaviFrame.setAttribute('data-wasavi-input-mode', req.state.inputMode);

			stateClearTimer = null;
			wasaviFrame.removeAttribute('data-wasavi-command-state');
			log('notify-state', '', '');
		}, 100);
		//log('notify-state: timer registered.', '', '');
		break;

	case 'wasavi-command-completed':
		if (!isTestFrame) break;
		if (stateClearTimer) {
			clearTimeout(stateClearTimer);
		}
		stateClearTimer = setTimeout(function () {
			wasaviFrame.setAttribute('data-wasavi-state', JSON.stringify(req.state));
			wasaviFrame.setAttribute('data-wasavi-input-mode', req.state.inputMode);
			wasaviFrame.setAttribute('data-wasavi-line-input', req.state.lineInput);

			log('command-completed', '', '');
			keyStrokeLog.unshift('*** sequence point ***');
			document.querySelector('h1').style.color = '';
			document.getElementById('test-log').value =
				keyStrokeLog.join('\n') + '\n' + document.getElementById('test-log').value;

			var state = document.getElementById('state');
			state.textContent = '';
			['running', 'state', 'inputMode', 'row', 'col', 'lastMessage'].forEach(function (p) {
				state.appendChild(document.createElement('div')).textContent =
					p + ': ' + req.state[p];
			});

			keyStrokeLog = [];

			stateClearTimer = null;
			//wasaviFrame.setAttribute('data-wasavi-command-state', 'done');
			wasaviFrame.removeAttribute('data-wasavi-command-state');
		}, 100);
		//log('command-completed: timer registered.', '', '');
		break;
	}
});
extension.connect('init-agent');
document.addEventListener('WasaviRequestLaunch', handleRequestLaunch, false);
document.addEventListener('WasaviResponseGetContent', handleResponseGetContent, false);

})(this);

// vim:set ts=4 sw=4 fileencoding=UTF-8 fileformat=unix filetype=javascript fdm=marker :
