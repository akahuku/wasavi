'use strict';

const {By, Key, until, promise} = require('selenium-webdriver');
const {it, describe} = require('selenium-webdriver/testing');

exports.suite = (assert, wasavi, driver) => {
	const {ctrln, ctrlt, ctrlw} = assert.shortcuts;

	function testMark (name, line, col) {
		var p1 = wasavi.getMark(name);
		assert.t(`#testMark for "${name}", 1`, p1);
		assert.eq(
			`#testMark for "${name}", 2`,
			`line ${line}, col ${col}`,
			`line ${p1[0]}, col ${p1[1]}`);
	}

	function* _changeBound (command) {
		yield wasavi.send('ifoobar\nbazbax\u001b');
		yield wasavi.send('1G3|vj4|' + command + 'XYZ\u001b');

		assert.value('#1-1', 'foXYZax');
		assert.eq('#1-2', 'obar\nbazb', wasavi.getRegister('"'));
		assert.eq('#1-3', 'XYZ', wasavi.getRegister('.'));
		assert.eq('#1-4', 'vj4|' + command + 'XYZ\u001b', wasavi.getLastSimpleCommand());
		testMark('<', 0, 2);
		testMark('>', 0, 5);
	}

	function* _changeBoundLinewise (command) {
		yield wasavi.send('ifoobar\nbazbax\nquxquux\u001b');
		yield wasavi.send('1G3|vj4|' + command + 'XYZ\u001b');

		assert.value('#1-1', 'XYZ\nquxquux');
		assert.eq('#1-2', 'foobar\nbazbax\n', wasavi.getRegister('"'));
		assert.eq('#1-3', 'XYZ', wasavi.getRegister('.'));
		assert.eq('#1-4', 'vj4|' + command + 'XYZ\u001b', wasavi.getLastSimpleCommand());

		assert.f('#2-1', wasavi.getMark('<'));
		assert.f('#2-2', wasavi.getMark('>'));
	}

	function* _deleteBound (command) {
		yield wasavi.send('ifoobar\nbazbax\u001b');
		yield wasavi.send('1G3|vj4|' + command);

		assert.value('#1-1', 'foax');
		assert.eq('#1-2', 'obar\nbazb', wasavi.getRegister('"'));
		assert.eq('#1-4', 'vj4|' + command, wasavi.getLastSimpleCommand());
		testMark('<', 0, 2);
		testMark('>', 0, 2);
	}

	function* _deleteBoundLinewise (command) {
		yield wasavi.send('ifoobar\nbazbax\nquxquux\u001b');
		yield wasavi.send('1G3|vj4|' + command);

		assert.value('#1-1', 'quxquux');
		assert.eq('#1-2', 'foobar\nbazbax\n', wasavi.getRegister('"'));
		assert.eq('#1-4', 'vj4|' + command, wasavi.getLastSimpleCommand());
		assert.f('#2-1', wasavi.getMark('<'));
		assert.f('#2-2', wasavi.getMark('>'));
	}

	function* _pasteIntoBound (command) {
		yield wasavi.send('ifoo\nbr\nbaz\nbax\u001b');

		/*
		 * foo                    foo
		 * br   -->  '":foo  -->  foo  -->  '":br
		 * baz                    baz
		 * bax                    bax
		 */

		yield wasavi.send('1Gyw2G0ve' + command);
		assert.value('#1-1', 'foo\nfoo\nbaz\nbax');
		assert.eq('#1-2', 'br', wasavi.getRegister('"'));
		assert.eq('#1-4', 've' + command, wasavi.getLastSimpleCommand());
		testMark('<', 1, 0);
		testMark('>', 1, 3);

		yield wasavi.send('G0ve' + command);
		assert.value('#2-1', 'foo\nfoo\nbaz\nbr');
	}

	function* _pasteLinewiseDataIntoBound (command) {
		yield wasavi.send('ifoo\nbar\nbaz\nbax\u001b');

		/*
		 * foo                    foo
		 * bar  -->  "':foo  -->  bar  -->  "':baz^J
		 * baz          bar       foo
		 * bax                    bar
		 *
		 *                        bax
		 */
		yield wasavi.send('1Gy2y3G0ve' + command);
		assert.value('#1-1', 'foo\nbar\nfoo\nbar\n\nbax');
		assert.eq('#1-2', 'baz', wasavi.getRegister('"'));
		assert.eq('#1-4', 've' + command, wasavi.getLastSimpleCommand());
		testMark('<', 2, 0);
		testMark('>', 4, 0);
	}

	/* common */

	it('char bound', function* () {
		yield wasavi.send('ifoobar\nbazbax\u001b');
		yield wasavi.send('1G3|vj4|\u001b');

		testMark('<', 0, 2);
		testMark('>', 1, 3);
	});

	it('line bound', function* () {
		yield wasavi.send('ifoobar\nbazbax\u001b');
		yield wasavi.send('1G3|Vj4|\u001b');

		testMark('<', 0, 2);
		testMark('>', 1, 3);
	});

	it('char to line', function* () {
		yield wasavi.send('ifoo\nbar\nbaz\nbax\u001b');
		yield wasavi.send('2G2|vjVy');
		assert.value('#1-1', 'foo\nbar\nbaz\nbax');
		assert.eq('#1-2', 'bar\nbaz\n', wasavi.getRegister('"'));
		assert.eq('#1-4', 'vjVy', wasavi.getLastSimpleCommand());
		testMark('<', 1, 1);
		testMark('>', 2, 1);
	});

	it('line to char', function* () {
		yield wasavi.send('ifoo\nbar\nbaz\nbax\u001b');
		yield wasavi.send('2G2|Vjvy');
		assert.value('#1-1', 'foo\nbar\nbaz\nbax');
		assert.eq('#1-2', 'ar\nba', wasavi.getRegister('"'));
		assert.eq('#1-4', 'Vjvy', wasavi.getLastSimpleCommand());
		testMark('<', 1, 1);
		testMark('>', 2, 1);
	});

	/* bound mode */

	it('change bound', function* () {
		promise.consume(_changeBound, null, 'c');
	});

	it('change bounds', function* () {
		promise.consume(_changeBound, null, 's');
	});

	it('change bound linewise', function* () {
		promise.consume(_changeBoundLinewise, null, 'C');
	});

	it('change bound linewise r', function* () {
		promise.consume(_changeBoundLinewise, null, 'R');
	});

	it('delete bound', function* () {
		promise.consume(_deleteBound, null, 'd');
	});

	it('delete boundx', function* () {
		promise.consume(_deleteBound, null, 'x');
	});

	it('delete bound linewise', function* () {
		promise.consume(_deleteBoundLinewise, null, 'D');
	});

	it('delete bound linewise x', function* () {
		promise.consume(_deleteBoundLinewise, null, 'X');
	});

	it('yank bound', function* () {
		yield wasavi.send('ifoo bar\nbaz bax\u001b');
		yield wasavi.send('1G^wv2w"ay');

		assert.value('#1-1', 'foo bar\nbaz bax');
		assert.eq('#1-2', 'bar\nbaz b', wasavi.getRegister('a'));
		assert.eq('#1-4', 'v2w"ay', wasavi.getLastSimpleCommand());
		testMark('<', 0, 4);
		testMark('>', 1, 4);
	});

	it('yank bound linewise', function* () {
		yield wasavi.send('ifoo bar\nbaz bax\nqux quux\u001b');
		yield wasavi.send('1G^wv2w"aY');

		assert.value('#1-1', 'foo bar\nbaz bax\nqux quux');
		assert.eq('#1-2', 'foo bar\nbaz bax\n', wasavi.getRegister('a'));
		assert.eq('#1-4', 'v2w"aY', wasavi.getLastSimpleCommand());
		testMark('<', 0, 4);
		testMark('>', 1, 4);
	});

	it('shift bound', function* () {
		yield wasavi.send('ifoo bar\nbaz bax\nqux quux\u001b');
		yield wasavi.send('1G^wv2e>');

		assert.value('#1-1', '    foo bar\n    baz bax\nqux quux');
		assert.eq('#1-4', 'v2e>', wasavi.getLastSimpleCommand());
		testMark('<', 0, 8);
		testMark('>', 1, 6);
	});

	it('unshift bound', function* () {
		yield wasavi.send(':set noai\ni\tfoo bar\n    baz bax\nqux quux\u001b');
		yield wasavi.send('2G^vb<');

		assert.value('#1-1', '    foo bar\nbaz bax\nqux quux');
		assert.eq('#1-4', 'vb<', wasavi.getLastSimpleCommand());
		testMark('<', 0, 8);
		testMark('>', 1, 0);
	});

	it('restore bound', function* () {
		yield wasavi.send('ifoo bar\nbaz bax\nqux quux\u001b');
		yield wasavi.send('1G^wv2wl\u001b');

		testMark('<', 0, 4);
		testMark('>', 1, 5);

		yield wasavi.send('gvy');
		assert.value('#1-1', 'foo bar\nbaz bax\nqux quux');
		assert.eq('#1-2', 'bar\nbaz ba', wasavi.getRegister('"'));
		assert.eq('#1-4', 'gvy', wasavi.getLastSimpleCommand());
	});

	it('range symbol', function* () {
		yield wasavi.send('ifoo bar\nbaz bax\nqux quux\u001b');
		yield wasavi.send('1G6|viw\u001b');

		testMark('<', 0, 4);
		testMark('>', 0, 6);
	});

	it('swap case in bound', function* () {
		yield wasavi.send('ifoo BAR\nBAZ bax\nqux quux\u001b');
		yield wasavi.send('1G^2|vj$h~');

		assert.value('#1-1', 'fOO bar\nbaz BAx\nqux quux');
		assert.eq('#1-4', 'vj$h~', wasavi.getLastSimpleCommand());
		testMark('<', 0, 1);
		testMark('>', 1, 5);
	});

	it('switch to line input', function* () {
		yield wasavi.send('i1 first\n2 second\n3\n4\n5\u001b');
		yield wasavi.send('1G^ffvj$:p\n');

		assert.eq('#1-1', '1 first\n2 second', wasavi.getLastMessage());
		testMark('<', 0, 2);
		testMark('>', 1, 8);
	});

	it('join bound', function* () {
		yield wasavi.send('ifoo\nbar\nbaz\nbax\u001b');
		yield wasavi.send('2GvjJ');

		assert.value('#1-1', 'foo\nbar baz\nbax');
		assert.eq('#1-4', 'vjJ', wasavi.getLastSimpleCommand());
		testMark('<', 1, 0);
		testMark('>', 1, 4);

		yield wasavi.send('u1GvJ');
		assert.value('#2-1', 'foo bar\nbaz\nbax');
		assert.eq('#2-4', 'vJ', wasavi.getLastSimpleCommand());
		testMark('<', 0, 0);
		testMark('>', 0, 0);
	});

	it('paste into bound by p', function* () {
		promise.consume(_pasteIntoBound, null, 'p');
	});

	it('paste into bound by P', function* () {
		promise.consume(_pasteIntoBound, null, 'P');
	});

	it('paste into bound linewise by p', function* () {
		promise.consume(_pasteLinewiseDataIntoBound, null, 'p');
	});

	it('paste into bound linewise by P', function* () {
		promise.consume(_pasteLinewiseDataIntoBound, null, 'P');
	});

	it('fill up bound', function* () {
		yield wasavi.send('ifoo bar\nbaz bax\nqux quux\u001b');
		yield wasavi.send('2G2|vj$2hrX');

		assert.value('#1-1', 'foo bar\nbXXXXXX\nXXXXXXux');
		assert.eq('#1-4', 'vj$2hrX', wasavi.getLastSimpleCommand());
		testMark('<', 1, 1);
		testMark('>', 2, 5);
	});

	it('upper case bound', function* () {
		yield wasavi.send('ifoo bar\nbaz Bax\nqux quux\u001b');
		yield wasavi.send('2G2|vj$2hU');

		assert.value('#1-1', 'foo bar\nbAZ BAX\nQUX QUux');
		assert.eq('#1-4', 'vj$2hU', wasavi.getLastSimpleCommand());
		testMark('<', 1, 1);
		testMark('>', 2, 5);
	});

	it('lower case bound', function* () {
		yield wasavi.send('iFOO BAR\nBAZ bAX\nQUX QUUX\u001b');
		yield wasavi.send('2G2|vj$2hu');

		assert.value('#1-1', 'FOO BAR\nBaz bax\nqux quUX');
		assert.eq('#1-4', 'vj$2hu', wasavi.getLastSimpleCommand());
		testMark('<', 1, 1);
		testMark('>', 2, 5);
	});

	/* bound line mode */

	function* _changeLineBound (command) {
		yield wasavi.send('ifoobar\nbazbax\nquuquux\u001b');
		yield wasavi.send('1G3|Vj4|' + command + 'XYZ\u001b');

		assert.value('#1-1', 'XYZ\nquuquux');
		assert.eq('#1-2', 'foobar\nbazbax\n', wasavi.getRegister('"'));
		assert.eq('#1-3', 'XYZ', wasavi.getRegister('.'));
		assert.eq('#1-4', 'Vj4|' + command + 'XYZ\u001b', wasavi.getLastSimpleCommand());

		assert.f('#2-1', wasavi.getMark('<'));
		assert.f('#2-2', wasavi.getMark('>'));
	}

	function* _deleteLineBound (command) {
		yield wasavi.send('ifoobar\nbazbax\nquxquux\u001b');
		yield wasavi.send('1G3|Vj4|' + command);

		assert.value('#1-1', 'quxquux');
		assert.eq('#1-2', 'foobar\nbazbax\n', wasavi.getRegister('"'));
		assert.eq('#1-4', 'Vj4|' + command, wasavi.getLastSimpleCommand());

		assert.f('#2-1', wasavi.getMark('<'));
		assert.f('#2-2', wasavi.getMark('>'));
	}

	function* _yankLineBound (command) {
		yield wasavi.send('ifoo bar\nbaz bax\nqux quux\u001b');
		yield wasavi.send('1G^wV2w"a', command);

		assert.value('#1-1', 'foo bar\nbaz bax\nqux quux');
		assert.eq('#1-2', 'foo bar\nbaz bax\n', wasavi.getRegister('a'));
		assert.eq('#1-4', 'V2w"a' + command, wasavi.getLastSimpleCommand());
		testMark('<', 0, 4);
		testMark('>', 1, 4);
	}

	function* _pasteIntoLineBound (command) {
		yield wasavi.send('ifoo\nbr\nbaz\nbax\u001b');

		yield wasavi.send('1Gyw2G0Ve' + command);
		assert.value('#1-1', 'foo\nfoo\nbaz\nbax');
		assert.eq('#1-2', 'br\n', wasavi.getRegister('"'));
		assert.eq('#1-4', 'Ve' + command, wasavi.getLastSimpleCommand());
		testMark('<', 1, 0);
		testMark('>', 1, 3);

		yield wasavi.send('G0Ve' + command);
		assert.value('#2-1', 'foo\nfoo\nbaz\nbr');
	}

	function* _pasteLinewiseDataIntoLineBound (command) {
		yield wasavi.send('ifoo\nbar\nbaz\nbax\u001b');

		yield wasavi.send('1Gy2y3G0Ve' + command);
		assert.value('#1-1', 'foo\nbar\nfoo\nbar\nbax');
		assert.eq('#1-2', 'baz\n', wasavi.getRegister('"'));
		assert.eq('#1-4', 'Ve' + command, wasavi.getLastSimpleCommand());
		testMark('<', 2, 0);
		testMark('>', 4, 0);
	}

	it('change line bound', function* () {
		promise.consume(_changeLineBound, null, 'c');
	});

	it('change line bounds', function* () {
		promise.consume(_changeLineBound, null, 's');
	});

	it('change line bound linewise', function* () {
		promise.consume(_changeLineBound, null, 'C');
	});

	it('change line bound linewise r', function* () {
		promise.consume(_changeLineBound, null, 'R');
	});

	it('delete line bound', function* () {
		promise.consume(_deleteLineBound, null, 'd');
	});

	it('delete line boundx', function* () {
		promise.consume(_deleteLineBound, null, 'x');
	});

	it('delete line bound d', function* () {
		promise.consume(_deleteLineBound, null, 'D');
	});

	it('delete line bound x', function* () {
		promise.consume(_deleteLineBound, null, 'X');
	});

	it('yank line bound', function* () {
		promise.consume(_yankLineBound, null, 'y');
	});

	it('yank line bound y', function* () {
		promise.consume(_yankLineBound, null, 'Y');
	});

	it('shift line bound', function* () {
		yield wasavi.send('ifoo bar\nbaz bax\nqux quux\u001b');
		yield wasavi.send('1G^wV2e>');

		assert.value('#1-1', '    foo bar\n    baz bax\nqux quux');
		assert.eq('#1-4', 'V2e>', wasavi.getLastSimpleCommand());
		testMark('<', 0, 8);
		testMark('>', 1, 6);
	});

	it('unshift line bound', function* () {
		yield wasavi.send(':set noai\ni\tfoo bar\n    baz bax\nqux quux\u001b');
		yield wasavi.send('2G^Vb<');

		assert.value('#1-1', '    foo bar\nbaz bax\nqux quux');
		assert.eq('#1-4', 'Vb<', wasavi.getLastSimpleCommand());
		testMark('<', 0, 8);
		testMark('>', 1, 0);
	});

	it('restore line bound', function* () {
		yield wasavi.send('ifoo bar\nbaz bax\nqux quux\u001b');
		yield wasavi.send('1G^wV2wl\u001b');

		testMark('<', 0, 4);
		testMark('>', 1, 5);

		yield wasavi.send('gvy');
		assert.value('#1-1', 'foo bar\nbaz bax\nqux quux');
		assert.eq('#1-2', 'foo bar\nbaz bax\n', wasavi.getRegister('"'));
		assert.eq('#1-4', 'gvy', wasavi.getLastSimpleCommand());
	});

	it('range symbol line bound', function* () {
		yield wasavi.send('ifoo bar\nbaz bax\nqux quux\u001b');
		yield wasavi.send('1G6|Vjy');

		assert.value('#1-1', 'foo bar\nbaz bax\nqux quux');
		assert.eq('#1-2', 'foo bar\nbaz bax\n', wasavi.getRegister('"'));
		assert.eq('#1-4', 'Vjy', wasavi.getLastSimpleCommand());
		testMark('<', 0, 5);
		testMark('>', 1, 5);
	});

	it('range symbol inner para', function* () {
		yield wasavi.send('ione\ntwo\nthree\nfour\n\none\ntwo\nthree\nfour\u001b');

		yield wasavi.send('2G2|vipy\u001b');
		assert.pos('#1-1', 0, 0);
		assert.eq('#1-2', 'one\ntwo\nthree\nfour\n', wasavi.getRegister('"'));
		assert.eq('#1-3', 'vipy', wasavi.getLastSimpleCommand());
		testMark('<', 0, 0);
		testMark('>', 3, 0);

		yield wasavi.send('8G3|vipy\u001b');
		assert.pos('#2-1', 5, 0);
		assert.eq('#2-2', 'one\ntwo\nthree\nfour\n', wasavi.getRegister('"'));
		assert.eq('#2-3', 'vipy', wasavi.getLastSimpleCommand());
		testMark('<', 5, 0);
		testMark('>', 8, 0);
	});

	it('range symbol all para', function* () {
		yield wasavi.send('i' + [
			'one',
			'two',
			'three',
			'four',
			'',
			'one',
			'two',
			'three',
			'four'
		].join('\n') + '\u001b');

		yield wasavi.send('2G2|vapy\u001b');
		assert.pos('#1-1', 0, 0);
		assert.eq('#1-2', 'one\ntwo\nthree\nfour\n\n', wasavi.getRegister('"'));
		assert.eq('#1-3', 'vapy', wasavi.getLastSimpleCommand());
		testMark('<', 0, 0);
		testMark('>', 4, 0);

		yield wasavi.send('8G3|vapy\u001b');
		assert.pos('#2-1', 4, 0);
		assert.eq('#2-2', '\none\ntwo\nthree\nfour\n', wasavi.getRegister('"'));
		assert.eq('#2-3', 'vapy', wasavi.getLastSimpleCommand());
		testMark('<', 4, 0);
		testMark('>', 8, 0);
	});

	it('swap case in line bound', function* () {
		yield wasavi.send('ifoo BAR\nBAZ bax\nqux quux\u001b');
		yield wasavi.send('1G^2|Vj$h~');

		assert.value('#1-1', 'FOO bar\nbaz BAX\nqux quux');
		assert.eq('#1-4', 'Vj$h~', wasavi.getLastSimpleCommand());
		testMark('<', 0, 1);
		testMark('>', 1, 5);
	});

	it('switch line bound to line input', function* () {
		yield wasavi.send('i1 first\n2 second\n3\n4\n5\u001b');
		yield wasavi.send('1G^ffVj$:p\n');

		assert.eq('#1-1', '1 first\n2 second', wasavi.getLastMessage());
		testMark('<', 0, 2);
		testMark('>', 1, 8);
	});

	it('join line bound', function* () {
		yield wasavi.send('ifoo\nbar\nbaz\nbax\u001b');
		yield wasavi.send('2GVjJ');

		assert.value('#1-1', 'foo\nbar baz\nbax');
		assert.eq('#1-4', 'VjJ', wasavi.getLastSimpleCommand());
		testMark('<', 1, 0);
		testMark('>', 1, 4);

		yield wasavi.send('u1GVJ');
		assert.value('#2-1', 'foo bar\nbaz\nbax');
		assert.eq('#2-4', 'VJ', wasavi.getLastSimpleCommand());
		testMark('<', 0, 0);
		testMark('>', 0, 0);
	});

	it('paste into line bound', function* () {
		promise.consume(_pasteIntoLineBound, null, 'p');
	});

	it('paste into line bound p', function* () {
		promise.consume(_pasteIntoLineBound, null, 'P');
	});

	// https://github.com/akahuku/wasavi/issues/67
	it('yank paragraph', function* () {
		yield wasavi.send('17G1|');
		yield wasavi.send('vapy');
		yield wasavi.send('P:17,21ya\n');
		assert.eq('#1-1',
			'\tLorem ipsum dolor sit amet. consectetur adipisicing elit.  sed do eiusmod\n' +
			'\ttempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam\n' +
			'\n' +
			'\tLorem ipsum dolor sit amet. consectetur adipisicing elit.  sed do eiusmod\n' +
			'\ttempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam\n',
			wasavi.getRegister('"'));
	});

	// https://github.com/akahuku/wasavi/issues/69
	it('reformat', function* () {
		//
		yield wasavi.send(
			'i' +
			'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna liqua.\n' +
			'\n' +
			'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.\n' +
			'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.' +
			'\u001b');

		//
		yield wasavi.send('3G1|w');
		yield wasavi.send(':set tw=32\n');
		yield wasavi.send('vgq');
		yield wasavi.send('w');
		assert.value('#1-1',
			'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna liqua.\n' +
			'\n' +
			'Ut enim ad minim veniam, quis\n' +
			'nostrud exercitation ullamco\n' +
			'laboris nisi ut aliquip ex ea\n' +
			'commodo consequat.\n' +
			'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.');
		assert.pos('#1-2', 6, 5);
	});

	it('should increase a numeric number in the bound', function* () {
		yield wasavi.send('ia123 456b\u001byy3p');
		yield wasavi.send('1G6|v2j2h\u0001');
		assert.value(
			'#1-1',
			'a123 457b\n' +
			'a124 457b\n' +
			'a124 456b\n' +
			'a123 456b');
	});

	it('should decrease a numeric number in the bound', function* () {
		yield wasavi.send('ia123 456b\u001byy3p');
		yield wasavi.send('1G6|v2j2h\u0018');
		assert.value(
			'#1-1',
			'a123 455b\n' +
			'a122 455b\n' +
			'a122 456b\n' +
			'a123 456b');
	});

	it('should increase a numeric number in the bound_line', function* () {
		yield wasavi.send('ia123 456b\u001byy3p');
		yield wasavi.send('1G6|V2j2h\u0001');
		assert.value(
			'#1-1',
			'a124 457b\n' +
			'a124 457b\n' +
			'a124 457b\n' +
			'a123 456b');
	});

	it('should decrease a numeric number in the bound_line', function* () {
		yield wasavi.send('ia123 456b\u001byy3p');
		yield wasavi.send('1G6|V2j2h\u0018');
		assert.value(
			'#1-1',
			'a122 455b\n' +
			'a122 455b\n' +
			'a122 455b\n' +
			'a123 456b');
	});
};
