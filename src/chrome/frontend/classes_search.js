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

/*constructor*/function PairBracketsIndicator (targetChar, app, initialPos) {
	const BLINK_FREQ_SECS = 0.1;
	const BLINK_COUNT_MAX = 10;

	var buffer = app.buffer;
	var bracketNode;
	var timer1, timer2;

	function setColor (visible) {
		var fg, bg;
		if (visible) {
			fg = app.theme.colors.highlightFg;
			bg = app.theme.colors.highlightBg;
		}
		else {
			fg = app.theme.colors.rowFg;
			bg = 'transparent';
		}
		bracketNode.style.color = fg;
		bracketNode.style.backgroundColor = bg;
	}
	function clear () {
		timer1 && clearTimeout(timer1);
		timer2 && clearInterval(timer2);
		timer1 = timer2 = null;
		buffer.unEmphasis();
	}
	function dispose () {
		clear();
		app = buffer = null;
	}

	this.clear = clear;
	this.dispose = dispose;

	timer1 = setTimeout(function () {
		timer1 = null;
		bracketNode = buffer.emphasis(initialPos, 1)[0];

		let ss = buffer.selectionStart;
		let count = minmax(1, app.config.vars.matchtime, BLINK_COUNT_MAX);
		let visible = true;

		app.keyManager.editable.setSelectionRange(buffer.rowNodes(ss), ss.col);
		setColor(visible);
		timer2 = setInterval(function () {
			count--;
			if (count <= 0) {
				setColor(false);
				clearInterval(timer2);
				timer2 = null;
			}
			else {
				visible = !visible;
				setColor(visible);
			}
		}, 1000 * BLINK_FREQ_SECS);
	}, 1);
}

/*constructor*/function BufferIterator (buffer) {
	this.buffer = buffer;
}
BufferIterator.prototype = {
	inc: function (pos) {
		var p = pos || this.buffer.selectionStart;
		try {
			var s = this.buffer.rows(p);
			if (p.col < s.length) {
				p.col = this.buffer.rightClusterPos(p).col;
				return p.col < s.length ? 0 : 2;
			}
			if (p.row < this.buffer.rowLength - 1) {
				p.col = 0;
				p.row++;
				return 1;
			}
			return -1;
		}
		finally {
			!pos && this.buffer.setSelectionRange(p);
		}
	},
	dec: function (pos) {
		var p = pos || this.buffer.selectionStart;
		try {
			if (p.col > 0) {
				p.col = this.buffer.leftClusterPos(p).col;
				return 0;
			}
			if (p.row > 0) {
				p.row--;
				p.col = this.buffer.rows(p).length;
				return 1;
			}
			return -1;
		}
		finally {
			!pos && this.buffer.setSelectionRange(p);
		}
	},
	incl: function (pos) {
		var r = this.inc(pos);
		if (r >= 1 && (pos && pos.col || !pos && this.buffer.selectionStartCol)) {
			r = this.inc(pos);
		}
		return r;
	},
	decl: function (pos) {
		var r = this.dec(pos);
		if (r == 1 && (pos && pos.col || !pos && this.buffer.selectionStartCol)) {
			r = this.dec(pos);
		}
		return r;
	}
};

