/**
 * wasavi: vi clone implemented in javascript
 * =============================================================================
 *
 *
 * @author akahuku@gmail.com
 * @version $Id: agent.js 94 2012-02-26 12:07:45Z akahuku $
 *
 *
 * Copyright (c) 2012 akahuku@gmail.com
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     1. Redistributions of source code must retain the above copyright
 *        notice, this list of conditions and the following disclaimer.
 *     2. Redistributions in binary form must reproduce the above
 *        copyright notice, this list of conditions and the following
 *        disclaimer in the documentation and/or other materials
 *        provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

(function () {
	var tabId;
	var enableList;
	var exrc;

	function sendReq (data, callback) {
		data || (data = {});
		if (tabId != undefined) {
			data.tabId = tabId;
		}
		chrome.extension.sendRequest(data, callback);
	}

	function run (element) {
		if (window.Wasavi && !Wasavi.running) {
			if (enableList) {
				Wasavi.enableList = enableList;
				enableList = null;
			}
			if (exrc) {
				Wasavi.exrc = exrc;
				exrc = null;
			}
			Wasavi.injectKeyevents = true;
			Wasavi.run(element);
			return true;
		}
	}

	function handleKeydown (e) {
		if (window.Wasavi && Wasavi.running) {
			Wasavi.notifyKeyevent(e);
			return;
		}

		if (e.target
		&& (e.target.nodeName == 'TEXTAREA' || e.target.nodeName == 'INPUT')
		&& (e.ctrlKey && e.keyIdentifier == 'Enter' || e.keyIdentifier == 'Insert')) {
			e.preventDefault();

			if (window.Wasavi) {
				run(e.target);
			}
			else {
				sendReq({type:'load'}, function (res) {
					run(e.target) || console.log('Wasavi: internal error: Wasavi loading failed.');
				});
			}
		}
	}

	function handleKeypress (e) {
		if (window.Wasavi && Wasavi.running) {
			Wasavi.notifyKeyevent(e);
		}
	}

	function handleRequest (req, sender, res) {
		if (!req || !req.type) {
			return;
		}

		switch (req.type) {
		case 'update-storage':
			if (window.Wasavi && Wasavi.running) {
				Wasavi.notifyUpdateStorage(req.keys);
			}
			break;
		}
	}

	function pageAgent () {
		var wasaviRunning = false;

		function removeSelf () {
			var ss = document.getElementsByTagName('script');
			if (ss.length) {
				ss = ss[ss.length - 1];
				ss.parentNode.removeChild(ss);
			}
		}

		function hookEventListener (host) {
			var addOriginal = host.addEventListener;
			var removeOriginal = host.removeEventListener;
			var listeners = [];

			function isHookEvent (eventName) {
				return eventName == 'keydown' || eventName == 'keypress';
			}

			host.addEventListener = function (eventName, listener, useCapture) {
				if (!isHookEvent(eventName)) {
					addOriginal.call(this, eventName, listener, useCapture);
					return;
				}

				var key = eventName + '_' + !!useCapture;
				if (!listeners[key]) {
					listeners[key] = [];
				}
				if (!listeners[key].some(function (o) { return o[0] == listener; })) {
					var wrappedListener = function (e) {
						!wasaviRunning && listener && listener(e);
					};
					listeners[key].push([listener, wrappedListener]);
					addOriginal.call(this, eventName, wrappedListener, useCapture);
				}
			};
			host.removeEventListener = function (eventName, listener, useCapture) {
				if (!isHookEvent(eventName)) {
					removeOriginal.call(this, eventName, listener, useCapture);
					return;
				}

				var key = eventName + '_' + !!useCapture;
				if (!listeners[key]) {
					return;
				}
				listeners[key] = listeners[key].filter(function (o) {
					if (o[0] == listener) {
						removeOriginal.call(this, eventName, o[1], useCapture);
						return false;
					}
					return true;
				}, this);
			};
		}

		document.addEventListener('wasavi_start', function (e) {
			wasaviRunning = true;
			console.log('wasavi start');
		}, false);

		document.addEventListener('wasavi_terminate', function (e) {
			wasaviRunning = false;
			console.log('wasavi terminate');
		}, false);

		hookEventListener(window);
		hookEventListener(document);
		removeSelf();
	}

	function createPageAgent () {
		var s = document.createElement('script');
		s.type = 'text/javascript';
		s.text = '(' + pageAgent.toString().replace('^(function)[^(]*/', '$1') + ')();';
		document.documentElement.appendChild(s);
	}

	function initialized (res) {
		tabId = res.tabId;
		enableList = res.enableList;
		exrc = res.exrc;
	}

	//
	sendReq({type:'init'}, initialized);

	//
	if (location.protocol != 'chrome-extension:') {
		createPageAgent();
	}

	//
	window.addEventListener('keydown', handleKeydown, true);
	window.addEventListener('keypress', handleKeypress, true);
	chrome.extension.onRequest.addListener(handleRequest);

	window.WasaviAgent = {
		sendReq: sendReq
	};
})();

// vim:set ts=4 sw=4 fileencoding=UTF-8 fileformat=unix filetype=javascript :
