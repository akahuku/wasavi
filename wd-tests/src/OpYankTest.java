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

public class OpYankTest extends WasaviTest {
	@Test
	public void testYank () {
		Wasavi.send("i1\n2\u001bgg");

		Wasavi.send("yy");
		assertEquals("#1-1", "1\n", Wasavi.getRegister("\""));
		assertPos("#1-2", 0, 0);

		Wasavi.send(":set report=2\n");
		Wasavi.send("y2y");
		assertEquals("#2-1", "1\n2\n", Wasavi.getRegister("\""));
		assertPos("#2-2", 0, 0);
		assertEquals("#2-3", "Yanked 2 lines.", Wasavi.getLastMessage());

		Wasavi.send("2yy");
		assertEquals("#3-1", "1\n2\n", Wasavi.getRegister("\""));
		assertPos("#3-2", 0, 0);

		Wasavi.send("3yy");
		assertEquals("#4-1", "1\n2\n", Wasavi.getRegister("\""));
		assertPos("#4-2", 0, 0);
	}

	@Test
	public void testYankToClipboard () {
		Wasavi.send("itext from wasavi\u001b");
		Wasavi.send("\"*yy");
		assertEquals("#1-1", "text from wasavi\n", getClipboardText());
		assertPos("#1-2", 0, 15);

		Wasavi.send("$b\"*yw");
		assertEquals("#2-1", "wasavi", getClipboardText());
		assertPos("#2-2", 0, 10);
	}

	private void _testYankUpLine (CharSequence a) {
		Wasavi.send(":set noai\n");
		Wasavi.send("iline\n\tline2\n\t\tline3\u001b");
		assertEquals("line\n\tline2\n\t\tline3", Wasavi.getValue());

		Wasavi.send("3G");
		assertPos("#1-1", 2, 2);

		Wasavi.send(String.format("y%s", a));
		assertPos("#2-1", 1, 1);
		assertEquals("#2-2", "\tline2\n\t\tline3\n", Wasavi.getRegister("\""));
		assertEquals("#2-3", "\tline2\n\t\tline3\n", Wasavi.getRegister("1"));

		Wasavi.send(String.format("y%s", a));
		assertPos("#2-1", 0, 0);
		assertEquals("#3-2", "line\n\tline2\n", Wasavi.getRegister("\""));
		assertEquals("#3-3", "line\n\tline2\n", Wasavi.getRegister("1"));
		assertEquals("#3-4", "\tline2\n\t\tline3\n", Wasavi.getRegister("2"));

		Wasavi.send(String.format("y%s", a));
		assertPos("#4-1", 0, 0);
		assertEquals("#4-2", "line\n\tline2\n", Wasavi.getRegister("\""));
		assertTrue("#4-3", Wasavi.getLastMessage().length() > 0);
	}

	@Test
	public void testYankUpLine () {
		_testYankUpLine("-");
	}

	private void _testYankDownLine (CharSequence a) {
		Wasavi.send(":set noai\n");
		Wasavi.send("iline\n\tline2\n\t\tline3\u001b");
		assertEquals("line\n\tline2\n\t\tline3", Wasavi.getValue());

		Wasavi.send("gg");
		assertPos("#1-1", 0, 0);

		Wasavi.send(String.format("y%s", a));
		assertPos("#2-1", 0, 0);
		assertEquals("#2-2", "line\n\tline2\n", Wasavi.getRegister("\""));
		assertEquals("#2-3", "line\n\tline2\n", Wasavi.getRegister("1"));

		Wasavi.send(String.format("y2%s", a));
		assertPos("#2-1", 0, 0);
		assertEquals("#3-2", "line\n\tline2\n\t\tline3\n", Wasavi.getRegister("\""));
		assertEquals("#3-3", "line\n\tline2\n\t\tline3\n", Wasavi.getRegister("1"));
		assertEquals("#3-4", "line\n\tline2\n", Wasavi.getRegister("2"));

		Wasavi.send(String.format("3Gy%s", a));
		assertPos("#4-1", 2, 2);
		assertEquals("#4-2", "line\n\tline2\n\t\tline3\n", Wasavi.getRegister("\""));
		assertTrue("#4-3", Wasavi.getLastMessage().length() > 0);
	}

	@Test
	public void testYankDownLine () {
		_testYankDownLine("+");
	}

	@Test
	public void testYankDownEnter () {
		_testYankDownLine(Keys.ENTER);
	}

	private void _testYankFirstNonWhiteCharOfLine (CharSequence a) {
		Wasavi.send(":set noai\n");
		Wasavi.send("i\tfoobar\u001b");
		Wasavi.send(String.format("y%s", a));

		assertEquals("#1-1", "\tfoobar", Wasavi.getValue());
		assertEquals("#1-2", "fooba", Wasavi.getRegister("\""));
		assertPos("#1-3", 0, 1);

		// if selected string is empty, register should not be modified.
		Wasavi.send(String.format("y%s", a));
		assertEquals("#2-1", "fooba", Wasavi.getRegister("\""));
		assertPos("#2-2", 0, 1);
	}

