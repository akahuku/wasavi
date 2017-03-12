'use strict';

const assert = require('assert');

require('../chrome/frontend/init.js');
require('../chrome/frontend/utils.js');

describe('expr', () => {
	it('should return empty set with empty string', () => {
		var e = expr('');
		assert.equal(typeof e, 'object');
		assert.equal(Object.keys(e).length, 0);
	});

	it('should throw error with invalid expression', () => {
		var e = expr('foobar');
		assert.equal(typeof e, 'object');
		assert.ok('error' in e);
		assert.ok(/^Invalid token:/.test(e.error), e.error);
	});

	it('should throw error with an expression which has extra token', () => {
		var e = expr('(1)2');
		assert.equal(typeof e, 'object');
		assert.ok('error' in e);
		assert.ok(/^Extra token:/.test(e.error), e.error);
	});
	
	it('should throw error with unbalance paren', () => {
		var e = expr('(1');
		assert.equal(typeof e, 'object');
		assert.ok('error' in e);
		assert.ok(/^Missing "\)"\./.test(e.error), e.error);
	});

	it('should throw error with incomplete plus sign', () => {
		var e = expr('+');
		assert.equal(typeof e, 'object');
		assert.ok('error' in e);
		assert.ok(/^Missing a number\./.test(e.error), e.error);
	});

	it('should throw error with incomplete exponential float', () => {
		var e = expr('1.0e');
		assert.equal(typeof e, 'object');
		assert.ok('error' in e);
		assert.ok(/^Invalid token:/.test(e.error), e.error);
	});

	it('should throw error with incomplete hex expression', () => {
		var e = expr('0x');
		assert.equal(typeof e, 'object');
		assert.ok('error' in e);
		assert.ok(/^Invalid token:/.test(e.error), e.error);
	});

	it('should recognize + as plus sign', () => {
		var e = expr('+1');
		assert.equal(typeof e, 'object');
		assert.ok('result' in e);
		assert.equal(e.result, 1);
	});

	it('should recognize + as plus sign, even if separated', () => {
		var e = expr('+ 1');
		assert.equal(typeof e, 'object');
		assert.ok('result' in e);
		assert.equal(e.result, 1);
	});

	it('should parse an integer', () => {
		var e = expr('1234');
		assert.equal(typeof e, 'object');
		assert.ok('result' in e);
		assert.equal(1234, e.result);
	});

	it('should parse a float', () => {
		var e = expr('0.001');
		assert.equal(typeof e, 'object');
		assert.ok('result' in e);
		assert.equal(0.001, e.result);
	});

	it('should parse a natural number omitted float', () => {
		var e = expr('.002');
		assert.equal(typeof e, 'object');
		assert.ok('result' in e);
		assert.equal(0.002, e.result);
	});

	it('should parse a decimal omitted float', () => {
		var e = expr('2.');
		assert.equal(typeof e, 'object');
		assert.ok('result' in e);
		assert.equal(2, e.result);
	});

	[
		'1e1', '1e+1', '1e-1',
		'1.1e1', '1.1e+1', '1.1e-1',
		'.1e1', '.1e+1', '.1e-1'
	].forEach((n) => {
		it(`should parse an exponential float (${n})`, () => {
			var e = expr(n);
			assert.equal(typeof e, 'object');
			assert.ok('result' in e);
			assert.equal(parseFloat(n), e.result);
		});
	});

	it('should parse hex number', () => {
		var e = expr('0x1f');
		assert.equal(typeof e, 'object');
		assert.ok('result' in e);
		assert.equal(0x1f, e.result);
	});

	it('should parse octal number', () => {
		var e = expr('0777');
		assert.equal(typeof e, 'object');
		assert.ok('result' in e);
		assert.equal(511, e.result);
	});

	it('should parse binaly number', () => {
		var e = expr('0b1111_1111');
		assert.equal(typeof e, 'object');
		assert.ok('result' in e);
		assert.equal(255, e.result);
	});

	it('should compute multiply expression', () => {
		var e = expr('2 * 3');
		assert.equal(typeof e, 'object');
		assert.ok('result' in e);
		assert.equal(6, e.result);
	});

	it('should compute divide expression', () => {
		var e = expr('2 / 3');
		assert.equal(typeof e, 'object');
		assert.ok('result' in e);
		assert.ok(/0.6+/.test(e.result), e.result);
	});

	it('should compute modulo expression', () => {
		var e = expr('5 % 2');
		assert.equal(typeof e, 'object');
		assert.ok('result' in e);
		assert.equal(1, e.result);
	});

	it('should compute add expression', () => {
		var e = expr('1 + -1');
		assert.equal(typeof e, 'object');
		assert.ok('result' in e);
		assert.equal(0, e.result);
	});

	it('should compute subtract expression', () => {
		var e = expr('1 - -1');
		assert.equal(typeof e, 'object');
		assert.ok('result' in e);
		assert.equal(2, e.result);
	});

	it('should compute complex expression', () => {
		var e = expr('2 + 3 * 6');
		assert.equal(typeof e, 'object');
		assert.ok('result' in e, JSON.stringify(e));
		assert.equal(20, e.result);
	});

	it('should compute expression containing parenthesis', () => {
		var e = expr('(2 + 3) * 6');
		assert.equal(typeof e, 'object');
		assert.ok('result' in e);
		assert.equal(30, e.result);
	});
});
