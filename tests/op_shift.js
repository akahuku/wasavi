/**
 * wasavi: vi clone implemented in javascript
 * =============================================================================
 *
 *
 * @author akahuku@gmail.com
 * @version $Id: op_shift.js 130 2012-06-02 05:52:45Z akahuku $
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

function testShift () {
	Wasavi.send(':set sw=8\n');
	Wasavi.send('i', '1\n2\n3', '\u001b');

	Wasavi.send('gg>>');
	assertEquals('#1-1', '\t1\n2\n3', Wasavi.value);
	assertPos('#1-2', [0, 1]);

	Wasavi.send('gg>2>');
	assertEquals('#2-1', '\t\t1\n\t2\n3', Wasavi.value);
	assertPos('#2-2', [0, 2]);

	Wasavi.send('gg2>>');
	assertEquals('#3-1', '\t\t\t1\n\t\t2\n3', Wasavi.value);
	assertPos('#3-2', [0, 3]);

	Wasavi.send('gg5>>');
	assertEquals('#4-1', '\t\t\t\t1\n\t\t\t2\n\t3', Wasavi.value);
	assertPos('#4-2', [0, 4]);
}

function testShiftWithMark () {
	Wasavi.send(':set sw=4\n');
	Wasavi.send('i', 'foo', '\u001b');

	Wasavi.send('>>');
	assertEquals('#1-1', '    foo', Wasavi.value);
	assertPos('#1-2', [0, 4]);

	/*
	 * 4 spaces       1 tab
	 * ....foo   -->  +.......foo
	 *   ^mark                ^mark
	 */
	Wasavi.send('3|ma>>');
	assertEquals('#2-1', '\tfoo', Wasavi.value);
	assertPos('#2-2', [0, 1]);
	Wasavi.send('gg`a');
	assertPos('#3-1', [0, 1]);
}

function testUnshift () {
	Wasavi.send(':set sw=8\n');
	Wasavi.send('i', '\t\t\t\t1\n\t\t\t2\n\t3', '\u001b');

	Wasavi.send('gg<<');
	assertEquals('#1-1', '\t\t\t1\n\t\t\t2\n\t3', Wasavi.value);
	assertPos('#1-2', [0, 3]);

	Wasavi.send('gg<2<');
	assertEquals('#2-1', '\t\t1\n\t\t2\n\t3', Wasavi.value);
	assertPos('#2-2', [0, 2]);

	Wasavi.send('gg2<<');
	assertEquals('#3-1', '\t1\n\t2\n\t3', Wasavi.value);
	assertPos('#3-2', [0, 1]);

	Wasavi.send('gg5<<');
	assertEquals('#4-1', '1\n2\n3', Wasavi.value);
	assertPos('#4-2', [0, 0]);
}

function testUnshiftWithMark () {
	Wasavi.send(':set sw=4\n');
	Wasavi.send('i', '\tfoo', '\u001b');

	Wasavi.send('<<');
	assertEquals('#1-1', '    foo', Wasavi.value);
	assertPos('#1-2', [0, 4]);

	/*
	 * 4 spaces
	 * ....foo   -->  foo
	 *   ^mark        ^mark
	 */
	Wasavi.send('3|ma<<');
	assertEquals('#2-1', 'foo', Wasavi.value);
	assertPos('#2-2', [0, 0]);
	Wasavi.send('$`a');
	assertPos('#3-1', [0, 0]);
}

function testShiftUpLine (a) {
	Wasavi.send(':set sw=8\n');
	a || (a = '-');

	Wasavi.send('iline1\n\tline2\n\t\tline3\u001b');
	assertEquals('line1\n\tline2\n\t\tline3', Wasavi.value);

	Wasavi.send('3G');
	assertPos('#1-1', [2, 2]);

	/*
	 * line1           line1
	 * .line2     -->  ..line2  *
	 * ..line3 *       ...line3
	 */
	Wasavi.send('>', a);
	assertPos('#2-1', [1, 2]);
	assertEquals('#2-2', 'line1\n\t\tline2\n\t\t\tline3', Wasavi.value);

	/*
	 * line1           .line1    *
	 * ..line2  *  --> ...line2
	 * ...line3        ...line3
	 */
	Wasavi.send('>3', a);
	assertPos('#3-1', [0, 1]);
	assertEquals('#3-2', '\tline1\n\t\t\tline2\n\t\t\tline3', Wasavi.value);

	Wasavi.send('>3', a);
	assertEquals('#4-1', '\tline1\n\t\t\tline2\n\t\t\tline3', Wasavi.value);
	assert('#4-2', Wasavi.lastMessage != '');
}

