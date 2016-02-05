// ==UserScript==
// @include http://wasavi.appsweets.net/
// @include http://wasavi.appsweets.net/?testmode
// @include https://ss1.xrea.com/wasavi.appsweets.net/
// ==/UserScript==
//
/**
 * wasavi: vi clone implemented in javascript
 * =============================================================================
 *
 *
 * @author akahuku@gmail.com
 */
/**
 * Copyright 2012-2015 akahuku, akahuku@gmail.com
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

Wasavi.ExCommand = (function () {

var EXFLAGS = {
	addr2All: 1<<2,
	addr2None: 1<<3,
	addrZero: 1<<4,
	addrZeroDef: 1<<5,
	printDefault: 1<<6,
	clearFlag: 1<<7,
	newScreen: 1<<8,
	roundMax: 1<<9,
	updateJump: 1<<10,
	multiAsync: 1<<11
};

function ExCommand (name, shortName, syntax, flags, handler) {
	this.name = name;
	this.shortName = shortName;
	this.handler = handler;
	this.syntax = syntax;
	this.rangeCount = flags & 3;
	this.flags = {
		addr2All:     !!(flags & EXFLAGS.addr2All),
		addr2None:    !!(flags & EXFLAGS.addr2None),
		addrZero:     !!(flags & EXFLAGS.addrZero),
		addrZeroDef:  !!(flags & EXFLAGS.addrZeroDef),
		printDefault: !!(flags & EXFLAGS.printDefault),
		clearFlag:    !!(flags & EXFLAGS.clearFlag),
		roundMax:     !!(flags & EXFLAGS.roundMax),
		updateJump:   !!(flags & EXFLAGS.updateJump),
		multiAsync:   !!(flags & EXFLAGS.multiAsync)
	};
}

ExCommand.prototype = {
	// <<<1 ExCommand class prorotype
	clone: function () {
		return new ExCommand(
			this.name,
			this.shortName,
			this.syntax,
			JSON.parse(JSON.stringify(this.flags)),
			this.handler
		);
	},
	parseArgs: function (app, range, line, syntax) {
		function stripv (s) {
			return s.replace(/\u0016(.)/g, '$1');
		}
		function stripp (s) {
			return s.replace(/\\([^\/])/g, '$1');
		}
		function push_string (s) {
			result.argv.push(s);
		}
		function push_2words (s) {
			var state = 0;
			while ((s = s.replace(/^\s+/, '')) != '') {
				var re = /(?:\u0016.|\S)*/.exec(s);
				switch (state) {
				case 0:
					if (/^\[.+\]$/.test(re[0])) {
						result.argv.push(stripv(re[0]));
						s = s.substring(re[0].length);
						state = 1;
						break;
					}
					// FALLTHRU
				case 1:
					result.argv.push(stripv(re[0]));
					s = s.substring(re[0].length);
					state = 2;
					break;
				case 2:
					result.argv.push(stripv(s));
					s = '';
					break;
				}
			}
		}
		function push_words (s) {
			var index = 0;
			var anchor = 0;
			var mode = 0;
			while (index < s.length) {
				switch (mode) {
				case 0:
					if (/\s/.test(s.charAt(index))) {
						if (index > anchor) {
							result.argv.push(
								s.substring(anchor, index)
									.replace(/\\(.)/g, '$1'));
						}
						mode = 1;
					}
					else if ('"\''.indexOf(s.charAt(index)) >= 0) {
						mode = s.charAt(index++) == '"' ? 2 : 3;
					}
					else {
						mode = 4;
					}
					break;
				case 1:
					while (index < s.length && /\s/.test(s.charAt(index))) {
						index++;
					}
					mode = 0;
					anchor = index;
					break;
				case 2:
					while (index < s.length && s.charAt(index) != '"') {
						index++;
					}
					if (s.charAt(index - 1) != '\\') {
						mode = 0;
					}
					index++;
					break;
				case 3:
					while (index < s.length && s.charAt(index) != "'") {
						index++;
					}
					if (s.charAt(index - 1) != '\\') {
						mode = 0;
					}
					index++;
					break;
				case 4:
					while (index < s.length) {
						if ((index == 0 || s.charAt(index - 1) != '\\')
						&& /[\s"']/.test(s.charAt(index))) {
							mode = 0;
							break;
						}
						index++;
					}
					break;
				}
			}
			if (index > anchor) {
				result.argv.push(
					s.substring(anchor, index)
						.replace(/\\(.)/g, '$1'));
			}
		}
		function push_paths (s) {
			while ((s = s.replace(/^\s+/, '')) != '') {
				var re = /(?:\\.|\S)*/.exec(s);
				result.argv.push(stripp(re[0]));
				s = s.substring(re[0].length);
			}
		}

		var t = app.buffer;
		var result = {};
		var needCheckRest = true;
		syntax || (syntax = this.syntax);
		result.range = range;
		result.flagoff = 0;
		result.flags = {
			force:false,
			hash:false,
			list:false,
			print:false,
			dash:false,
			dot:false,
			plus:false,
			carat:false,
			equal:false,
			register:false,
			count:false
		};
		result.argv = [];

syntax_expansion_loop:
		for (var i = 0; i < syntax.length; i++) {
			var ch = syntax.charAt(i);

			if (ch == '!') {
				if (line.charAt(0) == '!') {
					line = line.substring(1);
					result.flags.force = true;
				}
				continue;
			}
			else if (ch == 'm') {
				var j = 0;
				if (this.name.length == 1) {
					while (line.charAt(j) == this.name) {j++;}
					line = line.substring(j);
				}
				push_string(j + 1);
				continue;
			}

			line = line.replace(/^\s+/, '');

			switch (ch) {
			case '1':
flag1_loop:
				for (var j = 0; j < line.length; j++) {
					switch (line.charAt(j)) {
					case '+':
						result.flagoff++;
						break;
					case '-':
					case '^':
						result.flagoff--;
						break;
					case '#':
						result.flags.hash = true;
						break;
					case 'l':
						result.flags.list = true;
						break;
					case 'p':
						result.flags.print = true;
						break;
					default:
						break flag1_loop;
					}
				}
				line = line.substring(j);
				break;

			case '2':
			case '3':
flag23_loop:
				for (var j = 0; j < line.length; j++) {
					switch (line.charAt(j)) {
					case '-':
						result.flags.dash = true;
						break;
					case '.':
						result.flags.dot = true;
						break;
					case '+':
						result.flags.plus = true;
						break;
					case '-':
						result.flags.carat = true;
						break;
					case '=':
						if (ch == '3') {
							result.flags.equal = true;
							break;
						}
						/* FALLTHRU */
					default:
						break flag23_loop;
					}
				}
				line = line.substring(j);
				break;

			case 'b':
				// [register name]
				if (line == '') {
					break syntax_expansion_loop;
				}
				if (/[+\-^#]+\s*$/.test(line) && syntax.indexOf('1') >= 0) {
					break;
				}
				if (/^\d/.test(line) && syntax.charAt(i + 1) == 'c' && !spc('S').test(line.charAt(1))) {
					break;
				}
				if (!app.registers.isReadable(line.charAt(0))) {
					return _('Invalid register name: {0}', line.charAt(0));
				};
				if (line.charAt(0) == '=') {
					result.register = line;
					line = '';
				}
				else {
					result.register = line.charAt(0);
					line = line.substring(1);
				}
				result.flags.register = true;
				break;

			case 'c':
				// [count]
				// c0: accepts a count that >= 0
				// c1: accepts a count that >= 1
				// c+: accepts preceding sign (optional), and a count that >= 1
				// ca: accepts a count that >= 1, and range will be adjusted
				ch = syntax.charAt(++i);
				if (line == '') {
					break syntax_expansion_loop;
				}

				var re = /^\d+/.exec(line);
				if (!re && ch == '+') {
					re = /^([\-+])\d+/.exec(line);
				}
				if (!re) {
					break;
				}
				line = line.substring(re[0].length);
				re = parseInt(re[0], 10);
				if (isNaN(re)) {
					return _('Bad address.');
				}
				if (re == 0 && ch != '0') {
					return _('Count may not be zero.');
				}
				if (ch == 'a') {
					result.range[0] = result.range[1];
					result.range[1] = minmax(0, result.range[0] + re - 1, t.rowLength - 1);
				}
				result.count = re;
				result.flags.count = true;
				break;

			case 'f':
				// [path format string]
				push_paths(line);
				needCheckRest = false;
				break syntax_expansion_loop;

			case 'l':
				// [destination address]
				if (line == '') {
					break syntax_expansion_loop;
				}
				var dest = parseRange(app, line, 1, true);
				if (typeof dest == 'string') {
					return dest;
				}
				if (dest.rows.length == 0) {
					return _('Address not specified.');
				}
				if (typeof dest.rows == 'string') {
					return dest.rows;
				}
				if (dest.rows[0] >= t.rowLength) {
					return _('Wrong address specified.');
				}
				line = dest.rest;
				result.lineNumber = dest.rows[0];
				break;

			case 's':
				// [whole of string remain]
				push_string(line);
				needCheckRest = false;
				break syntax_expansion_loop;

			case 'W':
				// [option + 2 words]
				push_2words(line);
				needCheckRest = false;
				break syntax_expansion_loop;

			case 'w':
				// [word (count specified)]
				// wN:  accepts any number of words
				// w3o: requires 3 words, but accepts empty arg
				// w3r: requires 3 words
				push_words(line);
				ch = syntax.charAt(++i);
				if (/\d/.test(ch)) {
					var tmp = ch - 0;
					ch = syntax.charAt(++i);
					if ((ch != 'o' || result.argv.length != 0) && result.argv.length != tmp) {
						return _('Missing required argument.');
					}
				}
				needCheckRest = false;
				break syntax_expansion_loop;

			default:
				return _('Internal syntax table error.');
			}
		}

		if (needCheckRest) {
			line = line.replace(/^\s+/, '');
			if (line != '' || /[lr]/.test(syntax.substring(i))) {
				return _('Invalid argument.');
			}
		}

		return result;
	},
	buildArgs: function (app, range, commandNameOption, argv, args, syntax) {
		var result = this.parseArgs(app, range, commandNameOption, syntax);
		if (typeof result == 'string') {
			return this.name + ': ' + result;
		}
		if (argv instanceof Array) {
			argv.push.apply(argv, result.argv);
			result.argv = argv;
		}
		result.args = args || '';
		return result;
	},
	fixupRange: function (app, range) {
		for (var i = 0, goal = range.length; i < goal; i++) {
			if (!this.flags.addrZero) {
				range[i] = Math.max(0, range[i]);
			}
			if (this.flags.roundMax) {
				range[i] = Math.min(app.buffer.rowLength - 1, range[i]);
			}
			else {
				if (range[i] >= app.buffer.rowLength) {
					return _('{0}: Out of range.', this.name);
				}
			}
		}
		return range;
	},
	run: function (app, args) {
		var result;
		try {
			var t = app.buffer;
			result = this.handler(app, t, args);
		}
		catch (e) {
			result = e.toString();
			app.low.notifyError(e);
		}
		if (typeof result == 'string') {
			return this.name + ': ' + result;
		}
		return {flags:args.flags, offset:args.flagoff, value:result};
	},
	toString: function () {
		return '[ExCommand ' + this.name + ']';
	}
	// >>>
};

