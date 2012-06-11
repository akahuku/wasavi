/**
 * wasavi: vi clone implemented in javascript
 * =============================================================================
 *
 *
 * @author akahuku@gmail.com
 * @version $Id: basics.js 132 2012-06-05 15:44:16Z akahuku $
 */

/**
 * tests
 */

function testWasaviExists () {
	assertNotUndefined(window.Wasavi);
}

function testWasaviRunning () {
	assertTrue(Wasavi.running);
	Wasavi.send(':q!\n');
	assertFalse(Wasavi.running);
}

/* vim:set ts=4 sw=4 fileencoding=UTF-8 fileformat=unix filetype=javascript : */
