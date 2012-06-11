/**
 * wasavi: vi clone implemented in javascript
 * =============================================================================
 *
 *
 * @author akahuku@gmail.com
 * @version $Id: undo.js 134 2012-06-11 20:44:34Z akahuku $
 */

/**
 * tests
 */

function testInsert () {
	Wasavi.send('afoo\u001b');
	assertEquals('#1-1', 'foo', Wasavi.value);

	Wasavi.send('a\nbar\u001b');
	assertEquals('#2-1', 'foo\nbar', Wasavi.value);

	Wasavi.send('u');
	assertEquals('#3-1', 'foo', Wasavi.value);

	Wasavi.send('u');
	assertEquals('#4-1', '', Wasavi.value);

	Wasavi.send('u');
	assertEquals('#5-1', '', Wasavi.value);
	assert('#5-2', Wasavi.lastMessage != '');

	Wasavi.send('\u0012');
	assertEquals('#6-1', 'foo', Wasavi.value);

	Wasavi.send('\u0012');
	assertEquals('#7-1', 'foo\nbar', Wasavi.value);

	Wasavi.send('\u0012');
	assertEquals('#7-1', 'foo\nbar', Wasavi.value);
	assert('#7-2', Wasavi.lastMessage != '');
}

function testInsertToIsolatedPosition () {
	Wasavi.send('ifoobarbaz\u001b');

	Wasavi.send('4|iFOO', 
		Wasavi.SPECIAL_KEYS.RIGHT,
		Wasavi.SPECIAL_KEYS.RIGHT,
		Wasavi.SPECIAL_KEYS.RIGHT,
		'BAR\nBAZ',
		'\u001b');
	assertEquals('#1-1', 'fooFOObarBAR\nBAZbaz', Wasavi.value);

	Wasavi.send('u');
	assertEquals('#2-1', 'fooFOObarbaz', Wasavi.value);

	Wasavi.send('u');
	assertEquals('#3-1', 'foobarbaz', Wasavi.value);

	Wasavi.send('u');
	assertEquals('#4-1', '', Wasavi.value);

	Wasavi.send('u');
	assertEquals('#5-1', '', Wasavi.value);
	assert('#5-2', Wasavi.lastMessage != '');

	Wasavi.send('\u0012');
	assertEquals('#6-1', 'foobarbaz', Wasavi.value);

	Wasavi.send('\u0012');
	assertEquals('#7-1', 'fooFOObarbaz', Wasavi.value);

	Wasavi.send('\u0012');
	assertEquals('#8-1', 'fooFOObarBAR\nBAZbaz', Wasavi.value);

	Wasavi.send('\u0012');
	assertEquals('#8-1', 'fooFOObarBAR\nBAZbaz', Wasavi.value);
	assert('#8-2', Wasavi.lastMessage != '');
}

function testOverwrite () {
	Wasavi.send('Rfoo\u001b');
	assertEquals('#1-1', 'foo', Wasavi.value);

	Wasavi.send('0Rbarbaz\u001b');
	assertEquals('#2-1', 'barbaz', Wasavi.value);

	Wasavi.send('u');
	assertEquals('#3-1', 'foo', Wasavi.value);

	Wasavi.send('u');
	assertEquals('#4-1', '', Wasavi.value);

	Wasavi.send('u');
	assertEquals('#5-1', '', Wasavi.value);
	assert('#5-2', Wasavi.lastMessage != '');

	Wasavi.send('\u0012');
	assertEquals('#6-1', 'foo', Wasavi.value);

	Wasavi.send('\u0012');
	assertEquals('#7-1', 'barbaz', Wasavi.value);
}

function testOverwriteToIsolatedPosition () {
	Wasavi.send('ifoobarbaz\u001b');

	Wasavi.send('1|RFOO', 
		Wasavi.SPECIAL_KEYS.RIGHT,
		Wasavi.SPECIAL_KEYS.RIGHT,
		Wasavi.SPECIAL_KEYS.RIGHT,
		'B\nAR',
		'\u001b');
	assertEquals('#1-1', 'FOObarB\nAR', Wasavi.value);

	Wasavi.send('u');
	assertEquals('#2-1', 'FOObarbaz', Wasavi.value);

	Wasavi.send('u');
	assertEquals('#3-1', 'foobarbaz', Wasavi.value);

	Wasavi.send('u');
	assertEquals('#4-1', '', Wasavi.value);

	Wasavi.send('u');
	assertEquals('#5-1', '', Wasavi.value);
	assert('#5-2', Wasavi.lastMessage != '');

	Wasavi.send('\u0012');
	assertEquals('#6-1', 'foobarbaz', Wasavi.value);

	Wasavi.send('\u0012');
	assertEquals('#7-1', 'FOObarbaz', Wasavi.value);

	Wasavi.send('\u0012');
	assertEquals('#8-1', 'FOObarB\nAR', Wasavi.value);

	Wasavi.send('\u0012');
	assertEquals('#8-1', 'FOObarB\nAR', Wasavi.value);
	assert('#8-2', Wasavi.lastMessage != '');
}

