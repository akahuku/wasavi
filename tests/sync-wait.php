<?php
header("Content-Type: text/plain");
$secs = 1;
if (isset($_GET["secs"]) && preg_match('/^\d+$/', $_GET["secs"])) {
    $secs = $_GET["secs"] - 0;
}
if ($secs > 60) {
    $secs = 60;
}
sleep($secs);
echo "$secs waited.";
