'use strict';

/*
 * requirements
 */

const webdriver = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const firefox = require('selenium-webdriver/firefox');
const opera = require('selenium-webdriver/opera');
const t = require('selenium-webdriver/testing');
const {By, Key, until, promise} = webdriver;
const clipboard = require('copy-paste');

const assert = require('assert');
const fs = require('fs');

const server = require('./server');
const reporter = require('./almost-min');

/*
 * consts
 */

const tests = [
	{name: 'launch-and-quit'},
	{name: 'filesystem'},
	{name: 'app-mode'},
	{name: 'editing'},
	{name: 'insertion'},
	{name: 'motion'},
	{name: 'undo'},
	{name: 'ex'},
	{name: 'scroll'},
	{name: 'op-change'},
	{name: 'op-delete'},
	{name: 'op-yank'},
	{name: 'op-shift'},
	{name: 'range-symbol'},
	{name: 'learning-the-vi-editor-6th'},
	{name: 'line-input'},
	{name: 'bound'},
	{name: 'surround'}
];

const debug = false;
const captureConsole = false;
const sourceDir = 'src';
const profileDir = 'src/wd-tests/profile';
const testFrameUrl = 'http://127.0.0.1:8888/test_frame.html';
const appModeTestFrameUrl = 'https://wasavi.appsweets.net/?testmode';
const testFrameShutdownUrl = 'http://127.0.0.1:8888/shutdown';
const waitMsecsForWasaviLaunch = 1000 * 20;

/*
 * variables
 */

var driver;
var wasaviAsserts;
var invokeStates;
var currentTest;

/*
 * functions
 */

function createDriver (name) {
	name || (name = process.env.NODE_TARGET_BROWSER);

	var result;
	var profilePath = fs.realpathSync(profileDir + '/' + name);

	switch (name) {
	case 'chrome':
		var loggingPrefs = new webdriver.logging.Preferences()
		loggingPrefs.setLevel(
			webdriver.logging.Type.BROWSER,
			webdriver.logging.Level.ALL);

		var options = new chrome.Options();
		options.addArguments(
			'--start-maximized',
			'--lang=en',
			'--user-data-dir=' + profilePath);
		options.setLoggingPrefs(loggingPrefs);

		result = new webdriver.Builder()
			.withCapabilities(webdriver.Capabilities.chrome())
			.setChromeOptions(options)
			.build()
		break;

	case 'firefox':
		var options = new firefox.Options();
		var profile = new firefox.Profile();
		profile.addExtension(`${sourceDir}/${name}`);
		options.setProfile(profile);
		result = new webdriver.Builder()
			.withCapabilities(webdriver.Capabilities.firefox())
			.setFirefoxOptions(options)
			.build()
		break;

	case 'opera':
		var options = new opera.Options();
		options.addArguments(
			'--start-maximized',
			'--lang=en',
			'--user-data-dir=' + profilePath);
		result = new webdriver.Builder()
			.withCapabilities(webdriver.Capabilities.opera())
			.setOperaOptions(options)
			.build()
		break;

	default:
		throw new Error('unknown browser name');
	}

	// return Promise
	return result;
}

