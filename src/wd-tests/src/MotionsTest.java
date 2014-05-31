package WasaviTest;

import static WasaviTest.WasaviAsserts.*;
import static WasaviTest.WasaviUtils.*;

import org.junit.*;
import static org.junit.Assert.*;

import org.openqa.selenium.By;
import org.openqa.selenium.Keys;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;

public class MotionsTest extends WasaviTest {
	private static final String SECTION_TEST_TEXT =
		"\tfirst line\n" + // * 1
		"dummy line\n" +
		"\n" +
		"\f line whose first character is form-feed\n" + // * 4
		"\t\f line whose second character is form-feed\n" +
		"dummy line\n" +
		"\n" +
		"{ line whose first character is curly brace\n" + // * 8
		"\t{ line whose second character is curly brace\n" +
		"dummy line\n" +
		"\n" +
		".SH\n" + // * 12
		"dummy line\n" +
		"\n" +
		".IP\n" +
		"\n" +
		"\tLorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod\n" +
		"\ttempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam\n" +
		"\n" +
		".H \n" + // * 20
		"dummy line\n" +
		""; // * 22

	@Test
	public void testUpLine () {
		Wasavi.send(":set noai\n");
		Wasavi.send("iline1\n\tline2\n\t\tline3\u001b");
		assertValue("line1\n\tline2\n\t\tline3");

		Wasavi.send(":3\n");
		assertPos("#1", 2, 2);

		Wasavi.send("-");
		assertPos("#2", 1, 1);

		Wasavi.send("-");
		assertPos("#3", 0, 0);

		Wasavi.send("-");
		assertPos("#4", 0, 0);
		assertEquals("error cheeck #4", "- canceled.", Wasavi.getLastMessage());

		Wasavi.send(":2\n");
		assertPos("#5", 1, 1);
		Wasavi.send("2-");
		assertPos("#6", 0, 0);
		assertEquals("error cheeck #7", "", Wasavi.getLastMessage());
	}

	private void _testDownLine (CharSequence a) {
		Wasavi.send(":set noai\n");
		Wasavi.send("iline1\n\tline2\n\t\tline3\u001b");
		assertValue("line1\n\tline2\n\t\tline3");

		Wasavi.send(":1\n");
		assertPos("#1", 0, 0);

		Wasavi.send(a);
		assertPos("#2", 1, 1);

		Wasavi.send(a);
		assertPos("#3", 2, 2);

		Wasavi.send(a);
		assertPos("#4", 2, 2);
		assertTrue("error check #4", Wasavi.getLastMessage().length() > 0);

		Wasavi.send(":2\n");
		assertPos("#5", 1, 1);
		Wasavi.send("2", a);
		assertPos("#6", 2, 2);
		assertEquals("error cheeck #7", "", Wasavi.getLastMessage());
	}

	@Test
	public void testDownLine () {
		_testDownLine("+");
	}

	@Test
	public void testDownEnter () {
		_testDownLine(Keys.ENTER);
	}

	private void _testFirstNonWhiteCharOfLine (CharSequence a) {
		Wasavi.send(":set noai\n");
		Wasavi.send("i\t\ttest string\n\t\ttest string\u001b");
		assertPos("#1", 1, 12);

		Wasavi.send(a);
		assertPos("#2", 1, 2);

		Wasavi.send("2", a);
		assertPos("#3", 1, 2);
	}

	@Test
	public void testFirstNonWhiteCharOfLine () {
		_testFirstNonWhiteCharOfLine("^");
	}

	@Test
	public void testHome () {
		_testFirstNonWhiteCharOfLine(Keys.HOME);
	}

	@Test
	public void testTopOfLine () {
		Wasavi.send("i\t\tline\u001b");

		Wasavi.send("0");
		assertPos("#1", 0, 0);

		Wasavi.send("$10");
		assertPos("#2", 0, 5);
	}

	private void _testTailOfLine (CharSequence a) {
		Wasavi.send(":set noai\n");
		Wasavi.send("i\t\ttest string\n\t\ttest string\u001b", "gg");
		assertPos("#1", 0, 2);

		Wasavi.send(a);
		assertPos("#2", 0, 12);

		Wasavi.send("2", a);
		assertPos("#3", 1, 12);

		Wasavi.send("gg", "100", a);
		assertPos("#4", 1, 12);
		assertEquals("error cheeck #5", "", Wasavi.getLastMessage());
	}