function parseWriteArg (app, t, a) {
	var re;
	var arg = a.argv[0] || '';
	var isCommand = false;
	var isAppend = false;
	var name = false;
	if ((re = /^\s*(?!\\)!(.+)/.exec(arg))) {
		isCommand = true;
		name = re[1];
	}
	else if ((re = /^\s*(>>)?(.*)/.exec(arg))) {
		isAppend = re[1] == '>>';
		name = re[2] || '';
	}
	if (name === false) {
		return _('Invalid argument.');
	}
	return {
		isCommand:isCommand,
		isAppend:isAppend,
		path:name
	};
}

function writeCore (app, t, a, pa) {
	pa.path || (pa.path = app.fileName);
	var pathRegalized = app.low.regalizeFilePath(pa.path, true);

	if (pa.isCommand) {
		return _('Command redirection is not implemented.');
	}
	if (pa.path == '' && app.extensionChannel.isTopFrame()) {
		return _('No file name.');
	}
	if (pa.isAppend) {
		return _('Appending is not implemented.');
	}
	if (a.flags.force) {
		app.config.setData('noreadonly');
	}
	else {
		if (app.config.vars.readonly) {
			return _('Readonly option is set (use "!" to override).');
		}
	}

	var rg = document.createRange();
	rg.setStartBefore(t.rowNodes(a.range[0]));
	rg.setEndAfter(t.rowNodes(a.range[1]));
	var content = toNativeControl(rg.toString());

	if (a.range[1] == t.rowLength - 1) {
		content = trimTerm(content);
	}
	if (!app.targetElement.isContentEditable) {
		content = content.replace(/\n/g, app.preferredNewline);
	}

	var requestId;
	var payload = {
		path:pathRegalized,
		isForce:a.flags.force,
		isBuffered:pa.isBuffered,
		value:content
	};
	if (payload.path == '' && app.targetElement.nodeName != 'BODY') {
		app.low.notifyToParent('write', payload);
		requestId = app.extensionChannel.getNewRequestNumber();
	}
	else if (payload.path == '' && app.targetElement.nodeName == 'BODY') {
		payload.type = 'set-memorandum';
		payload.url = app.targetElement.url;
		requestId = app.extensionChannel.postMessage(payload);
	}
	else {
		payload.type = 'fsctl';
		payload.subtype = 'write';
		payload.encoding = 'UTF-8';
		requestId = app.extensionChannel.postMessage(payload, true, true);
	}
	app.low.registerMultiplexCallback(requestId, 'write');

	if (a.range[0] == 0 && a.range[1] == t.rowLength - 1) {
		if (app.fileName == '') {
			app.fileName = pathRegalized;
		}
		if (pa.isBuffered) {
			app.isTextDirty = false;
		}
		app.editLogger.notifySave();
	}
}

function globalLatterHead (app, t, a) {
	var opcode = app.exvm.inst.currentOpcode;
	var items = opcode.items;

	if (app.exvm.lastError) {
		app.editLogger.close();
		return app.exvm.lastError;
	}

	var row = -1;
	while (items.length) {
		row = -1;
		var item = items.shift();
		if (item.parentNode) {
			row = t.indexOf(item);
			if (0 <= row && row <= t.rowLength - 1) {
				break;
			}
		}
	}

	if (row >= 0) {
		t.setSelectionRange(t.getLineTopOffset2(new Wasavi.Position(row, 0)));
	}
	else {
		app.exvm.inst.errorVectors.pop();
		app.exvm.inst.index += opcode.nestLength;

		app.editLogger.close();
	}
}

function globalLatterBottom (app, t, a) {
	var opcode = app.exvm.inst.currentOpcode;
	app.exvm.inst.index -= opcode.nestLength - 1;
}

function readCore (app, t, a, content, meta, status) {
	if (typeof content != 'string' || status == 404) {
		return _('Cannot open "{0}".', meta.path);
	}
	if (content == '') {
		return _('"{0}" has no content.', meta.path);
	}
	content = content.replace(/\r\n|\r/g, '\n');
	var startLine = minmax(-1, a.range[0], t.rowLength - 1);
	t.setSelectionRange(new Wasavi.Position(startLine, 0));
	app.edit.paste(1, {
		isForward:true,
		lineOrientOverride:true,
		content:content
	});
	t.setSelectionRange(t.getLineTopOffset2(startLine + 1, 0));
}

function editCore (app, t, a, content, meta, status) {
	var charCount = content.length;
	if (app.extensionChannel.isTopFrame()) {
		app.fileName = meta.path;
		document.title = /[^\/]+$/.exec(app.fileName)[0] + ' - wasavi';
		var empty = [];
		app.preferredNewline = [
			['\n',   (content.match(/(?:^|[^\r])\n/g) || empty).length],
			['\r',   (content.match(/\r(?!\n)/g) || empty).length],
			['\r\n', (content.match(/\r\n/g) || empty).length]
		].sort(function (a, b) {return b[1] - a[1];})[0][0];
	}
	else {
		app.fileName = '';
		app.preferredNewline = '\n';
	}

	t.value = trimTerm(content.replace(/\r\n|\r/g, '\n'));
	app.isTextDirty = false;
	app.editLogger.close().clear().open('ex+edit');
	app.marks.clear();

	// +command
	if (a.initCommand) {
		var ex = app.exvm.clone();
		var compileResult = ex.inst.compile(a.initCommand);
		if (typeof compileResult == 'string') {
			return compileResult;
		}
		var locator = ex.inst.add(function (app, t, a) {
			t.setSelectionRange(t.getLineTopOffset2(t.rowLength - 1, 0));
		});

		locator.command.name = 'edit-locator';
		app.exvm.inst.insert(ex.inst.opcodes, app.exvm.inst.index + 1);
	}
	else {
		t.setSelectionRange(t.getLineTopOffset2(0, 0));
	}

	//
	app.low.requestShowMessage(app.low.getFileIoResultInfo(meta.path, charCount, status == 404));
}

function chdirCore (app, t, a, data) {
	if (a.argv.length == 0) {
		return find('pwd').handler.apply(this, arguments);
	}
	if (!data || !('is_dir' in data)) {
		return _('Invalid chdir result.');
	}
	if (!data.is_dir) {
		return _('Cannot change current directory into a file.');
	}

	var drive = '';
	var path = a.argv[0];
	var index = -1;

	path = app.low.extractDriveName(path, function ($0, d) {drive = d});
	index = drive == '' ? app.fileSystemIndex : app.low.getFileSystemIndex(drive);

	if (index < 0) {
		return _('Unknown drive name.');
	}

	app.fileSystemIndex = index;
	if (path != '') {
		app.fstab[index].cwd = app.low.regalizeFilePath(path, false);
	}
}

