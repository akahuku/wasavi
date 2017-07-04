'use strict';

const {By, Key, until, promise} = require('selenium-webdriver');
const {it, describe} = require('selenium-webdriver/testing');

exports.suite = (assert, wasavi, driver) => {
	const {ctrln, ctrlt, ctrlw} = assert.shortcuts;

	it('test2_1', function* () {
		yield wasavi.setInputModeOfWatchTarget('edit');
		yield wasavi.send('iintroduction');
		assert.eq('#1-1', 'edit', wasavi.getInputMode());

		yield wasavi.send('\u001b');
		assert.pos('#2-1', 0, 11);
		assert.eq('#2-2', 'introduction', wasavi.getValue());
		assert.eq('#2-3', 'introduction', wasavi.getRegister('.'));
	});

	it('test2_2', function* () {
		yield wasavi.send(
			'iWith a screen editor you can scroll the\n' +
			'page, move the cursor, delete lines,\n' +
			'and more, while seeing the results of\n' +
			'your edits as you make them.\u001b');

		yield wasavi.send('3G17|0');
		assert.pos('#1', 2, 0);

		yield wasavi.send('3G17|b');
		assert.pos('#2', 2, 10);

		yield wasavi.send('3G17|2k');
		assert.pos('#3', 0, 16);

		yield wasavi.send('3G17|$');
		assert.pos('#4', 2, 36);

		yield wasavi.send('3G17|2h');
		assert.pos('#5', 2, 14);

		yield wasavi.send('3G17|j');
		assert.pos('#6', 3, 16);

		yield wasavi.send('3G17|2w');
		assert.pos('#7', 2, 27);

		yield wasavi.send('1G1|4l');
		assert.pos('#7', 0, 4);
	});

	it('test2_2_4', function* () {
		this.timeout(1000 * 60);

		/*
		 * 0        10        20        30        40
		 * *----+----*----+----*----+----*----+----*
		 *  cursor, delete lines, insert chracters,
		 */
		yield wasavi.send('i\tcursor, delete lines, insert chracters,\u001b');

		yield wasavi.send('1G1|');
		var wordCols = [1, 7, 9, 16, 21, 23, 30, 39];
		for (var i = 0; i < wordCols.length; i++) {
			yield wasavi.send('w');
			assert.pos('w: col ' + wordCols[i], 0, wordCols[i]);
		}

		yield wasavi.send('1G1|');
		var bigwordCols = [1, 9, 16, 23, 30];
		for (var i = 0; i < bigwordCols.length; i++) {
			yield wasavi.send('W');
			assert.pos('W: col ' + bigwordCols[i], 0, bigwordCols[i]);
		}

		yield wasavi.send('1G$');
		var wordColsBackward = [30, 23, 21, 16, 9, 7, 1, 0];
		for (var i = 0; i < wordColsBackward.length; i++) {
			yield wasavi.send('b');
			assert.pos('b: col ' + wordColsBackward[i], 0, wordColsBackward[i]);
		}

		yield wasavi.send('1G$');
		var bigwordColsBackward = [30, 23, 16, 9, 1, 0];
		for (var i = 0; i < bigwordColsBackward.length; i++) {
			yield wasavi.send('B');
			assert.pos('B: col ' + bigwordColsBackward[i], 0, bigwordColsBackward[i]);
		}
	});

	it('test2_3', function* () {
/*
With a editor you can scrooll the page,
move the cursor, delete lines, nisret
characters, and more while results of
your edits as you make tham.
Since they allow you to make changes
as you read through a file, much as
you would edit a printed copy,
screen editors are very popular.
 */

/*
With a screen editor you can scroll the page,
move the cursor, delete lines, insert
characters, and more while seeing the results of
your edits as you make them.
Screen editors are very popular
since they allow you to make changes
as you read through a file, much as
you would edit a printed copy.
 */
		yield wasavi.send(
			'iWith a editor you can scrooll the page,\n' +
			'move the cursor, delete lines, nisret\n' +
			'characters, and more while results of\n' +
			'your edits as you make tham.\n' +
			'Since they allow you to make changes\n' +
			'as you read through a file, much as\n' +
			'you would edit a printed copy,\n' +
			'screen editors are very popular.\u001b');

		yield wasavi.send('1G8|iscreen \u001b');
		yield wasavi.send('/oo\nx');
		yield wasavi.send('2G$bcwinsert\u001b');
		yield wasavi.send('3G4Wiseeing the \u001b');
		yield wasavi.send('4G$Fare');
		yield wasavi.send('5Grs');
		yield wasavi.send('7G$r.');
		yield wasavi.send('8G$x');
		yield wasavi.send('^rS');
		yield wasavi.send('dd2kP');

		assert.value('#1',
			'With a screen editor you can scroll the page,\n' +
			'move the cursor, delete lines, insert\n' +
			'characters, and more while seeing the results of\n' +
			'your edits as you make them.\n' +
			'Screen editors are very popular\n' +
			'since they allow you to make changes\n' +
			'as you read through a file, much as\n' +
			'you would edit a printed copy.');
	});
};
