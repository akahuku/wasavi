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

public class ExCommandsTest extends WasaviTest {
	@Test
	public void testAddressAll () {
		Wasavi.send("i1\n2\n3\u001b");
		Wasavi.send(":%p\n");
		assertEquals("#1-1", "1\n2\n3", Wasavi.getLastMessage());

		Wasavi.send(":% +1p\n\u001b");
		assertFalse("#2-1", "".equals(Wasavi.getLastMessage()));
	}

	@Test
	public void testNull () {
		Wasavi.send("i1\n2\n3\u001b");

		Wasavi.send("2G", ":\n");
		assertEquals("#1-1", "", Wasavi.getLastMessage());
		assertPos("#1-2", 1, 0);

		Wasavi.send(":||\n");
		assertEquals("#2-1", "2\n2", Wasavi.getLastMessage());
	}

	@Test
	public void testAddressCurrent () {
		Wasavi.send("i1\n2\n3\u001b");
		Wasavi.send("2G", ":.p\n");
		assertEquals("#1-1", "2", Wasavi.getLastMessage());

		Wasavi.send("2G", ":.+p\n");
		assertEquals("#2-1", "3", Wasavi.getLastMessage());
		assertPos("#2-2", 2, 0);
		Wasavi.send("2G", ":.+1p\n");
		assertEquals("#2-3", "3", Wasavi.getLastMessage());
		assertPos("#2-4", 2, 0);
		Wasavi.send("2G", ":. +1p\n");
		assertEquals("#2-5", "3", Wasavi.getLastMessage());
		assertPos("#2-6", 2, 0);

		Wasavi.send("2G", ":.-p\n");
		assertEquals("#3-1", "1", Wasavi.getLastMessage());
		assertPos("#3-2", 0, 0);
		Wasavi.send("2G", ":.-1p\n");
		assertEquals("#3-3", "1", Wasavi.getLastMessage());
		assertPos("#3-4", 0, 0);
		Wasavi.send("2G", ":. -1p\n");
		assertEquals("#3-5", "1", Wasavi.getLastMessage());
		assertPos("#3-6", 0, 0);
	}

	@Test
	public void testAddressLast () {
		Wasavi.send("i1\n2\n3\u001b");
		Wasavi.send(":$p\n");
		assertEquals("#1-1", "3", Wasavi.getLastMessage());
	}

	@Test
	public void testAddressInteger () {
		Wasavi.send("i1\n2\n3\u001b");

		// sould be clipped
		Wasavi.send(":0p\n");
		assertEquals("#1-1", "1", Wasavi.getLastMessage());
		assertPos("#1-2", 0, 0);

		Wasavi.send(":1p\n");
		assertEquals("#2-1", "1", Wasavi.getLastMessage());
		assertPos("#2-2", 0, 0);

		Wasavi.send(":2p\n");
		assertEquals("#3-1", "2", Wasavi.getLastMessage());
		assertPos("#3-2", 1, 0);

		Wasavi.send(":3p\n");
		assertEquals("#4-1", "3", Wasavi.getLastMessage());
		assertPos("#4-2", 2, 0);

		// implicit print, sould be clipped
		Wasavi.send(":4\n");
		assertEquals("#5-1", "", Wasavi.getLastMessage());
		assertPos("#5-2", 2, 0);

		// explicit print, should be an error
		Wasavi.send(":4p\n");
		assertPos("#6-2", 2, 0);
		assertEquals("#6-1", "print: Out of range.", Wasavi.getLastMessage());
	}

	@Test
	public void testAddressMark () {
		Wasavi.send("i1\n2\n3\n4\u001b");

		Wasavi.send("1G:'ap\n");
		assertEquals("#0-1", "Mark a is undefined.", Wasavi.getLastMessage());

		Wasavi.send(":'Ap\n");
		assertEquals("#0-2", "Invalid mark name.", Wasavi.getLastMessage());

		Wasavi.send("4G", "ma1G", ":'ap\n");
		assertEquals("#1-1", "4", Wasavi.getLastMessage());
		assertPos("#1-2", 3, 0);
	}

	@Test
	public void testAddressOffsetInteger () {
		Wasavi.send("i1\n2\n3\u001b");

		Wasavi.send("2G", ":+0p\n");
		assertEquals("#1-1", "2", Wasavi.getLastMessage());

		Wasavi.send("2G", ":+p\n");
		assertEquals("#2-1", "3", Wasavi.getLastMessage());

		Wasavi.send("2G", ":-0p\n");
		assertEquals("#3-1", "2", Wasavi.getLastMessage());

		Wasavi.send("2G", ":-p\n");
		assertEquals("#4-1", "1", Wasavi.getLastMessage());
	}

	@Test
	public void testAddressSearchForward () {
		Wasavi.send(":set nowrapscan\n");
		Wasavi.send("i1 foo\n2 foo\n3 foo\u001b");

		Wasavi.send("://p\n");
		assertEquals("#0-1", "No previous search pattern.", Wasavi.getLastMessage());

		Wasavi.send("1G", ":/foo/p\n");
		assertEquals("#1-1", "2 foo", Wasavi.getLastMessage());
		assertPos("#1-2", 1, 0);

		Wasavi.send("://p\n");
		assertEquals("#2-1", "3 foo", Wasavi.getLastMessage());
		assertPos("#2-2", 2, 0);

		// not found on nowrapscan:
		// should be an error.
		Wasavi.send("://p\n");
		assertFalse("#3-1", "".equals(Wasavi.getLastMessage()));
		assertEquals("#3-2", "Pattern not found: foo", Wasavi.getLastMessage());
		assertPos("#3-3", 2, 0);

		// turn wrapscan on.
		// should be wrapped searching.
		Wasavi.send(":set wrapscan\n");
		Wasavi.send("://p\n");
		assertEquals("#4-1", "1 foo", Wasavi.getLastMessage());
		assertPos("#4-2", 0, 0);

		// not found on wrapscan:
		// should be an error.
		Wasavi.send(":/xyz/p\n");
		assertEquals("#5-1", "Pattern not found: xyz", Wasavi.getLastMessage());
		assertPos("#5-2", 0, 0);
	}

	@Test
	public void testAddressSearchBackward () {
		Wasavi.send(":set nowrapscan\n");
		Wasavi.send("i1 foo\n2 foo\n3 foo\u001b");

		Wasavi.send(":??p\n");
		assertEquals("#0-1", "No previous search pattern.", Wasavi.getLastMessage());

		Wasavi.send("3G", ":?foo?p\n");
		assertEquals("#1-1", "2 foo", Wasavi.getLastMessage());
		assertPos("#1-2", 1, 0);

		Wasavi.send(":??p\n");
		assertEquals("#2-1", "1 foo", Wasavi.getLastMessage());
		assertPos("#2-2", 0, 0);

		// not found on nowrapscan:
		// should be an error.
		Wasavi.send(":??p\n");
		assertFalse("#3-1", "".equals(Wasavi.getLastMessage()));
		assertEquals("#3-2", "Pattern not found: foo", Wasavi.getLastMessage());
		assertPos("#3-3", 0, 0);

		// turn wrapscan on.
		// should be wrapped searching.
		Wasavi.send(":set wrapscan\n");
		Wasavi.send(":??p\n");
		assertEquals("#4-1", "3 foo", Wasavi.getLastMessage());
		assertPos("#4-2", 2, 0);

		// not found on wrapscan:
		// should be an error.
		Wasavi.send(":?xyz?p\n");
		assertEquals("#5-1", "Pattern not found: xyz", Wasavi.getLastMessage());
		assertPos("#5-2", 2, 0);
	}

	@Test
	public void testRangeStatic () {
		Wasavi.send(":set nowrapscan\n");
		Wasavi.send("i1 foo\n2 bar\n3 foo\n4 bar\n5 foo\u001b");

		/*
		 * 1 foo *                        1 foo
		 * 2 bar                          2 bar * selected range (reversed, causes an error)
		 * 3 foo    -- :/foo/,/bar/p -->  3 foo *
		 * 4 bar                          4 bar
		 * 5 foo                          5 foo
		 */
		Wasavi.send("1G", ":/foo/,/bar/p\n");
		assertEquals("#1-1", "The second address is smaller than the first.", Wasavi.getLastMessage());

		Wasavi.send("1G", ":/bar/,/foo/p\n");
		assertEquals("#2-1", "2 bar\n3 foo", Wasavi.getLastMessage());
	}

