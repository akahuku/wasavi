/**
 * wasavi: vi clone implemented in javascript
 * =============================================================================
 *
 *
 * @author akahuku@gmail.com
 * @version $Id: editing.js 138 2012-06-18 11:10:52Z akahuku $
 */

/**
 * tests
 */

function testDeleteRightChar (a) {
	Wasavi.send('i', 'foobar', Wasavi.SPECIAL_KEYS.ESCAPE);
	Wasavi.send('3|');

	a || (a = 'x');

	Wasavi.send(a);
	assertEquals('#1', 'fobar', Wasavi.value);
	assertPos('#2', [0, 2]);

	Wasavi.send('2', a);
	assertEquals('#3', 'for', Wasavi.value);
	assertPos('#3', [0, 2]);

	Wasavi.send('d', a);
	assert(Wasavi.lastMessage != '');
	assertPos('#4', [0, 2]);
}

function testDeleteRightCharDelete () {
	testDeleteRightChar(Wasavi.SPECIAL_KEYS.DELETE);
}

function testDeleteLeftChar () {
	Wasavi.send('i', 'foobar', Wasavi.SPECIAL_KEYS.ESCAPE);
	Wasavi.send('5|');

	Wasavi.send('X');
	assertEquals('#1', 'fooar', Wasavi.value);
	assertPos('#2', [0, 3]);

	Wasavi.send('2X');
	assertEquals('#3', 'far', Wasavi.value);
	assertPos('#3', [0, 1]);

	Wasavi.send('dX');
	assert(Wasavi.lastMessage != '');
	assertPos('#4', [0, 1]);
}

function testPasteCharsForward () {
	Wasavi.send('i', 'foobar\nfoobar', Wasavi.SPECIAL_KEYS.ESCAPE);

	Wasavi.send('1G1|y3lp');
	assertEquals('ffoooobar\nfoobar', Wasavi.value);

	Wasavi.send('2G1|y3l2p');
	assertEquals('ffoooobar\nffoofoooobar', Wasavi.value);

	Wasavi.send('dp');
	assert(Wasavi.lastMessage != '');
}

function testPasteLinesForward () {
	Wasavi.send('i', 'foo\nbar', Wasavi.SPECIAL_KEYS.ESCAPE);

	Wasavi.send('1G1|yyp');
	assertEquals('#1', 'foo\nfoo\nbar', Wasavi.value);
	assertPos('#2', [1, 0]);

	Wasavi.send('2p');
	assertEquals('#3', 'foo\nfoo\nfoo\nfoo\nbar', Wasavi.value);
	assertPos('#4', [2, 0]);

	Wasavi.send('Gp');
	assertEquals('#5', 'foo\nfoo\nfoo\nfoo\nbar\nfoo', Wasavi.value);
	assertPos('#6', [5, 0]);

	Wasavi.send('G2p');
	assertEquals('#7', 'foo\nfoo\nfoo\nfoo\nbar\nfoo\nfoo\nfoo', Wasavi.value);
	assertPos('#8', [6, 0]);
}

function testPasteCharsCurrent () {
	Wasavi.send('i', 'foobar\nfoobar', Wasavi.SPECIAL_KEYS.ESCAPE);

	Wasavi.send('1G1|y3lP');
	assertEquals('foofoobar\nfoobar', Wasavi.value);

	Wasavi.send('2G1|y3l2P');
	assertEquals('foofoobar\nfoofoofoobar', Wasavi.value);

	Wasavi.send('dP');
	assert(Wasavi.lastMessage != '');
}

function testPasteLinesCurrent () {
	Wasavi.send('i', 'foo\nbar', Wasavi.SPECIAL_KEYS.ESCAPE);

	Wasavi.send('1G1|yyP');
	assertEquals('#1', 'foo\nfoo\nbar', Wasavi.value);
	assertPos('#2', [0, 0]);

	Wasavi.send('2P');
	assertEquals('#3', 'foo\nfoo\nfoo\nfoo\nbar', Wasavi.value);
	assertPos('#4', [0, 0]);

	Wasavi.send('GP');
	assertEquals('#5', 'foo\nfoo\nfoo\nfoo\nfoo\nbar', Wasavi.value);
	assertPos('#6', [4, 0]);

	Wasavi.send('G2P');
	assertEquals('#7', 'foo\nfoo\nfoo\nfoo\nfoo\nfoo\nfoo\nbar', Wasavi.value);
	assertPos('#8', [5, 0]);
}

