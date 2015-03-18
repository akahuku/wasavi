/**
 * wasavi mediator: ensure running wasavi on environment of Firefox + vimperator.
 * this plugin for vimperator is a part of wasavi <http://appsweets.net/wasavi/>.
 * =============================================================================
 *
 * @author akahuku@gmail.com
 */
/**
 * Copyright 2012-2015 akahuku, akahuku@gmail.com
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

(function () {
	// consts
	var OUTPUT_LOG = false;
	var TARGET_URL_HTTP = 'http://wasavi.appsweets.net/';
	var TARGET_URL_HTTPS = 'https://ss1.xrea.com/wasavi.appsweets.net/';
	var TARGET_IFRAME = 'body>iframe[src="about:blank?wasavi-frame-source"]';
	var DELAY_MSECS = 250;

	// privates
	var delayTimer = null;
	var initialized = false;

	function log (message) {
		OUTPUT_LOG && liberator.log('wasavi_mediator: ' + message, 0);
	}

	function toBracket (obj) {
		return Object.prototype.toString.call(obj);
	}

	function getWindow () {
		return window.content instanceof Window ? window.content : null;
	}

	function isWasaviExists (wnd) {
		if (!(wnd.document instanceof HTMLDocument)) return;

		if (wnd.location.href == TARGET_URL_HTTP
		||  wnd.location.href == TARGET_URL_HTTPS) {
			return true;
		}

		return !!wnd.document.querySelector(TARGET_IFRAME);
	}

	function registerEvents (wnd) {
		if (!(wnd.document instanceof HTMLDocument)) return;
		wnd.document.addEventListener('WasaviStarted', wasaviStarted, false);
		wnd.document.addEventListener('WasaviTerminated', wasaviTerminated, false);
		return true;
	}

	function suspend () {
		liberator.modules.modes.passAllKeys = true;
		log('vimp passAllKeys set to ' + liberator.modules.modes.passAllKeys);
	}

	function resume () {
		liberator.modules.modes.passAllKeys = false;
		log('vimp passAllKeys set to ' + liberator.modules.modes.passAllKeys);
	}

	// event handlers
	function locationChange () {
		delayTimer && clearTimeout(delayTimer);
		delayTimer = setTimeout(function () {
			delayTimer = null;
			var wnd = getWindow();
			if (wnd) {
				if (isWasaviExists(wnd)) {
					log('vimperator is in suspend state on ' + wnd.location.href);
					suspend();
				}
				if (registerEvents(wnd)) {
					log('registered custom events');
					return;
				}
			}
			log('failed: ' + toBracket(wnd));
		}, DELAY_MSECS);
	}

	function wasaviStarted (e) {
		log('catched wasavi launching');
		suspend();
	}

	function wasaviTerminated (e) {
		log('catched wasavi termination');
		resume();
	}

	//
	if (!initialized) {
		liberator.modules.autocommands.add('LocationChange', /^/, locationChange);
		initialized = true;
		log('registered the wasavi mediator.');
	}

})();

// vim:set ts=4 sw=4 fileencoding=UTF-8 fileformat=unix filetype=javascript :
