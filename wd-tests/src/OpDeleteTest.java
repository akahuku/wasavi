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

public class OpDeleteTest extends WasaviTest {
	@Test
	public void testDelete () {
		Wasavi.send("i1\n2\n3\n4\n5\n6\u001bgg");

		Wasavi.send("dd");
		assertEquals("#1-1", "2\n3\n4\n5\n6", Wasavi.getValue());
		assertPos("#1-2", 0, 0);

		Wasavi.send(":set report=2\n");
		Wasavi.send("d2d");
		assertEquals("#2-1", "4\n5\n6", Wasavi.getValue());
		assertPos("#2-2", 0, 0);
		assertEquals("#2-3", "Deleted 2 lines.", Wasavi.getLastMessage());

		Wasavi.send("2dd");
		assertEquals("#3-1", "6", Wasavi.getValue());
		assertPos("#3-2", 0, 0);

		Wasavi.send("2dd");
		assertEquals("#4-1", "", Wasavi.getValue());
		assertPos("#4-2", 0, 0);
	}

	private void _testDeleteUpLine (CharSequence a) {
		Wasavi.send(":set noai\n");
		Wasavi.send("iline1\n\tline2\n\t\tline3\u001b");
		assertEquals("line1\n\tline2\n\t\tline3", Wasavi.getValue());

		Wasavi.send("3G");
		assertPos("#1-1", 2, 2);

		Wasavi.send(String.format("d%s", a));
		assertPos("#2-1", 0, 0);
		assertEquals("#2-2", "\tline2\n\t\tline3\n", Wasavi.getRegister("\""));
		assertEquals("#2-3", "\tline2\n\t\tline3\n", Wasavi.getRegister("1"));
		assertEquals("#2-4", "line1", Wasavi.getValue());

		Wasavi.send("d", a);
		assertEquals("#3-1", "\tline2\n\t\tline3\n", Wasavi.getRegister("\""));
		assertTrue("#3-2", Wasavi.getLastMessage().length() > 0);
	}

	@Test
	public void testDeleteUpLine () {
		_testDeleteUpLine("-");
	}

	private void _testDeleteDownLine (CharSequence a) {
		Wasavi.send(":set noai\n");
		Wasavi.send("iline1\n\tline2\n\t\tline3\u001b");
		assertEquals("line1\n\tline2\n\t\tline3", Wasavi.getValue());

		Wasavi.send("1G");
		assertPos("#1-1", 0, 0);

		Wasavi.send(String.format("d%s", a));
		assertPos("#2-1", 0, 2);
		assertEquals("#2-2", "line1\n\tline2\n", Wasavi.getRegister("\""));
		assertEquals("#2-3", "line1\n\tline2\n", Wasavi.getRegister("1"));
		assertEquals("#2-4", "\t\tline3", Wasavi.getValue());

		Wasavi.send(String.format("d%s", a));
		assertEquals("#3-1", "line1\n\tline2\n", Wasavi.getRegister("\""));
		assertTrue("#3-2", Wasavi.getLastMessage().length() > 0);
	}

	@Test
	public void testDeleteDownLine () {
		_testDeleteDownLine("+");
	}

	@Test
	public void testDeleteDownEnter () {
		_testDeleteDownLine(Keys.ENTER);
	}

	private void _testDeleteFirstNonWhiteCharOfLine (CharSequence a) {
		Wasavi.send(":set noai\n");
		Wasavi.send("i\tfoobar\u001b");
		Wasavi.send(String.format("d%s", a));

		assertEquals("\tr", Wasavi.getValue());
		assertPos(0, 1);
	}

	@Test
	public void testDeleteFirstNonWhiteCharOfLine () {
		_testDeleteFirstNonWhiteCharOfLine("^");
	}

	@Test
	public void testDeleteHome () {
		_testDeleteFirstNonWhiteCharOfLine(Keys.HOME);
	}

	@Test
	public void testDeleteTopOfLine () {
		Wasavi.send(":set noai\n");
		Wasavi.send("i\tfoobar\u001b");
		Wasavi.send("d0");

		assertEquals("r", Wasavi.getValue());
		assertPos(0, 0);
	}

	private void _testDeleteTailOfLine (CharSequence a) {
		Wasavi.send(":set noai\n");
		Wasavi.send("i\tfoobar\u001b1|");
		Wasavi.send(String.format("d%s", a));

		assertEquals("", Wasavi.getValue());
		assertPos(0, 0);
	}

