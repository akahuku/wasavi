#!/bin/php
<?php
$file_name = dirname(__FILE__) . "/unihan/Unihan_Readings.txt";
$out_file = dirname(__FILE__) . "/../chrome/unicode/fftt_han_ja.dat";
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
	$bits = array();
	for ($i = 65; $i <= 90; $i++) {
		$bits[$i] = 0;
	}

	while (($line = fgets($fp)) !== false) {
		$line = explode("\t", $line);
		if (count($line) != 3) continue;
		if ($line[1] != "kJapaneseOn" && $line[1] != "kJapaneseKun") continue;
		if (strlen($line[0]) != 6) break;

		$code_point = intval(substr($line[0], 2, 6), 16);
		if (!isset($data[$code_point])) {
			$data[$code_point] = 0;
		}

		foreach (explode(" ", $line[2]) as $r) {
			$r = ord($r[0]);
			if ($r < 65 || $r > 90) {
				echo "\n*** invalid code point: ", implode("\t", $line), "\n";
				break;
			}

			$data[$code_point] |= 1 << ($r - 65);
			$bits[$r]++;
		}

		$count++;
		if ($count % 100 == 0) {
			echo "\r", $count;
		}
	}

	fclose($fp);
	$fp = null;
	echo "\n";
}

function make_dict () {
	global $data;
	global $out_file;

	$fp = fopen($out_file, "wb");
	if (!$fp) {
		echo "cannot open: " . $out_file, "\n";
		exit(1);
	}

	ksort($data);
	$packmap = array();
	$bits = 0;
	for ($i = 0; $i < 26; $i++) {
		$packmap[sprintf("%02d_", $i)] = $i;
	}
	foreach ($data as $cp => $d) {
		$bits |= $d;
	}
	for ($i = 0, $mask = 1; $i < 26; $i++, $mask <<= 1) {
		if (!($bits & $mask)) {
			unset($packmap[sprintf("%02d_", $i)]);
			echo sprintf("// omitted: %s\n", chr(65 + $i));
		}
	}
	if (intval((count($packmap) + 7) / 8) > 3) {
		echo "data size too large.";
		exit(1);
	}
	$mask = 1;
	foreach ($packmap as $k => $v) {
		$packmap[$k] = $mask;
		$mask <<= 1;
	}
	echo "var packmap = {\n";
	$delimiter = " ";
	foreach ($packmap as $k => $v) {
		echo sprintf("\t%s0x%06x: '%s'\n", $delimiter, $v, chr(65 + intval($k, 10)));
		$delimiter = ",";
	}
	echo "};\n";
	foreach ($data as $cp => $d) {
		$dd = 0;
		for ($i = 0, $mask = 1; $i <= count($packmap); $i++, $mask <<= 1) {
			if ($d & $mask) {
				$dd |= $packmap[sprintf("%02d_", $i)];
			}
		}
		fwrite($fp, pack("vc*", $cp, $dd & 0xff, ($dd >> 8) & 0xff, ($dd >> 16) & 0xff));
	}

	fclose($fp);
	chmod($out_file, 0644);
	$fp = null;
	echo "\ndone.\n";
}

function make_html () {
	global $data;
	global $out_file;
	$fp = fopen($out_file . ".html", "wb");
	if (!$fp) {
		echo "cannot open: " . $out_file, "\n";
		exit(1);
	}

	fwrite($fp, "<!doctype html>\n");
	fwrite($fp, "<html>\n");
	fwrite($fp, "<head>\n");
	fwrite($fp, "	<style>\n");
	fwrite($fp, "		table {\n");
	fwrite($fp, "			font-size:xx-large;\n");
	fwrite($fp, "			font-weight:bold;\n");
	fwrite($fp, "			border-collapse:separate;\n");
	fwrite($fp, "		}\n");
	fwrite($fp, "		th {\n");
	fwrite($fp, "			text-align:center;\n");
	fwrite($fp, "			background-color:#ccc;\n");
	fwrite($fp, "			padding:0 8px 0 8px;\n");
	fwrite($fp, "		}\n");
	fwrite($fp, "		td {\n");
	fwrite($fp, "			text-align:center;\n");
	fwrite($fp, "			background-color:#eee;\n");
	fwrite($fp, "		}\n");
	fwrite($fp, "		th small, td small {\n");
	fwrite($fp, "			font-weight:normal;\n");
	fwrite($fp, "			font-size:small;\n");
	fwrite($fp, "		}\n");
	fwrite($fp, "	</style>\n");
	fwrite($fp, "</head>\n");
	fwrite($fp, "<body>\n");
	fwrite($fp, "<table>\n");
	fwrite($fp, "<tr><th>source</th><th>readings</th></tr>\n");

	foreach ($data as $cp => $d) {
		$tmp = array();
		for ($i = 0, $mask = 1; $i <= 32; $i++, $mask <<= 1) {
			if ($d & $mask) {
				$tmp[] = chr(97 + $i);
			}
		}
		fwrite($fp, sprintf("<tr><th>&#x%04X;<br><small>U+%04X</small></th>", $cp, $cp));
		fwrite($fp, sprintf("<td>%s</td>\n", implode(", ", $tmp)));
	}

	fwrite($fp, "</table></body></html>");

	fclose($fp);
	$fp = null;
}

setup();
//make_html();
make_dict();

// vim:set ts=4 sw=4 fenc=UTF-8 ff=unix ft=php fdm=marker :
