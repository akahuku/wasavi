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

public class AppModeTest extends WasaviTest {
	@Test
	public void appModeFile () {
		Wasavi.send("i!\u001b:file\n");
		assertEquals("#1-1", "\"*Untitled*\" [unix, modified] line 1 of 1 (0%)", Wasavi.getAppModeStatusLine());
	}

	@Test
	public void appModeFileForRename () {
		Wasavi.send(":cd foo/bar|file ../baz/test.txt\n");
		assertEquals("#1-1", "\"dropbox:/foo/baz/test.txt\" [unix] --No lines in buffer--", Wasavi.getAppModeStatusLine());
		Wasavi.send("\u001b");
		assertEquals("#1-2", "/foo/baz/test.txt", Wasavi.getAppModeStatusLine());
		Wasavi.send(":cd /\n");
		assertEquals("#1-3", "foo/baz/test.txt", Wasavi.getAppModeStatusLine());

		Wasavi.send(":cd foo|file\n");
		assertEquals("#2-1", "\"dropbox:/foo/baz/test.txt\" [unix] --No lines in buffer--", Wasavi.getAppModeStatusLine());
		Wasavi.send("\u001b");
		assertEquals("#2-2", "baz/test.txt", Wasavi.getAppModeStatusLine());
	}

	@Test
	public void appModeWriteNewFile () {
		Wasavi.send(":write\n");
		assertEquals("#1-1", "write: No file name.", Wasavi.getAppModeStatusLine());
	}

	@Test
	public void appModeRead404 () {
		Wasavi.send(":r noexist.txt\n");
		assertEquals("#1-1", "read: Cannot open \"dropbox:/noexist.txt\".", Wasavi.getAppModeStatusLine());
	}

	@Test
	public void appModeChdir () {
		Wasavi.send(":chdir test|file\n");
		Wasavi.send(":pwd\n");
		assertEquals("#1-1", "dropbox:/test", Wasavi.getAppModeStatusLine());
	}

	@Test
	public void appModeChdir404 () {
		Wasavi.send(":chdir noexist|file\n");
		assertEquals("#1-1", "Invalid path.", Wasavi.getAppModeStatusLine());
	}

	@Test
	public void appModeChdirNoArg () {
		Wasavi.send(":chdir\n");
		assertEquals("#1-1", "dropbox:/", Wasavi.getAppModeStatusLine());
	}
}

/* vim:set ts=4 sw=4 fileencoding=UTF-8 fileformat=unix filetype=java : */