function testShiftDownLine (a) {
	Wasavi.send(':set sw=8\n');
	a || (a = '+');

	Wasavi.send('iline1\n\tline2\n\t\tline3\u001b');
	assertEquals('line1\n\tline2\n\t\tline3', Wasavi.value);

	Wasavi.send('1G');
	assertPos('#1-1', [0, 0]);

	/*
	 * line1   *       .line1  *
	 * .line2     -->  ..line2
	 * ..line3         ..line3
	 */
	Wasavi.send('>', a);
	assertPos('#2-1', [0, 1]);
	assertEquals('#2-2', '\tline1\n\t\tline2\n\t\tline3', Wasavi.value);

	/*
	 * .line1  *       ..line1  *
	 * ..line2    -->  ...line2
	 * ..line3         ...line3
	 */
	Wasavi.send('>3', a);
	assertPos('#3-1', [0, 2]);
	assertEquals('#3-2', '\t\tline1\n\t\t\tline2\n\t\t\tline3', Wasavi.value);

	Wasavi.send('3G>2', a);
	assertEquals('#4-1', '\t\tline1\n\t\t\tline2\n\t\t\tline3', Wasavi.value);
	assert('#4-2', Wasavi.lastMessage != '');
}

function testShiftDownEnter () {
	Wasavi.send(':set sw=8\n');
	testShiftDownLine(Wasavi.SPECIAL_KEYS.ENTER);
}

function testShiftFirstNonWhiteCharOfLine (a) {
	Wasavi.send(':set sw=8\n');
	a || (a = '^');

	Wasavi.send('i', '\tfoobar', '\u001b');
	Wasavi.send('>', a);

	assertEquals('#1-1', '\t\tfoobar', Wasavi.value);
	assertPos('#1-2', [0, 2]);

	Wasavi.send('^>', a);
	assertEquals('#2-1', '\t\t\tfoobar', Wasavi.value);
	assertPos('#2-2', [0, 3]);
}

function testShiftHome () {
	Wasavi.send(':set sw=8\n');
	testShiftFirstNonWhiteCharOfLine(Wasavi.SPECIAL_KEYS.HOME);
}

function testShiftTopOfLine () {
	Wasavi.send(':set sw=8\n');
	Wasavi.send('i', '\tfoobar', '\u001b');
	Wasavi.send('>0');

	assertEquals('#1-1', '\t\tfoobar', Wasavi.value);
	assertPos('#1-2', [0, 2]);
}

function testShiftTailOfLine (a) {
	Wasavi.send(':set sw=8\n');
	a || (a = '$');

	Wasavi.send('i', '\tfoobar', '\u001b1|');
	Wasavi.send('>', a);

	assertEquals('#1-1', '\t\tfoobar', Wasavi.value);
	assertPos('#1-3', [0, 2]);
}

function testShiftEnd () {
	Wasavi.send(':set sw=8\n');
	testShiftTailOfLine(Wasavi.SPECIAL_KEYS.END);
}

function testShiftDirectColumn () {
	Wasavi.send(':set sw=8\n');
	Wasavi.send('i', '0123456789\n0123456789', '\u001b1G1|');

	Wasavi.send('>5|');
	assertEquals('#1-1', '\t0123456789\n0123456789', Wasavi.value);
	assertPos('#1-2', [0, 1]);

	Wasavi.send('$>4|');
	assertEquals('#2-1', '\t\t0123456789\n0123456789', Wasavi.value);
	assertPos('#2-2', [0, 2]);

	Wasavi.send('2G1|>100|');
	assertEquals('#3-1', '\t\t0123456789\n\t0123456789', Wasavi.value);
	assertPos('#3-2', [1, 1]);
}

function testShiftJumpToMatchedParenthes () {
	Wasavi.send(':set sw=8\n');
	Wasavi.send('i', '(this is (first) line.\nthis is (second) line)]', '\u001b');

	Wasavi.send('1G1|f(>%');
	assertEquals('#1-1', '\t(this is (first) line.\nthis is (second) line)]', Wasavi.value);
	assertPos('#1-2', [0, 1]);

	Wasavi.send('2G1|f)>%');
	assertEquals('#2-1', '\t(this is (first) line.\n\tthis is (second) line)]', Wasavi.value);
	assertPos('#2-2', [1, 1]);

	Wasavi.send('G$F)>%');
	assertEquals('#3-1', '\t\t(this is (first) line.\n\t\tthis is (second) line)]', Wasavi.value);
	assertPos('#3-2', [0, 2]);

	Wasavi.send('G$>%');
	assertPos('#4-1', [1, 24]);
	assert('#4-2', Wasavi.lastMessage != '');
}

function testShiftSearchForward () {
	Wasavi.send(':set sw=8\n');
	Wasavi.send('i', 'find the\nchar4cter in cu4rent 4line', '\u001b1G1|');

	Wasavi.send('>/4\n');
	assertEquals('#1-1', '\tfind the\n\tchar4cter in cu4rent 4line', Wasavi.value);
	assertPos('#1-2', [0, 1]);

	Wasavi.send('2>/4\n');
	assertEquals('#2-1', '\t\tfind the\n\t\tchar4cter in cu4rent 4line', Wasavi.value);
	assertPos('#2-3', [0, 2]);

	Wasavi.send('3>/X\n');
	assertEquals('#3-1', '\t\tfind the\n\t\tchar4cter in cu4rent 4line', Wasavi.value);
	assertPos('#3-2', [0, 2]);
	assert('#3-3', Wasavi.lastMessage != '');
}

