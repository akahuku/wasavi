'use strict';

const {By, Key, until} = require('selenium-webdriver');
const {it} = require('selenium-webdriver/testing');

exports.suite = (assert, wasavi, driver) => {
	it('file', function* () {
		yield wasavi.send('i!\u001b:file\n');
		assert.eq('#1-1', '*Untitled* [unix, modified] line 1 of 1 (0%)', yield wasavi.getAppModeStatusLine());
	});

	it('file for rename', function* () {
		yield wasavi.send(':cd foo/bar|file ../baz/test.txt\n');
		assert.eq('#1-1', 'dropbox:/foo/baz/test.txt [unix] --No lines in buffer--', yield wasavi.getAppModeStatusLine());
		yield wasavi.send('\u001b');
		assert.eq('#1-2', '/foo/baz/test.txt', yield wasavi.getAppModeStatusLine());
		yield wasavi.send(':cd /\n');
		assert.eq('#1-3', 'foo/baz/test.txt', yield wasavi.getAppModeStatusLine());

		yield wasavi.send(':cd foo|file\n');
		assert.eq('#2-1', 'dropbox:/foo/baz/test.txt [unix] --No lines in buffer--', yield wasavi.getAppModeStatusLine());
		yield wasavi.send('\u001b');
		assert.eq('#2-2', 'baz/test.txt', yield wasavi.getAppModeStatusLine());
	});

	it('write new file', function* () {
		yield wasavi.send(':write\n');
		assert.eq('#1-1', 'write: No file name.', yield wasavi.getAppModeStatusLine());
	});

	it('read 404', function* () {
		yield wasavi.send(':r noexist.txt\n');
		assert.eq('#1-1', 'read: Cannot open "/noexist.txt".', yield wasavi.getAppModeStatusLine());
	});

	it('chdir', function* () {
		yield wasavi.send(':chdir wasavi-test|file\n');
		yield wasavi.send(':pwd\n');
		assert.eq('#1-1', 'dropbox:/wasavi-test', yield wasavi.getAppModeStatusLine());
	});

	it('chdir 404', function* () {
		yield wasavi.send(':chdir noexist|file\n');
		assert.eq('#1-1', 'chdir: Invalid path.', yield wasavi.getAppModeStatusLine());
	});

	it('chdir noarg', function* () {
		yield wasavi.send(':chdir\n');
		assert.eq('#1-1', 'dropbox:/', yield wasavi.getAppModeStatusLine());
	});
};
