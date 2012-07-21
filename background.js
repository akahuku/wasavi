/**
 * wasavi: vi clone implemented in javascript
 * =============================================================================
 *
 *
 * @author akahuku@gmail.com
 * @version $Id: background.js 167 2012-07-21 09:37:39Z akahuku $
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
	window = this;
	window.jetpack = {};
}
if (typeof window.OAuth == 'undefined' && typeof require == 'function') {
	OAuth = require("./jsOAuth").OAuth;
}
if (typeof window.SHA1 == 'undefined' && typeof require == 'function') {
	SHA1 = require("./sha1").SHA1;
}
if (typeof window.Blowfish == 'undefined' && typeof require == 'function') {
	Blowfish = require("./blowfish").Blowfish;
}
if (typeof window.setTimeout == 'undefined' && typeof require == 'function') {
	(function (global) {
		var timers = require('timers');
		global.setTimeout = timers.setTimeout;
		global.setInterval = timers.setInterval;
		global.clearTimeout = timers.clearTimeout;
		global.clearInterval = timers.clearInterval;
	})(this);
}

(function (global) {
	/*
	 * consts
	 * ----------------
	 */

	var KEY_TABLE = {
		'backspace':8, 'bs':8,
		'tab':9,
		'enter':13, 'return':13, 'ret':13,
		'pageup':33,
		'pagedown':34,
		'end':35,
		'home':36,
		'left':37,
		'up':38,
		'right':39,
		'down':40,
		'insert':45, 'ins':45,
		'delete':46, 'del':46,
		'f1':112, 'f2':113, 'f3':114, 'f4':115,
		'f5':116, 'f6':117, 'f7':118, 'f8':119,
		'f9':120, 'f10':121, 'f11':122, 'f12':123
	};

	/*
	 * variables
	 * ----------------
	 */

	var extension;
	var fstab;
	var resourceLoader;
	var messageCatalog;
	var wasaviFrame;
	var defaultFont = '"Consolas","Monaco","Courier New","Courier",monospace';

	/*
	 * classes
	 * ----------------
	 */

	/**
	 * storage classes
	 */

	function StorageWrapper () {
		this.getItem = function (key) {};
		this.setItem = function (key, value) {};
	}
	StorageWrapper.create = function () {
		if (window.localStorage) {
			return new WebStorageWrapper;
		}
		else if (window.jetpack) {
			return new JetpackStorageWrapper;
		}
		else {
			return new StorageWrapper;
		}
	};

	function WebStorageWrapper () {
		this.constructor = StorageWrapper;
		this.getItem = function (key) {
			return localStorage.getItem(key)
		};
		this.setItem = function (key, value) {
			localStorage.setItem(key, value);
		};
	}

	function JetpackStorageWrapper () {
		var ss = require('simple-storage');
		this.constructor = StorageWrapper;
		this.getItem = function (key) {
			var result = ss.storage[key];
			return result === undefined ? null : result;
		};
		this.setItem = function (key, value) {
			ss.storage[key] = value;
		};
	}

	/**
	 * resource loader class
	 */

	function ResourceLoader () {
		this.get = function (resourcePath, callback) {
			emit(callback, '');
		};
	}
	ResourceLoader.create = function () {
		if (window.XMLHttpRequest) {
			return new XhrResourceLoader;
		}
		else if (window.jetpack) {
			return new JetpackResourceLoader;
		}
		else {
			return new ResourceLoader;
		}
	};

	function XhrResourceLoader () {
		var data = {};
		this.get = function (resourcePath, callback, opts) {
			opts || (opts = {});
			if (resourcePath in data) {
				emit(callback, data[resourcePath]);
			}
			else {
				var xhr = new XMLHttpRequest;
				xhr.open('GET', location.href.replace(/\/[^\/]*$/, '/') + resourcePath, false);
				xhr.overrideMimeType(opts.mimeType || 'text/plain;charset=UTF-8');
				xhr.onload = function () {
					if (!opts.noCache) {
						data[resourcePath] = xhr.responseText;
					}
					emit(callback, xhr.responseText);
					xhr = xhr.onload = xhr.onerror = null;
				};
				xhr.onerror = function () {
					data[resourcePath] = false;
					emit(callback, data[resourcePath]);
					xhr = xhr.onload = xhr.onerror = null;
				};
				xhr.send(null);
			}
		};
	}

	function JetpackResourceLoader () {
		var data = {};
		var self = require('self');
		this.get = function (resourcePath, callback) {
			if (resourcePath in data) {
				emit(callback, data[resourcePath]);
			}
			else {
				var content;
				try {
					content = self.data.load(resourcePath);
				}
				catch (e) {
					content = false;
				}
				data[resourcePath] = content;
				emit(callback, content);
			}
		};
	}

	/**
	 * clipboard manager class
	 */

	function ClipboardManager () {
		this.set = function (data) {};
		this.get = function () {return '';}
	}
	ClipboardManager.create = function () {
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
	};

	function ExecCommandClipboardManager () {
		this.set = function (data) {
			var buffer = document.getElementById('clipboard-buffer');
			data || (data = '');
			if (buffer && data != '') {
				buffer.value = data;
				buffer.focus();
				buffer.select();
				document.execCommand('cut');
			}
		};
		this.get = function () {
			var buffer = document.getElementById('clipboard-buffer');
			var data = '';
			if (buffer) {
				buffer.value = '';
				buffer.focus();
				document.execCommand('paste');
				data = buffer.value;
			}
			return data;
		};
	}

	function JetpackClipboardManager () {
		var cb = require('clipboard');
		this.set = function (data) {
			cb.set(data, 'text');
		};
		this.get = function () {
			return cb.get('text');
		};
	}

	/**
	 * tab watcher class for opera
	 */

	function TabWatcher () {
		this.add = function (id, url, callback) {
			emit(callback, null);
		};
	}
	TabWatcher.create = function () {
		if (window.chrome) {
			return new ChromeTabWatcher;
		}
		else if (window.opera) {
			return new OperaTabWatcher;
		}
		else if (window.jetpack) {
			return new FirefoxJetpackTabWatcher;
		}
		return new TabWatcher;
	};

	function ChromeTabWatcher () {
		var targets = {};

		function handleTabUpdate (tabId, changeInfo, tab) {
			if (!targets[tabId] || !changeInfo.url) return;
			var target = targets[tabId];
			var isStartUrl = baseUrl(tab.url) == baseUrl(target.startUrl);
			if (tab.url == '' || target.state && !isStartUrl) {
				emit(target.callback, tab.url);
				delete targets[tabId];
				if (countOf(targets) == 0) {
					chrome.tabs.onUpdated.removeListener(handleTabUpdate);
					chrome.tabs.onRemoved.removeListener(handleTabRemove);
				}
			}
			else if (!target.state && isStartUrl) {
				target.state = true;
			}
		}

		function handleTabRemove (tabId, removeInfo) {
			if (!targets[tabId]) return;
			emit(targets[tabId].callback, '');
			delete targets[tabId];
			if (countOf(targets) == 0) {
				chrome.tabs.onUpdated.removeListener(handleTabUpdate);
				chrome.tabs.onRemoved.removeListener(handleTabRemove);
			}
		}

		this.add = function (id, url, callback) {
			chrome.tabs.get(id, function (tab) {
				if (countOf(targets) == 0) {
					chrome.tabs.onUpdated.addListener(handleTabUpdate);
					chrome.tabs.onRemoved.addListener(handleTabRemove);
				}
				targets[id] = {tab:id, startUrl:tab.url, callback:callback};
			});
		};
	}

	function OperaTabWatcher () {
		var targets = [];
		var timer;

		function startTimer () {
			if (timer) return;
			timer = setInterval(function () {
				var newTargets = [];
				targets.forEach(function (target) {
					var currentUrl;
					try {
						currentUrl = target.tab.url || '';
					}
					catch (e) {
						currentUrl = '';
					}

					var isStartUrl = baseUrl(currentUrl) == baseUrl(target.startUrl);
					if (currentUrl == '' || target.state && !isStartUrl) {
						emit(target.callback, currentUrl);
						target.callback = null;
					}
					else {
						if (!target.state && isStartUrl) {
							target.state = true;
						}
						newTargets.push(target);
					}
				});
				if (newTargets.length == 0) {
					clearInterval(timer);
					timer = null;
				}
				else {
					targets = newTargets;
				}
			}, 1000);
		}

		this.add = function (id, url, callback) {
			opera.extension.tabs.getAll().some(function (tab) {
				if (id instanceof MessagePort && tab.port == id
				||  typeof id == 'number' && tab.id == id) {
					targets.push({tab:tab, startUrl:url, callback:callback});
					startTimer();
					return true;
				}
			});
		};
	}

	function FirefoxJetpackTabWatcher () {
		var targets = [];
		var timer;

		function startTimer () {
			if (timer) return;
			timer = setInterval(function () {
				var newTargets = [];
				targets.forEach(function (target) {
					var currentUrl;
					try {
						currentUrl = target.tab.url || '';
					}
					catch (e) {
						currentUrl = '';
					}

					var isStartUrl = baseUrl(currentUrl) == baseUrl(target.startUrl);
					if (currentUrl == '' || target.state && !isStartUrl) {
						emit(target.callback, currentUrl);
						target.callback = null;
					}
					else {
						if (!target.state && isStartUrl) {
							target.state = true;
						}
						newTargets.push(target);
					}
				});
				if (newTargets.length == 0) {
					clearInterval(timer);
					timer = null;
				}
				else {
					targets = newTargets;
				}
			}, 1000);
		}

		this.add = function (id, url, callback) {
			// in this context, id is Tab object instance.
			targets.push({tab:id, startUrl:url, callback:callback});
			startTimer();
			return true;
		};
	}

	/**
	 * extension wrapper base class
	 */

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
		this.storage = new StorageWrapper;
		this.clipboard = new ClipboardManager;
		this.tabWatcher = new TabWatcher;
		this.extensionId = '';
		this.lastRegisteredTab = '';
		this.messageCatalogPath = '';
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

	/**
	 * extension wrapper class for chrome
	 */

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
		this.sendRequest = function (tabId, message) {
			chrome.tabs.sendRequest(tabId, message);
		};
		this.broadcast = function (message, exceptId) {
			if (exceptId === undefined) {
				for (var i in tabIds) {
					chrome.tabs.sendRequest(i - 0, message);
				}
			}
			else {
				for (var i in tabIds) {
					i - exceptId != 0 && chrome.tabs.sendRequest(i - 0, message);
				}
			}
		};
		this.executeScript = function (tabId, options, callback) {
			chrome.tabs.executeScript(tabId, options, callback);
		};
		this.addRequestListener = function (handler) {
			typeof handler == 'function' && chrome.self.onRequest.addListener(function (req, sender, res) {
				if (req && (req.type == 'init' || req.type == 'init-agent')) {
					handler(req, sender.tab.id, function (reply) {
						chrome.tabs.sendRequest(sender.tab.id, reply);
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
			chrome.tabs.create({url:chrome.self.getURL(file)}, function (tab) {
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
		this.storage = StorageWrapper.create();
		this.clipboard = ClipboardManager.create();
		this.tabWatcher = TabWatcher.create();
		this.extensionId = location.hostname;
		this.__defineGetter__('lastRegisteredTab', function () {
			var result = lastRegisteredTab;
			lastRegisteredTab = undefined;
			return result;
		});
	}

	/**
	 * extension wrapper class for opera
	 */

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
			try {
				tabIds[tabId].postMessage(message);
			}
			catch (e) {}
		};
		this.broadcast = function (message, exceptId) {
			if (exceptId === undefined) {
				for (var i in tabIds) {
					try {
						tabIds[i].postMessage(message);
					}
					catch (e) {}
				}
			}
			else {
				for (var i in tabIds) {
					if (i - exceptId != 0) {
						try {
							tabIds[i].postMessage(message);
						}
						catch (e) {}
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
						try {
							e.ports[0].postMessage(data);
						}
						catch (e) {}
					});
				}
				else {
					var tabId = getTabId(e.source);
					handler(e.data, tabId, function (data) {
						try {
							e.source.postMessage(data);
						}
						catch (e) {}
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
			emit(callback, tab.id, url);
		};
		this.closeTab = function (id) {
			opera.extension.tabs.getAll().some(function (tab) {
				if (id instanceof MessagePort && tab.port == id
				||  typeof id == 'number' && tab.id == id) {
					tab.close();
					return true;
				}
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
			});
		};
		this.createTransport = function () {
			return new XMLHttpRequest;
		};
		this.storage = StorageWrapper.create();
		this.clipboard = ClipboardManager.create();
		this.tabWatcher = TabWatcher.create();
		this.extensionId = location.hostname;
		this.__defineGetter__('lastRegisteredTab', function () {
			var result = lastRegisteredTab;
			lastRegisteredTab = undefined;
			return result;
		});
		this.messageCatalogPath = 'messages.json';
	}

	/**
	 * extension wrapper class for firefox (Add-on SDK)
	 */

	function FirefoxJetpackExtensionWrapper () {
		var self = require('self');
		var pagemod = require('page-mod');
		var tabs = require('tabs');
		var l10n = require('api-utils/l10n/locale');
		var XMLHttpRequest = require('api-utils/xhr').XMLHttpRequest;

		var tabIds = {};
		var lastRegisteredTab;
		var onMessageHandler;

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
				theWorker.postMessage(res);
			});
		}

		pagemod.PageMod({
			include:{
				test:function (url) {
					if (url.indexOf(self.data.url('options.html')) == 0) {
						return true;
					}
					if (url.substring(0, 5) != 'http:'
					&&  url.substring(0, 6) != 'https:') {
						return false;
					}
					if (url == 'http://wasavi.appsweets.net/'
					||  url == 'https://ss1.xrea.com/wasavi.appsweets.net/') {
						return false;
					}
					return true;
				},
				exec:function (url) {
					return this.test(url) ? [url] : null;
				}
			},
			contentScriptWhen:'start',
			contentScriptFile:[self.data.url('extension_wrapper.js'), self.data.url('agent.js')],
			onAttach:function (worker) {
				var tabId = getNewTabId();
				tabIds[tabId] = worker;
				lastRegisteredTab = tabId;
				worker.on('detach', handleWorkerDetach);
				worker.on('message', handleWorkerMessage);
			}
		});

		pagemod.PageMod({
			include:[
				'http://wasavi.appsweets.net/',
				'https://ss1.xrea.com/wasavi.appsweets.net/'
			],
			contentScriptWhen:'start',
			contentScriptFile:[self.data.url('extension_wrapper.js'), self.data.url('wasavi.js')],
			onAttach:function (worker) {
				var tabId = getNewTabId();
				tabIds[tabId] = worker;
				lastRegisteredTab = tabId;
				worker.on('detach', handleWorkerDetach);
				worker.on('message', handleWorkerMessage);
			}
		});

		require('simple-prefs').on('optionsOpener', function () {
			tabs.open(self.data.url('options.html'));
		});

		this.constructor = ExtensionWrapper;

		this.registerTabId = function (tabId) {
			// do nothing
		};
		this.isExistsTabId = function (tabId) {
			return tabId in tabIds;
		};
		this.sendRequest = function (tabId, message) {
			tabIds[tabId].postMessage(message);
		};
		this.broadcast = function (message, exceptId) {
			if (exceptId === undefined) {
				for (var i in tabIds) {
					tabIds[i].postMessage(message);
				}
			}
			else {
				for (var i in tabIds) {
					i - exceptId != 0 && tabIds[i].postMessage(message);
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
					callback && emit(callback, tab, url);
					callback = null;
				}
			});
		};
		this.closeTab = function (id) {
			if (typeof id.close == 'function') {
				try {id.close();} catch (e) {}
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
				try {id.activate();} catch (e) {}
			}
			else {
				getTabId(id, function (worker) {worker.activate();});
			}
		};
		this.createTransport = function () {
			return new XMLHttpRequest;
		};
		this.storage = StorageWrapper.create();
		this.clipboard = ClipboardManager.create();
		this.tabWatcher = TabWatcher.create();
		this.extensionId = self.id;
		this.__defineGetter__('lastRegisteredTab', function () {
			var result = lastRegisteredTab;
			lastRegisteredTab = undefined;
			return result;
		});
		this.messageCatalogPath = (function () {
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

			var availables = parseJson(self.data.load('xlocale/locales.json')).map(function (l) {
				return l.replace(/_/g, '-').toLowerCase();
			});
			var result = l10n.findClosestLocale(availables, prefered);
			if (!result) {
				return undefined;
			}

			return 'xlocale/' + result + '/messages.json';
		})();
	}

	/**
	 * file system manager class for dropbox (OAuth 1.0)
	 */

	function FileSystemBase () {
		var backend = '*null*';
		this.ls = this.write = this.read = function () {};
		this.match = function () {return false;};
		this.__defineGetter__('isAuthorized', function () {return true;});
		this.__defineGetter__('backend', function () {return backend;});
		this.__defineGetter__('state', function () {return 'authorized';});
	}
	FileSystemBase.create = function (name, key, secret) {
		switch (name) {
		case 'dropbox':
			return new FileSystemDropbox(key, secret);
		default:
			return new FileSystemBase;
		}
	};

	function FileSystemDropbox (consumerKey, consumerSecret) {
		var WRITE_DELAY_SECS = 10;
		var backend = 'dropbox';

		var oauthCallbackUrl = 'http://wasavi.appsweets.net/authorized.html?fs=' + backend;
		var oauthOpts = {
			consumerKey:      consumerKey,
			consumerSecret:   consumerSecret,
			requestTokenUrl:  'https://api.dropbox.com/1/oauth/request_token',
			authorizationUrl: 'https://www.dropbox.com/1/oauth/authorize',
			accessTokenUrl:   'https://api.dropbox.com/1/oauth/access_token'
		};
		var oauth = OAuth(oauthOpts);
		if (!oauth) {
			throw new Error('cannot instanciate jsOauth.');
		}
		oauth.requestTransport = function () {
			return extension.createTransport();
		};

		var state = 'no-request-token';
		var lastError;
		var uid;
		var locale;
		var operationQueue = [];

		var writeTimer;
		var writeBuffer = {};

		function isAuthorized () {
			return state == 'authorized';
		}

		function response (data, tabId, operation) {
			if (isAuthorized()) {
				if (!tabId || !operation) return;
				data.type = 'fileio-' + operation + '-response';
			}
			else {
				if (!tabId) {
					if (operationQueue.length == 0) return;
					tabId = operationQueue[0].tabId;
				}
				data.type = 'authorize-response';
			}
			extension.sendRequest(tabId, data);
		}

		function handleOAuthError (data) {
			if (typeof data == 'object') {
				var jsonData = parseJson(data.text);
				if (jsonData.error) {
					if (typeof jsonData.error == 'string') {
						lastError = jsonData.error;
					}
					else if (typeof jsonData.error == 'object') {
						for (var i in jsonData.error) {
							lastError = jsonData.error[i];
							break;
						}
					}
				}
				else {
					switch (data.status) {
					case 404:
						lastError = 'File not found.';
						break;
					default:
						lastError = 'Unknown error.';
						break;
					}
				}
			}
			else {
				lastError = data + '';
			}

			lastError = backend + ': ' + lastError;
			console.error('wasavi background: file system error: ' + lastError);

			var lastTabId;
			while (operationQueue.length) {
				var op = operationQueue.shift();
				lastTabId = op.tabId;
				response({error:lastError}, op.tabId, op.method);
			}
			if (lastTabId) {
				extension.focusTab(lastTabId);
			}

			if (state != 'authorized') {
				state = 'no-request-token';
			}
		}

		function runQueue () {
			if (!isAuthorized()) {
				handleOAuthError('Not authorized');
				return;
			}
			var lastTabId;
			for (var op; operationQueue.length;) {
				op = operationQueue.shift();
				lastTabId = op.tabId;
				switch (op.method) {
				case 'ls':    ls(op.path, op.tabId); break;
				case 'write': write(op.path, op.content, op.tabId); break;
				case 'read':  read(op.path, op.tabId); break;
				}
			}
			if (lastTabId) {
				extension.focusTab(lastTabId);
			}
		}

		function queryToObject (url) {
			var index = url.indexOf('?');
			if (index < 0) {
				return {};
			}
			var result = {};
			url.substring(index + 1).split('&').forEach(function (s) {
				var index = s.indexOf('=');
				var key, value;
				if (index < 0) {
					key = s;
					value = '';
				}
				else {
					key = s.substring(0, index);
					value = s.substring(index + 1);
				}
				key = OAuth.urlDecode(key);
				value = OAuth.urlEncode(value);
				result[key] = value;
			});
			return result;
		}

		function objectToQuery (q) {
			var result = [];
			for (var i in q) {
				result.push(
					OAuth.urlEncode(i) +
					'=' +
					OAuth.urlEncode(q[i]));
			}
			return result.join('&');
		}

		function setQuery (url, q) {
			var base = baseUrl(url);
			var query = objectToQuery(q);
			return query == '' ? base : (base + '?' + query);
		}

		function authorize (tabId) {
			var thisFunc = arguments.callee;
			switch (state) {
			case 'error':
				handleOAuthError(lastError);
				break;

			case 'no-request-token':
				lastError = undefined;
				state = 'fetching-request-token';
				response({state:'authorizing', phase:'1/3'});
				oauth.setAccessToken('', '');
				oauth.post(
					oauthOpts.requestTokenUrl, null,
					function (data) {
						state = 'confirming-user-authorization';

						var token = oauth.parseTokenRequest(
							data, data.responseHeaders['Content-Type'] || undefined);
						oauth.setAccessToken([token.oauth_token, token.oauth_token_secret]);

						var q = queryToObject(oauthOpts.authorizationUrl);
						q.oauth_token = token.oauth_token;
						q.oauth_callback = oauthCallbackUrl;
						oauth.setCallbackUrl(oauthCallbackUrl);

						extension.openTabWithUrl(
							setQuery(oauthOpts.authorizationUrl, q),
							function (id, url) {
								extension.tabWatcher.add(id, url, function (newUrl) {
									//if (!newUrl) return;
									if (state != 'confirming-user-authorization') return;

									extension.closeTab(id);
									oauth.setCallbackUrl('');
									if (baseUrl(newUrl) == baseUrl(oauthCallbackUrl)) {
										var q = queryToObject(newUrl);
										if (q.fs != backend) return;
										if (q.oauth_token == oauth.getAccessTokenKey()) {
											state = 'no-access-token';
											uid = q.uid;
											thisFunc();
										}
										else {
											operationQueue = [{method:'authorize', tabId:tabId}];
											handleOAuthError('Invalid authentication.');
										}
									}
									else {
										operationQueue = [{method:'authorize', tabId:tabId}];
										handleOAuthError('Authentication declined: ' + baseUrl(newUrl));
									}
								});
							}
						);
					},
					function (data) {
						operationQueue = [{method:'authorize', tabId:tabId}];
						handleOAuthError(data);
					}
				);
				break;

			case 'no-access-token':
				lastError = undefined;
				state = 'fetching-access-token';
				response({state:'authorizing', phase:'2/3'});
				oauth.post(
					oauthOpts.accessTokenUrl, null,
					function (data) {
						state = 'pre-authorized';
						var token = oauth.parseTokenRequest(
							data, data.responseHeaders['Content-Type'] || undefined);
						oauth.setAccessToken([token.oauth_token, token.oauth_token_secret]);
						oauth.setVerifier('');
						thisFunc();
					},
					function (data) {
						operationQueue = [{method:'authorize', tabId:tabId}];
						handleOAuthError(data);
					}
				);
				break;

			case 'pre-authorized':
				lastError = undefined;
				state = 'fetching-account-info';
				response({state:'authorizing', phase:'3/3'});
				oauth.getJSON(
					'https://api.dropbox.com/1/account/info',
					function (data) {
						if (data.uid == uid) {
							state = 'authorized';
							saveAccessTokenPersistents(
								oauth.getAccessTokenKey(),
								oauth.getAccessTokenSecret(),
								data.uid, data.country);
							runQueue();
						}
						else {
							operationQueue = [{method:'authorize', tabId:tabId}];
							handleOAuthError('User unmatch.');
						}
					},
					function (data) {
						operationQueue = [{method:'authorize', tabId:tabId}];
						handleOAuthError(data);
						state = 'no-request-token';
					}
				);
				break;
			}
		}

		function getInternalPath (path) {
			path = path.replace(/^dropbox:\//, '');
			path = path.replace(/^\//, '');
			return path;
		}

		function getExternalPath (path) {
			if (path.charAt(0) != '/') {
				path = '/' + path;
			}
			return backend + ':/' + path;
		}

		function getCanonicalPath (path) {
			return path.split('/').map(OAuth.urlEncode).join('/');
		}

		function match (url) {
			return /^dropbox:/.test(url);
		}

		function ls (path, tabId) {
			if (isAuthorized()) {
			}
			else {
				operationQueue.push({method:'ls', path:path, tabId:tabId});
				authorize(tabId);
			}
		}

		function write (path, content, tabId) {
			if (isAuthorized()) {
				response({state:'writing', progress:0}, tabId, 'write');
				oauth.onModifyTransport = function (xhr) {
					if (!xhr.upload) return;
					xhr.upload.onprogress = xhr.upload.onload = function (e) {
						if (!e.lengthComputable) return;
						response(
							{state:'writing', progress:e.loaded / e.total},
							tabId, 'write');
					};
				};
				oauth.request({
					method:'PUT',
					url:'https://api-content.dropbox.com/1/files_put/dropbox/'
						+ getCanonicalPath(getInternalPath(path))
						+ '?locale=' + locale,
					data:content,							// TODO: make binary data
					headers:{'Content-Type':'text/plain'},	// TODO: specify encoding
					success:function (data) {
						var meta = parseJson(data.text);
						response(
							{
								state:'complete',
								meta:{
									path:getExternalPath(meta.path),
									charLength:content.length
								}
							},
							tabId, 'write'
						);
					},
					failure:function (data) {
						operationQueue = [{method:'write', path:path, tabId:tabId}];
						handleOAuthError(data);
					}
				});
			}
			else {
				operationQueue.push({method:'write', path:path, content:content, tabId:tabId});
				authorize(tabId);
			}
		}

		function writeLater (path, content, tabId) {
			if (!writeTimer) {
				writeTimer = setTimeout(function () {
					for (var i in writeBuffer) {
						write(i, writeBuffer[i].content, writeBuffer[i].tabId);
					}
					writeBuffer = {};
					writeTimer = null;
				}, 1000 * WRITE_DELAY_SECS);
			}
			writeBuffer[path] = {tabId:tabId, content:content};
			response({state:'buffered'}, tabId, 'write');
		}

		function read (path, tabId) {
			if (isAuthorized()) {
				response({state:'reading', progress:0}, tabId, 'read');
				oauth.onModifyTransport = function (xhr) {
					xhr.onprogress = xhr.onload = function (e) {
						if (!e.lengthComputable) return;
						response(
							{state:'reading', progress:e.loaded / e.total},
							tabId, 'read');
					};
				};
				oauth.get(
					'https://api-content.dropbox.com/1/files/dropbox/'
						+ getCanonicalPath(getInternalPath(path)),
					function (data) {
						var meta = parseJson(data.responseHeaders['x-dropbox-metadata']);
						if (!/^text\//.test(meta.mime_type)) {
							handleOAuthError({error:'Unknown MIME type: ' + meta.mime_type});
							return;
						}
						if (meta.is_dir) {
							handleOAuthError({error:'Cannot edit a directory.'});
							return;
						}
						response({
							state:'complete',
							content:data.text,
							meta:{
								status:data.status,
								path:getExternalPath(meta.path),
								charLength:data.text.length
							}
						}, tabId, 'read');
					},
					function (data) {
						if (data.status == 404) {
							response({
								state:'complete',
								content:'',
								meta:{
									status:data.status,
									path:getExternalPath(path),
									charLength:0
								}
							}, tabId, 'read');
						}
						else {
							operationQueue = [{method:'read', path:path, tabId:tabId}];
							handleOAuthError(data);
						}
					}
				);
			}
			else {
				operationQueue.push({method:'read', path:path, tabId:tabId});
				authorize(tabId);
			}
		}

		function accessTokenKeyName () {
			return 'filesystem.' + backend + '.tokens';
		}

		function restoreAcessTokenPersistents () {
			var obj = parseJson(extension.storage.getItem(accessTokenKeyName()));
			if (obj.key && obj.secret && obj.uid && obj.locale) {
				oauth.setAccessToken(obj.key, obj.secret);
				uid = obj.uid;
				locale = obj.locale;
				state = 'pre-authorized';
			}
		}

		function saveAccessTokenPersistents (key, secret, uid, locale) {
			extension.storage.setItem(
				accessTokenKeyName(),
				JSON.stringify({key:key, secret:secret, uid:uid, locale:locale}));
		}

		this.ls = ls;
		this.write = writeLater;
		this.read = read;
		this.match = match;
		this.__defineGetter__('isAuthorized', isAuthorized);
		this.__defineGetter__('backend', function () {return backend;});
		this.__defineGetter__('state', function () {return state;});

		//restoreAcessTokenPersistents();
	}

	/*
	 * functions
	 * ----------------
	 */

	function baseUrl (s) {
		return s.replace(/\?.*/, '');
	}

	function parseJson (s, def) {
		if (typeof s != 'string') {
			return def || {};
		}

		var result;
		try {
			result = JSON.parse(s);
		}
		catch (e) {
			result = def || {};
		}

		return result;
	}

	function countOf (o) {
		var result = 0;
		for (var i in o) result++;
		return result;
	}

	function emit () {
		var args = Array.prototype.slice.call(arguments);
		if (args.length < 1) return;
		var fn = args.shift();
		if (typeof fn != 'function') return;
		try {
			fn.apply(null, args);
		}
		catch (e) {
			console.error(
				'wasavi background: an error occured inside callback:\n\t' + [
					'message: ' + e.message,
					'   line: ' + (e.line || e.lineNumber || '?'),
					'  stack: ' + (e.stack || '?')
				].join('\n\t'));
		}
	}

	/**
	 * storage initializer
	 */

	function initStorage () {
		extension.storage.setItem(
			'start_at', 
			(new Date).toLocaleDateString() + ' ' + (new Date).toLocaleTimeString()
		);

		[
			['targets', JSON.stringify({
				enableTextArea: true,
				enableText: false,
				enableSearch: false,
				enableTel: false,
				enableUrl: false,
				enableEmail: false,
				enablePassword: false,
				enableNumber: false
			})],
			['exrc', '" exrc for wasavi'],
			['shortcut', '<c-enter>, <insert>'],
			['shortcutCode', function () {
				return getShortcutCode(extension.storage.getItem('shortcut'));
			}],
			['fontFamily', defaultFont],
			['fstab', JSON.stringify({
				dropbox: {isDefault:true, enabled:true}
			})]
		].forEach(function (item) {
			if (extension.storage.getItem(item[0]) === null) {
				extension.storage.setItem(item[0], typeof item[1] == 'function' ? item[1]() : item[1]);
			}
		});
	}

	/**
	 * message catalog initializer
	 */

	function initMessageCatalog () {
		if (typeof extension.messageCatalogPath != 'string') {
			messageCatalog = false;
			return;
		}
		resourceLoader.get(extension.messageCatalogPath, function (text) {
			messageCatalog = parseJson(text);
			for (var i in messageCatalog) {
				delete messageCatalog[i].description;
			}
		}, {noCache:true});
	}

	/*
	 * key table initializer
	 */

	function initShortcutKeyTable () {
		for (var i = '0'.charCodeAt(0), goal = '9'.charCodeAt(0); i <= goal; i++) {
			KEY_TABLE[i] = String.fromCharCode(i);
		}
		for (var i = 'a'.charCodeAt(0), goal = 'z'.charCodeAt(0); i <= goal; i++) {
			KEY_TABLE[i] = String.fromCharCode(i);
		}
	}

	/**
	 * shortcut code generator
	 */

	function getShortcutCode (shortcuts) {
		shortcuts = shortcuts.replace(/^\s+|\s+$/g, '');
		if (shortcuts == '') {
			shortcuts = '<insert>,<c-enter>';
		}

		var result = [];

		shortcuts.toLowerCase().split(/\s*,\s*/).forEach(function (sc) {
			var re = /^<([^>]+)>$/.exec(sc);
			if (!re) return;

			var modifiers = re[1].split('-');
			var key = modifiers.pop();
			if (!(key in KEY_TABLE)) return;

			var code = [];
			var shiftSpecified = false;
			var ctrlSpecified = false;
			modifiers.forEach(function (m) {
				switch (m.toLowerCase()) {
				case 's':
					code.push('e.shiftKey');
					shiftSpecified = true;
					break;
				case 'c':
					code.push('e.ctrlKey');
					ctrlSpecified = true;
					break;
				}
			});
			!shiftSpecified && code.push('!e.shiftKey');
			!ctrlSpecified && code.push('!e.ctrlKey');
			code.push('e.keyCode==' + KEY_TABLE[key]);

			result.push(code.join('&&'));
		});

		result = result.join('||');

		if (result == '') {
			result = arguments.callee('');
		}

		return 'return ' + result + ';';
	}

	/**
	 * file system initializer
	 */

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
			data = parseJson(data);
			fstab = parseJson(extension.storage.getItem('fstab'));
			for (var i in fstab) {
				if (!data[i] || !data[i].key || !data[i].secret) continue;
				fstab[i].isNull = false;
				fstab[i].instance = FileSystemBase.create(i, data[i].key, data[i].secret);
				console.info('wasavi background: file system driver initialized: ' + i);
			}
			fstab.nullFs = {
				enabled:true,
				isNull:true,
				instance:new FileSystemBase
			};
		}
		resourceLoader.get('consumer_keys.bin', function (binkeys) {
			if (binkeys === false) {
				resourceLoader.get(
					'consumer_keys.json', initFileSystemCore, {noCache:true}
				);
			}
			else {
				resourceLoader.get('wasavi.js', function (data) {
					initFileSystemCore(
						(new Blowfish(SHA1.calc(data))).decrypt64(binkeys)
					);
				}, {noCache:true});
			}
		}, {noCache:true});
	}

	function getFileSystem (path) {
		var preferred;
		var defaultFs;
		var nullFs;
		for (var i in fstab) {
			var fs = fstab[i];
			if (fs.instance.match(path)) {
				preferred = fs.instance;
			}
			if (fs.isDefault) {
				defaultFs = fs.instance;
			}
			if (fs.isNull) {
				nullFs = fs.instance;
			}
		}
		return preferred || defaultFs || nullFs;
	}

	function initWasaviFrame () {
		resourceLoader.get('wasavi_frame.html', function (data) {
			wasaviFrame = /<body[^>]*>([\s\S]+)<\/body>/
				.exec(data)[1]
				.replace(/\n/g, '')
				.replace(/>\s+</g, '><')
				.replace(/^\s+|\s+$/g, '');
		}, {noCache:true});
	}

	/**
	 * broadcasts to all content scripts that storage updated
	 */

	function broadcastStorageUpdate (keys, originTabId) {
		var items = [];

		keys.forEach(function (key) {
			items.push({key:key, value:extension.storage.getItem(key)});
		});

		extension.broadcast({type:'update-storage', items:items}, originTabId);
	}

	/**
	 * request handler
	 */

	function handleRequest (req, tabId, res) {
		if (!req || !req.type) {
			return;
		}

		switch (req.type) {
		case 'init':
		case 'init-agent':
			req.type == 'init' && extension.registerTabId(tabId);
			res({
				type:'init-response',
				extensionId:extension.extensionId,
				tabId:tabId,
				targets:extension.storage.getItem('targets'),
				exrc:extension.storage.getItem('exrc'),
				shortcut:extension.storage.getItem('shortcut'),
				shortcutCode:extension.storage.getItem('shortcutCode'),
				fontFamily:extension.storage.getItem('fontFamily'),
				messageCatalog:messageCatalog,
				wasaviFrame:wasaviFrame
			});
			break;

		case 'get-storage':
			if ('key' in req) {
				res({key:req.key, value:extension.storage.getItem(req.key)});
			}
			else {
				res({key:req.key, value:undefined});
			}
			break;

		case 'set-storage':
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
						if (item.key == 'font-family') {
							if (!/^\s*(?:"[^",;]+"|'[^',;]+'|[a-zA-Z-]+)(?:\s*,\s*(?:"[^",;]+"|'[^',;]+'|[a-zA-Z-]+))*\s*$/.test(item.value)) {
								item.value = defaultFont;
							}
						}

						keys.push(item.key);
						extension.storage.setItem(item.key, item.value);

						if (item.key == 'shortcut') {
							keys.push('shortcutCode');
							extension.storage.setItem('shortcutCode', getShortcutCode(item.value));
						}
					}
				});
				broadcastStorageUpdate(keys);
			}
			res();
			break;
		
		case 'bell':
			if ('file' in req) {
				resourceLoader.get(req.file, function (data) {
					res({data:data || ''});
				}, {noCache:true});
			}
			else {
				res();
			}
			break;

		case 'open-options-page':
			extension.openTabWithFile('options.html');
			res();
			break;

		case 'notify-to-child':
			var childTabId = 'childTabId' in req ? req.childTabId : extension.lastRegisteredTab;
			if (childTabId !== undefined && extension.isExistsTabId(childTabId)) {
				extension.sendRequest(childTabId, req.payload);
			}
			res();
			break;

		case 'notify-to-parent':
			if ('parentTabId' in req && req.parentTabId != undefined) {
				extension.sendRequest(req.parentTabId, req.payload);
			}
			else {
				// wasavi-saved
				// wasavi-initialized
				// wasavi-terminated
				// wasavi-stroked
				// wasavi-window-state
				// wasavi-focus-me
				switch (req.payload.type) {
				case 'wasavi-saved':
					if ('tabId' in req && 'path' in req.payload && req.payload.path != '') {
						getFileSystem(req.payload.path)
							.write(req.payload.path, req.payload.value, req.tabId);
					}
					break;
				case 'wasavi-terminated':
					if ('tabId' in req && req.payload && req.payload.isTopFrame) {
						extension.closeTabByWasaviId(req.tabId);
					}
					break;
				}
			}
			res();
			break;

		case 'set-clipboard':
			if ('data' in req) {
				extension.clipboard.set(req.data);
			}
			res();
			break;
		
		case 'get-clipboard':
			res({data:extension.clipboard.get()});
			break;

		case 'read':
			if ('tabId' in req) {
				getFileSystem(req.path).read(req.path, req.tabId);
			}
			res();
			break;
		}
	}

	/**
	 * bootstrap
	 */

	function handleLoad (e) {
		window.removeEventListener && window.removeEventListener(e.type, arguments.callee, false);
		resourceLoader = ResourceLoader.create();
		extension = ExtensionWrapper.create();

		initStorage();
		initMessageCatalog();
		initShortcutKeyTable();
		initFileSystem();
		initWasaviFrame();
		extension.addRequestListener(handleRequest);

		console.info('wasavi background: running.');
	}

	window.addEventListener ?
		window.addEventListener('load', handleLoad, false) :
		handleLoad();

})(this);

// vim:set ts=4 sw=4 fileencoding=UTF-8 fileformat=unix filetype=javascript :

