#!/usr/bin/php
<?php
$file_name = dirname(__FILE__) . "/ucd/Scripts.txt";

$data = array();

function setup () {
	global $file_name;
	global $data;

	$fp = @fopen($file_name, "rb");
	if (!$fp) {
		fwrite(STDERR, "cannot open: $file_name\n");
		exit(1);
	}

	$count = 0;
	while (($line = fgets($fp)) !== false) {
		$line = rtrim($line);
		if ($line == "") continue;
		if (preg_match('/^\s*#/', $line)) continue;

		if (preg_match('/^([0-9A-F]+)(\\.\\.([0-9A-F]+))?\\s*;\\s*([^ #]+)\\s*#\\s*(..)/', $line, $re)) {
			$low = intval($re[1], 16);
			$high = $re[2] == "" ? $low : intval($re[3], 16);
			$script_name = $re[4];
			$prop_val = $re[5];

			if ($low >= 0x10000) continue;
		}

		for ($i = $low; $i <= $high; $i++) {
			$data[$i] = array($script_name, $prop_val);
		}

		$count++;
	}

	fclose($fp);

	ksort($data);
}

function output_regex ($include, $exclude, $var_name) {
	global $data;

	$nonletters = array();
	$last = -1;
	foreach ($data as $cp => $d) {
		if ($include != "" && !preg_match("/" . $include . "/", $d[1])) continue;
		if ($exclude != "" && preg_match("/" . $exclude . "/", $d[1])) continue;

		if ($last < 0) {
			$nonletters[] = array($d[0], $d[1], $cp, $cp);
			$last = count($nonletters) - 1;
		}
		else {
			if ($cp == $nonletters[$last][3] + 1) {
				$nonletters[$last][3] = $cp;
			}
			else {
				$nonletters[] = array($d[0], $d[1], $cp, $cp);
				$last = count($nonletters) - 1;
			}
		}
	}

	$codes = array();
	if ($include != "") {
		$codes[] = "// [$include] of General Category in Scripts.txt of Unicode 6.2.0";
	}
	elseif ($exclude != "") {
		$codes[] = "// [^$exclude] of General Category in Scripts.txt of Unicode 6.2.0";
	}
	$codes[] = "/*const*/var $var_name = new RegExp('[' + [";
	$code = "    '";
	foreach ($nonletters as $d) {
		switch ($d[3] - $d[2]) {
		case 0:
			$code .= sprintf("\\\\u%04x", $d[2]);
			break;
		case 1:
			$code .= sprintf("\\\\u%04x\\\\u%04x", $d[2], $d[3]);
			break;
		default:
			$code .= sprintf("\\\\u%04x-\\\\u%04x", $d[2], $d[3]);
			break;
		}
		if (strlen($code) >= 90) {
			$code .= "',";
			$code = preg_replace('/^    /', "\t", $code);
			$codes[] = $code;
			$code = "    '";
		}
	}
	$codes[count($codes) - 1] = preg_replace('/,$/', "", $codes[count($codes) - 1]);
	$codes[] = "].join('') + ']');";
	echo implode("\n", $codes);
	echo "\n";
	echo "\n";
}

function output_scripts () {
	global $data;

	$scripts = array();
	$script_ids = array();
	$last = -1;
	foreach ($data as $cp => $d) {
		if ($last < 0) {
			$scripts[] = array($d[0], $d[1], $cp, $cp);
			$last = count($scripts) - 1;
		}
		else {
			if ($d[0] == $scripts[$last][0]) {
				$scripts[$last][3] = $cp;
			}
			else {
				$scripts[] = array($d[0], $d[1], $cp, $cp);
				$last = count($scripts) - 1;
			}
		}
		if (!isset($script_ids[$d[0]])) {
			$script_ids[$d[0]] = count($script_ids);
		}
	}

	$codes = array();
	$codes[] = "// Scripts of Unicode 6.2.0";
	$codes[] = "/*const*/var SCRIPT_TABLE = {";
	foreach ($scripts as $d) {
		$codes[] = sprintf("    0x%04x, 0x%04x, %2d, // %s", $d[2], $d[3], $script_ids[$d[0]], $d[0]);
	}
	$codes[count($codes) - 1] = preg_replace('/,( \/\/)/', " $1", $codes[count($codes) - 1]);
	$codes[] = "};";
	echo implode("\n", $codes);
	echo "\n";
	echo "\n";
}

setup();
output_regex("", "[ZLN].", "REGEX_NON_LETTER");
output_scripts();
