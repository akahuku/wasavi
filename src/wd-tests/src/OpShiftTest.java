package WasaviTest;

import static WasaviTest.WasaviAsserts.*;
import static WasaviTest.WasaviUtils.*;

import org.junit.*;
import static org.junit.Assert.*;
import java.util.regex.*;

import org.openqa.selenium.By;
import org.openqa.selenium.Keys;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
	
public class OpShiftTest extends WasaviTest {
	@Test
	public void testShift () {
		Wasavi.send(":set sw=8 noai\n");
		Wasavi.send("i1\n2\n3\u001b");

		Wasavi.send("gg>>");
		assertEquals("#1-1", "\t1\n2\n3", Wasavi.getValue());
		assertPos("#1-2", 0, 1);

		Wasavi.send(":set report=2\n");
		Wasavi.send("gg>2>");
		assertEquals("#2-1", "\t\t1\n\t2\n3", Wasavi.getValue());
		assertPos("#2-2", 0, 2);
		assertEquals("#2-3", "Shifted 2 lines.", Wasavi.getLastMessage());

		Wasavi.send("gg2>>");
		assertEquals("#3-1", "\t\t\t1\n\t\t2\n3", Wasavi.getValue());
		assertPos("#3-2", 0, 3);

		Wasavi.send("gg5>>");
		assertEquals("#4-1", "\t\t\t\t1\n\t\t\t2\n\t3", Wasavi.getValue());
		assertPos("#4-2", 0, 4);
	}

	@Test
	public void testShiftWithMark () {
		Wasavi.send(":set sw=4 noai\n");
		Wasavi.send("ifoo\u001b");

		Wasavi.send(">>");
		assertEquals("#1-1", "    foo", Wasavi.getValue());
		assertPos("#1-2", 0, 4);

		/*
		 * 4 spaces       8 spaces          1 tab
		 * ....foo   -->  ........foo  -->  +.......foo
		 *   ^mark              ^mark       ^mark
		 */
		Wasavi.send("3|ma>>");
		assertEquals("#2-1", "\tfoo", Wasavi.getValue());
		assertPos("#2-2", 0, 1);
		Wasavi.send("gg`a");
		assertPos("#3-1", 0, 0);
	}

	@Test
	public void testUnshift () {
		Wasavi.send(":set sw=8 noai\n");
		Wasavi.send("i\t\t\t\t1\n\t\t\t2\n\t3\u001b");

		Wasavi.send("gg<<");
		assertEquals("#1-1", "\t\t\t1\n\t\t\t2\n\t3", Wasavi.getValue());
		assertPos("#1-2", 0, 3);

		Wasavi.send(":set report=2\n");
		Wasavi.send("gg<2<");
		assertEquals("#2-1", "\t\t1\n\t\t2\n\t3", Wasavi.getValue());
		assertPos("#2-2", 0, 2);
		assertEquals("#2-3", "Unshifted 2 lines.", Wasavi.getLastMessage());

		Wasavi.send("gg2<<");
		assertEquals("#3-1", "\t1\n\t2\n\t3", Wasavi.getValue());
		assertPos("#3-2", 0, 1);

		Wasavi.send("gg5<<");
		assertEquals("#4-1", "1\n2\n3", Wasavi.getValue());
		assertPos("#4-2", 0, 0);
	}

	@Test
	public void testUnshiftWithMark () {
		Wasavi.send(":set sw=4 noai\n");
		Wasavi.send("i\tfoo\u001b");

		Wasavi.send("<<");
		assertEquals("#1-1", "    foo", Wasavi.getValue());
		assertPos("#1-2", 0, 4);

		/*
		 * 4 spaces
		 * ....foo   -->  foo
		 *   ^mark        ^mark
		 */
		Wasavi.send("3|ma<<");
		assertEquals("#2-1", "foo", Wasavi.getValue());
		assertPos("#2-2", 0, 0);
		Wasavi.send("$`a");
		assertPos("#3-1", 0, 0);
	}

	private void _testShiftUpLine (CharSequence a) {
		Wasavi.send(":set sw=8 noai\n");

		Wasavi.send("iline1\n\tline2\n\t\tline3\u001b");
		assertEquals("line1\n\tline2\n\t\tline3", Wasavi.getValue());

		Wasavi.send("3G");
		assertPos("#1-1", 2, 2);

		/*
		 * line1           line1
		 * .line2     -->  ..line2  *
		 * ..line3 *       ...line3
		 */
		Wasavi.send(String.format(">%s", a));
		assertPos("#2-1", 1, 2);
		assertEquals("#2-2", "line1\n\t\tline2\n\t\t\tline3", Wasavi.getValue());

		/*
		 * line1           .line1    *
		 * ..line2  *  --> ...line2
		 * ...line3        ...line3
		 */
		Wasavi.send(String.format(">3%s", a));
		assertPos("#3-1", 0, 1);
		assertEquals("#3-2", "\tline1\n\t\t\tline2\n\t\t\tline3", Wasavi.getValue());

		Wasavi.send(String.format(">3%s", a));
		assertEquals("#4-1", "\tline1\n\t\t\tline2\n\t\t\tline3", Wasavi.getValue());
		assertTrue("#4-2", Wasavi.getLastMessage().length() > 0);
	}

	@Test
	public void testShiftUpLine () {
		_testShiftUpLine("-");
	}

