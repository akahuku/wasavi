package WasaviTest;

import static WasaviTest.WasaviAsserts.*;
import static WasaviTest.WasaviUtils.*;

import java.util.*;
import org.junit.*;
import static org.junit.Assert.*;

import org.openqa.selenium.By;
import org.openqa.selenium.Keys;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.interactions.Actions;
import org.openqa.selenium.support.ui.*;
import static org.openqa.selenium.support.ui.ExpectedConditions.*;

public class SurroundingTest extends WasaviTest {
	/*
	 * quotation deletion
	 */

	@Test
	public void removeQuotation () {
		Wasavi.send("i'abc\\'def'\n'abc\\'def'\u001b");

		Wasavi.send("1G2|ds'");
		assertValue("#1-1", "abc\\'def\n'abc\\'def'");

		Wasavi.send("u");
		assertValue("#2-1", "'abc\\'def'\n'abc\\'def'");

		Wasavi.send("\u0012");
		assertValue("#3-1", "abc\\'def\n'abc\\'def'");

		assertEquals("#4-1", "ds'", Wasavi.getLastSimpleCommand());

		Wasavi.send("G1|.");
		assertValue("#5-1", "abc\\'def\nabc\\'def");
	}

	@Test
	public void removeQuotations () {
		String quotes = "!#$%&*+,-.:;=?@^_|~\"'`";
		int len = quotes.length();

		// build test buffer
		StringBuilder insertCommands = new StringBuilder("i");
		for (int i = 0; i < len; i++) {
			char c = quotes.charAt(i);
			insertCommands.append(String.format("%cabc\\%cdef%c\n", c, c, c));
		}
		insertCommands.append("\u001b");
		Wasavi.send(insertCommands.toString());

		// build test commands
		StringBuilder testCommands = new StringBuilder();
		for (int i = 0; i < len; i++) {
			testCommands.append(String.format("%dG2|ds%c", i + 1, quotes.charAt(i)));
		}
		Wasavi.send(testCommands.toString());

		// build result
		StringBuilder result = new StringBuilder();
		for (int i = 0; i < len; i++) {
			result.append(String.format("abc\\%cdef\n", quotes.charAt(i)));
		}

		// test
		assertValue("#1-1", result.toString());
	}

	@Test
	public void removeBackslashAsQuotation () {
		Wasavi.send(
			":set quoteescape=@\n" +
			"i\\abc@\\def\\\u001b");
		Wasavi.send("2|ds\\");
		assertValue("#1-1", "abc@\\def");
	}

	@Test
	public void removeInvalidQuotation () {
		Wasavi.send("i/abc\\/def/\u001b");
		Wasavi.send("2|ds/");
		assertValue("#1-1", "/abc\\/def/");
	}

	/*
	 * bracket deletion
	 */

	@Test
	public void removeBracket () {
		Wasavi.send("i{foo}\n{foo}\u001b");

		Wasavi.send("1Gds{");
		assertValue("#1-1", "foo\n{foo}");

		Wasavi.send("u");
		assertValue("#2-1", "{foo}\n{foo}");

		Wasavi.send("\u0012");
		assertValue("#3-1", "foo\n{foo}");

		assertEquals("#4-1", "ds{", Wasavi.getLastSimpleCommand());

		Wasavi.send("G1|.");
		assertValue("#5-1", "foo\nfoo");
	}

	@Test
	public void removeMultilineBracket () {
		Wasavi.send(":set noai\n");
		Wasavi.send("i{\n\tfoo\nbar\n}\u001b");
		Wasavi.send("2Gds{");
		assertValue("#1-1", "foo\nbar");

		Wasavi.send("u");
		assertValue("#2-1", "{\n\tfoo\nbar\n}");

		Wasavi.send("\u0012");
		assertValue("#3-1", "foo\nbar");
	}