function testShiftSearchBackward () {
	Wasavi.send(':set sw=8\n');
	Wasavi.send('i', 'find the char4cter in cu4rent\n4line', '\u001b');

	Wasavi.send('G$>?4\n');
	assertEquals('#1-1', 'find the char4cter in cu4rent\n\t4line', Wasavi.value);
	assertPos('#1-3', [1, 1]);

	Wasavi.send('2>?4\n');
	assertEquals('#2-1', '\tfind the char4cter in cu4rent\n\t\t4line', Wasavi.value);
	assertPos('#2-2', [0, 1]);

	Wasavi.send('2>?X\n');
	assertEquals('#3-1', '\tfind the char4cter in cu4rent\n\t\t4line', Wasavi.value);
	assertPos('#3-2', [0, 1]);
	assert('#3-3', Wasavi.lastMessage != '');
}

function testShiftFindForward () {
	Wasavi.send(':set sw=8\n');
	Wasavi.send('i', '4irst 4second\n4hird 4ourth', '\u001b1G1|');

	Wasavi.send('0>f4');
	assertEquals('#1-1', '\t4irst 4second\n4hird 4ourth', Wasavi.value);
	assertPos('#1-2', [0, 1]);

	Wasavi.send('02>f4');
	assertEquals('#2-1', '\t\t4irst 4second\n4hird 4ourth', Wasavi.value);
	assertPos('#2-2', [0, 2]);

	Wasavi.send('04>f4');
	assertEquals('#3-1', '\t\t4irst 4second\n4hird 4ourth', Wasavi.value);
	assertPos('#3-2', [0, 0]);
	assert('#3-3', Wasavi.lastMessage != '');
}

function testShiftFindBackward () {
	Wasavi.send(':set sw=8\n');
	Wasavi.send('i', '4irst 4second\n4hird 4ourth', '\u001b1G1|');

	Wasavi.send('$>F4');
	assertEquals('#1-1', '\t4irst 4second\n4hird 4ourth', Wasavi.value);
	assertPos('#1-2', [0, 1]);

	Wasavi.send('$2>F4');
	assertEquals('#2-1', '\t\t4irst 4second\n4hird 4ourth', Wasavi.value);
	assertPos('#2-2', [0, 2]);

	Wasavi.send('$>3F4');
	assertEquals('#3-1', '\t\t4irst 4second\n4hird 4ourth', Wasavi.value);
	assertPos('#3-2', [0, 14]);
	assert('#3-3', Wasavi.lastMessage != '');
}

function testShiftFindFowardBeforeStop () {
	Wasavi.send(':set sw=8\n');
	Wasavi.send('i', '4irst 4second\n4hird 4ourth', '\u001b1G1|');

	Wasavi.send('0>t4');
	assertEquals('#1-1', '\t4irst 4second\n4hird 4ourth', Wasavi.value);
	assertPos('#1-2', [0, 1]);

	Wasavi.send('02>t4');
	assertEquals('#2-1', '\t\t4irst 4second\n4hird 4ourth', Wasavi.value);
	assertPos('#2-2', [0, 2]);

	Wasavi.send('04>t4');
	assertEquals('#3-1', '\t\t4irst 4second\n4hird 4ourth', Wasavi.value);
	assertPos('#3-2', [0, 0]);
	assert('#3-3', Wasavi.lastMessage != '');
}

function testShiftFindBackwardBeforeStop () {
	Wasavi.send(':set sw=8\n');
	Wasavi.send('i', '4irst 4second\n4hird 4ourth', '\u001b1G1|');
	
	Wasavi.send('$>T4');
	assertEquals('#1-1', '\t4irst 4second\n4hird 4ourth', Wasavi.value);
	assertPos('#1-2', [0, 1]);

	Wasavi.send('$2>T4');
	assertEquals('#2-1', '\t\t4irst 4second\n4hird 4ourth', Wasavi.value);
	assertPos('#2-2', [0, 2]);

	Wasavi.send('$>2T4');
	assertEquals('#3-1', '\t\t\t4irst 4second\n4hird 4ourth', Wasavi.value);
	assertPos('#3-2', [0, 3]);

	Wasavi.send('$>3T4');
	assertEquals('#4-1', '\t\t\t4irst 4second\n4hird 4ourth', Wasavi.value);
	assertPos('#4-2', [0, 15]);
	assert('#4-3', Wasavi.lastMessage != '');
}

function testShiftFindInvert () {
	Wasavi.send(':set sw=8\n');
	Wasavi.send('4i', 'fi4st s4cond th4rd fou4th\n', '\u001b');

	Wasavi.send('1G1|>f4$>,');
	assertEquals('#1-1', '\t\tfi4st s4cond th4rd fou4th', Wasavi.value.split('\n')[0]);
	assertPos('#1-2', [0, 2]);

	Wasavi.send('2G1|>t4$>,');
	assertEquals('#2-1', '\t\tfi4st s4cond th4rd fou4th', Wasavi.value.split('\n')[1]);
	assertPos('#2-2', [1, 2]);

	Wasavi.send('3G$>F40>,');
	assertEquals('#3-1', '\t\tfi4st s4cond th4rd fou4th', Wasavi.value.split('\n')[2]);
	assertPos('#3-2', [2, 2]);

	Wasavi.send('4G$>T40>,');
	assertEquals('#4-1', '\t\tfi4st s4cond th4rd fou4th', Wasavi.value.split('\n')[3]);
	assertPos('#4-2', [3, 2]);
}

