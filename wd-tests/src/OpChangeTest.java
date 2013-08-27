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

public class OpChangeTest extends WasaviTest {
	@Test
	public void testChange () {
		Wasavi.send("i1\n2\n3\u001b");

		Wasavi.send("gg", "ccXYZ\u001b");
		assertEquals("#1-1", "1\n", Wasavi.getRegister("\""));
		assertEquals("#1-2", "XYZ\n2\n3", Wasavi.getValue());
		assertPos("#1-3", 0, 2);

		Wasavi.send(":set report=2\n");
		Wasavi.send("gg", "c2cX\nY\nZ\u001b");
		assertEquals("#2-1", "XYZ\n2\n", Wasavi.getRegister("\""));
		assertEquals("#2-2", "X\nY\nZ\n3", Wasavi.getValue());
		assertPos("#2-3", 2, 0);
		assertEquals("#2-4", "Changing 2 lines.", Wasavi.getLastMessage());

		Wasavi.send("gg", "2ccFOO\u001b");
		assertEquals("#3-1", "X\nY\n", Wasavi.getRegister("\""));
		assertEquals("#3-2", "FOO\nZ\n3", Wasavi.getValue());
		assertPos("#3-3", 0, 2);

		Wasavi.send("gg", "5ccXYZ\u001b");
		assertEquals("#4-1", "FOO\nZ\n3\n", Wasavi.getRegister("\""));
		assertEquals("#4-2", "XYZ", Wasavi.getValue());
		assertPos("#4-3", 0, 2);
	}

	private void _testChangeUpLine (CharSequence a) {
		Wasavi.send(":set noai\n");
		Wasavi.send("iline1\n\tline2\n\t\tline3\u001b");
		assertEquals("line1\n\tline2\n\t\tline3", Wasavi.getValue());

		Wasavi.send("3G");
		assertPos("#1-1", 2, 2);

		Wasavi.send(String.format("c%sXYZ\u001b", a));
		assertPos("#2-1", 1, 2);
		assertEquals("#2-2", "\tline2\n\t\tline3\n", Wasavi.getRegister("\""));
		assertEquals("#2-3", "\tline2\n\t\tline3\n", Wasavi.getRegister("1"));
		assertEquals("#2-4", "line1\nXYZ", Wasavi.getValue());

		Wasavi.send(String.format("c3%sFOO\u001b", a));
		assertPos("#3-1", 0, 2);
		assertEquals("#3-2", "FOO", Wasavi.getValue());
		assertEquals("#3-3", "line1\nXYZ\n", Wasavi.getRegister("\""));
		assertEquals("#3-4", "line1\nXYZ\n", Wasavi.getRegister("1"));
		assertEquals("#3-5", "\tline2\n\t\tline3\n", Wasavi.getRegister("2"));

		Wasavi.send(String.format("c3%s", a));
		assertEquals("#4-1", "FOO", Wasavi.getValue());
		assertEquals("#4-2", "command", Wasavi.getInputMode());
		assertTrue("#4-3", !"".equals(Wasavi.getLastMessage()));
	}

	@Test
	public void testChangeUpLine () {
		_testChangeUpLine("-");
	}

	private void _testChangeDownLine (CharSequence a) {
		Wasavi.send(":set noai\n");
		Wasavi.send("iline1\n\tline2\n\t\tline3\u001b");
		assertEquals("line1\n\tline2\n\t\tline3", Wasavi.getValue());

		Wasavi.send("1G");
		assertPos("#1-1", 0, 0);

		Wasavi.send(String.format("c%sXYZ\u001b", a));
		assertPos("#2-1", 0, 2);
		assertEquals("#2-2", "line1\n\tline2\n", Wasavi.getRegister("\""));
		assertEquals("#2-3", "line1\n\tline2\n", Wasavi.getRegister("1"));
		assertEquals("#2-4", "XYZ\n\t\tline3", Wasavi.getValue());

		Wasavi.send(String.format("c3%sFOO\u001b", a));
		assertPos("#3-1", 0, 2);
		assertEquals("#3-2", "FOO", Wasavi.getValue());
		assertEquals("#3-3", "XYZ\n\t\tline3\n", Wasavi.getRegister("\""));
		assertEquals("#3-4", "XYZ\n\t\tline3\n", Wasavi.getRegister("1"));
		assertEquals("#3-5", "line1\n\tline2\n", Wasavi.getRegister("2"));

		Wasavi.send(String.format("c3%s", a));
		assertEquals("#4-1", "FOO", Wasavi.getValue());
		assertEquals("#4-2", "command", Wasavi.getInputMode());
		assertTrue("#4-3", !"".equals(Wasavi.getLastMessage()));
	}

	@Test
	public void testChangeDownLine () {
		_testChangeDownLine("+");
	}

	@Test
	public void testChangeDownEnter () {
		_testChangeDownLine(Keys.ENTER);
	}

	private void _testChangeFirstNonWhiteCharOfLine (CharSequence a) {
		Wasavi.send("i\tfoobar\u001b");
		Wasavi.send(String.format("c%sXYZ\u001b", a));

		assertEquals("#1-1", "\tXYZr", Wasavi.getValue());
		assertEquals("#1-2", "fooba", Wasavi.getRegister("\""));
		assertPos("#1-3", 0, 3);

		Wasavi.send(String.format("^c%sFOO\u001b", a));
		assertEquals("#2-1", "fooba", Wasavi.getRegister("\""));
		assertPos("#2-2", 0, 3);
	}

	@Test
	public void testChangeFirstNonWhiteCharOfLine () {
		_testChangeFirstNonWhiteCharOfLine("^");
	}

	@Test
	public void testChangeHome () {
		_testChangeFirstNonWhiteCharOfLine(Keys.HOME);
	}

	@Test
	public void testChangeTopOfLine () {
		Wasavi.send("i\tfoobar\u001b");
		Wasavi.send("c0XYZ\u001b");

		assertEquals("#1-1", "\tfooba", Wasavi.getRegister("\""));
		assertEquals("#1-2", "XYZr", Wasavi.getValue());
		assertPos("#1-3", 0, 2);
	}

	private void _testChangeTailOfLine (CharSequence a) {
		Wasavi.send("i\tfoobar\u001b1|");
		Wasavi.send(String.format("c%sXYZ\u001b", a));

		assertEquals("#1-1", "\tfoobar", Wasavi.getRegister("\""));
		assertEquals("#1-2", "XYZ", Wasavi.getValue());
		assertPos("#1-3", 0, 2);
	}