function invokeWasavi (currentTest) {
	// return Promise
	return promise.consume(function* () {
		try {
			debug && console.log('enter invokeWasavi');

			var currentUrl = yield driver.getCurrentUrl();
			if (currentUrl.indexOf(testFrameUrl) != 0) {
				yield driver.get(testFrameUrl);
				debug && console.log(testFrameUrl + ' loaded');
			}

			debug && console.log('reading #' + currentTest.wasaviTargetID);
			var target = yield driver.findElement(By.id(currentTest.wasaviTargetID));
			var wasaviFrame;

			for (var i = 0; i < invokeStates.length; ++i) {
				if (currentTest.isSectionTest) {
					debug && console.log('reading #init-section-button');
					var sectionInitializer = yield driver.findElement(By.id('init-section-button'));
					yield sectionInitializer.click();
				}
				else {
					// call reset functionality on the test page
					debug && console.log('reading #reset-button');
					var reset = yield driver.findElement(By.id('reset-button'));
					yield reset.click();

					// if the test targets read only element, set the element that state
					debug && console.log('reading #readonly-checkbox');
					var ro = yield driver.findElement(By.id('readonly-checkbox'));
					var roChecked = yield ro.getAttribute('checked');
					if (currentTest.isReadonlyElement && roChecked == null
					||  !currentTest.isReadonlyElement && roChecked != null) {
						yield ro.click();
					}
				}

				// switch target element if needed
				debug && console.log('reading #use-div-checkbox');
				var targetSwitcher = yield driver.findElement(By.id('use-div-checkbox'));
				var useDivChecked = yield targetSwitcher.getAttribute('checked');
				if (currentTest.wasaviTargetID == 't2' && useDivChecked != null
				||  currentTest.wasaviTargetID == 't3' && useDivChecked == null) {
					yield targetSwitcher.click();
				}

				// activate target element
				debug && console.log('click the target');
				yield target.click();

				// send launch wasavi request
				switch (invokeStates[i].index) {
				case 'shortcut':
					debug && console.log('sending shortcut key');
					yield target.sendKeys(Key.chord(Key.CONTROL, Key.ENTER));
					break;

				case 'launchrequest':
					debug && console.log('sending launch request');
					var launcher = yield driver.findElement(By.id('request-launch-wasavi'));
					yield launcher.click();
					break;
				}

				// dirty hack!!
				yield driver.sleep(200);

				// wait until wasavi is launched
				debug && console.log('waiting wasavi launch');
				try {
					wasaviFrame = yield driver.wait(until.elementLocated(By.id('wasavi_frame')), waitMsecsForWasaviLaunch);

					// wasavi launched
					debug && console.log('attempting to focus');
					yield driver.executeScript([
						'document.getElementById("wasavi_frame").focus()',
						'document.getElementById("wasavi_frame").click()'
					].join(';'));

					invokeStates[i].increment();
					break;
				}
				catch (ex) {
					debug && console.log(`timed out(${ex.message}). retrying...`);
				}
			}

			invokeStates.sort((o1, o2) => o2.count - o1.count);

			debug && console.log(
				'last yield: ' +
				Object.prototype.toString.call(wasaviFrame));

			return currentTest.wasaviFrame = wasaviFrame;
		}
		catch (ex) {
			console.error('invokeWasavi: exception: ' + ex.stack);
			throw ex;
		}
	});
}

function invokeAppModeWasavi (currentTest) {
	// return Promise
	return promise.consume(function* () {
		try {
			yield driver.get(appModeTestFrameUrl);
			debug && console.log(appModeTestFrameUrl + ' loaded');

			var wasaviFrame = yield driver.wait(
				until.elementLocated(By.id('wasavi_cover')), waitMsecsForWasaviLaunch);

			if (wasaviFrame) {
				yield wasaviFrame.click();
			}

			return currentTest.wasaviFrame = wasaviFrame;
		}
		catch (ex) {
			console.error('invokeAppModeWasavi: exception: ' + ex.stack);
			throw ex;
		}
	});
}

function closeWasavi (currentTest) {
	// return Promise
	return promise.consume(function* () {
		try {
			if (!currentTest.wasaviFrame || !currentTest.wasaviController) {
				return;
			}

			if (currentTest.isAppMode) {
				yield currentTest.wasaviController.send(':set nomodified\n');
			}

			yield currentTest.wasaviController.js(
				'var wasaviFrame = document.getElementById("wasavi_frame");' +
				'wasaviFrame && wasaviFrame.parentNode.removeChild(wasaviFrame);');
		}
		catch (ex) {
			console.error('closeWasavi: exception: ' + ex.stack);
			throw ex;
		}
	});
}

/*
 * classes
 */

function InvokeState (aindex) {
	var count = 0;
	var index = aindex;
	return {
		get count () {return count},
		get index () {return index},
		increment () {++count}
	};
}

