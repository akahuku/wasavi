#!/bin/php
<?php
$file_name = dirname(__FILE__) . "/ucd/LineBreak.txt";
$out_file = dirname(__FILE__) . "/../chrome/unicode/linebreak.dat";
$out_js = dirname(__FILE__) . "/../chrome/frontend/linebreak.js";

$data = array();
$props = array(
	"OP" => 0,		// Open Punctuation (XA)
	"CL" => 1,		// Close Punctuation (XB)
	"CP" => 2,		// Closing Parenthesis (XB)
	"QU" => 3,		// Quotation (XB/XA)
	"GL" => 4,		// Non-breaking ("Glue") (XB/XA) (Non-tailorable)
	"NS" => 5,		// Nonstarters (XB)
	"EX" => 6,		// Exclamation/Interrogation (XB)
	"SY" => 7,		// Symbols Allowing Break After (A)
	"IS" => 8,		// Infix Numeric Separator (XB)
	"PR" => 9,		// Prefix Numeric (XA)
	"PO" => 10,		// Postfix Numeric (XB)
	"NU" => 11,		// Numeric (XP)
	"AL" => 12,		// Ordinaty Alphabetic and Symbol characters (XP)
	"HL" => 13,		// Hebrew Letter (XB)
	"ID" => 14,		// Ideographic (B/A)
	"IN" => 15,		// Inseparable Characters (XP)
	"HY" => 16,		// Hyphen (XA)
	"BA" => 17,		// Break After (A)
	"BB" => 18,		// Break Before (B)
	"B2" => 19,		// Break Oppotunity Before and After (B/A/XP)
	"ZW" => 20,		// Zero Width Space (A) (Non-tailorable)
	"CM" => 21,		// Combining Mark (XB) (Non-tailorable)
	"WJ" => 22,		// Word Joiner (XB/XA) (Non-tailorable)
	"H2" => 23,		// Hangul LV Syllable (B/A)
	"H3" => 24,		// Hangul LVT syllable (B/A)
	"JL" => 25,		// Hangul L Jamo (B)
	"JV" => 26,		// Hangul V Jamo (XA/XB)
	"JT" => 27,		// Hangul T Jamo (A)
	"RI" => 28,		// Regional Indicator (B/A/XP)

	"BK" => 245,	// Mandatory Break (A) (Non-tailorable)
	"CR" => 246,	// Carriage Return (A) (Non-tailorable)
	"LF" => 247,	// Line Feed (A) (Non-tailorable)
	"SG" => 248,	// Surrogate (XP) (Non-tailorable)
	"CB" => 249,	// Contingent Break Oppotunity (B/A)
	"SP" => 250,	// Space (A) (Non-tailorable)
	"NL" => 251,	// Next Line (A) (Non-tailorable)
	"SA" => 252,	// Complex-Context Dependent (South East Asian) (P)
	"AI" => 253,	// Ambiguous (Alphabetic or Ideograph)
	"CJ" => 254,	// Conditional Japanese Starter

	"XX" => 255		// Unknown (XP)
);

function disp ($index = -1) {
	global $data;
	if (count($data) == 0) return;
	if ($index == -1) {
		$item = $data[count($data) - 1];
	}
	else {
		$item = $data[$index];
	}
	echo sprintf("U+%06X - U+%06X: %02d\n", $item[0], $item[1], $item[2]);
}

function setup () {
	global $file_name;
	global $data;
	global $props;

	$fp = fopen($file_name, "rb");
	if (!$fp) {
		echo "cannot open: " . $file_name, "\n";
		exit(1);
	}

	echo "reading...\n";
	$count = 0;
	$start_cp = 0;
	$start_prop = "";
	$prev_cp = 0;
	while (($line = fgets($fp)) !== false) {
		$comment_index = strpos($line, "#");
		if ($comment_index !== false) {
			$line = substr($line, 0, $comment_index);
		}

		$line = trim($line);
		if ($line == "") continue;

		$line = explode(";", $line, 2);
		$cp = intval($line[0], 16);
		$prop = explode("#", $line[1], 2);
		$prop = trim($prop[0]);

		if (!isset($props[$prop])) {
			echo "\rUnknown prop: ", $prop, "\n in line ", $count, ": ", implode($line), "\n";
			exit(1);
		}
		if ($prop != $start_prop) {
			if ($start_prop != "") {
				$data[] = array($start_cp, $prev_cp, $props[$start_prop]);
			}

			$start_cp = $cp;
			$start_prop = $prop;
		}

		$range = strpos($line[0], "..");
		if ($range !== false) {
			$range = explode("..", $line[0]);
			$data[] = array(intval($range[0], 16), intval($range[1], 16), $props[$prop]);
			$start_cp = 0;
			$start_prop = "";
		}

		$count++;
		$prev_cp = $cp;
		if ($count % 100 == 0) {
			echo sprintf("\r%-10s", $line[0]);
		}
	}

	if ($start_prop != "") {
		$data[] = array($start_cp, $cp, $props[$start_prop]);
	}

	fclose($fp);
	$fp = null;
	echo "\rdone: ", count($data), " item(s).\n";
}

function make_dict () {
	global $data;
	global $out_file;

	$fp = fopen($out_file, "wb");
	if (!$fp) {
		echo "cannot open: ", $out_file, "\n";
		exit(1);
	}

	echo "generating data...\n";
	$count = 0;
	foreach ($data as $d) {
		fwrite($fp, pack("C*",
			($d[0]      ) & 0xff,
			($d[0] >>  8) & 0xff,
			($d[0] >> 16) & 0xff,
			($d[1]      ) & 0xff,
			($d[1] >>  8) & 0xff,
			($d[1] >> 16) & 0xff,
			$d[2]));

		$count++;
		if ($count % 100 == 0) {
			echo sprintf("\r%3d%%", intval($count / count($data) * 100));
		}
	}

	fclose($fp);
	chmod($out_file, 0644);
	$fp = null;
	echo "\rdone: ", $count, " item(s).\n";
}

function make_js () {
	global $data;
	global $out_js;
	global $props;

	$fp = fopen($out_js, "wb");
	if (!$fp) {
		echo "cannot open: ", $out_js, "\n";
		exit(1);
	}

	echo "generating js...\n";
	fwrite($fp, "/*const*/var LINEBREAK = {\n");
	$delimiter = "";
	foreach ($props as $prop => $offset) {
		fwrite($fp, sprintf("\t'%s': %d", $prop, $offset));
		if ($prop != "XX") {
			fwrite($fp, ",");
		}
		fwrite($fp, "\n");
	}
	fwrite($fp, "};\n");

	fclose($fp);
	chmod($out_js, 0644);
	$fp = null;
	echo "\rdone.\n";
}

setup();
make_dict();
make_js();

// vim:set ts=4 sw=4 fenc=UTF-8 ff=unix ft=php fdm=marker :