	@Test
	public void testChangeTailOfLine () {
		_testChangeTailOfLine("$");
	}

	@Test
	public void testChangeEnd () {
		_testChangeTailOfLine(Keys.END);
	}

	@Test
	public void testChangeDirectColumn () {
		Wasavi.send("i0123456789\n0123456789\u001b1G", "1|");

		Wasavi.send("c5|XYZ\u001b");
		assertEquals("#1-1", "0123", Wasavi.getRegister("\""));
		assertEquals("#1-2", "XYZ456789\n0123456789", Wasavi.getValue());
		assertPos("#1-3", 0, 2);

		Wasavi.send("$c4|FOO\u001b");
		assertEquals("#2-1", "45678", Wasavi.getRegister("\""));
		assertEquals("#2-2", "XYZFOO9\n0123456789", Wasavi.getValue());
		assertPos("#2-3", 0, 5);

		Wasavi.send("2G", "1|c100|BAR\u001b");
		assertEquals("#3-1", "0123456789", Wasavi.getRegister("\""));
		assertEquals("#3-2", "XYZFOO9\nBAR", Wasavi.getValue());
		assertPos("#3-3", 1, 2);
	}

	@Test
	public void testChangeJumpToMatchedParenthes () {
		Wasavi.send("ithis is (first) line.\nthis is (second) line)\u001b");

		Wasavi.send("1G", "1|f(c%XYZ\u001b");
		assertEquals("#1-1", "(first)", Wasavi.getRegister("\""));
		assertEquals("#1-2", "this is XYZ line.\nthis is (second) line)", Wasavi.getValue());
		assertPos("#1-3", 0, 10);

		Wasavi.send("2G", "1|f)c%FOO\u001b");
		assertEquals("#2-1", "(second)", Wasavi.getRegister("\""));
		assertEquals("#2-2", "this is XYZ line.\nthis is FOO line)", Wasavi.getValue());
		assertPos("#2-3", 1, 10);

		Wasavi.send("G", "$c%");
		assertEquals("#3-1", "(second)", Wasavi.getRegister("\""));
		assertPos("#3-2", 1, 16);
		assertTrue("#3-3", !"".equals(Wasavi.getLastMessage()));
		assertEquals("#3-4", "command", Wasavi.getInputMode());
	}

	@Test
	public void testChangeSearchForward () {
		Wasavi.send("ifind the\nchar4cter in cu4rent 4line\u001b1G", "1|");

		Wasavi.send("c/4\nXYZ\u001b");
		/*
		 * XYZ4cter in cu4rent 4line
		 *   ^
		 */
		assertEquals("#1-1", "find the\nchar", Wasavi.getRegister("\""));
		assertEquals("#1-2", "XYZ4cter in cu4rent 4line", Wasavi.getValue());
		assertPos("#1-3", 0, 2);

		Wasavi.send("2c/4\nFOO\u001b");
		/*
		 * XYFOO4rent 4line
		 *     ^
		 */
		assertEquals("#2-1", "Z4cter in cu", Wasavi.getRegister("\""));
		assertEquals("#2-2", "XYFOO4rent 4line", Wasavi.getValue());
		assertPos("#2-3", 0, 4);

		Wasavi.send("3c/X\n");
		/*
		 * XYFOO4rent 4line
		 *     ^
		 */
		assertEquals("#3-1", "Z4cter in cu", Wasavi.getRegister("\""));
		assertEquals("#3-2", "XYFOO4rent 4line", Wasavi.getValue());
		assertPos("#3-3", 0, 4);
		assertTrue("#3-4", !"".equals(Wasavi.getLastMessage()));
	}

	@Test
	public void testChangeSearchBackward () {
		Wasavi.send("ifind the char4cter in cu4rent\n4line\u001b");

		Wasavi.send("G", "$c?4\nXYZ\u001b");
		/*
		 * find the char4cter in cu4rent
		 * XYZe
		 *   ^
		 */
		assertEquals("#1-1", "4lin", Wasavi.getRegister("\""));
		assertEquals("#1-2", "find the char4cter in cu4rent\nXYZe", Wasavi.getValue());
		assertPos("#1-3", 1, 2);

		Wasavi.send("2c?4\nFOO\u001b");
		/*
		 * find the charFOOZe
		 *                ^
		 */
		assertEquals("#2-1", "4cter in cu4rent\nXY", Wasavi.getRegister("\""));
		assertEquals("#2-2", "find the charFOOZe", Wasavi.getValue());
		assertPos("#2-3", 0, 15);

		Wasavi.send("2c?X\n");
		/*
		 * find the charFOOZe
		 *                ^
		 */
		assertEquals("#3-1", "4cter in cu4rent\nXY", Wasavi.getRegister("\""));
		assertEquals("#3-2", "find the charFOOZe", Wasavi.getValue());
		assertPos("#3-3", 0, 15);
		assertTrue("#3-4", !"".equals(Wasavi.getLastMessage()));
	}

	@Test
	public void testChangeFindForward () {
		Wasavi.send("ifind the char4cter in cu4rent 4line\u001b1G", "1|");

		Wasavi.send("cf4XYZ\u001b");
		assertEquals("#1-1", "find the char4", Wasavi.getRegister("\""));
		assertEquals("#1-2", "XYZcter in cu4rent 4line", Wasavi.getValue());
		assertPos("#1-3", 0, 2);

		Wasavi.send("2cf4FOO\u001b");
		assertEquals("#2-1", "Zcter in cu4rent 4", Wasavi.getRegister("\""));
		assertEquals("#2-2", "XYFOOline", Wasavi.getValue());
		assertPos("#2-3", 0, 4);

		Wasavi.send("4cf4");
		assertEquals("#3-1", "Zcter in cu4rent 4", Wasavi.getRegister("\""));
		assertEquals("#3-2", "XYFOOline", Wasavi.getValue());
		assertPos("#3-3", 0, 4);
		assertTrue("#3-4", !"".equals(Wasavi.getLastMessage()));
		assertEquals("#3-5", "command", Wasavi.getInputMode());
	}