function StrokeSender (driver) {
	function setup () {
	}

	function waitCommandCompletion (inputModeOfWatchTarget) {
		let message;
		// return Promise
		return driver.wait(_ => promise.consume(function* () {
			try {
				var elm = yield driver.findElement(By.id('wasavi_frame'));
				var commandState = yield elm.getAttribute('data-wasavi-command-state');
				var inputMode = yield elm.getAttribute('data-wasavi-input-mode');

				var m = `waitCommandCompletion: commandState:${commandState} inputMode:${inputMode}`;
				if (debug && m != message) {
					console.log(message = m);
				}

				if (commandState == 'completed' && inputMode in inputModeOfWatchTarget) {
					return elm;
				}
			}
			catch (ex) {
				//console.log('StrokeSender#waitCommandCompletion: exception: ' + ex.stack);
			}
			return null;
		}));
	}

	function finish (wasaviFrame) {
		// return Promise
		return promise.consume(function* () {
			if (!wasaviFrame) {
				return;
			}

			var source = yield wasaviFrame.getAttribute('data-wasavi-state');
			try {
				return JSON.parse(source);
			}
			catch (ex) {
				return null;
			}
		});
	}

	return {
		setup,
		waitCommandCompletion,
		finish
	};
}

function AppModeStrokeSender (driver) {
	function setup () {
	}

	function waitCommandCompletion (inputModeOfWatchTarget) {
		// return Promise
		return driver.wait(_ => promise.consume(function* () {
			try {
				var elm = yield driver.findElement(By.tagName('html'));
				var commandState = yield elm.getAttribute('data-wasavi-command-state');
				var inputMode = yield elm.getAttribute('data-wasavi-input-mode');

				if (commandState == null && inputMode in inputModeOfWatchTarget) {
					return elm;
				}
			}
			catch (ex) {
				//console.log('StrokeSender#waitCommandCompletion: exception: ' + ex.stack);
			}
			return null;
		}), 1000 * 10);
	}

	function finish (wasaviFrame) {
		// return Promise
		return promise.consume(function* () {
			var elm = yield driver.findElement(By.tagName('html'));
			var source = yield elm.getAttribute('data-wasavi-state');
			try {
				return JSON.parse(source);
			}
			catch (ex) {
				return null;
			}
		});
	}

	return {
		setup,
		waitCommandCompletion,
		finish
	};
}

