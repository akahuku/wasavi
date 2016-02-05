# application macros
# ========================================

VERSION := $(shell echo -n `git describe --tags --abbrev=0|sed -e 's/[^0-9.]//g'`.`git rev-list --count HEAD`)

SHELL := /bin/sh

CHROME := chromium-browser
OPERA := opera
FIREFOX := firefox
CYGPATH := echo

ZIP := zip -qr9
UNZIP := unzip

RSYNC := rsync

# basic macros
# ========================================

PRODUCT = wasavi
DIST_DIR = dist
SRC_DIR = src
EMBRYO_DIR = .embryo

RSYNC_OPT = -rptLv --delete \
	--exclude '*.sw?' --exclude '*.bak' --exclude '*~' --exclude '*.sh' \
	--exclude 'banner*.xcf' --exclude 'banner*.png' \
	--exclude '.*' \
	--exclude '$(CRYPT_SRC_FILE)*'

CRYPT_KEY_FILE = LICENSE
CRYPT_SRC_FILE = consumer_keys.json
CRYPT_DST_FILE = consumer_keys.bin

CHROME_SUFFIX = crx
CHROME_SRC_DIR = chrome
CHROME_EXT_ID = dgogifpkoilgiofhhhodbodcfgomelhe
CHROME_EXT_LOCATION = https://github.com/akahuku/wasavi/raw/master/dist/wasavi.crx
CHROME_UPDATE_LOCATION = https://github.com/akahuku/wasavi/raw/master/dist/chrome.xml

OPERA_SUFFIX = oex
OPERA_SRC_DIR = opera
OPERA_EXT_ID =
OPERA_EXT_LOCATION = https://github.com/akahuku/wasavi/raw/master/dist/wasavi.oex
OPERA_UPDATE_LOCATION = https://github.com/akahuku/wasavi/raw/master/dist/opera.xml

BLINKOPERA_SUFFIX = nex
BLINKOPERA_SRC_DIR = chrome
BLINKOPERA_EXT_ID = dgogifpkoilgiofhhhodbodcfgomelhe
BLINKOPERA_EXT_LOCATION = https://github.com/akahuku/wasavi/raw/master/dist/wasavi.nex
BLINKOPERA_UPDATE_LOCATION = https://github.com/akahuku/wasavi/raw/master/dist/opera-blink.xml

FIREFOX_SUFFIX = xpi
FIREFOX_SRC_DIR = firefox
FIREFOX_EXT_ID =
FIREFOX_EXT_LOCATION = https://github.com/akahuku/wasavi/raw/master/dist/wasavi.xpi
FIREFOX_UPDATE_LOCATION = https://github.com/akahuku/wasavi/raw/master/dist/update.rdf

# derived macros
# ========================================

BINKEYS_PATH = $(CHROME_SRC_PATH)/$(CRYPT_DST_FILE)

CHROME_TARGET_PATH = $(DIST_DIR)/$(PRODUCT).$(CHROME_SUFFIX)
CHROME_MTIME_PATH = $(EMBRYO_DIR)/.$(CHROME_SUFFIX)
CHROME_SRC_PATH = $(SRC_DIR)/$(CHROME_SRC_DIR)
CHROME_EMBRYO_SRC_PATH = $(EMBRYO_DIR)/$(CHROME_SRC_DIR)
CHROME_TEST_PROFILE_PATH = $(shell $(CYGPATH) $(SRC_DIR)/wd-tests/profile/chrome)

OPERA_TARGET_PATH = $(DIST_DIR)/$(PRODUCT).$(OPERA_SUFFIX)
OPERA_MTIME_PATH = $(EMBRYO_DIR)/.$(OPERA_SUFFIX)
OPERA_SRC_PATH = $(SRC_DIR)/$(OPERA_SRC_DIR)
OPERA_EMBRYO_SRC_PATH = $(EMBRYO_DIR)/$(OPERA_SRC_DIR)
OPERA_TEST_PROFILE_PATH = $(shell $(CYGPATH) $(SRC_DIR)/wd-tests/profile/opera)