	@Test
	public void testYankFirstNonWhiteCharOfLine  () {
		_testYankFirstNonWhiteCharOfLine("^");
	}

	@Test
	public void testYankHome () {
		_testYankFirstNonWhiteCharOfLine(Keys.HOME);
	}

	@Test
	public void testYankTopOfLine () {
		Wasavi.send(":set noai\n");
		Wasavi.send("i\tfoobar\u001b");
		Wasavi.send("y0");

		assertEquals("#1-1", "\tfooba", Wasavi.getRegister("\""));
		assertPos("#1-2", 0, 0);
	}

	private void _testYankTailOfLine (CharSequence a) {
		Wasavi.send(":set noai\n");
		Wasavi.send("i\tfoobar\u001b1|");
		Wasavi.send(String.format("y%s", a));

		assertEquals("#1-1", "\tfoobar", Wasavi.getRegister("\""));
		assertPos("#1-2", 0, 0);
	}

	@Test
	public void testYankTailOfLine () {
		_testYankTailOfLine("$");
	}

	@Test
	public void testYankEnd () {
		_testYankTailOfLine(Keys.END);
	}

	@Test
	public void testYankDirectColumn () {
		Wasavi.send("i0123456789\n0123456789\u001b1G1|");

		Wasavi.send("y5|");
		assertEquals("#1-1", "0123", Wasavi.getRegister("\""));
		assertPos("#1-2", 0, 0);

		Wasavi.send("$y3|");
		assertEquals("#2-1", "2345678", Wasavi.getRegister("\""));
		assertPos("#2-2", 0, 2);

		Wasavi.send("2G1|y100|");
		assertEquals("#3-1", "0123456789", Wasavi.getRegister("\""));
		assertPos("#3-2", 1, 0);
	}

	@Test
	public void testYankJumpToMatchedParenthes () {
		Wasavi.send("ithis is (first) line.\nthis is (second) line)\u001b");

		Wasavi.send("1G1|f(y%");
		assertEquals("#1-1", "(first)", Wasavi.getRegister("\""));
		assertPos("#1-2", 0, 8);

		Wasavi.send("2G1|f)y%");
		assertEquals("#2-1", "(second)", Wasavi.getRegister("\""));
		assertPos("#2-2", 1, 8);

		Wasavi.send("G$y%");
		assertEquals("#3-1", "(second)", Wasavi.getRegister("\""));
		assertPos("#3-2", 1, 21);
		assertTrue("#3-3", Wasavi.getLastMessage().length() > 0);
	}

	@Test
	public void testYankSearchForward () {
		Wasavi.send("ifind the\nchar4cter in cu4rent 4line\u001b1G1|");

		Wasavi.send("y/4\n");
		assertEquals("#1-1", "find the\nchar", Wasavi.getRegister("\""));
		assertPos("#1-2", 0, 0);

		Wasavi.send("2y/4\n");
		assertEquals("#2-1", "find the\nchar4cter in cu", Wasavi.getRegister("\""));
		assertPos("#2-2", 0, 0);

		Wasavi.send("2y/X\n");
		assertEquals("#3-1", "find the\nchar4cter in cu", Wasavi.getRegister("\""));
		assertPos("#3-2", 0, 0);
		assertTrue("#3-3", Wasavi.getLastMessage().length() > 0);
	}

	@Test
	public void testYankSearchBackward () {
		Wasavi.send("ifind the char4cter in cu4rent\n4line\u001b");

		Wasavi.send("G$y?4\n");
		assertEquals("#1-1", "4lin", Wasavi.getRegister("\""));
		assertPos("#1-2", 1, 0);

		Wasavi.send("G$2y?4\n");
		assertEquals("#2-1", "4rent\n4lin", Wasavi.getRegister("\""));
		assertPos("#2-2", 0, 24);

		Wasavi.send("G$2y?X\n");
		assertEquals("#3-1", "4rent\n4lin", Wasavi.getRegister("\""));
		assertPos("#3-2", 1, 4);
		assertTrue("#3-3", Wasavi.getLastMessage().length() > 0);
	}

	@Test
	public void testYankFindForward () {
		Wasavi.send("ifind the char4cter in cu4rent 4line\u001b1G1|");

		Wasavi.send("yf4");
		assertEquals("#1-1", "find the char4", Wasavi.getRegister("\""));
		assertPos("#1-2", 0, 0);

		Wasavi.send("2yf4");
		assertEquals("#2-1", "find the char4cter in cu4", Wasavi.getRegister("\""));
		assertPos("#2-2", 0, 0);

		Wasavi.send("4yf4");
		assertEquals("#3-1", "find the char4cter in cu4", Wasavi.getRegister("\""));
		assertPos("#3-2", 0, 0);
		assertTrue("#3-3", Wasavi.getLastMessage().length() > 0);
	}