function testShiftFindRepeat () {
	Wasavi.send(':set sw=8\n');
	Wasavi.send('4i', 'fi4st s4cond th4rd fou4th\n', '\u001b');

	Wasavi.send('1G1|f43|>;');
	assertEquals('#1-1', '\tfi4st s4cond th4rd fou4th', Wasavi.value.split('\n')[0]);
	assertPos('#1-3', [0, 1]);

	Wasavi.send('2G1|t43|>;');
	assertEquals('#2-1', '\tfi4st s4cond th4rd fou4th', Wasavi.value.split('\n')[1]);
	assertPos('#2-3', [1, 1]);

	Wasavi.send('3G$F4>;');
	assertEquals('#3-1', '\tfi4st s4cond th4rd fou4th', Wasavi.value.split('\n')[2]);
	assertPos('#3-2', [2, 1]);

	Wasavi.send('4G$T4>;');
	assertEquals('#4-1', '\tfi4st s4cond th4rd fou4th', Wasavi.value.split('\n')[3]);
	assertPos('#4-2', [3, 1]);
}

function testShiftDownLineOrient () {
	Wasavi.send(':set sw=8\n');
	Wasavi.send('i', '1foobar\n2foobar', '\u001bgg');

	Wasavi.send('>_');
	/*
	 * 1foobar  -->  ^I1foobar
	 * 2foobar       2foobar
	 */
	assertEquals('#1-1', '\t1foobar\n2foobar', Wasavi.value);
	assertPos('#1-2', [0, 1]);

	Wasavi.send('2G');
	Wasavi.send('>_');
	/*
	 * ^I1foobar  -->  ^I1foobar
	 * 2foobar         ^I2foobar
	 */
	assertEquals('#2-1', '\t1foobar\n\t2foobar', Wasavi.value);
	assertPos('#2-2', [1, 1]);

	Wasavi.send('gg>2_');
	/*
	 * ^I1foobar  -->  ^I^I1foobar
	 * ^I2foobar       ^I^I2foobar
	 */
	assertEquals('#3-1', '\t\t1foobar\n\t\t2foobar', Wasavi.value);
	assertPos('#3-2', [0, 2]);

	Wasavi.send('>3_');
	/*
	 * ^I^I1foobar  -->  ^I^I^I1foobar
	 * ^I^I2foobar       ^I^I^I2foobar
	 */
	assertEquals('#4-1', '\t\t\t1foobar\n\t\t\t2foobar', Wasavi.value);
	assertPos('#4-2', [0, 3]);
}

function testShiftMark () {
	Wasavi.send(':set sw=8\n');
	Wasavi.send('i', 'foo1bar\nbaz3bax', '\u001b');

	Wasavi.send('1G0f1ma0>`a');
	assertEquals('#1-1', '\tfoo1bar\nbaz3bax', Wasavi.value);
	assertPos('#1-2', [0, 1]);

	Wasavi.send('2G$F3mb$>`b');
	assertEquals('#2-1', '\tfoo1bar\n\tbaz3bax', Wasavi.value);
	assertPos('#2-2', [1, 1]);

	Wasavi.send('>`a');
	assertEquals('#3-1', '\t\tfoo1bar\n\t\tbaz3bax', Wasavi.value);
	assertPos('#3-2', [0, 2]);

	Wasavi.send('>`c');
	assertEquals('#4-1', '\t\tfoo1bar\n\t\tbaz3bax', Wasavi.value);
	assertPos('#4-2', [0, 2]);
	assert('#4-3', Wasavi.lastMessage != '');
}

function testShiftMarkLineOrient () {
	Wasavi.send(':set sw=8\n');
	Wasavi.send('i', '1\n2\n3\n4\n5\n6\n7', '\u001b');

	Wasavi.send('3Gma1G>\'a');
	assertEquals('#1-1', '\t1\n\t2\n\t3\n4\n5\n6\n7', Wasavi.value);
	assertPos('#1-2', [0, 1]);

	Wasavi.send('5GmaG>\'a');
	assertEquals('#2-1', '\t1\n\t2\n\t3\n4\n\t5\n\t6\n\t7', Wasavi.value);
	assertPos('#2-2', [4, 1]);
}

function testShiftSectionForward () {
	// TBD
}

function testShiftSectionBackward () {
	// TBD
}

function testShiftParagraphForward () {
	// TBD
}

function testShiftParagraphBackward () {
	// TBD
}

function testShiftSentenceForward () {
	// TBD
}

function testShiftSentenceBackward () {
	// TBD
}

function testShiftDown (a) {
	Wasavi.send(':set sw=8\n');
	a || (a = 'j');

	Wasavi.send('i', 'first\nsecond\nthird\nf\nfifth', '\u001b');
	Wasavi.send('2G3|>10', a);
	assertEquals('#1-1', 'first\n\tsecond\n\tthird\n\tf\n\tfifth', Wasavi.value);
	assertPos('#1-2', [1, 1]);
	assert('#1-3', Wasavi.lastMessage == '');

	Wasavi.send('2G3|>', a);
	assertEquals('#2-1', 'first\n\t\tsecond\n\t\tthird\n\tf\n\tfifth', Wasavi.value);
	assertPos('#2-2', [1, 2]);

	Wasavi.send('G>', a);
	assertEquals('#3-1', 'first\n\t\tsecond\n\t\tthird\n\tf\n\tfifth', Wasavi.value);
	assertPos('#3-2', [4, 1]);
	assert('#3-3', Wasavi.lastMessage != '');
}