function testJoin () {
	Wasavi.send('i', 'first\nsecond', Wasavi.SPECIAL_KEYS.ESCAPE);
	Wasavi.send('1G1|J');
	assertPos('#1-1', [0, 5]);
	assertEquals('#1-2', 'first second', Wasavi.value);

	Wasavi.send('1GdGi', 'first\n\tsecond', Wasavi.SPECIAL_KEYS.ESCAPE);
	Wasavi.send('1G1|J');
	assertPos('#2-1', [0, 5]);
	assertEquals('#2-2', 'first second', Wasavi.value);

	Wasavi.send('1GdGi', 'first   \n\tsecond', Wasavi.SPECIAL_KEYS.ESCAPE);
	Wasavi.send('1G1|J');
	assertPos('#3-1', [0, 8]);
	assertEquals('#3-2', 'first   second', Wasavi.value);

	Wasavi.send('1GdGi', '(first\n) second', Wasavi.SPECIAL_KEYS.ESCAPE);
	Wasavi.send('1G1|J');
	assertPos('#4-1', [0, 6]);
	assertEquals('#4-2', '(first) second', Wasavi.value);

	Wasavi.send('1GdGi', 'first.\nsecond', Wasavi.SPECIAL_KEYS.ESCAPE);
	Wasavi.send('1G1|J');
	assertPos('#5-1', [0, 6]);
	assertEquals('#5-2', 'first.  second', Wasavi.value);
}

// repeat command tests.
// repeat command is affected by the commands below:
//   !, <, >, A, C, D, I, J, O, P, R, S, X, Y,
//            a, c, d, i,    o, p, r, s, x, y, ˜

function testRepetitionShiftLeft () {
	Wasavi.send(':set sw=8\n');
	Wasavi.send('i', '\t\t\t\t\tfoo\n\tbar', Wasavi.SPECIAL_KEYS.ESCAPE, '1G');

	Wasavi.send('<<');

	Wasavi.send('.');
	assertEquals('#1', '\t\t\tfoo\n\tbar', Wasavi.value);

	Wasavi.send('2.');
	assertEquals('#2', '\t\tfoo\nbar', Wasavi.value);
}

function testRepetitionShiftRight () {
	Wasavi.send(':set sw=8\n');
	Wasavi.send('i', 'foo\nbar', Wasavi.SPECIAL_KEYS.ESCAPE, '1G');

	Wasavi.send('>>');

	Wasavi.send('.');
	assertEquals('#1', '\t\tfoo\nbar', Wasavi.value);

	Wasavi.send('2.');
	assertEquals('#2', '\t\t\tfoo\n\tbar', Wasavi.value);
}

function testRepetitionAppendToLast () {
	Wasavi.send('i', 'foo', Wasavi.SPECIAL_KEYS.ESCAPE, 'gg');

	Wasavi.send('A', 'bar', Wasavi.SPECIAL_KEYS.ESCAPE);
	
	Wasavi.send('0.');
	assertEquals('#1', 'foobarbar', Wasavi.value);

	Wasavi.send('02.');
	assertEquals('#2', 'foobarbarbarbar', Wasavi.value);
}

function testRepetitionAppend () {
	Wasavi.send('i', 'foo', Wasavi.SPECIAL_KEYS.ESCAPE, 'gg');

	Wasavi.send('a', 'bar', Wasavi.SPECIAL_KEYS.ESCAPE);
	
	Wasavi.send('0.');
	assertEquals('#1', 'fbarbaroo', Wasavi.value);

	Wasavi.send('02.');
	assertEquals('#2', 'fbarbarbarbaroo', Wasavi.value);
}

