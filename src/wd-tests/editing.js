'use strict';

const {By, Key, until, promise} = require('selenium-webdriver');
const {it} = require('selenium-webdriver/testing');

exports.suite = (assert, wasavi, driver) => {
	function* _testDeleteRightChar (a) {
		yield wasavi.send('ifoobar\u001b');
		yield wasavi.send('3|');

		yield wasavi.send(a);
		assert.eq('#1', 'fobar', wasavi.getValue());
		assert.eq('#1-1', 'o', wasavi.getRegister('"'));
		assert.pos('#2', 0, 2);

		yield wasavi.send('2', a);
		assert.eq('#3', 'for', wasavi.getValue());
		assert.eq('#3-1', 'ba', wasavi.getRegister('"'));
		assert.pos('#3', 0, 2);

		yield wasavi.send('d', a);
		assert.t('#4', wasavi.getLastMessage().length);
		assert.pos('#4-1', 0, 2);
		assert.value('#4-2', 'for');
	}

	it('deleteRightChar', function* () {
		promise.consume(_testDeleteRightChar, null, 'x');
	});

	it('deleteRightCharDelete', function* () {
		promise.consume(_testDeleteRightChar, null, Key.DELETE);
	});

	it('deleteLeftChar', function* () {
		yield wasavi.send('ifoobar\u001b');
		yield wasavi.send('5|');

		yield wasavi.send('X');
		assert.eq('#1', 'fooar', wasavi.getValue());
		assert.eq('#1-1', 'b', wasavi.getRegister('"'));
		assert.pos('#2', 0, 3);

		yield wasavi.send('2X');
		assert.eq('#3', 'far', wasavi.getValue());
		assert.eq('#1-1', 'oo', wasavi.getRegister('"'));
		assert.pos('#3', 0, 1);

		yield wasavi.send('dX');
		assert.t('#4', wasavi.getLastMessage().length);
		assert.pos('#4-1', 0, 1);
		assert.value('#4-2', 'far');

		yield wasavi.send('1|X');
		assert.pos('#5', 0, 0);
		assert.value('#5-1', 'far');
	});

	it('pasteCharsForward', function* () {
		yield wasavi.send('ifoobar\nfoobar\u001b');

		yield wasavi.send('1G', '1|y3lp');
		assert.eq('ffoooobar\nfoobar', wasavi.getValue());

		yield wasavi.send('2G', '1|y3l2p');
		assert.eq('ffoooobar\nffoofoooobar', wasavi.getValue());

		yield wasavi.send('dp');
		assert.t(wasavi.getLastMessage().length);
	});

	it('pasteLinesForward', function* () {
		yield wasavi.send('ifoo\nbar\u001b');

		yield wasavi.send('1G', '1|yyp');
		assert.eq('#1', 'foo\nfoo\nbar', wasavi.getValue());
		assert.pos('#2', 1, 0);

		yield wasavi.send('2p');
		assert.eq('#3', 'foo\nfoo\nfoo\nfoo\nbar', wasavi.getValue());
		assert.pos('#4', 2, 0);

		yield wasavi.send('G', 'p');
		assert.eq('#5', 'foo\nfoo\nfoo\nfoo\nbar\nfoo', wasavi.getValue());
		assert.pos('#6', 5, 0);

		yield wasavi.send('G', '2p');
		assert.eq('#7', 'foo\nfoo\nfoo\nfoo\nbar\nfoo\nfoo\nfoo', wasavi.getValue());
		assert.pos('#8', 6, 0);
	});

	it('pasteCharsCurrent', function* () {
		yield wasavi.send('ifoobar\nfoobar\u001b');

		yield wasavi.send('1G', '1|y3lP');
		assert.eq('foofoobar\nfoobar', wasavi.getValue());

		yield wasavi.send('2G', '1|y3l2P');
		assert.eq('foofoobar\nfoofoofoobar', wasavi.getValue());

		yield wasavi.send('dP');
		assert.t(wasavi.getLastMessage().length);
	});

	it('pasteLinesCurrent', function* () {
		yield wasavi.send('ifoo\nbar\u001b');

		yield wasavi.send('1G', '1|yyP');
		assert.eq('#1', 'foo\nfoo\nbar', wasavi.getValue());
		assert.pos('#2', 0, 0);

		yield wasavi.send('2P');
		assert.eq('#3', 'foo\nfoo\nfoo\nfoo\nbar', wasavi.getValue());
		assert.pos('#4', 0, 0);

		yield wasavi.send('G', 'P');
		assert.eq('#5', 'foo\nfoo\nfoo\nfoo\nfoo\nbar', wasavi.getValue());
		assert.pos('#6', 4, 0);

		yield wasavi.send('G', '2P');
		assert.eq('#7', 'foo\nfoo\nfoo\nfoo\nfoo\nfoo\nfoo\nbar', wasavi.getValue());
		assert.pos('#8', 5, 0);
	});

	it('pasteFromClipboard', function* () {
		var s = 'paste via vi command';
		yield wasavi.setClipboardText(s);
		yield wasavi.send('"*P');
		assert.eq('#1', s, wasavi.getValue());
	});

	it('pasteFromClipboard2', function* () {
		var s = 'shift+insert, in command mode';
		yield wasavi.setClipboardText(s);
		yield wasavi.send(function (act) {
			act.sendKeys(Key.chord(Key.SHIFT, Key.INSERT));
		});
		assert.eq('#1', s, wasavi.getValue());
	});

	it('pasteFromClipboard3', function* () {
		var s = 'shift+insert, in insert mode';
		yield wasavi.setClipboardText(s);
		yield wasavi.send(function (act) {
			act .sendKeys('i')
				.sendKeys(Key.chord(Key.SHIFT, Key.INSERT))
				.sendKeys('\u001b');
		});
		assert.eq('#1', s, wasavi.getValue());
	});

	it('join', function* () {
		yield wasavi.send('ifirst\nsecond\u001b');
		yield wasavi.send('1G', '1|J');
		assert.pos('#1-1', 0, 5);
		assert.eq('#1-2', 'first second', wasavi.getValue());

		yield wasavi.send('1G', 'dG', 'ifirst\n\tsecond\u001b');
		yield wasavi.send('1G', '1|J');
		assert.pos('#2-1', 0, 5);
		assert.eq('#2-2', 'first second', wasavi.getValue());

		yield wasavi.send('1G', 'dG', 'ifirst   \n\tsecond\u001b');
		yield wasavi.send('1G', '1|J');
		assert.pos('#3-1', 0, 8);
		assert.eq('#3-2', 'first   second', wasavi.getValue());

		yield wasavi.send('1G', 'dG', 'i(first\n) second\u001b');
		yield wasavi.send('1G', '1|J');
		assert.pos('#4-1', 0, 6);
		assert.eq('#4-2', '(first) second', wasavi.getValue());

		yield wasavi.send('1G', 'dG', 'ifirst.\nsecond\u001b');
		yield wasavi.send('1G', '1|J');
		assert.pos('#5-1', 0, 6);
		assert.eq('#5-2', 'first.  second', wasavi.getValue());
	});

	// repeat command tests.
	// repeat command is affected by the commands below:
	//   !, <, >, A, C, D, I, J, O, P, R, S, X, Y,
	//            a, c, d, i,    o, p, r, s, x, y,
	//            gq, gu, gU, ^A, ^X,
	//   and ~

	it('repetitionShiftLeft', function* () {
		yield wasavi.send(':set sw=8 noai\n');
		yield wasavi.send('i\t\t\t\t\tfoo\n\tbar\u001b', '1G');

		yield wasavi.send('<<');

		yield wasavi.send('.');
		assert.eq('#1', '\t\t\tfoo\n\tbar', wasavi.getValue());

		yield wasavi.send('2.');
		assert.eq('#2', '\t\tfoo\nbar', wasavi.getValue());
	});

	it('repetitionShiftRight', function* () {
		yield wasavi.send(':set sw=8 noai\n');
		yield wasavi.send('ifoo\nbar\u001b', '1G');

		yield wasavi.send('>>');

		yield wasavi.send('.');
		assert.eq('#1', '\t\tfoo\nbar', wasavi.getValue());

		yield wasavi.send('2.');
		assert.eq('#2', '\t\t\tfoo\n\tbar', wasavi.getValue());
	});

	it('repetitionAppendToLast', function* () {
		yield wasavi.send('ifoo\u001b', 'gg');

		yield wasavi.send('Abar\u001b');
		
		yield wasavi.send('0.');
		assert.eq('#1', 'foobarbar', wasavi.getValue());

		yield wasavi.send('02.');
		assert.eq('#2', 'foobarbarbarbar', wasavi.getValue());
	});

	it('repetitionAppend', function* () {
		yield wasavi.send('ifoo\u001b', 'gg');

		yield wasavi.send('abar\u001b');
		
		yield wasavi.send('0.');
		assert.eq('#1', 'fbarbaroo', wasavi.getValue());

		yield wasavi.send('02.');
		assert.eq('#2', 'fbarbarbarbaroo', wasavi.getValue());
	});

	it('repetitionChangeToLast', function* () {
		yield wasavi.send('ifoo\nbar\nbaz\nfoobar\u001b', '1G');

		yield wasavi.send('CFOO\u001b');

		yield wasavi.send('2G', '.');
		assert.eq('#1', 'FOO\nFOO\nbaz\nfoobar', wasavi.getValue());

		yield wasavi.send('3G', '2.');
		assert.eq('#2', 'FOO\nFOO\nFOO', wasavi.getValue());
	});

	it('repetitionChange', function* () {
		yield wasavi.send('ifoo\nbar\nfoobar\u001b', '1G');

		yield wasavi.send('c2lFO\u001b');

		yield wasavi.send('2G', '.');
		assert.eq('#1', 'FOo\nFOr\nfoobar', wasavi.getValue());

		yield wasavi.send('3G', '3.');
		assert.eq('#2', 'FOo\nFOr\nFObar', wasavi.getValue());
	});

	it('repetitionDeleteToLast', function* () {
		yield wasavi.send('ifoo\nbar\nbaz\nfoobar\u001b', '1G');

		yield wasavi.send('D');

		yield wasavi.send('2G', '.');
		assert.eq('#1', '\n\nbaz\nfoobar', wasavi.getValue());

		yield wasavi.send('3G', '2.');
		assert.eq('#2', '\n\n', wasavi.getValue());
	});

	it('repetitionDelete', function* () {
		yield wasavi.send('ifoo\nbar\nfoobar\u001b', '1G');

		yield wasavi.send('d2l\u001b');

		yield wasavi.send('2G', '.');
		assert.eq('#1', 'o\nr\nfoobar', wasavi.getValue());

		yield wasavi.send('3G', '3.');
		assert.eq('#2', 'o\nr\nbar', wasavi.getValue());
	});

	it('repetitionInsertFromTop', function* () {
		yield wasavi.send('ifoo\u001b');

		yield wasavi.send('Ibar\u001b');

		yield wasavi.send('$.');
		assert.eq('#1', 'barbarfoo', wasavi.getValue());

		yield wasavi.send('$2.');
		assert.eq('#2', 'barbarbarbarfoo', wasavi.getValue());
	});

	it('repetitionInsert', function* () {
		yield wasavi.send('ifoo\u001b');

		yield wasavi.send('ibar\u001b');

		yield wasavi.send('.');
		assert.eq('#1', 'fobabarro', wasavi.getValue());

		yield wasavi.send('2.');
		assert.eq('#2', 'fobababarbarrro', wasavi.getValue());
	});

	it('repetitionInsertWithControlChar', function* () {
		yield wasavi.send('ifoo\u001b');
		yield wasavi.send('ibax' + Key.BACK_SPACE + 'r\u001b');

		assert.eq('#1-1', 'fobaro', wasavi.getValue());
		assert.eq('#1-2', 'bax\u0008r', wasavi.getRegister('.'));

		yield wasavi.send('u');
		assert.eq('#2-1', 'foo', wasavi.getValue());
		assert.pos('#2-2', 0, 2);
		yield wasavi.send('\u0012');
		assert.eq('#2-3', 'fobaro', wasavi.getValue());
		assert.pos('#2-4', 0, 2);

		yield wasavi.send('.');
		assert.eq('#3-1', 'fobarbaro', wasavi.getValue());
		yield wasavi.send('u');
		assert.eq('#3-2', 'fobaro', wasavi.getValue());
		assert.pos('#3-3', 0, 2);
		yield wasavi.send('\u0012');
		assert.eq('#3-4', 'fobarbaro', wasavi.getValue());
		assert.pos('#3-5', 0, 2);

		yield wasavi.send('2.');
		assert.eq('#4-1', 'fobarbarbarbaro', wasavi.getValue());
		yield wasavi.send('u');
		assert.eq('#4-2', 'fobarbaro', wasavi.getValue());
		assert.pos('#4-3', 0, 2);
		yield wasavi.send('\u0012');
		assert.eq('#4-4', 'fobarbarbarbaro', wasavi.getValue());
		assert.pos('#4-5', 0, 2);
	});

	it('repetitionInsertWithNewline', function* () {
		yield wasavi.send('ifoo\u001b');
		yield wasavi.send('ibar\nbaz\u001b');
		assert.eq('#1-1', 'fobar\nbazo', wasavi.getValue());

		yield wasavi.send('u');
		assert.eq('#2-1', 'foo', wasavi.getValue());
		assert.pos('#2-2', 0, 2);
		yield wasavi.send('\u0012');
		assert.eq('#2-3', 'fobar\nbazo', wasavi.getValue());
		assert.pos('#2-4', 0, 2);

		yield wasavi.send('.');
		assert.eq('#3-1', 'fobar\nbazbar\nbazo', wasavi.getValue());

	});

	it('repetitionJoin', function* () {
		yield wasavi.send('ifirst\nsecond\nthird\nfourth\nfifth\u001b', '1G');

		yield wasavi.send('J');

		yield wasavi.send('.');
		assert.eq('#1', 'first second third\nfourth\nfifth', wasavi.getValue());

		yield wasavi.send('2.');
		assert.eq('#2', 'first second third fourth fifth', wasavi.getValue());
	});

	it('repetitionOpenLineCurrent', function* () {
		yield wasavi.send('Ofoo\u001b');

		yield wasavi.send('.');
		assert.eq('#1', 'foo\nfoo\n', wasavi.getValue());

		yield wasavi.send('2.');
		assert.eq('#2', 'foo\nfoo\nfoo\nfoo\n', wasavi.getValue());
	});

	it('repetitionOpenLineAfter', function* () {
		yield wasavi.send('ofoo\u001b');

		yield wasavi.send('.');
		assert.eq('#1', '\nfoo\nfoo', wasavi.getValue());

		yield wasavi.send('2.');
		assert.eq('#2', '\nfoo\nfoo\nfoo\nfoo', wasavi.getValue());
	});

	it('repetitionPasteCurrent', function* () {
		yield wasavi.send('ifoo\u001b', 'ggyw');

		yield wasavi.send('P');

		yield wasavi.send('.');
		assert.eq('#1', 'foofoofoo', wasavi.getValue());

		yield wasavi.send('2.');
		assert.eq('#2', 'foofoofoofoofoo', wasavi.getValue());
	});

	it('repetitionPasteAfter', function* () {
		yield wasavi.send('i123\u001b', 'ggyw');
		// 123
		// ^

		yield wasavi.send('p');
		// 112323
		//    ^

		yield wasavi.send('0.');
		assert.eq('#1-1', '112312323', wasavi.getValue());
		assert.pos('#1-2', 0, 3);
		// 112312323
		//    ^

		yield wasavi.send('2.');
		assert.eq('#2-1', '112312312312323', wasavi.getValue());
		assert.pos('#2-2', 0, 9);
		// 112312312312323
		//          ^
	});

	it('repetitionOverwrite', function* () {
		yield wasavi.send('ifirst\nsecond\nthird\nfourth\u001b', 'gg');

		yield wasavi.send('RFOO\u001b');

		yield wasavi.send('2G', '.');
		assert.eq('#1', 'FOOst\nFOOond\nthird\nfourth', wasavi.getValue());

		yield wasavi.send('3G', '2.');
		assert.eq('#2', 'FOOst\nFOOond\nFOOFOO\nfourth', wasavi.getValue());
	});

	it('repetitionReplace', function* () {
		yield wasavi.send('ifoobar\u001b', 'gg');

		yield wasavi.send('rA');
		assert.eq('#1', 'Aoobar', wasavi.getValue());

		yield wasavi.send('2|.');
		assert.eq('#2', 'AAobar', wasavi.getValue());

		yield wasavi.send('4|2.');
		assert.eq('#3', 'AAoAAr', wasavi.getValue());
	});

	it('repetitionSubstWholeLine', function* () {
		yield wasavi.send('ifirst\nsecond\nthird\nfourth\u001b', 'gg');

		yield wasavi.send('Cfoo\u001b');

		yield wasavi.send('2G', '.');
		assert.eq('#1', 'foo\nfoo\nthird\nfourth', wasavi.getValue());

		yield wasavi.send('3G', '2.');
		assert.eq('#2', 'foo\nfoo\nfoo', wasavi.getValue());
	});

	it('repetitionSubstChar', function* () {
		yield wasavi.send('ifoobarbazbag\u001b', 'gg');

		yield wasavi.send('sBAZ\u001b');
		// BAZoobarbazbag

		yield wasavi.send('6|.');
		assert.eq('#1', 'BAZooBAZarbazbag', wasavi.getValue());

		yield wasavi.send('11|2.');
		assert.eq('#2', 'BAZooBAZarBAZzbag', wasavi.getValue());
	});

	it('repetitionDeleteLeftChar', function* () {
		yield wasavi.send('ifoobar\u001b');

		yield wasavi.send('X');

		yield wasavi.send('.');
		assert.eq('#1', 'foor', wasavi.getValue());

		yield wasavi.send('2.');
		assert.eq('#2', 'fr', wasavi.getValue());
	});

	it('repetitionDeleteRightChar', function* () {
		yield wasavi.send('ifoobar\u001b', 'gg');

		yield wasavi.send('x');

		yield wasavi.send('.');
		assert.eq('#1', 'obar', wasavi.getValue());

		yield wasavi.send('2.');
		assert.eq('#2', 'ar', wasavi.getValue());
	});

	it('repetitionDeleteLines', function* () {
		yield wasavi.send('i1\n2\n3\n4\n5\u001b', 'gg');

		yield wasavi.send('dd');

		yield wasavi.send('.');
		assert.eq('#1', '3\n4\n5', wasavi.getValue());

		yield wasavi.send('2.');
		assert.eq('#2', '5', wasavi.getValue());
	});

	it('repetitionDeleteLines2', function* () {
		yield wasavi.send('i1\n2\n3\n4\n5\u001b', 'gg');

		yield wasavi.send('2dd');

		yield wasavi.send('.');
		assert.eq('#2', '5', wasavi.getValue());
	});

	it('repetitionYankLines', function* () {
		yield wasavi.send('ifirst\nsecond\nthird\nfourth\u001b', 'gg');

		yield wasavi.send('yy');

		yield wasavi.send('2G', '.');
		assert.eq('#1', 'second\n', wasavi.getRegister('"'));

		yield wasavi.send('3G', '2.');
		assert.eq('#2', 'third\nfourth\n', wasavi.getRegister('"'));

	});

	it('repetitionYankLinesAlias', function* () {
		yield wasavi.send('ifirst\nsecond\nthird\nfourth\u001b', 'gg');

		yield wasavi.send('Y');

		yield wasavi.send('2G', '.');
		assert.eq('#1', 'second\n', wasavi.getRegister('"'));

		yield wasavi.send('3G', '2.');
		assert.eq('#2', 'third\nfourth\n', wasavi.getRegister('"'));
	});

	it('repetitionYankChars', function* () {
		yield wasavi.send('ifirst\nsecond\nthird fourth\u001b', 'gg');

		yield wasavi.send('yw');

		yield wasavi.send('2G', '.');
		assert.eq('#1', 'second', wasavi.getRegister('"'));

		yield wasavi.send('3G', '2.');
		assert.eq('#2', 'third fourth', wasavi.getRegister('"'));
	});

	it('repetitionToggleCase', function* () {
		yield wasavi.send('ifoobarbaz\u001b', 'gg');

		yield wasavi.send('~');

		yield wasavi.send('.');
		assert.eq('#1', 'FOobarbaz', wasavi.getValue());

		yield wasavi.send('2.');
		assert.eq('#2', 'FOOBarbaz', wasavi.getValue());
	});

	it('repetitionReformat', function* () {
		yield wasavi.send(
			'i' +
			'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.\n' +
			'\n' +
			'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.' +
			'\u001b');

		yield wasavi.send(':set tw=30\n');
		yield wasavi.send('1G1|gqq');
		assert.value('#1-1',
			'Lorem ipsum dolor sit amet,\n' +
			'consectetur adipisicing elit,\n' +
			'sed do eiusmod tempor\n' +
			'incididunt ut labore et dolore\n' +
			'magna aliqua.\n' +
			'\n' +
			'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.');
		assert.pos('#1-2', 5, 0);
		yield wasavi.send('.');
		assert.value('#1-3',
			'Lorem ipsum dolor sit amet,\n' +
			'consectetur adipisicing elit,\n' +
			'sed do eiusmod tempor\n' +
			'incididunt ut labore et dolore\n' +
			'magna aliqua.\n' +
			'\n' +
			'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.');
		assert.pos('#1-4', 6, 0);
		yield wasavi.send('6G2.');
		assert.value('#1-5',
			'Lorem ipsum dolor sit amet,\n' +
			'consectetur adipisicing elit,\n' +
			'sed do eiusmod tempor\n' +
			'incididunt ut labore et dolore\n' +
			'magna aliqua.\n' +
			'\n' +
			'Ut enim ad minim veniam, quis\n' +
			'nostrud exercitation ullamco\n' +
			'laboris nisi ut aliquip ex ea\n' +
			'commodo consequat.');
	});

	it('repetitionUpperCase', function* () {
		yield wasavi.send('ifoo bar baz bax\u001b', '0');

		yield wasavi.send('gUw');

		yield wasavi.send('.');
		assert.eq('#1-1', 'FOO bar baz bax', wasavi.getValue());
		assert.pos('#1-2', 0, 0);

		yield wasavi.send('w2.');
		assert.eq('#2-1', 'FOO BAR BAZ bax', wasavi.getValue());
		assert.pos('#2-2', 0, 4);
	});

	it('repetitionLowerCase', function* () {
		yield wasavi.send('iFOO BAR BAZ BAX\u001b', '0');

		yield wasavi.send('guw');

		yield wasavi.send('.');
		assert.eq('#1-1', 'foo BAR BAZ BAX', wasavi.getValue());
		assert.pos('#1-2', 0, 0);

		yield wasavi.send('w2.');
		assert.eq('#2-1', 'foo bar baz BAX', wasavi.getValue());
		assert.pos('#2-2', 0, 4);
	});

	// undo, redo tests are in another file. see UndoTest.java
	// function testUndo () {
	// }
	//
	// function testRedo () {
	// }

	it('toggleCase', function* () {
		yield wasavi.send('ifoobarbaz\u001b', 'gg');

		yield wasavi.send('~');
		assert.eq('#1-1', 'Foobarbaz', wasavi.getValue());
		assert.pos('#1-2', 0, 1);

		yield wasavi.send('3~');
		assert.eq('#2-1', 'FOOBarbaz', wasavi.getValue());
		assert.pos('#2-2', 0, 4);

		yield wasavi.send('7|10~');
		assert.eq('#3-1', 'FOOBarBAZ', wasavi.getValue());
		assert.pos('#3-2', 0, 8);
	});

	it('fileInfo', function* () {
		yield wasavi.send('\u0007');
		assert.t(wasavi.getLastMessage().length);
	});

	it('markAndJumpCharwise', function* () {
		yield wasavi.send('iHi there. This is great.\u001b', '7|ma$mb');
		assert.pos('#1', 0, 23);

		yield wasavi.send('`a');
		assert.pos('#2', 0, 6);

		yield wasavi.send('`b');
		assert.pos('#3', 0, 23);

		yield wasavi.send('db0');
		assert.eq('#4', 'Hi there. This is .', wasavi.getValue());
		assert.pos('#5', 0, 0);

		yield wasavi.send('`b');
		assert.pos('#6', 0, 18);
	});

	it('markAndJumpLinewise', function* () {
		yield wasavi.send('iFirst\nHi there.\n\tThis is great.\u001b');

		yield wasavi.send('2G', '6|ma3G', '4|mbgg');

		assert.eq('#1', 'First\nHi there.\n\tThis is great.', wasavi.getValue());
		assert.pos('#1', 0, 0);

		yield wasavi.send("'a");
		assert.pos('#2', 1, 0);

		yield wasavi.send("'b");
		assert.pos('#4', 2, 1);
	});

	it('executeRegisterContentAsViCommand', function* () {
		yield wasavi.send('ifirst\nsecond\nthird\nfourth\nk\u001b');

		yield wasavi.send('yy0@"');
		assert.pos('#1', 3, 0);

		yield wasavi.send('2@"');
		assert.pos('#2', 1, 0);

		yield wasavi.send('@Z');
		assert.t(wasavi.getLastMessage().length);
	});

	it('replace', function* () {
		yield wasavi.send('ifoobarbaz\u001b', 'gg');

		yield wasavi.send('rA');
		assert.pos('#1-1', 0, 0);
		assert.eq('#1-2', 'Aoobarbaz', wasavi.getValue());

		yield wasavi.send('3|r\n');
		assert.pos('#2-1', 1, 0);
		assert.eq('#2-2', 'Ao\nbarbaz', wasavi.getValue());

		// TODO: ?
		//yield wasavi.send('3|r\r');
		//assert.pos('#3-1', 2, 0);
		//assert.eq('#3-2', 'Ao\nba\nbaz', wasavi.getValue());

		yield wasavi.send('1G', 'dG', 'ifoobarbaz\u001b', 'gg');

		yield wasavi.send('2rA');
		assert.pos('#4-1', 0, 1);
		assert.eq('#4-2', 'AAobarbaz', wasavi.getValue());

		yield wasavi.send('4|3r\n');
		assert.pos('#5-1', 1, 0);
		assert.eq('#5-2', 'AAo\nbaz', wasavi.getValue());

		yield wasavi.send('100rX');
		assert.pos('#6-1', 1, 0);
		assert.t(wasavi.getLastMessage().length);
	});

	it('append', function* () {
		yield wasavi.setInputModeOfWatchTarget('edit');
		yield wasavi.send('afoobar');
		assert.eq('#1', 'edit', wasavi.getInputMode());

		yield wasavi.send('\u001b');
		assert.pos('#2-1', 0, 5);
		assert.eq('#2-2', 'foobar', wasavi.getValue());
		assert.eq('#2-3', 'foobar', wasavi.getRegister('.'));

		yield wasavi.send('3|aFOO\u001b');
		assert.pos('#3-1', 0, 5);
		assert.eq('#3-2', 'fooFOObar', wasavi.getValue());
		assert.eq('#3-3', 'FOO', wasavi.getRegister('.'));

		yield wasavi.send('3aBAR\u001b');
		assert.pos('#4-1', 0, 14);
		assert.eq('#4-2', 'fooFOOBARBARBARbar', wasavi.getValue());
		assert.eq('#4-3', 'BAR', wasavi.getRegister('.'));
	});

	it('appendToLast', function* () {
		yield wasavi.setInputModeOfWatchTarget('edit');
		yield wasavi.send('Afoobar');
		assert.eq('#1', 'edit', wasavi.getInputMode());

		yield wasavi.send('\u001b');
		assert.pos('#2-1', 0, 5);
		assert.eq('#2-2', 'foobar', wasavi.getValue());
		assert.eq('#2-3', 'foobar', wasavi.getRegister('.'));

		yield wasavi.send('3|AFOO\u001b');
		assert.pos('#3-1', 0, 8);
		assert.eq('#3-2', 'foobarFOO', wasavi.getValue());
		assert.eq('#3-3', 'FOO', wasavi.getRegister('.'));

		yield wasavi.send('3ABAR\u001b');
		assert.pos('#4-1', 0, 17);
		assert.eq('#4-2', 'foobarFOOBARBARBAR', wasavi.getValue());
		assert.eq('#4-3', 'BAR', wasavi.getRegister('.'));
	});

	it('openLineAfter', function* () {
		// the behavior of o command in wasavi is compatible to vim, NOT historical vi.
		yield wasavi.send('ofoo\u001b');
		assert.pos('#1-1', 1, 2);
		assert.eq('#1-2', '\nfoo', wasavi.getValue());
		assert.eq('#1-3', 'foo', wasavi.getRegister('.'));

		yield wasavi.send('2obar\u001b');
		assert.pos('#2-1', 3, 2);
		assert.eq('#2-2', '\nfoo\nbar\nbar', wasavi.getValue());
		assert.eq('#2-3', 'bar', wasavi.getRegister('.'));

		yield wasavi.send('gg');

		yield wasavi.send('oFOO\u001b');
		assert.pos('#3-1', 1, 2);
		assert.eq('#3-2', '\nFOO\nfoo\nbar\nbar', wasavi.getValue());
		assert.eq('#3-3', 'FOO', wasavi.getRegister('.'));

		yield wasavi.send('2oBAR\u001b');
		assert.pos('#4-1', 3, 2);
		assert.eq('#4-2', '\nFOO\nBAR\nBAR\nfoo\nbar\nbar', wasavi.getValue());
		assert.eq('#4-3', 'BAR', wasavi.getRegister('.'));
	});

	it('openLineCurrent', function* () {
		// the behavior of O command in wasavi is compatible to vim, NOT historical vi.
		yield wasavi.send('Ofoo\u001b');
		assert.pos('#1-1', 0, 2);
		assert.eq('#1-2', 'foo\n', wasavi.getValue());
		assert.eq('#1-3', 'foo', wasavi.getRegister('.'));

		yield wasavi.send('2Obar\u001b');
		assert.pos('#2-1', 1, 2);
		assert.eq('#2-2', 'bar\nbar\nfoo\n', wasavi.getValue());
		assert.eq('#2-3', 'bar', wasavi.getRegister('.'));

		yield wasavi.send('G');

		yield wasavi.send('OFOO\u001b');
		assert.pos('#3-1', 3, 2);
		assert.eq('#3-2', 'bar\nbar\nfoo\nFOO\n', wasavi.getValue());
		assert.eq('#3-3', 'FOO', wasavi.getRegister('.'));

		yield wasavi.send('2OBAR\u001b');
		assert.pos('#4-1', 4, 2);
		assert.eq('#4-2', 'bar\nbar\nfoo\nBAR\nBAR\nFOO\n', wasavi.getValue());
		assert.eq('#4-3', 'BAR', wasavi.getRegister('.'));
	});

	it('overwrite', function* () {
		yield wasavi.setInputModeOfWatchTarget('overwrite');
		yield wasavi.send('R', 'foo\nbar');
		assert.eq('#1', 'overwrite', wasavi.getInputMode());

		yield wasavi.send('\u001b');
		assert.pos('#2-1', 1, 2);
		assert.eq('#2-2', 'foo\nbar', wasavi.getValue());
		assert.eq('#2-3', 'foo\nbar', wasavi.getRegister('.'));

		yield wasavi.send('1G', '1|RFOOBAR\u001b');
		assert.pos('#3-1', 0, 5);
		assert.eq('#3-2', 'FOOBAR\nbar', wasavi.getValue());
		assert.eq('#3-3', 'FOOBAR', wasavi.getRegister('.'));

		yield wasavi.send('1G', '1|Rfoo\nbar\u001b');
		assert.pos('#4-1', 1, 2);
		assert.eq('#4-2', 'foo\nbar\nbar', wasavi.getValue());
		assert.eq('#4-3', 'foo\nbar', wasavi.getRegister('.'));
	});

	//function testRepeatLastSubstitute () {
		// this test is in ex.js
	//}

	it('substitute', function* () {
		yield wasavi.send('ifirst\nsecond\nthird\u001b');

		yield wasavi.send('1G1|sXYZ\u001b');
		assert.pos('#1-1', 0, 2);
		assert.value('#1-2', 'XYZirst\nsecond\nthird');
		assert.eq('#1-3', 'f', wasavi.getRegister('"'));

		yield wasavi.send('2G1|3sXYZ\u001b');
		assert.pos('#2-1', 1, 2);
		assert.value('#2-2', 'XYZirst\nXYZond\nthird');
		assert.eq('#2-3', 'sec', wasavi.getRegister('"'));
	});

	it('substituteWholeLines', function* () {
		yield wasavi.send('i\tfoobar\u001b');

		yield wasavi.send(':set noai\nSreplaced\u001b');
		assert.pos('#1-1', 0, 7);
		assert.eq('#1-2', 'replaced', wasavi.getValue());
	});

	it('zZ', function* () {
		yield wasavi.send('ifoobar\u001b');
		yield wasavi.sendNoWait('ZZ');

		var vanished = yield wasavi.waitTerminate();
		assert.t('wasaviFrame must not be exist.', vanished);

		var text = yield driver.findElement(By.id('t2')).getAttribute('value');
		assert.eq('#1-1', 'foobar', text);
	});

	it('reformat', function* () {
		/*
Lorem ipsum dolor sit amet,
consectetur adipisicing elit,
sed do eiusmod tempor
incididunt ut labore et dolore
magna aliqua.

Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
		 */
		//
		yield wasavi.send(
			'i' +
			'Lorem ipsum dolor sit amet,\nconsectetur adipisicing elit,\nsed do eiusmod tempor\nincididunt ut labore et dolore\nmagna aliqua.\n' +
			'\n' +
			'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.' +
			'\u001b');

		//
		yield wasavi.send(':set tw=40\n');
		yield wasavi.send('1G1|gqap');
		assert.value('#1-1',
			'Lorem ipsum dolor sit amet, consectetur\n' +
			'adipisicing elit, sed do eiusmod tempor\n' +
			'incididunt ut labore et dolore magna\n' +
			'aliqua.\n' +
			'\n' +
			'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.');
		assert.pos('#1-2', 4, 0);

		//
		yield wasavi.send('gqq');
		assert.pos('#2-1', 5, 0);
		yield wasavi.send('gqq');
		assert.value('#2-2',
			'Lorem ipsum dolor sit amet, consectetur\n' +
			'adipisicing elit, sed do eiusmod tempor\n' +
			'incididunt ut labore et dolore magna\n' +
			'aliqua.\n' +
			'\n' +
			'Ut enim ad minim veniam, quis nostrud\n' +
			'exercitation ullamco laboris nisi ut\n' +
			'aliquip ex ea commodo consequat.');
		assert.pos('#2-3', 7, 31);

		//
		yield wasavi.send('u');
		assert.value('#3-1',
			'Lorem ipsum dolor sit amet, consectetur\n' +
			'adipisicing elit, sed do eiusmod tempor\n' +
			'incididunt ut labore et dolore magna\n' +
			'aliqua.\n' +
			'\n' +
			'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.');
		yield wasavi.send('u');
		assert.value('#3-2',
			'Lorem ipsum dolor sit amet,\n' +
			'consectetur adipisicing elit,\n' +
			'sed do eiusmod tempor\n' +
			'incididunt ut labore et dolore\n' +
			'magna aliqua.\n' +
			'\n' +
			'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.');

		//
		yield wasavi.send('\u0012');
		assert.value('#4-1',
			'Lorem ipsum dolor sit amet, consectetur\n' +
			'adipisicing elit, sed do eiusmod tempor\n' +
			'incididunt ut labore et dolore magna\n' +
			'aliqua.\n' +
			'\n' +
			'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.');
		yield wasavi.send('\u0012');
		assert.value('#4-2',
			'Lorem ipsum dolor sit amet, consectetur\n' +
			'adipisicing elit, sed do eiusmod tempor\n' +
			'incididunt ut labore et dolore magna\n' +
			'aliqua.\n' +
			'\n' +
			'Ut enim ad minim veniam, quis nostrud\n' +
			'exercitation ullamco laboris nisi ut\n' +
			'aliquip ex ea commodo consequat.');
	});

	it('pasteRegister', function* () {
		yield wasavi.send('afoo\nbar\u001b1GyG');
		yield wasavi.send('""P');
		assert.value('#1-1', 'foo\nbar\nfoo\nbar');
	});

	it('pasteCalcRegister', function* () {
		yield wasavi.send('"=99*99\nP');
		assert.value('#1-1', '9801');
	});

	it('pasteFromClipboardInInputMode', function* () {
		yield wasavi.send('afoo\nbar\u001b1G"*yG');
		yield wasavi.send('O\u0012*\u001b');
		assert.value('#1-1', 'foo\nbar\n\nfoo\nbar');
	});

	it('upperCaseHorizontal', function* () {
		yield wasavi.send('i\tfoo bar baz bax\u001b', '^');
		yield wasavi.send('gU2w');
		assert.eq('#1-1', '\tFOO BAR baz bax', wasavi.getValue());
		assert.pos('#1-2', 0, 1);
	});

	it('upperCaseVertical', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('i\tfoo bar\nbaz bax\u001b', 'gg');
		yield wasavi.send('wgUj');
		assert.eq('#1-1', '\tFOO BAR\nBAZ BAX', wasavi.getValue());
		assert.pos('#1-2', 0, 1);
	});

	it('upperCaseVerticalAlias', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('i\tfoo bar\nbaz bax\u001b', 'gg');
		yield wasavi.send('wgUU');
		assert.eq('#1-1', '\tFOO BAR\nbaz bax', wasavi.getValue());
		assert.pos('#1-2', 0, 1);
	});

	it('lowerCaseHorizontal', function* () {
		yield wasavi.send('i\tFOO BAR BAZ BAX\u001b', '^');
		yield wasavi.send('gu2w');
		assert.eq('#1-1', '\tfoo bar BAZ BAX', wasavi.getValue());
		assert.pos('#1-2', 0, 1);
	});

	it('lowerCaseVertical', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('i\tFOO BAR\nBAZ BAX\u001b', 'gg');
		yield wasavi.send('wguj');
		assert.eq('#1-1', '\tfoo bar\nbaz bax', wasavi.getValue());
		assert.pos('#1-2', 0, 1);
	});

	it('lowerCaseVerticalAlias', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('i\tFOO BAR\nBAZ BAX\u001b', 'gg');
		yield wasavi.send('wguu');
		assert.eq('#1-1', '\tfoo bar\nBAZ BAX', wasavi.getValue());
		assert.pos('#1-2', 0, 1);
	});

	it('getCodePointUnderCursor', function* () {
		yield wasavi.send('ifoo bar\u001b');
		yield wasavi.send('0ga');
		assert.eq('#1-1', '"f" U+0066', wasavi.getLastMessage());
	});

	// https://github.com/akahuku/wasavi/issues/114
	it('macroWithCount_issue114', function* () {
		yield wasavi.send('i0234\u001b');
		yield wasavi.send('yy5p');
		yield wasavi.send('qar1jq');
		yield wasavi.send('@a');
		yield wasavi.send('3@a');
		assert.value('#1-1',
			'0234\n' +
			'1234\n' +
			'1234\n' +
			'1234\n' +
			'1234\n' +
			'1234');
	});

	it('should increase a numeric number', function* () {
		yield wasavi.send('iabc99def\u001b');
		yield wasavi.send('4|ma10\u0001');
		assert.value('#1-1', 'abc109def');
		assert.pos('#1-2', 0, 5);

		var m = wasavi.getMark('a');
		assert.t(m);
		assert.eq('#2-1', '0,3', m.join(','));

		yield wasavi.send('u');
		assert.value('#3-1', 'abc99def');
		yield wasavi.send('\u0012');
		assert.value('#3-2', 'abc109def');
	});

	it('should decrease a numeric number', function* () {
		yield wasavi.send('iabc109def\u001b');
		yield wasavi.send('5|ma4|20\u0018');
		assert.value('#1-1', 'abc89def');
		assert.pos('#1-2', 0, 4);

		var m = wasavi.getMark('a');
		assert.t(m);
		assert.eq('#2-1', '0,4', m.join(','));

		yield wasavi.send('u');
		assert.value('#3-1', 'abc109def');
		yield wasavi.send('\u0012');
		assert.value('#3-2', 'abc89def');
	});

	it('should repeat increment command', function* () {
		yield wasavi.send('i99\n100\u001b');
		yield wasavi.send('1G1|\u0001j.');
		assert.value('#1-1', '100\n101');
	});

	it('should repeat decrement command', function* () {
		yield wasavi.send('i99\n100\u001b');
		yield wasavi.send('1G1|\u0018j.');
		assert.value('#1-1', '98\n99');
	});
};

