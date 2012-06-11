/**
 * wasavi: vi clone implemented in javascript
 * =============================================================================
 *
 *
 * @author akahuku@gmail.com
 * @version $Id: scrollers.js 132 2012-06-05 15:44:16Z akahuku $
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
