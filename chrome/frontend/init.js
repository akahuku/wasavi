// ==UserScript==
// @include http://wasavi.appsweets.net/
// @include https://ss1.xrea.com/wasavi.appsweets.net/
// ==/UserScript==
//

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

/*const*/var LATIN1_PROPS = [
	'Cc', 'Cc', 'Cc', 'Cc', 'Cc', 'Cc', 'Cc', 'Cc',
	'Cc', 'Zs', 'Cc', 'Cc', 'Cc', 'Cc', 'Cc', 'Cc',
	'Cc', 'Cc', 'Cc', 'Cc', 'Cc', 'Cc', 'Cc', 'Cc',
	'Cc', 'Cc', 'Cc', 'Cc', 'Cc', 'Cc', 'Cc', 'Cc',
	'Zs', 'Po', 'Po', 'Po', 'Sc', 'Po', 'Po', 'Po', //  !"#$%&'
	'Ps', 'Pe', 'Po', 'Sm', 'Po', 'Pd', 'Po', 'Po', // ()*+,-./
	'Ld', 'Ld', 'Ld', 'Ld', 'Ld', 'Ld', 'Ld', 'Ld', // 01234567
	'Ld', 'Ld', 'Po', 'Po', 'Sm', 'Sm', 'Sm', 'Po', // 89:;<=>?
	'Po', 'Lu', 'Lu', 'Lu', 'Lu', 'Lu', 'Lu', 'Lu', // @ABCDEFG
	'Lu', 'Lu', 'Lu', 'Lu', 'Lu', 'Lu', 'Lu', 'Lu', // HIJKLMNO
	'Lu', 'Lu', 'Lu', 'Lu', 'Lu', 'Lu', 'Lu', 'Lu', // PQRSTUVW
	'Lu', 'Lu', 'Lu', 'Ps', 'Po', 'Pe', 'Sk', 'Pc', // XYZ[\]^_
	'Sk', 'Ll', 'Ll', 'Ll', 'Ll', 'Ll', 'Ll', 'Ll', // `abcdefg
	'Ll', 'Ll', 'Ll', 'Ll', 'Ll', 'Ll', 'Ll', 'Ll', // hijklmno
	'Ll', 'Ll', 'Ll', 'Ll', 'Ll', 'Ll', 'Ll', 'Ll', // pqrstuvw
	'Ll', 'Ll', 'Ll', 'Ps', 'Sm', 'Pe', 'Sm', 'Cc'  // xyz{|}~
];

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

var Wasavi = {};

// vim:set ts=4 sw=4 fenc=UTF-8 ff=unix ft=javascript fdm=marker :
