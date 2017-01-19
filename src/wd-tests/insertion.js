'use strict';

const {By, Key, until, promise} = require('selenium-webdriver');
const {it, describe} = require('selenium-webdriver/testing');

exports.suite = (assert, wasavi, driver) => {
	const {ctrln, ctrlt, ctrlw} = assert.shortcuts;

	it('insert', function* () {
		yield wasavi.setInputModeOfWatchTarget('edit');
		yield wasavi.send('ifoobar');
		assert.eq('#1', 'edit', wasavi.getInputMode());

		yield wasavi.send('\u001b');
		assert.pos('#2-1', 0, 5);
		assert.eq('#2-2', 'foobar', wasavi.getValue());
		assert.eq('#2-3', 'foobar', wasavi.getRegister('.'));

		yield wasavi.send('3|iFOO\u001b');
		assert.pos('#3-1', 0, 4);
		assert.eq('#3-2', 'foFOOobar', wasavi.getValue());
		assert.eq('#3-3', 'FOO', wasavi.getRegister('.'));

		yield wasavi.send('3iBAR\u001b');
		assert.pos('#4-1', 0, 12);
		assert.eq('#4-2', 'foFOBARBARBAROobar', wasavi.getValue());
		assert.eq('#4-3', 'BAR', wasavi.getRegister('.'));
	});

	it('toTop', function* () {
		yield wasavi.setInputModeOfWatchTarget('edit');
		yield wasavi.send('Ifoobar');
		assert.eq('#1', 'edit', wasavi.getInputMode());

		yield wasavi.send('\u001b');
		assert.pos('#2-1', 0, 5);
		assert.eq('#2-2', 'foobar', wasavi.getValue());
		assert.eq('#2-3', 'foobar', wasavi.getRegister('.'));

		yield wasavi.send('3|IFOO\u001b');
		assert.pos('#3-1', 0, 2);
		assert.eq('#3-2', 'FOOfoobar', wasavi.getValue());
		assert.eq('#3-3', 'FOO', wasavi.getRegister('.'));

		yield wasavi.send('3IBAR\u001b');
		assert.pos('#4-1', 0, 8);
		assert.eq('#4-2', 'BARBARBARFOOfoobar', wasavi.getValue());
		assert.eq('#4-3', 'BAR', wasavi.getRegister('.'));
	});

	it('toTail', function* () {
		yield wasavi.setInputModeOfWatchTarget('edit');
		yield wasavi.send('Afoobar');
		assert.eq('#1', 'edit', wasavi.getInputMode());

		yield wasavi.send('\u001b');
		assert.pos('#2-1', 0, 5);
		assert.eq('#2-2', 'foobar', wasavi.getValue());
		assert.eq('#2-3', 'foobar', wasavi.getRegister('.'));

		yield wasavi.send('0AFOO\u001b');
		assert.pos('#3-1', 0, 8);
		assert.eq('#3-2', 'foobarFOO', wasavi.getValue());
		assert.eq('#3-3', 'FOO', wasavi.getRegister('.'));

		yield wasavi.send('03ABAR\u001b');
		assert.pos('#4-1', 0, 17);
		assert.eq('#4-2', 'foobarFOOBARBARBAR', wasavi.getValue());
		assert.eq('#4-3', 'BAR', wasavi.getRegister('.'));
	});

	it('literal', function* () {
		yield wasavi.send(':set noai\n');

		// general control code: form-feed (shoude be converted to Unicode
		// Control Pictures)
		yield wasavi.send('i\u0016\u000bfoo\u001b');
		assert.value('#1-1', '\u000bfoo');
		assert.eq('#1-2', '\u0016\u000bfoo', wasavi.getRegister('.'));
		yield wasavi.send('u');
		assert.value('#1-3', '');
		yield wasavi.send('\u0012');
		assert.value('#1-4', '\u000bfoo');

		// special control code: tab
		yield wasavi.send('cc\u0016\u0009foo\u001b');
		assert.value('#2-1', '\u0009foo');
		assert.eq('#2-2', '\u0016\u0009foo', wasavi.getRegister('.'));
		yield wasavi.send('u');
		assert.value('#2-3', '\u000bfoo');
		yield wasavi.send('\u0012');
		assert.value('#2-4', '\u0009foo');

		// special control code: escape
		yield wasavi.send('cc\u0016\u001bbar\u001b');
		assert.value('#3-1', '\u001bbar');
		assert.eq('#3-2', '\u0016\u001bbar', wasavi.getRegister('.'));
		yield wasavi.send('u');
		assert.value('#3-3', '\u0009foo');
		yield wasavi.send('\u0012');
		assert.value('#3-4', '\u001bbar');

		// special control code: newline
		yield wasavi.send('cc\u0016\nbaz\u001b');
		assert.value('#4-1', '\nbaz');
		assert.eq('#4-2', '\u0016\nbaz', wasavi.getRegister('.'));
		yield wasavi.send('u');
		assert.value('#4-3', '\u001bbar');
		yield wasavi.send('\u0012');
		assert.value('#4-4', '\nbaz');
	});

	it('literal_LineInput', function* () {
		yield wasavi.send(':"\u0016\u000bfoo\n');
		assert.eq('#1-1', '"\u000bfoo', wasavi.getRegister(':'));

		yield wasavi.send(':"\u0016\u0009foo\n');
		assert.eq('#2-1', '"\u0009foo', wasavi.getRegister(':'));

		yield wasavi.send(':"\u0016\u001bbar\n');
		assert.eq('#3-1', '"\u001bbar', wasavi.getRegister(':'));

		yield wasavi.send(':"\u0016' + Key.ENTER + 'baz\n');
		assert.eq('#4-1', '"\rbaz', wasavi.getRegister(':'));
	});

	it('byDecimalCodePoint', function* () {
		yield wasavi.send(':set noai\n');

		// 3 chars
		yield wasavi.send('i\u0016009foo\u001b');
		assert.value('#1-1', '\u0009foo');
		assert.eq('#1-2', '\u0016009foo', wasavi.getRegister('.'));
		yield wasavi.send('u');
		assert.value('#1-3', '');
		yield wasavi.send('\u0012');
		assert.value('#1-4', '\u0009foo');

		// less chars and implicit completion
		yield wasavi.send('cc\u00169bar\u001b');
		assert.value('#2-1', '\u0009bar');
		assert.eq('#2-2', '\u00169bar', wasavi.getRegister('.'));
		yield wasavi.send('u');
		assert.value('#2-3', '\u0009foo');
		yield wasavi.send('\u0012');
		assert.value('#2-4', '\u0009bar');

		// less chars and explicit completion
		yield wasavi.send('cc\u00169' + Key.ENTER + '\u001b');
		assert.value('#3-1', '\u0009');
		assert.eq('#3-2', '\u00169\n', wasavi.getRegister('.'));
		yield wasavi.send('u');
		assert.value('#3-3', '\u0009bar');
		yield wasavi.send('\u0012');
		assert.value('#3-4', '\u0009');

		// less chars and cancelaration
		yield wasavi.send('cc\u00169\u001bfoo\u001b');
		assert.value('#4-1', 'foo');
		assert.eq('#4-2', 'foo', wasavi.getRegister('.'));
		yield wasavi.send('u');
		assert.value('#4-3', '\u0009');
		yield wasavi.send('\u0012');
		assert.value('#4-4', 'foo');
	});

	it('byDecimalCodePoint_LineInput', function* () {
		// 3 chars
		yield wasavi.send(':"\u0016009foo\n');
		assert.eq('#1-1', '"\u0009foo', wasavi.getRegister(':'));

		// less chars and implicit completion
		yield wasavi.send(':"\u00169bar\n');
		assert.eq('#2-1', '"\u0009bar', wasavi.getRegister(':'));

		// less chars and explicit completion
		yield wasavi.send(':"\u00169\n\n');
		assert.eq('#3-1', '"\u0009', wasavi.getRegister(':'));

		// less chars and cancelaration
		yield wasavi.send(':"\u00169\u001bfoo\n');
		assert.eq('#4-1', '"foo', wasavi.getRegister(':'));
	});

	it('octal code point', function* () {
		this.timeout(1000 * 30);

		// 3 chars
		yield wasavi.send(':set noai\n');

		yield wasavi.send('i\u0016o011foo\u001b');
		assert.value('#1-1', '\u0009foo');
		assert.eq('#1-2', '\u0016o011foo', wasavi.getRegister('.'));
		yield wasavi.send('u');
		assert.value('#1-3', '');
		yield wasavi.send('\u0012');
		assert.value('#1-4', '\u0009foo');

		yield wasavi.send('cc\u0016O011bar\u001b');
		assert.value('#1-5', '\u0009bar');
		assert.eq('#1-6', '\u0016O011bar', wasavi.getRegister('.'));
		yield wasavi.send('u');
		assert.value('#1-7', '\u0009foo');
		yield wasavi.send('\u0012');
		assert.value('#1-8', '\u0009bar');

		// missing chars, and implicit completion
		yield wasavi.send('cc\u0016o11foo\u001b');
		assert.value('#2-1', '\u0009foo');
		assert.eq('#2-2', '\u0016o11foo', wasavi.getRegister('.'));
		yield wasavi.send('u');
		assert.value('#2-3', '\u0009bar');
		yield wasavi.send('\u0012');
		assert.value('#2-4', '\u0009foo');

		yield wasavi.send('cc\u0016O11bar\u001b');
		assert.value('#2-5', '\u0009bar');
		assert.eq('#2-6', '\u0016O11bar', wasavi.getRegister('.'));
		yield wasavi.send('u');
		assert.value('#2-7', '\u0009foo');
		yield wasavi.send('\u0012');
		assert.value('#2-8', '\u0009bar');

		// missing chars, and explicit completion
		yield wasavi.send('cc\u0016o11' + Key.ENTER + 'foo' + '\u001b');
		assert.value('#3-1', '\u0009foo');
		assert.eq('#3-2', '\u0016o11\nfoo', wasavi.getRegister('.'));
		yield wasavi.send('u');
		assert.value('#3-3', '\u0009bar');
		yield wasavi.send('\u0012');
		assert.value('#3-4', '\u0009foo');

		yield wasavi.send('cc\u0016O11' + Key.ENTER + 'bar' + '\u001b');
		assert.value('#3-5', '\u0009bar');
		assert.eq('#3-6', '\u0016O11\nbar', wasavi.getRegister('.'));
		yield wasavi.send('u');
		assert.value('#3-7', '\u0009foo');
		yield wasavi.send('\u0012');
		assert.value('#3-8', '\u0009bar');

		// missing chars, and cancellaration
		yield wasavi.send('cc\u0016o1\u001bfoo\u001b');
		assert.value('#4-1', 'foo');
		assert.eq('#4-2', 'foo', wasavi.getRegister('.'));
		yield wasavi.send('u');
		assert.value('#4-3', '\u0009bar');
		yield wasavi.send('\u0012');
		assert.value('#4-4', 'foo');

		yield wasavi.send('cc\u0016O1\u001bbar\u001b');
		assert.value('#4-5', 'bar');
		assert.eq('#4-6', 'bar', wasavi.getRegister('.'));
		yield wasavi.send('u');
		assert.value('#4-7', 'foo');
		yield wasavi.send('\u0012');
		assert.value('#4-8', 'bar');
	});

	it('octal code point in line input', function* () {
		// 3 chars
		yield wasavi.send(':"\u0016o011foo\n');
		assert.eq('#1-1', '"\u0009foo', wasavi.getRegister(':'));

		yield wasavi.send(':"\u0016O011bar\n');
		assert.eq('#1-2', '"\u0009bar', wasavi.getRegister(':'));

		// less chars and implicit completion
		yield wasavi.send(':"\u0016o11foo\n');
		assert.eq('#2-1', '"\u0009foo', wasavi.getRegister(':'));

		yield wasavi.send(':"\u0016O11bar\n');
		assert.eq('#2-2', '"\u0009bar', wasavi.getRegister(':'));

		// less chars and explicit completion
		yield wasavi.send(':"\u0016o11\nfoo\n');
		assert.eq('#3-1', '"\u0009foo', wasavi.getRegister(':'));

		yield wasavi.send(':"\u0016O11\nbar\n');
		assert.eq('#3-2', '"\u0009bar', wasavi.getRegister(':'));

		// less chars and cancelaration
		yield wasavi.send(':"\u0016o1\u001bfoo\n');
		assert.eq('#4-1', '"foo', wasavi.getRegister(':'));

		yield wasavi.send(':"\u0016O1\u001bbar\n');
		assert.eq('#4-1', '"bar', wasavi.getRegister(':'));
	});

	it('hexa code point', function* () {
		this.timeout(1000 * 30);

		yield wasavi.send(':set noai\n');

		// 2 chars
		yield wasavi.send('i\u0016x09Zoo\u001b');
		assert.value('#1-1', '\u0009Zoo');
		assert.eq('#1-2', '\u0016x09Zoo', wasavi.getRegister('.'));
		yield wasavi.send('u');
		assert.value('#1-3', '');
		yield wasavi.send('\u0012');
		assert.value('#1-4', '\u0009Zoo');

		yield wasavi.send('cc\u0016X09Zar\u001b');
		assert.value('#1-5', '\u0009Zar');
		assert.eq('#1-6', '\u0016X09Zar', wasavi.getRegister('.'));
		yield wasavi.send('u');
		assert.value('#1-7', '\u0009Zoo');
		yield wasavi.send('\u0012');
		assert.value('#1-8', '\u0009Zar');

		// less chars and implicit completion
		yield wasavi.send('cc\u0016x9Zoo\u001b');
		assert.value('#2-1', '\u0009Zoo');
		assert.eq('#2-2', '\u0016x9Zoo', wasavi.getRegister('.'));
		yield wasavi.send('u');
		assert.value('#2-3', '\u0009Zar');
		yield wasavi.send('\u0012');
		assert.value('#2-4', '\u0009Zoo');

		yield wasavi.send('cc\u0016X9Zar\u001b');
		assert.value('#2-5', '\u0009Zar');
		assert.eq('#2-6', '\u0016X9Zar', wasavi.getRegister('.'));
		yield wasavi.send('u');
		assert.value('#2-7', '\u0009Zoo');
		yield wasavi.send('\u0012');
		assert.value('#2-8', '\u0009Zar');

		// less chars and explicit completion
		yield wasavi.send('cc\u0016x9' + Key.ENTER + 'foo' + '\u001b');
		assert.value('#3-1', '\u0009foo');
		assert.eq('#3-2', '\u0016x9\nfoo', wasavi.getRegister('.'));
		yield wasavi.send('u');
		assert.value('#3-3', '\u0009Zar');
		yield wasavi.send('\u0012');
		assert.value('#3-4', '\u0009foo');

		yield wasavi.send('cc\u0016X9' + Key.ENTER + 'bar' + '\u001b');
		assert.value('#3-5', '\u0009bar');
		assert.eq('#3-6', '\u0016X9\nbar', wasavi.getRegister('.'));
		yield wasavi.send('u');
		assert.value('#3-7', '\u0009foo');
		yield wasavi.send('\u0012');
		assert.value('#3-8', '\u0009bar');

		// less chars and cancelaration
		yield wasavi.send('cc\u0016x9\u001bfoo\u001b');
		assert.value('#4-1', 'foo');
		assert.eq('#4-2', 'foo', wasavi.getRegister('.'));
		yield wasavi.send('u');
		assert.value('#4-3', '\u0009bar');
		yield wasavi.send('\u0012');
		assert.value('#4-4', 'foo');

		yield wasavi.send('cc\u0016X9\u001bbar\u001b');
		assert.value('#4-5', 'bar');
		assert.eq('#4-6', 'bar', wasavi.getRegister('.'));
		yield wasavi.send('u');
		assert.value('#4-7', 'foo');
		yield wasavi.send('\u0012');
		assert.value('#4-8', 'bar');
	});

	it('byHexaCodePoint_LineInput', function* () {
		// 2 chars
		yield wasavi.send(':"\u0016x09Zoo\n');
		assert.eq('#1-1', '"\u0009Zoo', wasavi.getRegister(':'));

		yield wasavi.send(':"\u0016X09Zar\n');
		assert.eq('#1-2', '"\u0009Zar', wasavi.getRegister(':'));

		// less chars and implicit completion
		yield wasavi.send(':"\u0016x9Zoo\n');
		assert.eq('#2-1', '"\u0009Zoo', wasavi.getRegister(':'));

		yield wasavi.send(':"\u0016X9Zar\n');
		assert.eq('#2-2', '"\u0009Zar', wasavi.getRegister(':'));

		// less chars and explicit completion
		yield wasavi.send(':"\u0016x9\nfoo\n');
		assert.eq('#3-1', '"\u0009foo', wasavi.getRegister(':'));

		yield wasavi.send(':"\u0016X9\nbar\n');
		assert.eq('#3-2', '"\u0009bar', wasavi.getRegister(':'));

		// less chars and cancelaration
		yield wasavi.send(':"\u0016x9\u001bfoo\n');
		assert.eq('#4-1', '"foo', wasavi.getRegister(':'));

		yield wasavi.send(':"\u0016X9\u001bbar\n');
		assert.eq('#4-1', '"bar', wasavi.getRegister(':'));
	});

	it('byBMPCodePoint', function* () {
		yield wasavi.send(':set noai\n');

		// 4 chars
		yield wasavi.send('i\u0016u0009Zoo\u001b');
		assert.value('#1-1', '\u0009Zoo');
		assert.eq('#1-2', '\u0016u0009Zoo', wasavi.getRegister('.'));
		yield wasavi.send('u');
		assert.value('#1-3', '');
		yield wasavi.send('\u0012');
		assert.value('#1-4', '\u0009Zoo');

		// less chars and implicit completion
		yield wasavi.send('cc\u0016u9Yoo\u001b');
		assert.value('#2-1', '\u0009Yoo');
		assert.eq('#2-2', '\u0016u9Yoo', wasavi.getRegister('.'));
		yield wasavi.send('u');
		assert.value('#2-3', '\u0009Zoo');
		yield wasavi.send('\u0012');
		assert.value('#2-4', '\u0009Yoo');

		// less chars and explicit completion
		yield wasavi.send('cc\u0016u9' + Key.ENTER + 'foo' + '\u001b');
		assert.value('#3-1', '\u0009foo');
		assert.eq('#3-2', '\u0016u9\nfoo', wasavi.getRegister('.'));
		yield wasavi.send('u');
		assert.value('#3-3', '\u0009Yoo');
		yield wasavi.send('\u0012');
		assert.value('#3-4', '\u0009foo');

		// less chars and cancelaration
		yield wasavi.send('cc\u0016u9\u001bfoo\u001b');
		assert.value('#4-1', 'foo');
		assert.eq('#4-2', 'foo', wasavi.getRegister('.'));
		yield wasavi.send('u');
		assert.value('#4-3', '\u0009foo');
		yield wasavi.send('\u0012');
		assert.value('#4-4', 'foo');
	});

	it('byBMPCodePoint_LineInput', function* () {
		// 4 chars
		yield wasavi.send(':"\u0016u0009Zoo\n');
		assert.eq('#1-1', '"\u0009Zoo', wasavi.getRegister(':'));

		// less chars and implicit completion
		yield wasavi.send(':"\u0016u9Zoo\n');
		assert.eq('#2-1', '"\u0009Zoo', wasavi.getRegister(':'));

		// less chars and explicit completion
		yield wasavi.send(':"\u0016u9\nfoo\n');
		assert.eq('#3-1', '"\u0009foo', wasavi.getRegister(':'));

		// less chars and cancelaration
		yield wasavi.send(':"\u0016u9\u001bfoo\n');
		assert.eq('#4-1', '"foo', wasavi.getRegister(':'));
	});

	it('Unicode code point', function* () {
		this.timeout(1000 * 30);

		yield wasavi.send(':set noai\n');

		// 6 chars
		yield wasavi.send('i\u0016U000009Zoo\u001b');
		assert.value('#1-1', '\u0009Zoo');
		assert.eq('#1-2', '\u0016U000009Zoo', wasavi.getRegister('.'));
		yield wasavi.send('u');
		assert.value('#1-3', '');
		yield wasavi.send('\u0012');
		assert.value('#1-4', '\u0009Zoo');

		// less chars and implicit completion
		yield wasavi.send('cc\u0016U9Yoo\u001b');
		assert.value('#2-1', '\u0009Yoo');
		assert.eq('#2-2', '\u0016U9Yoo', wasavi.getRegister('.'));
		yield wasavi.send('u');
		assert.value('#2-3', '\u0009Zoo');
		yield wasavi.send('\u0012');
		assert.value('#2-4', '\u0009Yoo');

		// less chars and explicit completion
		yield wasavi.send('cc\u0016U9' + Key.ENTER + 'foo' + '\u001b');
		assert.value('#3-1', '\u0009foo');
		assert.eq('#3-2', '\u0016U9\nfoo', wasavi.getRegister('.'));
		yield wasavi.send('u');
		assert.value('#3-3', '\u0009Yoo');
		yield wasavi.send('\u0012');
		assert.value('#3-4', '\u0009foo');

		// less chars and cancelaration
		yield wasavi.send('cc\u0016U9\u001bfoo\u001b');
		assert.value('#4-1', 'foo');
		assert.eq('#4-2', 'foo', wasavi.getRegister('.'));
		yield wasavi.send('u');
		assert.value('#4-3', '\u0009foo');
		yield wasavi.send('\u0012');
		assert.value('#4-4', 'foo');

		// surrogate pair:
		//   U+20268 -> D841 + DE28
		yield wasavi.send('cc\u0016U020628\u001b');
		assert.value('#5-1', '\ud841\ude28');
		assert.eq('#5-2', '\u0016U020628', wasavi.getRegister('.'));
		yield wasavi.send('u');
		assert.value('#5-3', 'foo');
		yield wasavi.send('\u0012');
		assert.value('#5-4', '\ud841\ude28');

		// out of code point range
		yield wasavi.send('cc\u0016U110000Zoo\u001b');
		assert.value('#6-1', 'Zoo');
		assert.t('#6-2', wasavi.getLastMessage().length > 0);
		assert.eq('#6-3', 'Zoo', wasavi.getRegister('.'));
		yield wasavi.send('u');
		assert.value('#6-4', '\ud841\ude28');
		yield wasavi.send('\u0012');
		assert.value('#6-5', 'Zoo');
	});

	it('byUnicodeCodePoint_LineInput', function* () {
		// 6 chars
		yield wasavi.send(':"\u0016U000009Zoo\n');
		assert.eq('#1-1', '"\u0009Zoo', wasavi.getRegister(':'));

		// less chars and implicit completion
		yield wasavi.send(':"\u0016U9Zoo\n');
		assert.eq('#2-1', '"\u0009Zoo', wasavi.getRegister(':'));

		// less chars and explicit completion
		yield wasavi.send(':"\u0016U9\nfoo\n');
		assert.eq('#3-1', '"\u0009foo', wasavi.getRegister(':'));

		// less chars and cancelaration
		yield wasavi.send(':"\u0016U9\u001bfoo\n');
		assert.eq('#4-1', '"foo', wasavi.getRegister(':'));

		// surrogate pair:
		//   U+20628 -> D841 + DE28
		yield wasavi.send(':"\u0016U020628\n');
		assert.eq('#5-1', '"\ud841\ude28', wasavi.getRegister(':'));

		// out of code point range
		yield wasavi.send(':"\u0016U110000Zoo\n');
		assert.eq('#6-1', '"Zoo', wasavi.getRegister(':'));
		//assert.t('#6-2', wasavi.getLastMessage().length > 0);
	});

	it('backspace', function* () {
		yield wasavi.send(
				'ifoa' +
				Key.BACK_SPACE +
				'o' +
				'\u001b');
		assert.value('#1-1', 'foo');
		assert.eq('#1-2', 'foa\u0008o', wasavi.getRegister('.'));
		assert.eq('#1-3', 'ifoa\u0008o\u001b', wasavi.getLastSimpleCommand());
		yield wasavi.send('u');
		assert.value('#1-4', '');
		yield wasavi.send('\u0012');
		assert.value('#1-5', 'foo');
	});

	it('backspaceOverwrite', function* () {
		yield wasavi.send(
				'Rfoa' +
				Key.BACK_SPACE +
				'o' +
				'\u001b');
		assert.value('#1-1', 'foo');
		assert.eq('#1-2', 'foa\u0008o', wasavi.getRegister('.'));
		assert.eq('#1-3', 'Rfoa\u0008o\u001b', wasavi.getLastSimpleCommand());
		yield wasavi.send('u');
		assert.value('#1-4', '');
		yield wasavi.send('\u0012');
		assert.value('#1-5', 'foo');
	});

	it('backspaceOverwriteOverrun', function* () {
		yield wasavi.send('afooo\u001bRbar' +
				Key.BACK_SPACE +
				Key.BACK_SPACE +
				Key.BACK_SPACE +
				Key.BACK_SPACE +
				Key.BACK_SPACE +
				'\u001b');
		assert.value('#1-1', 'foo');
		assert.eq('#1-2', 'bar\u0008\u0008\u0008\u0008\u0008', wasavi.getRegister('.'));
		assert.eq('#1-3', 'Rbar\u0008\u0008\u0008\u0008\u0008\u001b', wasavi.getLastSimpleCommand());
		yield wasavi.send('u');
		assert.value('#1-4', 'fooo');
		yield wasavi.send('\u0012');
		assert.value('#1-5', 'foo');
	});

	it('backspaceTopOfLine', function* () {
		yield wasavi.send('ifoo\n\u001b');
		yield wasavi.send('a' + Key.BACK_SPACE + Key.BACK_SPACE + '\u001b');
		assert.value('#1-1', 'fo');
		assert.eq('#1-2', '\u0008\u0008', wasavi.getRegister('.'));
		assert.eq('#1-3', 'a\u0008\u0008\u001b', wasavi.getLastSimpleCommand());
		yield wasavi.send('u');
		assert.value('#1-4', 'foo\n');
		yield wasavi.send('\u0012');
		assert.value('#1-5', 'fo');
	});

	it('backspaceTopOfLineOverwrite', function* () {
		yield wasavi.send('ifoo\n\u001b');
		yield wasavi.send('R' + Key.BACK_SPACE + Key.BACK_SPACE + '\u001b');
		assert.value('#1-1', 'foo\n');
		assert.eq('#1-2', '\u0008\u0008', wasavi.getRegister('.'));
		assert.eq('#1-3', 'R\u0008\u0008\u001b', wasavi.getLastSimpleCommand());
		yield wasavi.send('u');
		assert.value('#1-4', '');
		yield wasavi.send('\u0012');
		assert.value('#1-5', 'foo\n');
	});

	it('backspaceTopOfBuffer', function* () {
		yield wasavi.send('a' + Key.BACK_SPACE + Key.BACK_SPACE + '\u001b');
		assert.value('#1-1', '');
		assert.eq('#1-2', '', wasavi.getRegister('.'));
		assert.eq('#1-3', 'a\u001b', wasavi.getLastSimpleCommand());
		yield wasavi.send('u');
		assert.t('#1-4', wasavi.getLastMessage().length > 0);
		yield wasavi.send('\u0012');
		assert.t('#1-5', wasavi.getLastMessage().length > 0);
	});

	it('backspaceTopOfBufferOverwrite', function* () {
		yield wasavi.send('R' + Key.BACK_SPACE + Key.BACK_SPACE + '\u001b');
		assert.value('#1-1', '');
		assert.eq('#1-2', '', wasavi.getRegister('.'));
		assert.eq('#1-3', 'R\u001b', wasavi.getLastSimpleCommand());
		yield wasavi.send('u');
		assert.t('#1-4', wasavi.getLastMessage().length > 0);
		yield wasavi.send('\u0012');
		assert.t('#1-5', wasavi.getLastMessage().length > 0);
	});

	it('backspaceMiddleOfLine', function* () {
		yield wasavi.send('ifoobar\u001b');
		yield wasavi.send('a' + Key.BACK_SPACE + Key.BACK_SPACE + '\u001b');
		assert.value('#1-1', 'foob');
		assert.eq('#1-2', '\u0008\u0008', wasavi.getRegister('.'));
		assert.eq('#1-3', 'a\u0008\u0008\u001b', wasavi.getLastSimpleCommand());
		yield wasavi.send('u');
		assert.value('#1-4', 'foobar');
		yield wasavi.send('\u0012');
		assert.value('#1-5', 'foob');
	});

	it('backspaceMiddleOfLineOverwrite', function* () {
		yield wasavi.send('ifoobar\u001b');
		yield wasavi.send('R' + Key.BACK_SPACE + Key.BACK_SPACE + '\u001b');
		assert.value('#1-1', 'foobar');
		assert.eq('#1-2', '\u0008\u0008', wasavi.getRegister('.'));
		assert.eq('#1-3', 'R\u0008\u0008\u001b', wasavi.getLastSimpleCommand());
		yield wasavi.send('u');
		assert.value('#1-4', '');
		yield wasavi.send('\u0012');
		assert.value('#1-5', 'foobar');
	});

	it('delete', function* () {
		yield wasavi.send('idar\u001b1|');
		yield wasavi.send('ifoo' + Key.DELETE + 'b' + '\u001b');
		assert.value('#1-1', 'foobar');
		assert.eq('#1-2', 'foo\u007fb', wasavi.getRegister('.'));
		assert.eq('#1-3', 'ifoo\u007fb\u001b', wasavi.getLastSimpleCommand());
		yield wasavi.send('u');
		assert.value('#1-4', 'dar');
		yield wasavi.send('\u0012');
		assert.value('#1-5', 'foobar');
	});

	it('deleteOverwrite', function* () {
		yield wasavi.send('idar\u001b1|');
		yield wasavi.send('Rf' + Key.DELETE + 'e' + '\u001b');
		assert.value('#1-1', 'fe');
		assert.eq('#1-2', 'f\u007fe', wasavi.getRegister('.'));
		assert.eq('#1-3', 'Rf\u007fe\u001b', wasavi.getLastSimpleCommand());
		yield wasavi.send('u');
		assert.value('#1-4', 'dar');
		yield wasavi.send('\u0012');
		assert.value('#1-5', 'fe');
	});

	it('deleteTailOfLine', function* () {
		yield wasavi.send('ifoo\nbar\u001b1G$');
		yield wasavi.send('a' + Key.DELETE + Key.DELETE + '\u001b');
		assert.value('#1-1', 'fooar');
		assert.eq('#1-2', '\u007f\u007f', wasavi.getRegister('.'));
		assert.eq('#1-3', 'a\u007f\u007f\u001b', wasavi.getLastSimpleCommand());
		yield wasavi.send('u');
		assert.value('#1-4', 'foo\nbar');
		yield wasavi.send('\u0012');
		assert.value('#1-5', 'fooar');
	});

	it('deleteTailOfLineOverwrite', function* () {
		yield wasavi.send('ifoo\nbar\u001b1G$');
		yield wasavi.send('R' + Key.DELETE + Key.DELETE + '\u001b');
		assert.value('#1-1', 'fobar');
		assert.eq('#1-2', '\u007f\u007f', wasavi.getRegister('.'));
		assert.eq('#1-3', 'R\u007f\u007f\u001b', wasavi.getLastSimpleCommand());
		yield wasavi.send('u');
		assert.value('#1-4', 'foo\nbar');
		yield wasavi.send('\u0012');
		assert.value('#1-5', 'fobar');
	});

	it('deleteTailOfBuffer', function* () {
		yield wasavi.send('ifoobar\u001b');
		yield wasavi.send('$a' + Key.DELETE + Key.DELETE + '\u001b');
		assert.value('#1-1', 'foobar');
		/*
		 * wasavi doesn't update the register content with empty string.
		 * therefore, final stroke will be empty, but '.' register is still 'foobar'.
		 */
		assert.eq('#1-2', 'foobar', wasavi.getRegister('.'));
		assert.eq('#1-3', 'a\u001b', wasavi.getLastSimpleCommand());
		yield wasavi.send('u');
		assert.t('#1-4', wasavi.getLastMessage().length > 0);
		yield wasavi.send('\u0012');
		assert.t('#1-5', wasavi.getLastMessage().length > 0);
	});

	it('deleteTailOfBufferOverwrite', function* () {
		yield wasavi.send('ifoobar\u001b');
		yield wasavi.send('$R' + Key.ARROW_RIGHT + Key.DELETE + Key.DELETE + '\u001b');
		assert.value('#1-1', 'foobar');
		/*
		 * wasavi doesn't update the register content with empty string.
		 * therefore, final stroke will be empty, buf '.' register still 'foobar'.
		 */
		assert.eq('#1-2', 'foobar', wasavi.getRegister('.'));
		assert.eq('#1-3', 'R\u001b', wasavi.getLastSimpleCommand());
		yield wasavi.send('u');
		assert.t('#1-4', wasavi.getLastMessage().length > 0);
		yield wasavi.send('\u0012');
		assert.t('#1-5', wasavi.getLastMessage().length > 0);
	});

	it('deleteWord', function* () {
		yield wasavi.send('ifoo bar', ctrlw, 'o\u001b');
		assert.value('#1-1', 'foo o');
		assert.eq('#1-2', 'foo bar\u0017o', wasavi.getRegister('.'));
		assert.eq('#1-3', 'ifoo bar\u0017o\u001b', wasavi.getLastSimpleCommand());
		yield wasavi.send('u');
		assert.value('#1-4', '');
		yield wasavi.send('\u0012');
		assert.value('#1-5', 'foo o');
	});

	it('deleteWordOverwrite', function* () {
		yield wasavi.send('Rfoo bar', ctrlw, 'o\u001b');
		assert.value('#1-1', 'foo o');
		assert.eq('#1-2', 'foo bar\u0017o', wasavi.getRegister('.'));
		assert.eq('#1-3', 'Rfoo bar\u0017o\u001b', wasavi.getLastSimpleCommand());
		yield wasavi.send('u');
		assert.value('#1-4', '');
		yield wasavi.send('\u0012');
		assert.value('#1-5', 'foo o');
	});

	it('deleteWordBoundary', function* () {
		yield wasavi.send('afoo\u001b');
		yield wasavi.send('abar', ctrlw, '\u001b');
		assert.value('#1-1', 'foo');
		yield wasavi.send('u');
		assert.value('#1-2', 'foo');
		yield wasavi.send('u');
		assert.value('#1-3', '');
		yield wasavi.send('\u0012');
		assert.value('#1-4', 'foo');
		yield wasavi.send('\u0012');
		assert.value('#1-5', 'foo');
	});

	it('deleteWordTopOfLine', function* () {
		yield wasavi.send('ifoo bar\n\u001b');
		yield wasavi.send('a\tbaz', ctrlw, ctrlw, ctrlw, '\u001b');
		assert.value('#1-1', 'foo bar');
		assert.eq('#1-2', '\tbaz\u0017\u0017\u0017', wasavi.getRegister('.'));
		assert.eq('#1-3', 'a\tbaz\u0017\u0017\u0017\u001b', wasavi.getLastSimpleCommand());
		yield wasavi.send('u');
		assert.value('#1-4', 'foo bar\n');
		yield wasavi.send('\u0012');
		assert.value('#1-5', 'foo bar');
	});

	it('deleteWordTopOfLineOverwrite', function* () {
		yield wasavi.send('ifoo\n\u001b');
		yield wasavi.send('R', ctrlw, ctrlw, '\u001b');
		assert.value('#1-1', 'foo\n');
		assert.eq('#1-2', '\u0017\u0017', wasavi.getRegister('.'));
		assert.eq('#1-3', 'R\u0017\u0017\u001b', wasavi.getLastSimpleCommand());
		yield wasavi.send('u');
		assert.value('#1-4', '');
		yield wasavi.send('\u0012');
		assert.value('#1-5', 'foo\n');
	});

	it('deleteWordTopOfBuffer', function* () {
		yield wasavi.send('a', ctrlw, ctrlw, '\u001b');
		assert.value('#1-1', '');
		assert.eq('#1-2', '', wasavi.getRegister('.'));
		assert.eq('#1-3', 'a\u001b', wasavi.getLastSimpleCommand());
		yield wasavi.send('u');
		assert.t('#1-4', wasavi.getLastMessage().length > 0);
		yield wasavi.send('\u0012');
		assert.t('#1-5', wasavi.getLastMessage().length > 0);
	});

	it('deleteWordTopOfBufferOverwrite', function* () {
		yield wasavi.send('R', ctrlw, ctrlw, '\u001b');
		assert.value('#1-1', '');
		assert.eq('#1-2', '', wasavi.getRegister('.'));
		assert.eq('#1-3', 'R\u001b', wasavi.getLastSimpleCommand());
		yield wasavi.send('u');
		assert.t('#1-4', wasavi.getLastMessage().length > 0);
		yield wasavi.send('\u0012');
		assert.t('#1-5', wasavi.getLastMessage().length > 0);
	});

	it('deleteWordMiddleOfLine', function* () {
		yield wasavi.send('ifoo bar baz\u001b');
		yield wasavi.send('a', ctrlw, ctrlw, '\u001b');
		assert.value('#1-1', 'foo ');
		assert.eq('#1-2', '\u0017\u0017', wasavi.getRegister('.'));
		assert.eq('#1-3', 'a\u0017\u0017\u001b', wasavi.getLastSimpleCommand());
		yield wasavi.send('u');
		assert.value('#1-4', 'foo bar baz');
		yield wasavi.send('\u0012');
		assert.value('#1-5', 'foo ');
	});

	it('deleteWordMiddleOfLineOverwrite', function* () {
		yield wasavi.send('ifoo bar baz\u001b');
		yield wasavi.send('R', ctrlw, ctrlw, '\u001b');
		assert.value('#1-1', 'foo bar baz');
		assert.eq('#1-2', '\u0017\u0017', wasavi.getRegister('.'));
		assert.eq('#1-3', 'R\u0017\u0017\u001b', wasavi.getLastSimpleCommand());
		yield wasavi.send('u');
		assert.value('#1-4', '');
		yield wasavi.send('\u0012');
		assert.value('#1-5', 'foo bar baz');
	});

	it('deleteLine', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('ifoo\u001babar\u0015baz\u001b');
		assert.value('#1-1', 'foobaz');
		assert.eq('#1-2', 'bar\u0015baz', wasavi.getRegister('.'));
		assert.eq('#1-3', 'abar\u0015baz\u001b', wasavi.getLastSimpleCommand());
		yield wasavi.send('u');
		assert.value('#1-4', 'foo');
		yield wasavi.send('\u0012');
		assert.value('#1-5', 'foobaz');
	});

	it('deleteLineNoAI', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('i\t\tfoobar\u0015baz\u001b');
		assert.value('#1-1', 'baz');
		assert.eq('#1-2', '\t\tfoobar\u0015baz', wasavi.getRegister('.'));
		assert.eq('#1-3', 'i\t\tfoobar\u0015baz\u001b', wasavi.getLastSimpleCommand());
		yield wasavi.send('u');
		assert.value('#1-4', '');
		yield wasavi.send('\u0012');
		assert.value('#1-5', 'baz');
	});

	it('deleteLineAI', function* () {
		yield wasavi.send(':set ai\n');
		yield wasavi.send('i\t\tfoobar\u0015baz\u001b');
		assert.value('#1-1', '\t\tbaz');
		assert.eq('#1-2', '\t\tfoobar\u0015baz', wasavi.getRegister('.'));
		assert.eq('#1-3', 'i\t\tfoobar\u0015baz\u001b', wasavi.getLastSimpleCommand());
		yield wasavi.send('u');
		assert.value('#1-4', '');
		yield wasavi.send('\u0012');
		assert.value('#1-5', '\t\tbaz');
	});

	it('deleteSecondLineNoAI', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('ifoo\n\tbar\u0015\u001b');
		assert.value('#1-1', 'foo\n');
		assert.eq('#1-2', 'foo\n\tbar\u0015', wasavi.getRegister('.'));
		assert.eq('#1-3', 'ifoo\n\tbar\u0015\u001b', wasavi.getLastSimpleCommand());
		yield wasavi.send('u');
		assert.value('#1-4', '');
		yield wasavi.send('\u0012');
		assert.value('#1-5', 'foo\n');
	});

	it('deleteSecondLineAI', function* () {
		yield wasavi.send(':set ai\n');
		yield wasavi.send('ifoo\n\tbar\u0015\u001b');
		assert.value('#1-1', 'foo\n\t');
		assert.eq('#1-2', 'foo\n\tbar\u0015', wasavi.getRegister('.'));
		assert.eq('#1-3', 'ifoo\n\tbar\u0015\u001b', wasavi.getLastSimpleCommand());
		yield wasavi.send('u');
		assert.value('#1-4', '');
		yield wasavi.send('\u0012');
		assert.value('#1-5', 'foo\n\t');
	});

	it('deleteLineOverrunNoAI', function* () {
		/*
		 * three types of word deletion:
		 *
		 * ....first        ....first        ....first        ....first
		 * ....second  -->  ....second  -->  ....second  -->  ....second[]
		 * ....third[]      ....[]           []
		 */
		yield wasavi.send(':set noai\n');
		yield wasavi.send('i\tfirst\n\tsecond\n\tthird\u001b');
		yield wasavi.send('a', ctrlw, ctrlw, ctrlw, '\u0015\u001b');
		assert.value('#1-1', '\tfirst\n');
		assert.eq('#1-2', '\u0017\u0017\u0017\u0015', wasavi.getRegister('.'));
		assert.eq('#1-3', 'a\u0017\u0017\u0017\u0015\u001b', wasavi.getLastSimpleCommand());
		yield wasavi.send('u');
		assert.value('#1-4', '\tfirst\n\tsecond\n\tthird');
		yield wasavi.send('\u0012');
		assert.value('#1-5', '\tfirst\n');
	});

	it('deleteLineOverrunAI', function* () {
		yield wasavi.send(':set ai\n');
		yield wasavi.send('i\tfirst\nsecond\nthird\u001b');
		yield wasavi.send('a', ctrlw, ctrlw, ctrlw, '\u0015\u001b');
		assert.value('#1-1', '\tfirst\n\t');
		assert.eq('#1-2', '\u0017\u0017\u0017\u0015', wasavi.getRegister('.'));
		assert.eq('#1-3', 'a\u0017\u0017\u0017\u0015\u001b', wasavi.getLastSimpleCommand());
		yield wasavi.send('u');
		assert.value('#1-4', '\tfirst\n\tsecond\n\tthird');
		yield wasavi.send('\u0012');
		assert.value('#1-5', '\tfirst\n\t');
	});

	it('deleteLineOverrunOverwrite', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('i\tfirst\n\tsecond\n\tthird\u001b');
		yield wasavi.send('R', ctrlw, ctrlw, ctrlw, '\u0015\u001b');
		assert.value('#1-1', '\tfirst\n\tsecond\n\tthird');
		assert.eq('#1-2', '\u0017\u0017\u0017\u0015', wasavi.getRegister('.'));
		assert.eq('#1-3', 'R\u0017\u0017\u0017\u0015\u001b', wasavi.getLastSimpleCommand());
		yield wasavi.send('u');
		assert.value('#1-4', '');
		yield wasavi.send('\u0012');
		assert.value('#1-5', '\tfirst\n\tsecond\n\tthird');
	});

	it('newSession', function* () {
		yield wasavi.send('ifoo' + Key.ARROW_LEFT + 'bar\u001b');
		assert.value('#1-1', 'fobaro');
		assert.eq('#1-2', 'bar', wasavi.getRegister('.'));
		assert.eq('#1-3', 'ibar\u001b', wasavi.getLastSimpleCommand());
		yield wasavi.send('u');
		assert.value('#1-4', 'foo');
		yield wasavi.send('u');
		assert.value('#1-5', '');
		yield wasavi.send('\u0012');
		assert.value('#1-6', 'foo');
		yield wasavi.send('\u0012');
		assert.value('#1-7', 'fobaro');
	});

	it('lastInputPoint', function* () {
		yield wasavi.send('ifoo\u001b1|gibar\u001b');
		assert.value('#1-1', 'foobar');
	});

	it('shift', function* () {
		yield wasavi.send(':set sw=4 ts=8 ai\n');
		yield wasavi.send('iFOO\nfoobar', ctrlt, 'baz\u001b');
		assert.value('#1-1', 'FOO\n    foobarbaz');
		assert.eq('#1-2', 'FOO\nfoobar\u0014baz', wasavi.getRegister('.'));
		assert.eq('#1-3', 'iFOO\nfoobar\u0014baz\u001b', wasavi.getLastSimpleCommand());
		yield wasavi.send('u');
		assert.value('#1-4', '');
		yield wasavi.send('\u0012');
		assert.value('#1-5', 'FOO\n    foobarbaz');
	});

	it('unshift', function* () {
		yield wasavi.send(':set sw=4 ts=8 ai\n');
		yield wasavi.send('i\t\tFOO\nfoobar\u0004baz\u001b');
		assert.value('#1-1', '\t\tFOO\n\t    foobarbaz');
		assert.eq('#1-2', '\t\tFOO\nfoobar\u0004baz', wasavi.getRegister('.'));
		assert.eq('#1-3', 'i\t\tFOO\nfoobar\u0004baz\u001b', wasavi.getLastSimpleCommand());
		yield wasavi.send('u');
		assert.value('#1-4', '');
		yield wasavi.send('\u0012');
		assert.value('#1-5', '\t\tFOO\n\t    foobarbaz');
	});

	it('unshift0', function* () {
		yield wasavi.send(':set sw=4 ts=8 ai\n');
		yield wasavi.send('i\t\tFOO\nfoobar0\u0004baz\u001b');
		assert.value('#1-1', '\t\tFOO\nfoobarbaz');
		assert.eq('#1-2', '\t\tFOO\nfoobar0\u0004baz', wasavi.getRegister('.'));
		assert.eq('#1-3', 'i\t\tFOO\nfoobar0\u0004baz\u001b', wasavi.getLastSimpleCommand());
		yield wasavi.send('u');
		assert.value('#1-4', '');
		yield wasavi.send('\u0012');
		assert.value('#1-5', '\t\tFOO\nfoobarbaz');

		yield wasavi.send('Go!\u001b');
		assert.value('#1-6', '\t\tFOO\nfoobarbaz\n!');
	});

	it('unshiftCaret', function* () {
		yield wasavi.send(':set sw=4 ts=8 ai\n');
		yield wasavi.send('i\t\tFOO\nfoobar^\u0004baz\u001b');
		assert.value('#1-1', '\t\tFOO\nfoobarbaz');
		assert.eq('#1-2', '\t\tFOO\nfoobar^\u0004baz', wasavi.getRegister('.'));
		assert.eq('#1-3', 'i\t\tFOO\nfoobar^\u0004baz\u001b', wasavi.getLastSimpleCommand());

		yield wasavi.send('Go!\u001b');
		assert.value('#1-4', '\t\tFOO\nfoobarbaz\n\t\t!');

		yield wasavi.send('u');
		assert.value('#1-5', '\t\tFOO\nfoobarbaz');
		yield wasavi.send('u');
		assert.value('#1-6', '');
		yield wasavi.send('\u0012');
		assert.value('#1-7', '\t\tFOO\nfoobarbaz');
	});

	it('autoFormat', function* () {
		yield wasavi.send(':set tw=30 undoboundlen=0\n');
		yield wasavi.send(
			'i' +
			'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.\n' +
			'\n' +
			'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.' +
			'\u001b');

		var formatted = [
			'Lorem ipsum dolor sit amet,',
			'consectetur adipisicing elit,',
			'sed do eiusmod tempor',
			'incididunt ut labore et dolore',
			'magna aliqua.',
			'',
			'Ut enim ad minim veniam, quis',
			'nostrud exercitation ullamco',
			'laboris nisi ut aliquip ex ea',
			'commodo consequat.'
		].join('\n');

		assert.value('#1-1', formatted);
		yield wasavi.send('u');
		assert.t('#1-2', wasavi.getValue().length < formatted.length);
		yield wasavi.send('\u0012');
		assert.value('#1-3', formatted);
	});

	it('expandTab', function* () {
		yield wasavi.send(':set expandtab ts=8 sw=4\n');
		/*
		 * '    foo'			insert 4 spaces and "foo"
		 * '    \tfoo'			move to top of line, insert tab
		 * '        foo'		4 spaces must be inserted (total indent is 8 spaces)
		 */
		yield wasavi.setInputModeOfWatchTarget('edit');
		yield wasavi.send('a    foo\u001b^i\t');
		assert.value('#1-1', '        foo');
		assert.pos('#1-2', 0, 8);
		yield wasavi.send('\u001b');

		yield wasavi.send('u');
		assert.value('#1-3', '    foo');
		yield wasavi.send('\u0012');
		assert.value('#1-4', '        foo');
	});

	it('noExpandTab', function* () {
		yield wasavi.send(':set noexpandtab ts=8 sw=4\n');
		/*
		 * '    foo'			insert 4 spaces and "foo"
		 * '    \tfoo'			move to top of line, insert tab
		 * '\tfoo'				indent normalization is executed
		 */
		yield wasavi.setInputModeOfWatchTarget('edit');
		yield wasavi.send('a    foo\u001b^i\t');
		assert.value('#1-1', '\tfoo');
		assert.pos('#1-2', 0, 1);
		yield wasavi.send('\u001b');

		yield wasavi.send('u');
		assert.value('#1-3', '    foo');
		yield wasavi.send('\u0012');
		assert.value('#1-4', '\tfoo');
	});

	it('expandTabOverwrite', function* () {
		yield wasavi.send(':set expandtab ts=8 sw=4\n');
		/*
		 * '    foo'			insert 4 spaces and "foo"
		 * '    \too'			move to first non-whitespace char, overwrite tab
		 * '     oo'			f must be overwritten
		 * '        oo'			3 spaces must be inserted (total indent is 8 spaces)
		 */
		yield wasavi.setInputModeOfWatchTarget('overwrite');
		yield wasavi.send('a    foo\u001b^R\t');
		assert.value('#1-1', '        oo');
		assert.pos('#1-2', 0, 8);
		yield wasavi.send('\u001b');

		yield wasavi.send('u');
		assert.value('#1-3', '    foo');
		yield wasavi.send('\u0012');
		assert.value('#1-4', '        oo');
	});

	it('noExpandTabOverwrite', function* () {
		yield wasavi.send(':set noexpandtab ts=8 sw=4\n');
		/*
		 * '    foo'			insert 4 spaces and "foo"
		 * '    \tfoo'			move to top of line, overwrite tab (f must be deleted)
		 * '\too'				indent normalization is executed
		 */
		yield wasavi.setInputModeOfWatchTarget('overwrite');
		yield wasavi.send('a    foo\u001b^R\t');
		assert.value('#1-1', '\too');
		assert.pos('#1-2', 0, 1);
		yield wasavi.send('\u001b');

		yield wasavi.send('u');
		assert.value('#1-3', '    foo');
		yield wasavi.send('\u0012');
		assert.value('#1-4', '\too');
	});

	it('pasteRegister', function* () {
		yield wasavi.send('afoo\nbar\u001b1GyG');
		yield wasavi.send('O\u0012"\u001b');
		assert.value('#1-1', 'foo\nbar\n\nfoo\nbar');

		yield wasavi.send('u');
		assert.value('#2-1', 'foo\nbar');

		yield wasavi.send('\u0012');
		assert.value('#3-1', 'foo\nbar\n\nfoo\nbar');
	});

	it('pasteCalcRegister', function* () {
		yield wasavi.send('afoo\nbar\u001b1Go\u0012=99*99\nbaz\u001b');
		assert.value('#1-1', 'foo\n9801baz\nbar');

		yield wasavi.send('u');
		assert.value('#2-1', 'foo\nbar');

		yield wasavi.send('\u0012');
		assert.value('#3-1', 'foo\n9801baz\nbar');
	});
};