	@Test
	public void testDeleteTailOfLine () {
		_testDeleteTailOfLine("$");
	}

	@Test
	public void testDeleteEnd () {
		_testDeleteTailOfLine(Keys.END);
	}

	@Test
	public void testDeleteDirectColumn () {
		Wasavi.send(":set noai\n");
		Wasavi.send("i0123456789\n0123456789\u001b1G1|");

		Wasavi.send("d5|");
		assertEquals("#1-1", "456789\n0123456789", Wasavi.getValue());
		assertPos("#1-2", 0, 0);

		Wasavi.send("$d3|");
		assertEquals("#2-1", "459\n0123456789", Wasavi.getValue());
		assertPos("#2-2", 0, 2);

		Wasavi.send("2G1|d100|");
		assertEquals("#3-1", "459\n", Wasavi.getValue());
		assertPos("#3-2", 1, 0);
	}

	@Test
	public void testDeleteJumpToMatchedParenthes () {
		Wasavi.send(":set noai\n");
		Wasavi.send("ithis is (first) line.\nthis is (second) line)\u001b");

		Wasavi.send("1G1|f(d%");
		assertEquals("#1-1", "this is  line.\nthis is (second) line)", Wasavi.getValue());
		assertPos("#1-2", 0, 8);

		Wasavi.send("2G1|f)d%");
		assertEquals("#2-1", "this is  line.\nthis is  line)", Wasavi.getValue());
		assertPos("#2-2", 1, 8);

		Wasavi.send("G$d%");
		assertEquals("#3-1", "this is  line.\nthis is  line)", Wasavi.getValue());
		assertPos("#3-2", 1, 13);
		assertTrue("#3-3", Wasavi.getLastMessage().length() > 0);
	}

	@Test
	public void testDeleteSearchForward () {
		Wasavi.send(":set noai\n");
		Wasavi.send("ifind the\nchar4cter in cu4rent 4line\u001b1G1|");

		Wasavi.send("d/4\n");
		assertEquals("#1-1", "4cter in cu4rent 4line", Wasavi.getValue());
		assertPos("#1-2", 0, 0);

		Wasavi.send("2d/4\n");
		assertEquals("#2-1", "4line", Wasavi.getValue());
		assertPos("#2-2", 0, 0);

		Wasavi.send("2d/X\n");
		assertEquals("#3-1", "4line", Wasavi.getValue());
		assertPos("#3-2", 0, 0);
		assertTrue("#3-3", Wasavi.getLastMessage().length() > 0);
	}

	@Test
	public void testDeleteSearchBackward () {
		Wasavi.send(":set noai\n");
		Wasavi.send("ifind the char4cter in cu4rent\n4line\u001b");

		Wasavi.send("d?4\n");
		assertEquals("#1-1", "find the char4cter in cu4rent\ne", Wasavi.getValue());
		assertPos("#1-2", 1, 0);

		Wasavi.send("2d?4\n");
		assertEquals("#2-1", "find the char\ne", Wasavi.getValue());
		assertPos("#2-2", 0, 12);

		Wasavi.send("2d?X\n");
		assertEquals("#3-1", "find the char\ne", Wasavi.getValue());
		assertPos("#3-2", 0, 12);
		assertTrue("#3-3", Wasavi.getLastMessage().length() > 0);
	}

	@Test
	public void testDeleteFindForward () {
		Wasavi.send(":set noai\n");
		Wasavi.send("ifind the char4cter in cu4rent 4line\u001b1G1|");

		Wasavi.send("df4");
		assertEquals("#1-1", "cter in cu4rent 4line", Wasavi.getValue());
		assertPos("#1-2", 0, 0);

		Wasavi.send("2df4");
		assertEquals("#2-1", "line", Wasavi.getValue());
		assertPos("#2-2", 0, 0);

		Wasavi.send("df4");
		assertEquals("#3-1", "line", Wasavi.getValue());
		assertPos("#3-2", 0, 0);
		assertTrue("#3-3", Wasavi.getLastMessage().length() > 0);
	}

	@Test
	public void testDeleteFindBackward () {
		Wasavi.send(":set noai\n");
		Wasavi.send("ifind the char4cter in cu4rent 4line\u001b");

		Wasavi.send("dF4");
		assertEquals("#1-1", "find the char4cter in cu4rent e", Wasavi.getValue());
		assertPos("#1-2", 0, 30);

		Wasavi.send("2dF4");
		assertEquals("#2-1", "find the chare", Wasavi.getValue());
		assertPos("#2-2", 0, 13);

		Wasavi.send("dF4");
		assertEquals("#3-1", "find the chare", Wasavi.getValue());
		assertPos("#3-2", 0, 13);
		assertTrue("#3-3", Wasavi.getLastMessage().length() > 0);
	}

