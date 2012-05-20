/**
 * wasavi: vi clone implemented in javascript
 * =============================================================================
 *
 *
 * @author akahuku@gmail.com
 * @version $Id: scrollers.js 126 2012-05-20 04:58:15Z akahuku $
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

function testScrollUpHalfOfView () {
	var lines = makeScrollableBuffer(2.5, 'testScrollUpHalfOfView');

	Wasavi.send('GH');
	var rowTopBefore = Wasavi.position.row;
	Wasavi.send(':set scroll=0\n\u0015H');
	var rowTopAfter = Wasavi.position.row;
	assert('#1', Math.abs(Math.abs(rowTopAfter - rowTopBefore) - (lines / 2)) < 1);

	Wasavi.send('GH');
	var rowTopBefore = Wasavi.position.row;
	Wasavi.send(':set scroll=5\n\u0015H');
	var rowTopAfter = Wasavi.position.row;
	assertEquals('#2', -5, rowTopAfter - rowTopBefore);

	var posBefore = Wasavi.position.clone();
	Wasavi.send('d\u0015');
	assert('#3', Wasavi.lastMessage != '');
	assert('#4', posBefore.eq(Wasavi.position));
}

function testScrollDownHalfOfView () {
	var lines = makeScrollableBuffer(2.5, 'testScrollDownHalfOfView');

	Wasavi.send('gg');
	var rowTopBefore = Wasavi.position.row;
	Wasavi.send(':set scroll=0\n\u0004');
	var rowTopAfter = Wasavi.position.row;
	assert('#1', Math.abs(Math.abs(rowTopAfter - rowTopBefore) - (lines / 2)) < 1);

	Wasavi.send('gg');
	var rowTopBefore = Wasavi.position.row;
	Wasavi.send(':set scroll=5\n\u0004');
	var rowTopAfter = Wasavi.position.row;
	assertEquals('#2', 5, rowTopAfter - rowTopBefore);

	var posBefore = Wasavi.position.clone();
	Wasavi.send('d\u0004');
	assert('#3', Wasavi.lastMessage != '');
	assert('#4', posBefore.eq(Wasavi.position));
}

function testScrollUp1Line () {
	var lines = makeScrollableBuffer(2.5, 'testScrollUp1Line');

	Wasavi.send('GH');
	var rowTopBefore = Wasavi.position.row;
	Wasavi.send('\u0019H');
	var rowTopAfter = Wasavi.position.row;
	assertEquals('#1', -1, rowTopAfter - rowTopBefore);

	var posBefore = Wasavi.position.clone();
	Wasavi.send('d\u0019');
	assert('#2', Wasavi.lastMessage != '');
	assert('#3', posBefore.eq(Wasavi.position));
}

function testScrollDown1Line () {
	var lines = makeScrollableBuffer(2.5, 'testScrollDown1Line');

	Wasavi.send('gg');
	var rowTopBefore = Wasavi.position.row;
	Wasavi.send('\u0005');
	var rowTopAfter = Wasavi.position.row;
	assertEquals('#1', 1, rowTopAfter - rowTopBefore);

	var posBefore = Wasavi.position.clone();
	Wasavi.send('d\u0005');
	assert('#2', Wasavi.lastMessage != '');
	assert('#3', posBefore.eq(Wasavi.position));
}

function testScrollUpAlmostView (a) {
	var lines = makeScrollableBuffer(2.5, 'testScrollUpAlmostView');

	a || (a = '\u0002');

	Wasavi.send('GH');
	var rowTopBefore = Wasavi.position.row;
	Wasavi.send(a, 'H');
	var rowTopAfter = Wasavi.position.row;
	assertEquals('#1', -(lines - 2), rowTopAfter - rowTopBefore);

	var posBefore = Wasavi.position.clone();
	Wasavi.send('d', a);
	assert('#2', Wasavi.lastMessage != '');
	assert('#3', posBefore.eq(Wasavi.position));
}

function testScrollUpAlmostViewPageup () {
	testScrollUpAlmostView(Wasavi.SPECIAL_KEYS.PAGEUP);
}

function testScrollDownAlmostView (a) {
	var lines = makeScrollableBuffer(2.5, 'testScrollDownAlmostView');

	a || (a = '\u0006');

	Wasavi.send('gg');
	var rowTopBefore = Wasavi.position.row;
	Wasavi.send(a);
	var rowTopAfter = Wasavi.position.row;
	assertEquals('#1', lines - 2, rowTopAfter - rowTopBefore);

	var posBefore = Wasavi.position.clone();
	Wasavi.send('d', a);
	assert('#2', Wasavi.lastMessage != '');
	assert('#3', posBefore.eq(Wasavi.position));
}

function testScrollDownAlmostViewPagedown () {
	testScrollDownAlmostView(Wasavi.SPECIAL_KEYS.PAGEDOWN);
}

function testScreenAdjustTop () {
	var lines = makeScrollableBuffer(2, 'testScreenAdjustTop');
	console.log('lines: ' + lines);
	Wasavi.send('gg10G');

	Wasavi.send('z\u000d');
	assert('#1', Wasavi.lastMessage == '');
	assert('#2', Wasavi.positionTop.eq(Wasavi.position));
}

function testScreenAdjustCenter (a) {
	var lines = makeScrollableBuffer(2, 'testScreenAdjustCenter');
	Wasavi.send('gg', parseInt(lines * .75) + '', 'G');

	a || (a = '.');

	Wasavi.send('z', a);
	assert('#1', Wasavi.lastMessage == '');
	assertEquals('#2', Wasavi.positionTop.row, Wasavi.position.row - parseInt(lines / 2));
}

function testScreenAdjustCenterZ () {
	testScreenAdjustCenter('z');
}

function testScreenAdjustBottom () {
	var lines = makeScrollableBuffer(2, 'testScreenAdjustBottom');
	Wasavi.send('gg20G');

	Wasavi.send('z-');
	assert('#1', Wasavi.lastMessage == '');
	assertEquals('#2', Wasavi.positionTop.row, Wasavi.position.row - (lines - 1));
}

function testScreenAdjustOther () {
	var lines = makeScrollableBuffer(null, 'testScreenAdjustOther');
	var p = Wasavi.position.clone();
	Wasavi.send('zX');
	assert('#1', Wasavi.lastMessage != '');
	assertObjectEquals('#2', p, Wasavi.position);
}

/* vim:set ts=4 sw=4 fileencoding=UTF-8 fileformat=unix filetype=javascript : */