function testOpenForwardToMiddleOfText () {
	Wasavi.send('afoo\nbar\u001bgg');
	assertEquals('#1-1', 'foo\nbar', Wasavi.value);

	Wasavi.send('obaz\u001b');
	assertEquals('#2-1', 'foo\nbaz\nbar', Wasavi.value);

	Wasavi.send('u');
	assertEquals('#3-1', 'foo\nbar', Wasavi.value);

	Wasavi.send('u');
	assertEquals('#4-1', '', Wasavi.value);

	Wasavi.send('\u0012');
	assertEquals('#5-1', 'foo\nbar', Wasavi.value);

	Wasavi.send('\u0012');
	assertEquals('#6-1', 'foo\nbaz\nbar', Wasavi.value);
}

function testOpenForwardToTailOfText () {
	Wasavi.send('ofoo\u001b');
	assertEquals('#1-1', '\nfoo', Wasavi.value);

	Wasavi.send('u');
	assertEquals('#2-1', '', Wasavi.value);

	Wasavi.send('\u0012');
	assertEquals('#3-1', '\nfoo', Wasavi.value);
}

function testOpenCurrentToMiddleOfText () {
	Wasavi.send('afoo\nbar\u001b');
	assertEquals('#1-1', 'foo\nbar', Wasavi.value);

	Wasavi.send('Obaz\u001b');
	assertEquals('#2-1', 'foo\nbaz\nbar', Wasavi.value);

	Wasavi.send('u');
	assertEquals('#3-1', 'foo\nbar', Wasavi.value);

	Wasavi.send('u');
	assertEquals('#4-1', '', Wasavi.value);

	Wasavi.send('\u0012');
	assertEquals('#5-1', 'foo\nbar', Wasavi.value);

	Wasavi.send('\u0012');
	assertEquals('#6-1', 'foo\nbaz\nbar', Wasavi.value);
}

function testOpenCurrentToTopOfText () {
	Wasavi.send('Ofoo\u001b');
	assertEquals('#1-1', 'foo\n', Wasavi.value);

	Wasavi.send('u');
	assertEquals('#2-1', '', Wasavi.value);

	Wasavi.send('\u0012');
	assertEquals('#3-1', 'foo\n', Wasavi.value);
}

function testDeleteCharsForward () {
	Wasavi.send('ifoobar\u001b');
	Wasavi.send('03x');
	assertEquals('#1-1', 'bar', Wasavi.value);

	Wasavi.send('u');
	assertEquals('#2-1', 'foobar', Wasavi.value);

	Wasavi.send('\u0012');
	assertEquals('#3-1', 'bar', Wasavi.value);
}

function testDeleteCharsBackward () {
	Wasavi.send('ifoobar\u001b');
	Wasavi.send('3X');
	assertEquals('#1-1', 'for', Wasavi.value);

	Wasavi.send('u');
	assertEquals('#2-1', 'foobar', Wasavi.value);

	Wasavi.send('\u0012');
	assertEquals('#3-1', 'for', Wasavi.value);
}

function testDeleteLine () {
	Wasavi.send('i1\n2\u001b');

	Wasavi.send('ggdd');
	assertEquals('#1-1', '2', Wasavi.value);

	Wasavi.send('u');
	assertEquals('#2-1', '1\n2', Wasavi.value);

	Wasavi.send('\u0012');
	assertEquals('#3-1', '2', Wasavi.value);
}

function testDeleteLines () {
	Wasavi.send('i1\n2\n3\u001b');

	Wasavi.send('ggd2d');
	assertEquals('#1-1', '3', Wasavi.value);

	Wasavi.send('u');
	assertEquals('#2-1', '1\n2\n3', Wasavi.value);

	Wasavi.send('\u0012');
	assertEquals('#3-1', '3', Wasavi.value);
}

function testDeleteLineLast () {
	Wasavi.send('i1\u001b');

	Wasavi.send('ggdd');
	assertEquals('#1-1', '', Wasavi.value);

	Wasavi.send('u');
	assertEquals('#2-1', '1', Wasavi.value);

	Wasavi.send('\u0012');
	assertEquals('#3-1', '', Wasavi.value);
}

