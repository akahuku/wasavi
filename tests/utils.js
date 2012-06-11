/**
 * wasavi: vi clone implemented in javascript
 * =============================================================================
 *
 *
 * @author akahuku@gmail.com
 * @version $Id: utils.js 134 2012-06-11 20:44:34Z akahuku $
 */

/**
 * dedicated assert functions
 */

function assertPos () {
	function checkPosition (expect, actual) {
		return actual instanceof Wasavi.classes.Position && actual.eq(expect);
	}

	JsUnit._validateArguments(1, arguments);
	var var1 = JsUnit._nonCommentArg(1, 1, arguments);
	var var2 = Wasavi.position;

	if (var1 instanceof Array) {
		var1 = new Wasavi.classes.Position(var1[0], var1[1]);
	}

	JsUnit._assert(
		JsUnit._commentArg(1, arguments),
		checkPosition(var1, var2),
		'Expected ' + JsUnit._displayStringForValue(var1)
			+ ' but was ' + JsUnit._displayStringForValue(var2)
	);
}

/**
 * setup, teardown and so on
 */

var t1;
var sectionTestText = [

	'\tfirst line', // * 1
	'dummy line',
	'',
	'\f line whose first character is form-feed', // * 4
	'\t\f line whose second character is form-feed',
	'dummy line',
	'',
	'{ line whose first character is curly brace', // * 8
	'\t{ line whose second character is curly brace',
	'dummy line',
	'',
	'.SH', // * 12
	'dummy line',
	'',
	'.IP',
	'',
	'\twhat is sentence?  this is a sentence.  and this is second sentence.',
	'\tand this is second sentence (again.)  this is fourth sentence.',
	'',
	'.H ', // * 20
	'dummy line',
	'' // * 22

].join('\n');

var originalFrame;

function setUp () {
	if (originalFrame === undefined) {
	    originalFrame = document.body.innerHTML;
	}
	else {
	    document.body.innerHTML = originalFrame;
	}
	localStorage.clear();
	//Wasavi.notifyUpdateStorage(['wasavi_registers']);
	Wasavi.run(400, 300);
}

function tearDown () {
	if (Wasavi.running) {
		Wasavi.kill();
	}
}

function makeScrollableBuffer (factor, origin) {
	var lines = Wasavi.vars.lines, a = [];
	assertEquals('should type be a number', 'number', typeof lines);
	//console.log('lines: ' + lines + (origin ? (' at ' + origin) : ''));
	assert('should be a natural number', lines > 0);
	var actualLines = parseInt(lines * (factor || 1));
	for (var i = 1; i <= actualLines; i++) {
		a.push('line ' + i);
	}
	Wasavi.send('i', a.join('\n'), Wasavi.SPECIAL_KEYS.ESCAPE);
	return lines;
}

function syncWait (secs) {
	if (location.protocol == 'file:') {
		var start = +new Date();
		var goal = start + 1000 * secs;
		while (+new Date() < goal) {
			;
		}
	}
	else if (/^https?:$/.test(location.protocol)) {
		var xhr = new XMLHttpRequest;
		xhr.open('GET', 'sync-wait.php?secs=' + secs, false);
		xhr.send(null);
	}
}

/* vim:set ts=4 sw=4 fileencoding=UTF-8 fileformat=unix filetype=javascript : */
