/**
 * wasavi: vi clone implemented in javascript
 * =============================================================================
 *
 *
 * @author akahuku@gmail.com
 * @version $Id: op_change.js 132 2012-06-05 15:44:16Z akahuku $
 */

/**
 * tests
 */

function testChange () {
	Wasavi.send('i', '1\n2\n3', '\u001b');

	Wasavi.send('ggccXYZ\u001b');
	assertEquals('#1-1', '1\n', Wasavi.registers('"'));
	assertEquals('#1-2', 'XYZ\n2\n3', Wasavi.value);
	assertPos('#1-3', [0, 2]);

	Wasavi.send('ggc2cX\nY\nZ\u001b');
	assertEquals('#2-1', 'XYZ\n2\n', Wasavi.registers('"'));
	assertEquals('#2-2', 'X\nY\nZ\n3', Wasavi.value);
	assertPos('#2-3', [2, 0]);

	Wasavi.send('gg2ccFOO\u001b');
	assertEquals('#3-1', 'X\nY\n', Wasavi.registers('"'));
	assertEquals('#3-2', 'FOO\nZ\n3', Wasavi.value);
	assertPos('#3-3', [0, 2]);

	Wasavi.send('gg5ccXYZ\u001b');
	assertEquals('#4-1', 'FOO\nZ\n3\n', Wasavi.registers('"'));
	assertEquals('#4-2', 'XYZ', Wasavi.value);
	assertPos('#4-3', [0, 2]);
}

function testChangeUpLine (a) {
	a || (a = '-');

	Wasavi.send('iline1\n\tline2\n\t\tline3\u001b');
	assertEquals('line1\n\tline2\n\t\tline3', Wasavi.value);

	Wasavi.send('3G');
	assertPos('#1-1', [2, 2]);

	Wasavi.send('c', a, 'XYZ\u001b');
	assertPos('#2-1', [1, 2]);
	assertEquals('#2-2', '\tline2\n\t\tline3\n', Wasavi.registers('"'));
	assertEquals('#2-3', '\tline2\n\t\tline3\n', Wasavi.registers('1'));
	assertEquals('#2-4', 'line1\nXYZ', Wasavi.value);

	Wasavi.send('c3', a, 'FOO\u001b');
	assertPos('#3-1', [0, 2]);
	assertEquals('#3-2', 'FOO', Wasavi.value);
	assertEquals('#3-3', 'line1\nXYZ\n', Wasavi.registers('"'));
	assertEquals('#3-4', 'line1\nXYZ\n', Wasavi.registers('1'));
	assertEquals('#3-5', '\tline2\n\t\tline3\n', Wasavi.registers('2'));

	Wasavi.send('c3', a);
	assertEquals('#4-1', 'FOO', Wasavi.value);
	assertEquals('#4-2', 'command', Wasavi.inputMode);
	assert('#4-3', Wasavi.lastMessage != '');
}

function testChangeDownLine (a) {
	a || (a = '+');

	Wasavi.send('iline1\n\tline2\n\t\tline3\u001b');
	assertEquals('line1\n\tline2\n\t\tline3', Wasavi.value);

	Wasavi.send('1G');
	assertPos('#1-1', [0, 0]);

	Wasavi.send('c', a, 'XYZ\u001b');
	assertPos('#2-1', [0, 2]);
	assertEquals('#2-2', 'line1\n\tline2\n', Wasavi.registers('"'));
	assertEquals('#2-3', 'line1\n\tline2\n', Wasavi.registers('1'));
	assertEquals('#2-4', 'XYZ\n\t\tline3', Wasavi.value);

	Wasavi.send('c3', a, 'FOO\u001b');
	assertPos('#3-1', [0, 2]);
	assertEquals('#3-2', 'FOO', Wasavi.value);
	assertEquals('#3-3', 'XYZ\n\t\tline3\n', Wasavi.registers('"'));
	assertEquals('#3-4', 'XYZ\n\t\tline3\n', Wasavi.registers('1'));
	assertEquals('#3-5', 'line1\n\tline2\n', Wasavi.registers('2'));

	Wasavi.send('c3', a);
	assertEquals('#4-1', 'FOO', Wasavi.value);
	assertEquals('#4-2', 'command', Wasavi.inputMode);
	assert('#4-3', Wasavi.lastMessage != '');
}

function testChangeDownEnter () {
	testChangeDownLine(Wasavi.SPECIAL_KEYS.ENTER);
}

function testChangeFirstNonWhiteCharOfLine (a) {
	a || (a = '^');

	Wasavi.send('i', '\tfoobar', '\u001b');
	Wasavi.send('c', a, 'XYZ\u001b');

	assertEquals('#1-1', '\tXYZr', Wasavi.value);
	assertEquals('#1-2', 'fooba', Wasavi.registers('"'));
	assertPos('#1-3', [0, 3]);

	Wasavi.send('^c', a, 'FOO\u001b');
	assertEquals('#2-1', 'fooba', Wasavi.registers('"'));
	assertPos('#2-2', [0, 3]);
}

function testChangeHome () {
	testChangeFirstNonWhiteCharOfLine(Wasavi.SPECIAL_KEYS.HOME);
}

function testChangeTopOfLine () {
	Wasavi.send('i', '\tfoobar', '\u001b');
	Wasavi.send('c0XYZ\u001b');

	assertEquals('#1-1', '\tfooba', Wasavi.registers('"'));
	assertEquals('#1-2', 'XYZr', Wasavi.value);
	assertPos('#1-3', [0, 2]);
}

function testChangeTailOfLine (a) {
	a || (a = '$');

	Wasavi.send('i', '\tfoobar', '\u001b1|');
	Wasavi.send('c', a, 'XYZ\u001b');

	assertEquals('#1-1', '\tfoobar', Wasavi.registers('"'));
	assertEquals('#1-2', 'XYZ', Wasavi.value);
	assertPos('#1-3', [0, 2]);
}

