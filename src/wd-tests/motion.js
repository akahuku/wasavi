'use strict';

const {By, Key, until, promise} = require('selenium-webdriver');
const {it, describe} = require('selenium-webdriver/testing');

exports.suite = (assert, wasavi, driver) => {
	const {ctrln, ctrlt, ctrlw} = assert.shortcuts;

	const SECTION_TEST_TEXT = [
		'\tfirst line',// * 1
		'dummy line',
		'',
		'\f line whose first character is form-feed',// * 4
		'\t\f line whose second character is form-feed',
		'dummy line',
		'',
		'{ line whose first character is curly brace',// * 8
		'\t{ line whose second character is curly brace',
		'dummy line',
		'',
		'.SH',// * 12
		'dummy line',
		'',
		'.IP',
		'',
		'\tLorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod',
		'\ttempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam',
		'',
		'.H ',// * 20
		'dummy line',
		'' // * 22
	].join('\n');

	it('up line', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('iline1\n\tline2\n\t\tline3\u001b');
		assert.value('line1\n\tline2\n\t\tline3');

		yield wasavi.send(':3\n');
		assert.pos('#1', 2, 2);

		yield wasavi.send('-');
		assert.pos('#2', 1, 1);

		yield wasavi.send('-');
		assert.pos('#3', 0, 0);

		yield wasavi.send('-');
		assert.pos('#4', 0, 0);
		assert.eq('error cheeck #4', '- canceled.', wasavi.getLastMessage());

		yield wasavi.send(':2\n');
		assert.pos('#5', 1, 1);
		yield wasavi.send('2-');
		assert.pos('#6', 0, 0);
		assert.eq('error cheeck #7', '', wasavi.getLastMessage());
	});

	function* _testDownLine (a) {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('iline1\n\tline2\n\t\tline3\u001b');
		assert.value('line1\n\tline2\n\t\tline3');

		yield wasavi.send(':1\n');
		assert.pos('#1', 0, 0);

		yield wasavi.send(a);
		assert.pos('#2', 1, 1);

		yield wasavi.send(a);
		assert.pos('#3', 2, 2);

		yield wasavi.send(a);
		assert.pos('#4', 2, 2);
		assert.t('error check #4', wasavi.getLastMessage().length);

		yield wasavi.send(':2\n');
		assert.pos('#5', 1, 1);
		yield wasavi.send('2', a);
		assert.pos('#6', 2, 2);
		assert.eq('error cheeck #7', '', wasavi.getLastMessage());
	}

	it('down line', function* () {
		promise.consume(_testDownLine, null, '+');
	});

	it('down enter', function* () {
		promise.consume(_testDownLine, null, Key.ENTER);
	});

	function* _testFirstNonWhiteCharOfLine (a) {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('i\t\ttest string\n\t\ttest string\u001b');
		assert.pos('#1', 1, 12);

		yield wasavi.send(a);
		assert.pos('#2', 1, 2);

		yield wasavi.send('2', a);
		assert.pos('#3', 1, 2);
	}

	it('first non white char of line', function* () {
		promise.consume(_testFirstNonWhiteCharOfLine, null, '^');
	});

	it('home', function* () {
		promise.consume(_testFirstNonWhiteCharOfLine, null, Key.HOME);
	});

	it('top of line', function* () {
		yield wasavi.send('i\t\tline\u001b');

		yield wasavi.send('0');
		assert.pos('#1', 0, 0);
	});

	function* _testTailOfLine (a) {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('i\t\ttest string\n\t\ttest string\u001b', 'gg');
		assert.pos('#1', 0, 2);

		yield wasavi.send(a);
		assert.pos('#2', 0, 12);

		yield wasavi.send('2', a);
		assert.pos('#3', 1, 12);

		yield wasavi.send('gg', '100', a);
		assert.pos('#4', 1, 12);
		assert.eq('error cheeck #5', '', wasavi.getLastMessage());
	};

	it('tail of line', function* () {
		promise.consume(_testTailOfLine, null, '$');
	});

	it('end', function* () {
		promise.consume(_testTailOfLine, null, Key.END);
	});

	it('direct column', function* () {
		yield wasavi.send('i0123456789\u001b');

		yield wasavi.send('5|');
		assert.pos('#1', 0, 4);

		yield wasavi.send('11|');
		assert.pos('#2', 0, 9);

		yield wasavi.send('|');
		assert.pos('#3', 0, 0);
	});

	it('jump to matched parenthes', function* () {
		var openBrackets = '([{<';
		var closeBrackets = ')]}>';

		var base = [
			'first O second O',
			'  third level CC'
		].join('\n');

		var a = ['', '', '', ''];

		for (var i = 0; i < 4; i++) {
			a[i] = base
				.replace(/O/g, openBrackets.charAt(i))
				.replace(/C/g, closeBrackets.charAt(i));
		}

		var a2 = a.join('\n');
		yield wasavi.send(':set noai\n');
		yield wasavi.send('i' + a2 + '\u001b');
		
		for (var i = 0; i < 4; i++) {
			yield wasavi.send(i * 2 + 1, 'G2|');
			assert.pos(
				'% test with "' +
				openBrackets.charAt(i) +
				closeBrackets.charAt(i) +
				'" #1',
				i * 2, 1
			);

			yield wasavi.send('%');
			assert.pos(
				'% test with "' +
				openBrackets.charAt(i) +
				closeBrackets.charAt(i) +
				'" #2',
				i * 2 + 1, 15
			);

			yield wasavi.send('h%');
			assert.pos(
				'% test with "' +
				openBrackets.charAt(i) +
				closeBrackets.charAt(i) +
				'" #3',
				i * 2 + 0, 15
			);

			yield wasavi.send('%');
			assert.pos(
				'% test with "' +
				openBrackets.charAt(i) +
				closeBrackets.charAt(i) +
				'" #4',
				i * 2 + 1, 14
			);
		}
	});

	it('jump to row by percentage', function* () {
		yield wasavi.makeScrollableBuffer(2);
		var lines = yield wasavi.getRow() + 1;
		var expectedRow = Math.floor(lines * 0.5);

		yield wasavi.send('50%');
		assert.eq('#1-1', expectedRow, wasavi.getRow());

		yield wasavi.send('1000%');
		assert.eq('#2-1', '% canceled.', wasavi.getLastMessage());
	});

	it('search forward', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('ifirst line\n\tsecond line\n\tthird line\u001b', 'gg');

		yield wasavi.send('/third\u001b');
		assert.pos('#1', 0, 0);

		yield wasavi.send('/third\n');
		assert.pos('#2', 2, 1);

		yield wasavi.send('gg/second/+\n');
		assert.pos('#3', 2, 1);

		yield wasavi.send('gg/second/1\n');
		assert.pos('#4', 2, 1);

		yield wasavi.send('gg/second/+1\n');
		assert.pos('#5', 2, 1);

		yield wasavi.send('gg/second/\n');
		assert.pos('#6', 1, 1);
	});

	it('search backward', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('ifirst line\n\tsecond line\n\tthird line\u001b', 'G', '$');

		yield wasavi.send('?second\u001b');
		assert.pos('#1', 2, 10);

		yield wasavi.send('?second\n');
		assert.pos('#2', 1, 1);

		yield wasavi.send('G?second?-\n');
		assert.pos('#3', 0, 0);

		yield wasavi.send('G?second?-1\n');
		assert.pos('#4', 0, 0);

		yield wasavi.send('G?second?\n');
		assert.pos('#5', 1, 1);
	});

	it('find forward', function* () {
		yield wasavi.send('ifind the char4cter in current 4ine\u001b');

		yield wasavi.send('0');
		yield wasavi.send('f4');
		assert.pos('#1', 0, 13);

		yield wasavi.send('0');
		yield wasavi.send('2f4');
		assert.pos('#2', 0, 30);

		yield wasavi.send('0');
		yield wasavi.send('fX');
		assert.pos('#3', 0, 0);
		assert.t(wasavi.getLastMessage().length);

		yield wasavi.send('0');
		yield wasavi.send('2fX');
		assert.pos('#4', 0, 0);
		assert.t(wasavi.getLastMessage().length);
	});

	it('find backward', function* () {
		yield wasavi.send('ifind the char4cter in current 4ine\u001b');

		yield wasavi.send('$');
		yield wasavi.send('F4');
		assert.pos('#1', 0, 30);

		yield wasavi.send('$');
		yield wasavi.send('2F4');
		assert.pos('#2', 0, 13);

		yield wasavi.send('$');
		yield wasavi.send('FX');
		assert.pos('#3', 0, 33);
		assert.t(wasavi.getLastMessage().length);

		yield wasavi.send('$');
		yield wasavi.send('2FX');
		assert.pos('#4', 0, 33);
		assert.t(wasavi.getLastMessage().length);
	});

	it('find forward before stop', function* () {
		yield wasavi.send('ifind the char4cter in current 4ine\u001b');

		yield wasavi.send('0');
		yield wasavi.send('t4');
		assert.pos('#1', 0, 12);

		yield wasavi.send('0');
		yield wasavi.send('2t4');
		assert.pos('#2', 0, 29);

		yield wasavi.send('0');
		yield wasavi.send('tX');
		assert.pos('#3', 0, 0);
		assert.t(wasavi.getLastMessage().length);

		yield wasavi.send('0');
		yield wasavi.send('2tX');
		assert.pos('#4', 0, 0);
		assert.t(wasavi.getLastMessage().length);
	});

	it('find backward before stop', function* () {
		yield wasavi.send('ifind the char4cter in current 4ine\u001b');

		yield wasavi.send('$');
		yield wasavi.send('T4');
		assert.pos('#1', 0, 31);


		yield wasavi.send('$');
		yield wasavi.send('2T4');
		assert.pos('#2', 0, 14);

		yield wasavi.send('$');
		yield wasavi.send('TX');
		assert.pos('#3', 0, 33);
		assert.t(wasavi.getLastMessage().length);

		yield wasavi.send('$');
		yield wasavi.send('2TX');
		assert.pos('#4', 0, 33);
		assert.t(wasavi.getLastMessage().length);
	});

	it('find invert', function* () {
		yield wasavi.send('ifind the char4cter in current 4ine\u001b');

		yield wasavi.send('0');
		yield wasavi.send('2f4');
		assert.pos('#1', 0, 30);

		yield wasavi.send(',');
		assert.pos('#2', 0, 13);

		yield wasavi.send(',');
		assert.pos('#3', 0, 13);
		assert.t(wasavi.getLastMessage().length);

		yield wasavi.send('$2,');
		assert.pos('#4', 0, 13);

		yield wasavi.send('$');
		yield wasavi.send('2F4');
		assert.pos('#1', 0, 13);

		yield wasavi.send(',');
		assert.pos('#2', 0, 30);

		yield wasavi.send(',');
		assert.pos('#3', 0, 30);
		assert.t(wasavi.getLastMessage().length);

		yield wasavi.send('^2,');
		assert.pos('#4', 0, 30);
	});

	it('find repeat', function* () {
		yield wasavi.send('ifind the char4cter in current 4ine\u001b');

		yield wasavi.send('0');
		yield wasavi.send('f4');
		yield wasavi.send(';');
		assert.pos('#1', 0, 30);

		yield wasavi.send('0');
		yield wasavi.send('2;');
		assert.pos('#2', 0, 30);

		yield wasavi.send('$');
		yield wasavi.send('F4');
		yield wasavi.send(';');
		assert.pos('#3', 0, 13);

		yield wasavi.send('$');
		yield wasavi.send('2;');
		assert.pos('#4', 0, 13);
	});

	it('down line orient', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('i\t\ttest string\n\t\ttest string\u001b', 'gg', '$');
		assert.pos('#1', 0, 12);

		yield wasavi.send('_');
		assert.pos('#2', 0, 2);

		yield wasavi.send('2_');
		assert.pos('#3', 1, 2);

		yield wasavi.send('gg', '100_');
		assert.pos('#4', 1, 2);
		assert.eq('error cheeck #5', '', wasavi.getLastMessage());
	});

	it('mark', function* () {
		yield wasavi.send('iHi there. This is great.\u001b');

		yield wasavi.send('7|ma$mb');
		assert.pos('#1', 0, 23);

		yield wasavi.send('`a');
		assert.pos('#2', 0, 6);

		yield wasavi.send('`b');
		assert.pos('#3', 0, 23);

		yield wasavi.send('db0');
		assert.pos('#4', 0, 0);
		assert.value('#5', 'Hi there. This is .');

		yield wasavi.send('`b');
		assert.pos('#6', 0, 18);
	});

	it('mark line orient', function* () {
		yield wasavi.send('iFirst\nHi there.\nThis is great.\u001b');

		yield wasavi.send('2G', '7|magg');
		assert.pos('#1', 0, 0);
		assert.value('#2', 'First\nHi there.\nThis is great.');

		yield wasavi.send("'a");
		assert.pos('#3', 1, 0);
	});

	it('mark tracks its position', function* () {
		yield wasavi.send('ifoo1bar2baz3bax\u001b');

		yield wasavi.send('F2ma');
		assert.pos('#1-1', 0, 7);

		/*
		 *                       ___
		 * foo1bar2baz3bax  -->  XYZfoo1bar2baz3bax
		 *        *                        *
		 *        a                        a
		 */
		yield wasavi.send('0iXYZ\u001b`a');
		assert.value('#2-1', 'XYZfoo1bar2baz3bax');
		assert.pos('#2-2', 0, 10);

		/*
		 *                                    ___
		 * XYZfoo1bar2baz3bax  -->  XYZfoo1barXYZ2baz3bax
		 *           *                           *
		 *           a                           a
		 */
		yield wasavi.send('iXYZ\u001b`a');
		assert.value('#3-1', 'XYZfoo1barXYZ2baz3bax');
		assert.pos('#3-2', 0, 13);

		/*
		 * ___
		 * XYZfoo1barXYZ2baz3bax  -->  foo1barXYZ2baz3bax
		 *              *                        *
		 *              a                        a
		 */
		yield wasavi.send('03x`a');
		assert.value('#4-1', 'foo1barXYZ2baz3bax');
		assert.pos('#4-2', 0, 10);

		/*
		 *        _____
		 * foo1barXYZ2baz3bax  -->  foo1baraz3bax
		 *           *                     *
		 *           a                     a
		 */
		yield wasavi.send('0fX5x`a');
		assert.value('#5-1', 'foo1baraz3bax');
		assert.pos('#5-2', 0, 7);
	});

	it('mark tracks its position line orient', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('3ifoo\n\u001b');

		/*
		 * foo *  -->  bar
		 * foo         foo *
		 * foo         foo
		 *             foo
		 */
		yield wasavi.send('1G', '0maObar\u001b');
		assert.value('#1-1', 'bar\nfoo\nfoo\nfoo\n');
		yield wasavi.send('`a');
		assert.pos('#1-2', 1, 0);

		/*
		 * bar    -->  foo *
		 * foo *       foo
		 * foo         foo
		 * foo
		 */
		yield wasavi.send('1G', 'dd');
		assert.value('#2-1', 'foo\nfoo\nfoo\n');
		yield wasavi.send('`a');
		assert.pos('#2-2', 0, 0);

		/*
		 * foo    -->  foo
		 * foo *       foo *
		 * foo
		 */
		yield wasavi.send('2G', '0madd');
		assert.value('#3-1', 'foo\nfoo\n');
		yield wasavi.send('`a');
		assert.t('#3-2', wasavi.getLastMessage().length);
	});

	it('section forward', function* () {
		/*
		 * in section, paragraph, sentence command:
		 * to act this behavior on vim, :set cpo+={J
		 */
		yield wasavi.send('gg');

		yield wasavi.send(']]');
		assert.pos('#2', 3, 0);

		yield wasavi.send(']]');
		assert.pos('#3', 7, 0);

		yield wasavi.send(']]');
		assert.pos('#4', 11, 0);

		yield wasavi.send(']]');
		assert.pos('#5', 19, 0);

		yield wasavi.send(']]');
		assert.pos('#6', 21, 0);
	});

	it('section backward', function* () {
		yield wasavi.send('G');

		yield wasavi.send('[[');
		assert.pos('#2', 19, 0);

		yield wasavi.send('[[');
		assert.pos('#3', 11, 0);

		yield wasavi.send('[[');
		assert.pos('#4', 7, 0);

		yield wasavi.send('[[');
		assert.pos('#5', 3, 0);

		yield wasavi.send('[[');
		assert.pos('#6', 0, 1);
	});

	it('paragraph forward', function* () {
		yield wasavi.send('gg');

		var rows = [2, 3, 6, 7, 10, 11, 13, 14, 15, 18, 19, 21];
		for (var i = 0; i < rows.length; i++) {
			yield wasavi.send('}');
			assert.pos('#' + (i + 1), rows[i], 0);
		}
	});

	it('paragraph backward', function* () {
		yield wasavi.send('G');

		var rows = [19, 18, 15, 14, 13, 11, 10, 7, 6, 3, 2, 0];
		for (var i = 0; i < rows.length; i++) {
			yield wasavi.send('{');
			assert.pos('#' + (i + 1), rows[i], 0);
		}
	});

	it('sentence forward', function* () {
		yield wasavi.send('gg1|');

		var positions = [
			2, 0,
			3, 0,
			4, 1,
			6, 0,
			7, 0,
			10, 0,
			11, 0,
			12, 0,
			13, 0,
			14, 0,
			15, 0,
			16, 1,
			16, 60,
			18, 0,
			19, 0,
			20, 0,
			21, 0
		];
		for (var i = 0, goal = positions.length; i < goal; i += 2) {
			yield wasavi.send(')');
			assert.pos(
				'#' + (Math.floor(i / 2) + 1),
				positions[i], positions[i + 1]);
		}
	});

	it('sentence backward', function* () {
		yield wasavi.send('G1|');

		var positions = [
			 0, 0,
			 2, 0,
			 3, 0,
			 4, 1,
			 6, 0,
			 7, 0,
			10, 0,
			11, 0,
			12, 0,
			13, 0,
			14, 0,
			15, 0,
			16, 1,
			16, 60,
			18, 0,
			19, 0,
			20, 0
		];
		for (var i = positions.length - 2; i >= 0; i -= 2) {
			yield wasavi.send('(');
			assert.pos(
				'#' + (Math.floor(i / 2) + 1),
				positions[i], positions[i + 1]);
		}
	});

	function* _testDown (a) {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('ifirst\nsecond\nthird\u001bgg', '2|');
		assert.pos('#1', 0, 1);

		yield wasavi.send(a);
		assert.pos('#2', 1, 1);

		yield wasavi.send('gg', '2|2', a);
		assert.pos('#3', 2, 1);

		yield wasavi.send('gg', '2|100', a);
		assert.pos('#4', 2, 1);
	}

	it('down', function* () {
		promise.consume(_testDown, null, 'j');
	});

	it('down newline', function* () {
		yield wasavi.send('i' + [
			'foo',
			'',
			'bar'
		].join('\n') + '\u001b');

		yield wasavi.send('gg');
		assert.pos('#1', 0, 0);

		yield wasavi.send('j');
		assert.pos('#2', 1, 0);

		yield wasavi.send('j');
		assert.pos('#3', 2, 0);
	});

	it('down ctrl n', function* () {
		promise.consume(_testDown, null, ctrln);
	});

	it('down down', function* () {
		promise.consume(_testDown, null, Key.ARROW_DOWN);
	});

	function* _testUp (a) {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('ifirst\nsecond\nthird\u001b', 'G', '2|');
		assert.pos('#1', 2, 1);

		yield wasavi.send(a);
		assert.pos('#2', 1, 1);

		yield wasavi.send('G', '2|2', a);
		assert.pos('#3', 0, 1);

		yield wasavi.send('G', '2|100', a);
		assert.pos('#4', 0, 1);
	}

	it('up', function* () {
		promise.consume(_testUp, null, 'k');
	});

	it('up ctrl p', function* () {
		promise.consume(_testUp, null, '\u0010');
	});

	it('up up', function* () {
		promise.consume(_testUp, null, Key.ARROW_UP);
	});

	function* _testLeft (a) {
		yield wasavi.send('i123456789ABC\u001b');

		yield wasavi.send('10|', a);
		assert.pos('#1', 0, 8);

		yield wasavi.send('2', a);
		assert.pos('#2', 0, 6);

		yield wasavi.send('10', a);
		assert.pos('#3', 0, 0);
	}

	it('left', function* () {
		promise.consume(_testLeft, null, 'h');
	});

	it('left ctrl h', function* () {
		promise.consume(_testLeft, null, '\u0008');
	});

	it('left left', function* () {
		promise.consume(_testLeft, null, Key.ARROW_LEFT);
	});

	function* _testRight (a) {
		yield wasavi.send('i123456789ABC\u001b');

		yield wasavi.send('0', a);
		assert.pos('#1', 0, 1);

		yield wasavi.send('2', a);
		assert.pos('#2', 0, 3);

		yield wasavi.send('10', a);
		assert.pos('#3', 0, 11);
	}

	it('right', function* () {
		promise.consume(_testRight, null, 'l');
	});

	it('right space', function* () {
		promise.consume(_testRight, null, ' ');
	});

	it('right right', function* () {
		promise.consume(_testRight, null, Key.ARROW_RIGHT);
	});

	it('word forward', function* () {
		yield wasavi.send(':set noai\n');
		var base = 'first sëcond\n\tthird word';
		yield wasavi.send('i' + base + '\u001bgg');

		assert.pos('#1', 0, 0);

		yield wasavi.send('w');
		assert.pos('#2', 0, 6);

		yield wasavi.send('2w');
		assert.pos('#3', 1, 7);

		yield wasavi.send('2w');
		assert.pos('#4', 1, 10);

		yield wasavi.send('gg', 'cwFIRST\u001b');
		assert.value('#5', base.replace(/^first/, 'FIRST'));
	});

	it('word forward last', function* () {
		yield wasavi.send('iabc   def   ghi\u001b');
		yield wasavi.send('13|');
		yield wasavi.send('w');

		assert.pos('#1', 0, 14);
		assert.eq('#2', '', wasavi.getLastMessage());
	});

	it('word backward', function* () {
		yield wasavi.send('ifirst sëcond\n\tthird word\u001b');

		assert.pos('#1', 1, 10);

		yield wasavi.send('b');
		assert.pos('#2', 1, 7);

		yield wasavi.send('2b');
		assert.pos('#3', 0, 6);

		yield wasavi.send('2b');
		assert.pos('#4', 0, 0);
	});

	it('bigword forward', function* () {
		var base = 'fir#t sec$nd\n\tthi%d wor^';
		yield wasavi.send(':set noai\n');
		yield wasavi.send('i' + base + '\u001bgg');

		assert.pos('#1', 0, 0);

		yield wasavi.send('W');
		assert.pos('#2', 0, 6);

		yield wasavi.send('2W');
		assert.pos('#3', 1, 7);

		yield wasavi.send('2W');
		assert.pos('#4', 1, 10);

		yield wasavi.send('gg', 'cWFIRST\u001b');
		assert.value('#5', base.replace(/^fir#t/, 'FIRST'));
	});

	it('bigword forward last', function* () {
		yield wasavi.send('ia#c   d$f   g%i\u001b');
		yield wasavi.send('13|');
		yield wasavi.send('W');

		assert.pos('#1', 0, 14);
		assert.eq('#2', '', wasavi.getLastMessage());
	});

	it('bigword backward', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('ifir#t sec$nd\n\tthi%d wor^\u001b');

		assert.pos('#1', 1, 10);

		yield wasavi.send('B');
		assert.pos('#2', 1, 7);

		yield wasavi.send('2B');
		assert.pos('#3', 0, 6);

		yield wasavi.send('2B');
		assert.pos('#4', 0, 0);
	});

	it('word end', function* () {
		var base = 'first second\n\tthird word';
		yield wasavi.send(':set noai\n');
		yield wasavi.send('i' + base + '\u001bgg');

		yield wasavi.send('e');
		assert.pos('#1', 0, 4);

		yield wasavi.send('2e');
		assert.pos('#2', 1, 5);

		yield wasavi.send('2e');
		assert.pos('#3', 1, 10);
	});

	it('bigword end', function* () {
		var base = 'fir#t sec$nd\n\tthi%d wor^';
		yield wasavi.send(':set noai\n');
		yield wasavi.send('i' + base + '\u001bgg');

		yield wasavi.send('E');
		assert.pos('#1', 0, 4);

		yield wasavi.send('2E');
		assert.pos('#2', 1, 5);

		yield wasavi.send('2E');
		assert.pos('#3', 1, 10);
	});

	it('goto prefix', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('i1\n2\n3\n4\n5\u001b');

		assert.pos('#1', 4, 0);

		yield wasavi.send('gg');
		assert.pos('#2', 0, 0);

		yield wasavi.send('i\t\u001b');
		yield wasavi.send('gg');
		assert.pos('#3', 0, 1);

		yield wasavi.send('gx');
		assert.t('#4', wasavi.getLastMessage().length);
	});

	it('top of view', function* () {
		var lines = yield wasavi.makeScrollableBuffer();

		yield wasavi.send('H');
		assert.t('#1', Math.abs(0 - wasavi.getRow()) <= 1);

		yield wasavi.send('2H');
		assert.t('#2', Math.abs(1 - wasavi.getRow()) <= 1);

		yield wasavi.send('' + (lines * 2), 'H');
		assert.t('#3', Math.abs((lines - 1) - wasavi.getRow()) <= 1);
	});

	it('middle of view', function* () {
		var lines = yield wasavi.makeScrollableBuffer();

		yield wasavi.send('M');
		assert.t('#1', Math.abs(Math.floor(lines / 2) - wasavi.getRow()) <= 1);
	});

	it('bottom of view', function* () {
		var lines = yield wasavi.makeScrollableBuffer();

		yield wasavi.send('L');
		assert.t('#1', Math.abs((lines - 1) - wasavi.getRow()) <= 1);

		yield wasavi.send('2L');
		assert.t('#2', Math.abs((lines - 2) - wasavi.getRow()) <= 1);

		yield wasavi.send('' + (lines * 2), 'L');
		assert.t('#3', Math.abs(0 - wasavi.getRow()) <= 1);
	});

	it('goto', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('ifirst\n\tsecond\nthird\u001b');

		yield wasavi.send('1G');
		assert.pos('#1', 0, 0);

		yield wasavi.send('2G');
		assert.pos('#2', 1, 1);

		yield wasavi.send('3G');
		assert.pos('#3', 2, 0);

		yield wasavi.send('100G');
		assert.pos('#4', 2, 0);
	});

	it('search forward next', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('ifirst\n\tsecond\nthird\nthird\u001b');

		yield wasavi.send('n');
		assert.t('#1', wasavi.getLastMessage().length);

		yield wasavi.send('gg', '/third\n');
		assert.pos('#2', 2, 0);

		yield wasavi.send('n');
		assert.pos('#3', 3, 0);

		yield wasavi.send(':set nows\n');
		yield wasavi.send('n');
		assert.pos('#4', 3, 0);
		assert.t('#5', wasavi.getLastMessage().length);

		yield wasavi.send(':set ws\n');
		yield wasavi.send('n');
		assert.pos('#6', 2, 0);
	});

	it('search foward prev', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('ifirst\n\tsecond\nthird\nthird\u001b');

		yield wasavi.send('N');
		assert.t('#1', wasavi.getLastMessage().length);

		yield wasavi.send('gg', '/third\n');
		assert.pos('#2', 2, 0);

		yield wasavi.send(':set nows\n');
		yield wasavi.send('N');
		assert.pos('#3', 2, 0);
		assert.t('#4', wasavi.getLastMessage().length);

		yield wasavi.send(':set ws\n');
		yield wasavi.send('N');
		assert.pos('#5', 3, 0);

		yield wasavi.send('N');
		assert.pos('#6', 2, 0);
	});

	it('search backward next', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('ifirst\nfirst\nsecond\nthird\u001b');
		assert.pos('#1', 3, 4);

		yield wasavi.send('n');
		assert.t('#2', wasavi.getLastMessage().length);
		assert.pos('#3', 3, 4);

		yield wasavi.send('?first\n');
		assert.pos('#4', 1, 0);

		yield wasavi.send('n');
		assert.pos('#3', 0, 0);

		yield wasavi.send(':set nows\n');
		yield wasavi.send('n');
		assert.pos('#4', 0, 0);
		assert.t('#5', wasavi.getLastMessage().length);

		yield wasavi.send(':set ws\n');
		yield wasavi.send('n');
		assert.pos('#6', 1, 0);
	});

	it('search backward prev', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('ifirst\nfirst\nsecond\nthird\u001b');

		yield wasavi.send('N');
		assert.t('#1', wasavi.getLastMessage().length);

		yield wasavi.send('?first\n');
		assert.pos('#2', 1, 0);

		yield wasavi.send(':set nows\n');
		yield wasavi.send('N');
		assert.pos('#3', 1, 0);
		assert.t('#4', wasavi.getLastMessage().length);

		yield wasavi.send(':set ws\n');
		yield wasavi.send('N');
		assert.pos('#5', 0, 0);

		yield wasavi.send('N');
		assert.pos('#6', 1, 0);
	});

	it('star', function* () {
		yield wasavi.send(':set wrapscan noai\n');

		yield wasavi.send(
			'i' +
			'foo\n' +
			'\tbar\n' +
			'fffooo\n' +
			'bbbarr\n' +
			'\tfoo\n' +
			'bar' +
			'\u001b');

		// cursor is on the word
		yield wasavi.send('1G1|*');
		assert.pos('#1-1', 4, 1);
		assert.eq('#1-2', '\\<foo\\>', wasavi.getRegister('/'));

		// direction test
		yield wasavi.send('n');
		assert.pos('#1-3', 0, 0);

		// cursor is on the space which precedes a word
		yield wasavi.send('2G1|*');
		assert.pos('#2-1', 5, 0);
		assert.eq('#2-2', '\\<bar\\>', wasavi.getRegister('/'));

		// direction test
		yield wasavi.send('n');
		assert.pos('#2-3', 1, 1);
	});

	it('star error', function* () {
		yield wasavi.send('*');
		assert.eq('#1-1', 'No word under the cursor.', wasavi.getLastMessage());

		yield wasavi.send('i\t\t\t\u001b');
		yield wasavi.send('0#');
		assert.eq('#2-1', 'No word under the cursor.', wasavi.getLastMessage());
	});

	it('hash', function* () {
		yield wasavi.send(':set wrapscan noai\n');

		yield wasavi.send(
			'i' +
			'foo\n' +
			'\tbar\n' +
			'fffooo\n' +
			'bbbarr\n' +
			'\tfoo\n' +
			'bar' +
			'\u001b');

		// cursor is on the word
		yield wasavi.send('6G1|#');
		assert.pos('#1-1', 1, 1);
		assert.eq('#1-2', '\\<bar\\>', wasavi.getRegister('/'));

		// direction test
		yield wasavi.send('n');
		assert.pos('#1-3', 5, 0);

		// cursor is on the space which precedes a word
		yield wasavi.send('5G1|#');
		assert.pos('#2-1', 0, 0);
		assert.eq('#2-2', '\\<foo\\>', wasavi.getRegister('/'));

		// direction test
		yield wasavi.send('n');
		assert.pos('#2-3', 4, 1);
	});

	it('hash error', function* () {
		yield wasavi.send('#');
		assert.eq('#1-1', 'No word under the cursor.', wasavi.getLastMessage());

		yield wasavi.send('i\t\t\t\u001b');
		yield wasavi.send('0#');
		assert.eq('#2-1', 'No word under the cursor.', wasavi.getLastMessage());
	});
};