function testDeleteLinesLast () {
	Wasavi.send('i1\n2\n3\u001b');

	Wasavi.send('2Gd2d');
	assertEquals('#1-1', '1', Wasavi.value);

	Wasavi.send('u');
	assertEquals('#2-1', '1\n2\n3', Wasavi.value);

	Wasavi.send('\u0012');
	assertEquals('#3-1', '1', Wasavi.value);
}

function testDeleteLineWithMark () {
	Wasavi.send('i1\n2\n3\u001b');

	Wasavi.send('2Gmadd');
	assertEquals('#1-1', '1\n3', Wasavi.value);

	Wasavi.send('1G`a');
	assertUndefined('#2-1', Wasavi.marks('a'));
	assertPos('#2-2', [0, 0]);

	Wasavi.send('u');
	assertEquals('#3-1', '1\n2\n3', Wasavi.value);
	Wasavi.send('1G`a');
	assertNotUndefined('#3-2', Wasavi.marks('a'));
	assertPos('#3-3', [1, 0]);
}

function testChange () {
	Wasavi.send('i1\n2\n3\u001b');

	Wasavi.send('2Gccfoo\nbar\u001b');
	assertEquals('#1-1', '1\nfoo\nbar\n3', Wasavi.value);

	Wasavi.send('u');
	assertEquals('#2-1', '1\n2\n3', Wasavi.value);

	Wasavi.send('\u0012');
	assertEquals('#3-1', '1\nfoo\nbar\n3', Wasavi.value);
}

function testChangeLast () {
	Wasavi.send('i1\n2\n3\u001b');

	Wasavi.send('3Gccfoo\nbar\u001b');
	assertEquals('#1-1', '1\n2\nfoo\nbar', Wasavi.value);

	Wasavi.send('u');
	assertEquals('#2-1', '1\n2\n3', Wasavi.value);

	Wasavi.send('\u0012');
	assertEquals('#3-1', '1\n2\nfoo\nbar', Wasavi.value);
}

function testSubst () {
	Wasavi.send('ifoo\nbar\u001b');

	Wasavi.send('1G0sbaz\n\u001b');
	assertEquals('#1-1', 'baz\noo\nbar', Wasavi.value);

	Wasavi.send('u');
	assertEquals('#2-1', 'foo\nbar', Wasavi.value);

	Wasavi.send('\u0012');
	assertEquals('#3-1', 'baz\noo\nbar', Wasavi.value);
}

function testShift () {
	Wasavi.send('i1\n2\n3\u001b');
	Wasavi.send(':set sw=8\n');

	Wasavi.send('1G2>>');
	assertEquals('#1-1', '\t1\n\t2\n3', Wasavi.value);

	Wasavi.send('u');
	assertEquals('#2-1', '1\n2\n3', Wasavi.value);

	Wasavi.send('\u0012');
	assertEquals('#3-1', '\t1\n\t2\n3', Wasavi.value);
}

function testUnshift () {
	Wasavi.send('i1\n\t2\n\t3\u001b');
	Wasavi.send(':set sw=8\n');

	Wasavi.send('1G3<<');
	assertEquals('#1-1', '1\n2\n3', Wasavi.value);

	Wasavi.send('u');
	assertEquals('#2-1', '1\n\t2\n\t3', Wasavi.value);

	Wasavi.send('\u0012');
	assertEquals('#3-1', '1\n2\n3', Wasavi.value);
}

function testPasteCharsForward () {
	Wasavi.send('ifoo\nbar\u001b');

	Wasavi.send('1G1|y3l');
	Wasavi.send('1G1|p');
	assertEquals('#1-1', 'ffoooo\nbar', Wasavi.value);

	Wasavi.send('u');
	assertEquals('#2-1', 'foo\nbar', Wasavi.value);

	Wasavi.send('\u0012');
	assertEquals('#3-1', 'ffoooo\nbar', Wasavi.value);
}

function testPasteCharsCurrent () {
	Wasavi.send('ifoo\nbar\u001b');

	Wasavi.send('1G1|y3l');
	Wasavi.send('1G1|P');
	assertEquals('#1-1', 'foofoo\nbar', Wasavi.value);

	Wasavi.send('u');
	assertEquals('#2-1', 'foo\nbar', Wasavi.value);

	Wasavi.send('\u0012');
	assertEquals('#3-1', 'foofoo\nbar', Wasavi.value);
}

