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

(function (g) {

'use strict';

const Wasavi = g.Wasavi;

Wasavi.SubstituteWorker = function (app) {
	this.app = app;
	this.patternString = '';
	this.pattern = null;
	this.replOpcodes = null;
	this.range = null;
	this.isGlobal = false;
	this.isConfirm = false;
	this.substCount = 0;
	this.buffer = null;
	this.kontinueWorker = null;
};
Wasavi.SubstituteWorker.prototype = {
	run: function (range, pattern, repl, options) {
		var app = this.app;
		var t = this.app.buffer;
		pattern || (pattern = '');
		repl || (repl = '');
		options || (options = '');
		var count, re, tildeUsed;

		// pattern and replacemnt
		if (pattern == '' && repl == '') {
			if ((pattern = app.lastSubstituteInfo.pattern || '') == '') {
				return _('No previous substitution.');
			}
			repl = '~';
		}
		else if (pattern == '' && repl != '') {
			if ((pattern = app.lastRegexFindCommand.pattern || '') == '') {
				return _('No previous search pattern.');
			}
		}
		if (repl == '%') {
			if (app.lastSubstituteInfo.replacement == undefined) {
				return _('No previous substitution.');
			}
			repl = app.lastSubstituteInfo.replacement;
		}
		repl.replace(/\\.|./g, function (a) {
			if (a == '~') {
				tildeUsed = true;
			}
		});
		if (tildeUsed) {
			if (app.lastSubstituteInfo.replacement == undefined) {
				return _('No previous substitution.');
			}
			var tildeRegex = /(?!\\)~/g;
			repl = repl.replace(tildeRegex, app.lastSubstituteInfo.replacement);
		}

		// options
		re = /^\s*([gc]+)/.exec(options);
		if (re) {
			if (re[1].indexOf('g') >= 0) {
				this.isGlobal = true;
			}
			if (re[1].indexOf('c') >= 0) {
				this.isConfirm = true;
			}
			options = options.substring(re[0].length);
		}

		// count
		re = /^\s*(\d+)/.exec(options);
		if (re) {
			count = parseInt(re[1], 10);
			range[0] = range[1];
			range[1] = minmax(0, range[0] + count - 1, t.rowLength - 1);
			options = options.substring(re[0].length);
		}

		// update search history
		app.lastRegexFindCommand.push({direction:1});
		app.lastRegexFindCommand.setPattern(pattern);
		app.lastSubstituteInfo.pattern = pattern;
		app.lastSubstituteInfo.replacement = repl;
		app.registers.set('/', app.lastRegexFindCommand.pattern);

		// initialize regex instance
		this.patternString = pattern;
		this.pattern = app.low.getFindRegex(pattern);
		this.pattern.lastIndex = 0;

		// compile the replace pattern into opcodes
		this.replOpcodes = this.compileReplacer(repl);
		if (!this.replOpcodes) {
			return _('Internal Error: invalid replace function');
		}

		// create search buffer
		var rg = document.createRange();
		rg.setStartBefore(t.rowNodes(range[0]));
		rg.setEndAfter(t.rowNodes(range[1]));
		this.buffer = this.createBuffer(trimTerm(rg.toString()));

		//
		var result;
		if (this.buffer.length) {
			// found something
			this.range = range;
			this.substCount = 0;

			if (this.isConfirm) {
				result = new Promise(resolve => {
					function handleKeypress (e) {
						e.preventDefault();
						// when continueConfirmModeSubst() completes, it returns true
						if (this.continueConfirmModeSubst(e.char)) {
							app.keyManager.removeListener('interrupt');
							resolve();
						}
					}

					this.setupConfirmModeSubst();
					app.keyManager.addListener('interrupt', handleKeypress.bind(this));
				});
			}
			else {
				this.burst();
				t.setSelectionRange(t.getLineTopOffset2(t.selectionStart));
				this.showResult();
				this.buffer = null;
			}
		}
		else {
			// not found
			this.showNotFound();
		}
		return result;
	},
	createBuffer: function (text) {
		var re;
		var buffer = [];
		var lastIndex = -1;
		var pattern = this.pattern;

		while ((re = pattern.exec(text))) {
			if (pattern.lastIndex <= lastIndex) {
				pattern.lastIndex = lastIndex + 1;
				continue;
			}
			buffer.push(re);
			lastIndex = pattern.lastIndex;
		}

		return buffer;
	},
	burst: function (startIndex, startPos, startReplacer) {
		var t = this.app.buffer;
		var buffer = this.buffer;

		var i = startIndex || 0;
		var pos = startPos || t.offsetBy(
			new Wasavi.Position(this.range[0], 0),
			buffer[i].index);
		var replacer = startReplacer || this.executeReplacer(buffer[i]);

		var goal = buffer.length;

		while (i < goal) {
			this.doSubstitute(pos, buffer[i][0].length, replacer);
			while (true) {
				var delta = replacer.length - buffer[i][0].length;
				var rowPrev = pos.row;
				var indexPrev = buffer[i].index;

				if (++i >= goal) {
					break;
				}

				pos = t.offsetBy(
					pos,
					buffer[i].index - indexPrev + delta);

				if (this.isGlobal || pos.row > rowPrev) {
					replacer = this.executeReplacer(buffer[i]);
					break;
				}

				replacer = buffer[i][0];
			}
		}
	},
	setupConfirmModeSubst: function () {
		var t = this.app.buffer;
		var buffer = this.buffer;

		/*
		 * initializing
		 */

		var k = this.kontinueWorker = {
			index: 0,
			pos: t.offsetBy(
				new Wasavi.Position(this.range[0], 0),
				buffer[0].index),
			replacer: this.executeReplacer(buffer[0])
		};

		t.setSelectionRange(k.pos);
		this.app.cursor.ensureVisible();
		t.emphasis(k.pos, buffer[k.index][0].length);

		this.app.exvm.hideOverlay();
		this.app.low.showMessage(
			_('Substitute? [y]es, [n]o, [a]ll, [l]ast, [q]uit'),
			false, true, true);
	},
	continueConfirmModeSubst: function (action) {
		var t = this.app.buffer;
		var buffer = this.buffer;
		var k = this.kontinueWorker;

		/*
		 * main job
		 */

		t.unEmphasis();
		action = action.toLowerCase();
		switch (action) {
		case 'y':
		case 'l':
			this.doSubstitute(
				k.pos,
				buffer[k.index][0].length,
				k.replacer);
			this.app.editLogger.close().open('ex+s');

			if (action == 'l') {
				k.index = buffer.length;
			}
			break;

		case 'n':
			k.replacer = buffer[k.index][0];
			break;

		case 'q':
		case '\u001b':
			k.index = buffer.length;
			break;

		case 'a':
			this.burst(k.index, k.pos, k.replacer);
			this.app.editLogger.close().open('ex+s');
			k.index = buffer.length;
			break;

		default:
			t.emphasis(k.pos, buffer[k.index][0].length);
			this.app.low.requestNotice();
			return true;
		}

		//

		if (k.index < buffer.length) {
			while (true) {
				var delta = k.replacer.length - buffer[k.index][0].length;
				var rowPrev = k.pos.row;
				var indexPrev = buffer[k.index].index;

				if (++k.index >= buffer.length) {
					break;
				}

				k.pos = t.offsetBy(
					k.pos,
					buffer[k.index].index - indexPrev + delta);

				if (this.isGlobal || k.pos.row > rowPrev) {
					k.replacer = this.executeReplacer(buffer[k.index]);
					break;
				}

				k.replacer = buffer[k.index][0];
			}

			if (k.index < buffer.length) {
				t.setSelectionRange(k.pos);
				this.app.cursor.ensureVisible();
				t.emphasis(k.pos, buffer[k.index][0].length);

				// not finished
				return false;
			}
		}

		/*
		 * all replacement is complete
		 */

		if ('nq\u001b'.indexOf(action) < 0) {
			t.setSelectionRange(t.getLineTopOffset2(t.selectionStart));
		}

		this.app.cursor.ensureVisible();
		this.app.exvm.showOverlay();
		this.showResult();
		this.kontinueWorker = this.buffer = null;

		// finished
		return true;
	},
	doSubstitute: function (pos, length, replacer) {
		var t = this.app.buffer;
		t.selectionStart = pos;
		t.selectionEnd = t.offsetBy(t.selectionStart, length);
		this.app.edit.insert(replacer);
		this.substCount++;
	},
	showResult: function (immediate) {
		if (this.substCount) {
			var line = _('{0} {substitution:0} on {1} {line:1}.', this.substCount, this.range[1] - this.range[0] + 1);
			immediate ? this.app.low.showMessage(line) : this.app.low.requestShowMessage(line);
			this.app.isEditCompleted = true;
		}
	},
	showNotFound: function () {
		this.app.low.requestShowMessage(_('Pattern not found: {0}', this.patternString));
	},
	executeReplacer: function (re, opcodes) {
		opcodes || (opcodes = this.replOpcodes);
		if (!opcodes) return '';

		var result = [];
		for (var i = 0, goal = opcodes.length; i < goal; i++) {
			switch (opcodes[i].x) {
			case 0:
				result.push(opcodes[i].v);
				break;
			case 1:
				result.push(re[opcodes[i].v] || '');
				break;
			case 2:
				if (result.length) {
					var tmp = result.lastItem;
					tmp = tmp.charAt(0).toUpperCase() + tmp.substring(1);
					result.lastItem = tmp;
				}
				break;
			case 3:
				if (result.length) {
					var tmp = result.lastItem;
					tmp = tmp.charAt(0).toLowerCase() + tmp.substring(1);
					result.lastItem = tmp;
				}
				break;
			case 4:
				if (result.length) {
					result.lastItem = result.lastItem.toUpperCase();
				}
				break;
			case 5:
				if (result.length) {
					result.lastItem = result.lastItem.toLowerCase();
				}
				break;
			}
		}
		return result.join('');
	},
	compileReplacer: function (repl) {
		/*
		 * Meta characters in replacement string are:
		 *
		 * &        matched text
		 * \0 - \9  back reference in the matched text
		 * \u, \l   capitalize the next letter
		 *
		 *              \uabc -> Abc
		 *              \u\0 -> Def
		 *                  (if \0 equals 'def')
		 *
		 * \U, \L   capitalize whole letter till \e, \E or end of replacement string
		 *
		 *              \Uabc\E -> ABC
		 *              \U\0 -> DEF
		 *                  \0 equals 'def')
		 *
		 * \e, \E   end of \u, \l, \U, \L
		 */

		if (repl == '') return [];

		var stack = [];
		var specialEscapes = {'\\':'\\', 'n':'\n', 't':'\t'};
		var specialLetters = {'\r':'\n'};
		function loop (callDepth, interruptMode, start) {
			/*
			 * opcodes:
			 *   0: literal
			 *   1: backref
			 *   2: upper first
			 *   3: lower first
			 *   4: upper
			 *   5: lower
			 */
			var newOperand = true;
			for (var i = start; i < repl.length; i++) {
				var ch = repl.charAt(i);
				var ate = false;
				if (ch == '\\') {
					if (++i >= repl.length) {
						return i;
					}
					ch += repl.charAt(i);
				}
				switch (ch) {
				case '&': case '\\&':
					if (ch == '&') {
						stack.push({x:1, v:0});
						ate = newOperand = true;
					}
					break;
				case '\\0': case '\\1': case '\\2': case '\\3': case '\\4':
				case '\\5': case '\\6': case '\\7': case '\\8': case '\\9':
					stack.push({x:1, v:ch.charAt(1)});
					ate = newOperand = true;
					break;
				case '\\u':
					i = loop(callDepth + 1, 1, i + 1);
					stack.push({x:2});
					ate = newOperand = true;
					break;
				case '\\l':
					i = loop(callDepth + 1, 1, i + 1);
					stack.push({x:3});
					ate = newOperand = true;
					break;
				case '\\U':
					i = loop(callDepth + 1, 2, i + 1);
					stack.push({x:4});
					ate = newOperand = true;
					break;
				case '\\L':
					i = loop(callDepth + 1, 2, i + 1);
					stack.push({x:5});
					ate = newOperand = true;
					break;
				case '\\e': case '\\E':
					if (callDepth && interruptMode == 2) return i;
					ate = newOperand = true;
					break;
				}
				if (!ate) {
					if (ch.length >= 2 && ch.charAt(0) == '\\') {
						ch = ch.charAt(1);
						ch = specialEscapes[ch] || ch;
					}
					var code = ch.charCodeAt(0);
					if (specialLetters[ch]) {
						ch = specialLetters[ch];
					}
					else if (code >= 0x00 && code != 0x09 && code != 0x0a && code <= 0x1f
					|| code == 0x7f) {
						ch = toVisibleControl(code);
					}
					if (newOperand || stack.length == 0) {
						stack.push({x:0, v:ch});
						newOperand = false;
					}
					else if (stack.length && stack.lastItem.x == 0) {
						stack.lastItem.v += ch;
					}
				}
				if (callDepth && interruptMode == 1) {
					return i;
				}
			}
			return i;
		}
		loop(0, 0, 0);
		return stack;
	}
};

})(typeof global == 'object' ? global : window);

// vim:set ts=4 sw=4 fenc=UTF-8 ff=unix ft=javascript fdm=marker :
