package WasaviTest;

import static WasaviTest.WasaviAsserts.*;
import static WasaviTest.WasaviUtils.*;

import org.junit.*;
import static org.junit.Assert.*;

import org.openqa.selenium.By;
import org.openqa.selenium.Keys;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;

public class FileSystemTest extends WasaviTest {
	@Test
	public void fileSystemCommand_default () {
		Wasavi.send(":files default");
		System.out.println(Wasavi.getLastMessage());
	}

	@Test
	public void completeRootPathDropbox () {
		Wasavi.send(":files default dropbox\n");
		Wasavi.setInputModeOfWatchTarget("line-input");
		Wasavi.send(":r \t");
		assertNotEquals("#1-1", "r ", Wasavi.getLineInput());
	}

	@Test
	public void completeSubPathDropbox () {
		Wasavi.send(":files default dropbox\n");
		Wasavi.setInputModeOfWatchTarget("line-input");
		Wasavi.send(":r /test\t");
		assertNotEquals("#1-1", "r /test", Wasavi.getLineInput());
	}

	@Test
	public void readDropbox () {
	}

	@Test
	public void writeDropbox () {
	}
}

/* vim:set ts=4 sw=4 fileencoding=UTF-8 fileformat=unix filetype=java : */
