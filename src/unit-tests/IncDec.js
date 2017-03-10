'use strict';

const assert = require('assert');

require('../chrome/frontend/init.js');
require('../chrome/frontend/utils.js');
require('../chrome/frontend/classes.js');

//              0         1         2         3         4
//              0123456789012345678901234567890123456789012
const target = 'abc z 0b000345 0x0fghi 00789 -1234 5678 -09';

describe('class IncDec', function () {
	it('should extract decimal numbers', function () {
		var incdec = new Wasavi.IncDec;
		var a = incdec.extractTargets(target, 6, {formats: ''});
		var whole = a.map(item => item.text).join(',');
		assert.equal(whole, '0,000345,0,0,00789,-1234,5678,-09', '#1');
		assert.equal(a[0].type, 'decimal', '#2');
		assert.equal(a.foundIndex, 0, '#3');
		assert.ok(a[0].match, '#4');

		var r = incdec.getReplacement(a, 1);
		assert.equal(r.replacement, '1', '#5');

		var r = incdec.getReplacement(a, 1000);
		assert.equal(r.replacement, '1000', '#6');

		var r = incdec.getReplacement(a, 0x100000001);
		assert.equal(r.replacement, '1', '#7');

		var r = incdec.getReplacement(a, -2);
		assert.equal(r.replacement, '-2', '#8');
	});

	it('should extract binary and decimal numbers', function () {
		var incdec = new Wasavi.IncDec;
		var a = incdec.extractTargets(target, 6, {formats: 'bin'});
		var whole = a.map(item => item.text).join(',');
		assert.equal(whole, '0b000,345,0,0,00789,-1234,5678,-09', '#1');
		assert.equal(a[0].type, 'bin', '#2');
		assert.equal(a.foundIndex, 0, '#3');
		assert.ok(a[0].match, '#4');

		var r = incdec.getReplacement(a, 1);
		assert.equal(r.replacement, '0b001', '#5');

		var r = incdec.getReplacement(a, 0b1000);
		assert.equal(r.replacement, '0b1000', '#6');

		var r = incdec.getReplacement(a, 0x100000001);
		assert.equal(r.replacement, '0b001', '#7');

		var r = incdec.getReplacement(a, -2);
		assert.equal(r.replacement, '0b11111111111111111111111111111110', '#8');
	});

	it('should extract hex and decimal numbers', function () {
		var incdec = new Wasavi.IncDec;
		var a = incdec.extractTargets(target, 16, {formats: 'hex'});
		var whole = a.map(item => item.text).join(',');
		assert.equal(whole, '0,000345,0x0f,00789,-1234,5678,-09', '#1');
		assert.equal(a[2].type, 'hex', '#2');
		assert.equal(a.foundIndex, 2, '#3');
		assert.ok(a[2].match, '#4');

		var r = incdec.getReplacement(a, 1);
		assert.equal(r.replacement, '0x10', '#5');

		var r = incdec.getReplacement(a, 0x1000);
		assert.equal(r.replacement, '0x100f', '#6');

		var r = incdec.getReplacement(a, 0x100000001);
		assert.equal(r.replacement, '0x10', '#7');

		var r = incdec.getReplacement(a, -17);
		assert.equal(r.replacement, '0xfffffffe', '#8');
	});

	it('should pick correct caps up for hex numbers', function () {
		var incdec = new Wasavi.IncDec;
		var a = incdec.extractTargets('0x0009', 0, {formats: 'hex'});
		var r = incdec.getReplacement(a, 1);
		assert.equal(r.replacement, '0x000a', '#1');

		var a = incdec.extractTargets('0X0009', 0, {formats: 'hex'});
		var r = incdec.getReplacement(a, 1);
		assert.equal(r.replacement, '0X000A', '#2');

		var a = incdec.extractTargets('0X000a', 0, {formats: 'hex'});
		var r = incdec.getReplacement(a, 1);
		assert.equal(r.replacement, '0X000b', '#3');

		var a = incdec.extractTargets('0x000A', 0, {formats: 'hex'});
		var r = incdec.getReplacement(a, 1);
		assert.equal(r.replacement, '0x000B', '#4');
	});

	it('should extract octal and decimal numbers', function () {
		var incdec = new Wasavi.IncDec;
		var a = incdec.extractTargets(target, 10, {formats: 'octal'});
		var whole = a.map(item => item.text).join(',');
		assert.equal(whole, '0,000345,0,0,00789,-1234,5678,-09', '#1');
		assert.equal(a[1].type, 'octal', '#2');
		assert.equal(a.foundIndex, 1, '#3');
		assert.ok(a[1].match, '#4');

		var r = incdec.getReplacement(a, 1);
		assert.equal(r.replacement, '000346', '#5');

		var r = incdec.getReplacement(a, parseInt('01000', 8));
		assert.equal(r.replacement, '001345', '#6');

		var r = incdec.getReplacement(a, 0x100000001);
		assert.equal(r.replacement, '000346', '#7');

		var r = incdec.getReplacement(a, -(2 + parseInt('000345', 8)));
		assert.equal(r.replacement, '037777777776', '#8');
	});

	it('should pick up dicimal number, not a octal', function () {
		var incdec = new Wasavi.IncDec;
		var a = incdec.extractTargets(target, 25, {formats: 'octal'});
		assert.equal(a.foundIndex, 4, '#1');
		assert.equal(a[4].text, '00789', '#2');
		assert.equal(a[4].index, 23, '#3');
		assert.equal(a[4].type, 'decimal', '#4');

		var r = incdec.getReplacement(a, 1);
		assert.equal(r.replacement, '790', '#5');

		var r = incdec.getReplacement(a, 1000);
		assert.equal(r.replacement, '1789', '#6');

		var r = incdec.getReplacement(a, 0x100000001);
		assert.equal(r.replacement, '790', '#7');

		var r = incdec.getReplacement(a, -(2 + 789));
		assert.equal(r.replacement, '-2', '#8');
	});

	it('should extract alphabets and decimal numbers', function () {
		var incdec = new Wasavi.IncDec;
		var a = incdec.extractTargets(target, 4, {formats: 'alpha'});
		var whole = a.map(item => item.text).join(',');
		assert.equal(whole, 'z,0,000345,0,0,00789,-1234,5678,-09', '#1');
		assert.equal(a[0].type, 'alpha', '#2');
		assert.equal(a.foundIndex, 0, '#3');
		assert.ok(a[0].match, '#4');

		var r = incdec.getReplacement(a, 1);
		assert.equal(r.replacement, 'a', '#5');

		var r = incdec.getReplacement(a, -2);
		assert.equal(r.replacement, 'x', '#6');
	});

	it('should return quickly if firstReturn option is specified', function () {
		var incdec = new Wasavi.IncDec;
		var a = incdec.extractTargets(target, 4, {formats: 'alpha', firstReturn: true});
		var whole = a.map(item => item.text).join(',');
		assert.equal(whole, 'z', '#1');
	});
});

