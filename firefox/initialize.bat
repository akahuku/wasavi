@echo off

mkdir data
pushd data
mklink agent.js ..\..\agent.js
mklink appsweets.png ..\..\appsweets.png
mklink beep.ogg.txt ..\..\beep.ogg.txt
mklink consumer_keys.json ..\..\consumer_keys.json
mklink extension_wrapper.js ..\..\extension_wrapper.js
mklink icon016.png ..\..\icon016.png
mklink icon048.png ..\..\icon048.png
mklink icon128.png ..\..\icon128.png
mklink options.html ..\..\options.html
mklink options.js ..\..\options.js
mklink wasavi.js ..\..\wasavi.js
mklink wasavi_frame.html ..\..\wasavi_frame.html
mklink wasavi_frame.js ..\..\wasavi_frame.js

mkdir xlocale
pushd xlocale
mklink locales.json ..\..\..\_locales\locales.json
popd

popd


mkdir lib
pushd lib
mklink blowfish.js ..\..\libs\blowfish\blowfish.js
mklink jsOAuth.js ..\..\libs\jsOAuth\jsOAuth.js
mklink background.js ..\..\background.js
mklink sha1.js ..\..\libs\sha1\sha1.js
popd

mklink LICENSE ..\LICENSE
mklink NOTICE ..\NOTICE
mklink README.md.en ..\README.md.en
mklink README.md.ja ..\README.md.ja

echo "done."