function WasaviAsserts () {
	var wasaviState;

	function setWasaviState (ws) {
		wasaviState = ws;
	}

	function fromCharCode (codePoints) {
		return codePoints.map(cp => String.fromCharCode(cp)).join('');
	}

	function toVisibleString (s) {
		return ('' + s)
			.replace(
				/[\u0000-\u001f]/g,
				($0) => '^' + String.fromCharCode($0.charCodeAt(0) + 64))
			.replace(
				/\u007f/g, '^_');
	}

	function dump (obj) {
		function dumpCore (obj, indent, propName, isArrayMember) {
			indent || (indent = '');

			var leader = propName ? (indent + propName + ': ') : indent;
			var postfix = isArrayMember ? ',' : '';

			switch (Object.prototype.toString.call(obj)) {
			case '[object Undefined]':
			case '[object Null]':
			case '[object Boolean]':
			case '[object Number]':
				console.log(leader + obj + postfix);
				break;
			case '[object String]':
				if (obj.length > 32) {
					console.log(leader + '"' + obj.replace(/\n/g, '\\n').substring(0, 32) + '..."' + postfix);
				}
				else {
					console.log(leader + '"' + obj.replace(/\n/g, '\\n') + '"' + postfix);
				}
				break;
			case '[object Function]':
				console.log(leader + 'function()' + postfix);
				break;
			case '[object Array]':
				console.log(leader + '[');
				for (var i = 0, goal = obj.length - 1; i <= goal; i++) {
					dumpCore(obj[i], indent + '    ', undefined, i < goal);
				}
				console.log(indent + ']' + postfix);
				break;
			case '[object Object]':
				if (dumpedObjects.has(obj)) {
					console.log(leader + '*** recursive(' + dumpedObjects.get(obj) + ') ***');
				}
				else {
					dumpedObjects.set(obj, propName || '');
					console.log(leader + '{');
					var keys = Object.keys(obj);
					for (var i = 0, goal = keys.length - 1; i <= goal; i++) {
						dumpCore(obj[keys[i]], indent + '    ', keys[i], i < goal);
					}
					console.log(indent + '}' + postfix);
				}
				break;
			}
		}

		var dumpedObjects = new WeakMap;
		dumpCore(obj);
	}

	function t (/* [message,] actual */) {
		var args = Array.prototype.slice.call(arguments);
		var message = (args.length >= 2 ? args.shift() + ': ' : '');
		var actual = args.shift();

		assert.ok(actual, message);
	}

	function f (/* [message,] actual */) {
		var args = Array.prototype.slice.call(arguments);
		var message = (args.length >= 2 ? args.shift() + ': ' : '');
		var actual = args.shift();

		assert.ok(!actual, message);
	}

	function eq (/* [message,] expected, actual */) {
		var args = Array.prototype.slice.call(arguments);
		var message = (args.length >= 3 ? args.shift() + ': ' : '');
		var expected = args.shift();
		var actual = args.shift();

		assert.equal(actual, expected, message);
	}

	function ne (/* [message,] expected, actual */) {
		var args = Array.prototype.slice.call(arguments);
		var message = (args.length >= 3 ? args.shift() + ': ' : '');
		var expected = args.shift();
		var actual = args.shift();

		assert.notEqual(actual, expected, message);
	}

	function pos (/* [message,] expectedRow, expectedCol */) {
		var args = Array.prototype.slice.call(arguments);
		var message = (args.length >= 3 ? args.shift() + ': ' : '');
		var row = args.shift();
		var col = args.shift();
		var actualRow = wasaviState.row - 0;
		var actualCol = wasaviState.col - 0;

		message +=
			'position unmatch.\n' +
			'expected:[' + row + ', ' + col + '] ' +
			'but was:[' + actualRow + ', ' + actualCol + ']\n' +
			wasaviState.value;
		assert.ok(row == actualRow && col == actualCol, message);
	}

	function value (/* [message,] expected */) {
		var args = Array.prototype.slice.call(arguments);
		var message = (args.length >= 2 ? args.shift() + ': ' : '');
		var expected = args.shift();
		var actual = wasaviState.value;

		assert.equal(actual, expected, message);
	}

	return {
		setWasaviState, fromCharCode, toVisibleString, dump,
		t, f, eq, ne, pos, value,

		shortcuts: {
			ctrln: '\u000e',	//Key.chord(Key.CONTROL, 'n')
			ctrlt: '\u0014',	//Key.chord(Key.CONTROL, 't')
			ctrlw: '\u0017'		//Key.chord(Key.CONTROL, 'w')
		}
	};
}

