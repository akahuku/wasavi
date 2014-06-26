package WasaviTest;

import static WasaviTest.WasaviAsserts.*;
import static WasaviTest.WasaviUtils.*;

import org.junit.*;
import static org.junit.Assert.*;

import org.openqa.selenium.By;
import org.openqa.selenium.Keys;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;

public class UndoTest extends WasaviTest {
	@Test
	public void testInsert () {
		Wasavi.send("afoo\u001b");
		assertValue("#1-1", "foo");

		Wasavi.send("a\nbar\u001b");
		assertValue("#2-1", "foo\nbar");

		Wasavi.send("u");
		assertValue("#3-1", "foo");

		Wasavi.send("u");
		assertValue("#4-1", "");

		Wasavi.send("u");
		assertValue("#5-1", "");
		assertTrue("#5-2", Wasavi.getLastMessage().length() > 0);

		Wasavi.send("\u0012");
		assertValue("#6-1", "foo");

		Wasavi.send("\u0012");
		assertValue("#7-1", "foo\nbar");

		Wasavi.send("\u0012");
		assertValue("#7-1", "foo\nbar");
		assertTrue("#7-2", Wasavi.getLastMessage().length() > 0);
	}

	@Test
	public void testInsertMultiLine () {
		Wasavi.send("aa\nb\nc\n\u001b");
		assertEquals("#1", "normal", Wasavi.getState());
		assertEquals("#2", "command", Wasavi.getInputMode());

		Wasavi.send("u");
		assertEquals("#3", "1 operation have reverted.", Wasavi.getLastMessage());
		assertValue("#4", "");

		Wasavi.send("\u0012");
		assertEquals("#5", "1 operation have executed again.", Wasavi.getLastMessage());
		assertValue("#6", "a\nb\nc\n");
	}

	@Test
	public void testInsertToIsolatedPosition () {
		Wasavi.send("ifoobarbaz\u001b");

		Wasavi.setInputModeOfWatchTarget("edit");
		Wasavi.send("4|iFOO", 
			Keys.ARROW_RIGHT,
			Keys.ARROW_RIGHT,
			Keys.ARROW_RIGHT,
			"BAR\nBAZ");
		Wasavi.send("\u001b");
		assertValue("#1-1", "fooFOObarBAR\nBAZbaz");

		Wasavi.send("u");
		assertValue("#2-1", "fooFOObarbaz");

		Wasavi.send("u");
		assertValue("#3-1", "foobarbaz");

		Wasavi.send("u");
		assertValue("#4-1", "");

		Wasavi.send("u");
		assertValue("#5-1", "");
		assertTrue("#5-2", Wasavi.getLastMessage().length() > 0);

		Wasavi.send("\u0012");
		assertValue("#6-1", "foobarbaz");

		Wasavi.send("\u0012");
		assertValue("#7-1", "fooFOObarbaz");

		Wasavi.send("\u0012");
		assertValue("#8-1", "fooFOObarBAR\nBAZbaz");

		Wasavi.send("\u0012");
		assertValue("#8-1", "fooFOObarBAR\nBAZbaz");
		assertTrue("#8-2", Wasavi.getLastMessage().length() > 0);
	}

	@Test
	public void testOverwrite () {
		Wasavi.send("Rfoo\u001b");
		assertValue("#1-1", "foo");

		Wasavi.send("0Rbarbaz\u001b");
		assertValue("#2-1", "barbaz");

		Wasavi.send("u");
		assertValue("#3-1", "foo");

		Wasavi.send("u");
		assertValue("#4-1", "");

		Wasavi.send("u");
		assertValue("#5-1", "");
		assertTrue("#5-2", Wasavi.getLastMessage().length() > 0);

		Wasavi.send("\u0012");
		assertValue("#6-1", "foo");

		Wasavi.send("\u0012");
		assertValue("#7-1", "barbaz");
	}

