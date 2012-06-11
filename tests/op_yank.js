/**
 * wasavi: vi clone implemented in javascript
 * =============================================================================
 *
 *
 * @author akahuku@gmail.com
 * @version $Id: op_yank.js 132 2012-06-05 15:44:16Z akahuku $
 */

/**
 * tests
 */

function testYank () {
	Wasavi.send('i', '1\n2', '\u001bgg');

	Wasavi.send('yy');
	assertEquals('#1-1', '1\n', Wasavi.registers('"'));
	assertPos('#1-2', [0, 0]);

	Wasavi.send('y2y');
	assertEquals('#2-1', '1\n2\n', Wasavi.registers('"'));
	assertPos('#2-2', [0, 0]);

	Wasavi.send('2yy');
	assertEquals('#3-1', '1\n2\n', Wasavi.registers('"'));
	assertPos('#3-2', [0, 0]);

	Wasavi.send('3yy');
	assertEquals('#4-1', '1\n2\n', Wasavi.registers('"'));
	assertPos('#4-2', [0, 0]);
}

function testYankUpLine (a) {
	a || (a = '-');

	Wasavi.send('iline\n\tline2\n\t\tline3\u001b');
	assertEquals('line\n\tline2\n\t\tline3', Wasavi.value);

	Wasavi.send('3G');
	assertPos('#1-1', [2, 2]);

	Wasavi.send('y', a);
	assertPos('#2-1', [1, 1]);
	assertEquals('#2-2', '\tline2\n\t\tline3\n', Wasavi.registers('"'));
	assertEquals('#2-3', '\tline2\n\t\tline3\n', Wasavi.registers('1'));

	Wasavi.send('y', a);
	assertPos('#2-1', [0, 0]);
	assertEquals('#3-2', 'line\n\tline2\n', Wasavi.registers('"'));
	assertEquals('#3-3', 'line\n\tline2\n', Wasavi.registers('1'));
	assertEquals('#3-4', '\tline2\n\t\tline3\n', Wasavi.registers('2'));

	Wasavi.send('y', a);
	assertPos('#4-1', [0, 0]);
	assertEquals('#4-2', 'line\n\tline2\n', Wasavi.registers('"'));
	assert('#4-3', Wasavi.lastMessage != '');
}

function testYankDownLine (a) {
	a || (a = '+');

	Wasavi.send('iline\n\tline2\n\t\tline3\u001b');
	assertEquals('line\n\tline2\n\t\tline3', Wasavi.value);

	Wasavi.send('gg');
	assertPos('#1-1', [0, 0]);

	Wasavi.send('y', a);
	assertPos('#2-1', [0, 0]);
	assertEquals('#2-2', 'line\n\tline2\n', Wasavi.registers('"'));
	assertEquals('#2-3', 'line\n\tline2\n', Wasavi.registers('1'));

	Wasavi.send('y2', a);
	assertPos('#2-1', [0, 0]);
	assertEquals('#3-2', 'line\n\tline2\n\t\tline3\n', Wasavi.registers('"'));
	assertEquals('#3-3', 'line\n\tline2\n\t\tline3\n', Wasavi.registers('1'));
	assertEquals('#3-4', 'line\n\tline2\n', Wasavi.registers('2'));

	Wasavi.send('3Gy', a);
	assertPos('#4-1', [2, 2]);
	assertEquals('#4-2', 'line\n\tline2\n\t\tline3\n', Wasavi.registers('"'));
	assert('#4-3', Wasavi.lastMessage != '');
}

function testYankDownEnter () {
	testYankDownLine(Wasavi.SPECIAL_KEYS.ENTER);
}

function testYankFirstNonWhiteCharOfLine (a) {
	a || (a = '^');

	Wasavi.send('i', '\tfoobar', '\u001b');
	Wasavi.send('y', a);

	assertEquals('#1-1', '\tfoobar', Wasavi.value);
	assertEquals('#1-2', 'fooba', Wasavi.registers('"'));
	assertPos('#1-3', [0, 1]);

	// if selected string is empty, register should not be modified.
	Wasavi.send('y', a);
	assertEquals('#2-1', 'fooba', Wasavi.registers('"'));
	assertPos('#2-2', [0, 1]);
}

function testYankHome () {
	testYankFirstNonWhiteCharOfLine(Wasavi.SPECIAL_KEYS.HOME);
}

