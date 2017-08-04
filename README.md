wasavi (VI editor for any web page)
====================================

wasavi is an extension for Chrome, Opera and Firefox. wasavi transforms TEXTAREA element of any page into a VI editor, so you can edit the text in VI.  wasavi supports almost all VI commands and some ex commands.

wasavi is under development. Any bug report or feature request is welcome.

And we also welcome a donation to continue development:

[![Donate](http://pledgie.com/campaigns/26501.png)](https://pledgie.com/campaigns/26501)
[![Flattr](http://api.flattr.com/button/flattr-badge-large.png)](https://flattr.com/submit/auto?user_id=akahuku&url=http://appsweets.net/wasavi/)

[日本語版のREADME](README-ja.md)

A Quick Walkthrough
====================

* Here is a native TEXTAREA.  Focus the TEXTAREA, and press `Ctrl+Enter` to launch wasavi

  ![launch, edit, quit of wasavi](http://appsweets.net/wasavi/image/0.7.733/wasavi.gif)

Salient Features
----------------

* wasavi supports some ex commands. This is the output of `:set all`

  ![set all](http://appsweets.net/wasavi/image/0.6.669/set-all.png)

* Vim's incremental search

  ![incremental search](http://appsweets.net/wasavi/image/0.6.669/isearch.png)

* [wasavi online app](https://wasavi.appsweets.net). Open this link on a browser that has wasavi extension. wasavi will launch automatically. Then you can read and write files at your Dropbox/Google Drive/OneDrive account or local files.

  ![stand alone](http://appsweets.net/wasavi/image/0.6.669/web-app.png)


How to install
==============

Currently, wasavi is available for following browsers only. Select your browser and click the link. Standard extension installation procedure of your browser will follow. These extensions are hosted at the addons store of their respective browser.

* [Google Chrome extension](https://chrome.google.com/webstore/detail/dgogifpkoilgiofhhhodbodcfgomelhe)

* [Opera addon](https://addons.opera.com/en/extensions/details/wasavi/)

* Firefox addon

Source code and latest development releases are hosted at [Github](https://github.com/akahuku/wasavi):

* [Latest and unstable version of wasavi for Chrome](https://github.com/akahuku/wasavi/raw/master/dist/wasavi.crx)

* [Latest and unstable version of wasavi for Blink Opera](https://github.com/akahuku/wasavi/raw/master/dist/wasavi.nex)

* [Latest and unstable version of wasavi for Firefox](https://github.com/akahuku/wasavi/raw/master/dist/wasavi.xpi)

### A note for Chrome users

Chrome has reserved some fundamental shortcuts, such as Ctrl+T, Ctrl+W and Ctrl+N. Although these keys cannot be used in wasavi, you can use Alt+T, Alt+W and Alt+N.



Frequently Asked Questions
==========================

## How to launch wasavi

Focus TEXTAREA and press `Ctrl+Enter`.

## How to quit wasavi

To quit wasavi press `ZZ` or `:q` or `:wq` or any other VI quit command.

## Which options are accepted by the `:set` command?

See [this table](https://github.com/akahuku/wasavi/wiki/All-Options-which-wasavi-recognizes).

Note: there are also options which are accepted but don't have any effect yet.

## How to modify initial settings:

Open preference wasavi extension (or enter `:options` on wasavi),
and edit "exrc" textbox.

## How to control beep

Add `set noerrorbells` to your exrc to disable beep sound.  If you prefer a visual bell, add `set visualbell` instead.

Also, a chime at wasavi startup can be disabled with `set nolaunchbell`.

The volume of any beeps can be controlled with `set bellvolume=N`.  Range of value N is 1 to 100.

## How to access local files

See [document](https://github.com/akahuku/wasavi/wiki/Local-access).

## How to use wasavi with Vimperator/Keysnail/VimFx on Firefox

### Vimperator

Put [wasavi_mediator.js](https://raw.github.com/akahuku/wasavi/master/src/mediators/vimperator/wasavi_mediator.js) in your Vimperator plugin directory, for example,  `~/.vimperator/plugin` or `%HOME%\vimperator\plugin`.

This plugin will control the pass-through mode of Vimperator according to the state of wasavi.

### Keysnail

Put [wasavi_mediator.ks.js](https://raw.github.com/akahuku/wasavi/master/src/mediators/keysnail/wasavi_mediator.ks.js) in your Keysnail plugin directory.

This plugin will control suspend mode of Keysnail according to the state of wasavi.

### VimFx

Latest VimFx recognizes wasavi as editable element.  While wasavi is running, VimFx suspends temporarily.

To use VimFx's key binding while wasavi is running, click outside area of wasavi or enter `:set esctoblur` and press `<esc>` in normal mode.  Then keyboard focus would be removed from wasavi, and you can use VimFx's key binding.

## How to use wasavi as an independent text editor

Install the wasavi extension and open the link to [wasavi online app](https://wasavi.appsweets.net). wasavi will start automatically. You can use ex commands `:read`, `:write`, `:edit` or `:file` to access your Dropbox/Google Drive/OneDrive files or local files. You will have to authorize wasavi via OAuth to access these storages.

## About automatic setting override

The `:set` commands which you input while wasavi is running are stored to extension's persistent storage, and those are regenerated when you launch wasavi next time.

This setting override mechanism works each independent URLs (max 30). If you think this is unnecessary, put `:set nooverride` in your exrc. Then overriding will be skipped.

## How to cooperate with Migemo

wasavi for Chrome can [Migemo](http://0xcc.net/migemo/) search.  Install [Migemo Server](https://chrome.google.com/webstore/detail/migemo-server-for-google/dfccgbheolnlopfmahkcjiefggclmadb), then input a special meta character `\M` in search query of `/` or `?` command.  If `\M` included in search query, these search commands are executed via migemo.

## I have noticed a bug

Please create an issue on [wasavi issue tracker](https://github.com/akahuku/wasavi/issues)

Tips and Tricks
===============

* to maximize the wasavi: `:set fullscreen` or `:set fs`
* to restore the wasavi: `:set nofullscreen` or `:set nofs`
* to change a color theme: `:set theme=blight` or `:set theme=charcoal` or `:set theme=matrix` or `:set theme=solarized` or `:set theme=solarized_dark`
* abbreviate syntax is
	+ `:abbreviate` displays all the abbreviations currently registered.
	+ `:abbreviate [clear]` clears all the abbreviations.
	+ `:abbreviate lhs` displays the abbreviation corresponding to lhs.
	+ `:abbreviate lhs rhs` registers a abbreviation which expands lhs to rhs.
	+ `:abbreviate [noremap] lhs rhs` also registers, but it is not effected remap mechanism.
* map syntax is
	+ `:map` displays all the mappings currently registered.
	+ `:map [clear]` clears all the mappings.
	+ `:map lhs rhs` registers a rule which translates lhs to rhs. Its translation is recursive. About syntax of key stroke descriptor like `<esc>` in the lhs and rhs, see [this page](https://github.com/akahuku/wasavi/wiki/Syntax-of-key-stroke-descriptor).
	+ `:map [noremap] lhs rhs` also registers, but it is non-recursive.
	+ `:map` targets the normal mode mappings. On the other hand,
	  `:map!` targets the insert mode. This is equivalent to vim's `:imap`.
	+ For more detailed information, see [Syntax of map command](https://github.com/akahuku/wasavi/wiki/Syntax-of-Map-command).
* `j` `k` `^` `$` moves cursor by physical row, on the other hand,
  `gj` `gk` `g^` `g$` moves by wrapped row. To swap the behavior: `:set jkdenotative`
* `f` `F` `t` `T` extension for Japanese: these commands recognizes reading (ro-ma ji
  expression) of hiragana, katakana, and kanji. For example, `fk` will place
  a cursor on 'か', 'カ', '漢' and so on.
* `f` `F` `t` `T` extension for Latin script: these commands recognizes the base alphabet
  of diacritical marked letter. For example, `fa` will place a cursor on
  'å', 'ä', 'à', 'â', 'ā' and so on. Also see [mapping table](https://github.com/akahuku/wasavi/wiki/Latin-1-alternative-presentation-in-f-F-t-T-command).
* use a online storage as file system:
	+ `:filesystem status` shows all file systems currently available.
	+ `:filesystem default` shows default file system. You can set default file system
	  via `:filesystem default dropbox` or `:filesystem default gdrive` or `:filesystem default onedrive`.
	+ `:filesystem reset` discards the access token for online storage.
	+ You can place the file system name at the head of a file name explicitly:
	  for instance, `:read dropbox:/hello.txt`.
* When you read from the register of A to Z, some registers returns special content:
	+ `B` register: user agent string
	+ `D` register: current date time string (formatted by using `datetime` option as template of strftime(3))
	+ `T` register: title string
	+ `U` register: URL string
	+ `W` register: version string of wasavi
* To return a setting to default state:
	+ `:set <option-name>&` or `:set <option-name>&default`
* To return all settings to default state:
	+ `:set all&` or `:set all&default`
* To return a setting to the state just after evaluation of exrc:
	+ `:set <option-name>&exrc`
* To return all settings to the state just after evaluation of exrc:
	+ `:set all&exrc`
* To submit a form automatically after writing text and closing wasavi:
	+ `:wqs`
	+ `:submit` (this can be shortened to `:sub` )



Commands implemented
====================

* [count] _operation_ [count] _motion_
* [count] _operation_ [count] _range-symbol_
* [count] _surround-operation_ [count] _motion_ _surround-string_
* [count] _surround-operation_ [count] _range-symbol_ _surround-string_
* [count] _de-surround-operation_ [count] _surround-identifier_
* [count] _re-surround-operation_ [count] _surround-identifier_ _surround-string_
* [count] _operation-alias_
* [count] _surround-operation-alias_ _surround-string_
* [count] _motion_
* [count] _scroll-command_
* [count] _edit-command_
* [count] `:` _ex-command_

Operations
----------

`c` `y` `d` `>` `<` `gq` `gu` `gU`

Operation Aliases
------------------

`cc` `yy` `dd` `>>` `<<` `C` `Y` `D` `gqq` `guu` `gUU` `yss` `ySS`

A counter can be inserted in front of the last 1 character.

Surround Operations
-------------------

* to surround: `ys` `yS`
* to remove a surround: `ds`
* to change a surround: `cs`

Motions
-------

`-` `+` `^` `<home>` `$` `<end>` `%` `|` `,` `;`
  `_` `/` `?` `'` `` ` `` `(` `)` `{` `}` `[[` `]]` `<enter>` `0`
  `j` `k` `h` `l` `^N` `^P` `^H`
  `<down>` `<up>` `<left>` `<right>` `<space>`
  `w` `W` `b` `B` `e` `E` `gg` `gj` `gk` `g^` `g$` `G` `H` `M` `L` `f` `F` `t` `T` `n` `N`

Range symbols (Vim text objects)
-------------------------------

* `a"` `a'` `` a` `` `a[` `a]` `a{` `a}` `aB` `a<` `a>` `a(` `a)` `ab` `aw` `aW` `ap` `as` `at`
* `i"` `i'` `` i` `` `i[` `i]` `i{` `i}` `iB` `i<` `i>` `i(` `i)` `ib` `iw` `iW` `ip` `is` `it`

Scroll commands
---------------

`^U` `^D` `^Y` `^E` `^B` `^F` `<pageup>` `<pagedown>` `z<enter>` `z.` `zz` `z-`

Edit commands
-------------

`x` `X` `<delete>` `p` `P` `J` `.` `u` `^R` `~` `^L` `^G` `ga` `gv` `m` `@` `q` `r` `R` `a` `A` `i` `I` `o` `O` `&` `s` `S` `v` `V` `ZZ` `gi` `^A` `^X`

ex commands
-----------

`abbreviate` `cd` `chdir` `copy` `delete` `edit` `file` `filesystem` `global` `join` `k` `map` `mark` `marks` `move` `options` `print` `put` `pwd` `quit` `read` `redo` `s` `&` `~` `set` `sort` `submit` `registers` `to` `unabbreviate` `undo` `unmap` `version` `v` `write` `wq` `wqs` `xit` `yank` `>` `<` `@` `*`

The addressing in ex command is fully supported:

* whole buffer: `%s/re/rep/`
* current line: `.p`
* the last line of buffer: `$p`
* absolute line number: `1,2p`
* relative line number: `+1,+2p`
* regal expression: `/re/p` `?re?p`
* mark referencing: `'a,'bp`

In addition to this wasavi also accepts offset, for example: `/re/+1p`.
Two addresses are usually connected by a `,`, wasavi also supports `;`.


Input mode commands
-------------------

* `^@` input the most recently input text, and exit input mode. this key stroke is actually `Ctrl+Space`.
* `^D` unshift. but if the last input character is `0` or `^`, delete all indentation
* `^H` delete a character
* `^R` paste register's content
* `^T` shift
* `^U` delete all the characters entered in the current input session
* `^V` literal input
* `^W` delete a word

Line input mode commands
------------------------

* `^A` move cursor to top of line
* `^B` back
* `^E` move cursor to end of line
* `^F` forward
* `^H` delete a character
* `^N` next history
* `^P` previous history
* `^R` paste register's content
* `^U` delete whole line
* `^V` literal input
* `^W` delete a word
* `tab` complete ex command name, set option name, file name argument of read/edit/write/file

Bound mode commands
------------------------

Bound mode is similar to vim's visual mode.

* `c` delete the bound, and switch to insert mode
* `d` delete the bound
* `y` yank the bound
* `<` unshift the bound
* `>` shift the bound
* `C` delete the line-wise bound, and switch to insert mode
* `S` surround the bound
* `R` same as `C`
* `D` delete the line-wise bound
* `X` same as `D`
* `Y` yank the line-wise bound
* `g` prefix commands
* `a`, `i` prefix range symbols
* `~` swap lower case and upper case in the bound
* `:` switch to line input mode
* `J` join the bound
* `p` delete the bound, and paste a register's content
* `P` same as `p`
* `r` fill the bound up with inputted letter
* `s` same as `c`
* `u` lower-ize the bound
* `U` upper-ize the bound
* `v` character wise bound mode
* `V` line wise bound mode
* `x` same as `d`
* `^A` add the counter to all numeric strings within the bound
* `^X` subtract the counter to all numeric strings within the bound

Surrounding identifiers
-----------------------

* quotations: one of ``!#$%&*+,\-.:;=?@^_|~"'` ``
* brackets: one of `abBrt[]{}()`

Surrounding string
-----------------------

* quotations: one of ``!#$%&*+,\-.:;=?@^_|~"'` ``
* brackets: one of `abBr[]{}()`
* tags: one of `^T` `,<Tt`

Vim features in wasavi
----------------------

* multiple level undo/redo
* incremental search
* range symbols (aka, Vim text objects)
* following registers
  - `"` unnamed register
  - `:` last executed ex command
  - `*` reading from and writing to the system clipboard
  - `/` last searched string
  - `=` evaluate math expression. supported operators are: `+` `-` `*` `/` `%`. supported numeric expressions are: integer, float (including exponential form), binary (with leading `0b`), octal (with leading 0), hex (with leading `0x`)
* auto-reformat in input mode, and reformat operator (gq command) on the state of textwidth > 0
* bound mode (aka, Vim visual mode)
* options: `iskeyword`, `incsearch`, `smartcase`, `undolevels`, `quoteescape`, `relativenumber`, `textwidth`, `expandtab`, `cursorline`, `cursorcolumn`, `nrformats`
* writing to the register of A to Z
* `gu` / `gU` + motion: lowerize or upperize a region
* partial functionality of [Surround.vim](https://github.com/tpope/vim-surround)
* partial functionality of `:sort` (regex pattern, `r` and `i` options)
* `^A` to increase a numeric string. `^X` to decrease a numeric string.
