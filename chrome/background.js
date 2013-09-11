/**
 * wasavi: vi clone implemented in javascript
 * =============================================================================
 *
 *
 * @author akahuku@gmail.com
 * @version $Id: background.js 382 2013-09-11 02:36:32Z akahuku $
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

/**
 * standardization for global name space
 */

if (typeof window == 'undefined') {
	this.window = this;
	window.jetpack = {};
}

/**
 * load library on Firefox
 */

if (window.jetpack && typeof require == 'function') {
	[
		[require('sdk/base64'), function (lib, global) {
			global.atob = lib.decode;
			global.btoa = lib.encode;
		}],

		//[require('./jsOAuth'),				'OAuth'],
		[require('./sha1'),						'SHA1'],
		[require('./blowfish'),					'Blowfish'],

		[require('./WasaviUtils'),				'WasaviUtils'],
		[require('./StorageWrapper'),			'StorageWrapper'],
		[require('./ClipboardManager'),			'ClipboardManager'],
		[require('./ResourceLoader'),			'ResourceLoader'],
		[require('./TabWatcher'),				'TabWatcher'],
		[require('./FileSystem'),				'FileSystem'],
		//[require('./SimilarityComputer'),		'SimilarityComputer'],
		[require('./RuntimeOverwriteSettings'), 'RuntimeOverwriteSettings'],
		[require('./Hotkey'),					'Hotkey']
	]
	.forEach(
		function (lib) {
			if (typeof lib[1] == 'string') {
				this[lib[1]] = lib[0][lib[1]];
			}
			else if (typeof lib[1] == 'function') {
				lib[1](lib[0], this);
			}
		},
		this
	);
}

/**
 * main code of background
 */