	private void _testShiftDownLine (CharSequence a) {
		Wasavi.send(":set sw=8 noai\n");

		Wasavi.send("iline1\n\tline2\n\t\tline3\u001b");
		assertEquals("line1\n\tline2\n\t\tline3", Wasavi.getValue());

		Wasavi.send("1G");
		assertPos("#1-1", 0, 0);

		/*
		 * line1   *       .line1  *
		 * .line2     -->  ..line2
		 * ..line3         ..line3
		 */
		Wasavi.send(String.format(">%s", a));
		assertPos("#2-1", 0, 1);
		assertEquals("#2-2", "\tline1\n\t\tline2\n\t\tline3", Wasavi.getValue());

		/*
		 * .line1  *       ..line1  *
		 * ..line2    -->  ...line2
		 * ..line3         ...line3
		 */
		Wasavi.send(String.format(">3%s", a));
		assertPos("#3-1", 0, 2);
		assertEquals("#3-2", "\t\tline1\n\t\t\tline2\n\t\t\tline3", Wasavi.getValue());

		Wasavi.send(String.format("3G>2%s", a));
		assertEquals("#4-1", "\t\tline1\n\t\t\tline2\n\t\t\tline3", Wasavi.getValue());
		assertTrue("#4-2", Wasavi.getLastMessage().length() > 0);
	}

	@Test
	public void testShiftDownLine () {
		_testShiftDownLine("+");
	}

	@Test
	public void testShiftDownEnter () {
		_testShiftDownLine(Keys.ENTER);
	}

	private void _testShiftFirstNonWhiteCharOfLine (CharSequence a) {
		Wasavi.send(":set sw=8 noai\n");

		Wasavi.send("i\tfoobar\u001b");
		Wasavi.send(String.format(">%s", a));

		assertEquals("#1-1", "\t\tfoobar", Wasavi.getValue());
		assertPos("#1-2", 0, 2);

		Wasavi.send(String.format("^>%s", a));
		assertEquals("#2-1", "\t\t\tfoobar", Wasavi.getValue());
		assertPos("#2-2", 0, 3);
	}

	@Test
	public void testShiftFirstNonWhiteCharOfLine () {
		_testShiftFirstNonWhiteCharOfLine("^");
	}

	@Test
	public void testShiftHome () {
		_testShiftFirstNonWhiteCharOfLine(Keys.HOME);
	}

	@Test
	public void testShiftTopOfLine () {
		Wasavi.send(":set sw=8 noai\n");
		Wasavi.send("i\tfoobar\u001b");
		Wasavi.send(">0");

		assertEquals("#1-1", "\t\tfoobar", Wasavi.getValue());
		assertPos("#1-2", 0, 2);
	}

	private void _testShiftTailOfLine (CharSequence a) {
		Wasavi.send(":set sw=8 noai\n");

		Wasavi.send("i\tfoobar\u001b1|");
		Wasavi.send(String.format(">%s", a));

		assertEquals("#1-1", "\t\tfoobar", Wasavi.getValue());
		assertPos("#1-3", 0, 2);
	}

	@Test
	public void testShiftTailOfLine () {
		_testShiftTailOfLine("$");
	}

	@Test
	public void testShiftEnd () {
		_testShiftTailOfLine(Keys.END);
	}

	@Test
	public void testShiftDirectColumn () {
		Wasavi.send(":set sw=8 noai\n");
		Wasavi.send("i0123456789\n0123456789\u001b1G1|");

		Wasavi.send(">5|");
		assertEquals("#1-1", "\t0123456789\n0123456789", Wasavi.getValue());
		assertPos("#1-2", 0, 1);

		Wasavi.send("$>4|");
		assertEquals("#2-1", "\t\t0123456789\n0123456789", Wasavi.getValue());
		assertPos("#2-2", 0, 2);

		Wasavi.send("2G1|>100|");
		assertEquals("#3-1", "\t\t0123456789\n\t0123456789", Wasavi.getValue());
		assertPos("#3-2", 1, 1);
	}

	@Test
	public void testShiftJumpToMatchedParenthes () {
		Wasavi.send(":set sw=8 noai\n");
		Wasavi.send("i(this is (first) line.\nthis is (second) line)]\u001b");

		Wasavi.send("1G1|f(>%");
		assertEquals("#1-1", "\t(this is (first) line.\nthis is (second) line)]", Wasavi.getValue());
		assertPos("#1-2", 0, 1);

		Wasavi.send("2G1|f)>%");
		assertEquals("#2-1", "\t(this is (first) line.\n\tthis is (second) line)]", Wasavi.getValue());
		assertPos("#2-2", 1, 1);

		Wasavi.send("G$F)>%");
		assertEquals("#3-1", "\t\t(this is (first) line.\n\t\tthis is (second) line)]", Wasavi.getValue());
		assertPos("#3-2", 0, 2);

		Wasavi.send("G$>%");
		assertPos("#4-1", 1, 24);
		assertTrue("#4-2", Wasavi.getLastMessage().length() > 0);
	}

	@Test
	public void testShiftSearchForward () {
		Wasavi.send(":set sw=8 noai\n");
		Wasavi.send("ifind the\nchar4cter in cu4rent 4line\u001b1G1|");

		Wasavi.send(">/4\n");
		assertEquals("#1-1", "\tfind the\n\tchar4cter in cu4rent 4line", Wasavi.getValue());
		assertPos("#1-2", 0, 1);

		Wasavi.send("2>/4\n");
		assertEquals("#2-1", "\t\tfind the\n\t\tchar4cter in cu4rent 4line", Wasavi.getValue());
		assertPos("#2-3", 0, 2);

		Wasavi.send("3>/X\n");
		assertEquals("#3-1", "\t\tfind the\n\t\tchar4cter in cu4rent 4line", Wasavi.getValue());
		assertPos("#3-2", 0, 2);
		assertTrue("#3-3", Wasavi.getLastMessage().length() > 0);
	}

