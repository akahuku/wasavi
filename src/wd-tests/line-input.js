'use strict';

const {By, Key, until, promise} = require('selenium-webdriver');
const {it, describe} = require('selenium-webdriver/testing');

exports.suite = (assert, wasavi, driver) => {
	const {ctrln, ctrlt, ctrlw} = assert.shortcuts;

	it('move to top', function* () {
		yield wasavi.send(':ersion\u0001v\n');
		assert.t('#1-1', /wasavi/.test(wasavi.getLastMessage()));
	});

	it('move to top home', function* () {
		yield wasavi.send(':ersion' + Key.HOME + 'v\n');
		assert.t('#1-1', /wasavi/.test(wasavi.getLastMessage()));
	});

	it('move to end', function* () {
		yield wasavi.send(':versio\u0001\u0005n\n');
		assert.t('#1-1', /wasavi/.test(wasavi.getLastMessage()));
	});

	it('move to end end', function* () {
		yield wasavi.send(':versio\u0001' + Key.END + 'n\n');
		assert.t('#1-1', /wasavi/.test(wasavi.getLastMessage()));
	});

	it('back', function* () {
		yield wasavi.send(':versin\u0002o\n');
		assert.t('#1-1', /wasavi/.test(wasavi.getLastMessage()));
	});

	it('back left', function* () {
		yield wasavi.send(':versin' + Key.ARROW_LEFT + 'o\n');
		assert.t('#1-1', /wasavi/.test(wasavi.getLastMessage()));
	});

	it('forward', function* () {
		yield wasavi.send(':vrsion\u0001\u0006e\n');
		assert.t('#1-1', /wasavi/.test(wasavi.getLastMessage()));
	});

	it('forward right', function* () {
		yield wasavi.send(':vrsion\u0001' + Key.ARROW_RIGHT + 'e\n');
		assert.t('#1-1', /wasavi/.test(wasavi.getLastMessage()));
	});

	it('backspace', function* () {
		yield wasavi.send(':versiom\u0008n\n');
		assert.t('#1-1', /wasavi/.test(wasavi.getLastMessage()));
	});

	it('backspace backspace', function* () {
		yield wasavi.send(':versiom' + Key.BACK_SPACE + 'n\n');
		assert.t('#1-1', /wasavi/.test(wasavi.getLastMessage()));
	});

	it('delete', function* () {
		yield wasavi.send(':versiooon' + Key.ARROW_LEFT + Key.ARROW_LEFT + Key.DELETE + Key.BACK_SPACE + '\n');
		assert.t('#1-1', /wasavi/.test(wasavi.getLastMessage()));
	});

	it('next history', function* () {
		yield wasavi.send(':wow!\n');
		yield wasavi.send(':version' + Key.ARROW_UP + Key.ARROW_DOWN + '\n');
		assert.t('#1-1', /wasavi/.test(wasavi.getLastMessage()));
	});

	it('previous history', function* () {
		yield wasavi.send(':version\n');
		yield wasavi.send(':set ai?' + Key.ARROW_UP + '\n');
		assert.t('#1-1', /wasavi/.test(wasavi.getLastMessage()));
	});

	it('delete line', function* () {
		yield wasavi.send(':howdy?\u0015version\n');
		assert.t('#1-1', /wasavi/.test(wasavi.getLastMessage()));
	});

	it('delete word', function* () {
		yield wasavi.send(':word', ctrlw, 'version\n');
		assert.t('#1-1', /wasavi/.test(wasavi.getLastMessage()));
	});

	it('complete command name from empty', function* () {
		wasavi.setInputModeOfWatchTarget('line_input');
		yield wasavi.send(':\t');
		assert.eq('#1-1', '&', wasavi.getLineInput());
	});

	it('complete command name with prefix', function* () {
		wasavi.setInputModeOfWatchTarget('line_input');
		yield wasavi.send(':ab\t');
		assert.eq('#1-1', 'abbreviate', wasavi.getLineInput());
	});

	it('complete nested command name from empty', function* () {
		wasavi.setInputModeOfWatchTarget('line_input');
		yield wasavi.send(':g/re/\t');
		assert.eq('#1-1', 'g/re/&', wasavi.getLineInput());
	});

	it('complete nested command name with prefix', function* () {
		wasavi.setInputModeOfWatchTarget('line_input');
		yield wasavi.send(':g/re/p\t');
		assert.eq('#1-1', 'g/re/print', wasavi.getLineInput());
	});

	it('complete 2nd command name from empty', function* () {
		wasavi.setInputModeOfWatchTarget('line_input');
		yield wasavi.send(':ver|1,2\t');
		assert.eq('#1-1', 'ver|1,2&', wasavi.getLineInput());
	});

	it('complete 2nd command name with prefix', function* () {
		wasavi.setInputModeOfWatchTarget('line_input');
		yield wasavi.send(':ver|ab\t');
		assert.eq('#1-1', 'ver|abbreviate', wasavi.getLineInput());
	});

	it('complete option name from empty', function* () {
		wasavi.setInputModeOfWatchTarget('line_input');
		yield wasavi.send(':set \t-\u0005');
		assert.eq('#1-1', 'set autoindent-', wasavi.getLineInput());
	});

	it('complete negative option name from empty', function* () {
		wasavi.setInputModeOfWatchTarget('line_input');
		yield wasavi.send(':set no\t-\u0005');
		assert.eq('#1-1', 'set noautoindent-', wasavi.getLineInput()); // must be first boolean option in alphabetical order
	});

	it('complete option name with prefix', function* () {
		yield wasavi.send(':set fullsc\t?\n');
		assert.eq('#1-1', 'nofullscreen', wasavi.getLastMessage());
	});

	it('complete negative option name with prefix', function* () {
		yield wasavi.send(':set noautoi\t?\n');
		assert.eq('#1-1', '  autoindent', wasavi.getLastMessage());
	});

	it('complete abbreviated option name', function* () {
		yield wasavi.send(':set nu\t?\n');
		assert.eq('#1-1', 'nonumber', wasavi.getLastMessage());
	});

	it('complete abbreviated negative option name', function* () {
		yield wasavi.send(':set nocub\t?\n');
		assert.eq('#1-1', '  cursorblink', wasavi.getLastMessage());
	});

	it('complete theme from empty', function* () {
		wasavi.setInputModeOfWatchTarget('line_input');
		yield wasavi.send(':set theme=\t');
		assert.t('#1-1', /^set theme=.+/.test(wasavi.getLineInput()));
	});

	it('complete theme with prefix', function* () {
		wasavi.setInputModeOfWatchTarget('line_input');
		yield wasavi.send(':set theme=c\t');
		assert.t('#1-1', /^set theme=charcoal/.test(wasavi.getLineInput()));
	});

	it('paste register', function* () {
		yield wasavi.send('afoo\nbar\u001b1GyG');
		wasavi.setInputModeOfWatchTarget('line_input');
		yield wasavi.send(':\u0012"');
		assert.eq('#1-1', 'foo\u240abar\u240a', wasavi.getLineInput());
	});

	it('paste calc register', function* () {
		yield wasavi.send('afoo\nbar\nbaz\u001b');
		yield wasavi.send(':\u0012=1+2\np\n');
		assert.eq('#1-1', 'baz', wasavi.getLastMessage());
	});

	it('paste clipboard', function* () {
		yield wasavi.send('afoo\nbar\u001b1G"*yG');
		wasavi.setInputModeOfWatchTarget('line_input');
		yield wasavi.send(':\u0012*');
		assert.eq('#1-1', 'foo\u240abar\u240a', wasavi.getLineInput());
	});
};