	@Test
	public void testRangeDynamic () {
		Wasavi.send(":set nowrapscan\n");
		Wasavi.send("i1 foo\n2 bar\n3 foo\n4 bar\n5 foo\u001b");

		/*
		 * 1 foo *                        1 foo
		 * 2 bar                          2 bar
		 * 3 foo    -- :/foo/;/bar/p -->  3 foo * selected range
		 * 4 bar                          4 bar *
		 * 5 foo                          5 foo
		 */
		Wasavi.send("1G", ":/foo/;/bar/p\n");
		assertEquals("#1-1", "3 foo\n4 bar", Wasavi.getLastMessage());

		// if dynamic address is out of range, causes an error (even command has roundMax flag)
		Wasavi.send("1G", ":100;?foo?\n");
		assertEquals("#2-1", "Out of range.", Wasavi.getLastMessage());
	}

	@Test
	public void testRangeTooManyAddress () {
		Wasavi.send("i1\n2\n3\u001b");
		Wasavi.send(":1,2,3p\n");
		assertEquals("#1-1", "2\n3", Wasavi.getLastMessage());
	}

	@Test
	public void testImplicitAddress () {
		Wasavi.send("i1\n2\n3\u001b");
		Wasavi.send("2G", ":||\n");
		assertEquals("#1-1", "2\n2", Wasavi.getLastMessage());
	}

	@Test
	public void testNumericAddress () {
		Wasavi.send("i1\n2\n3\n4\n5\u001b");

		Wasavi.send(":1\n");
		assertPos("#1-1", 0, 0);

		Wasavi.send(":+2\n");
		assertPos("#2-1", 2, 0);

		Wasavi.send("1G", ":/5/\n");
		assertPos("#3-1", 4, 0);
		assertEquals("#3-2", "", Wasavi.getLastMessage());

		Wasavi.send("1G", ":/5\n");
		assertPos("#4-1", 4, 0);
		assertEquals("#4-2", "", Wasavi.getLastMessage());
	}

	@Test
	public void testAbbreviate () {
		Wasavi.send(":abbreviate [clear]\n");
		Wasavi.send(":abbreviate\n");
		assertEquals("#1-1", "No abbreviations are defined.", Wasavi.getLastMessage());

		Wasavi.send(":abbreviat test\n");
		assertEquals("#2-1", "No abbreviations are defined.", Wasavi.getLastMessage());

		Wasavi.send(":abbrevia foo? bar\n");
		assertEquals("#3-1",
			"abbreviate: The keyword of abbreviation must end with a word character.", 
			Wasavi.getLastMessage());

		Wasavi.send(":abbrevi foo bar\n");
		assertTrue("#4-1", "".equals(Wasavi.getLastMessage()));
		Wasavi.send(":abbre\n");
		assertEquals("#4-2", join("\n",
			"*** abbreviations ***",
			"foo\tbar"
		), Wasavi.getLastMessage());

		Wasavi.send(":abbr bar BAZ\n");
		Wasavi.send(":abbr foo\n");
		assertEquals("#5-1", join("\n",
			"*** abbreviations ***",
			"foo\tbar"
		), Wasavi.getLastMessage());
		Wasavi.send(":abbr\n");
		assertEquals("#5-2", join("\n",
			"*** abbreviations ***",
			"bar\tBAZ",
			"foo\tbar"
		), Wasavi.getLastMessage());

		Wasavi.send(":abb [clear]\n");
		Wasavi.send(":ab\n");
		assertEquals("#6-1", "No abbreviations are defined.", Wasavi.getLastMessage());
	}

	@Test
	public void testAbbreviateAction () {
		Wasavi.send(":ab foo FOO\n");
		Wasavi.send("ifoo bar foo\u001b");
		assertValue("#1-1", "FOO bar FOO");

		Wasavi.send(":unab foo\n");
	}

	@Test
	public void testCopyBadDest () {
		Wasavi.send("i1\n2\n3\n4\n5\u001b");

		/*
		 * should be an error if destination address does not specified
		 */
		Wasavi.send(":1copy\n");
		assertEquals("#1-1", "copy: Invalid argument.", Wasavi.getLastMessage());
	}

	@Test
	public void testCopyZeroSource () {
		Wasavi.send("i1\n2\n3\u001b");

		Wasavi.send(":0copy2\n");
		assertValue("#1-1", "1\n2\n1\n3");
	}

	@Test
	public void testCopyToLower () {
		Wasavi.send("i1\n2\n3\n4\n5\u001b");
		/*
		 * copy to lower line
		 * ---------
		 *  s: source range
		 *  d: destination position
		 *  *: copied line
		 *
		 * 1 d     1 d
		 * 2 s     2 *
		 * 3 s --> 3 * final cursor line
		 * 4       2 s
		 * 5       3 s
		 *         4
		 *         5
		 */
		Wasavi.send(":2,3cop1\n");
		assertValue("#1-1", "1\n2\n3\n2\n3\n4\n5");
		assertPos("#1-2", 2, 0);
		Wasavi.send("u");
		assertValue("#1-3", "1\n2\n3\n4\n5");
		Wasavi.send("\u0012");
		assertValue("#1-4", "1\n2\n3\n2\n3\n4\n5");
	}

	@Test
	public void testCopyToLowerSpecial () {
		Wasavi.send("i1\n2\n3\n4\n5\u001b");
		/*
		 * copy to lower line, special case: before the top of buffer
		 * ---------
		 *   d       d
		 * 1       2 *
		 * 2 s     3 * final cursor line
		 * 3 s --> 1
		 * 4       2 s
		 * 5       3 s
		 *         4
		 *         5
		 */
		Wasavi.send(":2,3co0\n");
		assertValue("#1-1", "2\n3\n1\n2\n3\n4\n5");
		assertPos("#1-2", 1, 0);
		Wasavi.send("u");
		assertValue("#1-3", "1\n2\n3\n4\n5");
		Wasavi.send("\u0012");
		assertValue("#1-4", "2\n3\n1\n2\n3\n4\n5");
	}

	@Test
	public void testCopyToInsideRange () {
		Wasavi.send("i1\n2\n3\n4\n5\u001b");
		/*
		 * copy to inside range
		 * --------
		 *
		 * 1         1
		 * 2 s d     2 s d
		 * 3 s   --> 2 *
		 * 4         3 * final cursor line
		 * 5         3 s
		 *           4
		 *           5
		 */
		Wasavi.send(":2,3co2\n");
		assertValue("#1-1", "1\n2\n2\n3\n3\n4\n5");
		assertPos("#1-2", 3, 0);
		Wasavi.send("u");
		assertValue("#1-3", "1\n2\n3\n4\n5");
		Wasavi.send("\u0012");
		assertValue("#1-4", "1\n2\n2\n3\n3\n4\n5");
	}

	@Test
	public void testCopyToUpper () {
		Wasavi.send("i1\n2\n3\n4\n5\u001b");
		/*
		 * copy to upper line
		 * --------
		 *
		 * 1       1
		 * 2 s     2 s
		 * 3 s --> 3 s
		 * 4 d     4 d
		 * 5       2 *
		 *         3 * final cursor line
		 *         5
		 */
		Wasavi.send(":2,3co4\n");
		assertValue("#1-1", "1\n2\n3\n4\n2\n3\n5");
		assertPos("#1-2", 5, 0);
		Wasavi.send("u");
		assertValue("#1-3", "1\n2\n3\n4\n5");
		Wasavi.send("\u0012");
		assertValue("#1-4", "1\n2\n3\n4\n2\n3\n5");
	}

	@Test
	public void testCopyToUpperSpecial () {
		Wasavi.send("i1\n2\n3\n4\n5\u001b");
		/*
		 * copy to upper line, special case: beyond the tail of buffer
		 * --------
		 *
		 * 1       1
		 * 2 s     2 s
		 * 3 s --> 3 s
		 * 4       4
		 * 5 d     5 d
		 *         2 *
		 *         3 * final cursor line
		 */
		Wasavi.send(":2,3co5\n");
		assertValue("#1-1", "1\n2\n3\n4\n5\n2\n3");
		assertPos("#1-2", 6, 0);
		Wasavi.send("u");
		assertValue("#1-3", "1\n2\n3\n4\n5");
		Wasavi.send("\u0012");
		assertValue("#1-4", "1\n2\n3\n4\n5\n2\n3");
	}