	@Test
	public void testChangeFindBackward () {
		Wasavi.send("ifind the char4cter in cu4rent 4line\u001b");

		Wasavi.send("cF4XYZ\u001b");
		assertEquals("#1-1", "4lin", Wasavi.getRegister("\""));
		assertEquals("#1-2", "find the char4cter in cu4rent XYZe", Wasavi.getValue());
		assertPos("#1-3", 0, 32);

		Wasavi.send("2cF4FOO\u001b");
		assertEquals("#2-1", "4cter in cu4rent XY", Wasavi.getRegister("\""));
		assertEquals("#2-2", "find the charFOOZe", Wasavi.getValue());
		assertPos("#2-3", 0, 15);

		Wasavi.send("cF4");
		assertEquals("#3-1", "4cter in cu4rent XY", Wasavi.getRegister("\""));
		assertEquals("#3-2", "find the charFOOZe", Wasavi.getValue());
		assertPos("#3-3", 0, 15);
		assertTrue("#3-4", !"".equals(Wasavi.getLastMessage()));
		assertEquals("#3-5", "command", Wasavi.getInputMode());
	}

	@Test
	public void testChangeFindFowardBeforeStop () {
		Wasavi.send("ifind the char4cter in cu4rent 4line\u001b1G", "1|");

		Wasavi.send("ct4XYZ\u001b");
		assertEquals("#1-1", "find the char", Wasavi.getRegister("\""));
		assertEquals("#1-2", "XYZ4cter in cu4rent 4line", Wasavi.getValue());
		assertPos("#1-3", 0, 2);

		Wasavi.send("2ct4FOO\u001b");
		assertEquals("#2-1", "Z4cter in cu", Wasavi.getRegister("\""));
		assertEquals("#2-2", "XYFOO4rent 4line", Wasavi.getValue());
		assertPos("#2-3", 0, 4);

		Wasavi.send("4ct4");
		assertEquals("#3-1", "Z4cter in cu", Wasavi.getRegister("\""));
		assertEquals("#3-2", "XYFOO4rent 4line", Wasavi.getValue());
		assertPos("#3-3", 0, 4);
		assertTrue("#3-4", !"".equals(Wasavi.getLastMessage()));
		assertEquals("#3-5", "command", Wasavi.getInputMode());
	}

	@Test
	public void testChangeFindBackwardBeforeStop () {
		Wasavi.send("ifind the char4cter in cu4rent 4line\u001b");
		
		Wasavi.send("cT4XYZ\u001b");
		assertEquals("#1-1", "lin", Wasavi.getRegister("\""));
		assertEquals("#1-2", "find the char4cter in cu4rent 4XYZe", Wasavi.getValue());
		assertPos("#1-3", 0, 33);

		Wasavi.send("cT4FOO\u001b");
		assertEquals("#2-1", "XY", Wasavi.getRegister("\""));
		assertEquals("#2-2", "find the char4cter in cu4rent 4FOOZe", Wasavi.getValue());
		assertPos("#2-3", 0, 33);

		Wasavi.send("c2T4BAR\u001b");
		assertEquals("#3-1", "rent 4FO", Wasavi.getRegister("\""));
		assertEquals("#3-2", "find the char4cter in cu4BAROZe", Wasavi.getValue());
		assertPos("#3-3", 0, 27);

		Wasavi.send("c3T4");
		assertEquals("#4-1", "rent 4FO", Wasavi.getRegister("\""));
		assertEquals("#4-2", "find the char4cter in cu4BAROZe", Wasavi.getValue());
		assertPos("#4-3", 0, 27);
		assertTrue("#4-4", !"".equals(Wasavi.getLastMessage()));
		assertEquals("#4-5", "command", Wasavi.getInputMode());
	}

	@Test
	public void testChangeFindInvert () {
		Wasavi.send("4ifi4st s4cond th4rd fou4th\n\u001b");

		Wasavi.send("1G", "1|cf4A\u001b$c,A\u001b");
		assertEquals("#1-1", "4t", Wasavi.getRegister("\""));
		assertEquals("#1-2", "Ast s4cond th4rd fouAh", Wasavi.getValue().split("\n")[0]);
		assertPos("#1-3", 0, 20);

		Wasavi.send("2G", "1|ct4B\u001b$c,B\u001b");
		assertEquals("#2-1", "t", Wasavi.getRegister("\""));
		assertEquals("#2-2", "B4st s4cond th4rd fou4Bh", Wasavi.getValue().split("\n")[1]);
		assertPos("#2-3", 1, 22);

		Wasavi.send("3G", "$cF4C\u001b0c,C\u001b");
		assertEquals("#3-1", "fi4", Wasavi.getRegister("\""));
		assertEquals("#3-2", "Cst s4cond th4rd fouCh", Wasavi.getValue().split("\n")[2]);
		assertPos("#3-3", 2, 0);

		Wasavi.send("4G", "$cT4D\u001b0c,D\u001b");
		assertEquals("#4-1", "fi", Wasavi.getRegister("\""));
		assertEquals("#4-2", "D4st s4cond th4rd fou4Dh", Wasavi.getValue().split("\n")[3]);
		assertPos("#4-3", 3, 0);
	}

	@Test
	public void testChangeFindRepeat () {
		Wasavi.send("4ifi4st s4cond th4rd fou4th\n\u001b");

		Wasavi.send("1G", "1|f43|c;A\u001b");
		assertEquals("#1-1", "4st s4", Wasavi.getRegister("\""));
		assertEquals("#1-2", "fiAcond th4rd fou4th", Wasavi.getValue().split("\n")[0]);
		assertPos("#1-3", 0, 2);

		Wasavi.send("2G", "1|t43|c;B\u001b");
		assertEquals("#2-1", "4st s", Wasavi.getRegister("\""));
		assertEquals("#2-2", "fiB4cond th4rd fou4th", Wasavi.getValue().split("\n")[1]);
		assertPos("#2-3", 1, 2);

		Wasavi.send("3G", "$F4c;C\u001b");
		assertEquals("#3-1", "4rd fou", Wasavi.getRegister("\""));
		assertEquals("#3-2", "fi4st s4cond thC4th", Wasavi.getValue().split("\n")[2]);
		assertPos("#3-3", 2, 15);

		Wasavi.send("4G", "$T4c;D\u001b");
		assertEquals("#4-1", "rd fou4", Wasavi.getRegister("\""));
		assertEquals("#4-2", "fi4st s4cond th4Dth", Wasavi.getValue().split("\n")[3]);
		assertPos("#4-3", 3, 16);
	}