function testRepetitionChangeToLast () {
	Wasavi.send('i', 'foo\nbar\nbaz\nfoobar', Wasavi.SPECIAL_KEYS.ESCAPE, '1G');

	Wasavi.send('CFOO', Wasavi.SPECIAL_KEYS.ESCAPE);

	Wasavi.send('2G.');
	assertEquals('#1', 'FOO\nFOO\nbaz\nfoobar', Wasavi.value);

	Wasavi.send('3G2.');
	assertEquals('#2', 'FOO\nFOO\nFOO', Wasavi.value);
}

function testRepetitionChange () {
	Wasavi.send('i', 'foo\nbar\nfoobar', Wasavi.SPECIAL_KEYS.ESCAPE, '1G');

	Wasavi.send('c2lFO', Wasavi.SPECIAL_KEYS.ESCAPE);

	Wasavi.send('2G.');
	assertEquals('#1', 'FOo\nFOr\nfoobar', Wasavi.value);

	Wasavi.send('3G3.');
	assertEquals('#2', 'FOo\nFOr\nFObar', Wasavi.value);
}

function testRepetitionDeleteToLast () {
	Wasavi.send('i', 'foo\nbar\nbaz\nfoobar', Wasavi.SPECIAL_KEYS.ESCAPE, '1G');

	Wasavi.send('D');

	Wasavi.send('2G.');
	assertEquals('#1', '\n\nbaz\nfoobar', Wasavi.value);

	Wasavi.send('3G2.');
	assertEquals('#2', '\n\n', Wasavi.value);
}

function testRepetiionDelete () {
	Wasavi.send('i', 'foo\nbar\nfoobar', Wasavi.SPECIAL_KEYS.ESCAPE, '1G');

	Wasavi.send('d2l', Wasavi.SPECIAL_KEYS.ESCAPE);

	Wasavi.send('2G.');
	assertEquals('#1', 'o\nr\nfoobar', Wasavi.value);

	Wasavi.send('3G3.');
	assertEquals('#2', 'o\nr\nbar', Wasavi.value);
}

function testRepetitionInsertFromTop () {
	Wasavi.send('i', 'foo', Wasavi.SPECIAL_KEYS.ESCAPE);

	Wasavi.send('Ibar', Wasavi.SPECIAL_KEYS.ESCAPE);

	Wasavi.send('$.');
	assertEquals('#1', 'barbarfoo', Wasavi.value);

	Wasavi.send('$2.');
	assertEquals('#2', 'barbarbarbarfoo', Wasavi.value);
}

function testRepetitionInsert () {
	Wasavi.send('i', 'foo', Wasavi.SPECIAL_KEYS.ESCAPE);

	Wasavi.send('ibar', Wasavi.SPECIAL_KEYS.ESCAPE);

	Wasavi.send('.');
	assertEquals('#1', 'fobabarro', Wasavi.value);

	Wasavi.send('2.');
	assertEquals('#2', 'fobababarbarrro', Wasavi.value);
}

function testRepetitionInsertWithControlChar () {
	Wasavi.send('ifoo\u001b');
	Wasavi.send('i', 'bax', Wasavi.SPECIAL_KEYS.BS, 'r', Wasavi.SPECIAL_KEYS.ESCAPE);
	assertEquals('#1-1', 'fobaro', Wasavi.value);
	assertEquals('#1-2', 'bax\u0008r', Wasavi.registers('.'));

	console.log('*** test #1 ***');
	Wasavi.send('u');
	assertEquals('#2-1', 'foo', Wasavi.value);
	assertPos('#2-2', [0, 2]);
	Wasavi.send('\u0012');
	assertEquals('#2-3', 'fobaro', Wasavi.value);
	assertPos('#2-4', [0, 2]);

	console.log('*** test #2 ***');
	Wasavi.send('.');
	assertEquals('#3-1', 'fobarbaro', Wasavi.value);
	Wasavi.send('u');
	assertEquals('#3-2', 'fobaro', Wasavi.value);
	assertPos('#3-3', [0, 2]);
	Wasavi.send('\u0012');
	assertEquals('#3-4', 'fobarbaro', Wasavi.value);
	assertPos('#3-5', [0, 2]);

	console.log('*** test #3 ***');
	Wasavi.send('2.');
	assertEquals('#4-1', 'fobarbarbarbaro', Wasavi.value);
	Wasavi.send('u');
	assertEquals('#4-2', 'fobarbaro', Wasavi.value);
	assertPos('#4-3', [0, 2]);
	Wasavi.send('\u0012');
	assertEquals('#4-4', 'fobarbarbarbaro', Wasavi.value);
	assertPos('#4-5', [0, 2]);
}

