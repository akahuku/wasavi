/**
 * wasavi mediator: ensure running wasavi on environment of Firefox + vimperator.
 * this plugin for vimperator is a part of wasavi <http://appsweets.net/wasavi/>.
 * =============================================================================
 *
 * @author akahuku@gmail.com
 * @version $Id: wasavi_mediator.js 195 2012-10-11 13:28:36Z akahuku $
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

(function (global) {
	var OUTPUT_LOG = false;
	var TARGET_URL_HTTP = 'http://wasavi.appsweets.net/';
	var TARGET_URL_HTTPS = 'https://ss1.xrea.com/wasavi.appsweets.net/';
	var TARGET_SELECTOR_ROUGH = 'body>iframe[src*="/wasavi.appsweets.net/"]';
	var HOOK_DELAY_MSECS = 250;

	var delayTimer = null;
	var initialized = false;

	//
	function log (message) {
		OUTPUT_LOG && liberator.log('wasavi_mediator: ' + message, 0);
	}
	function toBracket (obj) {
		return Object.prototype.toString.call(obj);
	}
	function getWindow () {
		return window.content instanceof Window ? window.content : null;
	}
	function lookup (wnd) {
		if (!(wnd.document instanceof HTMLDocument)) return;
		if (!/^(?:interactive|complete)$/.test(wnd.document.readyState)) return;

		var found = Array.prototype.some.call(
			wnd.document.querySelectorAll(TARGET_SELECTOR_ROUGH),
			function (node) {
				return node.src == TARGET_URL_HTTP || node.src == TARGET_URL_HTTPS;
			}
		);

		if (found) {
			liberator.modules.modes.passAllKeys = true;
		}
	}
	function hook (wnd) {
		if (!(wnd.document instanceof HTMLDocument)) return;
		wnd.document.addEventListener('WasaviStarted', handleWasaviStarted, false);
		wnd.document.addEventListener('WasaviTerminated', handleWasaviTerminated, false);
		return true;
	}

	//
	function handleLocationChange () {
		delayTimer && clearTimeout(delayTimer);
		delayTimer = setTimeout(function () {
			log('started...');
			delayTimer = null;
			var wnd = getWindow();
			if (wnd) {
				lookup(wnd);
				if (hook(wnd)) {
					log('done.');
					return;
				}
			}
			log('failed: ' + toBracket(wnd));
		}, HOOK_DELAY_MSECS);
	}
	function handleWasaviStarted (e) {
		liberator.modules.modes.passAllKeys = true;
	}
	function handleWasaviTerminated (e) {
		liberator.modules.modes.passAllKeys = false;
	}

	//
	if (!initialized) {
		liberator.modules.autocommands.add('LocationChange', /^/, handleLocationChange);
		initialized = true;
		log('registered autocommand handler.');
	}

})(this);

// vim:set ts=4 sw=4 fileencoding=UTF-8 fileformat=unix filetype=javascript :
