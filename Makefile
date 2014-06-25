# basic macros
# ========================================

SHELL = /bin/sh

ZIP = zip
ZIP_OPT = -qr9
UNZIP = unzip

RSYNC = rsync
RSYNC_OPT = -rptL --delete \
	--exclude '*.sw?' --exclude '*.bak' --exclude '*~' --exclude '*.sh' \
	--exclude '.*' --exclude 'oldlib/' \
	--exclude '$(CRYPT_SRC_FILE)*'

CHROME = chromium-browser

#

PRODUCT = wasavi
DIST_DIR = dist
SRC_DIR = src
EMBRYO_DIR = .embryo

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
FIREFOX_UPDATE_LOCATION = https://github.com/akahuku/wasavi/raw/master/dist/firefox.rdf

# derived macros
# ========================================

VERSION = $(shell echo -n `git describe --tags --abbrev=0|sed -e 's/[^0-9.]//g'`.`git rev-list --count HEAD`)
BINKEYS_PATH = $(EMBRYO_DIR)/$(CRYPT_DST_FILE)

CHROME_TARGET_PATH = $(DIST_DIR)/$(PRODUCT).$(CHROME_SUFFIX)
CHROME_MTIME_PATH = $(EMBRYO_DIR)/.$(CHROME_SUFFIX)
CHROME_SRC_PATH = $(SRC_DIR)/$(CHROME_SRC_DIR)
CHROME_EMBRYO_SRC_PATH = $(EMBRYO_DIR)/$(CHROME_SRC_DIR)

OPERA_TARGET_PATH = $(DIST_DIR)/$(PRODUCT).$(OPERA_SUFFIX)
OPERA_MTIME_PATH = $(EMBRYO_DIR)/.$(OPERA_SUFFIX)
OPERA_SRC_PATH = $(SRC_DIR)/$(OPERA_SRC_DIR)
OPERA_EMBRYO_SRC_PATH = $(EMBRYO_DIR)/$(OPERA_SRC_DIR)

BLINKOPERA_TARGET_PATH = $(DIST_DIR)/$(PRODUCT).$(BLINKOPERA_SUFFIX)
BLINKOPERA_MTIME_PATH = $(EMBRYO_DIR)/.$(BLINKOPERA_SUFFIX)
BLINKOPERA_SRC_PATH = $(SRC_DIR)/$(BLINKOPERA_SRC_DIR)
BLINKOPERA_EMBRYO_SRC_PATH = $(EMBRYO_DIR)/operablink

FIREFOX_TARGET_PATH = $(DIST_DIR)/$(PRODUCT).$(FIREFOX_SUFFIX)
FIREFOX_MTIME_PATH = $(EMBRYO_DIR)/.$(FIREFOX_SUFFIX)
FIREFOX_SRC_PATH = $(SRC_DIR)/$(FIREFOX_SRC_DIR)
FIREFOX_EMBRYO_SRC_PATH = $(EMBRYO_DIR)/$(FIREFOX_SRC_DIR)

# basic rules
# ========================================

all: $(CHROME_TARGET_PATH) \
	$(OPERA_TARGET_PATH) $(BLINKOPERA_TARGET_PATH) \
	$(FIREFOX_TARGET_PATH)

clean:
	rm -rf ./$(EMBRYO_DIR)

$(BINKEYS_PATH): $(CHROME_SRC_PATH)/$(CRYPT_KEY_FILE) $(CHROME_SRC_PATH)/$(CRYPT_SRC_FILE)
	tool/make-binkeys \
		--key=$(CHROME_SRC_PATH)/$(CRYPT_KEY_FILE) \
		--src=$(CHROME_SRC_PATH)/$(CRYPT_SRC_FILE) \
		--dst=$@

FORCE:

.PHONY: all clean message FORCE

#
# rules to make wasavi.crx
# ========================================
#

# wasavi.crx
$(CHROME_TARGET_PATH): $(CHROME_MTIME_PATH) $(BINKEYS_PATH)
#	copy all of sources to embryo dir
	rsync $(RSYNC_OPT) --exclude 'wasavi_frame_noscript.html' \
		$(CHROME_SRC_PATH)/ $(CHROME_EMBRYO_SRC_PATH)

#	create binary consumer keys, and remove its json source
	cp $(BINKEYS_PATH) $(CHROME_EMBRYO_SRC_PATH)
	rm -f $(CHROME_EMBRYO_SRC_PATH)/$(CRYPT_SRC_FILE)*

#	update manifest
	tool/update-chrome-manifest \
		--indir=$(CHROME_SRC_PATH) \
		--outdir=$(CHROME_EMBRYO_SRC_PATH) \
		--ver=$(VERSION)

