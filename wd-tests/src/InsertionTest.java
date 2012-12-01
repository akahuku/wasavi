package WasaviTest;

import static WasaviTest.WasaviAsserts.*;
import static WasaviTest.WasaviUtils.*;

import org.junit.*;
import static org.junit.Assert.*;

import org.openqa.selenium.By;
import org.openqa.selenium.Keys;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;

public class InsertionTest extends WasaviTest {
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
		Wasavi.send("u");
		assertValue("#1-3", "");
		Wasavi.send("\u0012");
		assertValue("#1-4", "\u000bfoo");

		// special control code: tab
		Wasavi.send("cc\u0016\u0009foo\u001b");
		assertValue("#2-1", "\u0009foo");
		assertEquals("#2-2", "\u0016\u0009foo", Wasavi.getRegister("."));
		Wasavi.send("u");
		assertValue("#2-3", "\u000bfoo");
		Wasavi.send("\u0012");
		assertValue("#2-4", "\u0009foo");

		// special control code: escape
		Wasavi.send("cc\u0016\u001bbar\u001b");
		assertValue("#3-1", "\u001bbar");
		assertEquals("#3-2", "\u0016\u001bbar", Wasavi.getRegister("."));
		Wasavi.send("u");
		assertValue("#3-3", "\u0009foo");
		Wasavi.send("\u0012");
		assertValue("#3-4", "\u001bbar");

