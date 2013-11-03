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
		//assertEquals("#1-3", "XYZ", Wasavi.getRegister("."));
		assertEquals("#1-4", "vj4|" + command, Wasavi.getLastSimpleCommand());
		testMark("<", 0, 2);
		testMark(">", 0, 2);
	}

	private void _deleteBoundLinewise (String command) {
		Wasavi.send("ifoobar\nbazbax\nquxquux\u001b");
		Wasavi.send("1G3|vj4|" + command);

		assertValue("#1-1", "quxquux");
		assertEquals("#1-2", "foobar\nbazbax\n", Wasavi.getRegister("\""));
		//assertEquals("#1-3", "XYZ", Wasavi.getRegister("."));
		assertEquals("#1-4", "vj4|" + command, Wasavi.getLastSimpleCommand());
		assertNull("#2-1", Wasavi.getMark("<"));
		assertNull("#2-2", Wasavi.getMark(">"));
	}

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
	public void changeBound () {
		_changeBound("c");
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
		//assertEquals("#1-3", "XYZ", Wasavi.getRegister("."));
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
		//assertEquals("#1-3", "XYZ", Wasavi.getRegister("."));
		assertEquals("#1-4", "v2w\"aY", Wasavi.getLastSimpleCommand());
		testMark("<", 0, 4);
		testMark(">", 1, 4);
	}

	@Test
	public void shiftBound () {
		Wasavi.send("ifoo bar\nbaz bax\nqux quux\u001b");
		Wasavi.send("1G^wv2e>");

		assertValue("#1-1", "    foo bar\n    baz bax\nqux quux");
		testMark("<", 0, 8);
		testMark(">", 1, 6);
	}

	@Test
	public void unshiftBound () {
		Wasavi.send(":set noai\ni\tfoo bar\n    baz bax\nqux quux\u001b");
		Wasavi.send("2G^vb<");

		assertValue("#1-1", "    foo bar\nbaz bax\nqux quux");
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
		Wasavi.send("ifoo\nbr\nbaz\nbax\u001b");

		Wasavi.send("1Gyw2G0vep");
		assertValue("#1-1", "foo\nfoo\nbaz\nbax");
		testMark("<", 1, 0);
		testMark(">", 1, 3);

		Wasavi.send("G0vep");
		assertValue("#1-2", "foo\nfoo\nbaz\nfoo");
	}
}

/* vim:set ts=4 sw=4 fileencoding=UTF-8 fileformat=unix filetype=java : */
