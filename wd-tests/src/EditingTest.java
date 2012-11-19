package WasaviTest;

import static WasaviTest.WasaviAsserts.*;
import static WasaviTest.WasaviUtils.*;

import org.junit.*;
import static org.junit.Assert.*;

import org.openqa.selenium.By;
import org.openqa.selenium.Keys;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;

public class EditingTest extends WasaviTest {
	private void _testDeleteRightChar (CharSequence a) {
		Wasavi.send("ifoobar\u001b");
		Wasavi.send("3|");

		Wasavi.send(a);
		assertEquals("#1", "fobar", Wasavi.getValue());
		assertEquals("#1-1", "o", Wasavi.getRegister("\""));
		assertPos("#2", 0, 2);

		Wasavi.send("2", a);
		assertEquals("#3", "for", Wasavi.getValue());
		assertEquals("#3-1", "ba", Wasavi.getRegister("\""));
		assertPos("#3", 0, 2);

		Wasavi.send("d", a);
		assertTrue("#4", Wasavi.getLastMessage().length() > 0);
		assertPos("#4-1", 0, 2);
		assertValue("#4-2", "for");
	}

	@Test
	public void testDeleteRightChar () {
		_testDeleteRightChar("x");
	}

	@Test
	public void testDeleteRightCharDelete () {
		_testDeleteRightChar(Keys.DELETE);
	}

	@Test
	public void testDeleteLeftChar () {
		Wasavi.send("ifoobar\u001b");
		Wasavi.send("5|");

		Wasavi.send("X");
		assertEquals("#1", "fooar", Wasavi.getValue());
		assertEquals("#1-1", "b", Wasavi.getRegister("\""));
		assertPos("#2", 0, 3);

		Wasavi.send("2X");
		assertEquals("#3", "far", Wasavi.getValue());
		assertEquals("#1-1", "oo", Wasavi.getRegister("\""));
		assertPos("#3", 0, 1);

		Wasavi.send("dX");
		assertTrue("#4", Wasavi.getLastMessage().length() > 0);
		assertPos("#4-1", 0, 1);
		assertValue("#4-2", "far");

		Wasavi.send("1|X");
		assertPos("#5", 0, 0);
		assertValue("#5-1", "far");
	}

	@Test
	public void testPasteCharsForward () {
		Wasavi.send("ifoobar\nfoobar\u001b");

		Wasavi.send("1G", "1|y3lp");
		assertEquals("ffoooobar\nfoobar", Wasavi.getValue());

		Wasavi.send("2G", "1|y3l2p");
		assertEquals("ffoooobar\nffoofoooobar", Wasavi.getValue());

		Wasavi.send("dp");
		assertTrue(Wasavi.getLastMessage().length() > 0);
	}

	@Test
	public void testPasteLinesForward () {
		Wasavi.send("ifoo\nbar\u001b");

		Wasavi.send("1G", "1|yyp");
		assertEquals("#1", "foo\nfoo\nbar", Wasavi.getValue());
		assertPos("#2", 1, 0);

		Wasavi.send("2p");
		assertEquals("#3", "foo\nfoo\nfoo\nfoo\nbar", Wasavi.getValue());
		assertPos("#4", 2, 0);

		Wasavi.send("G", "p");
		assertEquals("#5", "foo\nfoo\nfoo\nfoo\nbar\nfoo", Wasavi.getValue());
		assertPos("#6", 5, 0);

		Wasavi.send("G", "2p");
		assertEquals("#7", "foo\nfoo\nfoo\nfoo\nbar\nfoo\nfoo\nfoo", Wasavi.getValue());
		assertPos("#8", 6, 0);
	}

	@Test
	public void testPasteCharsCurrent () {
		Wasavi.send("ifoobar\nfoobar\u001b");

		Wasavi.send("1G", "1|y3lP");
		assertEquals("foofoobar\nfoobar", Wasavi.getValue());

		Wasavi.send("2G", "1|y3l2P");
		assertEquals("foofoobar\nfoofoofoobar", Wasavi.getValue());

		Wasavi.send("dP");
		assertTrue(Wasavi.getLastMessage().length() > 0);
	}

	@Test
	public void testPasteLinesCurrent () {
		Wasavi.send("ifoo\nbar\u001b");

		Wasavi.send("1G", "1|yyP");
		assertEquals("#1", "foo\nfoo\nbar", Wasavi.getValue());
		assertPos("#2", 0, 0);

		Wasavi.send("2P");
		assertEquals("#3", "foo\nfoo\nfoo\nfoo\nbar", Wasavi.getValue());
		assertPos("#4", 0, 0);

		Wasavi.send("G", "P");
		assertEquals("#5", "foo\nfoo\nfoo\nfoo\nfoo\nbar", Wasavi.getValue());
		assertPos("#6", 4, 0);

		Wasavi.send("G", "2P");
		assertEquals("#7", "foo\nfoo\nfoo\nfoo\nfoo\nfoo\nfoo\nbar", Wasavi.getValue());
		assertPos("#8", 5, 0);
	}

	@Test
	public void testPasteFromClipboard () {
		setClipboardText("clipboard text");
		Wasavi.send("\"*P");
		assertEquals("#1", "clipboard text", Wasavi.getValue());
	}