function testYankTopOfLine () {
	Wasavi.send('i', '\tfoobar', '\u001b');
	Wasavi.send('y0');

	assertEquals('#1-1', '\tfooba', Wasavi.registers('"'));
	assertPos('#1-2', [0, 0]);
}

function testYankTailOfLine (a) {
	a || (a = '$');

	Wasavi.send('i', '\tfoobar', '\u001b1|');
	Wasavi.send('y', a);

	assertEquals('#1-1', '\tfoobar', Wasavi.registers('"'));
	assertPos('#1-2', [0, 0]);
}

function testYankEnd () {
	testYankTailOfLine(Wasavi.SPECIAL_KEYS.END);
}

function testYankDirectColumn () {
	Wasavi.send('i', '0123456789\n0123456789', '\u001b1G1|');

	Wasavi.send('y5|');
	assertEquals('#1-1', '0123', Wasavi.registers('"'));
	assertPos('#1-2', [0, 0]);

	Wasavi.send('$y3|');
	assertEquals('#2-1', '2345678', Wasavi.registers('"'));
	assertPos('#2-2', [0, 2]);

	Wasavi.send('2G1|y100|');
	assertEquals('#3-1', '0123456789', Wasavi.registers('"'));
	assertPos('#3-2', [1, 0]);
}

function testYankJumpToMatchedParenthes () {
	Wasavi.send('i', 'this is (first) line.\nthis is (second) line)', '\u001b');

	Wasavi.send('1G1|f(y%');
	assertEquals('#1-1', '(first)', Wasavi.registers('"'));
	assertPos('#1-2', [0, 8]);

	Wasavi.send('2G1|f)y%');
	assertEquals('#2-1', '(second)', Wasavi.registers('"'));
	assertPos('#2-2', [1, 8]);

	Wasavi.send('G$y%');
	assertEquals('#3-1', '(second)', Wasavi.registers('"'));
	assertPos('#3-2', [1, 21]);
	assert('#3-3', Wasavi.lastMessage != '');
}

function testYankSearchForward () {
	Wasavi.send('i', 'find the\nchar4cter in cu4rent 4line', '\u001b1G1|');

	Wasavi.send('y/4\n');
	assertEquals('#1-1', 'find the\nchar', Wasavi.registers('"'));
	assertPos('#1-2', [0, 0]);

	Wasavi.send('2y/4\n');
	assertEquals('#2-1', 'find the\nchar4cter in cu', Wasavi.registers('"'));
	assertPos('#2-2', [0, 0]);

	Wasavi.send('2y/X\n');
	assertEquals('#3-1', 'find the\nchar4cter in cu', Wasavi.registers('"'));
	assertPos('#3-2', [0, 0]);
	assert('#3-3', Wasavi.lastMessage != '');
}

function testYankSearchBackward () {
	Wasavi.send('i', 'find the char4cter in cu4rent\n4line', '\u001b');

	Wasavi.send('G$y?4\n');
	assertEquals('#1-1', '4lin', Wasavi.registers('"'));
	assertPos('#1-2', [1, 0]);

	Wasavi.send('G$2y?4\n');
	assertEquals('#2-1', '4rent\n4lin', Wasavi.registers('"'));
	assertPos('#2-2', [0, 24]);

	Wasavi.send('G$2y?X\n');
	assertEquals('#3-1', '4rent\n4lin', Wasavi.registers('"'));
	assertPos('#3-2', [1, 4]);
	assert('#3-3', Wasavi.lastMessage != '');
}

function testYankFindForward () {
	Wasavi.send('i', 'find the char4cter in cu4rent 4line', '\u001b1G1|');

	Wasavi.send('yf4');
	assertEquals('#1-1', 'find the char4', Wasavi.registers('"'));
	assertPos('#1-2', [0, 0]);

	Wasavi.send('2yf4');
	assertEquals('#2-1', 'find the char4cter in cu4', Wasavi.registers('"'));
	assertPos('#2-2', [0, 0]);

	Wasavi.send('4yf4');
	assertEquals('#3-1', 'find the char4cter in cu4', Wasavi.registers('"'));
	assertPos('#3-2', [0, 0]);
	assert('#3-3', Wasavi.lastMessage != '');
}