	@Test
	public void testOverwriteToIsolatedPosition () {
		Wasavi.send("ifoobarbaz\u001b");

		Wasavi.setInputModeOfWatchTarget("overwrite");
		Wasavi.send("1|RFOO", 
			Keys.ARROW_RIGHT,
			Keys.ARROW_RIGHT,
			Keys.ARROW_RIGHT,
			"B\nAR");
		Wasavi.send("\u001b");
		assertValue("#1-1", "FOObarB\nAR");

		Wasavi.send("u");
		assertValue("#2-1", "FOObarbaz");

		Wasavi.send("u");
		assertValue("#3-1", "foobarbaz");

		Wasavi.send("u");
		assertValue("#4-1", "");

		Wasavi.send("u");
		assertValue("#5-1", "");
		assertTrue("#5-2", Wasavi.getLastMessage().length() > 0);

		Wasavi.send("\u0012");
		assertValue("#6-1", "foobarbaz");

		Wasavi.send("\u0012");
		assertValue("#7-1", "FOObarbaz");

		Wasavi.send("\u0012");
		assertValue("#8-1", "FOObarB\nAR");

		Wasavi.send("\u0012");
		assertValue("#8-1", "FOObarB\nAR");
		assertTrue("#8-2", Wasavi.getLastMessage().length() > 0);
	}

	@Test
	public void testOpenForwardToMiddleOfText () {
		Wasavi.send("afoo\nbar\u001bgg");
		assertValue("#1-1", "foo\nbar");

		Wasavi.send("obaz\u001b");
		assertValue("#2-1", "foo\nbaz\nbar");

		Wasavi.send("u");
		assertValue("#3-1", "foo\nbar");

		Wasavi.send("u");
		assertValue("#4-1", "");

		Wasavi.send("\u0012");
		assertValue("#5-1", "foo\nbar");

		Wasavi.send("\u0012");
		assertValue("#6-1", "foo\nbaz\nbar");
	}

	@Test
	public void testOpenForwardToTailOfText () {
		Wasavi.send("ofoo\u001b");
		assertValue("#1-1", "\nfoo");

		Wasavi.send("u");
		assertValue("#2-1", "");

		Wasavi.send("\u0012");
		assertValue("#3-1", "\nfoo");
	}

	@Test
	public void testOpenCurrentToMiddleOfText () {
		Wasavi.send("afoo\nbar\u001b");
		assertValue("#1-1", "foo\nbar");

		Wasavi.send("Obaz\u001b");
		assertValue("#2-1", "foo\nbaz\nbar");

		Wasavi.send("u");
		assertValue("#3-1", "foo\nbar");

		Wasavi.send("u");
		assertValue("#4-1", "");

		Wasavi.send("\u0012");
		assertValue("#5-1", "foo\nbar");

		Wasavi.send("\u0012");
		assertValue("#6-1", "foo\nbaz\nbar");
	}

	@Test
	public void testOpenCurrentToTopOfText () {
		Wasavi.send("Ofoo\u001b");
		assertValue("#1-1", "foo\n");

		Wasavi.send("u");
		assertValue("#2-1", "");

		Wasavi.send("\u0012");
		assertValue("#3-1", "foo\n");
	}

	@Test
	public void testDeleteCharsForward () {
		Wasavi.send("ifoobar\u001b");
		Wasavi.send("03x");
		assertValue("#1-1", "bar");

		Wasavi.send("u");
		assertValue("#2-1", "foobar");

		Wasavi.send("\u0012");
		assertValue("#3-1", "bar");
	}

	@Test
	public void testDeleteCharsBackward () {
		Wasavi.send("ifoobar\u001b");
		Wasavi.send("3X");
		assertValue("#1-1", "for");

		Wasavi.send("u");
		assertValue("#2-1", "foobar");

		Wasavi.send("\u0012");
		assertValue("#3-1", "for");
	}

	@Test
	public void testDeleteLine () {
		Wasavi.send("i1\n2\u001b");

		Wasavi.send("gg", "dd");
		assertValue("#1-1", "2");

		Wasavi.send("u");
		assertValue("#2-1", "1\n2");

		Wasavi.send("\u0012");
		assertValue("#3-1", "2");
	}

	@Test
	public void testDeleteLines () {
		Wasavi.send("i1\n2\n3\u001b");

		Wasavi.send("gg", "d2d");
		assertValue("#1-1", "3");

		Wasavi.send("u");
		assertValue("#2-1", "1\n2\n3");

		Wasavi.send("\u0012");
		assertValue("#3-1", "3");
	}

	@Test
	public void testDeleteLineLast () {
		Wasavi.send("i1\u001b");

		Wasavi.send("gg", "dd");
		assertValue("#1-1", "");

		Wasavi.send("u");
		assertValue("#2-1", "1");

		Wasavi.send("\u0012");
		assertValue("#3-1", "");
	}