	@Test
	public void removeBracketWithSpace () {
		Wasavi.send(":set noai\n");

		// ++++++++++++    ++++++++++++
		// +....{          +(deleted)
		// +........foo    +....foo
		// +....}          +(deleted)
		// ++++++++++++    ++++++++++++
		Wasavi.send("i    {\n        foo\n    }\u001b");
		Wasavi.send("2Gds{");
		assertValue("#1-1", "    foo");

		//
		// ++++++++++++    ++++++++++++
		// +....{...bar    +....bar
		// +........foo    +....foo
		// +....}          +(deleted)
		// ++++++++++++    ++++++++++++
		Wasavi.send("1GcG    {   bar\n        foo\n    }\u001b");
		Wasavi.send("2Gds{");
		assertValue("#2-1", "    bar\n    foo");

		//
		// ++++++++++++    ++++++++++++
		// +....{          +(deleted)
		// +........foo    +....foo
		// +....bar.}      +....bar
		// ++++++++++++    ++++++++++++
		Wasavi.send("1GcG    {\n        foo\n    bar }\u001b");
		Wasavi.send("2Gds{");
		assertValue("#3-1", "    foo\n    bar");

		//
		// ++++++++++++    ++++++++++++
		// +....{...bar    +....bar
		// +........foo    +....foo
		// +....baz.}      +....baz
		// ++++++++++++    ++++++++++++
		Wasavi.send("1GcG    {   bar\n        foo\n    baz }\u001b");
		Wasavi.send("2Gds{");
		assertValue("#3-1", "    bar\n    foo\n    baz");
	}

	@Test
	public void removeBrackets () {
		Map<String, String> m = new HashMap<String, String>();
		m.put("a", "<>");
		m.put("b", "()");
		m.put("B", "{}");
		m.put("r", "[]");
		m.put("[", "[]");
		m.put("]", "[]");
		m.put("{", "{}");
		m.put("}", "{}");
		m.put("(", "()");
		m.put(")", "()");

		// build test buffer
		StringBuilder insertCommands = new StringBuilder("i");
		for (Map.Entry<String, String> e: m.entrySet()) {
			insertCommands.append(String.format(
				"%cFOO%c\n",
				e.getValue().charAt(0),
				e.getValue().charAt(1)));
		}
		insertCommands.append("\u001b");
		Wasavi.send(insertCommands.toString());

		// build test commands
		StringBuilder testCommands = new StringBuilder();
		int i = 1;
		for (Map.Entry<String, String> e: m.entrySet()) {
			testCommands.append(String.format("%dG2|ds%s", i++, e.getKey()));
		}
		Wasavi.send(testCommands.toString());

		// build result
		StringBuilder result = new StringBuilder();
		for (Map.Entry<String, String> e: m.entrySet()) {
			result.append("FOO\n");
		}

		// test
		assertValue("#1-1", result.toString());
	}

	@Test
	public void removeInvalidBracket () {
		Wasavi.send("i{abc\\/def\u001b");
		Wasavi.send("2|ds{");
		assertValue("#1-1", "{abc\\/def");
	}

	/*
	 * tag deletion
	 */

	@Test
	public void removeTag () {
		Wasavi.send("i<a>foo</a>\n<a>foo</a>\u001b");

		Wasavi.send("1Gffdst");
		assertValue("#1-1", "foo\n<a>foo</a>");

		Wasavi.send("u");
		assertValue("#2-1", "<a>foo</a>\n<a>foo</a>");

		Wasavi.send("\u0012");
		assertValue("#3-1", "foo\n<a>foo</a>");

		assertEquals("#4-1", "dst", Wasavi.getLastSimpleCommand());

		Wasavi.send("G1|.");
		assertValue("#5-1", "foo\nfoo");
	}

	@Test
	public void removeMultilineTag () {
		Wasavi.send("i<a>\nfoo\n</a>\u001b");

		Wasavi.send("2G2|dst");
		assertValue("#1-1", "foo");

		Wasavi.send("u");
		assertValue("#2-1", "<a>\nfoo\n</a>");

		Wasavi.send("\u0012");
		assertValue("#3-1", "foo");
	}

	@Test
	public void removeInvalidTag () {
		Wasavi.send("i<a>\nfoo\u001b");
		Wasavi.send("dst");
		assertValue("#1-1", "<a>\nfoo");
	}

	/*
	 * quotation insertion
	 */