	@Test
	public void testJoin () {
		Wasavi.send("ifirst\nsecond\u001b");
		Wasavi.send("1G", "1|J");
		assertPos("#1-1", 0, 5);
		assertEquals("#1-2", "first second", Wasavi.getValue());

		Wasavi.send("1G", "dG", "ifirst\n\tsecond\u001b");
		Wasavi.send("1G", "1|J");
		assertPos("#2-1", 0, 5);
		assertEquals("#2-2", "first second", Wasavi.getValue());

		Wasavi.send("1G", "dG", "ifirst   \n\tsecond\u001b");
		Wasavi.send("1G", "1|J");
		assertPos("#3-1", 0, 8);
		assertEquals("#3-2", "first   second", Wasavi.getValue());

		Wasavi.send("1G", "dG", "i(first\n) second\u001b");
		Wasavi.send("1G", "1|J");
		assertPos("#4-1", 0, 6);
		assertEquals("#4-2", "(first) second", Wasavi.getValue());

		Wasavi.send("1G", "dG", "ifirst.\nsecond\u001b");
		Wasavi.send("1G", "1|J");
		assertPos("#5-1", 0, 6);
		assertEquals("#5-2", "first.  second", Wasavi.getValue());
	}

	// repeat command tests.
	// repeat command is affected by the commands below:
	//   !, <, >, A, C, D, I, J, O, P, R, S, X, Y,
	//            a, c, d, i,    o, p, r, s, x, y, ~

	@Test
	public void testRepetitionShiftLeft () {
		Wasavi.send(":set sw=8 noai\n");
		Wasavi.send("i\t\t\t\t\tfoo\n\tbar\u001b", "1G");

		Wasavi.send("<<");

		Wasavi.send(".");
		assertEquals("#1", "\t\t\tfoo\n\tbar", Wasavi.getValue());

		Wasavi.send("2.");
		assertEquals("#2", "\t\tfoo\nbar", Wasavi.getValue());
	}

	@Test
	public void testRepetitionShiftRight () {
		Wasavi.send(":set sw=8 noai\n");
		Wasavi.send("ifoo\nbar\u001b", "1G");

		Wasavi.send(">>");

		Wasavi.send(".");
		assertEquals("#1", "\t\tfoo\nbar", Wasavi.getValue());

		Wasavi.send("2.");
		assertEquals("#2", "\t\t\tfoo\n\tbar", Wasavi.getValue());
	}

	@Test
	public void testRepetitionAppendToLast () {
		Wasavi.send("ifoo\u001b", "gg");

		Wasavi.send("Abar\u001b");
		
		Wasavi.send("0.");
		assertEquals("#1", "foobarbar", Wasavi.getValue());

		Wasavi.send("02.");
		assertEquals("#2", "foobarbarbarbar", Wasavi.getValue());
	}

	@Test
	public void testRepetitionAppend () {
		Wasavi.send("ifoo\u001b", "gg");

		Wasavi.send("abar\u001b");
		
		Wasavi.send("0.");
		assertEquals("#1", "fbarbaroo", Wasavi.getValue());

		Wasavi.send("02.");
		assertEquals("#2", "fbarbarbarbaroo", Wasavi.getValue());
	}

	@Test
	public void testRepetitionChangeToLast () {
		Wasavi.send("ifoo\nbar\nbaz\nfoobar\u001b", "1G");

		Wasavi.send("CFOO\u001b");

		Wasavi.send("2G", ".");
		assertEquals("#1", "FOO\nFOO\nbaz\nfoobar", Wasavi.getValue());

		Wasavi.send("3G", "2.");
		assertEquals("#2", "FOO\nFOO\nFOO", Wasavi.getValue());
	}

	@Test
	public void testRepetitionChange () {
		Wasavi.send("ifoo\nbar\nfoobar\u001b", "1G");

		Wasavi.send("c2lFO\u001b");

		Wasavi.send("2G", ".");
		assertEquals("#1", "FOo\nFOr\nfoobar", Wasavi.getValue());

		Wasavi.send("3G", "3.");
		assertEquals("#2", "FOo\nFOr\nFObar", Wasavi.getValue());
	}

	@Test
	public void testRepetitionDeleteToLast () {
		Wasavi.send("ifoo\nbar\nbaz\nfoobar\u001b", "1G");

		Wasavi.send("D");

		Wasavi.send("2G", ".");
		assertEquals("#1", "\n\nbaz\nfoobar", Wasavi.getValue());

		Wasavi.send("3G", "2.");
		assertEquals("#2", "\n\n", Wasavi.getValue());
	}

	@Test
	public void testRepetiionDelete () {
		Wasavi.send("ifoo\nbar\nfoobar\u001b", "1G");

		Wasavi.send("d2l\u001b");

		Wasavi.send("2G", ".");
		assertEquals("#1", "o\nr\nfoobar", Wasavi.getValue());

		Wasavi.send("3G", "3.");
		assertEquals("#2", "o\nr\nbar", Wasavi.getValue());
	}

	@Test
	public void testRepetitionInsertFromTop () {
		Wasavi.send("ifoo\u001b");

		Wasavi.send("Ibar\u001b");

		Wasavi.send("$.");
		assertEquals("#1", "barbarfoo", Wasavi.getValue());

		Wasavi.send("$2.");
		assertEquals("#2", "barbarbarbarfoo", Wasavi.getValue());
	}

	@Test
	public void testRepetitionInsert () {
		Wasavi.send("ifoo\u001b");

		Wasavi.send("ibar\u001b");

		Wasavi.send(".");
		assertEquals("#1", "fobabarro", Wasavi.getValue());

		Wasavi.send("2.");
		assertEquals("#2", "fobababarbarrro", Wasavi.getValue());
	}

