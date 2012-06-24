/**
 * wasavi: vi clone implemented in javascript
 * =============================================================================
 *
 *
 * @author akahuku@gmail.com
 * @version $Id: excommands.js 143 2012-06-24 05:49:44Z akahuku $
 */

/**
 * tests
 */

function testAddressAll () {
	Wasavi.send('i1\n2\n3\u001b');
	Wasavi.send(':%p\n');
	assertEquals('#1-1', '1\n2\n3', Wasavi.lastMessage);

	Wasavi.send(':% +1p\n');
	assert('#2-1', Wasavi.lastMessage != '');
}

function testNull () {
	Wasavi.send('i1\n2\n3\u001b');

	Wasavi.send('2G:\n');
	assertEquals('#1-1', '', Wasavi.lastMessage);
	assertPos('#1-2', [1, 0]);

	Wasavi.send(':||\n');
	assertEquals('#2-1', '2\n2', Wasavi.lastMessage);
}

function testAddressCurrent () {
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

function testAddressLast () {
	Wasavi.send('i1\n2\n3\u001b');
	Wasavi.send(':$p\n');
	assertEquals('#1-1', '3', Wasavi.lastMessage);
}

function testAddressInteger () {
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

function testAddressMark () {
	Wasavi.send('i1\n2\n3\n4\u001b');

	Wasavi.send('4Gma1G:\'ap\n');
	assertEquals('#1-1', '4', Wasavi.lastMessage);
	assertPos('#1-2', [3, 0]);
}

function testAddressOffsetInteger () {
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

function testAddressSearchForward () {
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

function testAddressSearchBackward () {
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

function testRangeStatic () {
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

function testRangeDynamic () {
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

function testRangeTooManyAddress () {
	Wasavi.send('i1\n2\n3\u001b');
	Wasavi.send(':1,2,3p\n');
	assertEquals('#1-1', '2\n3', Wasavi.lastMessage);
}

function testImplicitAddress () {
	Wasavi.send('i1\n2\n3\u001b');
	Wasavi.send('2G:||\n');
	assertEquals('#1-1', '2\n2', Wasavi.lastMessage);
}

function testNumericAddress () {
	Wasavi.send('i1\n2\n3\n4\n5\u001b');

	Wasavi.send(':1\n');
	assertPos('#1-1', [0, 0]);

	Wasavi.send(':+2\n');
	assertPos('#2-1', [2, 0]);

	Wasavi.send('1G:/5/\n');
	assertPos('#3-1', [4, 0]);
	assertEquals('#3-2', '', Wasavi.lastMessage);

	Wasavi.send('1G:/5\n');
	assertPos('#4-1', [4, 0]);
	assertEquals('#4-2', '', Wasavi.lastMessage);
}

function testAbbreviate () {
	Wasavi.send(':abbreviate [clear]\n');
	Wasavi.send(':abbreviate\n');
	assertEquals('#1-1', 'No abbreviations are defined.', Wasavi.lastMessage);

	Wasavi.send(':abbreviat test\n');
	assertEquals('#2-1', 'No abbreviations are defined.', Wasavi.lastMessage);

	Wasavi.send(':abbrevia foo? bar\n');
	assertEquals('#3-1',
		'abbreviate: The keyword of abbreviation must end with a word character.', 
		Wasavi.lastMessage);

	Wasavi.send(':abbrevi foo bar\n');
	assert('#4-1', Wasavi.lastMessage == '');
	Wasavi.send(':abbre\n');
	assertEquals('#4-2', [
		'*** abbreviations ***',
		'foo\tbar'
	].join('\n'), Wasavi.lastMessage);

	Wasavi.send(':abbr bar BAZ\n');
	Wasavi.send(':abbr foo\n');
	assertEquals('#5-1', [
		'*** abbreviations ***',
		'foo\tbar'
	].join('\n'), Wasavi.lastMessage);
	Wasavi.send(':abbr\n');
	assertEquals('#5-2', [
		'*** abbreviations ***',
		'bar\tBAZ',
		'foo\tbar'
	].join('\n'), Wasavi.lastMessage);

	Wasavi.send(':abb [clear]\n');
	Wasavi.send(':ab\n');
	assertEquals('#6-1', 'No abbreviations are defined.', Wasavi.lastMessage);
}

function testAbbreviateAction () {
	Wasavi.send(':ab foo FOO\n');
	Wasavi.send('ifoo bar foo\u001b');
	assertEquals('#1-1', 'FOO bar FOO', Wasavi.value);

	Wasavi.send(':unab foo\n');
}

function testCopyBadDest () {
	Wasavi.send('i1\n2\n3\n4\n5\u001b');

	/*
	 * should be an error if destination address does not specified
	 */
	Wasavi.send(':1copy\n');
	assertEquals('#1-1', 'copy: Invalid argument.', Wasavi.lastMessage);
}

function testCopyZeroSource () {
	Wasavi.send('i1\n2\n3\u001b');

	Wasavi.send(':0copy2\n');
	assertEquals('#1-1', '1\n2\n1\n3', Wasavi.value);
}

function testCopyToLower () {
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

function testCopyToLowerSpecial () {
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

function testCopyToInsideRange () {
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

function testCopyToUpper () {
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

function testCopyToUpperSpecial () {
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

function testDelete () {
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

function testDeleteZeroSource () {
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

function testDeleteTail () {
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

function testDeleteByCount () {
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

function testDeleteByCountWithRange () {
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

function testGlobal () {
	Wasavi.send('i1 x\n2 y\n3 z\n4 x\n5 y\n6 z\u001b');

	// if range does not specified, all of text should be processed.
	Wasavi.send(':g/\\d/p\n');
	assertEquals('#1-1', '1 x\n2 y\n3 z\n4 x\n5 y\n6 z', Wasavi.lastMessage);
	assertPos('#1-2', [5, 0]);
}

function testGlobalRanged () {
	Wasavi.send('i1 x\n2 y\n3 z\n4 x\n5 y\n6 z\u001b');

	// ranged
	Wasavi.send(':3,5g/x/p\n');
	assertEquals('#1-1', '4 x', Wasavi.lastMessage);
	assertPos('#1-2', [3, 0]);
}

function testGlobalZeroMatch () {
	Wasavi.send('i1 x\n2 y\n3 z\n4 x\n5 y\n6 z\u001b');

	// zero match regexp
	Wasavi.send(':g/^/p\n');
	assertEquals('#1-1', '1 x\n2 y\n3 z\n4 x\n5 y\n6 z', Wasavi.lastMessage);
	assertPos('#1-2', [5, 0]);
}

function testGlobalWithEmptyCommand () {
	Wasavi.send('i1\n2\n3\u001b');
	Wasavi.send(':g/./\n');
	assertEquals('#1-1', '1\n2\n3', Wasavi.value);
	assertEquals('#1-2', '', Wasavi.lastMessage);
	assertPos('#1-3', [2, 0]);
}

function testGlobalDelete () {
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

function testGlobalDeleteSpecial () {
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

function testGlobalWithNestDeniedCommand () {
	Wasavi.send('i1\n2\n3\u001b');

	Wasavi.send(':g/./g/./d\n');
	assertEquals('#1-1', 'Cannot use the global or v command recursively.', Wasavi.lastMessage);
	assertEquals('#1-2', '1\n2\n3', Wasavi.value);
}

function testJoinWithCount () {
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

function testJoinWithNoCount () {
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

function testMark () {
	Wasavi.send('i1\n2\n3\u001b');

	Wasavi.send(':2G\n:k\n');
	assertEquals('#1-1', 'k: Invalid argument.', Wasavi.lastMessage);

	Wasavi.send(':3G\n:ka\n');
	Wasavi.send(':1\n:\'a\n');
	assertPos('#2-1', [2, 0]);
}

function testMap () {
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

function testMapUnique () {
	Wasavi.send(':map [clear]\n');
	Wasavi.send(':map Q G\ni1\n2\n3\u001bgg');
	assertPos('#1-1', [0, 0]);
	Wasavi.send('Q');
	assertPos('#2-1', [2, 0]);

	Wasavi.send(':map <f1> <esc>if1\u0016\u0016 key\u0016\u0016 pressed<esc>\n');
	Wasavi.send(Wasavi.SPECIAL_KEYS.F1);
	assertEquals('#3-1', '1\n2\nf1 key pressed3', Wasavi.value);
}

function testMapAmbiguous () {
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

function testNestedMap () {
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

function testEditMapUnique () {
	Wasavi.send(':map! [clear]\n');
	Wasavi.send(':map! Q quick\u0016\u0016 brown\u0016\u0016 fox\n');

	Wasavi.send('iQ!\u001b');
	assertEquals('#1-1', 'quick brown fox!', Wasavi.value);
}

function testMark2 () {
	Wasavi.send('i1\n2\n3\u001b');

	Wasavi.send(':2G\n:mark\n');
	assertEquals('#1-1', 'mark: Invalid argument.', Wasavi.lastMessage);

	Wasavi.send(':3G\n:mark a\n');
	Wasavi.send(':1\n:\'a\n');
	assertPos('#2-1', [2, 0]);
}

function testMarks () {
	Wasavi.send('i1 first\n2 second\n3 third\u001b');

	Wasavi.send(':marks\n');
	assertEquals('#1-1', [
		'*** marks ***',
		'mark  line   col   text',
		'====  =====  ====  ===='
	].join('\n'), Wasavi.lastMessage);

	Wasavi.send('1G1|:mark a\n');
	Wasavi.send(':marks\n');
	assertEquals('#2-1', [
		'*** marks ***',
		'mark  line   col   text',
		'====  =====  ====  ====',
		" '        3     6  3 third",
		' a        1     0  1 first'
	].join('\n'), Wasavi.lastMessage);

	Wasavi.send('2G2|:mark b\n');
	Wasavi.send(':marks\n');
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
	 * 4 +       5.
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
	assertEquals('#1-5', '1\n2\n3\n4\n5', Wasavi.value);

	/*
	 * test #2: move to top
	 *   *
	 * 1         3
	 * 2         4
	 * 3 +  -->  5.
	 * 4 +       1
	 * 5 +       2
	 */
	Wasavi.send(':3,5move0\n');
	assertEquals('#2-1', '3\n4\n5\n1\n2', Wasavi.value);
	assertPos('#2-2', [2, 0]);
	Wasavi.send('u');
	assertEquals('#2-3', '1\n2\n3\n4\n5', Wasavi.value);
	Wasavi.send('\u0012');
	assertEquals('#2-4', '3\n4\n5\n1\n2', Wasavi.value);
	Wasavi.send('u');
	assertEquals('#2-5', '1\n2\n3\n4\n5', Wasavi.value);

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
	[2, 3, 4, 5].forEach(function (dest, i) {
		Wasavi.send(':3,5mov' + dest + '\n');
		if (dest == 2 || dest == 5) {
			assertEquals('#3-1(' + dest + ')', '1\n2\n3\n4\n5', Wasavi.value);
			Wasavi.send('u');
			assertEquals('#3-2(' + dest + ')', '1\n2\n3\n4\n5', Wasavi.value);
		}
		else {
			assertEquals('#3-3(' + dest + ')', 
				'move: Destination is in inside source.', Wasavi.lastMessage);
		}
	});
	assertEquals('#3-4', '1\n2\n3\n4\n5', Wasavi.value);

	/*
	 * test #4: move to upper
	 *
	 * 1 +       4 *      4
	 * 2 +       5        1
	 * 3 +  -->      -->  2
	 * 4 *                3.
	 * 5                  5
	 */
	Wasavi.send(':1,3move4\n');
	assertEquals('#4-1', '4\n1\n2\n3\n5', Wasavi.value);
	assertPos('#4-2', [3, 0]);
	Wasavi.send('u');
	assertEquals('#4-3', '1\n2\n3\n4\n5', Wasavi.value);
	Wasavi.send('\u0012');
	assertEquals('#4-4', '4\n1\n2\n3\n5', Wasavi.value);
	Wasavi.send('u');
	assertEquals('#4-5', '1\n2\n3\n4\n5', Wasavi.value);

	/*
	 * test #5: move to tail
	 *
	 * 1 +       4        4
	 * 2 +       5 *      5
	 * 3 +  -->      -->  1
	 * 4                  2
	 * 5 *                3.
	 */
	Wasavi.send(':1,3move5\n');
	assertEquals('#5-1', '4\n5\n1\n2\n3', Wasavi.value);
	assertPos('#5-2', [4, 0]);
	Wasavi.send('u');
	assertEquals('#5-3', '1\n2\n3\n4\n5', Wasavi.value);
	Wasavi.send('\u0012');
	assertEquals('#5-4', '4\n5\n1\n2\n3', Wasavi.value);
	Wasavi.send('u');
	assertEquals('#5-5', '1\n2\n3\n4\n5', Wasavi.value);
}

function testPrint () {
	Wasavi.send('i1\t$\u0016\u0010\\\n2\n3\n4\n5\u001b');

	Wasavi.send(':print\n');
	assertEquals('#1-1', '5', Wasavi.lastMessage);

	Wasavi.send(':1,2print\n');
	assertEquals('#2-1', '1\t$\u0010\\\n2', Wasavi.lastMessage);

	Wasavi.send(':2\n');
	Wasavi.send(':print3\n');
	assertEquals('#3-1', '2\n3\n4', Wasavi.lastMessage);

	Wasavi.send(':1,3print2\n');
	assertEquals('#4-1', '3\n4', Wasavi.lastMessage);

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
	Wasavi.send(':1p l\n')
	assertEquals('#5-1', '1\t\\$\\020\\\\$', Wasavi.lastMessage);

	/*
	 * number command
	 *
	 * number format: sprintf("%6d  ", line_number)
	 */
	Wasavi.send(':1p #\n');
	assertEquals('#6-1', '     1  1\t$\u0010\\', Wasavi.lastMessage);

	/*
	 * number + line command
	 */
	Wasavi.send(':1p #l\n');
	assertEquals('#7-1', '     1  1\t\\$\\020\\\\$', Wasavi.lastMessage);
	Wasavi.send(':1p #lp\n');
	assertEquals('#7-2', '     1  1\t\\$\\020\\\\$', Wasavi.lastMessage);
}

function testPut () {
	Wasavi.send('i', 'foo\nbar', Wasavi.SPECIAL_KEYS.ESCAPE);

	Wasavi.send('1G1|yy');
	Wasavi.send(':put\n');
	assertEquals('#1-1', 'foo\nfoo\nbar', Wasavi.value);
	assertPos('#1-2', [1, 0]);

	Wasavi.send('1G1|yw');
	Wasavi.send(':put\n');
	assertEquals('#2-1', 'foo\nfoo\nfoo\nbar', Wasavi.value);
	assertPos('#2-2', [1, 0]);

	Wasavi.send('G"ayy');
	Wasavi.send(':2pu a\n');
	assertEquals('#3-1', 'foo\nfoo\nbar\nfoo\nbar', Wasavi.value);
	assertPos('#3-2', [2, 0]);

	Wasavi.send(':pu z\n');
	assertEquals('#4-1', 'foo\nfoo\nbar\nfoo\nbar', Wasavi.value);
	assertPos('#4-2', [2, 0]);
	assertEquals('#4-3', 'put: Register z is empty.', Wasavi.lastMessage);
}

function testQuit () {
	Wasavi.send(':quit\n');
	assertFalse('#1-1', Wasavi.running);
}

function testQuitForce () {
	Wasavi.send('ifoo\u001b');

	Wasavi.send(':qui\n');
	assert(Wasavi.running);
	assertEquals('#1-1', 'quit: The text has been modified; use :quit! to discard any changes.', Wasavi.lastMessage);

	Wasavi.send(':qu!\n');
	assertFalse('#2-1', Wasavi.running);
}

function testUndoAndRedo () {
	Wasavi.send(':undo\n');
	assertEquals('#1-1', 'undo: No undo item.', Wasavi.lastMessage);

	Wasavi.send('i1\n2\n3\u001b');
	assertEquals('#2-1', '1\n2\n3', Wasavi.value);

	Wasavi.send(':undo\n');
	assertEquals('#3-1', '', Wasavi.value);

	Wasavi.send(':redo\n');
	assertEquals('#4-1', '1\n2\n3', Wasavi.value);

	Wasavi.send(':redo\n');
	assertEquals('#5-1', 'redo: No redo item.', Wasavi.lastMessage);
}

function testSubst () {
	Wasavi.send('ia a\nb b b\n\nc\nd\u001b');

	Wasavi.send('1G:s/a/A\n');
	assertEquals('#1-1', 'A a\nb b b\n\nc\nd', Wasavi.value);
	Wasavi.send('u');
	assertEquals('#1-2', 'a a\nb b b\n\nc\nd', Wasavi.value);
	Wasavi.send('\u0012');
	assertEquals('#1-3', 'A a\nb b b\n\nc\nd', Wasavi.value);
	Wasavi.send('u');
	assertEquals('#1-4', 'a a\nb b b\n\nc\nd', Wasavi.value);

	Wasavi.send('2G:s/b/B/g\n');
	assertEquals('#2-1', 'a a\nB B B\n\nc\nd', Wasavi.value);
	Wasavi.send('u');
	assertEquals('#2-2', 'a a\nb b b\n\nc\nd', Wasavi.value);
	Wasavi.send('\u0012');
	assertEquals('#2-3', 'a a\nB B B\n\nc\nd', Wasavi.value);
	Wasavi.send('u');
	assertEquals('#2-4', 'a a\nb b b\n\nc\nd', Wasavi.value);

	/*
	 * a a   +        a a
	 * b b b +        b b b
	 *       ++  -->
	 * c      +       ?
	 * d
	 */
	Wasavi.send(':1,3s/[a-d]/?/g2\n');
	assertEquals('#4-1', 'a a\nb b b\n\n?\nd', Wasavi.value);
	Wasavi.send('u');
	assertEquals('#4-2', 'a a\nb b b\n\nc\nd', Wasavi.value);
	Wasavi.send('\u0012');
	assertEquals('#4-3', 'a a\nb b b\n\n?\nd', Wasavi.value);
	Wasavi.send('u');
	assertEquals('#4-4', 'a a\nb b b\n\nc\nd', Wasavi.value);
}

function testSubstPatternOmit () {
	Wasavi.send(':sushi\n');
	Wasavi.send('i1\n2\n3\u001b');

	Wasavi.send(':s//foo\n');
	assertEquals('#1-1', 's: No previous search pattern.', Wasavi.lastMessage);

	Wasavi.send('gg/\\d\n');
	assertPos('#2-1', [1, 0]);
	Wasavi.send(':s//foo\n');
	assertEquals('#2-2', '1\nfoo\n3', Wasavi.value);
}

function testSubstReplOmit () {
	Wasavi.send(':sushi\n');
	Wasavi.send('i1\n2\n3\u001b');

	Wasavi.send(':s/\\d//\n');
	assertEquals('#1-1', '1\n2\n', Wasavi.value);
}

function testSubstOmitAll () {
	Wasavi.send(':sushi\n');
	Wasavi.send('i1\n2\n3\u001b');

	Wasavi.send(':s//\n');
	assertEquals('#1-1', 's: No previous substitution.', Wasavi.lastMessage);

	Wasavi.send(':s/\\d/foo\n');
	assertEquals('#2-1', '1\n2\nfoo', Wasavi.value);
	Wasavi.send(':1\n');
	Wasavi.send(':s//\n');
	assertEquals('#2-2', 'foo\n2\nfoo', Wasavi.value);
}

function testSubstLastReplacement () {
	Wasavi.send(':sushi\n');
	Wasavi.send('i1\n2\n3\u001b');

	Wasavi.send(':s/\\d/%\n');
	assertEquals('#1-1', 's: No previous substitution.', Wasavi.lastMessage);

	Wasavi.send(':s/\\d/!\n');
	assertEquals('#2-1', '1\n2\n!', Wasavi.value);
	Wasavi.send(':1\n');
	Wasavi.send(':s/\\d/%\n');
	assertEquals('#2-2', '!\n2\n!', Wasavi.value);
}

function testSubstTilde () {
	Wasavi.send(':sushi\n');
	Wasavi.send('i1\n2\n3\u001b');

	Wasavi.send(':s/\\d/~\n');
	assertEquals('#1-1', 's: No previous substitution.', Wasavi.lastMessage);

	Wasavi.send(':s/\\d/$\n');
	assertEquals('#2-1', '1\n2\n$', Wasavi.value);
	Wasavi.send(':1\n');
	Wasavi.send(':s/\\d/~!!\n');
	assertEquals('#2-2', '$!!\n2\n$', Wasavi.value);

	Wasavi.send(':2\n');
	Wasavi.send(':s/\\d/%\n');
	/*
	 * different from vim.
	 * vim's result is $!!\n$!!!!\n$
	 */
	assertEquals('#3-1', '$!!\n$!!\n$', Wasavi.value);
}

function testSubstQueried () {
	Wasavi.send('ifirst\nsecond\nthird\u001b');

	Wasavi.send('1G:%s/i/I/gc\n');
	Wasavi.send('yy');
	assertEquals('#1-1', '2 substitutions on 3 lines.', Wasavi.lastMessage);
	assertEquals('#1-2', 'fIrst\nsecond\nthIrd', Wasavi.value);
	assertPos('#1-3', [2, 0]);

	Wasavi.send('u');
	assertEquals('#2-1', 'fIrst\nsecond\nthird', Wasavi.value);

	Wasavi.send('u');
	assertEquals('#3-1', 'first\nsecond\nthird', Wasavi.value);
}

function testSubstQueriedNonMatch () {
	Wasavi.send('ifirst\nsecond\nthird\u001b');

	Wasavi.send('2G3|');
	Wasavi.send(':%s/foo/bar/gc\n');
	assertPos('#1-1', [1, 2]);

	Wasavi.send('1G1|');
	Wasavi.send(':%s/i/!/gc\n');
	Wasavi.send('yn');
	assertPos('#2-1', [2, 0]);
}

function testSubstNewline () {
	Wasavi.send('i1\n2\n3\n4\u001b');
	Wasavi.send(':%s/\\d/&\\nline/g\n');
	assertEquals('#1-1', '1\nline\n2\nline\n3\nline\n4\nline', Wasavi.value);
	assertPos('#1-2', [7, 0]);

	Wasavi.send(':1\n');
	Wasavi.send(':s/\\d/&\u0016\u000dLINE/g\n');
	assertEquals('#2-1', '1\nLINE\nline\n2\nline\n3\nline\n4\nline', Wasavi.value);
	assertPos('#2-2', [1, 0]);
}

function testSubstBackref () {
	Wasavi.send('ifunction foo () {}\u001b');
	Wasavi.send(':s/\\(function\\)\\s\\+\\(\\w\\+\\)\\(.*\\)/var \\2=\\1\\3\n');
	assertEquals('#1-1', 'var foo=function () {}', Wasavi.value);
}

function testSubstLower () {
	Wasavi.send('iFIRST\nSECOND\nTHIRD\u001b');
	Wasavi.send(':%s/\\w\\+/\\l&/g\n');
	assertEquals('#1-1', 'fIRST\nsECOND\ntHIRD', Wasavi.value);

	Wasavi.send('u');
	assertEquals('#2-1', 'FIRST\nSECOND\nTHIRD', Wasavi.value);
	Wasavi.send(':%s/\\w\\+/\\L&/g\n');
	assertEquals('#2-2', 'first\nsecond\nthird', Wasavi.value);

	Wasavi.send('u');
	assertEquals('#3-1', 'FIRST\nSECOND\nTHIRD', Wasavi.value);
	Wasavi.send(':%s/\\w\\+/\\L&\\E \\lLine/g\n');
	assertEquals('#3-2', 'first line\nsecond line\nthird line', Wasavi.value);
}

function testSubstUpper () {
	Wasavi.send('ifirst\nsecond\nthird\u001b');
	Wasavi.send(':%s/\\w\\+/\\u&/g\n');
	assertEquals('#1-1', 'First\nSecond\nThird', Wasavi.value);

	Wasavi.send('u');
	assertEquals('#2-1', 'first\nsecond\nthird', Wasavi.value);
	Wasavi.send(':%s/\\w\\+/\\U&/g\n');
	assertEquals('#2-2', 'FIRST\nSECOND\nTHIRD', Wasavi.value);

	Wasavi.send('u');
	assertEquals('#3-1', 'first\nsecond\nthird', Wasavi.value);
	Wasavi.send(':%s/\\w\\+/\\U&\\E \\uline/g\n');
	assertEquals('#3-2', 'FIRST Line\nSECOND Line\nTHIRD Line', Wasavi.value);
}

function testSubstAnd () {
	Wasavi.send(':sushi\n');
	Wasavi.send('i1\n2\n3\u001b');

	Wasavi.send(':&\n');
	assertEquals('#1-1', '&: No previous search pattern.', Wasavi.lastMessage);

	Wasavi.send('1G:s/\\d/!/c\ny');
	assertEquals('#2-1', '!\n2\n3', Wasavi.value);

	Wasavi.send('2G:&\n');
	assertEquals('#3-1', '!\n!\n3', Wasavi.value);

	Wasavi.send(':%&g\n');
	assertEquals('#4-1', '!\n!\n!', Wasavi.value);
}

function testSubstAnd2 () {
	Wasavi.send(':sushi\n');
	Wasavi.send('i1\n2\n3\u001b');

	Wasavi.send('&');
	assertEquals('#1-1', '&: No previous search pattern.', Wasavi.lastMessage);

	Wasavi.send('1G:s/\\d/!/c\ny');
	assertEquals('#2-1', '!\n2\n3', Wasavi.value);

	Wasavi.send('2G&');
	assertEquals('#3-1', '!\n!\n3', Wasavi.value);
}

function testSubstTilde () {
	Wasavi.send(':sushi\n');
	Wasavi.send('i1\n2\n3\u001b');

	Wasavi.send(':~\n');
	assertEquals('#1-1', '~: No previous search pattern.', Wasavi.lastMessage);

	Wasavi.send('1G:s/\\d/&!/c\ny');
	assertEquals('#2-1', '1!\n2\n3', Wasavi.value);

	Wasavi.send('2G:~\n');
	assertEquals('#3-1', '1!\n2!\n3', Wasavi.value);

	Wasavi.send(':%~g\n');
	assertEquals('#4-1', '1!!\n2!!\n3!', Wasavi.value);

	Wasavi.send('1G/!\n');
	Wasavi.send(':%~g\n');
	assertEquals('#5-1', '1!!!!\n2!!!!\n3!!', Wasavi.value);
}

function testSet () {
	Wasavi.send(':set\n\n');
	console.log(Wasavi.lastMessage);
	assert('#1-1', Wasavi.lastMessage.indexOf('*** options ***\n') == 0);

	Wasavi.send(':set all\n\n');
	assert('#2-1', Wasavi.lastMessage.indexOf('*** options ***\n') == 0);

	Wasavi.send(':set foobar\n');
	assertEquals('#3-1', 'Unknown option: foobar', Wasavi.lastMessage);

	Wasavi.send(':set redraw\n');
	assertEquals('#4-1', '', Wasavi.lastMessage);
	Wasavi.send(':set redraw?\n');
	assertEquals('#4-2', '  redraw', Wasavi.lastMessage);

	Wasavi.send(':set noredraw\n');
	assertEquals('#5-1', '', Wasavi.lastMessage);
	Wasavi.send(':set redraw?\n');
	assertEquals('#5-2', 'noredraw', Wasavi.lastMessage);
	
	Wasavi.send(':set redraw=5\n');
	assertEquals(
		'#6-1', 
		'An extra value assigned to redraw option: redraw=5', 
		Wasavi.lastMessage);

	Wasavi.send(':set report=10\n');
	assertEquals('#7-1', '', Wasavi.lastMessage);
	Wasavi.send(':set report ?\n');
	assertEquals('#7-2', '  report=10', Wasavi.lastMessage);
	Wasavi.send(':set report = 6\n');
	assertEquals('#7-3', 'Invalid integer value: report=', Wasavi.lastMessage);
	Wasavi.send(':set report =6\n');
	assertEquals('#7-4', '', Wasavi.lastMessage);
	Wasavi.send(':set report\n');
	assertEquals('#7-5', '  report=6', Wasavi.lastMessage);
}

function testRegisters () {
	Wasavi.send(':registers\n');
	assertEquals('#1-1', [
		'*** registers ***',
		'""  C  '
	].join('\n'), Wasavi.lastMessage);

	Wasavi.send('i1\n2\n3\u001b');
	Wasavi.send('yy');
	Wasavi.send(':reg\n');
	assertEquals('#2-1', [
		'*** registers ***',
		'""  L  3^J',
		'".  C  1^J2^J3',
		'":  C  registers'
	].join('\n'), Wasavi.lastMessage);
}

function testUnabbreviate () {
	Wasavi.send(':ab foo bar\n:ab\n');
	assertEquals('#1-1', [
		'*** abbreviations ***',
		'foo\tbar'
	].join('\n'), Wasavi.lastMessage);

	Wasavi.send(':unabbreviate\n');
	assertEquals('#2-1', 'unabbreviate: Invalid argument.', Wasavi.lastMessage);

	Wasavi.send(':unabb xyz\n');
	assertEquals('#3-1', 'unabbreviate: xyz is not an abbreviation.', Wasavi.lastMessage);

	Wasavi.send(':unabb foo\n');
	assertEquals('#4-1', '', Wasavi.lastMessage);

	Wasavi.send(':ab\n');
	assertEquals('#5-1', 'No abbreviations are defined.', Wasavi.lastMessage);
}

function testUnmap () {
	Wasavi.send(':map [clear]\n');
	Wasavi.send(':unmap\n');
	assertEquals('#1-1', 'unmap: Invalid argument.', Wasavi.lastMessage);

	Wasavi.send(':map H ^\n');
	Wasavi.send(':map\n');
	assertEquals('#1-1', [
		'*** command mode map ***',
		'H\t^'
	].join('\n'), Wasavi.lastMessage);

	Wasavi.send(':unma xyz\n');
	assertEquals('#2-1', 'unmap: xyz is not mapped.', Wasavi.lastMessage);

	Wasavi.send(':unm H\n');
	Wasavi.send(':map\n');
	assertEquals('#3-1', 'No mappings for command mode are defined.', Wasavi.lastMessage);
}

function testVersion () {
	Wasavi.send(':version\n');
	assert('#1-1', /^wasavi\/\d+\.\d+\.\d+/.test(Wasavi.lastMessage));
}

function testInvertedGlobal () {
	Wasavi.send('i1 x\n2\n3 z\n4 x\n5 y\n6 z\u001b');

	// if range does not specified, all of text should be processed.
	Wasavi.send(':v/x/p\n');
	console.log(Wasavi.lastMessage);
	assertEquals('#1-1', '2\n3 z\n5 y\n6 z', Wasavi.lastMessage);
	assertPos('#1-2', [5, 0]);
}

function testInvertedGlobalRanged () {
	Wasavi.send('i1 x\n2 y\n3 z\n4 x\n5 y\n6 z\u001b');

	// ranged
	Wasavi.send(':3,5v/x/p\n');
	assertEquals('#1-1', '3 z\n5 y', Wasavi.lastMessage);
	assertPos('#1-2', [4, 0]);
}

function testInvertedGlobalZeroMatch () {
	Wasavi.send('i1 x\n2 y\n3 z\n4\n5\u001b');

	// zero match regexp
	/*
	 * 1 x
	 * 2 y +
	 * 3 z +
	 * 4   +
	 * 5
	 */
	console.log('testInvertedGlobalZeroMatch');
	Wasavi.send(':2,4v/^/p\n');
	assertEquals('#1-1', 'v: Pattern found in every line: ^', Wasavi.lastMessage);
	assertPos('#1-2', [4, 0]);
}

function testInvertedGlobalWithEmptyCommand () {
	Wasavi.send('ia\nb\nc\u001b');
	Wasavi.send(':v/b/\n');
	assertEquals('#1-1', 'a\nb\nc', Wasavi.value);
	assertEquals('#1-2', '', Wasavi.lastMessage);
	assertPos('#1-3', [2, 0]);
}

function testWrite () {
	var result;
	Wasavi.events.onSaved = function (e) {result = e.value;};
	try {
		Wasavi.send('ifoobar\u001b');
		Wasavi.send(':write\n');
		assertEquals('#1-1', 'foobar', result);
	}
	finally {
		Wasavi.events.onSaved = null;
	}
}

function testWriteToFile () {
	Wasavi.send(':writ foobar\n');
	// not implemented, for now
	assertEquals('#1-1', 'write: Specifying file name is not implemented.', Wasavi.lastMessage);
}

function testWriteToFileAppend () {
	Wasavi.send(':wri >>\n');
	// not implemented, for now
	assertEquals('#1-1', 'write: Appending is not implemented.', Wasavi.lastMessage);
}

function testWriteRedirect () {
	Wasavi.send(':wri !foobar\n');
	// not implemented, for now
	assertEquals('#1-1', 'write: Command redirection is not implemented.', Wasavi.lastMessage);
}

function testWriteReadonlyWarning () {
	Wasavi.send(':set readonly\n');
	Wasavi.send(':w\n');
	assertEquals('#1-1', 'write: Readonly option is set (use "!" to override).', Wasavi.lastMessage);
}

function testWriteAndQuit () {
	var result;
	Wasavi.events.onSaved = function (e) {result = e.value;};
	try {
		Wasavi.send('ifoobar\u001b');
		Wasavi.send(':wq\n');
		assertEquals('#1-1', 'foobar', result);
		assertFalse(Wasavi.running);
	}
	finally {
		Wasavi.events.onSaved = null;
	}
}

function testExitModified () {
	var result;
	Wasavi.events.onSaved = function (e) {result = e.value;};
	try {
		Wasavi.send('ifoobar\u001b');
		Wasavi.send(':xit\n');
		assertEquals('#1-1', 'foobar', result);
		assertFalse(Wasavi.running);
	}
	finally {
		Wasavi.events.onSaved = null;
	}
}

function testExitNotModified () {
	var result;
	Wasavi.events.onSaved = function (e) {result = e.value;};
	try {
		Wasavi.send(':xit\n');
		assertUndefined('#1-1', result);
		assertFalse(Wasavi.running);
	}
	finally {
		Wasavi.events.onSaved = null;
	}
}

function testYank () {
	Wasavi.send('i\t1\n2\n3\u001b');
	Wasavi.send('1G1|');
	assertPos('#1-1', [0, 0]);

	Wasavi.send(':yank\n');
	assertEquals('#2-1', '\t1\n', Wasavi.registers('"'));
	assertPos('#2-2', [0, 0]);

	Wasavi.send(':1,2yan a\n');
	assertEquals('#3-1', '\t1\n2\n', Wasavi.registers('a'));
	assertPos('#3-2', [0, 0]);

	Wasavi.send(':ya10\n');
	assertEquals('#4-1', '\t1\n2\n3\n', Wasavi.registers('"'));
	assertPos('#4-2', [0, 0]);
}

function testShift () {
	Wasavi.send(':set sw=8\n');
	Wasavi.send('i\t1\n2\n3\u001b');
	Wasavi.send('1G1|');
	assertPos('#1-1', [0, 0]);

	Wasavi.send(':>\n');
	assertEquals('#2-1', '\t\t1\n2\n3', Wasavi.value);
	assertPos('#2-2', [0, 2]);

	Wasavi.send(':undo\n');
	assertEquals('#3-1', '\t1\n2\n3', Wasavi.value);

	Wasavi.send(':redo\n');
	assertEquals('#4-1', '\t\t1\n2\n3', Wasavi.value);
}

function testShiftMulti () {
	Wasavi.send(':set sw=8\n');
	Wasavi.send('i\t1\n2\n3\u001b');
	Wasavi.send('1G1|');
	assertPos('#1-1', [0, 0]);

	Wasavi.send(':>>2\n');
	assertEquals('#2-1', '\t\t\t1\n\t\t2\n3', Wasavi.value);
	assertPos('#2-2', [1, 2]);

	Wasavi.send(':undo\n');
	assertEquals('#3-1', '\t1\n2\n3', Wasavi.value);

	Wasavi.send(':redo\n');
	assertEquals('#4-1', '\t\t\t1\n\t\t2\n3', Wasavi.value);
}

function testUnshift () {
	Wasavi.send(':set sw=8\n');
	Wasavi.send('i\t\t1\n\t2\n3\u001b');
	Wasavi.send('1G1|');
	assertPos('#1-1', [0, 0]);

	Wasavi.send(':<\n');
	assertEquals('#2-1', '\t1\n\t2\n3', Wasavi.value);
	assertPos('#2-2', [0, 1]);

	Wasavi.send(':undo\n');
	assertEquals('#3-1', '\t\t1\n\t2\n3', Wasavi.value);

	Wasavi.send(':redo\n');
	assertEquals('#4-1', '\t1\n\t2\n3', Wasavi.value);
}

function testUnshiftMulti () {
	Wasavi.send(':set sw=8\n');
	Wasavi.send('i\t\t\t1\n\t2\n3\u001b');
	Wasavi.send('1G1|');
	assertPos('#1-1', [0, 0]);

	Wasavi.send(':<<2\n');
	assertEquals('#2-1', '\t1\n2\n3', Wasavi.value);
	assertPos('#2-2', [1, 0]);

	Wasavi.send(':undo\n');
	assertEquals('#3-1', '\t\t\t1\n\t2\n3', Wasavi.value);

	Wasavi.send(':redo\n');
	assertEquals('#4-1', '\t1\n2\n3', Wasavi.value);
}

function testExecuteRegister () {
	Wasavi.send('is/\\d/\tfoo\u0016\u001b\\n\u0016\u0009\u001b');
	assertEquals('#1-1', 's/\\d/\tfoo\u001b\\n\t', Wasavi.value);
	Wasavi.send('"ayy');
	assertEquals('#1-2', 's/\\d/\tfoo\u001b\\n\t\n', Wasavi.registers('a'));
	Wasavi.send('u');
	assertEquals('#1-3', '', Wasavi.value);
	assertPos('#1-4', [0, 0]);

	Wasavi.send('i1\n2\n3\u001b', Wasavi.value);
	Wasavi.send(':%@a\n');
	assertEquals('#2-1', '1\n2\n\tfoo\u001b\n\t', Wasavi.value);
}

/* vim:set ts=4 sw=4 fileencoding=UTF-8 fileformat=unix filetype=javascript : */
