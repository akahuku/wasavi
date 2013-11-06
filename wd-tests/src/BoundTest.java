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

public class BoundTest extends WasaviTest {
	private void testMark (String name, int line, int col) {
		int[] p1 = Wasavi.getMark(name);
		assertNotNull("#testMark-1", p1);
		assertEquals("#testMark-2",
				String.format("line %d, col %d", line, col),
				String.format("line %d, col %d", p1[0], p1[1]));
	}

	private void _changeBound (String command) {
		Wasavi.send("ifoobar\nbazbax\u001b");
		Wasavi.send("1G3|vj4|" + command + "XYZ\u001b");

		assertValue("#1-1", "foXYZax");
		assertEquals("#1-2", "obar\nbazb", Wasavi.getRegister("\""));
		assertEquals("#1-3", "XYZ", Wasavi.getRegister("."));
		assertEquals("#1-4", "vj4|" + command + "XYZ\u001b", Wasavi.getLastSimpleCommand());
		testMark("<", 0, 2);
		testMark(">", 0, 5);
	}

	private void _changeBoundLinewise (String command) {
		Wasavi.send("ifoobar\nbazbax\nquxquux\u001b");
		Wasavi.send("1G3|vj4|" + command + "XYZ\u001b");

		assertValue("#1-1", "XYZ\nquxquux");
		assertEquals("#1-2", "foobar\nbazbax\n", Wasavi.getRegister("\""));
		assertEquals("#1-3", "XYZ", Wasavi.getRegister("."));
		assertEquals("#1-4", "vj4|" + command + "XYZ\u001b", Wasavi.getLastSimpleCommand());

		assertNull("#2-1", Wasavi.getMark("<"));
		assertNull("#2-2", Wasavi.getMark(">"));
	}

	private void _deleteBound (String command) {
		Wasavi.send("ifoobar\nbazbax\u001b");
		Wasavi.send("1G3|vj4|" + command);

		assertValue("#1-1", "foax");
		assertEquals("#1-2", "obar\nbazb", Wasavi.getRegister("\""));
		assertEquals("#1-4", "vj4|" + command, Wasavi.getLastSimpleCommand());
		testMark("<", 0, 2);
		testMark(">", 0, 2);
	}

	private void _deleteBoundLinewise (String command) {
		Wasavi.send("ifoobar\nbazbax\nquxquux\u001b");
		Wasavi.send("1G3|vj4|" + command);

		assertValue("#1-1", "quxquux");
		assertEquals("#1-2", "foobar\nbazbax\n", Wasavi.getRegister("\""));
		assertEquals("#1-4", "vj4|" + command, Wasavi.getLastSimpleCommand());
		assertNull("#2-1", Wasavi.getMark("<"));
		assertNull("#2-2", Wasavi.getMark(">"));
	}

	private void _pasteIntoBound (String command) {
		Wasavi.send("ifoo\nbr\nbaz\nbax\u001b");

		/*
		 * foo                    foo
		 * br   -->  '":foo  -->  foo  -->  '":br
		 * baz                    baz
		 * bax                    bax
		 */

		Wasavi.send("1Gyw2G0ve" + command);
		assertValue("#1-1", "foo\nfoo\nbaz\nbax");
		assertEquals("#1-2", "br", Wasavi.getRegister("\""));
		assertEquals("#1-4", "ve" + command, Wasavi.getLastSimpleCommand());
		testMark("<", 1, 0);
		testMark(">", 1, 3);

		Wasavi.send("G0ve" + command);
		assertValue("#2-1", "foo\nfoo\nbaz\nbr");
	}

	private void _pasteLinewiseDataIntoBound (String command) {
		Wasavi.send("ifoo\nbar\nbaz\nbax\u001b");

		/*
		 * foo                    foo
		 * bar  -->  '":foo  -->  bar  -->  '":baz^J
		 * baz          bar       foo
		 * bax                    bar
		 *
		 *                        bax
		 */
		Wasavi.send("1Gy2y3G0ve" + command);
		assertValue("#1-1", "foo\nbar\nfoo\nbar\n\nbax");
		assertEquals("#1-2", "baz", Wasavi.getRegister("\""));
		assertEquals("#1-4", "ve" + command, Wasavi.getLastSimpleCommand());
		testMark("<", 2, 0);
		testMark(">", 4, 0);
	}

