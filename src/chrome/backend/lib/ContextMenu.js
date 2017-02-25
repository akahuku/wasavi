/**
 * context menu for wasavi
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

(function (global) {
	'use strict';

	var MENU_EDIT_WITH_WASAVI = 'edit_with_wasavi';

	function ContextMenu (options) {
		this.options = options || {};
		this.ext = require('./kosian/Kosian').Kosian();
		this.init();
		this.build();
	}

	ContextMenu.prototype = {
		init: function () {},
		build: function () {},
		getRequestRunPayload: function () {
			return {type: 'request-run'};
		},
		getMenuLabel: function (id) {
			var mc = this.ext.messageCatalog;
			return mc && mc[id].message || id;
		}
	};

	function ChromeContextMenu (options) {
		ContextMenu.apply(this, arguments);
	}
	ChromeContextMenu.prototype = Object.create(ContextMenu.prototype, {
		build: {value: function () {
			var that = this;

			chrome.contextMenus.removeAll(function () {
				chrome.contextMenus.create({
					contexts: ['page', 'editable'],
					title: chrome.i18n.getMessage(MENU_EDIT_WITH_WASAVI),
					onclick: function (info, tab) {
						var options;

						if ('frameId' in info) {
							options = {frameId: info.frameId};
						}

						chrome.tabs.sendMessage(
							tab.id, that.getRequestRunPayload(), options);
					}
				});
			});
		}}
	});
	ChromeContextMenu.prototype.constructor = ContextMenu;

	exports.ContextMenu = function (options) {
		if (global.chrome) {
			return new ChromeContextMenu(options);
		}
		return new ContextMenu(options);
	};
})(this);

// vim:set ts=4 sw=4 fenc=UTF-8 ff=unix ft=javascript fdm=marker :