	@Test
	public void testRepetitionInsertWithControlChar () {
		Wasavi.send("ifoo\u001b");
		Wasavi.send(String.format("ibax%sr\u001b", Keys.BACK_SPACE));

		assertEquals("#1-1", "fobaro", Wasavi.getValue());
		assertEquals("#1-2", "bax\u0008r", Wasavi.getRegister("."));

		System.out.println("*** test #1 ***");
		Wasavi.send("u");
		assertEquals("#2-1", "foo", Wasavi.getValue());
		assertPos("#2-2", 0, 2);
		Wasavi.send("\u0012");
		assertEquals("#2-3", "fobaro", Wasavi.getValue());
		assertPos("#2-4", 0, 2);

		System.out.println("*** test #2 ***");
		Wasavi.send(".");
		assertEquals("#3-1", "fobarbaro", Wasavi.getValue());
		Wasavi.send("u");
		assertEquals("#3-2", "fobaro", Wasavi.getValue());
		assertPos("#3-3", 0, 2);
		Wasavi.send("\u0012");
		assertEquals("#3-4", "fobarbaro", Wasavi.getValue());
		assertPos("#3-5", 0, 2);

		System.out.println("*** test #3 ***");
		Wasavi.send("2.");
		assertEquals("#4-1", "fobarbarbarbaro", Wasavi.getValue());
		Wasavi.send("u");
		assertEquals("#4-2", "fobarbaro", Wasavi.getValue());
		assertPos("#4-3", 0, 2);
		Wasavi.send("\u0012");
		assertEquals("#4-4", "fobarbarbarbaro", Wasavi.getValue());
		assertPos("#4-5", 0, 2);
	}

	@Test
	public void testRepetitionInsertWithNewline () {
		Wasavi.send("ifoo\u001b");
		Wasavi.send("ibar\nbaz\u001b");
		assertEquals("#1-1", "fobar\nbazo", Wasavi.getValue());

		Wasavi.send("u");
		assertEquals("#2-1", "foo", Wasavi.getValue());
		assertPos("#2-2", 0, 2);
		Wasavi.send("\u0012");
		assertEquals("#2-3", "fobar\nbazo", Wasavi.getValue());
		assertPos("#2-4", 0, 2);

		Wasavi.send(".");
		assertEquals("#3-1", "fobar\nbazbar\nbazo", Wasavi.getValue());

	}

	@Test
	public void testRepetitionJoin () {
		Wasavi.send("ifirst\nsecond\nthird\nfourth\nfifth\u001b", "1G");

		Wasavi.send("J");

		Wasavi.send(".");
		assertEquals("#1", "first second third\nfourth\nfifth", Wasavi.getValue());

		Wasavi.send("2.");
		assertEquals("#2", "first second third fourth fifth", Wasavi.getValue());
	}

	@Test
	public void testRepetitionOpenLineCurrent () {
		Wasavi.send("Ofoo\u001b");

		Wasavi.send(".");
		assertEquals("#1", "foo\nfoo\n", Wasavi.getValue());

		Wasavi.send("2.");
		assertEquals("#2", "foo\nfoo\nfoo\nfoo\n", Wasavi.getValue());
	}

	@Test
	public void testRepetitionOpenLineAfter () {
		Wasavi.send("ofoo\u001b");

		Wasavi.send(".");
		assertEquals("#1", "\nfoo\nfoo", Wasavi.getValue());

		Wasavi.send("2.");
		assertEquals("#2", "\nfoo\nfoo\nfoo\nfoo", Wasavi.getValue());
	}

	@Test
	public void testRepetitionPasteCurrent () {
		Wasavi.send("ifoo\u001b", "ggyw");

		Wasavi.send("P");

		Wasavi.send(".");
		assertEquals("#1", "foofoofoo", Wasavi.getValue());

		Wasavi.send("2.");
		assertEquals("#2", "foofoofoofoofoo", Wasavi.getValue());
	}

	@Test
	public void testRepetitionPasteAfter () {
		Wasavi.send("i123\u001b", "ggyw");
		// 123
		// ^

		Wasavi.send("p");
		// 112323
		//    ^

		Wasavi.send("0.");
		assertEquals("#1-1", "112312323", Wasavi.getValue());
		assertPos("#1-2", 0, 3);
		// 112312323
		//    ^

		Wasavi.send("2.");
		assertEquals("#2-1", "112312312312323", Wasavi.getValue());
		assertPos("#2-2", 0, 9);
		// 112312312312323
		//          ^
	}

	@Test
	public void testRepetitionOverwrite () {
		Wasavi.send("ifirst\nsecond\nthird\nfourth\u001b", "gg");

		Wasavi.send("RFOO\u001b");

		Wasavi.send("2G", ".");
		assertEquals("#1", "FOOst\nFOOond\nthird\nfourth", Wasavi.getValue());

		Wasavi.send("3G", "2.");
		assertEquals("#2", "FOOst\nFOOond\nFOOFOO\nfourth", Wasavi.getValue());
	}

	@Test
	public void testRepetitionReplace () {
		Wasavi.send("ifoobar\u001b", "gg");

		Wasavi.send("rA");
		assertEquals("#1", "Aoobar", Wasavi.getValue());

		Wasavi.send("2|.");
		assertEquals("#2", "AAobar", Wasavi.getValue());

		Wasavi.send("4|2.");
		assertEquals("#3", "AAoAAr", Wasavi.getValue());
	}

	@Test
	public void testRepetitionSubstWholeLine () {
		Wasavi.send("ifirst\nsecond\nthird\nfourth\u001b", "gg");

		Wasavi.send("Cfoo\u001b");

		Wasavi.send("2G", ".");
		assertEquals("#1", "foo\nfoo\nthird\nfourth", Wasavi.getValue());

		Wasavi.send("3G", "2.");
		assertEquals("#2", "foo\nfoo\nfoo", Wasavi.getValue());
	}

	@Test
	public void testRepetitionSubstChar () {
		Wasavi.send("ifoobarbazbag\u001b", "gg");

		Wasavi.send("sBAZ\u001b");
		// BAZoobarbazbag

		Wasavi.send("6|.");
		assertEquals("#1", "BAZooBAZarbazbag", Wasavi.getValue());

		Wasavi.send("11|2.");
		assertEquals("#2", "BAZooBAZarBAZzbag", Wasavi.getValue());
	}

