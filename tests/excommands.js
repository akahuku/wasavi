/**
 * wasavi: vi clone implemented in javascript
 * =============================================================================
 *
 *
 * @author akahuku@gmail.com
 * @version $Id: excommands.js 134 2012-06-11 20:44:34Z akahuku $
 */

/**
 * tests
 */

function _testAddressAll () {
	Wasavi.send('i1\n2\n3\u001b');
	Wasavi.send(':%p\n');
	assertEquals('#1-1', '1\n2\n3', Wasavi.lastMessage);

	Wasavi.send(':% +1p\n');
	assert('#2-1', Wasavi.lastMessage != '');
}

function _testNull () {
	Wasavi.send('i1\n2\n3\u001b');

	console.log('*** start ***');
	Wasavi.send('2G:\n');
	assertEquals('#1-1', '', Wasavi.lastMessage);
	assertPos('#1-2', [1, 0]);
	console.log('*** end ***');

	Wasavi.send(':||\n');
	assertEquals('#2-1', '2\n2', Wasavi.lastMessage);
}

function _testAddressCurrent () {
	Wasavi.send('i1\n2\n3\u001b');
	Wasavi.send('2G:.p\n');
	assertEquals('#1-1', '2', Wasavi.lastMessage);

	Wasavi.send('2G:.+p\n');
	assertEquals('#2-1', '3', Wasavi.lastMessage);
	assertPos('#2-2', [2, 0]);
	Wasavi.send('2G:.+1p\n');
	assertEquals('#2-3', '3', Wasavi.lastMessage);
	assertPos('#2-4', [2, 0]);
	Wasavi.send('2G:. +1p\n');
	assertEquals('#2-5', '3', Wasavi.lastMessage);
	assertPos('#2-6', [2, 0]);

	Wasavi.send('2G:.-p\n');
	assertEquals('#3-1', '1', Wasavi.lastMessage);
	assertPos('#3-2', [0, 0]);
	Wasavi.send('2G:.-1p\n');
	assertEquals('#3-3', '1', Wasavi.lastMessage);
	assertPos('#3-4', [0, 0]);
	Wasavi.send('2G:. -1p\n');
	assertEquals('#3-5', '1', Wasavi.lastMessage);
	assertPos('#3-6', [0, 0]);
}

function _testAddressLast () {
	Wasavi.send('i1\n2\n3\u001b');
	Wasavi.send(':$p\n');
	assertEquals('#1-1', '3', Wasavi.lastMessage);
}

function _testAddressInteger () {
	Wasavi.send('i1\n2\n3\u001b');

	// sould be clipped
	Wasavi.send(':0p\n');
	assertEquals('#1-1', '1', Wasavi.lastMessage);
	assertPos('#1-2', [0, 0]);

	Wasavi.send(':1p\n');
	assertEquals('#2-1', '1', Wasavi.lastMessage);
	assertPos('#2-2', [0, 0]);

	Wasavi.send(':2p\n');
	assertEquals('#3-1', '2', Wasavi.lastMessage);
	assertPos('#3-2', [1, 0]);

	Wasavi.send(':3p\n');
	assertEquals('#4-1', '3', Wasavi.lastMessage);
	assertPos('#4-2', [2, 0]);

	// implicit print, sould be clipped
	Wasavi.send(':4\n');
	assertEquals('#5-1', '', Wasavi.lastMessage);
	assertPos('#5-2', [2, 0]);

	// explicit print, should be an error
	Wasavi.send(':4p\n');
	assertPos('#6-2', [2, 0]);
	assertEquals('#6-1', 'print: Out of range.', Wasavi.lastMessage);
}

function _testAddressMark () {
	Wasavi.send('i1\n2\n3\n4\u001b');

	Wasavi.send('4Gma1G:\'ap\n');
	assertEquals('#1-1', '4', Wasavi.lastMessage);
	assertPos('#1-2', [3, 0]);
}

function _testAddressOffsetInteger () {
	Wasavi.send('i1\n2\n3\u001b');

	Wasavi.send('2G:+0p\n');
	assertEquals('#1-1', '2', Wasavi.lastMessage);

	Wasavi.send('2G:+p\n');
	assertEquals('#2-1', '3', Wasavi.lastMessage);

	Wasavi.send('2G:-0p\n');
	assertEquals('#3-1', '2', Wasavi.lastMessage);

	Wasavi.send('2G:-p\n');
	assertEquals('#4-1', '1', Wasavi.lastMessage);
}

