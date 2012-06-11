/**
 * wasavi: vi clone implemented in javascript
 * =============================================================================
 *
 *
 * @author akahuku@gmail.com
 * @version $Id: motions.js 132 2012-06-05 15:44:16Z akahuku $
 */

/**
 * tests
 */

function testUpLine () {
	function dump (s) {
		s = s.replace(/[\u0000-\u001f]/g, function ($0) {
			return '^' + String.fromCharCode('@'.charCodeAt(0) + $0.charCodeAt(0));
		});
		return s;
	}
	Wasavi.send('iline1\n\tline2\n\t\tline3', Wasavi.SPECIAL_KEYS.ESCAPE);
	assertEquals('line1\n\tline2\n\t\tline3', Wasavi.value);

	Wasavi.send(':3\n');
	assertPos('#1', [2, 2]);

	Wasavi.send('-');
	assertPos('#2', [1, 1]);

	Wasavi.send('-');
	assertPos('#3', [0, 0]);

	Wasavi.send('-');
	assertPos('#4', [0, 0]);
	assertEquals('error cheeck #4', '- canceled.', Wasavi.lastMessage);

	Wasavi.send(':2\n');
	assertPos('#5', [1, 1]);
	Wasavi.send('2-');
	assertPos('#6', [0, 0]);
	assertEquals('error cheeck #7', '', Wasavi.lastMessage);
}

function testDownLine (a) {
	Wasavi.send('iline1\n\tline2\n\t\tline3', Wasavi.SPECIAL_KEYS.ESCAPE);
	assertEquals('line1\n\tline2\n\t\tline3', Wasavi.value);

	Wasavi.send(':1\n');
	assertPos('#1', [0, 0]);

	a || (a = '+');

	Wasavi.send(a);
	assertPos('#2', [1, 1]);

	Wasavi.send(a);
	assertPos('#3', [2, 2]);

	Wasavi.send(a);
	assertPos('#4', [2, 2]);
	assert('error check #4', Wasavi.lastMessage != '');

	Wasavi.send(':2\n');
	assertPos('#5', [1, 1]);
	Wasavi.send('2', a);
	assertPos('#6', [2, 2]);
	assertEquals('error cheeck #7', '', Wasavi.lastMessage);
}

function testDownEnter () {
	testDownLine(Wasavi.SPECIAL_KEYS.ENTER);
}

function testFirstNonWhiteCharOfLine (a) {
	Wasavi.send('i\t\ttest string\n\t\ttest string', Wasavi.SPECIAL_KEYS.ESCAPE);
	assertPos('#1', [1, 12]);

	a || (a = '^');

	Wasavi.send(a);
	assertPos('#2', [1, 2]);

	Wasavi.send('2', a);
	assertPos('#3', [1, 2]);
}

function testHome () {
	testFirstNonWhiteCharOfLine(Wasavi.SPECIAL_KEYS.HOME);
}

function testTopOfLine () {
	Wasavi.send('i\t\tline', Wasavi.SPECIAL_KEYS.ESCAPE);

	Wasavi.send('0');
	assertPos('#1', [0, 0]);

	Wasavi.send('$10');
	assertPos('#2', [0, 5]);
}

function testTailOfLine (a) {
	Wasavi.send('i\t\ttest string\n\t\ttest string', Wasavi.SPECIAL_KEYS.ESCAPE, 'gg');
	assertPos('#1', [0, 2]);

	a || (a = '$');

	Wasavi.send(a);
	assertPos('#2', [0, 12]);

	Wasavi.send('2', a);
	assertPos('#3', [1, 12]);

	Wasavi.send('gg100', a);
	assertPos('#4', [1, 12]);
	assertEquals('error cheeck #5', '', Wasavi.lastMessage);
}

function testEnd () {
	testTailOfLine(Wasavi.SPECIAL_KEYS.END);
}

