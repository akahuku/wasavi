wasavi building and testing guide
=================================

1. Preparation

  The following objects are required to build and test wasavi:

  * OS which supports a symbolic link native
  * node.js and npm (to manage packages)
  * web-ext, via npm (to run wasavi on Firefox)
  * mocha, via npm (to test wasavi)
  * Selenium javascript binding (to test wasavi)
  * php (to re-build unicode data files)
  * make
  * gcc
  * Information of your AMO account (to build and sign wasavi.xpi)  
    create ~/.amo-account.ini and describe the account info in the following format:
    ```
  AMO_API_KEY=<API key of your AMO account>
  AMO_API_SECRET=<Secret key of your AMO account>
  ```
  * Information of your Dropbox, GoogleDrive, OneDrive accounts (to use filesystem functionality)  
  copy `src/chrome/consumer_keys.json.template` to `src/chrome/consumer_keys.json` and edit it

2. How to set up the source code

  ```
  $ git clone git@github.com:akahuku/wasavi.git
  $ cd wasavi
  $ git submodule update -i
  $ npm install
  ```

3. How to run wasavi on Chrome (and Opera)

  * Start Chrome with special profile:
  ```
  $ make run-chrome
  ```
  * A special profile is placed `src/wd-tests/profile/chrome`.
  * If it is first run, navigate to `chrome://extensions`, push `Load unpacked extension...`, then set `src/chrome` directory.
  * If you want to build your own wasavi.crx and wasavi.nex, make a wasavi.pem file at `chrome://extensions` page and place it to repository root.

4. How to run wasavi on Firefox

  * Start Firefox:
  ```
  $ make debug-firefox
  ```

5. How to build

  ```
  $ make
  ```

6. How to functional test with Selenium

  Copy `src/wd-tests/filesystem-test-files/*` to each root directory of Dropbox, Google Drive, OneDrive.

  * /hello-wasavi.txt (used for testing file name completion, so content is optional)
  * /wasavi-test/read test.txt (content: 'hello,\nworld')
  * /wasavi-test/write test.txt (content is dynamically created during testing)

  ```
  $ make test-chrome
  ```
  ```
  $ make test-opera
  ```
  ```
  $ make test-firefox
  ```
