/**
 * wasavi: vi clone implemented in javascript
 * =============================================================================
 *
 *
 * @author akahuku@gmail.com
 * @version $Id: op_delete.js 128 2012-05-26 09:15:39Z akahuku $
 */
/**
 * Copyright (c) 2012 akahuku@gmail.com
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     1. Redistributions of source code must retain the above copyright
 *        notice, this list of conditions and the following disclaimer.
 *     2. Redistributions in binary form must reproduce the above
 *        copyright notice, this list of conditions and the following
 *        disclaimer in the documentation and/or other materials
 *        provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * tests
 */

function testDelete () {
	Wasavi.send('i', '1\n2\n3\n4\n5\n6', '\u001bgg');

	Wasavi.send('dd');
	assertEquals('#1-1', '2\n3\n4\n5\n6', Wasavi.value);
	assertPos('#1-2', [0, 0]);

	Wasavi.send('d2d');
	assertEquals('#2-1', '4\n5\n6', Wasavi.value);
	assertPos('#2-2', [0, 0]);

	Wasavi.send('2dd');
	assertEquals('#3-1', '6', Wasavi.value);
	assertPos('#3-2', [0, 0]);

	Wasavi.send('2dd');
	assertEquals('#4-1', '', Wasavi.value);
	assertPos('#4-2', [0, 0]);
}

function testDeleteUpLine (a) {
	a || (a = '-');

	Wasavi.send('iline1\n\tline2\n\t\tline3\u001b');
	assertEquals('line1\n\tline2\n\t\tline3', Wasavi.value);

	Wasavi.send('3G');
	assertPos('#1-1', [2, 2]);

	Wasavi.send('d', a);
	assertPos('#2-1', [0, 0]);
	assertEquals('#2-2', '\tline2\n\t\tline3\n', Wasavi.registers('"'));
	assertEquals('#2-3', '\tline2\n\t\tline3\n', Wasavi.registers('1'));
	assertEquals('#2-4', 'line1', Wasavi.value);

	Wasavi.send('d', a);
	assertEquals('#3-1', '\tline2\n\t\tline3\n', Wasavi.registers('"'));
	assert('#3-2', Wasavi.lastMessage != '');
}

function testDeleteDownLine (a) {
	a || (a = '+');

	Wasavi.send('iline1\n\tline2\n\t\tline3\u001b');
	assertEquals('line1\n\tline2\n\t\tline3', Wasavi.value);

	Wasavi.send('1G');
	assertPos('#1-1', [0, 0]);

	Wasavi.send('d', a);
	assertPos('#2-1', [0, 2]);
	assertEquals('#2-2', 'line1\n\tline2\n', Wasavi.registers('"'));
	assertEquals('#2-3', 'line1\n\tline2\n', Wasavi.registers('1'));
	assertEquals('#2-4', '\t\tline3', Wasavi.value);

	Wasavi.send('d', a);
	assertEquals('#3-1', 'line1\n\tline2\n', Wasavi.registers('"'));
	assert('#3-2', Wasavi.lastMessage != '');
}

function testDeleteDownEnter () {
	testDeleteDownLine(Wasavi.SPECIAL_KEYS.ENTER);
}

function testDeleteFirstNonWhiteCharOfLine (a) {
	a || (a = '^');

	Wasavi.send('i', '\tfoobar', '\u001b');
	Wasavi.send('d', a);

	assertEquals('\tr', Wasavi.value);
	assertPos([0, 1]);
}

function testDeleteHome () {
	testDeleteFirstNonWhiteCharOfLine(Wasavi.SPECIAL_KEYS.HOME);
}

function testDeleteTopOfLine () {
	Wasavi.send('i', '\tfoobar', '\u001b');
	Wasavi.send('d0');

	assertEquals('r', Wasavi.value);
	assertPos([0, 0]);
}

function testDeleteTailOfLine (a) {
	a || (a = '$');

	Wasavi.send('i', '\tfoobar', '\u001b1|');
	Wasavi.send('d', a);

	assertEquals('', Wasavi.value);
	assertPos([0, 0]);
}

