wasavi (VI editor for any web page)
====================================

これはなに？
------------

wasavi はいくつかの web ブラウザ用のエクステンションで、web ページ上の textarea
要素を vi エディタ化します。

wasavi はほぼすべての vi コマンド、およびいくつかの ex コマンドをサポートします。



スクリーンショット
------------

* ネイティブな textarea があったとき:
  ![native textarea](http://appsweets.net/wasavi/wasavi_native_textarea.jpg)

* Ctrl+Enter を押すと wasavi が起動します:
  ![wasavi running](http://appsweets.net/wasavi/wasavi.jpg)

* ex コマンドもいくつかサポートしています。:set all したところ:
  ![set all](http://appsweets.net/wasavi/wasavi_set_all.jpg)

* vim からインクリメンタルサーチをポートしています:
  ![incremental search](http://appsweets.net/wasavi/wasavi_incremental_search.jpg)



インストール
------------

現在、以下の web ブラウザ用のエクステンションが用意されています。

* Google Chrome

  <http://appsweets.net/wasavi/wasavi.crx>

* Opera

  <http://appsweets.net/wasavi/wasavi.oex>

* Firefox

  <http://appsweets.net/wasavi/wasavi.xpi>

以上のブラウザ用のエクステンションの標準的なインストール方法に従って導入してく
ださい。ただし、Opera 版は試験公開です。Opera が DOM3 Composition Event に対応
していないので insert モードにおいて IME を経由した入力が正しく機能しません。

Google Chrome において、github に公開されているソースを実行する場合は、「パッ
ケージ化されていない拡張機能を読み込む...」で manifest.json を与えてください。



使い方
------

適当な web ページの textarea 要素にフォーカスがある状態で Ctrl+Enter、もしくは
Insert を押下してください。言うまでもありませんが、終了するには ZZ、:q、:wq
などを入力します。



* * *


実装済みコマンド
--------------------

### 以下の形式の vi コマンド:

* ([count] [operation])? [count] motion
* [count] scroll-command
* [count] edit-command
* ex-command-prefix

#### operation:

* c cc C y yy Y d dd D &gt; &gt;&gt; &lt; &lt;&lt;

#### motion:

* &#45; &#43; ^ &lt;home&gt; $ &lt;end&gt; % | comma(,) ;
  &#95; / ? ' ` ( ) { } [[ ]] &lt;enter&gt; 0
  j k h l ^N ^P ^H
  &lt;down&gt; &lt;up&gt; &lt;left&gt; &lt;right&gt; &lt;space&gt;
  w W b B e E gg G H M L f F t T n N

#### scroll-command:

* ^U ^D ^Y ^E ^B ^F &lt;pageup&gt; &lt;pagedown&gt;
  z&lt;enter&gt; z. zz z-

#### edit-command:

* x X &lt;delete&gt; p P J period( . ) u ^R ~ ^L ^G m @ r R
  a A i I o O & s S ZZ

#### ex-command-prefix:

* :

### 以下の ex コマンド:

* abbreviate copy delete global join k map mark marks move
  options print put quit redo s & ~ set registers to
  unabbreviate undo unmap version v write wq xit yank
  > < @ &#42;

ex コマンドのアドレス指定は絶対行番号、相対行番号、正規表現のいずれも可能です。
オフセットを付加することも可能です。このほか、多段 undo/redo とインクリメンタル
サーチを実装してあります。



* * *

バグってる！
------------

ぜひ現象と再現方法を教えてください。
バグレポートや要望の受け付けは以下の場所で行います。

* <http://appsweets.net/wasavi/#forum>

github のアカウントを持っているなら issue でも構いません。

* <http://github.com/akahuku/wasavi/issues>