	@Test
	public void testYankFindBackward () {
		Wasavi.send("ifind the char4cter in cu4rent 4line\u001b");

		Wasavi.send("yF4");
		assertEquals("#1-1", "4lin", Wasavi.getRegister("\""));
		assertPos("#1-2", 0, 30);

		Wasavi.send("2yF4");
		assertEquals("#2-1", "4cter in cu4rent ", Wasavi.getRegister("\""));
		assertPos("#2-2", 0, 13);

		Wasavi.send("yF4");
		assertEquals("#3-1", "4cter in cu4rent ", Wasavi.getRegister("\""));
		assertPos("#3-2", 0, 13);
		assertTrue("#3-3", Wasavi.getLastMessage().length() > 0);
	}

	@Test
	public void testYankFindFowardBeforeStop () {
		Wasavi.send("ifind the char4cter in cu4rent 4line\u001b1G1|");

		Wasavi.send("yt4");
		assertEquals("#1-1", "find the char", Wasavi.getRegister("\""));
		assertPos("#1-2", 0, 0);

		Wasavi.send("2yt4");
		assertEquals("#2-1", "find the char4cter in cu", Wasavi.getRegister("\""));
		assertPos("#2-2", 0, 0);

		Wasavi.send("4yt4");
		assertEquals("#3-1", "find the char4cter in cu", Wasavi.getRegister("\""));
		assertPos("#3-2", 0, 0);
		assertTrue("#3-3", Wasavi.getLastMessage().length() > 0);
	}

	@Test
	public void testYankFindBackwardBeforeStop () {
		Wasavi.send("ifind the char4cter in cu4rent 4line\u001b");
		
		Wasavi.send("yT4");
		assertEquals("#1-1", "lin", Wasavi.getRegister("\""));
		assertPos("#1-2", 0, 31);

		Wasavi.send("yT4");
		assertEquals("#2-1", "lin", Wasavi.getRegister("\""));
		assertPos("#2-2", 0, 31);

		Wasavi.send("y2T4");
		assertEquals("#3-1", "rent 4", Wasavi.getRegister("\""));
		assertPos("#3-2", 0, 25);

		Wasavi.send("y3T4");
		assertEquals("#4-1", "rent 4", Wasavi.getRegister("\""));
		assertPos("#4-2", 0, 25);
		assertTrue("#4-3", Wasavi.getLastMessage().length() > 0);
	}

	@Test
	public void testYankFindInvert () {
		Wasavi.send("4ifi4st s4cond th4rd fou4th\n\u001b");

		Wasavi.send("1G1|yf4$y,");
		assertEquals("#1-1", "4t", Wasavi.getRegister("\""));
		assertPos("#1-2", 0, 22);

		Wasavi.send("2G1|yt4$y,");
		assertEquals("#2-1", "t", Wasavi.getRegister("\""));
		assertPos("#2-2", 1, 23);

		Wasavi.send("3G$yF40y,");
		assertEquals("#3-1", "fi4", Wasavi.getRegister("\""));
		assertPos("#3-2", 2, 0);

		Wasavi.send("4G$yT40y,");
		assertEquals("#4-1", "fi", Wasavi.getRegister("\""));
		assertPos("#4-2", 3, 0);
	}

	@Test
	public void testYankFindRepeat () {
		Wasavi.send("4ifi4st s4cond th4rd fou4th\n\u001b");

		Wasavi.send("1G1|yf43|y;");
		assertEquals("#1-1", "4st s4", Wasavi.getRegister("\""));
		assertPos("#1-2", 0, 2);

		Wasavi.send("2G1|yt43|y;");
		assertEquals("#2-1", "4st s", Wasavi.getRegister("\""));
		assertPos("#2-2", 1, 2);

		Wasavi.send("3G$yF4y;");
		assertEquals("#3-1", "4rd fou", Wasavi.getRegister("\""));
		assertPos("#3-2", 2, 15);

		Wasavi.send("4G$yT4y;");
		assertEquals("#4-1", "rd fou4", Wasavi.getRegister("\""));
		assertPos("#4-2", 3, 16);
	}

	@Test
	public void testYankDownLineOrient () {
		Wasavi.send(":set noai\n");
		Wasavi.send("i\t1foobar\n\t2foobar\u001bgg");

		Wasavi.send("y_");
		assertEquals("#1-1", "\t1foobar\n", Wasavi.getRegister("\""));
		assertPos("#1-2", 0, 1);

		Wasavi.send("y2_");
		assertEquals("#2-1", "\t1foobar\n\t2foobar\n", Wasavi.getRegister("\""));
		assertPos("#2-2", 0, 1);

		Wasavi.send("rXy3_");
		assertEquals("#3-1", "\tXfoobar\n\t2foobar\n", Wasavi.getRegister("\""));
		assertPos("#3-2", 0, 1);
	}