function testPastCharsForwardToTailOfBuffer () {
	Wasavi.send('ifoo\nbar\u001b');

	Wasavi.send('1G1|y3l');
	Wasavi.send('2G$p');
	assertEquals('#1-1', 'foo\nbarfoo', Wasavi.value);

	Wasavi.send('u');
	assertEquals('#2-1', 'foo\nbar', Wasavi.value);

	Wasavi.send('\u0012');
	assertEquals('#3-1', 'foo\nbarfoo', Wasavi.value);
}

function testPasteCharsCurrentToTailOfBuffer () {
	Wasavi.send('ifoo\nbar\u001b');

	Wasavi.send('1G1|y3l');
	Wasavi.send('2G$P');
	assertEquals('#1-1', 'foo\nbafoor', Wasavi.value);

	Wasavi.send('u');
	assertEquals('#2-1', 'foo\nbar', Wasavi.value);

	Wasavi.send('\u0012');
	assertEquals('#3-1', 'foo\nbafoor', Wasavi.value);
}

function testPasteLineForward () {
	Wasavi.send('ifoo\nbar\u001b');

	Wasavi.send('1Gyy');
	Wasavi.send('1Gp');
	assertEquals('#1-1', 'foo\nfoo\nbar', Wasavi.value);

	Wasavi.send('u');
	assertEquals('#2-1', 'foo\nbar', Wasavi.value);

	Wasavi.send('\u0012');
	assertEquals('#3-1', 'foo\nfoo\nbar', Wasavi.value);

	Wasavi.send('Gyy');
	Wasavi.send('1Gp');
	assertEquals('#4-1', 'foo\nbar\nfoo\nbar', Wasavi.value);

	Wasavi.send('u');
	assertEquals('#5-1', 'foo\nfoo\nbar', Wasavi.value);

	Wasavi.send('\u0012');
	assertEquals('#6-1', 'foo\nbar\nfoo\nbar', Wasavi.value);
}

function testPasteLineCurrent () {
	Wasavi.send('ifoo\nbar\u001b');

	Wasavi.send('1Gyy');
	Wasavi.send('1GP');
	assertEquals('#1-1', 'foo\nfoo\nbar', Wasavi.value);

	Wasavi.send('u');
	assertEquals('#2-1', 'foo\nbar', Wasavi.value);

	Wasavi.send('\u0012');
	assertEquals('#3-1', 'foo\nfoo\nbar', Wasavi.value);

	Wasavi.send('Gyy');
	Wasavi.send('1GP');
	assertEquals('#4-1', 'bar\nfoo\nfoo\nbar', Wasavi.value);

	Wasavi.send('u');
	assertEquals('#5-1', 'foo\nfoo\nbar', Wasavi.value);

	Wasavi.send('\u0012');
	assertEquals('#4-1', 'bar\nfoo\nfoo\nbar', Wasavi.value);
}

function testPasteLineForwardToTailOfBuffer () {
	Wasavi.send('ifoo\nbar\u001b');

	Wasavi.send('1Gyy');
	Wasavi.send('2Gp');
	assertEquals('#1-1', 'foo\nbar\nfoo', Wasavi.value);

	Wasavi.send('u');
	assertEquals('#2-1', 'foo\nbar', Wasavi.value);

	Wasavi.send('\u0012');
	assertEquals('#3-1', 'foo\nbar\nfoo', Wasavi.value);
}

function testToggleCase () {
	Wasavi.send('ifoo12#$bar\u001b');

	Wasavi.send('1|~');
	assertEquals('#1-1', 'Foo12#$bar', Wasavi.value);
	assertPos('#1-2', [0, 1]);
	Wasavi.send('u');
	assertEquals('#1-3', 'foo12#$bar', Wasavi.value);
	Wasavi.send('\u0012');
	assertEquals('#1-4', 'Foo12#$bar', Wasavi.value);

	Wasavi.send('2|2~');
	assertEquals('#2-1', 'FOO12#$bar', Wasavi.value);
	assertPos('#2-2', [0, 3]);
	Wasavi.send('u');
	assertEquals('#2-3', 'Foo12#$bar', Wasavi.value);
	Wasavi.send('\u0012');
	assertEquals('#2-4', 'FOO12#$bar', Wasavi.value);

	Wasavi.send('1|10~');
	assertEquals('#3-1', 'foo12#$BAR', Wasavi.value);
	assertPos('#3-2', [0, 9]);
	Wasavi.send('u');
	assertEquals('#3-3', 'FOO12#$bar', Wasavi.value);
	Wasavi.send('\u0012');
	assertEquals('#3-4', 'foo12#$BAR', Wasavi.value);
}

/* vim:set ts=4 sw=4 fileencoding=UTF-8 fileformat=unix filetype=javascript : */
