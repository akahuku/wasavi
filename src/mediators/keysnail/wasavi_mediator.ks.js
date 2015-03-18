let PLUGIN_INFO = <KeySnailPlugin>
    <name>wasavi mediator</name>
    <description>Controls suspend state depending on wasavi existence</description>
    <updateURL>https://github.com/akahuku/wasavi/raw/master/src/mediators/keysnail/wasavi_mediator.ks.js</updateURL>
    <iconURL>https://github.com/akahuku/wasavi/raw/master/src/chrome/images/icon048.png</iconURL>
    <version>1.0.0</version>
    <minVersion>1.8.5</minVersion>
    <author mail="akahuku@gmail.com" homepage="http://appsweets.net/">akahuku</author>
    <license>Apache License version 2.0</license>
    <detail><![CDATA[Controls suspend state depending on wasavi existence]]></detail>
</KeySnailPlugin>;

/**
 * wasavi mediator: ensure running wasavi on environment of Firefox + KeySnail.
 * this plugin for KeySnail is a part of wasavi <http://appsweets.net/wasavi/>.
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
	const OUTPUT_LOG = false;
	const TARGET_URL_HTTP = 'http://wasavi.appsweets.net/';
	const TARGET_URL_HTTPS = 'https://ss1.xrea.com/wasavi.appsweets.net/';
	const TARGET_IFRAME = 'body>iframe[src="about:blank?wasavi-frame-source"]';
	const DELAY_MSECS = 250;

	// privates
	var delayTimer = null;
	var initialized = false;

	function log (message) {
		OUTPUT_LOG && console.log('wasavi_mediator: ' + message);
	}

	function toBracket (obj) {
		return Object.prototype.toString.call(obj);
	}

	function getWindow (obj) {
		return window.content instanceof Window ? window.content : null;
	}

	function isWasaviExist (wnd) {
		if (!(wnd.document instanceof HTMLDocument)) return false;

		if (wnd.location.href == TARGET_URL_HTTP
		||  wnd.location.href == TARGET_URL_HTTPS) {
			return true;
		}

		return !!wnd.document.querySelector(TARGET_IFRAME);
	}

	function registerEvents (wnd) {
		if (!(wnd.document instanceof HTMLDocument)) return false;
		wnd.document.addEventListener('WasaviStarted', wasaviStarted, false);
		wnd.document.addEventListener('WasaviTerminated', wasaviTerminated, false);
		return true;
	}

	function suspend () {
		key.suspended = true;
		key.updateStatusDisplay();
		log('keysnail key.suspended set to ' + key.suspended);
	}

	function resume () {
		key.suspended = false;
		key.updateStatusDisplay();
		log('keysnail key.suspended set to ' + key.suspended);
	}

	// event handlers
	function locationChange () {
		delayTimer && clearTimeout(delayTimer);
		delayTimer = setTimeout(function () {
			delayTimer = null;
			var wnd = getWindow();
			if (wnd) {
				if (isWasaviExist(wnd)) {
					log('keysnail is in suspend state on ' + wnd.location.href);
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

	function wasaviStarted () {
		log('catched wasavi launching');
		suspend();
	}

	function wasaviTerminated () {
		log('catched wasavi termination');
		resume();
	}

	//
	if (!initialized) {
		hook.addToHook('LocationChange', locationChange);
		initialized = true;
		log('registered the wasavi mediator.');
	}
})();

// vim:set ts=4 sw=4 fileencoding=UTF-8 fileformat=unix filetype=javascript :