function _testAddressSearchForward () {
	Wasavi.send(':set nowrapscan\n');
	Wasavi.send('i1 foo\n2 foo\n3 foo\u001b');

	Wasavi.send('://p\n');
	assertEquals('#0-1', 'No previous search pattern.', Wasavi.lastMessage);

	Wasavi.send('1G:/foo/p\n');
	assertEquals('#1-1', '2 foo', Wasavi.lastMessage);
	assertPos('#1-2', [1, 0]);

	Wasavi.send('://p\n');
	assertEquals('#2-1', '3 foo', Wasavi.lastMessage);
	assertPos('#2-2', [2, 0]);

	// not found on nowrapscan:
	// should be an error.
	Wasavi.send('://p\n');
	assert('#3-1', Wasavi.lastMessage != '');
	assertEquals('#3-2', 'Pattern not found: foo', Wasavi.lastMessage);
	assertPos('#3-3', [2, 0]);

	// turn wrapscan on.
	// should be wrapped searching.
	Wasavi.send(':set wrapscan\n');
	Wasavi.send('://p\n');
	assertEquals('#4-1', '1 foo', Wasavi.lastMessage);
	assertPos('#4-2', [0, 0]);

	// not found on wrapscan:
	// should be an error.
	Wasavi.send(':/xyz/p\n');
	assertEquals('#5-1', 'Pattern not found: xyz', Wasavi.lastMessage);
	assertPos('#5-2', [0, 0]);
}

function _testAddressSearchBackward () {
	Wasavi.send(':set nowrapscan\n');
	Wasavi.send('i1 foo\n2 foo\n3 foo\u001b');

	Wasavi.send(':??p\n');
	assertEquals('#0-1', 'No previous search pattern.', Wasavi.lastMessage);

	Wasavi.send('3G:?foo?p\n');
	assertEquals('#1-1', '2 foo', Wasavi.lastMessage);
	assertPos('#1-2', [1, 0]);

	Wasavi.send(':??p\n');
	assertEquals('#2-1', '1 foo', Wasavi.lastMessage);
	assertPos('#2-2', [0, 0]);

	// not found on nowrapscan:
	// should be an error.
	Wasavi.send(':??p\n');
	assert('#3-1', Wasavi.lastMessage != '');
	assertEquals('#3-2', 'Pattern not found: foo', Wasavi.lastMessage);
	assertPos('#3-3', [0, 0]);

	// turn wrapscan on.
	// should be wrapped searching.
	Wasavi.send(':set wrapscan\n');
	Wasavi.send(':??p\n');
	assertEquals('#4-1', '3 foo', Wasavi.lastMessage);
	assertPos('#4-2', [2, 0]);

	// not found on wrapscan:
	// should be an error.
	Wasavi.send(':?xyz?p\n');
	assertEquals('#5-1', 'Pattern not found: xyz', Wasavi.lastMessage);
	assertPos('#5-2', [2, 0]);
}

function _testRangeStatic () {
	Wasavi.send(':set nowrapscan\n');
	Wasavi.send('i1 foo\n2 bar\n3 foo\n4 bar\n5 foo\u001b');

	/*
	 * 1 foo *                        1 foo
	 * 2 bar                          2 bar * selected range (reversed, causes an error)
	 * 3 foo    -- :/foo/,/bar/p -->  3 foo *
	 * 4 bar                          4 bar
	 * 5 foo                          5 foo
	 */
	Wasavi.send('1G:/foo/,/bar/p\n');
	assertEquals('#1-1', 'The second address is smaller than the first.', Wasavi.lastMessage);

	Wasavi.send('1G:/bar/,/foo/p\n');
	assertEquals('#2-1', '2 bar\n3 foo', Wasavi.lastMessage);
}

function _testRangeDynamic () {
	Wasavi.send(':set nowrapscan\n');
	Wasavi.send('i1 foo\n2 bar\n3 foo\n4 bar\n5 foo\u001b');

	/*
	 * 1 foo *                        1 foo
	 * 2 bar                          2 bar
	 * 3 foo    -- :/foo/;/bar/p -->  3 foo * selected range
	 * 4 bar                          4 bar *
	 * 5 foo                          5 foo
	 */
	Wasavi.send('1G:/foo/;/bar/p\n');
	assertEquals('#1-1', '3 foo\n4 bar', Wasavi.lastMessage);

	// if dynamic address is out of range, causes an error (even command has roundMax flag)
	Wasavi.send('1G:100;?foo?\n');
	assertEquals('#2-1', 'Out of range.', Wasavi.lastMessage);
}

