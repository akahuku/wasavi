#!/bin/sh
ln -s ../../LICENSE
mkdir -p data
cd data
  mkdir -p scripts
  mkdir -p sounds
  cd sounds
    ln -s ../../../chrome/sounds/beep.ogg
    ln -s ../../../chrome/sounds/beep.ogg.txt
    ln -s ../../../chrome/sounds/beep.mp3.txt
    ln -s ../../../chrome/sounds/beep.mp3
  cd ..
  ln -s ../../chrome/consumer_keys.json
  mkdir -p xlocale
  cd xlocale
    ln -s ../../../chrome/_locales/locales.json
    mkdir -p en-us
    cd en-us
      ln -s ../../../../chrome/_locales/en_US/messages.json
    cd ..
    mkdir -p ja
    cd ja
      ln -s ../../../../chrome/_locales/ja/messages.json
    cd ..
  cd ..
  mkdir -p images
  cd images
    ln -s ../../../chrome/images/icon016.png
    ln -s ../../../chrome/images/appsweets.png
    ln -s ../../../chrome/images/icon048.png
    ln -s ../../../chrome/images/icon128.png
  cd ..
  mkdir -p frontend
  cd frontend
    ln -s ../../../chrome/frontend/classes_undo.js
    ln -s ../../../chrome/frontend/classes_search.js
    ln -s ../../../chrome/frontend/init.js
    ln -s ../../../chrome/frontend/utils.js
    ln -s ../../../chrome/frontend/classes.js
    ln -s ../../../chrome/frontend/extension_wrapper.js
    ln -s ../../../chrome/frontend/unicode_utils.js
    ln -s ../../../chrome/frontend/wasavi.js
    ln -s ../../../chrome/frontend/classes_subst.js
    ln -s ../../../chrome/frontend/classes_ui.js
    ln -s ../../../chrome/frontend/agent.js
    ln -s ../../../chrome/frontend/classes_ex.js
  cd ..
  ln -s ../../chrome/wasavi_frame_noscript.html wasavi_frame.html
  mkdir -p unicode
  cd unicode
    ln -s ../../../chrome/unicode/fftt_general.dat
    ln -s ../../../chrome/unicode/fftt_han_ja.dat
    ln -s ../../../chrome/unicode/linebreak.dat
  cd ..
  ln -s ../../chrome/options.html
cd ..
ln -s ../../README.md.ja
mkdir -p locale
ln -s ../../NOTICE
ln -s ../../README.md.en
ln -s ../chrome/backend/lib