	@Test
	public void testDeleteFindFowardBeforeStop () {
		Wasavi.send(":set noai\n");
		Wasavi.send("ifind the char4cter in cu4rent 4line\u001b1G1|");

		Wasavi.send("dt4");
		assertEquals("#1-1", "4cter in cu4rent 4line", Wasavi.getValue());
		assertPos("#1-2", 0, 0);

		Wasavi.send("2dt4");
		assertEquals("#2-1", "4line", Wasavi.getValue());
		assertPos("#2-2", 0, 0);

		Wasavi.send("dt4");
		assertEquals("#3-1", "4line", Wasavi.getValue());
		assertPos("#3-2", 0, 0);
		assertTrue("#3-3", Wasavi.getLastMessage().length() > 0);
	}

	@Test
	public void testDeleteFindBackwardBeforeStop () {
		Wasavi.send(":set noai\n");
		Wasavi.send("ifind the char4cter in cu4rent 4line\u001b");

		Wasavi.send("dT4");
		assertEquals("#1-1", "find the char4cter in cu4rent 4e", Wasavi.getValue());
		assertPos("#1-2", 0, 31);

		Wasavi.send("dT4");
		assertEquals("#2-1", "find the char4cter in cu4rent 4e", Wasavi.getValue());
		assertPos("#2-2", 0, 31);

		Wasavi.send("d2T4");
		assertEquals("#3-1", "find the char4cter in cu4e", Wasavi.getValue());
		assertPos("#3-2", 0, 25);

		Wasavi.send("d3T4");
		assertEquals("#4-1", "find the char4cter in cu4e", Wasavi.getValue());
		assertPos("#4-2", 0, 25);
		assertTrue("#4-3", Wasavi.getLastMessage().length() > 0);
	}

	@Test
	public void testDeleteFindInvert () {
		Wasavi.send(":set noai\n");
		Wasavi.send("4ifi4st s4cond th4rd fou4th\n\u001b");

		Wasavi.send("1G1|df4$d,");
		assertEquals("#1-1", "st s4cond th4rd fouh", Wasavi.getValue().split("\n")[0]);
		assertPos("#1-2", 0, 19);

		Wasavi.send("2G1|dt4$d,");
		assertEquals("#2-1", "4st s4cond th4rd fou4h", Wasavi.getValue().split("\n")[1]);
		assertPos("#2-2", 1, 21);

		Wasavi.send("3G$dF40d,");
		assertEquals("#3-1", "st s4cond th4rd fouh", Wasavi.getValue().split("\n")[2]);
		assertPos("#3-2", 2, 0);

		Wasavi.send("4G$dT40d,");
		assertEquals("#4-1", "4st s4cond th4rd fou4h", Wasavi.getValue().split("\n")[3]);
		assertPos("#4-2", 3, 0);
	}

	@Test
	public void testDeleteFindRepeat () {
		Wasavi.send(":set noai\n");
		Wasavi.send("4ifi4st s4cond th4rd fou4th\n\u001b");

		Wasavi.send("1G1|df4d;");
		assertEquals("#1-1", "cond th4rd fou4th", Wasavi.getValue().split("\n")[0]);
		assertPos("#1-2", 0, 0);

		Wasavi.send("2G1|dt4d;");
		assertEquals("#2-1", "4cond th4rd fou4th", Wasavi.getValue().split("\n")[1]);
		assertPos("#2-2", 1, 0);

		Wasavi.send("3G$dF4d;");
		assertEquals("#3-1", "fi4st s4cond thh", Wasavi.getValue().split("\n")[2]);
		assertPos("#3-2", 2, 15);

		Wasavi.send("4G$dT4d;");
		assertEquals("#4-1", "fi4st s4cond th4h", Wasavi.getValue().split("\n")[3]);
		assertPos("#4-2", 3, 16);
	}

