'use strict';

const assert = require('assert');

require('../chrome/frontend/init.js');
require('../chrome/frontend/utils.js');

describe('splitex', () => {
	it('should be split into exactly N elements', () => {
		let a = splitex('abc def ghi jkl mno pqr stu vwx yz', ' ', 3);
		assert.equal(a.length, 3);
		assert.equal(a[0], 'abc');
		assert.equal(a[1], 'def');
		assert.equal(a[2], 'ghi jkl mno pqr stu vwx yz');
	});

	it('should be split into exactly N elements even if number of elements less than N', () => {
		let a = splitex('abc def', ' ', 3);
		assert.equal(a.length, 3);
		assert.equal(a[0], 'abc');
		assert.equal(a[1], 'def');
		assert.equal(a[2], '');
	});

	it('should return empty array if N is zero', () => {
		let a = splitex('abc def ghi', ' ', 0);
		assert.equal(a.length, 0);
	});

	it('should be split into exactly N elements (RegExp)', () => {
		let a = splitex('abc     def ghi jkl mno pqr stu vwx\tyz', /\s+/, 3);
		assert.equal(a.length, 3);
		assert.equal(a[0], 'abc');
		assert.equal(a[1], 'def');
		assert.equal(a[2], 'ghi jkl mno pqr stu vwx\tyz');
	});

	it('should be split into exactly N elements even if number of elements less than N (RegExp)', () => {
		let a = splitex('abc def', /\s+/, 3);
		assert.equal(a.length, 3);
		assert.equal(a[0], 'abc');
		assert.equal(a[1], 'def');
		assert.equal(a[2], '');

		a = splitex('abc def ghi    ', /\s+/, 3);
		assert.equal(a.length, 3);
		assert.equal(a[0], 'abc');
		assert.equal(a[1], 'def');
		assert.equal(a[2], 'ghi');
	});

	it('should return empty array if N is zero (RegExp)', () => {
		let a = splitex('abc def ghi', /\s+/, 0);
		assert.equal(a.length, 0);
	});

	it('should throw an error if num is not a number', () => {
		assert.throws(
			() => splitex('abc def', /\s+/, 'abc'),
			Error, 'splited: num is not a number');

		assert.throws(
			() => splitex('abc def', /\s+/, NaN),
			Error, 'splited: num is not a number');
	});

	it('should throw an error if delemiter is invalid', () => {
		assert.throws(
			() => splitex('abc def', 100, 100),
			Error, 'splitex: delimiter is neither string nor RegExp');

		assert.throws(
			() => splitex('abc def', {}, 100),
			Error, 'splitex: delimiter is neither string nor RegExp');
	});
});

