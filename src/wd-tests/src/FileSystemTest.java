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

	/*
	 * for testing, each cloud storage must have following files:
	 *
	 *    /hello-world.txt
	 *    /test
	 *        read test.txt  (content: "hello,\nworld")
	 *        write test.txt
	 */

	private void completeRootPath (String testLabel, String fs, String prefix, Boolean makeDefault) {
		if (makeDefault) {
			Wasavi.send(":files default " + fs + "\n");
		}

		Wasavi.setInputModeOfWatchTarget("line_input");

		if (makeDefault) {
			Wasavi.send(":r " + prefix + "\t");
		}
		else {
			Wasavi.send(":r " + fs + ":" + prefix + "\t");
		}

		String line = Wasavi.getLineInput();
		Wasavi.send("\u001b");

		System.out.println(testLabel + ": " + line);

		if (makeDefault) {
			assertTrue(testLabel, Pattern.matches("^r " + prefix + ".+$", line));
		}
		else {
			assertTrue(testLabel, Pattern.matches("^r " + fs + ":" + prefix + ".+$", line));
		}
	}

	private void completeSubPath (String testLabel, String fs, Boolean makeDefault) {
		if (makeDefault) {
			Wasavi.send(":files default " + fs + "\n");
		}

		Wasavi.setInputModeOfWatchTarget("line_input");

		if (makeDefault) {
			Wasavi.send(":r /test\t");
		}
		else {
			Wasavi.send(":r " + fs + ":" + "/test\t");
		}

		String line = Wasavi.getLineInput();
		Wasavi.send("\u001b");

		System.out.println(testLabel + ": " + line);

		if (makeDefault) {
			assertTrue(testLabel, Pattern.matches("^r /test.+$", line));
		}
		else {
			assertTrue(testLabel, Pattern.matches("^r " + fs + ":/test.+$", line));
		}
	}

	private void read (String fs) {
		Wasavi.send(":0r " + fs + ":/test/read\\ test.txt\n", "gg");
		assertEquals("#1-1", "hello,\nworld", Wasavi.getValue());
	}

	private void write (String fs) {
		int n = (int)(Math.random() * 1000);
		Wasavi.send(":files default " + fs + "\n");
		Wasavi.send(String.format("ggawrite test:%d\nwrite test\u001b", n));
		Wasavi.send(":w /test/write\\ test.txt\n", "G");
		Wasavi.waitCommandCompletion();
		Wasavi.send(":r /test/write\\ test.txt\n", "gg");
		assertEquals("#1-1",
				String.format("write test:%d\nwrite test\nwrite test:%d\nwrite test", n, n),
				Wasavi.getValue());
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
		// drive name ommited, no-prefix
		completeRootPath("#1-1", "dropbox", "", true);
		// drive name ommited, relative path prefixed
		completeRootPath("#1-2", "dropbox", "hello", true);
		// drive name ommited, absolute path prefixed
		completeRootPath("#1-3", "dropbox", "/hello", true);

		// drive name specified, no-prefix
		completeRootPath("#2-1", "dropbox", "", false);
		// drive name specified, relative path prefixed
		completeRootPath("#2-2", "dropbox", "hello", false);
		// drive name specified, absolute path prefixed
		completeRootPath("#2-3", "dropbox", "/hello", false);
	}

	@Test
	public void completeSubPathDropbox () {
		completeSubPath("#1", "dropbox", true);
		completeSubPath("#2", "dropbox", false);
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
		completeRootPath("#1-1", "gdrive", "", true);
		completeRootPath("#1-2", "gdrive", "hello", true);
		completeRootPath("#1-3", "gdrive", "/hello", true);

		completeRootPath("#2-1", "gdrive", "", false);
		completeRootPath("#2-2", "gdrive", "hello", false);
		completeRootPath("#2-3", "gdrive", "/hello", false);
	}

	@Test
	public void completeSubPathGDrive () {
		completeSubPath("#1", "gdrive", true);
		completeSubPath("#2", "gdrive", false);
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