function testDeleteEnd () {
	testDeleteTailOfLine(Wasavi.SPECIAL_KEYS.END);
}

function testDeleteDirectColumn () {
	Wasavi.send('i', '0123456789\n0123456789', '\u001b1G1|');

	Wasavi.send('d5|');
	assertEquals('#1-1', '456789\n0123456789', Wasavi.value);
	assertPos('#1-2', [0, 0]);

	Wasavi.send('$d3|');
	assertEquals('#2-1', '459\n0123456789', Wasavi.value);
	assertPos('#2-2', [0, 2]);

	Wasavi.send('2G1|d100|');
	assertEquals('#3-1', '459\n', Wasavi.value);
	assertPos('#3-2', [1, 0]);
}

function testDeleteJumpToMatchedParenthes () {
	Wasavi.send('i', 'this is (first) line.\nthis is (second) line)', '\u001b');

	Wasavi.send('1G1|f(d%');
	assertEquals('#1-1', 'this is  line.\nthis is (second) line)', Wasavi.value);
	assertPos('#1-2', [0, 8]);

	Wasavi.send('2G1|f)d%');
	assertEquals('#2-1', 'this is  line.\nthis is  line)', Wasavi.value);
	assertPos('#2-2', [1, 8]);

	Wasavi.send('G$d%');
	assertEquals('#3-1', 'this is  line.\nthis is  line)', Wasavi.value);
	assertPos('#3-2', [1, 13]);
	assert('#3-3', Wasavi.lastMessage != '');
}

function testDeleteSearchForward () {
	Wasavi.send('i', 'find the\nchar4cter in cu4rent 4line', '\u001b1G1|');

	Wasavi.send('d/4\n');
	assertEquals('#1-1', '4cter in cu4rent 4line', Wasavi.value);
	assertPos('#1-2', [0, 0]);

	Wasavi.send('2d/4\n');
	assertEquals('#2-1', '4line', Wasavi.value);
	assertPos('#2-2', [0, 0]);

	Wasavi.send('2d/X\n');
	assertEquals('#3-1', '4line', Wasavi.value);
	assertPos('#3-2', [0, 0]);
	assert('#3-3', Wasavi.lastMessage != '');
}

function testDeleteSearchBackward () {
	Wasavi.send('i', 'find the char4cter in cu4rent\n4line', '\u001b');

	Wasavi.send('d?4\n');
	assertEquals('#1-1', 'find the char4cter in cu4rent\ne', Wasavi.value);
	assertPos('#1-2', [1, 0]);

	Wasavi.send('2d?4\n');
	assertEquals('#2-1', 'find the char\ne', Wasavi.value);
	assertPos('#2-2', [0, 12]);

	Wasavi.send('2d?X\n');
	assertEquals('#3-1', 'find the char\ne', Wasavi.value);
	assertPos('#3-2', [0, 12]);
	assert('#3-3', Wasavi.lastMessage != '');
}

function testDeleteFindForward () {
	Wasavi.send('i', 'find the char4cter in cu4rent 4line', '\u001b1G1|');

	Wasavi.send('df4');
	assertEquals('#1-1', 'cter in cu4rent 4line', Wasavi.value);
	assertPos('#1-2', [0, 0]);

	Wasavi.send('2df4');
	assertEquals('#2-1', 'line', Wasavi.value);
	assertPos('#2-2', [0, 0]);

	Wasavi.send('df4');
	assertEquals('#3-1', 'line', Wasavi.value);
	assertPos('#3-2', [0, 0]);
	assert('#3-3', Wasavi.lastMessage != '');
}

