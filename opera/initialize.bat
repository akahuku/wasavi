@echo off
mklink appsweets.png      ..\chrome\appsweets.png
mklink background.html    ..\chrome\background.html
mklink background.js      ..\chrome\background.js
mklink beep.ogg           ..\chrome\beep.ogg
mklink beep.ogg.txt       ..\chrome\beep.ogg.txt
mklink consumer_keys.json ..\chrome\consumer_keys.json
mklink exports_init.js    ..\chrome\exports_init.js
mklink icon016.png        ..\chrome\icon016.png
mklink icon048.png        ..\chrome\icon048.png
mklink icon128.png        ..\chrome\icon128.png
mklink /d libs            ..\chrome\libs
mklink /d unicode         ..\chrome\unicode

mkdir locales
pushd locales
mklink en-us ..\..\chrome\_locales\en_US
mklink ja    ..\..\chrome\_locales\ja
mklink locales.json ..\..\chrome\locales.json
popd

mkdir includes
pushd includes
mklink 001_extension_wrapper.js ..\..\chrome\frontend\extension_wrapper.js
mklink 010_init.js              ..\..\chrome\frontend\init.js
mklink 020_utils.js             ..\..\chrome\frontend\utils.js
mklink 021_unicode_utils.js     ..\..\chrome\frontend\unicode_utils.js
mklink 030_classes.js           ..\..\chrome\frontend\classes.js
mklink 040_classes_ex.js        ..\..\chrome\frontend\classes_ex.js
mklink 050_classes_undo.js      ..\..\chrome\frontend\classes_undo.js
mklink 060_classes_subst.js     ..\..\chrome\frontend\classes_subst.js
mklink 070_classes_search.js    ..\..\chrome\frontend\classes_search.js
mklink 080_classes_ui.js        ..\..\chrome\frontend\classes_ui.js
mklink agent.js                 ..\..\chrome\frontend\agent.js
mklink wasavi.js                ..\..\chrome\frontend\wasavi.js
popd

mklink options.html ..\chrome\options.html
mklink options.js ..\chrome\options.js
mklink wasavi_frame.html ..\chrome\wasavi_frame.html
mklink LICENSE ..\LICENSE
mklink NOTICE ..\NOTICE
mklink README.md.en ..\README.md.en
mklink README.md.ja ..\README.md.ja

echo "done."
