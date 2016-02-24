/**
 * wasavi: vi clone implemented in javascript
 *
 * @author akahuku@gmail.com
 */
/**
 * Copyright 2012-2016 akahuku, akahuku@gmail.com
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
	var APP_MODE_URL_SECURE = 'https://ss1.xrea.com/wasavi.appsweets.net/';
	var HOME_URL = 'http://appsweets.net/wasavi/';
	var TEST_VERSION = '0.0.1';
	var STORAGE_UPDATE_BROADCAST_DELAY_SECS = 1000 * 3;

	/* <<<1 variables */

	/*
	 * wasaviFrameSource is a special url of iframe source,
	 * which is used on Firefox.
	 *
	 * Other platforms, iframe sources are as follows:
	 *
	 * chrome:  literal "chrome-extension://.../wasavi_frame.html"
	 * opera:   literal "http://wasavi.appsweets.net/" or
	 *          literal "https://ss1.xrea.com/wasavi.appsweets.net"
	 */
	var wasaviFrameSource = 'about:blank?wasavi-frame-source';

	/*
	 * wasaviFrameHeader is content of head in wasavi frame.
	 * Only Presto Opera and Firefox uses this.
	 */
	var wasaviFrameHeader;

	/*
	 * wasaviFrameContent is content of body in wasavi frame.
	 * Only Presto Opera and Firefox uses this.
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
	var sounds;
	var soundVolume;

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
		},

		/*
		 * NOTE: The referencing way of key-hook script is
		 * different for every browser:
		 *
		 *   chrome:  scripts/page_context.js, referenced via
		 *            chrome.runtime.getURL()
		 *
		 *   opera:   scripts/page_context.js, referenced via
		 *            widget.preferences['pageContextScript']
		 *
		 *   firefox: data/scripts/page_context.js,
		 *            pageContextScript property of following object
		 */
		contentScriptOptions: getContentScriptOptions(),

		/*
		 * NOTE: The place which lists the front-end scripts is
		 * different for every browser:
		 *
		 *   chrome:  manifest.json (app mode),
		 *            wasavi.html (textarea mode)
		 *
		 *   opera:   a meta block in the each front-end script
		 *
		 *   firefox: following object
		 */
		contentScripts: getContentScriptsSpec()
	});
	var runtimeOverwriteSettings = require('./RuntimeOverwriteSettings').RuntimeOverwriteSettings();
	var hotkey = require('./kosian/Hotkey').Hotkey(true);
	var contextMenu = require('./ContextMenu').ContextMenu();
	var memorandum = require('./Memorandum').Memorandum();

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
			logMode: {
				def: false,
				set: function (value) {
					ext.setLogMode(value);
					return value;
				},
				setOnInit: true
			},
			sounds: {
				def: {
					launch: true,
					beep: true
				},
				set: function (value) {
					sounds = value;
					return value;
				},
				setOnInit: true
			},
			soundVolume: {
				def: 25,
				set: function (value) {
					return soundVolume = Math.max(0, Math.min(value, 100));
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
		Object.defineProperty(this, 'info', {value: info});
		this.opts_ = opts || {};
		this.init();
	}

	Config.prototype = {
		init: function (emitUpdateEvent) {
			var updateHandler = this.opts_.onupdate;
			if (!emitUpdateEvent) {
				this.opts_.onupdate = null;
			}
			['sync', 'local'].forEach(function (storage) {
				for (var key in this.info[storage]) {
					var item = this.info[storage][key];
					var defaultValue = this.getDefaultValue(key);
					var currentValue = this.get(key);

					if (currentValue === undefined) {
						this.set(key, defaultValue);
						continue;
					}

					var defaultType = ext.utils.objectType(defaultValue);
					var currentType = ext.utils.objectType(currentValue);

					if (defaultType != currentType) {
						this.set(key, defaultValue);
						continue;
					}

					if (defaultType != 'Object') {
						if (item.setOnInit && item.set) {
							item.set.call(this, currentValue);
						}
						continue;
					}

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

					this.set(key, currentValue);
				}
			}, this);
			this.opts_.onupdate = updateHandler;
		},
		getInfo: function (name) {
			return this.info.sync[name] || this.info.local[name];
		},
		getDefaultValue: function (name) {
			var info = this.getInfo(name);
			if (!info) return undefined;
			if (typeof info.def == 'function') {
				return info.def.call(this);
			}
			return info.def;
		},
		get: function (name) {
			var info = this.getInfo(name);
			if (!info) return undefined;
			var result = ext.storage.getItem(name);
			if (info.get) {
				result = info.get.call(this, result);
			}
			return result;
		},
		set: function (name, value) {
			var info = this.getInfo(name);
			if (!info) return;
			if (info.set) {
				value = info.set.call(this, value);
			}
			ext.storage.setItem(name, value);
			if (this.opts_.onupdate) {
				this.opts_.onupdate.call(this, name, value);
			}
		},
		clear: function () {
			var storages = Array.prototype.slice.call(arguments);
			if (storages.length == 0) {
				storages.push('sync', 'local');
			}
			storages.forEach(function (storage) {
				if (!(storage in this.info)) return;
				for (var key in this.info[storage]) {
					ext.storage.setItem(key, undefined);
				}
			}, this);
		}
	};

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

	function playSound (key) {
		if (key in sounds && sounds[key]) {
			ext.sound.play(key, {volume: soundVolume});
		}
	}

	function isTestUrl (url) {
		if (TEST_MODE_URL.test(url)) return true;
		if ((url.indexOf(APP_MODE_URL) === 0 || url.indexOf(APP_MODE_URL_SECURE) === 0) && /[?&]testmode/.test(url)) return true;
		return false;
	}

	/** <<<2 returns frontend script list for firefox */

	function getContentScriptOptions () {
		var self = require('sdk/self');
		if (!self) return null;

		var base64 = require('sdk/base64');

		return {
			pageContextScript: 'data:text/javascript;base64,' +
				base64.encode(
					getShrinkedCode(
						self.data.load('scripts/page_context.js'))),
			wasaviFrameSource: wasaviFrameSource,
			wasaviOptionsUrl: self.data.url('options.html')
		};
	}

	function getContentScriptsSpec () {
		var self = require('sdk/self');
		if (!self) return null;

		return [
			{
				name: 'agent',
				matches: [
					'http://*',
					'https://*'
				],
				exclude_matches: [
					APP_MODE_URL, APP_MODE_URL + '?testmode',
					APP_MODE_URL_SECURE,
					self.data.url('options.html') + '*',
					wasaviFrameSource
				],
				js: [
					'frontend/extension_wrapper.js',
					'frontend/agent.js'
				],
				run_at: 'start'
			},
			{
				name: 'wasavi',
				matches: [
					APP_MODE_URL, APP_MODE_URL + '?testmode',
					APP_MODE_URL_SECURE,
					wasaviFrameSource
				],
				js: [
					'frontend/extension_wrapper.js',
					'frontend/init.js',
					'frontend/utils.js',
					'frontend/unistring.js',
					'frontend/unicode_utils.js',
					'frontend/qeema.js',
					'frontend/classes.js',
					'frontend/classes_ex.js',
					'frontend/classes_undo.js',
					'frontend/classes_subst.js',
					'frontend/classes_search.js',
					'frontend/classes_ui.js',
					'frontend/wasavi.js'
				],
				run_at: 'start'
			},
			{
				name: 'options',
				matches: [
					self.data.url('options.html') + '*'
				],
				js: [
					'frontend/extension_wrapper.js',
					'frontend/agent.js',
					'scripts/options-core.js'
				],
				run_at: 'start'
			}
		];
	}

	/** <<<2 async initializer: init the config object */

	function initConfig (configInfo) {
		return new Promise(function (resolve, reject) {
			function handleStorageUpdate (key, value) {
				var that = this;
				this._updates[key] = value;
				this._timer && ext.utils.clearTimeout(this._timer);
				this._timer = ext.utils.setTimeout(function () {
					ext.broadcast({
						type: 'update-storage',
						items: that._updates
					});

					var syncUpdates = {};
					for (var i in that.info.sync) {
						if (i in that._updates) {
							syncUpdates[i] = that._updates[i];
						}
					}
					that._syncStorage.set(syncUpdates);

					that._timer = null;
					that._updates = {};
					that = null;
				}, STORAGE_UPDATE_BROADCAST_DELAY_SECS);
			}
			function handleGetSyncStorage (items) {
				if (config) {
					config.clear('sync');
					for (var i in items) {
						ext.storage.setItem(i, items[i]);
					}
					config.init(true);
				}
				else {
					for (var i in items) {
						ext.storage.setItem(i, items[i]);
					}
					config = new Config(configInfo, {onupdate: handleStorageUpdate});
					config._updates = {};
					config._timer = null;
					config._syncStorage = syncStorage;
				}
			}

			var syncStorage = require('./SyncStorage').SyncStorage({
				onSignInChanged: function () {
					if (!config || !config._syncStorage) return;
					config._syncStorage.get(
						Object.keys(config.info.sync), handleGetSyncStorage);
				}
			});

			syncStorage.get(Object.keys(configInfo.sync), function (items) {
				handleGetSyncStorage(items);
				syncStorage = null;
				resolve();
			});
		});
	}

	/** <<<2 async initializer: init the content of wasavi frame */

	function initWasaviFrame () {
		return new Promise(function (resolve, reject) {
			ext.resource('mock.html', function (data) {
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
			o.sounds = config.get('sounds');
			o.soundVolume = config.get('soundVolume');
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
			o.qaBlacklist = config.get('qaBlacklist');
		}

		respond(o);
	}

	function handleTransfer (command, data, sender, respond) {
		ext.postMessage(data.to, data.payload);
	}

	function handleResetOptions (command, data, sender, respond) {
		config.clear();
		config._syncStorage.clear();
		ext.fileSystem.clearCredentials();
		contextMenu.build(true);
		config.init(true);
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
		playSound(data.key);
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
		ext.postMessage(sender, {
			type: 'fileio-write-response',
			internalId: command.internalId,
			requestNumber: command.requestNumber,
			state: 'complete',
			meta: {
				path: '',
				bytes: data.value.length
			},
			exstate: {
				isBuffered: data.isBuffered
			}
		});
	}

	function handleGetMemorandum (command, data, sender, respond) {
		var content = memorandum.get(data.url);
		ext.postMessage(sender, {
			type: 'fileio-read-response',
			internalId: command.internalId,
			requestNumber: command.requestNumber,
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
		playSound('launch');
	}

	function handleFsCtlReset (command, data, sender, respond) {
		ext.fileSystem.clearCredentials(data.name);
	}

	function handleFsCtlGetEntries (command, data, sender, respond) {
		var path = data.path || '';
		ext.fileSystem.ls(
			path, sender,
			{
				onload: function (data) {
					respond({data: data.contents});
				},
				onerror: function (error) {
					respond({data: null});
				}
			}
		);
		return true;
	}

	function handleFsCtlChDir (command, data, sender, respond) {
		var path = data.path || '';
		if (path == '') {
			ext.postMessage(sender, {
				type: 'fileio-chdir-response',
				internalId: command.internalId,
				requestNumber: command.requestNumber,
				data: null
			});
		}
		else {
			ext.fileSystem.ls(
				path, sender,
				{
					onload: function (data) {
						ext.postMessage(sender, {
							type: 'fileio-chdir-response',
							internalId: command.internalId,
							requestNumber: command.requestNumber,
							data: data
						});
					},
					onerror: function (error) {
						ext.postMessage(sender, {
							type: 'fileio-chdir-response',
							internalId: command.internalId,
							requestNumber: command.requestNumber,
							error: error
						});
					}
				}
			);
		}
	}

	function handleFsCtlRead (command, data, sender, respond) {
		var path = data.path || '';
		if (path == '') return;

		ext.fileSystem.read(
			path, sender,
			{
				encoding: data.encoding,
				onresponse: function (d, t) {
					if (!d) return;

					d.internalId = command.internalId;

					if (d.type == 'fileio-read-response') {
						d.requestNumber = command.requestNumber;
					}

					ext.postMessage(sender, d);
				}
			}
		);
	}

	function handleFsCtlWrite (command, data, sender, respond) {
		var path = data.path || '';
		if (path == '') return;

		ext.fileSystem.write(
			path, sender, data.value,
			{
				encoding: data.encoding,
				delaySecs: data.isBuffered ? undefined : 0,
				onresponse: function (d) {
					if (!d) return;

					d.internalId = command.internalId;
					d.exstate = {
						isBuffered: data.isBuffered
					};

					if (d.type == 'fileio-write-response') {
						d.requestNumber = command.requestNumber;
					}

					ext.postMessage(sender, d);
				}
			}
		);
	}

	function handleFsCtl (command, data, sender, respond) {
		return data.subtype in fsctlMap ?
			fsctlMap[data.subtype].apply(null, arguments) :
			false;
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

	function handleDumpInternalIds (command, data, sender, respond) {
		if (!ext.logMode) return;
		var log =  ext.dumpInternalIds();
		log.push(
			'',
			'sender id: #' + sender,
			'  command: ' + JSON.stringify(command),
			'     data: ' + JSON.stringify(data));
		respond({log: log.join('\n')});
	}

	/** <<<2 request handler entry */

	var commandMap = {
		'init-agent':			handleInit,
		'init-options':			handleInit,
		'init':					handleInit,
		'transfer':				handleTransfer,
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
		'fsctl':				handleFsCtl,
		'query-shortcut':		handleQueryShortcut,
		'terminated':			handleTerminated,
		'dump-internal-ids':	handleDumpInternalIds
	};
	var fsctlMap = {
		'reset':				handleFsCtlReset,
		'get-entries':			handleFsCtlGetEntries ,
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

	/** <<<2 bootstrap */

	function pre () {
		// platform depends tweaks
		switch (ext.kind) {
		case 'Opera':
			ext.resource('scripts/page_context.js', function (data) {
				widget.preferences['pageContextScript'] =
					'data:text/javascript;base64,' +
					btoa(getShrinkedCode(data));
			}, {noCache: true, sync: true});
			break;
		}
	}

	function boot () {
		ext.receive(handleRequest);

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
						config.get('upgradeNotify') && ext.openTabWithUrl(HOME_URL);
					},
					function () {
						config.get('upgradeNotify') && ext.openTabWithUrl(HOME_URL);
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

	pre();
	boot();
})(this);

// vim:set ts=4 sw=4 fenc=UTF-8 ff=unix ft=javascript fdm=marker fmr=<<<,>>> :