function testDeleteFindBackward () {
	Wasavi.send('i', 'find the char4cter in cu4rent 4line', '\u001b');

	Wasavi.send('dF4');
	assertEquals('#1-1', 'find the char4cter in cu4rent e', Wasavi.value);
	assertPos('#1-2', [0, 30]);

	Wasavi.send('2dF4');
	assertEquals('#2-1', 'find the chare', Wasavi.value);
	assertPos('#2-2', [0, 13]);

	Wasavi.send('dF4');
	assertEquals('#3-1', 'find the chare', Wasavi.value);
	assertPos('#3-2', [0, 13]);
	assert('#3-3', Wasavi.lastMessage != '');
}

function testDeleteFindFowardBeforeStop () {
	Wasavi.send('i', 'find the char4cter in cu4rent 4line', '\u001b1G1|');

	Wasavi.send('dt4');
	assertEquals('#1-1', '4cter in cu4rent 4line', Wasavi.value);
	assertPos('#1-2', [0, 0]);

	Wasavi.send('2dt4');
	assertEquals('#2-1', '4line', Wasavi.value);
	assertPos('#2-2', [0, 0]);

	Wasavi.send('dt4');
	assertEquals('#3-1', '4line', Wasavi.value);
	assertPos('#3-2', [0, 0]);
	assert('#3-3', Wasavi.lastMessage != '');
}

function testDeleteFindBackwardBeforeStop () {
	Wasavi.send('i', 'find the char4cter in cu4rent 4line', '\u001b');

	Wasavi.send('dT4');
	assertEquals('#1-1', 'find the char4cter in cu4rent 4e', Wasavi.value);
	assertPos('#1-2', [0, 31]);

	Wasavi.send('dT4');
	assertEquals('#2-1', 'find the char4cter in cu4rent 4e', Wasavi.value);
	assertPos('#2-2', [0, 31]);

	Wasavi.send('d2T4');
	assertEquals('#3-1', 'find the char4cter in cu4e', Wasavi.value);
	assertPos('#3-2', [0, 25]);

	Wasavi.send('d3T4');
	assertEquals('#4-1', 'find the char4cter in cu4e', Wasavi.value);
	assertPos('#4-2', [0, 25]);
	assert('#4-3', Wasavi.lastMessage != '');
}

function testDeleteFindInvert () {
	Wasavi.send('4i', 'fi4st s4cond th4rd fou4th\n', '\u001b');

	Wasavi.send('1G1|df4$d,');
	assertEquals('#1-1', 'st s4cond th4rd fouh', Wasavi.value.split('\n')[0]);
	assertPos('#1-2', [0, 19]);

	Wasavi.send('2G1|dt4$d,');
	assertEquals('#2-1', '4st s4cond th4rd fou4h', Wasavi.value.split('\n')[1]);
	assertPos('#2-2', [1, 21]);

	Wasavi.send('3G$dF40d,');
	assertEquals('#3-1', 'st s4cond th4rd fouh', Wasavi.value.split('\n')[2]);
	assertPos('#3-2', [2, 0]);

	Wasavi.send('4G$dT40d,');
	assertEquals('#4-1', '4st s4cond th4rd fou4h', Wasavi.value.split('\n')[3]);
	assertPos('#4-2', [3, 0]);
}

function testDeleteFindRepeat () {
	Wasavi.send('4i', 'fi4st s4cond th4rd fou4th\n', '\u001b');

	Wasavi.send('1G1|df4d;');
	assertEquals('#1-1', 'cond th4rd fou4th', Wasavi.value.split('\n')[0]);
	assertPos('#1-2', [0, 0]);

	Wasavi.send('2G1|dt4d;');
	assertEquals('#2-1', '4cond th4rd fou4th', Wasavi.value.split('\n')[1]);
	assertPos('#2-2', [1, 0]);

	Wasavi.send('3G$dF4d;');
	assertEquals('#3-1', 'fi4st s4cond thh', Wasavi.value.split('\n')[2]);
	assertPos('#3-2', [2, 15]);

	Wasavi.send('4G$dT4d;');
	assertEquals('#4-1', 'fi4st s4cond th4h', Wasavi.value.split('\n')[3]);
	assertPos('#4-2', [3, 16]);
}