function testDirectColumn () {
	Wasavi.send('i0123456789', Wasavi.SPECIAL_KEYS.ESCAPE);

	Wasavi.send('5|');
	assertPos('#1', [0, 4]);

	Wasavi.send('11|');
	assertPos('#2', [0, 9]);

	Wasavi.send('|');
	assertPos('#3', [0, 0]);
}

function testJumpToMatchedParenthes () {
	var openBrackets = '([{<';
	var closeBrackets = ')]}>';

	var base = [
		'first O second O',
		'  third level CC'
	].join('\n');
	var a = [];

	for (var i = 0; i < 4; i++) {
		var s = base;
		s = s.replace(/O/g, openBrackets.charAt(i));
		s = s.replace(/C/g, closeBrackets.charAt(i));
		a.push(s);
	}

	a = a.join('\n');
	Wasavi.send('i' + a, Wasavi.SPECIAL_KEYS.ESCAPE);
	
	for (var i = 0; i < 4; i++) {
		Wasavi.send((i * 2 + 1) + 'G2|');
		assertPos(
			'% test with "' + openBrackets.charAt(i) + closeBrackets.charAt(i) + '" #1',
			[i * 2, 1]
		);

		Wasavi.send('%');
		assertPos(
			'% test with "' + openBrackets.charAt(i) + closeBrackets.charAt(i) + '" #2',
			[i * 2 + 1, 15]
		);

		Wasavi.send('h%');
		assertPos(
			'% test with "' + openBrackets.charAt(i) + closeBrackets.charAt(i) + '" #3',
			[i * 2 + 0, 15]
		);

		Wasavi.send('%');
		assertPos(
			'% test with "' + openBrackets.charAt(i) + closeBrackets.charAt(i) + '" #4',
			[i * 2 + 1, 14]
		);
	}
}

function testSearchForward () {
	Wasavi.send('ifirst line\n\tsecond line\n\tthird line', Wasavi.SPECIAL_KEYS.ESCAPE, 'gg');

	Wasavi.send('/third', Wasavi.SPECIAL_KEYS.ESCAPE);
	assertPos('#1', [0, 0]);

	Wasavi.send('/third\n');
	assertPos('#2', [2, 1]);
}

function testSearchBackward () {
	Wasavi.send('ifirst line\n\tsecond line\n\tthird line', Wasavi.SPECIAL_KEYS.ESCAPE, 'G$');

	Wasavi.send('?second', Wasavi.SPECIAL_KEYS.ESCAPE);
	assertPos('#1', [2, 10]);

	Wasavi.send('?second\n');
	assertPos('#2', [1, 1]);
}

function testFindForward () {
	Wasavi.send('ifind the char4cter in current 4ine', Wasavi.SPECIAL_KEYS.ESCAPE);

	Wasavi.send('0');
	Wasavi.send('f4');
	assertPos('#1', [0, 13]);

	Wasavi.send('0');
	Wasavi.send('2f4');
	assertPos('#2', [0, 30]);

	Wasavi.send('0');
	Wasavi.send('fX');
	assertPos('#3', [0, 0]);
	assert(Wasavi.lastMessage != '');

	Wasavi.send('0');
	Wasavi.send('2fX');
	assertPos('#4', [0, 0]);
	assert(Wasavi.lastMessage != '');
}

function testFindBackward () {
	Wasavi.send('ifind the char4cter in current 4ine', Wasavi.SPECIAL_KEYS.ESCAPE);

	Wasavi.send('$');
	Wasavi.send('F4');
	assertPos('#1', [0, 30]);

	Wasavi.send('$');
	Wasavi.send('2F4');
	assertPos('#2', [0, 13]);

	Wasavi.send('$');
	Wasavi.send('FX');
	assertPos('#3', [0, 33]);
	assert(Wasavi.lastMessage != '');

	Wasavi.send('$');
	Wasavi.send('2FX');
	assertPos('#4', [0, 33]);
	assert(Wasavi.lastMessage != '');
}

