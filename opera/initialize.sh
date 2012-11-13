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
ln -s ../../chrome/frontend/extension_wrapper.js 001_extension_wrapper.js
ln -s ../../chrome/frontend/init.js              010_init.js
ln -s ../../chrome/frontend/utils.js             020_utils.js
ln -s ../../chrome/frontend/classes.js           030_classes.js
ln -s ../../chrome/frontend/classes_ex.js        040_classes_ex.js
ln -s ../../chrome/frontend/classes_undo.js      050_classes_undo.js
ln -s ../../chrome/frontend/classes_subst.js     060_classes_subst.js
ln -s ../../chrome/frontend/classes_search.js    070_classes_search.js
ln -s ../../chrome/frontend/classes_ui.js        080_classes_ui.js
ln -s ../../chrome/frontend/agent.js
ln -s ../../chrome/frontend/wasavi.js
popd

ln -s ../chrome/options.html
ln -s ../chrome/options.js
ln -s ../chrome/wasavi_frame.html
ln -s ../LICENSE
ln -s ../NOTICE
ln -s ../README.md.en
ln -s ../README.md.ja

echo "done."