function testShiftDownCtrlN () {
	testShiftDown('\u000e');
}

function testShiftDownDown () {
	testShiftDown(Wasavi.SPECIAL_KEYS.DOWN);
}

function testShiftUp (a) {
	Wasavi.send(':set sw=8\n');
	a || (a = 'k');

	Wasavi.send('i', 'first\nsecond\nt', '\u001b');

	Wasavi.send('2G3|>10', a);
	assertEquals('#1-1', '\tfirst\n\tsecond\nt', Wasavi.value);
	assertPos('#1-2', [0, 1]);
	assert('#1-3', Wasavi.lastMessage == '');

	Wasavi.send('2G1|>', a);
	assertEquals('#2-1', '\t\tfirst\n\t\tsecond\nt', Wasavi.value);
	assertPos('#2-2', [0, 2]);

	Wasavi.send('1G>', a);
	assertEquals('#3-1', '\t\tfirst\n\t\tsecond\nt', Wasavi.value);
	assertPos('#3-2', [0, 2]);
	assert('#3-3', Wasavi.lastMessage != '');
}

function testShiftUpCtrlP () {
	testShiftUp('\u0010');
}

function testShiftUpUp () {
	testShiftUp(Wasavi.SPECIAL_KEYS.UP);
}

function testShiftLeft (a) {
	Wasavi.send(':set sw=8\n');
	a || (a = 'h');

	Wasavi.send('i', 'foo bar baz', '\u001b');
	assertPos('#1-1', [0, 10]);

	Wasavi.send('>', a);
	assertEquals('#2-1', '\tfoo bar baz', Wasavi.value);
	assertPos('#2-2', [0, 1]);

	Wasavi.send('>2', a);
	assertEquals('#3-1', '\t\tfoo bar baz', Wasavi.value);
	assertPos('#3-2', [0, 2]);

	Wasavi.send('>100', a);
	assertEquals('#4-1', '\t\t\tfoo bar baz', Wasavi.value);
	assertPos('#4-2', [0, 3]);
}

function testShiftLeftCtrlH () {
	testShiftLeft('\u0008');
}

function testShiftLeftLeft () {
	testShiftLeft(Wasavi.SPECIAL_KEYS.LEFT);
}

function testShiftRight (a) {
	Wasavi.send(':set sw=8\n');
	a || (a = 'l');

	Wasavi.send('i', 'foo bar baz', '\u001b1|');
	assertPos('#1-1', [0, 0]);

	Wasavi.send('>', a);
	assertEquals('#2-1', '\tfoo bar baz', Wasavi.value);
	assertPos('#2-2', [0, 1]);

	Wasavi.send('>2', a);
	assertEquals('#3-1', '\t\tfoo bar baz', Wasavi.value);
	assertPos('#3-2', [0, 2]);

	Wasavi.send('>5', a);
	assertEquals('#4-1', '\t\t\tfoo bar baz', Wasavi.value);
	assertPos('#4-2', [0, 3]);

	Wasavi.send('>100', a);
	assertEquals('#5-1', '\t\t\t\tfoo bar baz', Wasavi.value);
	assertPos('#5-2', [0, 4]);
}

function testShiftRightSpace () {
	testShiftRight(' ');
}

function testShiftRightRight () {
	testShiftRight(Wasavi.SPECIAL_KEYS.RIGHT);
}

function testShiftWordForward () {
	Wasavi.send(':set sw=8\n');
	Wasavi.send('i', 'foo bar baz\nbax', '\u001b1|gg');

	Wasavi.send('>w');
	assertEquals('#1-1', '\tfoo bar baz\nbax', Wasavi.value);
	assertPos('#1-2', [0, 1]);

	Wasavi.send('gg>2w');
	assertEquals('#2-1', '\t\tfoo bar baz\nbax', Wasavi.value);
	assertPos('#2-2', [0, 2]);

	Wasavi.send('gg>3w');
	assertEquals('#3-1', '\t\t\tfoo bar baz\nbax', Wasavi.value);
	assertPos('#3-2', [0, 3]);

	Wasavi.send('gg>4w');
	assertEquals('#4-1', '\t\t\t\tfoo bar baz\n\tbax', Wasavi.value);
	assert('#4-2', Wasavi.lastMessage == '');
	assertPos('#4-3', [0, 4]);
}

function testShiftWordBackward () {
	Wasavi.send(':set sw=8\n');
	Wasavi.send('i', 'foo\nbar baz bax', '\u001b');

	/*
	 * foo               foo
	 * bar baz bax  -->  .bar baz bax
	 */
	Wasavi.send('>b');
	assertEquals('#1-1', 'foo\n\tbar baz bax', Wasavi.value);
	assertPos('#1-2', [1, 1]);

	/*
	 * foo                .foo
	 * .bar baz bax  -->  ..bar baz bax
	 */
	Wasavi.send('>b');
	assertEquals('#2-1', '\tfoo\n\t\tbar baz bax', Wasavi.value);
	assertPos('#2-2', [0, 1]);

	/*
	 * .foo
	 * ..bar baz bax
	 */
	Wasavi.send('1G1|>b');
	assertEquals('#3-1', '\tfoo\n\t\tbar baz bax', Wasavi.value);
	assertPos('#3-2', [0, 0]);
	assert('#3-3', Wasavi.lastMessage != '');
}