function testFindForwardBeforeStop () {
	Wasavi.send('ifind the char4cter in current 4ine', Wasavi.SPECIAL_KEYS.ESCAPE);

	Wasavi.send('0');
	Wasavi.send('t4');
	assertPos('#1', [0, 12]);

	Wasavi.send('0');
	Wasavi.send('2t4');
	assertPos('#2', [0, 29]);

	Wasavi.send('0');
	Wasavi.send('tX');
	assertPos('#3', [0, 0]);
	assert(Wasavi.lastMessage != '');

	Wasavi.send('0');
	Wasavi.send('2tX');
	assertPos('#4', [0, 0]);
	assert(Wasavi.lastMessage != '');
}

function testFindBackwardBeforeStop () {
	Wasavi.send('ifind the char4cter in current 4ine', Wasavi.SPECIAL_KEYS.ESCAPE);

	Wasavi.send('$');
	Wasavi.send('T4');
	assertPos('#1', [0, 31]);


	Wasavi.send('$');
	Wasavi.send('2T4');
	assertPos('#2', [0, 14]);

	Wasavi.send('$');
	Wasavi.send('TX');
	assertPos('#3', [0, 33]);
	assert(Wasavi.lastMessage != '');

	Wasavi.send('$');
	Wasavi.send('2TX');
	assertPos('#4', [0, 33]);
	assert(Wasavi.lastMessage != '');
}

function testFindInvert () {
	Wasavi.send('ifind the char4cter in current 4ine', Wasavi.SPECIAL_KEYS.ESCAPE);

	Wasavi.send('0');
	Wasavi.send('2f4');
	assertPos('#1', [0, 30]);

	Wasavi.send(',');
	assertPos('#2', [0, 13]);

	Wasavi.send(',');
	assertPos('#3', [0, 13]);
	assert(Wasavi.lastMessage != '');

	Wasavi.send('$2,');
	assertPos('#4', [0, 13]);

	Wasavi.send('$');
	Wasavi.send('2F4');
	assertPos('#1', [0, 13]);

	Wasavi.send(',');
	assertPos('#2', [0, 30]);

	Wasavi.send(',');
	assertPos('#3', [0, 30]);
	assert(Wasavi.lastMessage != '');

	Wasavi.send('^2,');
	assertPos('#4', [0, 30]);
}

function testFindRepeat () {
	Wasavi.send('ifind the char4cter in current 4ine', Wasavi.SPECIAL_KEYS.ESCAPE);

	Wasavi.send('0');
	Wasavi.send('f4');
	Wasavi.send(';');
	assertPos('#1', [0, 30]);

	Wasavi.send('0');
	Wasavi.send('2;');
	assertPos('#2', [0, 30]);

	Wasavi.send('$');
	Wasavi.send('F4');
	Wasavi.send(';');
	assertPos('#3', [0, 13]);

	Wasavi.send('$');
	Wasavi.send('2;');
	assertPos('#4', [0, 13]);
}

function testDownLineOrient () {
	Wasavi.send('i\t\ttest string\n\t\ttest string', Wasavi.SPECIAL_KEYS.ESCAPE, 'gg$');
	assertPos('#1', [0, 12]);

	Wasavi.send('_');
	assertPos('#2', [0, 2]);

	Wasavi.send('2_');
	assertPos('#3', [1, 2]);

	Wasavi.send('gg100_');
	assertPos('#4', [1, 2]);
	assertEquals('error cheeck #5', '', Wasavi.lastMessage);
}

function testMark () {
	Wasavi.send('iHi there. This is great.', Wasavi.SPECIAL_KEYS.ESCAPE);

	Wasavi.send('7|ma$mb');
	assertPos('#1', [0, 23]);

	Wasavi.send('`a');
	assertPos('#2', [0, 6]);

	Wasavi.send('`b');
	assertPos('#3', [0, 23]);

	Wasavi.send('db0');
	assertPos('#4', [0, 0]);
	assertEquals('#5', 'Hi there. This is .', Wasavi.value);

	Wasavi.send('`b');
	assertPos('#6', [0, 18]);
}