function testRepetitionInsertWithNewline () {
	Wasavi.send('ifoo\u001b');
	Wasavi.send('i', 'bar\nbaz\u001b');
	assertEquals('#1-1', 'fobar\nbazo', Wasavi.value);

	Wasavi.send('u');
	assertEquals('#2-1', 'foo', Wasavi.value);
	assertPos('#2-2', [0, 2]);
	Wasavi.send('\u0012');
	assertEquals('#2-3', 'fobar\nbazo', Wasavi.value);
	assertPos('#2-4', [0, 2]);

	Wasavi.send('.');
	assertEquals('#3-1', 'fobar\nbazbar\nbazo', Wasavi.value);

}

function testRepetitionJoin () {
	Wasavi.send('i', 'first\nsecond\nthird\nfourth\nfifth', Wasavi.SPECIAL_KEYS.ESCAPE, '1G');

	Wasavi.send('J');

	Wasavi.send('.');
	assertEquals('#1', 'first second third\nfourth\nfifth', Wasavi.value);

	Wasavi.send('2.');
	assertEquals('#2', 'first second third fourth fifth', Wasavi.value);
}

function testRepetitionOpenLineCurrent () {
	Wasavi.send('O', 'foo', Wasavi.SPECIAL_KEYS.ESCAPE);

	Wasavi.send('.');
	assertEquals('#1', 'foo\nfoo\n', Wasavi.value);

	Wasavi.send('2.');
	assertEquals('#2', 'foo\nfoo\nfoo\nfoo\n', Wasavi.value);
}

function testRepetitionOpenLineAfter () {
	Wasavi.send('o', 'foo', Wasavi.SPECIAL_KEYS.ESCAPE);

	Wasavi.send('.');
	assertEquals('#1', '\nfoo\nfoo', Wasavi.value);

	Wasavi.send('2.');
	assertEquals('#2', '\nfoo\nfoo\nfoo\nfoo', Wasavi.value);
}

function testRepetitionPasteCurrent () {
	Wasavi.send('i', 'foo', Wasavi.SPECIAL_KEYS.ESCAPE, 'ggyw');

	Wasavi.send('P');

	Wasavi.send('.');
	assertEquals('#1', 'foofoofoo', Wasavi.value);

	Wasavi.send('2.');
	assertEquals('#2', 'foofoofoofoofoo', Wasavi.value);
}

function testRepetitionPasteAfter () {
	Wasavi.send('i', '123', Wasavi.SPECIAL_KEYS.ESCAPE, 'ggyw');
	// 123
	// ^

	Wasavi.send('p');
	// 112323
	//    ^

	Wasavi.send('0.');
	assertEquals('#1-1', '112312323', Wasavi.value);
	assertPos('#1-2', [0, 3]);
	// 112312323
	//    ^

	Wasavi.send('2.');
	assertEquals('#2-1', '112312312312323', Wasavi.value);
	assertPos('#2-2', [0, 9]);
	// 112312312312323
	//          ^
}

function testRepetitionOverwrite () {
	Wasavi.send('i', 'first\nsecond\nthird\nfourth', Wasavi.SPECIAL_KEYS.ESCAPE, 'gg');

	Wasavi.send('RFOO', Wasavi.SPECIAL_KEYS.ESCAPE);

	Wasavi.send('2G.');
	assertEquals('#1', 'FOOst\nFOOond\nthird\nfourth', Wasavi.value);

	Wasavi.send('3G2.');
	assertEquals('#2', 'FOOst\nFOOond\nFOOFOO\nfourth', Wasavi.value);
}

