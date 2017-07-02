'use strict';

const {By, Key, until, promise} = require('selenium-webdriver');
const {it, describe} = require('selenium-webdriver/testing');

exports.suite = (assert, wasavi, driver) => {
	const {ctrln, ctrlt, ctrlw} = assert.shortcuts;

	it('scroll up half of view', function* () {
		var lines = yield wasavi.makeScrollableBuffer(2.5);

		yield wasavi.send('GH');
		var rowTopBefore = wasavi.getRow();
		yield wasavi.send(':set scroll=0\n\u0015H');
		var rowTopAfter = wasavi.getRow();
		assert.t('#1', Math.abs(Math.abs(rowTopAfter - rowTopBefore) - (lines / 2.0)) <= 1);

		yield wasavi.send('GH');
		rowTopBefore = wasavi.getRow();
		yield wasavi.send(':set scroll=5\n\u0015H');
		rowTopAfter = wasavi.getRow();
		assert.eq('#2', -5, rowTopAfter - rowTopBefore);

		var rowBefore = wasavi.getRow();
		var colBefore = wasavi.getCol();
		yield wasavi.send('d\u0015');
		assert.eq('#3', 'd canceled.', wasavi.getLastMessage());
		assert.t('#4', rowBefore == wasavi.getRow() && colBefore == wasavi.getCol());
	});

	it('scroll down half of view', function* () {
		var lines = yield wasavi.makeScrollableBuffer(2.5);

		yield wasavi.send('gg');
		var rowTopBefore = wasavi.getRow();
		yield wasavi.send(':set scroll=0\n\u0004');
		var rowTopAfter = wasavi.getRow();
		assert.t('#1', Math.abs(Math.abs(rowTopAfter - rowTopBefore) - (lines / 2.0)) <= 1);

		yield wasavi.send('gg');
		rowTopBefore = wasavi.getRow();
		yield wasavi.send(':set scroll=5\n\u0004');
		rowTopAfter = wasavi.getRow();
		assert.eq('#2', 5, rowTopAfter - rowTopBefore);

		var rowBefore = wasavi.getRow();
		var colBefore = wasavi.getCol();
		yield wasavi.send('d\u0004');
		assert.t('#3', wasavi.getLastMessage().length);
		assert.t('#4', rowBefore == wasavi.getRow() && colBefore == wasavi.getCol());
	});

	it('scroll up1Line', function* () {
		var lines = yield wasavi.makeScrollableBuffer(2.5);

		yield wasavi.send('G');
		yield wasavi.send('H');
		var rowTopBefore = wasavi.getRow();
		yield wasavi.send('\u0019', 'H');
		var rowTopAfter = wasavi.getRow();
		assert.eq('#1', -1, rowTopAfter - rowTopBefore);

		var rowBefore = wasavi.getRow();
		var colBefore = wasavi.getCol();
		yield wasavi.send('d\u0019');
		assert.t('#2', wasavi.getLastMessage().length);
		assert.t('#3', rowBefore == wasavi.getRow() && colBefore == wasavi.getCol());
	});

	it('scroll down1Line', function* () {
		var lines = yield wasavi.makeScrollableBuffer(2.5);

		yield wasavi.send('gg');
		var rowTopBefore = wasavi.getRow();
		yield wasavi.send('\u0005');
		var rowTopAfter = wasavi.getRow();
		assert.eq('#1', 1, rowTopAfter - rowTopBefore);

		var rowBefore = wasavi.getRow();
		var colBefore = wasavi.getCol();
		yield wasavi.send('d\u0005');
		assert.t('#2', wasavi.getLastMessage().length);
		assert.t('#3', rowBefore == wasavi.getRow() && colBefore == wasavi.getCol());
	});

	function* _testScrollUpAlmostView (a) {
		var lines = yield wasavi.makeScrollableBuffer(2.5);

		yield wasavi.send('G');
		yield wasavi.send('H');
		var rowTopBefore = wasavi.getRow();
		yield wasavi.send(a);
		yield wasavi.send('H');
		var rowTopAfter = wasavi.getRow();
		assert.eq('#1', -(lines - 2), rowTopAfter - rowTopBefore);

		var rowBefore = wasavi.getRow();
		var colBefore = wasavi.getCol();
		yield wasavi.send('d', a);
		assert.t('#2', wasavi.getLastMessage().length);
		assert.t('#3', rowBefore == wasavi.getRow() && colBefore == wasavi.getCol());
	}

	it('scroll up almost view', function* () {
		promise.consume(_testScrollUpAlmostView, null, '\u0002');
	});

	it('scroll up almost view pageup', function* () {
		promise.consume(_testScrollUpAlmostView, null, Key.PAGE_UP);
	});

	function* _testScrollDownAlmostView (a) {
		var lines = yield wasavi.makeScrollableBuffer(2.5);

		yield wasavi.send('gg');
		var rowTopBefore = wasavi.getRow();
		yield wasavi.send(a);
		var rowTopAfter = wasavi.getRow();
		assert.eq('#1', lines - 2, rowTopAfter - rowTopBefore);

		var rowBefore = wasavi.getRow();
		var colBefore = wasavi.getCol();
		yield wasavi.send('d', a);
		assert.t('#2', wasavi.getLastMessage().length);
		assert.t('#3', rowBefore == wasavi.getRow() && colBefore == wasavi.getCol());
	}

	it('scroll down almost view', function* () {
		promise.consume(_testScrollDownAlmostView, null, '\u0006');
	});

	it('scroll down almost view pagedown', function* () {
		promise.consume(_testScrollDownAlmostView, null, Key.PAGE_DOWN);
	});

	it('screen adjust top', function* () {
		var lines = yield wasavi.makeScrollableBuffer(2);
		yield wasavi.send('gg10G');

		yield wasavi.send('z', Key.ENTER);
		assert.t('#1', wasavi.getLastMessage() == '');
		assert.t('#2',
				wasavi.getTopRow() == wasavi.getRow() &&
				wasavi.getTopCol() == wasavi.getCol());
	});

	function* _testScreenAdjustCenter (a) {
		var lines = yield wasavi.makeScrollableBuffer(2);
		yield wasavi.send('gg');
		yield wasavi.send(Math.floor(lines * 0.75), 'G');
		yield wasavi.send('z', a);
		assert.t('#1', wasavi.getLastMessage() == '');

		var actualTopRow = wasavi.getTopRow();
		var idealTopRow = wasavi.getRow() - (lines / 2.0);
		assert.t('#2', Math.abs(idealTopRow - actualTopRow) <= 1);
	}

	it('screen adjust center', function* () {
		promise.consume(_testScreenAdjustCenter, null, '.');
	});

	it('screen adjust center z', function* () {
		promise.consume(_testScreenAdjustCenter, null, 'z');
	});

	it('screen adjust bottom', function* () {
		var lines = yield wasavi.makeScrollableBuffer(2);
		yield wasavi.send('gg');
		yield wasavi.send('20G');
		yield wasavi.send('z-');
		assert.t('#1', wasavi.getLastMessage() == '');

		var actualTopRow = wasavi.getTopRow();
		var idealTopRow = wasavi.getRow() - (lines - 1);
		assert.t('#2', Math.abs(idealTopRow - actualTopRow) <= 1);
	});

	it('screen adjust other', function* () {
		var lines = yield wasavi.makeScrollableBuffer();
		var rowBefore = wasavi.getRow();
		var colBefore = wasavi.getCol();
		yield wasavi.send('zX');
		assert.t('#1', wasavi.getLastMessage().length);
		assert.t('#2', rowBefore == wasavi.getRow() && colBefore == wasavi.getCol());
	});
};