function testShiftBigwordForward () {
	Wasavi.send(':set sw=8\n');
	Wasavi.send('i', 'f#o b#r b#z\nb#x', '\u001b1|gg');

	Wasavi.send('>W');
	assertEquals('#1-1', '\tf#o b#r b#z\nb#x', Wasavi.value);
	assertPos('#1-2', [0, 1]);

	Wasavi.send('gg>2W');
	assertEquals('#2-1', '\t\tf#o b#r b#z\nb#x', Wasavi.value);
	assertPos('#2-2', [0, 2]);

	Wasavi.send('gg>3W');
	assertEquals('#3-1', '\t\t\tf#o b#r b#z\nb#x', Wasavi.value);
	assertPos('#3-2', [0, 3]);

	Wasavi.send('gg>4W');
	assertEquals('#4-1', '\t\t\t\tf#o b#r b#z\n\tb#x', Wasavi.value);
	assert('#4-2', Wasavi.lastMessage == '');
	assertPos('#4-3', [0, 4]);
}

function testShiftBigwordBackward () {
	Wasavi.send(':set sw=8\n');
	Wasavi.send('i', 'f#o\nb#r b#z b#x', '\u001b');

	Wasavi.send('$>B');
	assertEquals('#1-1', 'f#o\n\tb#r b#z b#x', Wasavi.value);
	assertPos('#1-2', [1, 1]);

	Wasavi.send('>B');
	assertEquals('#2-1', '\tf#o\n\t\tb#r b#z b#x', Wasavi.value);
	assertPos('#2-2', [0, 1]);

	Wasavi.send('0>B');
	assertEquals('#3-1', '\tf#o\n\t\tb#r b#z b#x', Wasavi.value);
	assertPos('#3-2', [0, 0]);
	assert('#3-3', Wasavi.lastMessage != '');
}

function testShiftWordEnd () {
	Wasavi.send(':set sw=8\n');
	Wasavi.send('i', 'foo bar\nbaz\nbax', '\u001bgg');

	Wasavi.send('>e');
	assertEquals('#1-1', '\tfoo bar\nbaz\nbax', Wasavi.value);
	assertPos('#1-2', [0, 1]);

	Wasavi.send('gg>2e');
	assertEquals('#2-1', '\t\tfoo bar\nbaz\nbax', Wasavi.value);
	assertPos('#2-2', [0, 2]);

	Wasavi.send('gg>3e');
	assertEquals('#3-1', '\t\t\tfoo bar\n\tbaz\nbax', Wasavi.value);
	assertPos('#3-3', [0, 3]);
}

function testShiftBigwordEnd () {
	Wasavi.send(':set sw=8\n');
	Wasavi.send('i', 'f@o b@r\nb@z\nb@x', '\u001bgg');

	Wasavi.send('>E');
	assertEquals('#1-1', '\tf@o b@r\nb@z\nb@x', Wasavi.value);
	assertPos('#1-2', [0, 1]);

	Wasavi.send('gg>2E');
	assertEquals('#2-1', '\t\tf@o b@r\nb@z\nb@x', Wasavi.value);
	assertPos('#2-2', [0, 2]);

	Wasavi.send('gg>3E');
	assertEquals('#3-1', '\t\t\tf@o b@r\n\tb@z\nb@x', Wasavi.value);
	assertPos('#3-2', [0, 3]);
}

function testShiftGotoPrefix () {
	Wasavi.send(':set sw=8\n');
	Wasavi.send('i', ' 1\n2\n 3', '\u001b');

	Wasavi.send('>gg');
	assertEquals('#1-1', '\t 1\n\t2\n\t 3', Wasavi.value);
	assertPos('#1-2', [0, 2]);
}

function testShiftTopOfView () {
	Wasavi.send(':set sw=8\n');
	makeScrollableBuffer(2);

	var rowLength = Wasavi.rowLength;
	Wasavi.send('GH');
	var viewLines = Wasavi.rowLength - Wasavi.row;

	Wasavi.send('G>H');

	var indented = 0;
	Wasavi.value.split('\n').forEach(function (line) {
		if (/^\t/.test(line)) {
			indented++;
		}
	});
	assertEquals(indented, viewLines);
}

function testShiftMiddleOfView () {
	Wasavi.send(':set sw=8\n');
	makeScrollableBuffer(2);

	var rowLength = Wasavi.rowLength;
	Wasavi.send('ggM');
	var viewLines = Wasavi.row + 1;

	Wasavi.send('gg>M');

	var indented = 0;
	Wasavi.value.split('\n').forEach(function (line) {
		if (/^\t/.test(line)) {
			indented++;
		}
	});
	assertEquals(indented, viewLines);
}

