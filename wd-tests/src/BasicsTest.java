package WasaviTest;

import org.junit.*;
import static org.junit.Assert.*;

import org.openqa.selenium.By;
import org.openqa.selenium.Keys;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;

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
}