	@Test
	public void testChangeDownLineOrient () {
		Wasavi.send(":set noai\n");
		Wasavi.send("i\t1foobar\n\t2foobar\u001bgg");

		Wasavi.send("c_\tX\u001b");
		/*
		 * ^I1foobar  -->  ^IX
		 * ^I2foobar       ^I2foobar
		 */
		assertEquals("#1-1", "\t1foobar\n", Wasavi.getRegister("\""));
		assertEquals("#1-2", "\tX", Wasavi.getValue().split("\n")[0]);
		assertPos("#1-3", 0, 1);

		Wasavi.send(":set ai\n");
		Wasavi.send("2G");
		Wasavi.send("c_Y\u001b");
		/*
		 * ^IX        -->  ^IX
		 * ^I2foobar       ^IY
		 */
		assertEquals("#2-1", "\t2foobar\n", Wasavi.getRegister("\""));
		assertEquals("#2-2", "\tY", Wasavi.getValue().split("\n")[1]);
		assertPos("#2-3", 1, 1);

		Wasavi.send("gg", "c2_Z\u001b");
		/*
		 * ^IX  -->  ^IZ
		 * ^IY
		 */
		assertEquals("#3-1", "\tX\n\tY\n", Wasavi.getRegister("\""));
		assertEquals("#3-2", "\tZ", Wasavi.getValue());
		assertPos("#3-3", 0, 1);

		Wasavi.send("c3_X\u001b");
		/*
		 * ^IZ  -->  ^IX
		 */
		assertEquals("#4-1", "\tZ\n", Wasavi.getRegister("\""));
		assertEquals("#4-2", "\tX", Wasavi.getValue());
		assertPos("#4-2", 0, 1);
	}

	@Test
	public void testChangeMark () {
		Wasavi.send("ifoo1bar\nbaz3bax\u001b");

		Wasavi.send("1G", "0f1ma0c`aXYZ\u001b");
		assertEquals("#1-1", "foo", Wasavi.getRegister("\""));
		assertEquals("#1-2", "XYZ1bar\nbaz3bax", Wasavi.getValue());
		assertPos("#1-3", 0, 2);

		Wasavi.send("2G", "$F3ma$c`aFOO\u001b");
		assertEquals("#2-1", "3ba", Wasavi.getRegister("\""));
		assertEquals("#2-2", "XYZ1bar\nbazFOOx", Wasavi.getValue());
		assertPos("#2-3", 1, 5);

		Wasavi.send("FFma1G", "4|c`aBAR\u001b");
		assertEquals("#3-1", "1bar\nbaz", Wasavi.getRegister("\""));
		assertEquals("#3-2", "XYZBARFOOx", Wasavi.getValue());
		assertPos("#3-3", 0, 5);

		Wasavi.send("c`b");
		assertEquals("#4-1", "1bar\nbaz", Wasavi.getRegister("\""));
		assertEquals("#4-2", "XYZBARFOOx", Wasavi.getValue());
		assertPos("#4-3", 0, 5);
		assertEquals("#4-4", "command", Wasavi.getInputMode());
	}

	@Test
	public void testChangeMarkLineOrient () {
		Wasavi.send("i1\n2\n3\n4\n5\n6\n7\u001b");

		Wasavi.send("3G", "ma1G", "c\'aXYZ\u001b");
		assertEquals("#1-1", "1\n2\n3\n", Wasavi.getRegister("\""));
		assertEquals("#1-2", "XYZ\n4\n5\n6\n7", Wasavi.getValue());
		assertPos("#1-3", 0, 2);

		Wasavi.send("3G", "maG", "c\'aFOO\u001b");
		assertEquals("#2-1", "5\n6\n7\n", Wasavi.getRegister("\""));
		assertEquals("#2-2", "XYZ\n4\nFOO", Wasavi.getValue());
		assertPos("#2-3", 2, 2);
	}

	@Test
	public void testChangeSectionForward () {
		// TBD
	}

	@Test
	public void testChangeSectionBackward () {
		// TBD
	}

	@Test
	public void testChangeParagraphForward () {
		// TBD
	}

	@Test
	public void testChangeParagraphBackward () {
		// TBD
	}

	@Test
	public void testChangeSentenceForward () {
		// TBD
	}

	@Test
	public void testChangeSentenceBackward () {
		// TBD
	}

	private void _testChangeDown (CharSequence a) {
		Wasavi.send("ifirst\nsecond\nthird\nf\nfifth\u001b");
		Wasavi.send("2G", String.format("3|c10%sXYZ\nFOO\u001b", a));
		assertEquals("#1-1", "second\nthird\nf\nfifth\n", Wasavi.getRegister("\""));
		assertEquals("#1-2", "second\nthird\nf\nfifth\n", Wasavi.getRegister("1"));
		assertEquals("#1-3", "first\nXYZ\nFOO", Wasavi.getValue());
		assertPos("#1-4", 2, 2);
		assertTrue("#1-5", "".equals(Wasavi.getLastMessage()));

		Wasavi.send("2G", String.format("3|c%sBAR\nBAZ\u001b", a));
		assertEquals("#2-1", "XYZ\nFOO\n", Wasavi.getRegister("\""));
		assertEquals("#2-2", "XYZ\nFOO\n", Wasavi.getRegister("1"));
		assertEquals("#2-3", "second\nthird\nf\nfifth\n", Wasavi.getRegister("2"));
		assertEquals("#2-4", "first\nBAR\nBAZ", Wasavi.getValue());
		assertPos("#2-5", 2, 2);
	}

	@Test
	public void testChangeDown () {
		_testChangeDown("j");
	}

	@Test
	public void testChangeDownCtrlN () {
		_testChangeDown("\u000e");
	}

	@Test
	public void testChangeDownDown () {
		_testChangeDown(Keys.ARROW_DOWN);
	}

	private void _testChangeUp (CharSequence a) {
		Wasavi.send("ifirst\nsecond\nt\u001b");

		Wasavi.send("2G", String.format("3|c10%sXYZ\u001b", a));
		assertEquals("#1-1", "first\nsecond\n", Wasavi.getRegister("\""));
		assertEquals("#1-2", "first\nsecond\n", Wasavi.getRegister("1"));
		assertEquals("#1-3", "XYZ\nt", Wasavi.getValue());
		assertPos("#1-2", 0, 2);
		assertTrue("#1-3", "".equals(Wasavi.getLastMessage()));

		Wasavi.send("2G", String.format("1|c%sFOO\u001b", a));
		assertEquals("#2-1", "XYZ\nt\n", Wasavi.getRegister("\""));
		assertEquals("#2-2", "XYZ\nt\n", Wasavi.getRegister("1"));
		assertEquals("#2-3", "first\nsecond\n", Wasavi.getRegister("2"));
		assertEquals("#2-4", "FOO", Wasavi.getValue());
		assertPos("#2-4", 0, 2);
	}