	@Test
	public void testTailOfLine () {
		_testTailOfLine("$");
	}

	@Test
	public void testEnd () {
		_testTailOfLine(Keys.END);
	}

	@Test
	public void testDirectColumn () {
		Wasavi.send("i0123456789\u001b");

		Wasavi.send("5|");
		assertPos("#1", 0, 4);

		Wasavi.send("11|");
		assertPos("#2", 0, 9);

		Wasavi.send("|");
		assertPos("#3", 0, 0);
	}

	@Test
	public void testJumpToMatchedParenthes () {
		String openBrackets = "([{<";
		String closeBrackets = ")]}>";

		String base = join(
			"\n",
			"first O second O",
			"  third level CC"
		);

		String[] a = new String[4];

		for (int i = 0; i < 4; i++) {
			String s = base;
			s = s.replaceAll("O", openBrackets.substring(i, i + 1));
			s = s.replaceAll("C", closeBrackets.substring(i, i + 1));
			a[i] = s;
		}

		String a2 = join(a, "\n");
		Wasavi.send(":set noai\n");
		Wasavi.send("i" + a2 + "\u001b");
		
		for (int i = 0; i < 4; i++) {
			Wasavi.send(String.format("%dG", i * 2 + 1), "2|");
			assertPos(
				String.format("%% test with \"%s%s\" #1",
					openBrackets.substring(i, i + 1),
					closeBrackets.substring(i, i + 1)),
				i * 2, 1
			);

			Wasavi.send("%");
			assertPos(
				String.format("%% test with \"%s%s\" #2",
					openBrackets.substring(i, i + 1),
					closeBrackets.substring(i, i + 1)),
				i * 2 + 1, 15
			);

			Wasavi.send("h%");
			assertPos(
				String.format("%% test with \"%s%s\" #3",
					openBrackets.substring(i, i + 1),
					closeBrackets.substring(i, i + 1)),
				i * 2 + 0, 15
			);

			Wasavi.send("%");
			assertPos(
				String.format("%% test with \"%s%s\" #4",
					openBrackets.substring(i, i + 1),
					closeBrackets.substring(i, i + 1)),
				i * 2 + 1, 14
			);
		}
	}

	@Test
	public void testSearchForward () {
		Wasavi.send(":set noai\n");
		Wasavi.send("ifirst line\n\tsecond line\n\tthird line\u001b", "gg");

		Wasavi.send("/third\u001b");
		assertPos("#1", 0, 0);

		Wasavi.send("/third\n");
		assertPos("#2", 2, 1);
	}

	@Test
	public void testSearchBackward () {
		Wasavi.send(":set noai\n");
		Wasavi.send("ifirst line\n\tsecond line\n\tthird line\u001b", "G", "$");

		Wasavi.send("?second\u001b");
		assertPos("#1", 2, 10);

		Wasavi.send("?second\n");
		assertPos("#2", 1, 1);
	}

	@Test
	public void testFindForward () {
		Wasavi.send("ifind the char4cter in current 4ine\u001b");

		Wasavi.send("0");
		Wasavi.send("f4");
		assertPos("#1", 0, 13);

		Wasavi.send("0");
		Wasavi.send("2f4");
		assertPos("#2", 0, 30);

		Wasavi.send("0");
		Wasavi.send("fX");
		assertPos("#3", 0, 0);
		assertTrue(Wasavi.getLastMessage().length() > 0);

		Wasavi.send("0");
		Wasavi.send("2fX");
		assertPos("#4", 0, 0);
		assertTrue(Wasavi.getLastMessage().length() > 0);
	}

	@Test
	public void testFindBackward () {
		Wasavi.send("ifind the char4cter in current 4ine\u001b");

		Wasavi.send("$");
		Wasavi.send("F4");
		assertPos("#1", 0, 30);

		Wasavi.send("$");
		Wasavi.send("2F4");
		assertPos("#2", 0, 13);

		Wasavi.send("$");
		Wasavi.send("FX");
		assertPos("#3", 0, 33);
		assertTrue(Wasavi.getLastMessage().length() > 0);

		Wasavi.send("$");
		Wasavi.send("2FX");
		assertPos("#4", 0, 33);
		assertTrue(Wasavi.getLastMessage().length() > 0);
	}

