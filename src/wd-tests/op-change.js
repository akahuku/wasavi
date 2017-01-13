'use strict';

const {By, Key, until, promise} = require('selenium-webdriver');
const {it, describe} = require('selenium-webdriver/testing');

exports.suite = (assert, wasavi, driver) => {
	const {ctrln, ctrlt, ctrlw} = assert.shortcuts;

	it('change', function* () {
		yield wasavi.send('i1\n2\n3\u001b');

		yield wasavi.send('gg', 'ccXYZ\u001b');
		assert.eq('#1-1', '1\n', wasavi.getRegister('"'));
		assert.eq('#1-2', 'XYZ\n2\n3', wasavi.getValue());
		assert.pos('#1-3', 0, 2);

		yield wasavi.send(':set report=2\n');
		yield wasavi.send('gg', 'c2cX\nY\nZ\u001b');
		assert.eq('#2-1', 'XYZ\n2\n', wasavi.getRegister('"'));
		assert.eq('#2-2', 'X\nY\nZ\n3', wasavi.getValue());
		assert.pos('#2-3', 2, 0);
		assert.eq('#2-4', 'Changing 2 lines.', wasavi.getLastMessage());

		yield wasavi.send('gg', '2ccFOO\u001b');
		assert.eq('#3-1', 'X\nY\n', wasavi.getRegister('"'));
		assert.eq('#3-2', 'FOO\nZ\n3', wasavi.getValue());
		assert.pos('#3-3', 0, 2);

		yield wasavi.send('gg', '5ccXYZ\u001b');
		assert.eq('#4-1', 'FOO\nZ\n3\n', wasavi.getRegister('"'));
		assert.eq('#4-2', 'XYZ', wasavi.getValue());
		assert.pos('#4-3', 0, 2);
	});

	function* _testChangeUpLine (a) {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('iline1\n\tline2\n\t\tline3\u001b');
		assert.eq('line1\n\tline2\n\t\tline3', wasavi.getValue());

		yield wasavi.send('3G');
		assert.pos('#1-1', 2, 2);

		yield wasavi.send('c' + a + 'XYZ\u001b');
		assert.pos('#2-1', 1, 2);
		assert.eq('#2-2', '\tline2\n\t\tline3\n', wasavi.getRegister('"'));
		assert.eq('#2-3', '\tline2\n\t\tline3\n', wasavi.getRegister('1'));
		assert.eq('#2-4', 'line1\nXYZ', wasavi.getValue());

		yield wasavi.send('c3' + a + 'FOO\u001b');
		assert.pos('#3-1', 0, 2);
		assert.eq('#3-2', 'FOO', wasavi.getValue());
		assert.eq('#3-3', 'line1\nXYZ\n', wasavi.getRegister('"'));
		assert.eq('#3-4', 'line1\nXYZ\n', wasavi.getRegister('1'));
		assert.eq('#3-5', '\tline2\n\t\tline3\n', wasavi.getRegister('2'));

		yield wasavi.send('c3' + a);
		assert.eq('#4-1', 'FOO', wasavi.getValue());
		assert.eq('#4-2', 'command', wasavi.getInputMode());
		assert.t('#4-3', wasavi.getLastMessage().length);
	}

	it('up line', function* () {
		promise.consume(_testChangeUpLine, null, '-');
	});

	function* _testChangeDownLine (a) {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('iline1\n\tline2\n\t\tline3\u001b');
		assert.eq('line1\n\tline2\n\t\tline3', wasavi.getValue());

		yield wasavi.send('1G');
		assert.pos('#1-1', 0, 0);

		yield wasavi.send('c' + a + 'XYZ\u001b');
		assert.pos('#2-1', 0, 2);
		assert.eq('#2-2', 'line1\n\tline2\n', wasavi.getRegister('"'));
		assert.eq('#2-3', 'line1\n\tline2\n', wasavi.getRegister('1'));
		assert.eq('#2-4', 'XYZ\n\t\tline3', wasavi.getValue());

		yield wasavi.send('c3' + a + 'FOO\u001b');
		assert.pos('#3-1', 0, 2);
		assert.eq('#3-2', 'FOO', wasavi.getValue());
		assert.eq('#3-3', 'XYZ\n\t\tline3\n', wasavi.getRegister('"'));
		assert.eq('#3-4', 'XYZ\n\t\tline3\n', wasavi.getRegister('1'));
		assert.eq('#3-5', 'line1\n\tline2\n', wasavi.getRegister('2'));

		yield wasavi.send('c3' + a);
		assert.eq('#4-1', 'FOO', wasavi.getValue());
		assert.eq('#4-2', 'command', wasavi.getInputMode());
		assert.t('#4-3', wasavi.getLastMessage().length);
	}

	it('down line', function* () {
		promise.consume(_testChangeDownLine, null, '+');
	});

	it('down enter', function* () {
		promise.consume(_testChangeDownLine, null, Key.ENTER);
	});

	function* _testChangeFirstNonWhiteCharOfLine (a) {
		yield wasavi.send('i\tfoobar\u001b');
		yield wasavi.send('c' + a + 'XYZ\u001b');

		assert.eq('#1-1', '\tXYZr', wasavi.getValue());
		assert.eq('#1-2', 'fooba', wasavi.getRegister('"'));
		assert.pos('#1-3', 0, 3);

		yield wasavi.send('^c' + a + 'FOO\u001b');
		assert.eq('#2-1', 'fooba', wasavi.getRegister('"'));
		assert.pos('#2-2', 0, 3);
	}

	it('first non white char of line', function* () {
		promise.consume(_testChangeFirstNonWhiteCharOfLine, null, '^');
	});

	it('home', function* () {
		promise.consume(_testChangeFirstNonWhiteCharOfLine, null, Key.HOME);
	});

	it('top of line', function* () {
		yield wasavi.send('i\tfoobar\u001b');
		yield wasavi.send('c0XYZ\u001b');

		assert.eq('#1-1', '\tfooba', wasavi.getRegister('"'));
		assert.eq('#1-2', 'XYZr', wasavi.getValue());
		assert.pos('#1-3', 0, 2);
	});

	function* _testChangeTailOfLine (a) {
		yield wasavi.send('i\tfoobar\u001b1|');
		yield wasavi.send('c' + a + 'XYZ\u001b');

		assert.eq('#1-1', '\tfoobar', wasavi.getRegister('"'));
		assert.eq('#1-2', 'XYZ', wasavi.getValue());
		assert.pos('#1-3', 0, 2);
	}

	it('tail of line', function* () {
		promise.consume(_testChangeTailOfLine, null, '$');
	});

	it('end', function* () {
		promise.consume(_testChangeTailOfLine, null, Key.END);
	});

	it('direct column', function* () {
		yield wasavi.send('i0123456789\n0123456789\u001b1G', '1|');

		yield wasavi.send('c5|XYZ\u001b');
		assert.eq('#1-1', '0123', wasavi.getRegister('"'));
		assert.eq('#1-2', 'XYZ456789\n0123456789', wasavi.getValue());
		assert.pos('#1-3', 0, 2);

		yield wasavi.send('$c4|FOO\u001b');
		assert.eq('#2-1', '45678', wasavi.getRegister('"'));
		assert.eq('#2-2', 'XYZFOO9\n0123456789', wasavi.getValue());
		assert.pos('#2-3', 0, 5);

		yield wasavi.send('2G', '1|c100|BAR\u001b');
		assert.eq('#3-1', '0123456789', wasavi.getRegister('"'));
		assert.eq('#3-2', 'XYZFOO9\nBAR', wasavi.getValue());
		assert.pos('#3-3', 1, 2);
	});

	it('jump to matched parenthes', function* () {
		yield wasavi.send('ithis is (first) line.\nthis is (second) line)\u001b');

		yield wasavi.send('1G', '1|f(c%XYZ\u001b');
		assert.eq('#1-1', '(first)', wasavi.getRegister('"'));
		assert.eq('#1-2', 'this is XYZ line.\nthis is (second) line)', wasavi.getValue());
		assert.pos('#1-3', 0, 10);

		yield wasavi.send('2G', '1|f)c%FOO\u001b');
		assert.eq('#2-1', '(second)', wasavi.getRegister('"'));
		assert.eq('#2-2', 'this is XYZ line.\nthis is FOO line)', wasavi.getValue());
		assert.pos('#2-3', 1, 10);

		yield wasavi.send('G', '$c%');
		assert.eq('#3-1', '(second)', wasavi.getRegister('"'));
		assert.pos('#3-2', 1, 16);
		assert.t('#3-3', wasavi.getLastMessage().length);
		assert.eq('#3-4', 'command', wasavi.getInputMode());
	});

	it('search forward', function* () {
		yield wasavi.send('ifind the\nchar4cter in cu4rent 4line\u001b1G', '1|');

		yield wasavi.send('c/4\nXYZ\u001b');
		/*
		 * XYZ4cter in cu4rent 4line
		 *   ^
		 */
		assert.eq('#1-1', 'find the\nchar', wasavi.getRegister('"'));
		assert.eq('#1-2', 'XYZ4cter in cu4rent 4line', wasavi.getValue());
		assert.pos('#1-3', 0, 2);

		yield wasavi.send('2c/4\nFOO\u001b');
		/*
		 * XYFOO4rent 4line
		 *     ^
		 */
		assert.eq('#2-1', 'Z4cter in cu', wasavi.getRegister('"'));
		assert.eq('#2-2', 'XYFOO4rent 4line', wasavi.getValue());
		assert.pos('#2-3', 0, 4);

		yield wasavi.send('3c/X\n');
		/*
		 * XYFOO4rent 4line
		 *     ^
		 */
		assert.eq('#3-1', 'Z4cter in cu', wasavi.getRegister('"'));
		assert.eq('#3-2', 'XYFOO4rent 4line', wasavi.getValue());
		assert.pos('#3-3', 0, 4);
		assert.t('#3-4', wasavi.getLastMessage().length);
	});

	it('search backward', function* () {
		yield wasavi.send('ifind the char4cter in cu4rent\n4line\u001b');

		yield wasavi.send('G', '$c?4\nXYZ\u001b');
		/*
		 * find the char4cter in cu4rent
		 * XYZe
		 *   ^
		 */
		assert.eq('#1-1', '4lin', wasavi.getRegister('"'));
		assert.eq('#1-2', 'find the char4cter in cu4rent\nXYZe', wasavi.getValue());
		assert.pos('#1-3', 1, 2);

		yield wasavi.send('2c?4\nFOO\u001b');
		/*
		 * find the charFOOZe
		 *                ^
		 */
		assert.eq('#2-1', '4cter in cu4rent\nXY', wasavi.getRegister('"'));
		assert.eq('#2-2', 'find the charFOOZe', wasavi.getValue());
		assert.pos('#2-3', 0, 15);

		yield wasavi.send('2c?X\n');
		/*
		 * find the charFOOZe
		 *                ^
		 */
		assert.eq('#3-1', '4cter in cu4rent\nXY', wasavi.getRegister('"'));
		assert.eq('#3-2', 'find the charFOOZe', wasavi.getValue());
		assert.pos('#3-3', 0, 15);
		assert.t('#3-4', wasavi.getLastMessage().length);
	});

	it('find forward', function* () {
		yield wasavi.send('ifind the char4cter in cu4rent 4line\u001b1G', '1|');

		yield wasavi.send('cf4XYZ\u001b');
		assert.eq('#1-1', 'find the char4', wasavi.getRegister('"'));
		assert.eq('#1-2', 'XYZcter in cu4rent 4line', wasavi.getValue());
		assert.pos('#1-3', 0, 2);

		yield wasavi.send('2cf4FOO\u001b');
		assert.eq('#2-1', 'Zcter in cu4rent 4', wasavi.getRegister('"'));
		assert.eq('#2-2', 'XYFOOline', wasavi.getValue());
		assert.pos('#2-3', 0, 4);

		yield wasavi.send('4cf4');
		assert.eq('#3-1', 'Zcter in cu4rent 4', wasavi.getRegister('"'));
		assert.eq('#3-2', 'XYFOOline', wasavi.getValue());
		assert.pos('#3-3', 0, 4);
		assert.t('#3-4', wasavi.getLastMessage().length);
		assert.eq('#3-5', 'command', wasavi.getInputMode());
	});

	it('find backward', function* () {
		yield wasavi.send('ifind the char4cter in cu4rent 4line\u001b');

		yield wasavi.send('cF4XYZ\u001b');
		assert.eq('#1-1', '4lin', wasavi.getRegister('"'));
		assert.eq('#1-2', 'find the char4cter in cu4rent XYZe', wasavi.getValue());
		assert.pos('#1-3', 0, 32);

		yield wasavi.send('2cF4FOO\u001b');
		assert.eq('#2-1', '4cter in cu4rent XY', wasavi.getRegister('"'));
		assert.eq('#2-2', 'find the charFOOZe', wasavi.getValue());
		assert.pos('#2-3', 0, 15);

		yield wasavi.send('cF4');
		assert.eq('#3-1', '4cter in cu4rent XY', wasavi.getRegister('"'));
		assert.eq('#3-2', 'find the charFOOZe', wasavi.getValue());
		assert.pos('#3-3', 0, 15);
		assert.t('#3-4', wasavi.getLastMessage().length);
		assert.eq('#3-5', 'command', wasavi.getInputMode());
	});

	it('find foward before stop', function* () {
		yield wasavi.send('ifind the char4cter in cu4rent 4line\u001b1G', '1|');

		yield wasavi.send('ct4XYZ\u001b');
		assert.eq('#1-1', 'find the char', wasavi.getRegister('"'));
		assert.eq('#1-2', 'XYZ4cter in cu4rent 4line', wasavi.getValue());
		assert.pos('#1-3', 0, 2);

		yield wasavi.send('2ct4FOO\u001b');
		assert.eq('#2-1', 'Z4cter in cu', wasavi.getRegister('"'));
		assert.eq('#2-2', 'XYFOO4rent 4line', wasavi.getValue());
		assert.pos('#2-3', 0, 4);

		yield wasavi.send('4ct4');
		assert.eq('#3-1', 'Z4cter in cu', wasavi.getRegister('"'));
		assert.eq('#3-2', 'XYFOO4rent 4line', wasavi.getValue());
		assert.pos('#3-3', 0, 4);
		assert.t('#3-4', wasavi.getLastMessage().length);
		assert.eq('#3-5', 'command', wasavi.getInputMode());
	});

	it('find backward before stop', function* () {
		yield wasavi.send('ifind the char4cter in cu4rent 4line\u001b');
		
		yield wasavi.send('cT4XYZ\u001b');
		assert.eq('#1-1', 'lin', wasavi.getRegister('"'));
		assert.eq('#1-2', 'find the char4cter in cu4rent 4XYZe', wasavi.getValue());
		assert.pos('#1-3', 0, 33);

		yield wasavi.send('cT4FOO\u001b');
		assert.eq('#2-1', 'XY', wasavi.getRegister('"'));
		assert.eq('#2-2', 'find the char4cter in cu4rent 4FOOZe', wasavi.getValue());
		assert.pos('#2-3', 0, 33);

		yield wasavi.send('c2T4BAR\u001b');
		assert.eq('#3-1', 'rent 4FO', wasavi.getRegister('"'));
		assert.eq('#3-2', 'find the char4cter in cu4BAROZe', wasavi.getValue());
		assert.pos('#3-3', 0, 27);

		yield wasavi.send('c3T4');
		assert.eq('#4-1', 'rent 4FO', wasavi.getRegister('"'));
		assert.eq('#4-2', 'find the char4cter in cu4BAROZe', wasavi.getValue());
		assert.pos('#4-3', 0, 27);
		assert.t('#4-4', wasavi.getLastMessage().length);
		assert.eq('#4-5', 'command', wasavi.getInputMode());
	});

	it('find invert', function* () {
		yield wasavi.send('4ifi4st s4cond th4rd fou4th\n\u001b');

		yield wasavi.send('1G', '1|cf4A\u001b$c,A\u001b');
		assert.eq('#1-1', '4t', wasavi.getRegister('"'));
		assert.eq('#1-2', 'Ast s4cond th4rd fouAh', wasavi.getValue().split('\n')[0]);
		assert.pos('#1-3', 0, 20);

		yield wasavi.send('2G', '1|ct4B\u001b$c,B\u001b');
		assert.eq('#2-1', 't', wasavi.getRegister('"'));
		assert.eq('#2-2', 'B4st s4cond th4rd fou4Bh', wasavi.getValue().split('\n')[1]);
		assert.pos('#2-3', 1, 22);

		yield wasavi.send('3G', '$cF4C\u001b0c,C\u001b');
		assert.eq('#3-1', 'fi4', wasavi.getRegister('"'));
		assert.eq('#3-2', 'Cst s4cond th4rd fouCh', wasavi.getValue().split('\n')[2]);
		assert.pos('#3-3', 2, 0);

		yield wasavi.send('4G', '$cT4D\u001b0c,D\u001b');
		assert.eq('#4-1', 'fi', wasavi.getRegister('"'));
		assert.eq('#4-2', 'D4st s4cond th4rd fou4Dh', wasavi.getValue().split('\n')[3]);
		assert.pos('#4-3', 3, 0);
	});

	it('find repeat', function* () {
		yield wasavi.send('4ifi4st s4cond th4rd fou4th\n\u001b');

		yield wasavi.send('1G', '1|f43|c;A\u001b');
		assert.eq('#1-1', '4st s4', wasavi.getRegister('"'));
		assert.eq('#1-2', 'fiAcond th4rd fou4th', wasavi.getValue().split('\n')[0]);
		assert.pos('#1-3', 0, 2);

		yield wasavi.send('2G', '1|t43|c;B\u001b');
		assert.eq('#2-1', '4st s', wasavi.getRegister('"'));
		assert.eq('#2-2', 'fiB4cond th4rd fou4th', wasavi.getValue().split('\n')[1]);
		assert.pos('#2-3', 1, 2);

		yield wasavi.send('3G', '$F4c;C\u001b');
		assert.eq('#3-1', '4rd fou', wasavi.getRegister('"'));
		assert.eq('#3-2', 'fi4st s4cond thC4th', wasavi.getValue().split('\n')[2]);
		assert.pos('#3-3', 2, 15);

		yield wasavi.send('4G', '$T4c;D\u001b');
		assert.eq('#4-1', 'rd fou4', wasavi.getRegister('"'));
		assert.eq('#4-2', 'fi4st s4cond th4Dth', wasavi.getValue().split('\n')[3]);
		assert.pos('#4-3', 3, 16);
	});

	it('down line orient', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('i\t1foobar\n\t2foobar\u001bgg');

		yield wasavi.send('c_\tX\u001b');
		/*
		 * ^I1foobar  -->  ^IX
		 * ^I2foobar       ^I2foobar
		 */
		assert.eq('#1-1', '\t1foobar\n', wasavi.getRegister('"'));
		assert.eq('#1-2', '\tX', wasavi.getValue().split('\n')[0]);
		assert.pos('#1-3', 0, 1);

		yield wasavi.send(':set ai\n');
		yield wasavi.send('2G');
		yield wasavi.send('c_Y\u001b');
		/*
		 * ^IX        -->  ^IX
		 * ^I2foobar       ^IY
		 */
		assert.eq('#2-1', '\t2foobar\n', wasavi.getRegister('"'));
		assert.eq('#2-2', '\tY', wasavi.getValue().split('\n')[1]);
		assert.pos('#2-3', 1, 1);

		yield wasavi.send('gg', 'c2_Z\u001b');
		/*
		 * ^IX  -->  ^IZ
		 * ^IY
		 */
		assert.eq('#3-1', '\tX\n\tY\n', wasavi.getRegister('"'));
		assert.eq('#3-2', '\tZ', wasavi.getValue());
		assert.pos('#3-3', 0, 1);

		yield wasavi.send('c3_X\u001b');
		/*
		 * ^IZ  -->  ^IX
		 */
		assert.eq('#4-1', '\tZ\n', wasavi.getRegister('"'));
		assert.eq('#4-2', '\tX', wasavi.getValue());
		assert.pos('#4-2', 0, 1);
	});

	it('mark', function* () {
		yield wasavi.send('ifoo1bar\nbaz3bax\u001b');

		yield wasavi.send('1G', '0f1ma0c`aXYZ\u001b');
		assert.eq('#1-1', 'foo', wasavi.getRegister('"'));
		assert.eq('#1-2', 'XYZ1bar\nbaz3bax', wasavi.getValue());
		assert.pos('#1-3', 0, 2);

		yield wasavi.send('2G', '$F3ma$c`aFOO\u001b');
		assert.eq('#2-1', '3ba', wasavi.getRegister('"'));
		assert.eq('#2-2', 'XYZ1bar\nbazFOOx', wasavi.getValue());
		assert.pos('#2-3', 1, 5);

		yield wasavi.send('FFma1G', '4|c`aBAR\u001b');
		assert.eq('#3-1', '1bar\nbaz', wasavi.getRegister('"'));
		assert.eq('#3-2', 'XYZBARFOOx', wasavi.getValue());
		assert.pos('#3-3', 0, 5);

		yield wasavi.send('c`b');
		assert.eq('#4-1', '1bar\nbaz', wasavi.getRegister('"'));
		assert.eq('#4-2', 'XYZBARFOOx', wasavi.getValue());
		assert.pos('#4-3', 0, 5);
		assert.eq('#4-4', 'command', wasavi.getInputMode());
	});

	it('mark line orient', function* () {
		yield wasavi.send('i1\n2\n3\n4\n5\n6\n7\u001b');

		yield wasavi.send('3G', 'ma1G', 'c\'aXYZ\u001b');
		assert.eq('#1-1', '1\n2\n3\n', wasavi.getRegister('"'));
		assert.eq('#1-2', 'XYZ\n4\n5\n6\n7', wasavi.getValue());
		assert.pos('#1-3', 0, 2);

		yield wasavi.send('3G', 'maG', 'c\'aFOO\u001b');
		assert.eq('#2-1', '5\n6\n7\n', wasavi.getRegister('"'));
		assert.eq('#2-2', 'XYZ\n4\nFOO', wasavi.getValue());
		assert.pos('#2-3', 2, 2);
	});

	/*
	it('section forward', function* () {
		// TBD
	});

	it('section backward', function* () {
		// TBD
	});

	it('paragraph forward', function* () {
		// TBD
	});

	it('paragraph backward', function* () {
		// TBD
	});

	it('sentence forward', function* () {
		// TBD
	});

	it('sentence backward', function* () {
		// TBD
	});
	*/

	function* _testChangeDown (a) {
		yield wasavi.send('ifirst\nsecond\nthird\nf\nfifth\u001b');
		yield wasavi.send('2G', '3|c10' + a + 'XYZ\nFOO\u001b');
		assert.eq('#1-1', 'second\nthird\nf\nfifth\n', wasavi.getRegister('"'));
		assert.eq('#1-2', 'second\nthird\nf\nfifth\n', wasavi.getRegister('1'));
		assert.eq('#1-3', 'first\nXYZ\nFOO', wasavi.getValue());
		assert.pos('#1-4', 2, 2);
		assert.t('#1-5', wasavi.getLastMessage() == '');

		yield wasavi.send('2G', '3|c' + a + 'BAR\nBAZ\u001b');
		assert.eq('#2-1', 'XYZ\nFOO\n', wasavi.getRegister('"'));
		assert.eq('#2-2', 'XYZ\nFOO\n', wasavi.getRegister('1'));
		assert.eq('#2-3', 'second\nthird\nf\nfifth\n', wasavi.getRegister('2'));
		assert.eq('#2-4', 'first\nBAR\nBAZ', wasavi.getValue());
		assert.pos('#2-5', 2, 2);
	}

	it('down', function* () {
		promise.consume(_testChangeDown, null, 'j');
	});

	it('down ctrl n', function* () {
		promise.consume(_testChangeDown, null, ctrln);
	});

	it('down down', function* () {
		promise.consume(_testChangeDown, null, Key.ARROW_DOWN);
	});

	function* _testChangeUp (a) {
		yield wasavi.send('ifirst\nsecond\nt\u001b');

		yield wasavi.send('2G', '3|c10' + a + 'XYZ\u001b');
		assert.eq('#1-1', 'first\nsecond\n', wasavi.getRegister('"'));
		assert.eq('#1-2', 'first\nsecond\n', wasavi.getRegister('1'));
		assert.eq('#1-3', 'XYZ\nt', wasavi.getValue());
		assert.pos('#1-2', 0, 2);
		assert.t('#1-3', wasavi.getLastMessage() == '');

		yield wasavi.send('2G', '1|c' + a + 'FOO\u001b');
		assert.eq('#2-1', 'XYZ\nt\n', wasavi.getRegister('"'));
		assert.eq('#2-2', 'XYZ\nt\n', wasavi.getRegister('1'));
		assert.eq('#2-3', 'first\nsecond\n', wasavi.getRegister('2'));
		assert.eq('#2-4', 'FOO', wasavi.getValue());
		assert.pos('#2-4', 0, 2);
	}

	it('up', function* () {
		promise.consume(_testChangeUp, null, 'k');
	});

	it('up ctrl p', function* () {
		promise.consume(_testChangeUp, null, '\u0010');
	});

	it('up up', function* () {
		promise.consume(_testChangeUp, null, Key.ARROW_UP);
	});

	function* _testChangeLeft (a) {
		yield wasavi.send('ifoo bar baz\u001b');
		assert.pos('#1-1', 0, 10);

		yield wasavi.send('c' + a + 'X\u001b');
		assert.eq('#2-1', 'a', wasavi.getRegister('"'));
		assert.eq('#2-2', 'foo bar bXz', wasavi.getValue());
		assert.pos('#2-3', 0, 9);

		yield wasavi.send('c2' + a + 'Y\u001b');
		assert.eq('#3-1', ' b', wasavi.getRegister('"'));
		assert.eq('#3-2', 'foo barYXz', wasavi.getValue());
		assert.pos('#3-3', 0, 7);

		yield wasavi.send('c100' + a + 'Z\u001b');
		assert.eq('#4-1', 'foo bar', wasavi.getRegister('"'));
		assert.eq('#4-2', 'ZYXz', wasavi.getValue());
		assert.pos('#4-3', 0, 0);
	}

	it('left', function* () {
		promise.consume(_testChangeLeft, null, 'h');
	});

	it('left ctrl h', function* () {
		promise.consume(_testChangeLeft, null, '\u0008');
	});

	it('left left', function* () {
		promise.consume(_testChangeLeft, null, Key.LEFT);
	});

	function* _testChangeRight (a) {
		yield wasavi.send('ifoo bar baz\u001b1|');
		assert.pos('#1-1', 0, 0);

		yield wasavi.send('c' + a + 'X\u001b');
		assert.eq('#2-1', 'Xoo bar baz', wasavi.getValue());
		assert.pos('#2-2', 0, 0);
		assert.eq('#2-3', 'f', wasavi.getRegister('"'));

		yield wasavi.send('"ac2' + a + 'Y\u001b');
		assert.eq('#3-1', 'Yo bar baz', wasavi.getValue());
		assert.pos('#3-2', 0, 0);
		assert.eq('#3-3', 'Xo', wasavi.getRegister('a'));
		assert.eq('#3-4', 'Xo', wasavi.getRegister('"'));

		yield wasavi.send('c5' + a + 'Z\u001b');
		assert.eq('#4-1', 'Zr baz', wasavi.getValue());
		assert.pos('#4-2', 0, 0);
		assert.eq('#4-3', 'Yo ba', wasavi.getRegister('"'));

		yield wasavi.send('c100' + a + 'F\u001b');
		assert.eq('#5-1', 'F', wasavi.getValue());
		assert.pos('#5-2', 0, 0);
		assert.eq('#5-3', 'Zr baz', wasavi.getRegister('"'));
	}

	it('right', function* () {
		promise.consume(_testChangeRight, null, 'l');
	});

	it('right space', function* () {
		promise.consume(_testChangeRight, null, ' ');
	});

	it('right right', function* () {
		promise.consume(_testChangeRight, null, Key.ARROW_RIGHT);
	});

	it('word forward', function* () {
		yield wasavi.send('ifoo bar baz\nbax\u001b1|gg');

		yield wasavi.send('cwFOO\u001b');
		assert.eq('#1-1', 'FOO bar baz\nbax', wasavi.getValue());
		assert.pos('#1-2', 0, 2);
		assert.eq('#1-3', 'foo', wasavi.getRegister('"'));

		yield wasavi.send('gg', 'c2wBAR BAZ\u001b');
		assert.eq('#2-1', 'BAR BAZ baz\nbax', wasavi.getValue());
		assert.pos('#2-2', 0, 6);
		assert.eq('#2-3', 'FOO bar', wasavi.getRegister('"'));

		yield wasavi.send('gg', 'c3wX Y Z\u001b');
		assert.eq('#3-1', 'X Y Z\nbax', wasavi.getValue());
		assert.pos('#3-2', 0, 4);
		assert.eq('#3-3', 'BAR BAZ baz', wasavi.getRegister('"'));

		yield wasavi.send('gg', 'c4wBAX\u001b');
		assert.eq('#4-1', 'BAX', wasavi.getValue());
		assert.t('#4-2', wasavi.getLastMessage() == '');
		assert.pos('#4-3', 0, 2);
		assert.eq('#4-4', 'X Y Z\nbax', wasavi.getRegister('"'));

		yield wasavi.send('cc    foo bar baz\u001b0cwbax\u001b');
		assert.value('#5-1', 'baxfoo bar baz');
		assert.eq('#5-2', '', wasavi.getLastMessage());
		assert.pos('#5-3', 0, 2);
		assert.eq('#5-4', '    ', wasavi.getRegister('"'));
	});

	it('word backward', function* () {
		yield wasavi.send('ifoo\nbar baz bax\u001b');

		/*
		 * foo               foo
		 * bar baz bax  -->  bar baz XYZx
		 */
		yield wasavi.send('cbXYZ\u001b');
		assert.eq('#1-1', 'foo\nbar baz XYZx', wasavi.getValue());
		assert.pos('#1-2', 1, 10);
		assert.eq('#1-3', 'ba', wasavi.getRegister('"'));

		/*
		 * foo                foo
		 * bar baz XYZx  -->  FOO BARXYZx
		 */
		yield wasavi.send('bc2bFOO BAR\u001b');
		assert.eq('#2-1', 'foo\nFOO BARXYZx', wasavi.getValue());
		assert.pos('#2-2', 1, 6);
		assert.eq('#2-3', 'bar baz ', wasavi.getRegister('"'));

		/*
		 * foo               BAZ
		 * FOO BARXYZx  -->  FOOBARXYZx
		 */
		yield wasavi.send('0cbBAZ\u001b');
		assert.eq('#3-1', 'BAZ\nFOO BARXYZx', wasavi.getValue());
		assert.pos('#3-2', 0, 2);
		assert.eq('#3-3', 'foo', wasavi.getRegister('"'));
	});

	it('bigword forward', function* () {
		yield wasavi.send('if#o b#r b#z\nb#x\u001b1|gg');

		yield wasavi.send('cWFOO\u001b');
		assert.eq('#1-1', 'FOO b#r b#z\nb#x', wasavi.getValue());
		assert.pos('#1-2', 0, 2);
		assert.eq('#1-3', 'f#o', wasavi.getRegister('"'));

		yield wasavi.send('gg', 'c2WBAR BAZ\u001b');
		assert.eq('#2-1', 'BAR BAZ b#z\nb#x', wasavi.getValue());
		assert.pos('#2-2', 0, 6);
		assert.eq('#2-3', 'FOO b#r', wasavi.getRegister('"'));

		yield wasavi.send('gg', 'c3WX Y Z\u001b');
		assert.eq('#3-1', 'X Y Z\nb#x', wasavi.getValue());
		assert.pos('#3-2', 0, 4);
		assert.eq('#3-3', 'BAR BAZ b#z', wasavi.getRegister('"'));

		yield wasavi.send('gg', 'c4WBAX\u001b');
		assert.eq('#4-1', 'BAX', wasavi.getValue());
		assert.t('#4-2', wasavi.getLastMessage() == '');
		assert.pos('#4-3', 0, 2);
		assert.eq('#4-4', 'X Y Z\nb#x', wasavi.getRegister('"'));
	});

	it('bigword backward', function* () {
		yield wasavi.send('if#o\nb#r b#z b#x\u001b');

		yield wasavi.send('cBXYZ\u001b');
		assert.eq('#1-1', 'f#o\nb#r b#z XYZx', wasavi.getValue());
		assert.pos('#1-2', 1, 10);
		assert.eq('#1-3', 'b#', wasavi.getRegister('"'));

		yield wasavi.send('bc2BFOO BAR\u001b');
		assert.eq('#2-1', 'f#o\nFOO BARXYZx', wasavi.getValue());
		assert.pos('#2-2', 1, 6);
		assert.eq('#2-3', 'b#r b#z ', wasavi.getRegister('"'));

		yield wasavi.send('0cBBAZ\u001b');
		assert.eq('#3-1', 'BAZ\nFOO BARXYZx', wasavi.getValue());
		assert.pos('#3-2', 0, 2);
		assert.eq('#3-3', 'f#o', wasavi.getRegister('"'));
	});

	it('word end', function* () {
		yield wasavi.send('ifoo bar\nbaz\nbax\u001bgg');

		yield wasavi.send('ceXYZ\u001b');
		assert.eq('#1-1', 'foo', wasavi.getRegister('"'));
		assert.eq('#1-2', 'XYZ bar\nbaz\nbax', wasavi.getValue());
		assert.pos('#1-3', 0, 2);

		yield wasavi.send('gg', 'c2eFOO BAR\u001b');
		assert.eq('#2-1', 'XYZ bar', wasavi.getRegister('"'));
		assert.eq('#2-2', 'FOO BAR\nbaz\nbax', wasavi.getValue());
		assert.pos('#2-3', 0, 6);

		yield wasavi.send('gg', '3e');
		assert.pos('#3-x-1', 1, 2);
		yield wasavi.send('gg', 'c3eBAR BAZ BAX\u001b');
		assert.eq('#3-1', 'FOO BAR\nbaz', wasavi.getRegister('"'));
		assert.eq('#3-2', 'BAR BAZ BAX\nbax', wasavi.getValue());
		assert.pos('#3-3', 0, 10);
	});

	it('bigword end', function* () {
		yield wasavi.send('if@o b@r\nb@z\nb@x\u001bgg');

		yield wasavi.send('cEXYZ\u001b');
		assert.eq('#1-1', 'f@o', wasavi.getRegister('"'));
		assert.eq('#1-2', 'XYZ b@r\nb@z\nb@x', wasavi.getValue());
		assert.pos('#1-3', 0, 2);

		yield wasavi.send('gg', 'c2EFOO BAR\u001b');
		assert.eq('#2-1', 'XYZ b@r', wasavi.getRegister('"'));
		assert.eq('#2-2', 'FOO BAR\nb@z\nb@x', wasavi.getValue());
		assert.pos('#2-3', 0, 6);

		yield wasavi.send('gg', '3E');
		assert.pos('#3-x-1', 1, 2);
		yield wasavi.send('gg', 'c3EBAR BAZ BAX\u001b');
		assert.eq('#3-1', 'FOO BAR\nb@z', wasavi.getRegister('"'));
		assert.eq('#3-2', 'BAR BAZ BAX\nb@x', wasavi.getValue());
		assert.pos('#3-3', 0, 10);
	});

	it('goto prefix', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('i 1\n2\n 3\u001b');

		yield wasavi.send('cggXYZ\u001b');
		assert.eq('#1-1', ' 1\n2\n 3\n', wasavi.getRegister('"'));
		assert.eq('#1-2', ' 1\n2\n 3\n', wasavi.getRegister('1'));
		assert.eq('#1-3', 'XYZ', wasavi.getValue());
		assert.pos('#1-4', 0, 2);
	});

	it('goto prefix auto indent', function* () {
		yield wasavi.send(':set ai\n');
		yield wasavi.send('i\t1\n2\n3\u001b');

		yield wasavi.send('cggXYZ\u001b');
		assert.eq('#1-1', '\t1\n\t2\n\t3\n', wasavi.getRegister('"'));
		assert.eq('#1-2', '\t1\n\t2\n\t3\n', wasavi.getRegister('1'));
		assert.eq('#1-3', '\tXYZ', wasavi.getValue());
		assert.pos('#1-4', 0, 3);
	});

	it('top of view', function* () {
		yield wasavi.makeScrollableBuffer(2);

		var rowLength = wasavi.getRowLength();
		yield wasavi.send('G', 'H');
		var viewLines = wasavi.getRowLength() - wasavi.getRow();

		yield wasavi.send('G', 'cH\u001b');
		assert.eq(wasavi.getRegister('"').replace(/\n$/, '').split('\n').length, viewLines);
	});

	it('middle of view', function* () {
		yield wasavi.makeScrollableBuffer(2);

		var rowLength = wasavi.getRowLength();
		yield wasavi.send('gg', 'M');
		var viewLines = wasavi.getRow() + 1;
		yield wasavi.send('gg', 'cM\u001b');
		assert.eq('#1', wasavi.getRegister('"').split('\n').length - 1, viewLines);

		rowLength = wasavi.getRowLength();
		yield wasavi.send('G', 'M');
		viewLines = wasavi.getRowLength() - wasavi.getRow();

		yield wasavi.send('G', 'cM\u001b');
		assert.eq('#2', wasavi.getRegister('"').split('\n').length - 1, viewLines);
	});

	it('bottom of view', function* () {
		yield wasavi.makeScrollableBuffer(2);

		var rowLength = wasavi.getRowLength();
		yield wasavi.send('gg', 'L');
		var viewLines = wasavi.getRow() + 1;

		yield wasavi.send('gg', 'cL\u001b');
		assert.eq(wasavi.getRegister('"').replace(/\n$/, '').split('\n').length, viewLines);
	});

	it('goto', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('i\t1\n\t2\n\t3\n\t4\n\t5\n\t6\n\t7\u001b');

		yield wasavi.send('gg', 'c3GXYZ\u001b');
		assert.eq('#1-1', '\t1\n\t2\n\t3\n', wasavi.getRegister('"'));
		assert.eq('#1-2', '\t1\n\t2\n\t3\n', wasavi.getRegister('1'));
		assert.eq('#1-3', 'XYZ\n\t4\n\t5\n\t6\n\t7', wasavi.getValue());
		assert.pos('#1-4', 0, 2);

		yield wasavi.send(':set noai\nG', 'c3GFOO\u001b');
		assert.eq('#2-1', '\t5\n\t6\n\t7\n', wasavi.getRegister('"'));
		assert.eq('#2-2', '\t5\n\t6\n\t7\n', wasavi.getRegister('1'));
		assert.eq('#2-3', '\t1\n\t2\n\t3\n', wasavi.getRegister('2'));
		assert.eq('#2-4', 'XYZ\n\t4\nFOO', wasavi.getValue());
		assert.pos('#2-5', 2, 2);
	});

	it('search forward next_1', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('i' + [
			'    def',		// XYZ
			'foo',          // foo
			'baz'			// baz
		].join('\n') + '\u001b');

		yield wasavi.send('1G', '1|/foo\n');
		assert.pos('#1-1', 1, 0);

		yield wasavi.send('1G', '5|cnXYZ\u001b');
		assert.eq('#2-1', '    def\n', wasavi.getRegister('"'));
		assert.eq('#2-2', 'XYZ\nfoo\nbaz', wasavi.getValue());
		assert.pos('#2-3', 0, 2);
	});

	it('search forward next_2', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('i' + [
			'abc def',		// abc XYZ
			'foo',			// foo
			'baz'			// baz
		].join('\n') + '\u001b');

		yield wasavi.send('1G', '1|/foo\n');
		assert.pos('#1-1', 1, 0);

		yield wasavi.send('1G', '5|cnXYZ\u001b');
		assert.eq('#2-1', 'def', wasavi.getRegister('"'));
		assert.eq('#2-2', 'abc XYZ\nfoo\nbaz', wasavi.getValue());
		assert.pos('#2-3', 0, 6);
	});

	it('search forward next_3', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('i' + [
			'    def',		//    XYZfoo
			'ghi foo',		// baz
			'baz'
		].join('\n') + '\u001b');

		yield wasavi.send('1G', '1|/foo\n');
		assert.pos('#1-1', 1, 4);

		yield wasavi.send('1G', '5|cnXYZ\u001b');
		assert.eq('#2-1', 'def\nghi ', wasavi.getRegister('"'));
		assert.eq('#2-2', '    XYZfoo\nbaz', wasavi.getValue());
		assert.pos('#2-3', 0, 6);
	});

	it('search forward next_4', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('i' + [
			'abc def',		// abc XYZfoo
			'ghi foo',		// baz
			'baz'
		].join('\n') + '\u001b');

		yield wasavi.send('1G', '1|/foo\n');
		assert.pos('#1-1', 1, 4);

		yield wasavi.send('1G', '5|cnXYZ\u001b');
		assert.eq('#2-1', 'def\nghi ', wasavi.getRegister('"'));
		assert.eq('#2-2', 'abc XYZfoo\nbaz', wasavi.getValue());
		assert.pos('#2-3', 0, 6);
	});

	it('search forward prev_1', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('i' + [
			'    def',		// foo
			'foo',          // baz
			'baz'			//
		].join('\n') + '\u001b');

		yield wasavi.send('1G', '1|/def\n');
		assert.pos('#1-1', 0, 4);

		yield wasavi.send('2G', '1|cNXYZ\u001b');
		assert.eq('#2-1', '    def\n', wasavi.getRegister('"'));
		assert.eq('#2-2', 'XYZ\nfoo\nbaz', wasavi.getValue());
		assert.pos('#2-2', 0, 2);
	});

	it('search forward prev_2', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('i' + [
			'abc def',		// abc XYZ
			'foo',			// foo
			'baz'			// baz
		].join('\n') + '\u001b');

		yield wasavi.send('1G', '1|/def\n');
		assert.pos('#1-1', 0, 4);

		yield wasavi.send('2G', '1|cNXYZ\u001b');
		assert.eq('#2-1', 'def', wasavi.getRegister('"'));
		assert.eq('#2-2', 'abc XYZ\nfoo\nbaz', wasavi.getValue());
		assert.pos('#2-3', 0, 6);
	});

	it('search forward prev_3', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('i' + [
			'    def',		//    XYZfoo
			'ghi foo',		// baz
			'baz'
		].join('\n') + '\u001b');

		yield wasavi.send('1G', '1|/def\n');
		assert.pos('#1-1', 0, 4);

		yield wasavi.send('2G', '5|cNXYZ\u001b');
		assert.eq('#2-1', 'def\nghi ', wasavi.getRegister('"'));
		assert.eq('#2-2', '    XYZfoo\nbaz', wasavi.getValue());
		assert.pos('#2-3', 0, 6);
	});

	it('search forward prev_4', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('i' + [
			'abc def',		// abc XYZfoo
			'ghi foo',		// baz
			'baz'
		].join('\n') + '\u001b');

		yield wasavi.send('G', '?def\n');
		assert.pos('#1-1', 0, 4);

		yield wasavi.send('2G', '5|cNXYZ\u001b');
		assert.eq('#2-1', 'def\nghi ', wasavi.getRegister('"'));
		assert.eq('#2-2', 'abc XYZfoo\nbaz', wasavi.getValue());
		assert.pos('#2-2', 0, 6);
	});

	it('search backward next_1', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('i' + [
			'    def',		// XYZ
			'foo',          // baz
			'baz'			//
		].join('\n') + '\u001b');

		yield wasavi.send('G', '?def\n');
		assert.pos('#1-1', 0, 4);

		yield wasavi.send('2G', '1|cnXYZ\u001b');
		assert.eq('#2-1', '    def\n', wasavi.getRegister('"'));
		assert.eq('#2-2', 'XYZ\nfoo\nbaz', wasavi.getValue());
		assert.pos('#2-3', 0, 2);
	});

	it('search backward next_2', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('i' + [
			'abc def',		// abc XYZ
			'foo',			// foo
			'baz'			// baz
		].join('\n') + '\u001b');

		yield wasavi.send('G', '?def\n');
		assert.pos('#1-1', 0, 4);

		yield wasavi.send('2G', '1|cnXYZ\u001b');
		assert.eq('#2-1', 'def', wasavi.getRegister('"'));
		assert.eq('#2-2', 'abc XYZ\nfoo\nbaz', wasavi.getValue());
		assert.pos('#2-3', 0, 6);
	});

	it('search backward next_3', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('i' + [
			'    def',		//     XYZfoo
			'ghi foo',		// baz
			'baz'
		].join('\n') + '\u001b');

		yield wasavi.send('G', '?def\n');
		assert.pos('#1-1', 0, 4);

		yield wasavi.send('2G', '5|cnXYZ\u001b');
		assert.eq('#2-1', 'def\nghi ', wasavi.getRegister('"'));
		assert.eq('#2-2', '    XYZfoo\nbaz', wasavi.getValue());
		assert.pos('#2-3', 0, 6);
	});

	it('search backward next_4', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('i' + [
			'abc def',		// abc foo
			'ghi foo',		// baz
			'baz'
		].join('\n') + '\u001b');

		yield wasavi.send('G', '?def\n');
		assert.pos('#1-1', 0, 4);

		yield wasavi.send('2G', '5|cnXYZ\u001b');
		assert.eq('#2-1', 'def\nghi ', wasavi.getRegister('"'));
		assert.eq('#2-2', 'abc XYZfoo\nbaz', wasavi.getValue());
		assert.pos('#2-3', 0, 6);
	});

	it('search backward prev_1', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('i' + [
			'    def',		// XYZ
			'foo',          // foo
			'baz'			// baz
		].join('\n') + '\u001b');

		yield wasavi.send('G', '?foo\n');
		assert.pos('#1-1', 1, 0);

		yield wasavi.send('1G', '5|cNXYZ\u001b');
		assert.eq('#2-1', '    def\n', wasavi.getRegister('"'));
		assert.eq('#2-2', 'XYZ\nfoo\nbaz', wasavi.getValue());
		assert.pos('#2-2', 0, 2);
	});

	it('search backward prev_2', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('i' + [
			'abc def',		// abc XYZ
			'foo',			// foo
			'baz'			// baz
		].join('\n') + '\u001b');

		yield wasavi.send('G', '?foo\n');
		assert.pos('#1-1', 1, 0);

		yield wasavi.send('1G', '5|cNXYZ\u001b');
		assert.eq('#2-1', 'def', wasavi.getRegister('"'));
		assert.eq('#2-2', 'abc XYZ\nfoo\nbaz', wasavi.getValue());
		assert.pos('#2-3', 0, 6);
	});

	it('search backward prev_3', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('i' + [
			'    def',		//    XYZfoo
			'ghi foo',		// baz
			'baz'
		].join('\n') + '\u001b');

		yield wasavi.send('G', '?foo\n');
		assert.pos('#1-1', 1, 4);

		yield wasavi.send('1G', '5|cNXYZ\u001b');
		assert.eq('#2-1', 'def\nghi ', wasavi.getRegister('"'));
		assert.eq('#2-2', '    XYZfoo\nbaz', wasavi.getValue());
		assert.pos('#2-2', 0, 6);
	});

	it('search backward prev_4', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('i' + [
			'abc def',		// abc foo
			'ghi foo',		// baz
			'baz'
		].join('\n') + '\u001b');

		yield wasavi.send('G', '?foo\n');
		assert.pos('#1-1', 1, 4);

		yield wasavi.send('1G', '5|cNXYZ\u001b');
		assert.eq('#2-1', 'def\nghi ', wasavi.getRegister('"'));
		assert.eq('#2-2', 'abc XYZfoo\nbaz', wasavi.getValue());
		assert.pos('#2-3', 0, 6);
	});

	it('current word forward', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send(
			'i' +
			'foo\n' +
			'bar\n' +
			'baz\n' +
			'foo\n' +
			'bax' +
			'\u001b');
		yield wasavi.send('1G3|c*FOO\u001b');
		assert.value('#1-1',
			'foFOO\n' +
			'foo\n' +
			'bax');
	});

	it('current word forward2', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send(
			'i' +
			'foo\n' +
			'bar\n' +
			'baz\n' +
			'\tfoo\n' +
			'bax' +
			'\u001b');
		yield wasavi.send('1G3|c*FOO\u001b');
		assert.value('#1-1',
			'foFOOfoo\n' +
			'bax');
	});

	it('current word backward', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send(
			'i' +
			'bax\n' +
			'foo\n' +
			'baz\n' +
			'bar\n' +
			'foo' +
			'\u001b');
		yield wasavi.send('5G3|c#FOO\u001b');
		assert.value('#1-1',
			'bax\n' +
			'FOOo');
	});

	it('current word backward2', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send(
			'i' +
			'bax\n' +
			'\tfoo\n' +
			'baz\n' +
			'bar\n' +
			'foo' +
			'\u001b');
		yield wasavi.send('5G3|c#FOO\u001b');
		assert.value('#1-1',
			'bax\n' +
			'\tFOOo');
	});

	it('to percentage row', function* () {
		yield wasavi.send('ifoo bar baz bax\u001byy4pgg2wc100%percentage\u001b');
		assert.value('#1-1', 'percentage');

		yield wasavi.send('ccfoo bar baz bax\u001byy4pG2wc1%percentage\u001b');
		assert.value('#1-2', 'percentage');
	});
};
