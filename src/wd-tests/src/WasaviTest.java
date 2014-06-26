package WasaviTest;

import org.junit.*;
import org.junit.rules.TestRule;
import org.junit.rules.TestWatcher;
import org.junit.runner.Description;

import org.json.*;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
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



class WasaviSendCallback {
	void exec (Actions act) {}
}



class WasaviWrapper {
	protected static final Boolean LOG_EXCEPTION = true;

	protected WebDriver driver;
	protected JSONObject wasaviState;
	protected final ArrayList<String> inputModeOfWacthTargetDefault =
		new ArrayList<String>(java.util.Arrays.asList("command", "console_wait"));
	protected ArrayList<String> inputModeOfWacthTarget = inputModeOfWacthTargetDefault;
	protected Boolean isAppMode = false;
	protected StrokeSender strokeSender = null;

	abstract class StrokeSender {
		abstract public void setup ();
		abstract public WebElement waitCommandCompletion ();
		abstract public void finish (WebElement wasaviFrame);
	}

	class SymbiosisModeStrokeSender extends StrokeSender {
		@Override public void setup () {
			js("document.getElementById('wasavi_frame')" +
				".setAttribute('data-wasavi-command-state', 'busy');");
		}

		@Override public WebElement waitCommandCompletion () {
			try {
				return new WebDriverWait(driver, 60)
					.until(new ExpectedCondition<WebElement>() {
					public WebElement apply (WebDriver d) {
						try {
							WebElement elm = d.findElement(By.id("wasavi_frame"));
							String commandState = elm.getAttribute("data-wasavi-command-state");
							String inputMode = elm.getAttribute("data-wasavi-input-mode");

							if (commandState == null && inputModeOfWacthTarget.contains(inputMode)) {
								return elm;
							}
						}
						catch (org.openqa.selenium.NoSuchElementException e) {
							if (LOG_EXCEPTION) {
								System.out.println("waitCommandCompletion: wasavi frame not found.");
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

		@Override public void finish (WebElement wasaviFrame) {
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
	}

	class AppModeStrokeSender extends StrokeSender {
		@Override public void setup () {
			js("document.documentElement" +
				".setAttribute('data-wasavi-command-state', 'busy');");
		}

		@Override public WebElement waitCommandCompletion () {
			try {
				return new WebDriverWait(driver, 60)
					.until(new ExpectedCondition<WebElement>() {
					public WebElement apply (WebDriver d) {
						try {
							WebElement elm = d.findElement(By.tagName("html"));
							String commandState = elm.getAttribute("data-wasavi-command-state");
							String inputMode = elm.getAttribute("data-wasavi-input-mode");

							if (commandState == null && inputModeOfWacthTarget.contains(inputMode)) {
								return elm;
							}
						}
						catch (org.openqa.selenium.NoSuchElementException e) {
							if (LOG_EXCEPTION) {
								System.out.println("waitCommandCompletion: wasavi frame not found.");
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

		@Override public void finish (WebElement wasaviFrame) {
		}
	}

	/*
	 * constructor
	 */

	WasaviWrapper (WebDriver d) {
		driver = d;
		wasaviState = new JSONObject();
	}

	/*
	 * protected methods
	 */
	
	protected int getInt (String name, int defaultValue) {
		try {
			return wasaviState.getInt(name);
		}
		catch (JSONException e) {
			if (LOG_EXCEPTION) {
				System.out.println(e.getMessage());
			}
		}
		return defaultValue;
	}

	protected int getInt (String name) {
		return getInt(name, 0);
	}

	protected String getString (String name, String defaultValue) {
		try {
			return wasaviState.getString(name);
		}
		catch (JSONException e) {
			if (LOG_EXCEPTION) {
				System.out.println(e.getMessage());
			}
		}
		return defaultValue;
	}

	protected String getString (String name) {
		return getString(name, "");
	}

	protected StrokeSender getStrokeSender () {
		if (strokeSender == null) {
			if (isAppMode) {
				strokeSender = new AppModeStrokeSender();
			}
			else {
				strokeSender = new SymbiosisModeStrokeSender();
			}
		}
		return strokeSender;
	}

	/*
	 * publics
	 */

	public void setAppMode (Boolean value) {
		if (value != isAppMode) {
			isAppMode = value;
			strokeSender = null;
		}
	}

	public void send (CharSequence... strokes) {
		getStrokeSender();

		for (CharSequence s: strokes) {
			strokeSender.setup();

			(new Actions(driver)).sendKeys(s).perform();

			WebElement elm = strokeSender.waitCommandCompletion();
			strokeSender.finish(elm);
		}

		inputModeOfWacthTarget = inputModeOfWacthTargetDefault;
	}

	public void send (WasaviSendCallback callback) {
		getStrokeSender();
		strokeSender.setup();

		Actions act = new Actions(driver);
		callback.exec(act);
		act.perform();

		WebElement elm = strokeSender.waitCommandCompletion();
		strokeSender.finish(elm);

		inputModeOfWacthTarget = inputModeOfWacthTargetDefault;
	}

	public void waitCommandCompletion () {
		getStrokeSender();
		strokeSender.setup();
		WebElement elm = strokeSender.waitCommandCompletion();
		strokeSender.finish(elm);
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
				"overwrite".equals(s) ||
				"line_input".equals(s)) {

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
			if (LOG_EXCEPTION) {
				System.out.println(e.getMessage());
			}
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
			if (LOG_EXCEPTION) {
				System.out.println(e.getMessage());
			}
			return null;
		}
	}

	public String getAppModeStatusLine () {
		try {
			WebElement elm = driver.findElement(By.id("wasavi_footer_file_indicator"));
			return elm.getText();
		}
		catch (org.openqa.selenium.NoSuchElementException e) {
			return "***Exception in getAppModeStatusLine***";
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
		org.junit.Assert.assertEquals(
				String.format(
						"%s: expected:\n<<%s>>\n\nbut was:\n<<%s>>",
						message,
						toVisibleString(expected), toVisibleString(actual)),
				expected, actual);
	}

	public static void assertEqualst(String expected, String actual) {
		assertEquals("", expected, actual);
	}

	public static void assertPos (String message, int row, int col) {
		try {
			int actualRow = wasaviState.getInt("row");
			int actualCol = wasaviState.getInt("col");
			org.junit.Assert.assertTrue(
					String.format(
							"%s: position unmatch.\nexpected:[%d, %d] but was:[%d, %d]\n%s",
							message,
							row, col, actualRow, actualCol,
							wasaviState.getString("value")),
					row == actualRow && col == actualCol);
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
			org.junit.Assert.assertEquals(
					String.format(
							"%s: value unmatch.\nexpected:\n<<%s>>\n\nbut was:\n<<%s>>\n\n",
							message,
							toVisibleString(expected), toVisibleString(value)),
					expected, value);
		}
		catch (JSONException e) {
			org.junit.Assert.fail("invalid value col in wasaviStates.");
		}
	}

	public static void assertValue (String expected) {
		assertValue("", expected);
	}
}



class InvokeState {
	protected int count = 0;
	protected int index = 0;

	InvokeState (int aindex) {
		index = aindex;
	}

	public int getCount () {
		return count;
	}

	public int getIndex () {
		return index;
	}

	public void incrementCount () {
		++count;
	}
}



public class WasaviTest {
	protected static WebDriver driver;
	protected static WasaviWrapper Wasavi;
	protected static InvokeState[] invokeStates = {new InvokeState(0), new InvokeState(1)};
	protected static int testIndex = 1;
	protected ArrayList<String> logText = new ArrayList<String>();
	protected Boolean isSectionTest;
	protected Boolean isAppMode;
	protected Boolean isReadonlyElement;
	protected String wasaviTargetID;

	@Rule public TestRule watcher = new TestWatcher() {
		protected void starting (Description d) {
			logText.clear();

			isSectionTest = d.getMethodName().matches(".*([Ss]entence|[Pp]aragraph|[Ss]ection).*");
			isAppMode = d.getMethodName().matches(".*appMode.*");
			isReadonlyElement = d.getMethodName().matches(".*ReadonlyElement.*");
			wasaviTargetID = d.getMethodName().matches(".*[Cc]ontentEditable.*") ? "t3" : "t2";

			Wasavi.js(
				"var h1 = document.getElementsByTagName('h1')[0];" +
				"if (h1) {" +
				"  h1.textContent = '" + String.format(
					"#%d: %s", testIndex++, d.toString()) + "';" +
				"}");
		}
		protected void failed (Throwable e, Description d) {
			System.out.println("--------------------");
			System.out.println(d.toString() + " FAILED");
			System.out.println("");
			System.out.println(e.getMessage());
			System.out.println("");
			for (CharSequence s: logText) {
				System.out.println(s);
			}
			System.out.println("");
			System.out.println("");
			System.out.println("");
		}
	};

	private static WebDriver createDriver (String name) {
		WebDriver driver = null;

		if (name.equals("opera")) {
			DesiredCapabilities cap = DesiredCapabilities.opera();
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
			options.addArguments(
				"--start-maximized",
				"--lang=en",
				//"--load-extension="
				//	+ System.getProperty("wasavi.tests.chrome.extension_path"),
				"--user-data-dir="
					+ System.getProperty("wasavi.tests.chrome.profile_path")
			);
			driver = new ChromeDriver(service, options);
		}

		else if (name.equals("firefox")) {
			java.io.File profileDir = new java.io.File(
					System.getProperty("wasavi.tests.firefox.profile_path"));
			FirefoxProfile p = new FirefoxProfile(profileDir);

			p.setPreference("general.useragent.locale", "en-US");
			driver = new FirefoxDriver(p);
		}

		return driver;
	}

	protected WebElement findElement (By locator) {
		WebElement result = null;
		try {
			result = driver.findElement(locator);
		}
		catch (org.openqa.selenium.NoSuchElementException e) {
			result = null;
		}
		return result;
	}

	protected WebElement invokeWasavi () {
		WebElement wasaviFrame = null;

		WebElement target = findElement(By.id(wasaviTargetID));
		if (target == null) {
			System.out.println("target element not found.");
			return null;
		}

		for (int i = 0; i < invokeStates.length; ++i) {
			if (isSectionTest) {
				WebElement sectionInitializer = findElement(By.id("init-section-button"));
				if (sectionInitializer == null) {
					System.out.println("section initializer not found.");
					return null;
				}

				sectionInitializer.click();
			}
			else {
				WebElement reset = findElement(By.id("reset-button"));
				if (reset == null) {
					System.out.println("reset button not found.");
					return null;
				}

				reset.click();

				WebElement ro = findElement(By.id("readonly-checkbox"));
				if (ro == null) {
					System.out.println("readonly checkbox not found.");
					return null;
				}
				String roChecked = ro.getAttribute("checked");
				if (isReadonlyElement && roChecked == null
				||  !isReadonlyElement && roChecked != null) {
					ro.click();
					System.out.println("readonly checkbox clicked.");
				}

				new WebDriverWait(driver, 1).until(
					new ExpectedCondition<Boolean>() {
						public Boolean apply (WebDriver driver) {
							WebElement target = findElement(By.id(wasaviTargetID));
							if (target == null) {
								System.out.println("target element not found (2).");
								return false;
							}

							String v = target.getAttribute(
								target.getTagName().equals("textarea") ? "value" : "textContent");
							if (v == null) {
								System.out.println("content of target is null.");
								return false;
							}

							if (v.length() > 0) {
								System.out.println(String.format("content of target is not an empty: '%s'.", v));
								return false;
							}

							return true;
						}
					});
			}

			//
			WebElement targetSwitcher = findElement(By.id("use-div-checkbox"));
			if (targetSwitcher == null) {
				System.out.println("target switcher not found.");
				return null;
			}
			String useDivChecked = targetSwitcher.getAttribute("checked");
			if (wasaviTargetID.equals("t2") && useDivChecked != null
			||  wasaviTargetID.equals("t3") && useDivChecked == null) {
				targetSwitcher.click();
				System.out.println("target switcher clicked.");
			}

			//
			target.click();

			switch (invokeStates[i].getIndex()) {
			case 0:
				target.sendKeys(Keys.chord(Keys.CONTROL, Keys.ENTER));

				/*
				 * alternative valid code:
				 *
				 * new Actions(driver)
				 *   .sendKeys(Keys.chord(Keys.CONTROL, Keys.ENTER))
				 *   .perform();
				 */

				/*
				 * does not execute:
				 *
				 * new Actions(driver)
				 *   .keyDown(Keys.CONTROL)
				 *   .sendKeys(Keys.ENTER)
				 *   .keyUp(Keys.CONTROL)
				 *   .perform();
				 */

				//System.out.println("sendKeys");
				break;

			case 1:
				WebElement launcher = findElement(By.id("request-launch-wasavi"));
				if (launcher == null) {
					System.out.println("launch button not found.");
					return null;
				}

				launcher.click();
				//System.out.println("launcher click");
				break;
			}

			try {
				wasaviFrame = new WebDriverWait(driver, 5).until(
					new ExpectedCondition<WebElement>() {
						public WebElement apply (WebDriver driver) {
							return findElement(By.id("wasavi_frame"));
						}
					});
			}
			catch (org.openqa.selenium.TimeoutException e) {
				wasaviFrame = null;
			}

			if (wasaviFrame != null) {
				wasaviFrame.click();
				invokeStates[i].incrementCount();
				//System.out.println("found wasavi frame");
				break;
			}
		}

		java.util.Arrays.sort(invokeStates, new Comparator<InvokeState>() {
			public int compare (InvokeState o1, InvokeState o2) {
				return o2.getCount() - o1.getCount();
			}
		});

		return wasaviFrame;
	}

	protected WebElement invokeAppModeWasavi () {
		driver.navigate().to("http://wasavi.appsweets.net/");

		WebElement wasaviFrame = null;

		try {
			wasaviFrame = new WebDriverWait(driver, 5).until(
				new ExpectedCondition<WebElement>() {
					public WebElement apply (WebDriver driver) {
						return findElement(By.id("wasavi_cover"));
					}
				});
		}
		catch (org.openqa.selenium.TimeoutException e) {
			wasaviFrame = null;
		}
		catch (org.openqa.selenium.UnhandledAlertException e) {
			wasaviFrame = null;
		}

		if (wasaviFrame != null) {
			wasaviFrame.click();
		}

		return wasaviFrame;
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
		if (isAppMode) {
			Wasavi.setAppMode(true);
			invokeAppModeWasavi();
		}
		else {
			Wasavi.setAppMode(false);
			invokeWasavi();
		}
	}

	@After
	public void tearDown () {
		if (isAppMode) {
			Wasavi.send(":set nomodified\n");
		}

		WebElement testLog = findElement(By.id("test-log"));
		if (testLog != null) {
			logText.add(testLog.getAttribute("value"));

			Wasavi.js(
				"var wasaviFrame = document.getElementById('wasavi_frame');" +
				"wasaviFrame && wasaviFrame.parentNode.removeChild(wasaviFrame);");
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