BLINKOPERA_TARGET_PATH = $(DIST_DIR)/$(PRODUCT).$(BLINKOPERA_SUFFIX)
BLINKOPERA_MTIME_PATH = $(EMBRYO_DIR)/.$(BLINKOPERA_SUFFIX)
BLINKOPERA_SRC_PATH = $(SRC_DIR)/$(BLINKOPERA_SRC_DIR)
BLINKOPERA_EMBRYO_SRC_PATH = $(EMBRYO_DIR)/operablink

FIREFOX_TARGET_PATH = $(DIST_DIR)/$(PRODUCT).$(FIREFOX_SUFFIX)
FIREFOX_MTIME_PATH = $(EMBRYO_DIR)/.$(FIREFOX_SUFFIX)
FIREFOX_SRC_PATH = $(SRC_DIR)/$(FIREFOX_SRC_DIR)
FIREFOX_EMBRYO_SRC_PATH = $(EMBRYO_DIR)/$(FIREFOX_SRC_DIR)
FIREFOX_TEST_PROFILE_PATH = $(shell $(CYGPATH) $(SRC_DIR)/wd-tests/profile/firefox)

# local override of macros
# ========================================

-include app.mk



# basic rules
# ========================================

all: $(CHROME_TARGET_PATH) \
	$(OPERA_TARGET_PATH) $(BLINKOPERA_TARGET_PATH) \
	$(FIREFOX_TARGET_PATH)

clean:
	rm -rf ./$(EMBRYO_DIR)

$(BINKEYS_PATH): $(CHROME_SRC_PATH)/$(CRYPT_KEY_FILE) $(CHROME_SRC_PATH)/$(CRYPT_SRC_FILE)
	tool/make-binkey.rb \
		--key $(CHROME_SRC_PATH)/$(CRYPT_KEY_FILE) \
		--src $(CHROME_SRC_PATH)/$(CRYPT_SRC_FILE) \
		--dst $@

FORCE:

.PHONY: all clean message \
	test-chrome test-opera test-firefox \
	run-chrome run-opera run-firefox \
	dbgfx \
	FORCE



#
# rules to make wasavi.crx
# ========================================
#

# wasavi.crx
$(CHROME_TARGET_PATH): $(CHROME_MTIME_PATH) $(BINKEYS_PATH)
#	copy all of sources to embryo dir
	$(RSYNC) $(RSYNC_OPT) --exclude 'wasavi_frame_noscript.html' \
		$(CHROME_SRC_PATH)/ $(CHROME_EMBRYO_SRC_PATH)

#	update manifest
	tool/update-chrome-manifest.rb \
		--indir $(CHROME_SRC_PATH) \
		--outdir $(CHROME_EMBRYO_SRC_PATH) \
		--ver $(VERSION)

#	build general crx
	$(CHROME) \
		--lang=en \
		--pack-extension=$(CHROME_EMBRYO_SRC_PATH) \
		--pack-extension-key=wasavi.pem

	mv $(EMBRYO_DIR)/$(CHROME_SRC_DIR).$(CHROME_SUFFIX) $@

#	update manifest for google web store
	tool/update-chrome-manifest.rb \
		--indir $(CHROME_SRC_PATH) \
		--outdir $(CHROME_EMBRYO_SRC_PATH) \
		--ver $(VERSION) \
		--strip-update-url

#	build zip archive for google web store
	rm -f $(DIST_DIR)/wasavi_chrome_web_store.zip
	cd $(CHROME_EMBRYO_SRC_PATH) \
		&& find . -type f -print0 | sort -z | xargs -0 $(ZIP) ../../$(DIST_DIR)/wasavi_chrome_web_store.zip

#	create update description file
	sed -e 's/@appid@/$(CHROME_EXT_ID)/g' \
		-e 's!@location@!$(CHROME_EXT_LOCATION)!g' \
		-e 's/@version@/$(VERSION)/g' \
		$(SRC_DIR)/template-chrome.xml > $(DIST_DIR)/$(notdir $(CHROME_UPDATE_LOCATION))

	@echo ///
	@echo /// created: $@, version $(VERSION)
	@echo ///

# last mtime holder
$(CHROME_MTIME_PATH): FORCE
	@mkdir -p $(CHROME_EMBRYO_SRC_PATH) $(DIST_DIR)
	tool/mtime.rb --dir $(CHROME_SRC_PATH) --base $(CHROME_TARGET_PATH) --out $@