function _testRangeTooManyAddress () {
	Wasavi.send('i1\n2\n3\u001b');
	Wasavi.send(':1,2,3p\n');
	assertEquals('#1-1', '2\n3', Wasavi.lastMessage);
}

function _testImplicitAddress () {
	Wasavi.send('i1\n2\n3\u001b');
	Wasavi.send('2G:||\n');
	assertEquals('#1-1', '2\n2', Wasavi.lastMessage);
}

function _testNumericAddress () {
	Wasavi.send('i1\n2\n3\n4\n5\u001b');

	console.log('start');
	Wasavi.send(':1\n');
	assertPos('#1-1', [0, 0]);
	console.log('end');

	Wasavi.send(':+2\n');
	assertPos('#2-1', [2, 0]);

	Wasavi.send('1G:/5/\n');
	assertPos('#3-1', [4, 0]);
	assertEquals('#3-2', '', Wasavi.lastMessage);

	Wasavi.send('1G:/5\n');
	assertPos('#4-1', [4, 0]);
	assertEquals('#4-2', '', Wasavi.lastMessage);
}

function _testAbbreviate () {
	Wasavi.send(':abbreviate\n');
	assertEquals('#1-1', 'No abbreviations are defined.', Wasavi.lastMessage);

	Wasavi.send(':abbreviat test\n');
	assert('#2-1', Wasavi.lastMessage != '');

	Wasavi.send(':abbrevia foo? bar\n');
	assert('#3-1', Wasavi.lastMessage != '');

	Wasavi.send(':abbrevi foo bar\n');
	assert('#4-1', Wasavi.lastMessage == '');
	Wasavi.send(':abbre\n');
	assert('#4-2', Wasavi.lastMessage != '');
}

function _testAbbreviateAction () {
	Wasavi.send(':ab foo FOO\n');
	Wasavi.send('ifoo bar foo\u001b');
	assertEquals('#1-1', 'FOO bar FOO', Wasavi.value);
}

function _testCopyBadDest () {
	Wasavi.send('i1\n2\n3\n4\n5\u001b');

	/*
	 * should be an error if destination address does not specified
	 */
	Wasavi.send(':1copy\n');
	assertEquals('#1-1', 'copy: Invalid argument', Wasavi.lastMessage);
}

function _testCopyZeroSource () {
	Wasavi.send('i1\n2\n3\u001b');

	Wasavi.send(':0copy2\n');
	assertEquals('#1-1', '1\n2\n1\n3', Wasavi.value);
}

function _testCopyToLower () {
	Wasavi.send('i1\n2\n3\n4\n5\u001b');
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
	Wasavi.send(':2,3cop1\n');
	assertEquals('#1-1', '1\n2\n3\n2\n3\n4\n5', Wasavi.value);
	assertPos('#1-2', [2, 0]);
	Wasavi.send('u');
	assertEquals('#1-3', '1\n2\n3\n4\n5', Wasavi.value);
	Wasavi.send('\u0012');
	assertEquals('#1-4', '1\n2\n3\n2\n3\n4\n5', Wasavi.value);
}

function _testCopyToLowerSpecial () {
	Wasavi.send('i1\n2\n3\n4\n5\u001b');
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
	Wasavi.send(':2,3co0\n');
	assertEquals('#1-1', '2\n3\n1\n2\n3\n4\n5', Wasavi.value);
	assertPos('#1-2', [1, 0]);
	Wasavi.send('u');
	assertEquals('#1-3', '1\n2\n3\n4\n5', Wasavi.value);
	Wasavi.send('\u0012');
	assertEquals('#1-4', '2\n3\n1\n2\n3\n4\n5', Wasavi.value);
}