		// special control code: newline
		Wasavi.send("cc\u0016\nbaz\u001b");
		assertValue("#4-1", "\nbaz");
		assertEquals("#4-2", "\u0016\nbaz", Wasavi.getRegister("."));
		Wasavi.send("u");
		assertValue("#4-3", "\u001bbar");
		Wasavi.send("\u0012");
		assertValue("#4-4", "\nbaz");
	}

	@Test
	public void testInsertLiteral_LineInput () {
		Wasavi.send(":\"\u0016\u000bfoo\n");
		assertEquals("#1-1", "\"\u000bfoo", Wasavi.getRegister(":"));

		Wasavi.send(":\"\u0016\u0009foo\n");
		assertEquals("#2-1", "\"\u0009foo", Wasavi.getRegister(":"));

		Wasavi.send(":\"\u0016\u001bbar\n");
		assertEquals("#3-1", "\"\u001bbar", Wasavi.getRegister(":"));

		Wasavi.send(":\"\u0016" + Keys.ENTER + "baz\n");
		assertEquals("#4-1", "\"\rbaz", Wasavi.getRegister(":"));
	}

	@Test
	public void testInsertByDecimalCodePoint () {
		Wasavi.send(":set noai\n");

		// 3 chars
		Wasavi.send("i\u0016009foo\u001b");
		assertValue("#1-1", "\u0009foo");
		assertEquals("#1-2", "\u0016009foo", Wasavi.getRegister("."));
		Wasavi.send("u");
		assertValue("#1-3", "");
		Wasavi.send("\u0012");
		assertValue("#1-4", "\u0009foo");

		// less chars and implicit completion
		Wasavi.send("cc\u00169bar\u001b");
		assertValue("#2-1", "\u0009bar");
		assertEquals("#2-2", "\u00169bar", Wasavi.getRegister("."));
		Wasavi.send("u");
		assertValue("#2-3", "\u0009foo");
		Wasavi.send("\u0012");
		assertValue("#2-4", "\u0009bar");

		// less chars and explicit completion
		Wasavi.send("cc\u00169" + Keys.ENTER + "\u001b");
		assertValue("#3-1", "\u0009");
		assertEquals("#3-2", "\u00169\n", Wasavi.getRegister("."));
		Wasavi.send("u");
		assertValue("#3-3", "\u0009bar");
		Wasavi.send("\u0012");
		assertValue("#3-4", "\u0009");

		// less chars and cancelaration
		Wasavi.send("cc\u00169\u001bfoo\u001b");
		assertValue("#4-1", "foo");
		assertEquals("#4-2", "foo", Wasavi.getRegister("."));
		Wasavi.send("u");
		assertValue("#4-3", "\u0009");
		Wasavi.send("\u0012");
		assertValue("#4-4", "foo");
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
		assertEquals("#1-2", "\u0016o011foo", Wasavi.getRegister("."));
		Wasavi.send("u");
		assertValue("#1-3", "");
		Wasavi.send("\u0012");
		assertValue("#1-4", "\u0009foo");

		Wasavi.send("cc\u0016O011bar\u001b");
		assertValue("#1-5", "\u0009bar");
		assertEquals("#1-6", "\u0016O011bar", Wasavi.getRegister("."));
		Wasavi.send("u");
		assertValue("#1-7", "\u0009foo");
		Wasavi.send("\u0012");
		assertValue("#1-8", "\u0009bar");

		// less chars and implicit completion
		Wasavi.send("cc\u0016o11foo\u001b");
		assertValue("#2-1", "\u0009foo");
		assertEquals("#2-2", "\u0016o11foo", Wasavi.getRegister("."));
		Wasavi.send("u");
		assertValue("#2-3", "\u0009bar");
		Wasavi.send("\u0012");
		assertValue("#2-4", "\u0009foo");

		Wasavi.send("cc\u0016O11bar\u001b");
		assertValue("#2-5", "\u0009bar");
		assertEquals("#2-6", "\u0016O11bar", Wasavi.getRegister("."));
		Wasavi.send("u");
		assertValue("#2-7", "\u0009foo");
		Wasavi.send("\u0012");
		assertValue("#2-8", "\u0009bar");

		// less chars and explicit completion
		Wasavi.send("cc\u0016o11" + Keys.ENTER + "foo" + Keys.ESCAPE);
		assertValue("#3-1", "\u0009foo");
		assertEquals("#3-2", "\u0016o11\nfoo", Wasavi.getRegister("."));
		Wasavi.send("u");
		assertValue("#3-3", "\u0009bar");
		Wasavi.send("\u0012");
		assertValue("#3-4", "\u0009foo");

		Wasavi.send("cc\u0016O11" + Keys.ENTER + "bar" + Keys.ESCAPE);
		assertValue("#3-5", "\u0009bar");
		assertEquals("#3-6", "\u0016O11\nbar", Wasavi.getRegister("."));
		Wasavi.send("u");
		assertValue("#3-7", "\u0009foo");
		Wasavi.send("\u0012");
		assertValue("#3-8", "\u0009bar");

		// less chars and cancelaration
		Wasavi.send("cc\u0016o1\u001bfoo\u001b");
		assertValue("#4-1", "foo");
		assertEquals("#4-2", "foo", Wasavi.getRegister("."));
		Wasavi.send("u");
		assertValue("#4-3", "\u0009bar");
		Wasavi.send("\u0012");
		assertValue("#4-4", "foo");

		Wasavi.send("cc\u0016O1\u001bbar\u001b");
		assertValue("#4-5", "bar");
		assertEquals("#4-6", "bar", Wasavi.getRegister("."));
		Wasavi.send("u");
		assertValue("#4-7", "foo");
		Wasavi.send("\u0012");
		assertValue("#4-8", "bar");
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
		assertEquals("#1-2", "\u0016x09Zoo", Wasavi.getRegister("."));
		Wasavi.send("u");
		assertValue("#1-3", "");
		Wasavi.send("\u0012");
		assertValue("#1-4", "\u0009Zoo");

		Wasavi.send("cc\u0016X09Zar\u001b");
		assertValue("#1-5", "\u0009Zar");
		assertEquals("#1-6", "\u0016X09Zar", Wasavi.getRegister("."));
		Wasavi.send("u");
		assertValue("#1-7", "\u0009Zoo");
		Wasavi.send("\u0012");
		assertValue("#1-8", "\u0009Zar");

		// less chars and implicit completion
		Wasavi.send("cc\u0016x9Zoo\u001b");
		assertValue("#2-1", "\u0009Zoo");
		assertEquals("#2-2", "\u0016x9Zoo", Wasavi.getRegister("."));
		Wasavi.send("u");
		assertValue("#2-3", "\u0009Zar");
		Wasavi.send("\u0012");
		assertValue("#2-4", "\u0009Zoo");

		Wasavi.send("cc\u0016X9Zar\u001b");
		assertValue("#2-5", "\u0009Zar");
		assertEquals("#2-6", "\u0016X9Zar", Wasavi.getRegister("."));
		Wasavi.send("u");
		assertValue("#2-7", "\u0009Zoo");
		Wasavi.send("\u0012");
		assertValue("#2-8", "\u0009Zar");

		// less chars and explicit completion
		Wasavi.send("cc\u0016x9" + Keys.ENTER + "foo" + Keys.ESCAPE);
		assertValue("#3-1", "\u0009foo");
		assertEquals("#3-2", "\u0016x9\nfoo", Wasavi.getRegister("."));
		Wasavi.send("u");
		assertValue("#3-3", "\u0009Zar");
		Wasavi.send("\u0012");
		assertValue("#3-4", "\u0009foo");

		Wasavi.send("cc\u0016X9" + Keys.ENTER + "bar" + Keys.ESCAPE);
		assertValue("#3-5", "\u0009bar");
		assertEquals("#3-6", "\u0016X9\nbar", Wasavi.getRegister("."));
		Wasavi.send("u");
		assertValue("#3-7", "\u0009foo");
		Wasavi.send("\u0012");
		assertValue("#3-8", "\u0009bar");

		// less chars and cancelaration
		Wasavi.send("cc\u0016x9\u001bfoo\u001b");
		assertValue("#4-1", "foo");
		assertEquals("#4-2", "foo", Wasavi.getRegister("."));
		Wasavi.send("u");
		assertValue("#4-3", "\u0009bar");
		Wasavi.send("\u0012");
		assertValue("#4-4", "foo");

		Wasavi.send("cc\u0016X9\u001bbar\u001b");
		assertValue("#4-5", "bar");
		assertEquals("#4-6", "bar", Wasavi.getRegister("."));
		Wasavi.send("u");
		assertValue("#4-7", "foo");
		Wasavi.send("\u0012");
		assertValue("#4-8", "bar");
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
		assertEquals("#1-2", "\u0016u0009Zoo", Wasavi.getRegister("."));
		Wasavi.send("u");
		assertValue("#1-3", "");
		Wasavi.send("\u0012");
		assertValue("#1-4", "\u0009Zoo");

		// less chars and implicit completion
		Wasavi.send("cc\u0016u9Yoo\u001b");
		assertValue("#2-1", "\u0009Yoo");
		assertEquals("#2-2", "\u0016u9Yoo", Wasavi.getRegister("."));
		Wasavi.send("u");
		assertValue("#2-3", "\u0009Zoo");
		Wasavi.send("\u0012");
		assertValue("#2-4", "\u0009Yoo");

		// less chars and explicit completion
		Wasavi.send("cc\u0016u9" + Keys.ENTER + "foo" + Keys.ESCAPE);
		assertValue("#3-1", "\u0009foo");
		assertEquals("#3-2", "\u0016u9\nfoo", Wasavi.getRegister("."));
		Wasavi.send("u");
		assertValue("#3-3", "\u0009Yoo");
		Wasavi.send("\u0012");
		assertValue("#3-4", "\u0009foo");

		// less chars and cancelaration
		Wasavi.send("cc\u0016u9\u001bfoo\u001b");
		assertValue("#4-1", "foo");
		assertEquals("#4-2", "foo", Wasavi.getRegister("."));
		Wasavi.send("u");
		assertValue("#4-3", "\u0009foo");
		Wasavi.send("\u0012");
		assertValue("#4-4", "foo");
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
		assertEquals("#1-2", "\u0016U000009Zoo", Wasavi.getRegister("."));
		Wasavi.send("u");
		assertValue("#1-3", "");
		Wasavi.send("\u0012");
		assertValue("#1-4", "\u0009Zoo");

		// less chars and implicit completion
		Wasavi.send("cc\u0016U9Yoo\u001b");
		assertValue("#2-1", "\u0009Yoo");
		assertEquals("#2-2", "\u0016U9Yoo", Wasavi.getRegister("."));
		Wasavi.send("u");
		assertValue("#2-3", "\u0009Zoo");
		Wasavi.send("\u0012");
		assertValue("#2-4", "\u0009Yoo");

		// less chars and explicit completion
		Wasavi.send("cc\u0016U9" + Keys.ENTER + "foo" + Keys.ESCAPE);
		assertValue("#3-1", "\u0009foo");
		assertEquals("#3-2", "\u0016U9\nfoo", Wasavi.getRegister("."));
		Wasavi.send("u");
		assertValue("#3-3", "\u0009Yoo");
		Wasavi.send("\u0012");
		assertValue("#3-4", "\u0009foo");

		// less chars and cancelaration
		Wasavi.send("cc\u0016U9\u001bfoo\u001b");
		assertValue("#4-1", "foo");
		assertEquals("#4-2", "foo", Wasavi.getRegister("."));
		Wasavi.send("u");
		assertValue("#4-3", "\u0009foo");
		Wasavi.send("\u0012");
		assertValue("#4-4", "foo");

		// surrogate pair:
		//   U+20268 -> D841 + DE28
		Wasavi.send("cc\u0016U020628\u001b");
		assertValue("#5-1", "\ud841\ude28");
		assertEquals("#5-2", "\u0016U020628", Wasavi.getRegister("."));
		Wasavi.send("u");
		assertValue("#5-3", "foo");
		Wasavi.send("\u0012");
		assertValue("#5-4", "\ud841\ude28");

		// out of code point range
		Wasavi.send("cc\u0016U110000Zoo\u001b");
		assertValue("#6-1", "Zoo");
		assertTrue("#6-2", Wasavi.getLastMessage().length() > 0);
		assertEquals("#6-3", "Zoo", Wasavi.getRegister("."));
		Wasavi.send("u");
		assertValue("#6-4", "\ud841\ude28");
		Wasavi.send("\u0012");
		assertValue("#6-5", "Zoo");
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
	public void testBackspace () {
		Wasavi.send(
				"ifoa" +
				Keys.BACK_SPACE +
				"o" +
				Keys.ESCAPE);
		assertValue("#1-1", "foo");
		assertEquals("#1-2", "foa\u0008o", Wasavi.getRegister("."));
		assertEquals("#1-3", "ifoa\u0008o\u001b", Wasavi.getLastSimpleCommand());
		Wasavi.send("u");
		assertValue("#1-4", "");
		Wasavi.send("\u0012");
		assertValue("#1-5", "foo");
	}

	@Test
	public void testBackspaceOverwrite () {
		Wasavi.send(
				"Rfoa" +
				Keys.BACK_SPACE +
				"o" +
				Keys.ESCAPE);
		assertValue("#1-1", "foo");
		assertEquals("#1-2", "foa\u0008o", Wasavi.getRegister("."));
		assertEquals("#1-3", "Rfoa\u0008o\u001b", Wasavi.getLastSimpleCommand());
		Wasavi.send("u");
		assertValue("#1-4", "");
		Wasavi.send("\u0012");
		assertValue("#1-5", "foo");
	}

	@Test
	public void testBackspaceTopOfLine () {
		Wasavi.send("ifoo\n\u001b");
		Wasavi.send("a" + Keys.BACK_SPACE + Keys.BACK_SPACE + Keys.ESCAPE);
		assertValue("#1-1", "fo");
		assertEquals("#1-2", "\u0008\u0008", Wasavi.getRegister("."));
		assertEquals("#1-3", "a\u0008\u0008\u001b", Wasavi.getLastSimpleCommand());
		Wasavi.send("u");
		assertValue("#1-4", "foo\n");
		Wasavi.send("\u0012");
		assertValue("#1-5", "fo");
	}

	@Test
	public void testBackspaceTopOfLineOverwrite () {
		Wasavi.send("ifoo\n\u001b");
		Wasavi.send("R" + Keys.BACK_SPACE + Keys.BACK_SPACE + Keys.ESCAPE);
		assertValue("#1-1", "foo\n");
		assertEquals("#1-2", "\u0008\u0008", Wasavi.getRegister("."));
		assertEquals("#1-3", "R\u0008\u0008\u001b", Wasavi.getLastSimpleCommand());
		Wasavi.send("u");
		assertValue("#1-4", "");
		Wasavi.send("\u0012");
		assertValue("#1-5", "foo\n");
	}

	@Test
	public void testBackspaceTopOfBuffer () {
		Wasavi.send("a" + Keys.BACK_SPACE + Keys.BACK_SPACE + Keys.ESCAPE);
		assertValue("#1-1", "");
		assertEquals("#1-2", "", Wasavi.getRegister("."));
		assertEquals("#1-3", "a\u001b", Wasavi.getLastSimpleCommand());
		Wasavi.send("u");
		assertTrue("#1-4", Wasavi.getLastMessage().length() > 0);
		Wasavi.send("\u0012");
		assertTrue("#1-5", Wasavi.getLastMessage().length() > 0);
	}

	@Test
	public void testBackspaceTopOfBufferOverwrite () {
		Wasavi.send("R" + Keys.BACK_SPACE + Keys.BACK_SPACE + Keys.ESCAPE);
		assertValue("#1-1", "");
		assertEquals("#1-2", "", Wasavi.getRegister("."));
		assertEquals("#1-3", "R\u001b", Wasavi.getLastSimpleCommand());
		Wasavi.send("u");
		assertTrue("#1-4", Wasavi.getLastMessage().length() > 0);
		Wasavi.send("\u0012");
		assertTrue("#1-5", Wasavi.getLastMessage().length() > 0);
	}

	@Test
	public void testBackspaceMiddleOfLine () {
		Wasavi.send("ifoobar\u001b");
		Wasavi.send("a" + Keys.BACK_SPACE + Keys.BACK_SPACE + Keys.ESCAPE);
		assertValue("#1-1", "foob");
		assertEquals("#1-2", "\u0008\u0008", Wasavi.getRegister("."));
		assertEquals("#1-3", "a\u0008\u0008\u001b", Wasavi.getLastSimpleCommand());
		Wasavi.send("u");
		assertValue("#1-4", "foobar");
		Wasavi.send("\u0012");
		assertValue("#1-5", "foob");
	}

	@Test
	public void testBackspaceMiddleOfLineOverwrite () {
		Wasavi.send("ifoobar\u001b");
		Wasavi.send("R" + Keys.BACK_SPACE + Keys.BACK_SPACE + Keys.ESCAPE);
		assertValue("#1-1", "foobar");
		assertEquals("#1-2", "\u0008\u0008", Wasavi.getRegister("."));
		assertEquals("#1-3", "R\u0008\u0008\u001b", Wasavi.getLastSimpleCommand());
		Wasavi.send("u");
		assertValue("#1-4", "");
		Wasavi.send("\u0012");
		assertValue("#1-5", "foobar");
	}

	@Test
	public void testDelete () {
		Wasavi.send("idar\u001b1|");
		Wasavi.send("ifoo" + Keys.DELETE + "b" + Keys.ESCAPE);
		assertValue("#1-1", "foobar");
		assertEquals("#1-2", "foo\u007fb", Wasavi.getRegister("."));
		assertEquals("#1-3", "ifoo\u007fb\u001b", Wasavi.getLastSimpleCommand());
		Wasavi.send("u");
		assertValue("#1-4", "dar");
		Wasavi.send("\u0012");
		assertValue("#1-5", "foobar");
	}

	@Test
	public void testDeleteOverwrite () {
		Wasavi.send("idar\u001b1|");
		Wasavi.send("Rf" + Keys.DELETE + "e" + Keys.ESCAPE);
		assertValue("#1-1", "fe");
		assertEquals("#1-2", "f\u007fe", Wasavi.getRegister("."));
		assertEquals("#1-3", "Rf\u007fe\u001b", Wasavi.getLastSimpleCommand());
		Wasavi.send("u");
		assertValue("#1-4", "dar");
		Wasavi.send("\u0012");
		assertValue("#1-5", "fe");
	}

	@Test
	public void testDeleteTailOfLine () {
		Wasavi.send("ifoo\nbar\u001b1G$");
		Wasavi.send("a" + Keys.DELETE + Keys.DELETE + Keys.ESCAPE);
		assertValue("#1-1", "fooar");
		assertEquals("#1-2", "\u007f\u007f", Wasavi.getRegister("."));
		assertEquals("#1-3", "a\u007f\u007f\u001b", Wasavi.getLastSimpleCommand());
		Wasavi.send("u");
		assertValue("#1-4", "foo\nbar");
		Wasavi.send("\u0012");
		assertValue("#1-5", "fooar");
	}

	@Test
	public void testDeleteTailOfLineOverwrite () {
		Wasavi.send("ifoo\nbar\u001b1G$");
		Wasavi.send("R" + Keys.DELETE + Keys.DELETE + Keys.ESCAPE);
		assertValue("#1-1", "fobar");
		assertEquals("#1-2", "\u007f\u007f", Wasavi.getRegister("."));
		assertEquals("#1-3", "R\u007f\u007f\u001b", Wasavi.getLastSimpleCommand());
		Wasavi.send("u");
		assertValue("#1-4", "foo\nbar");
		Wasavi.send("\u0012");
		assertValue("#1-5", "fobar");
	}

	@Test
	public void testDeleteTailOfBuffer () {
		Wasavi.send("ifoobar\u001b");
		Wasavi.send("$a" + Keys.DELETE + Keys.DELETE + Keys.ESCAPE);
		assertValue("#1-1", "foobar");
		/*
		 * wasavi doesn't update the register content with empty string.
		 * therefore, final stroke will be empty, but "." register is still "foobar".
		 */
		assertEquals("#1-2", "foobar", Wasavi.getRegister("."));
		assertEquals("#1-3", "a\u001b", Wasavi.getLastSimpleCommand());
		Wasavi.send("u");
		assertTrue("#1-4", Wasavi.getLastMessage().length() > 0);
		Wasavi.send("\u0012");
		assertTrue("#1-5", Wasavi.getLastMessage().length() > 0);
	}

	@Test
	public void testDeleteTailOfBufferOverwrite () {
		Wasavi.send("ifoobar\u001b");
		Wasavi.send("$R" + Keys.ARROW_RIGHT + Keys.DELETE + Keys.DELETE + Keys.ESCAPE);
		assertValue("#1-1", "foobar");
		/*
		 * wasavi doesn't update the register content with empty string.
		 * therefore, final stroke will be empty, buf "." register still "foobar".
		 */
		assertEquals("#1-2", "foobar", Wasavi.getRegister("."));
		assertEquals("#1-3", "R\u001b", Wasavi.getLastSimpleCommand());
		Wasavi.send("u");
		assertTrue("#1-4", Wasavi.getLastMessage().length() > 0);
		Wasavi.send("\u0012");
		assertTrue("#1-5", Wasavi.getLastMessage().length() > 0);
	}

	@Test
	public void testNewSession () {
		Wasavi.send("ifoo" + Keys.ARROW_LEFT + "bar\u001b");
		assertValue("#1-1", "fobaro");
		assertEquals("#1-2", "bar", Wasavi.getRegister("."));
		assertEquals("#1-3", "ibar\u001b", Wasavi.getLastSimpleCommand());
		Wasavi.send("u");
		assertValue("#1-4", "foo");
		Wasavi.send("u");
		assertValue("#1-5", "");
		Wasavi.send("\u0012");
		assertValue("#1-6", "foo");
		Wasavi.send("\u0012");
		assertValue("#1-7", "fobaro");
	}
}
