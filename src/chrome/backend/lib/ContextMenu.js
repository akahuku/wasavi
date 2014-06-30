/**
 * context menu for wasavi
 *
 * @author akahuku@gmail.com
 */
/**
 * Copyright 2012-2014 akahuku, akahuku@gmail.com
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
					contexts:['editable'],
					title:chrome.i18n.getMessage(MENU_EDIT_WITH_WASAVI),
					onclick:function (info, tab) {
						if (!info.editable) return;
						chrome.tabs.sendRequest(
							tab.id, that.getRequestRunPayload());
					}
				});
			});
		}}
	});
	ChromeContextMenu.prototype.constructor = ContextMenu;

	function OperaContextMenu (options) {
		ContextMenu.apply(this, arguments);
	}
	OperaContextMenu.prototype = Object.create(ContextMenu.prototype, {
		build: {value: function () {
			if (!opera.contexts || !opera.contexts.menu) return;

			var that = this;

			while (opera.contexts.menu.length) {
				opera.contexts.menu.removeItem(0);
			}
			opera.contexts.menu.addItem(opera.contexts.menu.createItem({
				contexts:['editable'],
				icon:'images/icon016.png',
				title:this.getMenuLabel(MENU_EDIT_WITH_WASAVI),
				onclick:function (e) {
					if (!e.isEditable) return;
					e.source.postMessage(that.getRequestRunPayload());
				}
			}));
		}}
	});
	OperaContextMenu.prototype.constructor = ContextMenu;

	function FirefoxContextMenu (options) {
		ContextMenu.apply(this, arguments);
	}
	FirefoxContextMenu.prototype = Object.create(ContextMenu.prototype, {
		build: {value: function (force) {
			if (this._initialized && !force) return;
			var self = require('sdk/self');
			var cm = require('sdk/context-menu');
			var that = this;
			cm.Item({
				context:cm.SelectorContext('input,textarea'),
				image:self.data.url('images/icon016.png'),
				label:'#',
				contentScriptFile:self.data.url('scripts/context_menu.js'),
				onMessage:function (phase) {
					switch (phase) {
					case 1:
						this.label = that.getMenuLabel(MENU_EDIT_WITH_WASAVI);
						break;
					case 2:
						that.ext.postMessage(that.getRequestRunPayload());
						break;
					}
				}
			});
			this._initialized = true;
		}}
	});
	FirefoxContextMenu.prototype.constructor = ContextMenu;

	exports.ContextMenu = function (options) {
		if (global.chrome) {
			return new ChromeContextMenu(options);
		}
		else if (global.opera) {
			return new OperaContextMenu(options);
		}
		else if (require('sdk/self')) {
			return new FirefoxContextMenu(options);
		}
		return new ContextMenu(options);
	};
})(this);

// vim:set ts=4 sw=4 fenc=UTF-8 ff=unix ft=javascript fdm=marker :