function testChangeEnd () {
	testChangeTailOfLine(Wasavi.SPECIAL_KEYS.END);
}

function testChangeDirectColumn () {
	Wasavi.send('i', '0123456789\n0123456789', '\u001b1G1|');

	Wasavi.send('c5|XYZ\u001b');
	assertEquals('#1-1', '0123', Wasavi.registers('"'));
	assertEquals('#1-2', 'XYZ456789\n0123456789', Wasavi.value);
	assertPos('#1-3', [0, 2]);

	Wasavi.send('$c4|FOO\u001b');
	assertEquals('#2-1', '45678', Wasavi.registers('"'));
	assertEquals('#2-2', 'XYZFOO9\n0123456789', Wasavi.value);
	assertPos('#2-3', [0, 5]);

	Wasavi.send('2G1|c100|BAR\u001b');
	assertEquals('#3-1', '0123456789', Wasavi.registers('"'));
	assertEquals('#3-2', 'XYZFOO9\nBAR', Wasavi.value);
	assertPos('#3-3', [1, 2]);
}

function testChangeJumpToMatchedParenthes () {
	Wasavi.send('i', 'this is (first) line.\nthis is (second) line)', '\u001b');

	Wasavi.send('1G1|f(c%XYZ\u001b');
	assertEquals('#1-1', '(first)', Wasavi.registers('"'));
	assertEquals('#1-2', 'this is XYZ line.\nthis is (second) line)', Wasavi.value);
	assertPos('#1-3', [0, 10]);

	Wasavi.send('2G1|f)c%FOO\u001b');
	assertEquals('#2-1', '(second)', Wasavi.registers('"'));
	assertEquals('#2-2', 'this is XYZ line.\nthis is FOO line)', Wasavi.value);
	assertPos('#2-3', [1, 10]);

	Wasavi.send('G$c%');
	assertEquals('#3-1', '(second)', Wasavi.registers('"'));
	assertPos('#3-2', [1, 16]);
	assert('#3-3', Wasavi.lastMessage != '');
	assertEquals('#3-4', 'command', Wasavi.inputMode);
}

function testChangeSearchForward () {
	Wasavi.send('i', 'find the\nchar4cter in cu4rent 4line', '\u001b1G1|');

	Wasavi.send('c/4\nXYZ\u001b');
	/*
	 * XYZ4cter in cu4rent 4line
	 *   ^
	 */
	assertEquals('#1-1', 'find the\nchar', Wasavi.registers('"'));
	assertEquals('#1-2', 'XYZ4cter in cu4rent 4line', Wasavi.value);
	assertPos('#1-3', [0, 2]);

	Wasavi.send('2c/4\nFOO\u001b');
	/*
	 * XYFOO4rent 4line
	 *     ^
	 */
	assertEquals('#2-1', 'Z4cter in cu', Wasavi.registers('"'));
	assertEquals('#2-2', 'XYFOO4rent 4line', Wasavi.value);
	assertPos('#2-3', [0, 4]);

	Wasavi.send('3c/X\n');
	/*
	 * XYFOO4rent 4line
	 *     ^
	 */
	assertEquals('#3-1', 'Z4cter in cu', Wasavi.registers('"'));
	assertEquals('#3-2', 'XYFOO4rent 4line', Wasavi.value);
	assertPos('#3-3', [0, 4]);
	assert('#3-4', Wasavi.lastMessage != '');
}

function testChangeSearchBackward () {
	Wasavi.send('i', 'find the char4cter in cu4rent\n4line', '\u001b');

	Wasavi.send('G$c?4\nXYZ\u001b');
	/*
	 * find the char4cter in cu4rent
	 * XYZe
	 *   ^
	 */
	assertEquals('#1-1', '4lin', Wasavi.registers('"'));
	assertEquals('#1-2', 'find the char4cter in cu4rent\nXYZe', Wasavi.value);
	assertPos('#1-3', [1, 2]);

	Wasavi.send('2c?4\nFOO\u001b');
	/*
	 * find the charFOOZe
	 *                ^
	 */
	assertEquals('#2-1', '4cter in cu4rent\nXY', Wasavi.registers('"'));
	assertEquals('#2-2', 'find the charFOOZe', Wasavi.value);
	assertPos('#2-3', [0, 15]);

	Wasavi.send('2c?X\n');
	/*
	 * find the charFOOZe
	 *                ^
	 */
	assertEquals('#3-1', '4cter in cu4rent\nXY', Wasavi.registers('"'));
	assertEquals('#3-2', 'find the charFOOZe', Wasavi.value);
	assertPos('#3-3', [0, 15]);
	assert('#3-4', Wasavi.lastMessage != '');
}

function testChangeFindForward () {
	Wasavi.send('i', 'find the char4cter in cu4rent 4line', '\u001b1G1|');

	Wasavi.send('cf4XYZ\u001b');
	assertEquals('#1-1', 'find the char4', Wasavi.registers('"'));
	assertEquals('#1-2', 'XYZcter in cu4rent 4line', Wasavi.value);
	assertPos('#1-3', [0, 2]);

	Wasavi.send('2cf4FOO\u001b');
	assertEquals('#2-1', 'Zcter in cu4rent 4', Wasavi.registers('"'));
	assertEquals('#2-2', 'XYFOOline', Wasavi.value);
	assertPos('#2-3', [0, 4]);

	Wasavi.send('4cf4');
	assertEquals('#3-1', 'Zcter in cu4rent 4', Wasavi.registers('"'));
	assertEquals('#3-2', 'XYFOOline', Wasavi.value);
	assertPos('#3-3', [0, 4]);
	assert('#3-4', Wasavi.lastMessage != '');
	assertEquals('#3-5', 'command', Wasavi.inputMode);
}