	@Test
	public void testShiftSearchBackward () {
		Wasavi.send(":set sw=8 noai\n");
		Wasavi.send("ifind the char4cter in cu4rent\n4line\u001b");

		Wasavi.send("G$>?4\n");
		assertEquals("#1-1", "find the char4cter in cu4rent\n\t4line", Wasavi.getValue());
		assertPos("#1-3", 1, 1);

		Wasavi.send("2>?4\n");
		assertEquals("#2-1", "\tfind the char4cter in cu4rent\n\t\t4line", Wasavi.getValue());
		assertPos("#2-2", 0, 1);

		Wasavi.send("2>?X\n");
		assertEquals("#3-1", "\tfind the char4cter in cu4rent\n\t\t4line", Wasavi.getValue());
		assertPos("#3-2", 0, 1);
		assertTrue("#3-3", Wasavi.getLastMessage().length() > 0);
	}

	@Test
	public void testShiftFindForward () {
		Wasavi.send(":set sw=8 noai\n");
		Wasavi.send("i4irst 4second\n4hird 4ourth\u001b1G1|");

		Wasavi.send("0>f4");
		assertEquals("#1-1", "\t4irst 4second\n4hird 4ourth", Wasavi.getValue());
		assertPos("#1-2", 0, 1);

		Wasavi.send("02>f4");
		assertEquals("#2-1", "\t\t4irst 4second\n4hird 4ourth", Wasavi.getValue());
		assertPos("#2-2", 0, 2);

		Wasavi.send("04>f4");
		assertEquals("#3-1", "\t\t4irst 4second\n4hird 4ourth", Wasavi.getValue());
		assertPos("#3-2", 0, 0);
		assertTrue("#3-3", Wasavi.getLastMessage().length() > 0);
	}

	@Test
	public void testShiftFindBackward () {
		Wasavi.send(":set sw=8 noai\n");
		Wasavi.send("i4irst 4second\n4hird 4ourth\u001b1G1|");

		Wasavi.send("$>F4");
		assertEquals("#1-1", "\t4irst 4second\n4hird 4ourth", Wasavi.getValue());
		assertPos("#1-2", 0, 1);

		Wasavi.send("$2>F4");
		assertEquals("#2-1", "\t\t4irst 4second\n4hird 4ourth", Wasavi.getValue());
		assertPos("#2-2", 0, 2);

		Wasavi.send("$>3F4");
		assertEquals("#3-1", "\t\t4irst 4second\n4hird 4ourth", Wasavi.getValue());
		assertPos("#3-2", 0, 14);
		assertTrue("#3-3", Wasavi.getLastMessage().length() > 0);
	}

	@Test
	public void testShiftFindFowardBeforeStop () {
		Wasavi.send(":set sw=8 noai\n");
		Wasavi.send("i4irst 4second\n4hird 4ourth\u001b1G1|");

		Wasavi.send("0>t4");
		assertEquals("#1-1", "\t4irst 4second\n4hird 4ourth", Wasavi.getValue());
		assertPos("#1-2", 0, 1);

		Wasavi.send("02>t4");
		assertEquals("#2-1", "\t\t4irst 4second\n4hird 4ourth", Wasavi.getValue());
		assertPos("#2-2", 0, 2);

		Wasavi.send("04>t4");
		assertEquals("#3-1", "\t\t4irst 4second\n4hird 4ourth", Wasavi.getValue());
		assertPos("#3-2", 0, 0);
		assertTrue("#3-3", Wasavi.getLastMessage().length() > 0);
	}

	@Test
	public void testShiftFindBackwardBeforeStop () {
		Wasavi.send(":set sw=8 noai\n");
		Wasavi.send("i4irst 4second\n4hird 4ourth\u001b1G1|");
		
		Wasavi.send("$>T4");
		assertEquals("#1-1", "\t4irst 4second\n4hird 4ourth", Wasavi.getValue());
		assertPos("#1-2", 0, 1);

		Wasavi.send("$2>T4");
		assertEquals("#2-1", "\t\t4irst 4second\n4hird 4ourth", Wasavi.getValue());
		assertPos("#2-2", 0, 2);

		Wasavi.send("$>2T4");
		assertEquals("#3-1", "\t\t\t4irst 4second\n4hird 4ourth", Wasavi.getValue());
		assertPos("#3-2", 0, 3);

		Wasavi.send("$>3T4");
		assertEquals("#4-1", "\t\t\t4irst 4second\n4hird 4ourth", Wasavi.getValue());
		assertPos("#4-2", 0, 15);
		assertTrue("#4-3", Wasavi.getLastMessage().length() > 0);
	}

	@Test
	public void testShiftFindInvert () {
		Wasavi.send(":set sw=8 noai\n");
		Wasavi.send("4ifi4st s4cond th4rd fou4th\n\u001b");

		Wasavi.send("1G1|>f4$>,");
		assertEquals("#1-1", "\t\tfi4st s4cond th4rd fou4th", Wasavi.getValue().split("\n")[0]);
		assertPos("#1-2", 0, 2);

		Wasavi.send("2G1|>t4$>,");
		assertEquals("#2-1", "\t\tfi4st s4cond th4rd fou4th", Wasavi.getValue().split("\n")[1]);
		assertPos("#2-2", 1, 2);

		Wasavi.send("3G$>F40>,");
		assertEquals("#3-1", "\t\tfi4st s4cond th4rd fou4th", Wasavi.getValue().split("\n")[2]);
		assertPos("#3-2", 2, 2);

		Wasavi.send("4G$>T40>,");
		assertEquals("#4-1", "\t\tfi4st s4cond th4rd fou4th", Wasavi.getValue().split("\n")[3]);
		assertPos("#4-2", 3, 2);
	}