	@Test
	public void testFindForwardBeforeStop () {
		Wasavi.send("ifind the char4cter in current 4ine\u001b");

		Wasavi.send("0");
		Wasavi.send("t4");
		assertPos("#1", 0, 12);

		Wasavi.send("0");
		Wasavi.send("2t4");
		assertPos("#2", 0, 29);

		Wasavi.send("0");
		Wasavi.send("tX");
		assertPos("#3", 0, 0);
		assertTrue(Wasavi.getLastMessage().length() > 0);

		Wasavi.send("0");
		Wasavi.send("2tX");
		assertPos("#4", 0, 0);
		assertTrue(Wasavi.getLastMessage().length() > 0);
	}

	@Test
	public void testFindBackwardBeforeStop () {
		Wasavi.send("ifind the char4cter in current 4ine\u001b");

		Wasavi.send("$");
		Wasavi.send("T4");
		assertPos("#1", 0, 31);


		Wasavi.send("$");
		Wasavi.send("2T4");
		assertPos("#2", 0, 14);

		Wasavi.send("$");
		Wasavi.send("TX");
		assertPos("#3", 0, 33);
		assertTrue(Wasavi.getLastMessage().length() > 0);

		Wasavi.send("$");
		Wasavi.send("2TX");
		assertPos("#4", 0, 33);
		assertTrue(Wasavi.getLastMessage().length() > 0);
	}

	@Test
	public void testFindInvert () {
		Wasavi.send("ifind the char4cter in current 4ine\u001b");

		Wasavi.send("0");
		Wasavi.send("2f4");
		assertPos("#1", 0, 30);

		Wasavi.send(",");
		assertPos("#2", 0, 13);

		Wasavi.send(",");
		assertPos("#3", 0, 13);
		assertTrue(Wasavi.getLastMessage().length() > 0);

		Wasavi.send("$2,");
		assertPos("#4", 0, 13);

		Wasavi.send("$");
		Wasavi.send("2F4");
		assertPos("#1", 0, 13);

		Wasavi.send(",");
		assertPos("#2", 0, 30);

		Wasavi.send(",");
		assertPos("#3", 0, 30);
		assertTrue(Wasavi.getLastMessage().length() > 0);

		Wasavi.send("^2,");
		assertPos("#4", 0, 30);
	}

	@Test
	public void testFindRepeat () {
		Wasavi.send("ifind the char4cter in current 4ine\u001b");

		Wasavi.send("0");
		Wasavi.send("f4");
		Wasavi.send(";");
		assertPos("#1", 0, 30);

		Wasavi.send("0");
		Wasavi.send("2;");
		assertPos("#2", 0, 30);

		Wasavi.send("$");
		Wasavi.send("F4");
		Wasavi.send(";");
		assertPos("#3", 0, 13);

		Wasavi.send("$");
		Wasavi.send("2;");
		assertPos("#4", 0, 13);
	}

	@Test
	public void testDownLineOrient () {
		Wasavi.send(":set noai\n");
		Wasavi.send("i\t\ttest string\n\t\ttest string\u001b", "gg", "$");
		assertPos("#1", 0, 12);

		Wasavi.send("_");
		assertPos("#2", 0, 2);

		Wasavi.send("2_");
		assertPos("#3", 1, 2);

		Wasavi.send("gg", "100_");
		assertPos("#4", 1, 2);
		assertEquals("error cheeck #5", "", Wasavi.getLastMessage());
	}

	@Test
	public void testMark () {
		Wasavi.send("iHi there. This is great.\u001b");

		Wasavi.send("7|ma$mb");
		assertPos("#1", 0, 23);

		Wasavi.send("`a");
		assertPos("#2", 0, 6);

		Wasavi.send("`b");
		assertPos("#3", 0, 23);

		Wasavi.send("db0");
		assertPos("#4", 0, 0);
		assertValue("#5", "Hi there. This is .");

		Wasavi.send("`b");
		assertPos("#6", 0, 18);
	}

	@Test
	public void testMarkLineOrient () {
		Wasavi.send("iFirst\nHi there.\nThis is great.\u001b");

		Wasavi.send("2G", "7|magg");
		assertPos("#1", 0, 0);
		assertValue("#2", "First\nHi there.\nThis is great.");

		Wasavi.send("'a");
		assertPos("#3", 1, 0);
	}