	@Test
	public void testRepetitionDeleteLeftChar () {
		Wasavi.send("ifoobar\u001b");

		Wasavi.send("X");

		Wasavi.send(".");
		assertEquals("#1", "foor", Wasavi.getValue());

		Wasavi.send("2.");
		assertEquals("#2", "fr", Wasavi.getValue());
	}

	@Test
	public void testRepetitionDeleteRightChar () {
		Wasavi.send("ifoobar\u001b", "gg");

		Wasavi.send("x");

		Wasavi.send(".");
		assertEquals("#1", "obar", Wasavi.getValue());

		Wasavi.send("2.");
		assertEquals("#2", "ar", Wasavi.getValue());
	}

	@Test
	public void testRepetitionYankLines () {
		Wasavi.send("ifirst\nsecond\nthird\nfourth\u001b", "gg");

		Wasavi.send("Y");

		Wasavi.send("2G", ".");
		assertEquals("#1", "second\n", Wasavi.getRegister("\""));

		Wasavi.send("3G", "2.");
		assertEquals("#2", "third\nfourth\n", Wasavi.getRegister("\""));
	}

	@Test
	public void testRepetitionYankChars () {
		Wasavi.send("ifirst\nsecond\nthird fourth\u001b", "gg");

		Wasavi.send("yw");

		Wasavi.send("2G", ".");
		assertEquals("#1", "second", Wasavi.getRegister("\""));

		Wasavi.send("3G", "2.");
		assertEquals("#2", "third fourth", Wasavi.getRegister("\""));
	}

	@Test
	public void testRepetitionToggleCase () {
		Wasavi.send("ifoobarbaz\u001b", "gg");

		Wasavi.send("~");

		Wasavi.send(".");
		assertEquals("#1", "FOobarbaz", Wasavi.getValue());

		Wasavi.send("2.");
		assertEquals("#2", "FOOBarbaz", Wasavi.getValue());
	}

	// undo, redo test is in another file.
	// function testUndo () {
	// }
	//
	// function testRedo () {
	// }

	@Test
	public void testToggleCase () {
		Wasavi.send("ifoobarbaz\u001b", "gg");

		Wasavi.send("~");
		assertEquals("#1-1", "Foobarbaz", Wasavi.getValue());
		assertPos("#1-2", 0, 1);

		Wasavi.send("3~");
		assertEquals("#2-1", "FOOBarbaz", Wasavi.getValue());
		assertPos("#2-2", 0, 4);

		Wasavi.send("7|10~");
		assertEquals("#3-1", "FOOBarBAZ", Wasavi.getValue());
		assertPos("#3-2", 0, 8);
	}

	@Test
	public void testFileInfo () {
		Wasavi.send("\u0007");
		assertTrue(Wasavi.getLastMessage().length() > 0);
	}

	@Test
	public void testMarkAndJumpCharwise () {
		Wasavi.send("iHi there. This is great.\u001b", "7|ma$mb");
		assertPos("#1", 0, 23);

		Wasavi.send("`a");
		assertPos("#2", 0, 6);

		Wasavi.send("`b");
		assertPos("#3", 0, 23);

		Wasavi.send("db0");
		assertEquals("#4", "Hi there. This is .", Wasavi.getValue());
		assertPos("#5", 0, 0);

		Wasavi.send("`b");
		assertPos("#6", 0, 18);
	}

	@Test
	public void testMarkAndJumpLinewise () {
		Wasavi.send("iFirst\nHi there.\n\tThis is great.\u001b");

		Wasavi.send("2G", "6|ma3G", "4|mbgg");

		assertEquals("#1", "First\nHi there.\n\tThis is great.", Wasavi.getValue());
		assertPos("#1", 0, 0);

		Wasavi.send("'a");
		assertPos("#2", 1, 0);

		Wasavi.send("'b");
		assertPos("#4", 2, 1);
	}

	@Test
	public void testExecuteRegisterContentAsViCommand () {
		Wasavi.send("ifirst\nsecond\nthird\nfourth\nk\u001b");

		Wasavi.send("yy0@\"");
		assertPos("#1", 3, 0);

		Wasavi.send("2@\"");
		assertPos("#2", 1, 0);

		Wasavi.send("@Z");
		assertTrue(Wasavi.getLastMessage().length() > 0);
	}

	@Test
	public void testReplace () {
		Wasavi.send("ifoobarbaz\u001b", "gg");

		Wasavi.send("rA");
		assertPos("#1-1", 0, 0);
		assertEquals("#1-2", "Aoobarbaz", Wasavi.getValue());

		Wasavi.send("3|r\n");
		assertPos("#2-1", 1, 0);
		assertEquals("#2-2", "Ao\nbarbaz", Wasavi.getValue());

		// TODO: ?
		//Wasavi.send("3|r\r");
		//assertPos("#3-1", 2, 0);
		//assertEquals("#3-2", "Ao\nba\nbaz", Wasavi.getValue());

		Wasavi.send("1G", "dG", "ifoobarbaz\u001b", "gg");

		Wasavi.send("2rA");
		assertPos("#4-1", 0, 1);
		assertEquals("#4-2", "AAobarbaz", Wasavi.getValue());

		Wasavi.send("4|3r\n");
		assertPos("#5-1", 1, 0);
		assertEquals("#5-2", "AAo\nbaz", Wasavi.getValue());

		Wasavi.send("100rX");
		assertPos("#6-1", 1, 0);
		assertTrue(Wasavi.getLastMessage().length() > 0);
	}