function _testCopyToInsideRange () {
	Wasavi.send('i1\n2\n3\n4\n5\u001b');
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
	Wasavi.send(':2,3co2\n');
	assertEquals('#1-1', '1\n2\n2\n3\n3\n4\n5', Wasavi.value);
	assertPos('#1-2', [3, 0]);
	Wasavi.send('u');
	assertEquals('#1-3', '1\n2\n3\n4\n5', Wasavi.value);
	Wasavi.send('\u0012');
	assertEquals('#1-4', '1\n2\n2\n3\n3\n4\n5', Wasavi.value);
}

function _testCopyToUpper () {
	Wasavi.send('i1\n2\n3\n4\n5\u001b');
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
	Wasavi.send(':2,3co4\n');
	assertEquals('#1-1', '1\n2\n3\n4\n2\n3\n5', Wasavi.value);
	assertPos('#1-2', [5, 0]);
	Wasavi.send('u');
	assertEquals('#1-3', '1\n2\n3\n4\n5', Wasavi.value);
	Wasavi.send('\u0012');
	assertEquals('#1-4', '1\n2\n3\n4\n2\n3\n5', Wasavi.value);
}

function _testCopyToUpperSpecial () {
	Wasavi.send('i1\n2\n3\n4\n5\u001b');
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
	Wasavi.send(':2,3co5\n');
	assertEquals('#1-1', '1\n2\n3\n4\n5\n2\n3', Wasavi.value);
	assertPos('#1-2', [6, 0]);
	Wasavi.send('u');
	assertEquals('#1-3', '1\n2\n3\n4\n5', Wasavi.value);
	Wasavi.send('\u0012');
	assertEquals('#1-4', '1\n2\n3\n4\n5\n2\n3', Wasavi.value);
}

function _testDelete () {
	Wasavi.send('i1\n2\n3\n4\n5\u001b');

	Wasavi.send(':2,3delete\n');
	assertEquals('#1-1', '1\n4\n5', Wasavi.value);
	assertPos('#1-2', [1, 0]);
	assertEquals('#1-3', '2\n3\n', Wasavi.registers('"'));

	Wasavi.send('u');
	assertEquals('#2-1', '1\n2\n3\n4\n5', Wasavi.value);

	Wasavi.send('\u0012');
	assertEquals('#3-1', '1\n4\n5', Wasavi.value);
}

function _testDeleteZeroSource () {
	Wasavi.send('i1\n2\n3\n4\n5\u001b');

	Wasavi.send(':0,2delete\n');
	assertEquals('#1-1', '3\n4\n5', Wasavi.value);
	assertPos('#1-2', [0, 0]);
	assertEquals('#1-3', '1\n2\n', Wasavi.registers('"'));

	Wasavi.send('u');
	assertEquals('#2-1', '1\n2\n3\n4\n5', Wasavi.value);

	Wasavi.send('\u0012');
	assertEquals('#3-1', '3\n4\n5', Wasavi.value);
}

function _testDeleteTail () {
	Wasavi.send('i1\n2\n3\n4\n5\u001b');

	Wasavi.send(':4,5delet a\n');
	assertEquals('#1-1', '1\n2\n3', Wasavi.value);
	assertPos('#1-2', [2, 0]);
	assertEquals('#1-3', '4\n5\n', Wasavi.registers('a'));

	Wasavi.send('u');
	assertEquals('#2-1', '1\n2\n3\n4\n5', Wasavi.value);

	Wasavi.send('\u0012');
	assertEquals('#3-1', '1\n2\n3', Wasavi.value);
}

function _testDeleteByCount () {
	Wasavi.send('i1\n2\n3\n4\n5\u001b');

	Wasavi.send(':2dele3\n');
	assertEquals('#1-1', '1\n5', Wasavi.value);
	assertPos('#1-2', [1, 0]);
	assertEquals('#1-3', '2\n3\n4\n', Wasavi.registers('"'));

	Wasavi.send('u');
	assertEquals('#2-1', '1\n2\n3\n4\n5', Wasavi.value);

	Wasavi.send('\u0012');
	assertEquals('#3-1', '1\n5', Wasavi.value);
}

function _testDeleteByCountWithRange () {
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
	Wasavi.send('i1\n2\n3\n4\n5\n6\n7\u001b');

	Wasavi.send(':2, 4d2\n');
	assertEquals('#1-1', '1\n2\n3\n6\n7', Wasavi.value);
	assertPos('#1-2', [3, 0]);
	assertEquals('#1-3', '4\n5\n', Wasavi.registers('"'));

	Wasavi.send('u');
	assertEquals('#2-1', '1\n2\n3\n4\n5\n6\n7', Wasavi.value);

	Wasavi.send('\u0012');
	assertEquals('#3-1', '1\n2\n3\n6\n7', Wasavi.value);
}