	@Test
	public void testChangeUp () {
		_testChangeUp("k");
	}

	@Test
	public void testChangeUpCtrlP () {
		_testChangeUp("\u0010");
	}

	@Test
	public void testChangeUpUp () {
		_testChangeUp(Keys.ARROW_UP);
	}

	private void _testChangeLeft (CharSequence a) {
		Wasavi.send("ifoo bar baz\u001b");
		assertPos("#1-1", 0, 10);

		Wasavi.send(String.format("c%sX\u001b", a));
		assertEquals("#2-1", "a", Wasavi.getRegister("\""));
		assertEquals("#2-2", "foo bar bXz", Wasavi.getValue());
		assertPos("#2-3", 0, 9);

		Wasavi.send(String.format("c2%sY\u001b", a));
		assertEquals("#3-1", " b", Wasavi.getRegister("\""));
		assertEquals("#3-2", "foo barYXz", Wasavi.getValue());
		assertPos("#3-3", 0, 7);

		Wasavi.send(String.format("c100%sZ\u001b", a));
		assertEquals("#4-1", "foo bar", Wasavi.getRegister("\""));
		assertEquals("#4-2", "ZYXz", Wasavi.getValue());
		assertPos("#4-3", 0, 0);
	}

	@Test
	public void testChangeLeft () {
		_testChangeLeft("h");
	}

	@Test
	public void testChangeLeftCtrlH () {
		_testChangeLeft("\u0008");
	}

	@Test
	public void testChangeLeftLeft () {
		_testChangeLeft(Keys.LEFT);
	}

	private void _testChangeRight (CharSequence a) {
		Wasavi.send("ifoo bar baz\u001b1|");
		assertPos("#1-1", 0, 0);

		Wasavi.send(String.format("c%sX\u001b", a));
		assertEquals("#2-1", "Xoo bar baz", Wasavi.getValue());
		assertPos("#2-2", 0, 0);
		assertEquals("#2-3", "f", Wasavi.getRegister("\""));

		Wasavi.send(String.format("\"ac2%sY\u001b", a));
		assertEquals("#3-1", "Yo bar baz", Wasavi.getValue());
		assertPos("#3-2", 0, 0);
		assertEquals("#3-3", "Xo", Wasavi.getRegister("a"));
		assertEquals("#3-4", "Xo", Wasavi.getRegister("\""));

		Wasavi.send(String.format("c5%sZ\u001b", a));
		assertEquals("#4-1", "Zr baz", Wasavi.getValue());
		assertPos("#4-2", 0, 0);
		assertEquals("#4-3", "Yo ba", Wasavi.getRegister("\""));

		Wasavi.send(String.format("c100%sF\u001b", a));
		assertEquals("#5-1", "F", Wasavi.getValue());
		assertPos("#5-2", 0, 0);
		assertEquals("#5-3", "Zr baz", Wasavi.getRegister("\""));
	}

	@Test
	public void testChangeRight () {
		_testChangeRight("l");
	}

	@Test
	public void testChangeRightSpace () {
		_testChangeRight(" ");
	}

	@Test
	public void testChangeRightRight () {
		_testChangeRight(Keys.ARROW_RIGHT);
	}

	@Test
	public void testChangeWordForward () {
		Wasavi.send("ifoo bar baz\nbax\u001b1|gg");

		Wasavi.send("cwFOO\u001b");
		assertEquals("#1-1", "FOO bar baz\nbax", Wasavi.getValue());
		assertPos("#1-2", 0, 2);
		assertEquals("#1-3", "foo", Wasavi.getRegister("\""));

		Wasavi.send("gg", "c2wBAR BAZ\u001b");
		assertEquals("#2-1", "BAR BAZ baz\nbax", Wasavi.getValue());
		assertPos("#2-2", 0, 6);
		assertEquals("#2-3", "FOO bar", Wasavi.getRegister("\""));

		Wasavi.send("gg", "c3wX Y Z\u001b");
		assertEquals("#3-1", "X Y Z\nbax", Wasavi.getValue());
		assertPos("#3-2", 0, 4);
		assertEquals("#3-3", "BAR BAZ baz", Wasavi.getRegister("\""));

		Wasavi.send("gg", "c4wBAX\u001b");
		assertEquals("#4-1", "BAX", Wasavi.getValue());
		assertTrue("#4-2", "".equals(Wasavi.getLastMessage()));
		assertPos("#4-3", 0, 2);
		assertEquals("#4-4", "X Y Z\nbax", Wasavi.getRegister("\""));
	}

	@Test
	public void testChangeWordBackward () {
		Wasavi.send("ifoo\nbar baz bax\u001b");

		/*
		 * foo               foo
		 * bar baz bax  -->  bar baz XYZx
		 */
		Wasavi.send("cbXYZ\u001b");
		assertEquals("#1-1", "foo\nbar baz XYZx", Wasavi.getValue());
		assertPos("#1-2", 1, 10);
		assertEquals("#1-3", "ba", Wasavi.getRegister("\""));

		/*
		 * foo                foo
		 * bar baz XYZx  -->  FOO BARXYZx
		 */
		Wasavi.send("bc2bFOO BAR\u001b");
		assertEquals("#2-1", "foo\nFOO BARXYZx", Wasavi.getValue());
		assertPos("#2-2", 1, 6);
		assertEquals("#2-3", "bar baz ", Wasavi.getRegister("\""));

		/*
		 * foo               BAZ
		 * FOO BARXYZx  -->  FOOBARXYZx
		 */
		Wasavi.send("0cbBAZ\u001b");
		assertEquals("#3-1", "BAZ\nFOO BARXYZx", Wasavi.getValue());
		assertPos("#3-2", 0, 2);
		assertEquals("#3-3", "foo", Wasavi.getRegister("\""));
	}