function testDeleteDownLineOrient () {
	Wasavi.send('i', '\tfoobar\n\tfoobar\n\tfoobar\n\tfoobar\n\tfoobar', '\u001bgg');

	Wasavi.send('d_');
	assertEquals('#1-1', 4, Wasavi.value.split('\n').length);
	assertPos('#1-2', [0, 1]);

	Wasavi.send('d2_');
	assertEquals('#2-1', 2, Wasavi.value.split('\n').length);
	assertPos('#2-2', [0, 1]);

	Wasavi.send('d3_');
	assertEquals('#3-1', '', Wasavi.value);
	assertPos('#3-2', [0, 0]);
}

function testDeleteMark () {
	Wasavi.send('i', 'foo1bar\nbaz3bax', '\u001b');

	Wasavi.send('1G0f1ma0d`a');
	assertEquals('#1-1', '1bar\nbaz3bax', Wasavi.value);
	assertPos('#1-2', [0, 0]);

	Wasavi.send('2G$F3ma$d`a');
	assertEquals('#2-1', '1bar\nbazx', Wasavi.value);
	assertPos('#2-2', [1, 3]);
}

function testDeleteMarkLineOrient () {
	Wasavi.send('i', '1\n2\n3\n4\n5\n6\n7', '\u001b');

	Wasavi.send('3Gma1Gd\'a');
	assertEquals('#1-1', '4\n5\n6\n7', Wasavi.value);

	Wasavi.send('2GmaGd\'a');
	assertEquals('#2-1', '4', Wasavi.value);
}

function testDeleteSectionForward () {
	// TBD
}

function testDeleteSectionBackward () {
	// TBD
}

function testDeleteParagraphForward () {
	// TBD
}

function testDeleteParagraphBackward () {
	// TBD
}

function testDeleteSentenceForward () {
	// TBD
}

function testDeleteSentenceBackward () {
	// TBD
}

function testDeleteDown (a) {
	a || (a = 'j');

	/*
	 * first            _irst
	 * se_ond
	 * third     -->
	 * f
	 * fifth
	 */
	Wasavi.send('i', 'first\nsecond\nthird\nf\nfifth', '\u001b');
	Wasavi.send('2G3|d10', a);
	assertEquals('#1-1', 'first', Wasavi.value);
	assertPos('#1-2', [0, 0]);
	assert('#1-3', Wasavi.lastMessage == '');
	assertEquals('#1-4', 'second\nthird\nf\nfifth\n', Wasavi.registers('1'));

	/*
	 * first            first
	 * se_ond           _
	 * third     -->    fifth
	 * f
	 * fifth
	 */
	Wasavi.send('ggdGi', 'first\nsecond\nthird\nf\nfifth', '\u001b');
	Wasavi.send('2G3|d', a);
	assertEquals('#2-1', 'first\nf\nfifth', Wasavi.value);
	assertEquals('#2-2', 'second\nthird\n', Wasavi.registers('"'));
	assertEquals('#2-3', 'second\nthird\n', Wasavi.registers('1'));
	assertEquals('#2-4', 'second\nthird\nf\nfifth\n', Wasavi.registers('2'));
	assertPos('#2-5', [1, 0]);

	/*
	 * fir_t            _ifth
	 * f         -->
	 * fifth
	 */
	Wasavi.send('gg3ld', a);
	assertEquals('#3-1', 'fifth', Wasavi.value);
	assertEquals('#3-2', 'first\nf\n', Wasavi.registers('"'));
	assertEquals('#3-3', 'first\nf\n', Wasavi.registers('1'));
	assertEquals('#3-4', 'second\nthird\n', Wasavi.registers('2'));
	assertPos('#3-5', [0, 0]);
}

function testDeleteDownCtrlN () {
	testDeleteDown('\u000e');
}

function testDeleteDownDown () {
	testDeleteDown(Wasavi.SPECIAL_KEYS.DOWN);
}