	/* common */

	@Test
	public void charBound () {
		Wasavi.send("ifoobar\nbazbax\u001b");
		Wasavi.send("1G3|vj4|\u001b");

		testMark("<", 0, 2);
		testMark(">", 1, 3);
	}

	@Test
	public void lineBound () {
		Wasavi.send("ifoobar\nbazbax\u001b");
		Wasavi.send("1G3|Vj4|\u001b");

		testMark("<", 0, 2);
		testMark(">", 1, 3);
	}

	@Test
	public void charToLine () {
		Wasavi.send("ifoo\nbar\nbaz\nbax\u001b");
		Wasavi.send("2G2|vjVy");
		assertValue("#1-1", "foo\nbar\nbaz\nbax");
		assertEquals("#1-2", "bar\nbaz\n", Wasavi.getRegister("\""));
		assertEquals("#1-4", "vjVy", Wasavi.getLastSimpleCommand());
		testMark("<", 1, 1);
		testMark(">", 2, 1);
	}

	@Test
	public void lineToChar () {
		Wasavi.send("ifoo\nbar\nbaz\nbax\u001b");
		Wasavi.send("2G2|Vjvy");
		assertValue("#1-1", "foo\nbar\nbaz\nbax");
		assertEquals("#1-2", "ar\nba", Wasavi.getRegister("\""));
		assertEquals("#1-4", "Vjvy", Wasavi.getLastSimpleCommand());
		testMark("<", 1, 1);
		testMark(">", 2, 1);
	}

	/* bound mode */

	@Test
	public void changeBound () {
		_changeBound("c");
	}

	@Test
	public void changeBounds () {
		_changeBound("s");
	}

	@Test
	public void changeBoundLinewise () {
		_changeBoundLinewise("C");
	}

	@Test
	public void changeBoundLinewiseS () {
		_changeBoundLinewise("S");
	}

	@Test
	public void changeBoundLinewiseR () {
		_changeBoundLinewise("R");
	}

	@Test
	public void deleteBound () {
		_deleteBound("d");
	}

	@Test
	public void deleteBoundx () {
		_deleteBound("x");
	}

	@Test
	public void deleteBoundLinewise () {
		_deleteBoundLinewise("D");
	}

	@Test
	public void deleteBoundLinewiseX () {
		_deleteBoundLinewise("X");
	}

	@Test
	public void yankBound () {
		Wasavi.send("ifoo bar\nbaz bax\u001b");
		Wasavi.send("1G^wv2w\"ay");

		assertValue("#1-1", "foo bar\nbaz bax");
		assertEquals("#1-2", "bar\nbaz b", Wasavi.getRegister("a"));
		assertEquals("#1-4", "v2w\"ay", Wasavi.getLastSimpleCommand());
		testMark("<", 0, 4);
		testMark(">", 1, 4);
	}

	@Test
	public void yankBoundLinewise () {
		Wasavi.send("ifoo bar\nbaz bax\nqux quux\u001b");
		Wasavi.send("1G^wv2w\"aY");

		assertValue("#1-1", "foo bar\nbaz bax\nqux quux");
		assertEquals("#1-2", "foo bar\nbaz bax\n", Wasavi.getRegister("a"));
		assertEquals("#1-4", "v2w\"aY", Wasavi.getLastSimpleCommand());
		testMark("<", 0, 4);
		testMark(">", 1, 4);
	}

	@Test
	public void shiftBound () {
		Wasavi.send("ifoo bar\nbaz bax\nqux quux\u001b");
		Wasavi.send("1G^wv2e>");

		assertValue("#1-1", "    foo bar\n    baz bax\nqux quux");
		assertEquals("#1-4", "v2e>", Wasavi.getLastSimpleCommand());
		testMark("<", 0, 8);
		testMark(">", 1, 6);
	}