function testYankFindBackward () {
	Wasavi.send('i', 'find the char4cter in cu4rent 4line', '\u001b');

	Wasavi.send('yF4');
	assertEquals('#1-1', '4lin', Wasavi.registers('"'));
	assertPos('#1-2', [0, 30]);

	Wasavi.send('2yF4');
	assertEquals('#2-1', '4cter in cu4rent ', Wasavi.registers('"'));
	assertPos('#2-2', [0, 13]);

	Wasavi.send('yF4');
	assertEquals('#3-1', '4cter in cu4rent ', Wasavi.registers('"'));
	assertPos('#3-2', [0, 13]);
	assert('#3-3', Wasavi.lastMessage != '');
}

function testYankFindFowardBeforeStop () {
	Wasavi.send('i', 'find the char4cter in cu4rent 4line', '\u001b1G1|');

	Wasavi.send('yt4');
	assertEquals('#1-1', 'find the char', Wasavi.registers('"'));
	assertPos('#1-2', [0, 0]);

	Wasavi.send('2yt4');
	assertEquals('#2-1', 'find the char4cter in cu', Wasavi.registers('"'));
	assertPos('#2-2', [0, 0]);

	Wasavi.send('4yt4');
	assertEquals('#3-1', 'find the char4cter in cu', Wasavi.registers('"'));
	assertPos('#3-2', [0, 0]);
	assert('#3-3', Wasavi.lastMessage != '');
}

function testYankFindBackwardBeforeStop () {
	Wasavi.send('i', 'find the char4cter in cu4rent 4line', '\u001b');
	
	Wasavi.send('yT4');
	assertEquals('#1-1', 'lin', Wasavi.registers('"'));
	assertPos('#1-2', [0, 31]);

	Wasavi.send('yT4');
	assertEquals('#2-1', 'lin', Wasavi.registers('"'));
	assertPos('#2-2', [0, 31]);

	Wasavi.send('y2T4');
	assertEquals('#3-1', 'rent 4', Wasavi.registers('"'));
	assertPos('#3-2', [0, 25]);

	Wasavi.send('y3T4');
	assertEquals('#4-1', 'rent 4', Wasavi.registers('"'));
	assertPos('#4-2', [0, 25]);
	assert('#4-3', Wasavi.lastMessage != '');
}

function testYankFindInvert () {
	Wasavi.send('4i', 'fi4st s4cond th4rd fou4th\n', '\u001b');

	Wasavi.send('1G1|yf4$y,');
	assertEquals('#1-1', '4t', Wasavi.registers('"'));
	assertPos('#1-2', [0, 22]);

	Wasavi.send('2G1|yt4$y,');
	assertEquals('#2-1', 't', Wasavi.registers('"'));
	assertPos('#2-2', [1, 23]);

	Wasavi.send('3G$yF40y,');
	assertEquals('#3-1', 'fi4', Wasavi.registers('"'));
	assertPos('#3-2', [2, 0]);

	Wasavi.send('4G$yT40y,');
	assertEquals('#4-1', 'fi', Wasavi.registers('"'));
	assertPos('#4-2', [3, 0]);
}

function testYankFindRepeat () {
	Wasavi.send('4i', 'fi4st s4cond th4rd fou4th\n', '\u001b');

	Wasavi.send('1G1|yf43|y;');
	assertEquals('#1-1', '4st s4', Wasavi.registers('"'));
	assertPos('#1-2', [0, 2]);

	Wasavi.send('2G1|yt43|y;');
	assertEquals('#2-1', '4st s', Wasavi.registers('"'));
	assertPos('#2-2', [1, 2]);

	Wasavi.send('3G$yF4y;');
	assertEquals('#3-1', '4rd fou', Wasavi.registers('"'));
	assertPos('#3-2', [2, 15]);

	Wasavi.send('4G$yT4y;');
	assertEquals('#4-1', 'rd fou4', Wasavi.registers('"'));
	assertPos('#4-2', [3, 16]);
}

function testYankDownLineOrient () {
	Wasavi.send('i', '\t1foobar\n\t2foobar', '\u001bgg');

	Wasavi.send('y_');
	assertEquals('#1-1', '\t1foobar\n', Wasavi.registers('"'));
	assertPos('#1-2', [0, 1]);

	Wasavi.send('y2_');
	assertEquals('#2-1', '\t1foobar\n\t2foobar\n', Wasavi.registers('"'));
	assertPos('#2-2', [0, 1]);

	Wasavi.send('rXy3_');
	assertEquals('#3-1', '\tXfoobar\n\t2foobar\n', Wasavi.registers('"'));
	assertPos('#3-2', [0, 1]);
}