	@Test
	public void testShiftFindRepeat () {
		Wasavi.send(":set sw=8 noai\n");
		Wasavi.send("4ifi4st s4cond th4rd fou4th\n\u001b");

		Wasavi.send("1G1|f43|>;");
		assertEquals("#1-1", "\tfi4st s4cond th4rd fou4th", Wasavi.getValue().split("\n")[0]);
		assertPos("#1-3", 0, 1);

		Wasavi.send("2G1|t43|>;");
		assertEquals("#2-1", "\tfi4st s4cond th4rd fou4th", Wasavi.getValue().split("\n")[1]);
		assertPos("#2-3", 1, 1);

		Wasavi.send("3G$F4>;");
		assertEquals("#3-1", "\tfi4st s4cond th4rd fou4th", Wasavi.getValue().split("\n")[2]);
		assertPos("#3-2", 2, 1);

		Wasavi.send("4G$T4>;");
		assertEquals("#4-1", "\tfi4st s4cond th4rd fou4th", Wasavi.getValue().split("\n")[3]);
		assertPos("#4-2", 3, 1);
	}

	@Test
	public void testShiftDownLineOrient () {
		Wasavi.send(":set sw=8 noai\n");
		Wasavi.send("i1foobar\n2foobar\u001bgg");

		Wasavi.send(">_");
		/*
		 * 1foobar  -->  ^I1foobar
		 * 2foobar       2foobar
		 */
		assertEquals("#1-1", "\t1foobar\n2foobar", Wasavi.getValue());
		assertPos("#1-2", 0, 1);

		Wasavi.send("2G");
		Wasavi.send(">_");
		/*
		 * ^I1foobar  -->  ^I1foobar
		 * 2foobar         ^I2foobar
		 */
		assertEquals("#2-1", "\t1foobar\n\t2foobar", Wasavi.getValue());
		assertPos("#2-2", 1, 1);

		Wasavi.send("gg>2_");
		/*
		 * ^I1foobar  -->  ^I^I1foobar
		 * ^I2foobar       ^I^I2foobar
		 */
		assertEquals("#3-1", "\t\t1foobar\n\t\t2foobar", Wasavi.getValue());
		assertPos("#3-2", 0, 2);

		Wasavi.send(">3_");
		/*
		 * ^I^I1foobar  -->  ^I^I^I1foobar
		 * ^I^I2foobar       ^I^I^I2foobar
		 */
		assertEquals("#4-1", "\t\t\t1foobar\n\t\t\t2foobar", Wasavi.getValue());
		assertPos("#4-2", 0, 3);
	}

	@Test
	public void testShiftMark () {
		Wasavi.send(":set sw=8 noai\n");
		Wasavi.send("ifoo1bar\nbaz3bax\u001b");

		Wasavi.send("1G0f1ma0>`a");
		assertEquals("#1-1", "\tfoo1bar\nbaz3bax", Wasavi.getValue());
		assertPos("#1-2", 0, 1);

		Wasavi.send("2G$F3mb$>`b");
		assertEquals("#2-1", "\tfoo1bar\n\tbaz3bax", Wasavi.getValue());
		assertPos("#2-2", 1, 1);

		Wasavi.send(">`a");
		assertEquals("#3-1", "\t\tfoo1bar\n\t\tbaz3bax", Wasavi.getValue());
		assertPos("#3-2", 0, 2);

		Wasavi.send(">`c");
		assertEquals("#4-1", "\t\tfoo1bar\n\t\tbaz3bax", Wasavi.getValue());
		assertPos("#4-2", 0, 2);
		assertTrue("#4-3", Wasavi.getLastMessage().length() > 0);
	}

	@Test
	public void testShiftMarkLineOrient () {
		Wasavi.send(":set sw=8 noai\n");
		Wasavi.send("i1\n2\n3\n4\n5\n6\n7\u001b");

		Wasavi.send("3Gma1G>\'a");
		assertEquals("#1-1", "\t1\n\t2\n\t3\n4\n5\n6\n7", Wasavi.getValue());
		assertPos("#1-2", 0, 1);

		Wasavi.send("5GmaG>\'a");
		assertEquals("#2-1", "\t1\n\t2\n\t3\n4\n\t5\n\t6\n\t7", Wasavi.getValue());
		assertPos("#2-2", 4, 1);
	}

	@Test
	public void testShiftSectionForward () {
		// TBD
	}

	@Test
	public void testShiftSectionBackward () {
		// TBD
	}

	@Test
	public void testShiftParagraphForward () {
		// TBD
	}

	@Test
	public void testShiftParagraphBackward () {
		// TBD
	}

	@Test
	public void testShiftSentenceForward () {
		// TBD
	}

	@Test
	public void testShiftSentenceBackward () {
		// TBD
	}

	private void _testShiftDown (CharSequence a) {
		Wasavi.send(":set sw=8 noai\n");

		Wasavi.send("ifirst\nsecond\nthird\nf\nfifth\u001b");
		Wasavi.send(String.format("2G3|>10%s", a));
		assertEquals("#1-1", "first\n\tsecond\n\tthird\n\tf\n\tfifth", Wasavi.getValue());
		assertPos("#1-2", 1, 1);
		assertTrue("#1-3", Wasavi.getLastMessage().length() == 0);

		Wasavi.send(String.format("2G3|>%s", a));
		assertEquals("#2-1", "first\n\t\tsecond\n\t\tthird\n\tf\n\tfifth", Wasavi.getValue());
		assertPos("#2-2", 1, 2);

		Wasavi.send(String.format("G>%s", a));
		assertEquals("#3-1", "first\n\t\tsecond\n\t\tthird\n\tf\n\tfifth", Wasavi.getValue());
		assertPos("#3-2", 4, 1);
		assertTrue("#3-3", Wasavi.getLastMessage().length() > 0);
	}

