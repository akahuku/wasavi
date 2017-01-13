'use strict';

const {By, Key, until, promise} = require('selenium-webdriver');
const {it, describe} = require('selenium-webdriver/testing');

exports.suite = (assert, wasavi, driver) => {
	const {ctrln, ctrlt, ctrlw} = assert.shortcuts;

	it('insert', function* () {
		yield wasavi.send('afoo\u001b');
		assert.value('#1-1', 'foo');

		yield wasavi.send('a\nbar\u001b');
		assert.value('#2-1', 'foo\nbar');

		yield wasavi.send('u');
		assert.value('#3-1', 'foo');

		yield wasavi.send('u');
		assert.value('#4-1', '');

		yield wasavi.send('u');
		assert.value('#5-1', '');
		assert.t('#5-2', wasavi.getLastMessage().length);

		yield wasavi.send('\u0012');
		assert.value('#6-1', 'foo');

		yield wasavi.send('\u0012');
		assert.value('#7-1', 'foo\nbar');

		yield wasavi.send('\u0012');
		assert.value('#7-2', 'foo\nbar');
		assert.t('#7-3', wasavi.getLastMessage().length);
	});

	it('insert multi lines', function* () {
		yield wasavi.send('aa\nb\nc\n\u001b');
		assert.eq('#1', 'normal', wasavi.getState());
		assert.eq('#2', 'command', wasavi.getInputMode());

		yield wasavi.send('u');
		assert.eq('#3', '1 operation have reverted.', wasavi.getLastMessage());
		assert.value('#4', '');

		yield wasavi.send('\u0012');
		assert.eq('#5', '1 operation have executed again.', wasavi.getLastMessage());
		assert.value('#6', 'a\nb\nc\n');
	});

	it('insert to isolated position', function* () {
		yield wasavi.send('ifoobarbaz\u001b');

		yield wasavi.setInputModeOfWatchTarget('edit');
		yield wasavi.send('4|iFOO',
			Key.ARROW_RIGHT,
			Key.ARROW_RIGHT,
			Key.ARROW_RIGHT,
			'BAR\nBAZ');
		yield wasavi.send('\u001b');
		assert.value('#1-1', 'fooFOObarBAR\nBAZbaz');

		yield wasavi.send('u');
		assert.value('#2-1', 'fooFOObarbaz');

		yield wasavi.send('u');
		assert.value('#3-1', 'foobarbaz');

		yield wasavi.send('u');
		assert.value('#4-1', '');

		yield wasavi.send('u');
		assert.value('#5-1', '');
		assert.t('#5-2', wasavi.getLastMessage().length);

		yield wasavi.send('\u0012');
		assert.value('#6-1', 'foobarbaz');

		yield wasavi.send('\u0012');
		assert.value('#7-1', 'fooFOObarbaz');

		yield wasavi.send('\u0012');
		assert.value('#8-1', 'fooFOObarBAR\nBAZbaz');

		yield wasavi.send('\u0012');
		assert.value('#8-1', 'fooFOObarBAR\nBAZbaz');
		assert.t('#8-2', wasavi.getLastMessage().length);
	});

	it('overwrite', function* () {
		yield wasavi.send('Rfoo\u001b');
		assert.value('#1-1', 'foo');

		yield wasavi.send('0Rbarbaz\u001b');
		assert.value('#2-1', 'barbaz');

		yield wasavi.send('u');
		assert.value('#3-1', 'foo');

		yield wasavi.send('u');
		assert.value('#4-1', '');

		yield wasavi.send('u');
		assert.value('#5-1', '');
		assert.t('#5-2', wasavi.getLastMessage().length);

		yield wasavi.send('\u0012');
		assert.value('#6-1', 'foo');

		yield wasavi.send('\u0012');
		assert.value('#7-1', 'barbaz');
	});

	it('overwrite to isolated position', function* () {
		yield wasavi.send('ifoobarbaz\u001b');

		yield wasavi.setInputModeOfWatchTarget('overwrite');
		yield wasavi.send('1|RFOO', 
			Key.ARROW_RIGHT,
			Key.ARROW_RIGHT,
			Key.ARROW_RIGHT,
			'B\nAR');
		yield wasavi.send('\u001b');
		assert.value('#1-1', 'FOObarB\nAR');

		yield wasavi.send('u');
		assert.value('#2-1', 'FOObarbaz');

		yield wasavi.send('u');
		assert.value('#3-1', 'foobarbaz');

		yield wasavi.send('u');
		assert.value('#4-1', '');

		yield wasavi.send('u');
		assert.value('#5-1', '');
		assert.t('#5-2', wasavi.getLastMessage().length);

		yield wasavi.send('\u0012');
		assert.value('#6-1', 'foobarbaz');

		yield wasavi.send('\u0012');
		assert.value('#7-1', 'FOObarbaz');

		yield wasavi.send('\u0012');
		assert.value('#8-1', 'FOObarB\nAR');

		yield wasavi.send('\u0012');
		assert.value('#8-1', 'FOObarB\nAR');
		assert.t('#8-2', wasavi.getLastMessage().length);
	});

	it('open forward to middle of text', function* () {
		yield wasavi.send('afoo\nbar\u001bgg');
		assert.value('#1-1', 'foo\nbar');

		yield wasavi.send('obaz\u001b');
		assert.value('#2-1', 'foo\nbaz\nbar');

		yield wasavi.send('u');
		assert.value('#3-1', 'foo\nbar');

		yield wasavi.send('u');
		assert.value('#4-1', '');

		yield wasavi.send('\u0012');
		assert.value('#5-1', 'foo\nbar');

		yield wasavi.send('\u0012');
		assert.value('#6-1', 'foo\nbaz\nbar');
	});

	it('open forward to tail of text', function* () {
		yield wasavi.send('ofoo\u001b');
		assert.value('#1-1', '\nfoo');

		yield wasavi.send('u');
		assert.value('#2-1', '');

		yield wasavi.send('\u0012');
		assert.value('#3-1', '\nfoo');
	});

	it('open current to middle of text', function* () {
		yield wasavi.send('afoo\nbar\u001b');
		assert.value('#1-1', 'foo\nbar');

		yield wasavi.send('Obaz\u001b');
		assert.value('#2-1', 'foo\nbaz\nbar');

		yield wasavi.send('u');
		assert.value('#3-1', 'foo\nbar');

		yield wasavi.send('u');
		assert.value('#4-1', '');

		yield wasavi.send('\u0012');
		assert.value('#5-1', 'foo\nbar');

		yield wasavi.send('\u0012');
		assert.value('#6-1', 'foo\nbaz\nbar');
	});

	it('open current to top of text', function* () {
		yield wasavi.send('Ofoo\u001b');
		assert.value('#1-1', 'foo\n');

		yield wasavi.send('u');
		assert.value('#2-1', '');

		yield wasavi.send('\u0012');
		assert.value('#3-1', 'foo\n');
	});

	it('delete chars forward', function* () {
		yield wasavi.send('ifoobar\u001b');
		yield wasavi.send('03x');
		assert.value('#1-1', 'bar');

		yield wasavi.send('u');
		assert.value('#2-1', 'foobar');

		yield wasavi.send('\u0012');
		assert.value('#3-1', 'bar');
	});

	it('delete chars backward', function* () {
		yield wasavi.send('ifoobar\u001b');
		yield wasavi.send('3X');
		assert.value('#1-1', 'for');

		yield wasavi.send('u');
		assert.value('#2-1', 'foobar');

		yield wasavi.send('\u0012');
		assert.value('#3-1', 'for');
	});

	it('delete line', function* () {
		yield wasavi.send('i1\n2\u001b');

		yield wasavi.send('gg', 'dd');
		assert.value('#1-1', '2');

		yield wasavi.send('u');
		assert.value('#2-1', '1\n2');

		yield wasavi.send('\u0012');
		assert.value('#3-1', '2');
	});

	it('delete lines', function* () {
		yield wasavi.send('i1\n2\n3\u001b');

		yield wasavi.send('gg', 'd2d');
		assert.value('#1-1', '3');

		yield wasavi.send('u');
		assert.value('#2-1', '1\n2\n3');

		yield wasavi.send('\u0012');
		assert.value('#3-1', '3');
	});

	it('delete line last', function* () {
		yield wasavi.send('i1\u001b');

		yield wasavi.send('gg', 'dd');
		assert.value('#1-1', '');

		yield wasavi.send('u');
		assert.value('#2-1', '1');

		yield wasavi.send('\u0012');
		assert.value('#3-1', '');
	});

	it('delete lines last', function* () {
		yield wasavi.send('i1\n2\n3\u001b');

		yield wasavi.send('2G', 'd2d');
		assert.value('#1-1', '1');

		yield wasavi.send('u');
		assert.value('#2-1', '1\n2\n3');

		yield wasavi.send('\u0012');
		assert.value('#3-1', '1');
	});

	it('delete line with mark', function* () {
		yield wasavi.send('i1\n2\n3\u001b');

		yield wasavi.send('2G', 'madd');
		assert.value('#1-1', '1\n3');

		yield wasavi.send('1G', '`a');
		assert.t('#2-1', wasavi.getMark('a') == null);
		assert.pos('#2-2', 0, 0);

		yield wasavi.send('u');
		assert.value('#3-1', '1\n2\n3');
		yield wasavi.send('1G', '`a');
		assert.t('#3-2', wasavi.getMark('a') != null);
		assert.pos('#3-3', 1, 0);
	});

	it('change', function* () {
		yield wasavi.send('i1\n2\n3\u001b');

		yield wasavi.send('2G', 'ccfoo\nbar\u001b');
		assert.value('#1-1', '1\nfoo\nbar\n3');

		yield wasavi.send('u');
		assert.value('#2-1', '1\n2\n3');

		yield wasavi.send('\u0012');
		assert.value('#3-1', '1\nfoo\nbar\n3');
	});

	it('change last', function* () {
		yield wasavi.send('i1\n2\n3\u001b');

		yield wasavi.send('3G', 'ccfoo\nbar\u001b');
		assert.value('#1-1', '1\n2\nfoo\nbar');

		yield wasavi.send('u');
		assert.value('#2-1', '1\n2\n3');

		yield wasavi.send('\u0012');
		assert.value('#3-1', '1\n2\nfoo\nbar');
	});

	it('subst', function* () {
		yield wasavi.send('ifoo\nbar\u001b');

		yield wasavi.send('1G', '0sbaz\n\u001b');
		assert.value('#1-1', 'baz\noo\nbar');

		yield wasavi.send('u');
		assert.value('#2-1', 'foo\nbar');

		yield wasavi.send('\u0012');
		assert.value('#3-1', 'baz\noo\nbar');
	});

	it('shift', function* () {
		yield wasavi.send('i1\n2\n3\u001b');
		yield wasavi.send(':set sw=8\n');

		yield wasavi.send('1G', '2>>');
		assert.value('#1-1', '\t1\n\t2\n3');

		yield wasavi.send('u');
		assert.value('#2-1', '1\n2\n3');

		yield wasavi.send('\u0012');
		assert.value('#3-1', '\t1\n\t2\n3');
	});

	it('unshift', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('i1\n\t2\n\t3\u001b');
		yield wasavi.send(':set sw=8\n');

		yield wasavi.send('1G', '3<<');
		assert.value('#1-1', '1\n2\n3');

		yield wasavi.send('u');
		assert.value('#2-1', '1\n\t2\n\t3');

		yield wasavi.send('\u0012');
		assert.value('#3-1', '1\n2\n3');
	});

	it('paste chars forward', function* () {
		yield wasavi.send('ifoo\nbar\u001b');

		yield wasavi.send('1G', '1|y3l');
		assert.eq('#1-1', 'foo', wasavi.getRegister('"'));
		yield wasavi.send('1G', '1|p');
		assert.value('#1-2', 'ffoooo\nbar');

		yield wasavi.send('u');
		assert.value('#2-1', 'foo\nbar');

		yield wasavi.send('\u0012');
		assert.value('#3-1', 'ffoooo\nbar');
	});

	it('paste chars current', function* () {
		yield wasavi.send('ifoo\nbar\u001b');

		yield wasavi.send('1G', '1|y3l');
		yield wasavi.send('1G', '1|P');
		assert.value('#1-1', 'foofoo\nbar');

		yield wasavi.send('u');
		assert.value('#2-1', 'foo\nbar');

		yield wasavi.send('\u0012');
		assert.value('#3-1', 'foofoo\nbar');
	});

	it('paste chars forward to tail of buffer', function* () {
		yield wasavi.send('ifoo\nbar\u001b');

		yield wasavi.send('1G', '1|y3l');
		yield wasavi.send('2G', '$p');
		assert.value('#1-1', 'foo\nbarfoo');

		yield wasavi.send('u');
		assert.value('#2-1', 'foo\nbar');

		yield wasavi.send('\u0012');
		assert.value('#3-1', 'foo\nbarfoo');
	});

	it('paste chars current to tail of buffer', function* () {
		yield wasavi.send('ifoo\nbar\u001b');

		yield wasavi.send('1G', '1|y3l');
		yield wasavi.send('2G', '$P');
		assert.value('#1-1', 'foo\nbafoor');

		yield wasavi.send('u');
		assert.value('#2-1', 'foo\nbar');

		yield wasavi.send('\u0012');
		assert.value('#3-1', 'foo\nbafoor');
	});

	it('paste line forward', function* () {
		yield wasavi.send('ifoo\nbar\u001b');

		yield wasavi.send('1G', 'yy');
		yield wasavi.send('1G', 'p');
		assert.value('#1-1', 'foo\nfoo\nbar');

		yield wasavi.send('u');
		assert.value('#2-1', 'foo\nbar');

		yield wasavi.send('\u0012');
		assert.value('#3-1', 'foo\nfoo\nbar');

		yield wasavi.send('G', 'yy');
		yield wasavi.send('1G', 'p');
		assert.value('#4-1', 'foo\nbar\nfoo\nbar');

		yield wasavi.send('u');
		assert.value('#5-1', 'foo\nfoo\nbar');

		yield wasavi.send('\u0012');
		assert.value('#6-1', 'foo\nbar\nfoo\nbar');
	});

	it('paste line current', function* () {
		yield wasavi.send('ifoo\nbar\u001b');

		yield wasavi.send('1G', 'yy');
		yield wasavi.send('1G', 'P');
		assert.value('#1-1', 'foo\nfoo\nbar');

		yield wasavi.send('u');
		assert.value('#2-1', 'foo\nbar');

		yield wasavi.send('\u0012');
		assert.value('#3-1', 'foo\nfoo\nbar');

		yield wasavi.send('G', 'yy');
		yield wasavi.send('1G', 'P');
		assert.value('#4-1', 'bar\nfoo\nfoo\nbar');

		yield wasavi.send('u');
		assert.value('#5-1', 'foo\nfoo\nbar');

		yield wasavi.send('\u0012');
		assert.value('#4-1', 'bar\nfoo\nfoo\nbar');
	});

	it('paste line forward to tail of buffer', function* () {
		yield wasavi.send('ifoo\nbar\u001b');

		yield wasavi.send('1G', 'yy');
		yield wasavi.send('2G', 'p');
		assert.value('#1-1', 'foo\nbar\nfoo');

		yield wasavi.send('u');
		assert.value('#2-1', 'foo\nbar');

		yield wasavi.send('\u0012');
		assert.value('#3-1', 'foo\nbar\nfoo');
	});

	it('toggle case', function* () {
		yield wasavi.send('ifoo12#$bar\u001b');

		yield wasavi.send('1|~');
		assert.value('#1-1', 'Foo12#$bar');
		assert.pos('#1-2', 0, 1);
		yield wasavi.send('u');
		assert.value('#1-3', 'foo12#$bar');
		yield wasavi.send('\u0012');
		assert.value('#1-4', 'Foo12#$bar');

		yield wasavi.send('2|2~');
		assert.value('#2-1', 'FOO12#$bar');
		assert.pos('#2-2', 0, 3);
		yield wasavi.send('u');
		assert.value('#2-3', 'Foo12#$bar');
		yield wasavi.send('\u0012');
		assert.value('#2-4', 'FOO12#$bar');

		yield wasavi.send('1|10~');
		assert.value('#3-1', 'foo12#$BAR');
		assert.pos('#3-2', 0, 9);
		yield wasavi.send('u');
		assert.value('#3-3', 'FOO12#$bar');
		yield wasavi.send('\u0012');
		assert.value('#3-4', 'foo12#$BAR');
	});

	it('join', function* () {
		yield wasavi.send('ifoo\nbar\u001b');

		yield wasavi.send('1GJ');
		assert.value('#1-1', 'foo bar');
		assert.pos('#1-2', 0, 3);
		yield wasavi.send('u');
		assert.value('#1-3', 'foo\nbar');
		yield wasavi.send('\u0012');
		assert.value('#1-4', 'foo bar');
	});

	it('abbreviate', function* () {
		yield wasavi.send(':abb foo FOO<enter>BAR\n');

		yield wasavi.send('afoo bar\u001b');
		assert.value('#1-1', 'FOO\nBAR bar');
		yield wasavi.send('u');
		assert.value('#1-2', '');
		yield wasavi.send('\u0012');
		assert.value('#1-3', 'FOO\nBAR bar');
	});

	it('with count', function* () {
		yield wasavi.send('afoo \u001b');
		yield wasavi.send('abar \u001b');
		yield wasavi.send('abaz \u001b');

		yield wasavi.send('2u');
		assert.value('#1-1', 'foo ');
		assert.eq('#1-2', '2 operations have reverted.', wasavi.getLastMessage());

		yield wasavi.send('2\u0012');
		assert.value('#2-1', 'foo bar baz ');
		assert.eq('#2-2', '2 operations have executed again.', wasavi.getLastMessage());

		yield wasavi.send('100u');
		assert.value('#3-1', '');
		assert.eq('#3-2', '3 operations have reverted.', wasavi.getLastMessage());

		yield wasavi.send('100\u0012');
		assert.value('#4-1', 'foo bar baz ');
		assert.eq('#4-2', '3 operations have executed again.', wasavi.getLastMessage());
	});

	it('flipping undo', function* () {
		yield wasavi.send(':set undolevels=0\n');
		yield wasavi.send('afoo bar baz\u001b');

		yield wasavi.send('u');
		assert.value('#1-1', '');

		yield wasavi.send('u');
		assert.value('#2-1', 'foo bar baz');

		// in flipping undo mode, count must be ignored
		yield wasavi.send('100u');
		assert.value('#1-1', '');

		yield wasavi.send('100u');
		assert.value('#2-1', 'foo bar baz');
	});

	it('flipping redo', function* () {
		yield wasavi.send(':set undolevels=0\n');
		yield wasavi.send('afoo \u001b');
		yield wasavi.send('abar \u001b');
		yield wasavi.send('abaz \u001b');

		yield wasavi.send('u');
		assert.value('#1-1', 'foo bar ');
		yield wasavi.send('\u0012');
		assert.value('#1-2', 'foo bar ');
		assert.eq('#1-3', 'No undo item.', wasavi.getLastMessage());

		yield wasavi.send('u');
		assert.value('#2-1', 'foo bar baz ');
		yield wasavi.send('\u0012');
		assert.value('#2-2', 'foo bar baz ');
		assert.eq('#2-3', 'No redo item.', wasavi.getLastMessage());
	});
};

