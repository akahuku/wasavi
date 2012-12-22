(function () {
	function ensureBinaryString (data) {
		var buffer = [];
		for (var i = 0, goal = data.length; i < goal; i++) {
			buffer[i] = data.charCodeAt(i) & 0xff;
		}
		return String.fromCharCode.apply(null, buffer);
	}

	function loadDict () {
		var xhr = new XMLHttpRequest;
		xhr.open('GET', '../chrome/unicode/linebreak.dat', true);
		xhr.overrideMimeType('text/plain;charset=x-user-defined');
		xhr.onload = function () {
			var content = ensureBinaryString(xhr.responseText);
			xhr = null;
			loadTestData(content);
		};
		xhr.onerror = function () {
			xhr = null;
			test('failed', function () {
				ok(false, 'failed to load dictionary data');
			});
		};
		xhr.send(null);
	}

	function loadTestData (dict) {
		var xhr = new XMLHttpRequest;
		xhr.open('GET', 'LineBreakTest.txt', true);
		xhr.overrideMimeType('text/plain;charset=UTF-8');
		xhr.onload = function () {
			var content = xhr.responseText;
			xhr = null;
			doTest(dict, content);
		};
		xhr.onerror = function () {
			xhr = null;
			test('failed', function () {
				ok(false, 'failed to load test data');
			});
		};
		xhr.send(null);
	}

	function doTest (dictData, testData) {
		function toUTF16(cp) {
			var p = (cp & 0x1f0000) >> 16;
			var o = cp & 0xffff;
			return p ?
				String.fromCharCode(0xd800 | ((p - 1) << 6) | ((o & 0xfc00) >> 10)) +
				String.fromCharCode(0xdc00 | (o & 0x03ff))
				:
				String.fromCharCode(o);
		}

		var count = 0;
		var countLimit = -1;
		var lineBreaker = new unicodeUtils.LineBreaker(dictData);

		testData.split('\n').forEach(function (line) {
			var comment = /#(.*)$/.exec(line);
			line = line.replace(/#.*$/, '').replace(/^\s+|\s+$/g, '');
			if (line == '') return;

			count++;

			//
			if (countLimit > 0 && count > countLimit) return;

			//
			var s = '';
			var codePointCount = 0;
			var rules = [];
			line.split(/\s+/).forEach(function (node) {
				if (/^[0-9a-fA-F]+$/.test(node)) {
					s += toUTF16(parseInt(node, 16));
					codePointCount++;
				}
				else {
					switch (node.charCodeAt(0)) {
					case 0x00d7://prohibited
						rules.push(false);
						break;
					case 0x00f7://allowed
						rules.push(true);
						break;
					}
				}
			});

			//
			test('test #' + count + ' (' + line + ')', (function (count, codePointCount, s, rules) {
				return function () {
					equal(codePointCount, rules.length - 1);

					var lb = lineBreaker.run(s);
					if (!lb || !('length' in lb)) {
						ok(false, 'invalid line break info');
						return;
					}

					/*
					console.log(
						'test #' + count + ', line: "' + line + '", "' + s + '"\n' +
						JSON.stringify(lb, null, ' ')
					);
					*/

					equal(lb.length, rules.length - 1, 'test line break info count');

					for (var i = 0, goal = lb.length; i < goal; i++) {
						strictEqual(
							unicodeUtils.canBreak(lb[i].breakAction),
							rules[i + 1],
							'index ' + i);
					}
				}
			})(count, codePointCount, s, rules));
		});
	}

	loadDict();
})();

// vim:set ts=4 sw=4 fenc=UTF-8 ff=unix ft=javascript fdm=marker :