	@Test
	public void unshiftBound () {
		Wasavi.send(":set noai\ni\tfoo bar\n    baz bax\nqux quux\u001b");
		Wasavi.send("2G^vb<");

		assertValue("#1-1", "    foo bar\nbaz bax\nqux quux");
		assertEquals("#1-4", "vb<", Wasavi.getLastSimpleCommand());
		testMark("<", 0, 8);
		testMark(">", 1, 0);
	}

	@Test
	public void restoreBound () {
		Wasavi.send("ifoo bar\nbaz bax\nqux quux\u001b");
		Wasavi.send("1G^wv2wl\u001b");

		testMark("<", 0, 4);
		testMark(">", 1, 5);

		Wasavi.send("gvy");
		assertValue("#1-1", "foo bar\nbaz bax\nqux quux");
		assertEquals("#1-2", "bar\nbaz ba", Wasavi.getRegister("\""));
		assertEquals("#1-4", "gvy", Wasavi.getLastSimpleCommand());
	}

	@Test
	public void rangeSymbol () {
		Wasavi.send("ifoo bar\nbaz bax\nqux quux\u001b");
		Wasavi.send("1G6|viw\u001b");

		testMark("<", 0, 4);
		testMark(">", 0, 6);
	}

	@Test
	public void swapCaseInBound () {
		Wasavi.send("ifoo BAR\nBAZ bax\nqux quux\u001b");
		Wasavi.send("1G^2|vj$h~");

		assertValue("#1-1", "fOO bar\nbaz BAx\nqux quux");
		assertEquals("#1-4", "vj$h~", Wasavi.getLastSimpleCommand());
		testMark("<", 0, 1);
		testMark(">", 1, 5);
	}

	@Test
	public void switchToLineInput () {
		Wasavi.send("i1 first\n2 second\n3\n4\n5\u001b");
		Wasavi.send("1G^ffvj$:p\n");

		assertEquals("#1-1", "1 first\n2 second", Wasavi.getLastMessage());
	}

	@Test
	public void joinBound () {
		Wasavi.send("ifoo\nbar\nbaz\nbax\u001b");
		Wasavi.send("2GvjJ");

		assertValue("#1-1", "foo\nbar baz\nbax");
		assertEquals("#1-4", "vjJ", Wasavi.getLastSimpleCommand());
		testMark("<", 1, 0);
		testMark(">", 1, 4);

		Wasavi.send("u1GvJ");
		assertValue("#2-1", "foo bar\nbaz\nbax");
		assertEquals("#2-4", "vJ", Wasavi.getLastSimpleCommand());
		testMark("<", 0, 0);
		testMark(">", 0, 0);
	}

	@Test
	public void pasteIntoBound () {
		_pasteIntoBound("p");
	}

	@Test
	public void pasteIntoBoundP () {
		_pasteIntoBound("P");
	}

	@Test
	public void pasteIntoBoundLinewise () {
		_pasteLinewiseDataIntoBound("p");
	}

	@Test
	public void pasteIntoBoundLinewiseP () {
		_pasteLinewiseDataIntoBound("P");
	}

	@Test
	public void fillUpBound () {
		Wasavi.send("ifoo bar\nbaz bax\nqux quux\u001b");
		Wasavi.send("2G2|vj$2hrX");

		assertValue("#1-1", "foo bar\nbXXXXXX\nXXXXXXux");
		assertEquals("#1-4", "vj$2hrX", Wasavi.getLastSimpleCommand());
		testMark("<", 1, 1);
		testMark(">", 2, 5);
	}

	@Test
	public void upperCaseBound () {
		Wasavi.send("ifoo bar\nbaz Bax\nqux quux\u001b");
		Wasavi.send("2G2|vj$2hU");

		assertValue("#1-1", "foo bar\nbAZ BAX\nQUX QUux");
		assertEquals("#1-4", "vj$2hU", Wasavi.getLastSimpleCommand());
		testMark("<", 1, 1);
		testMark(">", 2, 5);
	}