function testMarkLineOrient () {
	Wasavi.send('iFirst\nHi there.\nThis is great.', Wasavi.SPECIAL_KEYS.ESCAPE);

	Wasavi.send('2G7|magg');
	assertPos('#1', [0, 0]);
	assertEquals('#2', 'First\nHi there.\nThis is great.', Wasavi.value);

	Wasavi.send("'a");
	assertPos('#3', [1, 0]);
}

function testMarkTracksItsPosition () {
	Wasavi.send('i', 'foo1bar2baz3bax', '\u001b');

	Wasavi.send('F2ma');
	assertPos('#1-1', [0, 7]);

	/*
	 *                       ___
	 * foo1bar2baz3bax  -->  XYZfoo1bar2baz3bax
	 *        *                        *
	 *        a                        a
	 */
	Wasavi.send('0iXYZ\u001b`a');
	assertEquals('#2-1', 'XYZfoo1bar2baz3bax', Wasavi.value);
	assertPos('#2-2', [0, 10]);

	/*
	 *                                    ___
	 * XYZfoo1bar2baz3bax  -->  XYZfoo1barXYZ2baz3bax
	 *           *                           *
	 *           a                           a
	 */
	Wasavi.send('iXYZ\u001b`a');
	assertEquals('#3-1', 'XYZfoo1barXYZ2baz3bax', Wasavi.value);
	assertPos('#3-2', [0, 13]);

	/*
	 * ___
	 * XYZfoo1barXYZ2baz3bax  -->  foo1barXYZ2baz3bax
	 *              *                        *
	 *              a                        a
	 */
	Wasavi.send('03x`a');
	assertEquals('#4-1', 'foo1barXYZ2baz3bax', Wasavi.value);
	assertPos('#4-2', [0, 10]);

	/*
	 *        _____
	 * foo1barXYZ2baz3bax  -->  foo1baraz3bax
	 *           *                     *
	 *           a                     a
	 */
	Wasavi.send('0fX5x`a');
	assertEquals('#5-1', 'foo1baraz3bax', Wasavi.value);
	assertPos('#5-2', [0, 7]);
}

function testMarkTracksItsPositionLineOrient () {
	Wasavi.send('3ifoo\n\u001b');

	/*
	 * foo *  -->  bar
	 * foo         foo *
	 * foo         foo
	 *             foo
	 */
	Wasavi.send('1G0maObar\u001b');
	assertEquals('#1-1', 'bar\nfoo\nfoo\nfoo\n', Wasavi.value);
	Wasavi.send('`a');
	assertPos('#1-2', [1, 0]);

	/*
	 * bar    -->  foo *
	 * foo *       foo
	 * foo         foo
	 * foo
	 */
	Wasavi.send('1Gdd');
	assertEquals('#2-1', 'foo\nfoo\nfoo\n', Wasavi.value);
	Wasavi.send('`a');
	assertPos('#2-2', [0, 0]);

	/*
	 * foo    -->  foo
	 * foo *       foo *
	 * foo
	 */
	Wasavi.send('2G0madd');
	assertEquals('#3-1', 'foo\nfoo\n', Wasavi.value);
	Wasavi.send('`a');
	assert('#3-2', Wasavi.lastMessage != '');
}

function testSectionForward () {
	var t1 = +new Date;
	Wasavi.send(
		'i', sectionTestText.replace(/\f/g, '\u0016$&'), 
		Wasavi.SPECIAL_KEYS.ESCAPE, 'gg');
	t1 = +new Date - t1;
	assertEquals('#1', sectionTestText, Wasavi.value);
	console.log('building test data: ' + t1);

	Wasavi.send(']]');
	assertPos('#2', [3, 0]);

	Wasavi.send(']]');
	assertPos('#3', [7, 0]);

	Wasavi.send(']]');
	assertPos('#4', [11, 0]);

	Wasavi.send(']]');
	assertPos('#5', [19, 0]);

	Wasavi.send(']]');
	assertPos('#6', [21, 0]);
}