function testShiftMiddleOfView2 () {
	Wasavi.send(':set sw=8\n');
	makeScrollableBuffer(2);

	var rowLength = Wasavi.rowLength;
	Wasavi.send('GM');
	var viewLines = Wasavi.rowLength - Wasavi.row;

	Wasavi.send('G>M');

	var indented = 0;
	Wasavi.value.split('\n').forEach(function (line) {
		if (/^\t/.test(line)) {
			indented++;
		}
	});
	assertEquals(indented, viewLines);
}

function testShiftBottomOfView () {
	Wasavi.send(':set sw=8\n');
	makeScrollableBuffer(2);

	var rowLength = Wasavi.rowLength;
	Wasavi.send('ggL');
	var viewLines = Wasavi.row + 1;

	Wasavi.send('gg>L');

	var indented = 0;
	Wasavi.value.split('\n').forEach(function (line) {
		if (/^\t/.test(line)) {
			indented++;
		}
	});
	assertEquals(indented, viewLines);
}

function testShiftGoto () {
	Wasavi.send(':set sw=8\n');
	Wasavi.send('i', '\t1\n\t2\n\t3\n\t4\n\t5\n\t6\n\t7', '\u001b');

	Wasavi.send('gg>3G');
	assertEquals('#1-1', '\t\t1\n\t\t2\n\t\t3\n\t4\n\t5\n\t6\n\t7', Wasavi.value);
	assertPos('#1-2', [0, 2]);

	Wasavi.send('G>5G');
	assertEquals('#2-1', '\t\t1\n\t\t2\n\t\t3\n\t4\n\t\t5\n\t\t6\n\t\t7', Wasavi.value);
	assertPos('#2-2', [4, 2]);
}

function testShiftSearchForwardNext_1 () {
	Wasavi.send(':set sw=8\n');
	Wasavi.send('i', [
		'    def',		// .    def
		'foo',          // foo
		'baz'			// baz
	].join('\n'), '\u001b');

	Wasavi.send('1G1|/foo\n');
	assertPos('#1-1', [1, 0]);

	Wasavi.send('1G5|>n');
	assertEquals('#2-1', '\t    def\nfoo\nbaz', Wasavi.value);
	assertPos('#2-2', [0, 5]);
}

function testShiftSearchForwardNext_2 () {
	Wasavi.send(':set sw=8\n');
	Wasavi.send('i', [
		'abc def',		// .abc def
		'foo',			// foo
		'baz'			// baz
	].join('\n'), '\u001b');

	Wasavi.send('1G1|/foo\n');
	assertPos('#1-1', [1, 0]);

	Wasavi.send('1G5|>n');
	assertEquals('#2-1', '\tabc def\nfoo\nbaz', Wasavi.value);
	assertPos('#2-2', [0, 1]);
}

function testShiftSearchForwardNext_3 () {
	Wasavi.send(':set sw=8\n');
	Wasavi.send('i', [
		'    def',		// .    def
		'ghi foo',		// .ghi foo
		'baz'			// baz
	].join('\n'), '\u001b');

	Wasavi.send('1G1|/foo\n');
	assertPos('#1-1', [1, 4]);

	Wasavi.send('1G5|>n');
	assertEquals('#2-1', '\t    def\n\tghi foo\nbaz', Wasavi.value);
	assertPos('#2-3', [0, 5]);
}

function testShiftSearchForwardNext_4 () {
	Wasavi.send(':set sw=8\n');
	Wasavi.send('i', [
		'abc def',		// .abc def
		'ghi foo',		// .ghi foo
		'baz'			// baz
	].join('\n'), '\u001b');

	Wasavi.send('1G1|/foo\n');
	assertPos('#1-1', [1, 4]);

	Wasavi.send('1G5|>n');
	assertEquals('#2-1', '\tabc def\n\tghi foo\nbaz', Wasavi.value);
	assertPos('#2-3', [0, 1]);
}

function testShiftSearchForwardPrev_1 () {
	Wasavi.send(':set sw=8\n');
	Wasavi.send('i', [
		'    def',		// .    def
		'foo',          // foo
		'baz'			// baz
	].join('\n'), '\u001b');

	Wasavi.send('1G1|/def\n');
	assertPos('#1-1', [0, 4]);

	Wasavi.send('2G1|>N');
	assertEquals('#2-1', '\t    def\nfoo\nbaz', Wasavi.value);
	assertPos('#2-2', [0, 5]);
}

function testShiftSearchForwardPrev_2 () {
	Wasavi.send(':set sw=8\n');
	Wasavi.send('i', [
		'abc def',		// .abc def
		'foo',			// foo
		'baz'			// baz
	].join('\n'), '\u001b');

	Wasavi.send('1G1|/def\n');
	assertPos('#1-1', [0, 4]);

	Wasavi.send('2G1|>N');
	assertEquals('#2-1', '\tabc def\nfoo\nbaz', Wasavi.value);
	assertPos('#2-2', [0, 1]);
}

function testShiftSearchForwardPrev_3 () {
	Wasavi.send(':set sw=8\n');
	Wasavi.send('i', [
		'    def',		// .    def
		'ghi foo',		// .ghi foo
		'baz'			// baz
	].join('\n'), '\u001b');

	Wasavi.send('1G1|/def\n');
	assertPos('#1-1', [0, 4]);

	Wasavi.send('2G5|>N');
	assertEquals('#2-1', '\t    def\n\tghi foo\nbaz', Wasavi.value);
	assertPos('#2-3', [0, 5]);
}