	@Test
	public void testChangeBigwordForward () {
		Wasavi.send("if#o b#r b#z\nb#x\u001b1|gg");

		Wasavi.send("cWFOO\u001b");
		assertEquals("#1-1", "FOO b#r b#z\nb#x", Wasavi.getValue());
		assertPos("#1-2", 0, 2);
		assertEquals("#1-3", "f#o", Wasavi.getRegister("\""));

		Wasavi.send("gg", "c2WBAR BAZ\u001b");
		assertEquals("#2-1", "BAR BAZ b#z\nb#x", Wasavi.getValue());
		assertPos("#2-2", 0, 6);
		assertEquals("#2-3", "FOO b#r", Wasavi.getRegister("\""));

		Wasavi.send("gg", "c3WX Y Z\u001b");
		assertEquals("#3-1", "X Y Z\nb#x", Wasavi.getValue());
		assertPos("#3-2", 0, 4);
		assertEquals("#3-3", "BAR BAZ b#z", Wasavi.getRegister("\""));

		Wasavi.send("gg", "c4WBAX\u001b");
		assertEquals("#4-1", "BAX", Wasavi.getValue());
		assertTrue("#4-2", "".equals(Wasavi.getLastMessage()));
		assertPos("#4-3", 0, 2);
		assertEquals("#4-4", "X Y Z\nb#x", Wasavi.getRegister("\""));
	}

	@Test
	public void testChangeBigwordBackward () {
		Wasavi.send("if#o\nb#r b#z b#x\u001b");

		Wasavi.send("cBXYZ\u001b");
		assertEquals("#1-1", "f#o\nb#r b#z XYZx", Wasavi.getValue());
		assertPos("#1-2", 1, 10);
		assertEquals("#1-3", "b#", Wasavi.getRegister("\""));

		Wasavi.send("bc2BFOO BAR\u001b");
		assertEquals("#2-1", "f#o\nFOO BARXYZx", Wasavi.getValue());
		assertPos("#2-2", 1, 6);
		assertEquals("#2-3", "b#r b#z ", Wasavi.getRegister("\""));

		Wasavi.send("0cBBAZ\u001b");
		assertEquals("#3-1", "BAZ\nFOO BARXYZx", Wasavi.getValue());
		assertPos("#3-2", 0, 2);
		assertEquals("#3-3", "f#o", Wasavi.getRegister("\""));
	}

	@Test
	public void testChangeWordEnd () {
		Wasavi.send("ifoo bar\nbaz\nbax\u001bgg");

		Wasavi.send("ceXYZ\u001b");
		assertEquals("#1-1", "foo", Wasavi.getRegister("\""));
		assertEquals("#1-2", "XYZ bar\nbaz\nbax", Wasavi.getValue());
		assertPos("#1-3", 0, 2);

		Wasavi.send("gg", "c2eFOO BAR\u001b");
		assertEquals("#2-1", "XYZ bar", Wasavi.getRegister("\""));
		assertEquals("#2-2", "FOO BAR\nbaz\nbax", Wasavi.getValue());
		assertPos("#2-3", 0, 6);

		Wasavi.send("gg", "3e");
		assertPos("#3-x-1", 1, 2);
		Wasavi.send("gg", "c3eBAR BAZ BAX\u001b");
		assertEquals("#3-1", "FOO BAR\nbaz", Wasavi.getRegister("\""));
		assertEquals("#3-2", "BAR BAZ BAX\nbax", Wasavi.getValue());
		assertPos("#3-3", 0, 10);
	}

	@Test
	public void testChangeBigwordEnd () {
		Wasavi.send("if@o b@r\nb@z\nb@x\u001bgg");

		Wasavi.send("cEXYZ\u001b");
		assertEquals("#1-1", "f@o", Wasavi.getRegister("\""));
		assertEquals("#1-2", "XYZ b@r\nb@z\nb@x", Wasavi.getValue());
		assertPos("#1-3", 0, 2);

		Wasavi.send("gg", "c2EFOO BAR\u001b");
		assertEquals("#2-1", "XYZ b@r", Wasavi.getRegister("\""));
		assertEquals("#2-2", "FOO BAR\nb@z\nb@x", Wasavi.getValue());
		assertPos("#2-3", 0, 6);

		Wasavi.send("gg", "3E");
		assertPos("#3-x-1", 1, 2);
		Wasavi.send("gg", "c3EBAR BAZ BAX\u001b");
		assertEquals("#3-1", "FOO BAR\nb@z", Wasavi.getRegister("\""));
		assertEquals("#3-2", "BAR BAZ BAX\nb@x", Wasavi.getValue());
		assertPos("#3-3", 0, 10);
	}

	@Test
	public void testChangeGotoPrefix () {
		Wasavi.send(":set noai\n");
		Wasavi.send("i 1\n2\n 3\u001b");

		Wasavi.send("cggXYZ\u001b");
		assertEquals("#1-1", " 1\n2\n 3\n", Wasavi.getRegister("\""));
		assertEquals("#1-2", " 1\n2\n 3\n", Wasavi.getRegister("1"));
		assertEquals("#1-3", "XYZ", Wasavi.getValue());
		assertPos("#1-4", 0, 2);
	}

	@Test
	public void testChangeGotoPrefixAutoIndent () {
		Wasavi.send(":set ai\n");
		Wasavi.send("i\t1\n2\n3\u001b");

		Wasavi.send("cggXYZ\u001b");
		assertEquals("#1-1", "\t1\n\t2\n\t3\n", Wasavi.getRegister("\""));
		assertEquals("#1-2", "\t1\n\t2\n\t3\n", Wasavi.getRegister("1"));
		assertEquals("#1-3", "\tXYZ", Wasavi.getValue());
		assertPos("#1-4", 0, 3);
	}

	@Test
	public void testChangeTopOfView () {
		Wasavi.makeScrollableBuffer(2);

		int rowLength = Wasavi.getRowLength();
		Wasavi.send("G", "H");
		int viewLines = Wasavi.getRowLength() - Wasavi.getRow();

		Wasavi.send("G", "cH\u001b");
		assertEquals(Wasavi.getRegister("\"").replaceAll("\\n$", "").split("\\n").length, viewLines);
	}

