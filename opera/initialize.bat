@echo off
mklink appsweets.png ..\chrome\appsweets.png
mklink background.html ..\chrome\background.html
mklink background.js ..\chrome\background.js
mklink beep.ogg ..\chrome\beep.ogg
mklink beep.ogg.txt ..\chrome\beep.ogg.txt
mklink consumer_keys.json ..\chrome\consumer_keys.json
mklink exports_init.js ..\chrome\exports_init.js
mklink icon016.png ..\chrome\icon016.png
mklink icon048.png ..\chrome\icon048.png
mklink icon128.png ..\chrome\icon128.png

mkdir includes
pushd includes
mklink extension_wrapper.js ..\..\chrome\extension_wrapper.js
mklink agent.js  ..\..\chrome\agent.js
mklink wasavi.js ..\..\chrome\wasavi.js
popd

mklink options.html ..\chrome\options.html
mklink options.js ..\chrome\options.js
mklink wasavi_frame.html ..\chrome\wasavi_frame.html
mklink wasavi_frame.js ..\chrome\wasavi_frame.js
mklink LICENSE ..\LICENSE
mklink NOTICE ..\NOTICE
mklink README.md.en ..\README.md.en
mklink README.md.ja ..\README.md.ja

echo "done."