	@Test
	public void testDelete () {
		Wasavi.send("i1\n2\n3\n4\n5\u001b");

		Wasavi.send(":2,3delete\n");
		assertValue("#1-1", "1\n4\n5");
		assertPos("#1-2", 1, 0);
		assertEquals("#1-3", "2\n3\n", Wasavi.getRegister("\""));

		Wasavi.send("u");
		assertValue("#2-1", "1\n2\n3\n4\n5");

		Wasavi.send("\u0012");
		assertValue("#3-1", "1\n4\n5");
	}

	@Test
	public void testDeleteZeroSource () {
		Wasavi.send("i1\n2\n3\n4\n5\u001b");

		Wasavi.send(":0,2delete\n");
		assertValue("#1-1", "3\n4\n5");
		assertPos("#1-2", 0, 0);
		assertEquals("#1-3", "1\n2\n", Wasavi.getRegister("\""));

		Wasavi.send("u");
		assertValue("#2-1", "1\n2\n3\n4\n5");

		Wasavi.send("\u0012");
		assertValue("#3-1", "3\n4\n5");
	}

	@Test
	public void testDeleteTail () {
		Wasavi.send("i1\n2\n3\n4\n5\u001b");

		Wasavi.send(":4,5delet a\n");
		assertValue("#1-1", "1\n2\n3");
		assertPos("#1-2", 2, 0);
		assertEquals("#1-3", "4\n5\n", Wasavi.getRegister("a"));

		Wasavi.send("u");
		assertValue("#2-1", "1\n2\n3\n4\n5");

		Wasavi.send("\u0012");
		assertValue("#3-1", "1\n2\n3");
	}

	@Test
	public void testDeleteByCount () {
		Wasavi.send("i1\n2\n3\n4\n5\u001b");

		Wasavi.send(":2dele3\n");
		assertValue("#1-1", "1\n5");
		assertPos("#1-2", 1, 0);
		assertEquals("#1-3", "2\n3\n4\n", Wasavi.getRegister("\""));

		Wasavi.send("u");
		assertValue("#2-1", "1\n2\n3\n4\n5");

		Wasavi.send("\u0012");
		assertValue("#3-1", "1\n5");
	}

	@Test
	public void testDeleteByCountWithRange () {
		/*
		 * if both range and count are specified, first range should be discarded:
		 *
		 * 1                        1
		 * 2 first                  2 first
		 * 3                        3
		 * 4 second  -- :2,4d2 -->  6
		 * 5                        7
		 * 6
		 * 7
		 *
		 * or in other words, :2,4d2 == 4,5d
		 */
		Wasavi.send("i1\n2\n3\n4\n5\n6\n7\u001b");

		Wasavi.send(":2, 4d2\n");
		assertValue("#1-1", "1\n2\n3\n6\n7");
		assertPos("#1-2", 3, 0);
		assertEquals("#1-3", "4\n5\n", Wasavi.getRegister("\""));

		Wasavi.send("u");
		assertValue("#2-1", "1\n2\n3\n4\n5\n6\n7");

		Wasavi.send("\u0012");
		assertValue("#3-1", "1\n2\n3\n6\n7");
	}

	@Test
	public void testEditReload () {
		Wasavi.send("ifoo\u001b");

		Wasavi.send(":edit\n");
		assertEquals("#1-1",
				"edit: File is modified; write or use \"!\" to override.",
				Wasavi.getLastMessage());
		assertValue("#1-2", "foo");

		Wasavi.send(":e!\n");
		assertEquals("#1-3",
				driver.findElement(By.id("t2")).getAttribute("value"),
				Wasavi.getValue());
	}

	@Test
	public void testGlobal () {
		Wasavi.send("i1 x\n2 y\n3 z\n4 x\n5 y\n6 z\u001b");

		// if range does not specified, all of text should be processed.
		Wasavi.send(":g/\\d/p\n");
		assertEquals("#1-1", "1 x\n2 y\n3 z\n4 x\n5 y\n6 z", Wasavi.getLastMessage());
		assertPos("#1-2", 5, 0);
	}

	@Test
	public void testGlobalRanged () {
		Wasavi.send("i1 x\n2 y\n3 z\n4 x\n5 y\n6 z\u001b");

		// ranged
		Wasavi.send(":3,5g/x/p\n");
		assertEquals("#1-1", "4 x", Wasavi.getLastMessage());
		assertPos("#1-2", 3, 0);
	}

	@Test
	public void testGlobalZeroMatch () {
		Wasavi.send("i1 x\n2 y\n3 z\n4 x\n5 y\n6 z\u001b");

		// zero match regexp
		Wasavi.send(":g/^/p\n");
		assertEquals("#1-1", "1 x\n2 y\n3 z\n4 x\n5 y\n6 z", Wasavi.getLastMessage());
		assertPos("#1-2", 5, 0);
	}

	@Test
	public void testGlobalWithEmptyCommand () {
		Wasavi.send("i1\n2\n3\u001b");
		Wasavi.send(":g/./\n");
		assertValue("#1-1", "1\n2\n3");
		assertEquals("#1-2", "", Wasavi.getLastMessage());
		assertPos("#1-3", 2, 0);
	}

	@Test
	public void testGlobalDelete () {
		Wasavi.send("i1 x\n2 y\n3 z\n4 x\n5 y\n6 z\u001b");

		/* init  loop1  loop2
		 * 1 x   2 y *  2 y
		 * 2 y   3 z    3 z
		 * 3 z   4 x    5 y *
		 * 4 x   5 y    6 z
		 * 5 y   6 z
		 * 6 z
		 *
		 * *: current cursor line
		 */
		Wasavi.send(":g/x/d\n");
		assertValue("#1-1", "2 y\n3 z\n5 y\n6 z");
		assertPos("#1-2", 2, 0);

		Wasavi.send("u");
		assertValue("#2-1", "1 x\n2 y\n3 z\n4 x\n5 y\n6 z");

		Wasavi.send("\u0012");
		assertValue("#3-1", "2 y\n3 z\n5 y\n6 z");
	}

	@Test
	public void testGlobalDeleteSpecial () {
		Wasavi.send("i1\n2\n3\n4\n5\n6\u001b");

		/*
		 * :g/\d/+1d
		 *
		 * 1     1*     1      1
		 * 2     3      3*     3
		 * 3 --> 4  --> 5  --> 5*
		 * 4     5      6
		 * 5     6
		 * 6
		 *
		 * *: current corsor line
		 */

		Wasavi.send(":g/\\d/+1d\n");
		assertValue("#1-1", "1\n3\n5");
		assertPos("#1-2", 2, 0);

		Wasavi.send("u");
		assertValue("#2-1", "1\n2\n3\n4\n5\n6");

		Wasavi.send("\u0012");
		assertValue("#3-1", "1\n3\n5");
	}

	@Test
	public void testGlobalWithNestDeniedCommand () {
		Wasavi.send("i1\n2\n3\u001b");

		Wasavi.send(":g/./g/./d\n");
		assertEquals("#1-1", "global: Cannot use the global or v command recursively.", Wasavi.getLastMessage());
		assertValue("#1-2", "1\n2\n3");
	}