#	build general crx
	$(CHROME) \
		--lang=en \
		--pack-extension=$(CHROME_EMBRYO_SRC_PATH) \
		--pack-extension-key=wasavi.pem

	mv $(EMBRYO_DIR)/$(CHROME_SRC_DIR).$(CHROME_SUFFIX) $@

#	update manifest for google web store
	tool/update-chrome-manifest \
		--indir=$(CHROME_SRC_PATH) \
		--outdir=$(CHROME_EMBRYO_SRC_PATH) \
		--ver=$(VERSION) \
		--strip-update-url

#	build zip archive for google web store
	rm -f $(DIST_DIR)/wasavi_chrome_web_store.zip
	cd $(CHROME_EMBRYO_SRC_PATH) \
		&& $(ZIP) $(ZIP_OPT) ../../$(DIST_DIR)/wasavi_chrome_web_store.zip .

#	create update description file
	sed -e 's/@appid@/$(CHROME_EXT_ID)/g' \
		-e 's!@location@!$(CHROME_EXT_LOCATION)!g' \
		-e 's/@version@/$(VERSION)/g' \
		$(SRC_DIR)/chrome.xml > $(DIST_DIR)/$(notdir $(CHROME_UPDATE_LOCATION))

	@echo ///
	@echo /// created: $@, version $(VERSION)
	@echo ///

# last mtime holder
$(CHROME_MTIME_PATH): FORCE
	@mkdir -p $(CHROME_EMBRYO_SRC_PATH) $(DIST_DIR)
	tool/mtime --dir=$(CHROME_SRC_PATH) --base=$(CHROME_TARGET_PATH) --out=$@



#
# rules to make wasavi.oex
# ========================================
#

# wasavi.oex
$(OPERA_TARGET_PATH): $(OPERA_MTIME_PATH) $(BINKEYS_PATH)
#	copy all of sources to embryo dir
	rsync $(RSYNC_OPT) $(OPERA_SRC_PATH)/ $(OPERA_EMBRYO_SRC_PATH)

#	update the manifest file
	tool/update-opera-config \
		--indir=$(OPERA_SRC_PATH) \
		--outdir=$(OPERA_EMBRYO_SRC_PATH) \
		--ver=$(VERSION) \
		--update-url=$(OPERA_UPDATE_LOCATION)

#	create binary consumer keys, and remove its json source
	cp $(BINKEYS_PATH) $(OPERA_EMBRYO_SRC_PATH)
	rm -f $(OPERA_EMBRYO_SRC_PATH)/$(CRYPT_SRC_FILE)*

#	create update description file
	sed -e 's/@appid@/$(OPERA_EXT_ID)/g' \
		-e 's!@location@!$(OPERA_EXT_LOCATION)!g' \
		-e 's/@version@/$(VERSION)/g' \
		$(SRC_DIR)/opera.xml > $(DIST_DIR)/$(notdir $(OPERA_UPDATE_LOCATION))

#	zip it
	rm -f $@
	cd $(OPERA_EMBRYO_SRC_PATH) && $(ZIP) $(ZIP_OPT) ../../$@ .

	@echo ///
	@echo /// created: $@, version $(VERSION)
	@echo ///

# last mtime holder
$(OPERA_MTIME_PATH): FORCE
	@mkdir -p $(OPERA_EMBRYO_SRC_PATH) $(DIST_DIR)
	tool/mtime --dir=$(OPERA_SRC_PATH) --base=$(OPERA_TARGET_PATH) --out=$@



#
# rules to make wasavi.nex
# ========================================
#

# wasavi.nex
$(BLINKOPERA_TARGET_PATH): $(BLINKOPERA_MTIME_PATH) $(BINKEYS_PATH)
#	copy all of sources to embryo dir
	rsync $(RSYNC_OPT) --exclude='wasavi_frame_noscript.html' \
		$(BLINKOPERA_SRC_PATH)/ $(BLINKOPERA_EMBRYO_SRC_PATH)

#	create binary consumer keys, and remove its json source
	cp $(BINKEYS_PATH) $(BLINKOPERA_EMBRYO_SRC_PATH)
	rm -f $(BLINKOPERA_EMBRYO_SRC_PATH)/$(CRYPT_SRC_FILE)*

#	update manifest
	tool/update-chrome-manifest \
		--indir=$(BLINKOPERA_SRC_PATH) \
		--outdir=$(BLINKOPERA_EMBRYO_SRC_PATH) \
		--ver=$(VERSION) \
		--update-url=$(BLINKOPERA_UPDATE_LOCATION)

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
		$(SRC_DIR)/opera-blink.xml > $(DIST_DIR)/$(notdir $(BLINKOPERA_UPDATE_LOCATION))

	@echo ///
	@echo /// created: $@, version $(VERSION)
	@echo ///

