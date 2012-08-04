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
 * @version $Id: agent.js 171 2012-08-03 07:39:54Z akahuku $
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

typeof WasaviExtensionWrapper != 'undefined'
&& !WasaviExtensionWrapper.framePageUrl.isExternal
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

	var targetElement;
	var wasaviFrame;
	var keyStroked;

	/**
	 * wasavi runner
	 * ----------------
	 */

	function locate (iframe, target, isFullscreen) {
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
			iframe.style.height = rect.height + 'px';
		}
		return rect;
	}

	function getHighestZindex (element) {
		var result = 0;
		var view = document.defaultView;
		for (; element; element = element.parentNode) {
			if (element.nodeType != 1) continue;
			var z = (element.style.zIndex || view.getComputedStyle(element, '').zIndex) - 0;
			if (z > result) result = z;
		}
		return result;
	}

	function run (element) {
		function getFontStyle (s, fontFamilyOverride) {
			return [s.fontStyle, s.fontVariant, s.fontWeight, s.fontSize,
				'/' + s.lineHeight, (fontFamilyOverride || s.fontFamily)].join(' ');
		}

		targetElement = element;
		wasaviFrame = document.createElement('iframe');
		var rect = locate(wasaviFrame, element);
		wasaviFrame.style.border = 'none';
		wasaviFrame.style.overflow = 'hidden';
		wasaviFrame.style.visibility = 'hidden';
		wasaviFrame.style.zIndex = getHighestZindex(element) + 100; //0x00ffffff;

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

	function cleanup (value, isImplicit) {
		if (targetElement) {
			if (value !== undefined) {
				targetElement.value = value;
			}
			!isImplicit && targetElement.focus();
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
				wasaviFrame.focus && wasaviFrame.focus();
			} catch (e) {}
			try {
				wasaviFrame.contentWindow
				&& wasaviFrame.contentWindow.focus
				&& wasaviFrame.contentWindow.focus();
			} catch (e) {}
		}
	}

	function blurFromFrame () {
		if (wasaviFrame) {
			try {
				wasaviFrame.contentWindow
				&& wasaviFrame.contentWindow.blur
				&& wasaviFrame.contentWindow.blur();
			} catch (e) {}
			try {
				wasaviFrame.blur && wasaviFrame.blur();
			} catch (e) {}
		}
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

		if (matchWithShortcut(e)) {
			e.target.setAttribute(EXTENSION_CURRENT, 'wasavi');
			e.preventDefault();
			run(e.target);
		}
	}

	/**
	 * focus handler
	 * ----------------
	 */

	function handleTargetFocus (e) {
		if (targetElement || !e || !e.target) return;
		if (e.target.nodeName != 'TEXTAREA' && e.target.nodeName != 'INPUT') return;
		if (!(e.target.type in ACCEPTABLE_TYPES) 
		||  !enableList[ACCEPTABLE_TYPES[e.target.type]]) return;

		var current = e.target.getAttribute(EXTENSION_CURRENT);
		var spec = e.target.getAttribute(EXTENSION_SPECIFIER);
		if (current !== null) return;
		if (spec !== null && spec !== 'auto' && spec !== 'wasavi') return;

		e.target.setAttribute(EXTENSION_CURRENT, 'wasavi');
		e.preventDefault();
		run(e.target);
	}

	/**
	 * DOMContentLoaded on options page handler
	 * ----------------
	 */

	function handleOptionsPageLoaded (req) {
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
			items.push({key:'targets', value:JSON.stringify(tmpEnableList)});
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
	 * shortcut key testing function factory
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
	 * agent initializer handler
	 * ----------------
	 */

	function handleAgentInitialized (req) {
		if (window.location.href == WasaviExtensionWrapper.optionsPageUrl) {
			WasaviExtensionWrapper.framePageUrl.internalAvailable = true;
			handleOptionsPageLoaded(req);
		}

		if (quickActivation) {
			window.addEventListener('focus', handleTargetFocus, true);
		}
		else {
			window.addEventListener('keydown', handleKeydown, true);
		}

		if (WasaviExtensionWrapper.isTopFrame) {
			document.querySelectorAll('textarea').length
			&& console.info(
				'wasavi agent: running on ' + window.location.href.replace(/[#?].*$/, ''));
		}
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
			shortcutCode = JSON.parse(req.shortcutCode);
			fontFamily = req.fontFamily;
			quickActivation = req.quickActivation;

			if (window.chrome) {
				WasaviExtensionWrapper.framePageUrl.internalAvailable = true;
			}
			if (document.readyState == 'interactive' || document.readyState == 'complete') {
				handleAgentInitialized(req);
			}
			else {
				document.addEventListener('DOMContentLoaded', function (e) {
					document.removeEventListener(e.type, arguments.callee, false);
					handleAgentInitialized(req)
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
					shortcutCode = JSON.parse(item.value);
					break;

				case 'quickActivate':
					quickActivate = item.value;
					break;
				}
			});
			break;

		case 'wasavi-initialized':
			if (!wasaviFrame) break;
			wasaviFrame.style.visibility = 'visible';
			focusToFrame();
			wasaviFrame.style.height = (req.height || targetElement.offsetHeight) + 'px';
			wasaviFrame.style.boxShadow = '0 1px 8px 4px #444';
			targetElement
			console.info('wasavi started');
			break;

		case 'wasavi-stroked':
			if (!wasaviFrame) break;
			keyStroked = true;
			break;

		case 'wasavi-window-state':
			if (!wasaviFrame) break;
			switch (req.state) {
			case 'maximized':
			case 'normal':
				var rect = locate(wasaviFrame, targetElement, req.state == 'maximized');
				extension.postMessage({type:'notify-to-child', childTabId:req.tabId, payload:{
					type:'relocate',
					rect:{width:rect.width, height:rect.height - req.modelineHeight}
				}});
				break;
			}
			break;

		case 'wasavi-focus-me':
			if (!wasaviFrame) break;
			focusToFrame();
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

		case 'wasavi-terminated':
			if (!wasaviFrame) break;
			cleanup(req.value, req.isImplicit);
			console.info('wasavi terminated');
			break;

		case 'wasavi-saved':
			if (!wasaviFrame) break;
			try {targetElement.value = req.value;} catch (e) {;}
			break;
		}
	});
	extension.sendRequest({type:'init-agent'});

})(this);

// vim:set ts=4 sw=4 fileencoding=UTF-8 fileformat=unix filetype=javascript :
