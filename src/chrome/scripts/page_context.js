/**
 * page-context script for wasavi frontend
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

!(function(win,doc){

doc.addEventListener('WasaviRequestGetContent', function (e) {
	var className = e.detail;
	var node = doc.getElementsByClassName(className)[0];
	if (!node) return;

	var result = '';
	if (node.CodeMirror)
		try {result = node.CodeMirror.getValue()} catch (ex) {result = ''}
	else if (node.classList.contains('ace_editor') && win.ace)
		try {result = win.ace.edit(node).getValue()} catch(ex) {result = ''}

	var ev = doc.createEvent('CustomEvent');
	ev.initCustomEvent('WasaviResponseGetContent', false, false, className + '\t' + result);
	doc.dispatchEvent(ev);
}, false);

doc.addEventListener('WasaviRequestSetContent', function (e) {
	var delimiterIndex = e.detail.indexOf('\t');
	var className = e.detail.substring(0, delimiterIndex);
	var content = e.detail.substring(delimiterIndex + 1);
	var node = doc.getElementsByClassName(className)[0];
	if (!node) return;

	node.classList.remove(className);
	if (node.CodeMirror)
		try {node.CodeMirror.setValue(content)} catch (ex) {}
	else if (node.classList.contains('ace_editor') && win.ace)
		try {win.ace.edit(node).setValue(content)} catch(ex) {}
}, false);
})(window,document);

// vim:set ts=4 sw=4 fileencoding=UTF-8 fileformat=unix filetype=javascript fdm=marker :