	@Test
	public void testDeleteDownLineOrient () {
		Wasavi.send(":set noai\n");
		Wasavi.send("i\tfoobar\n\tfoobar\n\tfoobar\n\tfoobar\n\tfoobar\u001bgg");

		Wasavi.send("d_");
		assertEquals("#1-1", 4, Wasavi.getValue().split("\n").length);
		assertPos("#1-2", 0, 1);

		Wasavi.send("d2_");
		assertEquals("#2-1", 2, Wasavi.getValue().split("\n").length);
		assertPos("#2-2", 0, 1);

		Wasavi.send("d3_");
		assertEquals("#3-1", "", Wasavi.getValue());
		assertPos("#3-2", 0, 0);
	}

	@Test
	public void testDeleteMark () {
		Wasavi.send(":set noai\n");
		Wasavi.send("ifoo1bar\nbaz3bax\u001b");

		Wasavi.send("1G0f1ma0d`a");
		assertEquals("#1-1", "1bar\nbaz3bax", Wasavi.getValue());
		assertPos("#1-2", 0, 0);

		Wasavi.send("2G$F3ma$d`a");
		assertEquals("#2-1", "1bar\nbazx", Wasavi.getValue());
		assertPos("#2-2", 1, 3);
	}

	@Test
	public void testDeleteMarkLineOrient () {
		Wasavi.send(":set noai\n");
		Wasavi.send("i1\n2\n3\n4\n5\n6\n7\u001b");

		Wasavi.send("3Gma1Gd\'a");
		assertEquals("#1-1", "4\n5\n6\n7", Wasavi.getValue());

		Wasavi.send("2GmaGd\'a");
		assertEquals("#2-1", "4", Wasavi.getValue());
	}

	@Test
	public void testDeleteSectionForward () {
		// TBD
	}

	@Test
	public void testDeleteSectionBackward () {
		// TBD
	}

	@Test
	public void testDeleteParagraphForward () {
		// TBD
	}

	@Test
	public void testDeleteParagraphBackward () {
		// TBD
	}

	@Test
	public void testDeleteSentenceForward () {
		// TBD
	}

	@Test
	public void testDeleteSentenceBackward () {
		// TBD
	}

	private void _testDeleteDown (CharSequence a) {
		Wasavi.send(":set noai\n");

		/*
		 * first            _irst
		 * se_ond
		 * third     -->
		 * f
		 * fifth
		 */
		Wasavi.send("ifirst\nsecond\nthird\nf\nfifth\u001b");
		Wasavi.send(String.format("2G3|d10%s", a));
		assertEquals("#1-1", "first", Wasavi.getValue());
		assertPos("#1-2", 0, 0);
		assertTrue("#1-3", Wasavi.getLastMessage().length() == 0);
		assertEquals("#1-4", "second\nthird\nf\nfifth\n", Wasavi.getRegister("1"));

		/*
		 * first            first
		 * se_ond           _
		 * third     -->    fifth
		 * f
		 * fifth
		 */
		Wasavi.send("ggdGifirst\nsecond\nthird\nf\nfifth\u001b");
		Wasavi.send(String.format("2G3|d%s", a));
		assertEquals("#2-1", "first\nf\nfifth", Wasavi.getValue());
		assertEquals("#2-2", "second\nthird\n", Wasavi.getRegister("\""));
		assertEquals("#2-3", "second\nthird\n", Wasavi.getRegister("1"));
		assertEquals("#2-4", "second\nthird\nf\nfifth\n", Wasavi.getRegister("2"));
		assertPos("#2-5", 1, 0);

		/*
		 * fir_t            _ifth
		 * f         -->
		 * fifth
		 */
		Wasavi.send(String.format("gg3ld%s", a));
		assertEquals("#3-1", "fifth", Wasavi.getValue());
		assertEquals("#3-2", "first\nf\n", Wasavi.getRegister("\""));
		assertEquals("#3-3", "first\nf\n", Wasavi.getRegister("1"));
		assertEquals("#3-4", "second\nthird\n", Wasavi.getRegister("2"));
		assertPos("#3-5", 0, 0);
	}

	@Test
	public void testDeleteDown () {
		_testDeleteDown("j");
	}

	@Test
	public void testDeleteDownCtrlN () {
		_testDeleteDown("\u000e");
	}

	@Test
	public void testDeleteDownDown () {
		_testDeleteDown(Keys.DOWN);
	}