function SortWorker (app, t, a) {
	this.app = app;
	this.t = t;
	this.a = a;
	this.content = this.opts = null;
	this.terminalType = 0;
}
SortWorker.prototype = {
	dosort: function (content, key, regex, opts) {
		var callbacks = {
			i: function (a, b) {
				return a.toLowerCase().localeCompare(b.toLowerCase());
			},

			p: function (a, b) {
				var re = regex.exec(a);
				if (re) {
					a = a.substring(re.index + re[0].length);
				}
				var re = regex.exec(b);
				if (re) {
					b = b.substring(re.index + re[0].length);
				}
				return a.localeCompare(b);
			},
			pr: function (a, b) {
				var re = regex.exec(a);
				if (re) {
					a = re[0];
				}
				var re = regex.exec(b);
				if (re) {
					b = re[0];
				}
				return a.localeCompare(b);
			},
			pi: function (a, b) {
				var re = regex.exec(a);
				if (re) {
					a = a.substring(re.index + re[0].length);
				}
				var re = regex.exec(b);
				if (re) {
					b = b.substring(re.index + re[0].length);
				}
				return a.toLowerCase().localeCompare(b.toLowerCase());
			},
			pri: function (a, b) {
				var re = regex.exec(a);
				if (re) {
					a = re[0];
				}
				var re = regex.exec(b);
				if (re) {
					b = re[0];
				}
				return a.toLowerCase().localeCompare(b.toLowerCase());
			},

			c: function (a, b) {
				// TODO: expand tab?
				a = a.substring(opts.columnNumber);
				b = b.substring(opts.columnNumber);
				return a.localeCompare(b);
			},
			ci: function (a, b) {
				a = a.substring(opts.columnNumber);
				b = b.substring(opts.columnNumber);
				return a.toLowerCase().localeCompare(b.toLowerCase());
			}
		};
		return content.sort(callbacks[key]);
	},
	preSort: function (type, content) {
		switch (type) {
		case 1:
			content = content.replace(/\\\n/g, '\n');

			var spaces = {'\t':0, ' ':0};
			content.replace(spc('(S)\\n', 'g'), function ($0, s) {
				spaces[s]++;
			});

			var maxValueKey = Object.keys(spaces).reduce(function (v, key) {
				return spaces[key] > spaces[v] ? key : v
			});

			if (spaces[maxValueKey] > 0) {
				content = content.replace(spc('S$'), '');
				content += maxValueKey;
			}
			break;
		case 2:
			content = content.replace(/,\n/g, '\n');
			break;
		}
		return content;
	},
	postSort: function (type, content) {
		switch (type) {
		case 1:
			content = content
				.replace(/\n/g, '\\\n')
				.replace(/\s*$/, '');
			break;
		case 2:
			content = content.replace(/\n/g, ',\n');
			break;
		}
		return content;
	},
	test: function () {
		var tests = [
			['', 'xyz\nfoo\nbar', 'bar\nfoo\nxyz\n'],
			['', 'xyz \\\nfoo \\\nbar', 'bar \\\nfoo \\\nxyz\n'],
			['', 'xyz,\nfoo,\nbar', 'bar,\nfoo,\nxyz\n'],
			['i', 'Foo\nbar\nBAZ', 'bar\nBAZ\nFoo\n'],
			['/\\d\\+/', 'foo4baz\nbar3bar\nbaz1frr', 'bar3bar\nfoo4baz\nbaz1frr\n'],
			['/\\d\\+/r', 'foo4baz\nbar3bar\nbaz1frr', 'baz1frr\nbar3bar\nfoo4baz\n'],
			['/\\d\\+/i', 'foo4baZ\nbar3bar\nbaz1frr', 'bar3bar\nfoo4baZ\nbaz1frr\n'],
			['/[a-zA-Z]\\+/ri', '345c847\n123a456\n537B183', '123a456\n537B183\n345c847\n'],
			['c3', 'foo897\nbar532\nzoo321', 'zoo321\nbar532\nfoo897\n'],
			['c3i', '321zoo\n532bar\n897Foo', '532bar\n897Foo\n321zoo\n']
		];
		var log = [];
		tests.forEach(function (t) {
			try {
				var result = this.parseArgs(t[0]);
				if (isString(result)) throw new Error(result);

				this.buildContent(t[1]);

				var result = this.sort();
				if (isString(result)) throw new Error(result);

				var result = this.getContent();
				if (result != t[2]) throw new Error(
					'sort result unmatch,' +
					' result:"' + toVisibleString(result) + '"' +
					' expected:"' + toVisibleString(t[2]) + '"');
			}
			catch (e) {
				log.push(t[0] + ': ' + e.message);
			}
		}, this);
		if (log.length) {
			console.log(log.join('\n'));
		}
	},

	parseArgs: function (arg) {
		var re;
		var s = arg != undefined ? arg : this.a.argv[0];
		var opts = {
			force:!!this.a.flags.force,
			ignoreCase:false,
			reuse:false,
			column:false,
			columnNumber:-1,
			pattern:null
		};
		while ((s = s.replace(spc('^S+'), '')) != '') {
			if ((re = /^i/.exec(s))) {
				opts.ignoreCase = true;
				s = s.substring(re[0].length);
			}
			else if ((re = /^r/.exec(s))) {
				opts.reuse = true;
				s = s.substring(re[0].length);
			}
			else if ((re = /^c([0-9]+)/.exec(s))) {
				opts.column = true;
				opts.columnNumber = parseInt(re[1], 10);
				s = s.substring(re[0].length);
			}
			else if (/^[^a-zA-Z0-9"\n\\|]/.test(s)) {
				var d = s.charAt(0);
				s = s.substring(1);
				re = (new RegExp('(?:\\\\.|[^' + d + '])*')).exec(s);
				opts.pattern = re[0].replace(new RegExp('\\\\' + d, 'g'), d);
				s = s.substring(re[0].length + 1);
				if (opts.pattern == '') {
					if ((opts.pattern = app.lastRegexFindCommand.pattern || '') == '') {
						return _('No previous search pattern.');
					}
				}
			}
			else {
				return _('Unknown sort argument: {0}', s);
			}
		}
		this.opts = opts;
		return true;
	},
	buildContent: function (content) {
		if (!content) {
			var rg = document.createRange();
			rg.setStartBefore(this.t.rowNodes(this.a.range[0]));
			rg.setEndAfter(this.t.rowNodes(this.a.range[1]));
			content = toNativeControl(rg.toString());
		}

		content = trimTerm(content);
		var re = content.match(/\n/g);
		if (!re) return _('Single line can not be sorted.');
		this.rows = re.length + 1;

		var trailEscapes = (content.match(/\\\n/g) || []).length;
		var trailCommas = (content.match(/,\n/g) || []).length;
		if (trailEscapes == this.rows - 1) {
			this.terminalType = 1;
		}
		else if (trailCommas == this.rows - 1) {
			this.terminalType = 2;
		}
		else {
			this.terminalType = 0;
		}

		this.content = this.preSort(this.terminalType, content).split('\n');
		return true;
	},
	sort: function () {
		var opts = this.opts;
		var front = [];

		if (opts.pattern || opts.reuse || opts.ignoreCase || opts.column) {
			var regex, key = '', end = [];
			if (opts.pattern) {
				regex = this.app.low.getFindRegex({
					pattern:opts.pattern,
					csOverride:opts.ignoreCase ? 'i' : '',
					globalOverride:'',
					multilineOverride:''
				});
				if (!regex) {
					return _('Invalid regex pattern.');
				}
				key += 'p';
				if (opts.reuse) {
					key += 'r';
				}
				while (this.content.length) {
					var line = this.content.shift();
					(regex.test(line) ? end : front).push(line);
				}
				this.content = end;
			}
			else if (opts.column) {
				key += 'c';
			}

			if (opts.ignoreCase) {
				key += 'i';
			}

			this.content = this.dosort(this.content, key, regex, opts);
		}
		else {
			this.content = this.content.sort();
		}

		if (front.length) {
			this.content = front.concat(this.content);
		}
		if (opts.force) {
			this.content = this.content.reverse();
		}

		return true;
	},
	getContent: function () {
		var result = this.content.join('\n');
		this.content = null;
		result = this.postSort(this.terminalType, result) + '\n';
		return result;
	}
};

var cache = {};
/*public*/function find (name) {
	if (name in cache) {
		return cache[name];
	}

	var command = commands.filter(function (command) {return command.name == name})[0];
	if (command) {
		return cache[name] = command;
	}

	return null;
}

/*public*/function createExCommand (name, shortName, syntax, flags, handler) {
	return new ExCommand(name, shortName, syntax, flags, handler);
}

/*public*/function parseRange (app, s, requiredCount, allowZeroAddress) {
	var t = app.buffer;
	var rows = [];
	var ss = t.selectionStart;
	var error = false;
	var re;

	if ((re = spc('^S*%').exec(s))) {
		rows.push(0, t.rowLength - 1);
		s = s.substring(re[0].length);
	}
	else {
		while (true) {
			s = s.replace(spc('^S+'), '');

			var found = false;
			var regexSpecified = false;

			if (s.charAt(0) == '.') {
				rows.push(t.selectionStartRow);
				s = s.substring(1);
				found = true;
			}
			else if (s.charAt(0) == '$') {
				rows.push(t.rowLength - 1);
				s = s.substring(1);
				app.isJumpBaseUpdateRequested = true;
				found = true;
			}
			else if ((re = /^\d+/.exec(s))) {
				var n = re[0] - 1;
				if (n < 0) {
					n = allowZeroAddress ? -1 : 0;
				}
				rows.push(n);
				s = s.substring(re[0].length);
				app.isJumpBaseUpdateRequested = true;
				found = true;
			}
			else if ((re = /^'(.)/.exec(s))) {
				if (!/^[a-z`'<>]$/.test(re[1])) {
					error = _('Invalid mark name.');
					break;
				}
				var mark = app.marks.get(re[1]);
				if (mark == undefined) {
					error = _('Mark {0} is undefined.', re[1]);
					break;
				}
				rows.push(mark.row);
				s = s.substring(re[0].length);
				app.isJumpBaseUpdateRequested = true;
				found = true;
			}
			else if ((re = /^\/((?:\\\/|[^\/])*)(?:\/|(?=\n$))/.exec(s))) {
				var pattern = re[1] == '' ? (app.lastRegexFindCommand.pattern || '') : re[1];
				var regex = pattern == '' ? null : app.low.getFindRegex(pattern);
				if (!regex) {
					if (re[1] == '' && pattern == '') {
						error = _('No previous search pattern.');
					}
					else {
						error = _('Invalid regex pattern.');
					}
					break;
				}

				regexSpecified = true;
				app.lastRegexFindCommand.push({direction:1});
				pattern != '' && app.lastRegexFindCommand.setPattern(pattern);

				app.motion.lineEnd('');
				var result = app.motion.findByRegexForward(regex, 1);
				if (!result) {
					error = _('Pattern not found: {0}', pattern);
					break;
				}

				rows.push(t.linearPositionToBinaryPosition(result.offset).row);
				s = s.substring(re[0].length);
				app.isJumpBaseUpdateRequested = true;
				found = true;
			}
			else if ((re = /^\?((?:\\\?|[^?])*)(?:\?|(?=\n$))/.exec(s))) {
				var pattern = re[1] == '' ? (app.lastRegexFindCommand.pattern || '') : re[1];
				var regex = pattern == '' ? null : app.low.getFindRegex(pattern);
				if (!regex) {
					if (re[1] == '' && pattern == '') {
						error = _('No previous search pattern.');
					}
					else {
						error = _('Invalid regex pattern.');
					}
					break;
				}
				regexSpecified = true;
				app.lastRegexFindCommand.push({direction:-1});
				pattern != '' && app.lastRegexFindCommand.setPattern(pattern);

				app.motion.lineStart('', true);
				var result = app.motion.findByRegexBackward(regex, 1);
				if (!result) {
					error = _('Pattern not found: {0}', pattern);
					break;
				}

				rows.push(t.linearPositionToBinaryPosition(result.offset).row);
				s = s.substring(re[0].length);
				app.isJumpBaseUpdateRequested = true;
				found = true;
			}
			else if ((re = /^[\+\-](\d*)/.exec(s))) {
				var offset = re[1] == '' ?
					(re[0].charAt(0) == '+' ? 1 : -1) :
					parseInt(re[0], 10);
				rows.push(t.selectionStartRow + offset);
				s = s.substring(re[0].length);
				found = true;
			}

			if (found) {
				if ((re = /^\s*[\+\-](\d*)/.exec(s))) {
					var offset = re[1] == '' ?
						(re[0].charAt(0) == '+' ? 1 : -1) :
						parseInt(re[0], 10);
					rows.lastItem += offset;
					if (regexSpecified) {
						app.lastRegexFindCommand.verticalOffset = offset;
					}
					s = s.substring(re[0].length);
				}

				if (rows.lastItem < 0) {
					rows.lastItem = allowZeroAddress ? -1 : 0;
				}

				s = s.replace(spc('^S+'), '');
			}

			if (s.charAt(0) == ',') {
				if (rows.length == 0) {
					rows.push(t.selectionStartRow);
				}
				s = s.substring(1);
				!found && rows.push(t.selectionStartRow);
			}
			else if (s.charAt(0) == ';') {
				if (rows.length == 0) {
					rows.push(t.selectionStartRow);
				}
				if (rows.lastItem > t.rowLength) {
					error = _('Out of range.');
					break;
				}
				t.setSelectionRange(new Wasavi.Position(rows.lastItem, 0));
				s = s.substring(1);
				!found && rows.push(t.selectionStartRow);
			}
			else {
				break;
			}
		}
	}

	rows.last = function (t, count, isGlobal) {
		var result = [];
		count = Math.min(count, 2);
		if (count == 1) {
			if (this.length >= 1) {
				result = [this.lastItem];
			}
			else {
				result = [t.selectionStartRow];
			}
		}
		else if (count == 2) {
			if (this.length >= 2) {
				result = [ this[this.length - 2], this[this.length - 1] ];
			}
			else if (this.length == 1) {
				result = [ this[0], this[0] ];
			}
			else {
				if (isGlobal) {
					result = [0, t.rowLength - 1];
				}
				else {
					result = [ t.selectionStartRow, t.selectionStartRow ];
				}
			}
			if (result[1] < result[0]) {
				return _('The second address is smaller than the first.');
			}
		}
		result.specifiedAddresses = Math.min(this.length, 2);
		return result;
	};

	t.setSelectionRange(ss);

	return error || {
		rows: requiredCount == undefined ? rows : rows.last(t, requiredCount),
		rest: s
	};
}

/*public*/var defaultCommand = new ExCommand(
	'$default', '$default', 'ca1', 2 | EXFLAGS.roundMax,
	function (app, t, a) {
		printRow(app, t, a.range[0], a.range[1], a.flags);
		t.setSelectionRange(t.getLineTopOffset2(new Wasavi.Position(a.range[1], 0)));
		a.flags.hash = a.flags.list = a.flags.print = false;
	}
);

/*public*/function printRow (app, t, from, to, flags) {
	function getLineNumber (i) {
		return ('     ' + (i + 1)).substr(-6) + '  ';
	}
	function getLineNumberNull () {
		return '';
	}
	var lg = flags.hash ? getLineNumber : getLineNumberNull;
	if (flags.list) {
		var escapeReplacements = {
			7: '\\a', 8: '\\b', 9: '\\t', 10: '\\n', 11: '\\v', 12: '\\f', 13: '\\r', 92:'\\\\'
		};
		for (var i = from; i <= to; i++) {
			var line = toNativeControl(t.rows(i));
			/*
			 * char code
			 * \\   5c
			 * \a   07
			 * \b   08
			 * \t   09
			 * \n   0a
			 * \v   0b
			 * \f   0c
			 * \r   0d
			 */
			line = line.replace(/[\u0007\u0008\u000a-\u000d\\]/g, function (s) {
				return escapeReplacements[s.charCodeAt(0)];
			});
			line = line.replace(/[\u0000-\u0008\u0010-\u001f\u007f]/g, function (s) {
				return '\\' + ('00' + s.charCodeAt(0).toString(8)).substr(-3);
			});
			line = line.replace(/\$/g, '\\$');
			line = line + '$';
			app.backlog.push(lg(i) + line);
		}
	}
	else if (flags.hash || flags.print) {
		for (var i = from; i <= to; i++) {
			var line = t.rows(i);
			app.backlog.push(lg(i) + line);
		}
	}
	app.low.requestConsoleState();
}

/*public*/var commands = [
	new ExCommand('abbreviate', 'ab', 'W', 0, function (app, t, a) {
		function dispAbbrev (ab) {
			var MIN_WIDTH = 3;
			var PAD_WIDTH = 4;

			var maxWidth = MIN_WIDTH;
			var list = [];

			for (var i in ab) {
				var tmp = toVisibleString(i);
				list.push([tmp, i]);
				if (tmp.length > maxWidth) {
					maxWidth = tmp.length;
				}
			}
			if (list.length) {
				list = list.map(function (l) {
					return l[0] +
						multiply(' ', maxWidth - l[0].length + PAD_WIDTH) +
						toVisibleString(ab[l[1]].value);
				}).sort();

				list.unshift(
					_('*** abbreviations ***'),

					'LHS' +
					multiply(' ', maxWidth - MIN_WIDTH + PAD_WIDTH) +
					'RHS',

					multiply('-', MIN_WIDTH) +
					multiply(' ', maxWidth - MIN_WIDTH + PAD_WIDTH) +
					multiply('-', MIN_WIDTH));

				app.backlog.push(list);
			}
			else {
				app.backlog.push(_('No abbreviations are defined.'));
			}
			app.low.requestConsoleState();
		}

		var lhs, rhs, option;
		lhs = a.argv.shift();
		if (/^\[.+\]$/.test(lhs)) {
			option = lhs;
			lhs = a.argv.shift();
		}
		rhs = a.argv.shift();

		// prior option
		switch (option) {
		case '[clear]':
			app.abbrevs.clear();
			return;
		}

		// no args: display all abbreviations currently defined
		if (lhs == undefined && rhs == undefined) {
			dispAbbrev(app.abbrevs);
		}

		// one arg: display abbreviaion which corresponds to lhs
		else if (lhs != undefined && rhs == undefined) {
			var tmp = {};
			var tmpLhs = lhs.substr(-1) == '*' ? lhs.substring(0, lhs.length - 1) : null;

			for (var i in app.abbrevs) {
				if (tmpLhs && i.indexOf(tmpLhs) == 0
				||  !tmpLhs && i == lhs) {
					tmp[i] = app.abbrevs[i];
				}
			}

			dispAbbrev(tmp);
		}

		// two args: define new abbreviation
		else if (lhs != undefined && rhs != undefined) {
			if (!app.config.vars.iskeyword.test(lhs.substr(-1))) {
				return _('The keyword of abbreviation must end with a word character.');
			}

			app.abbrevs[lhs] = {
				noremap: option == '[noremap]',
				value: app.keyManager.insertFnKeyHeader(rhs)
			};
		}
	}),
	new ExCommand('cd', 'cd', 'f', 0, function (app, t, a) {
		var opcode = app.exvm.inst.currentOpcode;
		var worker = opcode.worker;
		if (worker) {
			opcode.worker = null;

			if (worker.error) {
				return worker.error;
			}
			if (worker.req) {
				return chdirCore(app, t, a, worker.req.data);
			}

			return _('Invalid chdir response.');
		}

		var requestId = app.extensionChannel.postMessage({
			type:'fsctl',
			subtype:'chdir',
			path:app.low.regalizeFilePath(a.argv[0], true)
		}, true, true);
		app.low.registerMultiplexCallback(requestId, 'chdir');

		return app.exvm.EX_ASYNC;
	}),
	new ExCommand('chdir', 'chd', 'f', 0, function (app, t, a) {
		return find('cd').handler.apply(this, arguments);
	}),
	new ExCommand('copy', 'co', 'l1', 2 | EXFLAGS.printDefault, function (app, t, a) {
		var rg = document.createRange();
		rg.setStartBefore(t.rowNodes(a.range[0]));
		rg.setEndAfter(t.rowNodes(a.range[1]));
		var content = rg.toString();
		t.setSelectionRange(new Wasavi.Position(a.lineNumber, 0));
		app.edit.paste(1, {
			isForward:true,
			lineOrientOverride:true,
			content:content
		});
		var copied = a.range[1] - a.range[0] + 1;
		if (copied >= app.config.vars.report) {
			app.low.requestShowMessage(_('Copied {0} {line:0}.', copied));
		}
		t.setSelectionRange(t.getLineTopOffset2(a.lineNumber + 1 + copied - 1, 0));
		app.isEditCompleted = true;
	}),
	new ExCommand('delete', 'd', 'bca1', 2 | EXFLAGS.printDefault, function (app, t, a) {
		t.setSelectionRange(new Wasavi.Position(a.range[0], 0));
		t.isLineOrientSelection = true;
		var deleted = a.range[1] - a.range[0] + 1;
		app.edit.yank(deleted, true, a.flags.register ? a.register : '');
		app.edit.deleteSelection();
		t.isLineOrientSelection = false;
		if (deleted >= app.config.vars.report) {
			app.low.requestShowMessage(_('Deleted {0} {line:0}.', deleted));
		}
		var n = new Wasavi.Position(Math.min(a.range[0], t.rowLength - 1), 0);
		t.setSelectionRange(t.getLineTopOffset2(n));
		app.isEditCompleted = true;
	}),
	new ExCommand('edit', 'e', '!f', 0, function (app, t, a) {
		var opcode = app.exvm.inst.currentOpcode;
		var worker = opcode.worker;
		if (worker) {
			opcode.worker = null;

			if (worker.error) {
				return worker.error;
			}
			if (worker.req) {
				var req = worker.req;
				return editCore(app, t, a, req.content, req.meta, req.status);
			}

			return _('Invalid edit response.');
		}

		if (!a.flags.force && app.isTextDirty) {
			return _('File is modified; write or use "!" to override.');
		}
		if (a.argv.length > 2) {
			return _('Too much arguments.');
		}
		var path = a.argv[0] || '';
		if (path.charAt(0) == '+') {
			a.initCommand = path.substring(1).replace(/\\(.)/g, '$1');
			path = a.argv[1] || '';
		}
		else {
			a.initCommand = '';
		}

		if (app.extensionChannel.isTopFrame()) {
			if (path == '' && app.fileName == '') {
				return _('File name is empty.');
			}
		}
		else {
			if (path != '') {
				return _('Only stand alone form can edit.');
			}
		}

		var requestId;
		var payload = {
			path:app.low.regalizeFilePath(path, true) || app.fileName
		};
		if (payload.path == '' && app.targetElement.nodeName != 'BODY') {
			app.low.notifyToParent('read', payload);
			requestId = app.extensionChannel.getNewRequestNumber();
		}
		else if (payload.path == '' && app.targetElement.nodeName == 'BODY') {
			payload.type = 'get-memorandum';
			payload.url = app.targetElement.url;
			requestId = app.extensionChannel.postMessage(payload);
		}
		else {
			payload.type = 'fsctl';
			payload.subtype = 'read';
			payload.encoding = 'UTF-8';
			requestId = app.extensionChannel.postMessage(payload, true, true);
		}
		app.low.registerMultiplexCallback(requestId, 'edit');

		return app.exvm.EX_ASYNC;
	}),
	new ExCommand('file', 'f', 'f', 0, function (app, t, a) {
		if (a.argv.length > 1) {
			return _('Too much arguments.');
		}
		if (a.argv.length == 1) {
			if (!app.extensionChannel.isTopFrame()) {
				return _('Only stand alone form can rename.');
			}

			var oldPath = app.low.splitPath(app.fileName, '\\');
			var newPath = app.low.splitPath(a.argv[0], '\\');

			if (a.argv[0] == '/'
			|| /[^\\]\/$/.test(a.argv[0])
			|| /^\.{1,2}$/.test(newPath.lastItem)) {
				newPath.push('');
			}

			if (newPath.lastItem == '') {
				if (oldPath.length == 0 || oldPath.lastItem == '') {
					return _('File name is empty.');
				}
				newPath.lastItem = oldPath.lastItem;
			}

			app.fileName = app.low.regalizeFilePath(
				newPath
					.map(function (a) {return a.replace(/\//g, '\\/')})
					.join('/'),
				true);
		}
		app.low.requestShowMessage(app.low.getFileInfo(true));
	}),
	new ExCommand('filesystem', 'files', 'wN', 0, function (app, t, a) {
		var list = [];
		var command = (a.argv[0] || '').replace(/\u0016(.)/g, '$1');
		if (/^(?:de?f?a?u?l?t?)$/.test(command)) {
			if (a.argv.length <= 1) {
				app.low.requestShowMessage(
					_('default file system: {0}', app.fstab[app.fileSystemIndex].name));
			}
			else {
				var target = a.argv[1];
				app.fstab.some(function (fs, i) {
					if (fs.name == target) {
						app.fileSystemIndex = i;
						return true;
					}
					return false;
				});
			}
		}
		else if (/^(?:re?s?e?t?)$/.test(command)) {
			app.extensionChannel.postMessage({
				type:'fsctl',
				subtype:'reset',
				name:a.argv.length <= 1 ? null : a.argv[1]
			});
		}
		else if (/^(?:st?a?t?u?s?)$/.test(command)) {
			if (app.fstab.length) {
				list.push(_('*** available file systems ***'));
				var maxWidth = 0;
				app.fstab.forEach(function (fs) {
					maxWidth = Math.max(maxWidth, fs.name.length);
				});
				app.fstab.forEach(function (fs, i) {
					list.push(
						(app.fileSystemIndex == i ? '*' : ' ') +
						' ' + fs.name + multiply(' ', maxWidth - fs.name.length) +
						' ' + fs.cwd
					);
				})
				app.backlog.push(list);
				app.low.requestConsoleState();
			}
			else {
				return _('no available file systems.');
			}
		}
		else {
			if (command == '') {
				return _('Command not specified.');
			}
			else {
				return _('Unknown command.');
			}
		}
	}),
	new ExCommand('global', 'g', '!s', 2 | EXFLAGS.addr2All, function (app, t, a) {
		function getItems (text, textPreLength) {
			var re;
			var items = [];
			var prevOffset;
			var prevRow;
			var nullNewline = {length:0};
			pattern.lastIndex = 0;
			if (inverted) {
				var rangeStartRow = t.indexOf(t.rowNodes(r[0]));
				re = pattern.exec(text);
				if (re) {
					var pos = pattern.lastIndex - re[0].length;
					var row, delta;
					row = t.linearPositionToBinaryPosition(pos + textPreLength).row;
					items.push(row - rangeStartRow);
					prevOffset = pos;
					prevRow = row;

					while ((re = pattern.exec(text))) {
						if (pattern.lastIndex == prevOffset) {
							if (pattern.lastIndex < text.length) {
								pattern.lastIndex++;
								continue;
							}
							else {
								break;
							}
						}
						pos = pattern.lastIndex - re[0].length;
						delta = (text.substring(prevOffset, pos).match(/\n/g) || nullNewline).length;
						row = prevRow + delta;
						if (row > r[1]) break;
						delta && items.push(row - rangeStartRow);
						prevOffset = pos;
						prevRow = row;
					}

					if (items.length >= r[1] - r[0] + 1) {
						return _('Pattern found in every line: {0}', patternString);
					}
					var tmp = [], container = t.elm;
					for (var i = r[0]; i <= r[1]; i++) {
						tmp.push(container.childNodes[i]);
					}
					for (var i = items.length - 1; i >= 0; i--) {
						tmp.splice(items[i], 1);
					}
					items = tmp;
				}
			}
			else {
				re = pattern.exec(text);
				if (re) {
					var pos = pattern.lastIndex - re[0].length;
					var row, delta;
					row = t.linearPositionToBinaryPosition(pos + textPreLength).row;
					items.push(t.rowNodes(row));
					prevOffset = pos;
					prevRow = row;

					while ((re = pattern.exec(text))) {
						if (pattern.lastIndex == prevOffset) {
							if (pattern.lastIndex < text.length) {
								pattern.lastIndex++;
								continue;
							}
							else {
								break;
							}
						}
						pos = pattern.lastIndex - re[0].length;
						delta = (text.substring(prevOffset, pos).match(/\n/g) || nullNewline).length;
						row = prevRow + delta;
						if (row > r[1]) break;
						delta && items.push(t.rowNodes(row));
						prevOffset = pos;
						prevRow = row;
					}
				}
			}
			return items;
		}

		/*
		 * pick up all rows matches to regexp
		 */

		var r = a.range;
		var inverted = !!a.flags.force;
		var pattern = a.argv[0];
		var command = a.argv[1];

		if (pattern == '') {
			if (!app.registers.exists('/') || (pattern = app.registers.get('/').data) == '') {
				return _('No previous search pattern.');
			}
		}
		else {
			app.lastRegexFindCommand.push({direction:1});
			app.lastRegexFindCommand.setPattern(pattern);
			app.registers.set('/', app.lastRegexFindCommand.pattern);
		}
		var patternString = pattern;
		pattern = app.low.getFindRegex(pattern);

		var textPreLength;
		var text;
		var rg = document.createRange();
		rg.setStartBefore(t.rowNodes(0));
		rg.setEndBefore(t.rowNodes(r[0]));
		textPreLength = rg.toString().length;

		rg.setStartBefore(t.rowNodes(r[0]));
		rg.setEndAfter(t.rowNodes(r[1]));
		text = r[1] == t.rowLength - 1 ? trimTerm(rg.toString()) : rg.toString();
		rg = null;

		/*
		 * build up nested ex commands
		 */

		var ex = app.exvm.clone();
		var items = getItems(text, textPreLength);
		if (isString(items)) {
			return items;
		}

		// generate opcodes
		t.setSelectionRange(new Wasavi.Position(t.indexOf(items[0]), 0));
		var head = ex.inst.add(globalLatterHead);
		var result = ex.inst.compile(command, this.name);
		var bottom = ex.inst.add(globalLatterBottom);
		if (isString(result)) {
			return result;
		}

		// additional properties for head
		head.items = items;
		head.nestLength = ex.inst.opcodes.length;
		head.command.name = this.name + '-head';

		// additional properties for bottom
		bottom.nestLength = ex.inst.opcodes.length;
		bottom.command.name = this.name + '-bottom';

		// merge into main queue of ex commands
		app.exvm.inst.insert(ex.inst.opcodes, app.exvm.inst.index + 1);
		app.exvm.inst.errorVectors.push(app.exvm.inst.index + 1);

		// start new edit log session
		app.marks.setJumpBaseMark(t.selectionStart);
		app.editLogger.open('ex+' + this.name);
	}),
	new ExCommand('join', 'j', '!c11', 2 | EXFLAGS.printDefault, function (app, t, a) {
		var head = a.range[0];
		var tail = Math.min(t.rowLength - 1, a.range[1] + (a.flags.count ? a.count - 1 : 0));
		t.setSelectionRange(new Wasavi.Position(head, 0));
		app.edit.joinLines(tail - head, a.flags.force);
		t.setSelectionRange(t.getLineTopOffset2(head, 0));
		app.isEditCompleted = true;
	}),
	new ExCommand('k', 'k', 'w1r', 1, function (app, t, a) {
		return find('mark').handler.apply(this, arguments);
	}),
	new ExCommand('map', 'map', '!W', 0, function (app, t, a) {
		var mapName = a.flags.force ? 'edit' : 'command';
		var map = app.mapManager.getMap(mapName);

		function dispMap (map) {
			var maxWidth = 0;
			if (map.length) {
				map.map(function (o) {
					if (o[0].length > maxWidth) {
						maxWidth = o[0].length;
					}
				});
				var list = [_('*** {0} mode maps ***', mapName)];
				map.map(function (o) {
					list.push(
						o[0] + multiply(' ', maxWidth - o[0].length) +
						'\t' + toVisibleString(o[1]));
				});
				app.backlog.push(list);
			}
			else {
				app.backlog.push(_('No mappings for {0} mode are defined.', mapName));
			}
			app.low.requestConsoleState();
		}

		var lhs, rhs, option;
		lhs = a.argv.shift();
		if (/^\[.+\]$/.test(lhs)) {
			option = lhs;
			lhs = a.argv.shift();
		}
		rhs = a.argv.shift();

		// prior option
		switch (option) {
		case '[clear]':
			map.removeAll();
			return;
		}

		// no args
		if (lhs == undefined && rhs == undefined) {
			dispMap(map.toArray());
		}

		// one arg
		else if (lhs != undefined && rhs == undefined) {
			dispMap(map.toArray().filter(function (o) {
				return o[0].indexOf(lhs) >= 0;
			}));
		}

		// two args
		else if (lhs != undefined && rhs != undefined) {
			// reject some mappings for text input mode: <escape>, <nl>
			if (a.flags.force && /^[\u001b\u000a]$/.test(lhs)) {
				return _('Key {0} cannot be remapped.', toVisibleString(lhs));
			}
			// reject some mappings for command mode: :, <escape>
			if (!a.flags.force && /^[:\u001b]$/.test(lhs)) {
				return _('Key {0} cannot be remapped.', toVisibleString(lhs));
			}
			lhs = app.keyManager.insertFnKeyHeader(lhs);
			rhs = app.keyManager.insertFnKeyHeader(rhs);
			map.register(lhs, rhs, option != '[noremap]');
		}
	}),
	new ExCommand('mark', 'ma', 'w1r', 1, function (app, t, a) {
		var name = a.argv[0];
		if (name.length > 1) {
			return _('Mark names must be a single character.');
		}
		if (!app.marks.isValidName(name)) {
			return _('Invalid mark name.');
		}
		app.marks.set(name, new Wasavi.Position(a.range[0], 0));
	}),
	new ExCommand('marks', 'marks', '', 0, function (app, t, a) {
		app.backlog.push(app.marks.dump());
		app.low.requestConsoleState();
	}),
	new ExCommand('move', 'm', 'l', 2 | EXFLAGS.printDefault, function (app, t, a) {
		var r = a.range;
		var dest = a.lineNumber;
		if (dest >= r[0] && dest < r[1]) {
			return _('Destination is in inside source.');
		}
		app.editLogger.open('ex+move', function () {
			var rows = r[1] - r[0] + 1;

			if (dest == r[0] - 1 || dest == r[1]) {
				app.editLogger.write(Wasavi.EditLogger.ITEM_TYPE.NOP);
			}
			else {
				// delete
				t.isLineOrientSelection = true;
				t.setSelectionRange(new Wasavi.Position(r[0], 0));
				t.selectRowsLinewise(rows);
				var content = t.getSelectionLinewise();
				app.edit.deleteSelection();
				t.isLineOrientSelection = false;

				// fix destination position
				dest -= dest > r[1] ? rows : 0;

				// paste
				t.setSelectionRange(new Wasavi.Position(dest, 0));
				app.edit.paste(1, {
					isForward:true,
					lineOrientOverride:true,
					content:content
				});
			}

			if (rows >= app.config.vars.report) {
				app.low.requestShowMessage(_('Moved {0} {line:0}.', rows));
			}

			t.setSelectionRange(t.getLineTopOffset2(Math.min(t.rowLength - 1, dest + rows), 0));
		});
		app.isEditCompleted = true;
	}),
	new ExCommand('options', 'opt', '', 0, function (app, t, a) {
		app.extensionChannel.postMessage({type:'open-options'});
	}),
	new ExCommand('pwd', 'pw', '', 0, function (app, t, a) {
		app.low.requestShowMessage(
			app.fstab[app.fileSystemIndex].name +
			':' +
			app.fstab[app.fileSystemIndex].cwd);
	}),
	new ExCommand('print', 'p', 'ca1', 2 | EXFLAGS.clearFlag, function (app, t, a) {
		a.flags.print = true;
		return defaultCommand.handler.apply(this, arguments);
	}),
	new ExCommand('put', 'pu', 'b', 1 | EXFLAGS.printDefault | EXFLAGS.addrZero | EXFLAGS.addrZeroDef, function (app, t, a) {
		var register = a.flags.register ? a.register : '"';
		var opts = {
			isForward:true,
			lineOrientOverride:true
		};
		if (register.charAt(0) == '=') {
			var expressionString;
			if (register.length == 1) {
				if (!app.registers.exists(register)) {
					return _('Register {0} is empty.', register);
				}
				expressionString = app.registers.get(register).data;
			}
			else {
				expressionString = register.substring(1);
			}

			var v = expr(expressionString);
			if (v.error) {
				return v.error;
			}

			opts.content = v.result;
			register = register.charAt(0);
			app.registers.get('=').set(expressionString);
		}
		else {
			if (!app.registers.exists(register)) {
				return _('Register {0} is empty.', register);
			}
			opts.register = register;
		}
		t.setSelectionRange(new Wasavi.Position(minmax(-1, a.range[0], t.rowLength - 1), 0));
		app.edit.paste(1, opts);
		t.setSelectionRange(t.getLineTopOffset2(Math.max(0, t.selectionStartRow), 0));
	}),
	new ExCommand('quit', 'q', '!', 0, function (app, t, a) {
		if (/^(?:wqs|submit)$/.test(this.name)) {
			app.targetElement.isSubmitRequested = true;
		}
		if (a.flags.force) {
			app.isTextDirty = false;
			app.terminated = true;
		}
		else {
			if (app.isTextDirty) {
				return _('The text has been modified; use :quit! to discard any changes.');
			}
			else {
				app.terminated = true;
			}
		}
	}),
	new ExCommand('read', 'r', 'f', 1 | EXFLAGS.addrZero | EXFLAGS.addrZeroDef, function (app, t, a) {
		var opcode = app.exvm.inst.currentOpcode;
		var worker = opcode.worker;
		if (worker) {
			opcode.worker = null;

			if (worker.error) {
				return worker.error;
			}
			if (worker.req) {
				var req = worker.req;
				return readCore(app, t, a, req.content, req.meta, req.status);
			}

			return _('Invalid read response.');
		}

		var path = a.argv[0] || '';
		if (path == '' && app.fileName == '') {
			return _('File name is empty.');
		}

		var requestId = app.extensionChannel.postMessage({
			type:'fsctl',
			subtype:'read',
			encoding:'UTF-8',
			path:app.low.regalizeFilePath(path, true) || app.fileName
		}, true, true);
		app.low.registerMultiplexCallback(requestId, 'read');

		return app.exvm.EX_ASYNC;
	}),
	new ExCommand('redo', 're', '', 0, function (app, t, a) {
		app.editLogger.close();
		var result = app.editLogger.redo();
		app.editLogger.open('ex+redo');
		if (result === false) {
			return _('No redo item.');
		}
		else {
			app.low.requestShowMessage(
				_('{0} {operation:0} have executed again.', result));
		}
	}),
	new ExCommand('s', 's', 's', 2, function (app, t, a) {
		var pattern;
		if (this.name == '~') {
			if (!app.registers.exists('/')
			|| (pattern = app.registers.get('/').data) == '') {
				return _('No previous search pattern.');
			}
		}
		var argmap = {
			's': [a.range, a.argv[0], a.argv[1], a.argv[2]],
			'&': [a.range, '',        '%',       a.argv[0]],
			'~': [a.range, pattern,   '~',       a.argv[0]]
		};
		var opcode = app.exvm.inst.currentOpcode;
		if (opcode.worker) {
			if (opcode.worker.kontinue(opcode.letter)) {
				return app.exvm.EX_ASYNC;
			}
		}
		else {
			opcode.worker = new Wasavi.SubstituteWorker(app);
			return opcode.worker.run.apply(opcode.worker, argmap[this.name]);
		}
	}),
	new ExCommand('&', '&', 's', 2, function (app, t, a) {
		return find('s').handler.apply(this, arguments);
	}),
	new ExCommand('~', '~', 's', 2, function (app, t, a) {
		return find('s').handler.apply(this, arguments);
	}),
	new ExCommand('script', 'sc', 's', 2, function (app, t, a) {
		return 'Under development!';
	}),
	new ExCommand('set', 'se', 'wN', 0, function (app, t, a) {
		var messages;
		var emphasis = false;
		if (a.argv.length == 0) {
			messages = app.config.dump(app.backlog.cols);
		}
		else if (a.argv.some(function (o) {return o == 'all';})) {
			messages = app.config.dump(app.backlog.cols, true);
		}
		else if (a.argv.some(function (o) {return /^all&(default|exrc)?$/.test(o)})) {
			switch (RegExp.$1) {
			case '':
			case 'default':
				app.config.reset();
				messages = [_('All options are reset to {0}.', 'default')];
				break;

			case 'exrc':
				app.config.loadSnapshot('exrc');
				messages = [_('All options are reset to {0}.', RegExp.$1)];
				break;
			}
		}
		else {
			var messages, startIndex;

			var opcode = app.exvm.inst.currentOpcode;
			var worker = opcode.worker;
			if (worker) {
				messages = worker.messages;
				startIndex = worker.startIndex;
			}
			else {
				messages = [];
				startIndex = 0;
			}
			for (var i = startIndex; i < a.argv.length; i++) {
				var arg = a.argv[i];
				var re = /^([^=?!]+)([=?!]|&(?:default|exrc)?)/.exec(arg) || ['', arg, ''];
				var info = app.config.getInfo(re[1]);
				if (!info) {
					messages.push(_('Unknown option: {0}', re[1]));
					emphasis = true;
					continue;
				}

				// query
				if (re[2] == '?'
				|| i + 1 < a.argv.length && a.argv[i + 1] == '?') {
					messages.push(app.config.getData(re[1], true));
					re[2] != '?' && i++;
				}

				// reset
				else if (re[2].charAt(0) == '&'
				|| i + 1 < a.argv.length && a.argv[i + 1].charAt(0) == '&') {
					if (re[2].charAt(0) != '&') {
						re[2] = a.argv[i + 1];
						i++;
					}

					switch (re[2]) {
					case '&':
					case '&default':
						app.config.reset(re[1]);
						break;

					case '&exrc':
						app.config.loadSnapshot('exrc', re[1]);
						break;
					}
				}

				// others
				else {
					// "set foo =bar" -> "set foo=bar"
					if (re[2] == ''
					&& i + 1 < a.argv.length
					&& a.argv[i + 1].charAt(0) == '=') {
						re[0] = arg + '=';
						arg += a.argv[++i];
						re[2] = '=';
					}
					// mark whether inverted flag is specified
					if ('inv' + info.name == re[1]) {
						re[2] = '!';
					}
					// alternative query form if non-boolean
					if (re[2] == '' && info.type != 'b') {
						messages.push(app.config.getData(re[1], true));
					}
					// assignment
					else {
						var value = undefined;
						if (re[2] == '=') {
							value = arg.substring(re[0].length);
							'\'"'.split('').some(function (q) {
								if (value.charAt(0) != q) return;
								value = value.substr(-1) == q ?
									value.substring(1, value.length - 1) :
									undefined;
								return true;
							});
							if (value == undefined) {
								messages.push(_('Incomplete quoted value: {0}', arg));
								emphasis = true;
								break;
							}
						}
						else if (re[2] == '!') {
							re[1] = 'inv' + info.name;
						}
						var result = app.config.setData(re[1], value);
						if (typeof result == 'string') {
							messages.push(result.replace(/\.$/, '') + ': ' + arg);
							emphasis = true;
							break;
						}
						if (info.isAsync) {
							opcode.worker || (opcode.worker = {});
							opcode.worker.messages = messages;
							opcode.worker.startIndex = i + 1;
							return app.exvm.EX_ASYNC;
						}
					}
				}
			}
		}
		if (messages.length) {
			if (messages.length == 1 && !app.backlog.visible) {
				app.low.requestShowMessage(messages[0], emphasis);
				app.low.requestConsoleState(true);
			}
			else {
				app.backlog.push(messages);
				app.low.requestConsoleState();
			}
		}
		else {
			app.low.requestConsoleState(true);
		}
	}),
	new ExCommand('sort', 'sor', '!s', 2 | EXFLAGS.addr2All, function (app, t, a) {
		var worker = new SortWorker(app, t, a);

		var result;
		result = worker.parseArgs();
		if (isString(result)) return result;

		result = worker.buildContent();
		if (isString(result)) return result;

		result = worker.sort();
		if (isString(result)) return result;

		var marks = app.marks.dumpData();
		app.editLogger.open('ex+sort', function () {
			t.isLineOrientSelection = true;
			t.setSelectionRange(new Wasavi.Position(a.range[0], 0));
			t.selectRowsLinewise(worker.rows);
			app.edit.deleteSelection();
			t.isLineOrientSelection = false;

			t.setSelectionRange(new Wasavi.Position(a.range[0] - 1, 0));
			app.edit.paste(1, {
				isForward:true,
				lineOrientOverride:true,
				content:worker.getContent()
			});

			for (var i in marks) {
				var m = marks[i];
				if (a.range[0] <= m.row && m.row <= a.range[1]) {
					app.marks.set(i, new Wasavi.Position(m.row, m.col));
				}
			}

			if (worker.rows >= app.config.vars.report) {
				app.low.requestShowMessage(_('Sorted {0} {line:0}.', worker.rows));
			}

			t.setSelectionRange(t.getLineTopOffset2(a.range[0], 0));
			app.isEditCompleted = true;
		});
	}),
	new ExCommand('sushi', 'sushi', 's', 0, function (app, t, a) {
		switch (a.argv[0]) {
		case 'reset-search-info':
			app.lastRegexFindCommand.push({});
			app.lastRegexFindCommand.setPattern('');
			app.lastSubstituteInfo.clear();
			break;
		case 'dump-undo-info':
			console.log([
				'*** undo info ***',
				app.editLogger.dump(),
				'item length: ' + app.editLogger.logLength,
				'current pos: ' + app.editLogger.currentPosition
			].join('\n'));
			break;
		case 'dump-internal-ids':
			app.extensionChannel.postMessage(
				{
					type:'dump-internal-ids',
					parentTabId: app.targetElement.parentTabId,
					parentTabIdInternal: app.targetElement.internalId
				},
				function (req) {
					req && req.log && console.log(req.log);
				}
			);
			break;
		case 'dump-options-doc':
			console.log(app.config.dumpData());
			break;
		}
		app.low.requestShowMessage('Whassup?');
	}),
	new ExCommand('submit', 'sub', '!s', 2 | EXFLAGS.addr2All | EXFLAGS.addrZeroDef, function (app, t, a) {
		return find('write').handler.apply(this, arguments);
	}),
	new ExCommand('registers', 'reg', '', 0, function (app, t, a) {
		app.backlog.push(app.registers.dump());
		app.low.requestConsoleState();
	}),
	new ExCommand('to', 't', 'l1', 2 | EXFLAGS.printDefault, function (app, t, a) {
		return find('copy').handler.apply(this, arguments);
	}),
	new ExCommand('unabbreviate', 'una', 'w1r', 0, function (app, t, a) {
		var lhs = a.argv[0];
		if (lhs == '[all]') {
			app.abbrevs.clear();
		}
		else if (!(lhs in app.abbrevs)) {
			return _('{0} is not an abbreviation.', lhs);
		}
		else {
			delete app.abbrevs[lhs];
		}
	}),
	new ExCommand('undo', 'u', '', 0 | EXFLAGS.updateJump, function (app, t, a) {
		app.editLogger.close();
		var result = app.editLogger.undo();
		app.editLogger.open('ex+undo');
		if (result === false) {
			return _('No undo item.');
		}
		else {
			app.low.requestShowMessage(
				_('{0} {operation:0} have reverted.', result));
		}
	}),
	new ExCommand('unmap', 'unm', '!w1r', 0, function (app, t, a) {
		var lhs = a.argv[0];
		var map = app.mapManager.getMap(a.flags.force ? 'edit' : 'command');
		if (lhs == '[all]') {
			map.removeAll();
		}
		else if (!map.isMapped(lhs)) {
			return _('{0} is not mapped.', lhs);
		}
		else {
			map.remove(lhs);
		}
	}),
	new ExCommand('version', 've', '', 0, function (app, t, a) {
		app.low.requestShowMessage('wasavi/' + app.version);
	}),
	new ExCommand('v', 'v', 's', 2 | EXFLAGS.addr2All | EXFLAGS.updateJump, function (app, t, a) {
		a.flags.force = true;
		return find('global').handler.apply(this, arguments);
	}),
	new ExCommand('write', 'w', '!s', 2 | EXFLAGS.addr2All | EXFLAGS.addrZeroDef, function (app, t, a) {
		var opcode = app.exvm.inst.currentOpcode;
		var worker = opcode.worker;
		if (worker) {
			opcode.worker = null;

			if (worker.error) {
				return worker.error;
			}
			if (worker.req) {
				app.isTextDirty = false;
				if (/^(?:submit|wqs?|xit)$/.test(this.name)) {
					return find('quit').handler.apply(this, arguments);
				}
				var path = worker.req.meta.path;
				var bytes = worker.req.meta.bytes;
				var message = app.low.getFileIoResultInfo(path, bytes);
				app.low.requestShowMessage(_('Written: {0}', message));
				return;
			}

			return _('Invalid write response.');
		}

		var parsedArgs = parseWriteArg(app, t, a);
		if (typeof parsedArgs == 'string') return parsedArgs;

		var result;
		if (this.name == 'write'
		&& app.exvm.inst.index >= app.exvm.inst.opcodes.length - 2) {
			// last opcode; do buffered write
			parsedArgs.isBuffered = true;
			result = writeCore(app, t, a, parsedArgs);
			if (typeof result == 'string') return result;
		}
		else if (this.name != 'xit' || app.isTextDirty) {
			// other; write immediately and wait its termination
			parsedArgs.isBuffered = false;
			result = writeCore(app, t, a, parsedArgs);
			if (typeof result == 'string') return result;

			result = app.exvm.EX_ASYNC;
		}
		else {
			// immediate quit op
			result = find('quit').handler.apply(this, arguments);
		}

		return result;
	}),
	new ExCommand('wq', 'wq', '!s', 2 | EXFLAGS.addr2All | EXFLAGS.addrZeroDef, function (app, t, a) {
		return find('write').handler.apply(this, arguments);
	}),
	new ExCommand('wqs', 'wqs', '!s', 2 | EXFLAGS.addr2All | EXFLAGS.addrZeroDef, function (app, t, a) {
		return find('write').handler.apply(this, arguments);
	}),
	new ExCommand('xit', 'x', '!s', 2 | EXFLAGS.addr2All | EXFLAGS.addrZeroDef, function (app, t, a) {
		return find('write').handler.apply(this, arguments);
	}),
	new ExCommand('yank', 'ya', 'bca', 2, function (app, t, a) {
		var p = t.selectionStart;
		t.setSelectionRange(new Wasavi.Position(a.range[0], 0));
		app.edit.yank(a.range[1] - a.range[0] + 1, true, a.flags.register ? a.register : '');
		t.setSelectionRange(p);
	}),
	new ExCommand('>', '>', 'mca1', 2, function (app, t, a) {
		t.setSelectionRange(new Wasavi.Position(a.range[0], 0));
		app.edit.shift(a.range[1] - a.range[0] + 1, a.argv[0]);
		t.setSelectionRange(t.getLineTopOffset2(a.range[1], 0));
	}),
	new ExCommand('<', '<', 'mca1', 2, function (app, t, a) {
		t.setSelectionRange(new Wasavi.Position(a.range[0], 0));
		app.edit.unshift(a.range[1] - a.range[0] + 1, a.argv[0]);
		t.setSelectionRange(t.getLineTopOffset2(a.range[1], 0));
	}),
	new ExCommand('@', '@', 'b', 1, function (app, t, a) {
		var command;
		var register;
		var expression;

		if (a.flags.register) {
			register = a.register;
		}
		else if (!app.registers.exists('@')
		|| (register = app.registers.get('@').data) == '') {
			return _('No previous execution.');
		}

		if (register == '@'
		|| !app.registers.isReadable(register)) {
			return _('Invalid register name: {0}', register);
		}

		if (register.charAt(0) == '=') {
			if (register.length == 1) {
				if (!app.registers.exists(register)
				|| (expression = app.registers.get(register).data) == '') {
					return _('Register {0} is empty.', register);
				}
			}
			else {
				expression = register.substring(1);
			}

			var v = expr(expression);
			if (v.error) {
				return v.error;
			}

			command = v.result;
			register = register.charAt(0);
			app.registers.get('=').set(expression);
		}
		else if (!app.registers.exists(register)
		|| (command = app.registers.get(register).data) == '') {
			return _('Register {0} is empty.', register);
		}

		if (app.exvm.executedRegisterFlags[register]) {
			return _('Register {0} was used recursively.', register);
		}

		var ex = app.exvm.clone();
		t.setSelectionRange(new Wasavi.Position(a.range[0], 0));
		var result = ex.inst.compile(command);
		if (typeof result == 'string') {
			return result;
		}

		app.exvm.inst.insert(ex.inst.opcodes, app.exvm.inst.index + 1);
		app.exvm.executedRegisterFlags[register] = true;
		app.registers.get('@').set(register);
	}),
	new ExCommand('*', '*', 'b', 1, function (app, t, a) {
		return find('@').handler.apply(this, arguments);
	})
].sort(function (a, b) {return a.name.length - b.name.length;});

return Object.freeze({
	find: find,
	create: createExCommand,
	parseRange: parseRange,
	defaultCommand: defaultCommand,
	printRow: printRow,
	commands: commands
});

})();

// vim:set ts=4 sw=4 fenc=UTF-8 ff=unix ft=javascript fdm=marker fmr=<<<,>>> :