	@Test
	public void testYankMark () {
		Wasavi.send("ifoo1bar\nbaz3bax\u001b");

		Wasavi.send("1G0f1ma0y`a");
		assertEquals("#1-1", "foo", Wasavi.getRegister("\""));
		assertPos("#1-2", 0, 0);

		Wasavi.send("2G$F3ma$y`a");
		assertEquals("#2-1", "3ba", Wasavi.getRegister("\""));
		assertPos("#2-2", 1, 3);
	}

	@Test
	public void testYankMarkLineOrient () {
		Wasavi.send("i1\n2\n3\n4\n5\n6\n7\u001b");

		Wasavi.send("3Gma1Gy\'a");
		assertEquals("#1-1", "1\n2\n3\n", Wasavi.getRegister("\""));
		assertPos("#1-2", 0, 0);

		Wasavi.send("5GmaGy\'a");
		assertEquals("#2-1", "5\n6\n7\n", Wasavi.getRegister("\""));
		assertPos("#2-2", 4, 0);
	}

	@Test
	public void testYankSectionForward () {
		// TBD
	}

	@Test
	public void testYankSectionBackward () {
		// TBD
	}

	@Test
	public void testYankParagraphForward () {
		// TBD
	}

	@Test
	public void testYankParagraphBackward () {
		// TBD
	}

	@Test
	public void testYankSentenceForward () {
		// TBD
	}

	@Test
	public void testYankSentenceBackward () {
		// TBD
	}

	private void _testYankDown (CharSequence a) {
		Wasavi.send("ifirst\nsecond\nthird\nf\nfifth\u001b");
		Wasavi.send(String.format("2G3|y10%s", a));
		assertEquals("#1-1", "second\nthird\nf\nfifth\n", Wasavi.getRegister("\""));
		assertPos("#1-2", 1, 2);
		assertTrue("#1-3", Wasavi.getLastMessage().length() == 0);
		assertEquals("#1-4", "second\nthird\nf\nfifth\n", Wasavi.getRegister("1"));
		assertEquals("#1-5", "first\nsecond\nthird\nf\nfifth", Wasavi.getValue());

		Wasavi.send(String.format("2G3|y%s", a));
		assertEquals("#2-1", "second\nthird\n", Wasavi.getRegister("\""));
		assertEquals("#2-2", "second\nthird\n", Wasavi.getRegister("1"));
		assertEquals("#2-3", "second\nthird\nf\nfifth\n", Wasavi.getRegister("2"));
		assertEquals("#2-4", "first\nsecond\nthird\nf\nfifth", Wasavi.getValue());
		assertPos("#2-5", 1, 2);
	}

	@Test
	public void testYankDown () {
		_testYankDown("j");
	}

	@Test
	public void testYankDownCtrlN () {
		_testYankDown("\u000e");
	}

	@Test
	public void testYankDownDown () {
		_testYankDown(Keys.DOWN);
	}

	private void _testYankUp (CharSequence a) {
		Wasavi.send("ifirst\nsecond\nt\u001b");

		Wasavi.send(String.format("2G3|y10%s", a));
		assertEquals("#1-1", "first\nsecond\n", Wasavi.getRegister("\""));
		assertPos("#1-2", 0, 2);
		assertTrue("#1-3", Wasavi.getLastMessage().length() == 0);

		Wasavi.send(String.format("3G1|y%s", a));
		assertEquals("#2-1", "second\nt\n", Wasavi.getRegister("\""));
		assertEquals("#2-2", "second\nt\n", Wasavi.getRegister("1"));
		assertEquals("#2-3", "first\nsecond\n", Wasavi.getRegister("2"));
		assertPos("#2-4", 1, 0);
	}

	@Test
	public void testYankUp () {
		_testYankUp("k");
	}

	@Test
	public void testYankUpCtrlP () {
		_testYankUp("\u0010");
	}

	@Test
	public void testYankUpUp () {
		_testYankUp(Keys.UP);
	}

	private void _testYankLeft (CharSequence a) {
		Wasavi.send("ifoo bar baz\u001b");
		assertPos("#1-1", 0, 10);

		Wasavi.send(String.format("y%s", a));
		assertEquals("#2-1", "a", Wasavi.getRegister("\""));
		assertPos("#2-2", 0, 9);

		Wasavi.send(String.format("y2%s", a));
		assertEquals("#3-1", " b", Wasavi.getRegister("\""));
		assertPos("#3-2", 0, 7);

		Wasavi.send(String.format("y100%s", a));
		assertEquals("#4-1", "foo bar", Wasavi.getRegister("\""));
		assertPos("#4-2", 0, 0);
	}