function testDeleteUp (a) {
	a || (a = 'k');

	Wasavi.send('i', 'first\nsecond\nt', '\u001b');

	/*
	 * POSIX defines that moving beyond top or tail of buffer causes an error,
	 * But vim does not.  We follow vim.
	 */
	Wasavi.send('2G3|d10', a);
	assertEquals('#1-1', 't', Wasavi.value);
	assertPos('#1-2', [0, 0]);
	assert('#1-3', Wasavi.lastMessage == '');

	Wasavi.send('ggdGi', 'first\nsecond\nt', '\u001b');
	Wasavi.send('2G3|d', a);
	assertEquals('#2-1', 't', Wasavi.value);
	assertEquals('#2-2', 'first\nsecond\n', Wasavi.registers('"'));
	assertEquals('#2-3', 'first\nsecond\n', Wasavi.registers('1'));
	assertPos('#2-4', [0, 0]);
}

function testDeleteUpCtrlP () {
	testDeleteUp('\u0010');
}

function testDeleteUpUp () {
	testDeleteUp(Wasavi.SPECIAL_KEYS.UP);
}

function testDeleteLeft (a) {
	a || (a = 'h');

	Wasavi.send('i', 'foo bar baz', '\u001b');
	assertPos('#1-1', [0, 10]);

	Wasavi.send('d', a);
	assertEquals('#2-1', 'foo bar bz', Wasavi.value);
	assertPos('#2-2', [0, 9]);

	Wasavi.send('d2', a);
	assertEquals('#3-1', 'foo barz', Wasavi.value);
	assertPos('#3-2', [0, 7]);

	Wasavi.send('d100', a);
	assertEquals('#4-1', 'z', Wasavi.value);
	assertPos('#4-2', [0, 0]);
}

function testDeleteLeftCtrlH () {
	testDeleteLeft('\u0008');
}

function testDeleteLeftLeft () {
	testDeleteLeft(Wasavi.SPECIAL_KEYS.LEFT);
}

function testDeleteRight (a) {
	a || (a = 'l');

	Wasavi.send('i', 'foo bar baz', '\u001b1|');
	assertPos('#1-1', [0, 0]);

	Wasavi.send('d', a);
	assertEquals('#2-1', 'oo bar baz', Wasavi.value);
	assertPos('#2-2', [0, 0]);
	assertEquals('#2-3', 'f', Wasavi.registers('"'));

	Wasavi.send('"ad2', a);
	assertEquals('#3-1', ' bar baz', Wasavi.value);
	assertPos('#3-2', [0, 0]);
	assertEquals('#3-3', 'oo', Wasavi.registers('a'));
	assertEquals('#3-4', 'oo', Wasavi.registers('"'));

	Wasavi.send('d5', a);
	assertEquals('#4-1', 'baz', Wasavi.value);
	assertPos('#4-2', [0, 0]);

	Wasavi.send('d100', a);
	assertEquals('#5-1', '', Wasavi.value);
	assertPos('#5-2', [0, 0]);
}

function testDeleteRightSpace () {
	testDeleteRight(' ');
}

function testDeleteRightRight () {
	testDeleteRight(Wasavi.SPECIAL_KEYS.RIGHT);
}

function testDeleteWordForward () {
	Wasavi.send('i', 'foo bar baz bax', '\u001b1|');

	Wasavi.send('dw');
	assertEquals('#1-1', 'bar baz bax', Wasavi.value);
	assertPos('#1-2', [0, 0]);

	Wasavi.send('d2w');
	assertEquals('#2-1', 'bax', Wasavi.value);
	assertPos('#2-2', [0, 0]);
}

function testDeleteWordBackward () {
	Wasavi.send('i', 'foo bar baz bax', '\u001b');

	Wasavi.send('db');
	assertEquals('#1-1', 'foo bar baz x', Wasavi.value);
	assertPos('#1-2', [0, 12]);

	Wasavi.send('d2b');
	assertEquals('#2-1', 'foo x', Wasavi.value);
	assertPos('#2-2', [0, 4]);
}

