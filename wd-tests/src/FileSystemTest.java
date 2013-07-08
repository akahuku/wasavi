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

public class FileSystemTest extends WasaviTest {

	private void completeRootPath (String fs) {
		Wasavi.send(":files default " + fs + "\n");
		Wasavi.setInputModeOfWatchTarget("line-input");
		Wasavi.send(":r \t");
		System.out.println(Wasavi.getLineInput());
		assertTrue("#1-1", Pattern.matches("^r .+$", Wasavi.getLineInput()));
	}

	private void completeSubPath (String fs) {
		Wasavi.send(":files default " + fs + "\n");
		Wasavi.setInputModeOfWatchTarget("line-input");
		Wasavi.send(":r /test\t");
		System.out.println(Wasavi.getLineInput());
		assertTrue("#1-1", Pattern.matches("^r /test.+$", Wasavi.getLineInput()));
	}

	private void read (String fs) {
		Wasavi.send(":0r " + fs + ":/test/read-test.txt\n", "gg");
		assertEquals("#1-1", "hello,\nworld", Wasavi.getValue());
	}

	private void write (String fs) {
		Wasavi.send(":files default " + fs + "\n");
		Wasavi.send("ggawrite test.\nwrite test\u001b");
		Wasavi.send(":w /test/write-test.txt\n", "G");
		sleep(1000 * 30); // BAD!
		Wasavi.send(":r /test/write-test.txt\n", "gg");
		assertEquals("#1-1", "write test.\nwrite test\nwrite test.\nwrite test", Wasavi.getValue());
	}

	@Test
	public void fileSystemCommand_default () {
		Wasavi.send(":files default\n");
		System.out.println(Wasavi.getLastMessage());
		assertTrue("#1-1", Pattern.matches("^default file system: .+$", Wasavi.getLastMessage()));
	}

	// dropbox
	
	@Test
	public void completeRootPathDropbox () {
		completeRootPath("dropbox");
	}

	@Test
	public void completeSubPathDropbox () {
		completeSubPath("dropbox");
	}

	@Test
	public void readDropbox () {
		read("dropbox");
	}

	@Test
	public void writeDropbox () {
		write("dropbox");
	}

	// google drive

	@Test
	public void completeRootPathGDrive () {
		completeRootPath("gdrive");
	}

	@Test
	public void completeSubPathGDrive () {
		completeSubPath("gdrive");
	}

	@Test
	public void readGDrive () {
		read("gdrive");
	}

	@Test
	public void writeGDrive () {
		write("gdrive");
	}
}

/* vim:set ts=4 sw=4 fileencoding=UTF-8 fileformat=unix filetype=java : */