function testYankMark () {
	Wasavi.send('i', 'foo1bar\nbaz3bax', '\u001b');

	Wasavi.send('1G0f1ma0y`a');
	assertEquals('#1-1', 'foo', Wasavi.registers('"'));
	assertPos('#1-2', [0, 0]);

	Wasavi.send('2G$F3ma$y`a');
	assertEquals('#2-1', '3ba', Wasavi.registers('"'));
	assertPos('#2-2', [1, 3]);
}

function testYankMarkLineOrient () {
	Wasavi.send('i', '1\n2\n3\n4\n5\n6\n7', '\u001b');

	Wasavi.send('3Gma1Gy\'a');
	assertEquals('#1-1', '1\n2\n3\n', Wasavi.registers('"'));
	assertPos('#1-2', [0, 0]);

	Wasavi.send('5GmaGy\'a');
	assertEquals('#2-1', '5\n6\n7\n', Wasavi.registers('"'));
	assertPos('#2-2', [4, 0]);
}

function testYankSectionForward () {
	// TBD
}

function testYankSectionBackward () {
	// TBD
}

function testYankParagraphForward () {
	// TBD
}

function testYankParagraphBackward () {
	// TBD
}

function testYankSentenceForward () {
	// TBD
}

function testYankSentenceBackward () {
	// TBD
}

function testYankDown (a) {
	a || (a = 'j');

	Wasavi.send('i', 'first\nsecond\nthird\nf\nfifth', '\u001b');
	Wasavi.send('2G3|y10', a);
	assertEquals('#1-1', 'second\nthird\nf\nfifth\n', Wasavi.registers('"'));
	assertPos('#1-2', [1, 2]);
	assert('#1-3', Wasavi.lastMessage == '');
	assertEquals('#1-4', 'second\nthird\nf\nfifth\n', Wasavi.registers('1'));
	assertEquals('#1-5', 'first\nsecond\nthird\nf\nfifth', Wasavi.value);

	Wasavi.send('2G3|y', a);
	assertEquals('#2-1', 'second\nthird\n', Wasavi.registers('"'));
	assertEquals('#2-2', 'second\nthird\n', Wasavi.registers('1'));
	assertEquals('#2-3', 'second\nthird\nf\nfifth\n', Wasavi.registers('2'));
	assertEquals('#2-4', 'first\nsecond\nthird\nf\nfifth', Wasavi.value);
	assertPos('#2-5', [1, 2]);
}

function testYankDownCtrlN () {
	testYankDown('\u000e');
}

function testYankDownDown () {
	testYankDown(Wasavi.SPECIAL_KEYS.DOWN);
}

function testYankUp (a) {
	a || (a = 'k');

	Wasavi.send('i', 'first\nsecond\nt', '\u001b');

	Wasavi.send('2G3|y10', a);
	assertEquals('#1-1', 'first\nsecond\n', Wasavi.registers('"'));
	assertPos('#1-2', [0, 2]);
	assert('#1-3', Wasavi.lastMessage == '');

	Wasavi.send('3G1|y', a);
	assertEquals('#2-1', 'second\nt\n', Wasavi.registers('"'));
	assertEquals('#2-2', 'second\nt\n', Wasavi.registers('1'));
	assertEquals('#2-3', 'first\nsecond\n', Wasavi.registers('2'));
	assertPos('#2-4', [1, 0]);
}

function testYankUpCtrlP () {
	testYankUp('\u0010');
}

function testYankUpUp () {
	testYankUp(Wasavi.SPECIAL_KEYS.UP);
}

function testYankLeft (a) {
	a || (a = 'h');

	Wasavi.send('i', 'foo bar baz', '\u001b');
	assertPos('#1-1', [0, 10]);

	Wasavi.send('y', a);
	assertEquals('#2-1', 'a', Wasavi.registers('"'));
	assertPos('#2-2', [0, 9]);

	Wasavi.send('y2', a);
	assertEquals('#3-1', ' b', Wasavi.registers('"'));
	assertPos('#3-2', [0, 7]);

	Wasavi.send('y100', a);
	assertEquals('#4-1', 'foo bar', Wasavi.registers('"'));
	assertPos('#4-2', [0, 0]);
}

