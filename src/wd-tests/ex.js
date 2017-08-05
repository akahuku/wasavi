'use strict';

const {By, Key, until, promise} = require('selenium-webdriver');
const {it, describe} = require('selenium-webdriver/testing');

exports.suite = (assert, wasavi, driver) => {
	const {ctrln, ctrlt, ctrlw} = assert.shortcuts;

	it('address all', function* () {
		yield wasavi.send('i1\n2\n3\u001b');
		yield wasavi.send(':%p\n');
		assert.eq('#1-1', '1\n2\n3', wasavi.getLastMessage());

		yield wasavi.send(':% +1p\n\u001b');
		assert.t('#2-1', wasavi.getLastMessage().length);
	});

	it('null', function* () {
		yield wasavi.send('i1\n2\n3\u001b');

		yield wasavi.send('2G', ':\n');
		assert.eq('#1-1', '', wasavi.getLastMessage());
		assert.pos('#1-2', 1, 0);

		yield wasavi.send(':||\n');
		assert.eq('#2-1', '2\n2', wasavi.getLastMessage());
	});

	it('address current', function* () {
		yield wasavi.send('i1\n2\n3\u001b');
		yield wasavi.send('2G', ':.p\n');
		assert.eq('#1-1', '2', wasavi.getLastMessage());

		yield wasavi.send('2G', ':.+p\n');
		assert.eq('#2-1', '3', wasavi.getLastMessage());
		assert.pos('#2-2', 2, 0);
		yield wasavi.send('2G', ':.+1p\n');
		assert.eq('#2-3', '3', wasavi.getLastMessage());
		assert.pos('#2-4', 2, 0);
		yield wasavi.send('2G', ':. +1p\n');
		assert.eq('#2-5', '3', wasavi.getLastMessage());
		assert.pos('#2-6', 2, 0);

		yield wasavi.send('2G', ':.-p\n');
		assert.eq('#3-1', '1', wasavi.getLastMessage());
		assert.pos('#3-2', 0, 0);
		yield wasavi.send('2G', ':.-1p\n');
		assert.eq('#3-3', '1', wasavi.getLastMessage());
		assert.pos('#3-4', 0, 0);
		yield wasavi.send('2G', ':. -1p\n');
		assert.eq('#3-5', '1', wasavi.getLastMessage());
		assert.pos('#3-6', 0, 0);
	});

	it('address last', function* () {
		yield wasavi.send('i1\n2\n3\u001b');
		yield wasavi.send(':$p\n');
		assert.eq('#1-1', '3', wasavi.getLastMessage());
	});

	it('address integer', function* () {
		yield wasavi.send('i1\n2\n3\u001b');

		// sould be clipped
		yield wasavi.send(':0p\n');
		assert.eq('#1-1', '1', wasavi.getLastMessage());
		assert.pos('#1-2', 0, 0);

		yield wasavi.send(':1p\n');
		assert.eq('#2-1', '1', wasavi.getLastMessage());
		assert.pos('#2-2', 0, 0);

		yield wasavi.send(':2p\n');
		assert.eq('#3-1', '2', wasavi.getLastMessage());
		assert.pos('#3-2', 1, 0);

		yield wasavi.send(':3p\n');
		assert.eq('#4-1', '3', wasavi.getLastMessage());
		assert.pos('#4-2', 2, 0);

		// implicit print, sould be clipped
		yield wasavi.send(':4\n');
		assert.eq('#5-1', '', wasavi.getLastMessage());
		assert.pos('#5-2', 2, 0);

		// explicit print, should be an error
		yield wasavi.send(':4p\n');
		assert.pos('#6-2', 2, 0);
		assert.eq('#6-1', 'print: Out of range.', wasavi.getLastMessage());
	});

	it('address mark', function* () {
		yield wasavi.send('i1\n2\n3\n4\u001b');

		yield wasavi.send("1G:'ap\n");
		assert.eq('#0-1', 'Mark a is undefined.', wasavi.getLastMessage());

		yield wasavi.send(":'Ap\n");
		assert.eq('#0-2', 'Invalid mark name.', wasavi.getLastMessage());

		yield wasavi.send('4G', 'ma1G', ":'ap\n");
		assert.eq('#1-1', '4', wasavi.getLastMessage());
		assert.pos('#1-2', 3, 0);
	});

	it('address offset integer', function* () {
		yield wasavi.send('i1\n2\n3\u001b');

		yield wasavi.send('2G', ':+0p\n');
		assert.eq('#1-1', '2', wasavi.getLastMessage());

		yield wasavi.send('2G', ':+p\n');
		assert.eq('#2-1', '3', wasavi.getLastMessage());

		yield wasavi.send('2G', ':-0p\n');
		assert.eq('#3-1', '2', wasavi.getLastMessage());

		yield wasavi.send('2G', ':-p\n');
		assert.eq('#4-1', '1', wasavi.getLastMessage());
	});

	it('address search forward', function* () {
		yield wasavi.send(':set nowrapscan\n');
		yield wasavi.send('i1 foo\n2 foo\n3 foo\u001b');

		yield wasavi.send('://p\n');
		assert.eq('#0-1', 'No previous search pattern.', wasavi.getLastMessage());

		yield wasavi.send('1G', ':/foo/p\n');
		assert.eq('#1-1', '2 foo', wasavi.getLastMessage());
		assert.pos('#1-2', 1, 0);

		yield wasavi.send('://p\n');
		assert.eq('#2-1', '3 foo', wasavi.getLastMessage());
		assert.pos('#2-2', 2, 0);

		// not found on nowrapscan:
		// should be an error.
		yield wasavi.send('://p\n');
		assert.t('#3-1', wasavi.getLastMessage().length);
		assert.eq('#3-2', 'Pattern not found: foo', wasavi.getLastMessage());
		assert.pos('#3-3', 2, 0);

		// turn wrapscan on.
		// should be wrapped searching.
		yield wasavi.send(':set wrapscan\n');
		yield wasavi.send('://p\n');
		assert.eq('#4-1', '1 foo', wasavi.getLastMessage());
		assert.pos('#4-2', 0, 0);

		// not found on wrapscan:
		// should be an error.
		yield wasavi.send(':/xyz/p\n');
		assert.eq('#5-1', 'Pattern not found: xyz', wasavi.getLastMessage());
		assert.pos('#5-2', 0, 0);
	});

	it('address search backward', function* () {
		yield wasavi.send(':set nowrapscan\n');
		yield wasavi.send('i1 foo\n2 foo\n3 foo\u001b');

		yield wasavi.send(':??p\n');
		assert.eq('#0-1', 'No previous search pattern.', wasavi.getLastMessage());

		yield wasavi.send('3G', ':?foo?p\n');
		assert.eq('#1-1', '2 foo', wasavi.getLastMessage());
		assert.pos('#1-2', 1, 0);

		yield wasavi.send(':??p\n');
		assert.eq('#2-1', '1 foo', wasavi.getLastMessage());
		assert.pos('#2-2', 0, 0);

		// not found on nowrapscan:
		// should be an error.
		yield wasavi.send(':??p\n');
		assert.t('#3-1', wasavi.getLastMessage().length);
		assert.eq('#3-2', 'Pattern not found: foo', wasavi.getLastMessage());
		assert.pos('#3-3', 0, 0);

		// turn wrapscan on.
		// should be wrapped searching.
		yield wasavi.send(':set wrapscan\n');
		yield wasavi.send(':??p\n');
		assert.eq('#4-1', '3 foo', wasavi.getLastMessage());
		assert.pos('#4-2', 2, 0);

		// not found on wrapscan:
		// should be an error.
		yield wasavi.send(':?xyz?p\n');
		assert.eq('#5-1', 'Pattern not found: xyz', wasavi.getLastMessage());
		assert.pos('#5-2', 2, 0);
	});

	it('range static', function* () {
		yield wasavi.send(':set nowrapscan\n');
		yield wasavi.send('i1 foo\n2 bar\n3 foo\n4 bar\n5 foo\u001b');

		/*
		 * 1 foo *                        1 foo
		 * 2 bar                          2 bar * selected range (reversed, causes an error)
		 * 3 foo    -- :/foo/,/bar/p -->  3 foo *
		 * 4 bar                          4 bar
		 * 5 foo                          5 foo
		 */
		yield wasavi.send('1G', ':/foo/,/bar/p\n');
		assert.eq('#1-1', 'The second address is smaller than the first.', wasavi.getLastMessage());

		yield wasavi.send('1G', ':/bar/,/foo/p\n');
		assert.eq('#2-1', '2 bar\n3 foo', wasavi.getLastMessage());
	});

	it('range dynamic', function* () {
		yield wasavi.send(':set nowrapscan\n');
		yield wasavi.send('i1 foo\n2 bar\n3 foo\n4 bar\n5 foo\u001b');

		/*
		 * 1 foo *                        1 foo
		 * 2 bar                          2 bar
		 * 3 foo    -- :/foo/;/bar/p -->  3 foo * selected range
		 * 4 bar                          4 bar *
		 * 5 foo                          5 foo
		 */
		yield wasavi.send('1G', ':/foo/;/bar/p\n');
		assert.eq('#1-1', '3 foo\n4 bar', wasavi.getLastMessage());

		// if dynamic address is out of range, causes an error (even command has roundMax flag)
		yield wasavi.send('1G', ':100;?foo?\n');
		assert.eq('#2-1', 'Out of range.', wasavi.getLastMessage());
	});

	it('range too many address', function* () {
		yield wasavi.send('i1\n2\n3\u001b');
		yield wasavi.send(':1,2,3p\n');
		assert.eq('#1-1', '2\n3', wasavi.getLastMessage());
	});

	it('implicit address', function* () {
		yield wasavi.send('i1\n2\n3\u001b');
		yield wasavi.send('2G', ':||\n');
		assert.eq('#1-1', '2\n2', wasavi.getLastMessage());
	});

	it('numeric address', function* () {
		yield wasavi.send('i1\n2\n3\n4\n5\u001b');

		yield wasavi.send(':1\n');
		assert.pos('#1-1', 0, 0);

		yield wasavi.send(':+2\n');
		assert.pos('#2-1', 2, 0);

		yield wasavi.send('1G', ':/5/\n');
		assert.pos('#3-1', 4, 0);
		assert.eq('#3-2', '', wasavi.getLastMessage());

		yield wasavi.send('1G', ':/5\n');
		assert.pos('#4-1', 4, 0);
		assert.eq('#4-2', '', wasavi.getLastMessage());
	});

	it('abbreviate', function* () {
		yield wasavi.send(':abbreviate [clear]\n');

		//
		yield wasavi.send(':abbreviate\n');
		assert.eq('#1-1', 'No abbreviations are defined.', wasavi.getLastMessage());

		//
		yield wasavi.send(':abbreviat test\n');
		assert.eq('#2-1', 'No abbreviations are defined.', wasavi.getLastMessage());

		//
		yield wasavi.send(':abbrevia foo? bar\n');
		assert.eq('#3-1',
			'abbreviate: The keyword of abbreviation must end with a word character.', 
			wasavi.getLastMessage());
	});

	it('abbreviate regstering', function* () {
		yield wasavi.send(':abbreviate [clear]\n');

		//
		yield wasavi.send(':abbrevi foo bar\n');
		assert.t('#4-1', wasavi.getLastMessage() == '');
		yield wasavi.send(':abbre\n');
		assert.eq('#4-2', [
			'*** abbreviations ***',
			'        LHS    RHS',
			'        ---    ---',
			'        foo    bar'
		].join('\n'), wasavi.getLastMessage());

		//
		yield wasavi.send(':abbr bar BAZ\n');
		yield wasavi.send(':abb  baz B A Z\n');

		yield wasavi.send(':abbr foo\n');
		assert.eq('#5-1', [
			'*** abbreviations ***',
			'        LHS    RHS',
			'        ---    ---',
			'        foo    bar'
		].join('\n'), wasavi.getLastMessage());

		yield wasavi.send(':abbr\n');
		assert.eq('#5-2', [
			'*** abbreviations ***',
			'        LHS    RHS',
			'        ---    ---',
			'        bar    BAZ',
			'        baz    B A Z',
			'        foo    bar'
		].join('\n'), wasavi.getLastMessage());

		//
		yield wasavi.send(':abb [clear]\n');
		yield wasavi.send(':ab\n');
		assert.eq('#6-1', 'No abbreviations are defined.', wasavi.getLastMessage());
	});

	it('abbreviate expand remapped', function* () {
		yield wasavi.send(':ab [clear]\n');

		yield wasavi.send(':ab foo FOO\n');
		yield wasavi.send('ccfoo bar foo\u001b');
		assert.value('#1-1', 'FOO bar FOO');

		// space
		yield wasavi.send(':ab foo FOO  BAR\n');
		yield wasavi.send('ccfoo bar foo\u001b');
		assert.value('#2-1', 'FOO  BAR bar FOO  BAR');

		// newline
		yield wasavi.send(':ab foo FOO<newline>BAR\n');
		yield wasavi.send('ccfoo bar foo\u001b');
		assert.value('#3-1', 'FOO\nBAR bar FOO\nBAR');

		yield wasavi.send(':ab [clear]\n');
	});

	it('copy bad dest', function* () {
		yield wasavi.send('i1\n2\n3\n4\n5\u001b');

		/*
		 * should be an error if destination address does not specified
		 */
		yield wasavi.send(':1copy\n');
		assert.eq('#1-1', 'copy: Invalid argument.', wasavi.getLastMessage());
	});

	it('copy zero source', function* () {
		yield wasavi.send('i1\n2\n3\u001b');

		yield wasavi.send(':0copy2\n');
		assert.value('#1-1', '1\n2\n1\n3');
	});

	it('copy to lower', function* () {
		yield wasavi.send('i1\n2\n3\n4\n5\u001b');
		/*
		 * copy to lower line
		 * ---------
		 *  s: source range
		 *  d: destination position
		 *  *: copied line
		 *
		 * 1 d     1 d
		 * 2 s     2 *
		 * 3 s --> 3 * final cursor line
		 * 4       2 s
		 * 5       3 s
		 *         4
		 *         5
		 */
		yield wasavi.send(':2,3cop1\n');
		assert.value('#1-1', '1\n2\n3\n2\n3\n4\n5');
		assert.pos('#1-2', 2, 0);
		yield wasavi.send('u');
		assert.value('#1-3', '1\n2\n3\n4\n5');
		yield wasavi.send('\u0012');
		assert.value('#1-4', '1\n2\n3\n2\n3\n4\n5');
	});

	it('copy to lower special', function* () {
		yield wasavi.send('i1\n2\n3\n4\n5\u001b');
		/*
		 * copy to lower line, special case: before the top of buffer
		 * ---------
		 *   d       d
		 * 1       2 *
		 * 2 s     3 * final cursor line
		 * 3 s --> 1
		 * 4       2 s
		 * 5       3 s
		 *         4
		 *         5
		 */
		yield wasavi.send(':2,3co0\n');
		assert.value('#1-1', '2\n3\n1\n2\n3\n4\n5');
		assert.pos('#1-2', 1, 0);
		yield wasavi.send('u');
		assert.value('#1-3', '1\n2\n3\n4\n5');
		yield wasavi.send('\u0012');
		assert.value('#1-4', '2\n3\n1\n2\n3\n4\n5');
	});

	it('copy to inside range', function* () {
		yield wasavi.send('i1\n2\n3\n4\n5\u001b');
		/*
		 * copy to inside range
		 * --------
		 *
		 * 1         1
		 * 2 s d     2 s d
		 * 3 s   --> 2 *
		 * 4         3 * final cursor line
		 * 5         3 s
		 *           4
		 *           5
		 */
		yield wasavi.send(':2,3co2\n');
		assert.value('#1-1', '1\n2\n2\n3\n3\n4\n5');
		assert.pos('#1-2', 3, 0);
		yield wasavi.send('u');
		assert.value('#1-3', '1\n2\n3\n4\n5');
		yield wasavi.send('\u0012');
		assert.value('#1-4', '1\n2\n2\n3\n3\n4\n5');
	});

	it('copy to upper', function* () {
		yield wasavi.send('i1\n2\n3\n4\n5\u001b');
		/*
		 * copy to upper line
		 * --------
		 *
		 * 1       1
		 * 2 s     2 s
		 * 3 s --> 3 s
		 * 4 d     4 d
		 * 5       2 *
		 *         3 * final cursor line
		 *         5
		 */
		yield wasavi.send(':2,3co4\n');
		assert.value('#1-1', '1\n2\n3\n4\n2\n3\n5');
		assert.pos('#1-2', 5, 0);
		yield wasavi.send('u');
		assert.value('#1-3', '1\n2\n3\n4\n5');
		yield wasavi.send('\u0012');
		assert.value('#1-4', '1\n2\n3\n4\n2\n3\n5');
	});

	it('copy to upper special', function* () {
		yield wasavi.send('i1\n2\n3\n4\n5\u001b');
		/*
		 * copy to upper line, special case: beyond the tail of buffer
		 * --------
		 *
		 * 1       1
		 * 2 s     2 s
		 * 3 s --> 3 s
		 * 4       4
		 * 5 d     5 d
		 *         2 *
		 *         3 * final cursor line
		 */
		yield wasavi.send(':2,3co5\n');
		assert.value('#1-1', '1\n2\n3\n4\n5\n2\n3');
		assert.pos('#1-2', 6, 0);
		yield wasavi.send('u');
		assert.value('#1-3', '1\n2\n3\n4\n5');
		yield wasavi.send('\u0012');
		assert.value('#1-4', '1\n2\n3\n4\n5\n2\n3');
	});

	it('copy from implicit position', function* () {
		yield wasavi.send('ifoo\n\tbar\u001b');

		yield wasavi.send(':-,t.\n');
		assert.value('#1-1', 'foo\n\tbar\nfoo\n\tbar');
		assert.pos('#1-2', 3, 1);

		yield wasavi.send('u');
		assert.value('#2-1', 'foo\n\tbar');

		yield wasavi.send('\u0012');
		assert.value('#3-1', 'foo\n\tbar\nfoo\n\tbar');
	});

	it('delete', function* () {
		yield wasavi.send('i1\n2\n3\n4\n5\u001b');

		yield wasavi.send(':2,3delete\n');
		assert.value('#1-1', '1\n4\n5');
		assert.pos('#1-2', 1, 0);
		assert.eq('#1-3', '2\n3\n', wasavi.getRegister('"'));

		yield wasavi.send('u');
		assert.value('#2-1', '1\n2\n3\n4\n5');

		yield wasavi.send('\u0012');
		assert.value('#3-1', '1\n4\n5');
	});

	it('delete zero source', function* () {
		yield wasavi.send('i1\n2\n3\n4\n5\u001b');

		yield wasavi.send(':0,2delete\n');
		assert.value('#1-1', '3\n4\n5');
		assert.pos('#1-2', 0, 0);
		assert.eq('#1-3', '1\n2\n', wasavi.getRegister('"'));

		yield wasavi.send('u');
		assert.value('#2-1', '1\n2\n3\n4\n5');

		yield wasavi.send('\u0012');
		assert.value('#3-1', '3\n4\n5');
	});

	it('delete tail', function* () {
		yield wasavi.send('i1\n2\n3\n4\n5\u001b');

		yield wasavi.send(':4,5delet a\n');
		assert.value('#1-1', '1\n2\n3');
		assert.pos('#1-2', 2, 0);
		assert.eq('#1-3', '4\n5\n', wasavi.getRegister('a'));

		yield wasavi.send('u');
		assert.value('#2-1', '1\n2\n3\n4\n5');

		yield wasavi.send('\u0012');
		assert.value('#3-1', '1\n2\n3');
	});

	it('delete by count', function* () {
		yield wasavi.send('i1\n2\n3\n4\n5\u001b');

		yield wasavi.send(':2dele3\n');
		assert.value('#1-1', '1\n5');
		assert.pos('#1-2', 1, 0);
		assert.eq('#1-3', '2\n3\n4\n', wasavi.getRegister('"'));

		yield wasavi.send('u');
		assert.value('#2-1', '1\n2\n3\n4\n5');

		yield wasavi.send('\u0012');
		assert.value('#3-1', '1\n5');
	});

	it('delete by count with range', function* () {
		/*
		 * if both range and count are specified, first range should be discarded:
		 *
		 * 1                        1
		 * 2 first                  2 first
		 * 3                        3
		 * 4 second  -- :2,4d2 -->  6
		 * 5                        7
		 * 6
		 * 7
		 *
		 * or in other words, :2,4d2 == 4,5d
		 */
		yield wasavi.send('i1\n2\n3\n4\n5\n6\n7\u001b');

		yield wasavi.send(':2, 4d2\n');
		assert.value('#1-1', '1\n2\n3\n6\n7');
		assert.pos('#1-2', 3, 0);
		assert.eq('#1-3', '4\n5\n', wasavi.getRegister('"'));

		yield wasavi.send('u');
		assert.value('#2-1', '1\n2\n3\n4\n5\n6\n7');

		yield wasavi.send('\u0012');
		assert.value('#3-1', '1\n2\n3\n6\n7');
	});

	it('edit reload', function* () {
		yield wasavi.send('ifoo\u001b');

		yield wasavi.send(':edit\n');
		assert.eq('#1-1',
				'edit: File is modified; write or use "!" to override.',
				wasavi.getLastMessage());
		assert.value('#1-2', 'foo');

		yield wasavi.send(':e!\n');
		assert.eq('#1-3',
				yield driver.findElement(By.id('t2')).getAttribute('value'),
				wasavi.getValue());
	});

	it('global', function* () {
		yield wasavi.send('i1 x\n2 y\n3 z\n4 x\n5 y\n6 z\u001b');

		// if range does not specified, all of text should be processed.
		yield wasavi.send(':g/\\d/p\n');
		assert.eq('#1-1', '1 x\n2 y\n3 z\n4 x\n5 y\n6 z', wasavi.getLastMessage());
		assert.pos('#1-2', 5, 0);
	});

	it('global ranged', function* () {
		yield wasavi.send('i1 x\n2 y\n3 z\n4 x\n5 y\n6 z\u001b');

		// ranged
		yield wasavi.send(':3,5g/x/p\n');
		assert.eq('#1-1', '4 x', wasavi.getLastMessage());
		assert.pos('#1-2', 3, 0);
	});

	it('global zero match', function* () {
		yield wasavi.send('i1 x\n2 y\n3 z\n4 x\n5 y\n6 z\u001b');

		// zero match regexp
		yield wasavi.send(':g/^/p\n');
		assert.eq('#1-1', '1 x\n2 y\n3 z\n4 x\n5 y\n6 z', wasavi.getLastMessage());
		assert.pos('#1-2', 5, 0);
	});

	it('global with empty command', function* () {
		yield wasavi.send('i1\n2\n3\u001b');
		yield wasavi.send(':g/./\n');
		assert.value('#1-1', '1\n2\n3');
		assert.eq('#1-2', '', wasavi.getLastMessage());
		assert.pos('#1-3', 2, 0);
	});

	it('global delete', function* () {
		yield wasavi.send('i1 x\n2 y\n3 z\n4 x\n5 y\n6 z\u001b');

		/* init  loop1  loop2
		 * 1 x   2 y *  2 y
		 * 2 y   3 z    3 z
		 * 3 z   4 x    5 y *
		 * 4 x   5 y    6 z
		 * 5 y   6 z
		 * 6 z
		 *
		 * *: current cursor line
		 */
		yield wasavi.send(':g/x/d\n');
		assert.value('#1-1', '2 y\n3 z\n5 y\n6 z');
		assert.pos('#1-2', 2, 0);

		yield wasavi.send('u');
		assert.value('#2-1', '1 x\n2 y\n3 z\n4 x\n5 y\n6 z');

		yield wasavi.send('\u0012');
		assert.value('#3-1', '2 y\n3 z\n5 y\n6 z');
	});

	it('global delete special', function* () {
		yield wasavi.send('i1\n2\n3\n4\n5\n6\u001b');

		/*
		 * :g/\d/+1d
		 *
		 * 1     1*     1      1
		 * 2     3      3*     3
		 * 3 --> 4  --> 5  --> 5*
		 * 4     5      6
		 * 5     6
		 * 6
		 *
		 * *: current corsor line
		 */

		yield wasavi.send(':g/\\d/+1d\n');
		assert.value('#1-1', '1\n3\n5');
		assert.pos('#1-2', 2, 0);

		yield wasavi.send('u');
		assert.value('#2-1', '1\n2\n3\n4\n5\n6');

		yield wasavi.send('\u0012');
		assert.value('#3-1', '1\n3\n5');
	});

	it('global with nest denied command', function* () {
		yield wasavi.send('i1\n2\n3\u001b');

		yield wasavi.send(':g/./g/./d\n');
		assert.eq('#1-1', 'global: Cannot use the global or v command recursively.', wasavi.getLastMessage());
		assert.value('#1-2', '1\n2\n3');
	});

	it('join with count', function* () {
		yield wasavi.send('ifirst\nsecond\nthird\nfourth\u001b');

		/*
		 * zero count is error.
		 */
		yield wasavi.send('1G', ':join0\n');
		assert.eq('#0-1', 'join: Count may not be zero.', wasavi.getLastMessage());
		assert.value('#0-2', 'first\nsecond\nthird\nfourth');

		/*
		 * no address was specified:
		 *
		 * first  * :j2       first second
		 * second        -->  third
		 * third              fourth
		 * fourth
		 */
		yield wasavi.send('1G', ':joi!2\n');
		assert.value('#1-1', 'firstsecond\nthird\nfourth');
		assert.pos('#1-2', 0, 0);
		yield wasavi.send('u');
		assert.value('#1-3', 'first\nsecond\nthird\nfourth');

		/*
		 * one address was specified:
		 *
		 * first               first
		 * second * :2j2  -->  second third
		 * third               fourth
		 * fourth
		 */
		yield wasavi.send(':2jo 2\n');
		assert.value('#2-1', 'first\nsecond third\nfourth');
		assert.pos('#2-2', 1, 0);
		yield wasavi.send('u');
		assert.value('#2-3', 'first\nsecond\nthird\nfourth');

		/*
		 * two addresses were specified:
		 *
		 * first  * :1,2j2       first second third
		 * second           -->  fourth
		 * third
		 * fourth
		 */
		yield wasavi.send(':1,2j2\n');
		assert.value('#3-1', 'first second third\nfourth');
		assert.pos('#3-2', 0, 0);
		yield wasavi.send('u');
		assert.value('#3-3', 'first\nsecond\nthird\nfourth');
	});

	it('join with no count', function* () {
		yield wasavi.send('ifirst\nsecond\nthird\nfourth\u001b');

		/*
		 * no address was specified:
		 *
		 * first  * :j       first second
		 * second       -->  third
		 * third             fourth
		 * fourth
		 */
		yield wasavi.send('1G', ':j\n');
		assert.value('#1-1', 'first second\nthird\nfourth');
		assert.pos('#1-2', 0, 0);
		yield wasavi.send('u');
		assert.value('#1-3', 'first\nsecond\nthird\nfourth');

		/*
		 * one address was specified:
		 *
		 * first              first
		 * second * :2j  -->  second third
		 * third              fourth
		 * fourth
		 */
		yield wasavi.send(':2j!\n');
		assert.value('#2-1', 'first\nsecondthird\nfourth');
		assert.pos('#2-2', 1, 0);
		yield wasavi.send('u');
		assert.value('#2-3', 'first\nsecond\nthird\nfourth');

		/*
		 * two addresses were specified:
		 *
		 * first  *              first second third
		 * second    :1,3j  -->  fourth
		 * third
		 * fourth
		 */
		yield wasavi.send(':1,3j\n');
		assert.value('#3-1', 'first second third\nfourth');
		assert.pos('#3-2', 0, 0);
		yield wasavi.send('u');
		assert.value('#3-3', 'first\nsecond\nthird\nfourth');
	});

	it('mark', function* () {
		yield wasavi.send('i1\n2\n3\u001b');

		yield wasavi.send(':2G\n:k\n');
		assert.eq('#1-1', 'k: Missing required argument.', wasavi.getLastMessage());

		yield wasavi.send(':3G\n:ka\n');
		yield wasavi.send(":1\n:'a\n");
		assert.pos('#2-1', 2, 0);
	});

	it('map', function* () {
		yield wasavi.send(':map\n');
		assert.eq('#1-1', [
			'No rules for NORMAL map are defined.',
			' ',
			'No rules for BOUND map are defined.'
		].join('\n'), wasavi.getLastMessage());

		yield wasavi.send(':map Q 1G\n');
		yield wasavi.send(':map XQ G\n');
		yield wasavi.send(':map\n');
		assert.eq('#2-1', [
			'*** NORMAL map ***',
			'Q \t1G',
			'XQ\tG'
		].join('\n'), wasavi.getLastMessage());

		yield wasavi.send(':map X\n');
		assert.eq('#3-1', [
			'*** NORMAL map ***',
			'XQ\tG'
		].join('\n'), wasavi.getLastMessage());

		yield wasavi.send(':map [clear]\n');
		yield wasavi.send(':map\n');
		assert.eq('#4-1', [
			'No rules for NORMAL map are defined.',
			' ',
			'No rules for BOUND map are defined.'
		].join('\n'), wasavi.getLastMessage());
	});

	it('map special key', function* () {
		yield wasavi.send(':map [clear]\n');
		yield wasavi.send(':map Q <down><down>$\n');

		yield wasavi.send('i1\n2\n3 here!\n4\u001bgg');
		assert.pos('#1-1', 0, 0);
		yield wasavi.send('Q');
		assert.pos('#1-2', 2, 6);

		yield wasavi.send(':map <down> <up>\nG');
		yield wasavi.send(Key.ARROW_DOWN);
		assert.pos('#2-1', 2, 0);
	});

	it('map unique', function* () {
		yield wasavi.send(':map [clear]\n');
		yield wasavi.send(':map Q G\ni1\n2\n3\u001bgg');
		assert.pos('#1-1', 0, 0);
		yield wasavi.send('Q');
		assert.pos('#2-1', 2, 0);

		yield wasavi.send(':map <f1> <esc>if1\u0016\u0016 key\u0016\u0016 pressed<esc>\n');
		yield wasavi.send(Key.F1);
		assert.value('#3-1', '1\n2\nf1 key pressed3');
	});

	it('map ambiguous', function* () {
		yield wasavi.send(':map [clear]\n');
		yield wasavi.send(':map Q 1G\n');
		yield wasavi.send(':map QQ G\n');
		yield wasavi.send('i1\n2\n3\n4\n5\u001b');

		// ambiguous, timed out
		yield wasavi.send('Q');
		assert.pos('#1-1', 0, 0);

		// ambiguous, not timed out
		yield wasavi.send('G','Qj');
		assert.pos('#2-1', 1, 0);

		//
		yield wasavi.send('QQ');
		assert.pos('#3-1', 4, 0);

		//
		yield wasavi.send('QQk');
		assert.pos('#4-1', 3, 0);
	});

	// https://github.com/akahuku/wasavi/issues/55
	it('map ambiguous issue55', function* () {
		yield wasavi.send(':map [clear]\n');
		yield wasavi.send(':map! ,zz <enter>bb, cc<enter>\n');
		yield wasavi.send('i,zz\u001b');

		assert.value('#1-1', '\nbb, cc\n');
	});

	// https://github.com/akahuku/wasavi/issues/79
	it('map control shortcut', function* () {
		yield wasavi.send(':map [clear]\n');
		yield wasavi.send(':map! <C-c> <esc>\n');
		yield wasavi.send(':map! <C-b> <tab>\n');
		yield wasavi.send('ifoo', Key.chord(Key.CONTROL, 'b'), 'bar', Key.chord(Key.CONTROL, 'c'));

		assert.value('#1-1', 'foo\tbar');
	});

	it('final map', function* () {
		yield wasavi.send(':map [clear]\n');
		yield wasavi.send(':map [final] j jj\n');
		yield wasavi.send('i1\n2\n3\n4\n5\u001b');

		yield wasavi.send('ggj');
		assert.pos('#1-1', 2, 0);
	});

	it('replace mapped char', function* () {
		yield wasavi.send(':map [clear]\n');
		yield wasavi.send(':map a bc\n');
		yield wasavi.send('ifoobar\u001b');

		yield wasavi.send('0ra');
		assert.value('#1-1', 'aoobar');
	});

	it('edit map ambiguous', function* () {
		yield wasavi.send(':map [clear]\n');
		yield wasavi.send(':map! jk <esc>\n');
		yield wasavi.send(':map! kj <esc>\n');
		yield wasavi.send('ajoking\u001b');

		assert.value('#1-1', 'joking');
	});

	it('nested map', function* () {
		yield wasavi.send(':map [clear]\n');
		yield wasavi.send(':map Q G\n');
		yield wasavi.send(':map q Q\n');
		yield wasavi.send('i1\n2\n3\n4\n5\u001b');

		yield wasavi.send('ggq');
		assert.pos('#1-1', 4, 0);

		yield wasavi.send(':map [noremap] q Q\n');
		yield wasavi.send('ggq');
		assert.pos('#2-1', 0, 0);
	});

	it('edit map unique', function* () {
		yield wasavi.send(':map! [clear]\n');
		yield wasavi.send(':map! Q quick\u0016\u0016 brown\u0016\u0016 fox\n');

		yield wasavi.send('iQ!\u001b');
		assert.value('#1-1', 'quick brown fox!');
	});

	it('map alt', function* () {
		yield wasavi.send(':map [clear]\n');
		yield wasavi.send(':map <A-s> G\n');
		yield wasavi.send('i1\n2\n3\n4\n5\u001bgg', Key.chord(Key.ALT, 's'));
		assert.pos('#1-1', 4, 0);
	});

	it('mark2', function* () {
		yield wasavi.send('i1\n2\n3\u001b');

		yield wasavi.send(':2G\n:mark\n');
		assert.eq('#1-1', 'mark: Missing required argument.', wasavi.getLastMessage());

		yield wasavi.send(':3G\n:mark a\n');
		yield wasavi.send(":1\n:'a\n");
		assert.pos('#2-1', 2, 0);
	});

	it('marks', function* () {
		yield wasavi.send('i1 first\n2 second\n3 third\u001b');

		yield wasavi.send(':marks\n');
		assert.eq('#1-1', [
			"*** marks ***",
			"mark  line   col   text",
			"====  =====  ====  ====",
			" ^        3     6  3 third"
		].join('\n'), wasavi.getLastMessage());

		yield wasavi.send('1G', '1|:mark a\n');
		yield wasavi.send(':marks\n');
		assert.eq('#2-1', [
			"*** marks ***",
			"mark  line   col   text",
			"====  =====  ====  ====",
			" ^        3     6  3 third",
			" '        3     6  3 third",
			" a        1     0  1 first"
		].join('\n'), wasavi.getLastMessage());

		yield wasavi.send('2G', '2|:mark b\n');
		yield wasavi.send(':marks\n');
		assert.eq('#3-1', [
			"*** marks ***",
			"mark  line   col   text",
			"====  =====  ====  ====",
			" ^        3     6  3 third",
			" '        1     0  1 first",
			" a        1     0  1 first",
			" b        2     0  2 second"
		].join('\n'), wasavi.getLastMessage());
	});

	it('move', function* () {
		yield wasavi.send('i1\n2\n3\n4\n5\u001b');

		/*
		 * test #1: move to lower
		 *
		 * 1 *       1
		 * 2         3
		 * 3 +  -->  4
		 * 4 +       5.
		 * 5 +       2
		 */
		yield wasavi.send(':3,5move1\n');
		assert.value('#1-1', '1\n3\n4\n5\n2');
		assert.pos('#1-2', 3, 0);
		yield wasavi.send('u');
		assert.value('#1-3', '1\n2\n3\n4\n5');
		yield wasavi.send('\u0012');
		assert.value('#1-4', '1\n3\n4\n5\n2');
		yield wasavi.send('u');
		assert.value('#1-5', '1\n2\n3\n4\n5');

		/*
		 * test #2: move to top
		 *   *
		 * 1         3
		 * 2         4
		 * 3 +  -->  5.
		 * 4 +       1
		 * 5 +       2
		 */
		yield wasavi.send(':3,5move0\n');
		assert.value('#2-1', '3\n4\n5\n1\n2');
		assert.pos('#2-2', 2, 0);
		yield wasavi.send('u');
		assert.value('#2-3', '1\n2\n3\n4\n5');
		yield wasavi.send('\u0012');
		assert.value('#2-4', '3\n4\n5\n1\n2');
		yield wasavi.send('u');
		assert.value('#2-5', '1\n2\n3\n4\n5');

		/*
		 * test #3: move to inside source
		 * (espesially, destination address 2 and 5 are allowed, and no changes is happen.)
		 *
		 * 1
		 * 2  !
		 * 3 +*
		 * 4 +*
		 * 5 +!
		 */
		var rows = [2, 3, 4, 5];
		for (var i = 0; i < rows.length; i++) {
			var dest = rows[i];
			yield wasavi.send(':3,5mov' + dest + '\n');
			if (dest == 2 || dest == 5) {
				assert.value('#3-1(' + dest + ')', '1\n2\n3\n4\n5');
				yield wasavi.send('u');
				assert.value('#3-2(' + dest + ')', '1\n2\n3\n4\n5');
			}
			else {
				assert.eq('#3-3(' + dest + ')',
					'move: Destination is in inside source.', wasavi.getLastMessage());
			}
		}
		assert.value('#3-4', '1\n2\n3\n4\n5');

		/*
		 * test #4: move to upper
		 *
		 * 1 +       4 *      4
		 * 2 +       5        1
		 * 3 +  -->      -->  2
		 * 4 *                3.
		 * 5                  5
		 */
		yield wasavi.send(':1,3move4\n');
		assert.value('#4-1', '4\n1\n2\n3\n5');
		assert.pos('#4-2', 3, 0);
		yield wasavi.send('u');
		assert.value('#4-3', '1\n2\n3\n4\n5');
		yield wasavi.send('\u0012');
		assert.value('#4-4', '4\n1\n2\n3\n5');
		yield wasavi.send('u');
		assert.value('#4-5', '1\n2\n3\n4\n5');

		/*
		 * test #5: move to tail
		 *
		 * 1 +       4        4
		 * 2 +       5 *      5
		 * 3 +  -->      -->  1
		 * 4                  2
		 * 5 *                3.
		 */
		yield wasavi.send(':1,3move5\n');
		assert.value('#5-1', '4\n5\n1\n2\n3');
		assert.pos('#5-2', 4, 0);
		yield wasavi.send('u');
		assert.value('#5-3', '1\n2\n3\n4\n5');
		yield wasavi.send('\u0012');
		assert.value('#5-4', '4\n5\n1\n2\n3');
		yield wasavi.send('u');
		assert.value('#5-5', '1\n2\n3\n4\n5');
	});

	it('print', function* () {
		yield wasavi.send('i1\t$\u0016\u0010\\\n2\n3\n4\n5\u001b');
		assert.value('#0-1',
			'1\t$\u0010\\\n' +
			'2\n' +
			'3\n' +
			'4\n' +
			'5');

		yield wasavi.send(':print\n');
		assert.eq('#1-1', '5', wasavi.getLastMessage());

		yield wasavi.send(':1,2print\n');
		assert.eq('#2-1', '1\t$\u0010\\\n2', wasavi.getLastMessage());

		yield wasavi.send(':2\n');
		yield wasavi.send(':print3\n');
		assert.eq('#3-1', '2\n3\n4', wasavi.getLastMessage());

		yield wasavi.send(':1,3print2\n');
		assert.eq('#4-1', '3\n4', wasavi.getLastMessage());

		/*
		 * list command conversion:
		 *
		 * native       list
		 * ------  -->  ----
		 * 1            1
		 * <u+0009>     <u+0009>
		 * $            \$
		 * <u+0010>     \020
		 * \            \\
		 * <eol>        $
		 */
		yield wasavi.send(':1p l\n');
		assert.eq('#5-1', '1\t\\$\\020\\\\$', wasavi.getLastMessage());

		/*
		 * number command
		 *
		 * number format: sprintf('%6d  ', line_number)
		 */
		yield wasavi.send(':1p #\n');
		assert.eq('#6-1', '     1  1\t$\u0010\\', wasavi.getLastMessage());

		/*
		 * number + line command
		 */
		yield wasavi.send(':1p #l\n');
		assert.eq('#7-1', '     1  1\t\\$\\020\\\\$', wasavi.getLastMessage());
		yield wasavi.send(':1p #lp\n');
		assert.eq('#7-2', '     1  1\t\\$\\020\\\\$', wasavi.getLastMessage());
	});

	it('put', function* () {
		yield wasavi.send('ifoo\nbar\u001b');

		yield wasavi.send('1G', '1|yy');
		yield wasavi.send(':put\n');
		assert.value('#1-1', 'foo\nfoo\nbar');
		assert.pos('#1-2', 1, 0);

		yield wasavi.send('1G', '1|yw');
		yield wasavi.send(':put\n');
		assert.value('#2-1', 'foo\nfoo\nfoo\nbar');
		assert.pos('#2-2', 1, 0);

		yield wasavi.send('G', '"ayy');
		yield wasavi.send(':2pu a\n');
		assert.value('#3-1', 'foo\nfoo\nbar\nfoo\nbar');
		assert.pos('#3-2', 2, 0);

		yield wasavi.send(':pu z\n');
		assert.value('#4-1', 'foo\nfoo\nbar\nfoo\nbar');
		assert.pos('#4-2', 2, 0);
		assert.eq('#4-3', 'put: Register z is empty.', wasavi.getLastMessage());

		yield wasavi.setClipboardText('clipboard text');
		yield wasavi.send('G', ':0pu *\n');
		assert.value('#5-1', 'clipboard text\nfoo\nfoo\nbar\nfoo\nbar');
		assert.pos('#5-2', 0, 0);

		yield wasavi.send('gg"1y2y');
		yield wasavi.send(':0pu 1\n');
		assert.value('#6-1',
			'clipboard text\n' +
			'foo\n' +
			'clipboard text\n' +
			'foo\n' +
			'foo\n' +
			'bar\n' +
			'foo\n' +
			'bar');
		assert.pos('#6-2', 0, 0);
	});

	it('quit', function* () {
		yield wasavi.sendNoWait(':quit\n');

		var vanished = yield wasavi.waitTerminate();
		assert.t('wasaviFrame must not be exist.', vanished);
	});

	it('quit force', function* () {
		yield wasavi.send('ifoo\u001b');

		yield wasavi.send(':qui\n');
		var wasaviFrame = yield driver.findElement(By.id('wasavi_frame'));
		assert.t(wasaviFrame);
		assert.eq('#1-1', 'quit: The text has been modified; use :quit! to discard any changes.', wasavi.getLastMessage());

		yield wasavi.sendNoWait(':qu!\n');
		var vanished = yield wasavi.waitTerminate();
		assert.t('wasaviFrame must not be exist.', vanished);
	});

	it('undo and redo', function* () {
		yield wasavi.send(':undo\n');
		assert.eq('#1-1', 'undo: No undo item.', wasavi.getLastMessage());

		yield wasavi.send('i1\n2\n3\u001b');
		assert.value('#2-1', '1\n2\n3');

		yield wasavi.send(':undo\n');
		assert.value('#3-1', '');

		yield wasavi.send(':redo\n');
		assert.value('#4-1', '1\n2\n3');

		yield wasavi.send(':redo\n');
		assert.eq('#5-1', 'redo: No redo item.', wasavi.getLastMessage());
	});

	it('subst', function* () {
		yield wasavi.send('ia a\nb b b\n\nc\nd\u001b');

		yield wasavi.send('1G', ':s/a/A\n');
		assert.value('#1-1', 'A a\nb b b\n\nc\nd');
		yield wasavi.send('u');
		assert.value('#1-2', 'a a\nb b b\n\nc\nd');
		yield wasavi.send('\u0012');
		assert.value('#1-3', 'A a\nb b b\n\nc\nd');
		yield wasavi.send('u');
		assert.value('#1-4', 'a a\nb b b\n\nc\nd');

		yield wasavi.send('2G', ':s/b/B/g\n');
		assert.value('#2-1', 'a a\nB B B\n\nc\nd');
		yield wasavi.send('u');
		assert.value('#2-2', 'a a\nb b b\n\nc\nd');
		yield wasavi.send('\u0012');
		assert.value('#2-3', 'a a\nB B B\n\nc\nd');
		yield wasavi.send('u');
		assert.value('#2-4', 'a a\nb b b\n\nc\nd');

		/*
		 * a a   +        a a
		 * b b b +        b b b
		 *       ++  -->
		 * c      +       ?
		 * d
		 */
		yield wasavi.send(':1,3s/[a-d]/?/g2\n');
		assert.value('#4-1', 'a a\nb b b\n\n?\nd');
		yield wasavi.send('u');
		assert.value('#4-2', 'a a\nb b b\n\nc\nd');
		yield wasavi.send('\u0012');
		assert.value('#4-3', 'a a\nb b b\n\n?\nd');
		yield wasavi.send('u');
		assert.value('#4-4', 'a a\nb b b\n\nc\nd');
	});

	it('subst2', function* () {
		yield wasavi.send('iaaaa\nbbbb\u001b');
		yield wasavi.send('1G', ':%s/a/b/g\n');

		assert.value('bbbb\nbbbb');
	});

	it('subst3', function* () {
		yield wasavi.send('i\ta\n\tb\u001b');
		yield wasavi.send('1G', ':%s/^\\t\\+/!/g\n');

		assert.value('!a\n!b');
	});

	it('subst4', function* () {
		yield wasavi.send(':set ai\n');
		yield wasavi.send('i\t\tfoo\nbar\nbaz\u001b');
		yield wasavi.send(':%s/^\\t//g\n');

		assert.value('\tfoo\n\tbar\n\tbaz');
	});

	it('subst pattern omit', function* () {
		yield wasavi.send(':sushi\n');
		yield wasavi.send('i1\n2\n3\u001b');

		yield wasavi.send(':s//foo\n');
		assert.eq('#1-1', 's: No previous search pattern.', wasavi.getLastMessage());

		yield wasavi.send('gg', '/\\d\n');
		assert.pos('#2-1', 1, 0);
		yield wasavi.send(':s//foo\n');
		assert.value('#2-2', '1\nfoo\n3');
	});

	it('subst repl omit', function* () {
		yield wasavi.send(':sushi\n');
		yield wasavi.send('i1\n2\n3\u001b');

		yield wasavi.send(':s/\\d//\n');
		assert.value('#1-1', '1\n2\n');
	});

	it('subst omit all', function* () {
		yield wasavi.send(':sushi\n');
		yield wasavi.send('i1\n2\n3\u001b');

		yield wasavi.send(':s//\n');
		assert.eq('#1-1', 's: No previous substitution.', wasavi.getLastMessage());

		yield wasavi.send(':s/\\d/foo\n');
		assert.value('#2-1', '1\n2\nfoo');
		yield wasavi.send(':1\n');
		yield wasavi.send(':s//\n');
		assert.value('#2-2', 'foo\n2\nfoo');
	});

	it('subst last replacement', function* () {
		yield wasavi.send(':sushi\n');
		yield wasavi.send('i1\n2\n3\u001b');

		yield wasavi.send(':s/\\d/%\n');
		assert.eq('#1-1', 's: No previous substitution.', wasavi.getLastMessage());

		yield wasavi.send(':s/\\d/!\n');
		assert.value('#2-1', '1\n2\n!');
		yield wasavi.send(':1\n');
		yield wasavi.send(':s/\\d/%\n');
		assert.value('#2-2', '!\n2\n!');
	});

	it('subst tilde replacement', function* () {
		yield wasavi.send(':sushi\n');
		yield wasavi.send('i1\n2\n3\u001b');

		yield wasavi.send(':s/\\d/~\n');
		assert.eq('#1-1', 's: No previous substitution.', wasavi.getLastMessage());

		yield wasavi.send(':s/\\d/$\n');
		assert.value('#2-1', '1\n2\n$');
		yield wasavi.send(':1\n');
		yield wasavi.send(':s/\\d/~!!\n');
		assert.value('#2-2', '$!!\n2\n$');

		yield wasavi.send(':2\n');
		yield wasavi.send(':s/\\d/%\n');
		/*
		 * different from vim.
		 * vim's result is $!!\n$!!!!\n$
		 */
		assert.value('#3-1', '$!!\n$!!\n$');
	});

	it('subst queried', function* () {
		yield wasavi.send('ifirst\nsecond\nthird\u001b');

		yield wasavi.send('1G', ':%s/i/I/gc\n', 'n', 'y');
		assert.eq('#1-1', '1 substitution on 3 lines.', wasavi.getLastMessage());
		assert.value('#1-2', 'first\nsecond\nthIrd');
		assert.pos('#1-3', 2, 0);

		yield wasavi.send('u');
		assert.value('#2-1', 'first\nsecond\nthird');
	});

	it('subst queried give up', function* () {
		yield wasavi.send('ifirst\nsecond\nthird\u001b');

		yield wasavi.send('1G', ':%s/i/I/gc\n', 'y', 'q');
		assert.eq('#1-1', '1 substitution on 3 lines.', wasavi.getLastMessage());
		assert.value('#1-2', 'fIrst\nsecond\nthird');
		assert.pos('#1-3', 2, 2);

		yield wasavi.send('u');
		assert.value('#2-1', 'first\nsecond\nthird');
	});

	it('subst queried all', function* () {
		yield wasavi.send(
			'i' +
			'first\n' +
			'second\n' +
			'third' +
			'\u001b');

		yield wasavi.send('1G:%s/[a-f]/\\U&/gc\n', 'nna');
		assert.eq('#1-1', '3 substitutions on 3 lines.', wasavi.getLastMessage());
		assert.value('#1-2',
			'first\n' +
			'seConD\n' +
			'thirD');
		assert.pos('#1-3', 2, 0);

		yield wasavi.send('u');
		assert.value('#2-1',
			'first\n' +
			'second\n' +
			'third');
	});

	it('subst queried last', function* () {
		yield wasavi.send(
			'i' +
			'first\n' +
			'second\n' +
			'third' +
			'\u001b');

		yield wasavi.send('1G:%s/[a-f]/\\U&/gc\n', 'yyl');
		assert.eq('#1-1', '3 substitutions on 3 lines.', wasavi.getLastMessage());
		assert.value('#1-2',
			'First\n' +
			'sECond\n' +
			'third');
		assert.pos('#1-3', 1, 0);

		yield wasavi.send('u');
		assert.value('#2-1',
			'First\n' +
			'sEcond\n' +
			'third');

		yield wasavi.send('u');
		assert.value('#2-1',
			'First\n' +
			'second\n' +
			'third');

		yield wasavi.send('u');
		assert.value('#2-1',
			'first\n' +
			'second\n' +
			'third');
	});

	it('subst queried non match', function* () {
		yield wasavi.send('ifirst\nsecond\nthird\u001b');

		yield wasavi.send('2G', '3|');
		yield wasavi.send(':%s/foo/bar/gc\n');
		assert.pos('#1-1', 1, 2);

		yield wasavi.send('1G', '1|');
		yield wasavi.send(':%s/i/!/gc\n', 'yn');
		assert.pos('#2-1', 2, 2);
	});

	it('subst newline', function* () {
		yield wasavi.send('i1\n2\n3\n4\u001b');
		yield wasavi.send(':%s/\\d/&\\nline/g\n');
		assert.value('#1-1', '1\nline\n2\nline\n3\nline\n4\nline');
		assert.pos('#1-2', 7, 0);

		yield wasavi.send(':1\n');
		yield wasavi.send(':s/\\d/&\u0016\u000aLINE/g\n');
		assert.value('#2-1', '1\nLINE\nline\n2\nline\n3\nline\n4\nline');
		assert.pos('#2-2', 1, 0);
	});

	it('subst backref', function* () {
		yield wasavi.send('ifunction foo () {}\u001b');
		yield wasavi.send(':s/\\(function\\)\\s\\+\\(\\w\\+\\)\\(.*\\)/var \\2=\\1\\3\n');
		assert.value('#1-1', 'var foo=function () {}');
	});

	it('subst lower', function* () {
		yield wasavi.send('iFIRST\nSECOND\nTHIRD\u001b');
		yield wasavi.send(':%s/\\w\\+/\\l&/g\n');
		assert.value('#1-1', 'fIRST\nsECOND\ntHIRD');

		yield wasavi.send('u');
		assert.value('#2-1', 'FIRST\nSECOND\nTHIRD');
		yield wasavi.send(':%s/\\w\\+/\\L&/g\n');
		assert.value('#2-2', 'first\nsecond\nthird');

		yield wasavi.send('u');
		assert.value('#3-1', 'FIRST\nSECOND\nTHIRD');
		yield wasavi.send(':%s/\\w\\+/\\L&\\E \\lLine/g\n');
		assert.value('#3-2', 'first line\nsecond line\nthird line');
	});

	it('subst upper', function* () {
		yield wasavi.send('ifirst\nsecond\nthird\u001b');
		yield wasavi.send(':%s/\\w\\+/\\u&/g\n');
		assert.value('#1-1', 'First\nSecond\nThird');

		yield wasavi.send('u');
		assert.value('#2-1', 'first\nsecond\nthird');
		yield wasavi.send(':%s/\\w\\+/\\U&/g\n');
		assert.value('#2-2', 'FIRST\nSECOND\nTHIRD');

		yield wasavi.send('u');
		assert.value('#3-1', 'first\nsecond\nthird');
		yield wasavi.send(':%s/\\w\\+/\\U&\\E \\uline/g\n');
		assert.value('#3-2', 'FIRST Line\nSECOND Line\nTHIRD Line');
	});

	it('subst and', function* () {
		yield wasavi.send(':sushi\n');
		yield wasavi.send('i1\n2\n3\u001b');

		yield wasavi.send(':&\n');
		assert.eq('#1-1', '&: No previous search pattern.', wasavi.getLastMessage());

		yield wasavi.send('1G', ':s/\\d/!/c\ny');
		assert.value('#2-1', '!\n2\n3');

		yield wasavi.send('2G', ':&\n');
		assert.value('#3-1', '!\n!\n3');

		yield wasavi.send(':%&g\n');
		assert.value('#4-1', '!\n!\n!');
	});

	it('subst and2', function* () {
		yield wasavi.send(':sushi\n');
		yield wasavi.send('i1\n2\n3\u001b');

		yield wasavi.send('&');
		assert.eq('#1-1', '&: No previous search pattern.', wasavi.getLastMessage());

		yield wasavi.send('1G', ':s/\\d/!/c\ny');
		assert.value('#2-1', '!\n2\n3');

		yield wasavi.send('2G', '&');
		assert.value('#3-1', '!\n!\n3');
	});

	it('subst tilde', function* () {
		yield wasavi.send(':sushi\n');
		yield wasavi.send('i1\n2\n3\u001b');

		yield wasavi.send(':~\n');
		assert.eq('#1-1', '~: No previous search pattern.', wasavi.getLastMessage());

		yield wasavi.send('1G', ':s/\\d/&!/c\ny');
		assert.value('#2-1', '1!\n2\n3');

		yield wasavi.send('2G', ':~\n');
		assert.value('#3-1', '1!\n2!\n3');

		yield wasavi.send(':%~g\n');
		assert.value('#4-1', '1!!\n2!!\n3!');

		yield wasavi.send('1G', '/!\n');
		yield wasavi.send(':%~g\n');
		assert.value('#5-1', '1!!!!\n2!!!!\n3!!');
	});

	it('subst matched empty', function* () {
		yield wasavi.send(':sushi\n');
		yield wasavi.send('i1*\n012\n3*\u001b');

		yield wasavi.send('1G', ':s/\\*\\?$/<\\/li>/g\n');
		assert.value('#1-1', '1</li>\n012\n3*');

		/*
		 * subst by zero width match,
		 *
		 *   012 -> !0!1!2!
		 *
		 * note: this result is compatible to nvi.
		 *       the result on vim is
		 *
		 *         012 -> !0!1!2
		 *
		 *       (a newline is excepted from a zero width match)
		 */
		yield wasavi.send('2G', ':s/a\\?/!/g\n');
		assert.value('#1-2', '1</li>\n!0!1!2!\n3*');
	});

	// https://github.com/akahuku/wasavi/issues/85
	it('issue85_subst all rest', function* () {
		yield wasavi.send(':sushi\n');
		yield wasavi.send('3ibee \u001byy2p1G');

		yield wasavi.send(':%s/b/BB/gc\nyyya');
		assert.value('#1-1',
				'BBee BBee BBee \n' +
				'BBee BBee BBee \n' +
				'BBee BBee BBee ');

		yield wasavi.send('u');
		assert.value('#2-1',
				'BBee BBee BBee \n' +
				'bee bee bee \n' +
				'bee bee bee ');

		yield wasavi.send('u');
		assert.value('#2-2',
				'BBee BBee bee \n' +
				'bee bee bee \n' +
				'bee bee bee ');

		yield wasavi.send('\u0012');
		assert.value('#3-1',
				'BBee BBee BBee \n' +
				'bee bee bee \n' +
				'bee bee bee ');

		yield wasavi.send('\u0012');
		assert.value('#3-2',
				'BBee BBee BBee \n' +
				'BBee BBee BBee \n' +
				'BBee BBee BBee ');
	});

	it('issue85_subst last', function* () {
		yield wasavi.send(':sushi\n');
		yield wasavi.send('3ibee \u001byy2p1G');

		yield wasavi.send(':%s/b/BB/gc\nyl');
		assert.value('#1-1',
				'BBee BBee bee \n' +
				'bee bee bee \n' +
				'bee bee bee ');
	});

	// https://github.com/akahuku/wasavi/issues/86
	it('issue86_subst first match_burst', function* () {
		yield wasavi.send(':sushi\n');
		yield wasavi.send('3ibee \u001byy2p1G');

		// same length
		yield wasavi.send(':%s/b/B/\n');
		assert.value('#1-1',
				'Bee bee bee \n' +
				'Bee bee bee \n' +
				'Bee bee bee ');

		// increase
		yield wasavi.send('u:%s/b/BB/\n');
		assert.value('#2-1',
				'BBee bee bee \n' +
				'BBee bee bee \n' +
				'BBee bee bee ');

		// decrease
		yield wasavi.send('u:%s/be/B/\n');
		assert.value('#3-1',
				'Be bee bee \n' +
				'Be bee bee \n' +
				'Be bee bee ');
	});

	it('issue86 subst all (burst)', function* () {
		yield wasavi.send(':sushi\n');
		yield wasavi.send('3ibee \u001byy2p1G');

		// same length
		yield wasavi.send(':%s/b/B/g\n');
		assert.value('#1-1',
				'Bee Bee Bee \n' +
				'Bee Bee Bee \n' +
				'Bee Bee Bee ');

		// increase
		yield wasavi.send('u:%s/b/BB/g\n');
		assert.value('#2-1',
				'BBee BBee BBee \n' +
				'BBee BBee BBee \n' +
				'BBee BBee BBee ');

		// decrease
		yield wasavi.send('u:%s/be/B/g\n');
		assert.value('#3-1',
				'Be Be Be \n' +
				'Be Be Be \n' +
				'Be Be Be ');
	});

	it('issue86 subst first match (interactive)', function* () {
		yield wasavi.send(':sushi\n');
		yield wasavi.send('3ibee \u001byy2p1G');

		yield wasavi.send(':%s/b/BB/c\nyyy\u001b');
		assert.value('#1-1',
				'BBee bee bee \n' +
				'BBee bee bee \n' +
				'BBee bee bee ');
	});

	it('subst backslash', function* () {
		yield wasavi.send(':sushi\n');
		yield wasavi.send('ifoo\nbar\nbaz\u001b');

		yield wasavi.send(':%s/$/ \\\\/g\n');
		assert.value('#1-1',
			'foo \\\n' +
			'bar \\\n' +
			'baz \\');
	});

	it('set', function* () {
		yield wasavi.send(':set\n');
		assert.t('#1-1', wasavi.getLastMessage().indexOf('*** options ***\n') == 0);

		yield wasavi.send(':set all\n');
		assert.t('#2-1', wasavi.getLastMessage().indexOf('*** options ***\n') == 0);

		yield wasavi.send(':set foobar\n');
		assert.eq('#3-1', 'Unknown option: foobar', wasavi.getLastMessage());

		yield wasavi.send(':set redraw\n');
		assert.eq('#4-1', '', wasavi.getLastMessage());
		yield wasavi.send(':set redraw?\n');
		assert.eq('#4-2', '  redraw', wasavi.getLastMessage());

		yield wasavi.send(':set noredraw\n');
		assert.eq('#5-1', '', wasavi.getLastMessage());
		yield wasavi.send(':set redraw?\n');
		assert.eq('#5-2', 'noredraw', wasavi.getLastMessage());
		
		yield wasavi.send(':set redraw=5\n');
		assert.eq(
			'#6-1',
			'An extra value assigned to redraw option: redraw=5', 
			wasavi.getLastMessage());
	});

	it('set assignment', function* () {
		yield wasavi.send(':set report=10\n');
		assert.eq('#1-1', '', wasavi.getLastMessage());
		yield wasavi.send(':set report ?\n');
		assert.eq('#1-2', '  report=10', wasavi.getLastMessage());
		yield wasavi.send(':set report = 6\n');
		assert.eq('#1-3', 'Invalid integer value: report=', wasavi.getLastMessage());
		yield wasavi.send(':set report =6\n');
		assert.eq('#1-4', '', wasavi.getLastMessage());
		yield wasavi.send(':set report\n');
		assert.eq('#1-5', '  report=6', wasavi.getLastMessage());

		yield wasavi.send(":set datetime='quoted \\'value\\''\n");
		yield wasavi.send(":set datetime?\n");
		assert.eq('#2-1', "  datetime='quoted \\'value\\''", wasavi.getLastMessage());

		yield wasavi.send(":set datetime='incomplete quote\n");
		assert.eq('#3-1', "Incomplete quoted value: datetime='incomplete quote", wasavi.getLastMessage());

		yield wasavi.send(":set datetime=escaped\\ space\n");
		yield wasavi.send(":set datetime?\n");
		assert.eq('#4-1', "  datetime='escaped space'", wasavi.getLastMessage());
	});

	it('set reset to default', function* () {
		yield wasavi.send(':set list?\n');
		assert.eq('#1-1', '  list', wasavi.getLastMessage());

		// reset to default #1 (nolist)
		yield wasavi.send(':set list&\n');
		yield wasavi.send(':set list?\n');
		assert.eq('#2-1', 'nolist', wasavi.getLastMessage());

		// set to default
		yield wasavi.send(':set list\n');
		yield wasavi.send(':set list?\n');
		assert.eq('#3-1', '  list', wasavi.getLastMessage());

		// reset to default #2 (nolist)
		yield wasavi.send(':set list&default\n');
		yield wasavi.send(':set list?\n');
		assert.eq('#4-1', 'nolist', wasavi.getLastMessage());
	});

	it('set reset to exrc', function* () {
		yield wasavi.send(':set list?\n');
		assert.eq('#1-1', '  list', wasavi.getLastMessage());

		yield wasavi.send(':set nolist\n');
		yield wasavi.send(':set list?\n');
		assert.eq('#2-1', 'nolist', wasavi.getLastMessage());

		yield wasavi.send(':set list&exrc\n');
		yield wasavi.send(':set list?\n');
		assert.eq('#3-1', '  list', wasavi.getLastMessage());
	});

	it('set reset all to default', function* () {
		yield wasavi.send(':set list?\n');
		assert.eq('#1-1', '  list', wasavi.getLastMessage());

		// reset to default #1 (nolist)
		yield wasavi.send(':set all&\n');
		yield wasavi.send(':set list?\n');
		assert.eq('#2-1', 'nolist', wasavi.getLastMessage());

		// set to default
		yield wasavi.send(':set list\n');
		yield wasavi.send(':set list?\n');
		assert.eq('#3-1', '  list', wasavi.getLastMessage());

		// reset to default #2 (nolist)
		yield wasavi.send(':set all&default\n');
		yield wasavi.send(':set list?\n');
		assert.eq('#4-1', 'nolist', wasavi.getLastMessage());
	});

	it('set reset all to exrc', function* () {
		yield wasavi.send(':set list?\n');
		assert.eq('#1-1', '  list', wasavi.getLastMessage());

		yield wasavi.send(':set nolist\n');
		yield wasavi.send(':set list?\n');
		assert.eq('#2-1', 'nolist', wasavi.getLastMessage());

		yield wasavi.send(':set all&exrc\n');
		yield wasavi.send(':set list?\n');
		assert.eq('#3-1', '  list', wasavi.getLastMessage());
	});

	it('set invert', function* () {
		yield wasavi.send(':set list?\n');
		assert.eq('#1-1', '  list', wasavi.getLastMessage());

		yield wasavi.send(':set list!\n');
		yield wasavi.send(':set list?\n');
		assert.eq('#2-1', 'nolist', wasavi.getLastMessage());
		
		yield wasavi.send(':set invlist\n');
		yield wasavi.send(':set list?\n');
		assert.eq('#3-1', '  list', wasavi.getLastMessage());

		yield wasavi.send(':set datetime!\n');
		assert.eq('#4-1', 'datetime option is not a boolean: datetime!', wasavi.getLastMessage());

		yield wasavi.send(':set invdirectory\n');
		assert.eq('#5-1', 'directory option is not a boolean: invdirectory', wasavi.getLastMessage());
	});

	it('registers', function* () {
		yield wasavi.send(':registers\n');
		assert.eq('#1-1', [
			'*** registers ***',
			'""  C  ',
			'":  C  registers'
		].join('\n'), wasavi.getLastMessage());

		yield wasavi.send('i1\n2\n3\u001b');
		yield wasavi.send('yy');
		yield wasavi.send(':reg\n');
		assert.eq(
			'#2-1',
			[
				'*** registers ***',
				'""  L  3^J',
				'".  C  1^J2^J3',
				'":  C  reg'
			].join('\n'),
			wasavi.getLastMessage());
	});

	it('unabbreviate', function* () {
		yield wasavi.send(':ab foo bar\n:ab\n');
		assert.eq(
			'#1-1',
			[
				'*** abbreviations ***',
				'LHS    RHS',
				'---    ---',
				'foo    bar'
			].join('\n'),
			wasavi.getLastMessage());

		yield wasavi.send(':unabbreviate\n');
		assert.eq('#2-1', 'unabbreviate: Missing required argument.', wasavi.getLastMessage());

		yield wasavi.send(':unabb xyz\n');
		assert.eq('#3-1', 'unabbreviate: xyz is not an abbreviation.', wasavi.getLastMessage());

		yield wasavi.send(':unabb foo\n');
		assert.eq('#4-1', '', wasavi.getLastMessage());

		yield wasavi.send(':ab\n');
		assert.eq('#5-1', 'No abbreviations are defined.', wasavi.getLastMessage());
	});

	it('unmap', function* () {
		yield wasavi.send(':map [clear]\n');
		yield wasavi.send(':unmap\n');
		assert.eq('#1-1', 'unmap: Missing required argument.', wasavi.getLastMessage());

		yield wasavi.send(':map H ^\n');
		yield wasavi.send(':map\n');
		assert.eq('#1-1', '*** NORMAL mode maps ***\nH\t^', wasavi.getLastMessage());

		yield wasavi.send(':unma xyz\n');
		assert.eq('#2-1', 'unmap: xyz is not mapped.', wasavi.getLastMessage());

		yield wasavi.send(':unm H\n');
		yield wasavi.send(':map\n');
		assert.eq('#3-1', 'No mappings for NORMAL mode are defined.', wasavi.getLastMessage());
	});

	it('version', function* () {
		yield wasavi.send(':version\n');
		assert.t('#1-1', /^wasavi\/\d+\.\d+\.\d+.*/.test(wasavi.getLastMessage()));
	});

	it('inverted global', function* () {
		yield wasavi.send('i' + [
			'1 x',
			'2',
			'3 z',
			'4 x',
			'5 y',
			'6 z'
		].join('\n') + '\u001b');

		// if range does not specified, all of text should be processed.
		yield wasavi.send(':v/x/p\n');
		assert.eq('#1-1', '2\n3 z\n5 y\n6 z', wasavi.getLastMessage());
		assert.pos('#1-2', 5, 0);
	});

	it('inverted global ranged', function* () {
		yield wasavi.send('i1 x\n2 y\n3 z\n4 x\n5 y\n6 z\u001b');

		// ranged
		yield wasavi.send(':3,5v/x/p\n');
		assert.eq('#1-1', '3 z\n5 y', wasavi.getLastMessage());
		assert.pos('#1-2', 4, 0);
	});

	it('inverted global zero match', function* () {
		yield wasavi.send('i1 x\n2 y\n3 z\n4\n5\u001b');

		// zero match regexp
		/*
		 * 1 x
		 * 2 y +
		 * 3 z +
		 * 4   +
		 * 5
		 */
		yield wasavi.send(':2,4v/^/p\n');
		assert.eq('#1-1', 'v: Pattern found in every line: ^', wasavi.getLastMessage());
		assert.pos('#1-2', 4, 0);
	});

	it('inverted global with empty command', function* () {
		yield wasavi.send('ia\nb\nc\u001b');
		yield wasavi.send(':v/b/\n');
		assert.value('#1-1', 'a\nb\nc');
		assert.eq('#1-2', '', wasavi.getLastMessage());
		assert.pos('#1-3', 2, 0);
	});

	it('invert global with nest denied command', function* () {
		yield wasavi.send('i1\n2\n3\u001b');

		yield wasavi.send(':v/^2/g/./d\n');
		assert.eq('#1-1', 'v: Cannot use the global or v command recursively.', wasavi.getLastMessage());
		assert.value('#1-2', '1\n2\n3');
	});

	it('write', function* () {
		yield wasavi.send('ifoobar\u001b');
		yield wasavi.send(':write\n');

		var text = yield driver.findElement(By.id(wasavi.targetId)).getAttribute('value');
		assert.eq('#1-1', 'foobar', text);
	});

	it('write to content editable', function* () {
		yield wasavi.send('ifoobar\u001b');
		yield wasavi.send(':write\n');

		var text = yield driver.findElement(By.id(wasavi.targetId)).getText();
		assert.eq('#1-1', 'foobar', text);
	});

	// NOTE: about a test to write a file to online storage, see filesystem.js
	//it('write to file', function* () {
	//});

	it('write to file append', function* () {
		yield wasavi.send(':wri >>\n');
		// not implemented, for now
		assert.eq('#1-1', 'write: Appending is not implemented.', wasavi.getLastMessage());
	});

	it('write redirect', function* () {
		yield wasavi.send(':wri !foobar\n');
		// not implemented, for now
		assert.eq('#1-1', 'write: Command redirection is not implemented.', wasavi.getLastMessage());
	});

	it('write warn with readonly option', function* () {
		yield wasavi.send('ifoobar\u001b');
		yield wasavi.send(':set readonly\n');
		yield wasavi.send(':w\n');
		assert.eq('#1-1', 'write: Readonly option is set (use "!" to override).', wasavi.getLastMessage());
		assert.eq('#1-2', '', yield driver.findElement(By.id('t2')).getAttribute('value'));
	});

	it('write warn with readonly element', function* () {
		yield wasavi.send('ifoobar\u001b', ':w\n');
		assert.eq('#1-1', 'write: Readonly option is set (use "!" to override).', wasavi.getLastMessage());
		assert.eq('#1-2', '', yield driver.findElement(By.id('t2')).getAttribute('value'));
	});

	it('force write with readonly option', function* () {
		yield wasavi.send('ifoobar\u001b:set readonly|w!\n');
		yield driver.sleep(1000);
		assert.eq('#1-1', 'Written: TEXTAREA#t2 [unix] 1 line, 6 characters.', wasavi.getLastMessage());
		assert.eq('#1-2', 'foobar', yield driver.findElement(By.id('t2')).getAttribute('value'));
	});

	it('force write with readonly element', function* () {
		yield wasavi.send('ifoobar\u001b', ':w!\n');
		yield driver.sleep(1000);
		assert.eq('#1-1', 'Written: TEXTAREA#t2 [unix] 1 line, 6 characters.', wasavi.getLastMessage());
		assert.eq('#1-2', 'foobar', yield driver.findElement(By.id('t2')).getAttribute('value'));
	});

	it('write and quit', function* () {
		yield wasavi.send('ifoobar\u001b');
		yield wasavi.sendNoWait(':wq\n');

		var vanished = yield wasavi.waitTerminate();
		assert.t('wasaviFrame must not be exist.', vanished);

		var text = yield driver.findElement(By.id('t2')).getAttribute('value');
		assert.eq('#1-1', 'foobar', text);
	});

	it('exit modified', function* () {
		yield wasavi.send('ifoobar\u001b');
		yield wasavi.sendNoWait(':xit\n');

		var vanished = yield wasavi.waitTerminate();
		assert.t('wasaviFrame must not be exist.', vanished);

		var text = yield driver.findElement(By.id('t2')).getAttribute('value');
		assert.eq('#1-1', 'foobar', text);
	});

	it('exit not modified', function* () {
		yield wasavi.sendNoWait(':xit\n');

		var vanished = yield wasavi.waitTerminate();
		assert.t('wasaviFrame must not be exist.', vanished);

		var text = yield driver.findElement(By.id('t2')).getAttribute('value');
		assert.eq('#1-1', '', text);
	});

	it('yank', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('i\t1.\n2.\n3.\u001b');
		yield wasavi.send('1G', '$');
		assert.pos('#1-1', 0, 2);

		yield wasavi.send(':yank\n');
		assert.eq('#2-1', '\t1.\n', wasavi.getRegister('"'));
		assert.pos('#2-2', 0, 2);

		yield wasavi.send(':1,2yan a\n');
		assert.eq('#3-1', '\t1.\n2.\n', wasavi.getRegister('a'));
		assert.pos('#3-2', 0, 2);

		yield wasavi.send(':2,3yan *\n');
		assert.eq('#4-1', '2.\n3.\n', wasavi.getRegister('*'));
		var clipboardText = yield wasavi.getClipboardText();
		assert.t('#4-2: clipboardText must be a string', clipboardText);
		assert.eq('#4-3: clipboardText must be synchronized with star register', '2.\n3.\n', clipboardText);
		assert.pos('#4-4', 0, 2);

		yield wasavi.send(':ya10\n');
		assert.eq('#5-1', '\t1.\n2.\n3.\n', wasavi.getRegister('"'));
		assert.pos('#5-2', 0, 2);
	});

	it('shift', function* () {
		yield wasavi.send(':set sw=8 noai\n');
		yield wasavi.send('i\t1\n2\n3\u001b');
		yield wasavi.send('1G', '1|');
		assert.pos('#1-1', 0, 0);

		yield wasavi.send(':>\n');
		assert.value('#2-1', '\t\t1\n2\n3');
		assert.pos('#2-2', 0, 2);

		yield wasavi.send(':undo\n');
		assert.value('#3-1', '\t1\n2\n3');

		yield wasavi.send(':redo\n');
		assert.value('#4-1', '\t\t1\n2\n3');
	});

	it('shift multi', function* () {
		yield wasavi.send(':set sw=8 noai\n');
		yield wasavi.send('i\t1\n2\n3\u001b');
		yield wasavi.send('1G', '1|');
		assert.pos('#1-1', 0, 0);

		yield wasavi.send(':>>2\n');
		assert.value('#2-1', '\t\t\t1\n\t\t2\n3');
		assert.pos('#2-2', 1, 2);

		yield wasavi.send(':undo\n');
		assert.value('#3-1', '\t1\n2\n3');

		yield wasavi.send(':redo\n');
		assert.value('#4-1', '\t\t\t1\n\t\t2\n3');
	});

	it('unshift', function* () {
		yield wasavi.send(':set sw=8 noai\n');
		yield wasavi.send('i\t\t1\n\t2\n3\u001b');
		yield wasavi.send('1G', '1|');
		assert.pos('#1-1', 0, 0);

		yield wasavi.send(':<\n');
		assert.value('#2-1', '\t1\n\t2\n3');
		assert.pos('#2-2', 0, 1);

		yield wasavi.send(':undo\n');
		assert.value('#3-1', '\t\t1\n\t2\n3');

		yield wasavi.send(':redo\n');
		assert.value('#4-1', '\t1\n\t2\n3');
	});

	it('unshift multi', function* () {
		yield wasavi.send(':set sw=8 noai\n');
		yield wasavi.send('i\t\t\t1\n\t2\n3\u001b');
		yield wasavi.send('1G', '1|');
		assert.pos('#1-1', 0, 0);

		yield wasavi.send(':<<2\n');
		assert.value('#2-1', '\t1\n2\n3');
		assert.pos('#2-2', 1, 0);

		yield wasavi.send(':undo\n');
		assert.value('#3-1', '\t\t\t1\n\t2\n3');

		yield wasavi.send(':redo\n');
		assert.value('#4-1', '\t1\n2\n3');
	});

	it('execute register', function* () {
		yield wasavi.send('is/\\d/\tfoo\u0016\u001b\\n\u0016\u0009\u001b');
		assert.value('#1-1', 's/\\d/\tfoo\u001b\\n\t');
		yield wasavi.send('"ayy');
		assert.eq('#1-2', 's/\\d/\tfoo\u001b\\n\t\n', wasavi.getRegister('a'));
		yield wasavi.send('u');
		assert.value('#1-3', '');
		assert.pos('#1-4', 0, 0);

		yield wasavi.send('i1\n2\n3\u001b');
		yield wasavi.send(':%@a\n');
		assert.value('#2-1', '1\n2\n\tfoo\u001b\n\t');
	});

	it('file without file name', function* () {
		yield wasavi.send(':file\n');
		assert.eq('#1-1', 'TEXTAREA#t2 [unix] --No lines in buffer--', wasavi.getLastMessage());
	});

	it('file with file name', function* () {
		yield wasavi.send(':file foobar.txt\n');
		assert.eq('#1-1', 'file: Only stand alone form can rename.', wasavi.getLastMessage());
	});

	it('paste calc register direct', function* () {
		yield wasavi.send(':0put =99*99\n');
		assert.value('#1-1', '9801');
	});

	it('paste calc register indirect', function* () {
		yield wasavi.send(':put =\n');
		assert.value('#1-1', '');
		assert.eq('#1-2', 'put: Register = is empty.', wasavi.getLastMessage());

		yield wasavi.send('"=99*99\nP');
		assert.value('#2-1', '9801');

		yield wasavi.send(':put =\n');
		assert.value('#3-1', '9801\n9801');
	});

	it('sort', function* () {
		var tests = [
			['', 'xyz\nfoo\nbar', 'bar\nfoo\nxyz'],
			['', 'xyz \\\nfoo \\\nbar', 'bar \\\nfoo \\\nxyz'],
			['', 'xyz,\nfoo,\nbar', 'bar,\nfoo,\nxyz'],
			['i', 'Foo\nbar\nBAZ', 'bar\nBAZ\nFoo'],
			['/\\d\\+/', 'foo4baz\nbar3bar\nbaz1frr', 'bar3bar\nfoo4baz\nbaz1frr'],
			['/\\d\\+/r', 'foo4baz\nbar3bar\nbaz1frr', 'baz1frr\nbar3bar\nfoo4baz'],
			['/\\d\\+/i', 'foo4baZ\nbar3bar\nbaz1frr', 'bar3bar\nfoo4baZ\nbaz1frr'],
			['/[a-zA-Z]\\+/ri', '345c847\n123a456\n537B183', '123a456\n537B183\n345c847'],
			['c3', 'foo897\nbar532\nzoo321', 'zoo321\nbar532\nfoo897'],
			['c3i', '321zoo\n532bar\n897Foo', '532bar\n897Foo\n321zoo']
		];
		for (var i = 0; i < tests.length; i++) {
			var t = tests[i];
			yield wasavi.send(`ggcG${t[1]}\u001b:sort ${t[0]}\n`);
			assert.value(
				`#${i}\n` +
				`**expected**\n${t[2]}\n` +
				`** actual **\n${wasavi.getValue()}\n`, t[2]);
		}
	});
};
