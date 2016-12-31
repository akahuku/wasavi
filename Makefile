# application macros
# ========================================

VERSION := $(shell echo -n `git describe --tags --abbrev=0|sed -e 's/[^0-9.]//g' -e 's/^\([0-9]\+\.[0-9]\+\).*/\1/g'`.`git rev-list --count HEAD`)

SHELL := /bin/sh
PATH_SEPARATOR := /

CHROME := google-chrome
OPERA := opera
FIREFOX := firefox
CYGPATH := echo
REALPATH := realpath

ZIP := zip -qr9
UNZIP := unzip

RSYNC := rsync

# basic macros
# ========================================

PRODUCT = wasavi
DIST_DIR = dist
SRC_DIR = src
EMBRYO_DIR = .embryo

RSYNC_OPT = -rptL --delete \
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
CHROME_EXT_LOCATION = https://github.com/akahuku/$(PRODUCT)/raw/master/dist/$(PRODUCT).crx
CHROME_UPDATE_LOCATION = https://github.com/akahuku/$(PRODUCT)/raw/master/dist/chrome.xml

OPERA_SUFFIX = oex
OPERA_SRC_DIR = opera
OPERA_EXT_ID =
OPERA_EXT_LOCATION = https://github.com/akahuku/$(PRODUCT)/raw/master/dist/$(PRODUCT).oex
OPERA_UPDATE_LOCATION = https://github.com/akahuku/$(PRODUCT)/raw/master/dist/opera.xml

BLINKOPERA_SUFFIX = nex
BLINKOPERA_SRC_DIR = opera-blink
BLINKOPERA_EXT_ID = dgogifpkoilgiofhhhodbodcfgomelhe
BLINKOPERA_EXT_LOCATION = https://github.com/akahuku/$(PRODUCT)/raw/master/dist/$(PRODUCT).nex
BLINKOPERA_UPDATE_LOCATION = https://github.com/akahuku/$(PRODUCT)/raw/master/dist/opera-blink.xml

FIREFOX_SUFFIX = xpi
FIREFOX_SRC_DIR = firefox
FIREFOX_EXT_ID = jid1-bmMwuNrx3u5hqQ@jetpack
FIREFOX_EXT_LOCATION = https://github.com/akahuku/$(PRODUCT)/raw/master/dist/$(PRODUCT).xpi
FIREFOX_UPDATE_LOCATION = https://github.com/akahuku/$(PRODUCT)/raw/master/dist/firefox.json

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
BLINKOPERA_EMBRYO_SRC_PATH = $(EMBRYO_DIR)/$(BLINKOPERA_SRC_DIR)

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

all: crx oex nex xpi

crx: $(CHROME_TARGET_PATH)

oex: $(OPERA_TARGET_PATH)

nex: $(BLINKOPERA_TARGET_PATH)

xpi: $(FIREFOX_TARGET_PATH)

clean:
	rm -rf ./$(EMBRYO_DIR)

$(BINKEYS_PATH): $(CHROME_SRC_PATH)/$(CRYPT_KEY_FILE) $(CHROME_SRC_PATH)/$(CRYPT_SRC_FILE)
	tool/make-binkey.js \
		--key $(CHROME_SRC_PATH)/$(CRYPT_KEY_FILE) \
		--src $(CHROME_SRC_PATH)/$(CRYPT_SRC_FILE) \
		--dst $@

FORCE:

.PHONY: all crx oex nex xpi \
	clean message \
	test-chrome test-opera test-firefox \
	run-chrome run-opera run-firefox \
	dbgfx version \
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
	tool/update-chrome-manifest.js \
		--indir $(CHROME_SRC_PATH) \
		--outdir $(CHROME_EMBRYO_SRC_PATH) \
		--ver $(VERSION)

#	build general crx
	$(CHROME) \
		--lang=en \
		--pack-extension=$(CHROME_EMBRYO_SRC_PATH) \
		--pack-extension-key=$(PRODUCT).pem

	mv $(EMBRYO_DIR)/$(CHROME_SRC_DIR).$(CHROME_SUFFIX) $@

#	update manifest for google web store
	tool/update-chrome-manifest.js \
		--indir $(CHROME_SRC_PATH) \
		--outdir $(CHROME_EMBRYO_SRC_PATH) \
		--ver $(VERSION) \
		--strip-update-url \
		--strip-applications

#	build zip archive for google web store
	rm -f $(DIST_DIR)/$(PRODUCT)_chrome_web_store.zip
	cd $(CHROME_EMBRYO_SRC_PATH) \
		&& find . -type f -print0 | sort -z | xargs -0 $(ZIP) \
		../../$(DIST_DIR)/$(PRODUCT)_chrome_web_store.zip

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
	tool/mtime.js --dir $(CHROME_SRC_PATH) --base $(CHROME_TARGET_PATH) --out $@



#
# rules to make wasavi.oex
# ========================================
#

# wasavi.oex
$(OPERA_TARGET_PATH): $(OPERA_MTIME_PATH) $(BINKEYS_PATH)
#	copy all of sources to embryo dir
	$(RSYNC) $(RSYNC_OPT) $(OPERA_SRC_PATH)/ $(OPERA_EMBRYO_SRC_PATH)

