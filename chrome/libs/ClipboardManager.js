/**
 * clipboard manager
 * =============================================================================
 *
 *
 * @author akahuku@gmail.com
 * @version $Id: ClipboardManager.js 297 2013-06-05 21:35:32Z akahuku $
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

(function () {
	function ClipboardManager () {
		this.set = function (data) {};
		this.get = function () {return '';}
	}

	function ExecCommandClipboardManager () {
		this.constructor = ClipboardManager;
	}

	ExecCommandClipboardManager.prototype = {
		set: function (data) {
			var buffer = document.getElementById('clipboard-buffer');
			data || (data = '');
			if (buffer && data != '') {
				buffer.value = data;
				buffer.focus();
				buffer.select();
				document.execCommand('cut');
			}
		},
		get: function () {
			var buffer = document.getElementById('clipboard-buffer');
			var data = '';
			if (buffer) {
				buffer.value = '';
				buffer.focus();
				document.execCommand('paste');
				data = buffer.value;
			}
			return data;
		}
	};

	function JetpackClipboardManager () {
		this.cb = require('clipboard');
		this.constructor = ClipboardManager;
	}

	JetpackClipboardManager.prototype = {
		set: function (data) {
			this.cb.set(data, 'text');
		},
		get: function () {
			return this.cb.get('text');
		}
	};

	function create (window) {
		if (window.chrome) {
			return new ExecCommandClipboardManager;
		}
		else if (window.opera) {
			return new ExecCommandClipboardManager;
		}
		else if (window.jetpack) {
			return new JetpackClipboardManager;
		}
		else {
			return new ClipboardManager;
		}
	}

	exports.ClipboardManager = {create:create};
})();

// vim:set ts=4 sw=4 fenc=UTF-8 ff=unix ft=javascript fdm=marker :