function _testGlobal () {
	Wasavi.send('i1 x\n2 y\n3 z\n4 x\n5 y\n6 z\u001b');

	// if range does not specified, all of text should be processed.
	Wasavi.send(':g/\\d/p\n');
	assertEquals('#1-1', '1 x\n2 y\n3 z\n4 x\n5 y\n6 z', Wasavi.lastMessage);
	assertPos('#1-2', [5, 0]);
}

function _testGlobalRanged () {
	Wasavi.send('i1 x\n2 y\n3 z\n4 x\n5 y\n6 z\u001b');

	// ranged
	Wasavi.send(':3,5g/x/p\n');
	assertEquals('#1-1', '4 x', Wasavi.lastMessage);
	assertPos('#1-2', [3, 0]);
}

function _testGlobalZeroMatch () {
	Wasavi.send('i1 x\n2 y\n3 z\n4 x\n5 y\n6 z\u001b');

	// zero match regexp
	Wasavi.send(':g/^/p\n');
	assertEquals('#1-1', '1 x\n2 y\n3 z\n4 x\n5 y\n6 z', Wasavi.lastMessage);
	assertPos('#1-2', [5, 0]);
}

function _testGlobalWithEmptyCommand () {
	Wasavi.send('i1\n2\n3\u001b');
	Wasavi.send(':g/./\n');
	assertEquals('#1-1', '1\n2\n3', Wasavi.value);
	assertEquals('#1-2', '', Wasavi.lastMessage);
	assertPos('#1-3', [2, 0]);
}

function _testGlobalDelete () {
	Wasavi.send('i1 x\n2 y\n3 z\n4 x\n5 y\n6 z\u001b');

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
	Wasavi.send(':g/x/d\n');
	assertEquals('#1-1', '2 y\n3 z\n5 y\n6 z', Wasavi.value);
	assertPos('#1-2', [2, 0]);

	Wasavi.send('u');
	assertEquals('#2-1', '1 x\n2 y\n3 z\n4 x\n5 y\n6 z', Wasavi.value);

	Wasavi.send('\u0012');
	assertEquals('#3-1', '2 y\n3 z\n5 y\n6 z', Wasavi.value);
}

function _testGlobalDeleteSpecial () {
	Wasavi.send('i1\n2\n3\n4\n5\n6\u001b');

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

	Wasavi.send(':g/\\d/+1d\n');
	assertEquals('#1-1', '1\n3\n5', Wasavi.value);
	assertPos('#1-2', [2, 0]);

	Wasavi.send('u');
	assertEquals('#2-1', '1\n2\n3\n4\n5\n6', Wasavi.value);

	Wasavi.send('\u0012');
	assertEquals('#3-1', '1\n3\n5', Wasavi.value);
}

function _testGlobalWithNestDeniedCommand () {
	Wasavi.send('i1\n2\n3\u001b');

	Wasavi.send(':g/./g/./d\n');
	assertEquals('#1-1', 'Cannot use the global or v command recursively.', Wasavi.lastMessage);
	assertEquals('#1-2', '1\n2\n3', Wasavi.value);
}

function _testJoinWithCount () {
	Wasavi.send('ifirst\nsecond\nthird\nfourth\u001b');

	/*
	 * zero count is error.
	 */
	Wasavi.send('1G:join0\n');
	assertEquals('#0-1', 'join: Count may not be zero.', Wasavi.lastMessage);
	assertEquals('#0-2', 'first\nsecond\nthird\nfourth', Wasavi.value);

	/*
	 * no address was specified:
	 *
	 * first  * :j2       first second
	 * second        -->  third
	 * third              fourth
	 * fourth
	 */
	Wasavi.send('1G:joi!2\n');
	assertEquals('#1-1', 'firstsecond\nthird\nfourth', Wasavi.value);
	assertPos('#1-2', [0, 0]);
	Wasavi.send('u');
	assertEquals('#1-3', 'first\nsecond\nthird\nfourth', Wasavi.value);

	/*
	 * one address was specified:
	 *
	 * first               first
	 * second * :2j2  -->  second third
	 * third               fourth
	 * fourth
	 */
	Wasavi.send(':2jo 2\n');
	assertEquals('#2-1', 'first\nsecond third\nfourth', Wasavi.value);
	assertPos('#2-2', [1, 0]);
	Wasavi.send('u');
	assertEquals('#2-3', 'first\nsecond\nthird\nfourth', Wasavi.value);

	/*
	 * two addresses were specified:
	 *
	 * first  * :1,2j2       first second third
	 * second           -->  fourth
	 * third
	 * fourth
	 */
	Wasavi.send(':1,2j2\n');
	assertEquals('#3-1', 'first second third\nfourth', Wasavi.value);
	assertPos('#3-2', [0, 0]);
	Wasavi.send('u');
	assertEquals('#3-3', 'first\nsecond\nthird\nfourth', Wasavi.value);
}

