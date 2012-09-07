package WasaviTest;

import org.junit.*;
import org.json.*;

import org.openqa.selenium.By;
import org.openqa.selenium.Keys;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.interactions.Actions;
import org.openqa.selenium.support.ui.*;
import static org.openqa.selenium.support.ui.ExpectedConditions.*;

import org.openqa.selenium.remote.DesiredCapabilities;
import org.openqa.selenium.remote.RemoteWebDriver;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.firefox.FirefoxProfile;
import org.openqa.selenium.chrome.ChromeDriverService;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.chrome.ChromeDriver;

import com.opera.core.systems.OperaDriver;
import com.opera.core.systems.OperaProfile;



class WasaviWrapper {
	private static final Boolean LOG_EXCEPTION = true;

	private WebDriver driver;
	private JSONObject wasaviState;
	private String inputModeOfWacthTarget = "command";

	WasaviWrapper (WebDriver d) {
		driver = d;
		wasaviState = new JSONObject();
	}

	private void sendSetup () {
		js("document.getElementById('wasavi_frame')" +
			".setAttribute('data-wasavi-command-state', 'busy');");
	}

	private WebElement waitCommandCompletion () {
		try {
			return new WebDriverWait(driver, 60)
				.until(new ExpectedCondition<WebElement>() {
				public WebElement apply (WebDriver d) {
					try {
						WebElement elm = d.findElement(By.id("wasavi_frame"));
						if (elm.getAttribute("data-wasavi-command-state") == null &&
							inputModeOfWacthTarget.equals(elm.getAttribute("data-wasavi-input-mode"))) {
							return elm;
						}
					}
					catch (org.openqa.selenium.NoSuchElementException e) {
						if (LOG_EXCEPTION) {
							System.out.println("send: wasavi frame not found.");
						}
					}
					return null;
				}
			});
		}
		catch (org.openqa.selenium.TimeoutException e) {
			if (LOG_EXCEPTION) {
				System.out.println("waitCommandCompletion: timed out.");
			}
		}
		return null;
	}

	private void sendFinish (WebElement wasaviFrame) {
		if (wasaviFrame == null) {
			return;
		}

		String source = wasaviFrame.getAttribute("data-wasavi-state");
		if (source != null) {
			try {
				//System.out.println(source);
				wasaviState = new JSONObject(source);
			}
			catch (JSONException e) {
				if (LOG_EXCEPTION) {
					System.out.println("sendFinish: invalid json source: " + source);
				}
				wasaviState = new JSONObject();
			}
		}
		else {
			if (LOG_EXCEPTION) {
				System.out.println("sendFinish: cannot retrieve wasavi state.");
			}
			wasaviState = new JSONObject();
		}

		WasaviAsserts.setWasaviState(wasaviState);
		//System.out.println(getValue());
	}

	public void send (CharSequence... strokes) {
		for (CharSequence s: strokes) {
			sendSetup();

			(new Actions(driver)).sendKeys(s).perform();

			WebElement elm = waitCommandCompletion();
			sendFinish(elm);
		}

		inputModeOfWacthTarget = "command";
	}

	public void setInputModeOfWatchTarget (String im) {
		if ("command".equals(im) || "edit".equals(im) || "edit-overwrite".equals(im)) {
			inputModeOfWacthTarget = im;
		}
	}

	public Object js (String script) {
		return ((JavascriptExecutor)driver).executeScript(script);
	}

	public Boolean waitTerminate () {
		try {
			WebElement wasaviFrame = driver.findElement(By.id("wasavi_frame"));
			return new WebDriverWait(driver, 60).until(stalenessOf(wasaviFrame));
		}
		catch (org.openqa.selenium.NoSuchElementException e) {
			if (LOG_EXCEPTION) {
				System.out.println("waitTerminate: wasavi_frame not found.");
			}
			return true;
		}
	}

	public int makeScrollableBuffer (int factor) {
		send("h");

		int lines = getLines();
		int actualLines = (int)(lines * factor);
		StringBuilder sb = new StringBuilder();

		for (int i = 1; i <= actualLines; i++) {
			if (sb.length() > 0) {
				sb.append("\n");
			}
			sb.append(String.format("line %d", i));
		}

		send(String.format("i%s\u001b", sb.toString()));

		return lines;
	}

	public int makeScrollableBuffer () {
		return makeScrollableBuffer(1);
	}

	public String getValue () {
		try {
			return wasaviState.getString("value");
		}
		catch (JSONException e) {
			return "**Exception in getValue***";
		}
	}

	public String getLastMessage () {
		try {
			return wasaviState.getString("lastMessage");
		}
		catch (JSONException e) {
			return "**Exception in getLastMessage***";
		}
	}

	public String getInputMode () {
		try {
			return wasaviState.getString("inputMode");
		}
		catch (JSONException e) {
			return "**Exception in getMode***";
		}
	}

	public String getRegister (String name) {
		try {
			JSONArray regs = wasaviState.getJSONArray("registers");
			for (int i = 0, goal = regs.length(); i < goal; i++) {
				JSONObject item = regs.getJSONObject(i);
				if (item.getString("name").equals(name)) {
					return item.getString("data");
				}
			}
		}
		catch (JSONException e) {
			return "**Exception in getRegister***";
		}
		return "";
	}

	public int getLines () {
		try {
			return wasaviState.getInt("lines");
		}
		catch (JSONException e) {
			return 0;
		}
	}
}