	private void _testDeleteUp (CharSequence a) {
		Wasavi.send(":set noai\n");
		Wasavi.send("ifirst\nsecond\nt\u001b");

		/*
		 * POSIX defines that moving beyond top or tail of buffer causes an error,
		 * But vim does not.  We follow vim.
		 */
		Wasavi.send(String.format("2G3|d10%s", a));
		assertEquals("#1-1", "t", Wasavi.getValue());
		assertPos("#1-2", 0, 0);
		assertTrue("#1-3", Wasavi.getLastMessage().length() == 0);

		Wasavi.send("ggdGifirst\nsecond\nt\u001b");
		Wasavi.send(String.format("2G3|d%s", a));
		assertEquals("#2-1", "t", Wasavi.getValue());
		assertEquals("#2-2", "first\nsecond\n", Wasavi.getRegister("\""));
		assertEquals("#2-3", "first\nsecond\n", Wasavi.getRegister("1"));
		assertPos("#2-4", 0, 0);
	}

	@Test
	public void testDeleteUp () {
		_testDeleteUp("k");
	}

	@Test
	public void testDeleteUpCtrlP () {
		_testDeleteUp("\u0010");
	}

	@Test
	public void testDeleteUpUp () {
		_testDeleteUp(Keys.UP);
	}

	private void _testDeleteLeft (CharSequence a) {
		Wasavi.send(":set noai\n");
		Wasavi.send("ifoo bar baz\u001b");
		assertPos("#1-1", 0, 10);

		Wasavi.send(String.format("d%s", a));
		assertEquals("#2-1", "foo bar bz", Wasavi.getValue());
		assertPos("#2-2", 0, 9);

		Wasavi.send(String.format("d2%s", a));
		assertEquals("#3-1", "foo barz", Wasavi.getValue());
		assertPos("#3-2", 0, 7);

		Wasavi.send(String.format("d100%s", a));
		assertEquals("#4-1", "z", Wasavi.getValue());
		assertPos("#4-2", 0, 0);
	}

	@Test
	public void testDeleteLeft () {
		_testDeleteLeft("h");
	}

	@Test
	public void testDeleteLeftCtrlH () {
		_testDeleteLeft("\u0008");
	}

	@Test
	public void testDeleteLeftLeft () {
		_testDeleteLeft(Keys.LEFT);
	}

	private void _testDeleteRight (CharSequence a) {
		Wasavi.send(":set noai\n");
		Wasavi.send("ifoo bar baz\u001b1|");
		assertPos("#1-1", 0, 0);

		Wasavi.send(String.format("d%s", a));
		assertEquals("#2-1", "oo bar baz", Wasavi.getValue());
		assertPos("#2-2", 0, 0);
		assertEquals("#2-3", "f", Wasavi.getRegister("\""));

		Wasavi.send(String.format("\"ad2%s", a));
		assertEquals("#3-1", " bar baz", Wasavi.getValue());
		assertPos("#3-2", 0, 0);
		assertEquals("#3-3", "oo", Wasavi.getRegister("a"));
		assertEquals("#3-4", "oo", Wasavi.getRegister("\""));

		Wasavi.send(String.format("d5%s", a));
		assertEquals("#4-1", "baz", Wasavi.getValue());
		assertPos("#4-2", 0, 0);

		Wasavi.send(String.format("d100%s", a));
		assertEquals("#5-1", "", Wasavi.getValue());
		assertPos("#5-2", 0, 0);
	}

	@Test
	public void testDeleteRight () {
		_testDeleteRight("l");
	}

	@Test
	public void testDeleteRightSpace () {
		_testDeleteRight(" ");
	}

	@Test
	public void testDeleteRightRight () {
		_testDeleteRight(Keys.RIGHT);
	}

	@Test
	public void testDeleteWordForward () {
		Wasavi.send(":set noai\n");
		Wasavi.send("ifoo bar baz bax\u001b1|");

		Wasavi.send("dw");
		assertEquals("#1-1", "bar baz bax", Wasavi.getValue());
		assertPos("#1-2", 0, 0);

		Wasavi.send("d2w");
		assertEquals("#2-1", "bax", Wasavi.getValue());
		assertPos("#2-2", 0, 0);
	}

	@Test
	public void testDeleteWordBackward () {
		Wasavi.send(":set noai\n");
		Wasavi.send("ifoo bar baz bax\u001b");

		Wasavi.send("db");
		assertEquals("#1-1", "foo bar baz x", Wasavi.getValue());
		assertPos("#1-2", 0, 12);

		Wasavi.send("d2b");
		assertEquals("#2-1", "foo x", Wasavi.getValue());
		assertPos("#2-2", 0, 4);
	}