function _testJoinWithNoCount () {
	Wasavi.send('ifirst\nsecond\nthird\nfourth\u001b');

	/*
	 * no address was specified:
	 *
	 * first  * :j       first second
	 * second       -->  third
	 * third             fourth
	 * fourth
	 */
	Wasavi.send('1G:j\n');
	assertEquals('#1-1', 'first second\nthird\nfourth', Wasavi.value);
	assertPos('#1-2', [0, 0]);
	Wasavi.send('u');
	assertEquals('#1-3', 'first\nsecond\nthird\nfourth', Wasavi.value);

	/*
	 * one address was specified:
	 *
	 * first              first
	 * second * :2j  -->  second third
	 * third              fourth
	 * fourth
	 */
	Wasavi.send(':2j!\n');
	assertEquals('#2-1', 'first\nsecondthird\nfourth', Wasavi.value);
	assertPos('#2-2', [1, 0]);
	Wasavi.send('u');
	assertEquals('#2-3', 'first\nsecond\nthird\nfourth', Wasavi.value);

	/*
	 * two addresses were specified:
	 *
	 * first  *              first second third
	 * second    :1,3j  -->  fourth
	 * third
	 * fourth
	 */
	Wasavi.send(':1,3j\n');
	assertEquals('#3-1', 'first second third\nfourth', Wasavi.value);
	assertPos('#3-2', [0, 0]);
	Wasavi.send('u');
	assertEquals('#3-3', 'first\nsecond\nthird\nfourth', Wasavi.value);
}

function _testMark () {
	Wasavi.send('i1\n2\n3\u001b');

	Wasavi.send(':2G\n:k\n');
	assertEquals('#1-1', 'k: Invalid argument.', Wasavi.lastMessage);

	Wasavi.send(':3G\n:ka\n');
	Wasavi.send(':1\n:\'a\n');
	assertPos('#2-1', [2, 0]);
}

function _testMap () {
	Wasavi.send(':map\n');
	assertEquals('#1-1', [
		'No mappings for command mode are defined.'
	].join('\n'), Wasavi.lastMessage);

	Wasavi.send(':map Q 1G\n');
	Wasavi.send(':map XQ G\n');
	Wasavi.send(':map\n');
	assertEquals('#2-1', [
		'*** command mode map ***',
		'Q \t1G',
		'XQ\tG'
	].join('\n'), Wasavi.lastMessage);

	Wasavi.send(':map X\n');
	assertEquals('#3-1', [
		'*** command mode map ***',
		'XQ\tG'
	].join('\n'), Wasavi.lastMessage);

	Wasavi.send(':map [clear]\n');
	Wasavi.send(':map\n');
	assertEquals('#4-1', [
		'No mappings for command mode are defined.'
	].join('\n'), Wasavi.lastMessage);
}

function _testMapUnique () {
	Wasavi.send(':map [clear]\n');
	Wasavi.send(':map Q G\ni1\n2\n3\u001bgg');
	assertPos('#1-1', [0, 0]);
	Wasavi.send('Q');
	console.log(Wasavi.lastMessage);
	assertPos('#2-1', [2, 0]);

	Wasavi.send(':map <f1> <esc>if1\u0016\u0016 key\u0016\u0016 pressed<esc>\n');
	Wasavi.send(Wasavi.SPECIAL_KEYS.F1);
	assertEquals('#3-1', '1\n2\nf1 key pressed3', Wasavi.value);
}

