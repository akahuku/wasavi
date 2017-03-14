#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const exec = require('child_process').exec;
const OptionParser = require('brisket/lib/optparse');
const {fgets, getVersion, awk, pad} = require('./utils.js');

const UCD_FILE_NAME = __dirname + '/ucd/UnicodeData.txt';
const OUT_BIN_FILE = __dirname + '/../chrome/unicode/fftt_general.dat';
const OUT_HTML_FILE = 'decomp-result.html';

const UNICODE_SPACES = [
//	0x0020, // SPACE
	0x00A0, // NO-BREAK SPACE
	0x1680, // OGHAM SPACE MARK
	0x180E, // MONGOLIAN VOWEL SEPARATOR
	0x2000, // EN QUAD
	0x2001, // EM QUAD
	0x2002, // EN SPACE
	0x2003, // EM SPACE
	0x2004, // THREE-PER-EM SPACE
	0x2005, // FOUR-PER-EM SPACE
	0x2006, // SIX-PER-EM SPACE
	0x2007, // FIGURE SPACE
	0x2008, // PUNCTUATION SPACE
	0x2009, // THIN SPACE
	0x200A, // HAIR SPACE
//	0x200B, // ZERO WIDTH SPACE
	0x202F, // NARROW NO-BREAK SPACE
	0x205F, // MEDIUM MATHEMATICAL SPACE
	0x3000  // IDEOGRAPHIC SPACE
//	0xFEFF  // ZERO WIDTH NO-BREAK SPACE
];

const decomposition_data = [];

var version;
var runmode;

function setup () {
	var count = 0;
	fgets(UCD_FILE_NAME, line => {
		line = line.split(';');
		if (line[0].length != 4) {
			return true;
		}

		var cp = parseInt(line[0], 16);

		/*
		 * override decomposition data with the first letter of alphabetical reading of kana
		 */

		// hiragana
		if (cp >= 0x3040 && cp <= 0x309f) {
			if (/^HIRAGANA LETTER (SMALL )?([A-Z])/.test(line[1])) {
				line[5] = pad(RegExp.$2.toLowerCase().charCodeAt(0));
			}
		}
		// katakana
		else if (cp >= 0x30a0 && cp <= 0x30ff) {
			if (/^KATAKANA LETTER (SMALL )?([A-Z])/.test(line[1])) {
				line[5] = pad(RegExp.$2.toLowerCase().charCodeAt(0));
			}
		}

		/*
		 * store decomposition data
		 */

		if (line[5] != '') {
			decomposition_data[cp] = line[5].split(' ').map(a => {
				if (a.charAt(0) == '<') return a;
				return parseInt(a, 16);
			});
		}

		count++;
		if (count % 100 == 0) {
			process.stdout.write(`\r${line[0]}`);
		}
	});

	console.log('\n');

	/*
	 * another overrides
	 */

	// unicode spaces -> U+0020 SPACE
	UNICODE_SPACES.forEach(cp => decomposition_data[cp] = [0x20]);

	// U+3001 IDEOGRAPHIC COMMA -> U+002C COMMA
	decomposition_data[0x3001] = [0x2C];

	// U+3002 IDEOGRAPHIC FULL STOP -> U+002E FULL STOP
	decomposition_data[0x3002] = [0x2E];
}

function get_decomposition_first (cp, nest) {
	if (decomposition_data[cp] == undefined) {
		return -1;
	}

	/*
	 * recursive sample: ǻ(U+01FB) ; å(U+00E5) ́(U+0301)
	 *                               å(U+00E5) ; a(U+0061) ̊(U+030A)
	 *
	 * parenthesis sample: ⒜(U+249C) ; <compat> ((U+0028) a(U+0061) )(U+0029)
	 */

	var decomp = decomposition_data[cp];
	var decomp_tag = '';
	var index = 0;

	// remove decomposition tag, if exists
	if (typeof decomp[0] == 'string') {
		decomp_tag = decomp.shift();
	}

	// if decomposition is surrounded by parenthesis, remove paren
	if (decomp.length >= 2 && decomp[0] == 0x0028 && decomp[decomp.length - 1] == 0x0029) {
		decomp.shift();
		decomp.pop();;
	}

	// make recursion resolved array
	for (var i = 0, goal = decomp.length; i < goal; i++) {
		var result = get_decomposition_first(decomp[i], nest + 1);
		if (result == -1) {
			result = decomp[i];
		}
		if (result == 0x0020 && UNICODE_SPACES.indexOf(cp) >= 0) {
			return result;
		}
		if (result >= 0x0021 && result <= 0x007e) {
			return cp == result ? -1 : result;
		}
	}

	return -1;
}

function make_dict (is_html = false) {
	var file_name;
	var header;

	if (is_html) {
		file_name = OUT_HTML_FILE;
		header = `
Latin-1 alternative presentation in \`f\` \`F\` \`t\` \`T\` command
==================
Unicode version: ${version}

_Original Codepoint_ | _Latin-1 Alternative presentation_
-------------------- | ----------------------------------
`;
	}
	else {
		file_name = OUT_BIN_FILE;
		header = '';
	}

	var count = 0;
	var buffer = header;
	console.log(header);
	for (var cp = 0; cp < 0x10000; cp++) {
		var result = get_decomposition_first(cp, 0);
		if (result >= 0) {
			if (is_html) {
				console.log(
					`&#x${pad(cp, ' ', 4)}; (U+${pad(cp)})` +
					` | \`${String.fromCharCode(result)}\` (U+${pad(result)})`);
			}
			else {
				buffer += String.fromCharCode((cp     ) & 0xff);
				buffer += String.fromCharCode((cp >> 8) & 0xff);
				buffer += String.fromCharCode(result);

				if (count % 100 == 0) {
					process.stdout.write(`\r${pad(cp)}`);
				}
			}
			count++;
		}

	}

	if (is_html) {
		console.log(`\nTotal number of mappings: ${count}`);
	}
	else {
		fs.writeFileSync(file_name, buffer, {encoding:'binary', mode:0o664});
		console.log(`\n${count} codepoints are generated into ${file_name}.`);
	}

}

function printHelp () {
	console.log('usage: --html    Output html document');
	console.log('       --binary  Output binary data file');
	process.exit(1);
}

(new OptionParser)
	.on('--html    Output html document', v => {
		runmode = 'html';
	})
	.on('--binary  Output binary data file', v => {
		runmode = 'binary';
	})
	.parse(process.argv);

getVersion()
.then(() => {
	switch (runmode) {
	case 'html':
		setup();
		make_dict(true);
		break;
	case 'binary':
		setup();
		make_dict();
		break;
	default:
		printHelp();
		break;
	}
})
.catch(error => console.error(error));