	@Test
	public void testMarkTracksItsPosition () {
		Wasavi.send("ifoo1bar2baz3bax\u001b");

		Wasavi.send("F2ma");
		assertPos("#1-1", 0, 7);

		/*
		 *                       ___
		 * foo1bar2baz3bax  -->  XYZfoo1bar2baz3bax
		 *        *                        *
		 *        a                        a
		 */
		Wasavi.send("0iXYZ\u001b`a");
		assertValue("#2-1", "XYZfoo1bar2baz3bax");
		assertPos("#2-2", 0, 10);

		/*
		 *                                    ___
		 * XYZfoo1bar2baz3bax  -->  XYZfoo1barXYZ2baz3bax
		 *           *                           *
		 *           a                           a
		 */
		Wasavi.send("iXYZ\u001b`a");
		assertValue("#3-1", "XYZfoo1barXYZ2baz3bax");
		assertPos("#3-2", 0, 13);

		/*
		 * ___
		 * XYZfoo1barXYZ2baz3bax  -->  foo1barXYZ2baz3bax
		 *              *                        *
		 *              a                        a
		 */
		Wasavi.send("03x`a");
		assertValue("#4-1", "foo1barXYZ2baz3bax");
		assertPos("#4-2", 0, 10);

		/*
		 *        _____
		 * foo1barXYZ2baz3bax  -->  foo1baraz3bax
		 *           *                     *
		 *           a                     a
		 */
		Wasavi.send("0fX5x`a");
		assertValue("#5-1", "foo1baraz3bax");
		assertPos("#5-2", 0, 7);
	}

	@Test
	public void testMarkTracksItsPositionLineOrient () {
		Wasavi.send(":set noai\n");
		Wasavi.send("3ifoo\n\u001b");

		/*
		 * foo *  -->  bar
		 * foo         foo *
		 * foo         foo
		 *             foo
		 */
		Wasavi.send("1G", "0maObar\u001b");
		assertValue("#1-1", "bar\nfoo\nfoo\nfoo\n");
		Wasavi.send("`a");
		assertPos("#1-2", 1, 0);

		/*
		 * bar    -->  foo *
		 * foo *       foo
		 * foo         foo
		 * foo
		 */
		Wasavi.send("1G", "dd");
		assertValue("#2-1", "foo\nfoo\nfoo\n");
		Wasavi.send("`a");
		assertPos("#2-2", 0, 0);

		/*
		 * foo    -->  foo
		 * foo *       foo *
		 * foo
		 */
		Wasavi.send("2G", "0madd");
		assertValue("#3-1", "foo\nfoo\n");
		Wasavi.send("`a");
		assertTrue("#3-2", Wasavi.getLastMessage().length() > 0);
	}

	@Test
	public void testSectionForward () {
		/*
		 * in section, paragraph, sentence command:
		 * to act this behavior on vim, :set cpo+={J
		 */
		Wasavi.send("gg");

		Wasavi.send("]]");
		assertPos("#2", 3, 0);

		Wasavi.send("]]");
		assertPos("#3", 7, 0);

		Wasavi.send("]]");
		assertPos("#4", 11, 0);

		Wasavi.send("]]");
		assertPos("#5", 19, 0);

		Wasavi.send("]]");
		assertPos("#6", 21, 0);
	}

	@Test
	public void testSectionBackward () {
		Wasavi.send("G");

		Wasavi.send("[[");
		assertPos("#2", 19, 0);

		Wasavi.send("[[");
		assertPos("#3", 11, 0);

		Wasavi.send("[[");
		assertPos("#4", 7, 0);

		Wasavi.send("[[");
		assertPos("#5", 3, 0);

		Wasavi.send("[[");
		assertPos("#6", 0, 1);
	}

	@Test
	public void testParagraphForward () {
		Wasavi.send("gg");

		int[] rows = {2, 3, 6, 7, 10, 11, 13, 14, 15, 18, 19, 21};
		int i = 0;
		for (int row: rows) {
			Wasavi.send("}");
			assertPos(String.format("#%d", ++i), row, 0);
		}
	}