function WasaviController (driver, currentTest) {
	const inputModeOfWacthTargetDefault = {
		'command': true,
		'backlog_prompt': true,
		'ex_s_prompt': true
	};

	var wasaviState = null;
	var strokeSender = null;
	var inputModeOfWatchTarget = inputModeOfWacthTargetDefault;

	function initStrokeSender () {
		strokeSender = currentTest.isAppMode ?
			new AppModeStrokeSender(driver) :
			new StrokeSender(driver);
	}

	function getInt (name, defaultValue) {
		if (!wasaviState) {
			throw new Error('getInt: wasaviState is unavailable');
		}
		if (!(name in wasaviState)) {
			throw new Error('getInt: "' + name + '" is not in wasaviState ' + JSON.stringify(wasaviState));
		}
		return wasaviState[name] - 0 || 0;
	}

	function getString (name, defaultValue) {
		if (!wasaviState) {
			throw new Error('getString: wasaviState is unavailable');
		}
		if (!(name in wasaviState)) {
			throw new Error('getString: "' + name + '" is not in wasaviState ' + JSON.stringify(wasaviState));
		}
		return '' + (wasaviState[name] || '');
	}

	/*
	 * public methods
	 */

	function invoke () {
		return currentTest.isAppMode ?
			invokeAppModeWasavi(currentTest) :
			invokeWasavi(currentTest);
	}

	function send (s) {
		// return Promise
		if (typeof s == 'function') {
			return sendCallback(s);
		}
		else {
			return sendString(Array.prototype.slice.call(arguments).join(''));
		}
	}

	function sendString (s) {
		initStrokeSender();
		strokeSender.setup();

		// return Promise
		return currentTest.wasaviFrame.sendKeys(s)
			.then(_ => {
				return strokeSender.waitCommandCompletion(inputModeOfWatchTarget);
			})
			.then(elm => {
				inputModeOfWatchTarget = inputModeOfWacthTargetDefault;
				return strokeSender.finish(elm);
			})
			.then(ws => {
				wasaviState = ws;
				wasaviAsserts.setWasaviState(ws);
			})
			.catch(err => {console.error(err + '\n' + err.stack); throw err});
	}

	function sendCallback (callback) {
		initStrokeSender();
		strokeSender.setup();

		var act = driver.actions();

		callback(act);

		// return Promise
		return act.perform()
			.then(_ => {
				return strokeSender.waitCommandCompletion(inputModeOfWatchTarget);
			})
			.then(elm => {
				inputModeOfWatchTarget = inputModeOfWacthTargetDefault;
				return strokeSender.finish(elm);
			})
			.then(ws => {
				wasaviState = ws;
				wasaviAsserts.setWasaviState(ws);
			})
			.catch(err => {console.error(err + '\n' + err.stack); throw err});
	}

	function waitCommandCompletion () {
		initStrokeSender();
		strokeSender.setup();

		// return Promise
		return strokeSender.waitCommandCompletion(inputModeOfWatchTarget)
			.then(elm => {
				inputModeOfWatchTarget = inputModeOfWacthTargetDefault;
				return strokeSender.finish(elm);
			})
			.then(ws => {
				wasaviState = ws;
				wasaviAsserts.setWasaviState(ws);
			})
			.catch(err => {console.error(err + '\n' + err.stack); throw err});
	}

	function waitTerminate () {
		// return Promise
		return driver.findElements(By.id('wasavi_frame'))
			.then(wasaviFrame => {
				if (wasaviFrame.length) {
					return driver.wait(until.stalenessOf(wasaviFrame[0]));
				}
				else {
					return true;
				}
			})
			.catch(err => {console.error(err + '\n' + err.stack); throw err});
	}

	function sendNoWait (stroke) {
		// return Promise
		return currentTest.wasaviFrame.sendKeys(stroke);
	}

	function sendTestInfo () {
		// return Promise
		return js(
			'var h1 = document.querySelector("h1");' +
			'if (!h1) return;' +
			`h1.textContent = "#${currentTest.index} of ${currentTest.totalCount}: ${currentTest.title}";`);
	}

	function setInputModeOfWatchTarget () {
		inputModeOfWatchTarget = {};
		Array.prototype.slice.call(arguments).forEach(mode => {
			switch (mode) {
			case 'command':
			case 'edit':
			case 'overwrite':
			case 'line_input':
			case 'backlog_prompt':
			case 'ex_s_prompt':
			case 'write handler':
			case 'bound':
			case 'bound_line':
				inputModeOfWatchTarget[mode] = true;
				break;
			}
		});
	}

	function js () {
		// return Promise
		return driver.executeScript.apply(driver, arguments);
	}

	function log (text) {
		// return Promise
		return js(
			'var t = document.getElementById("test-log");' +
			'if (!t) return;' +
			't.value += "\\n" + Array.prototype.slice.call(arguments).join("\\t");' +
			't.scrollTop = t.scrollHeight - t.clientHeight;',
			text);
	}

	function makeScrollableBuffer (factor) {
		factor || (factor = 1);
		var lines;
		// return Promise
		return send('h')
			.then(_ => {
				lines = getInt('lines');
				var actualLines = Math.floor(lines * factor);
				return send(`iline\u001byy${actualLines-1}p`);
			})
			.then(_ => lines);
	}

	function setClipboardText (s) {
		// return Promise
		return new promise.Promise((resolve, reject) => {
			clipboard.copy(s, (err, text) => {
				try {
					if (err instanceof Error) {
						reject(err);
					}
					else {
						resolve(text);
					}
				}
				catch (ex) {
					console.error(ex.stack);
					reject(ex);
				}
			});
		});
	}

	function getClipboardText () {
		// return Promise
		return new promise.Promise((resolve, reject) => {
			clipboard.paste((err, text) => {
				try {
					if (err instanceof Error) {
						reject(err);
					}
					else {
						resolve(text);
					}
				}
				catch (ex) {
					console.error(ex.stack);
					reject(ex);
				}
			});
		});
	}

	return {
		getState () {
			return getString('state');
		},
		getValue () {
			return getString('value');
		},
		getLastMessage () {
			return getString('lastMessage');
		},
		getLastSimpleCommand () {
			return getString('lastSimpleCommand');
		},
		getInputMode () {
			return getString('inputMode');
		},
		getLines () {
			return getInt('lines');
		},
		getRowLength () {
			return getInt('rowLength');
		},
		getRow () {
			return getInt('row');
		},
		getCol () {
			return getInt('col');
		},
		getTopRow () {
			return getInt('topRow');
		},
		getTopCol () {
			return getInt('topCol');
		},
		getLineInput () {
			return getString('lineInput');
		},
		getRegister (name) {
			for (var i in wasaviState.registers) {
				var item = wasaviState.registers[i];
				if (name == item.name) {
					return item.data;
				}
			}
			return '';
		},
		getMark (name) {
			var result = null;
			if (name in wasaviState.marks) {
				var mark = wasaviState.marks[name];
				result = [mark.row, mark.col];
			}
			return result;
		},
		getAppModeStatusLine () {
			// return Promise
			return driver.findElements(By.id('wasavi_footer_file_indicator'))
				.then(elm => {
					return elm.length ?
						elm[0].getText() :
						'***Exception in getAppModeStatusLine***';
				})
				.catch(err => {console.error(err + '\n' + err.stack); throw err});
		},

		get targetId () {
			return currentTest.wasaviTargetID;
		},

		invoke,
		send, sendNoWait, sendCallback, sendTestInfo,
		waitCommandCompletion, waitTerminate,
		setInputModeOfWatchTarget,
		js, log,
		makeScrollableBuffer,
		getClipboardText, setClipboardText
	};
}