class WasaviUtils {
	public static String join (String... parts) {
		String delimiter = parts[0];
		StringBuilder sb = new StringBuilder();
		for (int i = 1, goal = parts.length; i < goal; i++) {
			if (sb.length() > 0) {
				sb.append(delimiter);
			}
			sb.append(parts[i]);
		}
		return sb.toString();
	}

	public static String join (String[] parts, String delimiter) {
		StringBuilder sb = new StringBuilder();
		for (String s: parts) {
			if (sb.length() > 0) {
				sb.append(delimiter);
			}
			sb.append(s);
		}
		return sb.toString();
	}
}



class WasaviAsserts {
	private static JSONObject wasaviState;

	protected WasaviAsserts () {
	}

	public static void setWasaviState (JSONObject ws) {
		wasaviState = ws;
	}

	public static void assertPos (String message, long row, long col) {
		try {
			long actualRow = wasaviState.getLong("row");
			long actualCol = wasaviState.getLong("col");
			if (row != actualRow || col != actualCol) {
				org.junit.Assert.fail(
						message +
						String.format(
							" expected:[%d, %d] but was:[%d, %d]\n%s",
							row, col, actualRow, actualCol,
							wasaviState.getString("value")));
			}
		}
		catch (JSONException e) {
			org.junit.Assert.fail("invalid row or col in wasaviStates.");
		}
	}

	public static void assertPos (long row, long col) {
		assertPos("", row, col);
	}

	public static void assertValue (String message, String expected) {
		try {
			String value = wasaviState.getString("value");
			if (!value.equals(expected)) {
				org.junit.Assert.fail(
						message +
						String.format(
							"%s: value unmatch.\nexpected:\n%s\n\nactual:\n%s\n\nstate:%s",
							message, expected, value, wasaviState.toString(2)));
			}
		}
		catch (JSONException e) {
			org.junit.Assert.fail("invalid value col in wasaviStates.");
		}
	}

	public static void assertValue (String expected) {
		assertValue("", expected);
	}
}



public class WasaviTest {
	protected static WebDriver driver;
	protected static WasaviWrapper Wasavi;

	private static WebDriver createDriver (String name) {
		WebDriver driver = null;

		if (name.equals("opera")) {
			DesiredCapabilities cap = new DesiredCapabilities();
			cap.setCapability("opera.profile",
					new OperaProfile(System.getProperty("wasavi.tests.opera.profile_path")));
			cap.setCapability("opera.logging.level",
					java.util.logging.Level.FINE);
			cap.setCapability("opera.binary",
					System.getProperty("wasavi.tests.opera.executable"));
			driver = new OperaDriver(cap);
		}

		else if (name.equals("chrome")) {
			ChromeDriverService service = ChromeDriverService.createDefaultService();
			ChromeOptions options = new ChromeOptions();
			options.addArguments("--start-maximized");
			options.addArguments("--load-extension="
					+ System.getProperty("wasavi.tests.chrome.extension_path"));
			options.addArguments("--lang=en");
			driver = new ChromeDriver(service, options);
		}

		else if (name.equals("firefox")) {
			FirefoxProfile p = new FirefoxProfile();
			try {
				java.io.File f = new java.io.File(
						System.getProperty("wasavi.tests.firefox.extension_path"));
				p.addExtension(f);
				driver = new FirefoxDriver(p);
			}
			catch (java.io.IOException e) {
				System.out.println(e.getMessage());
				driver = null;
			}
		}

		return driver;
	}

	private void invokeWasavi () {
		WebElement reset = driver.findElement(By.id("reset-button"));
		if (reset == null) {
			System.out.println("reset button not found.");
		}
		else {
			reset.click();
		}

		WebElement t2 = driver.findElement(By.id("t2"));
		if (t2 == null) {
			System.out.println("target textarea not found.");
		}
		else {
			t2.click();

			new Actions(driver)
				.keyDown(Keys.CONTROL)
				.sendKeys(Keys.RETURN)
				.keyUp(Keys.CONTROL)
				.perform();

			WebElement wasaviFrame = new WebDriverWait(driver, 60).until(
					new ExpectedCondition<WebElement>() {
						public WebElement apply (WebDriver driver) {
							return driver.findElement(By.id("wasavi_frame"));
						}
					});

			if (wasaviFrame != null) {
				wasaviFrame.click();
			}
		}
	}

	@BeforeClass
	public static void beforeClass () {
		driver = createDriver(System.getProperty("wasavi.tests.browser"));
		if (driver != null) {
			driver.navigate().to(System.getProperty("wasavi.tests.frame_url"));
			Wasavi = new WasaviWrapper(driver);
		}
	}

	@Before
	public void setUp () {
		invokeWasavi();
	}

	@After
	public void tearDown () {
		//System.out.println("***\n" + driver.findElement(By.id("test-log")).getAttribute("value"));
		Wasavi.js(
			"var wasaviFrame = document.getElementById('wasavi_frame');" +
			"wasaviFrame && wasaviFrame.parentNode.removeChild(wasaviFrame);");

		try {
			Thread.sleep(3000);
		}
		catch (Exception e) {
		}
	}

	@AfterClass
	public static void afterClass () {
		if (driver != null) {
			driver.quit();
			driver = null;
		}
	}
}

// vim:set ts=4 sw=4 fenc=UTF-8 ff=unix ft=java fdm=marker :