function testChangeFindBackward () {
	Wasavi.send('i', 'find the char4cter in cu4rent 4line', '\u001b');

	Wasavi.send('cF4XYZ\u001b');
	assertEquals('#1-1', '4lin', Wasavi.registers('"'));
	assertEquals('#1-2', 'find the char4cter in cu4rent XYZe', Wasavi.value);
	assertPos('#1-3', [0, 32]);

	Wasavi.send('2cF4FOO\u001b');
	assertEquals('#2-1', '4cter in cu4rent XY', Wasavi.registers('"'));
	assertEquals('#2-2', 'find the charFOOZe', Wasavi.value);
	assertPos('#2-3', [0, 15]);

	Wasavi.send('cF4');
	assertEquals('#3-1', '4cter in cu4rent XY', Wasavi.registers('"'));
	assertEquals('#3-2', 'find the charFOOZe', Wasavi.value);
	assertPos('#3-3', [0, 15]);
	assert('#3-4', Wasavi.lastMessage != '');
	assertEquals('#3-5', 'command', Wasavi.inputMode);
}

function testChangeFindFowardBeforeStop () {
	Wasavi.send('i', 'find the char4cter in cu4rent 4line', '\u001b1G1|');

	Wasavi.send('ct4XYZ\u001b');
	assertEquals('#1-1', 'find the char', Wasavi.registers('"'));
	assertEquals('#1-2', 'XYZ4cter in cu4rent 4line', Wasavi.value);
	assertPos('#1-3', [0, 2]);

	Wasavi.send('2ct4FOO\u001b');
	assertEquals('#2-1', 'Z4cter in cu', Wasavi.registers('"'));
	assertEquals('#2-2', 'XYFOO4rent 4line', Wasavi.value);
	assertPos('#2-3', [0, 4]);

	Wasavi.send('4ct4');
	assertEquals('#3-1', 'Z4cter in cu', Wasavi.registers('"'));
	assertEquals('#3-2', 'XYFOO4rent 4line', Wasavi.value);
	assertPos('#3-3', [0, 4]);
	assert('#3-4', Wasavi.lastMessage != '');
	assertEquals('#3-5', 'command', Wasavi.inputMode);
}

function testChangeFindBackwardBeforeStop () {
	Wasavi.send('i', 'find the char4cter in cu4rent 4line', '\u001b');
	
	Wasavi.send('cT4XYZ\u001b');
	assertEquals('#1-1', 'lin', Wasavi.registers('"'));
	assertEquals('#1-2', 'find the char4cter in cu4rent 4XYZe', Wasavi.value);
	assertPos('#1-3', [0, 33]);

	Wasavi.send('cT4FOO\u001b');
	assertEquals('#2-1', 'XY', Wasavi.registers('"'));
	assertEquals('#2-2', 'find the char4cter in cu4rent 4FOOZe', Wasavi.value);
	assertPos('#2-3', [0, 33]);

	Wasavi.send('c2T4BAR\u001b');
	assertEquals('#3-1', 'rent 4FO', Wasavi.registers('"'));
	assertEquals('#3-2', 'find the char4cter in cu4BAROZe', Wasavi.value);
	assertPos('#3-3', [0, 27]);

	Wasavi.send('c3T4');
	assertEquals('#4-1', 'rent 4FO', Wasavi.registers('"'));
	assertEquals('#4-2', 'find the char4cter in cu4BAROZe', Wasavi.value);
	assertPos('#4-3', [0, 27]);
	assert('#4-4', Wasavi.lastMessage != '');
	assertEquals('#4-5', 'command', Wasavi.inputMode);
}

function testChangeFindInvert () {
	Wasavi.send('4i', 'fi4st s4cond th4rd fou4th\n', '\u001b');

	Wasavi.send('1G1|cf4A\u001b$c,A\u001b');
	assertEquals('#1-1', '4t', Wasavi.registers('"'));
	assertEquals('#1-2', 'Ast s4cond th4rd fouAh', Wasavi.value.split('\n')[0]);
	assertPos('#1-3', [0, 20]);

	Wasavi.send('2G1|ct4B\u001b$c,B\u001b');
	assertEquals('#2-1', 't', Wasavi.registers('"'));
	assertEquals('#2-2', 'B4st s4cond th4rd fou4Bh', Wasavi.value.split('\n')[1]);
	assertPos('#2-3', [1, 22]);

	Wasavi.send('3G$cF4C\u001b0c,C\u001b');
	assertEquals('#3-1', 'fi4', Wasavi.registers('"'));
	assertEquals('#3-2', 'Cst s4cond th4rd fouCh', Wasavi.value.split('\n')[2]);
	assertPos('#3-3', [2, 0]);

	Wasavi.send('4G$cT4D\u001b0c,D\u001b');
	assertEquals('#4-1', 'fi', Wasavi.registers('"'));
	assertEquals('#4-2', 'D4st s4cond th4rd fou4Dh', Wasavi.value.split('\n')[3]);
	assertPos('#4-3', [3, 0]);
}

function testChangeFindRepeat () {
	Wasavi.send('4i', 'fi4st s4cond th4rd fou4th\n', '\u001b');

	Wasavi.send('1G1|f43|c;A\u001b');
	assertEquals('#1-1', '4st s4', Wasavi.registers('"'));
	assertEquals('#1-2', 'fiAcond th4rd fou4th', Wasavi.value.split('\n')[0]);
	assertPos('#1-3', [0, 2]);

	Wasavi.send('2G1|t43|c;B\u001b');
	assertEquals('#2-1', '4st s', Wasavi.registers('"'));
	assertEquals('#2-2', 'fiB4cond th4rd fou4th', Wasavi.value.split('\n')[1]);
	assertPos('#2-3', [1, 2]);

	Wasavi.send('3G$F4c;C\u001b');
	assertEquals('#3-1', '4rd fou', Wasavi.registers('"'));
	assertEquals('#3-2', 'fi4st s4cond thC4th', Wasavi.value.split('\n')[2]);
	assertPos('#3-3', [2, 15]);

	Wasavi.send('4G$T4c;D\u001b');
	assertEquals('#4-1', 'rd fou4', Wasavi.registers('"'));
	assertEquals('#4-2', 'fi4st s4cond th4Dth', Wasavi.value.split('\n')[3]);
	assertPos('#4-3', [3, 16]);
}

