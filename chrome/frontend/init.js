// ==UserScript==
// @include http://wasavi.appsweets.net/
// @include https://ss1.xrea.com/wasavi.appsweets.net/
// ==/UserScript==
//
/**
 * wasavi: vi clone implemented in javascript
 * =============================================================================
 *
 *
 * @author akahuku@gmail.com
 * @version $Id: init.js 432 2013-10-21 20:57:39Z akahuku $
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

'use strict';

/*const*/var IS_GECKO =
	window.navigator.product == 'Gecko' && window.navigator.userAgent.indexOf('Gecko/') != -1;
/*const*/var CSS_PREFIX = window.chrome ? '-webkit-' :
	window.opera ? '-o-' : IS_GECKO ? '-moz-' : '';

/*const*/var CONTAINER_ID = 'wasavi_container';
/*const*/var EDITOR_CORE_ID = 'wasavi_editor';
/*const*/var LINE_INPUT_ID = 'wasavi_footer_input';

/*const*/var BRACKETS = '[{(<"\'``\'">)}]';
/*const*/var CLOSE_BRACKETS = BRACKETS.substring(BRACKETS.length / 2);

/*const*/var ACCEPTABLE_TYPES = {
	textarea: true,
	text:     true,
	search:   true,
	tel:      true,
	url:      true,
	email:    true,
	password: true,
	number:   true
};

/*const*/var EXFLAGS = {
	addr2All: 1<<2,
	addr2None: 1<<3,
	addrZero: 1<<4,
	addrZeroDef: 1<<5,
	printDefault: 1<<6,
	clearFlag: 1<<7,
	newScreen: 1<<8,
	roundMax: 1<<9,
	updateJump: 1<<10,
	multiAsync: 1<<11
};

/*const*/var LINE_NUMBER_MARGIN_LEFT = 2;
/*const*/var LINE_NUMBER_MAX_WIDTH = 6;

/*const*/var COMPOSITION_CLASS = 'wasavi_composition';
/*const*/var MARK_CLASS = 'wasavi_mark';
/*const*/var EMPHASIS_CLASS = 'wasavi_em';
/*const*/var CURSOR_SPAN_CLASS = 'wasavi_command_cursor_span';
/*const*/var BOUND_CLASS = 'wasavi_bound';

var Wasavi = {};

// vim:set ts=4 sw=4 fenc=UTF-8 ff=unix ft=javascript fdm=marker :