function testRepetitionReplace () {
	Wasavi.send('i', 'foobar', Wasavi.SPECIAL_KEYS.ESCAPE, 'gg');

	Wasavi.send('rA');
	assertEquals('#1', 'Aoobar', Wasavi.value);

	Wasavi.send('2|.');
	assertEquals('#2', 'AAobar', Wasavi.value);

	Wasavi.send('4|2.');
	assertEquals('#3', 'AAoAAr', Wasavi.value);
}

function testRepetitionSubstWholeLine () {
	Wasavi.send('i', 'first\nsecond\nthird\nfourth', Wasavi.SPECIAL_KEYS.ESCAPE, 'gg');

	Wasavi.send('Cfoo', Wasavi.SPECIAL_KEYS.ESCAPE);

	Wasavi.send('2G.');
	assertEquals('#1', 'foo\nfoo\nthird\nfourth', Wasavi.value);

	Wasavi.send('3G2.');
	assertEquals('#2', 'foo\nfoo\nfoo', Wasavi.value);
}

function testRepetitionSubstChar () {
	Wasavi.send('i', 'foobarbazbag', Wasavi.SPECIAL_KEYS.ESCAPE, 'gg');

	Wasavi.send('sBAZ', Wasavi.SPECIAL_KEYS.ESCAPE);
	// BAZoobarbazbag

	Wasavi.send('6|.');
	assertEquals('#1', 'BAZooBAZarbazbag', Wasavi.value);

	Wasavi.send('11|2.');
	assertEquals('#2', 'BAZooBAZarBAZzbag', Wasavi.value);
}

function testRepetitionDeleteLeftChar () {
	Wasavi.send('i', 'foobar', Wasavi.SPECIAL_KEYS.ESCAPE);

	Wasavi.send('X');

	Wasavi.send('.');
	assertEquals('#1', 'foor', Wasavi.value);

	Wasavi.send('2.');
	assertEquals('#2', 'fr', Wasavi.value);
}

function testRepetitionDeleteRightChar () {
	Wasavi.send('i', 'foobar', Wasavi.SPECIAL_KEYS.ESCAPE, 'gg');

	Wasavi.send('x');

	Wasavi.send('.');
	assertEquals('#1', 'obar', Wasavi.value);

	Wasavi.send('2.');
	assertEquals('#2', 'ar', Wasavi.value);
}

function testRepetitionYankLines () {
	Wasavi.send('i', 'first\nsecond\nthird\nfourth', Wasavi.SPECIAL_KEYS.ESCAPE, 'gg');

	Wasavi.send('Y');

	Wasavi.send('2G.');
	assertEquals('#1', 'second\n', Wasavi.registers('"'));

	Wasavi.send('3G2.');
	assertEquals('#2', 'third\nfourth\n', Wasavi.registers('"'));
}

function testRepetitionYankChars () {
	Wasavi.send('i', 'first\nsecond\nthird fourth', Wasavi.SPECIAL_KEYS.ESCAPE, 'gg');

	Wasavi.send('yw');

	Wasavi.send('2G.');
	assertEquals('#1', 'second', Wasavi.registers('"'));

	Wasavi.send('3G2.');
	assertEquals('#2', 'third fourth', Wasavi.registers('"'));
}

function testRepetitionToggleCase () {
	Wasavi.send('i', 'foobarbaz', Wasavi.SPECIAL_KEYS.ESCAPE, 'gg');

	Wasavi.send('~');

	Wasavi.send('.');
	assertEquals('#1', 'FOobarbaz', Wasavi.value);

	Wasavi.send('2.');
	assertEquals('#2', 'FOOBarbaz', Wasavi.value);
}

// undo, redo test is in another file.
// function testUndo () {
// }
//
// function testRedo () {
// }

function testToggleCase () {
	Wasavi.send('i', 'foobarbaz', Wasavi.SPECIAL_KEYS.ESCAPE, 'gg');

	Wasavi.send('~');
	assertEquals('#1-1', 'Foobarbaz', Wasavi.value);
	assertPos('#1-2', [0, 1]);

	Wasavi.send('3~');
	assertEquals('#2-1', 'FOOBarbaz', Wasavi.value);
	assertPos('#2-2', [0, 4]);

	Wasavi.send('7|10~');
	assertEquals('#3-1', 'FOOBarBAZ', Wasavi.value);
	assertPos('#3-2', [0, 8]);
}