function testChangeDownLineOrient () {
	Wasavi.send('i', '\t1foobar\n\t2foobar', '\u001bgg');

	Wasavi.send('c_\tX\u001b');
	/*
	 * ^I1foobar  -->  ^IX
	 * ^I2foobar       ^I2foobar
	 */
	assertEquals('#1-1', '\t1foobar\n', Wasavi.registers('"'));
	assertEquals('#1-2', '\tX', Wasavi.value.split('\n')[0]);
	assertPos('#1-3', [0, 1]);

	Wasavi.send(':set ai\n');
	Wasavi.send('2G');
	Wasavi.send('c_Y\u001b');
	/*
	 * ^IX        -->  ^IX
	 * ^I2foobar       ^IY
	 */
	assertEquals('#2-1', '\t2foobar\n', Wasavi.registers('"'));
	assertEquals('#2-2', '\tY', Wasavi.value.split('\n')[1]);
	assertPos('#2-3', [1, 1]);

	Wasavi.send('ggc2_Z\u001b');
	/*
	 * ^IX  -->  ^IZ
	 * ^IY
	 */
	assertEquals('#3-1', '\tX\n\tY\n', Wasavi.registers('"'));
	assertEquals('#3-2', '\tZ', Wasavi.value);
	assertPos('#3-3', [0, 1]);

	Wasavi.send('c3_X\u001b');
	/*
	 * ^IZ  -->  ^IX
	 */
	assertEquals('#4-1', '\tZ\n', Wasavi.registers('"'));
	assertEquals('#4-2', '\tX', Wasavi.value);
	assertPos('#4-2', [0, 1]);
}

function testChangeMark () {
	Wasavi.send('i', 'foo1bar\nbaz3bax', '\u001b');

	Wasavi.send('1G0f1ma0c`aXYZ\u001b');
	assertEquals('#1-1', 'foo', Wasavi.registers('"'));
	assertEquals('#1-2', 'XYZ1bar\nbaz3bax', Wasavi.value);
	assertPos('#1-3', [0, 2]);

	Wasavi.send('2G$F3ma$c`aFOO\u001b');
	assertEquals('#2-1', '3ba', Wasavi.registers('"'));
	assertEquals('#2-2', 'XYZ1bar\nbazFOOx', Wasavi.value);
	assertPos('#2-3', [1, 5]);

	Wasavi.send('FFma1G4|c`aBAR\u001b');
	assertEquals('#3-1', '1bar\nbaz', Wasavi.registers('"'));
	assertEquals('#3-2', 'XYZBARFOOx', Wasavi.value);
	assertPos('#3-3', [0, 5]);

	Wasavi.send('c`b');
	assertEquals('#4-1', '1bar\nbaz', Wasavi.registers('"'));
	assertEquals('#4-2', 'XYZBARFOOx', Wasavi.value);
	assertPos('#4-3', [0, 5]);
	assertEquals('#4-4', 'command', Wasavi.inputMode);
}

function testChangeMarkLineOrient () {
	Wasavi.send('i', '1\n2\n3\n4\n5\n6\n7', '\u001b');

	Wasavi.send('3Gma1Gc\'aXYZ\u001b');
	assertEquals('#1-1', '1\n2\n3\n', Wasavi.registers('"'));
	assertEquals('#1-2', 'XYZ\n4\n5\n6\n7', Wasavi.value);
	assertPos('#1-3', [0, 2]);

	Wasavi.send('3GmaGc\'aFOO\u001b');
	assertEquals('#2-1', '5\n6\n7\n', Wasavi.registers('"'));
	assertEquals('#2-2', 'XYZ\n4\nFOO', Wasavi.value);
	assertPos('#2-3', [2, 2]);
}

function testChangeSectionForward () {
	// TBD
}

function testChangeSectionBackward () {
	// TBD
}

function testChangeParagraphForward () {
	// TBD
}

function testChangeParagraphBackward () {
	// TBD
}

function testChangeSentenceForward () {
	// TBD
}

function testChangeSentenceBackward () {
	// TBD
}

function testChangeDown (a) {
	a || (a = 'j');

	Wasavi.send('i', 'first\nsecond\nthird\nf\nfifth', '\u001b');
	Wasavi.send('2G3|c10', a, 'XYZ\nFOO\u001b');
	assertEquals('#1-1', 'second\nthird\nf\nfifth\n', Wasavi.registers('"'));
	assertEquals('#1-2', 'second\nthird\nf\nfifth\n', Wasavi.registers('1'));
	assertEquals('#1-3', 'first\nXYZ\nFOO', Wasavi.value);
	assertPos('#1-4', [2, 2]);
	assert('#1-5', Wasavi.lastMessage == '');

	Wasavi.send('2G3|c', a, 'BAR\nBAZ\u001b');
	assertEquals('#2-1', 'XYZ\nFOO\n', Wasavi.registers('"'));
	assertEquals('#2-2', 'XYZ\nFOO\n', Wasavi.registers('1'));
	assertEquals('#2-3', 'second\nthird\nf\nfifth\n', Wasavi.registers('2'));
	assertEquals('#2-4', 'first\nBAR\nBAZ', Wasavi.value);
	assertPos('#2-5', [2, 2]);
}

function testChangeDownCtrlN () {
	testChangeDown('\u000e');
}

function testChangeDownDown () {
	testChangeDown(Wasavi.SPECIAL_KEYS.DOWN);
}