	@Test
	public void testDeleteLinesLast () {
		Wasavi.send("i1\n2\n3\u001b");

		Wasavi.send("2G", "d2d");
		assertValue("#1-1", "1");

		Wasavi.send("u");
		assertValue("#2-1", "1\n2\n3");

		Wasavi.send("\u0012");
		assertValue("#3-1", "1");
	}

	@Test
	public void testDeleteLineWithMark () {
		Wasavi.send("i1\n2\n3\u001b");

		Wasavi.send("2G", "madd");
		assertValue("#1-1", "1\n3");

		Wasavi.send("1G", "`a");
		assertNull("#2-1", Wasavi.getMark("a"));
		assertPos("#2-2", 0, 0);

		Wasavi.send("u");
		assertValue("#3-1", "1\n2\n3");
		Wasavi.send("1G", "`a");
		assertNotNull("#3-2", Wasavi.getMark("a"));
		assertPos("#3-3", 1, 0);
	}

	@Test
	public void testChange () {
		Wasavi.send("i1\n2\n3\u001b");

		Wasavi.send("2G", "ccfoo\nbar\u001b");
		assertValue("#1-1", "1\nfoo\nbar\n3");

		Wasavi.send("u");
		assertValue("#2-1", "1\n2\n3");

		Wasavi.send("\u0012");
		assertValue("#3-1", "1\nfoo\nbar\n3");
	}

	@Test
	public void testChangeLast () {
		Wasavi.send("i1\n2\n3\u001b");

		Wasavi.send("3G", "ccfoo\nbar\u001b");
		assertValue("#1-1", "1\n2\nfoo\nbar");

		Wasavi.send("u");
		assertValue("#2-1", "1\n2\n3");

		Wasavi.send("\u0012");
		assertValue("#3-1", "1\n2\nfoo\nbar");
	}

	@Test
	public void testSubst () {
		Wasavi.send("ifoo\nbar\u001b");

		Wasavi.send("1G", "0sbaz\n\u001b");
		assertValue("#1-1", "baz\noo\nbar");

		Wasavi.send("u");
		assertValue("#2-1", "foo\nbar");

		Wasavi.send("\u0012");
		assertValue("#3-1", "baz\noo\nbar");
	}

	@Test
	public void testShift () {
		Wasavi.send("i1\n2\n3\u001b");
		Wasavi.send(":set sw=8\n");

		Wasavi.send("1G", "2>>");
		assertValue("#1-1", "\t1\n\t2\n3");

		Wasavi.send("u");
		assertValue("#2-1", "1\n2\n3");

		Wasavi.send("\u0012");
		assertValue("#3-1", "\t1\n\t2\n3");
	}

	@Test
	public void testUnshift () {
		Wasavi.send(":set noai\n");
		Wasavi.send("i1\n\t2\n\t3\u001b");
		Wasavi.send(":set sw=8\n");

		Wasavi.send("1G", "3<<");
		assertValue("#1-1", "1\n2\n3");

		Wasavi.send("u");
		assertValue("#2-1", "1\n\t2\n\t3");

		Wasavi.send("\u0012");
		assertValue("#3-1", "1\n2\n3");
	}

	@Test
	public void testPasteCharsForward () {
		Wasavi.send("ifoo\nbar\u001b");

		Wasavi.send("1G", "1|y3l");
		assertEquals("#1-1", "foo", Wasavi.getRegister("\""));
		Wasavi.send("1G", "1|p");
		assertValue("#1-2", "ffoooo\nbar");

		Wasavi.send("u");
		assertValue("#2-1", "foo\nbar");

		Wasavi.send("\u0012");
		assertValue("#3-1", "ffoooo\nbar");
	}

	@Test
	public void testPasteCharsCurrent () {
		Wasavi.send("ifoo\nbar\u001b");

		Wasavi.send("1G", "1|y3l");
		Wasavi.send("1G", "1|P");
		assertValue("#1-1", "foofoo\nbar");

		Wasavi.send("u");
		assertValue("#2-1", "foo\nbar");

		Wasavi.send("\u0012");
		assertValue("#3-1", "foofoo\nbar");
	}