function testFileInfo () {
	Wasavi.send('\u0007');
	assert(Wasavi.lastMessage != '');
}

function testMarkAndJumpCharwise () {
	Wasavi.send('i', 'Hi there. This is great.', Wasavi.SPECIAL_KEYS.ESCAPE, '7|ma$mb');
	assertPos('#1', [0, 23]);

	Wasavi.send('`a');
	assertPos('#2', [0, 6]);

	Wasavi.send('`b');
	assertPos('#3', [0, 23]);

	Wasavi.send('db0');
	assertEquals('#4', 'Hi there. This is .', Wasavi.value);
	assertPos('#5', [0, 0]);

	Wasavi.send('`b');
	assertPos('#6', [0, 18]);
}

function testMarkAndJumpLinewise () {
	Wasavi.send('i', 'First\nHi there.\n\tThis is great.', Wasavi.SPECIAL_KEYS.ESCAPE);

	Wasavi.send('2G6|ma3G4|mbgg');

	assertEquals('#1', 'First\nHi there.\n\tThis is great.', Wasavi.value);
	assertPos('#1', [0, 0]);

	Wasavi.send('\'a');
	assertPos('#2', [1, 0]);

	Wasavi.send('\'a');
	assertPos('#3', [1, 0]);

	Wasavi.send('\'b');
	assertPos('#4', [2, 1]);
}

function testExecuteRegisterContentAsViCommand () {
	Wasavi.send('i', 'first\nsecond\nthird\nfourth\nk', Wasavi.SPECIAL_KEYS.ESCAPE);

	Wasavi.send('yy0@"');
	assertPos('#1', [3, 0]);

	Wasavi.send('2@"');
	assertPos('#2', [1, 0]);

	Wasavi.send('@Z');
	assert(Wasavi.lastMessage != '');
}

function testReplace () {
	Wasavi.send('i', 'foobarbaz', Wasavi.SPECIAL_KEYS.ESCAPE, 'gg');

	Wasavi.send('rA');
	assertPos('#1-1', [0, 0]);
	assertEquals('#1-2', 'Aoobarbaz', Wasavi.value);

	Wasavi.send('3|r\n');
	assertPos('#2-1', [1, 0]);
	assertEquals('#2-2', 'Ao\nbarbaz', Wasavi.value);

	Wasavi.send('3|r\r');
	assertPos('#3-1', [2, 0]);
	assertEquals('#3-2', 'Ao\nba\nbaz', Wasavi.value);

	Wasavi.send('1GdGifoobarbaz', Wasavi.SPECIAL_KEYS.ESCAPE, 'gg');

	Wasavi.send('2rA');
	assertPos('#4-1', [0, 1]);
	assertEquals('#4-2', 'AAobarbaz', Wasavi.value);

	Wasavi.send('4|3r\n');
	assertPos('#5-1', [1, 0]);
	assertEquals('#5-2', 'AAo\nbaz', Wasavi.value);

	Wasavi.send('100rX');
	assertPos('#6-1', [1, 0]);
	assert(Wasavi.lastMessage != '');
}

function testAppend () {
	Wasavi.send('a', 'foobar');
	assertEquals('#1', 'edit', Wasavi.inputMode);

	Wasavi.send(Wasavi.SPECIAL_KEYS.ESCAPE);
	assertPos('#2-1', [0, 5]);
	assertEquals('#2-2', 'foobar', Wasavi.value);
	assertEquals('#2-3', 'foobar', Wasavi.registers('.'));

	Wasavi.send('3|aFOO', Wasavi.SPECIAL_KEYS.ESCAPE);
	assertPos('#3-1', [0, 5]);
	assertEquals('#3-2', 'fooFOObar', Wasavi.value);
	assertEquals('#3-3', 'FOO', Wasavi.registers('.'));

	Wasavi.send('3aBAR', Wasavi.SPECIAL_KEYS.ESCAPE);
	assertPos('#4-1', [0, 14]);
	assertEquals('#4-2', 'fooFOOBARBARBARbar', Wasavi.value);
	assertEquals('#4-3', 'BAR', Wasavi.registers('.'));
}

