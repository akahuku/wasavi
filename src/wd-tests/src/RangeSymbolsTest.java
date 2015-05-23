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

public class RangeSymbolsTest extends WasaviTest {

	//

	@Test
	public void doubleQuote_All_Outer () {
		Wasavi.send("iabc  \"def\"  ghi\u001b");
		Wasavi.send("0ya\"");

		assertEquals("#1", "\"def\"  ", Wasavi.getRegister("\""));
	}

	@Test
	public void doubleQuote_All_Top () {
		Wasavi.send("iabc  \"def\"  ghi\u001b");
		Wasavi.send("6|ya\"");

		assertEquals("#1", "\"def\"  ", Wasavi.getRegister("\""));
	}

	@Test
	public void doubleQuote_All_Inner () {
		Wasavi.send("iabc  \"def\"  ghi\u001b");
		Wasavi.send("8|ya\"");

		assertEquals("#1", "\"def\"  ", Wasavi.getRegister("\""));
	}

	@Test
	public void doubleQuote_All_Bottom () {
		Wasavi.send("iabc  \"def\"  ghi\u001b");
		Wasavi.send("10|ya\"");

		assertEquals("#1", "\"def\"  ", Wasavi.getRegister("\""));
	}

	@Test
	public void doubleQuote_All_Error () {
		Wasavi.send("iabc  def  ghi\u001b");
		Wasavi.send("7|ya\"");

		assertEquals("#1", "", Wasavi.getRegister("\""));
		assertTrue("#2", Wasavi.getLastMessage().length() > 0);
	}

	//

	@Test
	public void doubleQuote_Inner_Outer () {
		Wasavi.send("iabc  \"def\"  ghi\u001b");
		Wasavi.send("0yi\"");

		assertEquals("#1", "def", Wasavi.getRegister("\""));
	}

	@Test
	public void doubleQuote_Inner_Top () {
		Wasavi.send("iabc  \"def\"  ghi\u001b");
		Wasavi.send("6|yi\"");

		assertEquals("#1", "def", Wasavi.getRegister("\""));
	}

	@Test
	public void doubleQuote_Inner_Inner () {
		Wasavi.send("iabc  \"def\"  ghi\u001b");
		Wasavi.send("8|yi\"");

		assertEquals("#1", "def", Wasavi.getRegister("\""));
	}

	@Test
	public void doubleQuote_Inner_Bottom () {
		Wasavi.send("iabc  \"def\"  ghi\u001b");
		Wasavi.send("10|yi\"");

		assertEquals("#1", "def", Wasavi.getRegister("\""));
	}

	@Test
	public void doubleQuote_Inner_Error () {
		Wasavi.send("iabc  def  ghi\u001b");
		Wasavi.send("7|yi\"");

		assertEquals("#1", "", Wasavi.getRegister("\""));
		assertTrue("#2", Wasavi.getLastMessage().length() > 0);
	}
	
	//

	@Test
	public void word_All_Outer () {
		Wasavi.send("iabc   def   ghi\u001b");
		Wasavi.send("5|yaw");

		assertEquals("#1", "   def", Wasavi.getRegister("\""));
	}

	@Test
	public void word_All_Inner () {
		Wasavi.send("iabc   def   ghi\u001b");
		Wasavi.send("8|yaw");

		assertEquals("#1", "def   ", Wasavi.getRegister("\""));
	}

	@Test
	public void word_All_Top () {
		Wasavi.send("iabc   def   ghi   \u001b");
		Wasavi.send("7|yaw");

		assertEquals("#1", "def   ", Wasavi.getRegister("\""));
	}

	@Test
	public void word_All_Bottom () {
		Wasavi.send("iabc   def   ghi\u001b");
		Wasavi.send("9|yaw");

		assertEquals("#1", "def   ", Wasavi.getRegister("\""));
	}

	@Test
	public void word_All_Error () {
		Wasavi.send("i!@#   #+.   &*_\u001b");
		Wasavi.send("8|yaw");

		assertEquals("#1", "+", Wasavi.getRegister("\""));
	}

	//

	@Test
	public void word_Inner_Outer () {
		Wasavi.send("iabc   def   ghi\u001b");
		Wasavi.send("5|yiw");

		assertEquals("#1", "def", Wasavi.getRegister("\""));
	}

	@Test
	public void word_Inner_Inner () {
		Wasavi.send("iabc   def   ghi\u001b");
		Wasavi.send("8|yiw");

		assertEquals("#1", "def", Wasavi.getRegister("\""));
	}

	@Test
	public void word_Inner_Top () {
		Wasavi.send("iabc   def   ghi\u001b");
		Wasavi.send("7|yiw");

		assertEquals("#1", "def", Wasavi.getRegister("\""));
	}