	@Test
	public void testPasteCharsForwardToTailOfBuffer () {
		Wasavi.send("ifoo\nbar\u001b");

		Wasavi.send("1G", "1|y3l");
		Wasavi.send("2G", "$p");
		assertValue("#1-1", "foo\nbarfoo");

		Wasavi.send("u");
		assertValue("#2-1", "foo\nbar");

		Wasavi.send("\u0012");
		assertValue("#3-1", "foo\nbarfoo");
	}

	@Test
	public void testPasteCharsCurrentToTailOfBuffer () {
		Wasavi.send("ifoo\nbar\u001b");

		Wasavi.send("1G", "1|y3l");
		Wasavi.send("2G", "$P");
		assertValue("#1-1", "foo\nbafoor");

		Wasavi.send("u");
		assertValue("#2-1", "foo\nbar");

		Wasavi.send("\u0012");
		assertValue("#3-1", "foo\nbafoor");
	}

	@Test
	public void testPasteLineForward () {
		Wasavi.send("ifoo\nbar\u001b");

		Wasavi.send("1G", "yy");
		Wasavi.send("1G", "p");
		assertValue("#1-1", "foo\nfoo\nbar");

		Wasavi.send("u");
		assertValue("#2-1", "foo\nbar");

		Wasavi.send("\u0012");
		assertValue("#3-1", "foo\nfoo\nbar");

		Wasavi.send("G", "yy");
		Wasavi.send("1G", "p");
		assertValue("#4-1", "foo\nbar\nfoo\nbar");

		Wasavi.send("u");
		assertValue("#5-1", "foo\nfoo\nbar");

		Wasavi.send("\u0012");
		assertValue("#6-1", "foo\nbar\nfoo\nbar");
	}

	@Test
	public void testPasteLineCurrent () {
		Wasavi.send("ifoo\nbar\u001b");

		Wasavi.send("1G", "yy");
		Wasavi.send("1G", "P");
		assertValue("#1-1", "foo\nfoo\nbar");

		Wasavi.send("u");
		assertValue("#2-1", "foo\nbar");

		Wasavi.send("\u0012");
		assertValue("#3-1", "foo\nfoo\nbar");

		Wasavi.send("G", "yy");
		Wasavi.send("1G", "P");
		assertValue("#4-1", "bar\nfoo\nfoo\nbar");

		Wasavi.send("u");
		assertValue("#5-1", "foo\nfoo\nbar");

		Wasavi.send("\u0012");
		assertValue("#4-1", "bar\nfoo\nfoo\nbar");
	}

	@Test
	public void testPasteLineForwardToTailOfBuffer () {
		Wasavi.send("ifoo\nbar\u001b");

		Wasavi.send("1G", "yy");
		Wasavi.send("2G", "p");
		assertValue("#1-1", "foo\nbar\nfoo");

		Wasavi.send("u");
		assertValue("#2-1", "foo\nbar");

		Wasavi.send("\u0012");
		assertValue("#3-1", "foo\nbar\nfoo");
	}

	@Test
	public void testToggleCase () {
		Wasavi.send("ifoo12#$bar\u001b");

		Wasavi.send("1|~");
		assertValue("#1-1", "Foo12#$bar");
		assertPos("#1-2", 0, 1);
		Wasavi.send("u");
		assertValue("#1-3", "foo12#$bar");
		Wasavi.send("\u0012");
		assertValue("#1-4", "Foo12#$bar");

		Wasavi.send("2|2~");
		assertValue("#2-1", "FOO12#$bar");
		assertPos("#2-2", 0, 3);
		Wasavi.send("u");
		assertValue("#2-3", "Foo12#$bar");
		Wasavi.send("\u0012");
		assertValue("#2-4", "FOO12#$bar");

		Wasavi.send("1|10~");
		assertValue("#3-1", "foo12#$BAR");
		assertPos("#3-2", 0, 9);
		Wasavi.send("u");
		assertValue("#3-3", "FOO12#$bar");
		Wasavi.send("\u0012");
		assertValue("#3-4", "foo12#$BAR");
	}

	@Test
	public void join () {
		Wasavi.send("ifoo\nbar\u001b");

		Wasavi.send("1GJ");
		assertValue("#1-1", "foo bar");
		assertPos("#1-2", 0, 3);
		Wasavi.send("u");
		assertValue("#1-3", "foo\nbar");
		Wasavi.send("\u0012");
		assertValue("#1-4", "foo bar");
	}
}

/* vim:set ts=4 sw=4 fileencoding=UTF-8 fileformat=unix filetype=java : */