function testChangeUp (a) {
	a || (a = 'k');

	Wasavi.send('i', 'first\nsecond\nt', '\u001b');

	Wasavi.send('2G3|c10', a, 'XYZ\u001b');
	assertEquals('#1-1', 'first\nsecond\n', Wasavi.registers('"'));
	assertEquals('#1-2', 'first\nsecond\n', Wasavi.registers('1'));
	assertEquals('#1-3', 'XYZ\nt', Wasavi.value);
	assertPos('#1-2', [0, 2]);
	assert('#1-3', Wasavi.lastMessage == '');

	Wasavi.send('2G1|c', a, 'FOO\u001b');
	assertEquals('#2-1', 'XYZ\nt\n', Wasavi.registers('"'));
	assertEquals('#2-2', 'XYZ\nt\n', Wasavi.registers('1'));
	assertEquals('#2-3', 'first\nsecond\n', Wasavi.registers('2'));
	assertEquals('#2-4', 'FOO', Wasavi.value);
	assertPos('#2-4', [0, 2]);
}

function testChangeUpCtrlP () {
	testChangeUp('\u0010');
}

function testChangeUpUp () {
	testChangeUp(Wasavi.SPECIAL_KEYS.UP);
}

function testChangeLeft (a) {
	a || (a = 'h');

	Wasavi.send('i', 'foo bar baz', '\u001b');
	assertPos('#1-1', [0, 10]);

	Wasavi.send('c', a, 'X\u001b');
	assertEquals('#2-1', 'a', Wasavi.registers('"'));
	assertEquals('#2-2', 'foo bar bXz', Wasavi.value);
	assertPos('#2-3', [0, 9]);

	Wasavi.send('c2', a, 'Y\u001b');
	assertEquals('#3-1', ' b', Wasavi.registers('"'));
	assertEquals('#3-2', 'foo barYXz', Wasavi.value);
	assertPos('#3-3', [0, 7]);

	Wasavi.send('c100', a, 'Z\u001b');
	assertEquals('#4-1', 'foo bar', Wasavi.registers('"'));
	assertEquals('#4-2', 'ZYXz', Wasavi.value);
	assertPos('#4-3', [0, 0]);
}

function testChangeLeftCtrlH () {
	testChangeLeft('\u0008');
}

function testChangeLeftLeft () {
	testChangeLeft(Wasavi.SPECIAL_KEYS.LEFT);
}

function testChangeRight (a) {
	a || (a = 'l');

	Wasavi.send('i', 'foo bar baz', '\u001b1|');
	assertPos('#1-1', [0, 0]);

	Wasavi.send('c', a, 'X\u001b');
	assertEquals('#2-1', 'Xoo bar baz', Wasavi.value);
	assertPos('#2-2', [0, 0]);
	assertEquals('#2-3', 'f', Wasavi.registers('"'));

	Wasavi.send('"ac2', a, 'Y\u001b');
	assertEquals('#3-1', 'Yo bar baz', Wasavi.value);
	assertPos('#3-2', [0, 0]);
	assertEquals('#3-3', 'Xo', Wasavi.registers('a'));
	assertEquals('#3-4', 'Xo', Wasavi.registers('"'));

	Wasavi.send('c5', a, 'Z\u001b');
	assertEquals('#4-1', 'Zr baz', Wasavi.value);
	assertPos('#4-2', [0, 0]);
	assertEquals('#4-3', 'Yo ba', Wasavi.registers('"'));

	Wasavi.send('c100', a, 'F\u001b');
	assertEquals('#5-1', 'F', Wasavi.value);
	assertPos('#5-2', [0, 0]);
	assertEquals('#5-3', 'Zr baz', Wasavi.registers('"'));
}

function testChangeRightSpace () {
	testChangeRight(' ');
}

function testChangeRightRight () {
	testChangeRight(Wasavi.SPECIAL_KEYS.RIGHT);
}

function testChangeWordForward () {
	Wasavi.send('i', 'foo bar baz\nbax', '\u001b1|gg');

	Wasavi.send('cwFOO\u001b');
	assertEquals('#1-1', 'FOO bar baz\nbax', Wasavi.value);
	assertPos('#1-2', [0, 2]);
	assertEquals('#1-3', 'foo', Wasavi.registers('"'));

	Wasavi.send('ggc2wBAR BAZ\u001b');
	assertEquals('#2-1', 'BAR BAZ baz\nbax', Wasavi.value);
	assertPos('#2-2', [0, 6]);
	assertEquals('#2-3', 'FOO bar', Wasavi.registers('"'));

	Wasavi.send('ggc3wX Y Z\u001b');
	assertEquals('#3-1', 'X Y Z\nbax', Wasavi.value);
	assertPos('#3-2', [0, 4]);
	assertEquals('#3-3', 'BAR BAZ baz', Wasavi.registers('"'));

	Wasavi.send('ggc4wBAX\u001b');
	assertEquals('#4-1', 'BAX', Wasavi.value);
	assert('#4-2', Wasavi.lastMessage == '');
	assertPos('#4-3', [0, 2]);
	assertEquals('#4-4', 'X Y Z\nbax', Wasavi.registers('"'));
}

function testChangeWordBackward () {
	Wasavi.send('i', 'foo\nbar baz bax', '\u001b');

	/*
	 * foo               foo
	 * bar baz bax  -->  bar baz XYZx
	 */
	Wasavi.send('cbXYZ\u001b');
	assertEquals('#1-1', 'foo\nbar baz XYZx', Wasavi.value);
	assertPos('#1-2', [1, 10]);
	assertEquals('#1-3', 'ba', Wasavi.registers('"'));

	/*
	 * foo                foo
	 * bar baz XYZx  -->  FOO BARXYZx
	 */
	Wasavi.send('bc2bFOO BAR\u001b');
	assertEquals('#2-1', 'foo\nFOO BARXYZx', Wasavi.value);
	assertPos('#2-2', [1, 6]);
	assertEquals('#2-3', 'bar baz ', Wasavi.registers('"'));

	/*
	 * foo               BAZ
	 * FOO BARXYZx  -->  FOOBARXYZx
	 */
	Wasavi.send('0cbBAZ\u001b');
	assertEquals('#3-1', 'BAZ\nFOO BARXYZx', Wasavi.value);
	assertPos('#3-2', [0, 2]);
	assertEquals('#3-3', 'foo', Wasavi.registers('"'));
}

