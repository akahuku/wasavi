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

public class LineInputEditingTest extends WasaviTest {

	@Test
	public void commandlineMoveToTop () {
		Wasavi.send(":ersion\u0001v\n");
		assertTrue("#1-1", Wasavi.getLastMessage().matches(".*wasavi/.*"));
	}

	@Test
	public void commandlineMoveToTopHome () {
		Wasavi.send(":ersion" + Keys.HOME + "v\n");
		assertTrue("#1-1", Wasavi.getLastMessage().matches(".*wasavi/.*"));
	}

	@Test
	public void commandlineMoveToEnd () {
		Wasavi.send(":versio\u0001\u0005n\n");
		assertTrue("#1-1", Wasavi.getLastMessage().matches(".*wasavi/.*"));
	}

	@Test
	public void commandlineMoveToEndEnd () {
		Wasavi.send(":versio\u0001" + Keys.END + "n\n");
		assertTrue("#1-1", Wasavi.getLastMessage().matches(".*wasavi/.*"));
	}

	@Test
	public void commandlineBack () {
		Wasavi.send(":versin\u0002o\n");
		assertTrue("#1-1", Wasavi.getLastMessage().matches(".*wasavi/.*"));
	}

	@Test
	public void commandlineBackLeft () {
		Wasavi.send(":versin" + Keys.ARROW_LEFT + "o\n");
		assertTrue("#1-1", Wasavi.getLastMessage().matches(".*wasavi/.*"));
	}

	@Test
	public void commandlineForward () {
		Wasavi.send(":vrsion\u0001\u0006e\n");
		assertTrue("#1-1", Wasavi.getLastMessage().matches(".*wasavi/.*"));
	}

	@Test
	public void commandlineForwardRight () {
		Wasavi.send(":vrsion\u0001" + Keys.ARROW_RIGHT + "e\n");
		assertTrue("#1-1", Wasavi.getLastMessage().matches(".*wasavi/.*"));
	}

	@Test
	public void commandlineBackspace () {
		Wasavi.send(":versiom\u0008n\n");
		assertTrue("#1-1", Wasavi.getLastMessage().matches(".*wasavi/.*"));
	}

	@Test
	public void commandlineBackspaceBackspace () {
		Wasavi.send(":versiom" + Keys.BACK_SPACE + "n\n");
		assertTrue("#1-1", Wasavi.getLastMessage().matches(".*wasavi/.*"));
	}

	@Test
	public void commandlineNextHistory () {
		Wasavi.send(":wow!\n");
		Wasavi.send(":version" + Keys.ARROW_UP + Keys.ARROW_DOWN + "\n");
		assertTrue("#1-1", Wasavi.getLastMessage().matches(".*wasavi/.*"));
	}

	@Test
	public void commandlinePreviousHistory () {
		Wasavi.send(":version\n");
		Wasavi.send(":set ai?" + Keys.ARROW_UP + "\n");
		assertTrue("#1-1", Wasavi.getLastMessage().matches(".*wasavi/.*"));
	}

	@Test
	public void commandlineDeleteLine () {
		Wasavi.send(":howdy?\u0015version\n");
		assertTrue("#1-1", Wasavi.getLastMessage().matches(".*wasavi/.*"));
	}

	@Test
	public void commandlineDeleteWord () {
		Wasavi.send(":word\u0017version\n");
		assertTrue("#1-1", Wasavi.getLastMessage().matches(".*wasavi/.*"));
	}

	@Test
	public void completeCommandNameFromEmpty () {
		Wasavi.setInputModeOfWatchTarget("line_input");
		Wasavi.send(":\t");
		assertEquals("#1-1", "&", Wasavi.getLineInput());
	}

	@Test
	public void completeCommandNameWithPrefix () {
		Wasavi.setInputModeOfWatchTarget("line_input");
		Wasavi.send(":ab\t");
		assertEquals("#1-1", "abbreviate", Wasavi.getLineInput());
	}

	@Test
	public void completeNestedCommandNameFromEmpty () {
		Wasavi.setInputModeOfWatchTarget("line_input");
		Wasavi.send(":g/re/\t");
		assertEquals("#1-1", "g/re/&", Wasavi.getLineInput());
	}

	@Test
	public void completeNestedCommandNameWithPrefix () {
		Wasavi.setInputModeOfWatchTarget("line_input");
		Wasavi.send(":g/re/p\t");
		assertEquals("#1-1", "g/re/print", Wasavi.getLineInput());
	}

	@Test
	public void complete2ndCommandNameFromEmpty () {
		Wasavi.setInputModeOfWatchTarget("line_input");
		Wasavi.send(":ver|1,2\t");
		assertEquals("#1-1", "ver|1,2&", Wasavi.getLineInput());
	}

	@Test
	public void complete2ndCommandNameWithPrefix () {
		Wasavi.setInputModeOfWatchTarget("line_input");
		Wasavi.send(":ver|ab\t");
		assertEquals("#1-1", "ver|abbreviate", Wasavi.getLineInput());
	}

	@Test
	public void completeOptionNameFromEmpty () {
		Wasavi.setInputModeOfWatchTarget("line_input");
		Wasavi.send(":set \t");
		assertEquals("#1-1", "set autoindent", Wasavi.getLineInput());
	}

	@Test
	public void completeOptionNameWithPrefix () {
		Wasavi.setInputModeOfWatchTarget("line_input");
		Wasavi.send(":set textw\t");
		assertEquals("#1-1", "set textwidth", Wasavi.getLineInput());
	}

	@Test
	public void completeAbbreviatedOptionName () {
		Wasavi.setInputModeOfWatchTarget("line_input");
		Wasavi.send(":set sw\t");
		assertEquals("#1-1", "set shiftwidth", Wasavi.getLineInput());
	}

	@Test
	public void completeThemeFromEmpty () {
		Wasavi.setInputModeOfWatchTarget("line_input");
		Wasavi.send(":set theme=\t");
		assertTrue("#1-1", Pattern.matches("^set theme=.+", Wasavi.getLineInput()));
	}

	@Test
	public void completeThemeWithPrefix () {
		Wasavi.setInputModeOfWatchTarget("line_input");
		Wasavi.send(":set theme=c\t");
		assertTrue("#1-1", Pattern.matches("^set theme=charcoal", Wasavi.getLineInput()));
	}

	@Test
	public void pasteRegister () {
		Wasavi.send("afoo\nbar\u001b1GyG");
		Wasavi.setInputModeOfWatchTarget("line_input");
		Wasavi.send(":\u0012\"");
		assertEquals("#1-1", "foo\u240dbar\u240d", Wasavi.getLineInput());
	}

	@Test
	public void pasteClipboard () {
		Wasavi.send("afoo\nbar\u001b1G\"*yG");
		Wasavi.setInputModeOfWatchTarget("line_input");
		Wasavi.send(":\u0012*");
		assertEquals("#1-1", "foo\u240dbar\u240d", Wasavi.getLineInput());
	}
}

/* vim:set ts=4 sw=4 fileencoding=UTF-8 fileformat=unix filetype=java : */
