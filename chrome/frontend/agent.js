// ==UserScript==
// @include http://*/*
// @include https://*/*
// @exclude http://wasavi.appsweets.net/script_frame.html
// @exclude https://ss1.xrea.com/wasavi.appsweets.net/script_frame.html
// ==/UserScript==
//
/**
 * wasavi: vi clone implemented in javascript
 * =============================================================================
 *
 *
 * @author akahuku@gmail.com
 * @version $Id: agent.js 303 2013-06-09 15:45:32Z akahuku $
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
		var rect = {
			left:FULLSCREEN_MARGIN,
			top:FULLSCREEN_MARGIN,
			width:document.documentElement.clientWidth - FULLSCREEN_MARGIN * 2,
			height:document.documentElement.clientHeight - FULLSCREEN_MARGIN * 2
		};
		iframe.style.position = 'fixed';
		iframe.style.left = rect.left + 'px';
		iframe.style.top = rect.top + 'px';
		iframe.style.width = rect.width + 'px';
		iframe.style.height = rect.height + 'px';
	}
	else {
		var rect = target.getBoundingClientRect();
		var isFixed = isFixedPosition(target);
		iframe.style.position = isFixed ? 'fixed' : 'absolute';
		iframe.style.left = (
			rect.left +
			(isFixed ? 0 : Math.max(document.documentElement.scrollLeft, document.body.scrollLeft))
		) + 'px';
		iframe.style.top = (
			rect.top +
			(isFixed ? 0 : Math.max(document.documentElement.scrollTop, document.body.scrollTop))
		) + 'px';
		iframe.style.width = rect.width + 'px';
		iframe.style.height = rect.height + (extraHeight || 0) + 'px';
	}
	return rect;
}

function run (element) {
	extension.postMessage(
		{type:'request-wasavi-frame'},
		function (res) {
			runCore(element, res.data);
		}
	);
}

function runCore (element, frameSource) {
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
		return [s.fontStyle, s.fontVariant, s.fontWeight, s.fontSize,
			'/' + s.lineHeight, (fontFamilyOverride || s.fontFamily)].join(' ');
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
	targetElement.setAttribute(EXTENSION_CURRENT, 'wasavi');
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
		readOnly:element.readOnly,
		value:getValue(element),
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
	}, 1000 * 5 * 3600);
}

function cleanup (value, isImplicit) {
	if (targetElement) {
		if (value !== undefined) {
			targetElement.value = value;
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

function getValue (element) {
	var result = '';

	if (element.nodeName == 'INPUT' || element.nodeName == 'TEXTAREA') {
		result = element.value;
	}
	else if (element.isContentEditable) {
		result = toPlainText(element);
	}

	return result;
}

function setValue (element, value) {
	if (element.nodeName == 'INPUT' || element.nodeName == 'TEXTAREA') {
		element.value = value;
	}
	else if (element.isContentEditable && Object.prototype.toString.call(value) == '[object Array]') {
		var r = document.createRange();
		r.selectNodeContents(element);
		r.deleteContents();
		r.detach();

		var f = document.createDocumentFragment();
		for (var i = 0, goal = value.length; i < goal; i++) {
			f.appendChild(document.createElement('p')).textContent = value[i];
		}

		try {element.appendChild(f)} catch (e) {}
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

		if (isBlock(display)) {
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
		if (spec !== null && spec !== 'auto' && spec !== 'wasavi') return;

		if (matchWithShortcut(e)) {
			var ev = document.createEvent('CustomEvent');
			ev.initCustomEvent('WasaviStarting', false, false, 0);
			document.dispatchEvent(ev);
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
		if (spec !== null && spec !== 'auto' && spec !== 'wasavi') return;

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

	function replaceMessage (messageId, callback) {
		var fallbackMessage = '(translated message not found)';
		var message;
		if (req.messageCatalog) {
			message = messageId in req.messageCatalog ?
				req.messageCatalog[messageId].message : fallbackMessage;
		}
		else {
			message = extension.getMessage(messageId) || fallbackMessage;
		}
		var nodes = document.evaluate(
			'//*[text()="__MSG_' + messageId + '__"]', document.documentElement, null,
			window.XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);

		for (var i = 0, goal = nodes.snapshotLength; i < goal; i++) {
			var node = nodes.snapshotItem(i);
			if (callback) {
				callback(node, message);
			}
			else {
				node.textContent = message;
			}
		}
	}
	replaceMessage('option_title');
	replaceMessage('option_exrc_head');
	replaceMessage('option_target_elements_head');
	replaceMessage('option_starting_type_head');
	replaceMessage('option_font_family_head');
	replaceMessage('option_exrc_desc');
	replaceMessage('option_quick_activation_on');
	replaceMessage('option_quick_activation_off');
	replaceMessage('option_target_elements_desc', function (node, message) {
		node.textContent = '';
		var ul = node.appendChild(document.createElement('ul'));
		message.replace(/^\s*\*\s*/, '').split(/\n\*\s*/).map(function (line) {
			var li = ul.appendChild(document.createElement('li'));
			li.textContent = line;
		});
	});
	replaceMessage('option_preferred_storage_head');
	replaceMessage('option_init_head');
	replaceMessage('option_init_desc');
	replaceMessage('option_init_confirm');

	replaceMessage('option_save');

	document.evaluate(
		'//*[@name="quick-activation"][@value="' + (quickActivation ? 1 : 0) + '"]',
		document.body, null,
		window.XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.checked = true;
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
	isTestFrame = window.location.href == 'http://wasavi.appsweets.net/test_frame.html';

	if (window.location.href == extension.urlInfo.optionsUrl) {
		handleOptionsPageLoaded(req);
	}

	if (quickActivation) {
		window.addEventListener('focus', handleTargetFocus, true);
		window.removeEventListener('keydown', handleKeydown, true);
	}

	devMode
	&& WasaviExtensionWrapper.IS_TOP_FRAME
	&& document.querySelectorAll('textarea').length
	&& console.info(
		'wasavi agent: running on ' + window.location.href.replace(/[#?].*$/, ''));
}

/**
 * page agent
 * ----------------
 */

function createPageAgent () {
	extension.getExtensionFileURL('/key_hook.js', function (url) {
		if (!url) return;

		var parent = document.head || document.body || document.documentElement;
		if (!parent) return;

		var s = document.createElement('script');
		s.onload = function () {
			this.onload = null;
			this.parentNode.removeChild(this);
		};
		s.type = 'text/javascript';
		s.src = url;
		parent.appendChild(s);
	});
}

/**
 * bootstrap
 * ----------------
 */

extension = WasaviExtensionWrapper.create();

if (!WasaviExtensionWrapper.HOTKEY_ENABLED) {
	window.addEventListener('keydown', handleKeydown, true);
	createPageAgent();
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
		if (wasaviFrame || targetElement) break;

		var target = document.activeElement;
		if (target.isContentEditable && enableList.enableContentEditable
		||  (target.nodeName == 'TEXTAREA' || target.nodeName == 'INPUT')
			&& target.type in ACCEPTABLE_TYPES
			&& enableList[ACCEPTABLE_TYPES[target.type]]) {

			run(target);
		}
		break;

	/*
	 * messages from wasavi iframe
	 */
	case 'wasavi-initialized':
		if (!wasaviFrame) break;
		wasaviFrame.style.visibility = 'visible';
		document.activeElement != wasaviFrame && focusToFrame(req);
		var currentHeight = wasaviFrame.offsetHeight;
		var newHeight = req.height || targetElement.offsetHeight;
		extraHeight = newHeight - currentHeight;
		wasaviFrame.style.height = newHeight + 'px';
		wasaviFrame.style.boxShadow = '0 2px 8px 4px #444';
		wasaviFrame.setAttribute('data-wasavi-state', 'running');
		window.addEventListener('resize', handleTargetResize, false);

		if (isTestFrame) {
			wasaviFrame.id = 'wasavi_frame';
			document.getElementById('test-log').value = '';
		}

		devMode && console.info('wasavi started');
		var ev = document.createEvent('CustomEvent');
		ev.initCustomEvent('WasaviStarted', false, false, 0);
		document.dispatchEvent(ev);

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
		catch (e) {
			;
		}
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
		var ev = document.createEvent('CustomEvent');
		ev.initCustomEvent('WasaviTerminated', false, false, 0);
		document.dispatchEvent(ev);
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
		} catch (e) {;}
		break;

	case 'wasavi-saved':
		if (!wasaviFrame) break;
		try {
			setValue(targetElement, req.value);
			extension.postMessage({
				type:'notify-to-child',
				childTabId:req.childTabId,
				payload:{
					type:'fileio-write-response',
					state:'complete',
					meta:{
						path:req.value.path,
						charLength:req.value.length
					}
				}
			});
		} catch (e) {;}
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
			log('notify-keydown: timer cleared', '', '');
		}
		log(req.eventType, req.keyCode, req.key);
		break;

	case 'wasavi-command-start':
		if (!isTestFrame) break;
		wasaviFrame.setAttribute('data-wasavi-command-state', 'busy');
		document.querySelector('h1').style.color = 'red';
		log('command-start', '', '');
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
			log('notify-state: timer executed.', '', '');
		}, 100);
		log('notify-state: timer registered.', '', '');
		break;

	case 'wasavi-command-completed':
		if (!isTestFrame) break;
		if (stateClearTimer) {
			clearTimeout(stateClearTimer);
		}
		stateClearTimer = setTimeout(function () {
			wasaviFrame.setAttribute('data-wasavi-state', JSON.stringify(req.state));
			wasaviFrame.setAttribute('data-wasavi-input-mode', req.state.inputMode);

			log('command-completed: timer executed.', '', '');
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
			wasaviFrame.removeAttribute('data-wasavi-command-state');
		}, 100);
		log('command-completed: timer registered.', '', '');
		break;
	}
});
extension.connect('init-agent');

})(this);

// vim:set ts=4 sw=4 fileencoding=UTF-8 fileformat=unix filetype=javascript :
