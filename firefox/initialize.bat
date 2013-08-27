@echo off

pushd data
mklink appsweets.png ..\..\chrome\appsweets.png
mklink beep.ogg.txt ..\..\chrome\beep.ogg.txt
mklink consumer_keys.json ..\..\chrome\consumer_keys.json
mklink /d unicode ..\..\chrome\unicode
mklink /d frontend ..\..\chrome\frontend
mklink icon016.png ..\..\chrome\icon016.png
mklink icon048.png ..\..\chrome\icon048.png
mklink icon128.png ..\..\chrome\icon128.png
mklink options.html ..\..\chrome\options.html
mklink options.js ..\..\chrome\options.js
mklink wasavi_frame.html ..\..\chrome\wasavi_frame_noscript.html

mkdir xlocale
pushd xlocale
mklink locales.json ..\..\..\chrome\_locales\locales.json
mklink /d en-us ..\..\..\chrome\_locales\en_US
mklink /d ja ..\..\..\chrome\_locales\ja
popd

popd


mkdir lib
pushd lib
mklink blowfish.js ..\..\chrome\libs\blowfish\blowfish.js
mklink jsOAuth.js ..\..\chrome\libs\jsOAuth\jsOAuth.js
mklink main.js ..\..\chrome\background.js
mklink sha1.js ..\..\chrome\libs\sha1\sha1.js
mklink WasaviUtils.js ..\..\chrome\libs\WasaviUtils\WasaviUtils.js
mklink ClipboardManager.js ..\..\chrome\libs\ClipboardManager.js
mklink ResourceLoader.js ..\..\chrome\libs\ResourceLoader.js
mklink TabWatcher.js ..\..\chrome\libs\TabWatcher.js
mklink FileSystem.js ..\..\chrome\libs\FileSystem.js
mklink RuntimeOverwriteSettings.js ..\..\chrome\libs\RuntimeOverwriteSettings.js
mklink SimilarityComputer.js ..\..\chrome\libs\SimilarityComputer.js
mklink StorageWrapper.js ..\..\chrome\libs\StorageWrapper.js
mklink Hotkey.js ..\..\chrome\libs\Hotkey.js
popd

mklink LICENSE ..\LICENSE
mklink NOTICE ..\NOTICE
mklink README.md.en ..\README.md.en
mklink README.md.ja ..\README.md.ja

echo "done."
