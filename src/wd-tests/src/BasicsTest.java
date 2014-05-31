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
	public void launchAppMode () {
		driver.navigate().to("http://wasavi.appsweets.net/");
		assertEquals("#1-1", "http://wasavi.appsweets.net/", driver.getCurrentUrl());
		WebElement a = driver.findElement(By.tagName("html"));
		assertEquals("#1-2", "1", a.getAttribute("data-wasavi-present"));
	}
}