function testYankLeftCtrlH () {
	testYankLeft('\u0008');
}

function testYankLeftLeft () {
	testYankLeft(Wasavi.SPECIAL_KEYS.LEFT);
}

function testYankRight (a) {
	a || (a = 'l');

	Wasavi.send('i', 'foo bar baz', '\u001b1|');
	assertPos('#1-1', [0, 0]);

	Wasavi.send('y', a);
	assertEquals('#2-1', 'foo bar baz', Wasavi.value);
	assertPos('#2-2', [0, 0]);
	assertEquals('#2-3', 'f', Wasavi.registers('"'));

	Wasavi.send('"ay2', a);
	assertEquals('#3-1', 'foo bar baz', Wasavi.value);
	assertPos('#3-2', [0, 0]);
	assertEquals('#3-3', 'fo', Wasavi.registers('a'));
	assertEquals('#3-4', 'fo', Wasavi.registers('"'));

	Wasavi.send('y5', a);
	assertEquals('#4-1', 'foo bar baz', Wasavi.value);
	assertPos('#4-2', [0, 0]);
	assertEquals('#4-3', 'foo b', Wasavi.registers('"'));

	Wasavi.send('y100', a);
	assertEquals('#5-1', 'foo bar baz', Wasavi.value);
	assertPos('#5-2', [0, 0]);
	assertEquals('#5-3', 'foo bar baz', Wasavi.registers('"'));
}

function testYankRightSpace () {
	testYankRight(' ');
}

function testYankRightRight () {
	testYankRight(Wasavi.SPECIAL_KEYS.RIGHT);
}

function testYankWordForward () {
	Wasavi.send('i', 'foo bar baz\nbax', '\u001b1|gg');

	Wasavi.send('yw');
	assertEquals('#1-1', 'foo bar baz\nbax', Wasavi.value);
	assertPos('#1-2', [0, 0]);
	assertEquals('#1-3', 'foo ', Wasavi.registers('"'));

	Wasavi.send('y2w');
	assertEquals('#2-1', 'foo bar baz\nbax', Wasavi.value);
	assertPos('#2-2', [0, 0]);
	assertEquals('#2-3', 'foo bar ', Wasavi.registers('"'));

	Wasavi.send('y3w');
	assertEquals('#3-1', 'foo bar baz\nbax', Wasavi.value);
	assertPos('#3-2', [0, 0]);
	assertEquals('#3-3', 'foo bar baz', Wasavi.registers('"'));

	Wasavi.send('y4w');
	assertEquals('#4-1', 'foo bar baz\nbax', Wasavi.value);
	assert('#4-2', Wasavi.lastMessage == '');
	assertPos('#4-3', [0, 0]);
	assertEquals('#4-4', 'foo bar baz\nbax', Wasavi.registers('"'));
}

function testYankWordBackward () {
	Wasavi.send('i', 'foo\nbar baz bax', '\u001b');

	Wasavi.send('yb');
	assertEquals('#1-1', 'foo\nbar baz bax', Wasavi.value);
	assertPos('#1-2', [1, 8]);
	assertEquals('#1-3', 'ba', Wasavi.registers('"'));

	Wasavi.send('y2b');
	assertEquals('#2-1', 'foo\nbar baz bax', Wasavi.value);
	assertPos('#2-2', [1, 0]);
	assertEquals('#2-3', 'bar baz ', Wasavi.registers('"'));

	Wasavi.send('yb');
	assertEquals('#3-1', 'foo\nbar baz bax', Wasavi.value);
	assertPos('#3-2', [0, 0]);
	assertEquals('#3-3', 'foo\n', Wasavi.registers('"'));
}

function testYankBigwordForward () {
	Wasavi.send('i', 'f#o b#r b#z\nb#x', '\u001b1|gg');

	Wasavi.send('yW');
	assertEquals('#1-1', 'f#o b#r b#z\nb#x', Wasavi.value);
	assertPos('#1-2', [0, 0]);
	assertEquals('#1-3', 'f#o ', Wasavi.registers('"'));

	Wasavi.send('y2W');
	assertEquals('#2-1', 'f#o b#r b#z\nb#x', Wasavi.value);
	assertPos('#2-2', [0, 0]);
	assertEquals('#2-3', 'f#o b#r ', Wasavi.registers('"'));

	Wasavi.send('y3W');
	assertEquals('#3-1', 'f#o b#r b#z\nb#x', Wasavi.value);
	assertPos('#3-2', [0, 0]);
	assertEquals('#3-3', 'f#o b#r b#z', Wasavi.registers('"'));

	Wasavi.send('y4W');
	assertEquals('#4-1', 'f#o b#r b#z\nb#x', Wasavi.value);
	assert('#4-2', Wasavi.lastMessage == '');
	assertPos('#4-3', [0, 0]);
	assertEquals('#4-4', 'f#o b#r b#z\nb#x', Wasavi.registers('"'));
}

