/**
 * wasavi: vi clone implemented in javascript
 * =============================================================================
 *
 *
 * @author akahuku@gmail.com
 */
/**
 * Copyright 2012-2017 akahuku, akahuku@gmail.com
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
(function (global) {

function diag (s) {
	try {window.parent.postMessage(s, '*')} catch (e) {}
}
diag('starting wasavi.js');

diag('defining classes');

/*
 * classes <<<1
 * ----------------
 */

/*constructor*/function AppProxy () {
	return Object.freeze({
		get extensionChannel () {return extensionChannel},
		get quickActivation () {return quickActivation},
		get devMode () {return devMode},
		get fstab () {return fstab},
		get fileSystemIndex () {return fileSystemIndex},
		set fileSystemIndex (v) {return fileSystemIndex = v},
		get abbrevs () {return abbrevs},
		get keyManager () {return keyManager},
		get mapManager () {return mapManager},
		get theme () {return theme},
		get config () {return config},
		get version () {return version},

		get registers () {return registers},

		get targetElement () {return targetElement},
		get buffer () {return buffer},
		get fileName () {return fileName},
		set fileName (v) {fileName = v},
		get preferredNewline () {return preferredNewline},
		set preferredNewline (v) {preferredNewline = v},
		get terminated () {return terminated},
		set terminated (v) {terminated = v},
		get state () {return state},
		get marks () {return marks},
		get cursor () {return cursor},
		get scroller () {return scroller},
		get editLogger () {return editLogger},
		get prefixInput () {return prefixInput},
		get inputMode () {return inputMode},
		get requestedState () {return requestedState},
		get charWidth () {return charWidth},
		get lineHeight () {return lineHeight},
		get backlog () {return backlog},
		get exvm () {return exvm},
		get recordedStrokes () {return recordedStrokes},
		get notifier () {return notifier},
		get searchUtils () {return searchUtils},
		get ffttDictionary () {return ffttDictionary},

		get isTextDirty () {return config.vars.modified},
		set isTextDirty (v) {config.setData(v ? 'modified' : 'nomodified')},
		get isEditCompleted () {return isEditCompleted},
		set isEditCompleted (v) {isEditCompleted = v},
		get isVerticalMotion () {return isVerticalMotion},
		set isVerticalMotion (v) {isVerticalMotion = v},
		get isInteractive () {return isInteractive},
		set isInteractive (v) {isInteractive = v},
		get isJumpBaseUpdateRequested () {return isJumpBaseUpdateRequested},
		set isJumpBaseUpdateRequested (v) {isJumpBaseUpdateRequested = v},
		get isTestMode () {return testMode},

		get lastSimpleCommand () {return lastSimpleCommand},
		get lastRegexFindCommand () {return lastRegexFindCommand},
		get lastSubstituteInfo () {return lastSubstituteInfo},
		get lastMessage () {return lastMessage},
		set lastMessage (v) {lastMessage = v},

		/*
		 * low level methods
		 */
		low:Object.freeze({
			log:log,
			info:info,
			error:error,
			getLocalStorage:getLocalStorage,
			setLocalStorage:setLocalStorage,
			isEditing:isEditing,
			isBound:isBound,
			pushInputMode:pushInputMode,
			popInputMode:popInputMode,
			showPrefixInput:showPrefixInput,
			showMessage:showMessage,
			showMessageCore:showMessageCore,
			requestShowMessage:requestShowMessage,
			requestNotice:requestNotice,
			requestInputMode:requestInputMode,
			requestConsoleOpen:requestConsoleOpen,
			requestConsoleClose:requestConsoleClose,
			executeViCommand:executeViCommand,
			getFindRegex:getFindRegex,
			getFileIoResultInfo:getFileIoResultInfo,
			getFileInfo:getFileInfo,
			notifyToParent:notifyToParent,
			notifyActivity:notifyActivity,
			notifyCommandComplete:notifyCommandComplete,
			extractDriveName:extractDriveName,
			getFileSystemIndex:getFileSystemIndex,
			splitPath:splitPath,
			regalizeFilePath:regalizeFilePath,
			notifyError:handleWindowError,
			getContainerRect:getContainerRect
		}),

		/*
		 * motions
		 */
		motion:Object.freeze({
			left:motionLeft,
			right:motionRight,
			lineStart:motionLineStart,
			lineEnd:motionLineEnd,
			lineStartDenotative:motionLineStartDenotative,
			lineEndDenotative:motionLineEndDenotative,
			nextWord:motionNextWord,
			prevWord:motionPrevWord,
			findForward:motionFindForward,
			findBackward:motionFindBackward,
			findByRegexFacade:motionFindByRegexFacade,
			findByRegexForward:motionFindByRegexForward,
			findByRegexBackward:motionFindByRegexBackward,
			upDown:motionUpDown,
			up:motionUp,
			down:motionDown,
			upDownDenotative:motionUpDownDenotative
		}),

		/*
		 * edit operations
		 */
		edit:Object.freeze({
			deleteSelection:deleteSelection,
			deleteCharsForward:deleteCharsForward,
			deleteCharsBackward:deleteCharsBackward,
			insert:insert,
			overwrite:overwrite,
			shift:shift,
			unshift:unshift,
			joinLines:joinLines,
			yank:yank,
			paste:paste
		})
	});
}

/*constructor*/function Collection () {
}
Collection.prototype = Object.create({}, {
	clear:{
		value:function () {
			Object.keys(this).forEach(function (key) {
				delete this[key];
			}, this);
		}
	},
	size:{
		value:function () {
			return Object.keys(this).length;
		}
	}
});

