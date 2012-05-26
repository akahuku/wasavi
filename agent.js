// ==UserScript==
// @include http://*/*
// @include https://*/*
// @exclude http://appsweets.net/wasavi/wasavi_frame.html
// @exclude https://ss1.xrea.com/appsweets.net/wasavi/wasavi_frame.html
// ==/UserScript==
//
/**
 * wasavi: vi clone implemented in javascript
 * =============================================================================
 *
 *
 * @author akahuku@gmail.com
 * @version $Id: agent.js 128 2012-05-26 09:15:39Z akahuku $
 *
 *
 * Copyright (c) 2012 akahuku@gmail.com
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     1. Redistributions of source code must retain the above copyright
 *        notice, this list of conditions and the following disclaimer.
 *     2. Redistributions in binary form must reproduce the above
 *        copyright notice, this list of conditions and the following
 *        disclaimer in the documentation and/or other materials
 *        provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

typeof WasaviExtensionWrapper != 'undefined'
&& window.location.href != WasaviExtensionWrapper.framePageUrl.external
&& window.location.href != WasaviExtensionWrapper.framePageUrl.externalSecure
&& (function (global) {

	/*const*/var EXTENSION_SPECIFIER = 'data-texteditor-extension';
	/*const*/var EXTENSION_CURRENT = 'data-texteditor-extension-current';
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
	var shortcutTester;
	var fontFamily;

	var targetElement;
	var wasaviFrame;
	var keyStroked;

	/**
	 * wasavi runner
	 * ----------------
	 */

	function run (element) {
		function getFontStyle (s, fontFamilyOverride) {
			return [s.fontStyle, s.fontVariant, s.fontWeight, s.fontSize,
				'/' + s.lineHeight, (fontFamilyOverride || s.fontFamily)].join(' ');
		}
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

		targetElement = element;

		var rect = element.getBoundingClientRect();
		var isFixed = isFixedPosition(element);
		wasaviFrame = document.createElement('iframe');
		wasaviFrame.style.position = isFixed ? 'fixed' : 'absolute';
		wasaviFrame.style.left = (
			rect.left + 
			(isFixed ? 0 : Math.max(document.documentElement.scrollLeft, document.body.scrollLeft))
		) + 'px';
		wasaviFrame.style.top = (
			rect.top + 
			(isFixed ? 0 : Math.max(document.documentElement.scrollTop, document.body.scrollTop))
		) + 'px';
		wasaviFrame.style.width = rect.width + 'px';
		wasaviFrame.style.height = rect.height + 'px';
		wasaviFrame.style.border = 'none';
		wasaviFrame.style.overflow = 'hidden';
		wasaviFrame.style.visibility = 'hidden';
		wasaviFrame.style.zIndex = 0x00ffffff;

		if (WasaviExtensionWrapper.framePageUrl.internalAvailable) {
			wasaviFrame.src = WasaviExtensionWrapper.framePageUrl.internal;
		}
		else if (window.location.protocol == 'https:') {
			wasaviFrame.src = WasaviExtensionWrapper.framePageUrl.externalSecure;
		}
		else {
			wasaviFrame.src = WasaviExtensionWrapper.framePageUrl.external;
		}

		wasaviFrame.onload = function handleIframeLoaded (e) {
			var s = document.defaultView.getComputedStyle(element, '');
			var payload = {
				type:'run',
				parentTabId:extension.tabId,
				id:element.id,
				nodeName:element.nodeName,
				elementType:element.type,
				selectionStart:element.selectionStart,
				selectionEnd:element.selectionEnd,
				scrollTop:element.scrollTop,
				scrollLeft:element.scrollLeft,
				readOnly:element.readOnly,
				value:element.value,
				rect:{width:rect.width, height:rect.height},
				fontStyle:getFontStyle(s, fontFamily)
			};
			extension.postMessage({type:'notify-to-child', payload:payload});
		};

		document.body.appendChild(wasaviFrame);
	}

	function cleanup (value) {
		if (targetElement) {
			if (value !== undefined) {
				targetElement.value = value;
			}
			targetElement.removeAttribute(EXTENSION_CURRENT);
			targetElement = null;
		}
		if (wasaviFrame) {
			wasaviFrame.parentNode.removeChild(wasaviFrame);
			wasaviFrame = null;
		}
	}

	function focusToFrame () {
		if (wasaviFrame) {
			try {
				wasaviFrame.focus
				&& wasaviFrame.focus();
			} catch (e) {}
			try {
				wasaviFrame.contentWindow
				&& wasaviFrame.contentWindow.focus
				&& wasaviFrame.contentWindow.focus();
			} catch (e) {}
		}
	}

	/**
	 * keydown handler
	 * ----------------
	 */

	function handleKeydown (e) {
		if (targetElement || !e || !e.target) return;
		if (e.target.nodeName != 'TEXTAREA' && e.target.nodeName != 'INPUT') return;
		if (!(e.target.type in ACCEPTABLE_TYPES) 
		||  !enableList[ACCEPTABLE_TYPES[e.target.type]]) return;

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

	    if (shortcutTester(e)) {
			e.target.setAttribute(EXTENSION_CURRENT, 'wasavi');
			e.preventDefault();
			run(e.target);
		}
	}

	/**
	 * DOMContentLoaded on options page handler
	 * ----------------
	 */

	function handleOptionsPageLoaded () {
		for (var i in enableList) {
			var el = document.getElementById(i);
			if (el && el.nodeName == 'INPUT' && el.type == 'checkbox') {
				el.checked = enableList[i];
			}
		}

		var el = document.getElementById('exrc');
		if (el && el.nodeName == 'TEXTAREA') {
			el.value = exrc;
		}

		var el = document.getElementById('shortcut');
		if (el && el.nodeName == 'INPUT') {
			el.value = shortcut;
		}

		var el = document.getElementById('font-family');
		if (el && el.nodeName == 'INPUT') {
			el.value = fontFamily;
		}

		var el = document.getElementById('save');
		if (el) {
			el.addEventListener('click', handleOptionsSave, false);
		}
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
			items.push({key:'targets', value:JSON.stringify(tmpEnableList)});
		}
		
		var el = document.getElementById('exrc');
		if (el && el.nodeName == 'TEXTAREA') {
			items.push({key:'exrc', value:el.value});
		}

		var el = document.getElementById('shortcut');
		if (el && el.nodeName == 'INPUT') {
			items.push({key:'shortcut', value:el.value});
		}

		var el = document.getElementById('font-family');
		if (el && el.nodeName == 'INPUT') {
			items.push({key:'font-family', value:el.value});
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
	 * shortcut key testing function factory
	 * ----------------
	 */

	function createShortcutTester (code) {
		var result;
		try {
			result = new Function('e', code);
		}
		catch (e) {
			result = new Function('return false;');
		}
		return result;
	}

	/**
	 * agent initializer handler
	 * ----------------
	 */

	function handleAgentInitialized () {
		if (window.location.href == WasaviExtensionWrapper.optionsPageUrl) {
			handleOptionsPageLoaded();
		}
		//else {
			window.addEventListener('keydown', handleKeydown, true);
		//}

		var isTopFrame;
		try { isTopFrame = !window.frameElement; } catch (e) {} 
		isTopFrame && document.querySelectorAll('textarea').length && console.log(
			'wasavi agent: running on ' + window.location.href.replace(/[#?].*$/, ''));
	}

	/**
	 * bootstrap
	 * ----------------
	 */

	extension = WasaviExtensionWrapper.create();
	extension.setMessageListener(function (req) {
		if (!req || !req.type) return;

		switch (req.type) {
		case 'init-response':
			enableList = JSON.parse(req.targets);
			exrc = req.exrc;
			shortcut = req.shortcut;
			shortcutTester = createShortcutTester(req.shortcutCode);
			fontFamily = req.fontFamily;

			if (window.chrome) {
				WasaviExtensionWrapper.framePageUrl.internalAvailable = true;
			}
			if (document.readyState == 'interactive' || document.readyState == 'complete') {
				handleAgentInitialized();
			}
			else {
				document.addEventListener('DOMContentLoaded', function () {
					document.removeEventListener('DOMContentLoaded', arguments.callee, false);
					handleAgentInitialized()
				}, false);
			}
			break;

		case 'update-storage':
			req.items.forEach(function (item) {
				switch (item.key) {
				case 'targets':
					enableList = JSON.parse(item.value);
					break;

				case 'exrc':
					exrc = item.value;
					break;

				case 'shortcut':
					shortcut = item.value;
					break;

				case 'shortcutCode':
					shortcutTester = createShortcutTester(item.value);
					break;
				}
			});
			break;

		case 'wasavi-initialized':
			if (!wasaviFrame) break;
			wasaviFrame.style.visibility = 'visible';
			focusToFrame();

			var animationHeight = targetElement.offsetHeight;
			var goalHeight = req.height || targetElement.offsetHeight;

			(function () {
				if (!targetElement || !wasaviFrame) return;

				wasaviFrame.style.height = animationHeight + 'px';

				if (keyStroked
				|| animationHeight >= goalHeight) {
					wasaviFrame.style.height = goalHeight + 'px';
					wasaviFrame.style.boxShadow = '0 1px 8px 4px #444';
					console.info('wasavi started');
				}
				else {
					animationHeight++;
					setTimeout(arguments.callee, 10);
				}
			})();
			break;

		case 'wasavi-stroked':
			if (!wasaviFrame) break;
			keyStroked = true;
			break;

		case 'wasavi-window-state':
			if (!wasaviFrame) break;
			console.log('window-state: ' + req.state);
			break;

		case 'wasavi-focus-me':
			if (!wasaviFrame) break;
			focusToFrame();
			break;

		case 'wasavi-terminated':
			if (!wasaviFrame) break;
			cleanup(req.value);
			console.info('wasavi terminated');
			break;
		}
	});
	extension.sendRequest({type:'init-agent'});
})(this);

// vim:set ts=4 sw=4 fileencoding=UTF-8 fileformat=unix filetype=javascript :