	@Test
	public void testParagraphBackward () {
		Wasavi.send("G");

		int[] rows = {19, 18, 15, 14, 13, 11, 10, 7, 6, 3, 2, 0};
		int i = 0;
		for (int row: rows) {
			Wasavi.send("{");
			assertPos(String.format("#%d", ++i), row, 0);
		}
	}

	@Test
	public void testSentenceForward () {
		Wasavi.send("gg1|");

		int[] positions = {
			 2, 0,
			 3, 0,
			 4, 1,
			 6, 0,
			 7, 0,
			10, 0,
			11, 0,
			12, 0,
			13, 0,
			14, 0,
			15, 0,
			16, 1,
			16, 60,
			18, 0,
			19, 0,
			20, 0,
			21, 0
		};
		for (int i = 0, goal = positions.length; i < goal; i += 2) {
			Wasavi.send(")");
			assertPos(String.format("#%d", (int)(i / 2) + 1), positions[i], positions[i + 1]);
		}
	}

	@Test
	public void testSentenceBackward () {
		Wasavi.send("G1|");

		int[] positions = {
			 0, 0,
			 2, 0,
			 3, 0,
			 4, 1,
			 6, 0,
			 7, 0,
			10, 0,
			11, 0,
			12, 0,
			13, 0,
			14, 0,
			15, 0,
			16, 1,
			16, 60,
			18, 0,
			19, 0,
			20, 0
		};
		for (int i = positions.length - 2; i >= 0; i -= 2) {
			Wasavi.send("(");
			assertPos(String.format("#%d", (int)(i / 2) + 1), positions[i], positions[i + 1]);
		}
	}

	private void _testDown (CharSequence a) {
		Wasavi.send(":set noai\n");
		Wasavi.send("ifirst\nsecond\nthird\u001bgg", "2|");
		assertPos("#1", 0, 1);

		Wasavi.send(a);
		assertPos("#2", 1, 1);

		Wasavi.send("gg", "2|2", a);
		assertPos("#3", 2, 1);

		Wasavi.send("gg", "2|100", a);
		assertPos("#4", 2, 1);
	}

	@Test
	public void testDown () {
		_testDown("j");
	}

	@Test
	public void testDownCtrlN () {
		_testDown("\u000e");
	}

	@Test
	public void testDownDown () {
		_testDown(Keys.ARROW_DOWN);
	}

	private void _testUp (CharSequence a) {
		Wasavi.send(":set noai\n");
		Wasavi.send("ifirst\nsecond\nthird\u001b", "G", "2|");
		assertPos("#1", 2, 1);

		Wasavi.send(a);
		assertPos("#2", 1, 1);

		Wasavi.send("G", "2|2", a);
		assertPos("#3", 0, 1);

		Wasavi.send("G", "2|100", a);
		assertPos("#4", 0, 1);
	}

	@Test
	public void testUp () {
		_testUp("k");
	}

	@Test
	public void testUpCtrlP () {
		_testUp("\u0010");
	}

	@Test
	public void testUpUp () {
		_testUp(Keys.ARROW_UP);
	}

	private void _testLeft (CharSequence a) {
		Wasavi.send("i123456789ABC\u001b");

		Wasavi.send("10|", a);
		assertPos("#1", 0, 8);

		Wasavi.send("2", a);
		assertPos("#2", 0, 6);

		Wasavi.send("10", a);
		assertPos("#3", 0, 0);
	}

	@Test
	public void testLeft () {
		_testLeft("h");
	}

	@Test
	public void testLeftCtrlH () {
		_testLeft("\u0008");
	}

	@Test
	public void testLeftLeft () {
		_testLeft(Keys.ARROW_LEFT);
	}

	private void _testRight (CharSequence a) {
		Wasavi.send("i123456789ABC\u001b");

		Wasavi.send("0", a);
		assertPos("#1", 0, 1);

		Wasavi.send("2", a);
		assertPos("#2", 0, 3);

		Wasavi.send("10", a);
		assertPos("#3", 0, 11);
	}

	@Test
	public void testRight () {
		_testRight("l");
	}

	@Test
	public void testRightSpace () {
		_testRight(" ");
	}

	@Test
	public void testRightRight () {
		_testRight(Keys.ARROW_RIGHT);
	}

