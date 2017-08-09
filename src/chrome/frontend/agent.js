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

'use strict';

typeof WasaviExtensionWrapper != 'undefined'
&& !WasaviExtensionWrapper.urlInfo.isExternal
&& /^text\/html|^application\/xhtml/.test(document.contentType)
&& (function (global) {

// consts <<<1
const EXTENSION_SPECIFIER = 'data-texteditor-extension';
const EXTENSION_CURRENT = 'data-texteditor-extension-current';
const MARKS_ID = 'data-wasavi-marks';
const FULLSCREEN_MARGIN = 8;
const MIN_WIDTH_PIXELS = 320;
const MIN_HEIGHT_PIXELS = 240;
const BOOT_WAIT_TIMEOUT_MSECS = 1000 * 5;
const INSTANCE_MAX = 0x10000;
const ACCEPTABLE_TYPES = {
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
var siteOverrides;
var statusLineHeight;
var testLog;
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

function $ (id) {
	return typeof id == 'string' ? document.getElementById(id) : id;
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

function multiply (letter, times) {
	if (letter == '' || times <= 0) return '';
	var result = letter;
	while (result.length < times) {
		result += result;
	}
	return result.length == times ? result : result.substring(0, letter.length * times);
}

function getShadowActiveElement (node) {
	// @see https://github.com/akahuku/wasavi/issues/124
	// @see http://jsbin.com/fizeger/edit?html,output
	if (!node) return null;
	for (;;) {
		var root = node.shadowRoot;
		if (!root) return node;

		var inner = root.activeElement;
		if (!inner) return node;

		node = inner;
	}
}

var markDown = (function () {
	function getStyle (node, prop) {
		if (node.style[prop]) return node.style[prop];
		if (node.nodeName == 'SCRIPT') return 'none';
		var style = node.ownerDocument.defaultView.getComputedStyle(node, '');
		return style[prop];
	}

	function getQuotedCount (node, rootNode) {
		var result = 0;
		for (; node; node = node.parentNode) {
			if (node.nodeName == 'BLOCKQUOTE') {
				result++;
			}
			if (node == rootNode) {
				break;
			}
		}
		return result;
	}

	function isBlock (display) {
		return 'table-row block list-item'.indexOf(display) >= 0;
	}

	function isForceInline (display) {
		return 'table-row'.indexOf(display) >= 0;
	}

	function Unit (text, nodeName, display, whiteSpace, quotedCount) {
		this.text = [text];
		this.nodeName = nodeName || '';
		this.display = display || '';
		this.whiteSpace = whiteSpace || '';
		this.quotedCount = quotedCount || 0;
	}

	Unit.prototype = {
		append: function (text) {
			var last = this.text.length - 1;
			if (this.text[last] == '') {
				this.text[last] = text.replace(/^\s+/, '');
			}
			else {
				var re1 = /^(.*?)(\s*)$/.exec(this.text[last]);
				var re2 = /^(\s*)([\s\S]*)$/.exec(text);
				this.text[last] =
					(re1[1] || '') +
					((re1[2] && re1[2].length || re2[1] && re2[1].length) ? ' ' : '') +
					(re2[2] || '').replace(/[\n\t ]+/g, ' ');
			}
		},
		appendNewline: function () {
			this.text.push('');
		}
	};

	function ToPlainText (opts) {
		this.opts = opts || {};
		this.buffer = null;
	};

	ToPlainText.prototype = {
		preunits: {
			a: function () { this.append('[') },
			b: function () { this.append('**') },
			br: function () { this.appendNewline() },
			code: function () { this.append('`') },
			h1: function (node, nodeName) { this.append(multiply('#', nodeName.substring(1) - 0) + ' ') },
			h2: function () { this.preunits.h1.apply(this, arguments) },
			h3: function () { this.preunits.h1.apply(this, arguments) },
			h4: function () { this.preunits.h1.apply(this, arguments) },
			h5: function () { this.preunits.h1.apply(this, arguments) },
			h6: function () { this.preunits.h1.apply(this, arguments) },
			hr: function () { this.append('* * *') },
			i: function () { this.append('_') },
			img: function (node, nodeName) {
				this.append(
					'![' + (node.getAttribute('alt') || '') + ']' +
					'(' + (node.getAttribute('src') || '') + ')'
				);
			},
			li: function (node) {
				var prefix = '* ';
				var listIndex = Array.prototype.indexOf.call(node.parentNode.children, node);
				if (node.parentNode.nodeName == 'OL') {
					prefix = (listIndex + 1) + '. ';
				}
				this.append(prefix);
				this.prop('isFirstListItem', listIndex == 0);
				this.prop('isLastListItem', listIndex == node.parentNode.children.length - 1);

				var depth = -1;
				for (var p = node.parentNode; p; p = p.parentNode) {
					if (p.nodeName == 'OL' || p.nodeName == 'UL') {
						depth++;
					}
				}
				this.prop('listDepth', depth);
			}
		},
		postunits: {
			a: function (node) { this.append('](' + node.getAttribute('href') + ')') },
			b: function () { this.append('**') },
			code: function () { this.append('`') },
			i: function () { this.append('_') }
		},
		dump: function () {
			var buffer = ['*** dump ***'];
			this.buffer.forEach(function (b, i) {
				var tmp = [
					'--- #' + i + ' ---',
					'    text: "' + b.text.replace(/\n/g, '\\n')
										  .replace(/\t/g, '\\t') + '"',
					' display: ' + b.display +
						', nodeName: ' + b.nodeName +
						', quotedCount: ' + b.quotedCount
				];
				if ('listDepth' in b) {
					tmp.push('listDepth: ' + b.listDepth);
				}
				if ('isFirstListItem' in b) {
					tmp.push('isFirstListItem: ' + b.isFirstListItem);
				}
				if ('isLastListItem' in b) {
					tmp.push('isLastListItem: ' + b.isLastListItem);
				}
				buffer.push.apply(buffer, tmp);
			});
			return buffer.join('\n');
		},
		newUnit: function (nodeName, display, whiteSpace, quotedCount) {
			this.buffer.push(new Unit('', nodeName, display, whiteSpace, quotedCount));
		},
		getResult: function () {
			return this.buffer.map(function (b) {return b.text}).join('');
		},
		append: function () {
			var i = this.buffer.length - 1;
			if (i < 0) return;
			return this.buffer[i].append.apply(this.buffer[i], arguments);
		},
		appendNewline: function () {
			var i = this.buffer.length - 1;
			if (i < 0) return;
			this.buffer[i].appendNewline.apply(this.buffer[i], arguments);
		},
		prop: function (propName, value) {
			var i = this.buffer.length - 1;
			if (i < 0) return;
			this.buffer[i][propName] = value;
		},
		emit: function () {
			var args = Array.prototype.slice.call(arguments);
			var eventName = args.shift();
			if (typeof this.opts[eventName] != 'function') return;
			try {
				this.opts[eventName].apply(this, args);
			}
			catch (e) {}
		},
		mainloop: function (node, rootNode) {
			var display = getStyle(node, 'display');
			if (display == 'none') return;

			var block = isBlock(display);
			if (block) {
				this.newUnit(
					node.nodeName,
					display,
					getStyle(node, 'whiteSpace'),
					getQuotedCount(node, rootNode)
				);
			}

			var nodeName = node.nodeName.toLowerCase();
			if (this.opts.preunits && nodeName in this.opts.preunits) {
				this.opts.preunits[nodeName].call(this, node, nodeName);
			}
			else if (nodeName in this.preunits) {
				this.preunits[nodeName].call(this, node, nodeName);
			}

			var lastUnitIndex = -1;
			for (var i = 0, goal = node.childNodes.length; i < goal; i++) {
				var c = node.childNodes[i];

				if (c.nodeType == 3) {
					if (lastUnitIndex >= 0 && lastUnitIndex != this.buffer.length - 1) {
						this.newUnit(
							c.parentNode.nodeName,
							getStyle(c.parentNode, 'display'),
							getStyle(c.parentNode, 'whiteSpace'),
							getQuotedCount(node, rootNode)
						);
					}
					this.append(c.nodeValue);
					lastUnitIndex = this.buffer.length - 1;
				}
				else {
					this.mainloop(c, rootNode);
				}
			}

			var nodeName = node.nodeName.toLowerCase();
			if (this.opts.postunits && nodeName in this.opts.postunits) {
				this.opts.postunits[nodeName].call(this, node, nodeName);
			}
			else if (nodeName in this.postunits) {
				this.postunits[nodeName].call(this, node, nodeName);
			}
		},
		normalize: function () {
			for (var i = 0, buffer = this.buffer; i < buffer.length; i++) {
				var u = buffer[i];

				u.text = u.text.join('\n');
				if (u.text.length == 0) {
					buffer.splice(i, 1);
					i--;
				}
			}

			for (var i = 0, buffer = this.buffer; i < buffer.length; i++) {
				var u = buffer[i];

				if (u.display == 'list-item') {
					u.text = multiply(' ', u.listDepth * 2) + u.text;
				}

				if (u.quotedCount) {
					u.text = multiply('> ', u.quotedCount) + u.text;
				}

				if (i < buffer.length - 1) {
					var v = buffer[i + 1];
					var isLastListItem = u.display == 'list-item' && u.isLastListItem;
					var isFirstListItem = v.display == 'list-item' && v.isFirstListItem;
					if (u.display == 'block' || isLastListItem
					||  v.display == 'block' || isFirstListItem) {
						u.text = u.text +
							multiply('\n', isLastListItem && isFirstListItem ? 2 : 1) +
							multiply('> ', Math.min(u.quotedCount, v.quotedCount)) + '\n';
					}
					else {
						u.text += '\n';
					}
				}
			}
		},
		exec: function (input) {
			input = $(input);
			this.buffer = [];
			this.emit('onbeforeprocess', this);
			this.mainloop(input, input);
			this.normalize();
			this.emit('onafterprocess', this);
			return this.getResult();
		}
	};

	function identify (node) {
		var tmpIds = [];
		Array.prototype.forEach.call(
			$(node).querySelectorAll('a, img, object, embed'),
			function (node) {
				if (node.hasAttribute('id')) return;

				var tmpId;
				do {
					tmpId = 'tmpid_' +
						('0000' + Math.floor(Math.random() * 0x10000)).substr(-4);
				} while ($(tmpId));

				node.setAttribute('id', tmpId);
				tmpIds.push(tmpId);
			}
		);
		return tmpIds;
	}

	function unidentify (tmpIds) {
		if (!(tmpIds instanceof Array)) return;
		tmpIds.forEach(function (id) {
			var node = $(id);
			node && node.removeAttribute('id');
		});
	}

	function run (input, opts) {
		return (new ToPlainText(opts)).exec(input);
	}

	return {
		identify: identify,
		unidentify: unidentify,
		run: run
	};
})();

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
	function fireIfResized (e) {
		if (timer) return;
		timer = setTimeout(function () {
			timer = null;
			callback({target: element});
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

	function getRect (element) {
		var r = element.getBoundingClientRect();
		return {
			left: r.left,
			top: r.top,
			width: r.width,
			height: r.height
		};
	}

	var mo = getMutationObserver('AttrModified', attrModified);
	var rect = getRect(element);
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
		for (var tmp = element; tmp; tmp = tmp.parentNode) {
			if (tmp.nodeType == window.Node.DOCUMENT_NODE) break;
			if (tmp.nodeType == window.Node.DOCUMENT_FRAGMENT_NODE) break;
			var s = document.defaultView.getComputedStyle(tmp, '');
			if (s && s.position == 'fixed') {
				isFixed = true;
				break;
			}
		}
		return isFixed;
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
			if (node.parentNode.getElementsByTagName) {
				var index = Array.prototype.indexOf.call(
					node.parentNode.getElementsByTagName(node.nodeName), node);
				result.unshift(nodeName + '[' + index + ']');
			}
			else {
				result.unshift(nodeName);
			}
		}
		return result.join(' ');
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
		fireCustomEvent('WasaviStarting', 0);
		diag.init().push('agent: entering prepare()');
		window.addEventListener('message', handlePostMessage, false);

		readContentFromElement(this.targetElement, (function (element, content, type, writeAs) {
			if (typeof content != 'string') {
				cleanup.call(this);
				error('retrieving the content of element timed out.');
				diag.out();
				return;
			}

			var payload = {
				value: content,
				elementType: type,
				writeAs: writeAs || ''
			};
			if (type == 'textarea') {
				payload.readOnly = element.readOnly || element.disabled;
			}

			this.targetElement = element;
			run.call(this, payload);
		}).bind(this));
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
			frameId: this.frameId,
			url: window.location.href,
			title: document.title,
			testMode: isTestFrame,
			id: element.id,
			nodeName: element.nodeName,
			nodePath: getNodePath(element),
			elementType: element.type,
			setargs: siteOverrides.setargs(element) || '',
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

		diag.push('agent: leaving run()');
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
				writeContentToElement(this.targetElement, value, {
					writeAs: this.targetElement.writeAs
				});
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

	function handlePostMessage (e) {
		if (WasaviExtensionWrapper.IS_GECKO) {
			if (e.origin != 'moz-extension://' + chrome.runtime.id) return;
		}
		else if (window.chrome) {
			if (e.origin != 'chrome-extension://' + chrome.runtime.id) return;
		}
		diag.push('wasavi: ' + e.data);
	}

	// public methods
	function notifyToChild (payload) {
		if (!this.wasaviFrameTabId) return;
		extension.postMessage({
			type: 'transfer',
			to: this.wasaviFrameTabId,
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
			}, msec || 100, this);
		}
	}

	function initialized (req, sender, response) {
		if (!this.wasaviFrame) return;
		this.wasaviFrameTabId = req.childTabId;
		this.wasaviFrame.style.boxShadow = '0 3px 8px 4px rgba(0,0,0,0.5)';
		this.wasaviFrame.setAttribute('data-wasavi-state', 'running');
		this.targetElementResizeListener = createElementResizeListener(
			this.targetElement,
			handleTargetResize.bind(this));

		if (Object.keys(wasaviAgentsHash).length == 1) {
			window.addEventListener('beforeunload', handleBeforeUnload, false);
		}

		if (isTestFrame) {
			if (!$('wasavi_frame')) {
				this.wasaviFrame.id = 'wasavi_frame';
			}
			$('test-log').value = '';
		}

		response({type: 'got-initialized'});
	}

	function ready (req, sender, response) {
		this.wasaviFrame.style.visibility = 'visible';
		document.activeElement != this.wasaviFrame && this.focusMe(req, sender, response);
		info('wasavi started');
		fireCustomEvent('WasaviStarted', 0);

		clearTimeout(this.wasaviFrameTimeoutTimer);
		this.wasaviFrameTimeoutTimer = null;

		window.removeEventListener('message', handlePostMessage, false);

		diag.out();
	}

	function windowState (req, sender, response) {
		switch (req.state) {
		case 'maximized':
		case 'normal':
			this.isFullscreen = req.state == 'maximized';
			locate(this.wasaviFrame, this.targetElement, {
				isFullscreen: this.isFullscreen
			});
			response({
				type: 'relocate',
				state: req.state
			});
			break;
		}
	}

	function focusMe (req, sender, response) {
		try {
			this.wasaviFrame.focus && this.wasaviFrame.focus();
		} catch (e) {}

		try {
			this.wasaviFrame.contentWindow
			&& this.wasaviFrame.contentWindow.focus
			&& this.wasaviFrame.contentWindow.focus();
		} catch (e) {}

		response({type: 'focus-me-response'});
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
		}, 1000, this.wasaviFrame);
	}

	function setSize (req, sender, response) {
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
		response({
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

	function read (req, sender, response) {
		readContentFromElement(this.targetElement, (function (element, content, type) {
			var payload = {type: 'read-response'};

			if (typeof content != 'string') {
				payload.error = _('Cannot read the content of element.');
			}
			else {
				payload.state = 'complete';
				payload.meta = {
					path: '',
					bytes: content.length
				};
				payload.content = content;
			}

			response(payload);
		}).bind(this));
	}

	function write (req, sender, response) {
		var payload = {type: 'write-response'};
		try {
			var result = writeContentToElement(this.targetElement, req.value, {
				isForce: req.isForce,
				writeAs: req.writeAs
			});
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

			response(payload);
		}
	}

	function requestBlur (req) {
		this.wasaviFrame.blur();
		document.body.focus();
	}

	function reload (req) {
		setTimeout(() => {
			window.removeEventListener('beforeunload', handleBeforeUnload, false);
			window.location.reload();
		}, 1000);
	}

	// constructor
	function Agent (element, frameId) {
		this.targetElement = element;
		this.frameId = frameId;
		this.targetElementRemoveListener = null;
		this.targetElementResizeListener = null;
		this.wasaviFrame = null;
		this.wasaviFrameTabId = null;
		this.wasaviFrameTimeoutTimer = null;
		this.widthOwn = null;
		this.heightOwn = null;
		this.isFullscreen = false;
		this.isSyncSize = false;
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
		requestBlur:  requestBlur,
		reload:       reload
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
	testLog || (testLog = []);
	testLog.push(Array.prototype.slice.call(arguments).join('\t'));
}

function keylogOutput () {
	var t = $('test-log');
	if (!t) return;
	t.value.length && (t.value += '\n');
	t.value += testLog.join('\n');
	t.scrollTop = t.scrollHeight - t.clientHeight;
	testLog.length = 0;
}

function getGlobRegex (s) {
	try {
		return new RegExp('^' + s
			.replace(/[\\^$+.()|{}]/g, function ($0) {return '\\' + $0})
			.replace(/\?/g, '.')
			.replace(/\*/g, '.+?'), 'i');
	}
	catch (e) {
		return null;
	}
}

function parseSiteOverrides (list) {
	let result = {
		_selectors: [],
		blocked: function (element) {
			return this._selectors.some(s => {
				try {
					let match = Array.prototype.indexOf.call(
						document.querySelectorAll(s.selector), element);
					return match >= 0 && s.blocked;
				}
				catch (e) {}
			});
		},
		setargs: function (element) {
			let result;
			this._selectors.some(s => {
				try {
					let match = Array.prototype.indexOf.call(
						document.querySelectorAll(s.selector), element);
					if (match >= 0) {
						result = s.setargs;
						return true;
					}
				}
				catch (e) {}
			});

			return result;
		}
	};

	function splitex (string, delimiter, limit) {
		let regex = new RegExp(delimiter, 'g');
		let result = [];
		let from = 0;
		let re;

		while (result.length < limit && (re = regex.exec(string))) {
			result.push(string.substring(from, re.index));
			from = re.index + re[0].length;
		}

		if (result.length < limit) {
			result.push(string.substring(from));
		}
		else if (re && from < string.length) {
			result[result.length - 1] += string.substring(re.index);
		}

		return result;
	}

	(list || '').split('\n').forEach(line => {
		line = line.replace(/^\s+|\s+$/g, '');
		if (line == '' || /^[#;]/.test(line)) return;

		let parts = splitex(line, /\s+/, 3);
		if (parts.length < 3) return;

		let [urlPattern, selector, action] = parts;

		urlPattern = getGlobRegex(urlPattern);
		if (!urlPattern || !urlPattern.test(window.location.href)) return;

		let blocked, setargs;

		if (action.toLowerCase() == 'block') {
			blocked = true;
		}
		else {
			setargs = action;
		}

		result._selectors.push({
			selector: selector,
			blocked: blocked,
			setargs: setargs
		});
	});

	result._selectors.sort((a, b) => {
		if (a.selector == '*') return 1;
		if (b.selector == '*') return -1;
		return 0;
	});

	console.log(JSON.stringify(result, null, ' '));

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

var readContentFromElement = (function () {
	function pre (n, name) {this.append('<wasavi:' + name + ' id="' + n.id + '">')}
	function post (n, name) {this.append('</wasavi:' + name + '>')}

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

	function handleResponseGetContent (e) {
		var index = e.detail.indexOf('\t');
		if (index < 0) return;

		var className = e.detail.substring(0, index);
		if (!(className in callbackQueue)) return;

		var slot = callbackQueue[className];
		if (slot.timeoutTimer) {
			clearTimeout(slot.timeoutTimer);
			slot.timeoutTimer = null;
		}

		slot.element.classList.remove(className);
		delete callbackQueue[className];
		slot.callback(
			slot.element, e.detail.substring(index + 1),
			'pseudoTextArea');
	}

	function getMarkdown (element) {
		element = $(element);
		markDown.identify(element);
		return markDown.run(element, markdownOpts);
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

	var callbackQueue = {};
	var markdownOpts = {
		preunits: {
			img: function (node, nodeName) { this.append('<wasavi:img id="' + node.id + '"></wasavi:img>') },
			a: pre, embed: pre, object: pre
		},
		postunits: {
			a: post, embed: post, object: post
		}
	};

	document.addEventListener('WasaviResponseGetContent', handleResponseGetContent, false);

	return function readContentFromElement (element, callback) {
		var pseudoTextArea = findPseudoTextAreaContainer(element);

		if (pseudoTextArea) {
			var className = getUniqueClass();
			pseudoTextArea.classList.add(className);
			callbackQueue[className] = {
				element: pseudoTextArea,
				callback: callback,
				timeoutTimer: setTimeout(
					function (className) {
						var slot = callbackQueue[className];
						if (!slot) return;

						slot.element.classList.remove(className);
						delete callbackQueue[className];
						slot.timeoutTimer = null;
						slot.callback(slot.element, null);
					},
					BOOT_WAIT_TIMEOUT_MSECS, className
				)
			};
			setTimeout(
				function (className) {
					fireCustomEvent('WasaviRequestGetContent', className);
				},
				1, className
			);
		}

		else if (/^(?:INPUT|TEXTAREA)$/.test(element.nodeName)) {
			callback(element, element.value, element.nodeName.toLowerCase());
		}

		else if (element.isContentEditable) {
			let setargs = siteOverrides.setargs(element);
			let writeAs = 'html';
			if (setargs) {
				let re = /\bwriteas\s*=\s*(\w+)/.exec(setargs);
				if (re) {
					writeAs = re[1];
				}
			}

			callback(element, getMarkdown(element), 'contentEditable', writeAs);
		}

		else if (element.nodeName == 'BODY') {
			callback(element, getBodyContent(), 'body');
		}

		else {
			callback(element, null, null, null);
		}
	};
})();

var writeContentToElement = (function () {
	function toDiv (f, content) {
		var length = 0;
		content = content.split('\n');

		for (var i = 0, goal = content.length; i < goal; i++) {
			f.appendChild(document.createElement('div'))
				.appendChild(document.createTextNode(content[i]));
			length += content[i].length + 1;
		}

		return length;
	}

	function toParagraph (f, content) {
		var length = 0;
		content = content.split('\n');

		for (var i = 0, goal = content.length; i < goal; i++) {
			f.appendChild(document.createElement('p'))
				.appendChild(document.createTextNode(content[i]));
			length += content[i].length + 1;
		}

		return length;
	}

	function toTextAndBreak (f, content) {
		var length = 0;
		content = content.split('\n');

		for (var i = 0, goal = content.length - 1; i < goal; i++) {
			f.appendChild(document.createTextNode(content[i]));
			f.appendChild(document.createElement('br'));
			length += content[i].length + 1;
		}

		if (content.length >= 1) {
			f.appendChild(document.createTextNode(content[content.length - 1]));
			length += content[i].length;
		}

		return length;
	}

	function toPlaintext (f, content) {
		f.appendChild(document.createTextNode(content));
		return content.length;
	}

	function elementsOf (root, children) {
		var result = [];
		for (var i = 0, goal = children.length; i < goal; i++) {
			result.push.apply(
				result,
				root.getElementsByTagName('wasavi:' + children[i]));
		}
		return result;
	}

	function toHTMLImage (element) {
		var id = element.getAttribute('id');
		if (!id) return;

		var linked = $(id);
		if (!linked) return;

		element.parentNode.replaceChild(linked, element);
	}

	function toHTMLAnchor (element) {
		var id = element.getAttribute('id');
		if (!id) return;

		var linked = $(id);
		if (!linked) return;

		var r = document.createRange();
		r.selectNodeContents(element);
		var contents = r.extractContents();

		element.parentNode.replaceChild(linked, element);
		r.selectNodeContents(linked);
		r.deleteContents();
		linked.appendChild(contents);
	}

	function overwrite (element, content, job) {
		var f = document.createDocumentFragment();
		var length = job(f, content);

		try {
			var r = document.createRange();
			r.selectNodeContents(element);
			r.deleteContents();

			element.appendChild(f)
			return length;
		}
		catch (e) {
			return _('Exception while saving: {0}', e.message);
		}
	}

	function buildHTML (element, content) {
		var r = document.createRange();
		r.selectNodeContents(element);

		element.insertAdjacentHTML('beforeend', content);

		elementsOf(element, ['img']).forEach(toHTMLImage);
		elementsOf(element, ['a', 'object', 'embed']).forEach(toHTMLAnchor);

		r.deleteContents();

		return element.textContent.length;
	}

	return function writeContentToElement (element, content, opts) {
		content || (content = '');
		opts || (opts = {});

		if (element.classList.contains('CodeMirror')
		 || element.classList.contains('ace_editor')) {
			if (typeof content != 'string') {
				return _('Invalid text format.');
			}
			var className = getUniqueClass();
			element.classList.add(className);
			fireCustomEvent('WasaviRequestSetContent', className + '\t' + content);
			element.classList.remove(className);
			return content.length;
		}

		else if (/^(?:INPUT|TEXTAREA)$/.test(element.nodeName)) {
			if (element.readOnly) {
				if (opts.isForce) {
					element.readOnly = false;
				}
				else {
					return _('Element to be written has readonly attribute (use "!" to override).');
				}
			}
			if (element.disabled) {
				if (opts.isForce) {
					element.disabled = false;
				}
				else {
					return _('Element to be written has disabled attribute (use "!" to override).');
				}
			}
			if (typeof content != 'string') {
				return _('Invalid text format.');
			}
			try {
				element.value = content;
				return content.length;
			}
			catch (e) {
				return _('Exception while saving: {0}', e.message);
			}
		}

		else if (element.isContentEditable) {
			/*
			 * There are various newline formats in content editable element.
			 * These formats are different depending on sites, so we have to choice
			 * the correct format by list.  So `writeAs` property can be assigned
			 * following values:
			 *
			 *   - 'html': treat a text as markdown, and build DOM tree (default)
			 *   - 'div': create div element from each line
			 *
			 *       <div>line1</div><div>line2</div> ...
			 *
			 *   - 'p': create p element from each line
			 *
			 *       <p>line1</p><p>line2</p> ...
			 *
			 *   - 'textAndBreak': create text node from each line, and each line is
			 *     divided by a BR element.
			 *
			 *       #text <br> #text ...
			 *
			 *   - 'plaintext': create a text node. newline is '\n'
			 *
			 *       line1 \n line2 ...
			 */
			switch (opts.writeAs.toLowerCase()) {
			case 'div':
				return overwrite(element, content, toDiv);

			case 'p':
				return overwrite(element, content, toParagraph);

			case 'textandbreak':
				return overwrite(element, content, toTextAndBreak);

			case 'plantext':
				return overwrite(element, content, toPlaintext);

			case 'html': default:
				return buildHTML(element, content);
			}
		}

		else if (element.nodeName == 'BODY') {
			return _('Cannot rewrite the page itself.');
		}

		else {
			return _('Unknown node name: {0}', element.nodeName);
		}
	};
})();

// event listeners <<<1
function handleKeydown (e) {
	if (!e || !e.target || !allowedElements) return;
	if (e.keyCode == 16 || e.keyCode == 17 || e.keyCode == 18) return;

	var target = getShadowActiveElement(e.target);
	if (siteOverrides.blocked(target)) return;
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

	var target = getShadowActiveElement(e.target);
	if (siteOverrides.blocked(target)) return;
	if (!isLaunchableElement(target)) return;
	if (!doesTargetAllowLaunch(target)) return;
	if (findAgent(target)) return;

	e.preventDefault();
	startAgent(target);
}

function handleRequestLaunch () {
	if (!allowedElements) return;
	if (typeof document.hasFocus == 'function' && !document.hasFocus()) return;

	var target = getShadowActiveElement(document.activeElement);
	if (siteOverrides.blocked(target)) return;
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

var handleBackendMessage = (function () {
	function updateStorage (agent, req) {
		var logbuf = [];
		var so;
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

			case 'siteOverrides':
				so = value;
				logbuf.push(i);
				break;
			}
		}
		if (so) {
			siteOverrides = parseSiteOverrides(so);
		}
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
			keylog('-', '-', 'command start, frame #' + req.frameId);
		}

		var args = [];
		'key'       in req && req.key.charCodeAt(0) >= 32 && args.push(req.key);
		'keyCode'   in req && args.push(req.keyCode);
		'eventType' in req && args.push(req.eventType);
		keylog.apply(null, args);
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

				var state = $('state');
				state.textContent = '';
				['running', 'state', 'inputMode', 'row', 'col', 'lastMessage'].forEach(function (p) {
					state.appendChild(document.createElement('div')).textContent =
						p + ': ' + req.state[p];
				});
			}
			finally {
				if (req.type == 'command-completed') {
					agent.wasaviFrame.removeAttribute('data-wasavi-command-state');
					keylog('--- sequence point ---');
				}
				else {
					agent.wasaviFrame.setAttribute('data-wasavi-command-state', 'completed');
					keylog('*** complete sequence point ***');
					keylogOutput();
				}

			}
		});
	}

	var handlerMap = {
		/*
		 * messages transferred from wasavi
		 */

		'initialized':   function initialized (a,d,s,r)  { a.initialized(d, s, r) },
		'ready':         function ready (a,d,s,r)        { a.ready(d, s, r) },
		'window-state':  function windowState (a,d,s,r)  { a.windowState(d, s, r) },
		'focus-me':      function focusMe (a,d,s,r)      { a.focusMe(d, s, r) },
		'focus-changed': function focusChanged (a,d,s,r) { a.focusChanged(d, s, r) },
		'blink-me':      function blinkMe (a,d,s,r)      { a.blinkMe(d, s, r) },
		'set-size':      function setSize (a,d,s,r)      { a.setSize(d, s, r) },
		'terminated':    function terminated (a,d,s,r)   { a.terminated(d, s, r) },
		'read':          function read (a,d,s,r)         { a.read(d, s, r) },
		'write':         function write (a,d,s,r)        { a.write(d, s, r) },
		'request-blur':  function requestBlur (a,d,s,r)  { a.requestBlur(d, s, r) },
		'reload':        function reload (a,d,s,r)       { a.reload(d, s, r) },

		/*
		 * messages from backend
		 */

		'update-storage': updateStorage,
		'request-run':    requestRun,
		'ping':           ping,

		/*
		 * following cases are for functionality test.
		 * available only on http://127.0.0.1/test_frame.html
		 */

		'notify-keydown':    notifyKeydown,
		'notify-error':      notifyError,
		'notify-state':      notifyState,
		'command-completed': commandCompleted,
		'commands-completed': commandCompleted,
	};

	return function (req, sender, response) {
		if (!req || !req.type) return;

		logMode && log(
			'got "' + req.type + '" message from backend:',
			JSON.stringify(req).substring(0, 200));

		if (!(req.type in handlerMap)) return;

		if ('frameId' in req) {
			if (!(req.frameId in wasaviAgentsHash)) return;
			handlerMap[req.type](wasaviAgentsHash[req.frameId], req, sender, response);
		}
		else {
			handlerMap[req.type](null, req, sender, response);
		}
	};
})();

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
	siteOverrides = parseSiteOverrides(req.siteOverrides);
	statusLineHeight = req.statusLineHeight;

	extension.ensureRun(handleAgentInitialized, req);
}

// bootstrap <<<1
createPageAgent(true, true);
extension.setMessageListener(handleBackendMessage);
document.addEventListener('WasaviRequestLaunch', handleRequestLaunch, false);
connect(handleConnect);

})(this);

// vim:set ts=4 sw=4 fileencoding=UTF-8 fileformat=unix filetype=javascript fdm=marker fmr=<<<,>>> fdl=1 :
