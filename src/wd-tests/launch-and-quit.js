'use strict';

const {By, Key, until} = require('selenium-webdriver');
const {it} = require('selenium-webdriver/testing');

exports.suite = (assert, wasavi, driver) => {
	it('existence', function* () {
		var wasaviFrame = yield driver.findElement(By.id('wasavi_frame'));
		assert.t(wasaviFrame);
	});

	it('app mode existence', function* () {
		var a = yield driver.findElement(By.tagName('html'));
		assert.eq('1', yield a.getAttribute('data-wasavi-present'));
	});

	it('termination', function* () {
		yield wasavi.sendNoWait(':q\n');
		var vanished = yield wasavi.waitTerminate();
		assert.t(vanished);
	});

	it('runtime override settings', function* () {
		yield wasavi.sendNoWait(':q\n');
		yield driver.sleep(1000);

		var currentUrl = yield driver.getCurrentUrl();
		yield driver.get(currentUrl + '?ros-test');

		// phase 1
		var wasaviFrame = yield wasavi.invoke();
		assert.t('cannot find wasaviFrame, phase 1', wasaviFrame);

		yield wasaviFrame.click();
		yield wasavi.sendNoWait(':set nu ai\n');
		yield driver.sleep(1000);
		yield wasavi.sendNoWait(':wq\n');
		yield driver.sleep(1000);

		// reload
		yield driver.navigate().refresh();
		yield driver.sleep(1000);

		// phase 2
		wasaviFrame = yield wasavi.invoke();
		assert.t('cannot find wasaviFrame, phase 2', wasaviFrame);

		yield wasaviFrame.click();
		yield wasavi.sendNoWait('a\t\nabc\u001b:wq\n');
		yield driver.sleep(1000);
		assert.eq('#1-1', '\t\n\tabc', yield driver.findElement(By.id('t2')).getAttribute('value'));

		yield driver.get(currentUrl);
	});

	it('runtime not override settings', function* () {
		// quit
		yield wasavi.sendNoWait(':q!\n');
		yield driver.sleep(1000);

		// navigate to new url
		var currentUrl = yield driver.getCurrentUrl();
		yield driver.get(currentUrl + '?nooverride');

		/*
		 * phase 1
		 */

		// #1-1 launch wasavi
		var wasaviFrame = yield wasavi.invoke();
		assert.t('cannot find wasaviFrame, phase 1', wasaviFrame);

		// #1-2 set option be different from its default value
		yield wasavi.send(':set nu\n');

		// #1-3 quit
		yield wasavi.sendNoWait(':q!\n');
		yield driver.sleep(1000);

		// #1-4 refresh
		yield driver.navigate().refresh();
		yield driver.sleep(1000);

		/*
		 * phase 2
		 */

		wasaviFrame = yield wasavi.invoke();
		assert.t('cannot find wasaviFrame, phase 2', wasaviFrame);

		// #2-2 query the state of number option
		// and ensure `set nu` at #1-2 is ignored
		yield wasavi.send(':set nu?\n');
		assert.eq('nonumber', wasavi.getLastMessage());

		// #2-3 quit and restore original url
		yield wasavi.sendNoWait(':q!\n');
		yield driver.sleep(1000);
		yield driver.get(currentUrl);
	});
};