	@Test
	public void insertQuotation () {
		Wasavi.send("iabcdef\nabcdef\u001b");

		Wasavi.send("1G2|ysiw'");
		assertValue("#1-1", "'abcdef'\nabcdef");

		Wasavi.send("u");
		assertValue("#2-1", "abcdef\nabcdef");

		Wasavi.send("\u0012");
		assertValue("#3-1", "'abcdef'\nabcdef");

		assertEquals("#4-1", "ysiw'\n", Wasavi.getLastSimpleCommand());

		Wasavi.send("G1|.");
		assertValue("#5-1", "'abcdef'\n'abcdef'");
	}

	@Test
	public void insertQuotationToBound () {
		Wasavi.send("iabcdef\nabcdef\u001b");

		Wasavi.send("1G2|viwS'");
		assertValue("#1-1", "'abcdef'\nabcdef");

		Wasavi.send("u");
		assertValue("#2-1", "abcdef\nabcdef");

		Wasavi.send("\u0012");
		assertValue("#3-1", "'abcdef'\nabcdef");

		assertEquals("#4-1", "viwS'\n", Wasavi.getLastSimpleCommand());

		Wasavi.send("G1|.");
		assertValue("#5-1", "'abcdef'\n'abcdef'");
	}

	@Test
	public void insertMultilineQuotationToBound () {
		Wasavi.send("iabcdef\nabcdef\u001b");

		Wasavi.send("1G2|viwgS'");
		assertValue("#1-1", "'\n    abcdef\n'\nabcdef");

		Wasavi.send("u");
		assertValue("#2-1", "abcdef\nabcdef");

		Wasavi.send("\u0012");
		assertValue("#3-1", "'\n    abcdef\n'\nabcdef");

		assertEquals("#4-1", "viwgS'\n", Wasavi.getLastSimpleCommand());

		Wasavi.send("G1|.");
		assertValue("#5-1", "'\n    abcdef\n'\n'\n    abcdef\n'");
	}

	@Test
	public void insertQuotationLinewise () {
		Wasavi.send("iabcdef\nabcdef\u001b");

		Wasavi.send("1G2|ys_'");
		assertValue("#1-1", "'\n    abcdef\n'\nabcdef");

		Wasavi.send("u");
		assertValue("#2-1", "abcdef\nabcdef");

		Wasavi.send("\u0012");
		assertValue("#3-1", "'\n    abcdef\n'\nabcdef");

		assertEquals("#4-1", "ys_'\n", Wasavi.getLastSimpleCommand());

		Wasavi.send("G1|.");
		assertValue("#5-1", "'\n    abcdef\n'\n'\n    abcdef\n'");
	}

	@Test
	public void insertMultilineQuotation () {
		Wasavi.send("iabcdef\nabcdef\u001b");

		Wasavi.send("1G2|ySiw'");
		assertValue("#1-1", "'\n    abcdef\n'\nabcdef");

		Wasavi.send("u");
		assertValue("#2-1", "abcdef\nabcdef");

		Wasavi.send("\u0012");
		assertValue("#3-1", "'\n    abcdef\n'\nabcdef");

		assertEquals("#4-1", "ySiw'\n", Wasavi.getLastSimpleCommand());

		Wasavi.send("G1|.");
		assertValue("#5-1", "'\n    abcdef\n'\n'\n    abcdef\n'");
	}

	@Test
	public void insertQuotationAlias () {
		Wasavi.send("i    foo\u001b");
		Wasavi.send("yss'");
		assertValue("#1-1", "    'foo'");

		Wasavi.send("u");
		Wasavi.send("yss '");
		assertValue("#2-1", "    ' foo '");
	}

	@Test
	public void insertQuotationAliasLinewise () {
		Wasavi.send("i    foo\u001b");
		Wasavi.send("ySS'");
		assertValue("#1-1", "    '\n\tfoo\n    '");

		Wasavi.send("u");
		Wasavi.send("ySs'");
		assertValue("#2-1", "    '\n\tfoo\n    '");

		Wasavi.send("u");
		Wasavi.send("ySs '");
		assertValue("#3-1", "    '\n\tfoo\n    '");
	}

	/*
	 * bracket insertion
	 */

