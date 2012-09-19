#!/bin/sh
ln -s ../chrome/appsweets.png
ln -s ../chrome/background.html
ln -s ../chrome/background.js
ln -s ../chrome/beep.ogg
ln -s ../chrome/beep.ogg.txt
ln -s ../chrome/consumer_keys.json
ln -s ../chrome/exports_init.js
ln -s ../chrome/icon016.png
ln -s ../chrome/icon048.png
ln -s ../chrome/icon128.png

mkdir -p includes
pushd includes
ln -s ../../chrome/extension_wrapper.js 001_extension_wrapper.js
ln -s ../../chrome/agent.js
ln -s ../../chrome/wasavi.js
popd

ln -s ../chrome/options.html
ln -s ../chrome/options.js
ln -s ../chrome/wasavi_frame.html
ln -s ../chrome/wasavi_frame.js
ln -s ../LICENSE
ln -s ../NOTICE
ln -s ../README.md.en
ln -s ../README.md.ja

echo "done."
