#!/bin/sh

mkdir -p data
pushd data
ln -s ../../chrome/agent.js
ln -s ../../chrome/appsweets.png
ln -s ../../chrome/beep.ogg.txt
ln -s ../../chrome/consumer_keys.json
ln -s ../../chrome/extension_wrapper.js
ln -s ../../chrome/icon016.png
ln -s ../../chrome/icon048.png
ln -s ../../chrome/icon128.png
ln -s ../../chrome/options.html
ln -s ../../chrome/options.js
ln -s ../../chrome/wasavi.js
ln -s ../../chrome/wasavi_frame.html
ln -s ../../chrome/wasavi_frame.js

mkdir -p xlocale
pushd xlocale
ln -s ../../../chrome/_locales/locales.json
ln -s ../../../chrome/_locales/en_US en-us
ln -s ../../../chrome/_locales/ja
popd

popd


mkdir -p lib
pushd lib
ln -s ../../chrome/libs/blowfish/blowfish.js
ln -s ../../chrome/libs/jsOAuth/jsOAuth.js
ln -s ../../chrome/background.js main.js
ln -s ../../chrome/libs/sha1/sha1.js
popd

ln -s ../LICENSE
ln -s ../NOTICE
ln -s ../README.md.en
ln -s ../README.md.ja

echo "done."