	@Test
	public void testYankLeft () {
		_testYankLeft("h");
	}

	@Test
	public void testYankLeftCtrlH () {
		_testYankLeft("\u0008");
	}

	@Test
	public void testYankLeftLeft () {
		_testYankLeft(Keys.LEFT);
	}

	private void _testYankRight (CharSequence a) {
		Wasavi.send("ifoo bar baz\u001b1|");
		assertPos("#1-1", 0, 0);

		Wasavi.send(String.format("y%s", a));
		assertEquals("#2-1", "foo bar baz", Wasavi.getValue());
		assertPos("#2-2", 0, 0);
		assertEquals("#2-3", "f", Wasavi.getRegister("\""));

		Wasavi.send(String.format("\"ay2%s", a));
		assertEquals("#3-1", "foo bar baz", Wasavi.getValue());
		assertPos("#3-2", 0, 0);
		assertEquals("#3-3", "fo", Wasavi.getRegister("a"));
		assertEquals("#3-4", "fo", Wasavi.getRegister("\""));

		Wasavi.send(String.format("y5%s", a));
		assertEquals("#4-1", "foo bar baz", Wasavi.getValue());
		assertPos("#4-2", 0, 0);
		assertEquals("#4-3", "foo b", Wasavi.getRegister("\""));

		Wasavi.send(String.format("y100%s", a));
		assertEquals("#5-1", "foo bar baz", Wasavi.getValue());
		assertPos("#5-2", 0, 0);
		assertEquals("#5-3", "foo bar baz", Wasavi.getRegister("\""));
	}

	@Test
	public void testYankRight () {
		_testYankRight("l");
	}

	@Test
	public void testYankRightSpace () {
		_testYankRight(" ");
	}

	@Test
	public void testYankRightRight () {
		_testYankRight(Keys.RIGHT);
	}

	@Test
	public void testYankWordForward () {
		Wasavi.send("ifoo bar baz\nbax\u001b1|gg");

		Wasavi.send("yw");
		assertEquals("#1-1", "foo bar baz\nbax", Wasavi.getValue());
		assertPos("#1-2", 0, 0);
		assertEquals("#1-3", "foo ", Wasavi.getRegister("\""));

		Wasavi.send("y2w");
		assertEquals("#2-1", "foo bar baz\nbax", Wasavi.getValue());
		assertPos("#2-2", 0, 0);
		assertEquals("#2-3", "foo bar ", Wasavi.getRegister("\""));

		Wasavi.send("y3w");
		assertEquals("#3-1", "foo bar baz\nbax", Wasavi.getValue());
		assertPos("#3-2", 0, 0);
		assertEquals("#3-3", "foo bar baz", Wasavi.getRegister("\""));

		Wasavi.send("y4w");
		assertEquals("#4-1", "foo bar baz\nbax", Wasavi.getValue());
		assertTrue("#4-2", Wasavi.getLastMessage().length() == 0);
		assertPos("#4-3", 0, 0);
		assertEquals("#4-4", "foo bar baz\nbax", Wasavi.getRegister("\""));
	}

	@Test
	public void testYankWordBackward () {
		Wasavi.send("ifoo\nbar baz bax\u001b");

		Wasavi.send("yb");
		assertEquals("#1-1", "foo\nbar baz bax", Wasavi.getValue());
		assertPos("#1-2", 1, 8);
		assertEquals("#1-3", "ba", Wasavi.getRegister("\""));

		Wasavi.send("y2b");
		assertEquals("#2-1", "foo\nbar baz bax", Wasavi.getValue());
		assertPos("#2-2", 1, 0);
		assertEquals("#2-3", "bar baz ", Wasavi.getRegister("\""));

		Wasavi.send("yb");
		assertEquals("#3-1", "foo\nbar baz bax", Wasavi.getValue());
		assertPos("#3-2", 0, 0);
		assertEquals("#3-3", "foo\n", Wasavi.getRegister("\""));
	}

	@Test
	public void testYankBigwordForward () {
		Wasavi.send("if#o b#r b#z\nb#x\u001b1|gg");

		Wasavi.send("yW");
		assertEquals("#1-1", "f#o b#r b#z\nb#x", Wasavi.getValue());
		assertPos("#1-2", 0, 0);
		assertEquals("#1-3", "f#o ", Wasavi.getRegister("\""));

		Wasavi.send("y2W");
		assertEquals("#2-1", "f#o b#r b#z\nb#x", Wasavi.getValue());
		assertPos("#2-2", 0, 0);
		assertEquals("#2-3", "f#o b#r ", Wasavi.getRegister("\""));

		Wasavi.send("y3W");
		assertEquals("#3-1", "f#o b#r b#z\nb#x", Wasavi.getValue());
		assertPos("#3-2", 0, 0);
		assertEquals("#3-3", "f#o b#r b#z", Wasavi.getRegister("\""));

		Wasavi.send("y4W");
		assertEquals("#4-1", "f#o b#r b#z\nb#x", Wasavi.getValue());
		assertTrue("#4-2", Wasavi.getLastMessage().length() == 0);
		assertPos("#4-3", 0, 0);
		assertEquals("#4-4", "f#o b#r b#z\nb#x", Wasavi.getRegister("\""));
	}

