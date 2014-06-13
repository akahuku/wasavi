/**
 * wasavi: vi clone implemented in javascript
 * =============================================================================
 *
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

	/* {{{1 consts */

	var TEST_MODE_URL = 'http://wasavi.appsweets.net/test_frame.html';
	var TEST_VERSION = '0.0.1';
	var MENU_EDIT_WITH_WASAVI = 'edit_with_wasavi';

	/* {{{1 variables */
	var unicodeDictData;
	var wasaviFrame;
	var wasaviFrameData;
	var defaultFont = '"Consolas","Monaco","Courier New","Courier",monospace';
	var payload;
	var runtimeOverwriteSettings;
	var hotkey;

	var ext = require('./kosian/Kosian').Kosian(global, {
		appName: 'wasavi',
		cryptKeyPath: 'LICENSE',
		writeDelaySecs: 1,
		fstab: {
			dropbox: {
				isDefault: true,
				enabled: true
			},
			gdrive: {
				enabled: true
			},
			onedrive: {
				enabled: true
			}
		}
	});

	/* {{{1 functions */

	/** {{{2 utilities */

	function broadcastStorageUpdate (keys, originTabId) {
		var items = [];

		keys.forEach(function (key) {
			items.push({
				key: key,
				value: ext.storage.getItem(key)
			});
		});

		ext.broadcast({
			type: 'update-storage',
			items: items
		}, originTabId);
	}

	/** {{{2 storage initializer */

	function initStorage () {
		ext.storage.setItem(
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
			['shortcut', hotkey.defaultHotkeysDesc],
			['shortcutCode', function () {
				return hotkey.getObjectsForDOM(ext.storage.getItem('shortcut'));
			}],
			['fontFamily', defaultFont],
			['fstab', {
				dropbox: {isDefault:true, enabled:true},
				gdrive: {enabled:true},
				onedrive: {enabled:true}
			}],
			['quickActivation', false]
		]
		.forEach(function (item) {
			var key = item[0];
			var defaultValue = typeof item[1] == 'function' ? item[1]() : item[1];
			var currentValue = ext.storage.getItem(key);

			if (currentValue === undefined) {
				ext.storage.setItem(key, defaultValue);
			}
			else {
				var defaultType = ext.utils.objectType(defaultValue);
				var currentType = ext.utils.objectType(currentValue);
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
					ext.storage.setItem(key, currentValue);
					break;
				}
			}
		});
	}

	/** {{{2 initialize main part of wasavi */

	function initWasaviFrame () {
		ext.resourceLoader.get('wasavi_frame.html', function (data) {
			wasaviFrameData = 'data:text/html;charset=UTF-8;base64,' + btoa(data);
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
			ext.resourceLoader.get(
				'unicode/' + file,
				handler.apply(null, arg),
				{noCache:true, mimeType:'text/plain;charset=x-user-defined'});
		});
	}

	/** {{{2 hotkey */

	function initHotkey () {
		hotkey.register(ext.storage.getItem('shortcut'));
		hotkey.onPress = handleHotkeyPress;
	}

	function handleHotkeyPress (hotkey) {
		ext.sendRequest({command:'request-run'});
	}

	/** {{{2 request handlers */

	function handleInit (command, data, sender, respond) {
		var isInit = command == 'init';
		respond({
			command: 'init-response',
			extensionId: ext.id,
			tabId: sender,
			version: ext.version,
			devMode: ext.isDev,
			testMode: data.url == TEST_MODE_URL,

			targets: ext.storage.getItem('targets'),
			exrc: ext.storage.getItem('exrc'),
			ros: payload && payload.url != TEST_MODE_URL ?
				runtimeOverwriteSettings.get(payload.url, payload.nodePath) :
				'',
			shortcut: hotkey.canProcess ?
				null : ext.storage.getItem('shortcut'),
			shortcutCode: hotkey.canProcess ?
				null : hotkey.getObjectsForDOM(ext.storage.getItem('shortcut')),
			fontFamily: ext.storage.getItem('fontFamily'),
			quickActivation: ext.storage.getItem('quickActivation') == '1',

			messageCatalog: ext.messageCatalog,
			wasaviFrame: isInit ? wasaviFrame : null,
			fstab: isInit ? ext.fileSystem.getInfo() : null,
			unicodeDictData: isInit ? unicodeDictData : null,
			payload: payload || null
		});
		payload = null;
	}

	function handleInitOptions (command, data, sender, respond) {
	}

	function handleGetStorage (command, data, sender, respond) {
		if ('key' in data) {
			respond({
				key: data.key,
				value: ext.storage.getItem(data.key)
			});
		}
		else {
			respond({
				key: data.key,
				value: undefined
			});
		}
	}

	function handleSetStorage (command, data, sender, respond) {
		var items;

		if ('key' in data && 'value' in data) {
			items = [{key:data.key, value:data.value}];
		}
		else if ('items' in data) {
			items = data.items;
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
					ext.storage.setItem(item.key, item.value);

					if (item.key == 'shortcut') {
						keys.push('shortcutCode');
						ext.storage.setItem(
							'shortcutCode',
							hotkey.getObjectsForDOM(item.value));
					}
				}
			});
			broadcastStorageUpdate(keys);
		}
	}

	function handleBell (command, data, sender, respond) {
		if ('file' in data) {
			ext.resourceLoader.get(data.file, function (data) {
				respond({
					data: data || ''
				});
			}, {sync:true});
		}
	}

	function handleOpenOptionsPage (command, data, sender, respond) {
		ext.openTabWithFile('options.html');
	}

	function handleNotifyToBackend (command, data, sender, respond) {
		if (!('payload' in data)) return;

		switch (data.payload.type) {
		case 'chdir':
			if ('tabId' in data
			&& 'path' in data.payload) {
				if (data.payload.path == '') {
					ext.sendRequest(
						data.tabId,
						{type:'fileio-chdir-response', data:null}
					);
				}
				else {
					ext.fileSystem.ls(
						data.payload.path,
						data.tabId,
						function (data) {
							var error = null;
							if (data.error) {
								error = data.error;
								data = null;
							}
							ext.sendRequest(
								data.tabId,
								{
									type:'fileio-chdir-response',
									data:data, error:error
								}
							);
						}
					);
				}
			}
			break;
		case 'read':
			if ('tabId' in data
			&& 'path' in data.payload
			&& data.payload.path != '') {
				ext.fileSystem.read(
					data.payload.path,
					data.tabId
				);
			}
			break;
		case 'saved':
			if ('tabId' in data
			&& 'path' in data.payload
			&& data.payload.path != '') {
				ext.fileSystem.write(
					data.payload.path,
					data.payload.value,
					data.tabId
				);
			}
			break;
		case 'terminated':
			if ('url' in data.payload
			&& 'nodePath' in data.payload
			&& 'ros' in data.payload) {
				runtimeOverwriteSettings.set(
					data.payload.url,
					data.payload.nodePath,
					data.payload.ros
				);
			}
			if (!('parentTabId' in data)
			&& 'tabId' in data
			&& 'isTopFrame' in data.payload
			&& data.payload.isTopFrame) {
				ext.closeTab(data.tabId);
			}
			break;
		}
	}

	function handleSetClipboard (command, data, sender, respond) {
		if ('data' in data) {
			ext.clipboard.set(data.data);
		}
	}

	function handleGetClipboard (command, data, sender, respond) {
		respond({data: ext.clipboard.get()});
	}

	function handlePushPayload (command, data, sender, respond) {
		payload = data;
	}

	function handleRequestWasaviFrame (command, data, sender, respond) {
		respond({data: wasaviFrameData});
	}

	function handleFsCtl (command, data, sender, respond) {
		var result = false;
		switch (data.subtype) {
		case 'reset':
			ext.fileSystem.clearCredentials(data.name);
			break;
		case 'get-entries':
			ext.fileSystem.ls(data.path, data.tabId, function (data) {
				respond({data: data.contents});
			});
			result = true;
			break;
		}
		return result;
	}

	/** {{{2 request handler entry */

	function handleRequest (command, data, sender, respond) {
		if (!command || !data) return;

		console.log('wasavi backend: handleRequest got a command: ' + command);

		var lateResponse = false;

		function res (arg) {
			if (respond) {
				try {
					respond(arg);
				}
				catch (e) {
					;
				}
				respond = null;
			}
		}

		try {
			var handler;

			switch (command) {
			case 'init':				// FALLTHRU
			case 'init-agent':			handler = handleInit; break;
			case 'init-options':		handler = handleInitOptions; break;
			case 'get-storage':			handler = handleGetStorage; break;
			case 'set-storage':			handler = handleSetStorage; break;
			case 'bell':				handler = handleBell; break;
			case 'open-options-page':	handler = handleOpenOptionsPage; break;
			case 'notify-to-backend':	handler = handleNotifyToBackend; break;
			case 'set-clipboard':		handler = handleSetClipboard; break;
			case 'get-clipboard':		handler = handleGetClipboard; break;
			case 'push-payload':		handler = handlePushPayload; break;
			case 'request-wasavi-frame':handler = handleRequestWasaviFrame; break;
			case 'fsctl':				handler = handleFsCtl; break;
			}

			if (handler) {
				lateResponse = handler(command, data, sender, res);
			}
		}
		finally {
			!lateResponse && res();
		}
	}

	/** {{{2 bootstrap */

	function handleLoad (e) {
		window.removeEventListener && window.removeEventListener(e.type, handleLoad, false);
		runtimeOverwriteSettings = require('./RuntimeOverwriteSettings').RuntimeOverwriteSettings();
		hotkey = require('./kosian/Hotkey').Hotkey();

		initWasaviFrame();
		initHotkey();
		initStorage();
		initUnicodeDictData();

		ext.receive(handleRequest);
		ext.isDev && console.info('wasavi background: running.');
	}

	window.addEventListener ?
		window.addEventListener('load', handleLoad, false) :
		handleLoad();

})(this);

// vim:set ts=4 sw=4 fenc=UTF-8 ff=unix ft=javascript fdm=marker :
