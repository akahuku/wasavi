@echo off
mklink appsweets.png ..\appsweets.png
mklink background.html ..\background.html
mklink background.js ..\background.js
mklink beep.ogg ..\beep.ogg
mklink beep.ogg.txt ..\beep.ogg.txt
mklink consumer_keys.json ..\consumer_keys.json
mklink exports_init.js ..\exports_init.js
mklink icon016.png ..\icon016.png
mklink icon048.png ..\icon048.png
mklink icon128.png ..\icon128.png

mkdir includes
pushd includes
mklink extension_wrapper.js ..\..\extension_wrapper.js
mklink agent.js ..\..\agent.js
mklink wasavi.js ..\..\wasavi.js
popd

mklink LICENSE ..\LICENSE
mklink NOTICE ..\NOTICE
mklink options.html ..\options.html
mklink options.js ..\options.js
mklink README.md.en ..\README.md.en
mklink README.md.ja ..\README.md.ja
mklink wasavi_frame.html ..\wasavi_frame.html
mklink wasavi_frame.js ..\wasavi_frame.js

echo "done."