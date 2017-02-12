'use strict';

const {By, Key, until, promise} = require('selenium-webdriver');
const {it, describe} = require('selenium-webdriver/testing');

exports.suite = (assert, wasavi, driver) => {
	const {ctrln, ctrlt, ctrlw} = assert.shortcuts;

	it('shift', function* () {
		yield wasavi.send(':set sw=8 noai\n');
		yield wasavi.send('i1\n2\n3\u001b');

		yield wasavi.send('gg>>');
		assert.eq('#1-1', '\t1\n2\n3', wasavi.getValue());
		assert.pos('#1-2', 0, 1);

		yield wasavi.send(':set report=2\n');
		yield wasavi.send('gg>2>');
		assert.eq('#2-1', '\t\t1\n\t2\n3', wasavi.getValue());
		assert.pos('#2-2', 0, 2);
		assert.eq('#2-3', 'Shifted 2 lines.', wasavi.getLastMessage());

		yield wasavi.send('gg2>>');
		assert.eq('#3-1', '\t\t\t1\n\t\t2\n3', wasavi.getValue());
		assert.pos('#3-2', 0, 3);

		yield wasavi.send('gg5>>');
		assert.eq('#4-1', '\t\t\t\t1\n\t\t\t2\n\t3', wasavi.getValue());
		assert.pos('#4-2', 0, 4);
	});

	it('with mark', function* () {
		yield wasavi.send(':set sw=4 noai\n');
		yield wasavi.send('ifoo\u001b');

		yield wasavi.send('>>');
		assert.eq('#1-1', '    foo', wasavi.getValue());
		assert.pos('#1-2', 0, 4);

		/*
		 * 4 spaces       8 spaces          1 tab
		 * ....foo   -->  ........foo  -->  +.......foo
		 *   ^mark              ^mark       ^mark
		 */
		yield wasavi.send('3|ma>>');
		assert.eq('#2-1', '\tfoo', wasavi.getValue());
		assert.pos('#2-2', 0, 1);
		yield wasavi.send('gg`a');
		assert.pos('#3-1', 0, 0);
	});

	it('unshift', function* () {
		yield wasavi.send(':set sw=8 noai\n');
		yield wasavi.send('i\t\t\t\t1\n\t\t\t2\n\t3\u001b');

		yield wasavi.send('gg<<');
		assert.eq('#1-1', '\t\t\t1\n\t\t\t2\n\t3', wasavi.getValue());
		assert.pos('#1-2', 0, 3);

		yield wasavi.send(':set report=2\n');
		yield wasavi.send('gg<2<');
		assert.eq('#2-1', '\t\t1\n\t\t2\n\t3', wasavi.getValue());
		assert.pos('#2-2', 0, 2);
		assert.eq('#2-3', 'Unshifted 2 lines.', wasavi.getLastMessage());

		yield wasavi.send('gg2<<');
		assert.eq('#3-1', '\t1\n\t2\n\t3', wasavi.getValue());
		assert.pos('#3-2', 0, 1);

		yield wasavi.send('gg5<<');
		assert.eq('#4-1', '1\n2\n3', wasavi.getValue());
		assert.pos('#4-2', 0, 0);
	});

	it('unshift with mark', function* () {
		yield wasavi.send(':set sw=4 noai\n');
		yield wasavi.send('i\tfoo\u001b');

		yield wasavi.send('<<');
		assert.eq('#1-1', '    foo', wasavi.getValue());
		assert.pos('#1-2', 0, 4);

		/*
		 * 4 spaces
		 * ....foo   -->  foo
		 *   ^mark        ^mark
		 */
		yield wasavi.send('3|ma<<');
		assert.eq('#2-1', 'foo', wasavi.getValue());
		assert.pos('#2-2', 0, 0);
		yield wasavi.send('$`a');
		assert.pos('#3-1', 0, 0);
	});

	function* _testShiftUpLine (a) {
		yield wasavi.send(':set sw=8 noai\n');

		yield wasavi.send('iline1\n\tline2\n\t\tline3\u001b');
		assert.eq('line1\n\tline2\n\t\tline3', wasavi.getValue());

		yield wasavi.send('3G');
		assert.pos('#1-1', 2, 2);

		/*
		 * line1           line1
		 * .line2     -->  ..line2  *
		 * ..line3 *       ...line3
		 */
		yield wasavi.send(`>${a}`);
		assert.pos('#2-1', 1, 2);
		assert.eq('#2-2', 'line1\n\t\tline2\n\t\t\tline3', wasavi.getValue());

		/*
		 * line1           .line1    *
		 * ..line2  *  --> ...line2
		 * ...line3        ...line3
		 */
		yield wasavi.send(`>3${a}`);
		assert.pos('#3-1', 0, 1);
		assert.eq('#3-2', '\tline1\n\t\t\tline2\n\t\t\tline3', wasavi.getValue());

		yield wasavi.send(`>3${a}`);
		assert.eq('#4-1', '\tline1\n\t\t\tline2\n\t\t\tline3', wasavi.getValue());
		assert.t('#4-2', wasavi.getLastMessage().length);
	}

	it('up line', function* () {
		promise.consume(_testShiftUpLine, null, '-');
	});

	function* _testShiftDownLine (a) {
		yield wasavi.send(':set sw=8 noai\n');

		yield wasavi.send('iline1\n\tline2\n\t\tline3\u001b');
		assert.eq('line1\n\tline2\n\t\tline3', wasavi.getValue());

		yield wasavi.send('1G');
		assert.pos('#1-1', 0, 0);

		/*
		 * line1   *       .line1  *
		 * .line2     -->  ..line2
		 * ..line3         ..line3
		 */
		yield wasavi.send(`>${a}`);
		assert.pos('#2-1', 0, 1);
		assert.eq('#2-2', '\tline1\n\t\tline2\n\t\tline3', wasavi.getValue());

		/*
		 * .line1  *       ..line1  *
		 * ..line2    -->  ...line2
		 * ..line3         ...line3
		 */
		yield wasavi.send(`>3${a}`);
		assert.pos('#3-1', 0, 2);
		assert.eq('#3-2', '\t\tline1\n\t\t\tline2\n\t\t\tline3', wasavi.getValue());

		yield wasavi.send(`3G>2${a}`);
		assert.eq('#4-1', '\t\tline1\n\t\t\tline2\n\t\t\tline3', wasavi.getValue());
		assert.t('#4-2', wasavi.getLastMessage().length);
	}

	it('down line', function* () {
		promise.consume(_testShiftDownLine, null, '+');
	});

	it('down enter', function* () {
		promise.consume(_testShiftDownLine, null, Key.ENTER);
	});

	function* _testShiftFirstNonWhiteCharOfLine (a) {
		yield wasavi.send(':set sw=8 noai\n');

		yield wasavi.send('i\tfoobar\u001b');
		yield wasavi.send(`>${a}`);

		assert.eq('#1-1', '\t\tfoobar', wasavi.getValue());
		assert.pos('#1-2', 0, 2);

		yield wasavi.send(`^>${a}`);
		assert.eq('#2-1', '\t\t\tfoobar', wasavi.getValue());
		assert.pos('#2-2', 0, 3);
	}

	it('first non white char of line', function* () {
		promise.consume(_testShiftFirstNonWhiteCharOfLine, null, '^');
	});

	it('home', function* () {
		promise.consume(_testShiftFirstNonWhiteCharOfLine, null, Key.HOME);
	});

	it('top of line', function* () {
		yield wasavi.send(':set sw=8 noai\n');
		yield wasavi.send('i\tfoobar\u001b');
		yield wasavi.send('>0');

		assert.eq('#1-1', '\t\tfoobar', wasavi.getValue());
		assert.pos('#1-2', 0, 2);
	});

	function* _testShiftTailOfLine (a) {
		yield wasavi.send(':set sw=8 noai\n');

		yield wasavi.send('i\tfoobar\u001b1|');
		yield wasavi.send(`>${a}`);

		assert.eq('#1-1', '\t\tfoobar', wasavi.getValue());
		assert.pos('#1-3', 0, 2);
	}

	it('tail of line', function* () {
		promise.consume(_testShiftTailOfLine, null, '$');
	});

	it('end', function* () {
		promise.consume(_testShiftTailOfLine, null, Key.END);
	});

	it('direct column', function* () {
		yield wasavi.send(':set sw=8 noai\n');
		yield wasavi.send('i0123456789\n0123456789\u001b1G1|');

		yield wasavi.send('>5|');
		assert.eq('#1-1', '\t0123456789\n0123456789', wasavi.getValue());
		assert.pos('#1-2', 0, 1);

		yield wasavi.send('$>4|');
		assert.eq('#2-1', '\t\t0123456789\n0123456789', wasavi.getValue());
		assert.pos('#2-2', 0, 2);

		yield wasavi.send('2G1|>100|');
		assert.eq('#3-1', '\t\t0123456789\n\t0123456789', wasavi.getValue());
		assert.pos('#3-2', 1, 1);
	});

	it('jump to matched parenthes', function* () {
		yield wasavi.send(':set sw=8 noai\n');
		yield wasavi.send('i(this is (first) line.\nthis is (second) line)]\u001b');

		yield wasavi.send('1G1|f(>%');
		assert.eq('#1-1', '\t(this is (first) line.\nthis is (second) line)]', wasavi.getValue());
		assert.pos('#1-2', 0, 1);

		yield wasavi.send('2G1|f)>%');
		assert.eq('#2-1', '\t(this is (first) line.\n\tthis is (second) line)]', wasavi.getValue());
		assert.pos('#2-2', 1, 1);

		yield wasavi.send('G$F)>%');
		assert.eq('#3-1', '\t\t(this is (first) line.\n\t\tthis is (second) line)]', wasavi.getValue());
		assert.pos('#3-2', 0, 2);

		yield wasavi.send('G$>%');
		assert.pos('#4-1', 1, 24);
		assert.t('#4-2', wasavi.getLastMessage().length);
	});

	it('search forward', function* () {
		yield wasavi.send(':set sw=8 noai\n');
		yield wasavi.send('ifind the\nchar4cter in cu4rent 4line\u001b1G1|');

		yield wasavi.send('>/4\n');
		assert.eq('#1-1', '\tfind the\n\tchar4cter in cu4rent 4line', wasavi.getValue());
		assert.pos('#1-2', 0, 1);

		yield wasavi.send('2>/4\n');
		assert.eq('#2-1', '\t\tfind the\n\t\tchar4cter in cu4rent 4line', wasavi.getValue());
		assert.pos('#2-3', 0, 2);

		yield wasavi.send('3>/X\n');
		assert.eq('#3-1', '\t\tfind the\n\t\tchar4cter in cu4rent 4line', wasavi.getValue());
		assert.pos('#3-2', 0, 2);
		assert.t('#3-3', wasavi.getLastMessage().length);
	});

	it('search backward', function* () {
		yield wasavi.send(':set sw=8 noai\n');
		yield wasavi.send('ifind the char4cter in cu4rent\n4line\u001b');

		yield wasavi.send('G$>?4\n');
		assert.eq('#1-1', 'find the char4cter in cu4rent\n\t4line', wasavi.getValue());
		assert.pos('#1-3', 1, 1);

		yield wasavi.send('2>?4\n');
		assert.eq('#2-1', '\tfind the char4cter in cu4rent\n\t\t4line', wasavi.getValue());
		assert.pos('#2-2', 0, 1);

		yield wasavi.send('2>?X\n');
		assert.eq('#3-1', '\tfind the char4cter in cu4rent\n\t\t4line', wasavi.getValue());
		assert.pos('#3-2', 0, 1);
		assert.t('#3-3', wasavi.getLastMessage().length);
	});

	it('find forward', function* () {
		yield wasavi.send(':set sw=8 noai\n');
		yield wasavi.send('i4irst 4second\n4hird 4ourth\u001b1G1|');

		yield wasavi.send('0>f4');
		assert.eq('#1-1', '\t4irst 4second\n4hird 4ourth', wasavi.getValue());
		assert.pos('#1-2', 0, 1);

		yield wasavi.send('02>f4');
		assert.eq('#2-1', '\t\t4irst 4second\n4hird 4ourth', wasavi.getValue());
		assert.pos('#2-2', 0, 2);

		yield wasavi.send('04>f4');
		assert.eq('#3-1', '\t\t4irst 4second\n4hird 4ourth', wasavi.getValue());
		assert.pos('#3-2', 0, 0);
		assert.t('#3-3', wasavi.getLastMessage().length);
	});

	it('find backward', function* () {
		yield wasavi.send(':set sw=8 noai\n');
		yield wasavi.send('i4irst 4second\n4hird 4ourth\u001b1G1|');

		yield wasavi.send('$>F4');
		assert.eq('#1-1', '\t4irst 4second\n4hird 4ourth', wasavi.getValue());
		assert.pos('#1-2', 0, 1);

		yield wasavi.send('$2>F4');
		assert.eq('#2-1', '\t\t4irst 4second\n4hird 4ourth', wasavi.getValue());
		assert.pos('#2-2', 0, 2);

		yield wasavi.send('$>3F4');
		assert.eq('#3-1', '\t\t4irst 4second\n4hird 4ourth', wasavi.getValue());
		assert.pos('#3-2', 0, 14);
		assert.t('#3-3', wasavi.getLastMessage().length);
	});

	it('find foward before stop', function* () {
		yield wasavi.send(':set sw=8 noai\n');
		yield wasavi.send('i4irst 4second\n4hird 4ourth\u001b1G1|');

		yield wasavi.send('0>t4');
		assert.eq('#1-1', '\t4irst 4second\n4hird 4ourth', wasavi.getValue());
		assert.pos('#1-2', 0, 1);

		yield wasavi.send('02>t4');
		assert.eq('#2-1', '\t\t4irst 4second\n4hird 4ourth', wasavi.getValue());
		assert.pos('#2-2', 0, 2);

		yield wasavi.send('04>t4');
		assert.eq('#3-1', '\t\t4irst 4second\n4hird 4ourth', wasavi.getValue());
		assert.pos('#3-2', 0, 0);
		assert.t('#3-3', wasavi.getLastMessage().length);
	});

	it('find backward before stop', function* () {
		yield wasavi.send(':set sw=8 noai\n');
		yield wasavi.send('i4irst 4second\n4hird 4ourth\u001b1G1|');
		
		yield wasavi.send('$>T4');
		assert.eq('#1-1', '\t4irst 4second\n4hird 4ourth', wasavi.getValue());
		assert.pos('#1-2', 0, 1);

		yield wasavi.send('$2>T4');
		assert.eq('#2-1', '\t\t4irst 4second\n4hird 4ourth', wasavi.getValue());
		assert.pos('#2-2', 0, 2);

		yield wasavi.send('$>2T4');
		assert.eq('#3-1', '\t\t\t4irst 4second\n4hird 4ourth', wasavi.getValue());
		assert.pos('#3-2', 0, 3);

		yield wasavi.send('$>3T4');
		assert.eq('#4-1', '\t\t\t4irst 4second\n4hird 4ourth', wasavi.getValue());
		assert.pos('#4-2', 0, 15);
		assert.t('#4-3', wasavi.getLastMessage().length);
	});

	it('find invert', function* () {
		yield wasavi.send(':set sw=8 noai\n');
		yield wasavi.send('4ifi4st s4cond th4rd fou4th\n\u001b');

		yield wasavi.send('1G1|>f4$>,');
		assert.eq('#1-1', '\t\tfi4st s4cond th4rd fou4th', wasavi.getValue().split('\n')[0]);
		assert.pos('#1-2', 0, 2);

		yield wasavi.send('2G1|>t4$>,');
		assert.eq('#2-1', '\t\tfi4st s4cond th4rd fou4th', wasavi.getValue().split('\n')[1]);
		assert.pos('#2-2', 1, 2);

		yield wasavi.send('3G$>F40>,');
		assert.eq('#3-1', '\t\tfi4st s4cond th4rd fou4th', wasavi.getValue().split('\n')[2]);
		assert.pos('#3-2', 2, 2);

		yield wasavi.send('4G$>T40>,');
		assert.eq('#4-1', '\t\tfi4st s4cond th4rd fou4th', wasavi.getValue().split('\n')[3]);
		assert.pos('#4-2', 3, 2);
	});

	it('find repeat', function* () {
		yield wasavi.send(':set sw=8 noai\n');
		yield wasavi.send('4ifi4st s4cond th4rd fou4th\n\u001b');

		yield wasavi.send('1G1|f43|>;');
		assert.eq('#1-1', '\tfi4st s4cond th4rd fou4th', wasavi.getValue().split('\n')[0]);
		assert.pos('#1-3', 0, 1);

		yield wasavi.send('2G1|t43|>;');
		assert.eq('#2-1', '\tfi4st s4cond th4rd fou4th', wasavi.getValue().split('\n')[1]);
		assert.pos('#2-3', 1, 1);

		yield wasavi.send('3G$F4>;');
		assert.eq('#3-1', '\tfi4st s4cond th4rd fou4th', wasavi.getValue().split('\n')[2]);
		assert.pos('#3-2', 2, 1);

		yield wasavi.send('4G$T4>;');
		assert.eq('#4-1', '\tfi4st s4cond th4rd fou4th', wasavi.getValue().split('\n')[3]);
		assert.pos('#4-2', 3, 1);
	});

	it('down line orient', function* () {
		yield wasavi.send(':set sw=8 noai\n');
		yield wasavi.send('i1foobar\n2foobar\u001bgg');

		yield wasavi.send('>_');
		/*
		 * 1foobar  -->  ^I1foobar
		 * 2foobar       2foobar
		 */
		assert.eq('#1-1', '\t1foobar\n2foobar', wasavi.getValue());
		assert.pos('#1-2', 0, 1);

		yield wasavi.send('2G');
		yield wasavi.send('>_');
		/*
		 * ^I1foobar  -->  ^I1foobar
		 * 2foobar         ^I2foobar
		 */
		assert.eq('#2-1', '\t1foobar\n\t2foobar', wasavi.getValue());
		assert.pos('#2-2', 1, 1);

		yield wasavi.send('gg>2_');
		/*
		 * ^I1foobar  -->  ^I^I1foobar
		 * ^I2foobar       ^I^I2foobar
		 */
		assert.eq('#3-1', '\t\t1foobar\n\t\t2foobar', wasavi.getValue());
		assert.pos('#3-2', 0, 2);

		yield wasavi.send('>3_');
		/*
		 * ^I^I1foobar  -->  ^I^I^I1foobar
		 * ^I^I2foobar       ^I^I^I2foobar
		 */
		assert.eq('#4-1', '\t\t\t1foobar\n\t\t\t2foobar', wasavi.getValue());
		assert.pos('#4-2', 0, 3);
	});

	it('mark', function* () {
		yield wasavi.send(':set sw=8 noai\n');
		yield wasavi.send('ifoo1bar\nbaz3bax\u001b');

		yield wasavi.send('1G0f1ma0>`a');
		assert.eq('#1-1', '\tfoo1bar\nbaz3bax', wasavi.getValue());
		assert.pos('#1-2', 0, 1);

		yield wasavi.send('2G$F3mb$>`b');
		assert.eq('#2-1', '\tfoo1bar\n\tbaz3bax', wasavi.getValue());
		assert.pos('#2-2', 1, 1);

		yield wasavi.send('>`a');
		assert.eq('#3-1', '\t\tfoo1bar\n\t\tbaz3bax', wasavi.getValue());
		assert.pos('#3-2', 0, 2);

		yield wasavi.send('>`c');
		assert.eq('#4-1', '\t\tfoo1bar\n\t\tbaz3bax', wasavi.getValue());
		assert.pos('#4-2', 0, 2);
		assert.t('#4-3', wasavi.getLastMessage().length);
	});

	it('mark line orient', function* () {
		yield wasavi.send(':set sw=8 noai\n');
		yield wasavi.send('i1\n2\n3\n4\n5\n6\n7\u001b');

		yield wasavi.send('3Gma1G>\'a');
		assert.eq('#1-1', '\t1\n\t2\n\t3\n4\n5\n6\n7', wasavi.getValue());
		assert.pos('#1-2', 0, 1);

		yield wasavi.send('5GmaG>\'a');
		assert.eq('#2-1', '\t1\n\t2\n\t3\n4\n\t5\n\t6\n\t7', wasavi.getValue());
		assert.pos('#2-2', 4, 1);
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

	function* _testShiftDown (a) {
		yield wasavi.send(':set sw=8 noai\n');

		yield wasavi.send('ifirst\nsecond\nthird\nf\nfifth\u001b');
		yield wasavi.send(`2G3|>10${a}`);
		assert.eq('#1-1', 'first\n\tsecond\n\tthird\n\tf\n\tfifth', wasavi.getValue());
		assert.pos('#1-2', 1, 1);
		assert.t('#1-3', wasavi.getLastMessage().length == 0);

		yield wasavi.send(`2G3|>${a}`);
		assert.eq('#2-1', 'first\n\t\tsecond\n\t\tthird\n\tf\n\tfifth', wasavi.getValue());
		assert.pos('#2-2', 1, 2);

		yield wasavi.send(`G>${a}`);
		assert.eq('#3-1', 'first\n\t\tsecond\n\t\tthird\n\tf\n\tfifth', wasavi.getValue());
		assert.pos('#3-2', 4, 1);
		assert.t('#3-3', wasavi.getLastMessage().length);
	}

	it('down', function* () {
		promise.consume(_testShiftDown, null, 'j');
	});

	it('down ctrl n', function* () {
		promise.consume(_testShiftDown, null, ctrln);
	});

	it('down down', function* () {
		promise.consume(_testShiftDown, null, Key.DOWN);
	});

	function* _testShiftUp (a) {
		yield wasavi.send(':set sw=8 noai\n');

		yield wasavi.send('ifirst\nsecond\nt\u001b');

		yield wasavi.send(`2G3|>10${a}`);
		assert.eq('#1-1', '\tfirst\n\tsecond\nt', wasavi.getValue());
		assert.pos('#1-2', 0, 1);
		assert.t('#1-3', wasavi.getLastMessage().length == 0);

		yield wasavi.send(`2G1|>${a}`);
		assert.eq('#2-1', '\t\tfirst\n\t\tsecond\nt', wasavi.getValue());
		assert.pos('#2-2', 0, 2);

		yield wasavi.send(`1G>${a}`);
		assert.eq('#3-1', '\t\tfirst\n\t\tsecond\nt', wasavi.getValue());
		assert.pos('#3-2', 0, 2);
		assert.t('#3-3', wasavi.getLastMessage().length);
	}

	it('up', function* () {
		promise.consume(_testShiftUp, null, 'k');
	});

	it('up ctrl p', function* () {
		promise.consume(_testShiftUp, null, '\u0010');
	});

	it('up up', function* () {
		promise.consume(_testShiftUp, null, Key.UP);
	});

	function* _testShiftLeft (a) {
		yield wasavi.send(':set sw=8 noai\n');

		yield wasavi.send('ifoo bar baz\u001b');
		assert.pos('#1-1', 0, 10);

		yield wasavi.send(`>${a}`);
		assert.eq('#2-1', '\tfoo bar baz', wasavi.getValue());
		assert.pos('#2-2', 0, 1);

		yield wasavi.send(`>2${a}`);
		assert.eq('#3-1', '\t\tfoo bar baz', wasavi.getValue());
		assert.pos('#3-2', 0, 2);

		yield wasavi.send(`>100${a}`);
		assert.eq('#4-1', '\t\t\tfoo bar baz', wasavi.getValue());
		assert.pos('#4-2', 0, 3);
	}

	it('left', function* () {
		promise.consume(_testShiftLeft, null, 'h');
	});

	it('left ctrl h', function* () {
		promise.consume(_testShiftLeft, null, '\u0008');
	});

	it('left left', function* () {
		promise.consume(_testShiftLeft, null, Key.LEFT);
	});

	function* _testShiftRight (a) {
		yield wasavi.send(':set sw=8 noai\n');

		yield wasavi.send('ifoo bar baz\u001b1|');
		assert.pos('#1-1', 0, 0);

		yield wasavi.send(`>${a}`);
		assert.eq('#2-1', '\tfoo bar baz', wasavi.getValue());
		assert.pos('#2-2', 0, 1);

		yield wasavi.send(`>2${a}`);
		assert.eq('#3-1', '\t\tfoo bar baz', wasavi.getValue());
		assert.pos('#3-2', 0, 2);

		yield wasavi.send(`>5${a}`);
		assert.eq('#4-1', '\t\t\tfoo bar baz', wasavi.getValue());
		assert.pos('#4-2', 0, 3);

		yield wasavi.send(`>100${a}`);
		assert.eq('#5-1', '\t\t\t\tfoo bar baz', wasavi.getValue());
		assert.pos('#5-2', 0, 4);
	}

	it('right', function* () {
		promise.consume(_testShiftRight, null, 'l');
	});

	it('right space', function* () {
		promise.consume(_testShiftRight, null, ' ');
	});

	it('right right', function* () {
		promise.consume(_testShiftRight, null, Key.RIGHT);
	});

	it('word forward', function* () {
		yield wasavi.send(':set sw=8 noai\n');
		yield wasavi.send('ifoo bar baz\nbax\u001b1|gg');

		yield wasavi.send('>w');
		assert.eq('#1-1', '\tfoo bar baz\nbax', wasavi.getValue());
		assert.pos('#1-2', 0, 1);

		yield wasavi.send('gg>2w');
		assert.eq('#2-1', '\t\tfoo bar baz\nbax', wasavi.getValue());
		assert.pos('#2-2', 0, 2);

		yield wasavi.send('gg>3w');
		assert.eq('#3-1', '\t\t\tfoo bar baz\nbax', wasavi.getValue());
		assert.pos('#3-2', 0, 3);

		yield wasavi.send('gg>4w');
		assert.eq('#4-1', '\t\t\t\tfoo bar baz\n\tbax', wasavi.getValue());
		assert.t('#4-2', wasavi.getLastMessage().length == 0);
		assert.pos('#4-3', 0, 4);
	});

	it('word backward', function* () {
		yield wasavi.send(':set sw=8 noai\n');
		yield wasavi.send('ifoo\nbar baz bax\u001b');

		/*
		 * foo               foo
		 * bar baz bax  -->  .bar baz bax
		 */
		yield wasavi.send('>b');
		assert.eq('#1-1', 'foo\n\tbar baz bax', wasavi.getValue());
		assert.pos('#1-2', 1, 1);

		/*
		 * foo                .foo
		 * .bar baz bax  -->  ..bar baz bax
		 */
		yield wasavi.send('>b');
		assert.eq('#2-1', '\tfoo\n\t\tbar baz bax', wasavi.getValue());
		assert.pos('#2-2', 0, 1);

		/*
		 * .foo
		 * ..bar baz bax
		 */
		yield wasavi.send('1G1|>b');
		assert.eq('#3-1', '\tfoo\n\t\tbar baz bax', wasavi.getValue());
		assert.pos('#3-2', 0, 0);
		assert.t('#3-3', wasavi.getLastMessage().length);
	});

	it('bigword forward', function* () {
		yield wasavi.send(':set sw=8 noai\n');
		yield wasavi.send('if#o b#r b#z\nb#x\u001b1|gg');

		yield wasavi.send('>W');
		assert.eq('#1-1', '\tf#o b#r b#z\nb#x', wasavi.getValue());
		assert.pos('#1-2', 0, 1);

		yield wasavi.send('gg>2W');
		assert.eq('#2-1', '\t\tf#o b#r b#z\nb#x', wasavi.getValue());
		assert.pos('#2-2', 0, 2);

		yield wasavi.send('gg>3W');
		assert.eq('#3-1', '\t\t\tf#o b#r b#z\nb#x', wasavi.getValue());
		assert.pos('#3-2', 0, 3);

		yield wasavi.send('gg>4W');
		assert.eq('#4-1', '\t\t\t\tf#o b#r b#z\n\tb#x', wasavi.getValue());
		assert.t('#4-2', wasavi.getLastMessage().length == 0);
		assert.pos('#4-3', 0, 4);
	});

	it('bigword backward', function* () {
		yield wasavi.send(':set sw=8 noai\n');
		yield wasavi.send('if#o\nb#r b#z b#x\u001b');

		yield wasavi.send('$>B');
		assert.eq('#1-1', 'f#o\n\tb#r b#z b#x', wasavi.getValue());
		assert.pos('#1-2', 1, 1);

		yield wasavi.send('>B');
		assert.eq('#2-1', '\tf#o\n\t\tb#r b#z b#x', wasavi.getValue());
		assert.pos('#2-2', 0, 1);

		yield wasavi.send('0>B');
		assert.eq('#3-1', '\tf#o\n\t\tb#r b#z b#x', wasavi.getValue());
		assert.pos('#3-2', 0, 0);
		assert.t('#3-3', wasavi.getLastMessage().length);
	});

	it('word end', function* () {
		yield wasavi.send(':set sw=8 noai\n');
		yield wasavi.send('ifoo bar\nbaz\nbax\u001bgg');

		yield wasavi.send('>e');
		assert.eq('#1-1', '\tfoo bar\nbaz\nbax', wasavi.getValue());
		assert.pos('#1-2', 0, 1);

		yield wasavi.send('gg>2e');
		assert.eq('#2-1', '\t\tfoo bar\nbaz\nbax', wasavi.getValue());
		assert.pos('#2-2', 0, 2);

		yield wasavi.send('gg>3e');
		assert.eq('#3-1', '\t\t\tfoo bar\n\tbaz\nbax', wasavi.getValue());
		assert.pos('#3-3', 0, 3);
	});

	it('bigword end', function* () {
		yield wasavi.send(':set sw=8 noai\n');
		yield wasavi.send('if@o b@r\nb@z\nb@x\u001bgg');

		yield wasavi.send('>E');
		assert.eq('#1-1', '\tf@o b@r\nb@z\nb@x', wasavi.getValue());
		assert.pos('#1-2', 0, 1);

		yield wasavi.send('gg>2E');
		assert.eq('#2-1', '\t\tf@o b@r\nb@z\nb@x', wasavi.getValue());
		assert.pos('#2-2', 0, 2);

		yield wasavi.send('gg>3E');
		assert.eq('#3-1', '\t\t\tf@o b@r\n\tb@z\nb@x', wasavi.getValue());
		assert.pos('#3-2', 0, 3);
	});

	it('goto prefix', function* () {
		yield wasavi.send(':set sw=8 noai\n');
		yield wasavi.send('i 1\n2\n 3\u001b');

		yield wasavi.send('>gg');
		assert.eq('#1-1', '\t 1\n\t2\n\t 3', wasavi.getValue());
		assert.pos('#1-2', 0, 2);
	});

	it('top of view', function* () {
		yield wasavi.send(':set sw=8 noai\n');
		yield wasavi.makeScrollableBuffer(2);

		var rowLength = wasavi.getRowLength();
		yield wasavi.send('GH');
		var viewLines = wasavi.getRowLength() - wasavi.getRow();

		yield wasavi.send('G>H');

		var indented = 0;
		var lines = wasavi.getValue().split('\n');
		lines.forEach(s => {
			if (s.charAt(0) == '\t') {
				indented++;
			}
		});
		assert.eq(indented, viewLines);
	});

	it('middle of view', function* () {
		yield wasavi.send(':set sw=8 noai\n');
		yield wasavi.makeScrollableBuffer(2);

		var rowLength = wasavi.getRowLength();
		yield wasavi.send('ggM');
		var viewLines = wasavi.getRow() + 1;

		yield wasavi.send('gg>M');

		var indented = 0;
		var lines = wasavi.getValue().split('\n');
		lines.forEach(s => {
			if (s.charAt(0) == '\t') {
				indented++;
			}
		});
		assert.eq(indented, viewLines);
	});

	it('middle of view2', function* () {
		yield wasavi.send(':set sw=8 noai\n');
		yield wasavi.makeScrollableBuffer(2);

		var rowLength = wasavi.getRowLength();
		yield wasavi.send('GM');
		var viewLines = wasavi.getRowLength() - wasavi.getRow();

		yield wasavi.send('G>M');

		var indented = 0;
		var lines = wasavi.getValue().split('\n');
		lines.forEach(s => {
			if (s.charAt(0) == '\t') {
				indented++;
			}
		});
		assert.eq(indented, viewLines);
	});

	it('bottom of view', function* () {
		yield wasavi.send(':set sw=8 noai\n');
		yield wasavi.makeScrollableBuffer(2);

		var rowLength = wasavi.getRowLength();
		yield wasavi.send('ggL');
		var viewLines = wasavi.getRow() + 1;

		yield wasavi.send('gg>L');

		var indented = 0;
		var lines = wasavi.getValue().split('\n');
		lines.forEach(s => {
			if (s.charAt(0) == '\t') {
				indented++;
			}
		});
		assert.eq(indented, viewLines);
	});

	it('goto', function* () {
		yield wasavi.send(':set sw=8 noai\n');
		yield wasavi.send('i\t1\n\t2\n\t3\n\t4\n\t5\n\t6\n\t7\u001b');

		yield wasavi.send('gg>3G');
		assert.eq('#1-1', '\t\t1\n\t\t2\n\t\t3\n\t4\n\t5\n\t6\n\t7', wasavi.getValue());
		assert.pos('#1-2', 0, 2);

		yield wasavi.send('G>5G');
		assert.eq('#2-1', '\t\t1\n\t\t2\n\t\t3\n\t4\n\t\t5\n\t\t6\n\t\t7', wasavi.getValue());
		assert.pos('#2-2', 4, 2);
	});

	it('search forward next_1', function* () {
		yield wasavi.send(':set sw=8 noai\n');
		yield wasavi.send('i' + [
			'    def',		// .    def
			'foo',          // foo
			'baz'			// baz
		].join('\n') + '\u001b');

		yield wasavi.send('1G1|/foo\n');
		assert.pos('#1-1', 1, 0);

		yield wasavi.send('1G5|>n');
		assert.eq('#2-1', '\t    def\nfoo\nbaz', wasavi.getValue());
		assert.pos('#2-2', 0, 5);
	});

	it('search forward next_2', function* () {
		yield wasavi.send(':set sw=8 noai\n');
		yield wasavi.send('i' + [
			'abc def',		// .abc def
			'foo',			// foo
			'baz'			// baz
		].join('\n') + '\u001b');

		yield wasavi.send('1G1|/foo\n');
		assert.pos('#1-1', 1, 0);

		yield wasavi.send('1G5|>n');
		assert.eq('#2-1', '\tabc def\nfoo\nbaz', wasavi.getValue());
		assert.pos('#2-2', 0, 1);
	});

	it('search forward next_3', function* () {
		yield wasavi.send(':set sw=8 noai\n');
		yield wasavi.send('i' + [
			'    def',		// .    def
			'ghi foo',		// .ghi foo
			'baz'			// baz
		].join('\n') + '\u001b');

		yield wasavi.send('1G1|/foo\n');
		assert.pos('#1-1', 1, 4);

		yield wasavi.send('1G5|>n');
		assert.eq('#2-1', '\t    def\n\tghi foo\nbaz', wasavi.getValue());
		assert.pos('#2-3', 0, 5);
	});

	it('search forward next_4', function* () {
		yield wasavi.send(':set sw=8 noai\n');
		yield wasavi.send('i' + [
			'abc def',		// .abc def
			'ghi foo',		// .ghi foo
			'baz'			// baz
		].join('\n') + '\u001b');

		yield wasavi.send('1G1|/foo\n');
		assert.pos('#1-1', 1, 4);

		yield wasavi.send('1G5|>n');
		assert.eq('#2-1', '\tabc def\n\tghi foo\nbaz', wasavi.getValue());
		assert.pos('#2-3', 0, 1);
	});

	it('search forward prev_1', function* () {
		yield wasavi.send(':set sw=8 noai\n');
		yield wasavi.send('i' + [
			'    def',		// .    def
			'foo',          // foo
			'baz'			// baz
		].join('\n') + '\u001b');

		yield wasavi.send('1G1|/def\n');
		assert.pos('#1-1', 0, 4);

		yield wasavi.send('2G1|>N');
		assert.eq('#2-1', '\t    def\nfoo\nbaz', wasavi.getValue());
		assert.pos('#2-2', 0, 5);
	});

	it('search forward prev_2', function* () {
		yield wasavi.send(':set sw=8 noai\n');
		yield wasavi.send('i' + [
			'abc def',		// .abc def
			'foo',			// foo
			'baz'			// baz
		].join('\n') + '\u001b');

		yield wasavi.send('1G1|/def\n');
		assert.pos('#1-1', 0, 4);

		yield wasavi.send('2G1|>N');
		assert.eq('#2-1', '\tabc def\nfoo\nbaz', wasavi.getValue());
		assert.pos('#2-2', 0, 1);
	});

	it('search forward prev_3', function* () {
		yield wasavi.send(':set sw=8 noai\n');
		yield wasavi.send('i' + [
			'    def',		// .    def
			'ghi foo',		// .ghi foo
			'baz'			// baz
		].join('\n') + '\u001b');

		yield wasavi.send('1G1|/def\n');
		assert.pos('#1-1', 0, 4);

		yield wasavi.send('2G5|>N');
		assert.eq('#2-1', '\t    def\n\tghi foo\nbaz', wasavi.getValue());
		assert.pos('#2-3', 0, 5);
	});

	it('search forward prev_4', function* () {
		yield wasavi.send(':set sw=8 noai\n');
		yield wasavi.send('i' + [
			'abc def',		// .abc def
			'ghi foo',		// .ghi foo
			'baz'			// baz
		].join('\n') + '\u001b');

		yield wasavi.send('G?def\n');
		assert.pos('#1-1', 0, 4);

		yield wasavi.send('2G5|>N');
		assert.eq('#2-1', '\tabc def\n\tghi foo\nbaz', wasavi.getValue());
		assert.pos('#2-2', 0, 1);
	});

	it('search backward next_1', function* () {
		yield wasavi.send(':set sw=8 noai\n');
		yield wasavi.send('i' + [
			'    def',		// .    def
			'foo',          // foo
			'baz'			// baz
		].join('\n') + '\u001b');

		yield wasavi.send('G?def\n');
		assert.pos('#1-1', 0, 4);

		yield wasavi.send('2G1|>n');
		assert.eq('#2-1', '\t    def\nfoo\nbaz', wasavi.getValue());
		assert.pos('#2-2', 0, 5);
	});

	it('search backward next_2', function* () {
		yield wasavi.send(':set sw=8 noai\n');
		yield wasavi.send('i' + [
			'abc def',		// .abc def
			'foo',			// foo
			'baz'			// baz
		].join('\n') + '\u001b');

		yield wasavi.send('G?def\n');
		assert.pos('#1-1', 0, 4);

		yield wasavi.send('2G1|>n');
		assert.eq('#2-1', '\tabc def\nfoo\nbaz', wasavi.getValue());
		assert.pos('#2-2', 0, 1);
	});

	it('search backward next_3', function* () {
		yield wasavi.send(':set sw=8 noai\n');
		yield wasavi.send('i' + [
			'    def',		// .    def
			'ghi foo',		// .ghi foo
			'baz'			// baz
		].join('\n') + '\u001b');

		yield wasavi.send('G?def\n');
		assert.pos('#1-1', 0, 4);

		yield wasavi.send('2G5|>n');
		assert.eq('#2-1', '\t    def\n\tghi foo\nbaz', wasavi.getValue());
		assert.pos('#2-2', 0, 5);
	});

	it('search backward next_4', function* () {
		yield wasavi.send(':set sw=8 noai\n');
		yield wasavi.send('i' + [
			'abc def',		// .abc def
			'ghi foo',		// .ghi foo
			'baz'			// baz
		].join('\n') + '\u001b');

		yield wasavi.send('G?def\n');
		assert.pos('#1-1', 0, 4);

		yield wasavi.send('2G5|>n');
		assert.eq('#2-1', '\tabc def\n\tghi foo\nbaz', wasavi.getValue());
		assert.pos('#2-2', 0, 1);
	});

	it('search backward prev_1', function* () {
		yield wasavi.send(':set sw=8 noai\n');
		yield wasavi.send('i' + [
			'    def',		// .    def
			'foo',          // foo
			'baz'			// baz
		].join('\n') + '\u001b');

		yield wasavi.send('G?foo\n');
		assert.pos('#1-1', 1, 0);

		yield wasavi.send('1G5|>N');
		assert.eq('#2-1', '\t    def\nfoo\nbaz', wasavi.getValue());
		assert.pos('#2-2', 0, 5);
	});

	it('search backward prev_2', function* () {
		yield wasavi.send(':set sw=8 noai\n');
		yield wasavi.send('i' + [
			'abc def',		// .abc def
			'foo',			// foo
			'baz'			// baz
		].join('\n') + '\u001b');

		yield wasavi.send('G?foo\n');
		assert.pos('#1-1', 1, 0);

		yield wasavi.send('1G5|>N');
		assert.eq('#2-1', '\tabc def\nfoo\nbaz', wasavi.getValue());
		assert.pos('#2-2', 0, 1);
	});

	it('search backward prev_3', function* () {
		yield wasavi.send(':set sw=8 noai\n');
		yield wasavi.send('i' + [
			'    def',		// .    def
			'ghi foo',		// .ghi foo
			'baz'			// baz
		].join('\n') + '\u001b');

		yield wasavi.send('G?foo\n');
		assert.pos('#1-1', 1, 4);

		yield wasavi.send('1G5|>N');
		assert.eq('#2-1', '\t    def\n\tghi foo\nbaz', wasavi.getValue());
		assert.pos('#2-2', 0, 5);
	});

	it('search backward prev_4', function* () {
		yield wasavi.send(':set sw=8 noai\n');
		yield wasavi.send('i' + [
			'abc def',		// .abc def
			'ghi foo',		// .ghi foo
			'baz'			// baz
		].join('\n') + '\u001b');

		yield wasavi.send('G?foo\n');
		assert.pos('#1-1', 1, 4);

		yield wasavi.send('1G5|>N');
		assert.eq('#2-1', '\tabc def\n\tghi foo\nbaz', wasavi.getValue());
		assert.pos('#2-2', 0, 1);
	});

	it('current word forward', function* () {
		yield wasavi.send(':set sw=8 noai\n');
		yield wasavi.send(
			'i' +
			'foo\n' +
			'bar\n' +
			'baz\n' +
			'foo\n' +
			'bax' +
			'\u001b');
		yield wasavi.send('1G3|>*');
		assert.value('#1-1',
			'\tfoo\n' +
			'\tbar\n' +
			'\tbaz\n' +
			'foo\n' +
			'bax');
	});

	it('current word forward2', function* () {
		yield wasavi.send(':set sw=8 noai\n');
		yield wasavi.send(
			'i' +
			'foo\n' +
			'bar\n' +
			'baz\n' +
			'\tfoo\n' +
			'bax' +
			'\u001b');
		yield wasavi.send('1G3|>*');
		assert.value('#1-1',
			'\tfoo\n' +
			'\tbar\n' +
			'\tbaz\n' +
			'\t\tfoo\n' +
			'bax');
	});

	it('current word backward', function* () {
		yield wasavi.send(':set sw=8 noai\n');
		yield wasavi.send(
			'i' +
			'bax\n' +
			'foo\n' +
			'baz\n' +
			'bar\n' +
			'foo' +
			'\u001b');
		yield wasavi.send('5G3|>#');
		assert.value('#1-1',
			'bax\n' +
			'\tfoo\n' +
			'\tbaz\n' +
			'\tbar\n' +
			'\tfoo');
	});

	it('current word backward2', function* () {
		yield wasavi.send(':set sw=8 noai\n');
		yield wasavi.send(
			'i' +
			'bax\n' +
			'\tfoo\n' +
			'baz\n' +
			'bar\n' +
			'foo' +
			'\u001b');
		yield wasavi.send('5G3|>#');
		assert.value('#1-1',
			'bax\n' +
			'\t\tfoo\n' +
			'\tbaz\n' +
			'\tbar\n' +
			'\tfoo');
	});

	it('to percentage row', function* () {
		yield wasavi.send(':set sw=8\n');
		yield wasavi.send('ifoo bar baz bax\u001byy4p');
		yield wasavi.send('gg2w>100%');
		assert.value('#1-1',
			'\tfoo bar baz bax\n' +
			'\tfoo bar baz bax\n' +
			'\tfoo bar baz bax\n' +
			'\tfoo bar baz bax\n' +
			'\tfoo bar baz bax');

		yield wasavi.send('G2w<1%');
		assert.value('#2-1',
			'foo bar baz bax\n' +
			'foo bar baz bax\n' +
			'foo bar baz bax\n' +
			'foo bar baz bax\n' +
			'foo bar baz bax');
	});

	it('shift empty row', function* () {
		yield wasavi.send(':set noai sw=8\n');
		yield wasavi.send('ifoo\n\nbar\u001b');
		yield wasavi.send('2Gma');
		yield wasavi.send('1G3>>');
		assert.value('#1-1',
			'\tfoo\n' +
			'\n' +
			'\tbar');
	});

	it('unshift empty row', function* () {
		yield wasavi.send(':set noai sw=8\n');
		yield wasavi.send('i\tfoo\n\n\tbar\u001b');
		yield wasavi.send('2Gma');
		yield wasavi.send('1G3<<');
		assert.value('#1-1',
			'foo\n' +
			'\n' +
			'bar');
	});
};