#	update the manifest file
	tool/update-opera-config.js \
		--indir $(OPERA_SRC_PATH) \
		--product $(PRODUCT) \
		--ver $(VERSION) \
		--outdir $(OPERA_EMBRYO_SRC_PATH) \
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
	tool/mtime.js --dir $(OPERA_SRC_PATH) --base $(OPERA_TARGET_PATH) --out $@



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
	tool/update-chrome-manifest.js \
		--indir $(BLINKOPERA_SRC_PATH) \
		--outdir $(BLINKOPERA_EMBRYO_SRC_PATH) \
		--ver $(VERSION) \
		--update-url $(BLINKOPERA_UPDATE_LOCATION) \
		--strip-applications

#	build nex
	$(CHROME) \
		--lang=en \
		--pack-extension=$(BLINKOPERA_EMBRYO_SRC_PATH) \
		--pack-extension-key=$(PRODUCT).pem

	mv $(EMBRYO_DIR)/$(BLINKOPERA_SRC_DIR).$(CHROME_SUFFIX) $@

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
	tool/mtime.js --dir $(BLINKOPERA_SRC_PATH) --base $(BLINKOPERA_TARGET_PATH) --out $@



#
# rules to make wasavi.xpi
# ========================================
#

# wasavi.xpi
$(FIREFOX_TARGET_PATH): $(FIREFOX_MTIME_PATH) $(BINKEYS_PATH)
#	copy all of sources to embryo dir
	$(RSYNC) $(RSYNC_OPT) \
		$(FIREFOX_SRC_PATH)/ $(FIREFOX_EMBRYO_SRC_PATH)

#	update manifest
	tool/update-chrome-manifest.js \
		--indir $(FIREFOX_SRC_PATH) \
		--outdir $(FIREFOX_EMBRYO_SRC_PATH) \
		--ver $(VERSION) \
		--strip-update-url

#	build and sign xpi
	./signxpi \
		-s $(FIREFOX_EMBRYO_SRC_PATH) \
		-d $(DIST_DIR)

#	create update description file
	sed -e 's/@appid@/$(FIREFOX_EXT_ID)/g' \
		-e 's!@location@!$(FIREFOX_EXT_LOCATION)!g' \
		-e 's/@version@/$(VERSION)/g' \
		$(SRC_DIR)/template-firefox.json > $(DIST_DIR)/$(notdir $(FIREFOX_UPDATE_LOCATION))

	@echo ///
	@echo /// created: $@, version $(VERSION)
	@echo ///

# last mtime holder
$(FIREFOX_MTIME_PATH): FORCE
	@mkdir -p $(FIREFOX_EMBRYO_SRC_PATH) $(DIST_DIR)
	tool/mtime.js --dir $(FIREFOX_SRC_PATH) --base $(FIREFOX_TARGET_PATH) --out $@



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
	tool/update-locales.js \
		--indir $(CHROME_SRC_PATH)/_locales

#	get diff of messages other than en-US
	tool/make-messages.js \
		--indir=$(CHROME_SRC_PATH) \
		$(CHROME_SRC_PATH)/frontend/*.js \
		$(CHROME_SRC_PATH)/backend/*.js \
		$(CHROME_SRC_PATH)/backend/lib/kosian/*.js



#
# rules to test
# ========================================
#

test-chrome: FORCE
	./server &
	cd $(SRC_DIR)/wd-tests && ant test-chrome

test-opera: FORCE
	./server &
	cd $(SRC_DIR)/wd-tests && ant test-opera

test-firefox: FORCE
	./server &
#	-mkdir -p $(FIREFOX_TEST_PROFILE_PATH)
#	-mkdir -p $(FIREFOX_TEST_PROFILE_PATH)/extensions
#	echo -n "$(shell $(REALPATH) $(FIREFOX_SRC_PATH))$(PATH_SEPARATOR)" > $(FIREFOX_TEST_PROFILE_PATH)/extensions/$(FIREFOX_EXT_ID)
	cd $(SRC_DIR)/wd-tests && ant test-firefox

run-chrome: FORCE
	./server &
	-mkdir -p $(CHROME_TEST_PROFILE_PATH)
	$(CHROME) --start-maximized --lang=en \
		--user-data-dir=$(CHROME_TEST_PROFILE_PATH) \
		http://127.0.0.1:8888/test_frame.html
	wget -q -O - http://127.0.0.1:8888/shutdown

run-opera: FORCE
	./server &
	-mkdir -p $(OPERA_TEST_PROFILE_PATH)
	$(OPERA) -pd $(OPERA_TEST_PROFILE_PATH) \
		http://127.0.0.1:8888/test_frame.html
	wget -q -O - http://127.0.0.1:8888/shutdown

run-firefox: FORCE
	./server &
#	-mkdir -p $(FIREFOX_TEST_PROFILE_PATH)/extensions
#	echo -n "$(shell $(REALPATH) $(FIREFOX_SRC_PATH))$(PATH_SEPARATOR)" > $(FIREFOX_TEST_PROFILE_PATH)/extensions/$(FIREFOX_EXT_ID)
	$(FIREFOX) -profile $(shell $(REALPATH) $(FIREFOX_TEST_PROFILE_PATH))
	wget -q -O - http://127.0.0.1:8888/shutdown

debug-firefox: FORCE
	./server &
	cd $(FIREFOX_SRC_PATH) && web-ext run --firefox=$(FIREFOX)
	wget -q -O - http://127.0.0.1:8888/shutdown

version: FORCE
	@echo $(VERSION)

# end