	@Test
	public void testJoinWithCount () {
		Wasavi.send("ifirst\nsecond\nthird\nfourth\u001b");

		/*
		 * zero count is error.
		 */
		Wasavi.send("1G", ":join0\n");
		assertEquals("#0-1", "join: Count may not be zero.", Wasavi.getLastMessage());
		assertValue("#0-2", "first\nsecond\nthird\nfourth");

		/*
		 * no address was specified:
		 *
		 * first  * :j2       first second
		 * second        -->  third
		 * third              fourth
		 * fourth
		 */
		Wasavi.send("1G", ":joi!2\n");
		assertValue("#1-1", "firstsecond\nthird\nfourth");
		assertPos("#1-2", 0, 0);
		Wasavi.send("u");
		assertValue("#1-3", "first\nsecond\nthird\nfourth");

		/*
		 * one address was specified:
		 *
		 * first               first
		 * second * :2j2  -->  second third
		 * third               fourth
		 * fourth
		 */
		Wasavi.send(":2jo 2\n");
		assertValue("#2-1", "first\nsecond third\nfourth");
		assertPos("#2-2", 1, 0);
		Wasavi.send("u");
		assertValue("#2-3", "first\nsecond\nthird\nfourth");

		/*
		 * two addresses were specified:
		 *
		 * first  * :1,2j2       first second third
		 * second           -->  fourth
		 * third
		 * fourth
		 */
		Wasavi.send(":1,2j2\n");
		assertValue("#3-1", "first second third\nfourth");
		assertPos("#3-2", 0, 0);
		Wasavi.send("u");
		assertValue("#3-3", "first\nsecond\nthird\nfourth");
	}

	@Test
	public void testJoinWithNoCount () {
		Wasavi.send("ifirst\nsecond\nthird\nfourth\u001b");

		/*
		 * no address was specified:
		 *
		 * first  * :j       first second
		 * second       -->  third
		 * third             fourth
		 * fourth
		 */
		Wasavi.send("1G", ":j\n");
		assertValue("#1-1", "first second\nthird\nfourth");
		assertPos("#1-2", 0, 0);
		Wasavi.send("u");
		assertValue("#1-3", "first\nsecond\nthird\nfourth");

		/*
		 * one address was specified:
		 *
		 * first              first
		 * second * :2j  -->  second third
		 * third              fourth
		 * fourth
		 */
		Wasavi.send(":2j!\n");
		assertValue("#2-1", "first\nsecondthird\nfourth");
		assertPos("#2-2", 1, 0);
		Wasavi.send("u");
		assertValue("#2-3", "first\nsecond\nthird\nfourth");

		/*
		 * two addresses were specified:
		 *
		 * first  *              first second third
		 * second    :1,3j  -->  fourth
		 * third
		 * fourth
		 */
		Wasavi.send(":1,3j\n");
		assertValue("#3-1", "first second third\nfourth");
		assertPos("#3-2", 0, 0);
		Wasavi.send("u");
		assertValue("#3-3", "first\nsecond\nthird\nfourth");
	}

	@Test
	public void testMark () {
		Wasavi.send("i1\n2\n3\u001b");

		Wasavi.send(":2G\n:k\n");
		assertEquals("#1-1", "k: Invalid argument.", Wasavi.getLastMessage());

		Wasavi.send(":3G\n:ka\n");
		Wasavi.send(":1\n:'a\n");
		assertPos("#2-1", 2, 0);
	}

	@Test
	public void testMap () {
		Wasavi.send(":map\n");
		assertEquals("#1-1", join("\n",
			"No mappings for command mode are defined."
		), Wasavi.getLastMessage());

		Wasavi.send(":map Q 1G\n");
		Wasavi.send(":map XQ G\n");
		Wasavi.send(":map\n");
		assertEquals("#2-1", join("\n",
			"*** command mode map ***",
			"Q \t1G",
			"XQ\tG"
		), Wasavi.getLastMessage());

		Wasavi.send(":map X\n");
		assertEquals("#3-1", join("\n",
			"*** command mode map ***",
			"XQ\tG"
		), Wasavi.getLastMessage());

		Wasavi.send(":map [clear]\n");
		Wasavi.send(":map\n");
		assertEquals("#4-1", join("\n",
			"No mappings for command mode are defined."
		), Wasavi.getLastMessage());
	}

	@Test
	public void mapSpecialKey () {
		Wasavi.send(":map [clear]\n");
		Wasavi.send(":map Q <down><down>$\n");

		Wasavi.send("i1\n2\n3 here!\n4\u001bgg");
		assertPos("#1-1", 0, 0);
		Wasavi.send("Q");
		assertPos("#1-2", 2, 6);

		Wasavi.send(":map <down> <up>\nG");
		Wasavi.send(Keys.ARROW_DOWN);
		assertPos("#2-1", 2, 0);
	}

	@Test
	public void testMapUnique () {
		Wasavi.send(":map [clear]\n");
		Wasavi.send(":map Q G\ni1\n2\n3\u001bgg");
		assertPos("#1-1", 0, 0);
		Wasavi.send("Q");
		assertPos("#2-1", 2, 0);

		Wasavi.send(":map <f1> <esc>if1\u0016\u0016 key\u0016\u0016 pressed<esc>\n");
		Wasavi.send(Keys.F1);
		assertValue("#3-1", "1\n2\nf1 key pressed3");
	}

	@Test
	public void testMapAmbiguous () {
		Wasavi.send(":map [clear]\n");
		Wasavi.send(":map Q 1G\n");
		Wasavi.send(":map QQ G\n");
		Wasavi.send("i1\n2\n3\n4\n5\u001b");
			
		// ambiguous, timed out
		Wasavi.send("Q");
		assertPos("#1-1", 0, 0);

		// ambiguous, not timed out
		Wasavi.send("G","Qj");
		assertPos("#2-1", 1, 0);

		//
		Wasavi.send("QQ");
		assertPos("#3-1", 4, 0);

		//
		Wasavi.send("QQk");
		assertPos("#4-1", 3, 0);
	}

	@Test
	public void testNestedMap () {
		Wasavi.send(":map [clear]\n");
		Wasavi.send(":map Q G\n");
		Wasavi.send(":map q Q\n");
		Wasavi.send("i1\n2\n3\n4\n5\u001b");

		Wasavi.send("ggq");
		assertPos("#1-1", 4, 0);

		Wasavi.send(":map [noremap] q Q\n");
		Wasavi.send("ggq");
		assertPos("#2-1", 0, 0);
	}

	@Test
	public void testEditMapUnique () {
		Wasavi.send(":map! [clear]\n");
		Wasavi.send(":map! Q quick\u0016\u0016 brown\u0016\u0016 fox\n");

		Wasavi.send("iQ!\u001b");
		assertValue("#1-1", "quick brown fox!");
	}

	@Test
	public void testMark2 () {
		Wasavi.send("i1\n2\n3\u001b");

		Wasavi.send(":2G\n:mark\n");
		assertEquals("#1-1", "mark: Invalid argument.", Wasavi.getLastMessage());

		Wasavi.send(":3G\n:mark a\n");
		Wasavi.send(":1\n:'a\n");
		assertPos("#2-1", 2, 0);
	}

	@Test
	public void testMarks () {
		Wasavi.send("i1 first\n2 second\n3 third\u001b");

		Wasavi.send(":marks\n");
		assertEquals("#1-1", join("\n",
			"*** marks ***",
			"mark  line   col   text",
			"====  =====  ====  ====",
			" ^        3     6  3 third"
		), Wasavi.getLastMessage());

		Wasavi.send("1G", "1|:mark a\n");
		Wasavi.send(":marks\n");
		assertEquals("#2-1", join("\n",
			"*** marks ***",
			"mark  line   col   text",
			"====  =====  ====  ====",
			" ^        3     6  3 third",
			" '        3     6  3 third",
			" a        1     0  1 first"
		), Wasavi.getLastMessage());

		Wasavi.send("2G", "2|:mark b\n");
		Wasavi.send(":marks\n");
		assertEquals("#3-1", join("\n",
			"*** marks ***",
			"mark  line   col   text",
			"====  =====  ====  ====",
			" ^        3     6  3 third",
			" '        1     0  1 first",
			" a        1     0  1 first",
			" b        2     0  2 second"
		), Wasavi.getLastMessage());
	}

