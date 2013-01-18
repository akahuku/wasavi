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

public class ScrollersTest extends WasaviTest {
	@Test
	public void testScrollUpHalfOfView () {
		int lines = Wasavi.makeScrollableBuffer(2.5);

		Wasavi.send("GH");
		int rowTopBefore = Wasavi.getRow();
		Wasavi.send(":set scroll=0\n\u0015H");
		int rowTopAfter = Wasavi.getRow();
		assertTrue("#1", Math.abs(Math.abs(rowTopAfter - rowTopBefore) - (lines / 2.0)) <= 1);

		Wasavi.send("GH");
		rowTopBefore = Wasavi.getRow();
		Wasavi.send(":set scroll=5\n\u0015H");
		rowTopAfter = Wasavi.getRow();
		assertEquals("#2", -5, rowTopAfter - rowTopBefore);

		int rowBefore = Wasavi.getRow();
		int colBefore = Wasavi.getCol();
		Wasavi.send("d\u0015");
		assertEquals("#3", "d canceled.", Wasavi.getLastMessage());
		assertTrue("#4", rowBefore == Wasavi.getRow() && colBefore == Wasavi.getCol());
	}

	@Test
	public void testScrollDownHalfOfView () {
		int lines = Wasavi.makeScrollableBuffer(2.5);

		Wasavi.send("gg");
		int rowTopBefore = Wasavi.getRow();
		Wasavi.send(":set scroll=0\n\u0004");
		int rowTopAfter = Wasavi.getRow();
		assertTrue("#1", Math.abs(Math.abs(rowTopAfter - rowTopBefore) - (lines / 2.0)) <= 1);

		Wasavi.send("gg");
		rowTopBefore = Wasavi.getRow();
		Wasavi.send(":set scroll=5\n\u0004");
		rowTopAfter = Wasavi.getRow();
		assertEquals("#2", 5, rowTopAfter - rowTopBefore);

		int rowBefore = Wasavi.getRow();
		int colBefore = Wasavi.getCol();
		Wasavi.send("d\u0004");
		assertTrue("#3", !"".equals(Wasavi.getLastMessage()));
		assertTrue("#4", rowBefore == Wasavi.getRow() && colBefore == Wasavi.getCol());
	}

	@Test
	public void testScrollUp1Line () {
		int lines = Wasavi.makeScrollableBuffer(2.5);

		Wasavi.send("G", "H");
		int rowTopBefore = Wasavi.getRow();
		Wasavi.send("\u0019", "H");
		int rowTopAfter = Wasavi.getRow();
		assertEquals("#1", -1, rowTopAfter - rowTopBefore);

		int rowBefore = Wasavi.getRow();
		int colBefore = Wasavi.getCol();
		Wasavi.send("d\u0019");
		assertTrue("#2", !"".equals(Wasavi.getLastMessage()));
		assertTrue("#3", rowBefore == Wasavi.getRow() && colBefore == Wasavi.getCol());
	}

	@Test
	public void testScrollDown1Line () {
		int lines = Wasavi.makeScrollableBuffer(2.5);

		Wasavi.send("gg");
		int rowTopBefore = Wasavi.getRow();
		Wasavi.send("\u0005");
		int rowTopAfter = Wasavi.getRow();
		assertEquals("#1", 1, rowTopAfter - rowTopBefore);

		int rowBefore = Wasavi.getRow();
		int colBefore = Wasavi.getCol();
		Wasavi.send("d\u0005");
		assertTrue("#2", !"".equals(Wasavi.getLastMessage()));
		assertTrue("#3", rowBefore == Wasavi.getRow() && colBefore == Wasavi.getCol());
	}

	private void _testScrollUpAlmostView (CharSequence a) {
		int lines = Wasavi.makeScrollableBuffer(2.5);

		Wasavi.send("G", "H");
		int rowTopBefore = Wasavi.getRow();
		Wasavi.send(a, "H");
		int rowTopAfter = Wasavi.getRow();
		assertEquals("#1", -(lines - 2), rowTopAfter - rowTopBefore);

		int rowBefore = Wasavi.getRow();
		int colBefore = Wasavi.getCol();
		Wasavi.send("d", a);
		assertTrue("#2", !"".equals(Wasavi.getLastMessage()));
		assertTrue("#3", rowBefore == Wasavi.getRow() && colBefore == Wasavi.getCol());
	}

	@Test
	public void testScrollUpAlmostView () {
		_testScrollUpAlmostView("\u0002");
	}

	@Test
	public void testScrollUpAlmostViewPageup () {
		_testScrollUpAlmostView(Keys.PAGE_UP);
	}

	private void _testScrollDownAlmostView (CharSequence a) {
		int lines = Wasavi.makeScrollableBuffer(2.5);

		Wasavi.send("gg");
		int rowTopBefore = Wasavi.getRow();
		Wasavi.send(a);
		int rowTopAfter = Wasavi.getRow();
		assertEquals("#1", lines - 2, rowTopAfter - rowTopBefore);

		int rowBefore = Wasavi.getRow();
		int colBefore = Wasavi.getCol();
		Wasavi.send("d", a);
		assertTrue("#2", !"".equals(Wasavi.getLastMessage()));
		assertTrue("#3", rowBefore == Wasavi.getRow() && colBefore == Wasavi.getCol());
	}

	@Test
	public void testScrollDownAlmostView () {
		_testScrollDownAlmostView("\u0006");
	}

	@Test
	public void testScrollDownAlmostViewPagedown () {
		_testScrollDownAlmostView(Keys.PAGE_DOWN);
	}

	@Test
	public void testScreenAdjustTop () {
		int lines = Wasavi.makeScrollableBuffer(2);
		Wasavi.send("gg10G");

		Wasavi.send("z", Keys.ENTER);
		assertTrue("#1", "".equals(Wasavi.getLastMessage()));
		assertTrue("#2",
				Wasavi.getTopRow() == Wasavi.getRow() &&
				Wasavi.getTopCol() == Wasavi.getCol());
	}

	private void _testScreenAdjustCenter (CharSequence a) {
		int lines = Wasavi.makeScrollableBuffer(2);
		Wasavi.send("gg", String.format("%d", (int)(lines * 0.75)), "G");

		Wasavi.send("z", a);
		assertTrue("#1", "".equals(Wasavi.getLastMessage()));

		double actualTopRow = Wasavi.getTopRow();
		double idealTopRow = Wasavi.getRow() - (lines / 2.0);
		assertTrue("#2", Math.abs(idealTopRow - actualTopRow) <= 1);
	}

	@Test
	public void testScreenAdjustCenter () {
		_testScreenAdjustCenter(".");
	}

	@Test
	public void testScreenAdjustCenterZ () {
		_testScreenAdjustCenter("z");
	}

	@Test
	public void testScreenAdjustBottom () {
		int lines = Wasavi.makeScrollableBuffer(2);
		Wasavi.send("gg", "20G");

		Wasavi.send("z-");
		assertTrue("#1", "".equals(Wasavi.getLastMessage()));
		assertEquals("#2", Wasavi.getTopRow(), Wasavi.getRow() - (lines - 1));
	}

	@Test
	public void testScreenAdjustOther () {
		int lines = Wasavi.makeScrollableBuffer();
		int rowBefore = Wasavi.getRow();
		int colBefore = Wasavi.getCol();
		Wasavi.send("zX");
		assertTrue("#1", !"".equals(Wasavi.getLastMessage()));
		assertTrue("#2", rowBefore == Wasavi.getRow() && colBefore == Wasavi.getCol());
	}
}

/* vim:set ts=4 sw=4 fileencoding=UTF-8 fileformat=unix filetype=java : */