	@Test
	public void testChangeMiddleOfView () {
		Wasavi.makeScrollableBuffer(2);

		int rowLength = Wasavi.getRowLength();
		Wasavi.send("gg", "M");
		int viewLines = Wasavi.getRow() + 1;
		Wasavi.send("gg", "cM\u001b");
		assertEquals("#1", Wasavi.getRegister("\"").split("\\n", 1000).length - 1, viewLines);

		rowLength = Wasavi.getRowLength();
		Wasavi.send("G", "M");
		viewLines = Wasavi.getRowLength() - Wasavi.getRow();

		Wasavi.send("G", "cM\u001b");
		assertEquals("#2", Wasavi.getRegister("\"").split("\\n", 1000).length - 1, viewLines);
	}

	@Test
	public void testChangeBottomOfView () {
		Wasavi.makeScrollableBuffer(2);

		int rowLength = Wasavi.getRowLength();
		Wasavi.send("gg", "L");
		int viewLines = Wasavi.getRow() + 1;

		Wasavi.send("gg", "cL\u001b");
		assertEquals(Wasavi.getRegister("\"").replaceAll("\\n$", "").split("\\n").length, viewLines);
	}

	@Test
	public void testChangeGoto () {
		Wasavi.send(":set noai\n");
		Wasavi.send("i\t1\n\t2\n\t3\n\t4\n\t5\n\t6\n\t7\u001b");

		Wasavi.send("gg", "c3GXYZ\u001b");
		assertEquals("#1-1", "\t1\n\t2\n\t3\n", Wasavi.getRegister("\""));
		assertEquals("#1-2", "\t1\n\t2\n\t3\n", Wasavi.getRegister("1"));
		assertEquals("#1-3", "XYZ\n\t4\n\t5\n\t6\n\t7", Wasavi.getValue());
		assertPos("#1-4", 0, 2);

		Wasavi.send(":set noai\nG", "c3GFOO\u001b");
		assertEquals("#2-1", "\t5\n\t6\n\t7\n", Wasavi.getRegister("\""));
		assertEquals("#2-2", "\t5\n\t6\n\t7\n", Wasavi.getRegister("1"));
		assertEquals("#2-3", "\t1\n\t2\n\t3\n", Wasavi.getRegister("2"));
		assertEquals("#2-4", "XYZ\n\t4\nFOO", Wasavi.getValue());
		assertPos("#2-5", 2, 2);
	}

	@Test
	public void testChangeSearchForwardNext_1 () {
		Wasavi.send(":set noai\n");
		Wasavi.send(String.format("i%s\u001b", join("\n",
			"    def",		// XYZ
			"foo",          // foo
			"baz"			// baz
		)));

		Wasavi.send("1G", "1|/foo\n");
		assertPos("#1-1", 1, 0);

		Wasavi.send("1G", "5|cnXYZ\u001b");
		assertEquals("#2-1", "    def\n", Wasavi.getRegister("\""));
		assertEquals("#2-2", "XYZ\nfoo\nbaz", Wasavi.getValue());
		assertPos("#2-3", 0, 2);
	}

	@Test
	public void testChangeSearchForwardNext_2 () {
		Wasavi.send(":set noai\n");
		Wasavi.send(String.format("i%s\u001b", join("\n",
			"abc def",		// abc XYZ
			"foo",			// foo
			"baz"			// baz
		)));

		Wasavi.send("1G", "1|/foo\n");
		assertPos("#1-1", 1, 0);

		Wasavi.send("1G", "5|cnXYZ\u001b");
		assertEquals("#2-1", "def", Wasavi.getRegister("\""));
		assertEquals("#2-2", "abc XYZ\nfoo\nbaz", Wasavi.getValue());
		assertPos("#2-3", 0, 6);
	}

	@Test
	public void testChangeSearchForwardNext_3 () {
		Wasavi.send(":set noai\n");
		Wasavi.send(String.format("i%s\u001b", join("\n",
			"    def",		//    XYZfoo
			"ghi foo",		// baz
			"baz"
		)));

		Wasavi.send("1G", "1|/foo\n");
		assertPos("#1-1", 1, 4);

		Wasavi.send("1G", "5|cnXYZ\u001b");
		assertEquals("#2-1", "def\nghi ", Wasavi.getRegister("\""));
		assertEquals("#2-2", "    XYZfoo\nbaz", Wasavi.getValue());
		assertPos("#2-3", 0, 6);
	}

	@Test
	public void testChangeSearchForwardNext_4 () {
		Wasavi.send(":set noai\n");
		Wasavi.send(String.format("i%s\u001b", join("\n",
			"abc def",		// abc XYZfoo
			"ghi foo",		// baz
			"baz"
		)));

		Wasavi.send("1G", "1|/foo\n");
		assertPos("#1-1", 1, 4);

		Wasavi.send("1G", "5|cnXYZ\u001b");
		assertEquals("#2-1", "def\nghi ", Wasavi.getRegister("\""));
		assertEquals("#2-2", "abc XYZfoo\nbaz", Wasavi.getValue());
		assertPos("#2-3", 0, 6);
	}

	@Test
	public void testChangeSearchForwardPrev_1 () {
		Wasavi.send(":set noai\n");
		Wasavi.send(String.format("i%s\u001b", join("\n",
			"    def",		// foo
			"foo",          // baz
			"baz"			//
		)));

		Wasavi.send("1G", "1|/def\n");
		assertPos("#1-1", 0, 4);

		Wasavi.send("2G", "1|cNXYZ\u001b");
		assertEquals("#2-1", "    def\n", Wasavi.getRegister("\""));
		assertEquals("#2-2", "XYZ\nfoo\nbaz", Wasavi.getValue());
		assertPos("#2-2", 0, 2);
	}

	@Test
	public void testChangeSearchForwardPrev_2 () {
		Wasavi.send(":set noai\n");
		Wasavi.send(String.format("i%s\u001b", join("\n",
			"abc def",		// abc XYZ
			"foo",			// foo
			"baz"			// baz
		)));

		Wasavi.send("1G", "1|/def\n");
		assertPos("#1-1", 0, 4);

		Wasavi.send("2G", "1|cNXYZ\u001b");
		assertEquals("#2-1", "def", Wasavi.getRegister("\""));
		assertEquals("#2-2", "abc XYZ\nfoo\nbaz", Wasavi.getValue());
		assertPos("#2-3", 0, 6);
	}

	@Test
	public void testChangeSearchForwardPrev_3 () {
		Wasavi.send(":set noai\n");
		Wasavi.send(String.format("i%s\u001b", join("\n",
			"    def",		//    XYZfoo
			"ghi foo",		// baz
			"baz"
		)));

		Wasavi.send("1G", "1|/def\n");
		assertPos("#1-1", 0, 4);

		Wasavi.send("2G", "5|cNXYZ\u001b");
		assertEquals("#2-1", "def\nghi ", Wasavi.getRegister("\""));
		assertEquals("#2-2", "    XYZfoo\nbaz", Wasavi.getValue());
		assertPos("#2-3", 0, 6);
	}

