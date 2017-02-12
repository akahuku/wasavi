A description of binary files
=============================

This file describes the role and the source code location of binary files in
the wasavi extension package.

* src/chrome/consumer_keys.bin

  Blowfish-encrypted JSON file which contains an application key and a secret
  key of each account of Dropbox, Google Drive and Microsoft OneDrive.

  The content of this file is generated
  by <https://github.com/akahuku/brisket/blob/master/make-binkey.js>
  using <https://github.com/akahuku/wasavi/blob/master/src/chrome/consumer_keys.json.template> as a template.

* src/chrome/unicode/fftt_general.dat

  The key-value dictionary to extend f/F/t/T command of the vi editor.
  By referring to this file, for example, "fa" command can jump to "ä", "à",
  "á", "â" ... as well as "a".

  The content of this file is generated
  by <https://github.com/akahuku/wasavi/blob/master/src/unicode-tools/make-fftt-general-dict.php>.
  And this script uses [UnicodeData.txt](http://www.unicode.org/Public/UCD/latest/ucd/UnicodeData.txt).

* src/chrome/unicode/fftt_han_ja.dat

  Same role as fftt_general.dat, but this file contains pronunciation data of
  CJK Ideograph characters. These are a lot very much, so data is packed by
  special encoding.

  The content of this file is generated
  by <https://github.com/akahuku/wasavi/blob/master/src/unicode-tools/make-fftt-hanja-dict.php>.
  And this script uses Unihan_Readings.txt in [Unihan.zip](http://www.unicode.org/Public/UCD/latest/ucd/Unihan.zip).

* src/chrome/unicode/linebreak.dat

  Referred when auto-formatting the input line with the specification of
  Unicode Line Break Algorithm: <http://unicode.org/reports/tr14/>.

  The content of this file is generated
  by <https://github.com/akahuku/wasavi/blob/master/src/unicode-tools/make-linebreak-dict.php>.
  And this script uses [LineBreak.txt](http://www.unicode.org/Public/UCD/latest/ucd/LineBreak.txt).
