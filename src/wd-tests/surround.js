'use strict';

const {By, Key, until, promise} = require('selenium-webdriver');
const {it, describe} = require('selenium-webdriver/testing');

exports.suite = (assert, wasavi, driver) => {
	const {ctrln, ctrlt, ctrlw} = assert.shortcuts;

	/*
	 * quotation deletion
	 */

	it('remove quotation', function* () {
		yield wasavi.send('i"abc\\"def"\n"abc\\"def"\u001b');

		yield wasavi.send('1G2|ds"');
		assert.value('#1-1', 'abc\\"def\n"abc\\"def"');

		yield wasavi.send('u');
		assert.value('#2-1', '"abc\\"def"\n"abc\\"def"');

		yield wasavi.send('\u0012');
		assert.value('#3-1', 'abc\\"def\n"abc\\"def"');

		assert.eq('#4-1', 'ds"', wasavi.getLastSimpleCommand());

		yield wasavi.send('G1|.');
		assert.value('#5-1', 'abc\\"def\nabc\\"def');
	});

	it('remove quotations', function* () {
		var quotes = '!#$%&*+,-.:;=?@^_|~"\"`';
		var len = quotes.length;

		// increase timeout limit
		this.timeout(1000 * 2 * quotes.length);

		// build test buffer
		var insertCommands = 'i';
		for (var i = 0; i < len; i++) {
			var c = quotes.charAt(i);
			insertCommands += `${c}abc\\${c}def${c}\n`;
		}
		insertCommands += '\u001b';
		yield wasavi.send(insertCommands);

		// build test commands
		var testCommands = '';
		for (var i = 0; i < len; i++) {
			testCommands += `${i + 1}G2|ds${quotes.charAt(i)}`;
		}
		yield wasavi.send(testCommands);

		// build result
		var result = '';
		for (var i = 0; i < len; i++) {
			result += `abc\\${quotes.charAt(i)}def\n`;
		}

		// test
		assert.value('#1-1', result);
	});

	it('remove backslash as quotation', function* () {
		yield wasavi.send(
			':set quoteescape=@\n' +
			'i\\abc@\\def\\\u001b');
		yield wasavi.send('2|ds\\');
		assert.value('#1-1', 'abc@\\def');
	});

	it('remove invalid quotation', function* () {
		yield wasavi.send('i/abc\\/def/\u001b');
		yield wasavi.send('2|ds/');
		assert.value('#1-1', '/abc\\/def/');
	});

	/*
	 * bracket deletion
	 */

	it('remove bracket', function* () {
		yield wasavi.send('i{foo}\n{foo}\u001b');

		yield wasavi.send('1Gds{');
		assert.value('#1-1', 'foo\n{foo}');

		yield wasavi.send('u');
		assert.value('#2-1', '{foo}\n{foo}');

		yield wasavi.send('\u0012');
		assert.value('#3-1', 'foo\n{foo}');

		assert.eq('#4-1', 'ds{', wasavi.getLastSimpleCommand());

		yield wasavi.send('G1|.');
		assert.value('#5-1', 'foo\nfoo');
	});

	it('remove multiline bracket', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('i{\n\tfoo\nbar\n}\u001b');
		yield wasavi.send('2Gds{');
		assert.value('#1-1', 'foo\nbar');

		yield wasavi.send('u');
		assert.value('#2-1', '{\n\tfoo\nbar\n}');

		yield wasavi.send('\u0012');
		assert.value('#3-1', 'foo\nbar');
	});

	it('remove bracket with space', function* () {
		yield wasavi.send(':set noai\n');

		// ++++++++++++    ++++++++++++
		// +....{          +(deleted)
		// +........foo    +....foo
		// +....}          +(deleted)
		// ++++++++++++    ++++++++++++
		yield wasavi.send('i    {\n        foo\n    }\u001b');
		yield wasavi.send('2Gds{');
		assert.value('#1-1', '    foo');

		//
		// ++++++++++++    ++++++++++++
		// +....{...bar    +....bar
		// +........foo    +....foo
		// +....}          +(deleted)
		// ++++++++++++    ++++++++++++
		yield wasavi.send('1GcG    {   bar\n        foo\n    }\u001b');
		yield wasavi.send('2Gds{');
		assert.value('#2-1', '    bar\n    foo');

		//
		// ++++++++++++    ++++++++++++
		// +....{          +(deleted)
		// +........foo    +....foo
		// +....bar.}      +....bar
		// ++++++++++++    ++++++++++++
		yield wasavi.send('1GcG    {\n        foo\n    bar }\u001b');
		yield wasavi.send('2Gds{');
		assert.value('#3-1', '    foo\n    bar');

		//
		// ++++++++++++    ++++++++++++
		// +....{...bar    +....bar
		// +........foo    +....foo
		// +....baz.}      +....baz
		// ++++++++++++    ++++++++++++
		yield wasavi.send('1GcG    {   bar\n        foo\n    baz }\u001b');
		yield wasavi.send('2Gds{');
		assert.value('#3-1', '    bar\n    foo\n    baz');
	});

	it('remove brackets', function* () {
		var m = {
			'a': '<>',
			'b': '()',
			'B': '{}',
			'r': '[]',
			'[': '[]',
			']': '[]',
			'{': '{}',
			'}': '{}',
			'(': '()',
			')': '()'
		}

		// increase timeout limit
		this.timeout(1000 * 2 * Object.keys(m).length);

		// build test buffer
		var insertCommands = 'i';
		for (var i in m) {
			insertCommands += `${m[i].charAt(0)}FOO${m[i].charAt(1)}\n`;
		}
		insertCommands += '\u001b';
		yield wasavi.send(insertCommands);

		// build test commands
		var testCommands = '';
		var index = 1;
		for (var i in m) {
			testCommands += `${index++}G2|ds${i}`;
		}
		yield wasavi.send(testCommands);

		// build result
		var result = '';
		for (var i in m) {
			result += 'FOO\n';
		}

		// test
		assert.value('#1-1', result);
	});

	it('remove invalid bracket', function* () {
		yield wasavi.send('i{abc\\/def\u001b');
		yield wasavi.send('2|ds{');
		assert.value('#1-1', '{abc\\/def');
	});

	/*
	 * tag deletion
	 */

	it('remove tag', function* () {
		yield wasavi.send('i<a>foo</a>\n<a>foo</a>\u001b');

		yield wasavi.send('1Gffdst');
		assert.value('#1-1', 'foo\n<a>foo</a>');

		yield wasavi.send('u');
		assert.value('#2-1', '<a>foo</a>\n<a>foo</a>');

		yield wasavi.send('\u0012');
		assert.value('#3-1', 'foo\n<a>foo</a>');

		assert.eq('#4-1', 'dst', wasavi.getLastSimpleCommand());

		yield wasavi.send('G1|.');
		assert.value('#5-1', 'foo\nfoo');
	});

	it('remove multiline tag', function* () {
		yield wasavi.send('i<a>\nfoo\n</a>\u001b');

		yield wasavi.send('2G2|dst');
		assert.value('#1-1', 'foo');

		yield wasavi.send('u');
		assert.value('#2-1', '<a>\nfoo\n</a>');

		yield wasavi.send('\u0012');
		assert.value('#3-1', 'foo');
	});

	it('remove invalid tag', function* () {
		yield wasavi.send('i<a>\nfoo\u001b');
		yield wasavi.send('dst');
		assert.value('#1-1', '<a>\nfoo');
	});

	/*
	 * quotation insertion
	 */

	it('insert quotation', function* () {
		yield wasavi.send('iabcdef\nabcdef\u001b');

		yield wasavi.send('1G2|ysiw\'');
		assert.value('#1-1', '\'abcdef\'\nabcdef');

		yield wasavi.send('u');
		assert.value('#2-1', 'abcdef\nabcdef');

		yield wasavi.send('\u0012');
		assert.value('#3-1', '\'abcdef\'\nabcdef');

		assert.eq('#4-1', 'ysiw\'', wasavi.getLastSimpleCommand());

		yield wasavi.send('G1|.');
		assert.value('#5-1', '\'abcdef\'\n\'abcdef\'');
	});

	it('insert quotation to bound', function* () {
		yield wasavi.send('iabcdef\nabcdef\u001b');

		yield wasavi.send('1G2|viwS\'');
		assert.value('#1-1', '\'abcdef\'\nabcdef');

		yield wasavi.send('u');
		assert.value('#2-1', 'abcdef\nabcdef');

		yield wasavi.send('\u0012');
		assert.value('#3-1', '\'abcdef\'\nabcdef');

		assert.eq('#4-1', 'viwS\'', wasavi.getLastSimpleCommand());

		yield wasavi.send('G1|.');
		assert.value('#5-1', '\'abcdef\'\n\'abcdef\'');
	});

	it('insert multiline quotation to bound', function* () {
		yield wasavi.send('iabcdef\nabcdef\u001b');

		yield wasavi.send('1G2|viwgS\'');
		assert.value('#1-1', '\'\n    abcdef\n\'\nabcdef');

		yield wasavi.send('u');
		assert.value('#2-1', 'abcdef\nabcdef');

		yield wasavi.send('\u0012');
		assert.value('#3-1', '\'\n    abcdef\n\'\nabcdef');

		assert.eq('#4-1', 'viwgS\'', wasavi.getLastSimpleCommand());

		yield wasavi.send('G1|.');
		assert.value('#5-1', '\'\n    abcdef\n\'\n\'\n    abcdef\n\'');
	});

	it('insert quotation linewise', function* () {
		yield wasavi.send('iabcdef\nabcdef\u001b');

		yield wasavi.send('1G2|ys_\'');
		assert.value('#1-1', '\'\n    abcdef\n\'\nabcdef');

		yield wasavi.send('u');
		assert.value('#2-1', 'abcdef\nabcdef');

		yield wasavi.send('\u0012');
		assert.value('#3-1', '\'\n    abcdef\n\'\nabcdef');

		assert.eq('#4-1', 'ys_\'', wasavi.getLastSimpleCommand());

		yield wasavi.send('G1|.');
		assert.value('#5-1', '\'\n    abcdef\n\'\n\'\n    abcdef\n\'');
	});

	it('insert multiline quotation', function* () {
		yield wasavi.send('iabcdef\nabcdef\u001b');

		yield wasavi.send('1G2|ySiw\'');
		assert.value('#1-1', '\'\n    abcdef\n\'\nabcdef');

		yield wasavi.send('u');
		assert.value('#2-1', 'abcdef\nabcdef');

		yield wasavi.send('\u0012');
		assert.value('#3-1', '\'\n    abcdef\n\'\nabcdef');

		assert.eq('#4-1', 'ySiw\'', wasavi.getLastSimpleCommand());

		yield wasavi.send('G1|.');
		assert.value('#5-1', '\'\n    abcdef\n\'\n\'\n    abcdef\n\'');
	});

	it('insert quotation alias', function* () {
		yield wasavi.send('i    foo\u001b');
		yield wasavi.send('yss\'');
		assert.value('#1-1', '    \'foo\'');

		yield wasavi.send('u');
		yield wasavi.send('yss \'');
		assert.value('#2-1', '    \' foo \'');
	});

	it('insert quotation alias linewise', function* () {
		yield wasavi.send('i    foo\u001b');
		yield wasavi.send('ySS\'');
		assert.value('#1-1', '    \'\n\tfoo\n    \'');

		yield wasavi.send('u');
		yield wasavi.send('ySs\'');
		assert.value('#2-1', '    \'\n\tfoo\n    \'');

		yield wasavi.send('u');
		yield wasavi.send('ySs \'');
		assert.value('#3-1', '    \'\n\tfoo\n    \'');
	});

	/*
	 * bracket insertion
	 */

	function createBracketMap () {
		var m = {
			'[': ['[ ', ' ]'],
			']': ['[',  ']'],
			'{': ['{ ', ' }'],
			'}': ['{',  '}'],
			'(': ['( ', ' )'],
			')': ['(',  ')']
		}

		// "," is used to input a tag so dare to be ignored here.
		var singles = '!#$%&*+\\-.:;=?@^_|~';
		singles.split('').forEach(s => m[s] = [s, s]);

		m['b'] = ['(',  ')'];
		m['B'] = ['{ ', ' }'];
		m['r'] = ['[',  ']'];
		m['a'] = ['<',  '>'];
		m['p'] = ['\n', '\n\n'];
		m['s'] = [' ',  ''];
		m[':'] = [':',  ''];

		for (var i = 'a'.charCodeAt(0), goal = 'z'.charCodeAt(0); i <= goal; i++) {
			var s = String.fromCharCode(i);
			if (s == 't') continue;
			if (s in m) continue;
			m[s] = ['', ''];
		}

		for (var i = 'A'.charCodeAt(0), goal = 'Z'.charCodeAt(0); i <= goal; i++) {
			var s = String.fromCharCode(i);
			if (s == 'T') continue;
			if (s in m) continue;
			m[s] = ['', ''];
		}

		return m;
	}

	it('insert brackets', function* () {
		var m = createBracketMap();

		// increase timeout limit
		this.timeout(1000 * Object.keys(m).length);

		//
		var index = 1;
		for (var key in m) {
			var value = m[key];

			yield wasavi.send(`1G1|cG0\u0004FOO\u001bysaw${key}`);

			if (value[0] == '' && value[1] == '') {
				assert.value(`#${index}-1: ${key}`, 'FOO');
			}
			else {
				assert.value(
					`#${index}-1: ${key}`,
					`${value[0]}FOO${value[1]}`);
			}

			index++;
		}
	});

	it('insert brackets linewise', function* () {
		var m = createBracketMap();

		// increase timeout limit
		this.timeout(1000 * Object.keys(m).length);

		//
		var index = 1;
		for (var key in m) {
			var value = m[key];

			yield wasavi.send(`1G1|cG0\u0004${key}-FOO\u001bySaW${key}`);

			if (value[0] == '' && value[1] == '') {
				assert.value(`#${index}-1: ${key}`, `${key}-FOO`);
			}
			else {
				var trim0 = value[0].replace(/ +$/, '');
				var trim1 = value[1].replace(/^ +/, '');
				assert.value(
					`#${index}-1: ${key}`,
					`${trim0}\n    ${key}-FOO\n${trim1}`);
			}

			index++;
		}
	});

	it('insert brackets with extra spaces', function* () {
		var m = createBracketMap();

		// increase timeout limit
		this.timeout(1000 * Object.keys(m).length);

		//
		var index = 1;
		for (var key in m) {
			var value = m[key];

			yield wasavi.send(`1G1|cG0\u0004FOO\u001bysaw ${key}`);

			if (value[0] == '' && value[1] == '') {
				assert.value(`#${index}-1: ${key}`, 'FOO');
			}
			else {
				var trim0 = value[0].replace(/ +$/, '');
				var trim1 = value[1].replace(/^ +/, '');
				assert.value(
					`#${index}-1: ${key}`,
					`${trim0} FOO ${trim1}`);
			}

			index++;
		}
	});

	/*
	 * tag insertion
	 */

	it('insert tag', function* () {
		var tags = '<Tt'.split('');

		// increase timeout limit
		this.timeout(1000 * 5 * tags.length);

		for (var i = 0; i < tags.length; i++) {
			var s = tags[i];

			yield wasavi.send('ggcG0\u0004line1\nline2\u001b');

			yield wasavi.send(`1Gysiw${s}head foo="bar">`);
			assert.value('#1-1', '<head foo="bar">line1</head>\nline2');

			yield wasavi.send('u');
			assert.value('#2-1', 'line1\nline2');

			yield wasavi.send('\u0012');
			assert.value('#3-1', '<head foo="bar">line1</head>\nline2');

			assert.eq(
				'#4-1',
				`ysiw${s}head foo="bar">`,
				wasavi.getLastSimpleCommand());

			yield wasavi.send('G.');
			assert.value('#5-1',
				'<head foo="bar">line1</head>\n' +
				'<head foo="bar">line2</head>');
		}
	});

	it('insert tag via alias', function* () {
		var tags = '<Tt'.split('');

		// increase timeout limit
		this.timeout(1000 * 5 * tags.length);

		for (var i = 0; i < tags.length; i++) {
			var s = tags[i];

			yield wasavi.send('ggcG0\u0004line1\n\tline2\u001b');

			yield wasavi.send(`1Gyss${s}head foo="bar">`);
			assert.value('#1-1', '<head foo="bar">line1</head>\n\tline2');

			yield wasavi.send('u');
			assert.value('#2-1', 'line1\n\tline2');

			yield wasavi.send('\u0012');
			assert.value('#3-1', '<head foo="bar">line1</head>\n\tline2');

			assert.eq(
				'#4-1',
				`yss${s}head foo="bar">`,
				wasavi.getLastSimpleCommand());

			yield wasavi.send('G0.');
			assert.value('#5-1',
				'<head foo="bar">line1</head>\n' +
				'\t<head foo="bar">line2</head>');
		}
	});

	it('insert multiline tag', function* () {
		var keys = [
			[ctrlt, '\u0014'],
			[',', ',']
		];

		// increase timeout limit
		this.timeout(1000 * 5 * keys.length);

		for (var i = 0; i < keys.length; i++) {
			var s = keys[i];

			yield wasavi.send('ggcG0\u0004line1\nline2\u001b');

			yield wasavi.send(`1Gysiw${s[0]}head foo="bar">`);
			assert.value('#1-1', '<head foo="bar">\n    line1\n</head>\nline2');

			yield wasavi.send('u');
			assert.value('#2-1', 'line1\nline2');

			yield wasavi.send('\u0012');
			assert.value('#3-1', '<head foo="bar">\n    line1\n</head>\nline2');

			assert.eq(
				'#4-1',
				`ysiw${s[1]}head foo="bar">`,
				wasavi.getLastSimpleCommand());

			yield wasavi.send('G.');
			assert.value('#5-1',
				'<head foo="bar">\n    line1\n</head>\n' +
				'<head foo="bar">\n    line2\n</head>');
		}
	});

	it('insert multiline tag via operator', function* () {
		var keys = [
			[ctrlt, '\u0014'],
			[',', ','],
			['<', '<'],
			['T', 'T'],
			['t', 't']
		];

		// increase timeout limit
		this.timeout(1000 * 5 * keys.length);

		for (var i = 0; i < keys.length; i++) {
			var s = keys[i];

			yield wasavi.send('ggcG0\u0004line1\nline2\u001b');

			yield wasavi.send(`1GySiw${s[0]}head foo="bar">`);
			assert.value('#1-1', '<head foo="bar">\n    line1\n</head>\nline2');

			yield wasavi.send('u');
			assert.value('#2-1', 'line1\nline2');

			yield wasavi.send('\u0012');
			assert.value('#3-1', '<head foo="bar">\n    line1\n</head>\nline2');

			assert.eq(
				'#4-1',
				`ySiw${s[1]}head foo="bar">`,
				wasavi.getLastSimpleCommand());

			yield wasavi.send('G.');
			assert.value('#5-1',
				'<head foo="bar">\n    line1\n</head>\n' +
				'<head foo="bar">\n    line2\n</head>');
		}
	});

	it('insert tag linewise', function* () {
		var keys = [
			[ctrlt, '\u0014'],
			[',', ','],
			['<', '<'],
			['T', 'T'],
			['t', 't']
		];

		// increase timeout limit
		this.timeout(1000 * 5 * keys.length);

		for (var i = 0; i < keys.length; i++) {
			var s = keys[i];

			yield wasavi.send('ggcG0\u0004line1\nline2\u001b');

			yield wasavi.send(`1Gys_${s[0]}head foo="bar">`);
			assert.value('#1-1', '<head foo="bar">\n    line1\n</head>\nline2');

			yield wasavi.send('u');
			assert.value('#2-1', 'line1\nline2');

			yield wasavi.send('\u0012');
			assert.value('#3-1', '<head foo="bar">\n    line1\n</head>\nline2');

			assert.eq(
				'#4-1',
				`ys_${s[1]}head foo="bar">`,
				wasavi.getLastSimpleCommand());

			yield wasavi.send('G.');
			assert.value('#5-1',
				'<head foo="bar">\n    line1\n</head>\n' +
				'<head foo="bar">\n    line2\n</head>');
		}
	});

	// TODO: insertTagLinewiseViaOperatorAlias

	/*
	 * changing a quotation
	 */

	it('change quotation', function* () {
		yield wasavi.send("i'abc\\'def'\n'abc\\'def'\u001b");

		yield wasavi.send("1G2|cs'\"");
		assert.value("#1-1", "\"abc\\'def\"\n'abc\\'def'");

		yield wasavi.send("u");
		assert.value("#2-1", "'abc\\'def'\n'abc\\'def'");

		yield wasavi.send("\u0012");
		assert.value("#3-1", "\"abc\\'def\"\n'abc\\'def'");

		assert.eq("#4-1", "cs'\"", wasavi.getLastSimpleCommand());

		yield wasavi.send("G1|.");
		assert.value("#5-1", "\"abc\\'def\"\n\"abc\\'def\"");
	});

	it('change invalid quotation', function* () {
		yield wasavi.send('i/abc\\/def/\u001b');
		yield wasavi.send('2|cs/[');
		assert.value('#1-1', '/abc\\/def/');
	});

	/*
	 * changing a bracket
	 */

	it('change bracket', function* () {
		yield wasavi.send('i{foo}\n{foo}\u001b');

		yield wasavi.send('1Gcs{(');
		assert.value('#1-1', '( foo )\n{foo}');

		yield wasavi.send('u');
		assert.value('#2-1', '{foo}\n{foo}');

		yield wasavi.send('\u0012');
		assert.value('#3-1', '( foo )\n{foo}');

		assert.eq('#4-1', 'cs{(', wasavi.getLastSimpleCommand());

		yield wasavi.send('G1|.');
		assert.value('#5-1', '( foo )\n( foo )');
	});

	it('change invalid bracket', function* () {
		yield wasavi.send('i{abc\\/def\u001b');
		yield wasavi.send('2|cs{(');
		assert.value('#1-1', '{abc\\/def');
	});

	it('change multiline bracket', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('i{\n\tfoo\nbar\n}\u001b');
		yield wasavi.send('2Gcs{[');
		assert.value('#1-1', '[\n\tfoo\nbar\n]');

		yield wasavi.send('u');
		assert.value('#2-1', '{\n\tfoo\nbar\n}');

		yield wasavi.send('\u0012');
		assert.value('#3-1', '[\n\tfoo\nbar\n]');
	});

	it('change multiline bracket non orphan', function* () {
		yield wasavi.send(':set noai\n');
		yield wasavi.send('i{baz\n\tfoo\nbar\nbax}\u001b');
		yield wasavi.send('2Gcs{[');
		assert.value('#1-1', '[ baz\n\tfoo\nbar\nbax ]');

		yield wasavi.send('u');
		assert.value('#2-1', '{baz\n\tfoo\nbar\nbax}');

		yield wasavi.send('\u0012');
		assert.value('#3-1', '[ baz\n\tfoo\nbar\nbax ]');
	});

	it('change tag', function* () {
		yield wasavi.send('i<a>foo</a>\n<a>foo</a>\u001b');

		yield wasavi.send('1Gcst[');
		assert.value('#1-1', '[ foo ]\n<a>foo</a>');

		yield wasavi.send('u');
		assert.value('#2-1', '<a>foo</a>\n<a>foo</a>');

		yield wasavi.send('\u0012');
		assert.value('#3-1', '[ foo ]\n<a>foo</a>');

		assert.eq('#4-1', 'cst[', wasavi.getLastSimpleCommand());

		yield wasavi.send('G.');
		assert.value('#5-1', '[ foo ]\n[ foo ]');
	});

	it('change multiline tag', function* () {
		yield wasavi.send('i<a>\nfoo\n</a>\u001b');

		yield wasavi.send('2G2|cst[');
		assert.value('#1-1', '[\nfoo\n]');

		yield wasavi.send('u');
		assert.value('#2-1', '<a>\nfoo\n</a>');

		yield wasavi.send('\u0012');
		assert.value('#3-1', '[\nfoo\n]');
	});

	it('change invalid tag', function* () {
		yield wasavi.send('i<a>\nfoo\u001b');
		yield wasavi.send('cst{');
		assert.value('#1-1', '<a>\nfoo');
	});
};