function testDeleteBigwordForward () {
	Wasavi.send('i', 'f$o b!r b@z b#x', '\u001b1|');

	Wasavi.send('dW');
	assertEquals('#1-1', 'b!r b@z b#x', Wasavi.value);
	assertPos('#1-2', [0, 0]);

	Wasavi.send('d2W');
	assertEquals('#2-1', 'b#x', Wasavi.value);
	assertPos('#2-2', [0, 0]);
}

function testDeleteBigwordBackward () {
	Wasavi.send('i', 'f$o b!r b@z b#x', '\u001b');

	Wasavi.send('dB');
	assertEquals('#1-1', 'f$o b!r b@z x', Wasavi.value);
	assertPos('#1-2', [0, 12]);

	Wasavi.send('d2B');
	assertEquals('#2-1', 'f$o x', Wasavi.value);
	assertPos('#2-2', [0, 4]);
}

function testDeleteWordEnd () {
	Wasavi.send('i', 'foo bar baz bax', '\u001b1|');

	Wasavi.send('de');
	assertEquals('#1-1', ' bar baz bax', Wasavi.value);
	assertPos('#1-2', [0, 0]);

	Wasavi.send('d2e');
	assertEquals('#2-1', ' bax', Wasavi.value);
	assertPos('#2-2', [0, 0]);

	Wasavi.send('xde');
	assertEquals('#3-1', '', Wasavi.value);
	assertPos('#3-2', [0, 0]);
}

function testDeleteBigwordEnd () {
	Wasavi.send('i', 'f$o b!r b@z b#x', '\u001b1|');

	Wasavi.send('dE');
	assertEquals('#1-1', ' b!r b@z b#x', Wasavi.value);
	assertPos('#1-2', [0, 0]);

	Wasavi.send('d2E');
	assertEquals('#2-1', ' b#x', Wasavi.value);
	assertPos('#2-2', [0, 0]);

	Wasavi.send('xdE');
	assertEquals('#3-1', '', Wasavi.value);
	assertPos('#3-2', [0, 0]);
}

function testDeleteGotoPrefix () {
	Wasavi.send('i', '\t1\n\t2\n\t3\n\t4\n\t5\n\t6\n\t7', '\u001b');

	Wasavi.send('ggd3G');
	assertEquals('#1-1', '\t4\n\t5\n\t6\n\t7', Wasavi.value);
	assertPos('#1-2', [0, 1]);

	Wasavi.send('Gd3G');
	assertEquals('#2-1', '\t4\n\t5', Wasavi.value);
	assertPos('#2-2', [1, 1]);
}

function testDeleteTopOfView () {
	makeScrollableBuffer(2);

	var rowLength = Wasavi.rowLength;
	Wasavi.send('GH');
	var viewLines = Wasavi.rowLength - Wasavi.row;

	Wasavi.send('GdH');
	assertEquals(Wasavi.rowLength, rowLength - viewLines);
}

function testDeleteMiddleOfView () {
	makeScrollableBuffer(2);

	var rowLength = Wasavi.rowLength;
	Wasavi.send('ggM');
	var viewLines = Wasavi.row + 1;

	Wasavi.send('ggdM');
	assertEquals('#1', Wasavi.rowLength, rowLength - viewLines);

	var rowLength = Wasavi.rowLength;
	Wasavi.send('GM');
	var viewLines = Wasavi.rowLength - Wasavi.row;

	Wasavi.send('GdM');
	assertEquals('#2', Wasavi.rowLength, rowLength - viewLines);
}

function testDeleteBottomOfView () {
	makeScrollableBuffer(2);

	var rowLength = Wasavi.rowLength;
	Wasavi.send('ggL');
	var viewLines = Wasavi.row + 1;

	Wasavi.send('ggdL');
	assertEquals(Wasavi.rowLength, rowLength - viewLines);
}

