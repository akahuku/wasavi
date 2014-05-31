package WasaviTest;

import static WasaviTest.WasaviAsserts.*;
import static WasaviTest.WasaviUtils.*;

import org.junit.*;
import static org.junit.Assert.*;

import org.openqa.selenium.By;
import org.openqa.selenium.Keys;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;

public class LearningTheViEditor6th extends WasaviTest {
	@Test
	public void test2_1 () {
		Wasavi.setInputModeOfWatchTarget("edit");
		Wasavi.send("iintroduction");
		assertEquals("#1-1", "edit", Wasavi.getInputMode());

		Wasavi.send("\u001b");
		assertPos("#2-1", 0, 11);
		assertEquals("#2-2", "introduction", Wasavi.getValue());
		assertEquals("#2-3", "introduction", Wasavi.getRegister("."));
	}

	@Test
	public void test2_2 () {
		Wasavi.send(
				"iWith a screen editor you can scroll the\n" +
				 "page, move the cursor, delete lines,\n" +
				 "and more, while seeing the results of\n" +
				 "your edits as you make them.\u001b");

		Wasavi.send("3G17|0");
		assertPos("#1", 2, 0);

		Wasavi.send("3G17|b");
		assertPos("#2", 2, 10);

		Wasavi.send("3G17|2k");
		assertPos("#3", 0, 16);

		Wasavi.send("3G17|$");
		assertPos("#4", 2, 36);

		Wasavi.send("3G17|2h");
		assertPos("#5", 2, 14);

		Wasavi.send("3G17|j");
		assertPos("#6", 3, 16);

		Wasavi.send("3G17|2w");
		assertPos("#7", 2, 27);

		Wasavi.send("1G1|4l");
		assertPos("#7", 0, 4);
	}

	@Test
	public void test2_2_4 () {
		/*
		 * 0        10        20        30        40
		 * *----+----*----+----*----+----*----+----*
		 *  cursor, delete lines, insert chracters,
		 */
		Wasavi.send("i\tcursor, delete lines, insert chracters,\u001b");

		Wasavi.send("1G1|");
		int[] wordCols = {1, 7, 9, 16, 21, 23, 30, 39};
		for (int i: wordCols) {
			Wasavi.send("w");
			assertPos(String.format("w: col %d", i), 0, i);
		}

		Wasavi.send("1G1|");
		int[] bigwordCols = {1, 9, 16, 23, 30};
		for (int i: bigwordCols) {
			Wasavi.send("W");
			assertPos(String.format("W: col %d", i), 0, i);
		}

		Wasavi.send("1G$");
		int[] wordColsBackward = {30, 23, 21, 16, 9, 7, 1, 0};
		for (int i: wordColsBackward) {
			Wasavi.send("b");
			assertPos(String.format("b: col %d", i), 0, i);
		}

		Wasavi.send("1G$");
		int[] bigwordColsBackword = {30, 23, 16, 9, 1, 0};
		for (int i: bigwordColsBackword) {
			Wasavi.send("B");
			assertPos(String.format("B: col %d", i), 0, i);
		}
	}

	@Test
	public void test2_3 () {
/*
With a editor you can scrooll the page,
move the cursor, delete lines, nisret
characters, and more while results of
your edits as you make tham.
Since they allow you to make changes
as you read through a file, much as
you would edit a printed copy,
screen editors are very popular.
 */

/*
With a screen editor you can scroll the page,
move the cursor, delete lines, insert
characters, and more while seeing the results of
your edits as you make them.
Screen editors are very popular
since they allow you to make changes
as you read through a file, much as
you would edit a printed copy.
 */
		Wasavi.send(
				"iWith a editor you can scrooll the page,\n" +
				 "move the cursor, delete lines, nisret\n" +
				 "characters, and more while results of\n" +
				 "your edits as you make tham.\n" +
				 "Since they allow you to make changes\n" +
				 "as you read through a file, much as\n" +
				 "you would edit a printed copy,\n" +
				 "screen editors are very popular.\u001b");

		Wasavi.send("1G8|iscreen \u001b");
		Wasavi.send("/oo\nx");
		Wasavi.send("2G$bcwinsert\u001b");
		Wasavi.send("3G4Wiseeing the \u001b");
		Wasavi.send("4G$Fare");
		Wasavi.send("5Grs");
		Wasavi.send("7G$r.");
		Wasavi.send("8G$x");
		Wasavi.send("^rS");
		Wasavi.send("dd2kP");

		assertValue("#1",
				"With a screen editor you can scroll the page,\n" +
				"move the cursor, delete lines, insert\n" +
				"characters, and more while seeing the results of\n" +
				"your edits as you make them.\n" +
				"Screen editors are very popular\n" +
				"since they allow you to make changes\n" +
				"as you read through a file, much as\n" +
				"you would edit a printed copy.");
	}
}

/* vim:set ts=4 sw=4 fileencoding=UTF-8 fileformat=unix filetype=java : */
