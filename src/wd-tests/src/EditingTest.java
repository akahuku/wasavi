package WasaviTest;

import static WasaviTest.WasaviAsserts.*;
import static WasaviTest.WasaviUtils.*;

import org.junit.*;
import static org.junit.Assert.*;

import org.openqa.selenium.By;
import org.openqa.selenium.Keys;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.interactions.Actions;

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
		String s = "paste via vi command";
		setClipboardText(s);
		Wasavi.send("\"*P");
		assertEquals("#1", s, Wasavi.getValue());
	}

	@Test
	public void testPasteFromClipboard2 () {
		String s = "shift+insert, in command mode";
		setClipboardText(s);
		Wasavi.send(new WasaviSendCallback() {
			@Override
			void exec (Actions act) {
				act.sendKeys(Keys.chord(Keys.SHIFT, Keys.INSERT));
			}
		});
		assertEquals("#1", s, Wasavi.getValue());
	}

	@Test
	public void testPasteFromClipboard3 () {
		String s = "shift+insert, in insert mode";
		setClipboardText(s);
		Wasavi.send(new WasaviSendCallback() {
			@Override
			void exec (Actions act) {
				act .sendKeys("i")
					.sendKeys(Keys.chord(Keys.SHIFT, Keys.INSERT))
					.sendKeys("\u001b");
			}
		});
		assertEquals("#1", s, Wasavi.getValue());
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
	//            a, c, d, i,    o, p, r, s, x, y,
	//            gq,
	//   and ~

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
	public void testRepetitionDelete () {
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

		Wasavi.send("u");
		assertEquals("#2-1", "foo", Wasavi.getValue());
		assertPos("#2-2", 0, 2);
		Wasavi.send("\u0012");
		assertEquals("#2-3", "fobaro", Wasavi.getValue());
		assertPos("#2-4", 0, 2);

		Wasavi.send(".");
		assertEquals("#3-1", "fobarbaro", Wasavi.getValue());
		Wasavi.send("u");
		assertEquals("#3-2", "fobaro", Wasavi.getValue());
		assertPos("#3-3", 0, 2);
		Wasavi.send("\u0012");
		assertEquals("#3-4", "fobarbaro", Wasavi.getValue());
		assertPos("#3-5", 0, 2);

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
	public void testRepetitionDeleteLines () {
		Wasavi.send("i1\n2\n3\n4\n5\u001b", "gg");

		Wasavi.send("dd");

		Wasavi.send(".");
		assertEquals("#1", "3\n4\n5", Wasavi.getValue());

		Wasavi.send("2.");
		assertEquals("#2", "5", Wasavi.getValue());
	}

	@Test
	public void testRepetitionDeleteLines2 () {
		Wasavi.send("i1\n2\n3\n4\n5\u001b", "gg");

		Wasavi.send("2dd");

		Wasavi.send(".");
		assertEquals("#2", "5", Wasavi.getValue());
	}

	@Test
	public void testRepetitionYankLines () {
		Wasavi.send("ifirst\nsecond\nthird\nfourth\u001b", "gg");

		Wasavi.send("yy");

		Wasavi.send("2G", ".");
		assertEquals("#1", "second\n", Wasavi.getRegister("\""));

		Wasavi.send("3G", "2.");
		assertEquals("#2", "third\nfourth\n", Wasavi.getRegister("\""));
	}

	@Test
	public void testRepetitionYankLinesAlias () {
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

	@Test
	public void testRepetitionReformat () {
		Wasavi.send(
			"i" +
			"Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.\n" +
			"\n" +
			"Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat." +
			"\u001b");

		Wasavi.send(":set tw=30\n");
		Wasavi.send("1G1|gqq");
		assertValue("#1-1",
			"Lorem ipsum dolor sit amet,\n" +
			"consectetur adipisicing elit,\n" +
			"sed do eiusmod tempor\n" +
			"incididunt ut labore et dolore\n" +
			"magna aliqua.\n" +
			"\n" +
			"Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.");
		assertPos("#1-2", 5, 0);
		Wasavi.send(".");
		assertValue("#1-3",
			"Lorem ipsum dolor sit amet,\n" +
			"consectetur adipisicing elit,\n" +
			"sed do eiusmod tempor\n" +
			"incididunt ut labore et dolore\n" +
			"magna aliqua.\n" +
			"\n" +
			"Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.");
		assertPos("#1-4", 6, 0);
		Wasavi.send("6G2.");
		assertValue("#1-5",
			"Lorem ipsum dolor sit amet,\n" +
			"consectetur adipisicing elit,\n" +
			"sed do eiusmod tempor\n" +
			"incididunt ut labore et dolore\n" +
			"magna aliqua.\n" +
			"\n" +
			"Ut enim ad minim veniam, quis\n" +
			"nostrud exercitation ullamco\n" +
			"laboris nisi ut aliquip ex ea\n" +
			"commodo consequat.");
	}

	// undo, redo tests are in another file. see UndoTest.java
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

		Wasavi.send("\u001b");
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
	public void testAppendToLast () {
		Wasavi.setInputModeOfWatchTarget("edit");
		Wasavi.send("Afoobar");
		assertEquals("#1", "edit", Wasavi.getInputMode());

		Wasavi.send("\u001b");
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
		Wasavi.setInputModeOfWatchTarget("overwrite");
		Wasavi.send("R", "foo\nbar");
		assertEquals("#1", "overwrite", Wasavi.getInputMode());

		Wasavi.send("\u001b");
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

	@Test
	public void reformat () {
		//
		Wasavi.send(
			"i" +
			"Lorem ipsum dolor sit amet,\nconsectetur adipisicing elit,\nsed do eiusmod tempor\nincididunt ut labore et dolore\nmagna aliqua.\n" +
			"\n" +
			"Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat." +
			"\u001b");

		//
		Wasavi.send(":set tw=40\n");
		Wasavi.send("1G1|gqap");
		assertValue("#1-1",
			"Lorem ipsum dolor sit amet, consectetur\n" +
			"adipisicing elit, sed do eiusmod tempor\n" +
			"incididunt ut labore et dolore magna\n" +
			"aliqua.\n" +
			"\n" +
			"Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.");
		assertPos("#1-2", 4, 0);

		//
		Wasavi.send("gqq");
		assertPos("#2-1", 5, 0);
		Wasavi.send("gqq");
		assertValue("#2-2",
			"Lorem ipsum dolor sit amet, consectetur\n" +
			"adipisicing elit, sed do eiusmod tempor\n" +
			"incididunt ut labore et dolore magna\n" +
			"aliqua.\n" +
			"\n" +
			"Ut enim ad minim veniam, quis nostrud\n" +
			"exercitation ullamco laboris nisi ut\n" +
			"aliquip ex ea commodo consequat.");
		assertPos("#2-3", 7, 31);

		//
		Wasavi.send("u");
		assertValue("#3-1",
			"Lorem ipsum dolor sit amet, consectetur\n" +
			"adipisicing elit, sed do eiusmod tempor\n" +
			"incididunt ut labore et dolore magna\n" +
			"aliqua.\n" +
			"\n" +
			"Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.");
		Wasavi.send("u");
		assertValue("#3-2",
			"Lorem ipsum dolor sit amet,\n" +
			"consectetur adipisicing elit,\n" +
			"sed do eiusmod tempor\n" +
			"incididunt ut labore et dolore\n" +
			"magna aliqua.\n" +
			"\n" +
			"Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.");

		//
		Wasavi.send("\u0012");
		assertValue("#4-1",
			"Lorem ipsum dolor sit amet, consectetur\n" +
			"adipisicing elit, sed do eiusmod tempor\n" +
			"incididunt ut labore et dolore magna\n" +
			"aliqua.\n" +
			"\n" +
			"Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.");
		Wasavi.send("\u0012");
		assertValue("#4-2",
			"Lorem ipsum dolor sit amet, consectetur\n" +
			"adipisicing elit, sed do eiusmod tempor\n" +
			"incididunt ut labore et dolore magna\n" +
			"aliqua.\n" +
			"\n" +
			"Ut enim ad minim veniam, quis nostrud\n" +
			"exercitation ullamco laboris nisi ut\n" +
			"aliquip ex ea commodo consequat.");
	}

	@Test
	public void pasteRegister () {
		Wasavi.send("afoo\nbar\u001b1GyG");
		Wasavi.send("O\u0012\"\u001b");
		assertValue("#1-1", "foo\nbar\n\nfoo\nbar");
	}

	@Test
	public void pasteClipboard () {
		Wasavi.send("afoo\nbar\u001b1G\"*yG");
		Wasavi.send("O\u0012*\u001b");
		assertValue("#1-1", "foo\nbar\n\nfoo\nbar");
	}
}
