// ==UserScript==
// @include http://*/*
// @include https://*/*
// @exclude http://wasavi.appsweets.net/
// @exclude http://wasavi.appsweets.net/?testmode
// @exclude https://ss1.xrea.com/wasavi.appsweets.net/
// ==/UserScript==
//
/**
 * wasavi: vi clone implemented in javascript
 * =============================================================================
 *
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

function getPageHook (data, key1, key2) {
	var f = null;
	if (key1 in data && key2 in data[key1]) {
		f = data[key1][key2];
		if (typeof f == 'string') {
			try {
				data[key1][key2] = f = new Function('e', 'h', f);
			}
			catch (ex) {
				data[key1][key2] = f = null;
			}
		}
	}
	return f;
}

// vim:set ts=4 sw=4 fileencoding=UTF-8 fileformat=unix filetype=javascript fdm=marker :