function testYankBigwordBackward () {
	Wasavi.send('i', 'f#o\nb#r b#z b#x', '\u001b');

	Wasavi.send('yB');
	assertEquals('#1-1', 'f#o\nb#r b#z b#x', Wasavi.value);
	assertPos('#1-2', [1, 8]);
	assertEquals('#1-3', 'b#', Wasavi.registers('"'));

	Wasavi.send('y2B');
	assertEquals('#2-1', 'f#o\nb#r b#z b#x', Wasavi.value);
	assertPos('#2-2', [1, 0]);
	assertEquals('#2-3', 'b#r b#z ', Wasavi.registers('"'));

	Wasavi.send('yB');
	assertEquals('#3-1', 'f#o\nb#r b#z b#x', Wasavi.value);
	assertPos('#3-2', [0, 0]);
	assertEquals('#3-3', 'f#o\n', Wasavi.registers('"'));
}

function testYankWordEnd () {
	Wasavi.send('i', 'foo bar\nbaz\nbax', '\u001bgg');

	Wasavi.send('ye');
	assertEquals('#1-1', 'foo', Wasavi.registers('"'));
	assertPos('#1-2', [0, 0]);

	Wasavi.send('y2e');
	assertEquals('#2-1', 'foo bar', Wasavi.registers('"'));
	assertPos('#2-2', [0, 0]);

	Wasavi.send('gg3e');
	assertPos('#3-x-1', [1, 2]);
	Wasavi.send('ggy3e');
	assertEquals('#3-1', 'foo bar\nbaz', Wasavi.registers('"'));
	assertPos('#3-2', [0, 0]);
}

function testYankBigwordEnd () {
	Wasavi.send('i', 'f@o b@r\nb@z\nb@x', '\u001bgg');

	Wasavi.send('yE');
	assertEquals('#1-1', 'f@o', Wasavi.registers('"'));
	assertPos('#1-2', [0, 0]);

	Wasavi.send('y2E');
	assertEquals('#2-1', 'f@o b@r', Wasavi.registers('"'));
	assertPos('#2-2', [0, 0]);

	Wasavi.send('gg3E');
	assertPos('#3-x-1', [1, 2]);
	Wasavi.send('ggy3E');
	assertEquals('#3-1', 'f@o b@r\nb@z', Wasavi.registers('"'));
	assertPos('#3-2', [0, 0]);
}

function testYankGotoPrefix () {
	Wasavi.send('i', ' 1\n2\n 3', '\u001b');

	Wasavi.send('ygg');
	assertEquals('#1-1', ' 1\n2\n 3\n', Wasavi.registers('"'));
	assertEquals('#1-2', ' 1\n2\n 3\n', Wasavi.registers('1'));
	assertPos('#1-3', [0, 1]);
}

function testYankTopOfView () {
	makeScrollableBuffer(2);

	var rowLength = Wasavi.rowLength;
	Wasavi.send('GH');
	var viewLines = Wasavi.rowLength - Wasavi.row;

	Wasavi.send('GyH');
	assertEquals(Wasavi.registers('"').replace(/\n$/, '').split('\n').length, viewLines);

}

function testYankMiddleOfView () {
	makeScrollableBuffer(2);

	var rowLength = Wasavi.rowLength;
	Wasavi.send('ggM');
	var viewLines = Wasavi.row + 1;

	Wasavi.send('ggyM');
	assertEquals('#1', Wasavi.registers('"').split('\n').length - 1, viewLines);

	var rowLength = Wasavi.rowLength;
	Wasavi.send('GM');
	var viewLines = Wasavi.rowLength - Wasavi.row;

	Wasavi.send('GyM');
	assertEquals('#2', Wasavi.registers('"').split('\n').length - 1, viewLines);
}

