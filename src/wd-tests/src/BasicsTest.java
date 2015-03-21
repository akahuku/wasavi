package WasaviTest;

import org.junit.*;
import static org.junit.Assert.*;
import static WasaviTest.WasaviUtils.*;

import org.openqa.selenium.By;
import org.openqa.selenium.Keys;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.interactions.Actions;
import org.openqa.selenium.support.ui.*;
import static org.openqa.selenium.support.ui.ExpectedConditions.*;

public class BasicsTest extends WasaviTest {
	@Test
	public void wasaviExists () {
		WebElement wasaviFrame = driver.findElement(By.id("wasavi_frame"));
		assertNotNull("wasaviFrame must exists", wasaviFrame);
	}

	@Test
	public void wasaviTermination () {
		Wasavi.sendNoWait(":q\n");

		Boolean vanished = Wasavi.waitTerminate();
		assertTrue("wasaviFrame must not be exist.", vanished);
	}

	@Test
	public void runtimeOverrideSettings () {
		Wasavi.sendNoWait(":q\n");
		sleep(1000);

		String currentUrl = driver.getCurrentUrl();
		driver.navigate().to(currentUrl + "?ros-test");

		WebElement wasaviFrame = invokeWasavi();

		// phase 1
		if (wasaviFrame == null) {
			fail("runtimeOverrideSettings: cannot find wasaviFrame, phase 1");
		}

		wasaviFrame.click();
		Wasavi.sendNoWait(":set nu ai\n");
		sleep(1000);
		Wasavi.sendNoWait(":wq\n");
		sleep(1000);

		// reload
		driver.navigate().refresh();
		sleep(1000);

		// phase 2
		wasaviFrame = invokeWasavi();
		if (wasaviFrame == null) {
			fail("runtimeOverrideSettings: cannot find wasaviFrame, phase 2");
		}
	
		wasaviFrame.click();
		Wasavi.sendNoWait("a\t\nabc\u001b:wq\n");
		sleep(1000);
		assertEquals("#1-1", "\t\n\tabc", findElement(By.id("t2")).getAttribute("value"));

		driver.navigate().to(currentUrl);
	}

	@Test
	public void testNoOverride () {
		// quit
		Wasavi.sendNoWait(":q!\n");
		sleep(1000);

		// nativate to new url
		String currentUrl = driver.getCurrentUrl();
		driver.navigate().to(currentUrl + "?nooverride");

		/*
		 * phase 1
		 */

		// #1-1 launch wasavi
		WebElement wasaviFrame = invokeWasavi();
		if (wasaviFrame == null) {
			fail("testNoOverride: cannot find wasaviFrame, phase 1");
		}

		// #1-2 set option be different from its default value
		Wasavi.send(":set nu\n");

		// #1-3 quit
		Wasavi.sendNoWait(":q!\n");
		sleep(1000);

		// #1-4 refresh
		driver.navigate().refresh();
		sleep(1000);

		/*
		 * phase 2
		 */

		// #2-1 launch wasavi again
		wasaviFrame = invokeWasavi();
		if (wasaviFrame == null) {
			fail("testNoOverride: cannot find wasaviFrame, phase 2");
		}

		// #2-2 query the state of number option
		// and ensure `set nu` at #1-2 is ignored
		Wasavi.send(":set nu?\n");
		assertEquals("#1-1", "nonumber", Wasavi.getLastMessage());

		// #2-3 quit and restore original url
		Wasavi.sendNoWait(":q!\n");
		sleep(1000);
		driver.navigate().to(currentUrl);
	}

	@Test
	public void launchAppMode () {
		Wasavi.sendNoWait(":q\n");
		sleep(1000);

		driver.navigate().to("http://wasavi.appsweets.net/");
		assertEquals("#1-1", "http://wasavi.appsweets.net/", driver.getCurrentUrl());

		WebElement a = driver.findElement(By.tagName("html"));
		assertEquals("#1-2", "1", a.getAttribute("data-wasavi-present"));
	}
}