	@Test
	public void testDeleteBigwordForward () {
		Wasavi.send(":set noai\n");
		Wasavi.send("if$o b!r b@z b#x\u001b1|");

		Wasavi.send("dW");
		assertEquals("#1-1", "b!r b@z b#x", Wasavi.getValue());
		assertPos("#1-2", 0, 0);

		Wasavi.send("d2W");
		assertEquals("#2-1", "b#x", Wasavi.getValue());
		assertPos("#2-2", 0, 0);
	}

	@Test
	public void testDeleteBigwordBackward () {
		Wasavi.send(":set noai\n");
		Wasavi.send("if$o b!r b@z b#x\u001b");

		Wasavi.send("dB");
		assertEquals("#1-1", "f$o b!r b@z x", Wasavi.getValue());
		assertPos("#1-2", 0, 12);

		Wasavi.send("d2B");
		assertEquals("#2-1", "f$o x", Wasavi.getValue());
		assertPos("#2-2", 0, 4);
	}

	@Test
	public void testDeleteWordEnd () {
		Wasavi.send(":set noai\n");
		Wasavi.send("ifoo bar baz bax\u001b1|");

		Wasavi.send("de");
		assertEquals("#1-1", " bar baz bax", Wasavi.getValue());
		assertPos("#1-2", 0, 0);

		Wasavi.send("d2e");
		assertEquals("#2-1", " bax", Wasavi.getValue());
		assertPos("#2-2", 0, 0);

		Wasavi.send("xde");
		assertEquals("#3-1", "", Wasavi.getValue());
		assertPos("#3-2", 0, 0);
	}

	@Test
	public void testDeleteBigwordEnd () {
		Wasavi.send(":set noai\n");
		Wasavi.send("if$o b!r b@z b#x\u001b1|");

		Wasavi.send("dE");
		assertEquals("#1-1", " b!r b@z b#x", Wasavi.getValue());
		assertPos("#1-2", 0, 0);

		Wasavi.send("d2E");
		assertEquals("#2-1", " b#x", Wasavi.getValue());
		assertPos("#2-2", 0, 0);

		Wasavi.send("xdE");
		assertEquals("#3-1", "", Wasavi.getValue());
		assertPos("#3-2", 0, 0);
	}

	@Test
	public void testDeleteGotoPrefix () {
		Wasavi.send(":set noai\n");
		Wasavi.send("i\t1\n\t2\n\t3\n\t4\n\t5\n\t6\n\t7\u001b");

		Wasavi.send("ggd3G");
		assertEquals("#1-1", "\t4\n\t5\n\t6\n\t7", Wasavi.getValue());
		assertPos("#1-2", 0, 1);

		Wasavi.send("Gd3G");
		assertEquals("#2-1", "\t4\n\t5", Wasavi.getValue());
		assertPos("#2-2", 1, 1);
	}

	@Test
	public void testDeleteTopOfView () {
		Wasavi.makeScrollableBuffer(2);

		int rowLength = Wasavi.getRowLength();
		Wasavi.send("GH");
		int viewLines = Wasavi.getRowLength() - Wasavi.getRow();

		Wasavi.send("GdH");
		assertEquals(Wasavi.getRowLength(), rowLength - viewLines);
	}

	@Test
	public void testDeleteMiddleOfView () {
		Wasavi.makeScrollableBuffer(2);

		int rowLength = Wasavi.getRowLength();
		Wasavi.send("ggM");
		int viewLines = Wasavi.getRow() + 1;

		Wasavi.send("ggdM");
		assertEquals("#1", Wasavi.getRowLength(), rowLength - viewLines);

		rowLength = Wasavi.getRowLength();
		Wasavi.send("GM");
		viewLines = Wasavi.getRowLength() - Wasavi.getRow();

		Wasavi.send("GdM");
		assertEquals("#2", Wasavi.getRowLength(), rowLength - viewLines);
	}

	@Test
	public void testDeleteBottomOfView () {
		Wasavi.makeScrollableBuffer(2);

		int rowLength = Wasavi.getRowLength();
		Wasavi.send("ggL");
		int viewLines = Wasavi.getRow() + 1;

		Wasavi.send("ggdL");
		assertEquals(Wasavi.getRowLength(), rowLength - viewLines);
	}

	@Test
	public void testDeleteGoto () {
		Wasavi.send(":set noai\n");
		Wasavi.send("i1\n2\n3\n\t4\n5\n6\u001b");

		Wasavi.send("ggd3G");
		assertEquals("#1-1", "\t4\n5\n6", Wasavi.getValue());
		assertPos("#1-2", 0, 1);

		Wasavi.send("Gd2G");
		assertEquals("#2-1", "\t4", Wasavi.getValue());
		assertPos("#2-2", 0, 1);
	}

