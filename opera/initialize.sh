#!/bin/sh
ln -s ../appsweets.png
ln -s ../background.html
ln -s ../background.js
ln -s ../beep.ogg
ln -s ../beep.ogg.txt
ln -s ../consumer_keys.json
ln -s ../exports_init.js
ln -s ../icon016.png
ln -s ../icon048.png
ln -s ../icon128.png

mkdir -p includes
pushd includes
ln -s ../../extension_wrapper.js 001_extension_wrapper.js
ln -s ../../agent.js
ln -s ../../wasavi.js
popd

ln -s ../LICENSE
ln -s ../NOTICE
ln -s ../options.html
ln -s ../options.js
ln -s ../README.md.en
ln -s ../README.md.ja
ln -s ../wasavi_frame.html
ln -s ../wasavi_frame.js

echo "done."