function testShiftSearchForwardPrev_4 () {
	Wasavi.send(':set sw=8\n');
	Wasavi.send('i', [
		'abc def',		// .abc def
		'ghi foo',		// .ghi foo
		'baz'			// baz
	].join('\n'), '\u001b');

	Wasavi.send('G?def\n');
	assertPos('#1-1', [0, 4]);

	Wasavi.send('2G5|>N');
	assertEquals('#2-1', '\tabc def\n\tghi foo\nbaz', Wasavi.value);
	assertPos('#2-2', [0, 1]);
}

function testShiftSearchBackwardNext_1 () {
	Wasavi.send(':set sw=8\n');
	Wasavi.send('i', [
		'    def',		// .    def
		'foo',          // foo
		'baz'			// baz
	].join('\n'), '\u001b');

	Wasavi.send('G?def\n');
	assertPos('#1-1', [0, 4]);

	Wasavi.send('2G1|>n');
	assertEquals('#2-1', '\t    def\nfoo\nbaz', Wasavi.value);
	assertPos('#2-2', [0, 5]);
}

function testShiftSearchBackwardNext_2 () {
	Wasavi.send(':set sw=8\n');
	Wasavi.send('i', [
		'abc def',		// .abc def
		'foo',			// foo
		'baz'			// baz
	].join('\n'), '\u001b');

	Wasavi.send('G?def\n');
	assertPos('#1-1', [0, 4]);

	Wasavi.send('2G1|>n');
	assertEquals('#2-1', '\tabc def\nfoo\nbaz', Wasavi.value);
	assertPos('#2-2', [0, 1]);
}

function testShiftSearchBackwardNext_3 () {
	Wasavi.send(':set sw=8\n');
	Wasavi.send('i', [
		'    def',		// .    def
		'ghi foo',		// .ghi foo
		'baz'			// baz
	].join('\n'), '\u001b');

	Wasavi.send('G?def\n');
	assertPos('#1-1', [0, 4]);

	Wasavi.send('2G5|>n');
	assertEquals('#2-1', '\t    def\n\tghi foo\nbaz', Wasavi.value);
	assertPos('#2-2', [0, 5]);
}

function testShiftSearchBackwardNext_4 () {
	Wasavi.send(':set sw=8\n');
	Wasavi.send('i', [
		'abc def',		// .abc def
		'ghi foo',		// .ghi foo
		'baz'			// baz
	].join('\n'), '\u001b');

	Wasavi.send('G?def\n');
	assertPos('#1-1', [0, 4]);

	Wasavi.send('2G5|>n');
	assertEquals('#2-1', '\tabc def\n\tghi foo\nbaz', Wasavi.value);
	assertPos('#2-2', [0, 1]);
}

function testShiftSearchBackwardPrev_1 () {
	Wasavi.send(':set sw=8\n');
	Wasavi.send('i', [
		'    def',		// .    def
		'foo',          // foo
		'baz'			// baz
	].join('\n'), '\u001b');

	Wasavi.send('G?foo\n');
	assertPos('#1-1', [1, 0]);

	Wasavi.send('1G5|>N');
	assertEquals('#2-1', '\t    def\nfoo\nbaz', Wasavi.value);
	assertPos('#2-2', [0, 5]);
}

function testShiftSearchBackwardPrev_2 () {
	Wasavi.send(':set sw=8\n');
	Wasavi.send('i', [
		'abc def',		// .abc def
		'foo',			// foo
		'baz'			// baz
	].join('\n'), '\u001b');

	Wasavi.send('G?foo\n');
	assertPos('#1-1', [1, 0]);

	Wasavi.send('1G5|>N');
	assertEquals('#2-1', '\tabc def\nfoo\nbaz', Wasavi.value);
	assertPos('#2-2', [0, 1]);
}

function testShiftSearchBackwardPrev_3 () {
	Wasavi.send(':set sw=8\n');
	Wasavi.send('i', [
		'    def',		// .    def
		'ghi foo',		// .ghi foo
		'baz'			// baz
	].join('\n'), '\u001b');

	Wasavi.send('G?foo\n');
	assertPos('#1-1', [1, 4]);

	Wasavi.send('1G5|>N');
	assertEquals('#2-1', '\t    def\n\tghi foo\nbaz', Wasavi.value);
	assertPos('#2-2', [0, 5]);
}

function testShiftSearchBackwardPrev_4 () {
	Wasavi.send(':set sw=8\n');
	Wasavi.send('i', [
		'abc def',		// .abc def
		'ghi foo',		// .ghi foo
		'baz'			// baz
	].join('\n'), '\u001b');

	Wasavi.send('G?foo\n');
	assertPos('#1-1', [1, 4]);

	Wasavi.send('1G5|>N');
	assertEquals('#2-1', '\tabc def\n\tghi foo\nbaz', Wasavi.value);
	assertPos('#2-2', [0, 1]);
}

/* vim:set ts=4 sw=4 fileencoding=UTF-8 fileformat=unix filetype=javascript : */