# last mtime holder
$(BLINKOPERA_MTIME_PATH): FORCE
	@mkdir -p $(BLINKOPERA_EMBRYO_SRC_PATH) $(DIST_DIR)
	tool/mtime --dir=$(BLINKOPERA_SRC_PATH) --base=$(BLINKOPERA_TARGET_PATH) --out=$@



#
# rules to make wasavi.xpi
# ========================================
#

# wasavi.xpi
$(FIREFOX_TARGET_PATH): $(FIREFOX_MTIME_PATH) $(BINKEYS_PATH)
#	copy all of sources to embryo dir
	rsync $(RSYNC_OPT) \
		$(FIREFOX_SRC_PATH)/ $(FIREFOX_EMBRYO_SRC_PATH)

#	create binary consumer keys, and remove its json source
	cp $(BINKEYS_PATH) $(FIREFOX_EMBRYO_SRC_PATH)/data
	rm -f $(FIREFOX_EMBRYO_SRC_PATH)/data/$(CRYPT_SRC_FILE)*

#	update package
	tool/update-firefox-package \
		--indir=$(FIREFOX_SRC_PATH) \
		--outdir=$(FIREFOX_EMBRYO_SRC_PATH) \
		--ver=$(VERSION)

#	build xpi
	cfx xpi \
		--pkgdir=$(FIREFOX_EMBRYO_SRC_PATH) \
		--update-link=$(FIREFOX_EXT_LOCATION) \
		--update-url=$(FIREFOX_UPDATE_LOCATION)

	mv $(PRODUCT).$(FIREFOX_SUFFIX) $@
	mv $(PRODUCT).update.rdf $(DIST_DIR)/update.rdf
	cp $@ $(DIST_DIR)/$(PRODUCT)_amo.$(FIREFOX_SUFFIX)
	cp $@ $(DIST_DIR)/$(PRODUCT)_amo_beta.$(FIREFOX_SUFFIX)

#	amo version
	$(UNZIP) -p $@ install.rdf > $(FIREFOX_EMBRYO_SRC_PATH)/install.rdf
	tool/update-firefox-manifest \
		--indir=$(FIREFOX_EMBRYO_SRC_PATH) \
		--outdir=$(FIREFOX_EMBRYO_SRC_PATH) \
		--localedir=$(SRC_DIR)/chrome/_locales \
		--ver=$(VERSION) \
		--strip-update-url
	$(ZIP) -u $(DIST_DIR)/$(PRODUCT)_amo.$(FIREFOX_SUFFIX) $(FIREFOX_EMBRYO_SRC_PATH)/install.rdf

#	amo(beta) version
	$(UNZIP) -p $@ install.rdf > $(FIREFOX_EMBRYO_SRC_PATH)/install.rdf
	tool/update-firefox-manifest \
		--indir=$(FIREFOX_EMBRYO_SRC_PATH) \
		--outdir=$(FIREFOX_EMBRYO_SRC_PATH) \
		--localedir=$(SRC_DIR)/chrome/_locales \
		--ver=$(VERSION)beta \
		--strip-update-url
	$(ZIP) -u $(DIST_DIR)/$(PRODUCT)_amo_beta.$(FIREFOX_SUFFIX) $(FIREFOX_EMBRYO_SRC_PATH)/install.rdf

	@echo ///
	@echo /// created: $@, version $(VERSION)
	@echo ///

# last mtime holder
$(FIREFOX_MTIME_PATH): FORCE
	@mkdir -p $(FIREFOX_EMBRYO_SRC_PATH) $(DIST_DIR)
	tool/mtime --dir=$(FIREFOX_SRC_PATH) --base=$(FIREFOX_TARGET_PATH) --out=$@



#
# rules to make messages
# ========================================
#

message: FORCE
#	update locales.json
	tool/update-locales \
		--indir=$(CHROME_SRC_PATH)/_locales

#	update firefox native localized messages
	tool/update-firefox-locales \
		--indir=$(FIREFOX_SRC_PATH) \
		--localedir=$(CHROME_SRC_PATH)/_locales

#	get diff of messages other than en-US
	tool/make-messages \
		--indir=$(CHROME_SRC_PATH) \
		$(CHROME_SRC_PATH)/frontend/*.js \
		$(CHROME_SRC_PATH)/backend/*.js \
		$(CHROME_SRC_PATH)/backend/lib/kosian/*.js

# end