	@Test
	public void word_Inner_Bottom () {
		Wasavi.send("iabc   def   ghi\u001b");
		Wasavi.send("9|yiw");

		assertEquals("#1", "def", Wasavi.getRegister("\""));
	}

	@Test
	public void word_Inner_Error () {
		Wasavi.send("i!@#   #+.   &*_\u001b");
		Wasavi.send("8|yiw");

		assertEquals("#1", "+", Wasavi.getRegister("\""));
	}

	//

	@Test
	public void bigword_All_Outer () {
		Wasavi.send("ia#c   d$f   g%i\u001b");
		Wasavi.send("5|yaW");

		assertEquals("#1", "   d$f", Wasavi.getRegister("\""));
	}

	@Test
	public void bigword_All_Inner () {
		Wasavi.send("ia#c   d$f   g%i\u001b");
		Wasavi.send("8|yaW");

		assertEquals("#1", "d$f   ", Wasavi.getRegister("\""));
	}

	@Test
	public void bigword_All_Top () {
		Wasavi.send("ia#c   d$f   g%i   \u001b");
		Wasavi.send("7|yaW");

		assertEquals("#1", "d$f   ", Wasavi.getRegister("\""));
	}

	@Test
	public void bigword_All_Bottom () {
		Wasavi.send("ia#c   d$f   g%i\u001b");
		Wasavi.send("9|yaW");

		assertEquals("#1", "d$f   ", Wasavi.getRegister("\""));
	}

	//

	@Test
	public void bigword_Inner_Outer () {
		Wasavi.send("ia#c   d$f   g%i\u001b");
		Wasavi.send("5|yiW");

		assertEquals("#1", "d$f", Wasavi.getRegister("\""));
	}

	@Test
	public void bigword_Inner_Inner () {
		Wasavi.send("ia#c   d$f   g%i\u001b");
		Wasavi.send("8|yiW");

		assertEquals("#1", "d$f", Wasavi.getRegister("\""));
	}

	@Test
	public void bigword_Inner_Top () {
		Wasavi.send("ia#c   d$f   g%i\u001b");
		Wasavi.send("7|yiW");

		assertEquals("#1", "d$f", Wasavi.getRegister("\""));
	}

	@Test
	public void bigword_Inner_Bottom () {
		Wasavi.send("ia#c   d$f   g%i\u001b");
		Wasavi.send("9|yiW");

		assertEquals("#1", "d$f", Wasavi.getRegister("\""));
	}

	//

	@Test
	public void block_all_outer () {
		Wasavi.send("iabc ( def (ghi) jkl) mno\u001b");
		Wasavi.send("1|ya(");
		assertEquals("#1", "", Wasavi.getRegister("\""));
		assertTrue("#2", Wasavi.getLastMessage().length() > 0);
	}

	@Test
	public void block_all_top () {
		Wasavi.send("iabc ( def (ghi) jkl) mno\u001b");
		Wasavi.send("5|ya(");

		assertEquals("#1", "( def (ghi) jkl)", Wasavi.getRegister("\""));
	}

	@Test
	public void block_all_inner () {
		Wasavi.send("iabc ( def (ghi) jkl) mno\u001b");
		Wasavi.send("8|ya(");

		assertEquals("#1", "( def (ghi) jkl)", Wasavi.getRegister("\""));
	}

	@Test
	public void block_all_bottom () {
		Wasavi.send("iabc ( def (ghi) jkl) mno\u001b");
		Wasavi.send("20|ya(");

		assertEquals("#1", "( def (ghi) jkl)", Wasavi.getRegister("\""));
	}

	@Test
	public void block_all_error () {
		Wasavi.send("iabc ( def (ghi) jkl mno\u001b");
		Wasavi.send("8|ya(");

		assertEquals("#1", "", Wasavi.getRegister("\""));
		assertTrue("#2", Wasavi.getLastMessage().length() > 0);
	}

	@Test
	public void sentence_all_outer () {
		Wasavi.send("17G0yas");
		assertEquals("#1",
				"\tLorem ipsum dolor sit amet. consectetur adipisicing elit.",
				Wasavi.getRegister("\""));
	}

	@Test
	public void sentence_all_top () {
		Wasavi.send("17G^yas");
		assertEquals("#1",
				"Lorem ipsum dolor sit amet. consectetur adipisicing elit.  ",
				Wasavi.getRegister("\""));
	}

	@Test
	public void sentence_all_inner () {
		Wasavi.send("17G02wyas");
		assertEquals("#1",
				"Lorem ipsum dolor sit amet. consectetur adipisicing elit.  ",
				Wasavi.getRegister("\""));
	}

	@Test
	public void sentence_all_bottom () {
		Wasavi.send("17G2f.yas");
		assertEquals("#1",
				"Lorem ipsum dolor sit amet. consectetur adipisicing elit.  ",
				Wasavi.getRegister("\""));
	}