function testYankBottomOfView () {
	makeScrollableBuffer(2);

	var rowLength = Wasavi.rowLength;
	Wasavi.send('ggL');
	var viewLines = Wasavi.row + 1;

	Wasavi.send('ggyL');
	assertEquals(Wasavi.registers('"').replace(/\n$/, '').split('\n').length, viewLines);
}

function testYankGoto () {
	Wasavi.send('i', '\t1\n\t2\n\t3\n\t4\n\t5\n\t6\n\t7', '\u001b');

	Wasavi.send('ggy3G');
	assertEquals('#1-1', '\t1\n\t2\n\t3\n', Wasavi.registers('"'));
	assertEquals('#1-2', '\t1\n\t2\n\t3\n', Wasavi.registers('1'));
	assertPos('#1-3', [0, 1]);

	Wasavi.send('Gy5G');
	assertEquals('#2-1', '\t5\n\t6\n\t7\n', Wasavi.registers('"'));
	assertEquals('#2-2', '\t5\n\t6\n\t7\n', Wasavi.registers('1'));
	assertEquals('#2-3', '\t1\n\t2\n\t3\n', Wasavi.registers('2'));
	assertPos('#2-4', [4, 1]);
}

function testYankSearchForwardNext_1 () {
	Wasavi.send('i', [
		'    def',		// foo
		'foo',          // baz
		'baz'			//
	].join('\n'), '\u001b');

	Wasavi.send('1G1|/foo\n');
	assertPos('#1-1', [1, 0]);

	Wasavi.send('1G5|yn');
	assertEquals('#2-1', 'def\n', Wasavi.registers('"'));
	assertPos('#2-2', [0, 4]);
}

function testYankSearchForwardNext_2 () {
	Wasavi.send('i', [
		'abc def',		// abc
		'foo',			// foo
		'baz'			// baz
	].join('\n'), '\u001b');

	Wasavi.send('1G1|/foo\n');
	assertPos('#1-1', [1, 0]);

	Wasavi.send('1G5|yn');
	assertEquals('#2-1', 'def\n', Wasavi.registers('"'));
	assertPos('#2-2', [0, 4]);
}

function testYankSearchForwardNext_3 () {
	Wasavi.send('i', [
		'    def',		//    foo
		'ghi foo',		// baz
		'baz'
	].join('\n'), '\u001b');

	Wasavi.send('1G1|/foo\n');
	assertPos('#1-1', [1, 4]);

	Wasavi.send('1G5|yn');
	assertEquals('#2-1', 'def\nghi ', Wasavi.registers('"'));
	assertPos('#2-2', [0, 4]);
}

function testYankSearchForwardNext_4 () {
	Wasavi.send('i', [
		'abc def',		// abc foo
		'ghi foo',		// baz
		'baz'
	].join('\n'), '\u001b');

	Wasavi.send('1G1|/foo\n');
	assertPos('#1-1', [1, 4]);

	Wasavi.send('1G5|yn');
	assertEquals('#2-1', 'def\nghi ', Wasavi.registers('"'));
	assertPos('#2-2', [0, 4]);
}

function testYankSearchForwardPrev_1 () {
	Wasavi.send('i', [
		'    def',		// foo
		'foo',          // baz
		'baz'			//
	].join('\n'), '\u001b');

	Wasavi.send('1G1|/def\n');
	assertPos('#1-1', [0, 4]);

	Wasavi.send('2G1|yN');
	assertEquals('#2-1', 'def\n', Wasavi.registers('"'));
	assertPos('#2-2', [0, 4]);
}

function testYankSearchForwardPrev_2 () {
	Wasavi.send('i', [
		'abc def',		// abc
		'foo',			// foo
		'baz'			// baz
	].join('\n'), '\u001b');

	Wasavi.send('1G1|/def\n');
	assertPos('#1-1', [0, 4]);

	Wasavi.send('2G1|yN');
	assertEquals('#2-1', 'def\n', Wasavi.registers('"'));
	assertPos('#2-2', [0, 4]);
}

function testYankSearchForwardPrev_3 () {
	Wasavi.send('i', [
		'    def',		//    foo
		'ghi foo',		// baz
		'baz'
	].join('\n'), '\u001b');

	Wasavi.send('1G1|/def\n');
	assertPos('#1-1', [0, 4]);

	Wasavi.send('2G5|yN');
	assertEquals('#2-1', 'def\nghi ', Wasavi.registers('"'));
	assertPos('#2-2', [0, 4]);
}

