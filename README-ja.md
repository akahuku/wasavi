wasavi (VI editor for any web page)
====================================

wasavi は Chrome、Opera、Firefox 用のエクステンションです。 wasavi はあらゆるページ上の TEXTAREA 要素を VI エディタ化します。wasavi はほぼすべての VI コマンド、およびいくつかの ex コマンドをサポートします。

wasavi の開発は継続中です。バグレポートや機能の要請はどんなものでも歓迎します。

また、開発を継続するための寄付も歓迎します:

[![Donate](http://pledgie.com/campaigns/26501.png)](https://pledgie.com/campaigns/26501)
[![Flattr](http://api.flattr.com/button/flattr-badge-large.png)](https://flattr.com/submit/auto?user_id=akahuku&url=http://appsweets.net/wasavi/)

[English version README](README.md)

簡単な使い方
============

* ネイティブな TEXTAREA があったとき、TEXTAREA にフォーカスし、`Ctrl+Enter` を押すと wasavi が起動します

  ![wasavi の起動、編集、終了](http://appsweets.net/wasavi/image/0.7.733/wasavi.gif)

込み入った使い方
----------------

* wasavi はいくつかの ex コマンドをサポートします。これは `:set all` したところ

  ![set all](http://appsweets.net/wasavi/image/0.6.669/set-all.png)

* Vim のインクリメンタルサーチ

  ![インクリメンタルサーチ](http://appsweets.net/wasavi/image/0.6.669/isearch.png)

* [オンラインアプリとしての wasavi](https://wasavi.appsweets.net)。 このリンクを wasavi をインストールしたブラウザで開くと自動的に wasavi が起動し、dropbox/google drive/OneDrive アカウント上のファイル、を読み書きできます。

  ![stand alone](http://appsweets.net/wasavi/image/0.6.669/web-app.png)


インストール
============

現在、wasavi は以下のブラウザで動作します。各ブラウザで以下のリンクをクリックし、標準的なエクステンションのインストール方法に従ってください。これらのエクステンションは各ブラウザのアドオン・ストアに登録されています。

* [Google Chrome extension](https://chrome.google.com/webstore/detail/dgogifpkoilgiofhhhodbodcfgomelhe?hl=ja)

* [Opera addon](https://addons.opera.com/ja/extensions/details/wasavi/)

* Firefox addon

ソースコードと最新の開発版は [Github](https://github.com/akahuku/wasavi) で管理しています:

* [Chrome 用の最新/非安定バージョン](https://github.com/akahuku/wasavi/raw/master/dist/wasavi.crx)

* [Blink Opera 用の最新/非安定バージョン](https://github.com/akahuku/wasavi/raw/master/dist/wasavi.nex)

* [Firefox 用の最新/非安定バージョン](https://github.com/akahuku/wasavi/raw/master/dist/wasavi.xpi)

### Chrome ユーザへの注意

Chrome は Ctrl+T、Ctrl+W および Ctrl+N の基本的なショートカットを予約しています。これらのキーは wasavi から使用することができませんが、その代わりに Alt+T、Alt+W および Alt+N を使うことができます。



よく聞かれる質問
================

## wasavi の起動

TEXTAREA にフォーカスし、`Ctrl+Enter` を押してください。

## wasavi の終了

wasavi を終了するには `ZZ`、`:q`、`:wq` などの VI の終了コマンドを入力してください。

## wasavi が `:set` コマンドで受け入れるオプションは？

[表](https://github.com/akahuku/wasavi/wiki/All-Options-which-wasavi-recognizes) を参照してください。

注意: 受け入れるが、まだ何の効力も持たないオプションもあります。

## 初期設定を変更する

各ブラウザのエクステンション管理機能から wasavi の設定ページを開き
（または wasavi 上で `:options` と入力）、"exrc" テキストボックスを編集してください。

## ビープ音を制御する

ビープ音を無効にするには、`set noerrorbells` と exrc に追加します。ビジュアルベルにしたい場合は代わりに `set visualbell` を追加します。

また、wasavi 起動時のチャイム音は `set nolaunchbell` で無効にできます。

いずれのビープ音のボリュームも、`set bellvolume=N` で制御できます。値 N の範囲は 1 から 100 です。

## ローカルファイルにアクセスする

[ドキュメント](https://github.com/akahuku/wasavi/wiki/Local-access) を参照してください。

## Firefox で Vimperator/Keysnail/VimFx と共存する

### Vimperator

[wasavi_mediator.js](https://raw.github.com/akahuku/wasavi/master/src/mediators/vimperator/wasavi_mediator.js) を Vimperator のプラグインディレクトリに置いてください。たとえば `~/.vimperator/plugin` や `%HOME%\vimperator\plugin` です。

このプラグインは wasavi の状態に従って Vimperator のパススルーモードを制御します。

### Keysnail

[wasavi_mediator.ks.js](https://raw.github.com/akahuku/wasavi/master/src/mediators/keysnail/wasavi_mediator.ks.js) を Keysnail のプラグインディレクトリに置いてください。

このプラグインは wasavi の状態に従って Keysanil のサスペンドモードを制御します。

### VimFx

最新の VimFx は wasavi を編集可能な要素の一種として認識し、wasavi の動作中は一時的に VimFx 自身のキーバインドは無効になります。

wasavi の動作中に VimFx のキーバインドを使用するには、ページの wasavi 以外の領域をクリックするか、`:set esctoblur` とした上でノーマルモード時に `<esc>` を押します。フォーカスが wasavi から外れ、VimFx の機能が戻ります。

## 単体のテキストエディタとしての利用

wasavi をインストールし、リンク [オンラインアプリとしての wasavi](https://wasavi.appsweets.net) を開いてください。wasavi が自動的に起動します。この状態では、Dropbox/Google Drive/OneDrive またはローカルのファイルに対して ex コマンド `:read`、`:write`、`:edit`、`:file` が使用できます。Dropbox/Google Drive/OneDrive へのアクセスのために OAuth による承認が必要です。

## 自動的な設定の上書き

wasavi の実行時に入力された `:set` コマンドは、エクステンションに永続的に記憶され、wasavi の次回の実行時に再生されます。

この設定の上書き機構は最大 30 の各 URL ごとに機能します。この機能が不要であるならば、exrc に `:set nooverride` を追加してください。上書きは無効になります。

## Migemo と協調する

Chrome 版の wasavi は [Migemo](http://0xcc.net/migemo/) 検索を行うことができます。[Migemo Server](https://chrome.google.com/webstore/detail/migemo-server-for-google/dfccgbheolnlopfmahkcjiefggclmadb) をインストールし、`/` や `?` コマンドの検索文字列中に特別なメタ文字である `\M` を含めてください。`\M` が検索文字列に含まれていると、これらの検索コマンドは Migemo を介して実行されます。

## バグを見つけた

[wasavi issue tracker](https://github.com/akahuku/wasavi/issues) で issue を作成してください。

Tips and Tricks
===============

* wasavi の最大化: `:set fullscreen` or `:set fs`
* wasavi を元に戻す: `:set nofullscreen` or `:set nofs`
* カラーテーマを変える: `:set theme=blight` or `:set theme=charcoal` or `:set theme=matrix` or `:set theme=solarized` or `:set theme=solarized_dark`
* :abbreviate の文法は:
	+ `:abbreviate` は、登録されている全ての略語を表示します
	+ `:abbreviate [clear]` は、全ての略語を削除します
	+ `:abbreviate lhs` は、lhs に対応する略語を表示します
	+ `:abbreviate lhs rhs` は、lhs を rhs に展開する略語を登録します
	+ `:abbreviate [noremap] lhs rhs` も登録しますが、こちらは remap の影響を受けません。
* :map の文法は:
	+ `:map` は、登録されている全てのマップを表示します
	+ `:map [clear]` は、全てのマップを削除します
	+ `:map lhs rhs` は、lhs を rhs に変換するマップを登録します。この変換は再帰します。`<esc>` のような、lhs と rhs 内のキーストローク記述子の文法については、[このページ](https://github.com/akahuku/wasavi/wiki/Syntax-of-key-stroke-descriptor) を参照してください
	+ `:map [noremap] lhs rhs` も登録しますが、こちらは再帰しません
	+ `:map` はノーマルモード用のマップを対象とします。一方、
	  `:map!` は挿入モード用です。これは vim の `:imap` に相当します
	+ より詳細な情報は、[map コマンドの文法](https://github.com/akahuku/wasavi/wiki/Syntax-of-Map-command) を参照してください。
* `j` `k` `^` `$` はカーソルを物理行単位で移動させます。一方、`gj` `gk` `g^` `g$` は
  折り返し行単位で移動させます。この振る舞いを交換するには: `:set jkdenotative`
* 日本語のための `f` `F` `t` `T` の拡張: これらのコマンドはひらがな、カタカナ、および
  漢字の読み（ローマ字での表現）を認識します。たとえば、`fk` は
  「か」「カ」「漢」などの上にカーソルを置きます。
* ラテン文字のための `f` `F` `t` `T` の拡張: これらのコマンドはダイアクリティカルマーク
  が付されたアルファベットの基底文字を認識します。たとえば `fa` は
  「å」、「ä」、「à」、「â」、「ā」などの上にカーソルを置きます。[対応表](https://github.com/akahuku/wasavi/wiki/Latin-1-alternative-presentation-in-f-F-t-T-command) も参照してください。
* オンラインストレージをファイルシステムとして使用する:
	+ `:filesystem status` は、現在使用可能なファイルシステムを表示します
	+ `:filesystem default` は、デフォルトのファイルシステムを取得します。
	  設定の際は `:filesystem default dropbox` や `:filesystem default gdrive` や `:filesystem default onedrive` と入力します
	+ `:filesystem reset` はアクセストークンを破棄します。こちらも、ファイルシステム名を指定することができます
	+ ファイル名の先頭にファイルシステム名を明示することができます:
	  `:read dropbox:/hello.txt`
* A から Z までのレジスタを読み込む際、いくつかのレジスタは特別な内容を返します:
	+ `B` register: ユーザーエージェント文字列
	+ `D` register: 現在の日付時刻文字列（`datetime` オプションを strftime(3) のテンプレートとして使用します）
	+ `T` register: タイトル文字列
	+ `U` register: URL 文字列
	+ `W` register: wasavi のバージョン文字列
* 設定をデフォルトの状態へ戻すには：
	+ `:set <オプション名>&` または `:set <オプション名>&default`
* 全ての設定をデフォルトの状態へ戻すには：
	+ `:set all&` または `:set all&default`
* 設定を exrc の評価直後の状態へ戻すには:
	+ `:set <オプション名>&exrc`
* 全ての設定を exrc の評価直後の状態へ戻すには:
	+ `:set all&exrc`
* テキストを書き出し、wasavi を閉じた後自動的にフォームをサブミットするには:
	+ `:wqs`
	+ `:submit` ( `:sub` まで省略できます)



実装済みコマンド
================

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

最後の 1 文字の前にカウンタを挿入することができます。

Surround Operations
-------------------

* 囲む: `ys` `yS`
* 囲みを除去する: `ds`
* 囲みを変更する: `cs`

Motions
-------

`-` `+` `^` `<home>` `$` `<end>` `%` `|` `,` `;`
  `_` `/` `?` `'` `` ` `` `(` `)` `{` `}` `[[` `]]` `<enter>` `0`
  `j` `k` `h` `l` `^N` `^P` `^H`
  `<down>` `<up>` `<left>` `<right>` `<space>`
  `w` `W` `b` `B` `e` `E` `gg` `gj` `gk` `g^` `g$` `G` `H` `M` `L` `f` `F` `t` `T` `n` `N`

Range symbols (Vim text objects)
--------------------------------

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

ex コマンドでのアドレス指定はフルサポートされています:

* バッファ全体: `%s/re/rep/`
* 現在行: `.p`
* バッファの最終行: `$p`
* 絶対的な行番号: `1,2p`
* 相対的な行番号: `+1,+2p`
* 正規表現: `/re/p` `?re?p`
* マークの参照: `'a,'bp`

さらに、`/re/+1p` のようにオフセットも受け付けます。
2 つのアドレスは通常 `,` で繋ぎますが `;` で繋ぐこともできます。


入力モードのコマンド
--------------------

* `^@` 最後に入力したテキストを入力し、input モードを抜ける。このキーストロークは実際には `Ctrl+Space` です。
* `^D` アンシフト。ただし最後に入力した文字が `0` か `^` のとき、インデントを全て削除する
* `^H` 1 文字削除
* `^R` レジスタの内容を貼り付ける
* `^T` シフト
* `^U` input セッションで入力されたすべての文字を取り消す
* `^V` 1 文字入力のためのエスケープシーケンス
* `^W` 1 単語削除

行入力モードのコマンド
---------------------

* `^A` カーソルを行頭へ
* `^B` 1 文字戻る
* `^E` カーソルを行末へ
* `^F` 1 文字前へ
* `^H` 1 文字削除
* `^N` 次の履歴
* `^P` 前の履歴
* `^R` レジスタの内容を貼り付ける
* `^U` 行全体を削除
* `^V` 1 文字入力のためのエスケープシーケンス
* `^W` 1 単語削除
* `tab` ex コマンド名、set オプション名、read/edit/write/file のファイル名引数の補完

範囲選択モードのコマンド
------------------------

範囲選択するにはコマンドモードで `v` または `V` を押します。

* `c` 選択範囲を削除し、insert モードに移る
* `d` 選択範囲を削除する
* `y` 選択範囲をヤンクする
* `<` 選択範囲を unshift する
* `>` 選択範囲を shift する
* `C` 選択範囲行を削除し、insert モードに移る
* `S` 選択範囲を囲む
* `R` `C` と同じ
* `D` 選択範囲行を削除する
* `X` `D` と同じ
* `Y` 選択範囲行をヤンクする
* `g` で始まるコマンド
* `a`、`i` で始まる Range Symbols
* `~` 選択範囲の大文字・小文字を交換する
* `:` ex コマンドモードに移る
* `J` 選択範囲の改行を取り除く
* `p` 選択範囲を削除し、レジスタの内容を貼り付ける
* `P` `p` と同じ
* `r` 選択範囲を次に入力した 1 文字で置き換える
* `s` `c` と同じ
* `u` 選択範囲を小文字化する
* `U` 選択範囲を大文字化する
* `v` 文字単位の選択に切り替える
* `V` 行単位の選択に切り替える
* `x` `d` と同じ
* `^A` 選択範囲内の全ての数値文字列をカウンタ分増加させる
* `^X` 選択範囲内の全ての数値文字列をカウンタ分減少させる

囲み識別子
----------

* 次のいずれかの記号類: ``!#$%&*+,\-.:;=?@^_|~"'` ``
* 次のいずれかの括弧類: `abBrt[]{}()`

囲み文字列
----------

* 次のいずれかの記号類: ``!#$%&*+,\-.:;=?@^_|~"'` ``
* 次のいずれかの括弧類: `abBr[]{}()`
* 次のいずれかで始まるタグ: `^T` `,<Tt`

Vim 互換の機能
--------------

* 多段 undo/redo
* インクリメンタルサーチ
* レンジシンボル（Vim で言うところのテキストオブジェクト）
* 以下のレジスタ
  - `"` 無名レジスタ
  - `:` 最後に実行した ex コマンド
  - `*` システムクリップボードへの読み書き
  - `/` 最後に検索した文字列
  - `=` 数式の評価。サポートされる演算子は `+` `-` `*` `/` `%`。サポートされる数値表現は整数、実数（指数形式を含む）、2進数（`0b` が先行する）、8進数（0 が先行する）、16進数（`0x` が先行する）。
* textwidth > 0 の状態における input モードの自動整形、および自動整形オペレータ（gq コマンド）
* 範囲選択モード（Vim でいうところのビジュアルモード）
* オプション `iskeyword`、`incsearch`、`smartcase`、`undolevels`、`quoteescape`、`relativenumber`、`textwidth`、 `expandtab`、`cursorline`、`cursorcolumn`、`nrformats`
* A から Z レジスタへの書き込み
* `gu` / `gU` + モーションは領域を小文字化または大文字化します
* [Surround.vim](https://github.com/tpope/vim-surround) の一部の機能
* `:sort` の一部の機能（正規表現パターン、`r`、`i` オプション）
* `^A` による数値文字列の増加、`^X` による数値文字列の減少
