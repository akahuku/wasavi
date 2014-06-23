#!/bin/sh
mkdir -p locales
cd locales
  ln -s ../../chrome/_locales/locales.json
  ln -s ../../chrome/_locales/en_US en-us
  ln -s ../../chrome/_locales/ja
cd ..
ln -s ../../LICENSE
ln -s ../chrome/scripts/
mkdir -p includes
cd includes
  ln -s ../../chrome/frontend/extension_wrapper.js 001_extension_wrapper.js
  ln -s ../../chrome/frontend/init.js 010_init.js
  ln -s ../../chrome/frontend/utils.js 020_utils.js
  ln -s ../../chrome/frontend/classes_ex.js 040_classes_ex.js
  ln -s ../../chrome/frontend/unicode_utils.js 021_unicode_utils.js
  ln -s ../../chrome/frontend/classes_search.js 070_classes_search.js
  ln -s ../../chrome/frontend/wasavi.js
  ln -s ../../chrome/frontend/classes_subst.js 060_classes_subst.js
  ln -s ../../chrome/frontend/classes_ui.js 080_classes_ui.js
  ln -s ../../chrome/frontend/classes.js 030_classes.js
  ln -s ../../chrome/frontend/classes_undo.js 050_classes_undo.js
  ln -s ../../chrome/frontend/agent.js
cd ..
ln -s ../chrome/sounds/
ln -s ../chrome/consumer_keys.json
ln -s ../chrome/images/
ln -s ../../NOTICE
ln -s ../chrome/wasavi_frame.html
ln -s ../chrome/backend/
ln -s ../chrome/unicode
ln -s ../../README.md
ln -s ../chrome/options.html