function WasaviTest (suiteName, options) {
	options || (options = {only: false, skip: false});
	var suiteNameForDisplay = suiteName.replace(/[-_]/g, ' ');
	var testCount = 0;

	/*
	 * suite event (from almost-min reporter)
	 */

	function suiteEvent (suite, totalCount) {
		currentTest.totalCount = totalCount;
	}

	/*
	 * before hook
	 */

	function before (done) {
		this.timeout(1000 * 60);

		// return Promise
		return promise.consume(function* () {
			try {
				debug && console.log(suiteName + '.before');

				if (!driver) {
					driver = yield createDriver();
					debug && console.log(
						suiteName + '.before: driver created ' +
						Object.prototype.toString.call(driver));
				}

				done();
			}
			catch (ex) {
				console.error(`${suiteName}.before: exception: ${ex}\n${ex.stack}`);
				done(ex);
			}
		});
	}

	/*
	 * test event (from almost-min reporter)
	 */

	function testEvent (test) {
		currentTest.title = test.parent.title + ' -- ' + test.title;
	}

	/*
	 * beforeEach hook
	 */

	function beforeEach (done) {
		// return Promise
		return promise.consume(function* () {
			try {
				currentTest.index++;

				var title = currentTest.title;
				var s = title + ' ' + suiteNameForDisplay;
				debug && console.log(suiteName + '.beforeEach: testing that ' + title);

				currentTest.isSectionTest = /\b(?:sentence|paragraph|section)\b/i.test(s);
				currentTest.isAppMode = /\bapp\s*mode\b/i.test(s);
				currentTest.isReadonlyElement = /\breadonly\s*element\b/i.test(s);
				currentTest.wasaviTargetID = /\bcontent\s*editable\b/i.test(s) ? 't3' : 't2';
				currentTest.wasaviController = new WasaviController(driver, currentTest);

				yield currentTest.wasaviController.invoke();
				yield currentTest.wasaviController.sendTestInfo();

				done();
			}
			catch (ex) {
				console.error(`${suiteName}.beforeEach: exception: ${ex}\n${ex.stack}`);
				done(ex);
			}
		});
	}

	/*
	 * afterEach hook
	 */

	function afterEach (done) {
		debug && console.log(suiteName + '.afterEach');
		return closeWasavi(currentTest)
			.then(_ => {
				currentTest.wasaviFrame = null;
				currentTest.wasaviController = null;

				if (captureConsole) {
					return driver.manage().logs().get(webdriver.logging.Type.BROWSER)
					.then(log => {
						if (log && log.length) {
							log.forEach(entry => {
								var m = entry.message;
								var index = m.indexOf('"');
								if (index < 0) return;

								m = m.substring(index + 1);

								if (m.substr(-1) == '"') {
									m = m.substring(0, m.length - 1);
								}

								m = m.replace(/\\n/g, '\n')
									.replace(/\\"/g, '"');

								console.log(m);
							});
						}
					});
				}
			})
			.then(_ => {
				done();
			})
			.catch(ex => {
				console.error(`${suiteName}.afterEach: exception: ${ex}\n${ex.stack}`);
				done(ex);
			});
	}

	/*
	 * after hook
	 */

	function after (done) {
		try {
			debug && console.log(suiteName + '.after');
			reporter.events.removeListener('suite', suiteEvent);
			reporter.events.removeListener('test', testEvent);
			done();
		}
		catch (ex) {
			console.error(`${suiteName}.after: exception: ${ex}\n${ex.stack}`);
			done(ex);
		}
	}

	/*
	 * register all tests
	 */

	t.describe(suiteNameForDisplay, _ => {
		reporter.events.on('suite', suiteEvent);
		t.before(before);
		reporter.events.on('test', testEvent);
		t.beforeEach(beforeEach);

		try {
			require('./' + suiteName).suite(
				wasaviAsserts,
				new Proxy({}, {
					get: function (target, prop) {
						return currentTest.wasaviController[prop];
					}
				}),
				new Proxy({}, {
					get: function (target, prop) {
						return driver[prop];
					}
				}));
		}
		catch (ex) {
			console.error(`${suiteName}.tests: exception: ${ex}\n${ex.stack}`);
			throw ex;
		}

		t.afterEach(afterEach);
		t.after(after);
	});
}

/*
 * bootstrap
 */

t.describe('', _ => {
	wasaviAsserts = new WasaviAsserts;
	invokeStates = [
		new InvokeState('shortcut'),
		new InvokeState('launchrequest')
	];
	currentTest = {
		totalCount: -1,
		index: 0,
		title: '',
		wasaviTargetID: '',
		wasaviFrame: null,
		wasaviController: null,
		isSectionTest: false,
		isAppMode: false,
		isReadonlyElement: false
	};

	t.before(done => {
		console.log();

		server.start('www', 8888, {silent: !debug, noexit: true});
		done();
	});

	var onlySpecified = tests.filter(t => t.only);
	(onlySpecified.length ? onlySpecified : tests).forEach(t => new WasaviTest(t.name, t));

	t.after(done => {
		if (driver) {
			debug && console.log('shutting down www server...');
			driver
				.get(testFrameShutdownUrl)
				.then(_ => {
					debug && console.log('terminating webdriver session...');
					driver.quit();
					driver = null;
					done();
				})
				.catch(err => {console.error(err + '\n' + err.stack); throw err});
		}
	});
});