function testChangeBigwordForward () {
	Wasavi.send('i', 'f#o b#r b#z\nb#x', '\u001b1|gg');

	Wasavi.send('cWFOO\u001b');
	assertEquals('#1-1', 'FOO b#r b#z\nb#x', Wasavi.value);
	assertPos('#1-2', [0, 2]);
	assertEquals('#1-3', 'f#o', Wasavi.registers('"'));

	Wasavi.send('ggc2WBAR BAZ\u001b');
	assertEquals('#2-1', 'BAR BAZ b#z\nb#x', Wasavi.value);
	assertPos('#2-2', [0, 6]);
	assertEquals('#2-3', 'FOO b#r', Wasavi.registers('"'));

	Wasavi.send('ggc3WX Y Z\u001b');
	assertEquals('#3-1', 'X Y Z\nb#x', Wasavi.value);
	assertPos('#3-2', [0, 4]);
	assertEquals('#3-3', 'BAR BAZ b#z', Wasavi.registers('"'));

	Wasavi.send('ggc4WBAX\u001b');
	assertEquals('#4-1', 'BAX', Wasavi.value);
	assert('#4-2', Wasavi.lastMessage == '');
	assertPos('#4-3', [0, 2]);
	assertEquals('#4-4', 'X Y Z\nb#x', Wasavi.registers('"'));
}

function testChangeBigwordBackward () {
	Wasavi.send('i', 'f#o\nb#r b#z b#x', '\u001b');

	Wasavi.send('cBXYZ\u001b');
	assertEquals('#1-1', 'f#o\nb#r b#z XYZx', Wasavi.value);
	assertPos('#1-2', [1, 10]);
	assertEquals('#1-3', 'b#', Wasavi.registers('"'));

	Wasavi.send('bc2BFOO BAR\u001b');
	assertEquals('#2-1', 'f#o\nFOO BARXYZx', Wasavi.value);
	assertPos('#2-2', [1, 6]);
	assertEquals('#2-3', 'b#r b#z ', Wasavi.registers('"'));

	Wasavi.send('0cBBAZ\u001b');
	assertEquals('#3-1', 'BAZ\nFOO BARXYZx', Wasavi.value);
	assertPos('#3-2', [0, 2]);
	assertEquals('#3-3', 'f#o', Wasavi.registers('"'));
}

function testChangeWordEnd () {
	Wasavi.send('i', 'foo bar\nbaz\nbax', '\u001bgg');

	Wasavi.send('ceXYZ\u001b');
	assertEquals('#1-1', 'foo', Wasavi.registers('"'));
	assertEquals('#1-2', 'XYZ bar\nbaz\nbax', Wasavi.value);
	assertPos('#1-3', [0, 2]);

	Wasavi.send('ggc2eFOO BAR\u001b');
	assertEquals('#2-1', 'XYZ bar', Wasavi.registers('"'));
	assertEquals('#2-2', 'FOO BAR\nbaz\nbax', Wasavi.value);
	assertPos('#2-3', [0, 6]);

	Wasavi.send('gg3e');
	assertPos('#3-x-1', [1, 2]);
	Wasavi.send('ggc3eBAR BAZ BAX\u001b');
	assertEquals('#3-1', 'FOO BAR\nbaz', Wasavi.registers('"'));
	assertEquals('#3-2', 'BAR BAZ BAX\nbax', Wasavi.value);
	assertPos('#3-3', [0, 10]);
}

function testChangeBigwordEnd () {
	Wasavi.send('i', 'f@o b@r\nb@z\nb@x', '\u001bgg');

	Wasavi.send('cEXYZ\u001b');
	assertEquals('#1-1', 'f@o', Wasavi.registers('"'));
	assertEquals('#1-2', 'XYZ b@r\nb@z\nb@x', Wasavi.value);
	assertPos('#1-3', [0, 2]);

	Wasavi.send('ggc2EFOO BAR\u001b');
	assertEquals('#2-1', 'XYZ b@r', Wasavi.registers('"'));
	assertEquals('#2-2', 'FOO BAR\nb@z\nb@x', Wasavi.value);
	assertPos('#2-3', [0, 6]);

	Wasavi.send('gg3E');
	assertPos('#3-x-1', [1, 2]);
	Wasavi.send('ggc3EBAR BAZ BAX\u001b');
	assertEquals('#3-1', 'FOO BAR\nb@z', Wasavi.registers('"'));
	assertEquals('#3-2', 'BAR BAZ BAX\nb@x', Wasavi.value);
	assertPos('#3-3', [0, 10]);
}

function testChangeGotoPrefix () {
	Wasavi.send('i', ' 1\n2\n 3', '\u001b');

	Wasavi.send('cggXYZ\u001b');
	assertEquals('#1-1', ' 1\n2\n 3\n', Wasavi.registers('"'));
	assertEquals('#1-2', ' 1\n2\n 3\n', Wasavi.registers('1'));
	assertEquals('#1-3', ' XYZ', Wasavi.value);
	assertPos('#1-4', [0, 3]);
}

function testChangeTopOfView () {
	makeScrollableBuffer(2);

	var rowLength = Wasavi.rowLength;
	Wasavi.send('GH');
	var viewLines = Wasavi.rowLength - Wasavi.row;

	Wasavi.send('GcH\u001b');
	assertEquals(Wasavi.registers('"').replace(/\n$/, '').split('\n').length, viewLines);
}