	//

	@Test
	public void sentence_innter_outer () {
		Wasavi.send("17G0yis");
		assertEquals("#1",
				"Lorem ipsum dolor sit amet. consectetur adipisicing elit.",
				Wasavi.getRegister("\""));
	}

	@Test
	public void sentence_innter_top () {
		Wasavi.send("17G^yis");
		assertEquals("#1",
				"Lorem ipsum dolor sit amet. consectetur adipisicing elit.",
				Wasavi.getRegister("\""));
	}

	@Test
	public void sentence_innter_inner () {
		Wasavi.send("17G02wyis");
		assertEquals("#1",
				"Lorem ipsum dolor sit amet. consectetur adipisicing elit.",
				Wasavi.getRegister("\""));
	}

	@Test
	public void sentence_innter_bottom () {
		Wasavi.send("17G2f.yis");
		assertEquals("#1",
				"Lorem ipsum dolor sit amet. consectetur adipisicing elit.",
				Wasavi.getRegister("\""));
	}

	//
	
	@Test
	public void paragraph_all_top () {
		Wasavi.send("16Gyap");
		assertEquals("#1",
				"\n" +
				"\tLorem ipsum dolor sit amet. consectetur adipisicing elit.  sed do eiusmod\n" +
				"\ttempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam\n",
				Wasavi.getRegister("\""));
	}
	
	@Test
	public void paragraph_all_inner () {
		Wasavi.send("17Gwyap");
		assertEquals("#1",
				"\tLorem ipsum dolor sit amet. consectetur adipisicing elit.  sed do eiusmod\n" +
				"\ttempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam\n" +
				"\n",
				Wasavi.getRegister("\""));
	}

	//

	@Test
	public void paragraph_inner_top () {
		Wasavi.send("16Gyip");
		assertEquals("#1",
				"\tLorem ipsum dolor sit amet. consectetur adipisicing elit.  sed do eiusmod\n" +
				"\ttempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam\n",
				Wasavi.getRegister("\""));
	}
	
	@Test
	public void paragraph_inner_inner () {
		Wasavi.send("17Gwyip");
		assertEquals("#1",
				"\tLorem ipsum dolor sit amet. consectetur adipisicing elit.  sed do eiusmod\n" +
				"\ttempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam\n",
				Wasavi.getRegister("\""));
	}

	// tags

	@Test
	public void tag_all_outer () {
		// ....<a>tao</a>
		// ^
		Wasavi.send("i    <a>tao</a>  \u001b");
		Wasavi.send("0yat");

		assertEquals("#1-1", "<a>tao</a>", Wasavi.getRegister("\""));
		assertPos("#1-2", 0, 4);
	}

	@Test
	public void tag_all_top () {
		// ....<a>tat</a>
		//      ^
		Wasavi.send("i    <a>tat</a>  \u001b");
		Wasavi.send("6|yat");

		assertEquals("#1-1", "<a>tat</a>", Wasavi.getRegister("\""));
		assertPos("#1-2", 0, 4);
	}

	@Test
	public void tag_all_inner () {
		// ....<a>tai</a>
		//         ^
		Wasavi.send("i    <a>tai</a>  \u001b");
		Wasavi.send("2Fayat");

		assertEquals("#1-1", "<a>tai</a>", Wasavi.getRegister("\""));
		assertPos("#1-2", 0, 4);
	}

	@Test
	public void tag_all_bottom () {
		// ....<a>tab</a>
		//             ^
		Wasavi.send("i    <a>tab</a>  \u001b");
		Wasavi.send("Fayat");

		assertEquals("#1-1", "<a>tab</a>", Wasavi.getRegister("\""));
		assertPos("#1-2", 0, 4);
	}

	@Test
	public void tag_all_error () {
		Wasavi.send("i    <a>tae  \u001b");
		Wasavi.send("0yat");

		assertEquals("#1", "", Wasavi.getRegister("\""));
		assertTrue("#2", Wasavi.getLastMessage().length() > 0);
	}

	@Test
	public void tag_inner_outer () {
		// ....<a>tio</a>
		// ^
		Wasavi.send("i    <a>tio</a>  \u001b");
		Wasavi.send("0yit");

		assertEquals("#1-1", "tio", Wasavi.getRegister("\""));
		assertPos("#1-2", 0, 7);
	}

	@Test
	public void tag_inner_top () {
		// ....<a>tit</a>
		//      ^
		Wasavi.send("i    <a>tit</a>  \u001b");
		Wasavi.send("6|yit");

		assertEquals("#1-1", "tit", Wasavi.getRegister("\""));
		assertPos("#1-2", 0, 7);
	}