	private Map<String, String[]> createBracketMap () {
		Map<String, String[]> m = new HashMap<String, String[]>();
		m.put("[", new String[]{"[ ", " ]"});
		m.put("]", new String[]{"[",  "]"});
		m.put("{", new String[]{"{ ", " }"});
		m.put("}", new String[]{"{",  "}"});
		m.put("(", new String[]{"( ", " )"});
		m.put(")", new String[]{"(",  ")"});

		// ',' is used to input a tag so dare to be ignored here.
		String singles = "!#$%&*+\\-.:;=?@^_|~";
		for (String s: singles.split("")) {
			m.put(s, new String[]{s, s});
		}

		m.put("b", new String[]{"(", ")"});
		m.put("B", new String[]{"{ ", " }"});
		m.put("r", new String[]{"[", "]"});
		m.put("a", new String[]{"<", ">"});
		m.put("p", new String[]{"\n", "\n\n"});
		m.put("s", new String[]{" ", ""});
		m.put(":", new String[]{":", ""});

		for (int i = (int)"a".charAt(0), goal = (int)"z".charAt(0); i <= goal; i++) {
			String s = Character.toString((char)i);
			if (s.equals("t")) continue;
			if (m.containsKey(s)) continue;
			m.put(s, new String[]{"", ""});
		}

		for (int i = (int)"A".charAt(0), goal = (int)"Z".charAt(0); i <= goal; i++) {
			String s = Character.toString((char)i);
			if (s.equals("T")) continue;
			if (m.containsKey(s)) continue;
			m.put(s, new String[]{"", ""});
		}

		return m;
	}

	@Test
	public void insertBrackets () {
		Map<String, String[]> m = createBracketMap();

		//
		int i = 1;
		for (Map.Entry<String, String[]> e: m.entrySet()) {
			String key = e.getKey();
			String value[] = e.getValue();

			Wasavi.send(String.format("1G1|cG0\u0004FOO\u001bysaw%s", key));

			if (value[0].equals("") && value[1].equals("")) {
				assertValue(
					String.format("#%d-1: %s", i, key),
					"FOO");
			}
			else {
				assertValue(
					String.format("#%d-1: %s", i, key),
					String.format("%sFOO%s", value[0], value[1]));
			}

			i++;
		}
	}

	@Test
	public void insertBracketsLinewise () {
		Map<String, String[]> m = createBracketMap();

		//
		int i = 1;
		for (Map.Entry<String, String[]> e: m.entrySet()) {
			String key = e.getKey();
			String value[] = e.getValue();

			Wasavi.send(String.format("1G1|cG0\u0004%s-FOO\u001bySaW%s", key, key));

			if (value[0].equals("") && value[1].equals("")) {
				assertValue(
					String.format("#%d-1: %s", i, key),
					String.format("%s-FOO", key));
			}
			else {
				assertValue(
					String.format("#%d-1: %s", i, key),
					String.format("%s\n    %s-FOO\n%s",
						value[0].replaceAll(" +$", ""),
						key,
						value[1].replaceAll("^ +", "")));
			}

			i++;
		}
	}

	@Test
	public void insertBracketsWithExtraSpaces () {
		Map<String, String[]> m = createBracketMap();

		//
		int i = 1;
		for (Map.Entry<String, String[]> e: m.entrySet()) {
			String key = e.getKey();
			String value[] = e.getValue();

			Wasavi.send(String.format("1G1|cG0\u0004FOO\u001bysaw %s", key));

			if (value[0].equals("") && value[1].equals("")) {
				assertValue(
					String.format("#%d-1: %s", i, key),
					"FOO");
			}
			else {
				assertValue(
					String.format("#%d-1: %s", i, key),
					String.format("%s FOO %s",
						value[0].replaceAll(" +$", ""),
						value[1].replaceAll("^ +", "")));
			}

			i++;
		}
	}

	/*
	 * tag insertion
	 */

	@Test
	public void insertTag () {
		for (String s: "<Tt".split("")) {
			Wasavi.send("ggcG0\u0004line1\nline2\u001b");

			Wasavi.send(String.format("1Gysiw%shead foo='bar'>", s));
			assertValue("#1-1", "<head foo='bar'>line1</head>\nline2");

			Wasavi.send("u");
			assertValue("#2-1", "line1\nline2");

			Wasavi.send("\u0012");
			assertValue("#3-1", "<head foo='bar'>line1</head>\nline2");

			assertEquals(
				"#4-1",
				String.format("ysiw%shead foo='bar'>\n", s),
				Wasavi.getLastSimpleCommand());

			Wasavi.send("G.");
			assertValue("#5-1",
				"<head foo='bar'>line1</head>\n" +
				"<head foo='bar'>line2</head>");
		}
	}

