'use strict';

const {By, Key, until, promise} = require('selenium-webdriver');
const {it, describe} = require('selenium-webdriver/testing');

exports.suite = (assert, wasavi, driver) => {
	const {ctrln, ctrlt, ctrlw} = assert.shortcuts;

	/*
	 * for testing, each cloud storage must have following files:
	 *
	 *    /hello-world.txt
	 *    /test
	 *        read test.txt  (content: 'hello,\nworld')
	 *        write test.txt
	 */

	function* completeRootPath () {
		var args = Array.prototype.slice.call(arguments);

		for (var i = 0; i < args.length; i += 4) {
			var testLabel = args[i + 0];
			var fs = args[i + 1];
			var prefix = args[i + 2];
			var makeDefault = args[i + 3];

			if (makeDefault) {
				yield wasavi.send(':files default ' + fs + '\n');
			}

			yield wasavi.setInputModeOfWatchTarget('line_input');

			if (makeDefault) {
				yield wasavi.send(':r ' + prefix + '\t');
			}
			else {
				yield wasavi.send(':r ' + fs + ':' + prefix + '\t');
			}

			var line = wasavi.getLineInput();
			yield wasavi.send('\u001b');

			console.log(
				`completeRootPath: label:${testLabel} fs:${fs} prefix:${prefix} makeDefault:${makeDefault} line:${line}`);

			if (makeDefault) {
				assert.t(testLabel, (new RegExp(`^r ${prefix}.+$`)).test(line));
			}
			else {
				assert.t(testLabel, (new RegExp(`^r ${fs}:${prefix}.+$`)).test(line));
			}
		}
	}

	function* completeSubPath () {
		var args = Array.prototype.slice.call(arguments);

		for (var i = 0; i < args.length; i += 3) {
			var testLabel = args[i + 0];
			var fs = args[i + 1];
			var makeDefault = args[i + 2];

			if (makeDefault) {
				yield wasavi.send(':files default ' + fs + '\n');
			}

			wasavi.setInputModeOfWatchTarget('line_input');

			if (makeDefault) {
				yield wasavi.send(':r /test\t');
			}
			else {
				yield wasavi.send(':r ' + fs + ':' + '/test\t');
			}

			var line = wasavi.getLineInput();
			yield wasavi.send('\u001b');

			yield wasavi.log(
				`completeRootPath: label:${testLabel} fs:${fs} makeDefault:${makeDefault} line:${line}`);

			if (makeDefault) {
				assert.t(testLabel, /^r \/test.+$/.test(line));
			}
			else {
				assert.t(testLabel, (new RegExp(`^r ${fs}:/test.+$`)).test(line));
			}
		}
	}

	function* read (fs) {
		yield wasavi.send(':0r ' + fs + ':/test/read\\ test.txt\n', 'gg');
		assert.eq('#1-1', 'hello,\nworld', wasavi.getValue());
	}

	function* write (fs) {
		var n = Math.floor(Math.random() * 1000);
		yield wasavi.send(':files default ' + fs + '\n');
		yield wasavi.send(`ggawrite test:${n}\nwrite test\u001b`);
		wasavi.setInputModeOfWatchTarget('write handler');
		yield wasavi.send(':w /test/write\\ test.txt\n');
		yield wasavi.send(':r /test/write\\ test.txt\n');
		assert.eq(
			'#1-1',
			`write test:${n}\nwrite test\nwrite test:${n}\nwrite test`,
			wasavi.getValue());
	}

	it('file system command_default', function* () {
		yield wasavi.send(':files default\n');
		assert.t('#1-1', /^default file system: .+$/.test(wasavi.getLastMessage()));
	});

	// dropbox
	
	it('complete root path dropbox', function* () {
		promise.consume(completeRootPath, null,
			// drive name ommited, no-prefix
			'#1-1', 'dropbox', '', true,
			// drive name ommited, relative path prefixed
			'#1-2', 'dropbox', 'hello', true,
			// drive name ommited, absolute path prefixed
			'#1-3', 'dropbox', '/hello', true,

			// drive name specified, no-prefix
			'#2-1', 'dropbox', '', false,
			// drive name specified, relative path prefixed
			'#2-2', 'dropbox', 'hello', false,
			// drive name specified, absolute path prefixed
			'#2-3', 'dropbox', '/hello', false
		);
	});

	it('complete sub path dropbox', function* () {
		promise.consume(completeSubPath, null,
			'#1', 'dropbox', true,
			'#2', 'dropbox', false
		);
	});

	it('read dropbox', function* () {
		promise.consume(read, null, 'dropbox');
	});

	it('write dropbox', function* () {
		this.timeout(1000 * 60);
		promise.consume(write, null, 'dropbox');
	});

	// google drive

	it('complete root path gDrive', function* () {
		promise.consume(completeRootPath, null,
			'#1-1', 'gdrive', '', true,
			'#1-2', 'gdrive', 'hello', true,
			'#1-3', 'gdrive', '/hello', true,

			'#2-1', 'gdrive', '', false,
			'#2-2', 'gdrive', 'hello', false,
			'#2-3', 'gdrive', '/hello', false
		);
	});

	it('complete sub path gDrive', function* () {
		promise.consume(completeSubPath, null,
			'#1', 'gdrive', true,
			'#2', 'gdrive', false
		);
	});

	it('read gDrive', function* () {
		promise.consume(read, null, 'gdrive');
	});

	it('write gDrive', function* () {
		this.timeout(1000 * 60);
		promise.consume(write, null, 'gdrive');
	});
};