	@Test
	public void testMove () {
		Wasavi.send("i1\n2\n3\n4\n5\u001b");

		/*
		 * test #1: move to lower
		 *
		 * 1 *       1
		 * 2         3
		 * 3 +  -->  4
		 * 4 +       5.
		 * 5 +       2
		 */
		Wasavi.send(":3,5move1\n");
		assertValue("#1-1", "1\n3\n4\n5\n2");
		assertPos("#1-2", 3, 0);
		Wasavi.send("u");
		assertValue("#1-3", "1\n2\n3\n4\n5");
		Wasavi.send("\u0012");
		assertValue("#1-4", "1\n3\n4\n5\n2");
		Wasavi.send("u");
		assertValue("#1-5", "1\n2\n3\n4\n5");

		/*
		 * test #2: move to top
		 *   *
		 * 1         3
		 * 2         4
		 * 3 +  -->  5.
		 * 4 +       1
		 * 5 +       2
		 */
		Wasavi.send(":3,5move0\n");
		assertValue("#2-1", "3\n4\n5\n1\n2");
		assertPos("#2-2", 2, 0);
		Wasavi.send("u");
		assertValue("#2-3", "1\n2\n3\n4\n5");
		Wasavi.send("\u0012");
		assertValue("#2-4", "3\n4\n5\n1\n2");
		Wasavi.send("u");
		assertValue("#2-5", "1\n2\n3\n4\n5");

		/*
		 * test #3: move to inside source
		 * (espesially, destination address 2 and 5 are allowed, and no changes is happen.)
		 *
		 * 1
		 * 2  !
		 * 3 +*
		 * 4 +*
		 * 5 +!
		 */
		int[] rows = {2, 3, 4, 5};
		for (int dest: rows) {
			Wasavi.send(String.format(":3,5mov%d\n", dest));
			if (dest == 2 || dest == 5) {
				assertValue(String.format("#3-1(%d)", dest), "1\n2\n3\n4\n5");
				Wasavi.send("u");
				assertValue(String.format("#3-2(%d)", dest), "1\n2\n3\n4\n5");
			}
			else {
				assertEquals(String.format("#3-3(%d)", dest),
					"move: Destination is in inside source.", Wasavi.getLastMessage());
			}
		}
		assertValue("#3-4", "1\n2\n3\n4\n5");

		/*
		 * test #4: move to upper
		 *
		 * 1 +       4 *      4
		 * 2 +       5        1
		 * 3 +  -->      -->  2
		 * 4 *                3.
		 * 5                  5
		 */
		Wasavi.send(":1,3move4\n");
		assertValue("#4-1", "4\n1\n2\n3\n5");
		assertPos("#4-2", 3, 0);
		Wasavi.send("u");
		assertValue("#4-3", "1\n2\n3\n4\n5");
		Wasavi.send("\u0012");
		assertValue("#4-4", "4\n1\n2\n3\n5");
		Wasavi.send("u");
		assertValue("#4-5", "1\n2\n3\n4\n5");

		/*
		 * test #5: move to tail
		 *
		 * 1 +       4        4
		 * 2 +       5 *      5
		 * 3 +  -->      -->  1
		 * 4                  2
		 * 5 *                3.
		 */
		Wasavi.send(":1,3move5\n");
		assertValue("#5-1", "4\n5\n1\n2\n3");
		assertPos("#5-2", 4, 0);
		Wasavi.send("u");
		assertValue("#5-3", "1\n2\n3\n4\n5");
		Wasavi.send("\u0012");
		assertValue("#5-4", "4\n5\n1\n2\n3");
		Wasavi.send("u");
		assertValue("#5-5", "1\n2\n3\n4\n5");
	}

	@Test
	public void testPrint () {
		Wasavi.send("i1\t$\u0016\u0010\\\n2\n3\n4\n5\u001b");

		Wasavi.send(":print\n");
		assertEquals("#1-1", "5", Wasavi.getLastMessage());

		Wasavi.send(":1,2print\n");
		assertEquals("#2-1", "1\t$\u0010\\\n2", Wasavi.getLastMessage());

		Wasavi.send(":2\n");
		Wasavi.send(":print3\n");
		assertEquals("#3-1", "2\n3\n4", Wasavi.getLastMessage());

		Wasavi.send(":1,3print2\n");
		assertEquals("#4-1", "3\n4", Wasavi.getLastMessage());

		/*
		 * list command conversion:
		 *
		 * native       list
		 * ------  -->  ----
		 * 1            1
		 * <u+0009>     <u+0009>
		 * $            \$
		 * <u+0010>     \020
		 * \            \\
		 * <eol>        $
		 */
		Wasavi.send(":1p l\n");
		assertEquals("#5-1", "1\t\\$\\020\\\\$", Wasavi.getLastMessage());

		/*
		 * number command
		 *
		 * number format: sprintf("%6d  ", line_number)
		 */
		Wasavi.send(":1p #\n");
		assertEquals("#6-1", "     1  1\t$\u0010\\", Wasavi.getLastMessage());

		/*
		 * number + line command
		 */
		Wasavi.send(":1p #l\n");
		assertEquals("#7-1", "     1  1\t\\$\\020\\\\$", Wasavi.getLastMessage());
		Wasavi.send(":1p #lp\n");
		assertEquals("#7-2", "     1  1\t\\$\\020\\\\$", Wasavi.getLastMessage());
	}

	@Test
	public void testPut () {
		Wasavi.send("ifoo\nbar\u001b");

		Wasavi.send("1G", "1|yy");
		Wasavi.send(":put\n");
		assertValue("#1-1", "foo\nfoo\nbar");
		assertPos("#1-2", 1, 0);

		Wasavi.send("1G", "1|yw");
		Wasavi.send(":put\n");
		assertValue("#2-1", "foo\nfoo\nfoo\nbar");
		assertPos("#2-2", 1, 0);

		Wasavi.send("G", "\"ayy");
		Wasavi.send(":2pu a\n");
		assertValue("#3-1", "foo\nfoo\nbar\nfoo\nbar");
		assertPos("#3-2", 2, 0);

		Wasavi.send(":pu z\n");
		assertValue("#4-1", "foo\nfoo\nbar\nfoo\nbar");
		assertPos("#4-2", 2, 0);
		assertEquals("#4-3", "put: Register z is empty.", Wasavi.getLastMessage());

		setClipboardText("clipboard text");
		Wasavi.send("G", ":0pu *\n");
		assertValue("#5-1", "clipboard text\nfoo\nfoo\nbar\nfoo\nbar");
		assertPos("#5-2", 0, 0);
	}

	@Test
	public void testQuit () {
		Wasavi.sendNoWait(":quit\n");

		Boolean vanished = Wasavi.waitTerminate();
		assertTrue("wasaviFrame must not be exist.", vanished);
	}

	@Test
	public void testQuitForce () {
		Wasavi.send("ifoo\u001b");

		Wasavi.send(":qui\n");
		WebElement wasaviFrame = driver.findElement(By.id("wasavi_frame"));
		assertNotNull(wasaviFrame);
		assertEquals("#1-1", "quit: The text has been modified; use :quit! to discard any changes.", Wasavi.getLastMessage());

		Wasavi.sendNoWait(":qu!\n");
		Boolean vanished = Wasavi.waitTerminate();
		assertTrue("wasaviFrame must not be exist.", vanished);
	}

	@Test
	public void testUndoAndRedo () {
		Wasavi.send(":undo\n");
		assertEquals("#1-1", "undo: No undo item.", Wasavi.getLastMessage());

		Wasavi.send("i1\n2\n3\u001b");
		assertValue("#2-1", "1\n2\n3");

		Wasavi.send(":undo\n");
		assertValue("#3-1", "");

		Wasavi.send(":redo\n");
		assertValue("#4-1", "1\n2\n3");

		Wasavi.send(":redo\n");
		assertEquals("#5-1", "redo: No redo item.", Wasavi.getLastMessage());
	}

	@Test
	public void testSubst () {
		Wasavi.send("ia a\nb b b\n\nc\nd\u001b");

		Wasavi.send("1G", ":s/a/A\n");
		assertValue("#1-1", "A a\nb b b\n\nc\nd");
		Wasavi.send("u");
		assertValue("#1-2", "a a\nb b b\n\nc\nd");
		Wasavi.send("\u0012");
		assertValue("#1-3", "A a\nb b b\n\nc\nd");
		Wasavi.send("u");
		assertValue("#1-4", "a a\nb b b\n\nc\nd");

		Wasavi.send("2G", ":s/b/B/g\n");
		assertValue("#2-1", "a a\nB B B\n\nc\nd");
		Wasavi.send("u");
		assertValue("#2-2", "a a\nb b b\n\nc\nd");
		Wasavi.send("\u0012");
		assertValue("#2-3", "a a\nB B B\n\nc\nd");
		Wasavi.send("u");
		assertValue("#2-4", "a a\nb b b\n\nc\nd");

		/*
		 * a a   +        a a
		 * b b b +        b b b
		 *       ++  -->
		 * c      +       ?
		 * d
		 */
		Wasavi.send(":1,3s/[a-d]/?/g2\n");
		assertValue("#4-1", "a a\nb b b\n\n?\nd");
		Wasavi.send("u");
		assertValue("#4-2", "a a\nb b b\n\nc\nd");
		Wasavi.send("\u0012");
		assertValue("#4-3", "a a\nb b b\n\n?\nd");
		Wasavi.send("u");
		assertValue("#4-4", "a a\nb b b\n\nc\nd");
	}

