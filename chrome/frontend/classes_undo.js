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
 * @version $Id: classes_undo.js 264 2012-12-27 16:30:18Z akahuku $
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

Wasavi.EditLogger = function (app, max) {
	this.init(app, max);
};
Wasavi.EditLogger.ITEM_TYPE = {
	NOP: 0,
	INSERT: 1,
	OVERWRITE: 2,
	DELETE: 3,
	SHIFT: 4,
	UNSHIFT: 5
};
Wasavi.EditLogger.prototype = new function () {
	/*constructor*/function EditLogItemBase () {
		this.position = undefined;
		this.data = undefined;
		this.inputMethod = 'insertChars';
	}
	EditLogItemBase.prototype = {
		type: 'Base',
		_init: function (p, d) {
			if (p != undefined) this.position = p.clone();
			if (d != undefined) this.data = d.replace(
				// /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, function (a) {
				/[\u0000-\u0008\u000b-\u001f\u007f]/g, function (a) {
					return toVisibleControl(a.charCodeAt(0));
				});
		},
		_dump: function (depth) {
			return multiply(' ', depth) +
				'+ ' + this.type + '\n' +
				multiply(' ', depth + 2) +
				'position:' + (this.position ? this.position.toString() : '(N/A)') +
				', data:' + (this.data != undefined ? ('"' + toVisibleString(this.data) + '"') : '(N/A)');
		},
		_ensureValidPosition: function (t, p) {
			return p.row >= 0 && p.row < t.rowLength
				&& p.col >= 0 && p.col <= t.rows(p).length;
		},
		_ensureValidPositionForAppend: function (t, p) {
			if (this.isLineOrient && p.row == t.rowLength) {
				return true;
			}
			return this._ensureValidPosition(t, p);
		},
		init: function () {
			this._init.apply(this, arguments);
		},
		undo: function () {
		},
		redo: function () {
		},
		restorePosition: function () {
		},
		dump: function (depth) {
			return this._dump(depth);
		},
		toString: function () {
			return '[object EditLogItem' + this.type + ']';
		}
	};
	/*
	 * insert: point, data
	 *
	 *     edit, and redo operation:
	 *     abcdefghijklmn -> abcABCdefghijklmn
	 *        ^                    ^
	 *        ABC
	 *
	 *     undo operation:
	 *     abcABCdefghijklmn -> abcdefghijklmn
	 *        ^                    ^
	 */
	/*constructor*/function EditLogItemInsert () {}
	EditLogItemInsert.prototype = extend(new EditLogItemBase, {
		type: 'Insert',
		init: function (p, d) {
			this._init.apply(this, arguments);
		},
		undo: function (app, t, isClusterMember) {
			if (!this._ensureValidPosition(t, this.position)) {
				app.devMode && console.error(this.toString() + '#undo: bad position!');
				return 0;
			}

			var ss = this.position.clone();
			var se = this.position2 ? this.position2.clone() : t.offsetBy(ss, this.data.length);
			var data2 = this.hasOwnProperty('data2') ? this.data2 : false;

			if (this.hasOwnProperty('isLineOrient')) {
				t.isLineOrientSelection = this.isLineOrient;
			}
			else {
				t.isLineOrientSelection = false;
			}

			if (t.getSelection(ss, se) != this.data) {
				app.devMode && console.error([
					this.toString() + '#undo: bad consistency!',
					' position: ' + this.position,
					'position2: ' + (this.position2 || '(N/A)'),
					'       LO: ' + this.isLineOrient,
					'       ss: ' + ss,
					'       se: ' + se,
					'selection: ' + toVisibleString(t.getSelection(ss, se)),
					'this.data: ' + toVisibleString(this.data)
				].join('\n'));
				return 0;
			}

			app.marks.update(t.selectionStart, function () {
				t.deleteRange(ss, se);
			});
			data2 !== false && t.setRow(ss, data2);
			!isClusterMember && this.restorePosition(app);
			t.isLineOrientSelection = false;

			return 1;
		},
		redo: function (app, t, isClusterMember) {
			if (!this._ensureValidPositionForAppend(t, this.position)) {
				app.devMode && console.error([
					this.toString() + '#redo: bad position!',
					'this.position: ' + this.position,
					'  t.rowLength: ' + t.rowLength
				].join('\n'));
				return 0;
			}

			var self = this;
			app.marks.update(this.position, function () {
				var data = self.data;

				if (self.isLastLine) {
					data = trimTerm(data);
				}
				if (self.position.row == t.rowLength) {
					t.setSelectionRange(new Wasavi.Position(
						t.rowLength - 1,
						t.rows(t.rowLength - 1).length
					));
					t.divideLine();
				}
				else {
					t.setSelectionRange(self.position);
				}

				var re = data.match(/\n|[^\n]+/g);
				if (!re) return;

				for (var i = 0; i < re.length; i++) {
					re[i] == '\n' ?
						isMultilineTextInput(app.targetElement) && t.divideLine() :
						t.setSelectionRange(t[self.inputMethod](t.selectionStart, re[i]));
				}
			});
			if (this.marks) {
				for (var i in this.marks) {
					!app.marks.get(i) && app.marks.set(i, this.marks[i]);
				}
			}
			!isClusterMember && this.restorePosition(app);

			return 1;
		},
		restorePosition: function (app) {
			var n = this.position.clone();
			if (n.row < app.buffer.rowLength && n.col >= app.buffer.rows(n).length) {
				n.row++;
				n.col = 0;
			}
			if (n.row >= app.buffer.rowLength) {
				n.row = app.buffer.rowLength - 1;
				app.buffer.setSelectionRange(app.buffer.getLineTopOffset2(n));
			}
			else {
				app.buffer.setSelectionRange(n);
			}
		}
	});
	/*
	 * overwrite: point, data, data2
	 *
	 *     * example data:
	 *
	 *       point:[0,3]
	 *       data:"ABC"
	 *       data2:"abcdefghijklmn"
	 *
	 *     * edit, and redo operation:
	 *
	 *       abcdefghijklmn -> abcABCghijklmn
	 *          ^                    ^
	 *          ABC
	 *
	 *     * undo operation:
	 *
	 *       abcABCdefghijklmn -> abcdefghijklmn
	 *          ^                    ^
	 */
	/*constructor*/function EditLogItemOverwrite () {}
	EditLogItemOverwrite.prototype = extend(new EditLogItemBase, {
		type: 'Overwrite',
		init: function (p, d, d2) {
			this._init.apply(this, arguments);
			this.data2 = d2;
			this.inputMethod = 'overwriteChars';
		},
		undo: function () {
			return EditLogItemInsert.prototype.undo.apply(this, arguments);
		},
		redo: function () {
			return EditLogItemInsert.prototype.redo.apply(this, arguments);
		},
		restorePosition: function () {
			return EditLogItemInsert.prototype.restorePosition.apply(this, arguments);
		},
		dump: function (depth) {
			var indent = '\n' + multiply(' ', depth + 2);
			return this._dump(depth) +
				indent + 'data2:"' + toVisibleString(this.data2) + '"';
		}
	});
	/*
	 * delete: point, data
	 *
	 *     edit, and redo operation:
	 *     abcdefghijklmn -> abcghijklmn
	 *        ^                 ^
	 *        def
	 *
	 *     undo operation:
	 *     abcghijklmn -> abcdefghijklmn
	 *        ^              ^
	 *        def
	 */
	/*constructor*/function EditLogItemDelete () {}
	EditLogItemDelete.prototype = extend(new EditLogItemBase, {
		type: 'Delete',
		init: function (p, d, p2, lo, ll, ms) {
			this._init.apply(this, arguments);
			this.position2 = p2.clone();
			this.isLineOrient = !!lo;
			this.isLastLine = !!ll;
			this.marks = ms;
		},
		undo: function () {
			return EditLogItemInsert.prototype.redo.apply(this, arguments);
		},
		redo: function () {
			return EditLogItemInsert.prototype.undo.apply(this, arguments);
		},
		restorePosition: function () {
			return EditLogItemInsert.prototype.restorePosition.apply(this, arguments);
		},
		dump: function (depth) {
			var indent = '\n' + multiply(' ', depth + 2);
			return this._dump(depth) +
				indent + 'position2:' + this.position2.toString() +
				indent + 'isLineOrient:' + this.isLineOrient +
				indent + 'isLastLine:' + this.isLastLine;
		}
	});
	/*
	 * shift: point, count
	 */
	/*constructor*/function EditLogItemShift () {}
	EditLogItemShift.prototype = extend(new EditLogItemBase, {
		type: 'Shift',
		init: function (p, d, rc, sc, sw, ts) {
			this._init.apply(this, arguments);
			this.rowCount = rc;
			this.shiftCount = sc;
			this.shiftWidth = sw;
			this.tabStop = ts;
		},
		undo: function (app, t, isClusterMember) {
			if (!this._ensureValidPosition(t, this.position)) {
				app.devMode && console.error(this.toString() + '#undo: bad position!');
				return 0;
			}
			var s = this;
			app.marks.update(this.position, function () {
				t.shift(
					s.position.row,
					Math.min(s.position.row + s.rowCount, t.rowLength) - s.position.row,
					-s.shiftCount, s.shiftWidth, s.tabStop
				);
			});
			!isClusterMember && this.restorePosition(app);
			return 1;
		},
		redo: function (app, t, isClusterMember) {
			if (!this._ensureValidPosition(t, this.position)) {
				app.devMode && console.error(this.toString() + '#redo: bad position!');
				return 0;
			}
			var s = this;
			app.marks.update(this.position, function () {
				t.shift(
					s.position.row,
					Math.min(s.position.row + s.rowCount, t.rowLength) - s.position.row,
					s.shiftCount, s.shiftWidth, s.tabStop, s.indents
				);
			});
			!isClusterMember && this.restorePosition(app);
			return 1;
		},
		restorePosition: function (app) {
			var n = this.position.clone();
			if (n.row >= app.buffer.rowLength) {
				n.row = app.buffer.rowLength - 1;
			}
			app.buffer.setSelectionRange(app.buffer.getLineTopOffset2(n));
		},
		dump: function (depth) {
			var indent = '\n' + multiply(' ', depth + 2);
			return this._dump(depth) +
				indent + 'rc:' + this.rowCount +
				indent + 'sc:' + this.shiftCount +
				indent + 'sw:' + this.shiftWidth +
				indent + 'ts:' + this.tabStop;
		}
	});
	/*
	 * unshift: point, count
	 */
	/*constructor*/function EditLogItemUnshift () {}
	EditLogItemUnshift.prototype = extend(new EditLogItemBase, {
		type: 'Unshift',
		init: function () {
			EditLogItemShift.prototype.init.apply(this, arguments);
		},
		undo: function () {
			return EditLogItemShift.prototype.redo.apply(this, arguments);
		},
		redo: function () {
			return EditLogItemShift.prototype.undo.apply(this, arguments);
		},
		restorePosition: function () {
			return EditLogItemShift.prototype.restorePosition.apply(this, arguments);
		},
		dump: function () {
			return EditLogItemShift.prototype.dump.apply(this, arguments);
		}
	});
	/*
	 * edit log item cluster
	 */
	/*constructor*/function EditLogItemCluster () {
		this.items = [];
		this.nestLevel = 0;
	}
	EditLogItemCluster.prototype = {
		push: function (item) {
			this.items.push(item);
		},
		undo: function (app) {
			var result = 0;
			for (var i = this.items.length - 1; i >= 0; i--) {
				result += this.items[i].undo(app, app.buffer, true) || 0;
			}
			result && this.items[0].restorePosition(app);
			return result;
		},
		redo: function (app) {
			var result = 0;
			for (var i = 0; i < this.items.length; i++) {
				result += this.items[i].redo(app, app.buffer, true) || 0;
			}
			result && this.items[0].restorePosition(app);
			return result;
		},
		restorePosition: function (app) {
		},
		trim: function (max) {
			while (this.items.length > max) {
				this.items.shift();
			}
		},

		toString: function () {
			return '[object EditLogItemCluster]';
		},
		dump: function (depth) {
			depth || (depth = 0);
			var result = [multiply(' ', depth) + this.toString()];
			this.items.forEach(function (o) {
				result.push(o.dump(depth + 1));
			});
			return result.join('\n');
		},
		get length () {
			return this.items.length;
		},
		set length (v) {
			this.items.length = v;
		},
		get representer () {
			if (this.items.length > 1) {
				return this;
			}
			else if (this.items.length == 1) {
				return this.items[0];
			}
			return null;
		}
	};

	var pool = [
		EditLogItemBase,
		EditLogItemInsert,
		EditLogItemOverwrite,
		EditLogItemDelete,
		EditLogItemShift,
		EditLogItemUnshift
	];

	return {
		init: function (app, max) {
			this.app = app;
			this.editor = app.buffer;
			this.max = max;
			this.clear();
		},
		clear: function () {
			this.logs = new EditLogItemCluster;
			this.cluster = null;
			this.currentPosition = this.logs.length - 1;
			return this;
		},
		open: function (tag, func) {
			if (this.cluster) {
				this.cluster.nestLevel++;
			}
			else {
				this.cluster = new EditLogItemCluster();
			}
			if (func) {
				try {
					func();
				}
				finally {
					this.close();
				}
			}
			return this;
		},
		write: function (type) {
			var item;
			if (this.cluster && pool[type]) {
				var args = Array.prototype.slice.call(arguments, 1);
				item = new pool[type];
				item.init.apply(item, args);
				this.cluster.push(item);
			}
			else {
				throw new Error('EditLogger: invalid undo item type');
			}
			return item;
		},
		close: function () {
			if (this.cluster) {
				if (--this.cluster.nestLevel < 0) {
					var representer = this.cluster.representer;
					if (representer) {
						this.logs.items.length = this.currentPosition + 1;
						this.logs.push(representer);
						this.logs.trim(this.max);
						this.currentPosition = this.logs.length - 1;
					}
					this.cluster = null;
					//this.app.devMode && console.log('*** editLogger dump ***\n' + this.logs.dump());
				}
			}
			else {
				throw new Error('EditLogger: edit logger doesn\'t open');
			}
			return this;
		},
		undo: function () {
			if (!this.cluster && this.currentPosition >= 0) {
				return this.logs.items[this.currentPosition--].undo(this.app, this.app.buffer);
			}
			else {
				return false;
			}
		},
		redo: function () {
			if (!this.cluster && this.currentPosition < this.logs.length - 1) {
				return this.logs.items[++this.currentPosition].redo(this.app, this.app.buffer);
			}
			else {
				return false;
			}
		},
		dispose: function () {
			this.app = this.editor = this.logs = this.cluster = null;
		},
		get logMax () {
			return this.max;
		},
		set logMax (v) {
			if (typeof v != 'number' || v < 0) {
				throw new Exeception('EditLogger: invalid logMax');
			}
			this.max = v;
			this.logs.trim(this.max);
			this.currentPosition = this.logs.length - 1;
		},
		get clusterNestLevel () {
			return this.cluster ? this.cluster.nestLevel : -1;
		}
	};
};

// vim:set ts=4 sw=4 fenc=UTF-8 ff=unix ft=javascript fdm=marker :