function testYankSearchForwardPrev_4 () {
	Wasavi.send('i', [
		'abc def',		// abc foo
		'ghi foo',		// baz
		'baz'
	].join('\n'), '\u001b');

	Wasavi.send('G?def\n');
	assertPos('#1-1', [0, 4]);

	Wasavi.send('2G5|yN');
	assertEquals('#2-1', 'def\nghi ', Wasavi.registers('"'));
	assertPos('#2-2', [0, 4]);
}

function testYankSearchBackwardNext_1 () {
	Wasavi.send('i', [
		'    def',		// foo
		'foo',          // baz
		'baz'			//
	].join('\n'), '\u001b');

	Wasavi.send('G?def\n');
	assertPos('#1-1', [0, 4]);

	Wasavi.send('2G1|yn');
	assertEquals('#2-1', 'def\n', Wasavi.registers('"'));
	assertPos('#2-2', [0, 4]);
}

function testYankSearchBackwardNext_2 () {
	Wasavi.send('i', [
		'abc def',		// abc
		'foo',			// foo
		'baz'			// baz
	].join('\n'), '\u001b');

	Wasavi.send('G?def\n');
	assertPos('#1-1', [0, 4]);

	Wasavi.send('2G1|yn');
	assertEquals('#2-1', 'def\n', Wasavi.registers('"'));
	assertPos('#2-2', [0, 4]);
}

function testYankSearchBackwardNext_3 () {
	Wasavi.send('i', [
		'    def',		//    foo
		'ghi foo',		// baz
		'baz'
	].join('\n'), '\u001b');

	Wasavi.send('G?def\n');
	assertPos('#1-1', [0, 4]);

	Wasavi.send('2G5|yn');
	assertEquals('#2-1', 'def\nghi ', Wasavi.registers('"'));
	assertPos('#2-2', [0, 4]);
}

function testYankSearchBackwardNext_4 () {
	Wasavi.send('i', [
		'abc def',		// abc foo
		'ghi foo',		// baz
		'baz'
	].join('\n'), '\u001b');

	Wasavi.send('G?def\n');
	assertPos('#1-1', [0, 4]);

	Wasavi.send('2G5|yn');
	assertEquals('#2-1', 'def\nghi ', Wasavi.registers('"'));
	assertPos('#2-2', [0, 4]);
}

function testYankSearchBackwardPrev_1 () {
	Wasavi.send('i', [
		'    def',		// foo
		'foo',          // baz
		'baz'			//
	].join('\n'), '\u001b');

	Wasavi.send('G?foo\n');
	assertPos('#1-1', [1, 0]);

	Wasavi.send('1G5|yN');
	assertEquals('#2-1', 'def\n', Wasavi.registers('"'));
	assertPos('#2-2', [0, 4]);
}

function testYankSearchBackwardPrev_2 () {
	Wasavi.send('i', [
		'abc def',		// abc
		'foo',			// foo
		'baz'			// baz
	].join('\n'), '\u001b');

	Wasavi.send('G?foo\n');
	assertPos('#1-1', [1, 0]);

	Wasavi.send('1G5|yN');
	assertEquals('#2-1', 'def\n', Wasavi.registers('"'));
	assertPos('#2-2', [0, 4]);
}

function testYankSearchBackwardPrev_3 () {
	Wasavi.send('i', [
		'    def',		//    foo
		'ghi foo',		// baz
		'baz'
	].join('\n'), '\u001b');

	Wasavi.send('G?foo\n');
	assertPos('#1-1', [1, 4]);

	Wasavi.send('1G5|yN');
	assertEquals('#2-1', 'def\nghi ', Wasavi.registers('"'));
	assertPos('#2-2', [0, 4]);
}

function testYankSearchBackwardPrev_4 () {
	Wasavi.send('i', [
		'abc def',		// abc foo
		'ghi foo',		// baz
		'baz'
	].join('\n'), '\u001b');

	Wasavi.send('G?foo\n');
	assertPos('#1-1', [1, 4]);

	Wasavi.send('1G5|yN');
	assertEquals('#2-1', 'def\nghi ', Wasavi.registers('"'));
	assertPos('#2-2', [0, 4]);
}

/* vim:set ts=4 sw=4 fileencoding=UTF-8 fileformat=unix filetype=javascript : */
