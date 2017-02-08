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

const IS_GECKO =
	window.navigator.product == 'Gecko' && window.navigator.userAgent.indexOf('Gecko/') != -1;
const CSS_PREFIX = window.chrome ? '-webkit-' :
	window.opera ? '-o-' : IS_GECKO ? '-moz-' : '';

const BRACKETS = '[{(<"\'``\'">)}]';
const CLOSE_BRACKETS = BRACKETS.substring(BRACKETS.length / 2);

const LINE_NUMBER_MAX_WIDTH = 6;
const LINE_NUMBER_RELATIVE_WIDTH = 2;

const COMPOSITION_CLASS = 'wasavi_composition';
const LEADING_CLASS = 'wasavi_leading';
const MARK_CLASS = 'wasavi_mark';
const EMPHASIS_CLASS = 'wasavi_em';
const CURSOR_SPAN_CLASS = 'wasavi_command_cursor_span';
const BOUND_CLASS = 'wasavi_bound';

var Wasavi = {};

// vim:set ts=4 sw=4 fenc=UTF-8 ff=unix ft=javascript fdm=marker :
