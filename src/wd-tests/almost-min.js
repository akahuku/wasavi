'use strict';

const events = require('events');
const mocha = require('mocha');
const Base = require('mocha/lib/reporters/base');
const inherits = require('mocha/lib/utils').inherits;

var doneStats = [];
var currentStats;
var numberOfAllTests = -1;

function calcNumber (suite) {
	var result = suite.tests.length;

	for (var i = 0, goal = suite.suites.length; i < goal; i++) {
		result += calcNumber(suite.suites[i]);
	}

	return result;
}

function printResult () {
	var longestTitle = '';
	var maxPasses = 0;
	var maxFailures = 0;
	var maxTests = 0;

	doneStats.forEach(s => {
		if (s.tests && s.passes == s.tests) {
			return;
		}

		if (s.title.length > longestTitle.length) {
			longestTitle = s.title;
		}
		if (s.passes > maxPasses) {
			maxPasses = s.passes;
		}
		if (s.failures > maxFailures) {
			maxFailures = s.failures;
		}
		if (s.tests > maxTests) {
			maxTests = s.tests;
		}
	});

	longestTitle = longestTitle.replace(/./g, ' ');
	maxPasses = ('' + maxPasses).replace(/./g, ' ');
	maxFailures = ('' + maxFailures).replace(/./g, ' ');
	maxTests = ('' + maxTests).replace(/./g, ' ');

	doneStats.forEach(s => {
		if (s.tests && s.passes == s.tests) {
			return;
		}

		var title = (s.title + longestTitle).substring(0, longestTitle.length);
		if (s.tests) {
			// "100.00"
			var ratio = ('      ' + (s.passes / s.tests * 100).toFixed(2)).substr(-6);

			console.log(
				title + ' -- failed ' +
				(maxPasses + s.failures).substr(-maxFailures.length) + ' of ' +
				(maxTests + s.tests).substr(-maxTests.length) +
				' (coverage: ' + ratio + '%)');
		}
		else {
			console.log(title + ' -- N/A');
		}
	});
}

function AlmostMin (runner) {
	Base.call(this, runner);

	runner.on('start', _ => {
		AlmostMin.events.emit('start');
	});

	runner.on('suite', (suite) => {
		try {
			if (suite.root) {
				numberOfAllTests = calcNumber(suite);
			}

			if (suite.title == '') return;

			if (currentStats) {
				// merge the number of tests into top level suite
				currentStats.tests += suite.tests.length;
			}
			else {
				currentStats = {
					title: suite.title,
					tests: suite.tests.length,
					passes: 0,
					failures: 0
				};
			}
		}
		catch (ex) {
			console.error(ex.stack);
		}

		AlmostMin.events.emit('suite', suite, numberOfAllTests);
	});

	runner.on('hook', (hook) => {
		AlmostMin.events.emit('hook', hook);
	});

	runner.on('hook end', (hook) => {
		AlmostMin.events.emit('hook end', hook);
	});

	runner.on('test', (test) => {
		AlmostMin.events.emit('test', test);
	});

	runner.on('pass', (test) => {
		currentStats && currentStats.passes++;

		AlmostMin.events.emit('pass', test);
	});

	runner.on('fail', (test) => {
		currentStats && currentStats.failures++;

		AlmostMin.events.emit('fail', test);
	});

	runner.on('pending', (test) => {
		AlmostMin.events.emit('pending', test);
	});

	runner.on('test end', (test) => {
		AlmostMin.events.emit('test end', test);
	});

	runner.on('suite end', (suite) => {
		try {
			if (suite.title == '') return;

			if (currentStats) {
				doneStats.push(currentStats);
				currentStats = undefined;
			}
		}
		catch (ex) {
			console.error(ex.stack);
		}

		AlmostMin.events.emit('suite end', suite);
	});

	runner.on('end', _ => {
		try {
			printResult();
			this.epilogue();
		}
		catch (ex) {
			console.error(ex.stack);
		}

		AlmostMin.events.emit('end');
	});
}

inherits(AlmostMin, Base);

AlmostMin.events = new events.EventEmitter;

exports = module.exports = AlmostMin;