	@Test
	public void testShiftDown () {
		_testShiftDown("j");
	}

	@Test
	public void testShiftDownCtrlN () {
		_testShiftDown("\u000e");
	}

	@Test
	public void testShiftDownDown () {
		_testShiftDown(Keys.DOWN);
	}

	private void _testShiftUp (CharSequence a) {
		Wasavi.send(":set sw=8 noai\n");

		Wasavi.send("ifirst\nsecond\nt\u001b");

		Wasavi.send(String.format("2G3|>10%s", a));
		assertEquals("#1-1", "\tfirst\n\tsecond\nt", Wasavi.getValue());
		assertPos("#1-2", 0, 1);
		assertTrue("#1-3", Wasavi.getLastMessage().length() == 0);

		Wasavi.send(String.format("2G1|>%s", a));
		assertEquals("#2-1", "\t\tfirst\n\t\tsecond\nt", Wasavi.getValue());
		assertPos("#2-2", 0, 2);

		Wasavi.send(String.format("1G>%s", a));
		assertEquals("#3-1", "\t\tfirst\n\t\tsecond\nt", Wasavi.getValue());
		assertPos("#3-2", 0, 2);
		assertTrue("#3-3", Wasavi.getLastMessage().length() > 0);
	}

	@Test
	public void testShiftUp () {
		_testShiftUp("k");
	}

	@Test
	public void testShiftUpCtrlP () {
		_testShiftUp("\u0010");
	}

	@Test
	public void testShiftUpUp () {
		_testShiftUp(Keys.UP);
	}

	private void _testShiftLeft (CharSequence a) {
		Wasavi.send(":set sw=8 noai\n");

		Wasavi.send("ifoo bar baz\u001b");
		assertPos("#1-1", 0, 10);

		Wasavi.send(String.format(">%s", a));
		assertEquals("#2-1", "\tfoo bar baz", Wasavi.getValue());
		assertPos("#2-2", 0, 1);

		Wasavi.send(String.format(">2%s", a));
		assertEquals("#3-1", "\t\tfoo bar baz", Wasavi.getValue());
		assertPos("#3-2", 0, 2);

		Wasavi.send(String.format(">100%s", a));
		assertEquals("#4-1", "\t\t\tfoo bar baz", Wasavi.getValue());
		assertPos("#4-2", 0, 3);
	}

	@Test
	public void testShiftLeft () {
		_testShiftLeft("h");
	}

	@Test
	public void testShiftLeftCtrlH () {
		_testShiftLeft("\u0008");
	}

	@Test
	public void testShiftLeftLeft () {
		_testShiftLeft(Keys.LEFT);
	}

	private void _testShiftRight (CharSequence a) {
		Wasavi.send(":set sw=8 noai\n");

		Wasavi.send("ifoo bar baz\u001b1|");
		assertPos("#1-1", 0, 0);

		Wasavi.send(String.format(">%s", a));
		assertEquals("#2-1", "\tfoo bar baz", Wasavi.getValue());
		assertPos("#2-2", 0, 1);

		Wasavi.send(String.format(">2%s", a));
		assertEquals("#3-1", "\t\tfoo bar baz", Wasavi.getValue());
		assertPos("#3-2", 0, 2);

		Wasavi.send(String.format(">5%s", a));
		assertEquals("#4-1", "\t\t\tfoo bar baz", Wasavi.getValue());
		assertPos("#4-2", 0, 3);

		Wasavi.send(String.format(">100%s", a));
		assertEquals("#5-1", "\t\t\t\tfoo bar baz", Wasavi.getValue());
		assertPos("#5-2", 0, 4);
	}

	@Test
	public void testShiftRight () {
		_testShiftRight("l");
	}

	@Test
	public void testShiftRightSpace () {
		_testShiftRight(" ");
	}

	@Test
	public void testShiftRightRight () {
		_testShiftRight(Keys.RIGHT);
	}

	@Test
	public void testShiftWordForward () {
		Wasavi.send(":set sw=8 noai\n");
		Wasavi.send("ifoo bar baz\nbax\u001b1|gg");

		Wasavi.send(">w");
		assertEquals("#1-1", "\tfoo bar baz\nbax", Wasavi.getValue());
		assertPos("#1-2", 0, 1);

		Wasavi.send("gg>2w");
		assertEquals("#2-1", "\t\tfoo bar baz\nbax", Wasavi.getValue());
		assertPos("#2-2", 0, 2);

		Wasavi.send("gg>3w");
		assertEquals("#3-1", "\t\t\tfoo bar baz\nbax", Wasavi.getValue());
		assertPos("#3-2", 0, 3);

		Wasavi.send("gg>4w");
		assertEquals("#4-1", "\t\t\t\tfoo bar baz\n\tbax", Wasavi.getValue());
		assertTrue("#4-2", Wasavi.getLastMessage().length() == 0);
		assertPos("#4-3", 0, 4);
	}