	@Test
	public void insertTagViaAlias () {
		for (String s: "<Tt".split("")) {
			Wasavi.send("ggcG0\u0004line1\n\tline2\u001b");

			Wasavi.send(String.format("1Gyss%shead foo='bar'>", s));
			assertValue("#1-1", "<head foo='bar'>line1</head>\n\tline2");

			Wasavi.send("u");
			assertValue("#2-1", "line1\n\tline2");

			Wasavi.send("\u0012");
			assertValue("#3-1", "<head foo='bar'>line1</head>\n\tline2");

			assertEquals(
				"#4-1",
				String.format("yss%shead foo='bar'>\n", s),
				Wasavi.getLastSimpleCommand());

			Wasavi.send("G0.");
			assertValue("#5-1",
				"<head foo='bar'>line1</head>\n" +
				"\t<head foo='bar'>line2</head>");
		}
	}

	@Test
	public void insertMultilineTag () {
		for (String s: "\u0014,".split("")) {
			Wasavi.send("ggcG0\u0004line1\nline2\u001b");

			Wasavi.send(String.format("1Gysiw%shead foo='bar'>", s));
			assertValue("#1-1", "<head foo='bar'>\n    line1\n</head>\nline2");

			Wasavi.send("u");
			assertValue("#2-1", "line1\nline2");

			Wasavi.send("\u0012");
			assertValue("#3-1", "<head foo='bar'>\n    line1\n</head>\nline2");

			assertEquals(
				"#4-1",
				String.format("ysiw%shead foo='bar'>\n", s),
				Wasavi.getLastSimpleCommand());

			Wasavi.send("G.");
			assertValue("#5-1",
				"<head foo='bar'>\n    line1\n</head>\n" +
				"<head foo='bar'>\n    line2\n</head>");
		}
	}

	@Test
	public void insertMultilineTagViaOperator () {
		for (String s: "\u0014,<Tt".split("")) {
			Wasavi.send("ggcG0\u0004line1\nline2\u001b");

			Wasavi.send(String.format("1GySiw%shead foo='bar'>", s));
			assertValue("#1-1", "<head foo='bar'>\n    line1\n</head>\nline2");

			Wasavi.send("u");
			assertValue("#2-1", "line1\nline2");

			Wasavi.send("\u0012");
			assertValue("#3-1", "<head foo='bar'>\n    line1\n</head>\nline2");

			assertEquals(
				"#4-1",
				String.format("ySiw%shead foo='bar'>\n", s),
				Wasavi.getLastSimpleCommand());

			Wasavi.send("G.");
			assertValue("#5-1",
				"<head foo='bar'>\n    line1\n</head>\n" +
				"<head foo='bar'>\n    line2\n</head>");
		}
	}

	@Test
	public void insertTagLinewise () {
		for (String s: "\u0014,<Tt".split("")) {
			Wasavi.send("ggcG0\u0004line1\nline2\u001b");

			Wasavi.send(String.format("1Gys_%shead foo='bar'>", s));
			assertValue("#1-1", "<head foo='bar'>\n    line1\n</head>\nline2");

			Wasavi.send("u");
			assertValue("#2-1", "line1\nline2");

			Wasavi.send("\u0012");
			assertValue("#3-1", "<head foo='bar'>\n    line1\n</head>\nline2");

			assertEquals(
				"#4-1",
				String.format("ys_%shead foo='bar'>\n", s),
				Wasavi.getLastSimpleCommand());

			Wasavi.send("G.");
			assertValue("#5-1",
				"<head foo='bar'>\n    line1\n</head>\n" +
				"<head foo='bar'>\n    line2\n</head>");
		}
	}

	// TODO: insertTagLinewiseViaOperatorAlias

	/*
	 * changing a quotation
	 */