function testSectionBackward () {
	Wasavi.send(
		'i', sectionTestText.replace(/\f/g, '\u0016$&'), 
		Wasavi.SPECIAL_KEYS.ESCAPE, 'G');
	assertEquals('#1', sectionTestText, Wasavi.value);

	Wasavi.send('[[');
	assertPos('#2', [19, 0]);

	Wasavi.send('[[');
	assertPos('#3', [11, 0]);

	Wasavi.send('[[');
	assertPos('#4', [7, 0]);

	Wasavi.send('[[');
	assertPos('#5', [3, 0]);

	Wasavi.send('[[');
	assertPos('#6', [0, 1]);
}

function testParagraphForward () {
	Wasavi.send(
		'i', sectionTestText.replace(/\f/g, '\u0016$&'), 
		Wasavi.SPECIAL_KEYS.ESCAPE, 'gg');

	[2, 3, 6, 10, 11, 13, 14, 15, 18, 19, 21].forEach(function (row, i) {
		Wasavi.send('}');
		assertPos('#' + (i + 1), [row, 0]);
	});
}

function testParagraphBackward () {
	Wasavi.send(
		'i', sectionTestText.replace(/\f/g, '\u0016$&'), 
		Wasavi.SPECIAL_KEYS.ESCAPE, 'G');

	[19, 18, 15, 14, 13, 11, 10, 6, 3, 2, 0].forEach(function (row, i) {
		Wasavi.send('{');
		assertPos('#' + (i + 1), [row, 0]);
	});
}

function testSentenceForward () {
	// TBD
}

function testSentenceBackward () {
	// TBD
}

function testDown (a) {
	Wasavi.send('ifirst\nsecond\nthird', Wasavi.SPECIAL_KEYS.ESCAPE, 'gg2|');
	assertPos('#1', [0, 1]);

	a || (a = 'j');

	Wasavi.send(a);
	assertPos('#2', [1, 1]);

	Wasavi.send('gg2|2', a);
	assertPos('#3', [2, 1]);

	Wasavi.send('gg2|100', a);
	assertPos('#4', [2, 1]);
}

function testDownCtrlN () {
	testDown('\u000e');
}

function testDownDown () {
	testDown(Wasavi.SPECIAL_KEYS.DOWN);
}

function testUp (a) {
	Wasavi.send('ifirst\nsecond\nthird', Wasavi.SPECIAL_KEYS.ESCAPE, 'G2|');
	assertPos('#1', [2, 1]);

	a || (a = 'k');

	Wasavi.send(a);
	assertPos('#2', [1, 1]);

	Wasavi.send('G2|2', a);
	assertPos('#3', [0, 1]);

	Wasavi.send('G2|100', a);
	assertPos('#4', [0, 1]);
}

function testUpCtrlP () {
	testUp('\u0010');
}

function testUpUp () {
	testUp(Wasavi.SPECIAL_KEYS.UP);
}

function testLeft (a) {
	Wasavi.send('i123456789ABC', Wasavi.SPECIAL_KEYS.ESCAPE);

	a || (a = 'h');

	Wasavi.send('10|', a);
	assertPos('#1', [0, 8]);

	Wasavi.send('2', a);
	assertPos('#2', [0, 6]);

	Wasavi.send('10', a);
	assertPos('#3', [0, 0]);
}

function testLeftCtrlH () {
	testLeft('\u0008');
}

function testLeftLeft () {
	testLeft(Wasavi.SPECIAL_KEYS.LEFT);
}

function testRight (a) {
	Wasavi.send('i123456789ABC', Wasavi.SPECIAL_KEYS.ESCAPE);

	a || (a = 'l');

	Wasavi.send('0', a);
	assertPos('#1', [0, 1]);

	Wasavi.send('2', a);
	assertPos('#2', [0, 3]);

	Wasavi.send('10', a);
	assertPos('#3', [0, 11]);
}

function testRightSpace () {
	testRight(' ');
}

function testRightRight () {
	testRight(Wasavi.SPECIAL_KEYS.RIGHT);
}

