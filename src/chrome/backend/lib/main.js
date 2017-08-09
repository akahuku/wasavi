/**
 * wasavi: vi clone implemented in javascript
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

	/* <<<1 consts */

	var TEST_MODE_URL = /^http:\/\/127\.0\.0\.1(:\d+)?\/test_frame\.html/;
	var APP_MODE_URL = 'http://wasavi.appsweets.net/';
	var APP_MODE_URL_SECURE = 'https://wasavi.appsweets.net/';
	var HOME_URL = 'http://appsweets.net/wasavi/';
	var TEST_VERSION = '0.0.1';
	var STORAGE_UPDATE_BROADCAST_DELAY_SECS = 1000 * 3;

	/* <<<1 variables */

	/*
	 * wasaviFrameHeader is content of head in wasavi.html
	 * used in app mode.
	 */
	var wasaviFrameHeader;

	/*
	 * wasaviFrameContent is content of body in wasavi.html
	 * used in app mode.
	 */
	var wasaviFrameContent;

	/*
	 * wasaviFrameStyle is style sheet content of wasavi frame.
	 */
	var wasaviFrameStyle;

	/*
	 * statusLineHeight is height of status line which is calculated
	 * dynamically.
	 */
	var statusLineHeight;

	var defaultFont = '"Consolas","Monaco","Courier New","Courier",monospace';
	var unicodeDictData;
	var payload;
	var config;

	var isInitializing = true;
	var blockedEvents = [];

	var ext = require('./kosian/Kosian').Kosian(global, {
		appName: 'wasavi',
		cryptKeyPath: 'LICENSE',
		writeDelaySecs: 10,
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
			},
			file: {
				enabled: true
			}
		}
	});
	var runtimeOverwriteSettings = require('./RuntimeOverwriteSettings').RuntimeOverwriteSettings();
	var hotkey = require('./kosian/Hotkey').Hotkey(true);
	var contextMenu = require('./ContextMenu').ContextMenu();
	var memorandum = require('./Memorandum').Memorandum();
	var marked = require('./marked');

	var configInfo = {
		sync: {
			targets: {
				def: {
					enableTextArea:       true,
					enableText:           false,
					enableSearch:         false,
					enableTel:            false,
					enableUrl:            false,
					enableEmail:          false,
					enablePassword:       false,
					enableNumber:         false,
					enableContentEditable:true,
					enablePage:           false
				}
			},
			exrc: {
				def: '" exrc for wasavi'
			},
			shortcut: {
				def: function () {
					return hotkey.defaultHotkeysDesc;
				},
				set: function (value) {
					this.set(
						'shortcutCode',
						hotkey.getObjectsForDOM(value));
					return value;
				}
			},
			shortcutCode: {
				def: function () {
					return hotkey.getObjectsForDOM(this.get('shortcut'));
				}
			},
			fontFamily: {
				def: defaultFont,
				set: function (value) {
					if (!/^\s*(?:"[^",;]+"|'[^',;]+'|[a-zA-Z-]+)(?:\s*,\s*(?:"[^",;]+"|'[^',;]+'|[a-zA-Z-]+))*\s*$/.test(value)) {
						value = defaultFont;
					}
					return value;
				}
			},
			fstab: {
				def: {
					dropbox:  {enabled: true, isDefault: true},
					gdrive:   {enabled: true},
					onedrive: {enabled: true},
					file:     {enabled: true}
				},
				set: function (value) {
					ext.fileSystem.setInfo(value);
					return value;
				},
				setOnInit: true
			},
			quickActivation: {
				def: false
			},
			qaBlacklist: {
				def: ''
			},
			siteOverrides: {
				def: false
			},
			logMode: {
				def: false,
				set: function (value) {
					ext.setLogMode(value);
					return value;
				},
				setOnInit: true
			},
			upgradeNotify: {
				def: true
			}
		},
		local: {
			version: {def: ''},
			wasavi_lineinput_histories: {def: {}},
			wasavi_registers: {def: {}}
		}
	};

	/* <<<1 classes */

	function Config (info, opts) {
		function init (emitUpdateEvent) {
			let updateHandler = opts.onupdate;

			if (!emitUpdateEvent) {
				opts.onupdate = null;
			}

			return Promise.all([
				new Promise(resolve => {
					let defaults = {};

					for (let i in info.sync) {
						defaults[i] = info.sync[i].def;
					}

					chrome.storage.sync.get(defaults, items => {
						if (chrome.runtime.lastError) {
							ext.log(`!ERROR: failed to retrieve sync storage: ${chrome.runtime.lastError.message}`);
						}
						else {
							for (let i in items) {
								values[i] = items[i];
							}
							console.log('got sync stroage');
							console.dir(items);
						}
						resolve();
					});
				}),
				new Promise(resolve => {
					let defaults = {};

					for (let i in info.local) {
						defaults[i] = info.local[i].def;
					}

					chrome.storage.local.get(defaults, items => {
						if (chrome.runtime.lastError) {
							ext.log(`!ERROR: failed to retrieve local storage: ${chrome.runtime.lastError.message}`);
						}
						else {
							for (let i in items) {
								values[i] = items[i];
							}
							console.log('got local stroage');
							console.dir(items);
						}
						resolve();
					});
				})
			]).then(() => {
				opts.onupdate = updateHandler;
				console.log('Config#init done');
			});
		}

		function clear () {
			return Promise.all([
				new Promise(resolve => {
					chrome.storage.sync.clear(() => {
						if (chrome.runtime.lastError) {
							ext.log(`!ERROR: failed to clearing sync storage: ${chrome.runtime.lastError.message}`);
						}
						console.log('cleared sync stroage');
						console.dir(items);
						resolve();
					})
				}),
				new Promise(resolve => {
					chrome.storage.local.clear(() => {
						if (chrome.runtime.lastError) {
							ext.log(`!ERROR: failed to clearing local storage: ${chrome.runtime.lastError.message}`);
						}
						console.log('cleared local stroage');
						console.dir(items);
						resolve();
					})
				})
			])
			.then(() => {
				return self.init();
			});
		}

		function get (name) {
			let itemInfo = getInfo(name);
			if (!itemInfo) return undefined;
			let result = values[name];
			if (itemInfo.get) {
				result = itemInfo.get.call(self, result);
			}
			return result;
		}

		function set (name, value) {
			let itemInfo = getInfo(name);
			if (!itemInfo) return;
			if (itemInfo.set) {
				itemInfo.set.call(self, value);
			}
			values[name] = value;
			let payload = {};
			payload[name] = value;
			if (name in info.sync) {
				chrome.storage.sync.set(payload);
			}
			else if (name in info.local) {
				chrome.storage.local.set(payload);
			}
			if (opts.onupdate) {
				opts.onupdate.call(self, name, value);
			}
		}

		function getInfo (name) {
			return info.sync[name] || info.local[name];
		}

		function getDefaultValue (name) {
			let itemInfo = getInfo(name);
			if (!itemInfo) return undefined;
			if (typeof itemInfo.def == 'function') {
				return itemInfo.def.call(self);
			}
			return itemInfo.def;
		}

		function handleStorageChanged (changes, areaName) {
			for (let name in changes) {
				let itemInfo = getInfo(name);
				let value = changes[name].newValue;
				if (!itemInfo) continue;
				if (itemInfo.set) {
					itemInfo.set.call(self, value);
				}
				values[name] = value;
				if (opts.onupdate) {
					opts.onupdate.call(self, name, value);
				}
			}
		}

		let self = this;
		let values = {};

		opts || (opts = {});
		chrome.storage.onChanged.addListener(handleStorageChanged);
		Object.defineProperties(this, {
			info: {value: info},
			opts: {value: opts},
			init: {value: init},
			get: {value: get},
			set: {value: set},
			clear: {value: clear}
		});
	}

	/* <<<1 functions */

	/** <<<2 utilities */

	function getShrinkedCode (src) {
		// strip head comment
		var blankLine = src.indexOf('\n\n');
		if (blankLine >= 0) {
			src = src.substring(blankLine + 2);
		}

		// strip all single line comments
		src = src.replace(/\/\/.*/g, ' ');

		// remove all newlines
		src = src.replace(/\n[\n\s]*/g, ' ');

		return src;
	}

	function isTestUrl (url) {
		if (TEST_MODE_URL.test(url)) return true;
		if ((url.indexOf(APP_MODE_URL) === 0 || url.indexOf(APP_MODE_URL_SECURE) === 0) && /[?&]testmode/.test(url)) return true;
		return false;
	}

	/** <<<2 async initializer: init the config object */

	function initConfig (configInfo) {
		config = new Config(configInfo, {
			onupdate: function (key, value) {
				if (!this._updates) {
					this._updates = {};
				}
				this._updates[key] = value;
				this._timer && ext.utils.clearTimeout(this._timer);
				this._timer = ext.utils.setTimeout(() => {
					ext.broadcastToAllTabs({
						type: 'update-storage',
						items: this._updates
					});
					delete this._timer;
					delete this._updates;
				}, STORAGE_UPDATE_BROADCAST_DELAY_SECS);
			}
		});

		return config.init();
	}

	/** <<<2 async initializer: init the content of wasavi frame */

	function initWasaviFrame () {
		return new Promise(function (resolve, reject) {
			ext.resource('wasavi.html', function (data) {
				if (typeof data != 'string' || data == '') {
					reject(new Error('Invalid content of mock.html.'));
					return;
				}

				data = data
					.replace(/\n+/g, '')
					.replace(/<!--.*?-->/g, '')
					.replace(/<script[^>]*>.*?<\/script>/g, '')
					.replace(/>\s+</g, '><')
					.replace(/^\s+|\s+$/g, '');

				wasaviFrameHeader = /<head[^>]*>(.+?)<\/head>/.exec(data)[1];
				wasaviFrameContent = /<body[^>]*>(.+?)<\/body>/.exec(data)[1];

				resolve();
			}, {noCache: true});
		});
	}

	/** <<<2 async initializer: init the style sheet of wasavi frame */

	function initWasaviStyle () {
		return new Promise(function (resolve, reject) {
			ext.resource('styles/wasavi.css', function (style) {
				if (typeof style != 'string' || style == '') {
					reject(new Error('Invalid content of wasavi.css.'));
					return;
				}

				style = style
					.replace(/\n+/g, ' ')
					.replace(/\/\*<(FONT_FAMILY)>\*\/.*?<\/\1>\*\//g, config.get('fontFamily'));

				if (require('sdk/self')) {
					style = style.replace(/box-sizing:/g, '-moz-$&');
				}

				wasaviFrameStyle = style;

				var loaded = function (d) {
					// apply new styles
					var s = d.getElementById('wasavi_global_styles');
					if (!s) {
						reject(new Error('Cannot find global style element in mock.'));
						return;
					}
					while (s.childNodes.length) {
						s.removeChild(s.childNodes[0]);
					}
					s.appendChild(d.createTextNode(style));

					// ensure container has a dimension
					var container = d.getElementById('wasavi_container');
					container.style.width = '640px';
					container.style.height = '480px';

					// calculate height of status line
					statusLineHeight = Math.max.apply(Math, [
						'wasavi_footer_status_container',
						'wasavi_footer_input_container'
					].map(function (id) {
						var el = d.getElementById(id);
						if (!el) {
							reject(new Error('Cannot find element #' + id));
							return;
						}
						return el.offsetHeight;
					}));
					if (isNaN(statusLineHeight)) {
						reject(new Error('invalid statusLineHeight: ' + statusLineHeight));
						return;
					}

					resolve();
				};

				var iframe;

				// Chrome, Opera
				if (global.document && document.getElementById) {
					loaded(document);
				}

				// Firefox
				else if ((iframe = require('sdk/frame/hidden-frame'))) {
					var hiddenFrame = iframe.add(iframe.HiddenFrame({
						onReady: function () {
							this.element.contentWindow.location.href =
								require('sdk/self').data.url('mock.html');
							this.element.addEventListener('DOMContentLoaded', function (e) {
								loaded(e.target);
								iframe.remove(hiddenFrame);
								iframe = hiddenFrame = null;
							}, true);
						}
					}));
				}

				//
				else {
					reject(new Error('Cannot retrieve statusLineHeight calculator.'));
				}
			}, {noCache: true});
		});
	}

	/** <<<2 async initializer: init f/F/t/T dictionary */

	function initUnicodeDictData () {
		function ensureBinaryString (data) {
			var buffer = [];
			for (var i = 0, goal = data.length; i < goal; i++) {
				buffer[i] = data.charCodeAt(i) & 0xff;
			}
			return String.fromCharCode.apply(null, buffer);
		}
		function get (arg) {
			return new Promise(function (resolve, reject) {
				ext.resource('unicode/' + arg[0],
					function (data) {
						if (!data) {
							reject(new Error('invalid unicode dict data: ' + arg[0]));
							return;
						}
						var name1 = arg[1];
						var name2 = arg[2];
						data = ensureBinaryString(data);
						if (name1 && name2) {
							unicodeDictData[name1][name2] = data;
						}
						else if (name1) {
							unicodeDictData[name1] = data;
						}
						resolve();
					},
					{noCache: true, mimeType: 'text/plain;charset=x-user-defined'}
				);
			});
		}
		return new Promise(function (resolve, reject) {
			unicodeDictData = {fftt: {}};

			var list = [
				['fftt_general.dat', 'fftt', 'General'],
				['fftt_han_ja.dat', 'fftt', 'HanJa'],
				['linebreak.dat', 'LineBreak']
			];

			return Promise.all(list.map(get)).then(resolve, reject);
		});
	}

	/** <<<2 request handlers */

	function handleInit (command, data, sender, respond) {
		if (isInitializing) {
			blockedEvents.push(function () {
				handleInit(command, data, sender, respond);
			});
			return true;
		}

		var isInit = command.type == 'init';
		var isAgent = command.type == 'init-agent';
		var isOptions = command.type == 'init-options';

		var o = {
			// basic variables
			extensionId: ext.id,
			tabId: sender,
			version: ext.version,
			devMode: ext.isDev,
			logMode: ext.logMode,
			testMode: isTestUrl(data.url),

			targets: config.get('targets'),
			shortcut: config.get('shortcut'),
			shortcutCode: hotkey.getObjectsForDOM(config.get('shortcut')),
			fontFamily: config.get('fontFamily'),
			quickActivation: config.get('quickActivation'),
			statusLineHeight: statusLineHeight,

			payload: payload || null
		};

		// for options
		if (isOptions) {
			o.upgradeNotify = config.get('upgradeNotify');
		}

		// for wasavi and options
		if (!isAgent) {
			o.exrc = config.get('exrc');
			o.messageCatalog = ext.messageCatalog;
			o.fstab = ext.fileSystem.getInfo();

			// for tests
			if (payload && isTestUrl(payload.url)) {
				if (!/\bset list\b/.test(o.exrc)) {
					o.exrc += '\nset list';
				}
				if (/[?&]nooverride\b/.test(payload.url)) {
					o.exrc += '\nset nooverride';
				}
			}
		}

		// for wasavi
		if (isInit) {
			if (payload) {
				if (!isTestUrl(payload.url) || /[?&]ros\b/.test(payload.url)) {
					o.ros = runtimeOverwriteSettings.get(
						payload.url, payload.nodePath);
				}
				if (payload.nodeName == 'BODY' && memorandum.exists(payload.url)) {
					payload.value = memorandum.get(payload.url);
				}
			}
			o.headHTML = wasaviFrameHeader;
			o.bodyHTML = wasaviFrameContent;
			o.style = wasaviFrameStyle;
			o.unicodeDictData = unicodeDictData;
			o.lineInputHistories = config.get('wasavi_lineinput_histories');
			o.registers = config.get('wasavi_registers');
		}

		// for agent and options
		else {
			o.siteOverrides = config.get('siteOverrides');
			if (!o.siteOverrides) {
				let lines = config.get('qaBlacklist');
				/*
				lines = [
					'# test data',
					'http://example.org/',
					'',
					'http://example.org/    #some-id'
				].join('\n');
				*/
				lines = lines.split('\n').map(line => {
					let l = line.replace(/^\s+|\s+$/g, '');
					if (l == '' || /^[#;]/.test(l)) return line;
					l = l.split(/\s+/);
					if (l.length == 1) {
						return line + '\t*\tblock';
					}
					else {
						return line + '\tblock';
					}
				}).join('\n');
				o.siteOverrides = lines;
			}
		}

		respond(o);
	}

	function rendererHeading (text, level) {
		return '<h' + level + '>' +
			text +
			'</h' + level + '>\n';
	}
	function rendererParagraph (text) {
		return '<div>' + text + '</div>\n';
	}
	function rendererStrong (text) {
		return '<b>' + text + '</b>';
	}
	function rendererEm (text) {
		return '<i>' + text + '</i>';
	}
	function handleTransfer (command, data, sender, respond) {
		if (data.payload.type == 'write'
		&&  'writeAs' in data.payload
		&&  data.payload.writeAs == 'html') {
			var renderer = new marked.Renderer;
			renderer.heading = rendererHeading;
			renderer.paragraph = rendererParagraph;
			renderer.strong = rendererStrong;
			renderer.em = rendererEm;

			var markupOpts = {
				renderer: renderer,
				gfm: true, tables: true, breaks: true
			};

			data.payload.value = marked(data.payload.value, markupOpts);
		}

		ext.postMessage(data.to, data.payload, res => {
			respond(res);
		});

		if (data.payload.type == 'reload') {
			chrome.runtime.reload();
		}

		return true;
	}

	function handleResetOptions (command, data, sender, respond) {
		ext.fileSystem.clearCredentials();
		contextMenu.build(true);
		config.clear();
	}

	function handleGetStorage (command, data, sender, respond) {
		if ('key' in data) {
			respond({
				key: data.key,
				value: config.get(data.key)
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
			items = [{key: data.key, value: data.value}];
		}
		else if ('items' in data) {
			items = data.items;
		}

		if (items) {
			items.forEach(function (item) {
				if (!('key' in item)) return;
				if (!('value' in item)) return;
				config.set(item.key, item.value);
			});
		}
	}

	function handlePlaySound (command, data, sender, respond) {
		ext.sound.play(data.key, {volume: data.volume});
	}

	function handleOpenOptions (command, data, sender, respond) {
		ext.openTabWithFile('options.html');
	}

	function handleSetClipboard (command, data, sender, respond) {
		if ('data' in data) {
			ext.clipboard.set(data.data);
		}
	}

	function handleGetClipboard (command, data, sender, respond) {
		respond({data: ext.clipboard.get()});
	}

	function handleSetMemorandum (command, data, sender, respond) {
		memorandum.set(data.url, data.value);
		var payload = {
			type: 'fileio-write-response',
			state: 'complete',
			meta: {
				path: '',
				bytes: data.value.length
			},
			exstate: {
				isBuffered: data.isBuffered
			}
		};
		if (data.isBuffered) {
			ext.postMessage(sender, payload);
		}
		else {
			respond(payload);
		}
	}

	function handleGetMemorandum (command, data, sender, respond) {
		var content = memorandum.get(data.url);
		response({
			type: 'fileio-read-response',
			state: 'complete',
			meta: {
				path: '',
				bytes: content.length
			},
			content: content
		});
	}

	function handlePushPayload (command, data, sender, respond) {
		payload = data;
	}

	function handleFsCtlReset (port, data) {
		ext.fileSystem.clearCredentials(data.name);
	}

	function handleFsCtlGetEntries (port, data) {
		var path = data.path || '';
		ext.fileSystem.ls(path, port.sender.tab.id, {
			onresponse: function (d) {
				port.postMessage(d);
			},
			onload: function (d) {
				port.postMessage({
					type: 'fileio-getentries-response',
					data: d.contents
				});
			},
			onerror: function (error) {
				port.postMessage({
					type: 'fileio-getentries-response',
					error: error
				});
			}
		});
	}

	function handleFsCtlChDir (port, data) {
		var path = data.path || '';
		if (path == '') {
			port.postMessage({
				type: 'fileio-chdir-response',
				data: null
			});
		}
		else {
			ext.fileSystem.ls(path, port.sender.tab.id, {
				onresponse: function (d) {
					port.postMessage(d);
				},
				onload: function (d) {
					port.postMessage({
						type: 'fileio-chdir-response',
						data: d
					});
				},
				onerror: function (error) {
					port.postMessage({
						type: 'fileio-chdir-response',
						error: error
					});
				}
			});
		}
	}

	function handleFsCtlRead (port, data) {
		var path = data.path || '';
		if (path == '') {
			port.postMessage({error: 'Path is empty'});
			return;
		}

		ext.fileSystem.read(path, port.sender.tab.id, {
			encoding: data.encoding,
			onresponse: function (d, t) {
				port.postMessage(d);
			}
		});
	}

	function handleFsCtlWrite (port, data) {
		var path = data.path || '';
		if (path == '') {
			port.postMessage({error: 'Path is empty'});
			return;
		}

		ext.fileSystem.write(path, port.sender.tab.id, data.value, {
			encoding: data.encoding,
			delaySecs: data.isBuffered ? undefined : 0,
			onresponse: function (d) {
				d.exstate = {isBuffered: data.isBuffered};
				port.postMessage(d);
			}
		});
	}

	function handleWrite (command, data, sender, respond) {
		var path = data.path || '';
		if (path == '') {
			ext.postMessage(sender, {error: 'Path is empty'});
			return;
		}

		ext.fileSystem.write(path, sender, data.value, {
			encoding: data.encoding,
			delaySecs: data.isBuffered ? undefined : 0,
			onresponse: function (d) {
				if (!d) return;

				d.exstate = {isBuffered: data.isBuffered};

				//if (d.type == 'fileio-write-response') {
				//	d.requestNumber = command.requestNumber;
				//}

				ext.postMessage(sender, d);
			}
		});
	}

	function handleQueryShortcut (command, data, sender, respond) {
		respond({result: hotkey.validateKeyCode(data.data)});
	}

	function handleTerminated (command, data, sender, respond) {
		var payload = data.payload || {};

		if ('url' in payload && 'nodePath' in payload && 'ros' in payload) {
			runtimeOverwriteSettings.set(
				payload.url,
				payload.nodePath,
				payload.ros
			);
		}
		if (payload.isTopFrame) {
			ext.closeTab(command.tabId);
		}
	}

	/** <<<2 request handler entry */

	var commandMap = {
		'init-agent':			handleInit,
		'init-options':			handleInit,
		'init':					handleInit,
		'transfer':				handleTransfer,
		'write':				handleWrite,
		'get-storage':			handleGetStorage,
		'set-storage':			handleSetStorage,
		'push-payload':			handlePushPayload,
		'play-sound':			handlePlaySound,
		'set-clipboard':		handleSetClipboard,
		'get-clipboard':		handleGetClipboard,
		'set-memorandum':		handleSetMemorandum,
		'get-memorandum':		handleGetMemorandum,
		'reset-options':		handleResetOptions,
		'open-options':			handleOpenOptions,
		'query-shortcut':		handleQueryShortcut,
		'terminated':			handleTerminated
	};
	var fsctlMap = {
		'reset':				handleFsCtlReset,
		'get-entries':			handleFsCtlGetEntries,
		'chdir':				handleFsCtlChDir,
		'read':					handleFsCtlRead,
		'write':				handleFsCtlWrite
	};

	function handleRequest (command, data, sender, respond) {

		function res (arg) {
			if (respond) {
				try {
					respond(arg);
				}
				catch (e) {}
				respond = null;
			}
		}

		try {
			var lateResponse = false;

			if (command && data) {
				var handler = commandMap[command.type];
				if (handler) {
					lateResponse = handler(command, data, sender, res);
				}
			}
		}
		finally {
			!lateResponse && res();
			return lateResponse;
		}
	}

	function handleConnect (port) {
		port.onMessage.addListener(msg => {
			switch (port.name) {
			case 'fsctl':
				msg.type in fsctlMap && fsctlMap[msg.type](port, msg);
				break;
			}
		});
		port.onDisconnect.addListener(() => {
			port = null;
		});
	}

	/** <<<2 bootstrap */

	function boot () {
		ext.receive(handleRequest);
		chrome.runtime.onConnect.addListener(handleConnect);

		initConfig(configInfo)

		.then(function () {
			return Promise.all([
				initWasaviFrame(),
				initUnicodeDictData(),
				initWasaviStyle()
			]);
		})

		.then(function () {
			if (ext.version != config.get('version')) {
				var platform = ext.kind;
				if (global.navigator) {
					if (platform == 'Opera' && global.opera) {
						platform = 'Presto Opera';
					}
					else if (platform == 'Chrome' && /\bOPR\b/.test(global.navigator.userAgent)) {
						platform = 'Opera';
					}
				}
				ext.request(
					HOME_URL,
					{
						method: 'POST',
						content: {
							currentVersion: config.get('version') || 'undefined',
							newVersion: ext.version,
							platform: platform
						}
					},
					function () {
						ext.version != TEST_VERSION && config.get('upgradeNotify') && ext.openTabWithUrl(HOME_URL);
					},
					function () {
						ext.version != TEST_VERSION && config.get('upgradeNotify') && ext.openTabWithUrl(HOME_URL);
					}
				);
				config.set('version', ext.version);
			}

			ext.isDev && ext.log(
				'!INFO: running with following filesystems:',
				ext.fileSystem.getInfo()
					.filter(function (f) {return f.enabled})
					.map(function (f) {return f.name})
					.join(', ')
			);

			isInitializing = false;
			blockedEvents.forEach(function (cb) {cb()});
			blockedEvents = null;
		},
		function (err) {
			ext.log('!ERROR: ' + err);
		});
	}

	boot();
})(this);

// vim:set ts=4 sw=4 fenc=UTF-8 ff=unix ft=javascript fdm=marker fmr=<<<,>>> fdl=2 :