	@Test
	public void testShiftWordBackward () {
		Wasavi.send(":set sw=8 noai\n");
		Wasavi.send("ifoo\nbar baz bax\u001b");

		/*
		 * foo               foo
		 * bar baz bax  -->  .bar baz bax
		 */
		Wasavi.send(">b");
		assertEquals("#1-1", "foo\n\tbar baz bax", Wasavi.getValue());
		assertPos("#1-2", 1, 1);

		/*
		 * foo                .foo
		 * .bar baz bax  -->  ..bar baz bax
		 */
		Wasavi.send(">b");
		assertEquals("#2-1", "\tfoo\n\t\tbar baz bax", Wasavi.getValue());
		assertPos("#2-2", 0, 1);

		/*
		 * .foo
		 * ..bar baz bax
		 */
		Wasavi.send("1G1|>b");
		assertEquals("#3-1", "\tfoo\n\t\tbar baz bax", Wasavi.getValue());
		assertPos("#3-2", 0, 0);
		assertTrue("#3-3", Wasavi.getLastMessage().length() > 0);
	}

	@Test
	public void testShiftBigwordForward () {
		Wasavi.send(":set sw=8 noai\n");
		Wasavi.send("if#o b#r b#z\nb#x\u001b1|gg");

		Wasavi.send(">W");
		assertEquals("#1-1", "\tf#o b#r b#z\nb#x", Wasavi.getValue());
		assertPos("#1-2", 0, 1);

		Wasavi.send("gg>2W");
		assertEquals("#2-1", "\t\tf#o b#r b#z\nb#x", Wasavi.getValue());
		assertPos("#2-2", 0, 2);

		Wasavi.send("gg>3W");
		assertEquals("#3-1", "\t\t\tf#o b#r b#z\nb#x", Wasavi.getValue());
		assertPos("#3-2", 0, 3);

		Wasavi.send("gg>4W");
		assertEquals("#4-1", "\t\t\t\tf#o b#r b#z\n\tb#x", Wasavi.getValue());
		assertTrue("#4-2", Wasavi.getLastMessage().length() == 0);
		assertPos("#4-3", 0, 4);
	}

	@Test
	public void testShiftBigwordBackward () {
		Wasavi.send(":set sw=8 noai\n");
		Wasavi.send("if#o\nb#r b#z b#x\u001b");

		Wasavi.send("$>B");
		assertEquals("#1-1", "f#o\n\tb#r b#z b#x", Wasavi.getValue());
		assertPos("#1-2", 1, 1);

		Wasavi.send(">B");
		assertEquals("#2-1", "\tf#o\n\t\tb#r b#z b#x", Wasavi.getValue());
		assertPos("#2-2", 0, 1);

		Wasavi.send("0>B");
		assertEquals("#3-1", "\tf#o\n\t\tb#r b#z b#x", Wasavi.getValue());
		assertPos("#3-2", 0, 0);
		assertTrue("#3-3", Wasavi.getLastMessage().length() > 0);
	}

	@Test
	public void testShiftWordEnd () {
		Wasavi.send(":set sw=8 noai\n");
		Wasavi.send("ifoo bar\nbaz\nbax\u001bgg");

		Wasavi.send(">e");
		assertEquals("#1-1", "\tfoo bar\nbaz\nbax", Wasavi.getValue());
		assertPos("#1-2", 0, 1);

		Wasavi.send("gg>2e");
		assertEquals("#2-1", "\t\tfoo bar\nbaz\nbax", Wasavi.getValue());
		assertPos("#2-2", 0, 2);

		Wasavi.send("gg>3e");
		assertEquals("#3-1", "\t\t\tfoo bar\n\tbaz\nbax", Wasavi.getValue());
		assertPos("#3-3", 0, 3);
	}

	@Test
	public void testShiftBigwordEnd () {
		Wasavi.send(":set sw=8 noai\n");
		Wasavi.send("if@o b@r\nb@z\nb@x\u001bgg");

		Wasavi.send(">E");
		assertEquals("#1-1", "\tf@o b@r\nb@z\nb@x", Wasavi.getValue());
		assertPos("#1-2", 0, 1);

		Wasavi.send("gg>2E");
		assertEquals("#2-1", "\t\tf@o b@r\nb@z\nb@x", Wasavi.getValue());
		assertPos("#2-2", 0, 2);

		Wasavi.send("gg>3E");
		assertEquals("#3-1", "\t\t\tf@o b@r\n\tb@z\nb@x", Wasavi.getValue());
		assertPos("#3-2", 0, 3);
	}

	@Test
	public void testShiftGotoPrefix () {
		Wasavi.send(":set sw=8 noai\n");
		Wasavi.send("i 1\n2\n 3\u001b");

		Wasavi.send(">gg");
		assertEquals("#1-1", "\t 1\n\t2\n\t 3", Wasavi.getValue());
		assertPos("#1-2", 0, 2);
	}

	@Test
	public void testShiftTopOfView () {
		Wasavi.send(":set sw=8 noai\n");
		Wasavi.makeScrollableBuffer(2);

		int rowLength = Wasavi.getRowLength();
		Wasavi.send("GH");
		int viewLines = Wasavi.getRowLength() - Wasavi.getRow();

		Wasavi.send("G>H");

		int indented = 0;
		String[] lines = Wasavi.getValue().split("\n", 1000);
		for (String s: lines) {
			if (s.indexOf('\t') == 0) {
				indented++;
			}
		}
		assertEquals(indented, viewLines);
	}

	@Test
	public void testShiftMiddleOfView () {
		Wasavi.send(":set sw=8 noai\n");
		Wasavi.makeScrollableBuffer(2);

		int rowLength = Wasavi.getRowLength();
		Wasavi.send("ggM");
		int viewLines = Wasavi.getRow() + 1;

		Wasavi.send("gg>M");

		int indented = 0;
		String[] lines = Wasavi.getValue().split("\n", 1000);
		for (String s: lines) {
			if (s.indexOf('\t') == 0) {
				indented++;
			}
		}
		assertEquals(indented, viewLines);
	}

