const fs = require('fs');

function fgets (file, callback) {
	const BUFFER_SIZE = 8192;

	ensureFileExists(file);

	var buffer = new Buffer(BUFFER_SIZE);
	var index = 0;
	var lines = [];
	var fd = fs.openSync(file, 'r');

	try {
mainloop:
		while (true) {
			var readBytes = fs.readSync(fd, buffer, 0, BUFFER_SIZE, index);
			if (readBytes == 0) {
				break;
			}
			var lines = buffer.slice(0, readBytes).toString().split('\n');
			var backBytes = 0;
			if (lines.length > 1) {
				backBytes = lines.pop().length;
			}

			index += readBytes - backBytes;

			while (lines.length) {
				if (callback(lines.shift()) === true) {
					break mainloop;
				}
			}
		}
	}
	finally {
		fs.closeSync(fd);
	}
}

function ensureFileExists (file) {
	if (!fs.existsSync(file)) {
		throw new Error(
			`error: "${filename}" is not exist.\n` +
			`       please download any version of UCD.zip from http://www.unicode.org/Public/zipped/\n` +
			`       and extract into ${__dirname}/ucd/`
		);
	}
}

function getVersion () {
	return new Promise(function (resolve, reject) {
		var filename = `${__dirname}/ucd/ReadMe.txt`;
		ensureFileExists(filename);
		var version = awk(filename, /[0-9]+\.[0-9]+\.[0-9]/, (line, re) => re[0]);
		resolve(version.split('\n')[0]);
	});
}

function awk (file, pattern, handler) {
	if (!fs.existsSync(file)) {
		throw new Error(
			`error: "${file}" is not exist.\n` +
			`       please download any version of UCD.zip from http://www.unicode.org/Public/zipped/\n` +
			`       and extract into ${__dirname}/ucd/`);
	}

	var content = fs.readFileSync(file, 'utf8').split('\n');
	var result = [];
	var re;
	for (var i = 0, goal = content.length; i < goal; i++) {
		re = pattern.exec(content[i]);
		if (re) {
			result.push(handler(content[i], re));
		}
	}
	return result.join('\n');
}

function pad (s, p, w) {
	p || (p = '0');
	if (typeof s == 'string') {
		s = s.charCodeAt(0);
	}
	var leader = '0000';
	if (w == undefined) {
		w = 4;
	}
	if (p != '0' || w != leader.length) {
		leader = '';
		for (var i = 0; i < w; i++) {
			leader += p;
		}
	}
	var result = s.toString(16).toUpperCase();
	if (result.length < w) {
		result = (leader + result).substr(-w);
	}
	return result;
}

function toUTF16 (cp) {
	var p = (cp & 0x1f0000) >> 16;
	var o = cp & 0xffff;
	return p ?
		[
			0xd800 | ((p - 1) << 6) | ((o & 0xfc00) >> 10),
			0xdc00 | (o & 0x03ff)
		] :
		o;
}

exports.fgets = fgets;
exports.getVersion = getVersion;
exports.ensureFileExists = ensureFileExists;
exports.awk = awk;
exports.pad = pad;
exports.toUTF16 = toUTF16;