	@Test
	public void lowerCaseBound () {
		Wasavi.send("iFOO BAR\nBAZ bAX\nQUX QUUX\u001b");
		Wasavi.send("2G2|vj$2hu");

		assertValue("#1-1", "FOO BAR\nBaz bax\nqux quUX");
		assertEquals("#1-4", "vj$2hu", Wasavi.getLastSimpleCommand());
		testMark("<", 1, 1);
		testMark(">", 2, 5);
	}

	/* bound line mode */

	private void _changeLineBound (String command) {
		Wasavi.send("ifoobar\nbazbax\nquuquux\u001b");
		Wasavi.send("1G3|Vj4|" + command + "XYZ\u001b");

		assertValue("#1-1", "XYZ\nquuquux");
		assertEquals("#1-2", "foobar\nbazbax\n", Wasavi.getRegister("\""));
		assertEquals("#1-3", "XYZ", Wasavi.getRegister("."));
		assertEquals("#1-4", "Vj4|" + command + "XYZ\u001b", Wasavi.getLastSimpleCommand());

		assertNull("#2-1", Wasavi.getMark("<"));
		assertNull("#2-2", Wasavi.getMark(">"));
	}

	private void _deleteLineBound (String command) {
		Wasavi.send("ifoobar\nbazbax\nquxquux\u001b");
		Wasavi.send("1G3|Vj4|" + command);

		assertValue("#1-1", "quxquux");
		assertEquals("#1-2", "foobar\nbazbax\n", Wasavi.getRegister("\""));
		assertEquals("#1-4", "Vj4|" + command, Wasavi.getLastSimpleCommand());

		assertNull("#2-1", Wasavi.getMark("<"));
		assertNull("#2-2", Wasavi.getMark(">"));
	}

	private void _yankLineBound (String command) {
		Wasavi.send("ifoo bar\nbaz bax\nqux quux\u001b");
		Wasavi.send("1G^wV2w\"a" + command);

		assertValue("#1-1", "foo bar\nbaz bax\nqux quux");
		assertEquals("#1-2", "foo bar\nbaz bax\n", Wasavi.getRegister("a"));
		assertEquals("#1-4", "V2w\"a" + command, Wasavi.getLastSimpleCommand());
		testMark("<", 0, 4);
		testMark(">", 1, 4);
	}

	private void _pasteIntoLineBound (String command) {
		Wasavi.send("ifoo\nbr\nbaz\nbax\u001b");

		Wasavi.send("1Gyw2G0Ve" + command);
		assertValue("#1-1", "foo\nfoo\nbaz\nbax");
		assertEquals("#1-2", "br\n", Wasavi.getRegister("\""));
		assertEquals("#1-4", "Ve" + command, Wasavi.getLastSimpleCommand());
		testMark("<", 1, 0);
		testMark(">", 1, 3);

		Wasavi.send("G0Ve" + command);
		assertValue("#2-1", "foo\nfoo\nbaz\nbr");
	}

	private void _pasteLinewiseDataIntoLineBound (String command) {
		Wasavi.send("ifoo\nbar\nbaz\nbax\u001b");

		Wasavi.send("1Gy2y3G0Ve" + command);
		assertValue("#1-1", "foo\nbar\nfoo\nbar\nbax");
		assertEquals("#1-2", "baz\n", Wasavi.getRegister("\""));
		assertEquals("#1-4", "Ve" + command, Wasavi.getLastSimpleCommand());
		testMark("<", 2, 0);
		testMark(">", 4, 0);
	}

	@Test
	public void changeLineBound () {
		_changeLineBound("c");
	}

	@Test
	public void changeLineBounds () {
		_changeLineBound("s");
	}

	@Test
	public void changeLineBoundLinewise () {
		_changeLineBound("C");
	}

	@Test
	public void changeLineBoundLinewiseS () {
		_changeLineBound("S");
	}

	@Test
	public void changeLineBoundLinewiseR () {
		_changeLineBound("R");
	}

	@Test
	public void deleteLineBound () {
		_deleteLineBound("d");
	}

	@Test
	public void deleteLineBoundx () {
		_deleteLineBound("x");
	}

