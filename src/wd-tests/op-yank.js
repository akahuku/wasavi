'use strict';

const {By, Key, until, promise} = require('selenium-webdriver');
const {it, describe} = require('selenium-webdriver/testing');

exports.suite = (assert, wasavi, driver) => {
	const {ctrln, ctrlt, ctrlw} = assert.shortcuts;

	it('yank', function* () {
		yield wasavi.send('i1\n2\u001bgg');

		yield wasavi.send('yy');
		assert.eq('#1-1', '1\n', wasavi.getRegister('"'));
		assert.pos('#1-2', 0, 0);

		yield wasavi.send(':set report=2\n');
		yield wasavi.send('y2y');
		assert.eq('#2-1', '1\n2\n', wasavi.getRegister('"'));
		assert.pos('#2-2', 0, 0);
		assert.eq('#2-3', 'Yanked 2 lines.', wasavi.getLastMessage());

		yield wasavi.send('2yy');
		assert.eq('#3-1', '1\n2\n', wasavi.getRegister('"'));
		assert.pos('#3-2', 0, 0);

		yield wasavi.send('3yy');
		assert.eq('#4-1', '1\n2\n', wasavi.getRegister('"'));
		assert.pos('#4-2', 0, 0);
	});

	it('to clipboard', function* () {
		yield wasavi.send('itext from wasavi\u001b');
		yield wasavi.send('"*yy');
		assert.eq('#1-1', 'text from wasavi\n', yield wasavi.getClipboardText());
		assert.pos('#1-2', 0, 15);

		yield wasavi.send('$b"*yw');
		assert.eq('#2-1', 'wasavi', yield wasavi.getClipboardText());
		assert.pos('#2-2', 0, 10);
	});

	function* _testYankUpLine (a) {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('iline\n\tline2\n\t\tline3\u001b');
		assert.eq('line\n\tline2\n\t\tline3', wasavi.getValue());

		yield wasavi.send('3G');
		assert.pos('#1-1', 2, 2);

		yield wasavi.send(`y${a}`);
		assert.pos('#2-1', 1, 1);
		assert.eq('#2-2', '\tline2\n\t\tline3\n', wasavi.getRegister('"'));
		assert.eq('#2-3', '\tline2\n\t\tline3\n', wasavi.getRegister('1'));

		yield wasavi.send(`y${a}`);
		assert.pos('#2-1', 0, 0);
		assert.eq('#3-2', 'line\n\tline2\n', wasavi.getRegister('"'));
		assert.eq('#3-3', 'line\n\tline2\n', wasavi.getRegister('1'));
		assert.eq('#3-4', '\tline2\n\t\tline3\n', wasavi.getRegister('2'));

		yield wasavi.send(`y${a}`);
		assert.pos('#4-1', 0, 0);
		assert.eq('#4-2', 'line\n\tline2\n', wasavi.getRegister('"'));
		assert.t('#4-3', wasavi.getLastMessage().length > 0);
	}

	it('up line', function* () {
		promise.consume(_testYankUpLine, null, '-');
	});

	function* _testYankDownLine (a) {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('iline\n\tline2\n\t\tline3\u001b');
		assert.eq('line\n\tline2\n\t\tline3', wasavi.getValue());

		yield wasavi.send('gg');
		assert.pos('#1-1', 0, 0);

		yield wasavi.send(`y${a}`);
		assert.pos('#2-1', 0, 0);
		assert.eq('#2-2', 'line\n\tline2\n', wasavi.getRegister('"'));
		assert.eq('#2-3', 'line\n\tline2\n', wasavi.getRegister('1'));

		yield wasavi.send(`y2${a}`);
		assert.pos('#2-1', 0, 0);
		assert.eq('#3-2', 'line\n\tline2\n\t\tline3\n', wasavi.getRegister('"'));
		assert.eq('#3-3', 'line\n\tline2\n\t\tline3\n', wasavi.getRegister('1'));
		assert.eq('#3-4', 'line\n\tline2\n', wasavi.getRegister('2'));

		yield wasavi.send(`3Gy${a}`);
		assert.pos('#4-1', 2, 2);
		assert.eq('#4-2', 'line\n\tline2\n\t\tline3\n', wasavi.getRegister('"'));
		assert.t('#4-3', wasavi.getLastMessage().length > 0);
	}

	it('down line', function* () {
		promise.consume(_testYankDownLine, null, '+');
	});

	it('down enter', function* () {
		promise.consume(_testYankDownLine, null, Key.ENTER);
	});

	function* _testYankFirstNonWhiteCharOfLine (a) {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('i\tfoobar\u001b');
		yield wasavi.send(`y${a}`);

		assert.eq('#1-1', '\tfoobar', wasavi.getValue());
		assert.eq('#1-2', 'fooba', wasavi.getRegister('"'));
		assert.pos('#1-3', 0, 1);

		// if selected string is empty, register should not be modified.
		yield wasavi.send(`y${a}`);
		assert.eq('#2-1', 'fooba', wasavi.getRegister('"'));
		assert.pos('#2-2', 0, 1);
	}

	it('first non white char of line', function* () {
		promise.consume(_testYankFirstNonWhiteCharOfLine, null, '^');
	});

	it('home', function* () {
		promise.consume(_testYankFirstNonWhiteCharOfLine, null, Key.HOME);
	});

	it('top of line', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('i\tfoobar\u001b');
		yield wasavi.send('y0');

		assert.eq('#1-1', '\tfooba', wasavi.getRegister('"'));
		assert.pos('#1-2', 0, 0);
	});

	function* _testYankTailOfLine (a) {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('i\tfoobar\u001b1|');
		yield wasavi.send(`y${a}`);

		assert.eq('#1-1', '\tfoobar', wasavi.getRegister('"'));
		assert.pos('#1-2', 0, 0);
	}

	it('tail of line', function* () {
		promise.consume(_testYankTailOfLine, null, '$');
	});

	it('end', function* () {
		promise.consume(_testYankTailOfLine, null, Key.END);
	});

	it('direct column', function* () {
		yield wasavi.send('i0123456789\n0123456789\u001b1G1|');

		yield wasavi.send('y5|');
		assert.eq('#1-1', '0123', wasavi.getRegister('"'));
		assert.pos('#1-2', 0, 0);

		yield wasavi.send('$y3|');
		assert.eq('#2-1', '2345678', wasavi.getRegister('"'));
		assert.pos('#2-2', 0, 2);

		yield wasavi.send('2G1|y100|');
		assert.eq('#3-1', '0123456789', wasavi.getRegister('"'));
		assert.pos('#3-2', 1, 0);
	});

	it('jump to matched parenthes', function* () {
		yield wasavi.send('ithis is (first) line.\nthis is (second) line)\u001b');

		yield wasavi.send('1G1|f(y%');
		assert.eq('#1-1', '(first)', wasavi.getRegister('"'));
		assert.pos('#1-2', 0, 8);

		yield wasavi.send('2G1|f)y%');
		assert.eq('#2-1', '(second)', wasavi.getRegister('"'));
		assert.pos('#2-2', 1, 8);

		yield wasavi.send('G$y%');
		assert.eq('#3-1', '(second)', wasavi.getRegister('"'));
		assert.pos('#3-2', 1, 21);
		assert.t('#3-3', wasavi.getLastMessage().length > 0);
	});

	it('search forward', function* () {
		yield wasavi.send('ifind the\nchar4cter in cu4rent 4line\u001b1G1|');

		yield wasavi.send('y/4\n');
		assert.eq('#1-1', 'find the\nchar', wasavi.getRegister('"'));
		assert.pos('#1-2', 0, 0);

		yield wasavi.send('2y/4\n');
		assert.eq('#2-1', 'find the\nchar4cter in cu', wasavi.getRegister('"'));
		assert.pos('#2-2', 0, 0);

		yield wasavi.send('2y/X\n');
		assert.eq('#3-1', 'find the\nchar4cter in cu', wasavi.getRegister('"'));
		assert.pos('#3-2', 0, 0);
		assert.t('#3-3', wasavi.getLastMessage().length > 0);
	});

	it('search backward', function* () {
		yield wasavi.send('ifind the char4cter in cu4rent\n4line\u001b');

		yield wasavi.send('G$y?4\n');
		assert.eq('#1-1', '4lin', wasavi.getRegister('"'));
		assert.pos('#1-2', 1, 0);

		yield wasavi.send('G$2y?4\n');
		assert.eq('#2-1', '4rent\n4lin', wasavi.getRegister('"'));
		assert.pos('#2-2', 0, 24);

		yield wasavi.send('G$2y?X\n');
		assert.eq('#3-1', '4rent\n4lin', wasavi.getRegister('"'));
		assert.pos('#3-2', 1, 4);
		assert.t('#3-3', wasavi.getLastMessage().length > 0);
	});

	it('find forward', function* () {
		yield wasavi.send('ifind the char4cter in cu4rent 4line\u001b1G1|');

		yield wasavi.send('yf4');
		assert.eq('#1-1', 'find the char4', wasavi.getRegister('"'));
		assert.pos('#1-2', 0, 0);

		yield wasavi.send('2yf4');
		assert.eq('#2-1', 'find the char4cter in cu4', wasavi.getRegister('"'));
		assert.pos('#2-2', 0, 0);

		yield wasavi.send('4yf4');
		assert.eq('#3-1', 'find the char4cter in cu4', wasavi.getRegister('"'));
		assert.pos('#3-2', 0, 0);
		assert.t('#3-3', wasavi.getLastMessage().length > 0);
	});

	it('find backward', function* () {
		yield wasavi.send('ifind the char4cter in cu4rent 4line\u001b');

		yield wasavi.send('yF4');
		assert.eq('#1-1', '4lin', wasavi.getRegister('"'));
		assert.pos('#1-2', 0, 30);

		yield wasavi.send('2yF4');
		assert.eq('#2-1', '4cter in cu4rent ', wasavi.getRegister('"'));
		assert.pos('#2-2', 0, 13);

		yield wasavi.send('yF4');
		assert.eq('#3-1', '4cter in cu4rent ', wasavi.getRegister('"'));
		assert.pos('#3-2', 0, 13);
		assert.t('#3-3', wasavi.getLastMessage().length > 0);
	});

	it('find foward before stop', function* () {
		yield wasavi.send('ifind the char4cter in cu4rent 4line\u001b1G1|');

		yield wasavi.send('yt4');
		assert.eq('#1-1', 'find the char', wasavi.getRegister('"'));
		assert.pos('#1-2', 0, 0);

		yield wasavi.send('2yt4');
		assert.eq('#2-1', 'find the char4cter in cu', wasavi.getRegister('"'));
		assert.pos('#2-2', 0, 0);

		yield wasavi.send('4yt4');
		assert.eq('#3-1', 'find the char4cter in cu', wasavi.getRegister('"'));
		assert.pos('#3-2', 0, 0);
		assert.t('#3-3', wasavi.getLastMessage().length > 0);
	});

	it('find backward before stop', function* () {
		yield wasavi.send('ifind the char4cter in cu4rent 4line\u001b');
		
		yield wasavi.send('yT4');
		assert.eq('#1-1', 'lin', wasavi.getRegister('"'));
		assert.pos('#1-2', 0, 31);

		yield wasavi.send('yT4');
		assert.eq('#2-1', 'lin', wasavi.getRegister('"'));
		assert.pos('#2-2', 0, 31);

		yield wasavi.send('y2T4');
		assert.eq('#3-1', 'rent 4', wasavi.getRegister('"'));
		assert.pos('#3-2', 0, 25);

		yield wasavi.send('y3T4');
		assert.eq('#4-1', 'rent 4', wasavi.getRegister('"'));
		assert.pos('#4-2', 0, 25);
		assert.t('#4-3', wasavi.getLastMessage().length > 0);
	});

	it('find invert', function* () {
		yield wasavi.send('4ifi4st s4cond th4rd fou4th\n\u001b');

		yield wasavi.send('1G1|yf4$y,');
		assert.eq('#1-1', '4t', wasavi.getRegister('"'));
		assert.pos('#1-2', 0, 22);

		yield wasavi.send('2G1|yt4$y,');
		assert.eq('#2-1', 't', wasavi.getRegister('"'));
		assert.pos('#2-2', 1, 23);

		yield wasavi.send('3G$yF40y,');
		assert.eq('#3-1', 'fi4', wasavi.getRegister('"'));
		assert.pos('#3-2', 2, 0);

		yield wasavi.send('4G$yT40y,');
		assert.eq('#4-1', 'fi', wasavi.getRegister('"'));
		assert.pos('#4-2', 3, 0);
	});

	it('find repeat', function* () {
		yield wasavi.send('4ifi4st s4cond th4rd fou4th\n\u001b');

		yield wasavi.send('1G1|yf43|y;');
		assert.eq('#1-1', '4st s4', wasavi.getRegister('"'));
		assert.pos('#1-2', 0, 2);

		yield wasavi.send('2G1|yt43|y;');
		assert.eq('#2-1', '4st s', wasavi.getRegister('"'));
		assert.pos('#2-2', 1, 2);

		yield wasavi.send('3G$yF4y;');
		assert.eq('#3-1', '4rd fou', wasavi.getRegister('"'));
		assert.pos('#3-2', 2, 15);

		yield wasavi.send('4G$yT4y;');
		assert.eq('#4-1', 'rd fou4', wasavi.getRegister('"'));
		assert.pos('#4-2', 3, 16);
	});

	it('down line orient', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('i\t1foobar\n\t2foobar\u001bgg');

		yield wasavi.send('y_');
		assert.eq('#1-1', '\t1foobar\n', wasavi.getRegister('"'));
		assert.pos('#1-2', 0, 1);

		yield wasavi.send('y2_');
		assert.eq('#2-1', '\t1foobar\n\t2foobar\n', wasavi.getRegister('"'));
		assert.pos('#2-2', 0, 1);

		yield wasavi.send('rXy3_');
		assert.eq('#3-1', '\tXfoobar\n\t2foobar\n', wasavi.getRegister('"'));
		assert.pos('#3-2', 0, 1);
	});

	it('mark', function* () {
		yield wasavi.send('ifoo1bar\nbaz3bax\u001b');

		yield wasavi.send('1G0f1ma0y`a');
		assert.eq('#1-1', 'foo', wasavi.getRegister('"'));
		assert.pos('#1-2', 0, 0);

		yield wasavi.send('2G$F3ma$y`a');
		assert.eq('#2-1', '3ba', wasavi.getRegister('"'));
		assert.pos('#2-2', 1, 3);
	});

	it('mark line orient', function* () {
		yield wasavi.send('i1\n2\n3\n4\n5\n6\n7\u001b');

		yield wasavi.send('3Gma1Gy\'a');
		assert.eq('#1-1', '1\n2\n3\n', wasavi.getRegister('"'));
		assert.pos('#1-2', 0, 0);

		yield wasavi.send('5GmaGy\'a');
		assert.eq('#2-1', '5\n6\n7\n', wasavi.getRegister('"'));
		assert.pos('#2-2', 4, 0);
	});

	/*
	it('section forward', function* () {
		// TBD
	});

	it('section backward', function* () {
		// TBD
	});

	it('paragraph forward', function* () {
		// TBD
	});

	it('paragraph backward', function* () {
		// TBD
	});

	it('sentence forward', function* () {
		// TBD
	});

	it('sentence backward', function* () {
		// TBD
	});
	*/

	function* _testYankDown (a) {
		yield wasavi.send('ifirst\nsecond\nthird\nf\nfifth\u001b');
		yield wasavi.send(`2G3|y10${a}`);
		assert.eq('#1-1', 'second\nthird\nf\nfifth\n', wasavi.getRegister('"'));
		assert.pos('#1-2', 1, 2);
		assert.t('#1-3', wasavi.getLastMessage().length == 0);
		assert.eq('#1-4', 'second\nthird\nf\nfifth\n', wasavi.getRegister('1'));
		assert.eq('#1-5', 'first\nsecond\nthird\nf\nfifth', wasavi.getValue());

		yield wasavi.send(`2G3|y${a}`);
		assert.eq('#2-1', 'second\nthird\n', wasavi.getRegister('"'));
		assert.eq('#2-2', 'second\nthird\n', wasavi.getRegister('1'));
		assert.eq('#2-3', 'second\nthird\nf\nfifth\n', wasavi.getRegister('2'));
		assert.eq('#2-4', 'first\nsecond\nthird\nf\nfifth', wasavi.getValue());
		assert.pos('#2-5', 1, 2);
	}

	it('down', function* () {
		promise.consume(_testYankDown, null, 'j');
	});

	it('down ctrl n', function* () {
		promise.consume(_testYankDown, null, ctrln);
	});

	it('down down', function* () {
		promise.consume(_testYankDown, null, Key.DOWN);
	});

	function* _testYankUp (a) {
		yield wasavi.send('ifirst\nsecond\nt\u001b');

		yield wasavi.send(`2G3|y10${a}`);
		assert.eq('#1-1', 'first\nsecond\n', wasavi.getRegister('"'));
		assert.pos('#1-2', 0, 2);
		assert.t('#1-3', wasavi.getLastMessage().length == 0);

		yield wasavi.send(`3G1|y${a}`);
		assert.eq('#2-1', 'second\nt\n', wasavi.getRegister('"'));
		assert.eq('#2-2', 'second\nt\n', wasavi.getRegister('1'));
		assert.eq('#2-3', 'first\nsecond\n', wasavi.getRegister('2'));
		assert.pos('#2-4', 1, 0);
	}

	it('up', function* () {
		promise.consume(_testYankUp, null, 'k');
	});

	it('up ctrl p', function* () {
		promise.consume(_testYankUp, null, '\u0010');
	});

	it('up up', function* () {
		promise.consume(_testYankUp, null, Key.UP);
	});

	function* _testYankLeft (a) {
		yield wasavi.send('ifoo bar baz\u001b');
		assert.pos('#1-1', 0, 10);

		yield wasavi.send(`y${a}`);
		assert.eq('#2-1', 'a', wasavi.getRegister('"'));
		assert.pos('#2-2', 0, 9);

		yield wasavi.send(`y2${a}`);
		assert.eq('#3-1', ' b', wasavi.getRegister('"'));
		assert.pos('#3-2', 0, 7);

		yield wasavi.send(`y100${a}`);
		assert.eq('#4-1', 'foo bar', wasavi.getRegister('"'));
		assert.pos('#4-2', 0, 0);
	}

	it('left', function* () {
		promise.consume(_testYankLeft, null, 'h');
	});

	it('left ctrl h', function* () {
		promise.consume(_testYankLeft, null, '\u0008');
	});

	it('left left', function* () {
		promise.consume(_testYankLeft, null, Key.LEFT);
	});

	function* _testYankRight (a) {
		yield wasavi.send('ifoo bar baz\u001b1|');
		assert.pos('#1-1', 0, 0);

		yield wasavi.send(`y${a}`);
		assert.eq('#2-1', 'foo bar baz', wasavi.getValue());
		assert.pos('#2-2', 0, 0);
		assert.eq('#2-3', 'f', wasavi.getRegister('"'));

		yield wasavi.send(`"ay2${a}`);
		assert.eq('#3-1', 'foo bar baz', wasavi.getValue());
		assert.pos('#3-2', 0, 0);
		assert.eq('#3-3', 'fo', wasavi.getRegister('a'));
		assert.eq('#3-4', 'fo', wasavi.getRegister('"'));

		yield wasavi.send(`y5${a}`);
		assert.eq('#4-1', 'foo bar baz', wasavi.getValue());
		assert.pos('#4-2', 0, 0);
		assert.eq('#4-3', 'foo b', wasavi.getRegister('"'));

		yield wasavi.send(`y100${a}`);
		assert.eq('#5-1', 'foo bar baz', wasavi.getValue());
		assert.pos('#5-2', 0, 0);
		assert.eq('#5-3', 'foo bar baz', wasavi.getRegister('"'));
	}

	it('right', function* () {
		promise.consume(_testYankRight, null, 'l');
	});

	it('right space', function* () {
		promise.consume(_testYankRight, null, ' ');
	});

	it('right right', function* () {
		promise.consume(_testYankRight, null, Key.RIGHT);
	});

	it('word forward', function* () {
		yield wasavi.send('ifoo bar baz\nbax\u001b1|gg');

		yield wasavi.send('yw');
		assert.eq('#1-1', 'foo bar baz\nbax', wasavi.getValue());
		assert.pos('#1-2', 0, 0);
		assert.eq('#1-3', 'foo ', wasavi.getRegister('"'));

		yield wasavi.send('y2w');
		assert.eq('#2-1', 'foo bar baz\nbax', wasavi.getValue());
		assert.pos('#2-2', 0, 0);
		assert.eq('#2-3', 'foo bar ', wasavi.getRegister('"'));

		yield wasavi.send('y3w');
		assert.eq('#3-1', 'foo bar baz\nbax', wasavi.getValue());
		assert.pos('#3-2', 0, 0);
		assert.eq('#3-3', 'foo bar baz', wasavi.getRegister('"'));

		yield wasavi.send('y4w');
		assert.eq('#4-1', 'foo bar baz\nbax', wasavi.getValue());
		assert.t('#4-2', wasavi.getLastMessage().length == 0);
		assert.pos('#4-3', 0, 0);
		assert.eq('#4-4', 'foo bar baz\nbax', wasavi.getRegister('"'));
	});

	it('word backward', function* () {
		yield wasavi.send('ifoo\nbar baz bax\u001b');

		yield wasavi.send('yb');
		assert.eq('#1-1', 'foo\nbar baz bax', wasavi.getValue());
		assert.pos('#1-2', 1, 8);
		assert.eq('#1-3', 'ba', wasavi.getRegister('"'));

		yield wasavi.send('y2b');
		assert.eq('#2-1', 'foo\nbar baz bax', wasavi.getValue());
		assert.pos('#2-2', 1, 0);
		assert.eq('#2-3', 'bar baz ', wasavi.getRegister('"'));

		yield wasavi.send('yb');
		assert.eq('#3-1', 'foo\nbar baz bax', wasavi.getValue());
		assert.pos('#3-2', 0, 0);
		assert.eq('#3-3', 'foo\n', wasavi.getRegister('"'));
	});

	it('bigword forward', function* () {
		yield wasavi.send('if#o b#r b#z\nb#x\u001b1|gg');

		yield wasavi.send('yW');
		assert.eq('#1-1', 'f#o b#r b#z\nb#x', wasavi.getValue());
		assert.pos('#1-2', 0, 0);
		assert.eq('#1-3', 'f#o ', wasavi.getRegister('"'));

		yield wasavi.send('y2W');
		assert.eq('#2-1', 'f#o b#r b#z\nb#x', wasavi.getValue());
		assert.pos('#2-2', 0, 0);
		assert.eq('#2-3', 'f#o b#r ', wasavi.getRegister('"'));

		yield wasavi.send('y3W');
		assert.eq('#3-1', 'f#o b#r b#z\nb#x', wasavi.getValue());
		assert.pos('#3-2', 0, 0);
		assert.eq('#3-3', 'f#o b#r b#z', wasavi.getRegister('"'));

		yield wasavi.send('y4W');
		assert.eq('#4-1', 'f#o b#r b#z\nb#x', wasavi.getValue());
		assert.t('#4-2', wasavi.getLastMessage().length == 0);
		assert.pos('#4-3', 0, 0);
		assert.eq('#4-4', 'f#o b#r b#z\nb#x', wasavi.getRegister('"'));
	});

	it('bigword backward', function* () {
		yield wasavi.send('if#o\nb#r b#z b#x\u001b');

		yield wasavi.send('yB');
		assert.eq('#1-1', 'f#o\nb#r b#z b#x', wasavi.getValue());
		assert.pos('#1-2', 1, 8);
		assert.eq('#1-3', 'b#', wasavi.getRegister('"'));

		yield wasavi.send('y2B');
		assert.eq('#2-1', 'f#o\nb#r b#z b#x', wasavi.getValue());
		assert.pos('#2-2', 1, 0);
		assert.eq('#2-3', 'b#r b#z ', wasavi.getRegister('"'));

		yield wasavi.send('yB');
		assert.eq('#3-1', 'f#o\nb#r b#z b#x', wasavi.getValue());
		assert.pos('#3-2', 0, 0);
		assert.eq('#3-3', 'f#o\n', wasavi.getRegister('"'));
	});

	it('word end', function* () {
		yield wasavi.send('ifoo bar\nbaz\nbax\u001bgg');

		yield wasavi.send('ye');
		assert.eq('#1-1', 'foo', wasavi.getRegister('"'));
		assert.pos('#1-2', 0, 0);

		yield wasavi.send('y2e');
		assert.eq('#2-1', 'foo bar', wasavi.getRegister('"'));
		assert.pos('#2-2', 0, 0);

		yield wasavi.send('gg3e');
		assert.pos('#3-x-1', 1, 2);
		yield wasavi.send('ggy3e');
		assert.eq('#3-1', 'foo bar\nbaz', wasavi.getRegister('"'));
		assert.pos('#3-2', 0, 0);
	});

	it('bigword end', function* () {
		yield wasavi.send('if@o b@r\nb@z\nb@x\u001bgg');

		yield wasavi.send('yE');
		assert.eq('#1-1', 'f@o', wasavi.getRegister('"'));
		assert.pos('#1-2', 0, 0);

		yield wasavi.send('y2E');
		assert.eq('#2-1', 'f@o b@r', wasavi.getRegister('"'));
		assert.pos('#2-2', 0, 0);

		yield wasavi.send('gg3E');
		assert.pos('#3-x-1', 1, 2);
		yield wasavi.send('ggy3E');
		assert.eq('#3-1', 'f@o b@r\nb@z', wasavi.getRegister('"'));
		assert.pos('#3-2', 0, 0);
	});

	it('goto prefix', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('i 1\n2\n 3\u001b');

		yield wasavi.send('ygg');
		assert.eq('#1-1', ' 1\n2\n 3\n', wasavi.getRegister('"'));
		assert.eq('#1-2', ' 1\n2\n 3\n', wasavi.getRegister('1'));
		assert.pos('#1-3', 0, 1);
	});

	it('top of view', function* () {
		yield wasavi.makeScrollableBuffer(2);

		var rowLength = wasavi.getRowLength();
		yield wasavi.send('GH');
		var viewLines = wasavi.getRowLength() - wasavi.getRow();

		yield wasavi.send('GyH');
		assert.eq(wasavi.getRegister('"').replace(/\n$/, '').split('\n').length, viewLines);

	});

	it('middle of view', function* () {
		yield wasavi.makeScrollableBuffer(2);

		var rowLength = wasavi.getRowLength();
		yield wasavi.send('ggM');
		var viewLines = wasavi.getRow() + 1;

		yield wasavi.send('ggyM');
		assert.eq('#1', wasavi.getRegister('"').split('\n').length - 1, viewLines);

		rowLength = wasavi.getRowLength();
		yield wasavi.send('GM');
		viewLines = wasavi.getRowLength() - wasavi.getRow();

		yield wasavi.send('GyM');
		assert.eq('#2', wasavi.getRegister('"').split('\n').length - 1, viewLines);
	});

	it('bottom of view', function* () {
		yield wasavi.makeScrollableBuffer(2);

		var rowLength = wasavi.getRowLength();
		yield wasavi.send('ggL');
		var viewLines = wasavi.getRow() + 1;

		yield wasavi.send('ggyL');
		assert.eq(wasavi.getRegister('"').replace(/\n$/, '').split('\n').length, viewLines);
	});

	it('goto', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('i\t1\n\t2\n\t3\n\t4\n\t5\n\t6\n\t7\u001b');

		yield wasavi.send('ggy3G');
		assert.eq('#1-1', '\t1\n\t2\n\t3\n', wasavi.getRegister('"'));
		assert.eq('#1-2', '\t1\n\t2\n\t3\n', wasavi.getRegister('1'));
		assert.pos('#1-3', 0, 1);

		yield wasavi.send('Gy5G');
		assert.eq('#2-1', '\t5\n\t6\n\t7\n', wasavi.getRegister('"'));
		assert.eq('#2-2', '\t5\n\t6\n\t7\n', wasavi.getRegister('1'));
		assert.eq('#2-3', '\t1\n\t2\n\t3\n', wasavi.getRegister('2'));
		assert.pos('#2-4', 4, 1);
	});

	it('search forward next_1', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('i' + [
			'    def',		// foo
			'foo',          // baz
			'baz'			//
		].join('\n') + '\u001b');

		yield wasavi.send('1G1|/foo\n');
		assert.pos('#1-1', 1, 0);

		yield wasavi.send('1G5|yn');
		assert.eq('#2-1', 'def\n', wasavi.getRegister('"'));
		assert.pos('#2-2', 0, 4);
	});

	it('search forward next_2', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('i' + [
			'abc def',		// abc
			'foo',			// foo
			'baz'			// baz
		].join('\n') + '\u001b');

		yield wasavi.send('1G1|/foo\n');
		assert.pos('#1-1', 1, 0);

		yield wasavi.send('1G5|yn');
		assert.eq('#2-1', 'def\n', wasavi.getRegister('"'));
		assert.pos('#2-2', 0, 4);
	});

	it('search forward next_3', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('i' + [
			'    def',		//    foo
			'ghi foo',		// baz
			'baz'
		].join('\n') + '\u001b');

		yield wasavi.send('1G1|/foo\n');
		assert.pos('#1-1', 1, 4);

		yield wasavi.send('1G5|yn');
		assert.eq('#2-1', 'def\nghi ', wasavi.getRegister('"'));
		assert.pos('#2-2', 0, 4);
	});

	it('search forward next_4', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('i' + [
			'abc def',		// abc foo
			'ghi foo',		// baz
			'baz'
		].join('\n') + '\u001b');

		yield wasavi.send('1G1|/foo\n');
		assert.pos('#1-1', 1, 4);

		yield wasavi.send('1G5|yn');
		assert.eq('#2-1', 'def\nghi ', wasavi.getRegister('"'));
		assert.pos('#2-2', 0, 4);
	});

	it('search forward prev_1', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('i' + [
			'    def',		// foo
			'foo',          // baz
			'baz'			//
		].join('\n') + '\u001b');

		yield wasavi.send('1G1|/def\n');
		assert.pos('#1-1', 0, 4);

		yield wasavi.send('2G1|yN');
		assert.eq('#2-1', 'def\n', wasavi.getRegister('"'));
		assert.pos('#2-2', 0, 4);
	});

	it('search forward prev_2', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('i' + [
			'abc def',		// abc
			'foo',			// foo
			'baz'			// baz
		].join('\n') + '\u001b');

		yield wasavi.send('1G1|/def\n');
		assert.pos('#1-1', 0, 4);

		yield wasavi.send('2G1|yN');
		assert.eq('#2-1', 'def\n', wasavi.getRegister('"'));
		assert.pos('#2-2', 0, 4);
	});

	it('search forward prev_3', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('i' + [
			'    def',		//    foo
			'ghi foo',		// baz
			'baz'
		].join('\n') + '\u001b');

		yield wasavi.send('1G1|/def\n');
		assert.pos('#1-1', 0, 4);

		yield wasavi.send('2G5|yN');
		assert.eq('#2-1', 'def\nghi ', wasavi.getRegister('"'));
		assert.pos('#2-2', 0, 4);
	});

	it('search forward prev_4', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('i' + [
			'abc def',		// abc foo
			'ghi foo',		// baz
			'baz'
		].join('\n') + '\u001b');

		yield wasavi.send('G?def\n');
		assert.pos('#1-1', 0, 4);

		yield wasavi.send('2G5|yN');
		assert.eq('#2-1', 'def\nghi ', wasavi.getRegister('"'));
		assert.pos('#2-2', 0, 4);
	});

	it('search backward next_1', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('i' + [
			'    def',		// foo
			'foo',          // baz
			'baz'			//
		].join('\n') + '\u001b');

		yield wasavi.send('G?def\n');
		assert.pos('#1-1', 0, 4);

		yield wasavi.send('2G1|yn');
		assert.eq('#2-1', 'def\n', wasavi.getRegister('"'));
		assert.pos('#2-2', 0, 4);
	});

	it('search backward next_2', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('i' + [
			'abc def',		// abc
			'foo',			// foo
			'baz'			// baz
		].join('\n') + '\u001b');

		yield wasavi.send('G?def\n');
		assert.pos('#1-1', 0, 4);

		yield wasavi.send('2G1|yn');
		assert.eq('#2-1', 'def\n', wasavi.getRegister('"'));
		assert.pos('#2-2', 0, 4);
	});

	it('search backward next_3', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('i' + [
			'    def',		//    foo
			'ghi foo',		// baz
			'baz'
		].join('\n') + '\u001b');

		yield wasavi.send('G?def\n');
		assert.pos('#1-1', 0, 4);

		yield wasavi.send('2G5|yn');
		assert.eq('#2-1', 'def\nghi ', wasavi.getRegister('"'));
		assert.pos('#2-2', 0, 4);
	});

	it('search backward next_4', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('i' + [
			'abc def',		// abc foo
			'ghi foo',		// baz
			'baz'
		].join('\n') + '\u001b');

		yield wasavi.send('G?def\n');
		assert.pos('#1-1', 0, 4);

		yield wasavi.send('2G5|yn');
		assert.eq('#2-1', 'def\nghi ', wasavi.getRegister('"'));
		assert.pos('#2-2', 0, 4);
	});

	it('search backward prev_1', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('i' + [
			'    def',		// foo
			'foo',          // baz
			'baz'			//
		].join('\n') + '\u001b');

		yield wasavi.send('G?foo\n');
		assert.pos('#1-1', 1, 0);

		yield wasavi.send('1G5|yN');
		assert.eq('#2-1', 'def\n', wasavi.getRegister('"'));
		assert.pos('#2-2', 0, 4);
	});

	it('search backward prev_2', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('i' + [
			'abc def',		// abc
			'foo',			// foo
			'baz'			// baz
		].join('\n') + '\u001b');

		yield wasavi.send('G?foo\n');
		assert.pos('#1-1', 1, 0);

		yield wasavi.send('1G5|yN');
		assert.eq('#2-1', 'def\n', wasavi.getRegister('"'));
		assert.pos('#2-2', 0, 4);
	});

	it('search backward prev_3', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('i' + [
			'    def',		//    foo
			'ghi foo',		// baz
			'baz'
		].join('\n') + '\u001b');

		yield wasavi.send('G?foo\n');
		assert.pos('#1-1', 1, 4);

		yield wasavi.send('1G5|yN');
		assert.eq('#2-1', 'def\nghi ', wasavi.getRegister('"'));
		assert.pos('#2-2', 0, 4);
	});

	it('search backward prev_4', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('i' + [
			'abc def',		// abc foo
			'ghi foo',		// baz
			'baz'
		].join('\n') + '\u001b');

		yield wasavi.send('G?foo\n');
		assert.pos('#1-1', 1, 4);

		yield wasavi.send('1G5|yN');
		assert.eq('#2-1', 'def\nghi ', wasavi.getRegister('"'));
		assert.pos('#2-2', 0, 4);
	});

	it('current word forward', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send(
			'i' +
			'foo\n' +
			'bar\n' +
			'baz\n' +
			'foo\n' +
			'bax' +
			'\u001b');
		yield wasavi.send('1G3|y*');
		/*
		 * This is different from vim.
		 * The result in vim is: 'o\nbar\nbaz' (last newline is trimmed).
		 */
		assert.eq('#1-1',
			'o\n' +
			'bar\n' +
			'baz\n',
			wasavi.getRegister('"'));
	});

	it('current word forward2', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send(
			'i' +
			'foo\n' +
			'bar\n' +
			'baz\n' +
			'\tfoo\n' +
			'bax' +
			'\u001b');
		yield wasavi.send('1G3|y*');
		assert.eq('#1-1',
			'o\n' +
			'bar\n' +
			'baz\n' +
			'\t',
			wasavi.getRegister('"'));
	});

	it('current word backward', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send(
			'i' +
			'bax\n' +
			'foo\n' +
			'baz\n' +
			'bar\n' +
			'foo' +
			'\u001b');
		yield wasavi.send('5G3|y#');
		assert.eq('#1-1',
			'foo\n' +
			'baz\n' +
			'bar\n' +
			'fo',
			wasavi.getRegister('"'));
	});

	it('current word backward2', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send(
			'i' +
			'bax\n' +
			'\tfoo\n' +
			'baz\n' +
			'bar\n' +
			'foo' +
			'\u001b');
		yield wasavi.send('5G3|y#');
		assert.eq('#1-1',
			'foo\n' +
			'baz\n' +
			'bar\n' +
			'fo',
			wasavi.getRegister('"'));
	});

	it('to percentage row', function* () {
		yield wasavi.send('ifoo bar baz bax\u001byy4p');
		yield wasavi.send('gg2wy100%');
		assert.eq('#1-1',
			'foo bar baz bax\n' +
			'foo bar baz bax\n' +
			'foo bar baz bax\n' +
			'foo bar baz bax\n' +
			'foo bar baz bax\n',
			wasavi.getRegister('"'));

		yield wasavi.send('yy');
		assert.eq('foo bar baz bax\n', wasavi.getRegister('"'));

		yield wasavi.send('G2wy1%');
		assert.eq('#2-1',
			'foo bar baz bax\n' +
			'foo bar baz bax\n' +
			'foo bar baz bax\n' +
			'foo bar baz bax\n' +
			'foo bar baz bax\n',
			wasavi.getRegister('"'));
	});
};
