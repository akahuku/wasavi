'use strict';

const assert = require('assert');

require('../chrome/frontend/init.js');
require('../chrome/frontend/utils.js');
require('../chrome/frontend/classes.js');

describe('class RegexConverter', function () {
	var rc = new Wasavi.RegexConverter(
		// application proxy stub
		{
			config: {
				vars: {
					smartcase: false,
					ignorecase: false,
					wrapscan: false
				}
			}
		}
	);

	var tests1 = [
		['foo', 'foo'],
		['^f*o.o$', '^f*o.o$'],
		['foo\\{1,2\\}bar\\?', 'foo{1,2}bar?'],
		['\\(foo\\|bar\\)\\+', '(foo|bar)+'],
		['a\\sb', 'a' + rc.SPECIAL_SPACE + 'b'],
		['a\\Sb', 'a' + rc.SPECIAL_NONSPACE + 'b'],
		['[abc\\s]', '[abc' + rc.SPECIAL_SPACE.replace(/^\[|\]$/g, '') + ']'],
		['[abc\\S]', '[abc' + rc.SPECIAL_NONSPACE.replace(/^\[|\]$/g, '') + ']'],
		['foo{1}', 'foo\\{1\\}'],
		['foo(bar)', 'foo\\(bar\\)'],
		['foo?bar+', 'foo\\?bar\\+'],
		['foo\\d\\+', 'foo\\d+'],
		['foo|bar', 'foo\\|bar'],
		['(?foobar)', '\\(\\?foobar\\)'],
		['\\(?foobar\\)', '(\\?foobar)'],
		['\\t\\v\\\\', '\\t\\v\\\\'],
		['\\t\\v\\', Error]
	];

	var tests2 = [
		['foo', 'foo'],
		['^f*o.o$', '\\^f\\*o\\.o\\$'],
		['foo\\{1,2\\}bar\\?', 'foo\\\\{1,2\\\\}bar\\\\?'],
		['\\(foo\\|bar\\)\\+', '\\\\(foo\\\\|bar\\\\)\\\\+'],
		['a\\sb', 'a\\\\sb'],
		['a\\Sb', 'a\\\\Sb'],
		['[abc\\s]', '\\[abc\\\\s\\]'],
		['[abc\\S]', '\\[abc\\\\S\\]'],
		['foo{1}', 'foo{1}'],
		['foo(bar)', 'foo(bar)'],
		['foo?bar+', 'foo?bar+'],
		['foo\\d\\+', 'foo\\\\d\\\\+'],
		['foo|bar', 'foo|bar'],
		['(?foobar)', '(?foobar)'],
		['\\(?foobar\\)', '\\\\(?foobar\\\\)'],
		['\\t\\v\\\\', '\\\\t\\\\v\\\\\\\\'],
		['\\t\\v\\', Error]
	];

	tests1.forEach((test, index) => {
		it(`should convert vi regex to js regex, #${index + 1}`, () => {
			if (test[1] == Error) {
				assert.throws(() => rc.toJsRegexString(test[0]));
			}
			else {
				var result = rc.toJsRegexString(test[0]);
				assert.equal(result, test[1]);

				var result = rc.toJsRegex(test[0]);
				assert.ok(result instanceof RegExp);
			}
		});
	});

	tests2.forEach((test, index) => {
		it(`should convert vi regex to js literal string, #${index + 1}`, () => {
			if (test[1] == Error) {
				assert.throws(() => rc.toLiteralString(test[0]));
			}
			else {
				var result = rc.toLiteralString(test[0]);
				assert.equal(result, test[1]);
			}
		});
	});
});