	@Test
	public void testShiftMiddleOfView2 () {
		Wasavi.send(":set sw=8 noai\n");
		Wasavi.makeScrollableBuffer(2);

		int rowLength = Wasavi.getRowLength();
		Wasavi.send("GM");
		int viewLines = Wasavi.getRowLength() - Wasavi.getRow();

		Wasavi.send("G>M");

		int indented = 0;
		String[] lines = Wasavi.getValue().split("\n", 1000);
		for (String s: lines) {
			if (s.indexOf('\t') == 0) {
				indented++;
			}
		}
		assertEquals(indented, viewLines);
	}

	@Test
	public void testShiftBottomOfView () {
		Wasavi.send(":set sw=8 noai\n");
		Wasavi.makeScrollableBuffer(2);

		int rowLength = Wasavi.getRowLength();
		Wasavi.send("ggL");
		int viewLines = Wasavi.getRow() + 1;

		Wasavi.send("gg>L");

		int indented = 0;
		String[] lines = Wasavi.getValue().split("\n", 1000);
		for (String s: lines) {
			if (s.indexOf('\t') == 0) {
				indented++;
			}
		}
		assertEquals(indented, viewLines);
	}

	@Test
	public void testShiftGoto () {
		Wasavi.send(":set sw=8 noai\n");
		Wasavi.send("i\t1\n\t2\n\t3\n\t4\n\t5\n\t6\n\t7\u001b");

		Wasavi.send("gg>3G");
		assertEquals("#1-1", "\t\t1\n\t\t2\n\t\t3\n\t4\n\t5\n\t6\n\t7", Wasavi.getValue());
		assertPos("#1-2", 0, 2);

		Wasavi.send("G>5G");
		assertEquals("#2-1", "\t\t1\n\t\t2\n\t\t3\n\t4\n\t\t5\n\t\t6\n\t\t7", Wasavi.getValue());
		assertPos("#2-2", 4, 2);
	}

	@Test
	public void testShiftSearchForwardNext_1 () {
		Wasavi.send(":set sw=8 noai\n");
		Wasavi.send(String.format("i%s\u001b", join("\n",
			"    def",		// .    def
			"foo",          // foo
			"baz"			// baz
		)));

		Wasavi.send("1G1|/foo\n");
		assertPos("#1-1", 1, 0);

		Wasavi.send("1G5|>n");
		assertEquals("#2-1", "\t    def\nfoo\nbaz", Wasavi.getValue());
		assertPos("#2-2", 0, 5);
	}

	@Test
	public void testShiftSearchForwardNext_2 () {
		Wasavi.send(":set sw=8 noai\n");
		Wasavi.send(String.format("i%s\u001b", join("\n",
			"abc def",		// .abc def
			"foo",			// foo
			"baz"			// baz
		)));

		Wasavi.send("1G1|/foo\n");
		assertPos("#1-1", 1, 0);

		Wasavi.send("1G5|>n");
		assertEquals("#2-1", "\tabc def\nfoo\nbaz", Wasavi.getValue());
		assertPos("#2-2", 0, 1);
	}

	@Test
	public void testShiftSearchForwardNext_3 () {
		Wasavi.send(":set sw=8 noai\n");
		Wasavi.send(String.format("i%s\u001b", join("\n",
			"    def",		// .    def
			"ghi foo",		// .ghi foo
			"baz"			// baz
		)));

		Wasavi.send("1G1|/foo\n");
		assertPos("#1-1", 1, 4);

		Wasavi.send("1G5|>n");
		assertEquals("#2-1", "\t    def\n\tghi foo\nbaz", Wasavi.getValue());
		assertPos("#2-3", 0, 5);
	}

	@Test
	public void testShiftSearchForwardNext_4 () {
		Wasavi.send(":set sw=8 noai\n");
		Wasavi.send(String.format("i%s\u001b", join("\n",
			"abc def",		// .abc def
			"ghi foo",		// .ghi foo
			"baz"			// baz
		)));

		Wasavi.send("1G1|/foo\n");
		assertPos("#1-1", 1, 4);

		Wasavi.send("1G5|>n");
		assertEquals("#2-1", "\tabc def\n\tghi foo\nbaz", Wasavi.getValue());
		assertPos("#2-3", 0, 1);
	}

	@Test
	public void testShiftSearchForwardPrev_1 () {
		Wasavi.send(":set sw=8 noai\n");
		Wasavi.send(String.format("i%s\u001b", join("\n",
			"    def",		// .    def
			"foo",          // foo
			"baz"			// baz
		)));

		Wasavi.send("1G1|/def\n");
		assertPos("#1-1", 0, 4);

		Wasavi.send("2G1|>N");
		assertEquals("#2-1", "\t    def\nfoo\nbaz", Wasavi.getValue());
		assertPos("#2-2", 0, 5);
	}

	@Test
	public void testShiftSearchForwardPrev_2 () {
		Wasavi.send(":set sw=8 noai\n");
		Wasavi.send(String.format("i%s\u001b", join("\n",
			"abc def",		// .abc def
			"foo",			// foo
			"baz"			// baz
		)));

		Wasavi.send("1G1|/def\n");
		assertPos("#1-1", 0, 4);

		Wasavi.send("2G1|>N");
		assertEquals("#2-1", "\tabc def\nfoo\nbaz", Wasavi.getValue());
		assertPos("#2-2", 0, 1);
	}