	@Test
	public void testYankBigwordBackward () {
		Wasavi.send("if#o\nb#r b#z b#x\u001b");

		Wasavi.send("yB");
		assertEquals("#1-1", "f#o\nb#r b#z b#x", Wasavi.getValue());
		assertPos("#1-2", 1, 8);
		assertEquals("#1-3", "b#", Wasavi.getRegister("\""));

		Wasavi.send("y2B");
		assertEquals("#2-1", "f#o\nb#r b#z b#x", Wasavi.getValue());
		assertPos("#2-2", 1, 0);
		assertEquals("#2-3", "b#r b#z ", Wasavi.getRegister("\""));

		Wasavi.send("yB");
		assertEquals("#3-1", "f#o\nb#r b#z b#x", Wasavi.getValue());
		assertPos("#3-2", 0, 0);
		assertEquals("#3-3", "f#o\n", Wasavi.getRegister("\""));
	}

	@Test
	public void testYankWordEnd () {
		Wasavi.send("ifoo bar\nbaz\nbax\u001bgg");

		Wasavi.send("ye");
		assertEquals("#1-1", "foo", Wasavi.getRegister("\""));
		assertPos("#1-2", 0, 0);

		Wasavi.send("y2e");
		assertEquals("#2-1", "foo bar", Wasavi.getRegister("\""));
		assertPos("#2-2", 0, 0);

		Wasavi.send("gg3e");
		assertPos("#3-x-1", 1, 2);
		Wasavi.send("ggy3e");
		assertEquals("#3-1", "foo bar\nbaz", Wasavi.getRegister("\""));
		assertPos("#3-2", 0, 0);
	}

	@Test
	public void testYankBigwordEnd () {
		Wasavi.send("if@o b@r\nb@z\nb@x\u001bgg");

		Wasavi.send("yE");
		assertEquals("#1-1", "f@o", Wasavi.getRegister("\""));
		assertPos("#1-2", 0, 0);

		Wasavi.send("y2E");
		assertEquals("#2-1", "f@o b@r", Wasavi.getRegister("\""));
		assertPos("#2-2", 0, 0);

		Wasavi.send("gg3E");
		assertPos("#3-x-1", 1, 2);
		Wasavi.send("ggy3E");
		assertEquals("#3-1", "f@o b@r\nb@z", Wasavi.getRegister("\""));
		assertPos("#3-2", 0, 0);
	}

	@Test
	public void testYankGotoPrefix () {
		Wasavi.send(":set noai\n");
		Wasavi.send("i 1\n2\n 3\u001b");

		Wasavi.send("ygg");
		assertEquals("#1-1", " 1\n2\n 3\n", Wasavi.getRegister("\""));
		assertEquals("#1-2", " 1\n2\n 3\n", Wasavi.getRegister("1"));
		assertPos("#1-3", 0, 1);
	}

	@Test
	public void testYankTopOfView () {
		Wasavi.makeScrollableBuffer(2);

		int rowLength = Wasavi.getRowLength();
		Wasavi.send("GH");
		int viewLines = Wasavi.getRowLength() - Wasavi.getRow();

		Wasavi.send("GyH");
		assertEquals(Wasavi.getRegister("\"").replaceAll("\n$", "").split("\n").length, viewLines);

	}

	@Test
	public void testYankMiddleOfView () {
		Wasavi.makeScrollableBuffer(2);

		int rowLength = Wasavi.getRowLength();
		Wasavi.send("ggM");
		int viewLines = Wasavi.getRow() + 1;

		Wasavi.send("ggyM");
		assertEquals("#1", Wasavi.getRegister("\"").split("\n", 1000).length - 1, viewLines);

		rowLength = Wasavi.getRowLength();
		Wasavi.send("GM");
		viewLines = Wasavi.getRowLength() - Wasavi.getRow();

		Wasavi.send("GyM");
		assertEquals("#2", Wasavi.getRegister("\"").split("\n", 1000).length - 1, viewLines);
	}

	@Test
	public void testYankBottomOfView () {
		Wasavi.makeScrollableBuffer(2);

		int rowLength = Wasavi.getRowLength();
		Wasavi.send("ggL");
		int viewLines = Wasavi.getRow() + 1;

		Wasavi.send("ggyL");
		assertEquals(Wasavi.getRegister("\"").replaceAll("\n$", "").split("\n").length, viewLines);
	}