function testDeleteGoto () {
	Wasavi.send('i', '1\n2\n3\n\t4\n5\n6', '\u001b');

	Wasavi.send('ggd3G');
	assertEquals('#1-1', '\t4\n5\n6', Wasavi.value);
	assertPos('#1-2', [0, 1]);

	Wasavi.send('Gd2G');
	assertEquals('#2-1', '\t4', Wasavi.value);
	assertPos('#2-2', [0, 1]);
}

function testDeleteSearchForwardNext_1 () {
	Wasavi.send('i', [
		'    def',		// foo
		'foo',          // baz
		'baz'			//
	].join('\n'), '\u001b');

	Wasavi.send('1G1|/foo\n');
	assertPos('#1-1', [1, 0]);

	Wasavi.send('1G5|dn');
	assertEquals('#2-1', 'foo\nbaz', Wasavi.value);
	assertPos('#2-2', [0, 0]);
}

function testDeleteSearchForwardNext_2 () {
	Wasavi.send('i', [
		'abc def',		// abc
		'foo',			// foo
		'baz'			// baz
	].join('\n'), '\u001b');

	Wasavi.send('1G1|/foo\n');
	assertPos('#1-1', [1, 0]);

	Wasavi.send('1G5|dn');
	assertEquals('#2-1', 'abc \nfoo\nbaz', Wasavi.value);
	assertPos('#2-2', [0, 3]);
}

function testDeleteSearchForwardNext_3 () {
	Wasavi.send('i', [
		'    def',		//    foo
		'ghi foo',		// baz
		'baz'
	].join('\n'), '\u001b');

	Wasavi.send('1G1|/foo\n');
	assertPos('#1-1', [1, 4]);

	Wasavi.send('1G5|dn');
	assertEquals('#2-1', '    foo\nbaz', Wasavi.value);
	assertPos('#2-2', [0, 4]);
}

function testDeleteSearchForwardNext_4 () {
	Wasavi.send('i', [
		'abc def',		// abc foo
		'ghi foo',		// baz
		'baz'
	].join('\n'), '\u001b');

	Wasavi.send('1G1|/foo\n');
	assertPos('#1-1', [1, 4]);

	Wasavi.send('1G5|dn');
	assertEquals('#2-1', 'abc foo\nbaz', Wasavi.value);
	assertPos('#2-2', [0, 4]);
}

function testDeleteSearchForwardPrev_1 () {
	Wasavi.send('i', [
		'    def',		// foo
		'foo',          // baz
		'baz'			//
	].join('\n'), '\u001b');

	Wasavi.send('1G1|/def\n');
	assertPos('#1-1', [0, 4]);

	Wasavi.send('2G1|dN');
	assertEquals('#2-1', 'foo\nbaz', Wasavi.value);
	assertPos('#2-2', [0, 0]);
}

function testDeleteSearchForwardPrev_2 () {
	Wasavi.send('i', [
		'abc def',		// abc
		'foo',			// foo
		'baz'			// baz
	].join('\n'), '\u001b');

	Wasavi.send('1G1|/def\n');
	assertPos('#1-1', [0, 4]);

	Wasavi.send('2G1|dN');
	assertEquals('#2-1', 'abc \nfoo\nbaz', Wasavi.value);
	assertPos('#2-2', [0, 3]);
}

function testDeleteSearchForwardPrev_3 () {
	Wasavi.send('i', [
		'    def',		//    foo
		'ghi foo',		// baz
		'baz'
	].join('\n'), '\u001b');

	Wasavi.send('1G1|/def\n');
	assertPos('#1-1', [0, 4]);

	Wasavi.send('2G5|dN');
	assertEquals('#2-1', '    foo\nbaz', Wasavi.value);
	assertPos('#2-2', [0, 4]);
}

function testDeleteSearchForwardPrev_4 () {
	Wasavi.send('i', [
		'abc def',		// abc foo
		'ghi foo',		// baz
		'baz'
	].join('\n'), '\u001b');

	Wasavi.send('G?def\n');
	assertPos('#1-1', [0, 4]);

	Wasavi.send('2G5|dn');
	assertEquals('#2-1', 'abc foo\nbaz', Wasavi.value);
	assertPos('#2-2', [0, 4]);
}