	@Test
	public void testAppend () {
		Wasavi.setInputModeOfWatchTarget("edit");
		Wasavi.send("afoobar");
		assertEquals("#1", "edit", Wasavi.getInputMode());

		Wasavi.send(Keys.ESCAPE);
		assertPos("#2-1", 0, 5);
		assertEquals("#2-2", "foobar", Wasavi.getValue());
		assertEquals("#2-3", "foobar", Wasavi.getRegister("."));

		Wasavi.send("3|aFOO\u001b");
		assertPos("#3-1", 0, 5);
		assertEquals("#3-2", "fooFOObar", Wasavi.getValue());
		assertEquals("#3-3", "FOO", Wasavi.getRegister("."));

		Wasavi.send("3aBAR\u001b");
		assertPos("#4-1", 0, 14);
		assertEquals("#4-2", "fooFOOBARBARBARbar", Wasavi.getValue());
		assertEquals("#4-3", "BAR", Wasavi.getRegister("."));
	}

	@Test
	public void testAppentToLast () {
		Wasavi.setInputModeOfWatchTarget("edit");
		Wasavi.send("Afoobar");
		assertEquals("#1", "edit", Wasavi.getInputMode());

		Wasavi.send(Keys.ESCAPE);
		assertPos("#2-1", 0, 5);
		assertEquals("#2-2", "foobar", Wasavi.getValue());
		assertEquals("#2-3", "foobar", Wasavi.getRegister("."));

		Wasavi.send("3|AFOO\u001b");
		assertPos("#3-1", 0, 8);
		assertEquals("#3-2", "foobarFOO", Wasavi.getValue());
		assertEquals("#3-3", "FOO", Wasavi.getRegister("."));

		Wasavi.send("3ABAR\u001b");
		assertPos("#4-1", 0, 17);
		assertEquals("#4-2", "foobarFOOBARBARBAR", Wasavi.getValue());
		assertEquals("#4-3", "BAR", Wasavi.getRegister("."));
	}

	@Test
	public void testInsert () {
		Wasavi.setInputModeOfWatchTarget("edit");
		Wasavi.send("ifoobar");
		assertEquals("#1", "edit", Wasavi.getInputMode());

		Wasavi.send(Keys.ESCAPE);
		assertPos("#2-1", 0, 5);
		assertEquals("#2-2", "foobar", Wasavi.getValue());
		assertEquals("#2-3", "foobar", Wasavi.getRegister("."));

		Wasavi.send("3|iFOO\u001b");
		assertPos("#3-1", 0, 4);
		assertEquals("#3-2", "foFOOobar", Wasavi.getValue());
		assertEquals("#3-3", "FOO", Wasavi.getRegister("."));

		Wasavi.send("3iBAR\u001b");
		assertPos("#4-1", 0, 12);
		assertEquals("#4-2", "foFOBARBARBAROobar", Wasavi.getValue());
		assertEquals("#4-3", "BAR", Wasavi.getRegister("."));
	}

	@Test
	public void testInsertToTop () {
		Wasavi.setInputModeOfWatchTarget("edit");
		Wasavi.send("Ifoobar");
		assertEquals("#1", "edit", Wasavi.getInputMode());

		Wasavi.send(Keys.ESCAPE);
		assertPos("#2-1", 0, 5);
		assertEquals("#2-2", "foobar", Wasavi.getValue());
		assertEquals("#2-3", "foobar", Wasavi.getRegister("."));

		Wasavi.send("3|IFOO\u001b");
		assertPos("#3-1", 0, 2);
		assertEquals("#3-2", "FOOfoobar", Wasavi.getValue());
		assertEquals("#3-3", "FOO", Wasavi.getRegister("."));

		Wasavi.send("3IBAR\u001b");
		assertPos("#4-1", 0, 8);
		assertEquals("#4-2", "BARBARBARFOOfoobar", Wasavi.getValue());
		assertEquals("#4-3", "BAR", Wasavi.getRegister("."));
	}

	@Test
	public void testInsertToTail () {
		Wasavi.setInputModeOfWatchTarget("edit");
		Wasavi.send("Afoobar");
		assertEquals("#1", "edit", Wasavi.getInputMode());

		Wasavi.send(Keys.ESCAPE);
		assertPos("#2-1", 0, 5);
		assertEquals("#2-2", "foobar", Wasavi.getValue());
		assertEquals("#2-3", "foobar", Wasavi.getRegister("."));

		Wasavi.send("0AFOO\u001b");
		assertPos("#3-1", 0, 8);
		assertEquals("#3-2", "foobarFOO", Wasavi.getValue());
		assertEquals("#3-3", "FOO", Wasavi.getRegister("."));

		Wasavi.send("03ABAR\u001b");
		assertPos("#4-1", 0, 17);
		assertEquals("#4-2", "foobarFOOBARBARBAR", Wasavi.getValue());
		assertEquals("#4-3", "BAR", Wasavi.getRegister("."));
	}

	@Test
	public void testInsertLiteral () {
		Wasavi.send(":set noai\n");

		// general control code: form-feed (shoude be converted to Unicode
		// Control Pictures)
		Wasavi.send("i\u0016\u000bfoo\u001b");
		assertValue("#1-1", "\u000bfoo");
		assertEquals("#1-2", "\u0016\u000bfoo", Wasavi.getRegister("."));

		// special control code: tab
		Wasavi.send("cc\u0016\u0009foo\u001b");
		assertValue("#2-1", "\u0009foo");
		assertEquals("#2-2", "\u0016\u0009foo", Wasavi.getRegister("."));

		// special control code: escape
		Wasavi.send("cc\u0016\u001bbar\u001b");
		assertValue("#3-1", "\u001bbar");
		assertEquals("#3-2", "\u0016\u001bbar", Wasavi.getRegister("."));

		// special control code: newline
		Wasavi.send("cc\u0016\nbaz\u001b");
		assertValue("#4-1", "\nbaz");
		assertEquals("#4-2", "\u0016\nbaz", Wasavi.getRegister("."));
	}
	