	@Test
	public void changeQuotation () {
		Wasavi.send("i'abc\\'def'\n'abc\\'def'\u001b");

		Wasavi.send("1G2|cs'\"");
		assertValue("#1-1", "\"abc\\'def\"\n'abc\\'def'");

		Wasavi.send("u");
		assertValue("#2-1", "'abc\\'def'\n'abc\\'def'");

		Wasavi.send("\u0012");
		assertValue("#3-1", "\"abc\\'def\"\n'abc\\'def'");

		assertEquals("#4-1", "cs'\"", Wasavi.getLastSimpleCommand());

		Wasavi.send("G1|.");
		assertValue("#5-1", "\"abc\\'def\"\n\"abc\\'def\"");
	}

	@Test
	public void changeInvalidQuotation () {
		Wasavi.send("i/abc\\/def/\u001b");
		Wasavi.send("2|cs/[");
		assertValue("#1-1", "/abc\\/def/");
	}

	/*
	 * changing a bracket
	 */

	@Test
	public void changeBracket () {
		Wasavi.send("i{foo}\n{foo}\u001b");

		Wasavi.send("1Gcs{(");
		assertValue("#1-1", "( foo )\n{foo}");

		Wasavi.send("u");
		assertValue("#2-1", "{foo}\n{foo}");

		Wasavi.send("\u0012");
		assertValue("#3-1", "( foo )\n{foo}");

		assertEquals("#4-1", "cs{(", Wasavi.getLastSimpleCommand());

		Wasavi.send("G1|.");
		assertValue("#5-1", "( foo )\n( foo )");
	}

	@Test
	public void changeInvalidBracket () {
		Wasavi.send("i{abc\\/def\u001b");
		Wasavi.send("2|cs{(");
		assertValue("#1-1", "{abc\\/def");
	}

	@Test
	public void changeMultilineBracket () {
		Wasavi.send(":set noai\n");
		Wasavi.send("i{\n\tfoo\nbar\n}\u001b");
		Wasavi.send("2Gcs{[");
		assertValue("#1-1", "[\n\tfoo\nbar\n]");

		Wasavi.send("u");
		assertValue("#2-1", "{\n\tfoo\nbar\n}");

		Wasavi.send("\u0012");
		assertValue("#3-1", "[\n\tfoo\nbar\n]");
	}

	@Test
	public void changeMultilineBracketNonOrphan () {
		Wasavi.send(":set noai\n");
		Wasavi.send("i{baz\n\tfoo\nbar\nbax}\u001b");
		Wasavi.send("2Gcs{[");
		assertValue("#1-1", "[ baz\n\tfoo\nbar\nbax ]");

		Wasavi.send("u");
		assertValue("#2-1", "{baz\n\tfoo\nbar\nbax}");

		Wasavi.send("\u0012");
		assertValue("#3-1", "[ baz\n\tfoo\nbar\nbax ]");
	}

	@Test
	public void changeTag () {
		Wasavi.send("i<a>foo</a>\n<a>foo</a>\u001b");

		Wasavi.send("1Gcst[");
		assertValue("#1-1", "[ foo ]\n<a>foo</a>");

		Wasavi.send("u");
		assertValue("#2-1", "<a>foo</a>\n<a>foo</a>");

		Wasavi.send("\u0012");
		assertValue("#3-1", "[ foo ]\n<a>foo</a>");

		assertEquals("#4-1", "cst[", Wasavi.getLastSimpleCommand());

		Wasavi.send("G.");
		assertValue("#5-1", "[ foo ]\n[ foo ]");
	}

	@Test
	public void changeMultilineTag () {
		Wasavi.send("i<a>\nfoo\n</a>\u001b");

		Wasavi.send("2G2|cst[");
		assertValue("#1-1", "[\nfoo\n]");

		Wasavi.send("u");
		assertValue("#2-1", "<a>\nfoo\n</a>");

		Wasavi.send("\u0012");
		assertValue("#3-1", "[\nfoo\n]");
	}

	@Test
	public void changeInvalidTag () {
		Wasavi.send("i<a>\nfoo\u001b");
		Wasavi.send("cst{");
		assertValue("#1-1", "<a>\nfoo");
	}
}