function _testMapAmbiguous () {
	Wasavi.send(':map [clear]\n');
	Wasavi.send(':map Q 1G\n');
	Wasavi.send(':map QQ G\n');
	Wasavi.send('i1\n2\n3\n4\n5\u001b');
		
	// ambiguous, timed out
	Wasavi.send('Q');
	assertPos('#1-1', [0, 0]);

	// ambiguous, not timed out
	Wasavi.send('GQj');
	assertPos('#2-1', [1, 0]);

	//
	Wasavi.send('QQ');
	assertPos('#3-1', [4, 0]);

	//
	Wasavi.send('QQk');
	assertPos('#4-1', [3, 0]);
}

function _testNestedMap () {
	Wasavi.send(':map [clear]\n');
	Wasavi.send(':map Q G\n');
	Wasavi.send(':map q Q\n');
	Wasavi.send('i1\n2\n3\n4\n5\u001b');

	Wasavi.send('ggq');
	assertPos('#1-1', [4, 0]);

	Wasavi.send(':map [noremap] q Q\n');
	Wasavi.send('ggq');
	assertPos('#2-1', [0, 0]);
}

function _testEditMapUnique () {
	Wasavi.send(':map! [clear]\n');
	Wasavi.send(':map! Q quick\u0016\u0016 brown\u0016\u0016 fox\n');

	Wasavi.send('iQ!\u001b');
	assertEquals('#1-1', 'quick brown fox!', Wasavi.value);
}

function _testMark2 () {
	Wasavi.send('i1\n2\n3\u001b');

	Wasavi.send(':2G\n:mark\n');
	assertEquals('#1-1', 'mark: Invalid argument.', Wasavi.lastMessage);

	Wasavi.send(':3G\n:mark a\n');
	Wasavi.send(':1\n:\'a\n');
	assertPos('#2-1', [2, 0]);
}

function _testMarks () {
	Wasavi.send('i1 first\n2 second\n3 third\u001b');

	Wasavi.send(':marks\n');
	console.log(Wasavi.lastMessage);
	assertEquals('#1-1', [
		'*** marks ***',
		'mark  line   col   text',
		'====  =====  ====  ===='
	].join('\n'), Wasavi.lastMessage);

	Wasavi.send('1G1|:mark a\n');
	Wasavi.send(':marks\n');
	console.log(Wasavi.lastMessage);
	assertEquals('#2-1', [
		'*** marks ***',
		'mark  line   col   text',
		'====  =====  ====  ====',
		" '        3     6  3 third",
		' a        1     0  1 first'
	].join('\n'), Wasavi.lastMessage);

	Wasavi.send('2G2|:mark b\n');
	Wasavi.send(':marks\n');
	console.log(Wasavi.lastMessage);
	assertEquals('#3-1', [
		'*** marks ***',
		'mark  line   col   text',
		'====  =====  ====  ====',
		" '        1     0  1 first",
		' a        1     0  1 first',
		' b        2     0  2 second'
	].join('\n'), Wasavi.lastMessage);
}

function testMove () {
	Wasavi.send('i1\n2\n3\n4\n5\u001b');

	/*
	 * test #1: move to lower
	 *
	 * 1 *       1
	 * 2         3
	 * 3 +  -->  4
	 * 4 +       5
	 * 5 +       2
	 */
	Wasavi.send(':3,5move1\n');
	assertEquals('#1-1', '1\n3\n4\n5\n2', Wasavi.value);
	assertPos('#1-2', [3, 0]);
	Wasavi.send('u');
	assertEquals('#1-3', '1\n2\n3\n4\n5', Wasavi.value);
	Wasavi.send('\u0012');
	assertEquals('#1-4', '1\n3\n4\n5\n2', Wasavi.value);
	Wasavi.send('u');

	/*
	 * test #2: move to top
	 *   *
	 * 1         3
	 * 2         4
	 * 3 +  -->  5
	 * 4 +       1
	 * 5 +       2
	 */

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

	/*
	 * test #4: move to upper
	 *
	 * 1 +       4
	 * 2 +       1
	 * 3 +  -->  2
	 * 4 *       3
	 * 5         5
	 */

	/*
	 * test #5: move to tail
	 *
	 * 1 +       4
	 * 2 +       5
	 * 3 +  -->  1
	 * 4         2
	 * 5 *       3
	 */
}

/* vim:set ts=4 sw=4 fileencoding=UTF-8 fileformat=unix filetype=javascript : */
