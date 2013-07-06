package WasaviTest;

import static WasaviTest.WasaviAsserts.*;
import static WasaviTest.WasaviUtils.*;

import org.junit.*;
import static org.junit.Assert.*;

import org.openqa.selenium.By;
import org.openqa.selenium.Keys;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;

public class LineInputEditingTest extends WasaviTest {

	@Test
	public void commandlineMoveToTop () {
		Wasavi.send(":ersion\u0001v\n");
		assertEquals("#1-1", "wasavi/0.0.1", Wasavi.getLastMessage());
	}

	@Test
	public void commandlineMoveToTopHome () {
		Wasavi.send(":ersion" + Keys.HOME + "v\n");
		assertEquals("#1-1", "wasavi/0.0.1", Wasavi.getLastMessage());
	}

	@Test
	public void commandlineMoveToEnd () {
		Wasavi.send(":versio\u0001\u0005n\n");
		assertEquals("#1-1", "wasavi/0.0.1", Wasavi.getLastMessage());
	}

	@Test
	public void commandlineMoveToEndEnd () {
		Wasavi.send(":versio\u0001" + Keys.END + "n\n");
		assertEquals("#1-1", "wasavi/0.0.1", Wasavi.getLastMessage());
	}

	@Test
	public void commandlineBack () {
		Wasavi.send(":versin\u0002o\n");
		assertEquals("#1-1", "wasavi/0.0.1", Wasavi.getLastMessage());
	}

	@Test
	public void commandlineBackLeft () {
		Wasavi.send(":versin" + Keys.ARROW_LEFT + "o\n");
		assertEquals("#1-1", "wasavi/0.0.1", Wasavi.getLastMessage());
	}

	@Test
	public void commandlineForward () {
		Wasavi.send(":vrsion\u0001\u0006e\n");
		assertEquals("#1-1", "wasavi/0.0.1", Wasavi.getLastMessage());
	}

	@Test
	public void commandlineForwardRight () {
		Wasavi.send(":vrsion\u0001" + Keys.ARROW_RIGHT + "e\n");
		assertEquals("#1-1", "wasavi/0.0.1", Wasavi.getLastMessage());
	}

	@Test
	public void commandlineBackspace () {
		Wasavi.send(":versiom\u0008n\n");
		assertEquals("#1-1", "wasavi/0.0.1", Wasavi.getLastMessage());
	}

	@Test
	public void commandlineBackspaceBackspace () {
		Wasavi.send(":versiom" + Keys.BACK_SPACE + "n\n");
		assertEquals("#1-1", "wasavi/0.0.1", Wasavi.getLastMessage());
	}

	@Test
	public void commandlineNextHistory () {
		Wasavi.send(":wow!\n");
		Wasavi.send(":version" + Keys.ARROW_UP + Keys.ARROW_DOWN + "\n");
		assertEquals("#1-1", "wasavi/0.0.1", Wasavi.getLastMessage());
	}

	@Test
	public void commandlinePreviousHistory () {
		Wasavi.send(":version\n");
		Wasavi.send(":set ai?" + Keys.ARROW_UP + "\n");
		assertEquals("#1-1", "wasavi/0.0.1", Wasavi.getLastMessage());
	}

	@Test
	public void commandlineDeleteLine () {
		Wasavi.send(":howdy?\u0015version\n");
		assertEquals("#1-1", "wasavi/0.0.1", Wasavi.getLastMessage());
	}

	@Test
	public void commandlineDeleteWord () {
		Wasavi.send(":word\u0017version\n");
		assertEquals("#1-1", "wasavi/0.0.1", Wasavi.getLastMessage());
	}

	@Test
	public void completeCommandNameFromEmpty () {
		Wasavi.setInputModeOfWatchTarget("line-input");
		Wasavi.send(":\t");
		assertEquals("#1-1", "&", Wasavi.getLineInput());
	}

	@Test
	public void completeCommandNameWithPrefix () {
		Wasavi.setInputModeOfWatchTarget("line-input");
		Wasavi.send(":ab\t");
		assertEquals("#1-1", "abbreviate", Wasavi.getLineInput());
	}

	@Test
	public void completeNestedCommandNameFromEmpty () {
		Wasavi.setInputModeOfWatchTarget("line-input");
		Wasavi.send(":g/re/\t");
		assertEquals("#1-1", "g/re/&", Wasavi.getLineInput());
	}

	@Test
	public void completeNestedCommandNameWithPrefix () {
		Wasavi.setInputModeOfWatchTarget("line-input");
		Wasavi.send(":g/re/p\t");
		assertEquals("#1-1", "g/re/print", Wasavi.getLineInput());
	}

	@Test
	public void complete2ndCommandNameFromEmpty () {
		Wasavi.setInputModeOfWatchTarget("line-input");
		Wasavi.send(":ver|1,2\t");
		assertEquals("#1-1", "ver|1,2&", Wasavi.getLineInput());
	}

	@Test
	public void complete2ndCommandNameWithPrefix () {
		Wasavi.setInputModeOfWatchTarget("line-input");
		Wasavi.send(":ver|ab\t");
		assertEquals("#1-1", "ver|abbreviate", Wasavi.getLineInput());
	}

	@Test
	public void completeOptionNameFromEmpty () {
		Wasavi.setInputModeOfWatchTarget("line-input");
		Wasavi.send(":set \t");
		assertEquals("#1-1", "set autoindent", Wasavi.getLineInput());
	}

	@Test
	public void completeOptionNameWithPrefix () {
		Wasavi.setInputModeOfWatchTarget("line-input");
		Wasavi.send(":set textw\t");
		assertEquals("#1-1", "set textwidth", Wasavi.getLineInput());
	}

	@Test
	public void completeAbbreviatedOptionName () {
		Wasavi.setInputModeOfWatchTarget("line-input");
		Wasavi.send(":set sw\t");
		assertEquals("#1-1", "set shiftwidth", Wasavi.getLineInput());
	}
}

/* vim:set ts=4 sw=4 fileencoding=UTF-8 fileformat=unix filetype=java : */
