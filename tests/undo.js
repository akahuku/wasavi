/**
 * wasavi: vi clone implemented in javascript
 * =============================================================================
 *
 *
 * @author akahuku@gmail.com
 * @version $Id: undo.js 130 2012-06-02 05:52:45Z akahuku $
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

/* vim:set ts=4 sw=4 fileencoding=UTF-8 fileformat=unix filetype=javascript : */