#
# rules to make wasavi.oex
# ========================================
#

# wasavi.oex
$(OPERA_TARGET_PATH): $(OPERA_MTIME_PATH) $(BINKEYS_PATH)
#	copy all of sources to embryo dir
	$(RSYNC) $(RSYNC_OPT) $(OPERA_SRC_PATH)/ $(OPERA_EMBRYO_SRC_PATH)

#	update the manifest file
	tool/update-opera-config.rb \
		--product $(PRODUCT) \
		--indir $(OPERA_SRC_PATH) \
		--outdir $(OPERA_EMBRYO_SRC_PATH) \
		--ver $(VERSION) \
		--update-url $(OPERA_UPDATE_LOCATION)

#	create update description file
	sed -e 's/@appid@/$(OPERA_EXT_ID)/g' \
		-e 's!@location@!$(OPERA_EXT_LOCATION)!g' \
		-e 's/@version@/$(VERSION)/g' \
		$(SRC_DIR)/template-opera.xml > $(DIST_DIR)/$(notdir $(OPERA_UPDATE_LOCATION))

#	zip it
	rm -f $@
	cd $(OPERA_EMBRYO_SRC_PATH) \
		&& find . -type f -print0 | sort -z | xargs -0 $(ZIP) ../../$@ 

	@echo ///
	@echo /// created: $@, version $(VERSION)
	@echo ///

# last mtime holder
$(OPERA_MTIME_PATH): FORCE
	@mkdir -p $(OPERA_EMBRYO_SRC_PATH) $(DIST_DIR)
	tool/mtime.rb --dir $(OPERA_SRC_PATH) --base $(OPERA_TARGET_PATH) --out $@



#
# rules to make wasavi.nex
# ========================================
#

# wasavi.nex
$(BLINKOPERA_TARGET_PATH): $(BLINKOPERA_MTIME_PATH) $(BINKEYS_PATH)
#	copy all of sources to embryo dir
	$(RSYNC) $(RSYNC_OPT) --exclude='wasavi_frame_noscript.html' \
		$(BLINKOPERA_SRC_PATH)/ $(BLINKOPERA_EMBRYO_SRC_PATH)

#	update manifest
	tool/update-chrome-manifest.rb \
		--indir $(BLINKOPERA_SRC_PATH) \
		--outdir $(BLINKOPERA_EMBRYO_SRC_PATH) \
		--ver $(VERSION) \
		--update-url $(BLINKOPERA_UPDATE_LOCATION)

#	build nex
	$(CHROME) \
		--lang=en \
		--pack-extension=$(BLINKOPERA_EMBRYO_SRC_PATH) \
		--pack-extension-key=wasavi.pem

	mv $(EMBRYO_DIR)/operablink.crx $@

#	create update description file
	sed -e 's/@appid@/$(BLINKOPERA_EXT_ID)/g' \
		-e 's!@location@!$(BLINKOPERA_EXT_LOCATION)!g' \
		-e 's/@version@/$(VERSION)/g' \
		$(SRC_DIR)/template-opera-blink.xml > $(DIST_DIR)/$(notdir $(BLINKOPERA_UPDATE_LOCATION))

	@echo ///
	@echo /// created: $@, version $(VERSION)
	@echo ///

# last mtime holder
$(BLINKOPERA_MTIME_PATH): FORCE
	@mkdir -p $(BLINKOPERA_EMBRYO_SRC_PATH) $(DIST_DIR)
	tool/mtime.rb --dir $(BLINKOPERA_SRC_PATH) --base $(BLINKOPERA_TARGET_PATH) --out $@



#
# rules to make wasavi.xpi
# ========================================
#

# wasavi.xpi
$(FIREFOX_TARGET_PATH): $(FIREFOX_MTIME_PATH) $(BINKEYS_PATH)
#	copy all of sources to embryo dir
	$(RSYNC) $(RSYNC_OPT) \
		--exclude 'lib/init.js' \
		--exclude 'lib/es6-promise.min.js' \
		--exclude 'lib/kosian/init.js' \
		--exclude 'lib/kosian/OperaImpl.js' \
		--exclude 'lib/kosian/ChromeImpl.js' \
		$(FIREFOX_SRC_PATH)/ $(FIREFOX_EMBRYO_SRC_PATH)

