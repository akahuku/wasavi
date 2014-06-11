// ==UserScript==
// @include http://wasavi.appsweets.net/
// @include https://ss1.xrea.com/wasavi.appsweets.net/
// ==/UserScript==
//
/**
 * wasavi: vi clone implemented in javascript
 * =============================================================================
 *
 *
 * @author akahuku@gmail.com
 * @version $Id: classes_ex.js 438 2013-11-06 11:12:32Z akahuku $
 */
/**
 * Copyright 2012 akahuku, akahuku@gmail.com
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

Wasavi.ExCommand = function (name, shortName, syntax, flags, handler) {
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
};
Wasavi.ExCommand.prototype = {
	clone: function () {
		return new Wasavi.ExCommand(
			this.name,
			this.shortName,
			this.syntax,
			JSON.parse(JSON.stringify(this.flags)),
			this.handler
		);
	},
	parseArgs: function (app, range, line, syntax) {
		function push_string (s) {
			result.argv.push(s);
		}
		function push_words (s) {
			while ((s = s.replace(/^\s+/, '')) != '') {
				var re = /(?:\u0016.|\S)*/.exec(s);
				result.argv.push(re[0]);
				s = s.substring(re[0].length);
			}
		}
		function push_paths (s) {
			while ((s = s.replace(/^\s+/, '')) != '') {
				var re = /(?:\\(.)|\S)*/.exec(s);
				result.argv.push(re[0].replace(/\\([^\/])/g, '$1'));
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
			if (line == '') {
				break;
			}

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
				if (/[+\-^#]+\s*$/.test(line)
				&& syntax.indexOf('1') >= 0) {
					break;
				}
				if (/\d/.test(line.charAt(0))) {
					break;
				}
				result.register = line.charAt(0);
				result.flags.register = true;
				line = line.substring(1);
				break;

			case 'c':
				// [count]
				// c0: accepts a count that >= 0
				// c1: accepts a count that >= 1
				// c+: accepts preceding sign (optional), and a count that >= 1
				// ca: accepts a count that >= 1, and range will be adjusted
				ch = syntax.charAt(++i);

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
					result.range[1] = Math.max(0, Math.min(result.range[0] + re - 1, t.rowLength - 1));
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
				var dest = this.parseRange(app, line, 1, true);
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
						return _('Arguments count mismatch.');
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
	parseRange: function (app, s, requiredCount, allowZeroAddress) {
		var t = app.buffer;
		var rows = [];
		var ss = t.selectionStart;
		var error = false;
		var re;

		if ((re = /^[ \t]*%/.exec(s))) {
			rows.push(0, t.rowLength - 1);
			s = s.substring(re[0].length);
		}
		else {
			while (true) {
				s = s.replace(/^[ \t]+/, '');

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

					s = s.replace(/^[ \t]+/, '');
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

		for (var i = 0, goal = result.range.length; i < goal; i++) {
			if (!this.flags.addrZero) {
				result.range[i] = Math.max(0, result.range[i]);
			}
			if (this.flags.roundMax) {
				result.range[i] = Math.min(app.buffer.rowLength - 1, result.range[i]);
			}
			else {
				if (result.range[i] >= app.buffer.rowLength) {
					return _('{0}: Out of range.', this.name);
				}
			}
		}
		return result;
	},
	run: function (app, args) {
		var result;
		try {
			result = this.handler(app, app.buffer, args);
		}
		catch (e) {
			result = e.toString();
		}
		if (typeof result == 'string') {
			return this.name + ': ' + result;
		}
		return {flags:args.flags, offset:args.flagoff};
	},
	toString: function () {
		return '[ExCommand ' + this.name + ']';
	}
};
Wasavi.ExCommand.defaultCommand = new Wasavi.ExCommand(
	'$default', '$default', 'ca1', 2 | EXFLAGS.roundMax,
	function (app, t, a) {
		Wasavi.ExCommand.printRow(app, t, a.range[0], a.range[1], a.flags);
		t.setSelectionRange(t.getLineTopOffset2(new Wasavi.Position(a.range[1], 0)));
		a.flags.hash = a.flags.list = a.flags.print = false;
	}
);
Wasavi.ExCommand.global = function (app, t, a) {
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

	// initialize text
	var textPreLength;
	var text;
	var rg = document.createRange();
	rg.setStartBefore(t.rowNodes(0));
	rg.setEndBefore(t.rowNodes(r[0]));
	textPreLength = rg.toString().length;

	rg.setStartBefore(t.rowNodes(r[0]));
	rg.setEndAfter(t.rowNodes(r[1]));
	text = r[1] == t.rowLength - 1 ? trimTerm(rg.toString()) : rg.toString();
	rg.detach();
	rg = null;

	// pass 1
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

	function dumpItems (title) {
		var result = [];
		for (var i = 0, goal = items.length; i < goal; i++) {
			if (items[i]) {
				result.push(i + ': "' + toVisibleString(items[i].textContent) + '"');
			}
			else {
				result.push(i + ': null');
			}
		}
	}

	// pass 2
	app.editLogger.open('global');
	try {
		//dumpItems('init');
		for (var i = 0, goal = items.length; i < goal; i++) {
			if (items[i].parentNode) {
				t.setSelectionRange(t.getLineTopOffset2(new Wasavi.Position(t.indexOf(items[i]), 0)));
				var result = app.low.executeExCommand(command);
				if (typeof result == 'string') {return result;}
			}
			else {
				items[i] = null;
			}
		}
	}
	finally {
		app.editLogger.close();
	}
	return undefined;
};
Wasavi.ExCommand.setMark = function (app, t, a) {
	var name = a.argv[0];
	if (name.length > 1) {
		return _('Mark names must be a single character.');
	}
	if (!app.marks.isValidName(name)) {
		return _('Invalid mark name.');
	}
	app.marks.set(name, new Wasavi.Position(a.range[0], 0));
	return undefined;
};
Wasavi.ExCommand.copy = function (app, t, a) {
	var rg = document.createRange();
	rg.setStartBefore(t.rowNodes(a.range[0]));
	rg.setEndAfter(t.rowNodes(a.range[1]));
	var content = rg.toString();
	rg.detach();
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
};
Wasavi.ExCommand.quit = function (app, isForce) {
	if (isForce) {
		app.writeOnTermination = false;
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
	return undefined;
};
Wasavi.ExCommand.parseWriteArg = function (app, t, a) {
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
		name:name
	};
};
Wasavi.ExCommand.write = function (app, t, a, isCommand, isAppend, path) {
	path || (path = app.fileName);
	var pathRegalized = app.low.regalizeFilePath(path, true);

	if (isCommand) {
		return _('Command redirection is not implemented.');
	}
	if (path == '' && WasaviExtensionWrapper.IS_TOP_FRAME) {
		return _('No file name.');
	}
	if (isAppend) {
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
	rg.detach();

	if (a.range[1] == t.rowLength - 1) {
		content = trimTerm(content);
	}
	if (app.targetElement.isContentEditable) {
		content = content.split('\n');
	}
	else {
		content = content.replace(/\n/g, app.preferredNewline);
	}
	app.low.fireEvent('saved', {
		type:'wasavi-saved',
		path:pathRegalized,
		isForce:a.flags.force,
		value:content
	});
	if (a.range[0] == 0 && a.range[1] == t.rowLength - 1) {
		if (app.fileName == '') {
			app.fileName = pathRegalized;
		}
		app.isTextDirty = false;
		app.editLogger.notifySave();
	}
	return undefined;
};
Wasavi.ExCommand.read = function (app, t, a, content, meta) {
	if (meta.status == 404) {
		return _('Cannot open "{0}".', meta.path);
	}
	if (content == '') return undefined;
	content = content.replace(/\r\n|\r/g, '\n');
	var startLine = Math.min(Math.max(-1, a.range[0]), t.rowLength - 1);
	t.setSelectionRange(new Wasavi.Position(startLine, 0));
	app.edit.paste(1, {
		isForward:true,
		lineOrientOverride:true,
		content:content
	});
	t.setSelectionRange(t.getLineTopOffset2(startLine + 1, 0));
	return undefined;
};
Wasavi.ExCommand.edit = function (app, t, a, content, meta) {
	var charCount = content.length;
	if (WasaviExtensionWrapper.IS_TOP_FRAME) {
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
	t.setSelectionRange(0, 0);
	t.value = trimTerm(content.replace(/\r\n|\r/g, '\n'));
	app.isTextDirty = false;
	app.editLogger.close().clear().open('excommand+edit');
	app.marks.clear();

	// +command
	var initCommands = app.low.executeExCommand(a.initCommand, false, true);
	if (typeof initCommands == 'string') {
		return initCommands;
	}
	var terminator = Wasavi.ExCommand.defaultCommand.clone();
	if (initCommands.commands.length) {
		terminator.handler = function (t, a) {
			t.setSelectionRange(t.getLineTopOffset2(t.rowLength - 1, 0));
		};
	}
	else {
		terminator.handler = function (t, a) {
			t.setSelectionRange(t.getLineTopOffset2(0, 0));
		};
	}
	initCommands.commands.push([terminator, terminator.buildArgs(app, [], '')]);
	Array.prototype.unshift.apply(app.exCommandExecutor.commands, initCommands.commands);

	app.low.requestShowMessage(app.low.getFileIoResultInfo(meta.path, charCount, meta.status == 404));
	return undefined;
};
Wasavi.ExCommand.executeRegister = function (app, t, a) {
	var command;
	var register;

	if (a.flags.register) {
		register = a.register;
	}
	else if (!app.registers.exists('@') || (register = app.registers.get('@').data) == '') {
		return _('No previous execution.');
	}
	if (register == '@' || !app.registers.isReadable(register)) {
		return _('Invalid register name: {0}', register);
	}
	if (!app.registers.exists(register) || (command = app.registers.get(register).data) == '') {
		return _('Register {0} is empty.', register);
	}
	t.setSelectionRange(new Wasavi.Position(a.range[0], 0));
	var result = app.low.executeExCommand(command);
	if (typeof result == 'string') {
		return result;
	}
	app.registers.set('@', command, true);
	return undefined;
};
Wasavi.ExCommand.printRow = function (app, t, from, to, flags) {
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
};
Wasavi.ExCommand.pwd = function (app, t, a) {
	if (!app.extensionChannel) {
		return _('Extension system required.');
	}
	app.low.requestShowMessage(
		app.fstab[app.fileSystemIndex].name +
		':' +
		app.fstab[app.fileSystemIndex].cwd);
	return undefined;
};
Wasavi.ExCommand.chdir = function (app, t, a, data) {
	if (a.argv.length == 0) {
		return Wasavi.ExCommand.pwd.apply(this, arguments);
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

	return undefined;
};
Wasavi.ExCommand.commands = [
	new Wasavi.ExCommand('abbreviate', 'ab', 'wN', 0, function (app, t, a) {
		function dispAbbrev (ab) {
			var maxWidth = 0;
			var count = 0;
			for (var i in ab) {
				if (i.length > maxWidth) {
					maxWidth = i.length;
				}
				count++;
			}
			if (count) {
				var list = [_('*** abbreviations ***')];
				for (var i in ab) {
					list.push(
						i + multiply(' ', maxWidth - i.length) +
						'\t' + toVisibleString(app.abbrevs[i])
					);
				}
				list.sort();
				app.backlog.push(list);
			}
			else {
				app.backlog.push(_('No abbreviations are defined.'));
			}
		}
		switch (a.argv.length) {
		case 0:
			dispAbbrev(app.abbrevs);
			break;

		case 1:
			var lhs = a.argv[0];
			if (lhs == '[clear]') {
				app.abbrevs.clear();
			}
			else {
				var tmp = {};
				if (lhs in app.abbrevs) {
					tmp[lhs] = app.abbrevs[lhs];
				}
				dispAbbrev(tmp);
			}
			break;

		default:
			var lhs = a.argv[0];
			var rhs = a.argv[1];
			if (!app.config.vars.iskeyword.test(lhs.substr(-1))) {
				return _('The keyword of abbreviation must end with a word character.');
			}
			app.abbrevs[lhs] = rhs;
			break;
		}
		return undefined;
	}),
	new Wasavi.ExCommand('cd', 'cd', 'f', EXFLAGS.multiAsync, function (app, t, a) {
		if (!app.extensionChannel) {
			return _('Extension system required.');
		}
		app.low.fireEvent('chdir', {path:app.low.regalizeFilePath(a.argv[0], true)});
		return undefined;
	}),
	new Wasavi.ExCommand('chdir', 'chd', 'f', EXFLAGS.multiAsync, function (app, t, a) {
		if (!app.extensionChannel) {
			return _('Extension system required.');
		}
		app.low.fireEvent('chdir', {path:app.low.regalizeFilePath(a.argv[0], true)});
		return undefined;
	}),
	new Wasavi.ExCommand('copy', 'co', 'l1', 2 | EXFLAGS.printDefault, function (app, t, a) {
		return Wasavi.ExCommand.copy(app, t, a);
	}),
	new Wasavi.ExCommand('delete', 'd', 'bca1', 2 | EXFLAGS.printDefault, function (app, t, a) {
		t.setSelectionRange(new Wasavi.Position(a.range[0], 0));
		t.isLineOrientSelection = true;
		var deleted = a.range[1] - a.range[0] + 1;
		app.edit.yank(deleted, true, a.flags.register ? a.register : '');
		app.edit.deleteSelection();
		if (deleted >= app.config.vars.report) {
			app.low.requestShowMessage(_('Deleted {0} {line:0}.', deleted));
		}
		var n = new Wasavi.Position(Math.min(a.range[0], t.rowLength - 1), 0);
		t.setSelectionRange(t.getLineTopOffset2(n));
		app.isEditCompleted = true;
		return undefined;
	}),
	new Wasavi.ExCommand('edit', 'e', '!f', EXFLAGS.multiAsync, function (app, t, a) {
		if (!app.extensionChannel) {
			return _('Extension system required.');
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

		if (WasaviExtensionWrapper.IS_TOP_FRAME) {
			if (path == '' && app.fileName == '') {
				return _('File name is empty.');
			}
		}
		else {
			if (path != '') {
				return _('Only stand alone form can edit.');
			}
		}

		app.low.fireEvent('read', {path:app.low.regalizeFilePath(path, true) || app.fileName});
		return undefined;
	}),
	new Wasavi.ExCommand('file', 'f', 'f', 0, function (app, t, a) {
		if (a.argv.length > 1) {
			return _('Too much arguments.');
		}
		if (a.argv.length == 1) {
			if (!app.extensionChannel) {
				return _('Extension system required.');
			}
			if (!WasaviExtensionWrapper.IS_TOP_FRAME) {
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
		return undefined;
	}),
	new Wasavi.ExCommand('filesystem', 'files', 'wN', 0, function (app, t, a) {
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
		return undefined;
	}),
	new Wasavi.ExCommand('global', 'g', '!s', 2 | EXFLAGS.addr2All | EXFLAGS.updateJump, function (app, t, a) {
		return Wasavi.ExCommand.global(app, t, a);
	}),
	new Wasavi.ExCommand('join', 'j', '!c11', 2 | EXFLAGS.printDefault, function (app, t, a) {
		var head = a.range[0];
		var tail = Math.min(t.rowLength - 1, a.range[1] + (a.flags.count ? a.count - 1 : 0));
		t.setSelectionRange(new Wasavi.Position(head, 0));
		app.edit.joinLines(tail - head, a.flags.force);
		t.setSelectionRange(t.getLineTopOffset2(head, 0));
		app.isEditCompleted = true;
		return undefined;
	}),
	new Wasavi.ExCommand('k', 'k', 'w1r', 1, function (app, t, a) {
		return Wasavi.ExCommand.setMark(app, t, a);
	}),
	new Wasavi.ExCommand('map', 'map', '!wN', 0, function (app, t, a) {
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
				var list = ['*** ' + mapName + ' mode map ***'];
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
		}
		if (a.argv.length == 0) {
			dispMap(map.toArray());
		}
		else {
			var lhs = a.argv[0] || '';
			var rhs = a.argv[1] || '';
			var remap = true;
			switch (lhs) {
			case '[clear]':
				map.removeAll();
				break;
			case '[noremap]':
				lhs = rhs;
				rhs = a.argv[2] || '';
				remap = false;
				/*FALLTHRU*/
			default:
				if (rhs == '') {
					dispMap(map.toArray().filter(function (o) {
						return o[0].indexOf(lhs) >= 0;
					}));
				}
				else {
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
					map.register(lhs, rhs, remap);
				}
				break;
			}
		}
		return undefined;
	}),
	new Wasavi.ExCommand('mark', 'ma', 'w1r', 1, function (app, t, a) {
		return Wasavi.ExCommand.setMark(app, t, a);
	}),
	new Wasavi.ExCommand('marks', 'marks', '', 0, function (app, t, a) {
		app.backlog.push(app.marks.dump());
		return undefined;
	}),
	new Wasavi.ExCommand('move', 'm', 'l', 2 | EXFLAGS.printDefault, function (app, t, a) {
		var r = a.range;
		var dest = a.lineNumber;
		if (dest >= r[0] && dest < r[1]) {
			return _('Destination is in inside source.');
		}
		app.editLogger.open('move', function () {
			var rows = r[1] - r[0] + 1;

			if (dest == r[0] - 1 || dest == r[1]) {
				app.editLogger.write(Wasavi.EditLogger.ITEM_TYPE.NOP);
			}
			else {
				// delete
				t.isLineOrientSelection = true;
				t.setSelectionRange(new Wasavi.Position(r[0], 0));
				t.selectRows(rows);
				var content = t.getSelectionRows();
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

			t.setSelectionRange(t.getLineTopOffset2(dest + rows, 0));
		});
		app.isEditCompleted = true;
		return undefined;
	}),
	new Wasavi.ExCommand('options', 'opt', '', 0, function (app, t, a) {
		if (!app.extensionChannel) {
			return app.low.requestRegisterNotice(_('Don\'t know how to open options page.'));
		}
		app.extensionChannel.postMessage({type:'open-options-page'});
		return undefined;
	}),
	new Wasavi.ExCommand('pwd', 'pw', '', 0, function (app, t, a) {
		return Wasavi.ExCommand.pwd.apply(this, arguments);
	}),
	new Wasavi.ExCommand('print', 'p', 'ca1', 2 | EXFLAGS.clearFlag, function (app, t, a) {
		a.flags.print = true;
		return Wasavi.ExCommand.defaultCommand.handler.apply(this, arguments);
	}),
	new Wasavi.ExCommand('put', 'pu', 'b', 1 | EXFLAGS.printDefault | EXFLAGS.addrZero | EXFLAGS.addrZeroDef, function (app, t, a) {
		var register = a.flags.register ? a.register : '"';
		if (!app.registers.exists(register)) {
			return _('Register {0} is empty.', register);
		}
		t.setSelectionRange(new Wasavi.Position(Math.min(Math.max(-1, a.range[0]), t.rowLength - 1), 0));
		app.edit.paste(1, {
			isForward:true,
			lineOrientOverride:true,
			register:register
		});
		t.setSelectionRange(t.getLineTopOffset2(t.selectionStart, 0));
		return undefined;
	}),
	new Wasavi.ExCommand('quit', 'q', '!', 0, function (app, t, a) {
		return Wasavi.ExCommand.quit(app, a.flags.force);
	}),
	new Wasavi.ExCommand('read', 'r', 'f', 1 | EXFLAGS.addrZero | EXFLAGS.addrZeroDef | EXFLAGS.multiAsync, function (app, t, a) {
		if (!app.extensionChannel) {
			return _('Extension system required.');
		}
		var path = a.argv[0] || '';
		if (path == '' && app.fileName == '') {
			return _('File name is empty.');
		}
		app.low.fireEvent('read', {path:app.low.regalizeFilePath(path, true) || app.fileName});
		return undefined;
	}),
	new Wasavi.ExCommand('redo', 're', '', 0, function (app, t, a) {
		app.editLogger.close();
		var result = app.editLogger.redo();
		app.editLogger.open('excommand+redo');
		if (result === false) {
			return _('No redo item.');
		}
		else {
			app.low.requestShowMessage(
				_('{0} {operation:0} have executed again.', result));
		}
		return undefined;
	}),
	new Wasavi.ExCommand('s', 's', 's', 2, function (app, t, a) {
		return (new Wasavi.SubstituteWorker(app)).run(a.range, a.argv[0], a.argv[1], a.argv[2]);
	}),
	new Wasavi.ExCommand('&', '&', 's', 2, function (app, t, a) {
		return (new Wasavi.SubstituteWorker(app)).run(a.range, '', '%', a.argv[0]);
	}),
	new Wasavi.ExCommand('~', '~', 's', 2, function (app, t, a) {
		var pattern;
		if (!app.registers.exists('/') || (pattern = app.registers.get('/').data) == '') {
			return _('No previous search pattern.');
		}
		return (new Wasavi.SubstituteWorker(app)).run(a.range, pattern, '~', a.argv[0]);
	}),
	new Wasavi.ExCommand('script', 'sc', 's', 2 | EXFLAGS.addrZero | EXFLAGS.multiAsync, function (app, t, a) {
		return 'Under development!';
	}),
	new Wasavi.ExCommand('set', 'se', 'wN', 0, function (app, t, a) {
		var messages;
		var logToConsole = false;
		var emphasis = false;
		if (a.argv.length == 0) {
			messages = app.config.dump(app.backlog.cols);
			logToConsole = true;
		}
		else if (a.argv.some(function (o) {return o == 'all';})) {
			messages = app.config.dump(app.backlog.cols, true);
			logToConsole = true;
		}
		else {
			messages = [];
			for (var i = 0; i < a.argv.length; i++) {
				var arg = a.argv[i];
				var re = /^([^=?]+)([=?])/.exec(arg) || ['', arg, ''];
				var info = app.config.getInfo(re[1]);
				if (!info) {
					messages.push(_('Unknown option: {0}', re[1]));
					emphasis = true;
					continue;
				}
				if (re[2] == '?') {
					messages.push(app.config.getData(re[1], true));
				}
				else if (i + 1 < a.argv.length && a.argv[i + 1] == '?') {
					messages.push(app.config.getData(re[1], true));
					i++;
				}
				else {
					if (re[2] == ''
					&& i + 1 < a.argv.length
					&& a.argv[i + 1].charAt(0) == '=') {
						re[0] = arg + '=';
						arg += a.argv[++i];
						re[2] = '=';
					}
					if (re[2] != '=' && info.type != 'b') {
						messages.push(app.config.getData(re[1], true));
					}
					else {
						var result = app.config.setData(
							re[1],
							re[2] == '=' ? arg.substring(re[0].length) : undefined);
						if (typeof result == 'string') {
							messages.push(result.replace(/\.$/, '') + ': ' + arg);
							emphasis = true;
							break;
						}
					}
				}
			}
			if (messages.length == 1) {
				messages = messages[0];
			}
			else {
				logToConsole = true;
			}
		}
		if (logToConsole) {
			app.backlog.push(messages);
		}
		else {
			app.low.requestShowMessage(messages, emphasis);
		}
		return undefined;
	}),
	new Wasavi.ExCommand('sushi', 'sushi', '', 0, function (app, t, a) {
		app.lastRegexFindCommand.push({});
		app.lastRegexFindCommand.setPattern('');
		app.lastSubstituteInfo.clear();
		app.low.requestShowMessage('Whassup?');
		app.devMode && console.log([
			'*** undo info ***',
			app.editLogger.dump(),
			'item length: ' + app.editLogger.logLength,
			'current pos: ' + app.editLogger.currentPosition
		].join('\n'));
		return undefined;
	}),
	new Wasavi.ExCommand('registers', 'reg', '', 0, function (app, t, a) {
		app.backlog.push(app.registers.dump());
		return undefined;
	}),
	new Wasavi.ExCommand('to', 't', 'l1', 2 | EXFLAGS.printDefault, function (app, t, a) {
		return Wasavi.ExCommand.copy(app, t, a);
	}),
	new Wasavi.ExCommand('unabbreviate', 'una', 'w1r', 0, function (app, t, a) {
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
		return undefined;
	}),
	new Wasavi.ExCommand('undo', 'u', '', 0 | EXFLAGS.updateJump, function (app, t, a) {
		app.editLogger.close();
		var result = app.editLogger.undo();
		app.editLogger.open('excommand+undo');
		if (result === false) {
			return _('No undo item.');
		}
		else {
			app.low.requestShowMessage(
				_('{0} {operation:0} have reverted.', result));
		}
		return undefined;
	}),
	new Wasavi.ExCommand('unmap', 'unm', '!w1r', 0, function (app, t, a) {
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
		return undefined;
	}),
	new Wasavi.ExCommand('version', 'ver', '', 0, function (app, t, a) {
		app.low.requestShowMessage('wasavi/' + app.version);
		return undefined;
	}),
	new Wasavi.ExCommand('v', 'v', 's', 2 | EXFLAGS.addr2All | EXFLAGS.updateJump, function (app, t, a) {
		a.flags.force = true;
		return Wasavi.ExCommand.global(app, t, a);
	}),
	new Wasavi.ExCommand('write', 'w', '!s', 2 | EXFLAGS.addr2All | EXFLAGS.addrZeroDef, function (app, t, a) {
		var o = Wasavi.ExCommand.parseWriteArg(app, t, a);
		return typeof o == 'string' ? o : Wasavi.ExCommand.write(app, t, a, o.isCommand, o.isAppend, o.name);
	}),
	new Wasavi.ExCommand('wq', 'wq', '!s', 2 | EXFLAGS.addr2All | EXFLAGS.addrZeroDef, function (app, t, a) {
		var o = Wasavi.ExCommand.parseWriteArg(app, t, a);
		if (typeof o == 'string') return o;
		var result = Wasavi.ExCommand.write(app, t, a, o.isCommand, o.isAppend, o.name);
		return typeof result == 'string' ? result : Wasavi.ExCommand.quit(app);
	}),
	new Wasavi.ExCommand('xit', 'x', '!s', 2 | EXFLAGS.addr2All | EXFLAGS.addrZeroDef, function (app, t, a) {
		if (app.isTextDirty) {
			var result = Wasavi.ExCommand.write(app, t, a, false, false, a.argv[0]);
			return typeof result == 'string' ? result : Wasavi.ExCommand.quit(app);
		}
		else {
			return Wasavi.ExCommand.quit(app, !!a.flags.force);
		}
	}),
	new Wasavi.ExCommand('yank', 'ya', 'bca', 2, function (app, t, a) {
		var p = t.selectionStart;
		t.setSelectionRange(new Wasavi.Position(a.range[0], 0));
		app.edit.yank(a.range[1] - a.range[0] + 1, true, a.flags.register ? a.register : '');
		t.setSelectionRange(p);
		return undefined;
	}),
	new Wasavi.ExCommand('>', '>', 'mca1', 2, function (app, t, a) {
		t.setSelectionRange(new Wasavi.Position(a.range[0], 0));
		app.edit.shift(a.range[1] - a.range[0] + 1, a.argv[0]);
		t.setSelectionRange(t.getLineTopOffset2(a.range[1], 0));
		return undefined;
	}),
	new Wasavi.ExCommand('<', '<', 'mca1', 2, function (app, t, a) {
		t.setSelectionRange(new Wasavi.Position(a.range[0], 0));
		app.edit.unshift(a.range[1] - a.range[0] + 1, a.argv[0]);
		t.setSelectionRange(t.getLineTopOffset2(a.range[1], 0));
		return undefined;
	}),
	new Wasavi.ExCommand('@', '@', 'b', 1, function (app, t, a) {
		return Wasavi.ExCommand.executeRegister(app, t, a);
	}),
	new Wasavi.ExCommand('*', '*', 'b', 1, function (app, t, a) {
		return Wasavi.ExCommand.executeRegister(app, t, a);
	})
].sort(function (a, b) {return a.name.length - b.name.length;});

// vim:set ts=4 sw=4 fenc=UTF-8 ff=unix ft=javascript fdm=marker :
