'use strict';

const {By, Key, until, promise} = require('selenium-webdriver');
const {it, describe} = require('selenium-webdriver/testing');

exports.suite = (assert, wasavi, driver) => {
	const {ctrln, ctrlt, ctrlw} = assert.shortcuts;

	it('double quote, all, outer', function* () {
		yield wasavi.send('iabc  "def"  ghi\u001b');
		yield wasavi.send('0ya"');

		assert.eq('#1', '"def"  ', wasavi.getRegister('"'));
	});

	it('double quote, all, top', function* () {
		yield wasavi.send('iabc  "def"  ghi\u001b');
		yield wasavi.send('6|ya"');

		assert.eq('#1', '"def"  ', wasavi.getRegister('"'));
	});

	it('double quote, all, inner', function* () {
		yield wasavi.send('iabc  "def"  ghi\u001b');
		yield wasavi.send('8|ya"');

		assert.eq('#1', '"def"  ', wasavi.getRegister('"'));
	});

	it('double quote, all, bottom', function* () {
		yield wasavi.send('iabc  "def"  ghi\u001b');
		yield wasavi.send('10|ya"');

		assert.eq('#1', '"def"  ', wasavi.getRegister('"'));
	});

	it('double quote, all, error', function* () {
		yield wasavi.send('iabc  def  ghi\u001b');
		yield wasavi.send('7|ya"');

		assert.eq('#1', '', wasavi.getRegister('"'));
		assert.t('#2', wasavi.getLastMessage().length > 0);
	});

	//

	it('double quote, inner, outer', function* () {
		yield wasavi.send('iabc  "def"  ghi\u001b');
		yield wasavi.send('0yi"');

		assert.eq('#1', 'def', wasavi.getRegister('"'));
	});

	it('double quote, inner, top', function* () {
		yield wasavi.send('iabc  "def"  ghi\u001b');
		yield wasavi.send('6|yi"');

		assert.eq('#1', 'def', wasavi.getRegister('"'));
	});

	it('double quote, inner, inner', function* () {
		yield wasavi.send('iabc  "def"  ghi\u001b');
		yield wasavi.send('8|yi"');

		assert.eq('#1', 'def', wasavi.getRegister('"'));
	});

	it('double quote, inner, bottom', function* () {
		yield wasavi.send('iabc  "def"  ghi\u001b');
		yield wasavi.send('10|yi"');

		assert.eq('#1', 'def', wasavi.getRegister('"'));
	});

	it('double quote, inner, error', function* () {
		yield wasavi.send('iabc  def  ghi\u001b');
		yield wasavi.send('7|yi"');

		assert.eq('#1', '', wasavi.getRegister('"'));
		assert.t('#2', wasavi.getLastMessage().length > 0);
	});
	
	//

	it('word, all, outer', function* () {
		yield wasavi.send('iabc   def   ghi\u001b');
		yield wasavi.send('5|yaw');

		assert.eq('#1', '   def', wasavi.getRegister('"'));
	});

	it('word, all, inner', function* () {
		yield wasavi.send('iabc   def   ghi\u001b');
		yield wasavi.send('8|yaw');

		assert.eq('#1', 'def   ', wasavi.getRegister('"'));
	});

	it('word, all, top', function* () {
		yield wasavi.send('iabc   def   ghi   \u001b');
		yield wasavi.send('7|yaw');

		assert.eq('#1', 'def   ', wasavi.getRegister('"'));
	});

	it('word, all, bottom', function* () {
		yield wasavi.send('iabc   def   ghi\u001b');
		yield wasavi.send('9|yaw');

		assert.eq('#1', 'def   ', wasavi.getRegister('"'));
	});

	it('word, all, Non word', function* () {
		yield wasavi.send('i!@#   #+.   &*_\u001b');
		yield wasavi.send('8|yaw');

		assert.eq('#1', '#+.   ', wasavi.getRegister('"'));
	});

	//

	it('word, inner, outer', function* () {
		yield wasavi.send('iabc   def   ghi\u001b');
		yield wasavi.send('5|yiw');

		assert.eq('#1', 'def', wasavi.getRegister('"'));
	});

	it('word, inner, inner', function* () {
		yield wasavi.send('iabc   def   ghi\u001b');
		yield wasavi.send('8|yiw');

		assert.eq('#1', 'def', wasavi.getRegister('"'));
	});

	it('word, inner, top', function* () {
		yield wasavi.send('iabc   def   ghi\u001b');
		yield wasavi.send('7|yiw');

		assert.eq('#1', 'def', wasavi.getRegister('"'));
	});

	it('word, inner, bottom', function* () {
		yield wasavi.send('iabc   def   ghi\u001b');
		yield wasavi.send('9|yiw');

		assert.eq('#1', 'def', wasavi.getRegister('"'));
	});

	it('word, inner, Non word', function* () {
		yield wasavi.send('i!@#   #+.   &*_\u001b');
		yield wasavi.send('8|yiw');

		assert.eq('#1', '#+.', wasavi.getRegister('"'));
	});

	//

	it('bigword, all, outer', function* () {
		yield wasavi.send('ia#c   d$f   g%i\u001b');
		yield wasavi.send('5|yaW');

		assert.eq('#1', '   d$f', wasavi.getRegister('"'));
	});

	it('bigword, all, inner', function* () {
		yield wasavi.send('ia#c   d$f   g%i\u001b');
		yield wasavi.send('8|yaW');

		assert.eq('#1', 'd$f   ', wasavi.getRegister('"'));
	});

	it('bigword, all, top', function* () {
		yield wasavi.send('ia#c   d$f   g%i   \u001b');
		yield wasavi.send('7|yaW');

		assert.eq('#1', 'd$f   ', wasavi.getRegister('"'));
	});

	it('bigword, all, bottom', function* () {
		yield wasavi.send('ia#c   d$f   g%i\u001b');
		yield wasavi.send('9|yaW');

		assert.eq('#1', 'd$f   ', wasavi.getRegister('"'));
	});

	//

	it('bigword, inner, outer', function* () {
		yield wasavi.send('ia#c   d$f   g%i\u001b');
		yield wasavi.send('5|yiW');

		assert.eq('#1', 'd$f', wasavi.getRegister('"'));
	});

	it('bigword, inner, inner', function* () {
		yield wasavi.send('ia#c   d$f   g%i\u001b');
		yield wasavi.send('8|yiW');

		assert.eq('#1', 'd$f', wasavi.getRegister('"'));
	});

	it('bigword, inner, top', function* () {
		yield wasavi.send('ia#c   d$f   g%i\u001b');
		yield wasavi.send('7|yiW');

		assert.eq('#1', 'd$f', wasavi.getRegister('"'));
	});

	it('bigword, inner, bottom', function* () {
		yield wasavi.send('ia#c   d$f   g%i\u001b');
		yield wasavi.send('9|yiW');

		assert.eq('#1', 'd$f', wasavi.getRegister('"'));
	});

	//

	it('block, all, outer', function* () {
		yield wasavi.send('iabc （ def (ghi) jkl） mno\u001b');
		yield wasavi.send('1|ya(');
		assert.eq('#1', '', wasavi.getRegister('"'));
		assert.t('#2', wasavi.getLastMessage().length > 0);
	});

	it('block, all, top', function* () {
		yield wasavi.send('iabc （ def (ghi) jkl） mno\u001b');
		yield wasavi.send('5|ya(');

		assert.eq('#1', '（ def (ghi) jkl）', wasavi.getRegister('"'));
	});

	it('block, all, inner', function* () {
		yield wasavi.send('iabc （ def (ghi) jkl） mno\u001b');
		yield wasavi.send('8|ya(');

		assert.eq('#1', '（ def (ghi) jkl）', wasavi.getRegister('"'));
	});

	it('block, all, bottom', function* () {
		yield wasavi.send('iabc （ def (ghi) jkl） mno\u001b');
		yield wasavi.send('20|ya(');

		assert.eq('#1', '（ def (ghi) jkl）', wasavi.getRegister('"'));
	});

	it('block, all, error', function* () {
		yield wasavi.send('iabc （ def (ghi) jkl mno\u001b');
		yield wasavi.send('8|ya(');

		assert.eq('#1', '', wasavi.getRegister('"'));
		assert.t('#2', wasavi.getLastMessage().length > 0);
	});

	it('sentence, all, outer', function* () {
		yield wasavi.send('17G0yas');
		assert.eq('#1',
			'\tLorem ipsum dolor sit amet. consectetur adipisicing elit.',
			wasavi.getRegister('"'));
	});

	it('sentence, all, top', function* () {
		yield wasavi.send('17G^yas');
		assert.eq('#1',
			'Lorem ipsum dolor sit amet. consectetur adipisicing elit.  ',
			wasavi.getRegister('"'));
	});

	it('sentence, all, inner', function* () {
		yield wasavi.send('17G02wyas');
		assert.eq('#1',
			'Lorem ipsum dolor sit amet. consectetur adipisicing elit.  ',
			wasavi.getRegister('"'));
	});

	it('sentence, all, bottom', function* () {
		yield wasavi.send('17G2f.yas');
		assert.eq('#1',
			'Lorem ipsum dolor sit amet. consectetur adipisicing elit.  ',
			wasavi.getRegister('"'));
	});

	//

	it('sentence, innter, outer', function* () {
		yield wasavi.send('17G0yis');
		assert.eq('#1',
			'Lorem ipsum dolor sit amet. consectetur adipisicing elit.',
			wasavi.getRegister('"'));
	});

	it('sentence, innter, top', function* () {
		yield wasavi.send('17G^yis');
		assert.eq('#1',
			'Lorem ipsum dolor sit amet. consectetur adipisicing elit.',
			wasavi.getRegister('"'));
	});

	it('sentence, innter, inner', function* () {
		yield wasavi.send('17G02wyis');
		assert.eq('#1',
			'Lorem ipsum dolor sit amet. consectetur adipisicing elit.',
			wasavi.getRegister('"'));
	});

	it('sentence, innter, bottom', function* () {
		yield wasavi.send('17G2f.yis');
		assert.eq('#1',
			'Lorem ipsum dolor sit amet. consectetur adipisicing elit.',
			wasavi.getRegister('"'));
	});

	//
	
	it('paragraph, all, top', function* () {
		yield wasavi.send('16Gyap');
		assert.eq('#1',
			'\n' +
			'\tLorem ipsum dolor sit amet. consectetur adipisicing elit.  sed do eiusmod\n' +
			'\ttempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam\n',
			wasavi.getRegister('"'));
	});
	
	it('paragraph, all, inner', function* () {
		yield wasavi.send('17Gwyap');
		assert.eq('#1',
			'\tLorem ipsum dolor sit amet. consectetur adipisicing elit.  sed do eiusmod\n' +
			'\ttempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam\n' +
			'\n',
			wasavi.getRegister('"'));
	});

	//

	it('paragraph, inner, top', function* () {
		yield wasavi.send('16Gyip');
		assert.eq('#1',
			'\tLorem ipsum dolor sit amet. consectetur adipisicing elit.  sed do eiusmod\n' +
			'\ttempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam\n',
			wasavi.getRegister('"'));
	});
	
	it('paragraph, inner, inner', function* () {
		yield wasavi.send('17Gwyip');
		assert.eq('#1',
			'\tLorem ipsum dolor sit amet. consectetur adipisicing elit.  sed do eiusmod\n' +
			'\ttempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam\n',
			wasavi.getRegister('"'));
	});

	// tags

	it('tag, all, outer', function* () {
		// ....<a>tao</a>
		// ^
		yield wasavi.send('i    <a>tao</a>  \u001b');
		yield wasavi.send('0yat');

		assert.eq('#1-1', '<a>tao</a>', wasavi.getRegister('"'));
		assert.pos('#1-2', 0, 4);
	});

	it('tag, all, top', function* () {
		// ....<a>tat</a>
		//      ^
		yield wasavi.send('i    <a>tat</a>  \u001b');
		yield wasavi.send('6|yat');

		assert.eq('#1-1', '<a>tat</a>', wasavi.getRegister('"'));
		assert.pos('#1-2', 0, 4);
	});

	it('tag, all, inner', function* () {
		// ....<a>tai</a>
		//         ^
		yield wasavi.send('i    <a>tai</a>  \u001b');
		yield wasavi.send('2Fayat');

		assert.eq('#1-1', '<a>tai</a>', wasavi.getRegister('"'));
		assert.pos('#1-2', 0, 4);
	});

	it('tag, all, bottom', function* () {
		// ....<a>tab</a>
		//             ^
		yield wasavi.send('i    <a>tab</a>  \u001b');
		yield wasavi.send('Fayat');

		assert.eq('#1-1', '<a>tab</a>', wasavi.getRegister('"'));
		assert.pos('#1-2', 0, 4);
	});

	it('tag, all, error', function* () {
		yield wasavi.send('i    <a>tae  \u001b');
		yield wasavi.send('0yat');

		assert.eq('#1', '', wasavi.getRegister('"'));
		assert.t('#2', wasavi.getLastMessage().length > 0);
	});

	it('tag, inner, outer', function* () {
		// ....<a>tio</a>
		// ^
		yield wasavi.send('i    <a>tio</a>  \u001b');
		yield wasavi.send('0yit');

		assert.eq('#1-1', 'tio', wasavi.getRegister('"'));
		assert.pos('#1-2', 0, 7);
	});

	it('tag, inner, top', function* () {
		// ....<a>tit</a>
		//      ^
		yield wasavi.send('i    <a>tit</a>  \u001b');
		yield wasavi.send('6|yit');

		assert.eq('#1-1', 'tit', wasavi.getRegister('"'));
		assert.pos('#1-2', 0, 7);
	});

	it('tag, inner, inner', function* () {
		// ....<a>tii</a>
		//         ^
		yield wasavi.send('i    <a>tii</a>  \u001b');
		yield wasavi.send('2Fayit');

		assert.eq('#1-1', 'tii', wasavi.getRegister('"'));
		assert.pos('#1-2', 0, 7);
	});

	it('tag, inner, bottom', function* () {
		// ....<a>tib</a>
		//             ^
		yield wasavi.send('i    <a>tib</a>  \u001b');
		yield wasavi.send('Fayit');

		assert.eq('#1-1', 'tib', wasavi.getRegister('"'));
		assert.pos('#1-2', 0, 7);
	});

	it('tag, inner, error', function* () {
		yield wasavi.send('i    <a>tie  \u001b');
		yield wasavi.send('0yit');

		assert.eq('#1', '', wasavi.getRegister('"'));
		assert.t('#2', wasavi.getLastMessage().length > 0);
	});

	const TREE_OUTPUT_COMMAND =
		':set noai\n' +
		'i' +
		'<html>\n' +
		' <head>\n' +
		' </head>\n' +
		' <body>\n' +
		'  <div class="outer-div">\n' +
		'   <div>inner div</div>\n' +
		'   <p>paragraph</p>\n' +
		'  </div>\n' +
		' </body>\n' +
		'</html>' +
		'\u001b';

	it('tag, outer, counted', function* () {
		yield wasavi.send(TREE_OUTPUT_COMMAND);
		yield wasavi.send('7G2fp2yat');

		assert.eq('#1-1',
			'<div class="outer-div">\n' +
			'   <div>inner div</div>\n' +
			'   <p>paragraph</p>\n' +
			'  </div>',
			wasavi.getRegister('"'));
		assert.pos('#2-1', 4, 2);
	});

	it('bound, tag, inner, sequential', function* () {
		yield wasavi.send(TREE_OUTPUT_COMMAND);
		wasavi.setInputModeOfWatchTarget('bound', 'bound_line');
		yield wasavi.send('7G2fpv');
		var positions = [
			6,6,  6,14,	// paragraph
			6,3,  6,18,	// <p>paragraph</p>
			4,25, 7,1,	// ...<div> ~ </p>\n..
			4,2,  7,7,	// <div class ~ </div>
			3,7,  8,0,	// ..<div class ~ </div>\n.
			3,1,  8,7,	// <body> ~ </body>
			0,6,  8,7,	// .<head> ~ </body>\n    NOTE: vim places a focus cursor on 8,8, but wasavi places it on 8,7.
			0,0,  9,6,	// <html> ~ </html>
			0,0,  9,6	// <html> ~ </html>
		];
		var index = 1;
		for (var i = 0; i < positions.length; i += 4, index++) {
			wasavi.setInputModeOfWatchTarget('bound', 'bound_line');
			yield wasavi.send('it');

			var ss = wasavi.getMark('$<');
			assert.t(`#${index}-1, $<`, ss);

			var se = wasavi.getMark('$>');
			assert.t(`#${index}-2, $>`, se);

			assert.eq(
				`#{$index}-3, ss`,
				`[${positions[i + 0]}, ${positions[i + 1]}]`,
				`[${ss[0]}, ${ss[1]}]`);

			assert.eq(
				`#{$index}-3, se`,
				`[${positions[i + 2]}, ${positions[i + 3]}]`,
				`[${se[0]}, ${se[1]}]`);
		}
	});

	it('bound, tag, all, sequential', function* () {
		yield wasavi.send(TREE_OUTPUT_COMMAND);
		wasavi.setInputModeOfWatchTarget('bound', 'bound_line');
		yield wasavi.send('7G2fpv');
		var positions = [
			6,3, 6,18,	// <p>paragraph</p>
			4,2, 7,7,	// <div class ~ </div>
			3,1, 8,7,	// <body> ~ </body>
			0,0, 9,6,	// <html> ~ </html>
			0,0, 9,6	// <html> ~ </html>
		];
		var index = 1;
		for (var i = 0; i < positions.length; i += 4, index++) {
			wasavi.setInputModeOfWatchTarget('bound', 'bound_line');
			yield wasavi.send('at');

			var ss = wasavi.getMark('$<');
			assert.t(`#${index}-1, $<`, ss);

			var se = wasavi.getMark('$>');
			assert.t(`#${index}-2, $>`, se);

			assert.eq(
				`#{$index}-3, ss`,
				`[${positions[i + 0]}, ${positions[i + 1]}]`,
				`[${ss[0]}, ${ss[1]}]`);

			assert.eq(
				`#{$index}-3, se`,
				`[${positions[i + 2]}, ${positions[i + 3]}]`,
				`[${se[0]}, ${se[1]}]`);
		}
	});
};

