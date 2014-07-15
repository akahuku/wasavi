/**
 * key hook script for wasavi frontend
 *
 * @author akahuku@gmail.com
 */
/**
 * Copyright 2012-2014 akahuku, akahuku@gmail.com
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

!(function(win,doc){

var wasaviRunning = false;
function isHookEvent (en) {return en == 'keydown' || en == 'keypress'}
function getKey (en, uc) {return en + '_' + !!uc}
function hook (target) {
	if (!target || !target.addEventListener || !target.removeEventListener) return;
	var addOriginal = target.addEventListener,
		removeOriginal = target.removeEventListener,
		listeners = [];
	target.addEventListener = function (en, fn, uc) {
		if (!isHookEvent(en)) {
			addOriginal.call(this, en, fn, uc);
			return;
		}
		var key = getKey(en, uc);
		!listeners[key] && (listeners[key] = []);
		if (!listeners[key].some(function (o) {return o[0] == fn})) {
			var wrappedListener = function (e) {!wasaviRunning && fn && fn(e)};
			listeners[key].push([fn, wrappedListener]);
			addOriginal.call(this, en, wrappedListener, uc);
		}
	};
	target.removeEventListener = function (en, fn, uc) {
		if (!isHookEvent(en)) {
			removeOriginal.call(this, en, fn, uc);
			return;
		}
		var key = getKey(en, uc);
		if (!listeners[key]) return;
		listeners[key] = listeners[key].filter(function (o) {
			if (o[0] != fn) return true;
			removeOriginal.call(this, en, o[1], uc);
			return false;
		}, this);
	};
}

if (window.chrome || window.opera) {
	hook(win.HTMLInputElement && win.HTMLInputElement.prototype);
	hook(win.HTMLTextAreaElement && win.HTMLTextAreaElement.prototype);
	hook(win.Node && win.Node.prototype);
}

doc.addEventListener('WasaviStarting', function () {wasaviRunning = true}, false);
doc.addEventListener('WasaviTerminated', function () {wasaviRunning = false}, false);
doc.addEventListener('WasaviRequestGetContent', function (e) {
	var node = doc.getElementsByClassName(e.detail.className)[0];
	if (!node) return;
	var result = '';
	node.classList.remove(e.detail.className);
	if (node.CodeMirror)
		try {result = node.CodeMirror.getValue()} catch (ex) {result = ''}
	else if (node.classList.contains('ace_editor') && win.ace)
		try {result = win.ace.edit(node).getValue()} catch(ex) {result = ''}
	var ev = doc.createEvent('CustomEvent');
	ev.initCustomEvent('WasaviResponseGetContent', false, false, result);
	doc.dispatchEvent(ev);
}, false);
doc.addEventListener('WasaviRequestSetContent', function (e) {
	var node = doc.getElementsByClassName(e.detail.className)[0];
	if (!node) return;
	node.classList.remove(e.detail.className);
	if (node.CodeMirror)
		try {node.CodeMirror.setValue(e.detail.content)} catch (ex) {}
	else if (node.classList.contains('ace_editor') && win.ace)
		try {win.ace.edit(node).setValue(e.detail.content)} catch(ex) {}
}, false);
})(window,document);
