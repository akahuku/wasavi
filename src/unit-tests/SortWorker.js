'use strict';

const assert = require('assert');

require('../chrome/frontend/init.js');
require('../chrome/frontend/utils.js');
require('../chrome/frontend/classes.js');

const unicodeUtils = require('../chrome/frontend/unicode_utils.js').unicodeUtils;
global.spc = unicodeUtils.getUnicodeGeneralSpaceRegex;

describe('class SortWorker', function () {
	var sw = new Wasavi.SortWorker(
		// application proxy stub
		{
			low: {
				getFindRegex: function (src) {
					return new RegExp(src.pattern);
				}
			}
		},
		// buffer stub
		{
		},
		// arguments stub
		{
			flags: {}
		}
	);
	var tests = [
		['', 'xyz\nfoo\nbar', 'bar\nfoo\nxyz\n'],
		['', 'xyz \\\nfoo \\\nbar', 'bar \\\nfoo \\\nxyz\n'],
		['', 'xyz,\nfoo,\nbar', 'bar,\nfoo,\nxyz\n'],
		['i', 'Foo\nbar\nBAZ', 'bar\nBAZ\nFoo\n'],
		['/\\d+/', 'foo4baz\nbar3bar\nbaz1frr', 'bar3bar\nfoo4baz\nbaz1frr\n'],
		['/\\d+/r', 'foo4baz\nbar3bar\nbaz1frr', 'baz1frr\nbar3bar\nfoo4baz\n'],
		['/\\d+/i', 'foo4baZ\nbar3bar\nbaz1frr', 'bar3bar\nfoo4baZ\nbaz1frr\n'],
		['/[a-zA-Z]+/ri', '345c847\n123a456\n537B183', '123a456\n537B183\n345c847\n'],
		['c3', 'foo897\nbar532\nzoo321', 'zoo321\nbar532\nfoo897\n'],
		['c3i', '321zoo\n532bar\n897Foo', '532bar\n897Foo\n321zoo\n']
	];

	tests.forEach(function (test, index) {
		it(`should sort, test #${index + 1}`, function () {
			/*
			console.log([
				'********',
				`           args: "${test[0]}"`,
				`        content: "${test[1]}"`,
				`expected result: "${test[2]}"`
			].join('\n'));
			*/

			var result = sw.parseArgs(test[0]);
			assert.equal(isString(result), false, 'test parse result is not a string');

			sw.buildContent(test[1]);

			var result = sw.sort();
			assert.equal(isString(result), false, 'test sort result is not a string');

			var result = sw.getContent();
			assert.equal(result, test[2], 'test sort result is correct');
		});
	});
});