function testAppentToLast () {
	Wasavi.send('A', 'foobar');
	assertEquals('#1', 'edit', Wasavi.inputMode);

	Wasavi.send(Wasavi.SPECIAL_KEYS.ESCAPE);
	assertPos('#2-1', [0, 5]);
	assertEquals('#2-2', 'foobar', Wasavi.value);
	assertEquals('#2-3', 'foobar', Wasavi.registers('.'));

	Wasavi.send('3|AFOO', Wasavi.SPECIAL_KEYS.ESCAPE);
	assertPos('#3-1', [0, 8]);
	assertEquals('#3-2', 'foobarFOO', Wasavi.value);
	assertEquals('#3-3', 'FOO', Wasavi.registers('.'));

	Wasavi.send('3ABAR', Wasavi.SPECIAL_KEYS.ESCAPE);
	assertPos('#4-1', [0, 17]);
	assertEquals('#4-2', 'foobarFOOBARBARBAR', Wasavi.value);
	assertEquals('#4-3', 'BAR', Wasavi.registers('.'));
}

function testInsert () {
	Wasavi.send('i', 'foobar');
	assertEquals('#1', 'edit', Wasavi.inputMode);

	Wasavi.send(Wasavi.SPECIAL_KEYS.ESCAPE);
	assertPos('#2-1', [0, 5]);
	assertEquals('#2-2', 'foobar', Wasavi.value);
	assertEquals('#2-3', 'foobar', Wasavi.registers('.'));

	Wasavi.send('3|iFOO', Wasavi.SPECIAL_KEYS.ESCAPE);
	assertPos('#3-1', [0, 4]);
	assertEquals('#3-2', 'foFOOobar', Wasavi.value);
	assertEquals('#3-3', 'FOO', Wasavi.registers('.'));

	Wasavi.send('3iBAR', Wasavi.SPECIAL_KEYS.ESCAPE);
	assertPos('#4-1', [0, 12]);
	assertEquals('#4-2', 'foFOBARBARBAROobar', Wasavi.value);
	assertEquals('#4-3', 'BAR', Wasavi.registers('.'));
}

function testInsertToTop () {
	Wasavi.send('I', 'foobar');
	assertEquals('#1', 'edit', Wasavi.inputMode);

	Wasavi.send(Wasavi.SPECIAL_KEYS.ESCAPE);
	assertPos('#2-1', [0, 5]);
	assertEquals('#2-2', 'foobar', Wasavi.value);
	assertEquals('#2-3', 'foobar', Wasavi.registers('.'));

	Wasavi.send('3|IFOO', Wasavi.SPECIAL_KEYS.ESCAPE);
	assertPos('#3-1', [0, 2]);
	assertEquals('#3-2', 'FOOfoobar', Wasavi.value);
	assertEquals('#3-3', 'FOO', Wasavi.registers('.'));

	Wasavi.send('3IBAR', Wasavi.SPECIAL_KEYS.ESCAPE);
	assertPos('#4-1', [0, 8]);
	assertEquals('#4-2', 'BARBARBARFOOfoobar', Wasavi.value);
	assertEquals('#4-3', 'BAR', Wasavi.registers('.'));
}

function testOpenLineAfter () {
	// the behavior of o command in wasavi is compatible to vim, NOT historical vi.
	Wasavi.send('o', 'foo', Wasavi.SPECIAL_KEYS.ESCAPE);
	assertPos('#1-1', [1, 2]);
	assertEquals('#1-2', '\nfoo', Wasavi.value);
	assertEquals('#1-3', 'foo', Wasavi.registers('.'));

	Wasavi.send('2o', 'bar', Wasavi.SPECIAL_KEYS.ESCAPE);
	assertPos('#2-1', [3, 2]);
	assertEquals('#2-2', '\nfoo\nbar\nbar', Wasavi.value);
	assertEquals('#2-3', 'bar', Wasavi.registers('.'));

	Wasavi.send('gg');

	Wasavi.send('o', 'FOO', Wasavi.SPECIAL_KEYS.ESCAPE);
	assertPos('#3-1', [1, 2]);
	assertEquals('#3-2', '\nFOO\nfoo\nbar\nbar', Wasavi.value);
	assertEquals('#3-3', 'FOO', Wasavi.registers('.'));

	Wasavi.send('2o', 'BAR', Wasavi.SPECIAL_KEYS.ESCAPE);
	assertPos('#4-1', [3, 2]);
	assertEquals('#4-2', '\nFOO\nBAR\nBAR\nfoo\nbar\nbar', Wasavi.value);
	assertEquals('#4-3', 'BAR', Wasavi.registers('.'));
}