function testWordForward () {
	var base = 'first second\n\tthird word';
	Wasavi.send('i', base, Wasavi.SPECIAL_KEYS.ESCAPE, 'gg');

	assertPos('#1', [0, 0]);

	Wasavi.send('w');
	assertPos('#2', [0, 6]);

	Wasavi.send('2w');
	assertPos('#3', [1, 7]);

	Wasavi.send('2w');
	assertPos('#4', [1, 10]);

	Wasavi.send('ggcwFIRST', Wasavi.SPECIAL_KEYS.ESCAPE);
	assertEquals('#5', base.replace(/^first/, 'FIRST'), Wasavi.value);
}

function testWordBackward () {
	Wasavi.send('ifirst second\n\tthird word', Wasavi.SPECIAL_KEYS.ESCAPE);

	assertPos('#1', [1, 10]);

	Wasavi.send('b');
	assertPos('#2', [1, 7]);

	Wasavi.send('2b');
	assertPos('#3', [0, 6]);

	Wasavi.send('2b');
	assertPos('#4', [0, 0]);
}

function testBigwordForward () {
	var base = 'fir#t sec$nd\n\tthi%d wor^';
	Wasavi.send('i', base, Wasavi.SPECIAL_KEYS.ESCAPE, 'gg');

	assertPos('#1', [0, 0]);

	Wasavi.send('W');
	assertPos('#2', [0, 6]);

	Wasavi.send('2W');
	assertPos('#3', [1, 7]);

	Wasavi.send('2W');
	assertPos('#4', [1, 10]);

	Wasavi.send('ggcWFIRST', Wasavi.SPECIAL_KEYS.ESCAPE);
	assertEquals('#5', base.replace(/^fir#t/, 'FIRST'), Wasavi.value);
}

function testBigwordBackward () {
	Wasavi.send('ifir#t sec$nd\n\tthi%d wor^', Wasavi.SPECIAL_KEYS.ESCAPE);

	assertPos('#1', [1, 10]);

	Wasavi.send('B');
	assertPos('#2', [1, 7]);

	Wasavi.send('2B');
	assertPos('#3', [0, 6]);

	Wasavi.send('2B');
	assertPos('#4', [0, 0]);
}

function testWordEnd () {
	var base = 'first second\n\tthird word';
	Wasavi.send('i', base, Wasavi.SPECIAL_KEYS.ESCAPE, 'gg');

	Wasavi.send('e');
	assertPos('#1', [0, 4]);

	Wasavi.send('2e');
	assertPos('#2', [1, 5]);

	Wasavi.send('2e');
	assertPos('#3', [1, 10]);
}

function testBigwordEnd () {
	var base = 'fir#t sec$nd\n\tthi%d wor^';
	Wasavi.send('i', base, Wasavi.SPECIAL_KEYS.ESCAPE, 'gg');

	Wasavi.send('E');
	assertPos('#1', [0, 4]);

	Wasavi.send('2E');
	assertPos('#2', [1, 5]);

	Wasavi.send('2E');
	assertPos('#3', [1, 10]);
}

function testGotoPrefix () {
	Wasavi.send('i1\n2\n3\n4\n5', Wasavi.SPECIAL_KEYS.ESCAPE);

	assertPos('#1', [4, 0]);

	Wasavi.send('gg');
	assertPos('#2', [0, 0]);

	Wasavi.send('i\t', Wasavi.SPECIAL_KEYS.ESCAPE);
	Wasavi.send('gg');
	assertPos('#3', [0, 1]);

	Wasavi.send('gx');
	assert('#4', Wasavi.lastMessage != '');
}

function testTopOfView () {
	var lines = makeScrollableBuffer();

	Wasavi.send('H');
	assertPos('#1', [0, 0]);

	Wasavi.send('2H');
	assertPos('#2', [1, 0]);

	Wasavi.send((lines * 2) + '', 'H');
	assertPos('#3', [lines - 1, 0]);
}

function testMiddleOfView () {
	var lines = makeScrollableBuffer();

	Wasavi.send('M');
	assertPos('#1', [parseInt(lines / 2), 0]);
}

function testBottomOfView () {
	var lines = makeScrollableBuffer();

	Wasavi.send('L');
	assertPos('#1', [lines - 1, 0]);

	Wasavi.send('2L');
	assertPos('#2', [lines - 2, 0]);

	Wasavi.send((lines * 2) + '', 'L');
	assertPos('#3', [0, 0]);
}

function testGoto () {
	Wasavi.send('ifirst\n\tsecond\nthird', Wasavi.SPECIAL_KEYS.ESCAPE);

	Wasavi.send('1G');
	assertPos('#1', [0, 0]);

	Wasavi.send('2G');
	assertPos('#2', [1, 1]);

	Wasavi.send('3G');
	assertPos('#3', [2, 0]);

	Wasavi.send('100G');
	assertPos('#4', [2, 0]);
}

function testSearchForwardNext () {
	Wasavi.send('ifirst\n\tsecond\nthird\nthird', Wasavi.SPECIAL_KEYS.ESCAPE);

	Wasavi.send('n');
	assert('#1', Wasavi.lastMessage != '');

	Wasavi.send('gg/third\n');
	assertPos('#2', [2, 0]);

	Wasavi.send('n');
	assertPos('#3', [3, 0]);

	Wasavi.send(':set nows\n');
	Wasavi.send('n');
	assertPos('#4', [3, 0]);
	assert('#5', Wasavi.lastMessage != '');

	Wasavi.send(':set ws\n');
	Wasavi.send('n');
	assertPos('#6', [2, 0]);
}

function testSearchFowardPrev () {
	Wasavi.send('ifirst\n\tsecond\nthird\nthird', Wasavi.SPECIAL_KEYS.ESCAPE);

	Wasavi.send('N');
	assert('#1', Wasavi.lastMessage != '');

	Wasavi.send('gg/third\n');
	assertPos('#2', [2, 0]);

	Wasavi.send(':set nows\n');
	Wasavi.send('N');
	assertPos('#3', [2, 0]);
	assert('#4', Wasavi.lastMessage != '');

	Wasavi.send(':set ws\n');
	Wasavi.send('N');
	assertPos('#5', [3, 0]);

	Wasavi.send('N');
	assertPos('#6', [2, 0]);
}

function testSearchBackwardNext () {
	Wasavi.send('ifirst\nfirst\nsecond\nthird', Wasavi.SPECIAL_KEYS.ESCAPE);
	assertPos('#1', [3, 4]);

	Wasavi.send('n');
	assert('#2', Wasavi.lastMessage != '');
	assertPos('#3', [3, 4]);

	Wasavi.send('?first\n');
	assertPos('#4', [1, 0]);

	Wasavi.send('n');
	assertPos('#3', [0, 0]);

	Wasavi.send(':set nows\n');
	Wasavi.send('n');
	assertPos('#4', [0, 0]);
	assert('#5', Wasavi.lastMessage != '');

	Wasavi.send(':set ws\n');
	Wasavi.send('n');
	assertPos('#6', [1, 0]);
}

function testSearchBackwardPrev () {
	Wasavi.send('ifirst\nfirst\nsecond\nthird', Wasavi.SPECIAL_KEYS.ESCAPE);

	Wasavi.send('N');
	assert('#1', Wasavi.lastMessage != '');

	Wasavi.send('?first\n');
	assertPos('#2', [1, 0]);

	Wasavi.send(':set nows\n');
	Wasavi.send('N');
	assertPos('#3', [1, 0]);
	assert('#4', Wasavi.lastMessage != '');

	Wasavi.send(':set ws\n');
	Wasavi.send('N');
	assertPos('#5', [0, 0]);

	Wasavi.send('N');
	assertPos('#6', [1, 0]);
}

/* vim:set ts=4 sw=4 fileencoding=UTF-8 fileformat=unix filetype=javascript : */