	@Test
	public void testSubst2 () {
		Wasavi.send("iaaaa\nbbbb\u001b");
		Wasavi.send("1G", ":%s/a/b/g\n");

		assertValue("bbbb\nbbbb");
	}

	@Test
	public void testSubst3 () {
		Wasavi.send("i\ta\n\tb\u001b");
		Wasavi.send("1G", ":%s/^\\t\\+/!/g\n");

		assertValue("!a\n!b");
	}

	@Test
	public void testSubstPatternOmit () {
		Wasavi.send(":sushi\n");
		Wasavi.send("i1\n2\n3\u001b");

		Wasavi.send(":s//foo\n");
		assertEquals("#1-1", "s: No previous search pattern.", Wasavi.getLastMessage());

		Wasavi.send("gg", "/\\d\n");
		assertPos("#2-1", 1, 0);
		Wasavi.send(":s//foo\n");
		assertValue("#2-2", "1\nfoo\n3");
	}

	@Test
	public void testSubstReplOmit () {
		Wasavi.send(":sushi\n");
		Wasavi.send("i1\n2\n3\u001b");

		Wasavi.send(":s/\\d//\n");
		assertValue("#1-1", "1\n2\n");
	}

	@Test
	public void testSubstOmitAll () {
		Wasavi.send(":sushi\n");
		Wasavi.send("i1\n2\n3\u001b");

		Wasavi.send(":s//\n");
		assertEquals("#1-1", "s: No previous substitution.", Wasavi.getLastMessage());

		Wasavi.send(":s/\\d/foo\n");
		assertValue("#2-1", "1\n2\nfoo");
		Wasavi.send(":1\n");
		Wasavi.send(":s//\n");
		assertValue("#2-2", "foo\n2\nfoo");
	}

	@Test
	public void testSubstLastReplacement () {
		Wasavi.send(":sushi\n");
		Wasavi.send("i1\n2\n3\u001b");

		Wasavi.send(":s/\\d/%\n");
		assertEquals("#1-1", "s: No previous substitution.", Wasavi.getLastMessage());

		Wasavi.send(":s/\\d/!\n");
		assertValue("#2-1", "1\n2\n!");
		Wasavi.send(":1\n");
		Wasavi.send(":s/\\d/%\n");
		assertValue("#2-2", "!\n2\n!");
	}

	@Test
	public void testSubstTildeReplacement () {
		Wasavi.send(":sushi\n");
		Wasavi.send("i1\n2\n3\u001b");

		Wasavi.send(":s/\\d/~\n");
		assertEquals("#1-1", "s: No previous substitution.", Wasavi.getLastMessage());

		Wasavi.send(":s/\\d/$\n");
		assertValue("#2-1", "1\n2\n$");
		Wasavi.send(":1\n");
		Wasavi.send(":s/\\d/~!!\n");
		assertValue("#2-2", "$!!\n2\n$");

		Wasavi.send(":2\n");
		Wasavi.send(":s/\\d/%\n");
		/*
		 * different from vim.
		 * vim's result is $!!\n$!!!!\n$
		 */
		assertValue("#3-1", "$!!\n$!!\n$");
	}

	@Test
	public void testSubstQueried () {
		Wasavi.send("ifirst\nsecond\nthird\u001b");

		Wasavi.send("1G", ":%s/i/I/gc\n");
		Wasavi.send("y", "y");
		assertEquals("#1-1", "2 substitutions on 3 lines.", Wasavi.getLastMessage());
		assertValue("#1-2", "fIrst\nsecond\nthIrd");
		assertPos("#1-3", 2, 0);

		Wasavi.send("u");
		assertValue("#2-1", "fIrst\nsecond\nthird");

		Wasavi.send("u");
		assertValue("#3-1", "first\nsecond\nthird");
	}

	@Test
	public void testSubstQueriedNonMatch () {
		Wasavi.send("ifirst\nsecond\nthird\u001b");

		Wasavi.send("2G", "3|");
		Wasavi.send(":%s/foo/bar/gc\n");
		assertPos("#1-1", 1, 2);

		Wasavi.send("1G", "1|");
		Wasavi.send(":%s/i/!/gc\n");
		Wasavi.send("yn");
		assertPos("#2-1", 2, 0);
	}

	@Test
	public void testSubstNewline () {
		Wasavi.send("i1\n2\n3\n4\u001b");
		Wasavi.send(":%s/\\d/&\\nline/g\n");
		assertValue("#1-1", "1\nline\n2\nline\n3\nline\n4\nline");
		assertPos("#1-2", 7, 0);

		Wasavi.send(":1\n");
		Wasavi.send(":s/\\d/&\u0016\012LINE/g\n");
		assertValue("#2-1", "1\nLINE\nline\n2\nline\n3\nline\n4\nline");
		assertPos("#2-2", 1, 0);
	}

	@Test
	public void testSubstBackref () {
		Wasavi.send("ifunction foo () {}\u001b");
		Wasavi.send(":s/\\(function\\)\\s\\+\\(\\w\\+\\)\\(.*\\)/var \\2=\\1\\3\n");
		assertValue("#1-1", "var foo=function () {}");
	}

	@Test
	public void testSubstLower () {
		Wasavi.send("iFIRST\nSECOND\nTHIRD\u001b");
		Wasavi.send(":%s/\\w\\+/\\l&/g\n");
		assertValue("#1-1", "fIRST\nsECOND\ntHIRD");

		Wasavi.send("u");
		assertValue("#2-1", "FIRST\nSECOND\nTHIRD");
		Wasavi.send(":%s/\\w\\+/\\L&/g\n");
		assertValue("#2-2", "first\nsecond\nthird");

		Wasavi.send("u");
		assertValue("#3-1", "FIRST\nSECOND\nTHIRD");
		Wasavi.send(":%s/\\w\\+/\\L&\\E \\lLine/g\n");
		assertValue("#3-2", "first line\nsecond line\nthird line");
	}

	@Test
	public void testSubstUpper () {
		Wasavi.send("ifirst\nsecond\nthird\u001b");
		Wasavi.send(":%s/\\w\\+/\\u&/g\n");
		assertValue("#1-1", "First\nSecond\nThird");

		Wasavi.send("u");
		assertValue("#2-1", "first\nsecond\nthird");
		Wasavi.send(":%s/\\w\\+/\\U&/g\n");
		assertValue("#2-2", "FIRST\nSECOND\nTHIRD");

		Wasavi.send("u");
		assertValue("#3-1", "first\nsecond\nthird");
		Wasavi.send(":%s/\\w\\+/\\U&\\E \\uline/g\n");
		assertValue("#3-2", "FIRST Line\nSECOND Line\nTHIRD Line");
	}

	@Test
	public void testSubstAnd () {
		Wasavi.send(":sushi\n");
		Wasavi.send("i1\n2\n3\u001b");

		Wasavi.send(":&\n");
		assertEquals("#1-1", "&: No previous search pattern.", Wasavi.getLastMessage());

		Wasavi.send("1G", ":s/\\d/!/c\ny");
		assertValue("#2-1", "!\n2\n3");

		Wasavi.send("2G", ":&\n");
		assertValue("#3-1", "!\n!\n3");

		Wasavi.send(":%&g\n");
		assertValue("#4-1", "!\n!\n!");
	}

	@Test
	public void testSubstAnd2 () {
		Wasavi.send(":sushi\n");
		Wasavi.send("i1\n2\n3\u001b");

		Wasavi.send("&");
		assertEquals("#1-1", "&: No previous search pattern.", Wasavi.getLastMessage());

		Wasavi.send("1G", ":s/\\d/!/c\ny");
		assertValue("#2-1", "!\n2\n3");

		Wasavi.send("2G", "&");
		assertValue("#3-1", "!\n!\n3");
	}