	@Test
	public void deleteLineBoundD () {
		_deleteLineBound("D");
	}

	@Test
	public void deleteLineBoundX () {
		_deleteLineBound("X");
	}

	@Test
	public void yankLineBound () {
		_yankLineBound("y");
	}

	@Test
	public void yankLineBoundY () {
		_yankLineBound("Y");
	}

	@Test
	public void shiftLineBound () {
		Wasavi.send("ifoo bar\nbaz bax\nqux quux\u001b");
		Wasavi.send("1G^wV2e>");

		assertValue("#1-1", "    foo bar\n    baz bax\nqux quux");
		assertEquals("#1-4", "V2e>", Wasavi.getLastSimpleCommand());
		testMark("<", 0, 8);
		testMark(">", 1, 6);
	}

	@Test
	public void unshiftLineBound () {
		Wasavi.send(":set noai\ni\tfoo bar\n    baz bax\nqux quux\u001b");
		Wasavi.send("2G^Vb<");

		assertValue("#1-1", "    foo bar\nbaz bax\nqux quux");
		assertEquals("#1-4", "Vb<", Wasavi.getLastSimpleCommand());
		testMark("<", 0, 8);
		testMark(">", 1, 0);
	}

	@Test
	public void restoreLineBound () {
		Wasavi.send("ifoo bar\nbaz bax\nqux quux\u001b");
		Wasavi.send("1G^wV2wl\u001b");

		testMark("<", 0, 4);
		testMark(">", 1, 5);

		Wasavi.send("gvy");
		assertValue("#1-1", "foo bar\nbaz bax\nqux quux");
		assertEquals("#1-2", "foo bar\nbaz bax\n", Wasavi.getRegister("\""));
		assertEquals("#1-4", "gvy", Wasavi.getLastSimpleCommand());
	}

	@Test
	public void rangeSymbolLineBound () {
		Wasavi.send("ifoo bar\nbaz bax\nqux quux\u001b");
		Wasavi.send("1G6|Viwy");

		assertValue("#1-1", "foo bar\nbaz bax\nqux quux");
		assertEquals("#1-2", "foo bar\n", Wasavi.getRegister("\""));
		assertEquals("#1-4", "Viwy", Wasavi.getLastSimpleCommand());
		testMark("<", 0, 4);
		testMark(">", 0, 6);
	}

	@Test
	public void swapCaseInLineBound () {
		Wasavi.send("ifoo BAR\nBAZ bax\nqux quux\u001b");
		Wasavi.send("1G^2|Vj$h~");

		assertValue("#1-1", "FOO bar\nbaz BAX\nqux quux");
		assertEquals("#1-4", "Vj$h~", Wasavi.getLastSimpleCommand());
		testMark("<", 0, 1);
		testMark(">", 1, 5);
	}

	@Test
	public void switchLineBoundToLineInput () {
		Wasavi.send("i1 first\n2 second\n3\n4\n5\u001b");
		Wasavi.send("1G^ffVj$:p\n");

		assertEquals("#1-1", "1 first\n2 second", Wasavi.getLastMessage());
	}

	@Test
	public void joinLineBound () {
		Wasavi.send("ifoo\nbar\nbaz\nbax\u001b");
		Wasavi.send("2GVjJ");

		assertValue("#1-1", "foo\nbar baz\nbax");
		assertEquals("#1-4", "VjJ", Wasavi.getLastSimpleCommand());
		testMark("<", 1, 0);
		testMark(">", 1, 4);

		Wasavi.send("u1GVJ");
		assertValue("#2-1", "foo bar\nbaz\nbax");
		assertEquals("#2-4", "VJ", Wasavi.getLastSimpleCommand());
		testMark("<", 0, 0);
		testMark(">", 0, 0);
	}

	@Test
	public void pasteIntoLineBound () {
		_pasteIntoLineBound("p");
	}

	@Test
	public void pasteIntoLineBoundP () {
		_pasteIntoLineBound("P");
	}
}

/* vim:set ts=4 sw=4 fileencoding=UTF-8 fileformat=unix filetype=java : */
