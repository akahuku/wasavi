/**
 * wasavi: vi clone implemented in javascript
 * =============================================================================
 *
 *
 * @author akahuku@gmail.com
 * @version $Id: wasavi_frame.js 190 2012-10-04 06:55:45Z akahuku $
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

(function () {
	/*
	 * Currently, only chrome can show the file in an extension package
	 * as content of iframe. Opera and Firefox(Add-on SDK) can not.
	 * Therefore, it is safe even if the following function become an
	 * error at the validation process of extension for Firefox.
	 */
	function load () {
		var head = document.getElementsByTagName('head')[0];
		Array.prototype.forEach.call(arguments, function (path) {
			var s = head.appendChild(document.createElement('script'));
			s.type = 'text/javascript';
			s.src = path;
		});
	}
	if (window.location.protocol == 'chrome-extension:' && window.chrome) {
		load('extension_wrapper.js', 'wasavi.js');
	}
	else if (window.location.protocol == 'widget:' && window.opera) {
		load('includes/001_extension_wrapper.js', 'includes/wasavi.js');
	}
})();

// vim:set ts=4 sw=4 fileencoding=UTF-8 fileformat=unix filetype=javascript :