function testOpenLineCurrent () {
	// the behavior of O command in wasavi is compatible to vim, NOT historical vi.
	Wasavi.send('O', 'foo', Wasavi.SPECIAL_KEYS.ESCAPE);
	assertPos('#1-1', [0, 2]);
	assertEquals('#1-2', 'foo\n', Wasavi.value);
	assertEquals('#1-3', 'foo', Wasavi.registers('.'));

	Wasavi.send('2O', 'bar', Wasavi.SPECIAL_KEYS.ESCAPE);
	assertPos('#2-1', [1, 2]);
	assertEquals('#2-2', 'bar\nbar\nfoo\n', Wasavi.value);
	assertEquals('#2-3', 'bar', Wasavi.registers('.'));

	Wasavi.send('G');

	Wasavi.send('O', 'FOO', Wasavi.SPECIAL_KEYS.ESCAPE);
	assertPos('#3-1', [3, 2]);
	assertEquals('#3-2', 'bar\nbar\nfoo\nFOO\n', Wasavi.value);
	assertEquals('#3-3', 'FOO', Wasavi.registers('.'));

	Wasavi.send('2O', 'BAR', Wasavi.SPECIAL_KEYS.ESCAPE);
	assertPos('#4-1', [4, 2]);
	assertEquals('#4-2', 'bar\nbar\nfoo\nBAR\nBAR\nFOO\n', Wasavi.value);
	assertEquals('#4-3', 'BAR', Wasavi.registers('.'));
}

function testOverwrite () {
	Wasavi.send('R', 'foo\nbar');
	assertEquals('#1', 'edit-overwrite', Wasavi.inputMode);

	Wasavi.send(Wasavi.SPECIAL_KEYS.ESCAPE);
	assertPos('#2-1', [1, 2]);
	assertEquals('#2-2', 'foo\nbar', Wasavi.value);
	assertEquals('#2-3', 'foo\nbar', Wasavi.registers('.'));

	Wasavi.send('1G1|RFOOBAR', Wasavi.SPECIAL_KEYS.ESCAPE);
	assertPos('#3-1', [0, 5]);
	assertEquals('#3-2', 'FOOBAR\nbar', Wasavi.value);
	assertEquals('#3-3', 'FOOBAR', Wasavi.registers('.'));

	Wasavi.send('1G1|Rfoo\nbar', Wasavi.SPECIAL_KEYS.ESCAPE);
	assertPos('#4-1', [1, 2]);
	assertEquals('#4-2', 'foo\nbar\nbar', Wasavi.value);
	assertEquals('#4-3', 'foo\nbar', Wasavi.registers('.'));
}

//function testRepeatLastSubstitute () {
	// this test is in excommands.html
//}

function testSubstituteWholeLines () {
	Wasavi.send('i', '\tfoobar', Wasavi.SPECIAL_KEYS.ESCAPE);

	Wasavi.send(':set noai\nSreplaced', Wasavi.SPECIAL_KEYS.ESCAPE);
	assertPos('#1-1', [0, 7]);
	assertEquals('#1-2', 'replaced', Wasavi.value);

	Wasavi.send('dS');
	assert('#2-1', Wasavi.lastMessage != '');
}

function testZZ () {
	Wasavi.send('i', 'foobar', Wasavi.SPECIAL_KEYS.ESCAPE);
	Wasavi.send('ZZ');
	assertFalse(Wasavi.running);
}

/* vim:set ts=4 sw=4 fileencoding=UTF-8 fileformat=unix filetype=javascript : */