/*constructor*/function ExCommandExecutor (app) {
	var self = this;
	var running = false;
	var pcOverride = false;
	var pc = 0;
	var opcodes = [];
	var errorVectors = [];
	var executedRegisterFlags = {};
	var lastError;

	/* classes */
	function ExICode (command, args, rangeSource) {
		this.command = command;
		this.args = args;
		this.rangeSource = rangeSource;
	}

	/* public methods */
	function clone () {
		return new ExCommandExecutor(app);
	}
	function clear () {
		opcodes.length = 0;
		pc = -1;
	}
	function createOpcode (command, args, rangeSource) {
		if (isFunction(command)) {
			command = Wasavi.ExCommand.create('', '', '', 0, command);
		}
		if (!args) {
			args = command.parseArgs(app, [], '', '');
		}
		return new ExICode(command, args, rangeSource);
	}
	function add (/*command, args, range*/) {
		var a = arguments;
		var result;
		if (a.length == 0) return;

		// [opcodes]
		if (isArray(a[0])) {
			result = a[0];
			opcodes.push.apply(opcodes, result);
		}
		
		// command, <<args, <range>>
		else {
			result = createOpcode.apply(null, [0, 1, 2].map(function (i) {
				return a.length > i ? a[i] : undefined;
			}));
			opcodes.push(result);
		}
		return result;
	}
	function insert (/*command, args, range, index*/) {
		var a = toArray(arguments);
		var index = a.pop();
		var result;

		// [opcodes], index
		if (isArray(a[0])) {
			result = arguments[0];
			opcodes.splice.apply(opcodes, [index, 0].concat(result));
		}
		// command, <<args, <range>>, index
		else {
			result = createOpcode(a[0], a[1], a[2]);
			opcodes.splice(index, 0, result);
		}
		return result;
	}
	function run (source) {
		if (running) return Promise.resolve(self);

		// append terminate command
		clear();
		var result = compile(source);
		add(terminate).command.name = '$terminate';
		if (isString(result)) {
			pc = opcodes.length - 1;
			lastError = result;
		}
		else {
			pc = 0;
			lastError = undefined;
		}

		// initialize
		app.editLogger.open('ex');
		showOverlay();
		app.keyManager.lock();
		running = true;
		executedRegisterFlags = {};

		function settle (opcode, command, commandResult, ss) {
			if (isString(opcode.rangeSource)) {
				opcode.args.range = null;
			}

			if ((app.isJumpBaseUpdateRequested || command.flags.updateJump)
			&& app.buffer.selectionStart.ne(ss)) {
				app.marks.setJumpBaseMark(ss);
				app.isJumpBaseUpdateRequested = false;
			}

			if (commandResult.flags.hash
			|| commandResult.flags.list
			|| commandResult.flags.print) {
				var n = minmax(0,
					app.buffer.selectionStartRow + commandResult.flagoff,
					app.buffer.rowLength - 1);
				app.buffer.setSelectionRange(app.buffer.getLineTopOffset2(n, 0));
				Wasavi.ExCommand.printRow(app, app.buffer, n.row, n.row, commandResult.flags);
			}

			if (!pcOverride) {
				pc++;
			}
		}

		return Promise.resolve().then(function next () {
			var buffer = app.buffer;

			while (pc >= 0 && pc < opcodes.length) {
				//dumpOpcodes();

				var opcode = opcodes[pc];
				var command = opcode.command;

				// recalculate the range
				if (!opcode.args.range && isString(opcode.rangeSource)) {
					var newRange = Wasavi.ExCommand.parseRange(
						app, opcode.rangeSource, undefined, true);

					if (isString(newRange)) {
						raiseError(command, newRange);
						continue;
					}

					newRange = newRange.rows.last(
						buffer, command.rangeCount,
						command.flags.addr2All);

					newRange = command.fixupRange(app, newRange);
					if (isString(newRange)) {
						raiseError(command, newRange);
						continue;
					}

					opcode.args.range = newRange;
				}

				// execute
				pcOverride = false;
				var ss = buffer.selectionStart;
				var commandResult = command.run(app, opcode.args);

				if (isString(commandResult)) {
					raiseError(command, commandResult);
					continue;
				}

				if (commandResult.value instanceof Promise) {
					return commandResult.value.then(v => {
						if (isString(v)) {
							raiseError(command, command.name + ': ' + v);
						}
						else {
							commandResult.value = v;
							settle(opcode, command, commandResult, ss);
						}
					})
					.then(next);
				}
				else {
					settle(opcode, command, commandResult, ss);
				}
			}

			return true;
		});
	}

	function showOverlay () {
		$('wasavi_cover').className = 'dim';
	}
	function hideOverlay () {
		$('wasavi_cover').className = '';
	}

	function compile (source, parents) {
		// compile body <<<
		/*
		 * compile ex command source to intermediate expression
		 *
		 * @see http://pubs.opengroup.org/onlinepubs/9699919799/utilities/ex.html#tag_20_40_13_03
		 */

		var resultMessage;
		var lastTerminator;
		var commandName = '';
		var commandNameSupplement = '';
		var commandObj = null;
		var argv = null;
		var args = '';
		var range = null;
		var literalKey = false;
		var literalExitKey = '';

		function getDelimiterRegex (delimiter) {
			delimiter = '\\u' + ('000' + delimiter.charCodeAt(0).toString(16)).substr(-4);
			return new RegExp('\\n|' + delimiter, 'g');
		}
		function skipby (n, justSkip) {
			var skip = source.substring(0, n);
			if (!justSkip && source != '\n') {
				args += skip;
			}
			source = source.substring(n);
			return skip;
		}
		function skipblank (regex) {
			regex || (regex = spc('^S+'));
			var re = regex.exec(source);
			if (re) {
				skipby(re[0].length);
			}
		}
		function skipto (regex, opts) {
			opts || (opts = {});
			var escapeChars = opts.escapeChars || '\\';
			var discard = opts.discard;
			var re = regex.exec(source);
			if (re) {
				do {
					var index = regex.lastIndex - re[0].length;
					if (index == 0 || escapeChars.indexOf(source.charAt(index - 1)) < 0) {
						if (!discard) {
							if (argv) {
								argv.push(source.substring(0, index));
							}
							else {
								commandNameSupplement += source.substring(0, index);
							}
						}
						skipby(index);
						return;
					}
				} while ((re = regex.exec(source)));
			}
			if (!discard) {
				commandNameSupplement = source;
			}
			source = '';
		}
		function skipto2 (delimiter) {
			const ESCAPE_CHAR = '\\';
			var found = 0;
			var fragmentStart = 0;
			var isEscaping = false;

			for (var index = 0, goal = source.length; index < goal; index++) {
				var ch = source.charAt(index);

				if (isEscaping) {
					isEscaping = false;
					continue;
				}

				if (ch == ESCAPE_CHAR) {
					isEscaping = true;
					continue;
				}

				else if (ch == '\n') {
					argv.push(source.substring(fragmentStart, index));
					skipby(index);
					return;
				}

				else if (ch == delimiter) {
					argv.push(source.substring(fragmentStart, index));
					found++;
					if (found == 2) {
						skipby(index);
						return;
					}
					else {
						fragmentStart = index + 1;
					}
				}
			}

			commandNameSupplement = source;
			source = '';
		}
		function findCommand (name) {
			var commands = Wasavi.ExCommand.commands;
			for (var i = 0, goal = commands.length; i < goal; i++) {
				if (name.indexOf(commands[i].shortName) == 0
				&&  commands[i].name.indexOf(name) == 0) {
					return commands[i];
				}
			}
			return null;
		}
		function pushCommand () {
			if (!commandObj) return true;

			var r, argObj;

			if (commandObj.rangeCount == 0) {
				if (range.rows.length) {
					resultMessage = _('{0}: extra range specified.', commandObj.name);
					return false;
				}
				r = [];
			}
			else {
				r = range.rows.last(buffer, commandObj.rangeCount, commandObj.flags.addr2All);
				if (typeof r == 'string') {
					resultMessage = r;
					return false;
				}
			}

			argObj = commandObj.buildArgs(
				app,
				r, commandNameSupplement,
				argv, args,
				undefined
			);
			if (typeof argObj == 'string') {
				resultMessage = argObj || _('{0}: unknown syntax error.', commandObj.name);
				return false;
			}

			argObj.range = commandObj.fixupRange(app, argObj.range);
			if (typeof argObj.range == 'string') {
				resultMessage = argObj.range || _('{0}: unknown range error.', commandObj.name);
				return false;
			}

			add(commandObj, argObj, range.source);
			return true;
		}
		function paragraph12 () {
			if (/^(?:set|map|unmap|abbreviate|unabbreviate)$/.test(commandName)) {
				// do not include double quote for compatibility with vim.
				skipto(/[\n|]/g, {escapeChars:'\u0016'});
			}
			else {
				skipto(/[\n|"]/g);
			}
			if (/^(?:append|change|insert)$/.test(commandName) && source.charAt(0) == '|') {
				skipto(/\n/g);
			}
			if (source.charAt(0) == '"') {
				skipto(/\n/g, {discard:true});
			}
			if (commandName == 'print' && commandNameSupplement == '') {
				commandNameSupplement = 'p';
			}
			lastTerminator = skipby(1);
		}

		/*
		 *
		 */

		source = source.replace(/\\\n/g, '');

		if (/[\\\u0016]$/.test(source)) {
			source = source.substring(0, source.length - 1);
		}
		if (!/\n$/.test(source)) {
			source += '\n';
		}

		while (source.length) {
			// in literal mode, store a string
			if (literalKey !== false) {
				skipto(/\n/g);
				skipby(1);
				if (argv && argv.length
				&&  argv.lastItem.replace(spc('S+$'), '') == literalExitKey) {
					argv.pop();
					if (!pushCommand()) {
						break;
					}
					argv = null;
					literalKey = false;
				}
				else if (source.length == 0) {
					pushCommand();
					break;
				}
				continue;
			}

			commandName = commandNameSupplement = args = '';
			commandObj = null;

			// 1. Leading <colon> characters shall be skipped.
			// 2. Leading <blank> characters shall be skipped.
			skipblank(spc('^[:S]+'));

			// 3. If the leading character is a double-quote character, the characters up to and
			// including the next non- <backslash>-escaped <newline> shall be discarded, and any
			// subsequent characters shall be parsed as a separate command.
			if (/^"/.test(source)) {
				skipto(/\n/g, {discard:true});
				lastTerminator = skipby(1);
				continue;
			}

			// 4. Leading characters that can be interpreted as addresses shall be evaluate;
			// see Addressing in ex
			// (http://pubs.opengroup.org/onlinepubs/9699919799/utilities/ex.html#tag_20_40_13_02).
			range = Wasavi.ExCommand.parseRange(app, source, undefined, true);
			if (typeof range == 'string') {
				resultMessage = range;
				break;
			}
			range.source = source.substring(0, source.length - range.rest.length);
			skipby(source.length - range.rest.length);

			// 5. Leading <blank> characters shall be skipped.
			skipblank(spc('^[:S]+'));

			// 6. If the next character is a <vertical-line> character or a <newline>:
			//
			//   a. If the next character is a <newline>:
			//
			//     i. If ex is in open or visual mode, the current line shall be set to the last
			//     address specified, if any.
			//
			//     ii. Otherwise, if the last command was terminated by a <vertical-line> character,
			//     no action shall be taken; for example, the command "||<newline>" shall execute
			//     two implied commands, not three.
			//
			//     iii. Otherwise, step 6.b. shall apply.
			//
			//   b. Otherwise, the implied command shall be the print command. The last #, p, and l
			//   flags specified to any ex command shall be remembered and shall apply to this
			//   implied command. Executing the ex number, print, or list command shall set the
			//   remembered flags to #, nothing, and l, respectively, plus any other flags
			//   specified for that execution of the number, print, or list command.
			//
			//   If ex is not currently performing a global or v command, and no address or count
			//   is specified, the current line shall be incremented by 1 before the command is
			//   executed. If incrementing the current line would result in an address past the
			//   last line in the edit buffer, the command shall fail, and the increment shall not
			//   happen.
			//
			//   c. The <newline> or <vertical-line> character shall be discarded and any
			//   subsequent characters shall be parsed as a separate command.
			if (source.charAt(0) == '|' || source.charAt(0) == '\n') {
				switch (source.charAt(0)) {
				case '\n':
					app.isJumpBaseUpdateRequested = false;
					if (range && range.rows.length) {
						commandObj = Wasavi.ExCommand.defaultCommand;
						break;
					}
					if (lastTerminator == undefined || lastTerminator == '|' || !app.isInteractive) {
						break;
					}
					/*FALLTHRU*/

				case '|':
					commandObj = Wasavi.ExCommand.defaultCommand;
					commandNameSupplement = 'p';
					break;
				}

				lastTerminator = skipby(1);

				if (!pushCommand()) {
					break;
				}

				continue;
			}

			// 7. The command name shall be comprised of the next character (if the character
			// is not alphabetic), or the next character and any subsequent alphabetic characters
			// (if the character is alphabetic), with the following exceptions:
			//
			//   a. Commands that consist of any prefix of the characters in the command name
			//   delete, followed immediately by any of the characters 'l' , 'p' , '+' , '-' , or
			//   '#' shall be interpreted as a delete command, followed by a <blank>, followed by
			//   the characters that were not part of the prefix of the delete command. The maximum
			//   number of characters shall be matched to the command name delete; for example,
			//   "del" shall not be treated as "de" followed by the flag l.
			//
			//   b. Commands that consist of the character 'k' , followed by a character that can
			//   be used as the name of a mark, shall be equivalent to the mark command followed
			//   by a <blank>, followed by the character that followed the 'k' .
			//
			//   c. Commands that consist of the character 's' , followed by characters that could
			//   be interpreted as valid options to the s command, shall be the equivalent of the
			//   s command, without any pattern or replacement values, followed by a <blank>,
			//   followed by the characters after the 's' .
			if (/^[a-z]/i.test(source)) {
				if (/^(?:k\s*[a-zA-Z]|s\s*[^a-zA-Z \\|\n"])/.test(source)) {
					commandName = source.charAt(0);
					skipby(1);
				}
				else {
					var re = /^[a-z]+/i.exec(source);
					commandName = re[0];
					skipby(re[0].length);
				}
			}
			else {
				commandName = source.charAt(0);
				skipby(1);
			}

			// 8.The command name shall be matched against the possible command names, and a
			// command name that contains a prefix matching the characters specified by the user
			// shall be the executed command. In the case of commands where the characters
			// specified by the user could be ambiguous, the executed command shall be as
			// follows:
			//
			//   a:  append    n:  next    t:  t
			//   c:  change    p:  print   u:  undo
			//   ch: change    pr: print   un: undo
			//   e:  edit      r:  read    v:  v
			//   m:  move      re: read    w:  write
			//   ma: mark      s:  s
			//
			// Implementation extensions with names causing similar ambiguities shall not be
			// checked for a match until all possible matches for commands specified by
			// POSIX.1-2008 have been checked.
			commandObj = findCommand(commandName);
			if (commandObj) {
				commandName = commandObj.name;
			}

			// 9. (wasavi does not support '!' command)

			// 10. Otherwise, if the command is an edit, ex, or next command, or a visual command
			// while in open or visual mode, the next part of the command shall be parsed as
			// follows:
			//
			//   a. Any '!' character immediately following the command shall be skipped and be
			//   part of the command.
			//
			//   b. Any leading <blank> characters shall be skipped and be part of the command.
			//
			//   c. If the next character is a '+' , characters up to the first non- <backslash>-
			//   escaped <newline> or non- <backslash>-escaped <blank> shall be skipped and be part
			//   of the command.
			//
			//   d. The rest of the command shall be determined by the steps specified in paragraph
			//   12.
			if (/^(?:edit|ex|next|visual)$/.test(commandName)) {
				if (source.charAt(0) == '!') {
					commandNameSupplement += source.charAt(0);
					skipby(1);
				}
				skipblank();
				if (source.charAt(0) == '+') {
					skipto(spc('[\\nS]', 'g'));
				}
				paragraph12();
			}

			// 11. Otherwise, if the command is a global, open, s, or v command, the next part of
			// the command shall be parsed as follows:
			//
			//   a. Any leading <blank> characters shall be skipped and be part of the command.
			//
			//   b. If the next character is not an alphanumeric, double-quote, <newline>,
			//   <backslash>, or <vertical-line> character:
			//
			//     i. The next character shall be used as a command delimiter.
			//
			//     ii. If the command is a global, open, or v command, characters up to the first
			//     non- <backslash>-escaped <newline>, or first non- <backslash>-escaped delimiter
			//     character, shall be skipped and be part of the command.
			//
			//     iii. If the command is an s command, characters up to the first non- <backslash>
			//     -escaped <newline>, or second non- <backslash>-escaped delimiter character,
			//     shall be skipped and be part of the command.
			//
			//   c. If the command is a global or v command, characters up to the first non-
			//   <backslash>-escaped <newline> shall be skipped and be part of the command.
			//
			//   d. Otherwise, the rest of the command shall be determined by the steps specified
			//   in paragraph 12.
			else if (/^(?:global|open|s|v)$/.test(commandName)) {
				skipblank();
				if (/^(?:[^a-zA-Z0-9"\n\\|])/.test(source)) {
					var delimiter = source.charAt(0);
					argv = [];
					skipby(1);

					if (commandName != 's') {
						skipto(getDelimiterRegex(delimiter));
					}
					else {
						skipto2(delimiter);
					}
					if (source.charAt(0) == delimiter) {
						skipby(1);
					}
				}
				if (/^(?:global|v)$/.test(commandName)) {
					if (parents) {
						resultMessage = _('Cannot use the global or v command recursively.');
						break;
					}
					skipto(/\n/g);
					lastTerminator = skipby(1);
				}
				else {
					paragraph12();
				}
			}

			//
			else if (commandName == 'script') {
				skipto(/\n/g);
				lastTerminator = skipby(1);

				if (/^\s*$/.test(commandNameSupplement)) {
					if (app.isInteractive) {
						resultMessage = _('Cannot use the multi-lined script interactively.');
						break;
					}
					argv = [];
					literalKey = commandName;
					literalExitKey = commandName + 'end';
					continue;
				}
			}

			// 12. Otherwise:
			//
			//   a. If the command was a map, unmap, abbreviate, or unabbreviate command,
			//   characters up to the first non- <control>-V-escaped <newline>, <vertical-line>,
			//   or double-quote character shall be skipped and be part of the command.
			//
			//   b. Otherwise, characters up to the first non- <backslash>-escaped <newline>,
			//   <vertical-line>, or double-quote character shall be skipped and be part of the
			//   command.
			//
			//   c. If the command was an append, change, or insert command, and the step 12.b.
			//   ended at a <vertical-line> character, any subsequent characters, up to the next
			//   non- <backslash>-escaped <newline> shall be used as input text to the command.
			//
			//   d. If the command was ended by a double-quote character, all subsequent
			//   characters, up to the next non- <backslash>-escaped <newline>, shall be discarded.
			//
			//   e. The terminating <newline> or <vertical-line> character shall be discarded and
			//   any subsequent characters shall be parsed as a separate ex command.
			else {
				paragraph12();
			}

			if (!pushCommand()) {
				break;
			}
			if (!commandObj && commandName != '') {
				resultMessage = _('{0}: unknown command.', commandName);
				break;
			}
		}

		if (typeof resultMessage == 'string') {
			return resultMessage;
		}

		if (literalKey !== false) {
			pushCommand();
		}
		// >>>
	}

	/* private methods */
	function dumpOpcodes () {
		console.log('*** opcodes ***\n' + opcodes.map(function (op, i) {
			return ('000' + i).substr(-4) +
				' ' + (pc == i ? '*' : ' ') +
				' ' + op.command.name;
		}).join('\n'));
	}

	function raiseError (command, errorMessage) {
		lastError = errorMessage || _('{0}: unknown error.', command.name);
		if (errorVectors.length) {
			pc = errorVectors.pop();
		}
		else {
			pc = pc < opcodes.length - 1 ? opcodes.length - 1 : pc + 1;
		}
	}

	function terminate (app, t, a) {
		hideOverlay();
		app.keyManager.unlock();
		app.editLogger.close();
		running = false;
		clear();

		if (lastError) {
			app.low.requestShowMessage(lastError, true);
		}
		if (!app.requestedState.console || app.requestedState.showInput) {
			app.low.requestConsoleClose();
		}
	}
	function toString () {return '[object ExCommandExecutor]'}

	publish(this,
		clone, run, showOverlay, hideOverlay, toString,
		{
			running: function () {return running},
			executedRegisterFlags: function () {return executedRegisterFlags},
			lastError: [
				function () {return lastError},
				function (v) {lastError = v}
			],

			inst: Object.freeze({
				clear: clear,
				createOpcode: createOpcode,
				add: add,
				insert: insert,
				compile: compile,

				get index () {return pc},
				set index (v) {
					if (!running) return;
					if (typeof v != 'number') return;
					pc = minmax(0, v - 0, opcodes.length);
					pcOverride = true;
				},
				get opcodes () {return opcodes},
				get currentOpcode () {return opcodes[pc]},
				get errorVectors () {return errorVectors}
			})
		}
	);
}
function Buffer () {
	Wasavi.Editor.apply(this, arguments);
}
Buffer.prototype = Object.create(Wasavi.Editor.prototype, {
	deleteRangeEx: {value: function (start, end, foldedMarkRegisterer, callback) {
		var args = [];
		var that = this;
		start && args.push(start);
		end   && args.push(end);
		args.push(function (content, fragment) {
			var deleteMarks = fragment.querySelectorAll('span.' + Wasavi.MARK_CLASS);
			var deleteMarksDest = {};
			for (var i = 0; i < deleteMarks.length; i++) {
				var name = deleteMarks[i].getAttribute('data-index');
				var position = marks.get(name);
				if (position) {
					deleteMarksDest[name] = position.clone();
				}
			}
			if (!that.isLineOrientSelection) {
				foldedMarkRegisterer(fragment);
			}
			if (callback) {
				callback(content, fragment, deleteMarksDest);
			}
		});
		return this.deleteRange.apply(this, args);
	}},
	emphasisBound: {value: (function () {
		function createSpan (content) {
			var span = document.createElement('span');
			span.className = Wasavi.BOUND_CLASS;
			span.textContent = content || '';
			return span;
		}
		return function emphasisBound (s, e) {
			s || (s = this.selectionStart);
			e || (e = this.selectionEnd);

			if (s.gt(e)) {
				var t = s; s = e; e = t;
			}

			var r = document.createRange();
			var f = document.createDocumentFragment();
			var snode = this.rowNodes(s);
			var enode = this.rowNodes(e);
			r.setStart(snode.firstChild, s.col);
			r.setEnd(enode.firstChild, e.col);
			f.appendChild(r.extractContents());

			if (f.childNodes.length >= 2) {
				snode.appendChild(createSpan(f.firstChild.textContent));
				enode.insertBefore(createSpan(f.lastChild.textContent), enode.firstChild);
				f.removeChild(f.firstChild);
				f.removeChild(f.lastChild);
				if (f.childNodes.length) {
					for (var i = 0, goal = f.childNodes.length; i < goal; i++) {
						f.childNodes[i].replaceChild(
							createSpan(f.childNodes[i].textContent),
							f.childNodes[i].firstChild);
					}
					r.insertNode(f);
				}
			}
			else {
				var span = createSpan();
				span.appendChild(f);
				r.insertNode(span);
			}
		};
	})()},
	unEmphasisBound: {value: function (start, end) {
		return this.unEmphasis(Wasavi.BOUND_CLASS, start, end);
	}}
});
Buffer.prototype.constructor = Wasavi.Editor;

diag('defining functions');

/*
 * low-level functions <<<1
 * ----------------
 */

// for application management
function log () {
	logMode && console.log('wasavi: ' + toArray(arguments).join(' '));
}
function info () {
	logMode && console.info('wasavi: ' + toArray(arguments).join(' '));
}
function error () {
	logMode && console.error('wasavi: ' + toArray(arguments).join(' '));
}
function notifyToParent (eventName /* [,payload][,callback]*/) {
	if (!extensionChannel || extensionChannel.isTopFrame()) return false;

	var payload, callback;
	var args = toArray(arguments);

	if (args.length && isFunction(args.lastItem)) {
		callback = args.pop();
	}
	if (args.length && isObject(args.lastItem)) {
		payload = args.pop();
	}

	payload || (payload = {});
	payload.type = eventName;
	payload.frameId = targetElement.frameId;

	extensionChannel.postMessage({
		type: 'transfer',
		to: targetElement.parentTabId,
		payload: payload
	}, callback);

	return true;
}
function notifyActivity (code, key, note) {
	if (!testMode || !extensionChannel) return;
	if (extensionChannel.isTopFrame()) {
		if (!document.documentElement.getAttribute('data-wasavi-command-state')) {
			document.documentElement.setAttribute('data-wasavi-command-state', 'busy');
		}
	}
	else {
		notifyToParent('notify-keydown', {
			keyCode:code,
			key:key,
			eventType:note
		});
	}
}
function notifyCommandComplete (eventName, modeOverridden) {
	if (!testMode || !extensionChannel) return;
	eventName || (eventName = 'command-completed');
	var pt = new Position(getCurrentViewPositionIndices().top, 0);
	var currentState = {
		running:    !!targetElement,
		state:      state,
		inputMode:  modeOverridden || inputMode,
		lastMessage:lastMessage,
		lastSimpleCommand: lastSimpleCommand,
		value:      buffer.value,
		row:        buffer.selectionStartRow,
		col:        buffer.selectionStartCol,
		topRow:     pt.row,
		topCol:     pt.col,
		rowLength:  buffer.rowLength,
		registers:  registers.dumpData(),
		marks:      marks.dumpData(),
		lines:      config.vars.lines,
		lineInput:  state == 'line_input' ? $('wasavi_footer_input').value : ''
	};
	if (extensionChannel.isTopFrame()) {
		document.documentElement.removeAttribute('data-wasavi-command-state');
		document.documentElement.setAttribute('data-wasavi-input-mode', inputMode);
		document.documentElement.setAttribute('data-wasavi-state', JSON.stringify(currentState));
	}
	else {
		notifyToParent(eventName, {state:currentState});
	}
}
function install (x, req) {
	/*
	 * DOM structure:
	 *
	 * style#wasavi_global_styles [style sheet]
	 * style#wasavi_theme_styles [style sheet]
	 * input#wasavi_focus_holder
	 *
	 * div#wasavi_container
	 *   |
	 *   + div#wasavi_editor [main editor screen]
	 *   |
	 *   + div#wasavi_textwidth_guide
	 *   |
	 *   + div#wasavi_console_container
	 *   |   |
	 *   |   + textarea#wasavi_console
	 *   |
	 *   + div#wasavi_footer
	 *   |   |
	 *   |   + div#wasavi_footer_status_container
	 *   |   |   |
	 *   |   |   + div#wasavi_footer_file_indicator [file name indicator]
	 *   |   |   |
	 *   |   |   + div#wasavi_footer_prefix_indicator [prefix input indicator]
	 *   |   |
	 *   |   + div#wasavi_footer_input_container
	 *   |   |   |
	 *   |   |   + div#wasavi_footer_input_indicator [header indicator]
	 *   |   |   |
	 *   |   |   + input#wasavi_footer_input [line input editor]
	 *   |   |
	 *   |   + div#wasavi_footer_notifier
	 *   |
	 *   + span#wasavi_singleline_scaler
	 *   |
	 *   + div#wasavi_console_scaler
	 *   |
	 *   + div#wasavi_command_cursor [normal mode cursor]
	 *   |   |
	 *   |   + span#wasavi_command_cursor_inner
	 *   |
	 *   + div#wasavi_cover [cover element]
	 *       |
	 *       + span#wasavi_cover_button
	 */

	diag('entering install()');

	// container
	var cnt = $('wasavi_container');
	if (!cnt) throw new TypeError('wasavi container not found');

	//
	var fontStyle = 'font:' + x.fontStyle + ';';

	// scale line height
	var scaler = document.body.appendChild(document.createElement('span'));
	style(scaler, {
		font:x.fontStyle,
		textDecoration:'none',
		textShadow:'none',
		letterSpacing:'100%',
		whiteSpace:'pre',
		lineHeight:1
	});
	scaler.textContent = multiply('0', 100);
	lineHeight = scaler.offsetHeight;
	charWidth = scaler.offsetWidth / 100;
	scaler.parentNode.removeChild(scaler);

	// style
	var styleElement = $('wasavi_global_styles');
	var styleSource = req.style
		.replace(/\/\*<FONT_STYLE\/>\*\//g, fontStyle)
		.replace(/\/\*<(LINE_HEIGHT)>\*\/.*?<\/\1>\*\//g, lineHeight + 'px')
		.replace(/\/\*<(CHAR_WIDTH)>\*\/.*?<\/\1>\*\//g, charWidth + 'px')
		.replace(/\/\*<LINE_NUMBERS\/\>\*\//g, function () {
			var result = [];
			for (var i = 1; i <= Wasavi.LINE_NUMBER_MAX_WIDTH; i++) {
				result.push(
					'#wasavi_editor.n' + i + ' > div:before {' +
					'min-width:' + (charWidth * i) + 'px;' +
					'max-width:' + (charWidth * i) + 'px;' +
					'margin-left:-' + (charWidth * (i + 1)) + 'px;' +
					'overflow:hidden;' +
					'}'
				);
				result.push(
					'#wasavi_editor.n' + i + ' > div {' +
					'margin-left:' + (charWidth * (i + 1)) + 'px;' +
					'}'
				);
			}
			return result.join('\n');
		})
		.replace(/\/\*<(FONT_FAMILY)>\*\/.*?<\/\1>\*\//g, req.fontFamily);

	styleElement.appendChild(document.createTextNode(styleSource));

	// theme
	theme.fontStyle = x.fontStyle;
	theme.lineHeight = lineHeight;
	theme.useStripe = config.vars.stripe;

	// focus holder
	var focusHolder = $('wasavi_focus_holder');
	// issue #174
	//
	// focusHolder is input[type="password"].
	// This is a hack for forcing IME to be disabled.
	// But the latest Firefox shows disturbing message to a password field on http page.
	// So we change the type of input to "text".
	//
	// https://github.com/akahuku/wasavi/issues/174
	if (Wasavi.IS_GECKO) {
		focusHolder.type = 'text';
	}

	// buffer
	buffer = new Buffer($('wasavi_editor'));

	// text length scaler
	var textspan = $('wasavi_singleline_scaler');
	textspan.textContent = '#';

	// footer (default indicator)
	var footerStatusLine = $('wasavi_footer_status_container');
	$('wasavi_footer_file_indicator').textContent = '#';

	// footer alter contents: line input container
	var footerAlter = $('wasavi_footer_input_container');
	footerAlter.style.display = 'none';

	var footerIndicator = $('wasavi_footer_input_indicator');
	footerIndicator.textContent = '/';

	var footerInput = $('wasavi_footer_input');

	// footer notifier
	var footerNotifier = $('wasavi_footer_notifier');
	footerNotifier.textContent = 'hello, world';

	// console window
	var conwincnt = $('wasavi_console_container');
	var conwin = $('wasavi_console');

	// command cursor
	var cc = $('wasavi_command_cursor');
	var ccInner = $('wasavi_command_cursor_inner');
	ccInner.style.height = lineHeight + 'px';

	// cover
	$('wasavi_cover_button').textContent = _('Press ^C to interrupt.');

	/*
	 * visual settings
	 */

	setTabStop(config.vars.tabstop);
	statusLineHeight = req.statusLineHeight;
	footerStatusLine.style.height = footerAlter.style.height = statusLineHeight + 'px';
	setGeometory(x);

	/*
	 * initialize variables
	 */

	targetElement = x;

	l10n = new Wasavi.L10n(appProxy, req.messageCatalog);
	ffttDictionary = new unicodeUtils.FfttDictionary(
		req.unicodeDictData.fftt);
	lineBreaker = new unicodeUtils.LineBreaker(
		req.unicodeDictData.LineBreak);

	document.documentElement.setAttribute(
		'lang', l10n.getMessage('wasavi_locale_code'));

	extensionChannel.tabId = req.tabId;
	exrc = {
		main: req.exrc,
		setargs: x.setargs ? 'set ' + x.setargs.replace(/([^\u0016])\|.*/, '$1')  : null,
		ros: req.ros
	};
	quickActivation = req.quickActivation;
	global._ = l10n.getTranslator();
	devMode = req.devMode;
	logMode = req.logMode;
	fstab = req.fstab;
	version = req.version;

	fileName = '';
	fstab.forEach(function (fs, i) {
		if (fs.isDefault && fileSystemIndex === undefined) {
			fileSystemIndex = i;
		}
		fs.cwd = '/';
	});
	preferredNewline = '\n';
	terminated = false;
	state = 'normal';
	inputModeStack = [];
	inputMode = 'command';
	prefixInput = new Wasavi.PrefixInput;
	idealWidthPixels = idealDenotativeWidthPixels = -1;
	isEditCompleted = isVerticalMotion = isReadonlyWarned =
	isSmoothScrollRequested = isJumpBaseUpdateRequested =
	isUndoFlipped = false;
	recordedStrokes = new Wasavi.StrokeRecorder;
	lastSimpleCommand = '';
	lastHorzFindCommand = {direction:0, letter:'', stopBefore:false};
	lastRegexFindCommand = new Wasavi.RegexFinderInfo;
	lastSubstituteInfo = new Collection;
	lastMessage = '';
	requestedState = {};

	buffer.value = x.value;
	buffer.selectionStart = x.selectionStart || 0;
	buffer.selectionEnd = x.selectionEnd || 0;

	registers = new Wasavi.Registers(
		appProxy,
		testMode || !('registers' in req) ? null : req.registers);
	lineInputHistories = new Wasavi.LineInputHistories(
		appProxy,
		config.vars.history, '/:es'.split(''),
		testMode || !('lineInputHistories' in req) ? null : req.lineInputHistories);
	marks = new Wasavi.Marks(
		appProxy,
		testMode || !('marks' in x) ? null : x.marks);

	inputHandler = new Wasavi.InputHandler(appProxy);
	cursor = new Wasavi.CursorUI(appProxy,
		cc, $('wasavi_cursor_line'), $('wasavi_cursor_column'),
		focusHolder, footerInput);
	scroller = new Wasavi.Scroller(appProxy, cursor, footerStatusLine);
	editLogger = new Wasavi.EditLogger(appProxy, config.vars.undolevels);
	exvm = new ExCommandExecutor(appProxy);
	backlog = new Wasavi.Backlog(appProxy, conwincnt, conwin);
	searchUtils = new Wasavi.SearchUtils(appProxy);
	notifier = new Wasavi.Notifier(appProxy, footerNotifier);
	surrounding = new Wasavi.Surrounding(appProxy);
	executingMacroInfo = [];

	config.setData(x.readOnly ? 'readonly' : 'noreadonly');

	computeIdealWidthPixels();
	var initialMessage = getFileIoResultInfo('', x.value.length, true);
	showMessage(initialMessage);
	document.title = initialMessage;

	x.value = null;

	/*
	 * set up message handlers
	 */

	extensionChannel.setMessageListener(handleBackendMessage);

	/*
	 * notify initialized event to agent
	 */

	if (extensionChannel.isTopFrame()) {
		runExrc();
	}
	else {
		notifyToParent('initialized', {
			height: cnt.offsetHeight,
			childTabId: extensionChannel.tabId
		}, runExrc);
	}

	diag('leaving install()');
}
function runExrc () {
	diag('entering runExrc()');

	/*
	 * set up event handlers
	 */

	setupEventHandlers(true);

	/*
	 * setup theme
	 */

	theme.container = $('wasavi_container');;
	theme.update();

	/*
	 * execute exrc
	 */

	isInteractive = false;
	promise = exvm
		.run(exrc.main)
		.then(() => {
			if (exvm.lastError) {
				log(`wasavi: an error occured in exrc.main:\n${exvm.lastError}`);
				exvm.lastError = undefined;
			}
			if (isString(exrc.setargs) && exrc.setargs != '') {
				log(`evaluating exrc.setargs:\n${exrc.setargs}`);
				return exvm.run(exrc.setargs);
			}
		})
		.then(() => {
			if (exvm.lastError) {
				log(`wasavi: an error occured in exrc.setargs:\n${exvm.lastError}`);
				exvm.lastError = undefined;
			}

			config.saveSnapshot('exrc');

			if (config.vars.override && isString(exrc.ros) && exrc.ros != '') {
				log(`evaluating exrc.ros:\n${exrc.ros}`);
				return exvm.run(exrc.ros);
			}
		})
		.then(() => {
			if (exvm.lastError) {
				log(`wasavi: an error occured in exrc.ros:\n${exvm.lastError}`);
				exvm.lastError = undefined;
			}

			if (config.vars.launchbell) {
				bell.play('launch', true);
			}

			if (requestedState.console.open) {
				backlog.open();
				pushInputMode({}, 'backlog_prompt');
			}

			exrc = null;
			config.setData('nomodified');
			requestedState = {};

			/*
			 * show cursor
			 */

			cursor.ensureVisible();
			cursor.update({type:inputMode, focused:true, visible:true});

			/*
			 * final event
			 */

			notifyToParent('ready');
			diag('ready');
		});

	diag('leaving runExrc()');
}
function uninstall (implicit) {
	// in quick activation mode,
	// apply the edited content to target textarea
	if (quickActivation && config.vars.modified) {
		targetElement.value = buffer.value;
	}

	// remove all event handlers
	setupEventHandlers(false);

	// write back the data which agent uses
	targetElement.tabId = extensionChannel.tabId;
	targetElement.isTopFrame = !!extensionChannel.isTopFrame();
	targetElement.isImplicit = !!implicit;
	targetElement.ros = config.dumpScript(true).join('\n');
	targetElement.marks = testMode ? null : marks.save();

	// clear all objects
	inputModeStack = undefined;
	prefixInput = undefined;
	pairBracketsIndicator && pairBracketsIndicator.dispose();
	pairBracketsIndicator = undefined;
	backlog = backlog.dispose();
	searchUtils = searchUtils.dispose();
	notifier = notifier.dispose();
	lastHorzFindCommand = undefined;
	lastRegexFindCommand = undefined;
	lastSubstituteInfo = undefined;
	requestedState = undefined;
	inputHandler = inputHandler.dispose();
	marks = marks.dispose();
	cursor = cursor.dispose();
	scroller = scroller.dispose();
	editLogger = editLogger.dispose();
	l10n = l10n.dispose();
	recordedStrokes = recordedStrokes.dispose();
	surrounding = surrounding.dispose();
	executingMacroInfo = undefined;

	keyManager.dispose();
	theme.dispose();
	completer.dispose();
	config.dispose();

	extensionChannel.postMessage({
		type:'terminated',
		payload:targetElement
	});
	notifyToParent('terminated', targetElement);

	//extensionChannel = extensionChannel.disconnect();
	targetElement = null;
	emptyNodeContents(document.body);
}
function setupEventHandlers (install) {
	var method = install ? 'addEventListener' : 'removeEventListener';

	// window
	window[method]('focus', handleWindowFocus, false);
	window[method]('blur', handleWindowBlur, false);
	window[method]('resize', handleWindowResize, false);
	window[method]('beforeunload', handleBeforeUnload, false);
	testMode && window[method]('error', handleWindowError, false);

	// document
	document[method]('paste', handlePaste, false);

	// key manager
	if (install) {
		keyManager
			.install({handlePasteEvent: false, useGenerator: true})
			.addListener(handleKeydown);
	}
	else {
		keyManager.uninstall();
	}

	// cover
	var cover = $('wasavi_cover');
	cover[method]('mousedown', handleCoverMousedown, false);
	cover[method]('click', handleCoverClick, false);
	cover[method]('mousewheel', handleCoverMousewheel, false);

	// cursor
	cursor.setupEventHandlers(install);
}

// for mode management
function pushInputMode (context, newInputMode, newInputModeOpts) {
	context.inputMode = inputMode;

	switch (inputMode) {
	case 'line_input':
		var input = $('wasavi_footer_input');
		context.value = input.value;
		context.prefix = $('wasavi_footer_input_indicator').textContent;
		context.curpos = input.selectionStart;
		context.historyName = lineInputHistories.defaultName;
		break;
	}

	inputModeStack.push(context);
	setInputMode(newInputMode, newInputModeOpts);
}
function popInputMode (context) {
	if (inputModeStack.length) {
		var lastContext = inputModeStack.pop();
		setInputMode(lastContext.inputMode, lastContext);
		if (context) {
			['code', 'letter', 'mapkey', 'subkey'].forEach(function (a) {
				context[a] = lastContext[a];
			});
		}
	}
	else {
		setInputMode('command');
	}
}

// for display
function showPrefixInput (message) {
	if (state != 'normal') return;

	let line = $('wasavi_footer_status_container');
	let alter = $('wasavi_footer_input_container');
	let indf = $('wasavi_footer_file_indicator');
	let indp = $('wasavi_footer_prefix_indicator');

	line.style.display = indf.style.display = indp.style.display = '';
	alter.style.display = 'none';

	if (indf.parentNode.nodeName == 'MARQUEE') {
		let m = indf.parentNode;
		let r = document.createRange();
		r.selectNodeContents(m);
		m.parentNode.insertBefore(r.extractContents(), m);
		m.parentNode.removeChild(m);
	}

	let fileNameString = getFileNameString() + (config.vars.modified ? ' [+]' : '');
	switch (inputMode) {
	case 'edit':
		indf.textContent = config.vars.showmode ? _('--INSERT--') : fileNameString;
		break;
	case 'overwrite':
		indf.textContent = config.vars.showmode ? _('--OVERWRITE--') : fileNameString;
		break;
	case 'bound':
		indf.textContent = config.vars.showmode ? _('--BOUND--') : fileNameString;
		break;
	case 'bound_line':
		indf.textContent = config.vars.showmode ? _('--BOUND LINE--') : fileNameString;
		break;
	case 'command':
	default:
		document.title = indf.textContent = fileNameString;
		break;
	}

	indp.textContent = message || prefixInput.toString() || getDefaultPrefixInputString();
}
function showMessageCore (message, emphasis, pseudoCursor, preserveLastMessage) {
	if (state != 'normal' && state != 'console_wait') return;

	let line = $('wasavi_footer_status_container');
	let alter = $('wasavi_footer_input_container');
	let indf = $('wasavi_footer_file_indicator');
	let indp = $('wasavi_footer_prefix_indicator');

	line.style.display = indf.style.display = '';
	alter.style.display = indp.style.display = 'none';

	if (indf.parentNode.nodeName == 'MARQUEE') {
		let m = indf.parentNode;
		let r = document.createRange();
		r.selectNodeContents(m);
		m.parentNode.insertBefore(r.extractContents(), m);
		m.parentNode.removeChild(m);
	}

	if (emphasis) {
		emptyNodeContents(indf);
		let span = indf.appendChild(document.createElement('span'));
		span.style.color = theme.colors.warnedStatusFg;
		span.style.backgroundColor = theme.colors.warnedStatusBg;
		span.textContent = message;
	}
	else {
		indf.textContent = message;
	}

	if (pseudoCursor) {
		let blink = indf.appendChild(document.createElement('span'));
		blink.className = 'blink';
		blink.textContent = '\u2588';
	}

	if (indf.scrollWidth > indf.offsetWidth) {
		let m = indf.parentNode.insertBefore(document.createElement('marquee'), indf);
		m.appendChild(indf);
		m.behavior = 'alternate';
		m.scrollDelay = 200;
		m.loop = 1;
	}

	if (!preserveLastMessage) {
		lastMessage = toNativeControl(message);
	}
}
function showMessage (text, em, pc, plm) {
	if (backlog.visible) {
		backlog.push({
			text:text,
			emphasis:!!em,
			pseudoCursor:!!pc,
			preserveLastMessage:!!plm
		});
		backlog.open(true);
	}
	else {
		showMessageCore(text, em, pc, plm);
	}
}
function showLineInput (prefix, value, curpos) {
	if (state != 'line_input') return;
	var line = $('wasavi_footer_input_container');
	var alter = $('wasavi_footer_status_container');
	var input = $('wasavi_footer_input');
	line.style.display = '';
	alter.style.display = 'none';
	prefix || (prefix = '>');
	value || (value = '');
	$('wasavi_footer_input_indicator').textContent = prefix;
	input.value = value;
	lineInputInfo = {
		input: input,
		clusters: null,
		getClusters: function () {
			if (!this.clusters) {
				this.clusters = Unistring(this.input.value);
			}
			return this.clusters;
		},
		invalidate: function () {
			this.clusters = null;
		}
	};
	if (isNumber(curpos)) {
		input.selectionStart = input.selectionEnd = curpos;
	}
	else {
		input.selectionStart = input.selectionEnd = value.length;
	}
	input.dataset.current = value;
	delete input.dataset.internalPrefix;
}
function invalidateIdealWidthPixels () {
	idealWidthPixels = -1;
}
function computeIdealWidthPixels () {
	if (idealWidthPixels >= 0) return;
	var n = buffer.selectionStart;
	idealWidthPixels = getPixelWidth(buffer.rows(n).substr(0, n.col));

	var curRectTop = buffer.rowNodes(n).getBoundingClientRect();
	var curRect = buffer.charRectAt(n);
	idealDenotativeWidthPixels = curRect.left - curRectTop.left;
}

// for flag request
function requestShowPrefixInput (message) {
	if (!requestedState.showInput) {
		requestedState.showInput = {message:message};
	}
	return message;
}
function requestShowMessage (message, emphasis, pseudoCursor, preserveLastMessage) {
	if (!requestedState.message) {
		backlog.push({
			text:message,
			emphasis:!!emphasis,
			pseudoCursor:!!pseudoCursor,
			preserveLastMessage:!!preserveLastMessage
		});
		requestedState.message = true;
		requestedState.console = {open:true};
	}
	return message;
}
function requestNotice (args) {
	if (!requestedState.notice) {
		if (isString(args)) {
			requestedState.notice = {message:args};
		}
		else {
			requestedState.notice = args || {bell:true};
		}
		if (!('message' in requestedState.notice)) {
			if (!('bell' in requestedState.notice)) {
				requestedState.notice.bell = true;
			}
		}
	}
}
function requestInputMode (mode, opts) {
	if (!requestedState.inputMode) {
		opts || (opts = {});
		requestedState.inputMode = {
			mode:mode,
			modeOpts:opts.modeOpts || {},
			overrides:opts.overrides || {},
			callback:opts.callback
		};
	}
	return requestedState.inputMode;
}
function requestConsoleOpen () {
	if (!requestedState.console) {
		requestedState.console = {
			open:true
		};
	}
}
function requestConsoleClose () {
	if (!requestedState.console) {
		requestedState.console = {
			open:false
		};
	}
}
function requestSimpleCommandUpdate (initial) {
	if (!requestedState.simpleCommand) {
		requestedState.simpleCommand = {initial:initial || ''};
	}
}

// main loop core functions
function completeSelectionRange (ss, se) {
	var s = buffer.selectionStart;
	var e = buffer.selectionEnd;

	if (s.gt(ss) && s.gt(se)) {
		buffer.setSelectionRange(s);
	}
	else if (e.lt(ss) && e.lt(se)) {
		buffer.setSelectionRange(e);
	}
	else if (s.ne(ss) && e.eq(se)) {
		buffer.setSelectionRange(s);
	}
	else if (s.eq(ss) && e.ne(se)) {
		buffer.setSelectionRange(e);
	}

	if (buffer.selected) {
		buffer.setSelectionRange(buffer.selectionStart);
	}

	buffer.clipPosition();
}
function doEditComplete () {
	config.setData('modified');
	lastRegexFindCommand.text = null;
	if (config.vars.readonly && !isReadonlyWarned) {
		isReadonlyWarned = true;
		requestNotice({
			message:_('Warning: changing readonly element.'),
			emphasis:true
		});
	}
}
function processAbbrevs (force, terminator) {
	var regex = config.vars.iskeyword;
	var target, last, canTransit;

	terminator || (terminator = '');

	if (force) {
		if (inputHandler.text.length < 1) return;
		target = inputHandler.text;
		last = '';
	}
	else {
		if (inputHandler.text.length < 2) return;
		target = inputHandler.text.substring(0, inputHandler.text.length - 1);
		last = inputHandler.text.substr(-1);
		if (!regex.test(target.substr(-1))) return;
		if (regex.test(last)) return;
	}

	for (var abbrev in abbrevs) {
		if (target.substr(-abbrev.length) != abbrev) continue;

		canTransit = false;
		if (regex.test(abbrev.charAt(0))) {
			if (abbrev.length == 1) {
				if (buffer.selectionStartCol - abbrev.length <= 1
				||  target.length - abbrev.length <= 0
				||  spc('S').test(target.substr(-(abbrev.length + 1), 1))) {
					canTransit = true;
				}
			}
			else {
				if (buffer.selectionStartCol - abbrev.length <= 1
				||  target.length - abbrev.length <= 0
				||  !regex.test(target.substr(-(abbrev.length + 1), 1))) {
					canTransit = true;
				}
			}
		}
		else {
			if (buffer.selectionStartCol - abbrev.length <= 1
			||  target.length - abbrev.length <= 0
			||  regex.test(target.substr(-(abbrev.length + 1), 1))
			||  spc('S').test(target.substr(-(abbrev.length + 1), 1))) {
				canTransit = true;
			}
		}
		if (!canTransit) continue;

		// noremapped abbreviation
		if (abbrevs[abbrev].final) {
			var a = inputHandler.text;
			var a2 = inputHandler.textFragment;

			inputHandler.text = target
				+ multiply('\u0008', abbrev.length)
				+ abbrevs[abbrev].value
				+ last;
			inputHandler.textFragment = inputHandler
				.textFragment
				.substring(0, inputHandler.textFragment.length - 1)
				+ multiply('\u0008', abbrev.length)
				+ abbrevs[abbrev].value
				+ last;

			deleteCharsBackward(abbrev.length + last.length, {isSubseq:true});
			(inputMode == 'edit' ? insert : overwrite)(abbrevs[abbrev].value + last);
		}

		// remapped abbreviation
		else {
			let t = inputHandler.text;
			let tf = inputHandler.textFragment;
			let stripLength = abbrev.length + last.length;

			// strip abbreviation trigger string and last character
			inputHandler.text = inputHandler.text
				.substring(0, inputHandler.text.length - stripLength);
			inputHandler.textFragment = inputHandler.textFragment
				.substring(0, inputHandler.textFragment.length - stripLength);
			inputHandler.stroke = inputHandler.stroke
				.substring(0, inputHandler.stroke.length - stripLength);

			//
			deleteCharsBackward(stripLength, {isSubseq:true});

			//
			keyManager.unshift(abbrevs[abbrev].value, last, terminator);
			keyManager.sweep();
		}
		break;
	}
	return canTransit;
}
function processAutoDivide (e) {
	if (config.vars.textwidth <= 0) return;

	const limitWidth = charWidth * config.vars.textwidth;
	const tmpMark = 'auto-format';
	const scaler = $('wasavi_singleline_scaler');
	const newlineObj = keyManager.objectFromCode(0x000d);

	var inputStateSaved;
	var prepared = false;

	while (true) {
		var line = buffer.rows(buffer.selectionStartRow);
		var overed = false;
		var breakItem = false;
		var lastIndex = 0;

		scaler.textContent = '';
		lineBreaker.run(line, function (item) {
			if (!item) return false;

			scaler.textContent += line.substring(lastIndex, item.index + item.length);
			lastIndex = item.index + item.length;

			if (item.codePoint != 32 && item.codePoint != 9
			&& scaler.offsetWidth > limitWidth) {
				overed = true;
			}
			else if (unicodeUtils.canBreak(item.breakAction)) {
				breakItem = item;
			}

			return overed && !!breakItem;
		});

		if (!overed || !breakItem) {
			break;
		}
		if (!prepared) {
			prepared = true;
			inputHandler.ungetText();
			inputHandler.flush();
			marks.setPrivate(tmpMark, buffer.selectionStart);
			inputStateSaved = {
				text:inputHandler.text,
				textFragment:inputHandler.textFragment
			};
		}

		buffer.setSelectionRange(new Position(
			buffer.selectionStartRow, breakItem.index + breakItem.length));

		var n = buffer.selectionStart;
		while (n.col > 0) {
			var left = buffer.leftClusterPos(n);
			if (!spc('S').test(buffer.charAt(left))) {
				break;
			}
			n = left;
		}
		if (n.lt(buffer.selectionEnd)) {
			buffer.selectionStart = n;
			deleteSelection();
		}

		inputHandler.inputHeadPosition = buffer.selectionStart;
		inputHandler.textFragment = '';
		inputHandler.appendText(newlineObj);
		execMap(buffer, newlineObj, editMap, '\u000d', '', '\u000d');
		inputHandler.flush();
	}

	if (prepared) {
		buffer.setSelectionRange(marks.getPrivate(tmpMark));
		marks.setPrivate(tmpMark);
		inputHandler.inputHeadPosition = buffer.leftClusterPos(buffer.selectionStart);
		inputHandler.text = inputStateSaved.text;
		inputHandler.textFragment = inputStateSaved.textFragment;
		inputHandler.appendText(e);
	}
}
function needBreakUndo (s, ch) {
	if (getPixelWidth(s) < charWidth * config.vars.undoboundlen) return;
	return unicodeUtils.isSpace(ch)
		|| unicodeUtils.isSTerm(ch)
		|| unicodeUtils.isPTerm(ch)
		|| unicodeUtils.isIdeograph(ch);
}
function execMap (target, e, map, key, subkey, code, pos) {
	const DUMP = false;

	if (isArray(map)) {
		map = map.filter(m => !!m[key]);
		if (map.length == 0) return Promise.resolve(false);
		map = map[0];
	}
	else {
		if (!map[key]) return Promise.resolve(false);
	}

	subkey || (subkey = '');

	var opts = {
		target:target,
		e:e,
		key:key,
		subkey:subkey,
		selectionStart:pos && pos.s || buffer.selectionStart,
		selectionEnd:pos && pos.e || buffer.selectionEnd
	};
	var letter = e.code2letter(code) || code;
	var handler;

	if (DUMP) {
		console.log([
			'*** execMap ***',
			'target: ' + getObjectType(target),
			'   key: ' + (JSON.stringify(key)),
			'subkey: ' + (JSON.stringify(subkey)),
			'  code: ' + (JSON.stringify(code)),
			'  mode: ' + inputMode,
			'prefix: ' + prefixInput.toString(),
			'typeof map item: ' + typeof map[key]
		].join('\n'));
	}

	switch (typeof map[key]) {
	case 'function':
		if (subkey == '' || subkey == inputMode) {
			handler = map[key];
		}
		break;

	case 'object':
		if (subkey != '' && subkey in map[key]) {
			handler = map[key][subkey];
		}
		break;
	}

	if (!handler) {
		return Promise.resolve(true);
	}

	if (isGenerator(handler)) {
		return execGenerator(handler, map, letter, opts);
	}

	return Promise.resolve(handler.call(map, letter, opts));
}
function execCommandMap (r, map, key, subkey, code, updateBound) {
	var ss = buffer.selectionStart;
	var se = buffer.selectionEnd;

	lastMessage = '';

	return execMap(buffer, r.e, map, key, subkey, code)
	.then(isCompleted => execGenerator(function* () {
		if (isCompleted) {
			var canContinue = true;

			if (prefixInput.operation.length) {
				canContinue = yield execMap(
					buffer, r.e, map, prefixInput.operation, '$op', code, {s:ss, e:se}
				);
			}
			if (canContinue !== false) {
				isEditCompleted && doEditComplete();
				completeSelectionRange(ss, se);
				buffer.isLineOrientSelection =
				isEditCompleted =
				isVerticalMotion =
				isSmoothScrollRequested = false;

				if (requestedState.simpleCommand) {
					setLastSimpleCommand(
						requestedState.simpleCommand.initial,
						prefixInput.toString());
					delete requestedState.simpleCommand;
				}

				r.needEmitEvent = true;
				prefixInput.reset();
				requestShowPrefixInput();
			}
		}

		var im;
		if (isBound(im = inputMode)
		|| requestedState.inputMode && isBound(im = requestedState.inputMode.mode)) {
			var p = buffer.selectionStart;
			extendBound(p, im);
			marks.setPrivate('>', p);
		}

		if (requestedState.inputMode) {
			cursor.ensureVisible(false);
		}
		else {
			cursor.ensureVisible(isSmoothScrollRequested);
		}
		if (!keyManager.isLocked) {
			requestedState.updateCursor = true;
		}

		r.isCompleted = !!isCompleted;
		return r;
	}));
}
function execEditMap (r, key, subkey, code) {
	var result;

	if (editMap[key]) {
		var ss = buffer.selectionStart;
		var se = buffer.selectionEnd;
		cursor.windup();
		result = execMap(buffer, r.e, editMap, key, subkey, code).then(() => {
			completeSelectionRange(ss, se);
			r.isCompleted = true;
			return r;
		});
	}
	else {
		result = Promise.resolve(r);
	}

	return result;
}
function execLineInputEditMap (r, key, subkey, code) {
	var result;

	if (lineInputEditMap[key]) {
		result = execMap($('wasavi_footer_input'), r.e, lineInputEditMap, key, subkey, code)
		.then(() => {
			if (r.isCompleted) {
				r.needEmitEvent = true;
			}
			r.isCompleted = true;
			return r;
		});
	}
	else {
		result = Promise.resolve(r);
	}

	return result;
}
function processInput (e, ignoreAbbrev, returnImmdeate) {
	var payload = {
		e: e,
		needEmitEvent: false,
		ignoreAbbrev: ignoreAbbrev,
		code: e.code,
		letter: e.char,
		mapkey: e.key,
		subkey: inputMode
	};

	// override the code with 32 if key was <S-space>
	if (payload.code == -32800) {
		payload.code = e.code = 32;
	}

	var result;
	var handler = modeHandlers[modeTable[inputMode].handlerName];

	if (handler) {
		if (isGenerator(handler)) {
			result = execGenerator(handler, modeHandlers, payload);
		}
		else {
			result = handler.call(modeHandlers, payload);
		}
	}

	if (returnImmdeate) {
		return result;
	}

	if (!(result instanceof Promise)) {
		result = Promise.resolve(result);
	}

	return result.then(processInputCompletion);
}
function processInputCompletion (result) {
	if (terminated) {
		uninstall();
		return result;
	}

	var messageUpdated = false;
	if (requestedState.inputMode) {
		var im = requestedState.inputMode;
		var context = {};
		['code', 'letter', 'mapkey', 'subkey'].forEach(function (a) {
			context[a] = a in im.overrides ? im.overrides[a] : result[a];
		});
		pushInputMode(context, im.mode, im.modeOpts);
		requestShowPrefixInput(getDefaultPrefixInputString());
		im.callback && im.callback();
		requestedState.updateCursor = true;
		requestedState.inputMode = null;
	}

	if (requestedState.showInput) {
		showPrefixInput(requestedState.showInput.message);
		requestedState.showInput = null;
		config.vars.errorbells && requestNotice();
	}

	if (requestedState.notice) {
		var line = requestedState.notice;
		if (line.bell) {
			bell.play();
		}
		if (line.message) {
			showMessageCore(line.message, line.emphasis, false, true);
		}
		else if (line.silent) {
			lastMessage = toNativeControl(line.silent);
		}
		requestedState.notice = null;
	}

	if (requestedState.console) {
		if (requestedState.console.open) {
			if (backlog.buffer.length > 1 || backlog.visible) {
				backlog.open();
				pushInputMode(result, 'backlog_prompt');
			}
			else {
				if (backlog.buffer.length == 1) {
					var line = backlog.buffer[0];
					showMessageCore(
						line.text, line.emphasis,
						line.pseudoCursor, line.preserveLastMessage);
					if (line.emphasis) {
						bell.play();
					}
				}
				backlog.hide();
				backlog.clear();
			}
		}
		else {
			backlog.hide();
			backlog.clear();
		}
		requestedState.console = requestedState.message = null;
	}

	if (!keyManager.isLocked && (result.needEmitEvent !== false || prefixInput == '')) {
		requestedState.updateCursor = true;
		notifyCommandComplete(
			isString(result.needEmitEvent) ? result.needEmitEvent : null);
	}

	if (requestedState.updateCursor) {
		cursor.update({focused:true, visible:true});
		requestedState.updateCursor = null;
	}

	return result;
}
function processInputSupplement (e) {
	if (inputMode != 'line_input') return;

	const input = $('wasavi_footer_input');
	const last = inputModeStack.lastItem;
	const map = modeTable[last.inputMode].map;
	const line = toNativeControl(input.value);

	return Promise.all([
		execMap(input, e, map, last.mapkey, '$' + inputMode + '_reset', line),
		execMap(input, e, map, last.mapkey, '$' + inputMode + '_notify', line)
	]);
}

// for editing
function executeViCommand (arg) {
	var seq = keyManager.createSequences(arg);
	var terminator = keyManager.nopObject.clone();
	terminator.char = terminator.key = '*macro-end*';
	seq.push(terminator);

	keyManager.setDequeue('unshift', seq, mapManager.markExpandedNoremap);
	keyManager.sweep();
}
function extendRightIfInclusiveMotion () {
	if (prefixInput.motion == ';' && lastHorzFindCommand.direction == 1
	||  prefixInput.motion == ',' && lastHorzFindCommand.direction == -1
	||  'eEft%'.indexOf(prefixInput.motion) >= 0) {
		if (!buffer.isNewline(buffer.selectionEnd)) {
			buffer.selectionEnd = buffer.rightClusterPos(buffer.selectionEnd);
		}
	}
}
function clipOverrun () {
	if (inputMode != 'overwrite') {
		return false;
	}
	var p = inputHandler.getStartPosition();
	var n = buffer.selectionStart;
	if (n.lt(p)) {
		buffer.setSelectionRange(p);
		requestShowMessage(_('You are in the restricted region.'), true);
		return true;
	}
	return false;
}
function adjustDeleteOperationPos (isLineOrient, actualCount) {
	// special delete behavior followed vim.
	if (!isLineOrient && buffer.selectionEndCol == 0 && actualCount > 1) {
		var leading = buffer.rows(buffer.selectionStartRow)
			.substring(0, buffer.selectionStartCol);
		if (!/\S/.test(leading)) {
			isLineOrient = true;
		}

		actualCount--;
		buffer.selectionEnd = buffer.leftClusterPos(buffer.selectionEnd);
	}
	return {
		isLineOrient:isLineOrient,
		actualCount:actualCount
	};
}
function isDenotativeState () {
	var isAlterMotion = prefixInput.motion.charAt(0) == 'g';
	return isAlterMotion  && !config.vars.jkdenotative
		|| !isAlterMotion &&  config.vars.jkdenotative;
}
function callDenotativeFunction () {
	return (isDenotativeState() ? motionUpDownDenotative : motionUpDown).apply(null, arguments);
}
function inputEscape () {
	if (arguments.length) {
		requestNotice({
			silent:_('{0} canceled.', prefixInput.operation || arguments[0])
		});
	}
	else {
		if (inputMode == 'command') {
			if (config.vars.esctoblur) {
				notifyToParent('request-blur');
			}
			else {
				requestNotice({silent:_('In command mode.')});
			}
		}
	}

	prefixInput.reset();
	requestShowPrefixInput();
	return false;
}
function inputDigit (c) {
	prefixInput.appendCount(c);
	requestShowPrefixInput();
	return false;
}
function operationDefault (c, o) {
	if (prefixInput.isEmptyOperation) {
		prefixInput.operation = c;
		requestShowPrefixInput();
	}
	else if (prefixInput.operation == c) {
		return true;
	}
	else {
		return inputEscape(o.e.key);
	}
}
function isEditing (mode) {
	function o (mode) {
		return mode == 'edit' || mode == 'overwrite';
	}
	if (mode) return o(mode);
	if (o(inputMode)) return true;
	for (var i = inputModeStack.length - 1; i >= 0; i--) {
		if (o(inputModeStack[i].inputMode)) return true;
	}
	return false;
}
function isBound (mode) {
	var result;

	function o (mode) {
		return mode == 'bound' || mode == 'bound_line' ? mode : false;
	}

	if (mode) return o(mode);

	result = o(inputMode);
	if (result) return result;

	for (var i = inputModeStack.length - 1; i >= 0; i--) {
		result = o(inputModeStack[i].inputMode);
		if (result) return result;
	}

	return false;
}
function isAlias (c, op) {
	return prefixInput.motion == '' && c == (op || prefixInput.operation);
}
function isMotionErrored () {
	return requestedState.message
		|| requestedState.notice && requestedState.notice.bell;
}
function insertToLineInput (info, s) {
	var t = info.input;
	var ss = t.selectionStart;
	var se = t.selectionEnd;
	s = toVisibleControl(s);
	t.value = t.value.substring(0, ss) + s + t.value.substring(se);
	t.selectionStart = ss + s.length;
	t.selectionEnd = t.selectionStart;
	info.invalidate();
}

// for file system
function extractDriveName (path, callback) {
	return path.replace(/^([^\/:]+):/, function ($0, $1) {
		callback($0, $1);
		return '';
	});
}
function splitPath (path, escapeChar) {
	escapeChar || (escapeChar = '\u2416');
	var componentRegex = new RegExp('(?:\\' + escapeChar + '.|[^\\/])*(?:\\/|$)', 'g');
	var replaceRegex = new RegExp('\\' + escapeChar + '(.)', 'g');
	var re, result = [], foundLast = false;
	while (!foundLast && (re = componentRegex.exec(path))) {
		foundLast = re[0].substr(-1) != '/';
		var tmp = foundLast ? re[0] : re[0].substr(0, re[0].length - 1);
		tmp = tmp.replace(replaceRegex, '$1');
		//tmp != '' && result.push(tmp);
		result.push(tmp);
	}
	return result;
}
function regalizeFilePath (path, completeDriveName) {
	path || (path = '');
	if (path == '') {
		return path;
	}

	// strip drive name
	var drive = '';
	path = extractDriveName(path, function (d) {drive = d});
	if (drive == '' && completeDriveName) {
		drive = fstab[fileSystemIndex].name + ':';
	}

	// resolve relative path
	if (!/^\//.test(path)) {
		path = fstab[fileSystemIndex].cwd + '/' + path;
	}

	// resolve special directories (".", "..")
	var fragmentsSrc = splitPath(path);
	var fragmentsDst = [];
	fragmentsSrc.forEach(function (f, i) {
		switch (f) {
		case '.':
			break;
		case '..':
			fragmentsDst.pop();
			break;
		case '':
			if (i > 0 && i < fragmentsSrc.length - 1) {
				break;
			}
			/* FALLTHRU */
		default:
			fragmentsDst.push(f);
			break;
		}
	});
	path = fragmentsDst.join('/');

	// restore drive name
	path = drive + path;

	return path;
}

// for bound mode
function ensureBoundPosition (p1, p2, mode) {
	if (p1.gt(p2)) {
		var t = p1; p1 = p2; p2 = t;
	}
	switch (mode || inputMode) {
	case 'bound':
		p2 = buffer.rightClusterPos(p2.clone());
		break;
	case 'bound_line':
		p1 = p1.clone();
		p2 = p2.clone();
		p1.col = 0;
		p2.col = buffer.rows(p2).length;
		break;
	}
	return [p1, p2];
}
function operateToBound (c, o, updateSimpleCommand, callback1, callback2) {
	var p = ensureBoundPosition(marks.getPrivate('<'), marks.getPrivate('>'));
	var act = p[1].row - p[0].row + 1;
	buffer.unEmphasisBound();

	if (callback1) {
		buffer.setSelectionRange(p[0], p[1]);
		buffer.isLineOrientSelection = inputMode == 'bound_line';
		callback1(p[0], p[1], act);
		buffer.isLineOrientSelection = false;
	}

	if (updateSimpleCommand && !o.e.mapExpanded) {
		let command;
		let boundStroke = recordedStrokes.items('bound');

		if (boundStroke) {
			setLastSimpleCommand(boundStroke.strokes);
		}
	}

	// call processInput synchronously
	var isEditCompletedSaved = isEditCompleted;
	processInput(keyManager.objectFromCode(27), false, true);
	isEditCompleted = isEditCompletedSaved;

	return callback2 ? callback2(marks.getPrivate('<'), marks.getPrivate('>'), act) : true;
}
function extendBound (p, mode) {
	mode || (mode = inputMode);
	var anchor = marks.getPrivate('<');
	var focus = marks.getPrivate('>');
	if (!anchor || !focus) {
		return setBound(buffer.selectionStart, p, mode, true);
	}
	if (!buffer.elm.querySelector('.' + Wasavi.BOUND_CLASS)) {
		return setBound(anchor, p, mode);
	}
	if (anchor.row == focus.row || anchor.row == p.row) {
		return setBound(anchor, p, mode, true);
	}
	if (focus.gt(anchor)) {
		if (p.lt(anchor)) { // full refresh
			setBound(p, anchor, mode, true);
		}
		else if (p.lt(focus)) { // shrink
			buffer.unEmphasisBound(p.row, focus.row);
			setBound(new Wasavi.Position(p.row, 0), p, mode);
		}
		else if (p.gt(focus)) { // enlarge
			buffer.unEmphasisBound(focus.row, focus.row);
			setBound(new Wasavi.Position(focus.row, 0), p, mode);
		}
	}
	else {
		if (p.gt(anchor)) { // full refresh
			setBound(p, anchor, mode, true);
		}
		else if (p.gt(focus)) { // shrink
			buffer.unEmphasisBound(focus.row, p.row);
			setBound(p, new Wasavi.Position(p.row, buffer.rows(p).length - 1), mode);
		}
		else if (p.lt(focus)) { // enlarge
			buffer.unEmphasisBound(focus.row, focus.row);
			setBound(p, new Wasavi.Position(focus.row, buffer.rows(focus).length - 1), mode);
		}
	}
}

// for surrounding
function startSurrounding (c, o) {
	var result;
	switch (prefixInput.operation) {
	case 'd': // operation surrounding-prefix surrunding-symbol
	case 'c':
		prefixInput.motion = c;
		requestInputMode('wait_a_letter');
		requestShowPrefixInput(
			_('{0}: surrounding symbol', prefixInput.operation + o.e.key));
		break;
	case 'y': // operation surrounding-prefix (motion | range symbol) surrunding-string
		prefixInput.appendOperation(c);
		requestShowPrefixInput();
		break;
	case 'ys':
		result = commandMap._(c);
		isVerticalMotion = false;
		buffer.setSelectionRange(
			buffer.getLineTopOffset2(buffer.selectionStart),
			buffer.getLineTailOffset(buffer.selectionEnd));
		break;
	case 'yS':
		result = commandMap._(c);
		break;
	default:
		result = inputEscape(o.e.key);
		break;
	}
	return result;
}
function adjustSurroundingInputForNotify (original) {
	var indicator = $('wasavi_footer_input_indicator');
	var adjusted = original;

	if (surrounding.isTagPrefix(original)) {
		prefixInput.appendMotion(
			(/^<.+>$/.test(original) ? '\ue000' : '') + original);
		showLineInput(indicator.textContent + '<', '', 0);
		$('wasavi_footer_input').dataset.internalPrefix = original;
		original = '';
	}

	if (surrounding.isTagPrefix(indicator.textContent.substr(-1))) {
		adjusted = '<' + original;
	}

	return adjusted;
}
function adjustSurroundingInput (original) {
	var prefix = $('wasavi_footer_input').dataset.internalPrefix;
	original = original.replace(/\n$/, '');
	var adjusted = original;

	if (surrounding.isTagPrefix(prefix)) {
		adjusted = '<' + original.substring(prefix.length);
	}

	return adjusted;
}

// getters
function getLocalStorage (keyName, callback) {
	extensionChannel.postMessage(
		{type:'get-storage', key:keyName},
		function (res) {
			callback && callback(res.value);
		}
	);
}
function getPrimaryMode () {
	if (inputMode in modeTable && 'state' in modeTable[inputMode]) {
		return inputMode;
	}

	for (var i = inputModeStack.length - 1; i >= 0; i--) {
		if (inputModeStack[i].inputMode in modeTable
		&&  'state' in modeTable[inputModeStack[i].inputMode]) {
			return inputModeStack[i].inputMode;
		}
	}
}
function getCursorPositionString () {
	if (buffer.elm.scrollHeight <= buffer.elm.clientHeight) {
		return _('All');
	}
	if (buffer.elm.scrollTop == 0) {
		return _('Top');
	}
	var viewHeight = buffer.elm.scrollHeight - buffer.elm.clientHeight;
	if (buffer.elm.scrollTop + buffer.elm.clientHeight >= buffer.elm.scrollHeight) {
		return _('Bot');
	}
	return ('  ' + Math.floor(buffer.elm.scrollTop / viewHeight * 100.)).substr(-3) + '%';
}
function getDefaultPrefixInputString () {
	// 000000,0000xxx000%
	return (recordedStrokes.items('q') ? _('[RECORDING]') + ' ' : '') +
		 ('     ' + (buffer.selectionStartRow + 1)).substr(-6) +
		 ',' + ((getLogicalColumn() + 1) + '   ').substr(0, 4) +
		 '   ' + getCursorPositionString();
}
function getFindRegex (src) {
	var result;
	var pattern = '';
	var caseSensibility = false;
	var global = 'g';
	var multiline = 'm';

	if (src instanceof RegExp) {
		return src;
	}

	if (typeof src == 'string') {
		pattern = src;
	}
	else if (typeof src == 'object') {
		if ('csOverride' in src) {
			caseSensibility = src.csOverride;
		}
		if ('globalOverride' in src) {
			global = src.globalOverride;
		}
		if ('multilineOverride' in src) {
			multiline = src.multilineOverride;
		}
		if ('pattern' in src) {
			pattern = src.pattern;
		}
	}

	if (caseSensibility === false) {
		caseSensibility =
			config.vars.smartcase && !/[A-Z]/.test(pattern) || config.vars.ignorecase ? 'i' : '';
	}

	try {
		result = new RegExp(
			regexConverter.toJsRegexString(pattern),
			caseSensibility + global + multiline);
	}
	catch (e) {
		result = null;
	}

	return result;
}
function getFileNameString (full) {
	var result = '';
	if (extensionChannel.isTopFrame()) {
		if (fileName == '') {
			result = _('*Untitled*');
		}
		else {
			result = fileName;
			if (!full) {
				var drive = fstab[fileSystemIndex].name + ':';

				if (result.indexOf(drive) == 0) {
					result = result.substring(drive.length);

					var cwd = fstab[fileSystemIndex].cwd;
					if (cwd != '/') {
						cwd += '/';
					}
					if (result.indexOf(cwd) == 0) {
						result = result.substring(cwd.length);
					}
				}
			}
		}
	}
	else if (targetElement) {
		if (targetElement.nodeName == 'BODY') {
			result = '*Memorandum*';
		}
		else {
			if (targetElement.id != '') {
				result = targetElement.nodeName + '#' + targetElement.id;
			}
			else {
				result = targetElement.nodeName;
			}
		}
	}
	return result;
}
function getCaretPositionString () {
	if (buffer.rowLength == 1 && buffer.rows(0) == '') {
		return _('--No lines in buffer--');
	}
	else {
		return _('line {0} of {1} ({2}%)',
			buffer.selectionStartRow + 1,
			buffer.rowLength,
			parseInt(buffer.selectionStartRow / buffer.rowLength * 100.0));
	}
}
function getNewlineType (newline) {
	return {'\r\n':'dos', '\r':'mac', '\n':'unix'}[newline] || '?';
}
function getFileIoResultInfo (aFileName, charLength, isNew) {
	var result = [];
	var attribs = [];

	// file name
	result.push(aFileName || getFileNameString());

	// partial attributes
	attribs.push(getNewlineType(preferredNewline)); // newline type
	config.vars.readonly && attribs.push(_('RO')); // read only
	result.push('[' + attribs.join(', ') + ']');

	// current line number
	var rowLength = buffer.rowLength;
	if (buffer.rowLength == 1 && buffer.rows(0) == '') {
		rowLength = 0;
	}

	if (isNew) {
		result.push(_('New file'));
	}
	else {
		result.push(_('{0} {line:0}, {1} {character:1}.', rowLength, charLength));
	}

	return result.join(' ');
}
function getFileInfo (fullPath) {
	var result = [];
	var attribs = [];

	// file name
	result.push(getFileNameString(fullPath));

	// attributes
	attribs.push(getNewlineType(preferredNewline)); // newline type
	config.vars.modified && attribs.push(_('modified')); // modified
	config.vars.readonly && attribs.push(_('readonly')); // read only
	result.push('[' + attribs.join(', ') + ']');

	// current line number
	result.push(getCaretPositionString());

	return result.join(' ');
}
function getPixelWidth (line) {
	var textspan = $('wasavi_singleline_scaler');
	if (textspan.textContent != line) {
		textspan.textContent = line;
	}
	return textspan.offsetWidth;
}
function getLogicalColumn () {
	var line = buffer
		.rows(buffer.selectionStartRow)
		.substr(0, buffer.selectionStartCol);
	var pixelWidth = getPixelWidth(line);
	return Math.floor(pixelWidth / charWidth + 0.5);
}
function getFileSystemIndex (name) {
	var result = -1;
	name = name.replace(/:$/, '');
	fstab.forEach(function (fs, i) {
		if (fs.name == name) {
			result = i;
		}
	});
	return result;
}
function getContainerRect () {
	if (!containerRect) {
		containerRect = $('wasavi_container').getBoundingClientRect();
	}
	return containerRect;
}
function getCurrentViewPositionIndices () {
	function findTopLineIndex (line) {
		var low = 0;
		var high = buffer.rowLength - 1;
		var result = -1;
		while (low <= high) {
			var middle = parseInt((low + high) / 2);
			var node = buffer.rowNodes(middle);
			var top = node.offsetTop;
			var bottom = node.offsetTop + node.offsetHeight
			if (top == line && line < bottom) {
				result = middle;
				break;
			}
			else if (top < line && line < bottom) {
				result = middle + 1;
				break;
			}
			else if (bottom <= line) {
				low = middle + 1;
			}
			else {
				high = middle - 1;
			}
		}
		return result;
	}
	function findBottomLineIndex (line) {
		var low = 0;
		var high = buffer.rowLength - 1;
		var result = -1;
		while (low <= high) {
			var middle = parseInt((low + high) / 2);
			var node = buffer.rowNodes(middle);
			var top = node.offsetTop;
			var bottom = node.offsetTop + node.offsetHeight
			if (top < line && line == bottom) {
				result = middle;
				break;
			}
			else if (top < line && line < bottom) {
				result = middle - 1;
				break;
			}
			else if (bottom <= line) {
				low = middle + 1;
			}
			else {
				high = middle - 1;
			}
		}
		return result;
	}

	var result = {};

	var top = findTopLineIndex(buffer.elm.scrollTop);
	if (top >= 0) {
		result.top = top;
	}
	else {
		result.top = 0;
	}

	var bottom = findBottomLineIndex(buffer.elm.scrollTop + buffer.elm.clientHeight - 1);
	if (bottom >= 0) {
		result.bottom = bottom;
	}
	else {
		result.bottom = buffer.rowLength - 1;
	}

	result.lines = parseInt(buffer.elm.clientHeight / lineHeight);

	return result;
}
function getNativeCursorPosition (selection, rowNode) {
	let r1 = selection.getRangeAt(0);
	let r2 = document.createRange();

	if (!rowNode) {
		for (let p = r1.startContainer; p; p = p.parentNode) {
			if (p.nodeName == 'DIV') {
				rowNode = p;
				break;
			}
		}
	}

	if (!rowNode) {
		return undefined;
	}

	let row = buffer.indexOf(rowNode);
	let col = 0;

	if (rowNode.firstChild) {
		r2.setStartBefore(rowNode.firstChild);
		r2.setEnd(r1.startContainer, r1.startOffset);
		col = r2.toString().length;
	}

	return new Position(row, col);
}
function getClipboard () {
	keyManager.lock();
	if (Wasavi.IS_GECKO) {
		document.removeEventListener('paste', handlePaste, false);
		return new Promise(resolve => {
			let s = '';

			function handlePasteTemp (e) {
				s = e.clipboardData.getData('text/plain').replace(/\r\n/g, '\n');
			}

			let buffer = $('wasavi_fx_clip');
			buffer.value = '';
			buffer.focus();
			document.addEventListener('paste', handlePasteTemp, false);
			document.execCommand('paste');
			document.removeEventListener('paste', handlePasteTemp, false);
			document.addEventListener('paste', handlePaste, false);
			registers.get('*').set(s);
			keyManager.unlock();
			resolve();
		});
	}
	else {
		return new Promise(resolve => {
			extensionChannel.getClipboard(text => {
				registers.get('*').set(text);
				keyManager.unlock();
				resolve();
			});
		});
	}
}

// setters
function setLocalStorage (keyName, value) {
	extensionChannel.postMessage({
		type:'set-storage',
		key:keyName,
		value:value
	});
}
function setGeometory (target) {
	if (target == undefined) {
		target = targetElement;
	}
	if (!target) {
		return;
	}

	var container = $('wasavi_container');
	var editor = $('wasavi_editor');
	var footer = $('wasavi_footer');
	var conCon = $('wasavi_console_container');
	var con = $('wasavi_console');
	var fNotifier = $('wasavi_footer_notifier');
	var curLine = $('wasavi_cursor_line');
	var curCol = $('wasavi_cursor_column');

	if (!container || !editor || !footer || !conCon || !con
	||  !fNotifier || !curLine || !curCol) {
		throw new TypeError(
			'setGeometory: invalid element: ' +
			[
				container, editor, footer, conCon, con, fNotifier,
				curLine, curCol
			].join(', ')
		);
	}

	editor.style.bottom = statusLineHeight + 'px';
	conCon.style.bottom = (statusLineHeight + 8) + 'px';
	fNotifier.style.bottom = (statusLineHeight + 8) + 'px';
	curLine.style.right = (editor.offsetWidth - editor.clientWidth) + 'px';
	curCol.style.bottom = statusLineHeight + 'px';

	config.setData('lines', parseInt(editor.clientHeight / lineHeight), true);
	config.setData('columns', parseInt(editor.clientWidth / charWidth), true);
}
function setInputMode (newInputMode, opts) {
	var newState = modeTable[newInputMode].state || state;
	opts || (opts = {});

	inputMode = newInputMode;
	cursor.update({type:newInputMode, visible:false});
	if (newState != state) {
		state = newState;
	}

	switch (inputMode) {
	case 'line_input':
		lineInputHistories.defaultName = opts.historyName || ':';
		showLineInput.apply(null, ['prefix', 'value', 'curpos'].map(function (a) {
			return a in opts ? opts[a] : undefined;
		}));
		break;
	}

	isEditCompleted = isSmoothScrollRequested = false;
}
function setBound (p1, p2, mode, fullRefresh) {
	var p = ensureBoundPosition(p1, p2, mode);
	fullRefresh && buffer.unEmphasisBound();
	buffer.emphasisBound(p[0], p[1]);
}
function setTabStop (ts) {
	var editor = $('wasavi_editor');
	if (!editor) return;

	ts || (ts = 8);
	var editorStyle = document.defaultView.getComputedStyle(editor, '');
	['OTabSize', 'MozTabSize', 'WebkitTabSize', 'MsTabSize', 'tabSize'].some(function (pn) {
		if (!(pn in editorStyle)) return false;
		editor.style[pn] = ts;
		['wasavi_singleline_scaler'].forEach(function (en) {
			en = $(en);
			if (en) en.style[pn] = ts;
		});
		return true;
	});
}
function setList (state) {
	var editor = $('wasavi_editor');
	if (!editor) return;

	if (state) {
		editor.classList.add('list');
	}
	else {
		editor.classList.remove('list');
	}
}
function setLastSimpleCommand () {
	let command = toArray(arguments).join('');

	// strip last newline if new surrounding or surrounding change command
	if (/[yc][sS].+(?:[!#$%&*+\\\-.:;=?@^_|~"'`abBr\[\]{}()]|[\u0014,<Tt].+>)\n$/.test(command)
	||  /[sS](?:[!#$%&*+\\\-.:;=?@^_|~"'`abBr\[\]{}()]|[\u0014,<Tt].+>)\n$/.test(command)) {
		command = command.substring(0, command.length - 1);
	}

	lastSimpleCommand = command;
}

/*
 * low-level functions for cursor motion <<<1
 * ----------------
 */

function motionLeft (c, count) {
	count || (count = 1);
	var n = buffer.selectionStart;
	var clusters = buffer.getGraphemeClusters(n);
	var clusterIndex = clusters.getClusterIndexFromUTF16Index(n.col);
	if (c != '' && clusterIndex <= 0) {
		requestNotice({silent:_('Top of line.')});
	}
	if (clusters.length) {
		n.col = clusters.rawIndexAt(Math.max(
			clusterIndex - count, 0));
	}
	buffer.selectionStart = n;
	prefixInput.motion = c;
	invalidateIdealWidthPixels();
	return true;
}
function motionRight (c, count) {
	count || (count = 1);
	var n = buffer.selectionEnd;
	var clusters = buffer.getGraphemeClusters(n);
	var clusterIndex = clusters.getClusterIndexFromUTF16Index(n.col);
	if (c != '' && clusterIndex >= clusters.length - (isEditing() ? 0 : 1)) {
		requestNotice({silent:_('Tail of line.')});
	}
	if (clusters.length) {
		n.col = clusters.rawIndexAt(Math.min(
			clusterIndex + count, clusters.length));
	}
	buffer.selectionEnd = n;
	prefixInput.motion = c;
	invalidateIdealWidthPixels();
	return true;
}
function motionLineStart (c, realTop) {
	buffer.selectionStart = realTop ?
		buffer.getLineTopOffset(buffer.selectionStart) :
		buffer.getLineTopOffset2(buffer.selectionStart);
	prefixInput.motion = c;
	invalidateIdealWidthPixels();
	return true;
}
function motionLineEnd (c) {
	buffer.selectionEnd = buffer.getLineTailOffset(buffer.selectionEnd);
	prefixInput.motion = c;
	invalidateIdealWidthPixels();
	return true;
}
function motionLineStartDenotative (c, realTop) {
	let docSelection = document.getSelection();
	let n = buffer.selectionStart;
	let initialIndex = n.col;

	if (!buffer.isNewline(n)) {
		buffer.elm.contentEditable = true;
		try {
			docSelection.removeAllRanges();
			docSelection.addRange(buffer.getSelectionRange(n, n));
			docSelection.modify('move', 'left', 'lineboundary');
			n = getNativeCursorPosition(docSelection);
		}
		finally {
			buffer.elm.contentEditable = false;
		}

		if (!realTop) {
			while (n.col < initialIndex && spc('S').test(buffer.charAt(n))) {
				n.col++;
			}
		}
	}

	buffer.selectionStart = n;
	prefixInput.motion = c;
	invalidateIdealWidthPixels();
	return true;
}
function motionLineEndDenotative (c) {
	let docSelection = document.getSelection();
	let n = buffer.selectionEnd;

	if (!buffer.isNewline(n)) {
		buffer.elm.contentEditable = true;
		try {
			docSelection.removeAllRanges();
			docSelection.addRange(buffer.getSelectionRange(n, n));
			docSelection.modify('move', 'right', 'lineboundary');
			docSelection.modify('move', 'left', 'character');
			n = getNativeCursorPosition(docSelection);
		}
		finally {
			buffer.elm.contentEditable = false;
		}
	}

	buffer.selectionEnd = n;
	prefixInput.motion = c;
	invalidateIdealWidthPixels();
	return true;
}
const motionNextWord = (function () {
	function doBigWord (n, count) {
		var words = buffer.getWords(n);
		var wordIndex = words.wordIndexOf(n.col);
		for (var i = 0; i < count; i++) {
			while (!buffer.isEndOfText(n)) {
				if (wordIndex >= words.length || buffer.isNewline(n)) {
					if (!prefixInput.isEmptyOperation && i + 1 == count) {
						n = buffer.getLineTailOffset(n);
						break;
					}
					n = buffer.rightPos(buffer.getLineTailOffset(n));
					if (buffer.isEndOfText(n)) {
						break;
					}
					n.col = -1;
					words = buffer.getWords(n);
					wordIndex = 0;
					continue;
				}

				if (words[wordIndex].type == Unistring.WBP.Space) {
					var clusters = buffer.getGraphemeClusters(n);
					var lastIndex = clusters.getClusterIndexFromUTF16Index(
						words[wordIndex].index + words[wordIndex].length);
					var newcol = clusters.rawIndexAt(Math.max(0, lastIndex));

					if (newcol > n.col) {
						n.col = newcol;
						break;
					}
				}
				else if (wordIndex == 0 && words[wordIndex].type != Unistring.WBP.Space) {
					var clusters = buffer.getGraphemeClusters(n);
					var lastIndex = clusters.getClusterIndexFromUTF16Index(
						words[wordIndex].index);
					var newcol = clusters.rawIndexAt(Math.max(0, lastIndex));

					if (newcol > n.col) {
						n.col = newcol;
						break;
					}
				}

				wordIndex++;
			}
		}
		return n;
	}

	function doWord (n, count) {
		var words = buffer.getWords(n);
		var wordIndex = words.wordIndexOf(n.col);
		for (var i = 0; i < count; i++) {
			while (!buffer.isEndOfText(n)) {
				if (wordIndex >= words.length || buffer.isNewline(n)) {
					if (!prefixInput.isEmptyOperation && i + 1 == count) {
						n = buffer.getLineTailOffset(n);
						break;
					}
					n = buffer.rightPos(buffer.getLineTailOffset(n));
					if (buffer.isEndOfText(n)) {
						break;
					}
					n.col = -1;
					words = buffer.getWords(n);
					wordIndex = 0;
					continue;
				}

				if (words[wordIndex].type == Unistring.WBP.Space) {
					wordIndex++;
					continue;
				}

				var clusters = buffer.getGraphemeClusters(n);
				var lastIndex = clusters.getClusterIndexFromUTF16Index(
					words[wordIndex].index);
				var newcol = clusters.rawIndexAt(Math.max(0, lastIndex));

				if (newcol > n.col) {
					n.col = newcol;
					break;
				}

				wordIndex++;
			}
		}
		return n;
	}

	function doBigWordEnd (n, count) {
		var words = buffer.getWords(n);
		var wordIndex = words.wordIndexOf(n.col);
		for (var i = 0; i < count; i++) {
			while (!buffer.isEndOfText(n)) {
				if (wordIndex >= words.length || buffer.isNewline(n)) {
					n = buffer.rightPos(buffer.getLineTailOffset(n));
					if (buffer.isEndOfText(n)) {
						break;
					}
					n.col = 0;
					words = buffer.getWords(n);
					wordIndex = 0;
					continue;
				}

				if (wordIndex > 0 && words[wordIndex].type == Unistring.WBP.Space) {
					var clusters = buffer.getGraphemeClusters(n);
					var lastIndex = clusters.getClusterIndexFromUTF16Index(
						words[wordIndex].index) - 1;
					var newcol = clusters.rawIndexAt(Math.max(0, lastIndex));

					if (newcol > n.col) {
						n.col = newcol;
						break;
					}
				}
				else if (wordIndex == words.length - 1 && words[wordIndex].type != Unistring.WBP.Space) {
					var clusters = buffer.getGraphemeClusters(n);
					var lastIndex = clusters.getClusterIndexFromUTF16Index(
						words[wordIndex].index + words[wordIndex].length) - 1;
					var newcol = clusters.rawIndexAt(Math.max(0, lastIndex));

					if (newcol > n.col) {
						n.col = newcol;
						break;
					}
				}

				wordIndex++;
			}
		}
		return n;
	}

	function doWordEnd (n, count) {
		var words = buffer.getWords(n);
		var wordIndex = words.wordIndexOf(n.col);
		for (var i = 0; i < count; i++) {
			while (!buffer.isEndOfText(n)) {
				if (wordIndex >= words.length || buffer.isNewline(n)) {
					n = buffer.rightPos(buffer.getLineTailOffset(n));
					if (buffer.isEndOfText(n)) {
						break;
					}
					n.col = 0;
					words = buffer.getWords(n);
					wordIndex = 0;
					continue;
				}

				if (words[wordIndex].type == Unistring.WBP.Space) {
					wordIndex++;
					continue;
				}

				var clusters = buffer.getGraphemeClusters(n);
				var lastIndex = clusters.getClusterIndexFromUTF16Index(
					words[wordIndex].index +
					words[wordIndex].length) - 1;
				var newcol = clusters.rawIndexAt(Math.max(0, lastIndex));

				if (newcol > n.col) {
					n.col = newcol;
					break;
				}

				wordIndex++;
			}
		}
		return n;
	}

	return function motionNextWord (c, count, bigWord, wordEnd) {
		var n = buffer.selectionEnd;
		count || (count = 1);
		if (n.col >= buffer.rows(n).length - 1 && n.row >= buffer.rowLength - 1) {
			requestNotice({silent:_('Tail of text.')});
		}

		if (prefixInput.isEmptyOperation || !buffer.isNewline(n)) {
			if (bigWord) {
				n = (wordEnd ? doBigWordEnd : doBigWord)(n, count);
			}
			else {
				n = (wordEnd ? doWordEnd : doWord)(n, count);
			}
		}

		buffer.selectionEnd = n;
		prefixInput.motion = c;
		invalidateIdealWidthPixels();
		return true;
	};
})();
const motionPrevWord = (function () {
	function doBigWord (n, count) {
		var words = buffer.getWords(n);
		var wordIndex = getWordIndex(words, n);
		for (var i = 0; i < count; i++) {
			while (n.row > 0 || n.col > 0) {
				if (wordIndex < 0) {
					if (n.row == 0) {
						n.col = 0;
						break;
					}
					n.row--;
					n.col = buffer.rows(n).length;
					words = buffer.getWords(n);
					wordIndex = words.length - 1;
					continue;
				}
				if (words[wordIndex].type == Unistring.WBP.Space) {
					var clusters = buffer.getGraphemeClusters(n);
					var lastIndex = clusters.getClusterIndexFromUTF16Index(
						words[wordIndex].index + words[wordIndex].length);
					var newcol = clusters.rawIndexAt(Math.max(0, lastIndex));

					if (newcol < n.col) {
						n.col = newcol;
						break;
					}
				}
				else if (wordIndex == 0 && words[wordIndex].type != Unistring.WBP.Space) {
					var clusters = buffer.getGraphemeClusters(n);
					var lastIndex = clusters.getClusterIndexFromUTF16Index(
						words[wordIndex].index);
					var newcol = clusters.rawIndexAt(Math.max(0, lastIndex));

					if (newcol < n.col) {
						n.col = newcol;
						break;
					}
				}

				wordIndex--;
			}
		}
		return n;
	}
	function doWord (n, count) {
		var words = buffer.getWords(n);
		var wordIndex = getWordIndex(words, n);
		for (var i = 0; i < count; i++) {
			while (n.row > 0 || n.col > 0) {
				if (wordIndex < 0) {
					if (n.row == 0) {
						n.col = 0;
						break;
					}
					n.row--;
					n.col = buffer.rows(n).length;
					words = buffer.getWords(n);
					wordIndex = words.length - 1;
					continue;
				}

				if (words[wordIndex].type == Unistring.WBP.Space) {
					wordIndex--;
					continue;
				}

				var clusters = buffer.getGraphemeClusters(n);
				var lastIndex = clusters.getClusterIndexFromUTF16Index(
					words[wordIndex].index);
				var newcol = clusters.rawIndexAt(Math.max(0, lastIndex));

				if (newcol < n.col) {
					n.col = newcol;
					break;
				}

				wordIndex--;
			}
		}
		return n;
	}
	function doEditingWord (n, specialStops) {
		var words = buffer.getWords(n);
		insertSpecialStops(n, words, specialStops);
		var wordIndex = getWordIndex(words, n);
		if (n.col == 0) {
			if (n.row) {
				n.row--;
				n.col = buffer.rows(n).length;
			}
		}
		else {
			var clusters = buffer.getGraphemeClusters(n);
			do {
				var type = words[wordIndex].type;
				n.col = words[wordIndex].index;
			} while (wordIndex-- > 0 && type == Unistring.WBP.Space && n.col > 0);
		}
		return n;
	}
	function getWordIndex (words, n) {
		return buffer.isNewline(n) || buffer.isEndOfText(n) ?
			words.length - 1 :
			words.wordIndexOf(n.col);
	}
	function insertSpecialStops (n, words, specialStops) {
		if (!specialStops) {
			return;
		}
		if (!(specialStops instanceof Array)) {
			specialStops = [specialStops];
		}
		specialStops.forEach(function (pos) {
			if (pos.row != n.row) return;

			var index = words.wordIndexOf(pos.col);
			if (index < 0) return;

			var a = words[index];
			if (pos.col == a.index) return;

			var alength = pos.col - a.index;
			var btext = a.text.substring(alength);

			words.splice(index + 1, 0, {
				text: btext,
				index: a.index + alength,
				length: btext.length,
				type: a.type
			});

			words[index].text = words[index].text.substring(0, alength);
			words[index].length = alength;
		});
		return words;
	}
	return function motionPrevWord (c, count, bigWord, specialStops) {
		var n = buffer.selectionStart;
		count || (count = 1);
		if (n.col <= 0 && n.row <= 0) {
			requestNotice({silent:_('Top of text.')});
		}

		if (isEditing()) {
			n = doEditingWord(n, specialStops);
		}
		else if (bigWord) {
			n = doBigWord(n, count);
		}
		else {
			n = doWord(n, count);
		}

		buffer.selectionStart = n;
		prefixInput.motion = c;
		invalidateIdealWidthPixels();
		return true;
	};
})();
const motionFindForward = (function () {
	function indexOfEx (line, target, start) {
		var index = start || 0;
		var goal = line.length;
		while (index < goal) {
			if (ffttDictionary.match(line.charAt(index), target)) {
				return index;
			}
			index++;
		}
		return -1;
	}
	return function motionFindForward (c, count, stopBefore, continuous) {
		var n = buffer.selectionEnd;
		count || (count = 1);

		var startn = n.clone();
		var found = true;
		var line = Unistring(buffer.rows(n));
		var index = line.getClusterIndexFromUTF16Index(n.col);
		for (var i = 0; i < count; i++) {
			index = indexOfEx(line, c, index + 1);
			if (index >= 0) {
				if (stopBefore
				&&  continuous
				&&  i == count - 1
				&&  startn.eq(new Position(n.row, line.rawIndexAt(index - 1)))) {
					count++;
				}
			}
			else {
				found = false;
				break;
			}
		}
		if (found) {
			n.col = line.rawIndexAt(index + (stopBefore ? -1 : 0));
			buffer.selectionEnd = n;
		}
		else {
			requestNotice({silent:_('Next search target not found.')});
		}
		lastHorzFindCommand.direction = 1;
		lastHorzFindCommand.letter = c;
		lastHorzFindCommand.stopBefore = stopBefore;
		invalidateIdealWidthPixels();
		return true;
	};
})();
const motionFindBackward = (function () {
	function lastIndexOfEx (line, target, start) {
		var index = start || 0;
		while (index >= 0) {
			if (ffttDictionary.match(line.charAt(index), target)) {
				return index;
			}
			index--;
		}
		return -1;
	}
	return function motionFindBackward (c, count, stopBefore, continuous) {
		var n = buffer.selectionStart;
		count || (count = 1);

		var startn = n.clone();
		var found = true;
		var line = Unistring(buffer.rows(n));
		var index = line.getClusterIndexFromUTF16Index(n.col);
		for (var i = 0; i < count; i++) {
			index = lastIndexOfEx(line, c, index - 1);
			if (index >= 0) {
				if (stopBefore
				&&  continuous
				&&  i == count - 1
				&&  startn.eq(new Position(n.row, line.rawIndexAt(index + 1)))) {
					count++;
				}
			}
			else {
				found = false;
				break;
			}
		}
		if (found) {
			n.col = line.rawIndexAt(index + (stopBefore ? 1 : 0));
			buffer.selectionStart = n;
		}
		else {
			requestNotice({silent:_('Previous search target not found.')});
		}
		lastHorzFindCommand.direction = -1;
		lastHorzFindCommand.letter = c;
		lastHorzFindCommand.stopBefore = stopBefore;
		invalidateIdealWidthPixels();
		return true;
	};
})();
function motionFindByRegexFacade (pattern, count, direction, verticalOffset) {
	var result;
	switch (direction) {
	case -1:
		result = motionFindByRegexBackward(pattern, count);
		break;
	case 1:
		result = motionFindByRegexForward(pattern, count);
		break;
	default:
		return false;
	}

	if (result) {
		buffer.extendSelectionTo(result.offset);

		if (verticalOffset != undefined) {
			switch (direction) {
			case -1:
				var n = buffer.selectionStart;
				n.row = minmax(0, n.row + verticalOffset, buffer.rowLength - 1);
				buffer.selectionStart = buffer.getLineTopOffset2(n);
				break;
			case 1:
				var n = buffer.selectionEnd;
				n.row = minmax(0, n.row + verticalOffset, buffer.rowLength - 1);
				buffer.selectionEnd = buffer.getLineTopOffset2(n);
				break;
			}
			isVerticalMotion = true;
		}
	}
	else {
		prefixInput.reset();
		let visiblePattern = isObject(pattern) ? pattern.pattern : pattern;
		requestShowMessage(_('Pattern not found: {0}', visiblePattern), true);
	}
	return true;
}
function motionFindByRegexForward (c, count, opts) {
	let text = lastRegexFindCommand.text;
	let n = buffer.binaryPositionToLinearPosition(buffer.selectionEnd);
	let startn = n;
	let len = 0;
	let regex = isObject(c) ? c.regex : getFindRegex(c);
	let wrapped = false;
	let re;

	opts || (opts = regexConverter.getDefaultOption());
	count || (count = 1);

	if (!isString(text)) {
		lastRegexFindCommand.text = text = buffer.value;
	}

	if (regex && regex.source.length) {
		regex.lastIndex = n + 1;
		for (let i = 0; i < count; i++) {
			let loop;
			do {
				loop = false;
				re = regex.exec(text);
				if (re) {
					let newn = regex.lastIndex - re[0].length;
					if (text.charAt(newn) == buffer.TERM_CHAR && newn - 1 == startn) {
						loop = true;
					}
					else {
						n = newn;
						len = re[0].length;
					}
				}
				else {
					if (opts.wrapscan && !wrapped) {
						wrapped = true;
						regex.lastIndex = 0;
						loop = true;
					}
					else {
						return null;
					}
				}
			} while (loop);
		}
	}

	invalidateIdealWidthPixels();
	wrapped && requestNotice(_('Search wrapped.'));

	return {offset:n, matchLength:len};
}
function motionFindByRegexBackward (c, count, opts) {
	let text = lastRegexFindCommand.text;
	let n = buffer.binaryPositionToLinearPosition(buffer.selectionStart);
	let len = 0;
	let regex = isObject(c) ? c.regex : getFindRegex(c);
	let wrapped = false;
	let startn;
	let linetop;

	opts || (opts = regexConverter.getDefaultOption());
	count || (count = 1);

	function getLineTop (n) {
		while (--n >= 0 && text.charCodeAt(n) != 0x0a) {}
		n++;
		return n;
	}
	function leftPos (n) {
		if (n <= 0) return 0;
		n--;
		if (unicodeUtils.isHighSurrogate(text.charCodeAt(n))) {n--;}
		if (text.charCodeAt(n) == 0x0a) {n--;}
		return n;
	}
	function doBackSearch () {
		var result = false;
		while (true) {
			var re;
			var foundAt = -1;
			while ((re = regex.exec(text)) && regex.lastIndex - re[0].length < n) {
				len = re[0].length;
				foundAt = regex.lastIndex - len;
				if (len == 0) {
					regex.lastIndex++;
				}
			}
			if (foundAt >= 0) {
				n = foundAt;
				result = n < startn;
				regex.lastIndex = linetop;
				break;
			}
			else {
				var tmp = getLineTop(leftPos(linetop));
				if (tmp >= linetop) {
					break;
				}
				else {
					n = linetop;
					linetop = tmp;
					regex.lastIndex = linetop;
				}
			}
		}
		return result;
	}

	if (!isString(text)) {
		lastRegexFindCommand.text = text = buffer.value;
	}

	if (regex && regex.source.length) {
		startn = n;
		linetop = getLineTop(n);
		regex.lastIndex = linetop;
		for (let i = 0; i < count; i++) {
			let loop;
			do {
				loop = false;
				if (!doBackSearch()) {
					if (opts.wrapscan && !wrapped) {
						wrapped = true;
						startn = n = text.length;
						linetop = getLineTop(n);
						regex.lastIndex = linetop;
						loop = true;
					}
					else {
						return null;
					}
				}
			} while (loop);
		}
	}

	invalidateIdealWidthPixels();
	wrapped && requestNotice(_('Search wrapped.'));

	return {offset:n, matchLength:len};
}
function motionUpDown (c, count, isDown) {
	count || (count = 1);
	computeIdealWidthPixels();

	var n;
	if (isDown) {
		n = buffer.selectionEnd;
		n.row >= buffer.rowLength - 1 && requestNotice({silent:_('Tail of text.')});
		n.row = Math.min(n.row + count, buffer.rowLength - 1);
	}
	else {
		n = buffer.selectionStart;
		n.row <= 0 && requestNotice({silent:_('Top of text.')});
		n.row = Math.max(n.row - count, 0);
	}

	n.col = 0;
	n = buffer.getClosestOffsetToPixels(n, idealWidthPixels);

	if (isDown) {
		buffer.selectionEnd = n;
	}
	else {
		buffer.selectionStart = n;
	}

	prefixInput.motion = c;
	isVerticalMotion = true;
	return true;
}
function motionUp (c, count) {
	return motionUpDown(c, count, false);
}
function motionDown (c, count) {
	return motionUpDown(c, count, true);
}
const motionUpDownDenotative = (function () {
	/*
	 * A blank line in wasavi is a div element containing empty text node.
	 *
	 * However, selection#modify() on Chrome does not place a cursor on
	 * such element.
	 *
	 * As this workaround, we make blank lines pure empty element before up/down,
	 * then restore after processing.
	 */
	function start (isDown, n, count) {
		if (window.chrome && !Wasavi.IS_GECKO) {
			(isDown ? startDown : startUp)(n, count);
		}
	}

	function done (isDown, n, count) {
		if (window.chrome && !Wasavi.IS_GECKO) {
			(isDown ? doneDown : doneUp)(n, count);
		}
	}

	function startDown (n, count) {
		let goal = Math.min(buffer.rowLength - 1, n.row + count);
		n = n.clone();
		while (++n.row <= goal) {
			if (buffer.rows(n) == '') {
				let node = buffer.rowNodes(n);
				node.removeChild(node.firstChild);
			}
		}
	}

	function doneDown (n, count) {
		let goal = Math.min(buffer.rowLength - 1, n.row + count);
		n = n.clone();
		while (++n.row <= goal) {
			let node = buffer.rowNodes(n);
			if (!node.firstChild) {
				node.appendChild(document.createTextNode(''));
			}
		}
	}

	function startUp (n, count) {
		let goal = Math.max(0, n.row - count);
		n = n.clone();
		while (--n.row >= goal) {
			if (buffer.rows(n) == '') {
				let node = buffer.rowNodes(n);
				node.removeChild(node.firstChild);
			}
		}
	}

	function doneUp (n, count) {
		let goal = Math.max(0, n.row - count);
		n = n.clone();
		while (--n.row >= goal) {
			let node = buffer.rowNodes(n);
			if (!node.firstChild) {
				node.appendChild(document.createTextNode(''));
			}
		}
	}

	return function motionUpDownDenotative (c, count, isDown) {
		count || (count = 1);
		computeIdealWidthPixels();

		let n = isDown ? buffer.selectionEnd : buffer.selectionStart;
		let orign = n.clone();
		let docSelection = document.getSelection();

		start(isDown, orign, count);
		buffer.elm.contentEditable = true;
		try {
			docSelection.removeAllRanges();
			docSelection.addRange(buffer.getSelectionRange(n, n));

			let direction = isDown ? 'forward' : 'backward';
			for (let i = 0; i < count; i++) {
				docSelection.modify('move', direction, 'line');
			}

			let newn = getNativeCursorPosition(docSelection);
			if (newn) {
				if (!buffer.isNewline(newn) && !buffer.isEndOfText(newn)) {
					// get position to top of logical line
					docSelection.modify('move', 'left', 'lineboundary');
					newn = getNativeCursorPosition(docSelection);

					// get position to bottom of logical line
					docSelection.modify('move', 'right', 'lineboundary');
					docSelection.modify('move', 'left', 'character');
					let right = getNativeCursorPosition(docSelection);

					// get the ideal cursor position
					newn = buffer.getClosestOffsetToPixels(newn, idealDenotativeWidthPixels);
					if (newn.gt(right)) {
						newn = right;
					}
				}

				n = newn;
			}
		}
		finally {
			buffer.elm.contentEditable = false;
			done(isDown, orign, count);
		}

		if (orign.eq(n)) {
			requestNotice({silent:isDown ? _('Tail of text.') : _('Top of text.')});
		}
		else {
			buffer[isDown ? 'selectionEnd' : 'selectionStart'] = n;
		}

		prefixInput.motion = c;
		isVerticalMotion = true;
		return true;
	};
})();
function scrollView (c, count) {
	let v = getCurrentViewPositionIndices();

	if (typeof count == 'function') {
		count = count(v);
	}

	prefixInput.motion = c;

	function down (count) {
		let index = Math.min(v.top + count, buffer.rowLength - 1);
		let dest = index == 0 ? 0 : buffer.rowNodes(index).offsetTop;
		return scroller.run(dest)
			.then(() => {
				let v2 = getCurrentViewPositionIndices();
				if (v2.top >= 0 && v2.top < buffer.rowLength
				&&  v2.top > buffer.selectionStartRow) {
					buffer.setSelectionRange(buffer.getLineTopOffset2(v2.top, 0));
				}
				return true;
			});
	}

	function up (count) {
		let index = Math.max(v.top - count, 0);
		let dest = index == 0 ? 0 : buffer.rowNodes(index).offsetTop;
		return scroller.run(dest)
			.then(() => {
				let v2 = getCurrentViewPositionIndices();
				if (v2.bottom >= 0 && v2.bottom < buffer.rowLength
				&&  v2.bottom < buffer.selectionStartRow) {
					buffer.setSelectionRange(buffer.getLineTopOffset2(v2.bottom, 0));
				}
				return true;
			});
	}

	if (typeof count == 'number' && !isNaN(count) && count != 0) {
		return count > 0 ? down(count) : up(-count);
	}
	else {
		return Promise.resolve(true);
	}
}

/*
 * low-level functions for text modification <<<1
 * ----------------
 */

function deleteSelection (isSubseq) {
	if (!buffer.selected && !buffer.isLineOrientSelection) return 0;
	if (buffer.isLineOrientSelection && buffer.rowLength == 1 && buffer.rows(0) == '') return 0;

	var result = 0;
	(isSubseq ? $call : editLogger.open).call(editLogger, 'deleteSelection', function () {
		marks.update(buffer.selectionStart, function (foldedMarkRegisterer) {
			result = buffer.deleteRangeEx(
				null, null, foldedMarkRegisterer,
				function (content, fragment, deleteMarksDest) {
					if (!isSubseq) {
						var isLastLine =
							buffer.selectionEndRow == buffer.rowLength - 1
							&& (buffer.selectionEndCol > 0 || buffer.isLineOrientSelection);

						editLogger.write(
							Wasavi.EditLogger.ITEM_TYPE.DELETE,
							buffer.selectionStart,
							content,
							buffer.selectionEnd,
							buffer.isLineOrientSelection,
							isLastLine,
							deleteMarksDest
						);
					}
					isEditCompleted = true;
				}
			);
		});
	});
	return result;
}
function insert (s, opts) {
	if (s == '' && !buffer.selected) return;

	opts || (opts = {});
	var keepPosition = !!opts.keepPosition;
	var isLineOrientedLast = !!opts.isLineOrientedLast;
	var isEditing_ = isEditing();

	(isEditing_ ? $call : editLogger.open).call(editLogger, 'insert', function () {
		deleteSelection();

		var startn = buffer.selectionStart;
		if (isLineOrientedLast
		&& s.length >= 2
		&& s.substr(-1) == '\n'
		&& buffer.selectionStartRow == buffer.rowLength - 1
		&& buffer.charAt(buffer.selectionStart) == '\n') {
			s = s.substr(0, s.length - 1);
		}
		var re = s.match(/\u0008|\u007f|\n|[^\u0008\u007f\n]+/g);
		if (!re) return;

		for (var i = 0; i < re.length; i++) {
			switch (re[i]) {
			case '\u0008':
				deleteCharsBackward(1, {isSubseq:true});
				break;
			case '\u007f':
				deleteCharsForward(1, {isSubseq:true});
				break;
			case '\n':
				!isEditing_ && editLogger.write(
					Wasavi.EditLogger.ITEM_TYPE.INSERT,
					buffer.selectionStart, re[i], keepPosition
				);
				marks.update(buffer.selectionStart, function () {
					isMultilineTextInput(targetElement) && buffer.divideLine();
				});
				break;
			default:
				!isEditing_ && editLogger.write(
					Wasavi.EditLogger.ITEM_TYPE.INSERT,
					buffer.selectionStart, re[i], keepPosition
				);
				marks.update(buffer.selectionStart, function () {
					buffer.setSelectionRange(buffer.insertChars(
						buffer.selectionStart, re[i]));
				});
				break;
			}
		}
		isEditCompleted = true;
		keepPosition && buffer.setSelectionRange(startn);
	});
}
function overwrite (s, opts) {
	if (s == '') return;

	opts || (opts = {});
	var keepPosition = !!opts.keepPosition;

	inputHandler.updateOverwritten();

	(isEditing() ? $call : editLogger.open).call(editLogger, 'overwrite', function () {
		deleteSelection();

		var startn = buffer.selectionStart;
		!isEditing() && editLogger.write(
			Wasavi.EditLogger.ITEM_TYPE.OVERWRITE,
			startn, s, buffer.rows(startn)
		);
		var re = s.match(/\n|[^\n]+/g);
		if (!re) return;

		for (var i = 0; i < re.length; i++) {
			switch (re[i]) {
			case '\n':
				isMultilineTextInput(targetElement) && buffer.divideLine();
				break;

			default:
				marks.update(buffer.selectionStart, function () {
					buffer.setSelectionRange(buffer.overwriteChars(buffer.selectionStart, re[i]));
				});
				break;
			}
		}
		isEditCompleted = true;
		keepPosition && buffer.setSelectionRange(startn);
	});
}
function shift (rowCount, shiftCount) {
	rowCount || (rowCount = 1);
	editLogger.open('shift', function () {
		var startn = buffer.getLineTopOffset(buffer.selectionStart);
		var editLogItem = editLogger.write(
			Wasavi.EditLogger.ITEM_TYPE.SHIFT, startn, '', rowCount, shiftCount,
			config.vars.shiftwidth, config.vars.tabstop, config.vars.expandtab
		);
		marks.update(startn, function () {
			editLogItem.indents = buffer.shift(
				startn.row, rowCount, shiftCount,
				config.vars.shiftwidth, config.vars.tabstop, config.vars.expandtab
			);
		});
		if (rowCount >= config.vars.report) {
			requestShowMessage(_('Shifted {0} {line:0}.', rowCount));
		}
	});
	isEditCompleted = true;
}
function unshift (rowCount, shiftCount) {
	rowCount || (rowCount = 1);
	editLogger.open('unshift', function () {
		var startn = buffer.getLineTopOffset(buffer.selectionStart);
		var editLogItem = editLogger.write(
			Wasavi.EditLogger.ITEM_TYPE.UNSHIFT, startn, '', rowCount, shiftCount,
			config.vars.shiftwidth, config.vars.tabstop, config.vars.expandtab
		);
		marks.update(startn, function () {
			editLogItem.indents = buffer.shift(
				startn.row, rowCount, -shiftCount,
				config.vars.shiftwidth, config.vars.tabstop, config.vars.expandtab
			);
		});
		if (rowCount >= config.vars.report) {
			requestShowMessage(_('Unshifted {0} {line:0}.', rowCount));
		}
	});
	isEditCompleted = true;
}
function reformat (width) {
	var curpos = buffer.selectionStart;
	var isline = buffer.isLineOrientSelection;
	buffer.isLineOrientSelection = false;
	width || (width = config.vars.textwidth);
	width > 0 && editLogger.open('reformat', function () {
		var seMark = 'reformat-end';
		var nextMark = 'reformat-next';
		var limitWidth = charWidth * width;
		var scaler = $('wasavi_singleline_scaler');
		var isEnd = false;
		marks.setPrivate(seMark, buffer.getLineTailOffset(buffer.selectionEnd));

		function doReformat () {
			while (true) {
				var line = buffer.rows(buffer.selectionStartRow);
				var overed = false;
				var breakItem = false;
				var lastIndex = 0;

				scaler.textContent = '';
				lineBreaker.run(line, function (item) {
					if (!item) return false;
					scaler.textContent += line.substring(lastIndex, item.index + item.length);
					lastIndex = item.index + item.length;
					if (item.codePoint != 32 && item.codePoint != 9
					&& scaler.offsetWidth > limitWidth) {
						overed = true;
					}
					else if (unicodeUtils.canBreak(item.breakAction)) {
						breakItem = item;
					}
					return overed && !!breakItem;
				});
				if (!overed || !breakItem) break;
				buffer.setSelectionRange(new Position(
					buffer.selectionStartRow, breakItem.index + breakItem.length));

				var n = buffer.selectionStart;
				while (n.col > 0) {
					var left = buffer.leftClusterPos(n);
					if (!spc('S').test(buffer.charAt(left))) {
						break;
					}
					n = left;
				}
				if (n.lt(buffer.selectionEnd)) {
					buffer.selectionStart = n;
					deleteSelection();
				}
				var newlineObj = keyManager.objectFromCode(0x000d);
				execMap(buffer, newlineObj, editMap, '\u000d', '', '\u000d');
			}
		}

		while (!isEnd && curpos.row < buffer.rowLength) {
			if (spc('^S*$').test(buffer.rows(curpos))) {
				curpos.row++;
				continue;
			}

			buffer.setSelectionRange(curpos);

			var paraTail = searchUtils.findParagraphBoundary(1, true, true);
			if (paraTail.row >= buffer.rowLength - 1) {
				isEnd = true;
				paraTail.row = buffer.rowLength - 1;
			}
			if (paraTail.row >= marks.getPrivate(seMark).row) {
				isEnd = true;
				paraTail.row = marks.getPrivate(seMark).row;
			}
			while (spc('^S*$').test(buffer.rows(paraTail.row))) {
				paraTail.row--;
			}
			if (paraTail.row < curpos.row) {
				break;
			}

			marks.setPrivate(nextMark, buffer.getLineTailOffset(paraTail));
			paraTail.row > curpos.row && joinLines(paraTail.row - curpos.row);
			doReformat();
			curpos = marks.getPrivate(nextMark);
			curpos.row++;
		}

		marks.setPrivate(seMark);
		marks.setPrivate(nextMark);
	});
	buffer.isLineOrientSelection = isline;
	isEditCompleted = true;
	invalidateIdealWidthPixels();
	if (curpos.row >= buffer.rowLength) {
		curpos.row = buffer.rowLength - 1;
		curpos = buffer.getLineTailOffset(curpos);
	}
	else {
		curpos = buffer.getLineTopOffset2(curpos);
	}
	return curpos;
}
function deleteChars (count, isForward, isSubseq, withYank, canJoin) {
	if (buffer.selected) {
		deleteSelection(isSubseq);
	}
	else {
		count || (count = 1);

		if (isForward) {
			var n = buffer.selectionEnd;
			var tail = buffer.getLineTailOffset(n);
			var clusters = buffer.getGraphemeClusters(n);
			var index = clusters.getClusterIndexFromUTF16Index(n.col);
			if (n.col < tail.col) {
				n.col = clusters.rawIndexAt(Math.min(clusters.length, index + count));
				buffer.selectionEnd = n;
				withYank && yank();
				deleteSelection(isSubseq);
			}
			else if (canJoin && n.col >= tail.col && n.row < buffer.rowLength - 1) {
				n.row++;
				n.col = 0;
				buffer.selectionEnd = n;
				deleteSelection(isSubseq);
			}
		}
		else {
			var n = buffer.selectionStart;
			var clusters = buffer.getGraphemeClusters(n);
			var index = clusters.getClusterIndexFromUTF16Index(n.col);
			if (n.col > 0) {
				n.col = clusters.rawIndexAt(Math.max(0, index - count));
				buffer.selectionStart = n;
				withYank && yank();
				deleteSelection(isSubseq);
			}
			else if (canJoin && n.col == 0 && n.row > 0) {
				n.row--;
				n.col = buffer.rows(n).length;
				buffer.selectionStart = n;
				deleteSelection(isSubseq);
			}
		}
	}
	isEditCompleted = true;
	return true;
}
function deleteCharsForward (count, opts) {
	opts || (opts = {});
	return deleteChars(count, true, !!opts.isSubseq, !!opts.yank, !!opts.canJoin);
}
function deleteCharsBackward (count, opts) {
	opts || (opts = {});
	return deleteChars(count, false, !!opts.isSubseq, !!opts.yank, !!opts.canJoin);
}
function joinLines (count, asis) {
	count || (count = 1);
	editLogger.open('joinLines', function () {
		var asisIndex = [{length:0}];
		var lineOrient = buffer.isLineOrientSelection;
		buffer.isLineOrientSelection = false;
		for (var i = 0; i < count; i++) {
			if (buffer.selectionStartRow >= buffer.rowLength - 1) return;

			var t1 = buffer.rows(buffer.selectionStartRow);
			var t2 = buffer.rows(buffer.selectionStartRow + 1);
			var re = asis ? asisIndex : spc('^S*').exec(t2);

			buffer.selectionStart = new Position(buffer.selectionStartRow, t1.length);
			buffer.selectionEnd = new Position(buffer.selectionStartRow + 1, re[0].length);
			deleteSelection();

			var t1Last = t1.substr(-1);
			var t2First = t2.charAt(re[0].length);
			if (asis || t2.length == re[0].length
			|| spc('S').test(t1Last) || unicodeUtils.isIdeograph(t1Last)
			|| unicodeUtils.isClosedPunct(t2First) || unicodeUtils.isIdeograph(t2First)
			) {
				// do nothing
			}
			else if (unicodeUtils.isSTerm(t1.substr(-1))) {
				insert('  ', {keepPosition:true});
			}
			else {
				insert(' ', {keepPosition:true});
			}
		}
		buffer.isLineOrientSelection = lineOrient;
	});
	isEditCompleted = true;
	return true;
}
function yank (count, isLineOrient, register) {
	var result = 0;
	if (isLineOrient || buffer.isLineOrientSelection) {
		count || (count = 1);
		result = buffer.selectRowsLinewise(count);
		var content = buffer.getSelectionLinewise();
		registers.set(
			register == undefined ? prefixInput.register : register,
			content, true, true);
		if (result >= config.vars.report) {
			requestShowMessage(_('Yanked {0} {line:0}.', result));
		}
	}
	else {
		var content = buffer.getSelection();
		result = content.length;
		registers.set(
			register == undefined ? prefixInput.register : register,
			content, false, true);
	}
	return result;
}
function paste (count, opts) {
	count || (count = 1);
	opts || (opts = {});

	var item, data = '', isLineOrient = false;
	if ('register' in opts) {
		var register = opts.register;
		if (register == undefined || register == '') {
			register = '"';
		}
		if (registers.exists(register)) {
			item = registers.get(register);
			data = item.data;
			isLineOrient = item.isLineOrient;
		}
		else {
			requestShowMessage(_('Register {0} is empty.', register), true);
			return true;
		}
	}
	else if ('content' in opts) {
		item = {};
		data = '' + opts.content;
	}
	if (data.length == 0) {
		requestShowMessage(_('Putting data is empty.'), true);
		return true;
	}
	if ('lineOrientOverride' in opts) {
		isLineOrient = !!opts.lineOrientOverride;
	}

	var isForward = !!opts.isForward;
	var n = buffer.selectionStart;

	if (isLineOrient) {
		if (data.substr(-1) != '\n') {
			data += '\n';
		}
		editLogger.open('paste#1', function () {
			if (buffer.selected) {
				deleteSelection();
			}
			if (isForward) {
				if (n.row >= buffer.rowLength - 1) {
					buffer.setSelectionRange(buffer.getLineTailOffset(n));
					insert('\n', {isLineOrientedLast:true});
					n = buffer.selectionStart;
				}
				else {
					n.row++;
					n.col = 0;
					buffer.setSelectionRange(n);
				}
			}
			else {
				n.col = 0;
				buffer.setSelectionRange(n);
			}
			for (var i = 0, goal = count - 1; i < goal; i++) {
				insert(data);
			}
			insert(data, {isLineOrientedLast:true});
			buffer.setSelectionRange(buffer.getLineTopOffset2(n));
		});
	}
	else {
		if (isForward && !buffer.isNewline(n)) {
			n = buffer.rightClusterPos(n);
			buffer.setSelectionRange(n);
		}
		editLogger.open('paste#2', function () {
			if (buffer.selected) {
				deleteSelection();
			}
			for (var i = 0; i < count; i++) {
				insert(data);
			}
		});
		if (isForward) {
			buffer.setSelectionRange(buffer.leftClusterPos(buffer.selectionStart));
		}
	}
	isEditCompleted = true;
	return true;
}
function startEdit (c, opts) {
	if (buffer.selected) return inputEscape('Editing');

	requestInputMode('edit', {callback:function () {
		opts || (opts = {});
		var isAppend = !!opts.isAppend;
		var isAlter = !!opts.isAlter;
		var opened = !!opts.opened;

		var n;
		switch ((isAppend ? 2 : 0) + (isAlter ? 1 : 0)) {
		case 0:// insert
			n = buffer.selectionStart;
			break;
		case 1:// insert at top
			n = buffer.getLineTopOffset2(buffer.selectionStart);
			break;
		case 2:// append
			n = buffer.isNewline(buffer.selectionEnd) ?
				buffer.selectionEnd :
				buffer.rightClusterPos(buffer.selectionEnd);
			break;
		case 3:// append at tail
			n = buffer.getLineTailOffset(buffer.selectionEnd);
			break;
		}
		buffer.setSelectionRange(n);
		cursor.ensureVisible();
		prefixInput.isLocked = true;
		inputHandler.reset(
			'repeatCount' in opts ? opts.repeatCount : 1,
			opened ? '\n' : '',
			buffer.selectionStart,
			true);
		compositionLevel = 0;
	}});

	prefixInput.operation = c;
	return false;
}
function openLine (c, after) {
	var n, isTopOfText = false;
	if (after) {
		buffer.selectionStart = n = buffer.selectionEnd;
	}
	else {
		n = buffer.getLineTopOffset(buffer.selectionStart);
		if (n.row == 0 && n.col == 0) {
			isTopOfText = true;
		}
		else {
			n = buffer.leftClusterPos(n);
			buffer.setSelectionRange(n);
		}
	}
	editLogger.open('openLine');
	if (isTopOfText) {
		buffer.setSelectionRange(new Position(0, 0));
		insert('\n', {keepPosition:true});
	}
	else {
		var indent = config.vars.autoindent ? buffer.getIndent(buffer.selectionStart) : '';
		n = buffer.getLineTailOffset(n);
		buffer.setSelectionRange(n);
		insert('\n' + indent);
	}
	config.setData('modified');
	return startEdit(c, {repeatCount:prefixInput.count, opened:true});
}
function toggleCase (count, allowMultiLine) {
	count || (count = 1);
	if (buffer.selected) {
		count = Unistring(buffer.getSelection()).length;
		buffer.setSelectionRange(buffer.selectionStart);
	}
	editLogger.open('toggleCase', function () {
		var n = buffer.selectionStart;
		while (count > 0 && n.row < buffer.rowLength) {
			var text = buffer.getGraphemeClusters(n);
			var index = text.getClusterIndexFromUTF16Index(n.col);
			var original = text.substr(index, count);

			if (original.length) {
				var replacer = '';
				for (var i = 0, goal = original.length; i < goal; i++) {
					var c = original.rawStringAt(i);
					var l = c.toLowerCase();
					var u = c.toUpperCase();
					if (c == l && c != u) {
						replacer += u;
					}
					else if (c != l && c == u) {
						replacer += l;
					}
					else {
						replacer += c;
					}
				}
				editLogger.write(Wasavi.EditLogger.ITEM_TYPE.OVERWRITE, n, replacer, text.toString());
				buffer.setSelectionRange(buffer.overwriteChars(n, replacer));
			}

			count -= allowMultiLine ? (original.length + 1) : count;
			n.row++;
			n.col = 0;
		}
	});
	isEditCompleted = true;
	return true;
}
function unifyCase (count, toUpper, allowMultiLine) {
	count || (count = 1);
	if (buffer.selected) {
		count = Unistring(buffer.getSelection()).length;
		buffer.setSelectionRange(buffer.selectionStart);
	}
	editLogger.open('unifyCase', function () {
		var n = buffer.selectionStart;
		var method = toUpper ? 'toUpperCase' : 'toLowerCase';
		while (count > 0 && n.row < buffer.rowLength) {
			var text = buffer.getGraphemeClusters(n);
			var index = text.getClusterIndexFromUTF16Index(n.col);
			var original = text.substr(index, count);

			if (original.length) {
				var replacer = original[method]().toString();
				editLogger.write(Wasavi.EditLogger.ITEM_TYPE.OVERWRITE, n, replacer, text.toString());
				buffer.setSelectionRange(buffer.overwriteChars(n, replacer));
			}

			count -= allowMultiLine ? (original.length + 1) : count;
			n.row++;
			n.col = 0;
		}
	});
	isEditCompleted = true;
	return true;
}
function quickReplace (c, count, allowMultiLine) {
	var clusters = buffer.getGraphemeClusters();
	var clusterIndex = clusters.getClusterIndexFromUTF16Index(buffer.selectionStartCol);
	count || (count = 1);
	if (buffer.selected) {
		count = Unistring(buffer.getSelection()).length;
		buffer.setSelectionRange(buffer.selectionStart);
	}
	if (!allowMultiLine && count > clusters.length - clusterIndex) {
		requestShowMessage(_('Replace count too large.'), true);
		isEditCompleted = true;
		invalidateIdealWidthPixels();
		return true;
	}
	editLogger.open('quickReplace', function () {
		if (c == '\r' || c == '\n') {
			buffer.selectionEnd = buffer.offsetBy(
				buffer.selectionStart,
				clusters.substr(clusterIndex, count).toString().length
			);
			deleteSelection();
			insert('\n');
		}
		else {
			c = toVisibleControl(c);
			var n = buffer.selectionStart;
			var scaler = $('wasavi_singleline_scaler');
			var widthCache = [0];
			while (count > 0 && n.row < buffer.rowLength) {
				var text = buffer.getGraphemeClusters(n);
				var index = text.getClusterIndexFromUTF16Index(n.col);
				var original = text.substr(index, count);

				scaler.textContent = original.toString();
				var originalWidth = scaler.offsetWidth;
				var subString = '';

				while (true) {
					var subWidth = 0;
					subString += c;

					if (widthCache.length > subString.length) {
						subWidth = widthCache[subString.length];
					}
					else {
						scaler.textContent = subString;
						subWidth = widthCache[subString.length] = scaler.offsetWidth;
					}

					if (subWidth == 0) {
						subString = '';
						break;
					}
					if (subWidth >= originalWidth) {
						break;
					}
				}

				if (originalWidth > 0 && subString.length > 0) {
					var replacer = multiply(c, subString.length);
					editLogger.write(Wasavi.EditLogger.ITEM_TYPE.OVERWRITE, n, replacer, text.toString());
					buffer.setSelectionRange(buffer.leftClusterPos(buffer.overwriteChars(n, replacer)));
				}

				count -= allowMultiLine ? (original.length + 1) : count;
				n.row++;
				n.col = 0;
			}
		}
	});
	isEditCompleted = true;
	invalidateIdealWidthPixels();
	return true;
}
function insertNewlineWithIndent (origin, selfIndent) {
	if (buffer.rowLength == 1 && buffer.rows(0) == '') {
		var indent = config.vars.autoindent ? selfIndent : '';
		insert(indent);
	}
	else if (origin.row >= buffer.rowLength) {
		var n = buffer.selectionStart;
		var indent = config.vars.autoindent ? buffer.getIndent(n) : '';
		n = buffer.getLineTailOffset(n);
		buffer.setSelectionRange(n);
		insert('\n' + indent);
	}
	else {
		var indent = config.vars.autoindent ? buffer.getBackIndent(buffer.selectionStart) : '';
		insert(indent);
		insert('\n', {keepPosition:true});
	}
}
function reportSave (f) {
	var report = config.vars.report;
	config.setData('report', 0x7fffffff);
	try {
		return f();
	}
	finally {
		config.setData('report', report);
	}
}
function undo (count) {
	var revertedCount = 0;
	count || (count = 1);

	while (count-- > 0) {
		var result = editLogger.undo();
		if (result === false) {
			break;
		}

		revertedCount += result;
	}

	if (revertedCount == 0) {
		requestShowMessage(_('No undo item.'), true);
		return;
	}

	requestShowMessage(_('{0} {operation:0} have reverted.', revertedCount));
	invalidateIdealWidthPixels();
	config.setData(editLogger.isClean ? 'nomodified' : 'modified');
	return true;
}
function redo (count) {
	var redidCount = 0;
	count || (count = 1);

	while (count-- > 0) {
		var result = editLogger.redo();
		if (result === false) {
			break;
		}

		redidCount += result;
	}

	if (redidCount == 0) {
		requestShowMessage(_('No redo item.'), true);
		return;
	}

	requestShowMessage(_('{0} {operation:0} have executed again.', redidCount));
	invalidateIdealWidthPixels();
	config.setData(editLogger.isClean ? 'nomodified' : 'modified');
	return true;
}

/*
 * event handlers <<<1
 * ----------------
 */

// window
function handleWindowFocus (e) {
	cursor.update({focused:true});
}
function handleWindowBlur (e) {
	if (quickActivation) {
		uninstall(true);
	}
	else {
		cursor.update({focused:false});
	}
}
function handleWindowResize (e) {
	function relocate () {
		if (targetElement) {
			targetElement.rect.width =
				document.documentElement.clientWidth;
			targetElement.rect.height =
				document.documentElement.clientHeight -
				(extensionChannel.isTopFrame() ? 0 : $('wasavi_footer').offsetHeight);
			setGeometory();
		}
		resizeHandlerInvokeTimer = null;
	}
	containerRect = null;
	if (extensionChannel.isTopFrame()) {
		if (!resizeHandlerInvokeTimer) {
			resizeHandlerInvokeTimer = setTimeout(function () {relocate()}, 100);
		}
	}
	else {
		relocate();
	}
}
function handleBeforeUnload (e) {
	try {
		if (!extensionChannel.isTopFrame()) return;
		if (!config.vars.modified) return;
	}
	catch (ex) {
		return;
	}

	return e.returnValue = _('The text has been modified.');
}
function handleWindowError (message, fileName, lineNumber, columnNumber, errObj) {
	try {
		// TODO: Should we collect error always?
		if (!testMode) return;
		if (!errObj) {
			if (typeof message == 'object') {
				errObj = message;
			}
			else {
				errObj = {
					message: message,
					fileName: fileName,
					lineNumber: lineNumber,
					stack: '*stacktrace is not available*'
				};
			}
		}

		notifyToParent('notify-error', {
			message: errObj.stack || errObj.message || '?',
			fileName: errObj.filename || errObj.fileName || '?',
			lineNumber: errObj.lineno || errObj.lineNumber || -1
		});

		error(
			(errObj.filename || errObj.fileName || '?') + ': ' +
			(errObj.lineno || errObj.lineNumber || -1) + '\n' +
			(errObj.message || '?') + '\n' +
			(errObj.stack || '*stacktrace is not available*')
		);
	}
	catch (ex) {
	}
}

// mapManager
function handleMapExpand (sequences) {
	keyManager.setDequeue('unshift', sequences);
	keyManager.sweep();
}
function handleMapRecurseMax () {
	keyManager.invalidate();
	showMessage(_('Map expansion reached maximum recursion limit.'), true);
}

// keyManager
function handleKeydown (g) {
	var generator = g();

	promise || (promise = Promise.resolve());

	function run (isNext) {
		try {
			var result = isNext ? generator.next() : generator.throw();
		}
		catch (ex) {
			g = generator = null;
			keyManager.invalidate();
			return;
		}

		if (result.done) {
			g = generator = null;
			return;
		}

		result.value.preventDefault();
		isInteractive = true;

		if (testMode && commandCompleteTimer) {
			clearTimeout(commandCompleteTimer);
			commandCompleteTimer = undefined;
		}

		if (!result.value.mapExpanded) {
			recordedStrokes.appendStroke(result.value.toInternalString());
		}

		if (result.value.isNoremap) {
			promise = promise
			.then(() => {
				notifyActivity(result.value.code, result.value.char);
				return processInput(result.value);
			});
		}
		else {
			promise = promise
			.then(() => mapManager.process(inputMode, result.value))
			.then(e => {
				if (e) {
					notifyActivity(e.code, e.char);
					return processInput(e);
				}
				else {
					notifyActivity('-', '-', 'dummy key');
				}
			});
		}

		promise = promise
		.then(
			result => {
				if (testMode && result) {
					commandCompleteTimer = setTimeout(() => {
						notifyCommandComplete('commands-completed');
					}, 100);
				}
				run(true);
			},
			error => {
				if (error) {
					console.error(`sequence point with an error: ${error.message}\n${error.stack}`);
					handleWindowError(error);
				}
				else {
					console.error(`sequence point with an error`);
				}
				run(false);
			}
		);
	}

	run(true);
}

// document
function handlePaste (e) {
	e.preventDefault();
	var s = e.clipboardData.getData('text/plain').replace(/\r\n/g, '\n');
	var r = registers.get(';');
	switch (getPrimaryMode()) {
	case 'command':
	case 'bound': case 'bound_line':
		r.set(s);
		keyManager.push('";P');
		keyManager.sweep();
		break;

	case 'line_input':
		s = s.replace(/\n/g, toVisibleControl(13));
		/*FALLTHRU*/

	case 'edit': case 'overwrite':
		r.set(s);
		keyManager.push('\u0012;');
		keyManager.sweep();
		break;
	}
}

// cover
function handleCoverMousedown (e) {
	e.preventDefault();
}
function handleCoverClick (e) {
	notifyToParent('focus-me', handleWindowFocus);
}
function handleCoverMousewheel (e) {
	e.preventDefault();
	switch (state) {
	case 'normal':
		switch (inputMode) {
		case 'command': case 'bound': case 'bound_line':
			var delta = 0;
			if (e.wheelDelta) {
				delta = 3 * (e.wheelDelta > 0 ? -1 : 1);
			}
			else if (e.detail) {
				delta = e.detail;
			}
			if (delta) {
				keyManager.push(Math.abs(delta) + (delta > 0 ? '\u0005' : '\u0019'));
				keyManager.sweep();
			}
			break;
		}
		break;
	}
}

// handler for message from backend
function handleBackendMessage (req) {
	if (!req || !req.type) return;

	logMode && log('got "' + req.type + '" message from backend:', JSON.stringify(req).substring(0, 200));

	switch (req.type) {
	case 'update-storage':
		for (var i in req.items) {
			var value = req.items[i];
			switch (i) {
			case lineInputHistories.storageKey:
				!testMode && lineInputHistories.load(value);
				break;
			case registers.storageKey:
				!testMode && registers.load(value);
				break;
			case 'logMode':
				logMode = value;
				break;
			}
		}
		break;

	case 'fileio-authorize-response':
		if (req.error) {
			showMessage(_.apply(null, req.error), true, false);
		}
		else {
			showMessage(_('Obtaining access rights ({0})...', req.phase || '-'));
		}
		break;

	case 'fileio-write-response':
		var modeOverridden = null;
		if ('meta' in req && req.meta && req.meta.path != '') {
			modeOverridden = 'write handler';
		}
		if (req.error) {
			showMessage(_.apply(null, req.error), true, false);
			notifyActivity('', '', 'write handler error: ' + req.error);
			notifyCommandComplete('commands-completed', modeOverridden);
		}
		else {
			switch (req.state) {
			case 'buffered':
				showMessage(_('Buffered: {0}', req.path));
				break;
			case 'writing':
				showMessage(_('Writing ({0}%)', req.progress.toFixed(2)));
				break;
			case 'complete':
				var path = req.meta.path;
				var bytes = req.meta.bytes;
				var message = getFileIoResultInfo(path, bytes);

				showMessage(_('Written: {0}', message));
				notifyActivity('-', '-', 'write handler completed');
				notifyCommandComplete('commands-completed', modeOverridden);
				break;
			}
		}
		break;

	case 'ping':
		break;

	default:
		log('wasavi: got a unknown type message: ' + JSON.stringify(req, null, ' '));
	}
}

diag('defining variables');

/*
 * consts <<<1
 * ----------------
 */

const appProxy = new AppProxy;
const Position = Wasavi.Position;
const abbrevs = new Collection;
const keyManager = qeema;
const regexConverter = new Wasavi.RegexConverter(appProxy);
const mapManager = new Wasavi.MapManager(appProxy, {
	onexpand: handleMapExpand,
	onrecursemax: handleMapRecurseMax
});
const theme = new Wasavi.Theme(appProxy);
const bell = new Wasavi.Bell(appProxy);
const completer = new Wasavi.Completer(appProxy,
// completer <<<2
	[
		// ex command completion
		[
			/^(\s*)((?:gl?o?b?a?l?|v)\s*[^a-zA-Z"\\\s](?:\\.|.)*?[^a-zA-Z"\\\s])?([^"\s]*)(.*)$/, 3,
			function (prefix, notifyCandidates) {
				notifyCandidates(Wasavi.ExCommand.commands.map(function (c) {return c.name}).sort());
			}
		],

		// theme option
		[
			/^(\s*)(set?.*\s+theme=)((?:\\.|\S)*)(.*)$/, 3,
			function (prefix, notifyCandidates) {
				notifyCandidates(theme.colorSets.sort());
			}
		],

		// debug command completion
		[
			/^(\s*)(sushi\s+)(.+)(.*)/, 3,
			function (prefix, notifyCandidates) {
				notifyCandidates([
					'reset-search-info',
					'dump-undo-info',
					'dump-internal-ids',
					'dump-options-doc'
				].sort());
			}
		],

		// option value completion
		[
			/^(\s*)(set?.*\s+)([^=]+=)((?:\\.|\S)*)(.*)$/, 4,
			function (prefix, notifyCandidates, line) {
				var value = [];
				try {
					var re = spc('([^=S]+)=$').exec(line);
					if (!re) return;

					var info = config.getInfo(re[1]);
					if (!info || info.type == 'b') return;

					value.push(
						config.getData(re[1], true).replace(/^[^=]+=/, ''));
				}
				finally {
					notifyCandidates(value);
				}
			},
			{isVolatile:true}
		],

		// option name completion
		[
			/^(\s*)(set?.*\s+)(.*)$/, 3,
			function (prefix, notifyCandidates) {
				var src = [];
				Object.keys(config.vars).forEach(function (v) {
					src.push(v);
					config.getInfo(v).type == 'b' && src.push('no' + v, 'inv' + v);
				});
				notifyCandidates(src.sort());
			},
			{
				onComplete:function (newValue, oldValue) {
					var result = null;
					var prefix = '';
					if (/^(no|inv)(.+)/.test(oldValue)) {
						prefix = RegExp.$1;
						oldValue = RegExp.$2;
					}
					if (oldValue != '' && oldValue in config.abbrevs) {
						result = prefix + config.abbrevs[oldValue];
					}
					return result;
				}
			}
		],

		// file path completion
		[
			[
				/^(\s*)(ed?i?t?!?\s+(?:\+\+(?:\\.|\S)*\s+)?)((?:\\.|\S)*)$/,
				/^(\s*)(wr?i?t?e?!?(?:\s+!?|>>)?)((?:\\.|\S)*)$/,
				/^(\s*)((?:re?a?d?|fi?l?e?|cd|chdi?r?)\s+)((?:\\.|\S)*)$/,
			],
			3,
			function (prefix, notifyCandidates, line) {
				var drive = '', pathRegalized, pathInput, prefixBaseName;

				pathRegalized = pathInput = extractDriveName(prefix, d => {drive = d});
				pathRegalized = regalizeFilePath(drive + pathRegalized);
				pathRegalized = pathRegalized.replace(/\/[^\/]*$/, '/');

				if (pathRegalized == '') {
					pathRegalized =
						fstab[fileSystemIndex].name + ':' +
						fstab[fileSystemIndex].cwd;
				}

				pathInput = pathInput.replace(/[^\/]+$/, '');
				prefixBaseName = /[^\/]*$/.exec(prefix)[0];

				var port = chrome.runtime.connect({name: 'fsctl'});
				port.onMessage.addListener(res => {
					if (!res || res.error) {
						notifyCandidates([]);
						port.disconnect();
						port = null;
						return;
					}

					if (res.type != 'fileio-getentries-response') {
						return;
					}

					if (!res.data) {
						notifyCandidates([]);
						port.disconnect();
						port = null;
						return;
					}

					var onlyDirectory = /^\s*(?:cd|chdi?r?)\b/.test(line);
					var fs = drive == '' ? fileSystemIndex : getFileSystemIndex(drive);
					var result = res.data
						.map(file => {
							var pathFixed = '';
							var baseName = '';

							if (onlyDirectory && !file.is_dir) {
								return '';
							}

							if (getObjectType(file.path) == 'Array') {
								pathFixed = file.path
									.slice(0, file.path.length - 1)
									.map(s => s.replace(/\//g, '\\/'))
									.join('/') + '/';
								baseName = file.path[file.path.length - 1];
							}
							else {
								var re = /^(.*\/)([^\/]+)$/.exec(file.path);
								if (!re) {
									return '';
								}
								pathFixed = re[1];
								baseName = re[2];
							}

							// remove dotfile if prefix does not start with a dot.
							if (prefixBaseName.charAt(0) != '.' && baseName.charAt(0) == '.') {
								return '';
							}

							if (pathInput.charAt(0) != '/') {
								if (fs < 0) {
									return '';
								}
								if (pathFixed.indexOf(fstab[fs].cwd) == 0) {
									pathFixed = pathInput;
								}
							}

							return drive +
								pathFixed.replace(/\s/g, '\\$&') +
								baseName.replace(/\s/g, '\\$&') +
								(file.is_dir ? '/' : '');
						})
						.filter(s => s.length > 0)
						.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

					port.disconnect();
					port = null;

					notifyCandidates(result);
				});

				port.postMessage({
					type: 'get-entries',
					path: pathRegalized
				});
			},
			{isVolatile:true}
		]
	]
);
// >>>
const config = new Wasavi.Configurator(appProxy,
// configuration object <<<2
	[
		/* defined by POSIX */
		['autoindent', 'b', true],
		['autoprint', 'b', true],     // not used
		['autowrite', 'b', false],    // not used
		['beautify', 'b', false],     // not used
		['directory', 's', '/tmp/'],  // not used
		['edcompatible', 'b', false], // not used
		['errorbells', 'b', false],
		['exrc', 'b', false],         // not used
		['ignorecase', 'b', true],
		['list', 'b', false, function (v) {
			setList(v);
			return v;
		}],
		['magic', 'b', true],         // not used
		['mesg', 'b', true],          // not used
		['number', 'b', false, function (v) {
			invalidateIdealWidthPixels();
			return v;
		}],
		['paragraphs', 's', 'IPLPPPQPP LIpplpipbp', function (v) {
			searchUtils && searchUtils.setParagraphMacros(v);
			return v;
		}],
		['prompt', 'b', true],
		['readonly', 'b', false],
		['redraw', 'b', true],        // not used
		['remap', 'b', true],
		['report', 'i', 5],
		['scroll', 'i', 0],
		['sections', 's', 'NHSHH HUnhsh', function (v) {
			searchUtils && searchUtils.setSectionMacros(v);
			return v;
		}],
		['shell', 's', '/bin/sh'],    // not used
		['shiftwidth', 'i', 4],
		['showmatch', 'b', true],
		['showmode', 'b', true],
		['slowopen', 'b', false],     // not used
		['tabstop', 'i', 8, function (v) {
			setTabStop(v);
			return v;
		}],
		['taglength', 'i', 0],        // not used
		['tags', 's', 'tags'],        // not used
		['term', 's', 'dom'],         // not used
		['terse', 'b', false],        // not used
		['warn', 'b', true],          // not used
		['window', 'i', 24],
		['wrapmargin', 'i', 0],
		['wrapscan', 'b', true],
		['writeany', 'b', false],     // not used

		/* defined by wasavi */
		['theme', 's', '', function (v) {
			theme.select(v) && theme.update();
			return v;
		}],
		['smooth', 'b', true],
		['bellvolume', 'i', 25],
		['history', 'i', 20],
		['monospace', 'i', 20],
		['fullscreen', 'b', false, function (v) {
			if (!extensionChannel) return;
			return new Promise(resolve => {
				notifyToParent('window-state', {
					tabId:extensionChannel.tabId,
					state:v ? 'maximized' : 'normal'
				}, res => resolve(v));
			});
		}, {isAsync:true}],
		['jkdenotative', 'b', false],
		['undoboundlen', 'i', 20],
		['stripe', 'b', true, function (v) {
			theme.useStripe = v;
			theme.update();
			return v;
		}],
		['syncsize', 'b', true, function (v) {
			if (!extensionChannel) return;
			return new Promise(resolve => {
				notifyToParent('set-size', {
					isSyncSize: v
				}, res => resolve(v));
			});
		}, {isAsync:true}],
		['override', 'b', true, null, {isDynamic:true}],
		['datetime', 's', '%c'],
		['cursorblink', 'b', true],
		['esctoblur', 'b', false],
		['writeas', 's', '', function (v) {
			switch (v.toLowerCase()) {
			case 'html': case 'div': case 'p':
			case 'textandbreak': case 'plaintext':
				targetElement.writeAs = v;
				break;
			}
			return v;
		}],
		['launchbell', 'b', true],

		/* defined by vim */
		['expandtab', 'b', false],
		['iskeyword', 'r', '^[a-zA-Z0-9_]\\+$'],
		['searchincr', 'b', true],
		['smartcase', 'b', true],
		['undolevels', 'i', 20, function (v) {
			if (editLogger) {
				editLogger.logMax = v || 1;
			}
			return v;
		}],
		['quoteescape', 's', '\\'],
		['relativenumber', 'b', false, function (v) {
			invalidateIdealWidthPixels();
			return v;
		}],
		['textwidth', 'i', 0],
		['modified', 'b', false, null, {isDynamic:true}],
		['cursorline', 'b', false],
		['cursorcolumn', 'b', false],
		['nrformats', 's', 'bin,octal,hex'],
		['visualbell', 'b', false],

		/* defined by nvi */
		//['altwerase', 'b', false],
		//['backup', 's', ''],
		//['cdpath', 's', ':'],
		//['cedit', 's', ''],
		['columns', 'i', 0, function (v) {
			if (!extensionChannel || !isNumber(charWidth)) return;
			return new Promise(resolve => {
				var ed = $('wasavi_editor');
				notifyToParent('set-size', {
					width: v * charWidth + (ed.offsetWidth - ed.clientWidth),
					isSyncSize: config.vars.syncsize
				}, res => resolve(v));
			});
		}, {isDynamic:true, isAsync:true}],
		//['combined', 'b', false],
		//['comment', 'b', false],
		//['escapetime', 'i', 6],
		//['extended', 'b', false],
		//['filec', 's', ''],
		//['fileencoding', 's', ''],
		//['flash', 'b', true],
		//['hardtabs', 'i', 0],
		//['iclower', 'b', false],
		//['inputencoding', 's', ''],
		//['keytime', 'i', 6],
		//['leftright', 'b', false],
		['lines', 'i', 0, function (v) {
			if (!extensionChannel || !isNumber(lineHeight)) return;
			return new Promise(resolve => {
				notifyToParent('set-size', {
					height: v * lineHeight,
					isSyncSize: config.vars.syncsize
				}, res => resolve(v));
			});
		}, {isDynamic:true, isAsync:true}],
		//['lisp', 'b', false],
		//['lock', 'b', true],
		['matchtime', 'i', 5],
		//['modeline', 'b', false],
		//['msgcat', 's', '/usr/share/vi/catalog/'],
		//['noprint', 's', ''],
		//['octal', 'b', false],
		//['open', 'b', true],
		//['optimize', 'b', true],
		//['path', 's', ''],
		//['print', 's', ''],
		//['recdir', 's', '/var/tmp/vi.recover'],
		//['ruler', 'b', false],
		//['secure', 'b', false],
		//['shellmeta', 's', '~{[*?$`\'"\\'],
		//['sidescroll', 'i', 16],
		//['sourceany', 'b', false],
		//['tildeop', 'b', false],
		//['timeout', 'b', true],
		//['ttywerase', 'b', false],
		//['verbose', 'b', false],
		//['w1200', 'i', 0],
		//['w300', 'i', 0],
		//['w9600', 'i', 0],
		//['windowname', 'b', false],
		//['wraplen', 'i', 0],
	],
	{
		ai:'autoindent',		ap:'autoprint',		aw:'autowrite',
		bf:'beautify',			co:'columns',		dir:'tmp_directory',
		eb:'errorbells',		ed:'edcompatible',	ex:'exrc',
		fe:'fileencoding',		ht:'hardtabs',		ic:'ignorecase',
		ie:'inputencoding',		li:'lines',			modelines:'modeline',
		nu:'number',			opt:'optimize',		para:'paragraphs',
		re:'redraw',			ro:'readonly',		scr:'scroll',
		sect:'sections',		sh:'shell',			slow:'slowopen',
		sm:'showmatch',			smd:'showmode',		sw:'shiftwidth',
		tag:'tags',				tl:'taglength',		to:'timeout',
		ts:'tabstop',			tty:'term',			ttytype:'term',
		w:'window',				wa:'writeany',		wi:'window',
		wl:'wraplen',			wm:'wrapmargin',	ws:'wrapscan',

		isk:'iskeyword', incsearch:'searchincr',	is:'searchincr',
		scs:'smartcase',		tw:'textwidth',		ul:'undolevels',
		qe:'quoteescape',		rnu:'relativenumber',

		fs:'fullscreen',		jk:'jkdenotative',	et:'expandtab',
		cul:'cursorline',		cuc:'cursorcolumn',	cub:'cursorblink',
		nf:'nrformats',			vb:'visualbell',	lb:'launchbell'
	}
);
// >>>

/*
 * input handlers for each mode <<<1
 * ----------------
 */

const modeHandlers = {
	command: function (r) {
		cursor.windup();
		return execCommandMap(r, commandMap, r.mapkey, r.subkey, r.code);
	},
	wait_register: function (r) {
		var mapkeyActual = inputModeStack.lastItem.mapkey;
		popInputMode();
		r.mapkey = mapkeyActual;
		var handler = this[modeTable[inputMode].handlerName];
		return isGenerator(handler) ?
			execGenerator(handler, this, r) :
			handler.call(this, r);
	},
	backlog_prompt: function (r) {
		if (backlog.queued) {
			if (r.letter == 'q') {
				backlog.clear();
				backlog.hide();
				popInputMode();
			}
			else if (r.letter == ':') {
				backlog.clear();
				popInputMode();
				keyManager.push(r.e);
			}
			else {
				backlog.open(r.letter == '\u000d');
			}
		}
		else {
			r.letter != ':' && backlog.hide();
			popInputMode();
			requestShowPrefixInput();
			if (r.letter != '\u000d' && r.letter != ' ' && state == 'normal') {
				keyManager.push(r.e);
			}
		}
		return r;
	},
	bound: function (r) {
		cursor.windup();

		if (r.subkey == inputMode && r.code == 0x1b) {
			buffer.unEmphasisBound();
			popInputMode();
			requestShowPrefixInput();
			r.needEmitEvent = true;
			recordedStrokes.remove('bound');

			var p1 = marks.getPrivate('<'), p2 = marks.getPrivate('>');
			if (p1 && p2) {
				if (p1.gt(p2)) {
					var t = p1; p1 = p2; p2 = t;
				}
				marks.set('<', p1);
				marks.set('>', p2);
			}
			marks.setPrivate('<');
			marks.setPrivate('>');
			return r;
		}
		else {
			return execCommandMap(r, boundMap, r.mapkey, r.subkey, r.code, true);
		}
	},
	edit: function* (r) {
		if (compositionLevel == 0) {
			cursor.windup();
		}

		if (r.subkey == inputMode && (r.code == 0x1b || r.code == 0x03)) {
			if (!r.ignoreAbbrev && processAbbrevs(true, '\u001b')) {
				return r;
			}

			var finalStroke = inputHandler.stroke;

			// store input text in the first input session to dot register and prefixInput
			if (inputHandler.countOrig == inputHandler.count) {
				registers.set('.', finalStroke);
				prefixInput.isLocked = false;
				prefixInput.trailer = finalStroke;
			}

			// insert same input text if count > 1
			if (inputHandler.count > 1) {
				keyManager.unshift(
					inputHandler.suffix,
					registers.get('.').data,
					'\u001b');
				inputHandler.count--;
				return r;
			}

			config.vars.showmatch && pairBracketsIndicator && pairBracketsIndicator.clear();
			inputHandler.close();

			var n = buffer.selectionStart;
			inputHandler.setStartPosition(n);
			if (n.col > 0) {
				n = buffer.leftClusterPos(n);
			}
			buffer.setSelectionRange(n);

			popInputMode();
			cursor.ensureVisible();

			if (requestedState.simpleCommand) {
				setLastSimpleCommand(
					requestedState.simpleCommand.initial,
					prefixInput.toString(),
					r.letter);
				delete requestedState.simpleCommand;
			}
			if (isEditCompleted || finalStroke != '') {
				doEditComplete();
			}

			prefixInput.reset();
			requestShowPrefixInput();
			invalidateIdealWidthPixels();
			editLogger.close();// edit-wrapper
			r.needEmitEvent = true;
			isVerticalMotion = false;
//console.log('undo log:\n' + editLogger.dump());
//console.log('finalStroke: "' + toVisibleString(finalStroke) + '"');
//console.log('simpleCommand: "' + toVisibleString(lastSimpleCommand) + '"');

			return r;
		}

		var letterActual = inputHandler.appendText(r.e);
		var prevPos = buffer.selectionStart;
		inputHandler.appendStroke(r.e);
		inputHandler.updateHeadPosition();

		if (config.vars.showmatch && pairBracketsIndicator) {
			pairBracketsIndicator.clear();
			pairBracketsIndicator = null;
		}

		yield execEditMap(r, r.mapkey, r.subkey, r.code);

		if (r.isCompleted) {
			requestShowPrefixInput(getDefaultPrefixInputString());
		}
		else if (r.code >= 0 && !clipOverrun()) {
			if (r.code < 32) {
				inputHandler.ungetText();
				inputHandler.ungetStroke();
				r.e.code = toVisibleControl(r.e.code).charCodeAt(0);
				letterActual = inputHandler.appendText(r.e);
				inputHandler.appendStroke(r.e);
			}

			(inputMode == 'edit' ? insert : overwrite)(letterActual);
			processAutoDivide(r.e);
			!r.ignoreAbbrev && processAbbrevs(false);

			if (needBreakUndo(inputHandler.textFragment, letterActual)) {
				inputHandler.newState();
				if (!r.e.nativeEvent) {
					keyManager.lock();
					setTimeout(function () {keyManager.unlock()}, 1);
				}
			}
		}
		else {
			inputHandler.ungetText();
			inputHandler.ungetStroke();
		}

		if (r.e.isCompositionedFirst && !r.e.isCompositionedLast) {
			compositionLevel++;
		}
		else if (!r.e.isCompositionedFirst && r.e.isCompositionedLast) {
			compositionLevel > 0 && compositionLevel--;
		}

		if (compositionLevel == 0) {
			cursor.ensureVisible();
			requestShowPrefixInput(getDefaultPrefixInputString());
			r.needEmitEvent = true;
		}

		if (config.vars.showmatch && !pairBracketsIndicator) {
			pairBracketsIndicator = searchUtils.getPairBracketsIndicator(
				letterActual, prevPos);
		}

		if (r.needEmitEvent === false) {
			r.needEmitEvent = 'notify-state';
		}

		return r;
	},
	line_input: function* (r) {
		const input = $('wasavi_footer_input');
		const canEscape = r.code == 0x1b || r.code == 0x03
			|| r.code == 0x08 && input.selectionStart == 0 && input.selectionEnd == 0;
		const isComplete = prefixInput.operation != ''
			|| prefixInput.motion != '';
		var line = toNativeControl(input.value);

		input.dataset.current = input.value;
		isCompleteResetCanceled = false;

		if (r.subkey == inputMode && canEscape) {
			var targetMode = inputModeStack.lastItem.inputMode;
			var targetMap = modeTable[targetMode].map;
			var targetKey = inputModeStack.lastItem.mapkey;
			var currentSubkey = inputMode;

			popInputMode();
			cursor.windup();
			backlog.hide();
			yield execMap(
				input, r.e,
				targetMap, targetKey, '$' + currentSubkey + '_escape',
				line);

			prefixInput.reset();
			requestShowPrefixInput();
		}
		else if (r.subkey == inputMode && (r.code == 0x0d || r.code == 0x0a)) {
			if (isComplete) {
				prefixInput.trailer = line + r.e.code2letter(r.code);
			}
			else {
				line = line.replace(/\s+/g, ' ');
				prefixInput.appendRegister(line + r.e.code2letter(r.code));
			}

			var internalPrefix = input.dataset.internalPrefix;
			if (isString(internalPrefix)) {
				line = internalPrefix + line;
			}

			var targetMode = inputModeStack.lastItem.inputMode;
			var targetMap = modeTable[targetMode].map;
			var targetKey = inputModeStack.lastItem.mapkey;
			var currentSubkey = inputMode;

			popInputMode();
			cursor.windup();

			yield execMap(
				input, r.e,
				targetMap, targetKey, '$' + currentSubkey + '_reset',
				line);
			yield execCommandMap(
				r,
				targetMap, targetKey, currentSubkey,
				line);
		}
		else {
			yield execLineInputEditMap(r, r.mapkey, r.subkey, r.code);

			if (r.isCompleted) {
				setTimeout(function () {
					var input = $('wasavi_footer_input');

					/*
					 * Although following codes are very very strange,
					 * required for Firefox.
					 * It seems that Firefox has a bug which clears
					 * the contents of input element by the escape key :-<
					 */
					if (Wasavi.IS_GECKO) {
						var processed = input.dataset.processed;
						if (input.value != processed) {
							input.value = processed;
							var pos = input.dataset.pos - 0;
							input.selectionStart = pos;
							input.selectionEnd = pos;
						}
					}
					delete input.dataset.processed;
					delete input.dataset.pos;

					if (input.value != input.dataset.current) {
						processInputSupplement(r.e);
					}

					cursor.update({focused:true, visible:true});
				}, 1);
			}
			else {
				if (r.code >= 1) {
					lineInputHistories.isInitial = true;
					insertToLineInput(lineInputInfo, r.letter);
				}
				yield processInputSupplement(r.e);
			}
		}

		if (!isCompleteResetCanceled) {
			completer.reset();
		}

		input.dataset.processed = input.value;
		input.dataset.pos = input.selectionStart;

		return r;
	}
};

/*
 * command mode mapping <<<1
 * ----------------
 */

const commandMap = {
	// internal special
	'*nop*':function () {return true},
	'*macro-end*': function () {
		if (executingMacroInfo.length) {
			if (executingMacroInfo[0].count > 1) {
				executingMacroInfo[0].count--;
				executeViCommand(executingMacroInfo[0].command);
			}
			else {
				executingMacroInfo.shift();
			}
		}
	},

	// escape
	'\u001b':function () {return inputEscape()},

	// digits
	'1':inputDigit, '2':inputDigit, '3':inputDigit, '4':inputDigit, '5':inputDigit,
	'6':inputDigit, '7':inputDigit, '8':inputDigit, '9':inputDigit,

	// register specifier
	'"':{
		command:function (c, o) {
			if (prefixInput.isEmpty) {
				prefixInput.register = c;
				requestInputMode('wait_register');
				requestShowPrefixInput(_('{0}: register [{1}]', o.e.key, registers.readableList));
			}
			else {
				inputEscape(o.e.key);
			}
		},
		bound:function (c, o) {return this['"'].command.apply(this, arguments)},
		bound_line:function (c, o) {return this['"'].command.apply(this, arguments)},
		wait_register:function (c, o) {
			prefixInput.appendRegister(c);
			requestShowPrefixInput();
			if (registers.isClipboard(c)) {
				return getClipboard();
			}
			else if (c == '=') {
				requestInputMode('line_input', {
					modeOpts:{
						prefix:_('expr:'),
						historyName:'e',
					},
					overrides:{
						mapkey:o.key + c
					}
				});
			}
		},
	},
	'"=':{
		$line_input_notify:function (c) {
			var r = expr(c);
			var message;
			if ('error' in r) {
				message = r.error;
			}
			else if ('result' in r) {
				message = r.result;
			}
			else {
				message = _('Empty');
			}
			notifier.register(message, 1000 * 60);
		},
		$line_input_escape:function (c) {
			notifier.hide();
		},
		line_input:function (c) {
			var r = expr(c);
			var data;
			if ('error' in r) {
				data = '';
			}
			else if ('result' in r) {
				data = r.result;
			}
			if (data != undefined) {
				registers.get('=').set(data);
			}
			notifier.hide();
		}
	},

	// tab
	'\u0009'/*tab*/:function (c, o) {
		quickActivation && notifyToParent('focus-changed', {direction:o.e.shift ? -1 : 1});
	},

	/*
	 * operators
	 */

	c:{
		command:operationDefault,
		$op:function (c) {
			if (isAlias(c)) {
				this._.apply(this, arguments);
			}
			if (isMotionErrored()) {
				return;
			}

			buffer.regalizeSelectionRelation();
			var origin = buffer.selectionStart;
			var adjusted = adjustDeleteOperationPos(
				isAlias(c) || isVerticalMotion,
				buffer.selectionEndRow - buffer.selectionStartRow + 1);
			var isLineOrient = adjusted.isLineOrient;
			var actualCount = adjusted.actualCount;

			editLogger.open('change op');

			buffer.isLineOrientSelection = isLineOrient;
			if (isLineOrient) {
				var selfIndent = buffer.getIndent(origin);
				buffer.selectionEnd = buffer.selectionStart;
				buffer.isLineOrientSelection = true;
				var deleted = reportSave(function () {
					yank(actualCount);
					return deleteSelection();
				});
				if (deleted >= config.vars.report) {
					requestShowMessage(_('Changing {0} {line:0}.', deleted));
				}
				buffer.isLineOrientSelection = false;
				insertNewlineWithIndent(origin, selfIndent);
			}
			else {
				extendRightIfInclusiveMotion();
				yank(actualCount);
				deleteSelection();
			}

			isEditCompleted = true;
			requestSimpleCommandUpdate();
			return startEdit(c);
		}
	},
	d:{
		command:operationDefault,
		$op:function (c) {
			if (isAlias(c)) {
				this._.apply(this, arguments);
			}
			if (isMotionErrored()) {
				return;
			}

			buffer.regalizeSelectionRelation();
			var origin = buffer.selectionStart;
			var adjusted = adjustDeleteOperationPos(
				isAlias(c) || isVerticalMotion,
				buffer.selectionEndRow - buffer.selectionStartRow + 1);
			var isLineOrient = adjusted.isLineOrient;
			var actualCount = adjusted.actualCount;

			buffer.isLineOrientSelection = isLineOrient;
			if (isLineOrient) {
				buffer.selectionEnd = buffer.selectionStart;
			}
			else {
				extendRightIfInclusiveMotion();
			}

			var deleted = reportSave(function () {
				yank(actualCount);
				return deleteSelection();
			});

			if (isLineOrient) {
				origin.row = Math.min(origin.row, buffer.rowLength - 1);
				buffer.setSelectionRange(buffer.getLineTopOffset2(origin));

				if (deleted >= config.vars.report) {
					requestShowMessage(_('Deleted {0} {line:0}.', deleted));
				}
			}

			isEditCompleted = true;
			requestSimpleCommandUpdate();
			return true;
		}
	},
	y:{
		command:operationDefault,
		$op:function (c) {
			var ss = buffer.selectionStart;
			var se = buffer.selectionEnd;
			var origin = ss.lt(se) ? ss : se;

			if (isAlias(c)) {
				this._.apply(this, arguments);
			}
			if (isMotionErrored()) {
				return;
			}

			var isLineOrient = isAlias(c) || isVerticalMotion;

			buffer.isLineOrientSelection = isLineOrient;
			!isLineOrient && extendRightIfInclusiveMotion();
			yank();
			buffer.setSelectionRange(origin);
			requestSimpleCommandUpdate();
			return true;
		}
	},
	'<':{
		command:operationDefault,
		$op:function (c, o) {
			if (isAlias(c)) {
				this._.apply(this, arguments);
			}
			if (isMotionErrored()) {
				return;
			}

			buffer.regalizeSelectionRelation();
			var isLineOrient = isAlias(c) || isVerticalMotion;
			var actualCount = buffer.selectionEndRow - buffer.selectionStartRow + 1;

			// special shift behavior followed vim.
			if (!isLineOrient && buffer.selectionEndCol == 0 && actualCount > 1) {
				actualCount--;
				buffer.selectionEnd = buffer.leftClusterPos(buffer.selectionEnd);
			}

			(o.key == '<' ? unshift : shift)(actualCount, 1);
			buffer.setSelectionRange(buffer.getLineTopOffset2(buffer.selectionStart));
			isVerticalMotion = true;
			prefixInput.motion = c;
			requestSimpleCommandUpdate();
			return true;
		}
	},
	'>':{
		command:operationDefault,
		$op:function () {
			return this['<'].$op.apply(this, arguments);
		}
	},
	ys:{
		$op:function (c, o) {
			if (isMotionErrored()) {
				return;
			}
			requestInputMode('line_input', {
				modeOpts:{
					prefix:_('surround with:'),
					historyName:'s'
				},
				overrides:{mapkey:prefixInput.operation}
			});
			return false;
		},
		$line_input_notify:function (c, o) {return this.s[o.subkey].apply(this, arguments)},
		line_input:function (c, o) {
			var prefix = $('wasavi_footer_input').dataset.internalPrefix;
			var isMultiline =
				/S$/.test(prefixInput.operation)
				|| isVerticalMotion
				|| surrounding.isLinewiseTagPrefix(prefix);

			if (isVerticalMotion) {
				buffer.setSelectionRange(
					buffer.getLineTopOffset2(buffer.selectionStart),
					buffer.getLineTailOffset(buffer.selectionEnd));
			}

			var result = surrounding.insert(
				adjustSurroundingInput(c), isMultiline);
			if (result) {
				requestSimpleCommandUpdate(prefixInput.toString());
			}
			else {
				inputEscape('surrounding');
			}
			prefixInput.reset();
			return true;
		}
	},
	yS:{
		$op:function (c, o) {return this.ys.$op.apply(this, arguments)},
		$line_input_notify:function (c, o) {return this.s.$line_input_notify.apply(this, arguments)},
		line_input:function (c, o) {return this.ys.line_input.apply(this, arguments)}
	},

	/*
	 * operator shortcuts
	 */

	// change to the end of the line (equivalents to c$)
	C:function (c, o) {
		if (!prefixInput.isEmptyOperation) {
			return inputEscape(o.e.key);
		}
		this.$('');
		prefixInput.operation = c;
		isVerticalMotion = false;
		return this.c.$op.call(this, '');
	},
	// delete the characters to the end of the line (equivalents to d$)
	D:function (c, o) {
		if (!prefixInput.isEmptyOperation) {
			return inputEscape(o.e.key);
		}
		this.$('');
		prefixInput.operation = c;
		isVerticalMotion = false;
		return this.d.$op.call(this, '');
	},
	// yank the lines (equivalents to yy)
	Y:function (c, o) {
		if (!prefixInput.isEmptyOperation) {
			return inputEscape(o.e.key);
		}
		this._('');
		prefixInput.operation = c;
		isVerticalMotion = true;
		return this.y.$op.call(this, '');
	},

	/*
	 * motions
	 */

	// backwards lines, to first non-white character
	'-':function (c, o) {
		var n = buffer.selectionStart;
		if (n.row == 0) {
			return inputEscape(o.e.key);
		}
		n.row = Math.max(n.row - prefixInput.count, 0);
		buffer.selectionStart = buffer.getLineTopOffset2(n);
		isVerticalMotion = true;
		prefixInput.motion = c;
		return true;
	},
	'+':function (c, o) {
		var n = buffer.selectionEnd;
		if (n.row >= buffer.rowLength - 1) {
			return inputEscape(o.e.key);
		}
		n.row = Math.min(n.row + prefixInput.count, buffer.rowLength - 1);
		buffer.selectionEnd = buffer.getLineTopOffset2(n);
		isVerticalMotion = true;
		prefixInput.motion = c;
		return true;
	},
	// jump to fist non-blank position on current line
	'^':function (c) {
		return (isDenotativeState() ? motionLineStartDenotative : motionLineStart)(c, false);
	},
	'<home>':function () {
		return this['^'].apply(this, arguments);
	},
	// jump to end of line
	$:function (c) {
		if (isDenotativeState()) {
			prefixInput.count > 1 && motionUpDownDenotative(c, prefixInput.count - 1, true);
			return motionLineEndDenotative(c, false);
		}
		var count = Math.min(prefixInput.count, buffer.rowLength - buffer.selectionStartRow);
		count > 1 && motionDown(c, count - 1);
		return motionLineEnd(c, false);
	},
	'<end>':function () {return this.$.apply(this, arguments)},
	// jump to matching <, (, {, or [
	'%':function (c, o) {
		var pos;
		if (prefixInput.isCountSpecified) {
			var count = prefixInput.count;
			if (0 <= count && count <= 100) {
				count = Math.floor(buffer.rowLength * (count / 100));
				count = minmax(0, count, buffer.rowLength - 1);
				pos = buffer.getLineTopOffset2(new Position(count, 0));
				isVerticalMotion = true;
			}
		}
		else {
			pos = searchUtils.findMatchedBracket(1);
		}
		if (!pos) {
			return inputEscape(o.e.key);
		}
		prefixInput.motion = c;
		marks.setJumpBaseMark();
		buffer.extendSelectionTo(pos);
		invalidateIdealWidthPixels();
		isSmoothScrollRequested = true;
		return true;
	},
	// direct jump to specified column
	'|':function (c) {
		var n = buffer.getClosestOffsetToPixels(
			new Position(buffer.selectionStartRow, 0),
			charWidth * (prefixInput.count - 1));
		buffer.extendSelectionTo(n);
		prefixInput.motion = c;
		invalidateIdealWidthPixels();
		return true;
	},
	// invert of last find
	',':function (c) {
		prefixInput.motion = c;
		var result = false;
		switch (lastHorzFindCommand.direction) {
		case -1:
			result = motionFindForward(
				lastHorzFindCommand.letter,
				prefixInput.count,
				lastHorzFindCommand.stopBefore,
				true);
			lastHorzFindCommand.direction *= -1;
			break;
		case 1:
			result = motionFindBackward(
				lastHorzFindCommand.letter,
				prefixInput.count,
				lastHorzFindCommand.stopBefore,
				true);
			lastHorzFindCommand.direction *= -1;
			break;
		}
		return result;
	},
	// repeat last find
	';':function (c) {
		prefixInput.motion = c;
		var result = false;
		switch (lastHorzFindCommand.direction) {
		case -1:
			result = motionFindBackward(
				lastHorzFindCommand.letter,
				prefixInput.count,
				lastHorzFindCommand.stopBefore,
				true);
			break;
		case 1:
			result = motionFindForward(
				lastHorzFindCommand.letter,
				prefixInput.count,
				lastHorzFindCommand.stopBefore,
				true);
			break;
		}
		return result;
	},
	// down, line orient
	_:function (c) {
		var count = Math.min(prefixInput.count, buffer.rowLength - buffer.selectionStartRow);
		count > 1 && motionDown(c, count - 1);
		buffer.extendSelectionTo(buffer.getLineTopOffset2(buffer.selectionEnd));
		prefixInput.motion = c;
		isVerticalMotion = true;
		return true;
	},
	// search forward
	'/':{
		command:function (c) {
			prefixInput.motion = c;
			requestInputMode('line_input', {
				modeOpts:{
					prefix:c,
					historyName:'/'
				}
			});
			lastRegexFindCommand.push({
				head:c,
				direction:c == '/' ? 1 : -1,
				offset:buffer.selectionStart,
				scrollTop:buffer.scrollTop,
				scrollLeft:buffer.scrollLeft,
				updateBound:isBound(inputMode) && inputMode
			});
		},
		bound:function (c, o) {return this['/'].command.apply(this, arguments)},
		bound_line:function (c, o) {return this['/'].command.apply(this, arguments)},
		line_input:function (c, o) {
			function doFind (pattern) {
				var r = motionFindByRegexFacade(
					pattern,
					prefixInput.count,
					o.key == '/' ? 1 : -1,
					lastRegexFindCommand.verticalOffset);

				if (r && lastRegexFindCommand.updateBound) {
					extendBound(
						o.key == '/' ? buffer.selectionEnd : buffer.selectionStart,
						lastRegexFindCommand.updateBound);
				}

				return r;
			}

			if (c != '') {
				lastRegexFindCommand.setPattern(c, true);
				registers.set('/', lastRegexFindCommand.pattern, false);
				c = lastRegexFindCommand.pattern;
			}
			else {
				if (!registers.exists('/') || (c = registers.get('/').data) == '') {
					requestShowMessage(_('No previous search pattern.'), true);
					return true;
				}
			}

			lineInputHistories.push(c);

			if (/\\M/.test(c)) {
				return new Promise(resolve => {
					chrome.extension.sendMessage(
						Wasavi.MIGEMO_EXTENSION_ID,
						{
							action: Wasavi.MIGEMO_GET_REGEXP_STRING,
							query: c.replace(/\\M/g, '')
						},
						response => {
							if (chrome.extension.lastError) {
								requestShowMessage(_('Can not communicate with Migemo server.'), true);
								resolve(true);
							}
							else {
								lastRegexFindCommand.internalRegex = {
									pattern: c,
									regex: new RegExp(response.result, 'g')
								};
								resolve(doFind(lastRegexFindCommand.internalRegex));
							}
						}
					);
				});
			}
			else {
				return doFind(c);
			}
		},
		$line_input_notify:function (c, o) {
			lastRegexFindCommand.setPattern(c, true);

			function doFind (pattern) {
				let finder = o.key == '/' ? motionFindByRegexForward : motionFindByRegexBackward;
				let r = finder(pattern);
				if (!r) return;

				buffer.setSelectionRange(r.offset, r.offset + r.matchLength);
				cursor.ensureVisible();
				lastRegexFindCommand.updateBound && extendBound(
					buffer.selectionStart, lastRegexFindCommand.updateBound);
				buffer.emphasis(undefined, r.matchLength);
			}

			if (!config.vars.searchincr) return;

			if (/\\M/.test(c)) {
				return new Promise(resolve => {
					chrome.extension.sendMessage(
						Wasavi.MIGEMO_EXTENSION_ID,
						{
							action: Wasavi.MIGEMO_GET_REGEXP_STRING,
							query: c.replace(/\\M/g, '')
						},
						response => {
							if (chrome.extension.lastError) {
								notifier.show(_('Can not communicate with Migemo server.'));
								resolve();
							}
							else {
								resolve(doFind({
									pattern: c,
									regex: new RegExp(response.result, 'g')
								}));
							}
						}
					);
				});
			}
			else {
				return doFind(lastRegexFindCommand.pattern);
			}
		},
		$line_input_reset:function (c) {
			buffer.unEmphasis();
			buffer.setSelectionRange(lastRegexFindCommand.offset);
			lastRegexFindCommand.updateBound && extendBound(
				buffer.selectionStart, lastRegexFindCommand.updateBound);
			buffer.scrollTop = lastRegexFindCommand.scrollTop;
			buffer.scrollLeft = lastRegexFindCommand.scrollLeft;
		},
		$line_input_escape:function (c) {
			buffer.unEmphasis();
			buffer.setSelectionRange(lastRegexFindCommand.offset);
			lastRegexFindCommand.updateBound && extendBound(
				buffer.selectionStart, lastRegexFindCommand.updateBound);
			buffer.scrollTop = lastRegexFindCommand.scrollTop;
			buffer.scrollLeft = lastRegexFindCommand.scrollLeft;
			cursor.ensureVisible();
		}
	},
	// search backward
	'?':{
		command:function (c, o) {return this['/'][o.subkey].apply(this, arguments)},
		bound:function (c, o) {return this['/'][o.subkey].apply(this, arguments)},
		bound_line:function (c, o) {return this['/'][o.subkey].apply(this, arguments)},
		line_input:function (c, o) {return this['/'][o.subkey].apply(this, arguments)},
		$line_input_notify:function (c, o) {return this['/'][o.subkey].apply(this, arguments)},
		$line_input_reset:function (c, o) {return this['/'][o.subkey].apply(this, arguments)},
		$line_input_escape:function (c, o) {return this['/'][o.subkey].apply(this, arguments)}
	},
	// return to line specified by following mark, first white position on line, line orient motion
	"'":{
		command:function (c, o) {
			prefixInput.motion = c;
			requestInputMode('wait_a_letter');
			requestShowPrefixInput(_('{0}: return to mark', o.e.key));
		},
		bound:function (c, o) {return this["'"].command.apply(this, arguments)},
		bound_line:function (c, o) {return this["'"].command.apply(this, arguments)},
		wait_a_letter:function (c, o) {
			prefixInput.appendMotion(c);
			var offset = marks.get(c);
			if (offset != undefined) {
				if ('\'`[]'.indexOf(c) >= 0) {
					marks.setJumpBaseMark();
				}
				var clusters = buffer.getGraphemeClusters(offset);
				var clusterIndex = clusters.getClusterIndexFromUTF16Index(offset.col);
				clusterIndex = minmax(0, clusterIndex, clusters.length);
				offset.col = clusters.rawIndexAt(clusterIndex);
				if (o.key == "'") {
					buffer.extendSelectionTo(buffer.getLineTopOffset2(offset));
					isVerticalMotion = true;
					invalidateIdealWidthPixels();
				}
				else {
					buffer.extendSelectionTo(offset);
				}
				isSmoothScrollRequested = true;
				return true;
			}
			else {
				c != '\u001b' && requestShowMessage(_('Mark {0} is not set.', c), true);
				return inputEscape(o.e.key);
			}
		}
	},
	// return to marked line at remembered column, character orient motion
	'`':{
		command:function (c, o) {return this["'"][o.subkey].apply(this, arguments)},
		bound:function (c, o) {return this["'"][o.subkey].apply(this, arguments)},
		bound_line:function (c, o) {return this["'"][o.subkey].apply(this, arguments)},
		wait_a_letter:function (c, o) {return this["'"][o.subkey].apply(this, arguments)}
	},
	// back an sentence
	'(':function (c, o) {
		prefixInput.motion = c;
		var pos = searchUtils.findSentenceBoundary(prefixInput.count, o.key == ')', true);
		if (!pos) {
			return inputEscape(prefixInput.motion);
		}
		marks.setJumpBaseMark();
		if (o.key == '(') {
			buffer.selectionStart = pos;
		}
		else {
			buffer.selectionEnd = pos;
		}
		return true;
	},
	// forward an sentence
	')':function () {return this['('].apply(this, arguments)},
	// back a paragraph
	'{':function (c, o) {
		prefixInput.motion = c;
		var pos = searchUtils.findParagraphBoundary(prefixInput.count, o.key == '}', true);
		if (!pos) {
			return inputEscape(prefixInput.motion);
		}
		marks.setJumpBaseMark();
		if (o.key == '{') {
			buffer.selectionStart = pos;
		}
		else {
			buffer.selectionEnd = pos;
		}
		isVerticalMotion = prefixInput.isEmptyOperation;
		return true;
	},
	// forward a paragraph
	'}':function () {return this['{'].apply(this, arguments)},
	// move to previous section
	'[':{
		command:function (c) {
			prefixInput.motion = c;
			requestInputMode('wait_a_letter');
			requestShowPrefixInput();
		},
		bound:function (c, o) {return this['['].command.apply(this, arguments)},
		bound_line:function (c, o) {return this['['].command.apply(this, arguments)},
		wait_a_letter:function (c) {
			if (c != prefixInput.motion) {
				return inputEscape(prefixInput.motion);
			}
			prefixInput.appendMotion(c);
			var pos = searchUtils.findParagraphBoundary(
				prefixInput.count, false, true, '{', false);
			if (!pos) {
				return;
			}
			marks.setJumpBaseMark();
			buffer.selectionStart = buffer.getLineTopOffset2(pos);
			isVerticalMotion = prefixInput.isEmptyOperation;
			return true;
		}
	},
	// move to next section
	']':{
		command:function (c, o) {return this['['][o.subkey].apply(this, arguments)},
		bound:function (c, o) {return this['['][o.subkey].apply(this, arguments)},
		bound_line:function (c, o) {return this['['][o.subkey].apply(this, arguments)},
		wait_a_letter:function (c) {
			if (c != prefixInput.motion) {
				return inputEscape(prefixInput.motion);
			}
			prefixInput.appendMotion(c);
			var pos = searchUtils.findParagraphBoundary(
				prefixInput.count, true, true, '{', !prefixInput.isEmptyOperation);
			if (!pos) {
				return;
			}
			marks.setJumpBaseMark();
			buffer.selectionEnd = buffer.getLineTopOffset2(pos);
			isVerticalMotion = prefixInput.isEmptyOperation;
			return true;
		}
	},
	'\u000d'/*enter*/:function () {return this['+'].apply(this, arguments)},
	'0':function (c) {
		if (prefixInput.count1 == '' && prefixInput.count2 == '') {
			return motionLineStart(c, true);
		}
		else {
			return inputDigit(c);
		}
	},
	j:function (c) {
		return callDenotativeFunction(c, prefixInput.count, true);
	},
	'\u000e'/*^N*/:function () {return this.j.apply(this, arguments)},
	'<down>':function () {return this.j.apply(this, arguments)},
	'<A-N>':function () {return this.j.apply(this, arguments)},
	k:function (c) {
		return callDenotativeFunction(c, prefixInput.count);
	},
	'\u0010'/*^P*/:function () {return this.k.apply(this, arguments)},
	'<up>':function () {return this.k.apply(this, arguments)},
	h:function (c) {
		return motionLeft(c, prefixInput.count);
	},
	'<left>':function () {return this.h.apply(this, arguments)},
	'\u0008'/*^H*/:function () {return this.h.apply(this, arguments)},
	l:function (c) {
		return motionRight(c, prefixInput.count);
	},
	' ':function (c, o) {return this[o.e.shift ? 'h' : 'l'].apply(this, arguments)},
	'<right>':function () {return this.l.apply(this, arguments)},
	w:function (c, o) {
		if (prefixInput.operation == 'c'
		&& !spc('S').test(buffer.charAt(buffer.selectionStart))) {
			motionNextWord(c, prefixInput.count, o.key == 'W', true);
			if (!buffer.isNewline(buffer.selectionEnd)) {
				buffer.selectionEnd = buffer.rightClusterPos(buffer.selectionEnd);
			}
			return true;
		}
		else {
			return motionNextWord(c, prefixInput.count, o.key == 'W');
		}
	},
	W:function () {return this.w.apply(this, arguments)},
	b:function (c, o) {
		motionPrevWord(c, prefixInput.count, o.key == 'B');
		if (prefixInput.operation == 'c' && buffer.selectionEndCol == 0) {
			buffer.selectionEnd = buffer.leftClusterPos(buffer.selectionEnd);
		}
		return true;
	},
	B:function () {return this.b.apply(this, arguments)},
	e:function (c, o) {
		return motionNextWord(c, prefixInput.count, o.key == 'E', true);
	},
	E:function () {return this.e.apply(this, arguments)},
	H:function (c) {
		var v = getCurrentViewPositionIndices();
		var index = Math.min(v.top + prefixInput.count - 1, v.bottom, buffer.rowLength - 1);
		marks.setJumpBaseMark();
		buffer.extendSelectionTo(buffer.getLineTopOffset2(index, 0));
		isVerticalMotion = true;
		invalidateIdealWidthPixels();
		prefixInput.motion = c;
		return true;
	},
	M:function (c) {
		var v = getCurrentViewPositionIndices();
		var index = Math.floor((v.top + v.bottom) / 2);
		marks.setJumpBaseMark();
		buffer.extendSelectionTo(buffer.getLineTopOffset2(index, 0));
		isVerticalMotion = true;
		invalidateIdealWidthPixels();
		prefixInput.motion = c;
		return true;
	},
	L:function (c) {
		var v = getCurrentViewPositionIndices();
		var index = Math.max(v.bottom - prefixInput.count + 1, v.top, 0);
		marks.setJumpBaseMark();
		buffer.extendSelectionTo(buffer.getLineTopOffset2(index, 0));
		isVerticalMotion = true;
		invalidateIdealWidthPixels();
		prefixInput.motion = c;
		return true;
	},
	G:function (c) {
		var index = prefixInput.isCountSpecified ?
			minmax(1, prefixInput.count, buffer.rowLength) : buffer.rowLength;
		var n = new Position(index - 1, 0);

		marks.setJumpBaseMark();
		isVerticalMotion = true;
		prefixInput.motion = c;

		if (prefixInput.isEmptyOperation) {
			buffer.setSelectionRange(buffer.getLineTopOffset2(n));
			invalidateIdealWidthPixels();

			var node = buffer.rowNodes(n);
			var viewHeightHalf = parseInt((buffer.elm.clientHeight - lineHeight) / 2);

			return scroller.run(Math.max(0, node.offsetTop - viewHeightHalf));
		}
		else {
			buffer.extendSelectionTo(buffer.getLineTopOffset2(n));
			invalidateIdealWidthPixels();
			return true;
		}
	},
	f:{
		command:function (c, o) {
			prefixInput.motion = c;
			requestInputMode('wait_a_letter');
			requestShowPrefixInput(
				o.key == 'f' || o.key == 't' ?
					_('{0}: find forward', o.e.key) :
					_('{0}: find backward', o.e.key)
			);
		},
		bound:function (c, o) {return this.f.command.apply(this, arguments)},
		bound_line:function (c, o) {return this.f.command.apply(this, arguments)},
		wait_a_letter:function (c, o) {
			prefixInput.trailer = c;
			return (o.key == 'f' || o.key == 't' ? motionFindForward : motionFindBackward)
				(c, prefixInput.count, o.key == 't' || o.key == 'T');
		}
	},
	F:{
		command:function (c, o) {return this.f[o.subkey].apply(this, arguments)},
		bound:function (c, o) {return this.f[o.subkey].apply(this, arguments)},
		bound_line:function (c, o) {return this.f[o.subkey].apply(this, arguments)},
		wait_a_letter:function (c, o) {return this.f[o.subkey].apply(this, arguments)}
	},
	t:{
		command:function (c, o) {return this.f[o.subkey].apply(this, arguments)},
		bound:function (c, o) {return this.f[o.subkey].apply(this, arguments)},
		bound_line:function (c, o) {return this.f[o.subkey].apply(this, arguments)},
		wait_a_letter:function (c, o) {return this.f[o.subkey].apply(this, arguments)}
	},
	T:{
		command:function (c, o) {return this.f[o.subkey].apply(this, arguments)},
		bound:function (c, o) {return this.f[o.subkey].apply(this, arguments)},
		bound_line:function (c, o) {return this.f[o.subkey].apply(this, arguments)},
		wait_a_letter:function (c, o) {return this.f[o.subkey].apply(this, arguments)}
	},
	// search next match for current pattern
	n:function (c, o) {
		if (!registers.exists('/')) {
			requestShowMessage(_('No previous search pattern.'), true);
			return;
		}

		prefixInput.motion = c;
		isSmoothScrollRequested = true;

		let regex = lastRegexFindCommand.internalRegex || lastRegexFindCommand.pattern;
		let isForward = o.key != 'N';
		let dir = lastRegexFindCommand.direction * (isForward ? 1 : -1);
		let result = motionFindByRegexFacade(regex, prefixInput.count, dir);

		requestNotice((isForward ? '/' : '?') + lastRegexFindCommand.pattern);

		return result;
	},
	// search previous match for current pattern
	N:function () {return this.n.apply(this, arguments)},
	// search current word
	'*':function (c, o) {
		var ss1 = buffer.selectionStart;
		var se1 = buffer.selectionEnd;
		var ss2, se2, word;

		var message = false;
		try {
			if (!searchUtils.dispatchRangeSymbol(1, 'w', false)) {
				message = 'Unknown error: cannot retreive word boundary.';
				return;
			}

			word = regexConverter.toLiteralString(buffer.getSelection());
			if (word == '') {
				message = _('No word under the cursor.');
				return;
			}

			ss2 = buffer.selectionStart;
			se2 = buffer.selectionEnd;
			if (ss1.row != ss2.row) {
				message = _('No word under the cursor.');
				return;
			}
		}
		finally {
			if (isString(message)) {
				buffer.setSelectionRange(ss1, se1);
				requestShowMessage(message, true);
				return inputEscape(o.e.key);
			}
		}

		var direction, offset;
		if (o.key == '*') {
			buffer.setSelectionRange(ss1, buffer.leftClusterPos(se2));
			direction = 1;
			offset = buffer.selectionEnd;
		}
		else {
			buffer.setSelectionRange(ss2, se1);
			direction = -1;
			offset = buffer.selectionStart;
		}

		var iskeyword = config.vars.iskeyword;
		if (iskeyword.test(word.charAt(0))) {
			word = '\\<' + word;
		}
		if (iskeyword.test(word.substr(-1))) {
			word += '\\>';
		}

		registers.get('/').set(word);
		lastRegexFindCommand.setPattern(word);
		lastRegexFindCommand.push({
			head:c,
			direction:direction,
			offset:offset,
			scrollTop:buffer.scrollTop,
			scrollLeft:buffer.scrollLeft,
			updateBound:!!isBound(inputMode)
		});
		return this.n.apply(this, arguments);
	},
	'#':function () {return this['*'].apply(this, arguments)},

	/*
	 * scrollers (independent motions)
	 */

	// scroll up half (height of screen) lines
	'\u0015'/*^U*/:function (c, o) {
		if (!prefixInput.isEmptyOperation) {
			return inputEscape(o.e.key);
		}
		var dir = o.key == '\u0015' ? -1 : 1;
		return scrollView(c, function (v) {
			if (config.vars.scroll > 0) {
				return dir * config.vars.scroll * prefixInput.count;
			}
			else {
				return dir * parseInt(v.lines / 2) * prefixInput.count;
			}
		});
	},
	// scroll down half (height of screen) lines
	'\u0004'/*^D*/:function () {return this['\u0015'].apply(this, arguments)},
	// scroll up 1 line
	'\u0019'/*^Y*/:function (c, o) {
		if (!prefixInput.isEmptyOperation) {
			return inputEscape(o.e.key);
		}
		var ss = config.vars.smooth;
		var dir = o.key == '\u0019' ? -1 : 1;
		config.vars.smooth = false;
		try {
			return scrollView(c, dir * prefixInput.count);
		}
		finally {
			config.vars.smooth = ss;
		}
	},
	// scroll down 1 line
	'\u0005'/*^E*/:function () {return this['\u0019'].apply(this, arguments)},
	// scroll up (height of screen - 2) lines
	'\u0002'/*^B*/:function (c, o) {
		if (!prefixInput.isEmptyOperation) {
			return inputEscape(o.e.key);
		}
		var dir = (o.key == '\u0002' || o.key == '<pageup>') ? -1 : 1;
		return scrollView(c, function (v) {
			return dir * Math.max(v.lines - 2, 1) * prefixInput.count;
		});
	},
	'<pageup>':function () {return this['\u0002'].apply(this, arguments)},
	// scroll down (height of screen - 2) lines
	'\u0006'/*^F*/:function () {return this['\u0002'].apply(this, arguments)},
	'<pagedown>':function () {return this['\u0002'].apply(this, arguments)},
	// screen adjustment
	//   z<CR> (top of the screen)
	//   z.    (center of the screen)
	//   zz
	//   z-    (bottom of the screen)
	z:{
		command:function (c, o) {
			if (!prefixInput.isEmptyOperation) {
				return inputEscape(o.e.key);
			}
			prefixInput.operation = c;
			requestInputMode('wait_a_letter');
			requestShowPrefixInput(_('{0}: screen adjustment', o.e.key));
		},
		bound:function (c, o) {return this.z.command.apply(this, arguments)},
		bound_line:function (c, o) {return this.z.command.apply(this, arguments)},
		wait_a_letter:function (c) {
			prefixInput.motion = c;
			return true;
		},
		$op:function (c) {
			var motion = prefixInput.motion;
			var line = prefixInput.isCountSpecified ?
				minmax(1, prefixInput.count, buffer.rowLength) - 1 :
				buffer.selectionStartRow;
			var current = buffer.rowNodes(line).offsetTop;
			var n = new Position(line, 0);

			if (prefixInput.isCountSpecified) {
				marks.setJumpBaseMark();
			}
			if (motion == prefixInput.operation) {
				motion = '.';
			}

			switch (motion) {
			case '\u000d':
				buffer.scrollLeft = 0;
				buffer.setSelectionRange(buffer.getLineTopOffset2(n));
				invalidateIdealWidthPixels();
				return scroller.run(current);

			case '.':
				buffer.scrollLeft = 0;
				var dest = Math.max(current - parseInt((buffer.elm.clientHeight - lineHeight) / 2), 0);
				buffer.setSelectionRange(buffer.getLineTopOffset2(n));
				invalidateIdealWidthPixels();
				return scroller.run(dest);

			case '-':
				buffer.scrollLeft = 0;
				var dest = Math.max(current - (buffer.elm.clientHeight - lineHeight), 0);
				buffer.setSelectionRange(buffer.getLineTopOffset2(n));
				invalidateIdealWidthPixels();
				return scroller.run(dest);

			default:
				requestShowMessage(_('Unknown adjust command.'), true);
				break;
			}
		}
	},

	/*
	 * g prefixes
	 */

	g:{
		command:function (c) {
			requestInputMode('wait_a_letter');
			requestShowPrefixInput(prefixInput.operation + c);
		},
		wait_a_letter:function (c, o) {
			var result = false;
			switch (c) {
			case 'a':// individual command
				if (!prefixInput.isEmptyOperation) {
					return inputEscape(o.e.key);
				}
				var clusters = buffer.getGraphemeClusters();
				var index = clusters.getClusterIndexFromUTF16Index(buffer.selectionStartCol);
				var codePoints = clusters.codePointsAt(index)
					.map(cp => Unistring.getCodePointString(toNativeControl(cp).charCodeAt(0), 'unicode'))
					.join(' ');

				requestShowMessage(
					'"' + toVisibleControl(clusters.rawStringAt(index)) + '"' +
					' ' + codePoints);
				break;

			case 'g':// motion
				var index = prefixInput.count;
				var n = new Position(index - 1, 0);

				marks.setJumpBaseMark();
				isVerticalMotion = true;
				prefixInput.motion = o.key + c;

				if (prefixInput.isEmptyOperation) {
					buffer.setSelectionRange(buffer.getLineTopOffset2(n));
					invalidateIdealWidthPixels();

					var node = buffer.rowNodes(n);
					var viewHeightHalf = parseInt((buffer.elm.clientHeight - lineHeight) / 2);

					result = scroller.run(Math.max(0, node.offsetTop - viewHeightHalf));
				}
				else {
					buffer.extendSelectionTo(buffer.getLineTopOffset2(n));
					invalidateIdealWidthPixels();
					result = true;
				}
				break;
			case 'i':// individual command
				if (!prefixInput.isEmptyOperation) {
					return inputEscape(o.e.key);
				}
				var m = inputHandler.getStartPosition();
				if (m) {
					buffer.setSelectionRange(m);
					editLogger.open('edit-wrapper');
					result = startEdit(c);
				}
				else {
					requestShowMessage(_('Last inputted position is undefined.'), true);
					result = true;
				}
				prefixInput.motion = o.key + c;
				break;
			case 'j':// motion
				prefixInput.motion = o.key + c;
				result = this.j.apply(this, arguments);
				break;
			case 'k':// motion
				prefixInput.motion = o.key + c;
				result = this.k.apply(this, arguments);
				break;
			case '^':// motion
				prefixInput.motion = o.key + c;
				result = this['^'].apply(this, arguments);
				break;
			case '$':// motion
				prefixInput.motion = o.key + c;
				result = this['$'].apply(this, arguments);
				break;
			case 'q':// operator
			case 'u':
			case 'U':
				result = operationDefault(o.key + c, o);
				break;
			case 'v':// individual command
				if (!prefixInput.isEmptyOperation) {
					return inputEscape(o.e.key);
				}
				var m1 = marks.get('<');
				var m2 = marks.get('>');
				if (m1 && m2) {
					requestInputMode(lastBoundMode == 'V' ? 'bound_line' : 'bound');
					marks.setPrivate('<', m1);
					marks.setPrivate('>', m2);
					buffer.setSelectionRange(m2);
					recordedStrokes.add('bound').strokes = o.key + c;
				}
				else {
					requestShowMessage(_('Last bound is undefined.'), true);
				}
				result = true;
				prefixInput.motion = o.key + c;
				break;
			default:
				requestShowMessage(_('Unknown g-prefixed command: {0}', c), true);
				result = true;
				break;
			}
			return result;
		}
	},
	gq:{
		$op:function (c) {
			if (isAlias(c, prefixInput.operation.substring(1))) {
				this._.apply(this, arguments);
			}
			if (requestedState.notice) {
				return;
			}

			buffer.regalizeSelectionRelation();
			var adjusted = adjustDeleteOperationPos(
				isAlias(c, prefixInput.operation.substring(1)) || isVerticalMotion,
				buffer.selectionEndRow - buffer.selectionStartRow + 1);
			!adjusted.isLineOrient && extendRightIfInclusiveMotion();
			buffer.setSelectionRange(reformat());
			requestSimpleCommandUpdate();
			return true;
		}
	},
	gu:{
		$op:function (c) {
			if (isAlias(c, prefixInput.operation.substring(1))) {
				this._.apply(this, arguments);
			}
			if (requestedState.notice) {
				return;
			}

			buffer.regalizeSelectionRelation();
			var origin = buffer.selectionStart;
			var adjusted = adjustDeleteOperationPos(
				isAlias(c, prefixInput.operation.substring(1)) || isVerticalMotion,
				buffer.selectionEndRow - buffer.selectionStartRow + 1);
			if (adjusted.isLineOrient) {
				motionLineStart();
				motionLineEnd();
			}
			else {
				extendRightIfInclusiveMotion();
			}
			unifyCase(1, prefixInput.operation.charAt(1) == 'U', true);
			if (adjusted.isLineOrient) {
				buffer.setSelectionRange(buffer.getLineTopOffset2(origin));
			}
			else {
				buffer.setSelectionRange(origin);
			}
			requestSimpleCommandUpdate();
			return true;
		}
	},
	gU:{
		$op:function (c) {
			return this.gu.$op.apply(this, arguments);
		}
	},

	/*
	 * input mode transitioners (or range symbols)
	 */

	a:{
		command:function (c, o) {
			if (prefixInput.isEmptyOperation) {
				requestSimpleCommandUpdate();
				editLogger.open('edit-wrapper');
				return startEdit(c, {
					isAppend:c == 'a',
					repeatCount:prefixInput.count});
			}
			prefixInput.motion = c;
			requestInputMode('wait_a_letter');
			requestShowPrefixInput(_('{0}: range symbol', o.e.key));
		},
		wait_a_letter:function (c, o) {
			var result = searchUtils.dispatchRangeSymbol(
				prefixInput.count, c, prefixInput.motion == 'a');
			if (!result) {
				return inputEscape(o.e.key);
			}
			prefixInput.appendMotion(c);
			return result;
		}
	},
	A:function (c, o) {
		if (!prefixInput.isEmptyOperation) {
			return inputEscape(o.e.key);
		}
		requestSimpleCommandUpdate();
		editLogger.open('edit-wrapper');
		return startEdit(c, {
			isAppend:c == 'A',
			isAlter:true,
			repeatCount:prefixInput.count});
	},
	i:{
		command:function (c, o) {return this.a[o.subkey].apply(this, arguments)},
		wait_a_letter:function (c, o) {return this.a[o.subkey].apply(this, arguments)}
	},
	I:function () {return this.A.apply(this, arguments)},
	R:function (c, o) {
		if (!prefixInput.isEmptyOperation || buffer.selected) {
			return inputEscape(o.e.key);
		}
		requestInputMode('overwrite', {callback:function () {
			prefixInput.isLocked = true;
			inputHandler.reset(prefixInput.count, '', buffer.selectionStart, true);
			editLogger.open('edit-wrapper');
		}});
		prefixInput.operation = c;
		requestSimpleCommandUpdate();
	},

	/*
	 * edit commands
	 */

	x:function (c, o) {
		if (!prefixInput.isEmptyOperation) {
			return inputEscape(o.e.key);
		}
		prefixInput.operation = c;
		requestSimpleCommandUpdate();
		return (o.key == 'x' || o.key == '\u007f' ?
			deleteCharsForward : deleteCharsBackward)(prefixInput.count, {yank:true});
	},
	'\u007f':function () {return this.x.apply(this, arguments)},
	X:function () {return this.x.apply(this, arguments)},
	p:function (c, o) {
		if (!prefixInput.isEmptyOperation) {
			return inputEscape(o.e.key);
		}
		prefixInput.operation = c;
		requestSimpleCommandUpdate();
		return paste(prefixInput.count, {
			isForward:o.key == 'p',
			register:prefixInput.register
		});
	},
	P:function () {return this.p.apply(this, arguments)},
	J:function (c, o) {
		if (!prefixInput.isEmptyOperation || buffer.selectionStartRow >= buffer.rowLength - 1) {
			return inputEscape(o.e.key);
		}
		prefixInput.operation = c;
		requestSimpleCommandUpdate();
		return joinLines(prefixInput.count);
	},
	'.':function (c, o) {
		// . command repeats the last
		// !, <, >, A, C, D, I, J, O, P, R, S, X, Y,
		//          a, c, d, i, o, p, r, s,    x, y,
		//          gq, gu, gU, ^A, ^X,
		// or ~ command.
		if (!prefixInput.isEmptyOperation) {
			return inputEscape(o.e.key);
		}
		if (lastSimpleCommand.length == 0) {
			return true;
		}
		if (prefixInput.isCountSpecified) {
			var p = new Wasavi.PrefixInput(lastSimpleCommand);
			lastSimpleCommand =
				p.register +
				prefixInput.count +
				p.operation +
				p.motion +
				p.trailer;
		}
		executeViCommand(lastSimpleCommand);
		lastSimpleCommand = lastSimpleCommand.replace(
			/^(")([1-8])/, function ($0, $1, $2) {return ($1 || '') + (parseInt($2, 10) + 1);});
		return true;
	},
	u:function (c, o) {
		if (!prefixInput.isEmptyOperation) {
			return /^g/.test(prefixInput.operation) ?
				true : inputEscape(o.e.key);
		}
		var result;
		if (config.vars.undolevels == 0) {
			result = (isUndoFlipped ? redo : undo)();
			isUndoFlipped = !isUndoFlipped;
		}
		else {
			result = undo(prefixInput.count);
		}
		return result;
	},
	'\u0012'/*^R*/:function (c, o) {
		if (!prefixInput.isEmptyOperation) {
			return inputEscape(o.e.key);
		}
		var result;
		if (config.vars.undolevels == 0) {
			result = (isUndoFlipped ? undo : redo)();
		}
		else {
			result = redo(prefixInput.count);
		}
		return result;
	},
	U:function (c, o) {
		if (!prefixInput.isEmptyOperation) {
			return /^g/.test(prefixInput.operation) ?
				true : inputEscape(o.e.key);
		}
		requestShowMessage(_('Not implemented.'), true);
		return true;
	},
	'~':function (c, o) {
		if (!prefixInput.isEmptyOperation || buffer.selected) {
			return inputEscape(o.e.key);
		}
		prefixInput.operation = c;
		requestSimpleCommandUpdate();
		return toggleCase(prefixInput.count);
	},
	// clear screen
	'\u000c'/*^L*/:function (c, o) {
		if (!prefixInput.isEmptyOperation) {
			return inputEscape(o.e.key);
		}
		notifyToParent('blink-me');
	},
	// display file information
	'\u0007'/*^G*/:function (c, o) {
		if (!prefixInput.isEmptyOperation) {
			return inputEscape(o.e.key);
		}
		requestShowMessage(getFileInfo());
	},
	// marks
	m:{
		command:function (c, o) {
			if (!prefixInput.isEmptyOperation) {
				return inputEscape(o.e.key);
			}
			prefixInput.operation = c;
			requestInputMode('wait_a_letter');
			requestShowPrefixInput(_('{0}: mark', o.e.key));
		},
		wait_a_letter:function (c) {
			prefixInput.trailer = c;
			if (!marks.isValidName(c)) {
				requestShowMessage(_('Invalid mark name.'), true);
			}
			marks.set(c, buffer.selectionStart);
			return true;
		}
	},
	// execute register contents as vi command
	'@':{
		command:function (c, o) {
			if (!prefixInput.isEmptyOperation) {
				return inputEscape(o.e.key);
			}
			prefixInput.operation = c;
			requestInputMode('wait_a_letter');
			requestShowPrefixInput(_('{0}: register [{1}]', o.e.key, registers.readableList));
		},
		wait_a_letter:function (c) {
			if (!registers.isReadable(c)) {
				requestShowMessage(_('Invalid register name: {0}', c), true);
				return inputEscape();
			}
			if (!registers.exists(c)) {
				requestShowMessage(_('Register {0} does not exist.', c), true);
				return inputEscape();
			}
			if (executingMacroInfo.some(i => i.register == c)) {
				requestShowMessage(_('Register {0} was used recursively.', c), true);
				return inputEscape();
			}

			var command = registers.get(c).data.replace(/^\n+|\n+$/g, '');
			if (command == '') {
				requestShowMessage(_('Register {0} is empty.', c), true);
				return inputEscape();
			}

			prefixInput.trailer = c;
			executingMacroInfo.unshift({
				count: prefixInput.count,
				register: c,
				command: command
			});
			executeViCommand(command);
			return true;
		}
	},
	// key stroke recorder
	q:{
		command:function (c, o) {
			if (!prefixInput.isEmptyOperation) {
				return /^g/.test(prefixInput.operation) ?
					true : inputEscape(o.e.key);
			}
			var rs = recordedStrokes.items('q');
			if (rs) {
				var stroke = rs.strokes.replace(/q$/, '');
				registers.get('"').locked = rs.register != '"';
				registers.set(rs.register, stroke);
				registers.get('"').locked = false;
				recordedStrokes.remove('q');
				return true;
			}
			requestInputMode('wait_a_letter');
			requestShowPrefixInput(_('{0}: record strokes', o.e.key));
		},
		wait_a_letter:function (c) {
			if (c =='\u001b') {
				return inputEscape();
			}
			if (/^(?:[A-Z])$/.test(c) && !registers.exists(c)) {
				requestShowMessage(_('Register {0} does not exist.', c), true);
				return inputEscape();
			}
			if (!/^(?:[a-zA-Z0-9"])$/.test(c)) {
				requestShowMessage(_('Invalid register name: {0}', c), true);
				return inputEscape();
			}
			recordedStrokes.add('q', {register:c});
			return true;
		}
	},
	r:{
		command:function (c, o) {
			if (!prefixInput.isEmptyOperation) {
				return inputEscape(o.e.key);
			}
			prefixInput.operation = c;
			requestInputMode('wait_a_letter');
			requestShowPrefixInput(_('{0}: replace a char', o.e.key));
		},
		wait_a_letter:function (c) {
			if (c != '\u001b') {
				quickReplace(c, prefixInput.count);
				prefixInput.motion = c;
				requestSimpleCommandUpdate();
			}
			return true;
		}
	},
	o:function (c, o) {
		if (!prefixInput.isEmptyOperation) {
			return inputEscape(o.e.key);
		}
		requestSimpleCommandUpdate();
		return openLine(c, c == 'o');
	},
	O:function () {return this.o.apply(this, arguments)},
	// equivalents to :& (repeat last executed :s)
	'&':function (c, o) {
		if (!prefixInput.isEmptyOperation) {
			return inputEscape(o.e.key);
		}
		var range = [];
		range.push(buffer.selectionStartRow + 1);
		range.push(Math.min(range[0] + prefixInput.count - 1, buffer.rowLength));
		return exvm.run(range.join(',') + '&');
	},
	// substitute text for whole lines (equivalents to cc)
	// or surrounding extension
	S:{
		command:function (c, o) {
			if (prefixInput.isEmptyOperation) {
				prefixInput.operation = c;
				isVerticalMotion = true;
				return this.c.$op.call(this, c, buffer);
			}

			return startSurrounding(c, o);
		},
		wait_a_letter:function (c, o) {
			return this.s[o.subkey].apply(this, arguments);
		},
		line_input:function (c, o) {
			return this.s[o.subkey].apply(this, arguments);
		}
	},
	// substitute characters
	// or surrounding extension
	s:{
		command:function (c, o) {
			if (prefixInput.isEmptyOperation) {
				editLogger.open('substitute');
				deleteCharsForward(prefixInput.count, {yank:true});
				requestSimpleCommandUpdate();
				return startEdit(c);
			}

			return startSurrounding(c, o);
		},
		wait_a_letter:function (c) {
			var result;

			prefixInput.trailer = c;

			switch (prefixInput.operation) {
			case 'd':
				if (surrounding.remove(prefixInput.trailer)) {
					requestSimpleCommandUpdate(prefixInput.toString());
				}
				else {
					inputEscape('surrounding');
				}
				prefixInput.reset();
				result = true;
				break;
			case 'c':
				requestInputMode('line_input', {
					modeOpts:{
						prefix:_('re-surround with:'),
						historyName:'s'
					}
				});
				break;
			default:
				break;
			}

			return result;
		},
		$line_input_notify:function (c, o) {
			var adjusted = adjustSurroundingInputForNotify(c || o.e.key);
			if (/^<.*>$/.test(adjusted) || /^ ?[^ <]$/.test(adjusted)) {
				//keyManager.setDequeue('unshift', '\n', mapManager.markExpandedNoremap);
				keyManager.unshift('\n');
			}
		},
		line_input:function (c) {
			var result;

			prefixInput.appendTrailer(c);
			switch (prefixInput.operation) {
			case 'c':
				result = surrounding.replace(
					prefixInput.trailer.charAt(0),
					prefixInput.trailer.substring(1).replace(/\n$/, ''));
				if (result) {
					requestSimpleCommandUpdate(prefixInput.toString());
				}
				else {
					inputEscape('surrounding');
				}
				prefixInput.reset();
				result = true;
				break;
			default:
				break;
			}

			return result;
		}
	},
	// equivalents to :x
	//   ZZ
	Z:{
		command:function (c, o) {
			if (!prefixInput.isEmptyOperation) {
				return inputEscape(o.e.key);
			}
			prefixInput.operation = c;
			requestInputMode('wait_a_letter');
			requestShowPrefixInput();
		},
		wait_a_letter:function (c) {
			if (!isAlias(c)) {
				return inputEscape(prefixInput.operation);
			}
			return exvm.run('x');
		},
		$op:function (c) {
			prefixInput.appendOperation(c);
		}
	},
	// incrementor and decrementor
	'\u0001'/*^A*/:function (c, o) {
		if (!prefixInput.isEmptyOperation) {
			return inputEscape(o.e.key);
		}

		var isDecrement = c == '\u0018';
		var incdec = new Wasavi.IncDec(
			appProxy, {formats: config.vars.nrformats, quickReturn: false});

		var matches = incdec.extractTargets(
			buffer.rows(buffer.selectionStartRow),
			buffer.selectionStartCol);
		var rep = incdec.getReplacement(
			matches,
			prefixInput.count * (isDecrement ? -1 : 1));

		rep && editLogger.open(isDecrement ? 'decrement' : 'increment', function () {
			incdec.applyReplacement(rep);
			buffer.setSelectionRange(new Position(
				buffer.selectionStartRow,
				rep.index + rep.replacement.length - 1));
		});

		prefixInput.operation = c;
		requestSimpleCommandUpdate();
		return true;
	},
	'\u0018'/*^X*/:function (c, o) {return this['\u0001'].apply(this, arguments)},
	// ex command, everybody's favorite.
	':':{
		command:function (c, o) {
			if (!prefixInput.isEmptyOperation) {
				return inputEscape(o.e.key);
			}
			prefixInput.operation = c;
			requestInputMode('line_input', {
				modeOpts:{
					prefix:config.vars.prompt ? c : '',
					value:prefixInput.isCountSpecified ? '.,.+' + (prefixInput.count - 1) : '',
					historyName:':'
				}
			});
		},
		line_input:function (c) {
			prefixInput.trailer = c;
			registers.set(':', c);
			lineInputHistories.push(c);
			return exvm.run(c);
		}
	},
	// bound mode transitioner
	v:function (c, o) {
		if (!prefixInput.isEmptyOperation) {
			return inputEscape(o.e.key);
		}
		lastBoundMode = c;
		requestInputMode(c == 'v' ? 'bound' : 'bound_line');
		marks.setPrivate('<', buffer.selectionStart);
		if (!o.e.mapExpanded) {
			recordedStrokes.add('bound').strokes = c;
		}
	},
	V:function () {return this.v.apply(this, arguments)}

	/*
	 * not implemented
	 */

	// back to command mode
	/*'q':null,*/
	// back to command mode
	/*'Q':null,*/
	// ^^  return to previous file
	/*'\u001e':null,*/
	// ^]  takes word after cursor as tag
	/*'\u001d':null,*/
	// ^Z  suspend
	/*'\u001a':null,*/
	// filter through a command
	/*'!':null,*/
};

/*
 * bound mode mapping <<<1
 * ----------------
 */

const boundMap = {
	'*nop*':commandMap['*nop*'],
	'*macro-end*': function () {
		executeViCommand('\u001b');
	},
	'\u0009':commandMap['\u0009'], '\u001b':inputEscape,
	'1':inputDigit, '2':inputDigit, '3':inputDigit, '4':inputDigit, '5':inputDigit,
	'6':inputDigit, '7':inputDigit, '8':inputDigit, '9':inputDigit,
	'"':commandMap['"'],

	/* operators */
	c:function (c, o) {
		if (inputMode == 'bound_line') return this.C.apply(this, arguments);
		return operateToBound(c, o, true,
			function (p1, p2, act) {
				editLogger.open('bound-edit-wrapper');
				yank(act);
				deleteSelection();
				act >= config.vars.report && requestShowMessage(_('Changing {0} {line:0}.', act));
			},
			function () {
				prefixInput.reset();
				requestSimpleCommandUpdate(lastSimpleCommand);
				return startEdit('');
			}
		);
	},
	d:function (c, o) {
		if (inputMode == 'bound_line') return this.D.apply(this, arguments);
		return operateToBound(c, o, true, function (p1, p2, act) {
			yank(act);
			deleteSelection();
			act >= config.vars.report && requestShowMessage(_('Deleted {0} {line:0}.', act));
		});
	},
	y:function (c, o) {
		if (inputMode == 'bound_line') return this.Y.apply(this, arguments);
		return operateToBound(c, o, true, function (p1, p2, act) {
			yank(act);
			act >= config.vars.report && requestShowMessage(_('Yanked {0} {line:0}.', act));
			buffer.setSelectionRange(p1);
		});
	},
	'<':function (c, o) {
		return operateToBound(c, o, true, function (p1, p2, act) {
			buffer.setSelectionRange(p1);
			unshift(act, prefixInput.count);
			buffer.setSelectionRange(buffer.getLineTopOffset2(p1));
		});
	},
	'>':function (c, o) {
		return operateToBound(c, o, true, function (p1, p2, act) {
			buffer.setSelectionRange(p1);
			shift(act, prefixInput.count);
			buffer.setSelectionRange(buffer.getLineTopOffset2(p1));
		});
	},
	C:function (c, o) {
		return operateToBound(c, o, true,
			function (p1, p2, act) {
				editLogger.open('bound-edit-wrapper');
				var selfIndent = buffer.getIndent(p1);
				buffer.isLineOrientSelection = true;
				yank();
				requestedState.showInput = null;
				deleteSelection();
				act >= config.vars.report && requestShowMessage(_('Changing {0} {line:0}.', act));
				buffer.isLineOrientSelection = false;
				insertNewlineWithIndent(p1, selfIndent);
			},
			function () {
				prefixInput.reset();
				requestSimpleCommandUpdate(lastSimpleCommand);
				return startEdit('');
			}
		);
	},
	S:{
		bound:function (c, o) {
			requestInputMode('line_input', {
				modeOpts:{
					prefix:_('surround with:'),
					historyName:'s'
				}
			});
			return false;
		},
		bound_line:function () {return this.S.bound.apply(this, arguments)},
		$line_input_notify:commandMap.s.$line_input_notify,
		line_input:function (c, o) {
			return operateToBound(c, o, true, function (p1, p2, act) {
				var prefix = $('wasavi_footer_input').dataset.internalPrefix;
				var isMultiline =
					inputMode == 'bound_line'
					|| surrounding.isLinewiseTagPrefix(prefix);
				var result = surrounding.insert(
					adjustSurroundingInput(c), isMultiline);
				if (!result) {
					inputEscape('surrounding');
				}
			});
		}
	},
	R:function () {return this.C.apply(this, arguments)},
	D:function (c, o) {
		return operateToBound(c, o, true, function (p1, p2, act) {
			buffer.isLineOrientSelection = true;
			yank();
			deleteSelection();
			act >= config.vars.report && requestShowMessage(_('Deleted {0} {line:0}.', act));
			buffer.isLineOrientSelection = false;
		});
	},
	X:function () {return this.D.apply(this, arguments)},
	Y:function (c, o) {
		return operateToBound(c, o, true, function (p1, p2, act) {
			buffer.isLineOrientSelection = true;
			yank();
			act >= config.vars.report && requestShowMessage(_('Yanked {0} {line:0}.', act));
			buffer.isLineOrientSelection = false;
			buffer.setSelectionRange(p1);
		});
	},

	/* motions */
	'-':commandMap['-'],			'+':commandMap['+'],			'^':commandMap['^'],
	'<home>':commandMap['^'],		$:commandMap.$,					'<end>':commandMap.$,
	'%':commandMap['%'],			'|':commandMap['|'],			',':commandMap[','],
	';':commandMap[';'],			_:commandMap._,					'/':commandMap['/'],
	'?':commandMap['?'],			"'":commandMap["'"],			'`':commandMap['`'],
	'(':commandMap['('],			')':commandMap[')'],			'{':commandMap['{'],
	'}':commandMap['}'],			'[':commandMap['['],			']':commandMap[']'],
	'\u000d':commandMap['\u000d'],	'0':commandMap['0'],			j:commandMap.j,
	'\u000e':commandMap['\u000e'],	'<down>':commandMap['<down>'],	k:commandMap.k,
	'\u0010':commandMap['\u0010'],	'<up>':commandMap['<up>'],		h:commandMap.h,
	'<left>':commandMap['<left>'],	'\u0008':commandMap['\u0008'],	l:commandMap.l,
	' ':commandMap[' '],			'<right>':commandMap['<right>'], w:commandMap.w,
	W:commandMap.W,					b:commandMap.b,					B:commandMap.B,	
	e:commandMap.e,					E:commandMap.E,					H:commandMap.H,	
	M:commandMap.M,					L:commandMap.L,					G:commandMap.G,	
	f:commandMap.f,					F:commandMap.F,					t:commandMap.t,	
	T:commandMap.T,					n:commandMap.n,					N:commandMap.N,	
	'*':commandMap['*'],			'#':commandMap['#'],

	/* scrollers */
	'\u0015':commandMap['\u0015'],	'\u0004':commandMap['\u0004'],	'\u0019':commandMap['\u0019'],
	'\u0005':commandMap['\u0005'],	'\u0002':commandMap['\u0002'],	'<pageup>':commandMap['<pageup>'],
	'\u0006':commandMap['\u0006'],	'<pagedown>':commandMap['<pagedown>'],	z:commandMap.z,

	/* g prefixes */
	g:{
		bound:commandMap.g.command,
		bound_line:commandMap.g.command,
		wait_a_letter:function (c, o) {
			var result = false;
			switch (c) {
			case 'i':
				var m = inputHandler.getStartPosition();
				if (m) {
					buffer.setSelectionRange(m);
				}
				else {
					requestShowMessage(_('Last inputted position is undefined.'), true);
				}
				result = true;
				break;
			case 'q':
				result = operateToBound(c, o, true, function (p1, p2, act) {
					buffer.setSelectionRange(reformat(
						prefixInput.isCountSpecified ? prefixInput.count : 0));
				});
				break;
			case 'v':
				var m1 = marks.get('<');
				var m2 = marks.get('>');
				if (m1 && m2) {
					buffer.unEmphasisBound();
					marks.setPrivate('<', m1);
					marks.setPrivate('>', m2);
					buffer.setSelectionRange(m2);
					inputMode = lastBoundMode == 'V' ? 'bound_line' : 'bound';
					extendBound(m2);
				}
				else {
					requestShowMessage(_('Last bound is undefined.'), true);
				}
				result = true;
				break;
			case 'S':
				requestInputMode('line_input', {
					modeOpts:{
						prefix:_('surround with:'),
						historyName:'s'
					},
					overrides:{mapkey:o.key + c}
				});
				break;
			default:
				result = commandMap.g.wait_a_letter.apply(this, arguments);
			}
			return result;
		},
	},
	gS:{
		$line_input_notify:commandMap.s.$line_input_notify,
		line_input:function (c, o) {
			return operateToBound(c, o, true, function (p1, p2, act) {
				var result = surrounding.insert(
					adjustSurroundingInput(c), true);
				if (!result) {
					inputEscape('surrounding');
				}
			});
		}
	},

	/* input mode transitioners (or range symbols) */
	a:{
		bound:function (c, o) {
			prefixInput.motion = c;
			requestInputMode('wait_a_letter');
			requestShowPrefixInput(_('{0}: range symbol', o.e.key));
		},
		bound_line:function (c, o) {
			return this.a.bound.apply(this, arguments)
		},
		wait_a_letter:function (c, o) {
			var result = searchUtils.dispatchRangeSymbol(
				prefixInput.count, c, prefixInput.motion.substr(-1) == 'a');
			if (!result) {
				return inputEscape(o.e.key);
			}
			prefixInput.appendMotion(c);
			var preferredMode = isVerticalMotion ? 'bound_line' : 'bound';
			var p = [
				marks.getPrivate('<'),
				marks.getPrivate('>'),
				buffer.selectionStart,
				isVerticalMotion ? buffer.selectionEnd : buffer.leftClusterPos(buffer.selectionEnd)
			].sort(function (a, b) {return a.eq(b) ? 0 : a.lt(b) ? -1 : 1});
			if (inputMode != preferredMode || buffer.selectionStart.lt(marks.getPrivate('<'))) {
				inputMode = preferredMode;
				buffer.unEmphasisBound();
				marks.setPrivate('<', buffer.selectionStart);
				requestShowPrefixInput();
			}
			buffer.setSelectionRange(p.lastItem);
			return result;
		}
	},
	i:{
		bound:function (c, o) {return this.a[o.subkey].apply(this, arguments)},
		bound_line:function (c, o) {
			return this.a[o.subkey].apply(this, arguments)
		},
		wait_a_letter:function (c, o) {return this.a[o.subkey].apply(this, arguments)}
	},

	/* edit commands */
	'~':function (c, o) {
		return operateToBound(c, o, true, function (p1, p2, act) {
			toggleCase(1, true);
			buffer.setSelectionRange(p1);
		});
	},
	':':{
		bound:function (c, o) {
			return operateToBound(c, o, false, null, function (p1, p2, act) {
				requestInputMode('line_input', {
					modeOpts:{
						prefix:config.vars.prompt ? c : '',
						value:"'<,'>",
						historyName:':'
					}
				});
				prefixInput.reset();
				prefixInput.operation = c;
				return false;
			});
		},
		bound_line:function (c, o) {return this[':'].bound.apply(this, arguments)},
		line_input:commandMap[':'].line_input
	},
	J:function (c, o) {
		return operateToBound(c, o, true, function (p1, p2, act) {
			buffer.setSelectionRange(p1);
			joinLines(act - 1);
		});
	},
	p:function (c, o) {
		return operateToBound(c, o, true, function (p1, p2, act) {
			// bound content
			var content, isLineOrient = buffer.isLineOrientSelection;
			if (isLineOrient) {
				buffer.selectRowsLinewise(1);
				content = buffer.getSelectionLinewise();
			}
			else {
				content = buffer.getSelection();
			}

			// register content
			var reg = prefixInput.register == '' ? '"' : prefixInput.register;
			if (!registers.exists(reg)) {
				requestShowMessage(_('Register {0} is empty.', reg), true);
				return;
			}
			reg = registers.get(reg);

			// some tweak
			if (isLineOrient && !reg.isLineOrient) {
				p2.col = buffer.rows(p2).length;
				buffer.selectionEnd = p2;
				buffer.isLineOrientSelection = false;
			}

			// main job
			editLogger.open('deleteBound', function () {
				deleteSelection();
				buffer.isLineOrientSelection = false;
				if (p1.row >= buffer.rowLength) {
					buffer.setSelectionRange(new Position(buffer.rowLength - 1, 0));
					paste(prefixInput.count, {
						isForward:true,
						lineOrientOverride:true,
						register:prefixInput.register
					});
				}
				else {
					paste(prefixInput.count, {
						isForward:false,
						lineOrientOverride:false,
						register:prefixInput.register
					});
				}
				registers.set('', content, isLineOrient, true);
			});
		});
	},
	P:function () {return this.p.apply(this, arguments)},
	r:{
		bound:function (c, o) {
			requestInputMode('wait_a_letter');
			requestShowPrefixInput(_('{0}: replace a char', o.e.key));
		},
		bound_line:function (c, o) {return this.r.bound.apply(this, arguments)},
		wait_a_letter:function (c, o) {
			return operateToBound(c, o, true, function (p1, p2, act) {
				quickReplace(c, 1, true);
				buffer.setSelectionRange(p1);
			});
		}
	},
	s:function () {return this.c.apply(this, arguments)},
	u:function (c, o) {
		return operateToBound(c, o, true, function (p1, p2, act) {
			unifyCase(1, c == 'U', true);
			buffer.setSelectionRange(p1);
		});
	},
	U:function () {return this.u.apply(this, arguments)},
	v:function (c, o) {
		if (inputMode == 'bound' && c == 'v'
		||  inputMode == 'bound_line' && c == 'V') {
			return operateToBound(c, o, false);
		}
		buffer.unEmphasisBound();
		inputMode = inputMode == 'bound' ? 'bound_line' : 'bound';
		lastBoundMode = c;
		extendBound(buffer.selectionStart);
		requestShowPrefixInput();
	},
	V:function (c, o) {return this.v.apply(this, arguments)},
	x:function () {return this.d.apply(this, arguments)},
	'\u0001'/*^A*/:function (c, o) {
		return operateToBound(c, o, true, function (p1, p2, act) {
			var isDecrement = c == '\u0018';
			var count = prefixInput.count * (isDecrement ? -1 : 1);
			var incdec = new Wasavi.IncDec(appProxy, {formats: config.vars.nrformats});

			editLogger.open(isDecrement ? 'decrement' : 'increment', function () {
				for (var i = p1.row, goal = p2.row; i <= goal; i++) {
					var line;
					var offset;

					// single line
					if (p1.row == p2.row) {
						line = buffer.rows(i).substring(p1.col, p2.col);
						offset = p1.col;
					}
					// first line
					else if (i == p1.row) {
						line = buffer.rows(i).substring(p1.col);
						offset = p1.col;
					}
					// last line
					else if (i == p2.row) {
						line = buffer.rows(i).substring(0, p2.col);
						offset = 0;
					}
					// middle line
					else {
						line = buffer.rows(i);
						offset = 0;
					}

					buffer.setSelectionRange(new Position(i, 0));

					var matches = incdec.extractTargets(line, 0);
					var rep = incdec.getAllReplacements(matches, count);
					for (var j = rep.length - 1; j >= 0; j--) {
						rep[j].index += offset;
						incdec.applyReplacement(rep[j]);
					}
				}

				buffer.setSelectionRange(p1);
			});
		});
	},
	'\u0018'/*^X*/:function () {return this['\u0001'].apply(this, arguments)}
};

/*
 * insert/overwrite mode mapping <<<1
 * ----------------
 */

const editMap = {
	'*macro-end*': function () {
		executeViCommand('\u001b');
	},
	'<C-space>'/*^@*/:function () {
		inputHandler.ungetText();
		if (clipOverrun()) return;
		if (inputHandler.stroke.length) return;
		if (!registers.exists('.')) {
			requestShowMessage(_('Last inputted text is undefined.'), true);
			return;
		}
		var cmd = keyManager.createSequences(registers.get('.').data + '\u001b');
		// TODO: use key input queue in keyManager
		for (var i = 0, goal = cmd.length; i < goal; i++) {
			processInput(cmd[i], true);
		}
	},
	'\u0004'/*^D*/:function (c, o) {
		inputHandler.ungetText();
		if (clipOverrun()) return;
		var needShift = o.key == '\u0014' || o.key == '<A-T>';
		var n = buffer.selectionStart;
		var re = spc('^(S*).*?([0^]?)$').exec(buffer.rows(n).substring(0, n.col));
		var tmpMark = 'edit-shifter';
		if (needShift || re) {
			inputHandler.flush();
			if (!needShift && re[2]) {
				n.col--; // n points '0' or '^' so it is ok to decrement simply
				buffer.selectionStart = n;
				deleteSelection();
				marks.setPrivate(tmpMark, buffer.selectionStart);
				n.col = 0;
				buffer.selectionStart = n;
				n.col = re[1].length;
				buffer.selectionEnd = n;
				deleteSelection();
				buffer.setSelectionRange(marks.getPrivate(tmpMark));
				marks.setPrivate(tmpMark);
				re[2] == '^' && buffer.rowNodes(n).setAttribute('data-indent-ignore', '1');
			}
			else {
				marks.setPrivate(tmpMark, buffer.selectionStart);
				(needShift ? shift : unshift)(1, 1);
				buffer.setSelectionRange(marks.getPrivate(tmpMark));
				marks.setPrivate(tmpMark);
			}
			inputHandler.invalidateHeadPosition();
		}
	},
	'\u0008'/*^H, backspace*/:function (c, o) {
		inputHandler.ungetText();

		if (buffer.selectionStartRow == 0 && buffer.selectionStartCol == 0) {
			requestShowMessage(_('Top of text.'), true);
			inputHandler.ungetText();
			inputHandler.ungetStroke();
			return;
		}

		function selectNewline () {
			if (buffer.selectionStartCol != 0) {
				return false;
			}
			var p = buffer.selectionStart;
			p.row--;
			p = buffer.getLineTailOffset(p);
			buffer.selectionStart = p;
			return true;
		}

		function backToPrevWord () {
			if (selectNewline()) return;
			motionPrevWord(c, 1, false, [
				inputHandler.getStartPosition(),
				new Position(buffer.selectionStartRow, 0)
			]);
		}

		function backToStartPosition () {
			if (selectNewline()) return;

			var start = inputHandler.getStartPosition();
			var n = new Position(buffer.selectionStartRow, 0);
			var n2 = buffer.getLineTopOffset2(buffer.selectionStart);

			if (config.vars.autoindent && buffer.selectionStartCol > n2.col) {
				n = n2;
			}
			if (start.lt(buffer.selectionStart) && start.gt(n)) {
				n = start;
			}
			else {
				inputHandler.setStartPosition(n);
			}

			buffer.selectionStart = n;
		}

		function getBackspaceWidth () {
			var n = getLogicalColumn();
			var ts = config.vars.tabstop;
			var d = n - (Math.floor(n / ts) * ts - (n % ts ? 0 : ts));
			var p = buffer.selectionStart;
			return /[^ ]/.test(buffer.rows(p).substring(p.col - d, p.col)) ? 1 : d;
		}

		inputHandler.flush();
		inputHandler.ungetText();
		if (inputMode == 'overwrite' &&
		buffer.selectionStart.le(inputHandler.getStartPosition())) {
			switch (o.key) {
			case '\u0008':
				motionLeft(c, 1);
				break;
			case '\u0015':
				backToStartPosition();
				break;
			case '\u0017':
			case '<A-W>':
			case '<C-backspace>':
				backToPrevWord();
				break;
			}
		}
		else {
			switch (o.key) {
			case '\u0008':
				deleteCharsBackward(getBackspaceWidth(), {canJoin:true});
				break;
			case '\u0015':
				backToStartPosition();
				deleteSelection();
				break;
			case '\u0017':
			case '<A-W>':
			case '<C-backspace>':
				backToPrevWord();
				deleteSelection();
				break;
			}
			inputHandler.invalidateHeadPosition();
		}
	},
	'\u0009'/*^I, tab*/:function () {
		if (clipOverrun()) return;
		if (config.vars.expandtab) {
			var ts = config.vars.tabstop;
			var curCol = getLogicalColumn();
			var nextTabCol = Math.floor(curCol / ts) * ts + ts;
			if (nextTabCol > curCol) {
				var s = multiply(' ', nextTabCol - curCol);
				inputHandler.ungetText();
				if (inputMode == 'edit') {
					insert(s);
					inputHandler.text += s;
					inputHandler.textFragment += s;
				}
				else {
					var top = s.charAt(0);
					var rest = s.substring(1);
					overwrite(s.charAt(0));
					inputHandler.text += top;
					inputHandler.textFragment += top;
					inputHandler.flush();
					if (rest.length) {
						editLogger.write(
							Wasavi.EditLogger.ITEM_TYPE.INSERT,
							buffer.selectionStart, rest
						);
						insert(rest);
					}
					inputHandler.invalidateHeadPosition();
				}
			}
		}
		else {
			(inputMode == 'edit' ? insert : overwrite)('\t');
			inputHandler.flush();
			var m = 'normalize-indent';
			marks.setPrivate(m, buffer.selectionStart);
			shift(1, 0);
			buffer.setSelectionRange(marks.getPrivate(m));
			marks.setPrivate(m);
			inputHandler.invalidateHeadPosition();
		}
	},
	'\u000a'/*^J*/:function () {this['\u000d'].apply(this, arguments)},
	'\u000d'/*^M, enter*/:function () {
		if (clipOverrun()) return;
		var indent = config.vars.autoindent ? buffer.getIndent(buffer.selectionStart) : '';
		if (indent != '') {
			inputHandler.text += indent;
			inputHandler.textFragment += indent;
		}
		insert('\n' + indent);
	},
	'\u0012'/*^R*/:{
		edit:function (c, o) {
			inputHandler.ungetText();
			inputHandler.ungetStroke();
			if (clipOverrun()) return;
			requestInputMode('wait_register');
			requestShowPrefixInput(_('{0}: register [{1}]', o.e.key, registers.readableList));
		},
		overwrite:function (c, o) {this[o.key].edit.apply(this, arguments)},
		wait_register:function (c, o) {
			inputHandler.ungetText();
			inputHandler.ungetStroke();

			var s;
			if (registers.isClipboard(c)) {
				return getClipboard().then(() => {
					let data = registers.get('*').data;
					if (data == '') {
						requestShowMessage(_('Register {0} is empty.', c));
					}
					else {
						paste(1, {content: data, isForward: false});
						inputHandler.appendText(data);
						inputHandler.appendStroke(data);
					}
				});
			}
			else if (c == '=') {
				requestInputMode('line_input', {
					modeOpts:{
						prefix:_('expr:'),
						historyName:'e',
					},
					overrides:{
						mapkey:o.key + c
					}
				});
			}
			else if (registers.exists(c) && (s = registers.get(c).data) != '') {
				paste(1, {content: s, isForward: false});
				inputHandler.appendText(s);
				inputHandler.appendStroke(s);
			}
			else {
				requestShowMessage(_('Register {0} is empty.', c));
			}
		},
	},
	'\u0012='/*^R=*/:{
		$line_input_notify:function (c, o) {
			commandMap['"='][o.subkey].apply(this, arguments);
		},
		$line_input_escape:function (c, o) {
			commandMap['"='][o.subkey].apply(this, arguments);
		},
		line_input:function (c, o) {
			commandMap['"='][o.subkey].apply(this, arguments);
			var s;
			if (registers.exists('=') && (s = registers.get('=').data) != '') {
				registers.get(';').set(s);
				keyManager.push('\u0012;');
			}
			else {
				requestShowMessage(_('Register {0} is empty.', c));
			}
		}
	},
	'\u0014'/*^T*/:function () {this['\u0004'].apply(this, arguments)},
	'<A-T>':function () {this['\u0004'].apply(this, arguments)},
	'\u0015'/*^U*/:function () {this['\u0008'].apply(this, arguments)},
	'\u0016'/*^V*/:{
		edit:function (c, o) {
			inputHandler.ungetText();
			if (clipOverrun()) return;
			requestInputMode('wait_a_letter');
			requestShowPrefixInput(_('{0}: literal input', o.e.key));
			literalInput = new Wasavi.LiteralInput;
			inputHandler.pushText();
			inputHandler.pushStroke();
		},
		overwrite:function (c, o) {this[o.key].edit.apply(this, arguments)},
		wait_a_letter:function (c) {
			var result = literalInput.process(c);
			if (!result) {
				requestShowPrefixInput(literalInput.message);
				requestInputMode('wait_a_letter');
				return;
			}
			if (result.error) {
				requestShowMessage(result.error, true);
				inputHandler.popStroke();
				inputHandler.ungetStroke();
				inputHandler.popText();
			}
			else {
				inputHandler.popText();

				if (result.sequence) {
					for (var i = 0, goal = result.sequence.length; i < goal; i++) {
						var ch = result.sequence[i];
						var code = ch.charCodeAt(0);
						var e = keyManager.objectFromCode(code);

						inputHandler.appendText(e);
						if (code == 10 || code == 13) {
							insert('\n');
						}
						else if (goal == 1
							&& (unicodeUtils.isHighSurrogate(code)
								|| unicodeUtils.isLowSurrogate(code))) {
							requestNotice(_('Cannot input a surrogate code point.'));
							break;
						}
						else {
							if (code >= 0 && code != 9 && code <= 31 || code == 0x7f) {
								ch = toVisibleControl(code);
							}
							(inputMode == 'edit' ? insert : overwrite)(ch);
						}
					}
					cursor.ensureVisible();
					cursor.update();
					requestShowPrefixInput(getDefaultPrefixInputString());
				}
				else {
					inputHandler.popStroke();
					inputHandler.ungetStroke();
				}
				if (result.trail) {
					inputHandler.ungetStroke();
					var e = keyManager.objectFromCode(result.trail.charCodeAt(0));
					processInput(e);
				}
			}
			literalInput = null;
		}
	},
	'\u0017'/*^W*/:function () {this['\u0008'].apply(this, arguments)},
	'<A-W>':function () {this['\u0008'].apply(this, arguments)},
	'<C-backspace>':function () {this['\u0008'].apply(this, arguments)},
	'\u007f':function () {
		inputHandler.ungetText();
		if (clipOverrun()) return;
		if (buffer.selectionStartRow >= buffer.rowLength - 1 &&
		buffer.selectionStartCol >= buffer.getLineTailOffset(buffer.selectionStartRow).col) {
			requestShowMessage(_('Tail of text.'), true);
			inputHandler.ungetStroke();
			return;
		}
		inputHandler.flush();
		deleteCharsForward(1, {canJoin:true});
		inputHandler.invalidateHeadPosition();
	},
	'<left>':function (c) {
		inputHandler.newState();
		motionLeft(c, 1);
	},
	'<up>':function (c) {
		inputHandler.newState();
		motionUp(c, 1);
	},
	'<right>':function (c) {
		inputHandler.newState();
		motionRight(c, 1);
	},
	'<down>':function (c) {
		inputHandler.newState();
		motionDown(c, 1);
	},
	'<home>':function (c) {
		inputHandler.newState();
		motionLineStart(c, false);
	},
	'<end>':function (c) {
		inputHandler.newState();
		motionLineEnd(c);
	},
	'<pageup>':function (c) {
		inputHandler.newState();
		return scrollView(c, function (v) {
			return -(Math.max(parseInt(v.lines - 2), 1));
		});
	},
	'<pagedown>':function (c) {
		inputHandler.newState();
		return scrollView(c, function (v) {
			return Math.max(parseInt(v.lines - 2), 1);
		});
	}
};

/*
 * line input mode mapping <<<1
 * ----------------
 */

const lineInputEditMap = {
	'*nop*':function () {
		return true;
	},
	'*macro-end*': function () {
		executeViCommand('\u001b');
		return true;
	},
	'\u0001'/*^A*/:function (c, o) {
		o.target.selectionStart = o.target.selectionEnd = 0;
		return true;
	},
	'\u0002'/*^B*/:function (c, o) {
		var ss = o.target.selectionStart;
		var clusters = lineInputInfo.getClusters();
		var index = clusters.getClusterIndexFromUTF16Index(ss);
		var newpos = clusters.rawIndexAt(Math.max(0, index - 1));
		o.target.selectionStart = o.target.selectionEnd = newpos;
		return true;
	},
	'\u0005'/*^E*/:function (c, o) {
		o.target.selectionStart = o.target.selectionEnd = o.target.value.length;
		return true;
	},
	'\u0006'/*^F*/:function (c, o) {
		var se = o.target.selectionEnd;
		var clusters = lineInputInfo.getClusters();
		var index = clusters.getClusterIndexFromUTF16Index(se);
		var newpos = clusters.rawIndexAt(Math.min(index + 1, clusters.length));
		o.target.selectionStart = o.target.selectionEnd = newpos;
		return true;
	},
	'\u0008'/*^H, backspace*/:function (c, o) {
		var clusters = lineInputInfo.getClusters();
		var ss = clusters.getClusterIndexFromUTF16Index(o.target.selectionStart);
		var se = clusters.getClusterIndexFromUTF16Index(o.target.selectionEnd);
		if (ss == se) {
			if (ss > 0) {
				clusters.delete(ss - 1, 1);
				o.target.value = clusters.toString();
				o.target.selectionStart = o.target.selectionEnd = clusters.rawIndexAt(ss - 1);
			}
		}
		else {
			clusters.delete(ss, se - ss + 1);
			o.target.value = clusters.toString();
			o.target.selectionStart = o.target.selectionEnd = clusters.rawIndexAt(ss);
		}
		lineInputHistories.isInitial = true;
		return true;
	},
	'\u0009'/*^I, tab*/:function (c, o) {
		lineInputHistories.isInitial = true;
		isCompleteResetCanceled = true;
		keyManager.lock();
		return new Promise(resolve => {
			completer.run(o.target.value, o.target.selectionStart, o.e.shift, compl => {
				if (!compl) {
					notifier.show(_('No completions'));
				}
				else if (typeof compl == 'string') {
					notifier.show(compl);
				}
				else {
					o.target.value = compl.value;
					o.target.selectionStart = o.target.selectionEnd = compl.pos;
					lineInputInfo.invalidate();
					notifier.show(
						_('matched #{0} of {1}', compl.completed.index + 1, compl.filteredLength),
						1000 * 3
					);
				}
				keyManager.unlock();
				resolve();
			});
		});
	},
	'<S-tab>':function (c, o) {
		return this['\u0009'].apply(this, arguments);
	},
	'\u000e'/*^N*/:function (c, o) {
		if (lineInputHistories.isInitial) {
			notifier.show(_('Tail of history.'));
		}
		else {
			var line = lineInputHistories.next();
			if (line == undefined) {
				line = o.target.dataset.wasaviLineInputCurrent;
			}
			if (line == undefined) {
				notifier.show(_('Invalid history item.'));
			}
			else {
				o.target.value = toVisibleControl(line);
				o.target.selectionStart = o.target.value.length;
				o.target.selectionEnd = o.target.value.length;
				lineInputInfo.invalidate();
			}
		}
		return true;
	},
	'<A-N>':function () {return this['\u000e'].apply(this, arguments)},
	'\u0010'/*^P*/:function (c, o) {
		if (lineInputHistories.isInitial) {
			o.target.dataset.wasaviLineInputCurrent = o.target.value;
		}
		var line = lineInputHistories.prev();
		if (line == undefined) {
			notifier.show(_('Top of history.'));
		}
		else {
			o.target.value = toVisibleControl(line);
			o.target.selectionStart = o.target.value.length;
			o.target.selectionEnd = o.target.value.length;
			lineInputInfo.invalidate();
		}
		return true;
	},
	'<A-P>':function () {return this['\u0010'].apply(this, arguments)},
	'\u0012'/*^R*/:{
		line_input:function (c, o) {
			requestInputMode('wait_register');
			notifier.show(
				_('{0}: register [{1}]', o.e.key, registers.readableList),
				1000 * 60
			);
		},
		wait_register:function (c, o) {
			var s;
			if (registers.isClipboard(c)) {
				return getClipboard().then(() => {
					let data = registers.get('*').data;
					if (data == '') {
						notifier.show(_('Register {0} is empty.', c));
					}
					else {
						notifier.hide();
						insertToLineInput(lineInputInfo, data);
					}
				});
			}
			else if (c == '=') {
				notifier.hide();
				requestInputMode('line_input', {
					modeOpts:{
						prefix:_('expr:'),
						historyName:'e',
					},
					overrides:{
						mapkey:o.key + c
					}
				});
			}
			else if (registers.exists(c) && (s = registers.get(c).data) != '') {
				notifier.hide();
				insertToLineInput(lineInputInfo, s);
				return true;
			}
			else {
				notifier.show(_('Register {0} is empty.', c));
				return true;
			}
		}
	},
	'\u0012='/*^R=*/:{
		$line_input_notify:function (c, o) {
			commandMap['"='][o.subkey].apply(this, arguments);
		},
		$line_input_escape:function (c, o) {
			commandMap['"='][o.subkey].apply(this, arguments);
		},
		line_input:function (c, o) {
			editMap['\u0012='][o.subkey].apply(this, arguments);
			return true;
		}
	},
	'\u0015'/*^U*/:function (c, o) {
		o.target.value = '';
		o.target.selectionStart = o.target.selectionEnd = 0;
		lineInputInfo.invalidate();
		lineInputHistories.isInitial = true;
		return true;
	},
	'\u0016'/*^V*/:{
		line_input:function (c, o) {
			requestInputMode('wait_a_letter');
			notifier.show(
				_('{0}: literal input', o.e.key),
				1000 * 60
			);
			literalInput = new Wasavi.LiteralInput;
		},
		wait_a_letter:function (c, o) {
			var result = literalInput.process(c);
			if (!result) {
				notifier.show(literalInput.message);
				requestInputMode('wait_a_letter');
				return;
			}
			if (result.error) {
				notifier.show(result.error);
				requestNotice();
			}
			else {
				notifier.hide();

				if (result.sequence) {
					for (var i = 0, goal = result.sequence.length; i < goal; i++) {
						var ch = result.sequence[i];
						var code = ch.charCodeAt(0);
						var e = keyManager.objectFromCode(code);

						if (code == 10 || goal == 1 && (unicodeUtils.isHighSurrogate(code) || unicodeUtils.isLowSurrogate(code))) {
							requestNotice(_('Cannot input a surrogate code point.'));
							break;
						}
						if (code >= 0 && code <= 31 || code == 0x7f) {
							ch = toVisibleControl(code);
						}
						insertToLineInput(lineInputInfo, ch);
					}
				}
				if (result.trail) {
					insertToLineInput(lineInputInfo, result.trail);
				}
			}
			literalInput = null;
			lineInputHistories.isInitial = true;
			return true;
		}
	},
	'\u0017'/*^W*/:function (c, o) {
		var ss = o.target.selectionStart;
		var se = o.target.selectionEnd;
		if (ss == se) {
			var words = Unistring.getWords(o.target.value);
			var wordIndex = words.wordIndexOf(ss);
			var left;
			if (wordIndex >= 0 && words[wordIndex].index < ss) {
				left = words[wordIndex].index;
			}
			else if (wordIndex > 0) {
				wordIndex--;
				left = words[wordIndex].index;
			}
			else if (wordIndex == -1 && words.length > 0) {
				wordIndex = words.length - 1;
				left = words[wordIndex].index;
			}
			if (isNumber(left)) {
				o.target.value =
					o.target.value.substring(0, left) +
					o.target.value.substring(ss);
				o.target.selectionStart = o.target.selectionEnd = left;
			}
		}
		else {
			var clusters = lineInputInfo.getClusters();
			ss = clusters.getClusterIndexFromUTF16Index(ss);
			se = clusters.getClusterIndexFromUTF16Index(se);
			clusters.delete(ss, se - ss + 1);
			o.target.value = clusters.toString();
			o.target.selectionStart = o.target.selectionEnd = clusters.rawIndexAt(ss);
		}
		lineInputInfo.invalidate();
		lineInputHistories.isInitial = true;
		return true;
	},
	'<A-W>':function () {return this['\u0017'].apply(this, arguments)},
	'<C-backspace>':function () {return this['\u0017'].apply(this, arguments)},
	'\u007f':function (c, o) {
		var clusters = lineInputInfo.getClusters();
		var ss = clusters.getClusterIndexFromUTF16Index(o.target.selectionStart);
		var se = clusters.getClusterIndexFromUTF16Index(o.target.selectionEnd);
		if (ss == se) {
			if (ss < clusters.length) {
				clusters.delete(ss, 1);
				o.target.value = clusters.toString();
				o.target.selectionStart = o.target.selectionEnd = clusters.rawIndexAt(ss);
			}
		}
		else {
			clusters.delete(ss, se - ss + 1);
			o.target.value = clusters.toString();
			o.target.selectionStart = o.target.selectionEnd = clusters.rawIndexAt(ss);
		}
		lineInputHistories.isInitial = true;
		return true;
	},
	'<left>':function () {return this['\u0002'].apply(this, arguments)},
	'<right>':function () {return this['\u0006'].apply(this, arguments)},
	'<up>':function () {return this['\u0010'].apply(this, arguments)},
	'<down>':function () {return this['\u000e'].apply(this, arguments)},
	'<home>':function () {return this['\u0001'].apply(this, arguments)},
	'<end>':function () {return this['\u0005'].apply(this, arguments)}
};

/*
 * information table for each mode
 * ----------------
 */

const modeTable = {
	command: {
		handlerName: 'command',
		map: commandMap,
		state: 'normal'
	},
	bound: {
		handlerName: 'bound',
		map: boundMap,
		state: 'normal'
	},
	bound_line: {
		handlerName: 'bound',
		map: boundMap,
		state: 'normal'
	},
	edit: {
		handlerName: 'edit',
		map: editMap,
		state: 'normal'
	},
	overwrite: {
		handlerName: 'edit',
		map: editMap,
		state: 'normal'
	},
	line_input: {
		handlerName: 'line_input',
		map: lineInputEditMap,
		state: 'line_input'
	},
	backlog_prompt: {
		handlerName: 'backlog_prompt',
		state: 'console_wait'
	},
	wait_register: {
		handlerName: 'wait_register'
	},
	wait_a_letter: {
		handlerName: 'wait_register'
	}
};

/*
 * variables <<<1
 * ----------------
 */

var promise;
var extensionChannel;
var version;
var exrc;
var quickActivation;
var testMode;
var devMode;
var logMode;
var fstab;
var resizeHandlerInvokeTimer;
var l10n;
var ffttDictionary;
var lineBreaker;
var targetElement;
var buffer;
var fileName;
var fileSystemIndex;
var preferredNewline;
var terminated;
var state;
var registers;
var lineInputHistories;
var lineInputInfo;
var marks;
var cursor;
var scroller;
var editLogger;
var prefixInput;
var inputHandler;
var inputModeStack;
var inputMode;
var requestedState;
var lineHeight;
var charWidth;
var idealWidthPixels;
var idealDenotativeWidthPixels;
var backlog;
var pairBracketsIndicator;
var exvm;
var searchUtils;
var recordedStrokes;
var literalInput;
var notifier;
var compositionLevel;
var containerRect;
var statusLineHeight;
var surrounding;
var executingMacroInfo;
var commandCompleteTimer;

var isEditCompleted;
var isVerticalMotion;
var isReadonlyWarned;
var isInteractive;
var isSmoothScrollRequested;
var isJumpBaseUpdateRequested;
var isCompleteResetCanceled;
var isUndoFlipped;

var lastSimpleCommand;
var lastHorzFindCommand;
var lastRegexFindCommand;
var lastSubstituteInfo;
var lastMessage;
var lastBoundMode;

diag('entering start up section');

/*
 * startup <<<1
 * ----------------
 */

if (global.WasaviExtensionWrapper
&&  (extensionChannel = WasaviExtensionWrapper.create()).urlInfo.isAny) {
	diag('connecting to extension');
	extensionChannel.connect('init', function (req) {
		diag('connected to extension');
		if (!req) return;
		function run (callback) {
			function doRun () {
				diag('entering doRun()');
				if (!/^(?:chrome|moz)-extension:/.test(window.location.protocol)) {
					// force doctype to standard mode
					var doctype = document.implementation.createDocumentType('html', '', '');
					document.doctype ?
						document.doctype.parentNode.replaceChild(doctype, document.doctype) :
						document.insertBefore(doctype, document.childNodes[0]);

					// set head content only if head is empty
					if (document.head.innerHTML.replace(/^\s+|\s+$/g, '') == '') {
						document.head.innerHTML = req.headHTML;
					}

					// override body content always
					document.body.innerHTML = req.bodyHTML;
				}
				callback();
			}

			diag('entering run()');
			extensionChannel.ensureRun(doRun);
		}

		if (extensionChannel.isTopFrame()) {
			diag('running wasavi as app mode');
			testMode = req.testMode;
			run(function() {
				!targetElement && install({
					// parentTabId
					// frameId
					// url
					// testMode
					id:extensionChannel.name,
					nodeName:'textarea',
					// nodePath
					elementType:'textarea',
					setargs: '',
					selectionStart:0, selectionEnd:0,
					scrollTop:0, scrollLeft:0,
					readOnly:false,
					value:'',
					rect:{
						width:document.documentElement.clientWidth,
						height:document.documentElement.clientHeight
					},
					fontStyle:'normal normal normal medium/1 ' + req.fontFamily
				}, req);
			});
		}
		else if (req.payload) {
			diag('running wasavi in iframe');
			testMode = req.payload.testMode;
			run(function() {install(req.payload, req);});
		}
	});
}
})(this);

// vim:set ts=4 sw=4 fenc=UTF-8 ff=unix ft=javascript fdm=marker fmr=<<<,>>> fdl=1 :
