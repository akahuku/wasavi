#!/usr/bin/php
<?php
/*
 * fftt general dictionary generator
 * =================================
 *
 * fftt general dictionary is the key-value map to specify some unicode-bmp-range
 * characters by simple latin1 character in the FfTt commands.
 *
 * dictionary format:
 *
 *   <unicode-range character code point (2bytes, little endian)> <latin1 substitute (1byte)>
 *                       :                                                     :
 *   <unicode-range character code point (2bytes, little endian)> <latin1 substitute (1byte)>
 *
 *   note: code point order must be sorted.
 */

define('UCD_FILE_NAME', dirname(__FILE__) . "/ucd/UnicodeData.txt");
define('OUT_BIN_FILE', dirname(__FILE__) . "/../chrome/unicode/fftt_general.dat");
define('OUT_HTML_FILE', "decomp-result.html");

$UNICODE_SPACES = [
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

$decomposition_data = array();

function setup () {
	global $UNICODE_SPACES;
	global $decomposition_data;

	$fp = fopen(UCD_FILE_NAME, "rb");
	if (!$fp) {
		echo "cannot open: ", UCD_FILE_NAME, "\n";
		exit(1);
	}

	$count = 0;
	while (($line = fgets($fp)) !== false) {
		$line = split(";", $line);
		if (strlen($line[0]) != 4) {
			break;
		}

		$cp = intval($line[0], 16);

		/*
		 * override decomposition data with the first letter of alphabetical reading of kana
		 */

		// hiragana
		if ($cp >= 0x3040 && $cp <= 0x309f) {
			if (preg_match('/^HIRAGANA LETTER (SMALL )?([A-Z])/', $line[1], $re)) {
				$line[5] = sprintf("%04X", ord(strtolower($re[2])));
			}
		}
		// katakana
		elseif ($cp >= 0x30a0 && $cp <= 0x30ff) {
			if (preg_match('/^KATAKANA LETTER (SMALL )?([A-Z])/', $line[1], $re)) {
				$line[5] = sprintf("%04X", ord(strtolower($re[2])));
			}
		}

		/*
		 * store decomposition data
		 */

		if ($line[5] != "") {
			$decomposition_data[$cp] = array_map(function ($a) {
				if ($a[0] == "<") return $a;
				return intval($a, 16);
			}, split(" ", $line[5]));
		}

		$count++;
		if ($count % 100 == 0) {
			echo "\r", $line[0];
		}
	}

	fclose($fp);
	$fp = null;
	echo "\n";

	/*
	 * another overrides
	 */

	// unicode spaces -> U+0020 SPACE
	foreach ($UNICODE_SPACES as $cp) {
		$decomposition_data[$cp] = [0x20];
	}

	// U+3001 IDEOGRAPHIC COMMA -> U+002C COMMA
	$decomposition_data[0x3001] = [0x2C];

	// U+3002 IDEOGRAPHIC FULL STOP -> U+002E FULL STOP
	$decomposition_data[0x3002] = [0x2E];
}

function get_decomposition_first ($cp, $nest) {
	global $UNICODE_SPACES;
	global $decomposition_data;

	if (!isset($decomposition_data[$cp])) {
		return -1;
	}

	/*
	 * recursive sample: ǻ(U+01FB) ; å(U+00E5) ́(U+0301)
	 *                               å(U+00E5) ; a(U+0061) ̊(U+030A)
	 *
	 * parenthesis sample: ⒜(U+249C) ; <compat> ((U+0028) a(U+0061) )(U+0029)
	 */

	$decomp = $decomposition_data[$cp];
	$decomp_tag = "";
	$index = 0;

	// remove decomposition tag, if exists
	if (is_string($decomp[0])) {
		$decomp_tag = array_shift($decomp);
	}

	// if decomposition is surrounded by parenthesis, remove paren
	if (count($decomp) >= 2 && $decomp[0] == 0x0028 && $decomp[count($decomp) - 1] == 0x0029) {
		array_shift($decomp);
		array_pop($decomp);
	}

	// make recursion resolved array
	for ($i = 0, $goal = count($decomp); $i < $goal; $i++) {
		$result = get_decomposition_first($decomp[$i], $nest + 1);
		if ($result == -1) {
			$result = $decomp[$i];
		}
		if ($result == 0x0020 && in_array($cp, $UNICODE_SPACES)) {
			return $result;
		}
		if ($result >= 0x0021 && $result <= 0x007e) {
			return $cp == $result ? -1 : $result;
		}
	}

	return -1;
}

function make_dict ($is_html = false) {
	global $decomposition_data;

	if ($is_html) {
		$file_name = OUT_HTML_FILE;
		$header = <<<_EOH_
<!doctype html>
<html>
<head>
<meta charset="UTF-8">
<title>fftt general dictionary</title>
</head>
<body>
<pre>

_EOH_;
		$footer = "</pre></body></html>";
	}
	else {
		$file_name = OUT_BIN_FILE;
		$header = "";
		$footer = "";
	}

	$fp = fopen($file_name, "wb");
	if (!$fp) {
		echo "cannot open: ", $file_name, "\n";
		exit(1);
	}

	$count = 0;
	fwrite($fp, $header);
	for ($cp = 0; $cp < 0x10000; $cp++) {
		$result = get_decomposition_first($cp, 0);
		if ($result >= 0) {
			if ($is_html) {
				fwrite($fp, sprintf("&#x%x;(U+%04X) ; %s(U+%04X)\n", $cp, $cp, chr($result), $result));
			}
			else {
				fwrite($fp, pack("vc", $cp, $result));
			}
			$count++;
		}

		if ($count % 100 == 0) {
			echo "\r", sprintf("%04X", $cp);
		}
	}
	fwrite($fp, $footer);

	fclose($fp);
	chmod($file_name, 0644);
	$fp = null;

	echo "\n";
	echo $count, " codepoints are generated into $file_name.\n";
}

setup();
make_dict();

// vim:set ts=4 sw=4 fenc=UTF-8 ff=unix ft=php fdm=marker :
