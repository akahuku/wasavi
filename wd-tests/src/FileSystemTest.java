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
	 *        read-test.txt  (content: "hello,\nworld")
	 *        write-test.txt
	 */

	private void completeRootPath (String testLabel, String fs, String prefix, Boolean makeDefault) {
		if (makeDefault) {
			Wasavi.send(":files default " + fs + "\n");
		}

		Wasavi.setInputModeOfWatchTarget("line-input");

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

		Wasavi.setInputModeOfWatchTarget("line-input");

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

	@Test
	public void appModeFile () {
		driver.navigate().to("http://wasavi.appsweets.net/");
		Wasavi.sendNoWait("i!\u001b:file\n");
		sleep(1000);
		WebElement elm = driver.findElement(By.id("wasavi_footer_file_indicator"));
		assertEquals("#1-1", "\"*Untitled*\" [unix, modified] line 1 of 1 (0%)", elm.getText());
	}

	@Test
	public void appModeFileForRename () {
		driver.navigate().to("http://wasavi.appsweets.net/");
		WebElement elm = driver.findElement(By.id("wasavi_footer_file_indicator"));

		Wasavi.sendNoWait(":cd foo/bar\n:file ../baz/test.txt\n");
		sleep(1000);
		assertEquals("#1-1", "\"dropbox:/foo/baz/test.txt\" [unix] --No lines in buffer--", elm.getText());
		Wasavi.sendNoWait("\u001b");
		sleep(1000);
		assertEquals("#1-2", "/foo/baz/test.txt", elm.getText());
		Wasavi.sendNoWait(":cd /\n");
		sleep(1000);
		assertEquals("#1-3", "foo/baz/test.txt", elm.getText());

		Wasavi.sendNoWait(":cd foo\n:file\n");
		sleep(1000);
		assertEquals("#2-1", "\"dropbox:/foo/baz/test.txt\" [unix] --No lines in buffer--", elm.getText());
		Wasavi.sendNoWait("\u001b");
		sleep(1000);
		assertEquals("#2-2", "baz/test.txt", elm.getText());
	}

	@Test
	public void appModeWriteNewFile () {
		driver.navigate().to("http://wasavi.appsweets.net/");
		Wasavi.sendNoWait(":write\n");
		sleep(1000);

		WebElement elm = driver.findElement(By.id("wasavi_footer_file_indicator"));
		assertEquals("#1-1", "write: No file name.", elm.getText());
	}

	@Test
	public void appModeRead404 () {
		driver.navigate().to("http://wasavi.appsweets.net/");
		WebElement elm = driver.findElement(By.id("wasavi_footer_file_indicator"));

		Wasavi.sendNoWait(":r noexist.txt\n");
		sleep(1000 * 10);
		assertEquals("#1-1", "read: Cannot open \"dropbox:/noexist.txt\".", elm.getText());
	}

	@Test
	public void appModeChdir () {
		driver.navigate().to("http://wasavi.appsweets.net/");
		WebElement elm = driver.findElement(By.id("wasavi_footer_file_indicator"));

		Wasavi.sendNoWait(":chdir test\n");
		sleep(1000 * 10);
		Wasavi.sendNoWait(":pwd\n");
		sleep(1000);
		assertEquals("#1-1", "dropbox:/test", elm.getText());
	}

	@Test
	public void appModeChdir404 () {
		driver.navigate().to("http://wasavi.appsweets.net/");
		WebElement elm = driver.findElement(By.id("wasavi_footer_file_indicator"));

		Wasavi.sendNoWait(":chdir noexist\n");
		sleep(1000 * 10);
		assertEquals("#1-1", "Invalid path.", elm.getText());
	}

	@Test
	public void appModeChdirNoArg () {
		driver.navigate().to("http://wasavi.appsweets.net/");
		WebElement elm = driver.findElement(By.id("wasavi_footer_file_indicator"));

		Wasavi.sendNoWait(":chdir\n");
		sleep(1000 * 1);
		assertEquals("#1-1", "dropbox:/", elm.getText());
	}
}

/* vim:set ts=4 sw=4 fileencoding=UTF-8 fileformat=unix filetype=java : */
