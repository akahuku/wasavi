'use strict';

const assert = require('assert');
const exec = require('child_process').exec;

require('../chrome/frontend/init.js');
require('../chrome/frontend/utils.js');

const formats = [
	'a: %a',
	'A: %A',
	'b: %b',
	'B: %B',
	'c: %c',
	'C: %C ~%4C~ ~%04C~ ~%_4C~ ~%-C~',
	'd: %d ~%4d~ ~%04d~ ~%_4d~ ~%-d~',
	'D: %D',
	'e: %e ~%4e~ ~%04e~ ~%_4e~ ~%-e~',
	'F: %F',
	'g: %g ~%4g~ ~%04g~ ~%_4g~ ~%-g~',
	'G: %G ~%4G~ ~%04G~ ~%_4G~ ~%-G~',
	'h: %h',
	'H: %H ~%4H~ ~%04H~ ~%_4H~ ~%-H~',
	'I: %I ~%4I~ ~%04I~ ~%_4I~ ~%-I~',
	'j: %j ~%4j~ ~%04j~ ~%_4j~ ~%-j~',
	'k: %k ~%4k~ ~%04k~ ~%_4k~ ~%-k~',
	'l: %l ~%4l~ ~%04l~ ~%_4l~ ~%-l~',
	'm: %m ~%4m~ ~%04m~ ~%_4m~ ~%-m~',
	'M: %M ~%4M~ ~%04M~ ~%_4M~ ~%-M~',
	//'n: %n',
	'p: %p ~%^p~ ~%#p~',
	'P: %P ~%^P~ ~%#P~',
	'r: %r',
	'R: %R',
	's: %s ~%4s~ ~%04s~ ~%_4s~ ~%-s~',
	'S: %S ~%4S~ ~%04S~ ~%_4S~ ~%-S~',
	't: %t',
	'T: %T',
	'u: %u ~%4u~ ~%04u~ ~%_4u~ ~%-u~',
	'U: %U ~%4U~ ~%04U~ ~%_4U~ ~%-U~',
	'V: %V ~%4V~ ~%04V~ ~%_4V~ ~%-V~',
	'w: %w ~%4w~ ~%04w~ ~%_4w~ ~%-w~',
	'W: %W ~%4W~ ~%04W~ ~%_4W~ ~%-W~',
	'x: %x',
	'X: %X',
	'y: %y ~%4y~ ~%04y~ ~%_4y~ ~%-y~',
	'Y: %Y ~%4Y~ ~%04Y~ ~%_4Y~ ~%-Y~',
	'z: %z ~%^z~ ~%#z~',
	'Z: %Z ~%^Z~ ~%#Z~'
];
const format = formats.join('###');
const testDate = '2017-01-02 03:04:05';

describe('strftime', () => {
	var child;
	var expected;
	var actual;

	before(done => {
		child = exec(
			`LANG=en date --date="${testDate}" +"${format}"`,
			(error, stdout, stderr) => {
				if (error) {
					done(error);
				}
				expected = stdout.replace(/\n$/, '').split('###');
				actual = strftime('%{locale:en}' + format, new Date(testDate));
				done();
			}
		);
	});

	it('should be a string', () => {
		assert.equal(typeof actual, 'string');
		actual = actual.split('###');
	});

	it('should be same number of elements as expected', () => {
		assert.equal(actual.length, expected.length);
	});

	formats.forEach((f, i) => {
		it(`format "${f}"`, () => {
			assert.equal(actual[i], expected[i]);
		});
	});
});