	@Test
	public void testInsertLiteral_LineInput () {
		// general control code: form-feed (shoude be converted to Unicode
		// Control Pictures)
		Wasavi.send(":\"\u0016\u000bfoo\n");
		assertEquals("#1-1", "\"\u000bfoo", Wasavi.getRegister(":"));

		// special control code: tab
		Wasavi.send(":\"\u0016\u0009foo\n");
		assertEquals("#2-1", "\"\u0009foo", Wasavi.getRegister(":"));

		// special control code: escape
		Wasavi.send(":\"\u0016\u001bbar\n");
		assertEquals("#3-1", "\"\u001bbar", Wasavi.getRegister(":"));

		// special control code: newline
		// in line input mode, newline should be ignored.
		Wasavi.send(":\"\u0016\nbaz\n");
		assertEquals("#4-1", "\"baz", Wasavi.getRegister(":"));
	}

	@Test
	public void testInsertByDecimalCodePoint () {
		Wasavi.send(":set noai\n");

		// 3 chars
		Wasavi.send("i\u0016009foo\u001b");
		assertValue("#1-1", "\u0009foo");

		// less chars and implicit completion
		Wasavi.send("cc\u00169bar\u001b");
		assertValue("#2-1", "\u0009bar");

		// less chars and explicit completion
		Wasavi.send("cc\u00169\n\u001b");
		assertValue("#3-1", "\u0009");

		// less chars and cancelaration
		Wasavi.send("cc\u00169\u001bfoo\u001b");
		assertValue("#4-1", "foo");
	}

	@Test
	public void testInsertByDecimalCodePoint_LineInput () {
		// 3 chars
		Wasavi.send(":\"\u0016009foo\n");
		assertEquals("#1-1", "\"\u0009foo", Wasavi.getRegister(":"));

		// less chars and implicit completion
		Wasavi.send(":\"\u00169bar\n");
		assertEquals("#2-1", "\"\u0009bar", Wasavi.getRegister(":"));

		// less chars and explicit completion
		Wasavi.send(":\"\u00169\n\n");
		assertEquals("#3-1", "\"\u0009", Wasavi.getRegister(":"));

		// less chars and cancelaration
		Wasavi.send(":\"\u00169\u001bfoo\n");
		assertEquals("#4-1", "\"foo", Wasavi.getRegister(":"));
	}

	@Test
	public void testInsertByOctalCodePoint () {
		Wasavi.send(":set noai\n");

		// 3 chars
		Wasavi.send("i\u0016o011foo\u001b");
		assertValue("#1-1", "\u0009foo");

		Wasavi.send("cc\u0016O011bar\u001b");
		assertValue("#1-2", "\u0009bar");

		// less chars and implicit completion
		Wasavi.send("cc\u0016o11foo\u001b");
		assertValue("#2-1", "\u0009foo");

		Wasavi.send("cc\u0016O11bar\u001b");
		assertValue("#2-2", "\u0009bar");

		// less chars and explicit completion
		Wasavi.setInputModeOfWatchTarget("line-input");
		Wasavi.send("cc\u0016o11", Keys.ENTER, "foo");
		Wasavi.send(Keys.ESCAPE);
		assertValue("#3-1", "\u0009foo");

		Wasavi.setInputModeOfWatchTarget("line-input");
		Wasavi.send("cc\u0016O11", Keys.ENTER, "bar");
		Wasavi.send(Keys.ESCAPE);
		assertValue("#3-2", "\u0009bar");

		// less chars and cancelaration
		Wasavi.send("cc\u0016o1\u001bfoo\u001b");
		assertValue("#4-1", "foo");

		Wasavi.send("cc\u0016O1\u001bbar\u001b");
		assertValue("#4-1", "bar");
	}

	@Test
	public void testInsertByOctalCodePoint_LineInput () {
		// 3 chars
		Wasavi.send(":\"\u0016o011foo\n");
		assertEquals("#1-1", "\"\u0009foo", Wasavi.getRegister(":"));

		Wasavi.send(":\"\u0016O011bar\n");
		assertEquals("#1-2", "\"\u0009bar", Wasavi.getRegister(":"));

		// less chars and implicit completion
		Wasavi.send(":\"\u0016o11foo\n");
		assertEquals("#2-1", "\"\u0009foo", Wasavi.getRegister(":"));

		Wasavi.send(":\"\u0016O11bar\n");
		assertEquals("#2-2", "\"\u0009bar", Wasavi.getRegister(":"));

		// less chars and explicit completion
		Wasavi.send(":\"\u0016o11\nfoo\n");
		assertEquals("#3-1", "\"\u0009foo", Wasavi.getRegister(":"));

		Wasavi.send(":\"\u0016O11\nbar\n");
		assertEquals("#3-2", "\"\u0009bar", Wasavi.getRegister(":"));

		// less chars and cancelaration
		Wasavi.send(":\"\u0016o1\u001bfoo\n");
		assertEquals("#4-1", "\"foo", Wasavi.getRegister(":"));

		Wasavi.send(":\"\u0016O1\u001bbar\n");
		assertEquals("#4-1", "\"bar", Wasavi.getRegister(":"));
	}

