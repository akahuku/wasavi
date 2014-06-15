/**
 * context menu for wasavi
 * =============================================================================
 *
 *
 * @author akahuku@gmail.com
 */

(function (global) {
	'use strict';

	function ContextMenu (options) {
		this.options = options;
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
					title:chrome.i18n.getMessage(that.options.menu_id),
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
				title:this.getMenuLabel(that.options.menu_id),
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
		build: {value: function () {
			if (this._contextMenuInitialized) return;

			var cm = require('sdk/context-menu');
			var that = this;
			cm.Item({
				context:cm.SelectorContext('input,textarea'),
				image:self.data.url('images/icon016.png'),
				label:'#',
				contentScriptFile:self.data.url('backend/lib/context_menu.js'),
				onMessage:function (phase) {
					switch (phase) {
					case 1:
						this.label = that.getMenuLabel(that.options.menu_id);
						break;
					case 2:
						that.sendRequest(that.getRequestRunPayload());
						break;
					}
				}
			});
			this._contextMenuInitialized = true;
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
