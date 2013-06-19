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
		driver.navigate().to(driver.getCurrentUrl() + "?ros-test");

		WebElement t2 = null;
		WebElement wasaviFrame = null;

		// phase 1
		t2 = driver.findElement(By.id("t2"));
		if (t2 == null) {
			fail("runtimeOverrideSettings: cannot find #t2");
		}

		t2.click();
		new Actions(driver)
			.keyDown(Keys.CONTROL)
			.sendKeys(Keys.RETURN)
			.keyUp(Keys.CONTROL)
			.perform();
		sleep(1000);

		wasaviFrame = driver.findElement(By.tagName("iframe"));
		if (wasaviFrame == null) {
			fail("runtimeOverrideSettings: cannot find wasaviFrame");
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
		t2 = driver.findElement(By.id("t2"));
		if (t2 == null) {
			fail("runtimeOverrideSettings: cannot find #t2, phase 2");
		}

		t2.click();
		new Actions(driver)
			.keyDown(Keys.CONTROL)
			.sendKeys(Keys.RETURN)
			.keyUp(Keys.CONTROL)
			.perform();
		sleep(1000);

		wasaviFrame = driver.findElement(By.tagName("iframe"));
		if (wasaviFrame == null) {
			fail("runtimeOverrideSettings: cannot find wasaviFrame, phase 2");
		}
	
		wasaviFrame.click();
		Wasavi.sendNoWait("a\t\nabc\u001b:wq\n");
		sleep(1000);
		assertEquals("#1-1", "\t\n\tabc", t2.getAttribute("value"));
	}
}