	@Test
	public void testInsertByHexaCodePoint () {
		Wasavi.send(":set noai\n");

		// 2 chars
		Wasavi.send("i\u0016x09Zoo\u001b");
		assertValue("#1-1", "\u0009Zoo");

		Wasavi.send("cc\u0016X09Zar\u001b");
		assertValue("#1-2", "\u0009Zar");

		// less chars and implicit completion
		Wasavi.send("cc\u0016x9Zoo\u001b");
		assertValue("#2-1", "\u0009Zoo");

		Wasavi.send("cc\u0016X9Zar\u001b");
		assertValue("#2-2", "\u0009Zar");

		// less chars and explicit completion
		Wasavi.setInputModeOfWatchTarget("edit");
		Wasavi.send("cc\u0016x9", Keys.ENTER, "foo");
		Wasavi.send(Keys.ESCAPE);
		assertValue("#3-1", "\u0009foo");

		Wasavi.setInputModeOfWatchTarget("edit");
		Wasavi.send("cc\u0016X9", Keys.ENTER, "bar");
		Wasavi.send(Keys.ESCAPE);
		assertValue("#3-2", "\u0009bar");

		// less chars and cancelaration
		Wasavi.send("cc\u0016x9\u001bfoo\u001b");
		assertValue("#4-1", "foo");

		Wasavi.send("cc\u0016X9\u001bbar\u001b");
		assertValue("#4-1", "bar");
	}

	@Test
	public void testInsertByHexaCodePoint_LineInput () {
		// 2 chars
		Wasavi.send(":\"\u0016x09Zoo\n");
		assertEquals("#1-1", "\"\u0009Zoo", Wasavi.getRegister(":"));

		Wasavi.send(":\"\u0016X09Zar\n");
		assertEquals("#1-2", "\"\u0009Zar", Wasavi.getRegister(":"));

		// less chars and implicit completion
		Wasavi.send(":\"\u0016x9Zoo\n");
		assertEquals("#2-1", "\"\u0009Zoo", Wasavi.getRegister(":"));

		Wasavi.send(":\"\u0016X9Zar\n");
		assertEquals("#2-2", "\"\u0009Zar", Wasavi.getRegister(":"));

		// less chars and explicit completion
		Wasavi.send(":\"\u0016x9\nfoo\n");
		assertEquals("#3-1", "\"\u0009foo", Wasavi.getRegister(":"));

		Wasavi.send(":\"\u0016X9\nbar\n");
		assertEquals("#3-2", "\"\u0009bar", Wasavi.getRegister(":"));

		// less chars and cancelaration
		Wasavi.send(":\"\u0016x9\u001bfoo\n");
		assertEquals("#4-1", "\"foo", Wasavi.getRegister(":"));

		Wasavi.send(":\"\u0016X9\u001bbar\n");
		assertEquals("#4-1", "\"bar", Wasavi.getRegister(":"));
	}

	@Test
	public void testInsertByBMPCodePoint () {
		Wasavi.send(":set noai\n");

		// 4 chars
		Wasavi.send("i\u0016u0009Zoo\u001b");
		assertValue("#1-1", "\u0009Zoo");

		// less chars and implicit completion
		Wasavi.send("cc\u0016u9Zoo\u001b");
		assertValue("#2-1", "\u0009Zoo");

		// less chars and explicit completion
		Wasavi.setInputModeOfWatchTarget("edit");
		Wasavi.send("cc\u0016u9", Keys.ENTER, "foo");
		Wasavi.send(Keys.ESCAPE);
		assertValue("#3-1", "\u0009foo");

		// less chars and cancelaration
		Wasavi.send("cc\u0016u9\u001bfoo\u001b");
		assertValue("#4-1", "foo");
	}

	@Test
	public void testInsertByBMPCodePoint_LineInput () {
		// 4 chars
		Wasavi.send(":\"\u0016u0009Zoo\n");
		assertEquals("#1-1", "\"\u0009Zoo", Wasavi.getRegister(":"));

		// less chars and implicit completion
		Wasavi.send(":\"\u0016u9Zoo\n");
		assertEquals("#2-1", "\"\u0009Zoo", Wasavi.getRegister(":"));

		// less chars and explicit completion
		Wasavi.send(":\"\u0016u9\nfoo\n");
		assertEquals("#3-1", "\"\u0009foo", Wasavi.getRegister(":"));

		// less chars and cancelaration
		Wasavi.send(":\"\u0016u9\u001bfoo\n");
		assertEquals("#4-1", "\"foo", Wasavi.getRegister(":"));
	}

	@Test
	public void testInsertByUnicodeCodePoint () {
		Wasavi.send(":set noai\n");

		// 6 chars
		Wasavi.send("i\u0016U000009Zoo\u001b");
		assertValue("#1-1", "\u0009Zoo");

		// less chars and implicit completion
		Wasavi.send("cc\u0016U9Zoo\u001b");
		assertValue("#2-1", "\u0009Zoo");

		// less chars and explicit completion
		Wasavi.setInputModeOfWatchTarget("edit");
		Wasavi.send("cc\u0016U9", Keys.ENTER, "foo");
		Wasavi.send(Keys.ESCAPE);
		assertValue("#3-1", "\u0009foo");

		// less chars and cancelaration
		Wasavi.send("cc\u0016U9\u001bfoo\u001b");
		assertValue("#4-1", "foo");

		// surrogate pair:
		//   U+20268 -> D841 + DE28
		Wasavi.send("cc\u0016U020628\u001b");
		assertValue("#5-1", "\ud841\ude28");

		// out of code point range
		Wasavi.send("cc\u0016U110000Zoo\u001b");
		assertValue("#6-1", "Zoo");
		assertTrue("#6-2", Wasavi.getLastMessage().length() > 0);
	}

	@Test
	public void testInsertByUnicodeCodePoint_LineInput () {
		// 6 chars
		Wasavi.send(":\"\u0016U000009Zoo\n");
		assertEquals("#1-1", "\"\u0009Zoo", Wasavi.getRegister(":"));

		// less chars and implicit completion
		Wasavi.send(":\"\u0016U9Zoo\n");
		assertEquals("#2-1", "\"\u0009Zoo", Wasavi.getRegister(":"));

		// less chars and explicit completion
		Wasavi.send(":\"\u0016U9\nfoo\n");
		assertEquals("#3-1", "\"\u0009foo", Wasavi.getRegister(":"));

		// less chars and cancelaration
		Wasavi.send(":\"\u0016U9\u001bfoo\n");
		assertEquals("#4-1", "\"foo", Wasavi.getRegister(":"));

		// surrogate pair:
		//   U+20628 -> D841 + DE28
		Wasavi.send(":\"\u0016U020628\n");
		assertEquals("#5-1", "\"\ud841\ude28", Wasavi.getRegister(":"));

		// out of code point range
		Wasavi.send(":\"\u0016U110000Zoo\n");
		assertEquals("#6-1", "\"Zoo", Wasavi.getRegister(":"));
		//assertTrue("#6-2", Wasavi.getLastMessage().length() > 0);
	}