function testChangeMiddleOfView () {
	makeScrollableBuffer(2);

	var rowLength = Wasavi.rowLength;
	Wasavi.send('ggM');
	var viewLines = Wasavi.row + 1;

	Wasavi.send('ggcM\u001b');
	assertEquals('#1', Wasavi.registers('"').split('\n').length - 1, viewLines);

	var rowLength = Wasavi.rowLength;
	Wasavi.send('GM');
	var viewLines = Wasavi.rowLength - Wasavi.row;

	Wasavi.send('GcM\u001b');
	assertEquals('#2', Wasavi.registers('"').split('\n').length - 1, viewLines);
}

function testChangeBottomOfView () {
	makeScrollableBuffer(2);

	var rowLength = Wasavi.rowLength;
	Wasavi.send('ggL');
	var viewLines = Wasavi.row + 1;

	Wasavi.send('ggcL\u001b');
	assertEquals(Wasavi.registers('"').replace(/\n$/, '').split('\n').length, viewLines);
}

function testChangeGoto () {
	Wasavi.send('i', '\t1\n\t2\n\t3\n\t4\n\t5\n\t6\n\t7', '\u001b');

	Wasavi.send('ggc3GXYZ\u001b');
	assertEquals('#1-1', '\t1\n\t2\n\t3\n', Wasavi.registers('"'));
	assertEquals('#1-2', '\t1\n\t2\n\t3\n', Wasavi.registers('1'));
	assertEquals('#1-3', 'XYZ\n\t4\n\t5\n\t6\n\t7', Wasavi.value);
	assertPos('#1-4', [0, 2]);

	Wasavi.send(':set noai\nGc3GFOO\u001b');
	assertEquals('#2-1', '\t5\n\t6\n\t7\n', Wasavi.registers('"'));
	assertEquals('#2-2', '\t5\n\t6\n\t7\n', Wasavi.registers('1'));
	assertEquals('#2-3', '\t1\n\t2\n\t3\n', Wasavi.registers('2'));
	assertEquals('#2-4', 'XYZ\n\t4\nFOO', Wasavi.value);
	assertPos('#2-5', [2, 2]);
}

function testChangeSearchForwardNext_1 () {
	Wasavi.send('i', [
		'    def',		// XYZ
		'foo',          // foo
		'baz'			// baz
	].join('\n'), '\u001b');

	Wasavi.send('1G1|/foo\n');
	assertPos('#1-1', [1, 0]);

	Wasavi.send('1G5|cnXYZ\u001b');
	assertEquals('#2-1', '    def\n', Wasavi.registers('"'));
	assertEquals('#2-2', 'XYZ\nfoo\nbaz', Wasavi.value);
	assertPos('#2-3', [0, 2]);
}

function testChangeSearchForwardNext_2 () {
	Wasavi.send('i', [
		'abc def',		// abc XYZ
		'foo',			// foo
		'baz'			// baz
	].join('\n'), '\u001b');

	Wasavi.send('1G1|/foo\n');
	assertPos('#1-1', [1, 0]);

	Wasavi.send('1G5|cnXYZ\u001b');
	assertEquals('#2-1', 'def', Wasavi.registers('"'));
	assertEquals('#2-2', 'abc XYZ\nfoo\nbaz', Wasavi.value);
	assertPos('#2-3', [0, 6]);
}

function testChangeSearchForwardNext_3 () {
	Wasavi.send('i', [
		'    def',		//    XYZfoo
		'ghi foo',		// baz
		'baz'
	].join('\n'), '\u001b');

	Wasavi.send('1G1|/foo\n');
	assertPos('#1-1', [1, 4]);

	Wasavi.send('1G5|cnXYZ\u001b');
	assertEquals('#2-1', 'def\nghi ', Wasavi.registers('"'));
	assertEquals('#2-2', '    XYZfoo\nbaz', Wasavi.value);
	assertPos('#2-3', [0, 6]);
}

function testChangeSearchForwardNext_4 () {
	Wasavi.send('i', [
		'abc def',		// abc XYZfoo
		'ghi foo',		// baz
		'baz'
	].join('\n'), '\u001b');

	Wasavi.send('1G1|/foo\n');
	assertPos('#1-1', [1, 4]);

	Wasavi.send('1G5|cnXYZ\u001b');
	assertEquals('#2-1', 'def\nghi ', Wasavi.registers('"'));
	assertEquals('#2-2', 'abc XYZfoo\nbaz', Wasavi.value);
	assertPos('#2-3', [0, 6]);
}

function testChangeSearchForwardPrev_1 () {
	Wasavi.send('i', [
		'    def',		// foo
		'foo',          // baz
		'baz'			//
	].join('\n'), '\u001b');

	Wasavi.send('1G1|/def\n');
	assertPos('#1-1', [0, 4]);

	Wasavi.send('2G1|cNXYZ\u001b');
	assertEquals('#2-1', '    def\n', Wasavi.registers('"'));
	assertEquals('#2-2', 'XYZ\nfoo\nbaz', Wasavi.value);
	assertPos('#2-2', [0, 2]);
}

function testChangeSearchForwardPrev_2 () {
	Wasavi.send('i', [
		'abc def',		// abc XYZ
		'foo',			// foo
		'baz'			// baz
	].join('\n'), '\u001b');

	Wasavi.send('1G1|/def\n');
	assertPos('#1-1', [0, 4]);

	Wasavi.send('2G1|cNXYZ\u001b');
	assertEquals('#2-1', 'def', Wasavi.registers('"'));
	assertEquals('#2-2', 'abc XYZ\nfoo\nbaz', Wasavi.value);
	assertPos('#2-3', [0, 6]);
}

