#!/bin/sh

mkdir -p data
pushd data
ln -s ../../agent.js
ln -s ../../appsweets.png
ln -s ../../beep.ogg.txt
ln -s ../../consumer_keys.json
ln -s ../../extension_wrapper.js
ln -s ../../icon016.png
ln -s ../../icon048.png
ln -s ../../icon128.png
ln -s ../../options.html
ln -s ../../options.js
ln -s ../../wasavi.js
ln -s ../../wasavi_frame.html
ln -s ../../wasavi_frame.js

mkdir -p xlocale
pushd xlocale
ln -s ../../../_locales/locales.json
popd

popd


mkdir -p lib
pushd lib
ln -s ../../libs/blowfish/blowfish.js
ln -s ../../libs/jsOAuth/jsOAuth.js
ln -s ../../background.js main.js
ln -s ../../libs/sha1/sha1.js
popd

ln -s ../LICENSE
ln -s ../NOTICE
ln -s ../README.md.en
ln -s ../README.md.ja

echo "done."