// almost methods in this class are ported from search.c of vim.
Wasavi.SearchUtils = function (app) {
	/*
	 * consts
	 */

	const BRACKETS = Wasavi.BRACKETS;
	const CLOSE_BRACKETS = Wasavi.CLOSE_BRACKETS;

	/*
	 * variables
	 */

	var buffer = app.buffer;
	var spaces = spc('S');
	var iterator = new BufferIterator(buffer);
	var paragraphs;
	var sections;

	/*
	 * private functions
	 */

	function findNextQuote (line, col, quoteChar) {
		var escapeChar = app.config.vars.quoteescape;
		for (var goal = line.length; col < goal; col++) {
			var c = line.charAt(col);
			if (c == escapeChar) {
				col++;
			}
			else if (c == quoteChar) {
				return col;
			}
		}
		return -1;
	}
	function findPrevQuote (line, col, quoteChar) {
		var escapeChar = app.config.vars.quoteescape;
		while (col-- > 0) {
			var n = 0;
			while (col - n > 0 && line.charAt(col - n - 1) == escapeChar) {
				n++;
			}
			if (n & 1) {
				col -= n;
			}
			else if (line.charAt(col) == quoteChar) {
				return col;
			}
		}
		return 0;
	}
	function getSimpleCharClass (n, bigword) {
		n || (n = buffer.selectionStart);
		var c = buffer.charAt(n);
		if (spaces.test(c)) return 0;
		if (bigword) return 1;
		return buffer.charClassAt(n, false, app.config.vars.iskeyword) | 0x10000;
	}
	function backToBoundary (bigword) {
		var n = buffer.selectionStart;
		var sclass = getSimpleCharClass(n, bigword);
		while (true) {
			if (n.col == 0) break;
			n.col--;
			if (getSimpleCharClass(n, bigword) != sclass) {
				n.col++;
				break;
			}
		}
		buffer.setSelectionRange(n);
	}
	function findFirstBlank (pos) {
		while (iterator.decl(pos) != -1) {
			if (!spaces.test(buffer.charAt(pos || buffer.selectionStart))) {
				iterator.incl(pos);
				break;
			}
		}
	}
	function findSentenceForward (count, atStartSent) {
		while (count--) {
			findSentenceBoundary(1, true);
			if (atStartSent) {
				findFirstBlank();
			}
			if (count == 0 || atStartSent) {
				iterator.decl();
			}
			atStartSent = !atStartSent;
		}
	}
	function isInMacro (macros, s) {
		for (var i = 0, goal = macros.length; i < goal; i++) {
			var macro = macros[i];
			if (macro == '') continue;

			var s0 = s.charAt(1);
			var s1 = s.charAt(2);
			var matched1  = macro.charAt(0) == s0;
			var matched1s = macro.charAt(0) == ' ' && /^ ?$/.test(s0);
			var matched2  = macro.charAt(1) == s1;
			var matched2s = /^ ?$/.test(macro.charAt(1)) && (s0 == '' || /^ ?$/.test(s1));
			if ((matched1 || matched1s) && (matched2 || matched2s)) {
				return true;
			}
		}
		return false;
	}
	function isStartOfParagraphOrSection (pos, para, both) {
		var s = buffer.rows(pos);
		para || (para = '');
		both = !!both;
		switch (s.charAt(0)) {
		case para: case '\u240c'/*form-feed-picture*/:
			return true;
		case '}':
			return both;
		case '.':
			return isInMacro(getSections(), s)
				|| !para && isInMacro(getParagraphs(), s);
		}
		return false;
	}
	function isWhiteCharOnly (pos) {
		return spc('^S*$').test(buffer.rows(pos));
	}
	function getSections () {
		if (!sections) {
			try {
				setSectionMacros(app.config.vars.sections);
			}
			catch (e) {
				sections = [];
			}
		}
		return sections;
	}
	function getParagraphs () {
		if (!paragraphs) {
			try {
				setParagraphMacros(app.config.vars.paragraphs);
			}
			catch (e) {
				paragraphs = [];
			}
		}
		return paragraphs;
	}

	/*
	 * public methods
	 */

	function findQuoteRange (line, firstCol, quoteChar) {
		var colStart = 0, colEnd;
		while (true) {
			colStart = findNextQuote(line, colStart, quoteChar);
			if (colStart < 0 || colStart > firstCol) return false;

			colEnd = findNextQuote(line, colStart + 1, quoteChar);
			if (colEnd < 0) return false;

			if (colStart <= firstCol && firstCol <= colEnd) break;

			colStart = colEnd + 1;
		}
		return {start:colStart, end:colEnd};
	}
	function findSentenceBoundary (count, isForward, isFindOnly) {
		var pos = buffer.selectionStart;
		var iter = isForward ? iterator.incl : iterator.decl;
		var noSkip = false;

		while (count--) {
loop:		do {
				if (buffer.isNewline(pos)) {
					do {
						if (iter.call(iterator, pos) == -1) break;
					} while (buffer.isNewline(pos));
					if (isForward) break loop;
				}
				else if (isForward && pos.col == 0 && isStartOfParagraphOrSection(pos, null, false)) {
					if (pos.row >= buffer.rowLength - 1) {
						return false;
					}
					pos.row++;
					break loop;
				}
				else if (!isForward) {
					iterator.decl(pos);
				}

				var foundDot = false;
				while (true) {
					var c = buffer.charAt(pos);
					if (spaces.test(c) || (!isForward && /[.!?)\]"']/.test(buffer.charAt(pos)))) {
						if (/[.!?]/.test(c)) {
							if (foundDot) break;
							foundDot = true;
						}
						if (iterator.decl(pos) == -1) break;
						if (buffer.isNewline(pos) && isForward) {
							iterator.incl(pos);
							break loop;
						}
					}
					else {
						break;
					}
				}

				//
				var startRow = pos.row;
				var cpo_J = true;
				while (true) {
					var c = buffer.charAt(pos);
					if (buffer.isNewline(pos)
					|| pos.col == 0 && isStartOfParagraphOrSection(pos, null, false)) {
						if (!isForward && pos.row != startRow) {
							pos.row++;
						}
						break;
					}
					if (/[.!?]/.test(c)) {
						var tpos = pos.clone();
						while (true) {
							c = iterator.inc(tpos);
							if (c == -1) break;
							c = buffer.charAt(tpos);
							if (!/[)\]"']/.test(c)) break;
						}

						if (c === -1 || buffer.isNewline(tpos)
						|| !cpo_J && spaces.test(c)
						|| cpo_J && (c == ' ' && iterator.inc(tpos) >= 0 && buffer.charAt(tpos) == ' ')) {
							pos = tpos;
							buffer.isNewline(pos) && iterator.inc(pos);
							break;
						}
					}
					if (iter.call(iterator, pos) == -1) {
						if (count) return false;
						noSkip = true;
						break;
					}
				}
			} while (false);

			//
			if (!noSkip) {
				while (spaces.test(buffer.charAt(pos))) {
					if (iterator.incl(pos) == -1) break;
				}
			}
		}

		!isFindOnly && buffer.setSelectionRange(pos);
		return pos;
	}
	function findParagraphBoundary (count, isForward, isFindOnly, what, both) {
		var pos = buffer.selectionStart;
		var posix = true;
		var dir = isForward ? 1 : -1;
		pos.col = 0;
		while (count--) {
			var skipped = false;
			for (var first = true; ; first = false) {
				if (!buffer.isNewline(pos)) {
					skipped = true;
				}
				if (!first && skipped) {
					if (isStartOfParagraphOrSection(pos, what, both)
					||  posix && !what && buffer.rows(pos).charAt(0) == '{') {
						break;
					}
				}
				pos.row += dir;
				if (pos.row < 0 || pos.row >= buffer.rowLength) {
					if (count) return false;
					pos.row -= dir;
					break;
				}
			}
		}
		if (both && buffer.rows(pos).charAt(0) == '}') {
			pos.row++;
		}
		if (pos.row >= buffer.rowLength - 1 && what != '}') {
			pos.col = buffer.rows(pos).length;
			if (pos.col != 0) {
				pos.col--;
			}
		}
		else {
			pos.col = 0;
		}

		!isFindOnly && buffer.setSelectionRange(pos);
		return pos;
	}
	function findMatchedBracket (count, bracketSpecified, initialPos) {
		function findBracket () {
			var i = 0;
			while (!buffer.isEndOfText(n) && !buffer.isNewline(n)) {
				var c = buffer.charAt(n);
				var index = BRACKETS.indexOf(c);
				if (index < 0) {
					var list = app.ffttDictionary.get(c);
					if (list) {
						for (var j in list) {
							index = BRACKETS.indexOf(j);
							if (index >= 0) break;
						}
					}
				}
				if (index >= 0 && ++i == count) {
					return index;
				}
				n = buffer.rightPos(n);
			}
			return -1;
		}
		function findMatchForward (current, match) {
			var depth = 0;
			var prevn = n;
			n = buffer.rightPos(n);
			while (!buffer.isEndOfText(n) && n.ne(prevn)) {
				var c = buffer.charAt(n);
				if (app.ffttDictionary.match(c, current)) {
					depth++;
				}
				else if (app.ffttDictionary.match(c, match)) {
					if (depth == 0) return n;
					depth--;
				}
				prevn = n;
				n = buffer.rightPos(n);
			}
			return null;
		}
		function findMatchBackward (current, match) {
			var depth = 0;
			var prevn = n;
			n = buffer.leftPos(n);
			while ((n.row > 0 || n.col >= 0) && n.ne(prevn)) {
				var c = buffer.charAt(n);
				if (app.ffttDictionary.match(c, current)) {
					depth++;
				}
				else if (app.ffttDictionary.match(c, match)) {
					if (depth == 0) return n;
					depth--;
				}
				prevn = n;
				n = buffer.leftPos(n);
			}
			return null;
		}

		var n = initialPos || buffer.selectionStart;
		var currentIndex = bracketSpecified ?
			BRACKETS.indexOf(bracketSpecified) :
			findBracket();
		if (currentIndex <= -1) return null;

		var baseChar = BRACKETS.charAt(currentIndex);
		var matchChar = BRACKETS.charAt(BRACKETS.length - 1 - currentIndex);
		count || (count = 1);
		if (baseChar == matchChar) {
			var range = findQuoteRange(buffer.rows(n), n.col, baseChar);
			if (!range) return null;
			n.col = n.col == range.start ? range.end : range.start;
			return n;
		}
		else {
			var dir = currentIndex >= BRACKETS.length / 2 ? -1 : 1;
			switch (dir) {
			case -1: return findMatchBackward(baseChar, matchChar);
			case  1: return findMatchForward(baseChar, matchChar);
			}
		}
		return null;
	}
	function quote (count, quoteChar, includeAnchor) {
		var line = buffer.rows(buffer.selectionStartRow);
		var colStart = buffer.selectionStartCol;
		var colEnd;
		if (line.charAt(colStart) == quoteChar) {
			var range = findQuoteRange(line, colStart, quoteChar);
			if (!range) return false;
			colStart = range.start;
			colEnd = range.end;
		}
		else {
			colStart = findPrevQuote(line, colStart, quoteChar);
			if (line.charAt(colStart) != quoteChar) {
				colStart = findNextQuote(line, colStart, quoteChar);
				if (colStart < 0) return false;
			}

			colEnd = findNextQuote(line, colStart + 1, quoteChar);
			if (colEnd < 0) return false;
		}
		if (includeAnchor) {
			if (spaces.test(line.charAt(colEnd + 1))) {
				while (spaces.test(line.charAt(colEnd + 1))) {
					colEnd++;
				}
			}
			else {
				while (colStart > 0 && spaces.test(line.charAt(colStart - 1))) {
					colStart--;
				}
			}
		}
		if (!includeAnchor && count < 2) {
			colStart++;
		}
		if (includeAnchor || count >= 2) {
			colEnd++;
		}
		var row = buffer.selectionStartRow;
		buffer.setSelectionRange(new Wasavi.Position(row, colStart), new Wasavi.Position(row, colEnd));
		return true;
	}
	function word (count, bigword, includeAnchor) {
		bigword = bigword == 'W';
		backToBoundary(bigword);
		if (includeAnchor) {
			if (getSimpleCharClass(null, bigword) == 0) {
				app.motion.nextWord('', count, bigword, true);
				app.motion.right('', 1);
			}
			else {
				app.motion.nextWord('', count, bigword);
			}
		}
		else {
			if (getSimpleCharClass(null, bigword) == 0) {
				app.motion.nextWord('', 1);
				buffer.setSelectionRange(buffer.selectionEnd);
			}
			app.motion.nextWord('', count, bigword, true);
			//if (buffer.selectionStartRow != buffer.selectionEndRow
			//||  buffer.selectionEndCol - buffer.selectionStartCol != 1) {
				app.motion.right('', 1);
			//}
		}
		return true;
	}
	function block (count, what, over, includeAnchor) {
		if (app.ffttDictionary.match(buffer.charAt(buffer.selectionStart), what)) {
			app.motion.right('', 1);
			buffer.setSelectionRange(buffer.selectionEnd);
		}
		var origPos = buffer.selectionStart;
		var startPos, endPos;
		do {
			startPos = findMatchedBracket(count, over);
			if (!startPos) break;

			buffer.setSelectionRange(startPos);
			endPos = findMatchedBracket(count);
			if (!endPos) break;

			if (includeAnchor) {
				endPos = buffer.rightPos(endPos);
			}
			else {
				startPos = buffer.rightPos(startPos);
			}
		} while (false);

		if (startPos && endPos) {
			buffer.setSelectionRange(startPos, endPos);
			return true;
		}
		else {
			buffer.setSelectionRange(origPos);
			return false;
		}
	}
	function sentence (count, includeAnchor) {
		var startPos = buffer.selectionStart;
		var startBlank = false;

		//
		findSentenceBoundary(1, true);

		//
		var pos = startPos.clone();
		while (spaces.test(buffer.charAt(pos))) {
			iterator.incl(pos);
		}
		if (pos.eq(buffer.selectionStart)) {
			if (includeAnchor) {
				startBlank = true;
				findFirstBlank(startPos);
			}
			else {
				startPos = buffer.selectionStart;
			}
		}
		else {
			findSentenceBoundary(1, false);
			startPos = buffer.selectionStart;
		}

		//
		var nCount = includeAnchor ? count * 2 : (count - (startBlank ? 1 : 0));
		if (nCount > 0) {
			findSentenceForward(nCount, true);
		}
		else {
			iterator.decl();
		}

		//
		if (includeAnchor) {
			if (startBlank) {
				findFirstBlank();
				if (spaces.test(buffer.charAt(buffer.selectionStart))) {
					iterator.decl();
				}
			}
			else if (!spaces.test(buffer.charAt(buffer.selectionStart))) {
				findFirstBlank(startPos);
			}
		}

		//
		iterator.incl();
		buffer.setSelectionRange(startPos, buffer.selectionStart);
		return true;
	}
	function paragraph (count, includeAnchor) {
		var startPos = new Wasavi.Position(buffer.selectionStartRow, 0);
		var whiteInFront = isWhiteCharOnly(startPos);

		//
		var prevPos = new Wasavi.Position(startPos.row - 1, 0);
		while (startPos.row > 0) {
			if (whiteInFront) {
				if (!isWhiteCharOnly(prevPos)) break;
			}
			else {
				if (isWhiteCharOnly(prevPos)
				||  isStartOfParagraphOrSection(startPos, null, false)) break;
			}
			startPos.row--, prevPos.row--;
		}

		//
		if (!includeAnchor && isWhiteCharOnly(startPos)) {
			whiteInFront = false;
			while (startPos.row < buffer.rowLength - 1
			&& isWhiteCharOnly(startPos)) {
				startPos.row++;
			}
		}

		//
		var endPos = startPos.clone();
		while (endPos.row < buffer.rowLength && isWhiteCharOnly(endPos)) {
			endPos.row++;
		}
		endPos.row--;

		//
		var doWhite = false;
		var nextPos = new Wasavi.Position(endPos.row + 1, 0);
		for (var i = count - (!includeAnchor && whiteInFront ? 1 : 0); i--; ) {
			if (endPos.row >= buffer.rowLength - 1) return false;
			if (!includeAnchor) {
				doWhite = isWhiteCharOnly(nextPos);
			}
			if (includeAnchor || !doWhite) {
				endPos.row++, nextPos.row++;
				while (endPos.row < buffer.rowLength - 1
				&& !isWhiteCharOnly(nextPos)
				&& !isStartOfParagraphOrSection(nextPos, null, false)) {
					endPos.row++, nextPos.row++;
				}
			}
			if (i == 0 && whiteInFront && includeAnchor) {
				break;
			}
			if (includeAnchor || doWhite) {
				while (endPos.row < buffer.rowLength - 1
				&& isWhiteCharOnly(nextPos)) {
					endPos.row++, nextPos.row++;
				}
			}
		}

		//
		if (!whiteInFront && !isWhiteCharOnly(endPos) && includeAnchor) {
			var prevPos = new Wasavi.Position(startPos.row - 1, 0);
			while (startPos.row > 0 && isWhiteCharOnly(prevPos)) {
				startPos.row--, prevPos.row--;
			}
		}

		//
		app.isVerticalMotion = true;
		buffer.setSelectionRange(startPos, endPos);
		return true;
	}
	function isInTag (p) {
		var text = app.lastRegexFindCommand.text;
		var start, end, content;

		//
		var ss;
		if (p != undefined) {
			if (isNumber(p)) {
				ss = p;
			}
			else if (p instanceof Wasavi.Position) {
				ss = buffer.binaryPositionToLinearPosition(p);
			}
			else {
				return false;
			}
		}
		else {
			ss = buffer.binaryPositionToLinearPosition(buffer.selectionStart);
		}

		//
		switch (text.charAt(ss)) {
		case '<':
			start = ss;
			end = ss + 1;
			break;
		case '>':
			start = ss - 1;
			end = ss;
			break;
		default:
			start = ss - 1;
			end = ss + 1;
			break;
		}

		//
		while (start >= 0 && text.charAt(start) != '<' && text.charAt(start) != '>') {
			start--;
		}
		if (start < 0) return false;

		//
		while (end < text.length && text.charAt(end) != '<' && text.charAt(end) != '>') {
			end++;
		}
		if (end >= text.length) return false;
		end++;

		//
		content = text.substring(start, end).replace(/\n/g, ' ');

		// close tag: </tag>
		if (/^<\/.*?>$/.test(content)) {
			return {start:start, end:end, id:1, content:content};
		}

		// XML Declaration: <? ... ?>
		else if (/^<\?.*?\?>$/.test(content)) {
			return false;
		}

		// XML Null End Tag: <tag/>
		else if (/^<.*?\/>$/.test(content)) {
			return {start:start, end:end, id:2, content:content};
		}

		// SGML Comment Declaration: <! ... >
		else if (/^<!.*?>$/.test(content)) {
			return false;
		}

		// open tag: <tag>
		else if (/^<.*?>$/.test(content)) {
			return {start:start, end:end, id:0, content:content};
		}

		return false;
	}
	function findCloseTag (tagName, start, end) {
		var text = app.lastRegexFindCommand.text;
		var regex = new RegExp('<(/)?' + tagName + '(?:[\\s\\n][^>]*>|>)', 'ig');
		var nestLevel = 0;
		var re;

		regex.lastIndex = start;
		while ((re = regex.exec(text))) {
			if (re[1] == undefined || re[1] == '') {
				nestLevel++;
			}
			else {
				nestLevel--;
				if (nestLevel < 0) {
					break;
				}
				if (nestLevel == 0 && re.index >= end) {
					return {offset:re.index, matchLength:re[0].length};
				}
			}
		}
		return false;
	}
	function skipIndent (p) {
		var p1 = buffer.getLineTopOffset(p);
		var p2 = buffer.getLineTopOffset2(p);
		return p1.le(p) && p.lt(p2) ? p2 : p;
	}
	function tag (count, includeAnchor, recursive) {
/*
 *** test case ***
<html>
 <head>
 </head>
 <body>
  <div class="outer-div">
   <div>inner div</div>
   <p>paragraph</p>
  </div>
 </body>
</html>

sequential it:
	#1  6,6  - 6,14  paragraph
	#2  6,3  - 6,18  <p>paragraph</p>
	#3  4,25 - 7,1   ...<div> ~ </p>\n..
	#4  4,2  - 7,7   <div class ~ </div>
	#5  3,7  - 8,0   ..<div class ~ </div>\n.
	#6  3,1  - 8,7   <body> ~ </body>
	#7  0,6  - 8,8   .<head> ~ </body>\n
	#8  0,0  - 9,6   <html> ~ </html>

sequential at:
	#1  6,3  - 6,18  <p>paragraph</p>
	#2  4,2  - 7,7   <div class ~ </div>
	#3  3,1  - 8,7   <body> ~ </body>
	#4  0,0  - 9,6   <html> ~ </html>
 */
		var result = app.low.isBound();
		var ss, se;
		if (app.low.isBound()) {
			ss = app.marks.getPrivate('<');
			se = app.marks.getPrivate('>');
		}
		else {
			ss = buffer.selectionStart;
			se = buffer.selectionEnd;
		}

		app.motion.findByRegexForward(/./g, 1, {wrapscan: false});

		try {
			var startPos = recursive ? ss.clone() : skipIndent(ss);
			var tagp = isInTag(startPos);
			var startOffset;
			var currentOffset;
			var openTagInfo;
			var closeTagInfo;

			if (tagp) {
				switch (tagp.id) {
				case 0: // open tag
				case 2: // shorten tag
					// cursor is on an open tag. move to just after '>'
					// <tag>
					//      ^
					startOffset = tagp.end;
					break;

				case 1: // close tag
					// cursor is on a close tag. move to '<'
					// </tag>
					// ^
					startOffset = tagp.start;
					break;
				}
			}

			if (startOffset == undefined) {
				startOffset = buffer.binaryPositionToLinearPosition(startPos);
			}

			currentOffset = startOffset;

			for (var i = 0; i < count; ) {
				buffer.setSelectionRange(currentOffset);
				openTagInfo = app.motion.findByRegexBackward(/<[^!?\/][^>]*>/g, 1, {wrapscan: false});
				if (!openTagInfo) return result;

				tagp = isInTag(openTagInfo.offset);
				if (tagp && tagp.id == 0) {
					closeTagInfo = findCloseTag(
						/^<([^>\s\n]*)/.exec(tagp.content)[1],
						openTagInfo.offset,
						startOffset);

					closeTagInfo && i++;
				}

				currentOffset = openTagInfo.offset;
			}

			if (!openTagInfo || !closeTagInfo) {
				return result;
			}

			var ss2, se2;
			if (includeAnchor) {
				ss2 = buffer.linearPositionToBinaryPosition(
					openTagInfo.offset);
				se2 = buffer.linearPositionToBinaryPosition(
					closeTagInfo.offset + closeTagInfo.matchLength);
			}
			else {
				ss2 = buffer.linearPositionToBinaryPosition(
					openTagInfo.offset + openTagInfo.matchLength);
				se2 = buffer.linearPositionToBinaryPosition(
					closeTagInfo.offset);

			}
			if (app.low.isBound()) {
				se2 = buffer.leftPos(se2);
				if (buffer.rows(se2).length && buffer.isNewline(se2)) {
					se2 = buffer.leftPos(se2);
				}
			}

			//
			if (!recursive && ss.le(ss2) && se2.le(se)) {
				buffer.setSelectionRange(ss, se);
				var nestedResult;
				if (includeAnchor) {
					nestedResult = tag(count + 1, true, true);
				}
				else {
					if (buffer.charAt(ss) == '<' && buffer.charAt(se) == '>') {
						nestedResult = tag(count + 1, false, true);
					}
					else {
						nestedResult = tag(count, true, true);
					}
				}
				if (!nestedResult) return result;

				ss2 = buffer.selectionStart;
				se2 = buffer.selectionEnd;
			}

			//
			if (app.low.isBound()) {
				buffer.unEmphasis(Wasavi.BOUND_CLASS);
				app.marks.setPrivate('<', ss2);
				app.marks.setPrivate('>', se2);
			}
			ss = ss2;
			se = se2;
			result = true;
			return result;
		}
		finally {
			buffer.setSelectionRange(ss, se);
		}
	}
	function dispatchRangeSymbol (count, targetChar, includeAnchor) {
		switch (targetChar) {
		case '"': case "'": case '`':
			return quote.apply(null, arguments);

		case '[': case ']':
			return block(count, '[', ']', includeAnchor);
		case '{': case '}': case 'B':
			return block(count, '{', '}', includeAnchor);
		case '<': case '>':
			return block(count, '<', '>', includeAnchor);
		case '(': case ')': case 'b':
			return block(count, '(', ')', includeAnchor);

		case 'w': case 'W':
			return word.apply(null, arguments);

		case 'p':
			return paragraph(count, includeAnchor);
		case 's':
			return sentence(count, includeAnchor);

		case 't':
			return tag(count, includeAnchor);
		}
		return false;
	}
	function setParagraphMacros (m) {
		if (!/^[a-zA-Z ]+$/.test(m) || m.length % 2) {
			throw new TypeError(_('Invalid paragraph format: {0}', m));
		}
		paragraphs = [];
		m.replace(/../g, function (a) {paragraphs.push(a)});
	}
	function setSectionMacros (m) {
		if (!/^[a-zA-Z ]+$/.test(m) || m.length % 2) {
			throw new TypeError(_('Invalid section format: {0}', m));
		}
		sections = [];
		m.replace(/../g, function (a) {sections.push(a)});
	}
	function getPairBracketsIndicator (targetChar, initialPos) {
		if (targetChar != '' && CLOSE_BRACKETS.indexOf(targetChar) >= 0) {
			var result = findMatchedBracket(1, targetChar, initialPos);
			if (result) {
				return new PairBracketsIndicator(targetChar, app, result);
			}
		}
		return null;
	}
	function dispose () {
		app = buffer = null;
	}

	publish(this,
		findQuoteRange, findSentenceBoundary, findParagraphBoundary, findMatchedBracket,
		quote, word, block, sentence, paragraph,
		dispatchRangeSymbol,
		setParagraphMacros, setSectionMacros,
		getPairBracketsIndicator,
		dispose
	);
};

})(typeof global == 'object' ? global : window);

// vim:set ts=4 sw=4 fenc=UTF-8 ff=unix ft=javascript fdm=marker :