	@Test
	public void testChangeSearchForwardPrev_4 () {
		Wasavi.send(":set noai\n");
		Wasavi.send(String.format("i%s\u001b", join("\n",
			"abc def",		// abc XYZfoo
			"ghi foo",		// baz
			"baz"
		)));

		Wasavi.send("G", "?def\n");
		assertPos("#1-1", 0, 4);

		Wasavi.send("2G", "5|cNXYZ\u001b");
		assertEquals("#2-1", "def\nghi ", Wasavi.getRegister("\""));
		assertEquals("#2-2", "abc XYZfoo\nbaz", Wasavi.getValue());
		assertPos("#2-2", 0, 6);
	}

	@Test
	public void testChangeSearchBackwardNext_1 () {
		Wasavi.send(":set noai\n");
		Wasavi.send(String.format("i%s\u001b", join("\n",
			"    def",		// XYZ
			"foo",          // baz
			"baz"			//
		)));

		Wasavi.send("G", "?def\n");
		assertPos("#1-1", 0, 4);

		Wasavi.send("2G", "1|cnXYZ\u001b");
		assertEquals("#2-1", "    def\n", Wasavi.getRegister("\""));
		assertEquals("#2-2", "XYZ\nfoo\nbaz", Wasavi.getValue());
		assertPos("#2-3", 0, 2);
	}

	@Test
	public void testChangeSearchBackwardNext_2 () {
		Wasavi.send(":set noai\n");
		Wasavi.send(String.format("i%s\u001b", join("\n",
			"abc def",		// abc XYZ
			"foo",			// foo
			"baz"			// baz
		)));

		Wasavi.send("G", "?def\n");
		assertPos("#1-1", 0, 4);

		Wasavi.send("2G", "1|cnXYZ\u001b");
		assertEquals("#2-1", "def", Wasavi.getRegister("\""));
		assertEquals("#2-2", "abc XYZ\nfoo\nbaz", Wasavi.getValue());
		assertPos("#2-3", 0, 6);
	}

	@Test
	public void testChangeSearchBackwardNext_3 () {
		Wasavi.send(":set noai\n");
		Wasavi.send(String.format("i%s\u001b", join("\n",
			"    def",		//     XYZfoo
			"ghi foo",		// baz
			"baz"
		)));

		Wasavi.send("G", "?def\n");
		assertPos("#1-1", 0, 4);

		Wasavi.send("2G", "5|cnXYZ\u001b");
		assertEquals("#2-1", "def\nghi ", Wasavi.getRegister("\""));
		assertEquals("#2-2", "    XYZfoo\nbaz", Wasavi.getValue());
		assertPos("#2-3", 0, 6);
	}

	@Test
	public void testChangeSearchBackwardNext_4 () {
		Wasavi.send(":set noai\n");
		Wasavi.send(String.format("i%s\u001b", join("\n",
			"abc def",		// abc foo
			"ghi foo",		// baz
			"baz"
		)));

		Wasavi.send("G", "?def\n");
		assertPos("#1-1", 0, 4);

		Wasavi.send("2G", "5|cnXYZ\u001b");
		assertEquals("#2-1", "def\nghi ", Wasavi.getRegister("\""));
		assertEquals("#2-2", "abc XYZfoo\nbaz", Wasavi.getValue());
		assertPos("#2-3", 0, 6);
	}

	@Test
	public void testChangeSearchBackwardPrev_1 () {
		Wasavi.send(":set noai\n");
		Wasavi.send(String.format("i%s\u001b", join("\n",
			"    def",		// XYZ
			"foo",          // foo
			"baz"			// baz
		)));

		Wasavi.send("G", "?foo\n");
		assertPos("#1-1", 1, 0);

		Wasavi.send("1G", "5|cNXYZ\u001b");
		assertEquals("#2-1", "    def\n", Wasavi.getRegister("\""));
		assertEquals("#2-2", "XYZ\nfoo\nbaz", Wasavi.getValue());
		assertPos("#2-2", 0, 2);
	}

	@Test
	public void testChangeSearchBackwardPrev_2 () {
		Wasavi.send(":set noai\n");
		Wasavi.send(String.format("i%s\u001b", join("\n",
			"abc def",		// abc XYZ
			"foo",			// foo
			"baz"			// baz
		)));

		Wasavi.send("G", "?foo\n");
		assertPos("#1-1", 1, 0);

		Wasavi.send("1G", "5|cNXYZ\u001b");
		assertEquals("#2-1", "def", Wasavi.getRegister("\""));
		assertEquals("#2-2", "abc XYZ\nfoo\nbaz", Wasavi.getValue());
		assertPos("#2-3", 0, 6);
	}

	@Test
	public void testChangeSearchBackwardPrev_3 () {
		Wasavi.send(":set noai\n");
		Wasavi.send(String.format("i%s\u001b", join("\n",
			"    def",		//    XYZfoo
			"ghi foo",		// baz
			"baz"
		)));

		Wasavi.send("G", "?foo\n");
		assertPos("#1-1", 1, 4);

		Wasavi.send("1G", "5|cNXYZ\u001b");
		assertEquals("#2-1", "def\nghi ", Wasavi.getRegister("\""));
		assertEquals("#2-2", "    XYZfoo\nbaz", Wasavi.getValue());
		assertPos("#2-2", 0, 6);
	}

	@Test
	public void testChangeSearchBackwardPrev_4 () {
		Wasavi.send(":set noai\n");
		Wasavi.send(String.format("i%s\u001b", join("\n",
			"abc def",		// abc foo
			"ghi foo",		// baz
			"baz"
		)));

		Wasavi.send("G", "?foo\n");
		assertPos("#1-1", 1, 4);

		Wasavi.send("1G", "5|cNXYZ\u001b");
		assertEquals("#2-1", "def\nghi ", Wasavi.getRegister("\""));
		assertEquals("#2-2", "abc XYZfoo\nbaz", Wasavi.getValue());
		assertPos("#2-3", 0, 6);
	}
}

/* vim:set ts=4 sw=4 fileencoding=UTF-8 fileformat=unix filetype=java : */
