package WasaviTest;

import org.junit.*;
import org.junit.rules.TestRule;
import org.junit.rules.TestWatcher;
import org.junit.runner.Description;

import org.json.*;

import java.util.ArrayList;
import java.awt.Toolkit;
import java.awt.datatransfer.Clipboard;
import java.awt.datatransfer.StringSelection;
import java.awt.datatransfer.DataFlavor;
import java.awt.datatransfer.UnsupportedFlavorException;

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
	private final ArrayList<String> inputModeOfWacthTargetDefault =
		new ArrayList<String>(java.util.Arrays.asList("command", "console-wait"));
	private ArrayList<String> inputModeOfWacthTarget = inputModeOfWacthTargetDefault;

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
							inputModeOfWacthTarget.contains(elm.getAttribute("data-wasavi-input-mode"))) {
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

	private int getInt (String name, int defaultValue) {
		try {
			return wasaviState.getInt(name);
		}
		catch (JSONException e) {
		}
		return defaultValue;
	}

	private int getInt (String name) {
		return getInt(name, 0);
	}

	private String getString (String name, String defaultValue) {
		try {
			return wasaviState.getString(name);
		}
		catch (JSONException e) {
		}
		return defaultValue;
	}

	private String getString (String name) {
		return getString(name, "");
	}

	public void send (CharSequence... strokes) {
		for (CharSequence s: strokes) {
			sendSetup();

			(new Actions(driver)).sendKeys(s).perform();

			WebElement elm = waitCommandCompletion();
			sendFinish(elm);
		}

		inputModeOfWacthTarget = inputModeOfWacthTargetDefault;
	}

	public void sendNoWait (CharSequence stroke) {
		(new Actions(driver)).sendKeys(stroke).perform();
	}

	public void setInputModeOfWatchTarget (String... modes) {
		inputModeOfWacthTarget = new ArrayList<String>();

		for (String s: modes) {
			if ("command".equals(s) ||
				"edit".equals(s) ||
				"edit-overwrite".equals(s) ||
				"line-input".equals(s)) {

				inputModeOfWacthTarget.add(s);
			}
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

	public int makeScrollableBuffer (double factor) {
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

	/*
	 * state getters
	 */

	public String getState () {
		return getString("state", "***Exception in getState***");
	}

	public String getValue () {
		return getString("value", "***Exception in getValue***");
	}

	public String getLastMessage () {
		return getString("lastMessage", "***Exception in getLastMessage***");
	}

	public String getLastSimpleCommand () {
		return getString("lastSimpleCommand", "***Exception in getLastSimpleCommand***");
	}

	public String getInputMode () {
		return getString("inputMode", "***Exception in getInputMode***");
	}

	public int getLines () {
		return getInt("lines", 0);
	}

	public int getRowLength () {
		return getInt("rowLength", 0);
	}

	public int getRow () {
		return getInt("row", 0);
	}

	public int getCol () {
		return getInt("col", 0);
	}

	public int getTopRow () {
		return getInt("topRow", 0);
	}

	public int getTopCol () {
		return getInt("topCol", 0);
	}

	public String getLineInput () {
		return getString("lineInput", "***Exception in getLineInput***");
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

	public int[] getMark (String name) {
		try {
			int[] result = new int[2];
			JSONObject mark = wasaviState.getJSONObject("marks").getJSONObject(name);
			result[0] = mark.getInt("row");
			result[1] = mark.getInt("col");
			return result;
		}
		catch (JSONException e) {
			return null;
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

	public static String getClipboardText () {
		Clipboard cb = Toolkit.getDefaultToolkit().getSystemClipboard();

		try {
			return (String)cb.getData(DataFlavor.stringFlavor);
		}
		catch (UnsupportedFlavorException e) {
			return null;
		}
		catch (java.io.IOException e) {
			return null;
		}
	}

	public static void setClipboardText (String s) {
		Clipboard cb = Toolkit.getDefaultToolkit().getSystemClipboard();
		StringSelection ss = new StringSelection(s);
		cb.setContents(ss, ss);
	}

	public static void sleep (long ms) {
		try {
			Thread.sleep(ms);
		}
		catch (InterruptedException e) {}
	}
}



class WasaviAsserts {
	private static JSONObject wasaviState;

	protected WasaviAsserts () {
	}

	public static void setWasaviState (JSONObject ws) {
		wasaviState = ws;
	}

	public static String fromCharCode (int... codePoints) {
		return new String(codePoints, 0, codePoints.length);
	}

	public static String toVisibleString (String s) {
		for (int i = 0; i < 32; i++) {
			s = s.replaceAll(fromCharCode(i), "^" + fromCharCode(64 + i));
		}
		s = s.replaceAll(fromCharCode(127), "^_");
		return s;
	}

	public static void assertEquals (String message, String expected, String actual) {
		if (!expected.equals(actual)) {
			org.junit.Assert.fail(
					String.format(
						"%s: expected:\n<<%s>>\n\nbut was:\n<<%s>>",
						message,
						toVisibleString(expected), toVisibleString(actual)));
		}
	}

	public static void assertEqualst(String expected, String actual) {
		assertEquals("", expected, actual);
	}

	public static void assertPos (String message, int row, int col) {
		try {
			int actualRow = wasaviState.getInt("row");
			int actualCol = wasaviState.getInt("col");
			if (row != actualRow || col != actualCol) {
				org.junit.Assert.fail(
						String.format(
							"%s: position unmatch.\nexpected:[%d, %d] but was:[%d, %d]\n%s",
							message,
							row, col, actualRow, actualCol,
							wasaviState.getString("value")));
			}
		}
		catch (JSONException e) {
			org.junit.Assert.fail("invalid row or col in wasaviStates.");
		}
	}

	public static void assertPos (int row, int col) {
		assertPos("", row, col);
	}

	public static void assertValue (String message, String expected) {
		try {
			String value = wasaviState.getString("value");
			if (!value.equals(expected)) {
				org.junit.Assert.fail(
						String.format(
							"%s: value unmatch.\nexpected:\n<<%s>>\n\nbut was:\n<<%s>>\n\nstate:%s",
							message,
							toVisibleString(expected), toVisibleString(value),
							wasaviState.toString(2)));
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
	protected String logText;
	protected Boolean isSectionTest;

	@Rule public TestRule watcher = new TestWatcher() {
		protected void starting (Description d) {
			System.out.println("Testcase: " + d.getMethodName());
			isSectionTest = d.getMethodName().matches(".*([Ss]entence|[Pp]aragraph|[Ss]ection).*");
			Wasavi.js(
					"document.getElementsByTagName('h1')[0].textContent = " +
					"'now testing: " + d.getMethodName() + "';");
		}
		protected void failed (Throwable e, Description d) {
			System.out.println(d.getMethodName() + " FAILED\n" + logText);
		}
	};

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
			options.addArguments("--user-data-dir="
					+ System.getProperty("wasavi.tests.chrome.profile_path"));
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
		if (isSectionTest) {
			WebElement sectionInitializer = driver.findElement(By.id("init-section-button"));
			if (sectionInitializer == null) {
				System.out.println("section initializer not found.");
			}
			else {
				sectionInitializer.click();
			}
		}
		else {
			WebElement reset = driver.findElement(By.id("reset-button"));
			if (reset == null) {
				System.out.println("reset button not found.");
			}
			else {
				reset.click();
			}
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
			try {
				Thread.sleep(1000);
			}
			catch (Exception e) {
			}
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
		logText = driver.findElement(By.id("test-log")).getAttribute("value");

		Wasavi.js(
			"var wasaviFrame = document.getElementById('wasavi_frame');" +
			"wasaviFrame && wasaviFrame.parentNode.removeChild(wasaviFrame);");

		try {
			Thread.sleep(500);
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