	@Test
	public void testDeleteSearchForwardNext_1 () {
		Wasavi.send(":set noai\n");
		Wasavi.send(String.format("i%s\u001b", join("\n",
			"    def",		// foo
			"foo",          // baz
			"baz"			//
		)));

		Wasavi.send("1G1|/foo\n");
		assertPos("#1-1", 1, 0);

		Wasavi.send("1G5|dn");
		assertEquals("#2-1", "foo\nbaz", Wasavi.getValue());
		assertPos("#2-2", 0, 0);
	}

	@Test
	public void testDeleteSearchForwardNext_2 () {
		Wasavi.send(":set noai\n");
		Wasavi.send(String.format("i%s\u001b", join("\n",
			"abc def",		// abc
			"foo",			// foo
			"baz"			// baz
		)));

		Wasavi.send("1G1|/foo\n");
		assertPos("#1-1", 1, 0);

		Wasavi.send("1G5|dn");
		assertEquals("#2-1", "abc \nfoo\nbaz", Wasavi.getValue());
		assertPos("#2-2", 0, 3);
	}

	@Test
	public void testDeleteSearchForwardNext_3 () {
		Wasavi.send(":set noai\n");
		Wasavi.send(String.format("i%s\u001b", join("\n",
			"    def",		//    foo
			"ghi foo",		// baz
			"baz"
		)));

		Wasavi.send("1G1|/foo\n");
		assertPos("#1-1", 1, 4);

		Wasavi.send("1G5|dn");
		assertEquals("#2-1", "    foo\nbaz", Wasavi.getValue());
		assertPos("#2-2", 0, 4);
	}

	@Test
	public void testDeleteSearchForwardNext_4 () {
		Wasavi.send(":set noai\n");
		Wasavi.send(String.format("i%s\u001b", join("\n",
			"abc def",		// abc foo
			"ghi foo",		// baz
			"baz"
		)));

		Wasavi.send("1G1|/foo\n");
		assertPos("#1-1", 1, 4);

		Wasavi.send("1G5|dn");
		assertEquals("#2-1", "abc foo\nbaz", Wasavi.getValue());
		assertPos("#2-2", 0, 4);
	}

	@Test
	public void testDeleteSearchForwardPrev_1 () {
		Wasavi.send(":set noai\n");
		Wasavi.send(String.format("i%s\u001b", join("\n",
			"    def",		// foo
			"foo",          // baz
			"baz"			//
		)));

		Wasavi.send("1G1|/def\n");
		assertPos("#1-1", 0, 4);

		Wasavi.send("2G1|dN");
		assertEquals("#2-1", "foo\nbaz", Wasavi.getValue());
		assertPos("#2-2", 0, 0);
	}

	@Test
	public void testDeleteSearchForwardPrev_2 () {
		Wasavi.send(":set noai\n");
		Wasavi.send(String.format("i%s\u001b", join("\n",
			"abc def",		// abc
			"foo",			// foo
			"baz"			// baz
		)));

		Wasavi.send("1G1|/def\n");
		assertPos("#1-1", 0, 4);

		Wasavi.send("2G1|dN");
		assertEquals("#2-1", "abc \nfoo\nbaz", Wasavi.getValue());
		assertPos("#2-2", 0, 3);
	}

	@Test
	public void testDeleteSearchForwardPrev_3 () {
		Wasavi.send(":set noai\n");
		Wasavi.send(String.format("i%s\u001b", join("\n",
			"    def",		//    foo
			"ghi foo",		// baz
			"baz"
		)));

		Wasavi.send("1G1|/def\n");
		assertPos("#1-1", 0, 4);

		Wasavi.send("2G5|dN");
		assertEquals("#2-1", "    foo\nbaz", Wasavi.getValue());
		assertPos("#2-2", 0, 4);
	}

	@Test
	public void testDeleteSearchForwardPrev_4 () {
		Wasavi.send(":set noai\n");
		Wasavi.send(String.format("i%s\u001b", join("\n",
			"abc def",		// abc foo
			"ghi foo",		// baz
			"baz"
		)));

		Wasavi.send("G?def\n");
		assertPos("#1-1", 0, 4);

		Wasavi.send("2G5|dn");
		assertEquals("#2-1", "abc foo\nbaz", Wasavi.getValue());
		assertPos("#2-2", 0, 4);
	}