function testChangeSearchForwardPrev_3 () {
	Wasavi.send('i', [
		'    def',		//    XYZfoo
		'ghi foo',		// baz
		'baz'
	].join('\n'), '\u001b');

	Wasavi.send('1G1|/def\n');
	assertPos('#1-1', [0, 4]);

	Wasavi.send('2G5|cNXYZ\u001b');
	assertEquals('#2-1', 'def\nghi ', Wasavi.registers('"'));
	assertEquals('#2-2', '    XYZfoo\nbaz', Wasavi.value);
	assertPos('#2-3', [0, 6]);
}

function testChangeSearchForwardPrev_4 () {
	Wasavi.send('i', [
		'abc def',		// abc XYZfoo
		'ghi foo',		// baz
		'baz'
	].join('\n'), '\u001b');

	Wasavi.send('G?def\n');
	assertPos('#1-1', [0, 4]);

	Wasavi.send('2G5|cNXYZ\u001b');
	assertEquals('#2-1', 'def\nghi ', Wasavi.registers('"'));
	assertEquals('#2-2', 'abc XYZfoo\nbaz', Wasavi.value);
	assertPos('#2-2', [0, 6]);
}

function testChangeSearchBackwardNext_1 () {
	Wasavi.send('i', [
		'    def',		// XYZ
		'foo',          // baz
		'baz'			//
	].join('\n'), '\u001b');

	Wasavi.send('G?def\n');
	assertPos('#1-1', [0, 4]);

	Wasavi.send('2G1|cnXYZ\u001b');
	assertEquals('#2-1', '    def\n', Wasavi.registers('"'));
	assertEquals('#2-2', 'XYZ\nfoo\nbaz', Wasavi.value);
	assertPos('#2-3', [0, 2]);
}

function testChangeSearchBackwardNext_2 () {
	Wasavi.send('i', [
		'abc def',		// abc XYZ
		'foo',			// foo
		'baz'			// baz
	].join('\n'), '\u001b');

	Wasavi.send('G?def\n');
	assertPos('#1-1', [0, 4]);

	Wasavi.send('2G1|cnXYZ\u001b');
	assertEquals('#2-1', 'def', Wasavi.registers('"'));
	assertEquals('#2-2', 'abc XYZ\nfoo\nbaz', Wasavi.value);
	assertPos('#2-3', [0, 6]);
}

function testChangeSearchBackwardNext_3 () {
	Wasavi.send('i', [
		'    def',		//     XYZfoo
		'ghi foo',		// baz
		'baz'
	].join('\n'), '\u001b');

	Wasavi.send('G?def\n');
	assertPos('#1-1', [0, 4]);

	Wasavi.send('2G5|cnXYZ\u001b');
	assertEquals('#2-1', 'def\nghi ', Wasavi.registers('"'));
	assertEquals('#2-2', '    XYZfoo\nbaz', Wasavi.value);
	assertPos('#2-3', [0, 6]);
}

function testChangeSearchBackwardNext_4 () {
	Wasavi.send('i', [
		'abc def',		// abc foo
		'ghi foo',		// baz
		'baz'
	].join('\n'), '\u001b');

	Wasavi.send('G?def\n');
	assertPos('#1-1', [0, 4]);

	Wasavi.send('2G5|cnXYZ\u001b');
	assertEquals('#2-1', 'def\nghi ', Wasavi.registers('"'));
	assertEquals('#2-2', 'abc XYZfoo\nbaz', Wasavi.value);
	assertPos('#2-3', [0, 6]);
}

function testChangeSearchBackwardPrev_1 () {
	Wasavi.send('i', [
		'    def',		// XYZ
		'foo',          // foo
		'baz'			// baz
	].join('\n'), '\u001b');

	Wasavi.send('G?foo\n');
	assertPos('#1-1', [1, 0]);

	Wasavi.send('1G5|cNXYZ\u001b');
	assertEquals('#2-1', '    def\n', Wasavi.registers('"'));
	assertEquals('#2-2', 'XYZ\nfoo\nbaz', Wasavi.value);
	assertPos('#2-2', [0, 2]);
}

function testChangeSearchBackwardPrev_2 () {
	Wasavi.send('i', [
		'abc def',		// abc XYZ
		'foo',			// foo
		'baz'			// baz
	].join('\n'), '\u001b');

	Wasavi.send('G?foo\n');
	assertPos('#1-1', [1, 0]);

	Wasavi.send('1G5|cNXYZ\u001b');
	assertEquals('#2-1', 'def', Wasavi.registers('"'));
	assertEquals('#2-2', 'abc XYZ\nfoo\nbaz', Wasavi.value);
	assertPos('#2-3', [0, 6]);
}

function testChangeSearchBackwardPrev_3 () {
	Wasavi.send('i', [
		'    def',		//    XYZfoo
		'ghi foo',		// baz
		'baz'
	].join('\n'), '\u001b');

	Wasavi.send('G?foo\n');
	assertPos('#1-1', [1, 4]);

	Wasavi.send('1G5|cNXYZ\u001b');
	assertEquals('#2-1', 'def\nghi ', Wasavi.registers('"'));
	assertEquals('#2-2', '    XYZfoo\nbaz', Wasavi.value);
	assertPos('#2-2', [0, 6]);
}

function testChangeSearchBackwardPrev_4 () {
	Wasavi.send('i', [
		'abc def',		// abc foo
		'ghi foo',		// baz
		'baz'
	].join('\n'), '\u001b');

	Wasavi.send('G?foo\n');
	assertPos('#1-1', [1, 4]);

	Wasavi.send('1G5|cNXYZ\u001b');
	assertEquals('#2-1', 'def\nghi ', Wasavi.registers('"'));
	assertEquals('#2-2', 'abc XYZfoo\nbaz', Wasavi.value);
	assertPos('#2-3', [0, 6]);
}

/* vim:set ts=4 sw=4 fileencoding=UTF-8 fileformat=unix filetype=javascript : */
