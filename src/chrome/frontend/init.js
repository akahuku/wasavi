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

(function (g) {

'use strict';

const BRACKETS = '[{(<"\'``\'">)}]';
const CLOSE_BRACKETS = BRACKETS.substring(BRACKETS.length / 2);

const LOG_PROMISE = false;
const LOG_EX = false;
const LOG_MAP_MANAGER = false;
const LOG_LAST_SIMPLE_COMMAND = false;

g.Wasavi = Object.defineProperties({}, {
	IS_GECKO: {value: 'InstallTrigger' in g},

	BRACKETS: {value: BRACKETS},
	CLOSE_BRACKETS: {value: CLOSE_BRACKETS},

	LINE_NUMBER_MAX_WIDTH: {value: 6},
	LINE_NUMBER_RELATIVE_WIDTH: {value: 2},

	COMPOSITION_CLASS: {value: 'wasavi_composition'},
	LEADING_CLASS: {value: 'wasavi_leading'},
	MARK_CLASS: {value: 'wasavi_mark'},
	EMPHASIS_CLASS: {value: 'wasavi_em'},
	CURSOR_SPAN_CLASS: {value: 'wasavi_command_cursor_span'},
	BOUND_CLASS: {value: 'wasavi_bound'},

	MIGEMO_EXTENSION_ID: {value: 'dfccgbheolnlopfmahkcjiefggclmadb'},
	MIGEMO_GET_REGEXP_STRING: {value: 'getRegExpString'},

	LOG_PROMISE: {value: LOG_PROMISE},
	LOG_EX: {value: LOG_EX},
	LOG_MAP_MANAGER: {value: LOG_MAP_MANAGER},
	LOG_LAST_SIMPLE_COMMAND: {value: LOG_LAST_SIMPLE_COMMAND}
});

})(typeof global == 'object' ? global : window);

// vim:set ts=4 sw=4 fenc=UTF-8 ff=unix ft=javascript fdm=marker :
