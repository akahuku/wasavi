/**
 * wasavi agent loader
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

if (window.chrome) {
	document.write('<script src="frontend/extension_wrapper.js"></scr' + 'ipt>');
	document.write('<script src="frontend/agent.js"></scr' + 'ipt>');
}
else if (window.opera) {
	document.write('<script src="includes/001_extension_wrapper.js"></scr' + 'ipt>');
	document.write('<script src="includes/agent.js"></scr' + 'ipt>');
}

// vim:set ts=4 sw=4 fenc=UTF-8 ff=unix ft=javascript fdm=marker :
