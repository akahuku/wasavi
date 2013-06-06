/**
 * tab watcher
 * =============================================================================
 *
 *
 * @author akahuku@gmail.com
 * @version $Id: TabWatcher.js 300 2013-06-06 16:31:37Z akahuku $
 */
/**
 * Copyright 2012 akahuku, akahuku@gmail.com
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

(function (global) {
	'use strict';

	var u;

	function TabWatcher (emit) {
		this.add = function (id, url, callback) {
			emit(callback, null);
		};
	}

	function ChromeTabWatcher (emit) {
		var targets = {};

		function handleTabUpdate (tabId, changeInfo, tab) {
			if (!targets[tabId] || !changeInfo.url) return;
			var target = targets[tabId];
			var isStartUrl = u.baseUrl(tab.url) == u.baseUrl(target.startUrl);
			if (tab.url == '' || target.state && !isStartUrl) {
				emit(target.callback, tab.url);
				delete targets[tabId];
				if (countOf(targets) == 0) {
					chrome.tabs.onUpdated.removeListener(handleTabUpdate);
					chrome.tabs.onRemoved.removeListener(handleTabRemove);
				}
			}
			else if (!target.state && isStartUrl) {
				target.state = true;
			}
		}

		function handleTabRemove (tabId, removeInfo) {
			if (!targets[tabId]) return;
			emit(targets[tabId].callback, '');
			delete targets[tabId];
			if (countOf(targets) == 0) {
				chrome.tabs.onUpdated.removeListener(handleTabUpdate);
				chrome.tabs.onRemoved.removeListener(handleTabRemove);
			}
		}

		this.add = function (id, url, callback) {
			chrome.tabs.get(id, function (tab) {
				if (countOf(targets) == 0) {
					chrome.tabs.onUpdated.addListener(handleTabUpdate);
					chrome.tabs.onRemoved.addListener(handleTabRemove);
				}
				targets[id] = {tab:id, startUrl:tab.url, callback:callback};
			});
		};
	}

	function OperaTabWatcher (emit) {
		var targets = [];
		var timer;

		function startTimer () {
			if (timer) return;
			timer = setInterval(function () {
				var newTargets = [];

				targets.forEach(function (target) {
					var currentUrl;
					try {
						currentUrl = target.tab.url || '';
					}
					catch (e) {
						currentUrl = '';
					}

					var isStartUrl = u.baseUrl(currentUrl) == u.baseUrl(target.startUrl);
					if (currentUrl == '' || target.state && !isStartUrl) {
						emit(target.callback, currentUrl);
						target.callback = null;
					}
					else {
						if (!target.state && isStartUrl) {
							target.state = true;
						}
						newTargets.push(target);
					}
				});

				if (newTargets.length == 0) {
					clearInterval(timer);
					timer = null;
				}
				else {
					targets = newTargets;
				}
			}, 1000);
		}

		this.add = function (id, url, callback) {
			opera.extension.tabs.getAll().some(function (tab) {
				if (id instanceof MessagePort && tab.port == id
				||  typeof id == 'number' && tab.id == id) {
					targets.push({tab:tab, startUrl:url, callback:callback});
					startTimer();
					return true;
				}
				return false;
			});
		};
	}

	function FirefoxJetpackTabWatcher (emit) {
		var timers = require('sdk/timers');
		var setInterval = timers.setInterval;
		var clearInterval = timers.clearInterval;
		var targets = [];
		var timer;

		function startTimer () {
			if (timer) return;

			timer = setInterval(function () {
				var newTargets = [];

				targets.forEach(function (target) {
					var currentUrl;
					try {
						currentUrl = target.tab.url || '';
					}
					catch (e) {
						currentUrl = '';
					}

					var isStartUrl = u.baseUrl(currentUrl) == u.baseUrl(target.startUrl);
					if (currentUrl == '' || target.state && !isStartUrl) {
						emit(target.callback, currentUrl);
						target.callback = null;
					}
					else {
						if (!target.state && isStartUrl) {
							target.state = true;
						}
						newTargets.push(target);
					}
				});

				if (newTargets.length == 0) {
					clearInterval(timer);
					timer = null;
				}
				else {
					targets = newTargets;
				}
			}, 1000);
		}

		this.add = function (id, url, callback) {
			// in this context, id is Tab object instance.
			targets.push({tab:id, startUrl:url, callback:callback});
			startTimer();
			return true;
		};
	}

	function create (window, emit) {
		if (window.chrome) {
			return new ChromeTabWatcher(emit);
		}
		else if (window.opera) {
			return new OperaTabWatcher(emit);
		}
		else if (window.jetpack) {
			return new FirefoxJetpackTabWatcher(emit);
		}
		return new TabWatcher;
	}

	if (global.WasaviUtils) {
		u = global.WasaviUtils;
	}
	else if (typeof require == 'function') {
		u = require('./WasaviUtils').WasaviUtils;
	}

	exports.TabWatcher = {create:create};
})(this);

// vim:set ts=4 sw=4 fenc=UTF-8 ff=unix ft=javascript fdm=marker :