	@Test
	public void testYankGoto () {
		Wasavi.send(":set noai\n");
		Wasavi.send("i\t1\n\t2\n\t3\n\t4\n\t5\n\t6\n\t7\u001b");

		Wasavi.send("ggy3G");
		assertEquals("#1-1", "\t1\n\t2\n\t3\n", Wasavi.getRegister("\""));
		assertEquals("#1-2", "\t1\n\t2\n\t3\n", Wasavi.getRegister("1"));
		assertPos("#1-3", 0, 1);

		Wasavi.send("Gy5G");
		assertEquals("#2-1", "\t5\n\t6\n\t7\n", Wasavi.getRegister("\""));
		assertEquals("#2-2", "\t5\n\t6\n\t7\n", Wasavi.getRegister("1"));
		assertEquals("#2-3", "\t1\n\t2\n\t3\n", Wasavi.getRegister("2"));
		assertPos("#2-4", 4, 1);
	}

	@Test
	public void testYankSearchForwardNext_1 () {
		Wasavi.send(":set noai\n");
		Wasavi.send(String.format("i%s\u001b", join("\n",
			"    def",		// foo
			"foo",          // baz
			"baz"			//
		)));

		Wasavi.send("1G1|/foo\n");
		assertPos("#1-1", 1, 0);

		Wasavi.send("1G5|yn");
		assertEquals("#2-1", "def\n", Wasavi.getRegister("\""));
		assertPos("#2-2", 0, 4);
	}

	@Test
	public void testYankSearchForwardNext_2 () {
		Wasavi.send(":set noai\n");
		Wasavi.send(String.format("i%s\u001b", join("\n",
			"abc def",		// abc
			"foo",			// foo
			"baz"			// baz
		)));

		Wasavi.send("1G1|/foo\n");
		assertPos("#1-1", 1, 0);

		Wasavi.send("1G5|yn");
		assertEquals("#2-1", "def\n", Wasavi.getRegister("\""));
		assertPos("#2-2", 0, 4);
	}

	@Test
	public void testYankSearchForwardNext_3 () {
		Wasavi.send(":set noai\n");
		Wasavi.send(String.format("i%s\u001b", join("\n",
			"    def",		//    foo
			"ghi foo",		// baz
			"baz"
		)));

		Wasavi.send("1G1|/foo\n");
		assertPos("#1-1", 1, 4);

		Wasavi.send("1G5|yn");
		assertEquals("#2-1", "def\nghi ", Wasavi.getRegister("\""));
		assertPos("#2-2", 0, 4);
	}

	@Test
	public void testYankSearchForwardNext_4 () {
		Wasavi.send(":set noai\n");
		Wasavi.send(String.format("i%s\u001b", join("\n",
			"abc def",		// abc foo
			"ghi foo",		// baz
			"baz"
		)));

		Wasavi.send("1G1|/foo\n");
		assertPos("#1-1", 1, 4);

		Wasavi.send("1G5|yn");
		assertEquals("#2-1", "def\nghi ", Wasavi.getRegister("\""));
		assertPos("#2-2", 0, 4);
	}

	@Test
	public void testYankSearchForwardPrev_1 () {
		Wasavi.send(":set noai\n");
		Wasavi.send(String.format("i%s\u001b", join("\n",
			"    def",		// foo
			"foo",          // baz
			"baz"			//
		)));

		Wasavi.send("1G1|/def\n");
		assertPos("#1-1", 0, 4);

		Wasavi.send("2G1|yN");
		assertEquals("#2-1", "def\n", Wasavi.getRegister("\""));
		assertPos("#2-2", 0, 4);
	}

	@Test
	public void testYankSearchForwardPrev_2 () {
		Wasavi.send(":set noai\n");
		Wasavi.send(String.format("i%s\u001b", join("\n",
			"abc def",		// abc
			"foo",			// foo
			"baz"			// baz
		)));

		Wasavi.send("1G1|/def\n");
		assertPos("#1-1", 0, 4);

		Wasavi.send("2G1|yN");
		assertEquals("#2-1", "def\n", Wasavi.getRegister("\""));
		assertPos("#2-2", 0, 4);
	}

	@Test
	public void testYankSearchForwardPrev_3 () {
		Wasavi.send(":set noai\n");
		Wasavi.send(String.format("i%s\u001b", join("\n",
			"    def",		//    foo
			"ghi foo",		// baz
			"baz"
		)));

		Wasavi.send("1G1|/def\n");
		assertPos("#1-1", 0, 4);

		Wasavi.send("2G5|yN");
		assertEquals("#2-1", "def\nghi ", Wasavi.getRegister("\""));
		assertPos("#2-2", 0, 4);
	}