function testDeleteSearchBackwardNext_1 () {
	Wasavi.send('i', [
		'    def',		// foo
		'foo',          // baz
		'baz'			//
	].join('\n'), '\u001b');

	Wasavi.send('G?def\n');
	assertPos('#1-1', [0, 4]);

	Wasavi.send('2G1|dn');
	assertEquals('#2-1', 'foo\nbaz', Wasavi.value);
	assertPos('#2-2', [0, 0]);
}

function testDeleteSearchBackwardNext_2 () {
	Wasavi.send('i', [
		'abc def',		// abc
		'foo',			// foo
		'baz'			// baz
	].join('\n'), '\u001b');

	Wasavi.send('G?def\n');
	assertPos('#1-1', [0, 4]);

	Wasavi.send('2G1|dn');
	assertEquals('#2-1', 'abc \nfoo\nbaz', Wasavi.value);
	assertPos('#2-2', [0, 3]);
}

function testDeleteSearchBackwardNext_3 () {
	Wasavi.send('i', [
		'    def',		//    foo
		'ghi foo',		// baz
		'baz'
	].join('\n'), '\u001b');

	Wasavi.send('G?def\n');
	assertPos('#1-1', [0, 4]);

	Wasavi.send('2G5|dn');
	assertEquals('#2-1', '    foo\nbaz', Wasavi.value);
	assertPos('#2-2', [0, 4]);
}

function testDeleteSearchBackwardNext_4 () {
	Wasavi.send('i', [
		'abc def',		// abc foo
		'ghi foo',		// baz
		'baz'
	].join('\n'), '\u001b');

	Wasavi.send('G?def\n');
	assertPos('#1-1', [0, 4]);

	Wasavi.send('2G5|dn');
	assertEquals('#2-1', 'abc foo\nbaz', Wasavi.value);
	assertPos('#2-2', [0, 4]);
}

function testDeleteSearchBackwardPrev_1 () {
	Wasavi.send('i', [
		'    def',		// foo
		'foo',          // baz
		'baz'			//
	].join('\n'), '\u001b');

	Wasavi.send('G?foo\n');
	assertPos('#1-1', [1, 0]);

	Wasavi.send('1G5|dN');
	assertEquals('#2-1', 'foo\nbaz', Wasavi.value);
	assertPos('#2-2', [0, 0]);
}

function testDeleteSearchBackwardPrev_2 () {
	Wasavi.send('i', [
		'abc def',		// abc
		'foo',			// foo
		'baz'			// baz
	].join('\n'), '\u001b');

	Wasavi.send('G?foo\n');
	assertPos('#1-1', [1, 0]);

	Wasavi.send('1G5|dN');
	assertEquals('#2-1', 'abc \nfoo\nbaz', Wasavi.value);
	assertPos('#2-2', [0, 3]);
}

function testDeleteSearchBackwardPrev_3 () {
	Wasavi.send('i', [
		'    def',		//    foo
		'ghi foo',		// baz
		'baz'
	].join('\n'), '\u001b');

	Wasavi.send('G?foo\n');
	assertPos('#1-1', [1, 4]);

	Wasavi.send('1G5|dN');
	assertEquals('#2-1', '    foo\nbaz', Wasavi.value);
	assertPos('#2-2', [0, 4]);
}

function testDeleteSearchBackwardPrev_4 () {
	Wasavi.send('i', [
		'abc def',		// abc foo
		'ghi foo',		// baz
		'baz'
	].join('\n'), '\u001b');

	Wasavi.send('G?foo\n');
	assertPos('#1-1', [1, 4]);

	Wasavi.send('1G5|dN');
	assertEquals('#2-1', 'abc foo\nbaz', Wasavi.value);
	assertPos('#2-2', [0, 4]);
}

/* vim:set ts=4 sw=4 fileencoding=UTF-8 fileformat=unix filetype=javascript : */