	@Test
	public void testOpenLineAfter () {
		// the behavior of o command in wasavi is compatible to vim, NOT historical vi.
		Wasavi.send("ofoo\u001b");
		assertPos("#1-1", 1, 2);
		assertEquals("#1-2", "\nfoo", Wasavi.getValue());
		assertEquals("#1-3", "foo", Wasavi.getRegister("."));

		Wasavi.send("2obar\u001b");
		assertPos("#2-1", 3, 2);
		assertEquals("#2-2", "\nfoo\nbar\nbar", Wasavi.getValue());
		assertEquals("#2-3", "bar", Wasavi.getRegister("."));

		Wasavi.send("gg");

		Wasavi.send("oFOO\u001b");
		assertPos("#3-1", 1, 2);
		assertEquals("#3-2", "\nFOO\nfoo\nbar\nbar", Wasavi.getValue());
		assertEquals("#3-3", "FOO", Wasavi.getRegister("."));

		Wasavi.send("2oBAR\u001b");
		assertPos("#4-1", 3, 2);
		assertEquals("#4-2", "\nFOO\nBAR\nBAR\nfoo\nbar\nbar", Wasavi.getValue());
		assertEquals("#4-3", "BAR", Wasavi.getRegister("."));
	}

	@Test
	public void testOpenLineCurrent () {
		// the behavior of O command in wasavi is compatible to vim, NOT historical vi.
		Wasavi.send("Ofoo\u001b");
		assertPos("#1-1", 0, 2);
		assertEquals("#1-2", "foo\n", Wasavi.getValue());
		assertEquals("#1-3", "foo", Wasavi.getRegister("."));

		Wasavi.send("2Obar\u001b");
		assertPos("#2-1", 1, 2);
		assertEquals("#2-2", "bar\nbar\nfoo\n", Wasavi.getValue());
		assertEquals("#2-3", "bar", Wasavi.getRegister("."));

		Wasavi.send("G");

		Wasavi.send("OFOO\u001b");
		assertPos("#3-1", 3, 2);
		assertEquals("#3-2", "bar\nbar\nfoo\nFOO\n", Wasavi.getValue());
		assertEquals("#3-3", "FOO", Wasavi.getRegister("."));

		Wasavi.send("2OBAR\u001b");
		assertPos("#4-1", 4, 2);
		assertEquals("#4-2", "bar\nbar\nfoo\nBAR\nBAR\nFOO\n", Wasavi.getValue());
		assertEquals("#4-3", "BAR", Wasavi.getRegister("."));
	}

	@Test
	public void testOverwrite () {
		Wasavi.setInputModeOfWatchTarget("edit-overwrite");
		Wasavi.send("R", "foo\nbar");
		assertEquals("#1", "edit-overwrite", Wasavi.getInputMode());

		Wasavi.send(Keys.ESCAPE);
		assertPos("#2-1", 1, 2);
		assertEquals("#2-2", "foo\nbar", Wasavi.getValue());
		assertEquals("#2-3", "foo\nbar", Wasavi.getRegister("."));

		Wasavi.send("1G", "1|RFOOBAR\u001b");
		assertPos("#3-1", 0, 5);
		assertEquals("#3-2", "FOOBAR\nbar", Wasavi.getValue());
		assertEquals("#3-3", "FOOBAR", Wasavi.getRegister("."));

		Wasavi.send("1G", "1|Rfoo\nbar\u001b");
		assertPos("#4-1", 1, 2);
		assertEquals("#4-2", "foo\nbar\nbar", Wasavi.getValue());
		assertEquals("#4-3", "foo\nbar", Wasavi.getRegister("."));
	}

	//function testRepeatLastSubstitute () {
		// this test is in excommands.html
	//}

	@Test
	public void testSubstitute () {
		Wasavi.send("ifirst\nsecond\nthird\u001b");

		Wasavi.send("1G1|sXYZ\u001b");
		assertPos("#1-1", 0, 2);
		assertValue("#1-2", "XYZirst\nsecond\nthird");
		assertEquals("#1-3", "f", Wasavi.getRegister("\""));

		Wasavi.send("2G1|3sXYZ\u001b");
		assertPos("#2-1", 1, 2);
		assertValue("#2-2", "XYZirst\nXYZond\nthird");
		assertEquals("#2-3", "sec", Wasavi.getRegister("\""));
	}

	@Test
	public void testSubstituteWholeLines () {
		Wasavi.send("i\tfoobar\u001b");

		Wasavi.send(":set noai\nSreplaced\u001b");
		assertPos("#1-1", 0, 7);
		assertEquals("#1-2", "replaced", Wasavi.getValue());

		Wasavi.send("dS");
		assertTrue("#2-1", Wasavi.getLastMessage().length() > 0);
	}

	@Test
	public void testZZ () {
		Wasavi.send("ifoobar\u001b");
		Wasavi.sendNoWait("ZZ");

		Boolean vanished = Wasavi.waitTerminate();
		assertTrue("wasaviFrame must not be exist.", vanished);

		String text = driver.findElement(By.id("t2")).getAttribute("value");
		assertEquals("#1-1", "foobar", text);
	}
}