#	strip script tag from options.html
	sed -e 's/<script[^>]*><\/script>//g' \
		$(FIREFOX_SRC_PATH)/data/options.html \
		> $(FIREFOX_EMBRYO_SRC_PATH)/data/options.html

#	replace the variables which be assigned to innerHTML with a string literal
	localtool/inscontent

#	update package
	tool/update-firefox-package.rb \
		--indir $(FIREFOX_SRC_PATH) \
		--outdir $(FIREFOX_EMBRYO_SRC_PATH) \
		--ver $(VERSION)

#	build xpi using jpm
	cd $(FIREFOX_EMBRYO_SRC_PATH) && jpm xpi
	mv $(FIREFOX_EMBRYO_SRC_PATH)/*.$(FIREFOX_SUFFIX) $@
	mv $(FIREFOX_EMBRYO_SRC_PATH)/*.update.rdf $(DIST_DIR)/firefox.rdf

#	extract install.rdf
	$(UNZIP) -p $@ install.rdf > $(FIREFOX_EMBRYO_SRC_PATH)/install.rdf

#	update install.rdf
	tool/update-firefox-manifest.rb \
		--indir $(FIREFOX_EMBRYO_SRC_PATH) \
		--outdir $(FIREFOX_EMBRYO_SRC_PATH) \
		--localedir $(SRC_DIR)/chrome/_locales \
		--ver $(VERSION)

#	delete old install.rdf in xpi
	$(ZIP) -d $(DIST_DIR)/$(PRODUCT).$(FIREFOX_SUFFIX) install.rdf

#	re-zip new install.rdf
	cd $(FIREFOX_EMBRYO_SRC_PATH) && $(ZIP) -u ../../$(DIST_DIR)/$(PRODUCT).$(FIREFOX_SUFFIX) install.rdf

	@echo ///
	@echo /// created: $@, version $(VERSION)
	@echo ///

# last mtime holder
$(FIREFOX_MTIME_PATH): FORCE
	@mkdir -p $(FIREFOX_EMBRYO_SRC_PATH) $(DIST_DIR)
	tool/mtime.rb --dir $(FIREFOX_SRC_PATH) --base $(FIREFOX_TARGET_PATH) --out $@



#
# rules to make binary formed consumer keys
# ========================================
#

binkeys: $(BINKEYS_PATH)



#
# rules to make messages
# ========================================
#

message: FORCE
#	update locales.json
	tool/update-locales.rb \
		--indir $(CHROME_SRC_PATH)/_locales

#	update firefox native localized messages
	tool/update-firefox-locales.rb \
		--product $(PRODUCT) \
		--indir $(FIREFOX_SRC_PATH) \
		--localedir $(CHROME_SRC_PATH)/_locales

#	get diff of messages other than en-US
	tool/make-messages.rb \
		--indir=$(CHROME_SRC_PATH) \
		$(CHROME_SRC_PATH)/frontend/*.js \
		$(CHROME_SRC_PATH)/backend/*.js \
		$(CHROME_SRC_PATH)/backend/lib/kosian/*.js



#
# rules to test
# ========================================
#

test-chrome: FORCE
	cd $(SRC_DIR)/wd-tests && ant test-chrome

test-opera: FORCE
	cd $(SRC_DIR)/wd-tests && ant test-opera

test-firefox: FORCE
	cd $(SRC_DIR)/wd-tests && ant test-firefox

run-chrome: FORCE
	$(CHROME) --start-maximized --lang=en \
		--user-data-dir=$(CHROME_TEST_PROFILE_PATH)

run-opera: FORCE
	$(OPERA) -pd $(OPERA_TEST_PROFILE_PATH)

run-firefox: FORCE
	$(FIREFOX) -profile $(FIREFOX_TEST_PROFILE_PATH)

dbgfx: FORCE
	cd $(FIREFOX_SRC_PATH) && LANG=C jpm run -b `which firefox` -p $(abspath $(FIREFOX_TEST_PROFILE_PATH)) --no-copy --binary-args http://127.0.0.1:8888/test_frame.html

# end