(function (global) {
	'use strict';

	/* {{{1 consts */

	var TEST_MODE_URL = 'http://wasavi.appsweets.net/test_frame.html';
	var TEST_VERSION = '0.0.1';
	var MENU_EDIT_WITH_WASAVI = 'edit_with_wasavi';



	/* {{{1 variables */

	var u;
	var extension;
	var fstab;
	var resourceLoader;
	var messageCatalog;
	var unicodeDictData;
	var wasaviFrame;
	var wasaviFrameData;
	var defaultFont = '"Consolas","Monaco","Courier New","Courier",monospace';
	var payload;
	var runtimeOverwriteSettings;
	var hotkey;



	/* {{{1 classes */

	/** {{{2 extension wrapper base class */

	function ExtensionWrapper () {
		this.registerTabId = function (tabId) {};
		this.isExistsTabId = function (tabId) {};
		this.sendRequest = function (tabId, message) {};
		this.broadcast = function (message, exceptId) {};
		this.executeScript = function (tabId, options, callback) {};
		this.addRequestListener = function (handler) {};
		this.openTabWithUrl = function (url, callback) {};
		this.openTabWithFile = function (file, callback) {};
		this.closeTab = function (id) {};
		this.closeTabByWasaviId = function (id) {};
		this.focusTab = function (id) {};
		this.createTransport = function () {};
		this.initContextMenu = function () {};
		this.storage = StorageWrapper.create(window);
		this.clipboard = ClipboardManager.create(window);
		this.tabWatcher = TabWatcher.create(window);
		this.extensionId = '';
		this.lastRegisteredTab = '';
		this.messageCatalogPath = false;
		this.cryptKeyPath = '';
		this.version = '';
		this.isDev = false;
	}
	ExtensionWrapper.create = function () {
		if (window.chrome) {
			return new ChromeExtensionWrapper;
		}
		else if (window.opera) {
			return new OperaExtensionWrapper;
		}
		else if (window.jetpack) {
			return new FirefoxJetpackExtensionWrapper;
		}
		return new ExtensionWrapper;
	};

	/** {{{2 extension wrapper class for chrome */

	function ChromeExtensionWrapper () {
		var tabIds = {};
		var lastRegisteredTab;

		chrome.tabs.onRemoved.addListener(function (tabId) {
			delete tabIds[tabId];
		});

		this.constructor = ExtensionWrapper;

		this.registerTabId = function (tabId) {
			tabIds[tabId] = 1;
			lastRegisteredTab = tabId;
		};
		this.isExistsTabId = function (tabId) {
			return tabId in tabIds;
		};
		this.sendRequest = function () {
			if (arguments.length == 1) {
				var message = arguments[0];
				chrome.tabs.query({active:true}, function (tab) {
					try {chrome.tabs.sendRequest(tab.id, message)} catch (e) {}
				});
			}
			else {
				try {chrome.tabs.sendRequest(arguments[0], arguments[1])} catch (e) {}
			}
		};
		this.broadcast = function (message, exceptId) {
			if (exceptId === undefined) {
				for (var i in tabIds) {
					try {chrome.tabs.sendRequest(i - 0, message)} catch (e) {}
				}
			}
			else {
				for (var i in tabIds) {
					try {i - exceptId != 0 && chrome.tabs.sendRequest(i - 0, message)} catch (e) {}
				}
			}
		};
		this.executeScript = function (tabId, options, callback) {
			chrome.tabs.executeScript(tabId, options, callback);
		};
		this.addRequestListener = function (handler) {
			typeof handler == 'function' && chrome.extension.onRequest.addListener(function (req, sender, res) {
				if (req && (req.type == 'init' || req.type == 'init-agent')) {
					handler(req, sender.tab.id, function (reply) {
						try {chrome.tabs.sendRequest(sender.tab.id, reply)} catch (e) {}
					});
				}
				else {
					handler(req, sender.tab.id, res);
				}
			});
		};
		this.openTabWithUrl = function (url, callback) {
			chrome.tabs.create({url:url}, function (tab) {
				emit(callback, tab.id, url);
			});
		};
		this.openTabWithFile = function (file, callback) {
			chrome.tabs.create({url:chrome.extension.getURL(file)}, function (tab) {
				emit(callback, tab.id, url);
			});
		};
		this.closeTab = function (id) {
			chrome.tabs.get(id, function () {
				chrome.tabs.remove(id);
			});
		};
		this.closeTabByWasaviId = function (id) {
			this.closeTab(id);
		};
		this.focusTab = function (id) {
			chrome.tabs.get(id, function () {
				chrome.tabs.update(id, {active:true});
			});
		};
		this.createTransport = function () {
			return new XMLHttpRequest;
		};
		this.initContextMenu = function () {
			chrome.contextMenus.removeAll(function () {
				chrome.contextMenus.create({
					contexts:['editable'],
					title:chrome.i18n.getMessage(MENU_EDIT_WITH_WASAVI),
					onclick:function (info, tab) {
						if (!info.editable) return;
						chrome.tabs.sendRequest(tab.id, {type:'request-run'});
					}
				});
			});
		};
		this.storage = StorageWrapper.create(window);
		this.clipboard = ClipboardManager.create(window);
		this.tabWatcher = TabWatcher.create(window, emit);
		this.extensionId = location.hostname;
		this.__defineGetter__('lastRegisteredTab', function () {
			var result = lastRegisteredTab;
			lastRegisteredTab = undefined;
			return result;
		});
		this.cryptKeyPath = 'frontend/wasavi.js';

		(function (self) {
			resourceLoader.get('manifest.json', function (data) {
				self.version = u.parseJson(data).version;
				self.isDev = self.version == TEST_VERSION;
			}, {noCache:true});
		})(this);
	}

	/** {{{2 extension wrapper class for opera */

	function OperaExtensionWrapper () {
		var tabIds = {};
		var lastRegisteredTab;

		function getNewTabId () {
			var result = 0;
			while (result in tabIds) {
				result++;
			}
			return result;
		}

		function getTabId (port, callback) {
			for (var i in tabIds) {
				if (tabIds[i] == port) {
					emit(callback, i);
					return i;
				}
			}
			return undefined;
		}

		opera.extension.onconnect = function (e) {
			var tabId = getNewTabId();
			tabIds[tabId] = e.source;
			lastRegisteredTab = tabId;
		};

		opera.extension.ondisconnect = function (e) {
			getTabId(e.source, function (id) {
				delete tabIds[id];
			});
		};

		widget.preferences['widget-id'] = location.href.match(/^widget:\/\/([^\/]+)/)[1];

		this.constructor = ExtensionWrapper;

		this.registerTabId = function (tabId) {
			// do nothing
		};
		this.isExistsTabId = function (tabId) {
			return tabId in tabIds;
		};
		this.sendRequest = function (tabId, message) {
			if (arguments.length == 1) {
				try {
					opera.extension.tabs
						.getAll()
						.filter(function (tab) {return tab.selected})[0]
						.postMessage(arguments[0]);
				}
				catch (e) {}
			}
			else {
				try {tabIds[arguments[0]].postMessage(arguments[1])} catch (e) {}
			}
		};
		this.broadcast = function (message, exceptId) {
			if (exceptId === undefined) {
				for (var i in tabIds) {
					try {tabIds[i].postMessage(message)} catch (e) {}
				}
			}
			else {
				for (var i in tabIds) {
					if (i - exceptId != 0) {
						try {tabIds[i].postMessage(message)} catch (e) {}
					}
				}
			}
		};
		this.executeScript = function (tabId, options, callback) {
			resourceLoader.get(options.file, function (data) {
				emit(callback, {source:data || ''});
			});
		};
		this.addRequestListener = function (handler) {
			opera.extension.onmessage = function (e) {
				if (e.ports && e.ports.length > 0) {
					handler(e.data, null, function (data) {
						try {e.ports[0].postMessage(data)} catch (e) {}
					});
				}
				else {
					var tabId = getTabId(e.source);
					handler(e.data, tabId, function (data) {
						try {e.source.postMessage(data)} catch (e) {}
					});
				}
			}
		};
		this.openTabWithUrl = function (url, callback) {
			var tab = opera.extension.tabs.create({url:url, focused:true});
			emit(callback, tab.id, url);
		};
		this.openTabWithFile = function (file, callback) {
			var tab = opera.extension.tabs.create({
				url:location.href.replace(/\/[^\/]*$/, '/') + file, focused:true
			});
			emit(callback, tab.id, tab.url);
		};
		this.closeTab = function (id) {
			opera.extension.tabs.getAll().some(function (tab) {
				if (id instanceof MessagePort && tab.port == id
				||  typeof id == 'number' && tab.id == id) {
					tab.close();
					return true;
				}
				return false;
			});
		};
		this.closeTabByWasaviId = function (id) {
			id in tabIds && this.closeTab(tabIds[id]);
		};
		this.focusTab = function (id) {
			opera.extension.tabs.getAll().some(function (tab) {
				if (id instanceof MessagePort && tab.port == id
				||  typeof id == 'number' && tab.id == id) {
					tab.focus();
					return true;
				}
				return false;
			});
		};
		this.createTransport = function () {
			return new XMLHttpRequest;
		};
		this.initContextMenu = function () {
			if (!opera.contexts || !opera.contexts.menu) return;
			while (opera.contexts.menu.length) {
				opera.contexts.menu.removeItem(0);
			}
			opera.contexts.menu.addItem(opera.contexts.menu.createItem({
				contexts:['editable'],
				icon:'icon016.png',
				title:getContextMenuLabel(MENU_EDIT_WITH_WASAVI),
				onclick:function (e) {
					if (!e.isEditable) return;
					getTabId(e.source, function () {
						e.source.postMessage({type:'request-run'});
					});
				}
			}));
		};
		this.storage = StorageWrapper.create(window);
		this.clipboard = ClipboardManager.create(window);
		this.tabWatcher = TabWatcher.create(window, emit);
		this.extensionId = location.hostname;
		this.__defineGetter__('lastRegisteredTab', function () {
			var result = lastRegisteredTab;
			lastRegisteredTab = undefined;
			return result;
		});
		this.__defineGetter__('messageCatalogPath', function () {
			var result;
			resourceLoader.get('locales/locales.json', function (locales) {
				var fallbackLocaleIndex = -1;
				var currentLocale = (navigator.browserLanguage
					|| navigator.language
					|| navigator.userLanguage).toLowerCase().replace(/_/g, '-');

				locales = u.parseJson(locales).map(function (locale, i) {
					locale = locale.toLowerCase().replace(/_/g, '-');
					if (locale == 'en-us') {
						fallbackLocaleIndex = i;
					}
					return locale;
				});

				var index = locales.indexOf(currentLocale);
				if (index < 0) {
					currentLocale = currentLocale.replace(/-.+$/, '');
					locales.some(function (locale, i) {
						locale = locale.replace(/-.+$/, '');
						if (locale == currentLocale) {
							index = i;
							return true;
						}
						return false;
					});
				}
				if (index < 0) {
					index = fallbackLocaleIndex;
				}
				if (index < 0) {
					result = false;
				}
				else {
					result = 'locales/' + locales[index] + '/messages.json';
				}
			}, {noCache:true, sync:true});
			return result;
		});
		this.cryptKeyPath = 'includes/wasavi.js';
		this.version = widget.version;
		this.isDev = widget.version == TEST_VERSION;
	}

	/** {{{2 extension wrapper class for firefox (Add-on SDK) */

	function FirefoxJetpackExtensionWrapper () {
		var self = require('sdk/self');
		var PageMod = require('sdk/page-mod').PageMod;
		var tabs = require('sdk/tabs');
		var l10n = require('sdk/l10n/locale');
		var XMLHttpRequest = require('sdk/net/xhr').XMLHttpRequest;

		var tabIds = {};
		var lastRegisteredTab;
		var onMessageHandler;
		var refreshTimer;

		function getNewTabId () {
			var result = 0;
			while (result in tabIds) {
				result++;
			}
			return result;
		}

		function getTabId (worker, callback) {
			for (var i in tabIds) {
				if (tabIds[i] == worker) {
					emit(callback, i);
					return i;
				}
			}
			return undefined;
		}

		function handleWorkerAttach (worker) {
			var tabId = getNewTabId();
			tabIds[tabId] = worker;
			lastRegisteredTab = tabId;
			worker.on('detach', handleWorkerDetach);
			worker.on('message', handleWorkerMessage);
		}

		function handleWorkerDetach () {
			getTabId(this, function (i) {
				delete tabIds[i];
			});
		}

		function handleWorkerMessage (req) {
			if (!onMessageHandler) return;

			var theWorker = this;
			onMessageHandler(req, getTabId(theWorker), function (res) {
				res || (res = {});
				if ('__messageId' in req) {
					res.__messageId = req.__messageId;
				}
				try {theWorker.postMessage(res)} catch (e) {}
			});
		}

		function startRefresher (force) {
			if (!refreshTimer) {
				refreshTimer = u.setInterval(function refreshWorkers () {
					var newTabIds = {};
					for (var i in tabIds) {
						try {
							tabIds[i].postMessage({});
							newTabIds[i] = tabIds[i];
						}
						catch (e) {
						}
					}
					tabIds = newTabIds;
				}, 1000 * 60);
			}
		}

		function PseudoRegexRule (name, test) {
			this._name = name;
			this.test = test;
		}

		PseudoRegexRule.prototype = {
			toString:function () {
				return '[object PseudoRegexRule(' + this._name + ')]';
			},
			exec:function (url) {
				return this.test(url) ? [url] : null;
			}
		};

		// agent
		PageMod({
			include:new PseudoRegexRule('agent', function (url) {
				if (url.indexOf(self.data.url('options.html')) == 0) {
					return true;
				}
				if (url.substring(0, 5) != 'http:' && url.substring(0, 6) != 'https:') {
					return false;
				}
				if (url == 'http://wasavi.appsweets.net/'
				||  url == 'https://ss1.xrea.com/wasavi.appsweets.net/'
				||  url.substring(0, 256) == wasaviFrameData.substring(0, 256)) {
					return false;
				}
				return true;
			}),
			contentScriptWhen:'start',
			contentScriptFile:[
				self.data.url('frontend/extension_wrapper.js'),
				self.data.url('frontend/agent.js')
			],
			contentScriptOptions:{
				extensionId:self.id
			},
			onAttach:handleWorkerAttach
		});

		// wasavi
		PageMod({
		    include:new PseudoRegexRule('wasavi-core', function (url) {
				if (url == 'http://wasavi.appsweets.net/'
				||  url == 'https://ss1.xrea.com/wasavi.appsweets.net/'
				||  url.substring(0, 256) == wasaviFrameData.substring(0, 256)) {
					return true;
				}
				return false;
			}),
			contentScriptWhen:'start',
			contentScriptFile:[
				self.data.url('frontend/extension_wrapper.js'),
				self.data.url('frontend/init.js'),
				self.data.url('frontend/utils.js'),
				self.data.url('frontend/unicode_utils.js'),
				self.data.url('frontend/classes.js'),
				self.data.url('frontend/classes_ex.js'),
				self.data.url('frontend/classes_undo.js'),
				self.data.url('frontend/classes_subst.js'),
				self.data.url('frontend/classes_search.js'),
				self.data.url('frontend/classes_ui.js'),
				self.data.url('frontend/wasavi.js')
			],
			onAttach:handleWorkerAttach
		});

		require('sdk/simple-prefs').on('optionsOpener', function () {
			tabs.open(self.data.url('options.html'));
		});

		this.constructor = ExtensionWrapper;

		this.registerTabId = function (tabId) {
			// do nothing
		};
		this.isExistsTabId = function (tabId) {
			return tabId in tabIds;
		};
		this.sendRequest = function () {
			if (arguments.length == 1) {
				var activeTab = tabs.activeTab;
				for (var i in tabIds) {
					if (tabIds[i].tab == activeTab) {
						try {tabIds[i].postMessage(arguments[0])} catch (e) {}
					}
				}
			}
			else {
				try {tabIds[arguments[0]].postMessage(arguments[1])} catch (e) {}
			}
		};
		this.broadcast = function (message, exceptId) {
			if (exceptId === undefined) {
				for (var i in tabIds) {
					try {tabIds[i].postMessage(message)} catch (e) {}
				}
			}
			else {
				for (var i in tabIds) {
					try {i - exceptId != 0 && tabIds[i].postMessage(message)} catch (e) {}
				}
			}
		};
		this.executeScript = function (tabId, options, callback) {
			resourceLoader.get(options.file, function (data) {
				emit(callback, {source:data || ''});
			});
		};
		this.addRequestListener = function (handler) {
			onMessageHandler = handler;
		};
		this.openTabWithUrl = function (url, callback) {
			tabs.open({
				url:url,
				onReady:function (tab) {
					callback && emit(callback, tab, url);
					callback = null;
				}
			});
		};
		this.openTabWithFile = function (file, callback) {
			tabs.open({
				url:self.data.url(file),
				onReady:function (tab) {
					callback && emit(callback, tab, tab.url);
					callback = null;
				}
			});
		};
		this.closeTab = function (id) {
			if (typeof id.close == 'function') {
				try {id.close()} catch (e) {}
			}
			else {
				getTabId(id, function (worker) {worker.tab.close();});
			}
		};
		this.closeTabByWasaviId = function (id) {
			id in tabIds && this.closeTab(tabIds[id].tab);
		};
		this.focusTab = function (id) {
			if (typeof id.activate == 'function') {
				try {id.activate()} catch (e) {}
			}
			else {
				getTabId(id, function (worker) {worker.activate();});
			}
		};
		this.createTransport = function () {
			return new XMLHttpRequest;
		};
		this._contextMenuInitialized = false;
		this.initContextMenu = function () {
			if (this._contextMenuInitialized) return;
			var cm = require('sdk/context-menu');
			var that = this;
			cm.Item({
				context:cm.SelectorContext('input,textarea'),
				image:self.data.url('icon016.png'),
				label:'#',
				contentScriptFile:self.data.url('context_menu.js'),
				onMessage:function (phase) {
					switch (phase) {
					case 1:
						this.label = getContextMenuLabel(MENU_EDIT_WITH_WASAVI);
						break;
					case 2:
						that.sendRequest({type:'request-run'});
						break;
					}
				}
			});
			this._contextMenuInitialized = true;
		};
		this.storage = StorageWrapper.create(window);
		this.clipboard = ClipboardManager.create(window);
		this.tabWatcher = TabWatcher.create(window, emit);
		this.extensionId = self.id;
		this.__defineGetter__('lastRegisteredTab', function () {
			var result = lastRegisteredTab;
			lastRegisteredTab = undefined;
			return result;
		});
		this.__defineGetter__('messageCatalogPath', function () {
			var prefered = l10n.getPreferedLocales();
			if (!prefered) {
				return undefined;
			}

			prefered = prefered.filter(function (l) {
				return /^([^-]{2})(-[^-]+)*$/.test(l);
			});
			if (!prefered || prefered.length == 0) {
				return undefined;
			}

			var availables = u.parseJson(self.data.load('xlocale/locales.json')).map(function (l) {
				return l.replace(/_/g, '-').toLowerCase();
			});
			var result = l10n.findClosestLocale(availables, prefered);
			if (!result) {
				return undefined;
			}

			return 'xlocale/' + result + '/messages.json';
		});
		this.cryptKeyPath = 'frontend/wasavi.js';
		this.version = self.version;
		this.isDev = this.version == TEST_VERSION;

		startRefresher();
	}



	/* {{{1 functions */

	/** {{{2 utilities */

	function emit () {
		var args = Array.prototype.slice.call(arguments);
		if (args.length < 1) return;
		var fn = args.shift();
		if (typeof fn != 'function') return;
		try {
			fn.apply(null, args);
		}
		catch (e) {
			extension.isDev && console.error(
				'wasavi background: an error occured inside callback:\n\t' + [
					'message: ' + e.message,
					'   line: ' + (e.line || e.lineNumber || '?'),
					'  stack: ' + (e.stack || '?')
				].join('\n\t'));
		}
	}

	function getContextMenuLabel (id) {
		return messageCatalog && messageCatalog[id].message || id;
	}

	function broadcastStorageUpdate (keys, originTabId) {
		var items = [];

		keys.forEach(function (key) {
			items.push({key:key, value:extension.storage.getItem(key)});
		});

		extension.broadcast({type:'update-storage', items:items}, originTabId);
	}

	/** {{{2 storage initializer */

	function initStorage () {
		extension.storage.setItem(
			'start_at',
			(new Date).toLocaleDateString() + ' ' + (new Date).toLocaleTimeString()
		);

		[
			['targets', {
				enableTextArea: true,
				enableText: false,
				enableSearch: false,
				enableTel: false,
				enableUrl: false,
				enableEmail: false,
				enablePassword: false,
				enableNumber: false,
				enableContentEditable:true
			}],
			['exrc', '" exrc for wasavi'],
			['shortcut', Hotkey.DEFAULT_HOTKEYS_DESC],
			['shortcutCode', function () {
				return Hotkey.getObjectsForDOM(extension.storage.getItem('shortcut'));
			}],
			['fontFamily', defaultFont],
			['fstab', {
				dropbox: {isDefault:true, enabled:true},
				gdrive: {enabled:true}
			}],
			['quickActivation', false]
		]
		.forEach(function (item) {
			var key = item[0];
			var defaultValue = typeof item[1] == 'function' ? item[1]() : item[1];
			var currentValue = extension.storage.getItem(key);

			if (currentValue === undefined) {
				extension.storage.setItem(key, defaultValue);
			}
			else {
				var defaultType = u.objectType(defaultValue);
				var currentType = u.objectType(currentValue);
				switch (defaultType) {
				case 'Object':
					if (currentType == 'Object') {
						Object.keys(currentValue).forEach(function (key) {
							if (!(key in defaultValue)) {
								delete currentValue[key];
							}
						});
					}
					else {
						currentType = {};
					}
					Object.keys(defaultValue).forEach(function (key) {
						if (!(key in currentValue)) {
							currentValue[key] = defaultValue[key];
						}
					});
					extension.storage.setItem(key, currentValue);
					break;
				}
			}
		});
	}

	/** {{{2 message catalog initializer */

	function initMessageCatalog () {
		var path = extension.messageCatalogPath;
		if (typeof path != 'string') {
			messageCatalog = false;
			extension.initContextMenu();
			return;
		}
		resourceLoader.get(path, function (text) {
			messageCatalog = u.parseJson(text);
			for (var i in messageCatalog) {
				delete messageCatalog[i].description;
			}
			extension.initContextMenu();
		}, {noCache:true});
	}

	/** {{{2 file system initializer */

	function initFileSystem () {
		/*
		 * consumer_keys.json sample:
		 *
		 * {
		 *     "dropbox": {
		 *         "key":    "YOUR-CONSUMER-KEY",
		 *         "secret": "YOUR-CONSUMER-SECRET"
		 *     }
		 * }
		 *
		 * in production package, consumer_keys.json is encrypted.
		 */
		function initFileSystemCore (data) {
			var log = [];
			data = u.parseJson(data);
			fstab = extension.storage.getItem('fstab');
			for (var i in fstab) {
				if (!data[i] || !('key' in data[i]) || !('secret' in data[i])) continue;
				fstab[i].isNull = false;
				fstab[i].instance = FileSystem.create(i, data[i].key, data[i].secret, extension);
				log.push(i);
			}

			extension.isDev && console.info(
				'wasavi background: file system driver initialized: ' + log.join(', '));

			fstab.nullFs = {
				enabled:true,
				isNull:true,
				instance:FileSystem.create()
			};
		}
		resourceLoader.get('consumer_keys.bin', function (binkeys) {
			if (binkeys === false) {
				resourceLoader.get(
					'consumer_keys.json', initFileSystemCore, {noCache:true}
				);
			}
			else {
				resourceLoader.get(extension.cryptKeyPath, function (data) {
					initFileSystemCore(
						(new Blowfish(SHA1.calc(data))).decrypt64(binkeys)
					);
				}, {noCache:true});
			}
		}, {noCache:true});
	}

	function getFileSystem (path) {
		var defaultFs;
		var nullFs;
		var drive = '';

		path.replace(/^([^\/:]+):/, function ($0, $1) {
			drive = $1;
			return '';
		});

		if (drive != '' && drive in fstab) {
			return fstab[drive].instance;
		}

		for (var i in fstab) {
			var fs = fstab[i];
			if (!fs.instance) {
				continue;
			}
			if (fs.isDefault) {
				defaultFs = fs.instance;
			}
			if (fs.isNull) {
				nullFs = fs.instance;
			}
		}
		return drive != '' ? nullFs : (defaultFs || nullFs);
	}

	function getFileSystemInfo () {
		var result = [];
		for (var i in fstab) {
			var fs = fstab[i];
			if (fs.isNull) continue;
			result.push({name:i, isDefault:fs.isDefault});
		}
		return result;
	}

	function clearFileSystemCredentials (target) {
		Object.keys(fstab).forEach(function (name) {
			var fs = fstab[name];
			if (!fs || !fs.instance || typeof fs.instance.clearCredentials != 'function') return;
			if (typeof target == 'string') {
				if (target == name) {
					fs.instance.clearCredentials();
				}
			}
			else {
				fs.instance.clearCredentials();
			}
		});
	}

	/** {{{2 initialize main part of wasavi */

	function initWasaviFrame () {
		resourceLoader.get('wasavi_frame.html', function (data) {
			wasaviFrameData = 'data:text/html;charset=UTF-8;class=wasavi;base64,' + btoa(data);
			wasaviFrame = /<body[^>]*>([\s\S]+)<\/body>/
				.exec(data)[1]
				.replace(/\n/g, '')
				.replace(/>\s+</g, '><')
				.replace(/^\s+|\s+$/g, '');
		}, {noCache:true});
	}

	/** {{{2 f/F/t/T dictionary */

	function initUnicodeDictData () {
		unicodeDictData = {fftt:{}};

		function ensureBinaryString (data) {
			var buffer = [];
			for (var i = 0, goal = data.length; i < goal; i++) {
				buffer[i] = data.charCodeAt(i) & 0xff;
			}
			return String.fromCharCode.apply(null, buffer);
		}
		function handler (name1, name2) {
			return function (data) {
				if (name1 && name2) {
					unicodeDictData[name1][name2] = ensureBinaryString(data);
				}
				else if (name1) {
					unicodeDictData[name1] = ensureBinaryString(data);
				}
			};
		}

		[
			['fftt_general.dat', 'fftt', 'General'],
			['fftt_han_ja.dat', 'fftt', 'HanJa'],
			['linebreak.dat', 'LineBreak']
		].forEach(function (arg) {
			var file = arg.shift();
			resourceLoader.get(
				'unicode/' + file,
				handler.apply(null, arg),
				{noCache:true, mimeType:'text/plain;charset=x-user-defined'});
		});
	}

	/** {{{2 hotkey */

	function initHotkey () {
		hotkey.register(extension.storage.getItem('shortcut'));
		hotkey.onPress = handleHotkeyPress;
	}

	function handleHotkeyPress (hotkey) {
		extension.sendRequest({type:'request-run'});
	}

	/** {{{2 request handlers */

	function handleInit (req, res, tabId) {
		var init = req.type == 'init';
		init && extension.registerTabId(tabId);
		res({
			type:'init-response',
			extensionId:extension.extensionId,
			tabId:tabId,
			targets:extension.storage.getItem('targets'),
			exrc:extension.storage.getItem('exrc'),
			ros:payload && payload.url != TEST_MODE_URL ?
				runtimeOverwriteSettings.get(payload.url, payload.nodePath) : '',
			shortcut:hotkey.canProcess ? null :
				extension.storage.getItem('shortcut'),
			shortcutCode:hotkey.canProcess ? null :
				Hotkey.getObjectsForDOM(extension.storage.getItem('shortcut')),
			fontFamily:extension.storage.getItem('fontFamily'),
			quickActivation:extension.storage.getItem('quickActivation') == '1',
			messageCatalog:messageCatalog,
			testMode:req.url == TEST_MODE_URL,
			devMode:extension.isDev,
			wasaviFrame:init ? wasaviFrame : null,
			fstab:init ? getFileSystemInfo() : null,
			unicodeDictData:init ? unicodeDictData : null,
			version:extension.version,
			payload:payload || null
		});
		payload = null;
	}

	function handleInitOptions (req, res) {
		extension.storage.clear();
		initStorage();
		initMessageCatalog();
		clearFileSystemCredentials();
		initFileSystem();
		broadcastStorageUpdate('targets exrc shortcut shortcutCode quickActivate'.split(' '));
	}

	function handleGetStorage (req, res) {
		if ('key' in req) {
			res({key:req.key, value:extension.storage.getItem(req.key)});
		}
		else {
			res({key:req.key, value:undefined});
		}
	}

	function handleSetStorage (req, res) {
		var items;
		if ('key' in req && 'value' in req) {
			items = [{key:req.key, value:req.value}];
		}
		else if ('items' in req) {
			items = req.items;
		}
		if (items) {
			var keys = [];
			items.forEach(function (item) {
				if ('key' in item && 'value' in item) {
					if (item.key == 'fontFamily') {
						if (!/^\s*(?:"[^",;]+"|'[^',;]+'|[a-zA-Z-]+)(?:\s*,\s*(?:"[^",;]+"|'[^',;]+'|[a-zA-Z-]+))*\s*$/.test(item.value)) {
							item.value = defaultFont;
						}
					}

					keys.push(item.key);
					extension.storage.setItem(item.key, item.value);

					if (item.key == 'shortcut') {
						keys.push('shortcutCode');
						extension.storage.setItem(
							'shortcutCode',
							Hotkey.getObjectsForDOM(item.value));
					}
				}
			});
			broadcastStorageUpdate(keys);
		}
	}

	function handleBell (req, res) {
		if ('file' in req) {
			resourceLoader.get(req.file, function (data) {
				res({data:data || ''});
			}, {sync:true});
		}
	}

	function handleOpenOptionsPage (req, res) {
		extension.openTabWithFile('options.html');
	}

	function handleNotifyToChild (req, res) {
		var childTabId = 'childTabId' in req ? req.childTabId : extension.lastRegisteredTab;
		if (childTabId !== undefined && extension.isExistsTabId(childTabId)) {
			'tabId' in req && (req.payload.parentTabId = req.tabId);
			extension.sendRequest(childTabId, req.payload);
		}
	}

	function handleNotifyToParent (req, res) {
		if (!('payload' in req)) return;

		var needForward = true;
		switch (req.payload.type) {
		case 'wasavi-chdir':
			if ('tabId' in req
			&& 'path' in req.payload) {
				needForward = false;
				if (req.payload.path == '') {
					extension.sendRequest(
						req.tabId,
						{type:'fileio-chdir-response', data:null}
					);
				}
				else {
					getFileSystem(req.payload.path)
						.ls(req.payload.path, req.tabId, function (data) {
							var error = null;
							if (data.error) {
								error = data.error;
								data = null;
							}
							extension.sendRequest(
								req.tabId,
								{type:'fileio-chdir-response', data:data, error:error}
							);
						});
				}
			}
			break;
		case 'wasavi-read':
			if ('tabId' in req
			&& 'path' in req.payload
			&& req.payload.path != '') {
				needForward = false;
				getFileSystem(req.payload.path)
					.read(req.payload.path, req.tabId);
			}
			break;
		case 'wasavi-saved':
			if ('tabId' in req
			&& 'path' in req.payload
			&& req.payload.path != '') {
				needForward = false;
				getFileSystem(req.payload.path)
					.write(req.payload.path, req.payload.value, req.tabId);
			}
			break;
		case 'wasavi-terminated':
			if ('url' in req.payload
			&& 'nodePath' in req.payload
			&& 'ros' in req.payload) {
				runtimeOverwriteSettings.set(
					req.payload.url, req.payload.nodePath, req.payload.ros);
			}
			if (!('parentTabId' in req)
			&& 'tabId' in req
			&& 'isTopFrame' in req.payload
			&& req.payload.isTopFrame) {
				needForward = false;
				extension.closeTabByWasaviId(req.tabId);
			}
			break;
		}
		if (needForward && 'parentTabId' in req && req.parentTabId != undefined) {
			if ('tabId' in req) {
				req.payload.childTabId = req.tabId;
			}
			extension.sendRequest(req.parentTabId, req.payload);
		}
	}

	function handleSetClipboard (req, res) {
		if ('data' in req) {
			extension.clipboard.set(req.data);
		}
	}

	function handleGetClipboard (req, res) {
		res({data:extension.clipboard.get()});
	}

	function handlePushPayload (req, res) {
		payload = req;
	}

	function handleRequestWasaviFrame (req, res) {
		res({data:wasaviFrameData});
	}

	function handleFsCtl (req, res) {
		var result = false;
		switch (req.subtype) {
		case 'reset':
			clearFileSystemCredentials(req.name);
			break;
		case 'get-entries':
			getFileSystem(req.path)
				.ls(req.path, req.tabId, function (data) {
					res({data:data.contents});
				});
			result = true;
			break;
		}
		return result;
	}

	/** {{{2 request handler entry */

	function handleRequest (req, tabId, resFunc) {
		if (!req || !req.type) return;

		var replied = false;
		var lateResponse = false;

		function res () {
			if (!replied) {
				resFunc.apply(null, arguments);
				replied = true;
			}
		}

		try {
			var handler;

			switch (req.type) {
			case 'init':
			case 'init-agent':			handler = handleInit; break;
			case 'init-options':		handler = handleInitOptions; break;
			case 'get-storage':			handler = handleGetStorage; break;
			case 'set-storage':			handler = handleSetStorage; break;
			case 'bell':				handler = handleBell; break;
			case 'open-options-page':	handler = handleOpenOptionsPage; break;
			case 'notify-to-child':		handler = handleNotifyToChild; break;
			case 'notify-to-parent':	handler = handleNotifyToParent; break;
			case 'set-clipboard':		handler = handleSetClipboard; break;
			case 'get-clipboard':		handler = handleGetClipboard; break;
			case 'push-payload':		handler = handlePushPayload; break;
			case 'request-wasavi-frame':handler = handleRequestWasaviFrame; break;
			case 'fsctl':				handler = handleFsCtl; break;
			}

			if (handler) {
				lateResponse = handler(req, res, tabId);
			}
		}
		finally {
			!lateResponse && res();
		}
	}

	/** {{{2 bootstrap */

	function handleLoad (e) {
		window.removeEventListener && window.removeEventListener(e.type, handleLoad, false);
		u = WasaviUtils;
		resourceLoader = ResourceLoader.create(window, emit);
		extension = ExtensionWrapper.create();
		runtimeOverwriteSettings = RuntimeOverwriteSettings.create(extension);
		hotkey = Hotkey.create(window, emit);

		initWasaviFrame();
		initHotkey();
		initStorage();
		initMessageCatalog();
		initFileSystem();
		initUnicodeDictData();

		extension.addRequestListener(handleRequest);

		extension.isDev && console.info('wasavi background: running.');
	}

	window.addEventListener ?
		window.addEventListener('load', handleLoad, false) :
		handleLoad();

})(this);

// vim:set ts=4 sw=4 fenc=UTF-8 ff=unix ft=javascript fdm=marker :