	@Test
	public void testSubstTilde () {
		Wasavi.send(":sushi\n");
		Wasavi.send("i1\n2\n3\u001b");

		Wasavi.send(":~\n");
		assertEquals("#1-1", "~: No previous search pattern.", Wasavi.getLastMessage());

		Wasavi.send("1G", ":s/\\d/&!/c\ny");
		assertValue("#2-1", "1!\n2\n3");

		Wasavi.send("2G", ":~\n");
		assertValue("#3-1", "1!\n2!\n3");

		Wasavi.send(":%~g\n");
		assertValue("#4-1", "1!!\n2!!\n3!");

		Wasavi.send("1G", "/!\n");
		Wasavi.send(":%~g\n");
		assertValue("#5-1", "1!!!!\n2!!!!\n3!!");
	}

	@Test
	public void testSubstMatchedEmpty () {
		Wasavi.send(":sushi\n");
		Wasavi.send("i1*\n012\n3*\u001b");

		Wasavi.send("1G", ":s/\\*\\?$/<\\/li>/g\n");
		assertValue("#1-1", "1</li>\n012\n3*");

		Wasavi.send("2G", ":s/a\\?/!/g\n");
		assertValue("#1-2", "1</li>\n!0!1!2\n3*");
	}

	@Test
	public void testSet () {
		Wasavi.send(":set\n");
		System.out.println(Wasavi.getLastMessage());
		assertTrue("#1-1", Wasavi.getLastMessage().indexOf("*** options ***\n") == 0);

		Wasavi.send(":set all\n");
		assertTrue("#2-1", Wasavi.getLastMessage().indexOf("*** options ***\n") == 0);

		Wasavi.send(":set foobar\n");
		assertEquals("#3-1", "Unknown option: foobar", Wasavi.getLastMessage());

		Wasavi.send(":set redraw\n");
		assertEquals("#4-1", "", Wasavi.getLastMessage());
		Wasavi.send(":set redraw?\n");
		assertEquals("#4-2", "  redraw", Wasavi.getLastMessage());

		Wasavi.send(":set noredraw\n");
		assertEquals("#5-1", "", Wasavi.getLastMessage());
		Wasavi.send(":set redraw?\n");
		assertEquals("#5-2", "noredraw", Wasavi.getLastMessage());
		
		Wasavi.send(":set redraw=5\n");
		assertEquals(
			"#6-1", 
			"An extra value assigned to redraw option: redraw=5", 
			Wasavi.getLastMessage());

		Wasavi.send(":set report=10\n");
		assertEquals("#7-1", "", Wasavi.getLastMessage());
		Wasavi.send(":set report ?\n");
		assertEquals("#7-2", "  report=10", Wasavi.getLastMessage());
		Wasavi.send(":set report = 6\n");
		assertEquals("#7-3", "Invalid integer value: report=", Wasavi.getLastMessage());
		Wasavi.send(":set report =6\n");
		assertEquals("#7-4", "", Wasavi.getLastMessage());
		Wasavi.send(":set report\n");
		assertEquals("#7-5", "  report=6", Wasavi.getLastMessage());
	}

	@Test
	public void testRegisters () {
		Wasavi.send(":registers\n");
		assertEquals("#1-1", join("\n",
			"*** registers ***",
			"\"\"  C  ",
			"\":  C  registers"
		), Wasavi.getLastMessage());

		Wasavi.send("i1\n2\n3\u001b");
		Wasavi.send("yy");
		Wasavi.send(":reg\n");
		assertEquals("#2-1", join("\n",
			"*** registers ***",
			"\"\"  L  3^J",
			"\".  C  1^J2^J3",
			"\":  C  reg"
		), Wasavi.getLastMessage());
	}

	@Test
	public void testUnabbreviate () {
		Wasavi.send(":ab foo bar\n:ab\n");
		assertEquals("#1-1", join("\n",
			"*** abbreviations ***",
			"foo\tbar"
		), Wasavi.getLastMessage());

		Wasavi.send(":unabbreviate\n");
		assertEquals("#2-1", "unabbreviate: Invalid argument.", Wasavi.getLastMessage());

		Wasavi.send(":unabb xyz\n");
		assertEquals("#3-1", "unabbreviate: xyz is not an abbreviation.", Wasavi.getLastMessage());

		Wasavi.send(":unabb foo\n");
		assertEquals("#4-1", "", Wasavi.getLastMessage());

		Wasavi.send(":ab\n");
		assertEquals("#5-1", "No abbreviations are defined.", Wasavi.getLastMessage());
	}

	@Test
	public void testUnmap () {
		Wasavi.send(":map [clear]\n");
		Wasavi.send(":unmap\n");
		assertEquals("#1-1", "unmap: Invalid argument.", Wasavi.getLastMessage());

		Wasavi.send(":map H ^\n");
		Wasavi.send(":map\n");
		assertEquals("#1-1", join("\n",
			"*** command mode map ***",
			"H\t^"
		), Wasavi.getLastMessage());

		Wasavi.send(":unma xyz\n");
		assertEquals("#2-1", "unmap: xyz is not mapped.", Wasavi.getLastMessage());

		Wasavi.send(":unm H\n");
		Wasavi.send(":map\n");
		assertEquals("#3-1", "No mappings for command mode are defined.", Wasavi.getLastMessage());
	}

	@Test
	public void testVersion () {
		Wasavi.send(":version\n");
		assertTrue("#1-1", Pattern.matches("^wasavi/\\d+\\.\\d+\\.\\d+.*", Wasavi.getLastMessage()));
	}

	@Test
	public void testInvertedGlobal () {
		Wasavi.send("i1 x\n2\n3 z\n4 x\n5 y\n6 z\u001b");

		// if range does not specified, all of text should be processed.
		Wasavi.send(":v/x/p\n");
		assertEquals("#1-1", "2\n3 z\n5 y\n6 z", Wasavi.getLastMessage());
		assertPos("#1-2", 5, 0);
	}

	@Test
	public void testInvertedGlobalRanged () {
		Wasavi.send("i1 x\n2 y\n3 z\n4 x\n5 y\n6 z\u001b");

		// ranged
		Wasavi.send(":3,5v/x/p\n");
		assertEquals("#1-1", "3 z\n5 y", Wasavi.getLastMessage());
		assertPos("#1-2", 4, 0);
	}

	@Test
	public void testInvertedGlobalZeroMatch () {
		Wasavi.send("i1 x\n2 y\n3 z\n4\n5\u001b");

		// zero match regexp
		/*
		 * 1 x
		 * 2 y +
		 * 3 z +
		 * 4   +
		 * 5
		 */
		Wasavi.send(":2,4v/^/p\n");
		assertEquals("#1-1", "v: Pattern found in every line: ^", Wasavi.getLastMessage());
		assertPos("#1-2", 4, 0);
	}

	@Test
	public void testInvertedGlobalWithEmptyCommand () {
		Wasavi.send("ia\nb\nc\u001b");
		Wasavi.send(":v/b/\n");
		assertValue("#1-1", "a\nb\nc");
		assertEquals("#1-2", "", Wasavi.getLastMessage());
		assertPos("#1-3", 2, 0);
	}

	@Test
	public void testInvertGlobalWithNestDeniedCommand () {
		Wasavi.send("i1\n2\n3\u001b");

		Wasavi.send(":v/^2/g/./d\n");
		assertEquals("#1-1", "v: Cannot use the global or v command recursively.", Wasavi.getLastMessage());
		assertValue("#1-2", "1\n2\n3");
	}

	@Test
	public void testWrite () {
		Wasavi.send("ifoobar\u001b");
		Wasavi.send(":write\n");

		String text = driver.findElement(By.id(wasaviTargetID)).getAttribute("value");
		assertEquals("#1-1", "foobar", text);
	}

	@Test
	public void writeToContentEditable () {
		Wasavi.send("ifoobar\u001b");
		Wasavi.send(":write\n");

		String text = driver.findElement(By.id(wasaviTargetID)).getText();
		assertEquals("#1-1", "foobar", text);
	}

