/**
 * wasavi: vi clone implemented in javascript
 * =============================================================================
 *
 *
 * @author akahuku@gmail.com
 * @version $Id: background.js 115 2012-05-12 02:04:45Z akahuku $
 *
 *
 * Copyright (c) 2012 akahuku@gmail.com
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     1. Redistributions of source code must retain the above copyright
 *        notice, this list of conditions and the following disclaimer.
 *     2. Redistributions in binary form must reproduce the above
 *        copyright notice, this list of conditions and the following
 *        disclaimer in the documentation and/or other materials
 *        provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * global variables
 */

typeof window == 'undefined' && eval('var window = this; window.jetpack = {};');
var extension;
var resourceLoader;
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
			xhr.open('GET', location.href.replace(/\/[^\/]*$/, '/') + resourcePath, true);
			xhr.overrideMimeType('text/plain;charset=UTF-8');
			xhr.onload = function () {
				data[resourcePath] = xhr.responseText;
				callback && callback(data[resourcePath]);
				xhr = xhr.onload = xhr.onerror = null;
			};
			xhr.onerror = function () {
				data[resourcePath] = '';
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
			callback && callback({source:data});
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
}

/**
 * extension wrapper class for firefox (Add-on SDK)
 */

function FirefoxJetpackExtensionWrapper () {
	var self = require('self');
	var pagemod = require('page-mod');

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

	require('widget').Widget({
		id:'wasavi-widget',
		label:'wasavi configuration',
		contentURL:self.data.url('icon016.png'),
		onClick:function () {
			require('tabs').open(self.data.url('options.html'));
		}
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
			callback && callback({source:data});
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
			fontFamily:extension.storage.getItem('fontFamily')
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
				res({data:data});
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
	function dumpGlobal () {
		var a = [];
		for (var i in global) {
			var s = i;
			try {
				s += ': ' + (global[i].toString().replace(/[\r\n\t]+/g, ' '));
			}
			catch (e) {
				;
			}
			a.push(s);
		}
		console.log(a.join('\n'));
	}

	function handleLoad (e) {
		window.removeEventListener && window.removeEventListener('load', arguments.callee, false);

		resourceLoader = ResourceLoader.create();
		extension = ExtensionWrapper.create();

		initStorage();
		extension.addRequestListener(handleRequest);

		console.log('wasavi background: running.');
		//dumpGlobal();
	}

	window.addEventListener ?
		window.addEventListener('load', handleLoad, false) :
		handleLoad();

})(this);

// vim:set ts=4 sw=4 fileencoding=UTF-8 fileformat=unix filetype=javascript :