	@Test
	public void testDeleteSearchBackwardNext_1 () {
		Wasavi.send(":set noai\n");
		Wasavi.send(String.format("i%s\u001b", join("\n",
			"    def",		// foo
			"foo",          // baz
			"baz"			//
		)));

		Wasavi.send("G?def\n");
		assertPos("#1-1", 0, 4);

		Wasavi.send("2G1|dn");
		assertEquals("#2-1", "foo\nbaz", Wasavi.getValue());
		assertPos("#2-2", 0, 0);
	}

	@Test
	public void testDeleteSearchBackwardNext_2 () {
		Wasavi.send(":set noai\n");
		Wasavi.send(String.format("i%s\u001b", join("\n",
			"abc def",		// abc
			"foo",			// foo
			"baz"			// baz
		)));

		Wasavi.send("G?def\n");
		assertPos("#1-1", 0, 4);

		Wasavi.send("2G1|dn");
		assertEquals("#2-1", "abc \nfoo\nbaz", Wasavi.getValue());
		assertPos("#2-2", 0, 3);
	}

	@Test
	public void testDeleteSearchBackwardNext_3 () {
		Wasavi.send(":set noai\n");
		Wasavi.send(String.format("i%s\u001b", join("\n",
			"    def",		//    foo
			"ghi foo",		// baz
			"baz"
		)));

		Wasavi.send("G?def\n");
		assertPos("#1-1", 0, 4);

		Wasavi.send("2G5|dn");
		assertEquals("#2-1", "    foo\nbaz", Wasavi.getValue());
		assertPos("#2-2", 0, 4);
	}

	@Test
	public void testDeleteSearchBackwardNext_4 () {
		Wasavi.send(":set noai\n");
		Wasavi.send(String.format("i%s\u001b", join("\n",
			"abc def",		// abc foo
			"ghi foo",		// baz
			"baz"
		)));

		Wasavi.send("G?def\n");
		assertPos("#1-1", 0, 4);

		Wasavi.send("2G5|dn");
		assertEquals("#2-1", "abc foo\nbaz", Wasavi.getValue());
		assertPos("#2-2", 0, 4);
	}

	@Test
	public void testDeleteSearchBackwardPrev_1 () {
		Wasavi.send(":set noai\n");
		Wasavi.send(String.format("i%s\u001b", join("\n",
			"    def",		// foo
			"foo",          // baz
			"baz"			//
		)));

		Wasavi.send("G?foo\n");
		assertPos("#1-1", 1, 0);

		Wasavi.send("1G5|dN");
		assertEquals("#2-1", "foo\nbaz", Wasavi.getValue());
		assertPos("#2-2", 0, 0);
	}

	@Test
	public void testDeleteSearchBackwardPrev_2 () {
		Wasavi.send(":set noai\n");
		Wasavi.send(String.format("i%s\u001b", join("\n",
			"abc def",		// abc
			"foo",			// foo
			"baz"			// baz
		)));

		Wasavi.send("G?foo\n");
		assertPos("#1-1", 1, 0);

		Wasavi.send("1G5|dN");
		assertEquals("#2-1", "abc \nfoo\nbaz", Wasavi.getValue());
		assertPos("#2-2", 0, 3);
	}

	@Test
	public void testDeleteSearchBackwardPrev_3 () {
		Wasavi.send(":set noai\n");
		Wasavi.send(String.format("i%s\u001b", join("\n",
			"    def",		//    foo
			"ghi foo",		// baz
			"baz"
		)));

		Wasavi.send("G?foo\n");
		assertPos("#1-1", 1, 4);

		Wasavi.send("1G5|dN");
		assertEquals("#2-1", "    foo\nbaz", Wasavi.getValue());
		assertPos("#2-2", 0, 4);
	}

	@Test
	public void testDeleteSearchBackwardPrev_4 () {
		Wasavi.send(":set noai\n");
		Wasavi.send(String.format("i%s\u001b", join("\n",
			"abc def",		// abc foo
			"ghi foo",		// baz
			"baz"
		)));

		Wasavi.send("G?foo\n");
		assertPos("#1-1", 1, 4);

		Wasavi.send("1G5|dN");
		assertEquals("#2-1", "abc foo\nbaz", Wasavi.getValue());
		assertPos("#2-2", 0, 4);
	}
}

/* vim:set ts=4 sw=4 fileencoding=UTF-8 fileformat=unix filetype=java : */