	@Test
	public void testWordForward () {
		Wasavi.send(":set noai\n");
		String base = "first second\n\tthird word";
		Wasavi.send("i" + base + "\u001bgg");

		assertPos("#1", 0, 0);

		Wasavi.send("w");
		assertPos("#2", 0, 6);

		Wasavi.send("2w");
		assertPos("#3", 1, 7);

		Wasavi.send("2w");
		assertPos("#4", 1, 10);

		Wasavi.send("gg", "cwFIRST\u001b");
		assertValue("#5", base.replaceFirst("^first", "FIRST"));
	}

	@Test
	public void testWordForwardLast () {
		Wasavi.send("iabc   def   ghi\u001b");
		Wasavi.send("13|");
		Wasavi.send("w");

		assertPos("#1", 0, 14);
		assertEquals("#2", "", Wasavi.getLastMessage());
	}

	@Test
	public void testWordBackward () {
		Wasavi.send("ifirst second\n\tthird word\u001b");

		assertPos("#1", 1, 10);

		Wasavi.send("b");
		assertPos("#2", 1, 7);

		Wasavi.send("2b");
		assertPos("#3", 0, 6);

		Wasavi.send("2b");
		assertPos("#4", 0, 0);
	}

	@Test
	public void testBigwordForward () {
		String base = "fir#t sec$nd\n\tthi%d wor^";
		Wasavi.send(":set noai\n");
		Wasavi.send("i" + base + "\u001bgg");

		assertPos("#1", 0, 0);

		Wasavi.send("W");
		assertPos("#2", 0, 6);

		Wasavi.send("2W");
		assertPos("#3", 1, 7);

		Wasavi.send("2W");
		assertPos("#4", 1, 10);

		Wasavi.send("gg", "cWFIRST\u001b");
		assertValue("#5", base.replaceFirst("^fir#t", "FIRST"));
	}

	@Test
	public void testBigwordForwardLast () {
		Wasavi.send("ia#c   d$f   g%i\u001b");
		Wasavi.send("13|");
		Wasavi.send("W");

		assertPos("#1", 0, 14);
		assertEquals("#2", "", Wasavi.getLastMessage());
	}

	@Test
	public void testBigwordBackward () {
		Wasavi.send(":set noai\n");
		Wasavi.send("ifir#t sec$nd\n\tthi%d wor^\u001b");

		assertPos("#1", 1, 10);

		Wasavi.send("B");
		assertPos("#2", 1, 7);

		Wasavi.send("2B");
		assertPos("#3", 0, 6);

		Wasavi.send("2B");
		assertPos("#4", 0, 0);
	}

	@Test
	public void testWordEnd () {
		String base = "first second\n\tthird word";
		Wasavi.send(":set noai\n");
		Wasavi.send("i" + base + "\u001bgg");

		Wasavi.send("e");
		assertPos("#1", 0, 4);

		Wasavi.send("2e");
		assertPos("#2", 1, 5);

		Wasavi.send("2e");
		assertPos("#3", 1, 10);
	}

	@Test
	public void testBigwordEnd () {
		String base = "fir#t sec$nd\n\tthi%d wor^";
		Wasavi.send(":set noai\n");
		Wasavi.send("i" + base + "\u001bgg");

		Wasavi.send("E");
		assertPos("#1", 0, 4);

		Wasavi.send("2E");
		assertPos("#2", 1, 5);

		Wasavi.send("2E");
		assertPos("#3", 1, 10);
	}

	@Test
	public void testGotoPrefix () {
		Wasavi.send(":set noai\n");
		Wasavi.send("i1\n2\n3\n4\n5\u001b");

		assertPos("#1", 4, 0);

		Wasavi.send("gg");
		assertPos("#2", 0, 0);

		Wasavi.send("i\t\u001b");
		Wasavi.send("gg");
		assertPos("#3", 0, 1);

		Wasavi.send("gx");
		assertTrue("#4", Wasavi.getLastMessage().length() > 0);
	}

	@Test
	public void testTopOfView () {
		int lines = Wasavi.makeScrollableBuffer();

		Wasavi.send("H");
		assertPos("#1", 0, 0);

		Wasavi.send("2H");
		assertPos("#2", 1, 0);

		Wasavi.send(String.format("%d", (lines * 2)), "H");
		assertPos("#3", lines - 1, 0);
	}