	@Test
	public void tag_inner_inner () {
		// ....<a>tii</a>
		//         ^
		Wasavi.send("i    <a>tii</a>  \u001b");
		Wasavi.send("2Fayit");

		assertEquals("#1-1", "tii", Wasavi.getRegister("\""));
		assertPos("#1-2", 0, 7);
	}

	@Test
	public void tag_inner_bottom () {
		// ....<a>tib</a>
		//             ^
		Wasavi.send("i    <a>tib</a>  \u001b");
		Wasavi.send("Fayit");

		assertEquals("#1-1", "tib", Wasavi.getRegister("\""));
		assertPos("#1-2", 0, 7);
	}

	@Test
	public void tag_inner_error () {
		Wasavi.send("i    <a>tie  \u001b");
		Wasavi.send("0yit");

		assertEquals("#1", "", Wasavi.getRegister("\""));
		assertTrue("#2", Wasavi.getLastMessage().length() > 0);
	}

	private void outputTree () {
		Wasavi.send(
			":set noai\n" +
			"i" +
			"<html>\n" +
			" <head>\n" +
			" </head>\n" +
			" <body>\n" +
			"  <div class=\"outer-div\">\n" +
			"   <div>inner div</div>\n" +
			"   <p>paragraph</p>\n" +
			"  </div>\n" +
			" </body>\n" +
			"</html>" +
			"\u001b");
	}

	@Test
	public void tag_outer_counted () {
		outputTree();
		Wasavi.send("7G2fp2yat");

		assertEquals("#1-1",
			"<div class=\"outer-div\">\n" +
			"   <div>inner div</div>\n" +
			"   <p>paragraph</p>\n" +
			"  </div>",
			Wasavi.getRegister("\""));
		assertPos("#2-1", 4, 2);
	}

	@Test
	public void bound_tag_inner_sequential () {
		outputTree();
		Wasavi.setInputModeOfWatchTarget("bound", "bound_line");
		Wasavi.send("7G2fpv");
		int[] positions = new int[]{
			6,6,  6,14,	// paragraph
			6,3,  6,18,	// <p>paragraph</p>
			4,25, 7,1,	// ...<div> ~ </p>\n..
			4,2,  7,7,	// <div class ~ </div>
			3,7,  8,0,	// ..<div class ~ </div>\n.
			3,1,  8,7,	// <body> ~ </body>
			0,6,  8,7,	// .<head> ~ </body>\n    NOTE: vim places a focus cursor on 8,8, but wasavi places it on 8,7.
			0,0,  9,6,	// <html> ~ </html>
			0,0,  9,6	// <html> ~ </html>
		};
		int index = 1;
		for (int i = 0; i < positions.length; i += 4, index++) {
			Wasavi.setInputModeOfWatchTarget("bound", "bound_line");
			Wasavi.send("it");

			int[] ss = Wasavi.getMark("$<");
			assertNotNull(String.format("#%d-1, $<", index), ss);

			int[] se = Wasavi.getMark("$>");
			assertNotNull(String.format("#%d-2, $>", index), se);

			assertEquals(
				String.format("#%d-3, ss", index),
				String.format("[%d, %d]", positions[i + 0], positions[i + 1]),
				String.format("[%d, %d]", ss[0], ss[1]));

			assertEquals(
				String.format("#%d-3, se", index),
				String.format("[%d, %d]", positions[i + 2], positions[i + 3]),
				String.format("[%d, %d]", se[0], se[1]));
		}
	}

	@Test
	public void bound_tag_all_sequential () {
		outputTree();
		Wasavi.setInputModeOfWatchTarget("bound", "bound_line");
		Wasavi.send("7G2fpv");
		int[] positions = new int[]{
			6,3, 6,18,	// <p>paragraph</p>
			4,2, 7,7,	// <div class ~ </div>
			3,1, 8,7,	// <body> ~ </body>
			0,0, 9,6,	// <html> ~ </html>
			0,0, 9,6	// <html> ~ </html>
		};
		int index = 1;
		for (int i = 0; i < positions.length; i += 4, index++) {
			Wasavi.setInputModeOfWatchTarget("bound", "bound_line");
			Wasavi.send("at");

			int[] ss = Wasavi.getMark("$<");
			assertNotNull(String.format("#%d-1, $<", index), ss);

			int[] se = Wasavi.getMark("$>");
			assertNotNull(String.format("#%d-2, $>", index), se);

			assertEquals(
				String.format("#%d-3, ss", index),
				String.format("[%d, %d]", positions[i + 0], positions[i + 1]),
				String.format("[%d, %d]", ss[0], ss[1]));

			assertEquals(
				String.format("#%d-3, se", index),
				String.format("[%d, %d]", positions[i + 2], positions[i + 3]),
				String.format("[%d, %d]", se[0], se[1]));
		}
	}
}

/* vim:set ts=4 sw=4 fileencoding=UTF-8 fileformat=unix filetype=java : */