	@Test
	public void testWriteToFile () {
		Wasavi.send("ifoobar\u001b");
		Wasavi.send(":writ test/foobar\n");
		Wasavi.waitCommandCompletion();
		assertEquals("#1-1", "Written: \"dropbox:/test/foobar\" [unix] 1 line, 6 characters.", Wasavi.getLastMessage());
	}

	@Test
	public void testWriteToFileAppend () {
		Wasavi.send(":wri >>\n");
		// not implemented, for now
		assertEquals("#1-1", "write: Appending is not implemented.", Wasavi.getLastMessage());
	}

	@Test
	public void testWriteRedirect () {
		Wasavi.send(":wri !foobar\n");
		// not implemented, for now
		assertEquals("#1-1", "write: Command redirection is not implemented.", Wasavi.getLastMessage());
	}

	@Test
	public void testWriteWarnWithReadonlyOption () {
		Wasavi.send("ifoobar\u001b");
		Wasavi.send(":set readonly\n");
		Wasavi.send(":w\n");
		assertEquals("#1-1", "write: Readonly option is set (use \"!\" to override).", Wasavi.getLastMessage());
		assertEquals("#1-2", "", driver.findElement(By.id("t2")).getAttribute("value"));
	}

	@Test
	public void testWriteWarnWithReadonlyElement () {
		Wasavi.send("ifoobar\u001b:w\n");
		assertEquals("#1-1", "write: Readonly option is set (use \"!\" to override).", Wasavi.getLastMessage());
		assertEquals("#1-2", "", driver.findElement(By.id("t2")).getAttribute("value"));
	}

	@Test
	public void testForceWriteWithReadonlyOption () {
		Wasavi.send("ifoobar\u001b:set readonly|w!\n");
		sleep(1000);
		assertEquals("#1-1", "Written: \"TEXTAREA#t2\" [unix] 1 line, 6 characters.", Wasavi.getLastMessage());
		assertEquals("#1-2", "foobar", driver.findElement(By.id("t2")).getAttribute("value"));
	}

	@Test
	public void testForceWriteWithReadonlyElement () {
		Wasavi.send("ifoobar\u001b:w!\n");
		sleep(1000);
		assertEquals("#1-1", "Written: \"TEXTAREA#t2\" [unix] 1 line, 6 characters.", Wasavi.getLastMessage());
		assertEquals("#1-2", "foobar", driver.findElement(By.id("t2")).getAttribute("value"));
	}

	@Test
	public void testWriteAndQuit () {
		Wasavi.send("ifoobar\u001b");
		Wasavi.sendNoWait(":wq\n");

		Boolean vanished = Wasavi.waitTerminate();
		assertTrue("wasaviFrame must not be exist.", vanished);

		String text = driver.findElement(By.id("t2")).getAttribute("value");
		assertEquals("#1-1", "foobar", text);
	}

	@Test
	public void testExitModified () {
		Wasavi.send("ifoobar\u001b");
		Wasavi.sendNoWait(":xit\n");

		Boolean vanished = Wasavi.waitTerminate();
		assertTrue("wasaviFrame must not be exist.", vanished);

		String text = driver.findElement(By.id("t2")).getAttribute("value");
		assertEquals("#1-1", "foobar", text);
	}

	@Test
	public void testExitNotModified () {
		Wasavi.sendNoWait(":xit\n");

		Boolean vanished = Wasavi.waitTerminate();
		assertTrue("wasaviFrame must not be exist.", vanished);

		String text = driver.findElement(By.id("t2")).getAttribute("value");
		assertEquals("#1-1", "", text);
	}

	@Test
	public void testYank () {
		Wasavi.send(":set noai\n");
		Wasavi.send("i\t1.\n2.\n3.\u001b");
		Wasavi.send("1G", "$");
		assertPos("#1-1", 0, 2);

		Wasavi.send(":yank\n");
		assertEquals("#2-1", "\t1.\n", Wasavi.getRegister("\""));
		assertPos("#2-2", 0, 2);

		Wasavi.send(":1,2yan a\n");
		assertEquals("#3-1", "\t1.\n2.\n", Wasavi.getRegister("a"));
		assertPos("#3-2", 0, 2);

		Wasavi.send(":2,3yan *\n");
		assertEquals("#4-1", "2.\n3.\n", Wasavi.getRegister("*"));
		assertEquals("#4-2", "2.\n3.\n", getClipboardText());
		assertPos("#4-3", 0, 2);

		Wasavi.send(":ya10\n");
		assertEquals("#5-1", "\t1.\n2.\n3.\n", Wasavi.getRegister("\""));
		assertPos("#5-2", 0, 2);
	}

	@Test
	public void testShift () {
		Wasavi.send(":set sw=8 noai\n");
		Wasavi.send("i\t1\n2\n3\u001b");
		Wasavi.send("1G", "1|");
		assertPos("#1-1", 0, 0);

		Wasavi.send(":>\n");
		assertValue("#2-1", "\t\t1\n2\n3");
		assertPos("#2-2", 0, 2);

		Wasavi.send(":undo\n");
		assertValue("#3-1", "\t1\n2\n3");

		Wasavi.send(":redo\n");
		assertValue("#4-1", "\t\t1\n2\n3");
	}

	@Test
	public void testShiftMulti () {
		Wasavi.send(":set sw=8 noai\n");
		Wasavi.send("i\t1\n2\n3\u001b");
		Wasavi.send("1G", "1|");
		assertPos("#1-1", 0, 0);

		Wasavi.send(":>>2\n");
		assertValue("#2-1", "\t\t\t1\n\t\t2\n3");
		assertPos("#2-2", 1, 2);

		Wasavi.send(":undo\n");
		assertValue("#3-1", "\t1\n2\n3");

		Wasavi.send(":redo\n");
		assertValue("#4-1", "\t\t\t1\n\t\t2\n3");
	}

	@Test
	public void testUnshift () {
		Wasavi.send(":set sw=8 noai\n");
		Wasavi.send("i\t\t1\n\t2\n3\u001b");
		Wasavi.send("1G", "1|");
		assertPos("#1-1", 0, 0);

		Wasavi.send(":<\n");
		assertValue("#2-1", "\t1\n\t2\n3");
		assertPos("#2-2", 0, 1);

		Wasavi.send(":undo\n");
		assertValue("#3-1", "\t\t1\n\t2\n3");

		Wasavi.send(":redo\n");
		assertValue("#4-1", "\t1\n\t2\n3");
	}

	@Test
	public void testUnshiftMulti () {
		Wasavi.send(":set sw=8 noai\n");
		Wasavi.send("i\t\t\t1\n\t2\n3\u001b");
		Wasavi.send("1G", "1|");
		assertPos("#1-1", 0, 0);

		Wasavi.send(":<<2\n");
		assertValue("#2-1", "\t1\n2\n3");
		assertPos("#2-2", 1, 0);

		Wasavi.send(":undo\n");
		assertValue("#3-1", "\t\t\t1\n\t2\n3");

		Wasavi.send(":redo\n");
		assertValue("#4-1", "\t1\n2\n3");
	}

	@Test
	public void testExecuteRegister () {
		Wasavi.send("is/\\d/\tfoo\u0016\u001b\\n\u0016\u0009\u001b");
		assertValue("#1-1", "s/\\d/\tfoo\u001b\\n\t");
		Wasavi.send("\"ayy");
		assertEquals("#1-2", "s/\\d/\tfoo\u001b\\n\t\n", Wasavi.getRegister("a"));
		Wasavi.send("u");
		assertValue("#1-3", "");
		assertPos("#1-4", 0, 0);

		Wasavi.send("i1\n2\n3\u001b");
		Wasavi.send(":%@a\n");
		assertValue("#2-1", "1\n2\n\tfoo\u001b\n\t");
	}

	@Test
	public void testFileWithoutFileName () {
		Wasavi.send(":file\n");
		assertEquals("#1-1", "\"TEXTAREA#t2\" [unix] --No lines in buffer--", Wasavi.getLastMessage());
	}

	@Test
	public void testFileWithFileName () {
		Wasavi.send(":file foobar.txt\n");
		assertEquals("#1-1", "file: Only stand alone form can rename.", Wasavi.getLastMessage());
	}
}

/* vim:set ts=4 sw=4 fileencoding=UTF-8 fileformat=unix filetype=java : */