	@Test
	public void testMiddleOfView () {
		int lines = Wasavi.makeScrollableBuffer();

		Wasavi.send("M");
		assertPos("#1", (int)(lines / 2), 0);
	}

	@Test
	public void testBottomOfView () {
		int lines = Wasavi.makeScrollableBuffer();

		Wasavi.send("L");
		assertPos("#1", lines - 1, 0);

		Wasavi.send("2L");
		assertPos("#2", lines - 2, 0);

		Wasavi.send(String.format("%d", (lines * 2)), "L");
		assertPos("#3", 0, 0);
	}

	@Test
	public void testGoto () {
		Wasavi.send(":set noai\n");
		Wasavi.send("ifirst\n\tsecond\nthird\u001b");

		Wasavi.send("1G");
		assertPos("#1", 0, 0);

		Wasavi.send("2G");
		assertPos("#2", 1, 1);

		Wasavi.send("3G");
		assertPos("#3", 2, 0);

		Wasavi.send("100G");
		assertPos("#4", 2, 0);
	}

	@Test
	public void testSearchForwardNext () {
		Wasavi.send(":set noai\n");
		Wasavi.send("ifirst\n\tsecond\nthird\nthird\u001b");

		Wasavi.send("n");
		assertTrue("#1", Wasavi.getLastMessage().length() > 0);

		Wasavi.send("gg", "/third\n");
		assertPos("#2", 2, 0);

		Wasavi.send("n");
		assertPos("#3", 3, 0);

		Wasavi.send(":set nows\n");
		Wasavi.send("n");
		assertPos("#4", 3, 0);
		assertTrue("#5", Wasavi.getLastMessage().length() > 0);

		Wasavi.send(":set ws\n");
		Wasavi.send("n");
		assertPos("#6", 2, 0);
	}

	@Test
	public void testSearchFowardPrev () {
		Wasavi.send(":set noai\n");
		Wasavi.send("ifirst\n\tsecond\nthird\nthird\u001b");

		Wasavi.send("N");
		assertTrue("#1", Wasavi.getLastMessage().length() > 0);

		Wasavi.send("gg", "/third\n");
		assertPos("#2", 2, 0);

		Wasavi.send(":set nows\n");
		Wasavi.send("N");
		assertPos("#3", 2, 0);
		assertTrue("#4", Wasavi.getLastMessage().length() > 0);

		Wasavi.send(":set ws\n");
		Wasavi.send("N");
		assertPos("#5", 3, 0);

		Wasavi.send("N");
		assertPos("#6", 2, 0);
	}

	@Test
	public void testSearchBackwardNext () {
		Wasavi.send(":set noai\n");
		Wasavi.send("ifirst\nfirst\nsecond\nthird\u001b");
		assertPos("#1", 3, 4);

		Wasavi.send("n");
		assertTrue("#2", Wasavi.getLastMessage().length() > 0);
		assertPos("#3", 3, 4);

		Wasavi.send("?first\n");
		assertPos("#4", 1, 0);

		Wasavi.send("n");
		assertPos("#3", 0, 0);

		Wasavi.send(":set nows\n");
		Wasavi.send("n");
		assertPos("#4", 0, 0);
		assertTrue("#5", Wasavi.getLastMessage().length() > 0);

		Wasavi.send(":set ws\n");
		Wasavi.send("n");
		assertPos("#6", 1, 0);
	}

	@Test
	public void testSearchBackwardPrev () {
		Wasavi.send(":set noai\n");
		Wasavi.send("ifirst\nfirst\nsecond\nthird\u001b");

		Wasavi.send("N");
		assertTrue("#1", Wasavi.getLastMessage().length() > 0);

		Wasavi.send("?first\n");
		assertPos("#2", 1, 0);

		Wasavi.send(":set nows\n");
		Wasavi.send("N");
		assertPos("#3", 1, 0);
		assertTrue("#4", Wasavi.getLastMessage().length() > 0);

		Wasavi.send(":set ws\n");
		Wasavi.send("N");
		assertPos("#5", 0, 0);

		Wasavi.send("N");
		assertPos("#6", 1, 0);
	}
}

/* vim:set ts=4 sw=4 fileencoding=UTF-8 fileformat=unix filetype=java : */
