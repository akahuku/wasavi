#!/bin/php
<?php
$file_name = dirname(__FILE__) . "/ucd/UnicodeData.txt";
$out_file = dirname(__FILE__) . "/../chrome/unicode/fftt_general.dat";
$data = array();

function setup () {
	global $file_name;
	global $data;

	$fp = fopen($file_name, "rb");
	if (!$fp) {
		echo "cannot open: " . $file_name, "\n";
		exit(1);
	}

	$count = 0;
	while (($line = fgets($fp)) !== false) {
		$line = explode(";", $line);
		if (strlen($line[0]) != 4) {
			break;
		}

		$cp = intval($line[0], 16);
		$data[$cp] = $line[5];

		// hiragana
		if ($cp >= 0x3040 && $cp <= 0x309f) {
			if (preg_match('/^HIRAGANA LETTER (SMALL )?([A-Z])/', $line[1], $re)) {
				$data[$cp] = sprintf("%04X", ord(strtolower($re[2])));
			}
		}
		// katakana
		elseif ($cp >= 0x30a0 && $cp <= 0x30ff) {
			if (preg_match('/^KATAKANA LETTER (SMALL )?([A-Z])/', $line[1], $re)) {
				$data[$cp] = sprintf("%04X", ord(strtolower($re[2])));
			}
		}

		$count++;
		if ($count % 100 == 0) {
			echo "\r", $line[0];
		}
	}

	fclose($fp);
	$fp = null;
	echo "\n";
}

function get_decomposition_first ($cp) {
	global $data;

	$decomp = $data[$cp];
	if ($decomp == "") {
		return $cp;
	}

	$decomp = explode(" ", $decomp);
	$decomp_tag = "";
	$index = 0;

	if ($decomp[0][0] == "<") {
		$decomp_tag = array_shift($decomp);
	}
	if (count($decomp) > 1) {
		while ($index < count($decomp) && $decomp[$index] == "0020") {
			$index++;
		}
		if ($index >= count($decomp)) {
			return 0xffff;
		}
	}
	if ($decomp_tag == "<compat>") {
		// skip "("
		if ($decomp[0] == "0028" && count($decomp) >= 2) {
			$index++;
		}
	}

	return get_decomposition_first(intval($decomp[$index], 16));
}

function make_dict () {
	global $data;
	global $out_file;

	$fp = fopen($out_file, "wb");
	if (!$fp) {
		echo "cannot open: ", $out_file, "\n";
		exit(1);
	}

	ksort($data);
	foreach ($data as $cp => $decomp) {
		$result = get_decomposition_first($cp);
		if ($result >= 0x0020 && $result <= 0x007e && $cp != $result) {
			fwrite($fp, pack("vc", $cp, $result));
		}
	}

	fclose($fp);
	chmod($out_file, 0644);
	$fp = null;
	echo "\ndone.\n";
}

setup();
make_dict();

// vim:set ts=4 sw=4 fenc=UTF-8 ff=unix ft=php fdm=marker :