	@Test
	public void testShiftSearchForwardPrev_3 () {
		Wasavi.send(":set sw=8 noai\n");
		Wasavi.send(String.format("i%s\u001b", join("\n",
			"    def",		// .    def
			"ghi foo",		// .ghi foo
			"baz"			// baz
		)));

		Wasavi.send("1G1|/def\n");
		assertPos("#1-1", 0, 4);

		Wasavi.send("2G5|>N");
		assertEquals("#2-1", "\t    def\n\tghi foo\nbaz", Wasavi.getValue());
		assertPos("#2-3", 0, 5);
	}

	@Test
	public void testShiftSearchForwardPrev_4 () {
		Wasavi.send(":set sw=8 noai\n");
		Wasavi.send(String.format("i%s\u001b", join("\n",
			"abc def",		// .abc def
			"ghi foo",		// .ghi foo
			"baz"			// baz
		)));

		Wasavi.send("G?def\n");
		assertPos("#1-1", 0, 4);

		Wasavi.send("2G5|>N");
		assertEquals("#2-1", "\tabc def\n\tghi foo\nbaz", Wasavi.getValue());
		assertPos("#2-2", 0, 1);
	}

	@Test
	public void testShiftSearchBackwardNext_1 () {
		Wasavi.send(":set sw=8 noai\n");
		Wasavi.send(String.format("i%s\u001b", join("\n",
			"    def",		// .    def
			"foo",          // foo
			"baz"			// baz
		)));

		Wasavi.send("G?def\n");
		assertPos("#1-1", 0, 4);

		Wasavi.send("2G1|>n");
		assertEquals("#2-1", "\t    def\nfoo\nbaz", Wasavi.getValue());
		assertPos("#2-2", 0, 5);
	}

	@Test
	public void testShiftSearchBackwardNext_2 () {
		Wasavi.send(":set sw=8 noai\n");
		Wasavi.send(String.format("i%s\u001b", join("\n",
			"abc def",		// .abc def
			"foo",			// foo
			"baz"			// baz
		)));

		Wasavi.send("G?def\n");
		assertPos("#1-1", 0, 4);

		Wasavi.send("2G1|>n");
		assertEquals("#2-1", "\tabc def\nfoo\nbaz", Wasavi.getValue());
		assertPos("#2-2", 0, 1);
	}

	@Test
	public void testShiftSearchBackwardNext_3 () {
		Wasavi.send(":set sw=8 noai\n");
		Wasavi.send(String.format("i%s\u001b", join("\n",
			"    def",		// .    def
			"ghi foo",		// .ghi foo
			"baz"			// baz
		)));

		Wasavi.send("G?def\n");
		assertPos("#1-1", 0, 4);

		Wasavi.send("2G5|>n");
		assertEquals("#2-1", "\t    def\n\tghi foo\nbaz", Wasavi.getValue());
		assertPos("#2-2", 0, 5);
	}

	@Test
	public void testShiftSearchBackwardNext_4 () {
		Wasavi.send(":set sw=8 noai\n");
		Wasavi.send(String.format("i%s\u001b", join("\n",
			"abc def",		// .abc def
			"ghi foo",		// .ghi foo
			"baz"			// baz
		)));

		Wasavi.send("G?def\n");
		assertPos("#1-1", 0, 4);

		Wasavi.send("2G5|>n");
		assertEquals("#2-1", "\tabc def\n\tghi foo\nbaz", Wasavi.getValue());
		assertPos("#2-2", 0, 1);
	}

	@Test
	public void testShiftSearchBackwardPrev_1 () {
		Wasavi.send(":set sw=8 noai\n");
		Wasavi.send(String.format("i%s\u001b", join("\n",
			"    def",		// .    def
			"foo",          // foo
			"baz"			// baz
		)));

		Wasavi.send("G?foo\n");
		assertPos("#1-1", 1, 0);

		Wasavi.send("1G5|>N");
		assertEquals("#2-1", "\t    def\nfoo\nbaz", Wasavi.getValue());
		assertPos("#2-2", 0, 5);
	}

	@Test
	public void testShiftSearchBackwardPrev_2 () {
		Wasavi.send(":set sw=8 noai\n");
		Wasavi.send(String.format("i%s\u001b", join("\n",
			"abc def",		// .abc def
			"foo",			// foo
			"baz"			// baz
		)));

		Wasavi.send("G?foo\n");
		assertPos("#1-1", 1, 0);

		Wasavi.send("1G5|>N");
		assertEquals("#2-1", "\tabc def\nfoo\nbaz", Wasavi.getValue());
		assertPos("#2-2", 0, 1);
	}

	@Test
	public void testShiftSearchBackwardPrev_3 () {
		Wasavi.send(":set sw=8 noai\n");
		Wasavi.send(String.format("i%s\u001b", join("\n",
			"    def",		// .    def
			"ghi foo",		// .ghi foo
			"baz"			// baz
		)));

		Wasavi.send("G?foo\n");
		assertPos("#1-1", 1, 4);

		Wasavi.send("1G5|>N");
		assertEquals("#2-1", "\t    def\n\tghi foo\nbaz", Wasavi.getValue());
		assertPos("#2-2", 0, 5);
	}

	@Test
	public void testShiftSearchBackwardPrev_4 () {
		Wasavi.send(":set sw=8 noai\n");
		Wasavi.send(String.format("i%s\u001b", join("\n",
			"abc def",		// .abc def
			"ghi foo",		// .ghi foo
			"baz"			// baz
		)));

		Wasavi.send("G?foo\n");
		assertPos("#1-1", 1, 4);

		Wasavi.send("1G5|>N");
		assertEquals("#2-1", "\tabc def\n\tghi foo\nbaz", Wasavi.getValue());
		assertPos("#2-2", 0, 1);
	}
}

/* vim:set ts=4 sw=4 fileencoding=UTF-8 fileformat=unix filetype=java : */
