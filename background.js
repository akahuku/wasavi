/**
 * wasavi: vi clone implemented in javascript
 * =============================================================================
 *
 *
 * @author akahuku@gmail.com
 * @version $Id: background.js 148 2012-06-27 17:29:15Z akahuku $
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
 * global variables
 */

typeof window == 'undefined' && eval('var window = this; window.jetpack = {};');
var extension;
var resourceLoader;
var messageCatalog;
var defaultFont = '"Consolas","Monaco","Courier New","Courier",monospace';

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
		callback && callback('');
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
	this.get = function (resourcePath, callback) {
		if (resourcePath in data) {
			callback && callback(data[resourcePath]);
		}
		else {
			var xhr = new XMLHttpRequest;
			xhr.open('GET', location.href.replace(/\/[^\/]*$/, '/') + resourcePath, false);
			xhr.overrideMimeType('text/plain;charset=UTF-8');
			xhr.onload = function () {
				data[resourcePath] = xhr.responseText;
				callback && callback(data[resourcePath]);
				xhr = xhr.onload = xhr.onerror = null;
			};
			xhr.onerror = function () {
				data[resourcePath] = false;
				callback && callback(data[resourcePath]);
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
			callback && callback(data[resourcePath]);
		}
		else {
			var content;
			try {
				content = self.data.load(resourcePath);
			}
			catch (e) {
				content = '';
				console.error(
					'wasavi background: exception ocuured during' +
					' self.data.load("' + resourcePath + '")');
			}
			data[resourcePath] = content;
			callback && callback(content);
		}
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
	this.openPage = function (file) {};
	this.storage = new StorageWrapper;
	this.extensionId = '';
	this.lastRegisteredTab;
	this.messageCatalogPath;
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
	this.openPage = function (file) {
		chrome.tabs.create({url:chrome.extension.getURL(file)});
	};
	this.storage = new WebStorageWrapper;
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
				callback && callback(i);
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
			callback && callback({source:data || ''});
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
	this.openPage = function (file) {
		opera.extension.tabs.create({
			url:location.href.replace(/\/[^\/]*$/, '/') + file, 
			focused:true
		});
	};
	this.storage = new WebStorageWrapper;
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

function dummyRequire () {
	require('self');
	require('page-mod');
	require('tabs');
	require('simple-prefs');
	require('api-utils/l10n/locale');
}
function FirefoxJetpackExtensionWrapper () {
	var self = require('self');
	var pagemod = require('page-mod');
	var l10n = require('api-utils/l10n/locale');

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
				callback && callback(i);
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
				if (url == 'http://appsweets.net/wasavi/wasavi_frame.html'
				||  url == 'https://ss1.xrea.com/appsweets.net/wasavi/wasavi_frame.html') {
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
			'http://appsweets.net/wasavi/wasavi_frame.html',
			'https://ss1.xrea.com/appsweets.net/wasavi/wasavi_frame.html'
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
		require('tabs').open(self.data.url('options.html'));
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
			callback && callback({source:data || ''});
		});
	};
	this.addRequestListener = function (handler) {
		onMessageHandler = handler;
	};
	this.openPage = function (file) {
		require('tabs').open(self.data.url(file));
	};
	this.storage = new JetpackStorageWrapper;
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

		var availables = JSON.parse(self.data.load('xlocale/locales.json')).map(function (l) {
			return l.replace(/_/g, '-').toLowerCase();
		});
		var result = l10n.findClosestLocale(availables, prefered);
		if (!result) {
			return undefined;
		}

		return 'xlocale/' + result + '/messages.json';
	})();
}

/*
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
		['fontFamily', defaultFont]
	].forEach(function (item) {
		if (extension.storage.getItem(item[0]) === null) {
			extension.storage.setItem(item[0], typeof item[1] == 'function' ? item[1]() : item[1]);
		}
	});
}

/*
 * message catalog initializer
 */

function initMessageCatalog () {
	if (typeof extension.messageCatalogPath != 'string') {
		messageCatalog = false;
		return;
	}
	resourceLoader.get(extension.messageCatalogPath, function (text) {
		try {
			messageCatalog = JSON.parse(text);
			for (var i in messageCatalog) {
				delete messageCatalog[i].description;
			}
		}
		catch (e) {
			messageCatalog = false;
		}
	});
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
			messageCatalog:messageCatalog
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
			});
		}
		else {
			res();
		}
		break;

	case 'open-options-page':
		extension.openPage('options.html');
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
		if ('parentTabId' in req) {
			extension.sendRequest(req.parentTabId, req.payload);
		}
		res();
	}
}

/**
 * shortcut code generator
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
(function () {
	for (var i = '0'.charCodeAt(0), goal = '9'.charCodeAt(0); i <= goal; i++) {
		KEY_TABLE[i] = String.fromCharCode(i);
	}
	for (var i = 'a'.charCodeAt(0), goal = 'z'.charCodeAt(0); i <= goal; i++) {
		KEY_TABLE[i] = String.fromCharCode(i);
	}
})();
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
		modifiers.forEach(function (m) {
			switch (m) {
			case 's':
				code.push('e.shiftKey');
				break;
			case 'c':
				code.push('e.ctrlKey');
				break;
			}
		});
		code.push('e.keyCode==' + KEY_TABLE[key]);

		result.push(code.join('&&'));
	});

	result = result.join('||');

	if (result == '') {
		result = arguments.callee('<c-enter>,<insert>');
	}

	return 'return ' + result + ';';
}

/**
 * bootstrap
 */

(function (global) {
	function handleLoad (e) {
		window.removeEventListener && window.removeEventListener('load', arguments.callee, false);

		resourceLoader = ResourceLoader.create();
		extension = ExtensionWrapper.create();

		initStorage();
		initMessageCatalog();
		extension.addRequestListener(handleRequest);

		console.log('wasavi background: running.');
	}

	window.addEventListener ?
		window.addEventListener('load', handleLoad, false) :
		handleLoad();

})(this);

// vim:set ts=4 sw=4 fileencoding=UTF-8 fileformat=unix filetype=javascript :

