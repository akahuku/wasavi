'use strict';

const {By, Key, until, promise} = require('selenium-webdriver');
const {it, describe} = require('selenium-webdriver/testing');

exports.suite = (assert, wasavi, driver) => {
	const {ctrln, ctrlt, ctrlw} = assert.shortcuts;

	it('test delete', function* () {
		yield wasavi.send('i1\n2\n3\n4\n5\n6\u001bgg');

		yield wasavi.send('dd');
		assert.eq('#1-1', '2\n3\n4\n5\n6', wasavi.getValue());
		assert.pos('#1-2', 0, 0);

		yield wasavi.send(':set report=2\n');
		yield wasavi.send('d2d');
		assert.eq('#2-1', '4\n5\n6', wasavi.getValue());
		assert.pos('#2-2', 0, 0);
		assert.eq('#2-3', 'Deleted 2 lines.', wasavi.getLastMessage());

		yield wasavi.send('2dd');
		assert.eq('#3-1', '6', wasavi.getValue());
		assert.pos('#3-2', 0, 0);

		yield wasavi.send('2dd');
		assert.eq('#4-1', '', wasavi.getValue());
		assert.pos('#4-2', 0, 0);
	});

	function* _testDeleteUpLine (a) {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('iline1\n\tline2\n\t\tline3\u001b');
		assert.eq('line1\n\tline2\n\t\tline3', wasavi.getValue());

		yield wasavi.send('3G');
		assert.pos('#1-1', 2, 2);

		yield wasavi.send(`d${a}`);
		assert.pos('#2-1', 0, 0);
		assert.eq('#2-2', '\tline2\n\t\tline3\n', wasavi.getRegister('"'));
		assert.eq('#2-3', '\tline2\n\t\tline3\n', wasavi.getRegister('1'));
		assert.eq('#2-4', 'line1', wasavi.getValue());

		yield wasavi.send('d', a);
		assert.eq('#3-1', '\tline2\n\t\tline3\n', wasavi.getRegister('"'));
		assert.t('#3-2', wasavi.getLastMessage().length > 0);
	}

	it('up line', function* () {
		promise.consume(_testDeleteUpLine, null, '-');
	});

	function* _testDeleteDownLine (a) {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('iline1\n\tline2\n\t\tline3\u001b');
		assert.eq('line1\n\tline2\n\t\tline3', wasavi.getValue());

		yield wasavi.send('1G');
		assert.pos('#1-1', 0, 0);

		yield wasavi.send(`d${a}`);
		assert.pos('#2-1', 0, 2);
		assert.eq('#2-2', 'line1\n\tline2\n', wasavi.getRegister('"'));
		assert.eq('#2-3', 'line1\n\tline2\n', wasavi.getRegister('1'));
		assert.eq('#2-4', '\t\tline3', wasavi.getValue());

		yield wasavi.send(`d${a}`);
		assert.eq('#3-1', 'line1\n\tline2\n', wasavi.getRegister('"'));
		assert.t('#3-2', wasavi.getLastMessage().length > 0);
	}

	it('down line', function* () {
		promise.consume(_testDeleteDownLine, null, '+');
	});

	it('down enter', function* () {
		promise.consume(_testDeleteDownLine, null, Key.ENTER);
	});

	function* _testDeleteFirstNonWhiteCharOfLine (a) {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('i\tfoobar\u001b');
		yield wasavi.send(`d${a}`);

		assert.eq('\tr', wasavi.getValue());
		assert.pos(0, 1);
	}

	it('first non white char of line', function* () {
		promise.consume(_testDeleteFirstNonWhiteCharOfLine, null, '^');
	});

	it('home', function* () {
		promise.consume(_testDeleteFirstNonWhiteCharOfLine, null, Key.HOME);
	});

	it('top of line', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('i\tfoobar\u001b');
		yield wasavi.send('d0');

		assert.eq('r', wasavi.getValue());
		assert.pos(0, 0);
	});

	function* _testDeleteTailOfLine (a) {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('i\tfoobar\u001b1|');
		yield wasavi.send(`d${a}`);

		assert.eq('', wasavi.getValue());
		assert.pos(0, 0);
	}

	it('tail of line', function* () {
		promise.consume(_testDeleteTailOfLine, null, '$');
	});

	it('end', function* () {
		promise.consume(_testDeleteTailOfLine, null, Key.END);
	});

	it('direct column', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('i0123456789\n0123456789\u001b1G1|');

		yield wasavi.send('d5|');
		assert.eq('#1-1', '456789\n0123456789', wasavi.getValue());
		assert.pos('#1-2', 0, 0);

		yield wasavi.send('$d3|');
		assert.eq('#2-1', '459\n0123456789', wasavi.getValue());
		assert.pos('#2-2', 0, 2);

		yield wasavi.send('2G1|d100|');
		assert.eq('#3-1', '459\n', wasavi.getValue());
		assert.pos('#3-2', 1, 0);
	});

	it('jump to matched parenthes', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('ithis is (first) line.\nthis is (second) line)\u001b');

		yield wasavi.send('1G1|f(d%');
		assert.eq('#1-1', 'this is  line.\nthis is (second) line)', wasavi.getValue());
		assert.pos('#1-2', 0, 8);

		yield wasavi.send('2G1|f)d%');
		assert.eq('#2-1', 'this is  line.\nthis is  line)', wasavi.getValue());
		assert.pos('#2-2', 1, 8);

		yield wasavi.send('G$d%');
		assert.eq('#3-1', 'this is  line.\nthis is  line)', wasavi.getValue());
		assert.pos('#3-2', 1, 13);
		assert.t('#3-3', wasavi.getLastMessage().length > 0);
	});

	it('search forward', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('ifind the\nchar4cter in cu4rent 4line\u001b1G1|');

		yield wasavi.send('d/4\n');
		assert.eq('#1-1', '4cter in cu4rent 4line', wasavi.getValue());
		assert.pos('#1-2', 0, 0);

		yield wasavi.send('2d/4\n');
		assert.eq('#2-1', '4line', wasavi.getValue());
		assert.pos('#2-2', 0, 0);

		yield wasavi.send('2d/X\n');
		assert.eq('#3-1', '4line', wasavi.getValue());
		assert.pos('#3-2', 0, 0);
		assert.t('#3-3', wasavi.getLastMessage().length > 0);
	});

	it('search backward', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('ifind the char4cter in cu4rent\n4line\u001b');

		yield wasavi.send('d?4\n');
		assert.eq('#1-1', 'find the char4cter in cu4rent\ne', wasavi.getValue());
		assert.pos('#1-2', 1, 0);

		yield wasavi.send('2d?4\n');
		assert.eq('#2-1', 'find the char\ne', wasavi.getValue());
		assert.pos('#2-2', 0, 12);

		yield wasavi.send('2d?X\n');
		assert.eq('#3-1', 'find the char\ne', wasavi.getValue());
		assert.pos('#3-2', 0, 12);
		assert.t('#3-3', wasavi.getLastMessage().length > 0);
	});

	it('find forward', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('ifind the char4cter in cu4rent 4line\u001b1G1|');

		yield wasavi.send('df4');
		assert.eq('#1-1', 'cter in cu4rent 4line', wasavi.getValue());
		assert.pos('#1-2', 0, 0);

		yield wasavi.send('2df4');
		assert.eq('#2-1', 'line', wasavi.getValue());
		assert.pos('#2-2', 0, 0);

		yield wasavi.send('df4');
		assert.eq('#3-1', 'line', wasavi.getValue());
		assert.pos('#3-2', 0, 0);
		assert.t('#3-3', wasavi.getLastMessage().length > 0);
	});

	it('find backward', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('ifind the char4cter in cu4rent 4line\u001b');

		yield wasavi.send('dF4');
		assert.eq('#1-1', 'find the char4cter in cu4rent e', wasavi.getValue());
		assert.pos('#1-2', 0, 30);

		yield wasavi.send('2dF4');
		assert.eq('#2-1', 'find the chare', wasavi.getValue());
		assert.pos('#2-2', 0, 13);

		yield wasavi.send('dF4');
		assert.eq('#3-1', 'find the chare', wasavi.getValue());
		assert.pos('#3-2', 0, 13);
		assert.t('#3-3', wasavi.getLastMessage().length > 0);
	});

	it('find foward before stop', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('ifind the char4cter in cu4rent 4line\u001b1G1|');

		yield wasavi.send('dt4');
		assert.eq('#1-1', '4cter in cu4rent 4line', wasavi.getValue());
		assert.pos('#1-2', 0, 0);

		yield wasavi.send('2dt4');
		assert.eq('#2-1', '4line', wasavi.getValue());
		assert.pos('#2-2', 0, 0);

		yield wasavi.send('dt4');
		assert.eq('#3-1', '4line', wasavi.getValue());
		assert.pos('#3-2', 0, 0);
		assert.t('#3-3', wasavi.getLastMessage().length > 0);
	});

	it('find backward before stop', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('ifind the char4cter in cu4rent 4line\u001b');

		yield wasavi.send('dT4');
		assert.eq('#1-1', 'find the char4cter in cu4rent 4e', wasavi.getValue());
		assert.pos('#1-2', 0, 31);

		yield wasavi.send('dT4');
		assert.eq('#2-1', 'find the char4cter in cu4rent 4e', wasavi.getValue());
		assert.pos('#2-2', 0, 31);

		yield wasavi.send('d2T4');
		assert.eq('#3-1', 'find the char4cter in cu4e', wasavi.getValue());
		assert.pos('#3-2', 0, 25);

		yield wasavi.send('d3T4');
		assert.eq('#4-1', 'find the char4cter in cu4e', wasavi.getValue());
		assert.pos('#4-2', 0, 25);
		assert.t('#4-3', wasavi.getLastMessage().length > 0);
	});

	it('find invert', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('4ifi4st s4cond th4rd fou4th\n\u001b');

		yield wasavi.send('1G1|df4$d,');
		assert.eq('#1-1', 'st s4cond th4rd fouh', wasavi.getValue().split('\n')[0]);
		assert.pos('#1-2', 0, 19);

		yield wasavi.send('2G1|dt4$d,');
		assert.eq('#2-1', '4st s4cond th4rd fou4h', wasavi.getValue().split('\n')[1]);
		assert.pos('#2-2', 1, 21);

		yield wasavi.send('3G$dF40d,');
		assert.eq('#3-1', 'st s4cond th4rd fouh', wasavi.getValue().split('\n')[2]);
		assert.pos('#3-2', 2, 0);

		yield wasavi.send('4G$dT40d,');
		assert.eq('#4-1', '4st s4cond th4rd fou4h', wasavi.getValue().split('\n')[3]);
		assert.pos('#4-2', 3, 0);
	});

	it('find repeat', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('4ifi4st s4cond th4rd fou4th\n\u001b');

		yield wasavi.send('1G1|df4d;');
		assert.eq('#1-1', 'cond th4rd fou4th', wasavi.getValue().split('\n')[0]);
		assert.pos('#1-2', 0, 0);

		yield wasavi.send('2G1|dt4d;');
		assert.eq('#2-1', '4cond th4rd fou4th', wasavi.getValue().split('\n')[1]);
		assert.pos('#2-2', 1, 0);

		yield wasavi.send('3G$dF4d;');
		assert.eq('#3-1', 'fi4st s4cond thh', wasavi.getValue().split('\n')[2]);
		assert.pos('#3-2', 2, 15);

		yield wasavi.send('4G$dT4d;');
		assert.eq('#4-1', 'fi4st s4cond th4h', wasavi.getValue().split('\n')[3]);
		assert.pos('#4-2', 3, 16);
	});

	it('down line orient', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('i\tfoobar\n\tfoobar\n\tfoobar\n\tfoobar\n\tfoobar\u001bgg');

		yield wasavi.send('d_');
		assert.eq('#1-1', 4, wasavi.getValue().split('\n').length);
		assert.pos('#1-2', 0, 1);

		yield wasavi.send('d2_');
		assert.eq('#2-1', 2, wasavi.getValue().split('\n').length);
		assert.pos('#2-2', 0, 1);

		yield wasavi.send('d3_');
		assert.eq('#3-1', '', wasavi.getValue());
		assert.pos('#3-2', 0, 0);
	});

	it('mark', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('ifoo1bar\nbaz3bax\u001b');

		yield wasavi.send('1G0f1ma0d`a');
		assert.eq('#1-1', '1bar\nbaz3bax', wasavi.getValue());
		assert.pos('#1-2', 0, 0);

		yield wasavi.send('2G$F3ma$d`a');
		assert.eq('#2-1', '1bar\nbazx', wasavi.getValue());
		assert.pos('#2-2', 1, 3);
	});

	it('mark line orient', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('i1\n2\n3\n4\n5\n6\n7\u001b');

		yield wasavi.send('3Gma1Gd\'a');
		assert.eq('#1-1', '4\n5\n6\n7', wasavi.getValue());

		yield wasavi.send('2GmaGd\'a');
		assert.eq('#2-1', '4', wasavi.getValue());
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

	function* _testDeleteDown (a) {
		yield wasavi.send(':set noai\n');

		/*
		 * first            _irst
		 * se_ond
		 * third     -->
		 * f
		 * fifth
		 */
		yield wasavi.send('ifirst\nsecond\nthird\nf\nfifth\u001b');
		yield wasavi.send(`2G3|d10${a}`);
		assert.eq('#1-1', 'first', wasavi.getValue());
		assert.pos('#1-2', 0, 0);
		assert.t('#1-3', wasavi.getLastMessage().length == 0);
		assert.eq('#1-4', 'second\nthird\nf\nfifth\n', wasavi.getRegister('1'));

		/*
		 * first            first
		 * se_ond           _
		 * third     -->    fifth
		 * f
		 * fifth
		 */
		yield wasavi.send('ggdGifirst\nsecond\nthird\nf\nfifth\u001b');
		yield wasavi.send(`2G3|d${a}`);
		assert.eq('#2-1', 'first\nf\nfifth', wasavi.getValue());
		assert.eq('#2-2', 'second\nthird\n', wasavi.getRegister('"'));
		assert.eq('#2-3', 'second\nthird\n', wasavi.getRegister('1'));
		assert.eq('#2-4', 'second\nthird\nf\nfifth\n', wasavi.getRegister('2'));
		assert.pos('#2-5', 1, 0);

		/*
		 * fir_t            _ifth
		 * f         -->
		 * fifth
		 */
		yield wasavi.send(`gg3ld${a}`);
		assert.eq('#3-1', 'fifth', wasavi.getValue());
		assert.eq('#3-2', 'first\nf\n', wasavi.getRegister('"'));
		assert.eq('#3-3', 'first\nf\n', wasavi.getRegister('1'));
		assert.eq('#3-4', 'second\nthird\n', wasavi.getRegister('2'));
		assert.pos('#3-5', 0, 0);
	}

	it('down', function* () {
		promise.consume(_testDeleteDown, null, 'j');
	});

	it('down ctrl n', function* () {
		promise.consume(_testDeleteDown, null, ctrln);
	});

	it('down down', function* () {
		promise.consume(_testDeleteDown, null, Key.DOWN);
	});

	function* _testDeleteUp (a) {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('ifirst\nsecond\nt\u001b');

		/*
		 * POSIX defines that moving beyond top or tail of buffer causes an error,
		 * But vim does not.  We follow vim.
		 */
		yield wasavi.send(`2G3|d10${a}`);
		assert.eq('#1-1', 't', wasavi.getValue());
		assert.pos('#1-2', 0, 0);
		assert.t('#1-3', wasavi.getLastMessage().length == 0);

		yield wasavi.send('ggdGifirst\nsecond\nt\u001b');
		yield wasavi.send(`2G3|d${a}`);
		assert.eq('#2-1', 't', wasavi.getValue());
		assert.eq('#2-2', 'first\nsecond\n', wasavi.getRegister('"'));
		assert.eq('#2-3', 'first\nsecond\n', wasavi.getRegister('1'));
		assert.pos('#2-4', 0, 0);
	}

	it('up', function* () {
		promise.consume(_testDeleteUp, null, 'k');
	});

	it('up ctrl p', function* () {
		promise.consume(_testDeleteUp, null, '\u0010');
	});

	it('up up', function* () {
		promise.consume(_testDeleteUp, null, Key.UP);
	});

	function* _testDeleteLeft (a) {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('ifoo bar baz\u001b');
		assert.pos('#1-1', 0, 10);

		yield wasavi.send(`d${a}`);
		assert.eq('#2-1', 'foo bar bz', wasavi.getValue());
		assert.pos('#2-2', 0, 9);

		yield wasavi.send(`d2${a}`);
		assert.eq('#3-1', 'foo barz', wasavi.getValue());
		assert.pos('#3-2', 0, 7);

		yield wasavi.send(`d100${a}`);
		assert.eq('#4-1', 'z', wasavi.getValue());
		assert.pos('#4-2', 0, 0);
	}

	it('left', function* () {
		promise.consume(_testDeleteLeft, null, 'h');
	});

	it('left ctrl h', function* () {
		promise.consume(_testDeleteLeft, null, '\u0008');
	});

	it('left left', function* () {
		promise.consume(_testDeleteLeft, null, Key.LEFT);
	});

	function* _testDeleteRight (a) {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('ifoo bar baz\u001b1|');
		assert.pos('#1-1', 0, 0);

		yield wasavi.send(`d${a}`);
		assert.eq('#2-1', 'oo bar baz', wasavi.getValue());
		assert.pos('#2-2', 0, 0);
		assert.eq('#2-3', 'f', wasavi.getRegister('"'));

		yield wasavi.send(`"ad2${a}`);
		assert.eq('#3-1', ' bar baz', wasavi.getValue());
		assert.pos('#3-2', 0, 0);
		assert.eq('#3-3', 'oo', wasavi.getRegister('a'));
		assert.eq('#3-4', 'oo', wasavi.getRegister('"'));

		yield wasavi.send(`d5${a}`);
		assert.eq('#4-1', 'baz', wasavi.getValue());
		assert.pos('#4-2', 0, 0);

		yield wasavi.send(`d100${a}`);
		assert.eq('#5-1', '', wasavi.getValue());
		assert.pos('#5-2', 0, 0);
	}

	it('right', function* () {
		promise.consume(_testDeleteRight, null, 'l');
	});

	it('right space', function* () {
		promise.consume(_testDeleteRight, null, ' ');
	});

	it('right right', function* () {
		promise.consume(_testDeleteRight, null, Key.RIGHT);
	});

	it('word forward', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('ifoo bar baz bax\u001b1|');

		yield wasavi.send('dw');
		assert.eq('#1-1', 'bar baz bax', wasavi.getValue());
		assert.pos('#1-2', 0, 0);

		yield wasavi.send('d2w');
		assert.eq('#2-1', 'bax', wasavi.getValue());
		assert.pos('#2-2', 0, 0);
	});

	it('word backward', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('ifoo bar baz bax\u001b');

		yield wasavi.send('db');
		assert.eq('#1-1', 'foo bar baz x', wasavi.getValue());
		assert.pos('#1-2', 0, 12);

		yield wasavi.send('d2b');
		assert.eq('#2-1', 'foo x', wasavi.getValue());
		assert.pos('#2-2', 0, 4);
	});

	it('bigword forward', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('if$o b!r b@z b#x\u001b1|');

		yield wasavi.send('dW');
		assert.eq('#1-1', 'b!r b@z b#x', wasavi.getValue());
		assert.pos('#1-2', 0, 0);

		yield wasavi.send('d2W');
		assert.eq('#2-1', 'b#x', wasavi.getValue());
		assert.pos('#2-2', 0, 0);
	});

	it('bigword backward', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('if$o b!r b@z b#x\u001b');

		yield wasavi.send('dB');
		assert.eq('#1-1', 'f$o b!r b@z x', wasavi.getValue());
		assert.pos('#1-2', 0, 12);

		yield wasavi.send('d2B');
		assert.eq('#2-1', 'f$o x', wasavi.getValue());
		assert.pos('#2-2', 0, 4);
	});

	it('word end', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('ifoo bar baz bax\u001b1|');

		yield wasavi.send('de');
		assert.eq('#1-1', ' bar baz bax', wasavi.getValue());
		assert.pos('#1-2', 0, 0);

		yield wasavi.send('d2e');
		assert.eq('#2-1', ' bax', wasavi.getValue());
		assert.pos('#2-2', 0, 0);

		yield wasavi.send('xde');
		assert.eq('#3-1', '', wasavi.getValue());
		assert.pos('#3-2', 0, 0);
	});

	it('bigword end', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('if$o b!r b@z b#x\u001b1|');

		yield wasavi.send('dE');
		assert.eq('#1-1', ' b!r b@z b#x', wasavi.getValue());
		assert.pos('#1-2', 0, 0);

		yield wasavi.send('d2E');
		assert.eq('#2-1', ' b#x', wasavi.getValue());
		assert.pos('#2-2', 0, 0);

		yield wasavi.send('xdE');
		assert.eq('#3-1', '', wasavi.getValue());
		assert.pos('#3-2', 0, 0);
	});

	it('goto prefix', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('i\t1\n\t2\n\t3\n\t4\n\t5\n\t6\n\t7\u001b');

		yield wasavi.send('ggd3G');
		assert.eq('#1-1', '\t4\n\t5\n\t6\n\t7', wasavi.getValue());
		assert.pos('#1-2', 0, 1);

		yield wasavi.send('Gd3G');
		assert.eq('#2-1', '\t4\n\t5', wasavi.getValue());
		assert.pos('#2-2', 1, 1);
	});

	it('top of view', function* () {
		yield wasavi.makeScrollableBuffer(2);

		var rowLength = wasavi.getRowLength();
		yield wasavi.send('GH');
		var viewLines = wasavi.getRowLength() - wasavi.getRow();

		yield wasavi.send('GdH');
		assert.eq(wasavi.getRowLength(), rowLength - viewLines);
	});

	it('middle of view', function* () {
		yield wasavi.makeScrollableBuffer(2);

		var rowLength = wasavi.getRowLength();
		yield wasavi.send('ggM');
		var viewLines = wasavi.getRow() + 1;

		yield wasavi.send('ggdM');
		assert.eq('#1', wasavi.getRowLength(), rowLength - viewLines);

		rowLength = wasavi.getRowLength();
		yield wasavi.send('GM');
		viewLines = wasavi.getRowLength() - wasavi.getRow();

		yield wasavi.send('GdM');
		assert.eq('#2', wasavi.getRowLength(), rowLength - viewLines);
	});

	it('bottom of view', function* () {
		yield wasavi.makeScrollableBuffer(2);

		var rowLength = wasavi.getRowLength();
		yield wasavi.send('ggL');
		var viewLines = wasavi.getRow() + 1;

		yield wasavi.send('ggdL');
		assert.eq(wasavi.getRowLength(), rowLength - viewLines);
	});

	it('goto', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('i1\n2\n3\n\t4\n5\n6\u001b');

		yield wasavi.send('ggd3G');
		assert.eq('#1-1', '\t4\n5\n6', wasavi.getValue());
		assert.pos('#1-2', 0, 1);

		yield wasavi.send('Gd2G');
		assert.eq('#2-1', '\t4', wasavi.getValue());
		assert.pos('#2-2', 0, 1);
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

		yield wasavi.send('1G5|dn');
		assert.eq('#2-1', 'foo\nbaz', wasavi.getValue());
		assert.pos('#2-2', 0, 0);
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

		yield wasavi.send('1G5|dn');
		assert.eq('#2-1', 'abc \nfoo\nbaz', wasavi.getValue());
		assert.pos('#2-2', 0, 3);
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

		yield wasavi.send('1G5|dn');
		assert.eq('#2-1', '    foo\nbaz', wasavi.getValue());
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

		yield wasavi.send('1G5|dn');
		assert.eq('#2-1', 'abc foo\nbaz', wasavi.getValue());
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

		yield wasavi.send('2G1|dN');
		assert.eq('#2-1', 'foo\nbaz', wasavi.getValue());
		assert.pos('#2-2', 0, 0);
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

		yield wasavi.send('2G1|dN');
		assert.eq('#2-1', 'abc \nfoo\nbaz', wasavi.getValue());
		assert.pos('#2-2', 0, 3);
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

		yield wasavi.send('2G5|dN');
		assert.eq('#2-1', '    foo\nbaz', wasavi.getValue());
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

		yield wasavi.send('2G5|dn');
		assert.eq('#2-1', 'abc foo\nbaz', wasavi.getValue());
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

		yield wasavi.send('2G1|dn');
		assert.eq('#2-1', 'foo\nbaz', wasavi.getValue());
		assert.pos('#2-2', 0, 0);
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

		yield wasavi.send('2G1|dn');
		assert.eq('#2-1', 'abc \nfoo\nbaz', wasavi.getValue());
		assert.pos('#2-2', 0, 3);
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

		yield wasavi.send('2G5|dn');
		assert.eq('#2-1', '    foo\nbaz', wasavi.getValue());
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

		yield wasavi.send('2G5|dn');
		assert.eq('#2-1', 'abc foo\nbaz', wasavi.getValue());
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

		yield wasavi.send('1G5|dN');
		assert.eq('#2-1', 'foo\nbaz', wasavi.getValue());
		assert.pos('#2-2', 0, 0);
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

		yield wasavi.send('1G5|dN');
		assert.eq('#2-1', 'abc \nfoo\nbaz', wasavi.getValue());
		assert.pos('#2-2', 0, 3);
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

		yield wasavi.send('1G5|dN');
		assert.eq('#2-1', '    foo\nbaz', wasavi.getValue());
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

		yield wasavi.send('1G5|dN');
		assert.eq('#2-1', 'abc foo\nbaz', wasavi.getValue());
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
		yield wasavi.send('1G3|d*');
		assert.value('#1-1',
			'fo\n' +
			'foo\n' +
			'bax');
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
		yield wasavi.send('1G3|d*');
		assert.value('#1-1',
			'fofoo\n' +
			'bax');
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
		yield wasavi.send('5G3|d#');
		assert.value('#1-1',
			'bax\n' +
			'o');
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
		yield wasavi.send('5G3|d#');
		assert.value('#1-1',
			'bax\n' +
			'\to');
	});

	it('to percentage row', function* () {
		yield wasavi.send('ifoo bar baz bax\u001byy4pgg2wd100%');
		assert.value('#1-1', '');

		yield wasavi.send('ccfoo bar baz bax\u001byy4pG2wd1%');
		assert.value('#1-2', '');
	});
};