	@Test
	public void testYankSearchForwardPrev_4 () {
		Wasavi.send(":set noai\n");
		Wasavi.send(String.format("i%s\u001b", join("\n",
			"abc def",		// abc foo
			"ghi foo",		// baz
			"baz"
		)));

		Wasavi.send("G?def\n");
		assertPos("#1-1", 0, 4);

		Wasavi.send("2G5|yN");
		assertEquals("#2-1", "def\nghi ", Wasavi.getRegister("\""));
		assertPos("#2-2", 0, 4);
	}

	@Test
	public void testYankSearchBackwardNext_1 () {
		Wasavi.send(":set noai\n");
		Wasavi.send(String.format("i%s\u001b", join("\n",
			"    def",		// foo
			"foo",          // baz
			"baz"			//
		)));

		Wasavi.send("G?def\n");
		assertPos("#1-1", 0, 4);

		Wasavi.send("2G1|yn");
		assertEquals("#2-1", "def\n", Wasavi.getRegister("\""));
		assertPos("#2-2", 0, 4);
	}

	@Test
	public void testYankSearchBackwardNext_2 () {
		Wasavi.send(":set noai\n");
		Wasavi.send(String.format("i%s\u001b", join("\n",
			"abc def",		// abc
			"foo",			// foo
			"baz"			// baz
		)));

		Wasavi.send("G?def\n");
		assertPos("#1-1", 0, 4);

		Wasavi.send("2G1|yn");
		assertEquals("#2-1", "def\n", Wasavi.getRegister("\""));
		assertPos("#2-2", 0, 4);
	}

	@Test
	public void testYankSearchBackwardNext_3 () {
		Wasavi.send(":set noai\n");
		Wasavi.send(String.format("i%s\u001b", join("\n",
			"    def",		//    foo
			"ghi foo",		// baz
			"baz"
		)));

		Wasavi.send("G?def\n");
		assertPos("#1-1", 0, 4);

		Wasavi.send("2G5|yn");
		assertEquals("#2-1", "def\nghi ", Wasavi.getRegister("\""));
		assertPos("#2-2", 0, 4);
	}

	@Test
	public void testYankSearchBackwardNext_4 () {
		Wasavi.send(":set noai\n");
		Wasavi.send(String.format("i%s\u001b", join("\n",
			"abc def",		// abc foo
			"ghi foo",		// baz
			"baz"
		)));

		Wasavi.send("G?def\n");
		assertPos("#1-1", 0, 4);

		Wasavi.send("2G5|yn");
		assertEquals("#2-1", "def\nghi ", Wasavi.getRegister("\""));
		assertPos("#2-2", 0, 4);
	}

	@Test
	public void testYankSearchBackwardPrev_1 () {
		Wasavi.send(":set noai\n");
		Wasavi.send(String.format("i%s\u001b", join("\n",
			"    def",		// foo
			"foo",          // baz
			"baz"			//
		)));

		Wasavi.send("G?foo\n");
		assertPos("#1-1", 1, 0);

		Wasavi.send("1G5|yN");
		assertEquals("#2-1", "def\n", Wasavi.getRegister("\""));
		assertPos("#2-2", 0, 4);
	}

	@Test
	public void testYankSearchBackwardPrev_2 () {
		Wasavi.send(":set noai\n");
		Wasavi.send(String.format("i%s\u001b", join("\n",
			"abc def",		// abc
			"foo",			// foo
			"baz"			// baz
		)));

		Wasavi.send("G?foo\n");
		assertPos("#1-1", 1, 0);

		Wasavi.send("1G5|yN");
		assertEquals("#2-1", "def\n", Wasavi.getRegister("\""));
		assertPos("#2-2", 0, 4);
	}

	@Test
	public void testYankSearchBackwardPrev_3 () {
		Wasavi.send(":set noai\n");
		Wasavi.send(String.format("i%s\u001b", join("\n",
			"    def",		//    foo
			"ghi foo",		// baz
			"baz"
		)));

		Wasavi.send("G?foo\n");
		assertPos("#1-1", 1, 4);

		Wasavi.send("1G5|yN");
		assertEquals("#2-1", "def\nghi ", Wasavi.getRegister("\""));
		assertPos("#2-2", 0, 4);
	}

	@Test
	public void testYankSearchBackwardPrev_4 () {
		Wasavi.send(":set noai\n");
		Wasavi.send(String.format("i%s\u001b", join("\n",
			"abc def",		// abc foo
			"ghi foo",		// baz
			"baz"
		)));

		Wasavi.send("G?foo\n");
		assertPos("#1-1", 1, 4);

		Wasavi.send("1G5|yN");
		assertEquals("#2-1", "def\nghi ", Wasavi.getRegister("\""));
		assertPos("#2-2", 0, 4);
	}
}

/* vim:set ts=4 sw=4 fileencoding=UTF-8 fileformat=unix filetype=java : */
