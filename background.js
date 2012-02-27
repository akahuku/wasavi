/**
 * wasavi: vi clone implemented in javascript
 * =============================================================================
 *
 *
 * @author akahuku@gmail.com
 * @version $Id: background.js 94 2012-02-26 12:07:45Z akahuku $
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

var tabIds = {};

function initStorage () {
	localStorage.setItem(
		'start_at', 
		(new Date).toLocaleDateString() + ' ' + (new Date).toLocaleTimeString()
	);

	if (localStorage.getItem('targets') === null) {
		localStorage.setItem('targets', JSON.stringify({
			enableTextArea: true,
			enableText: false,
			enableSearch: false,
			enableTel: false,
			enableUrl: false,
			enableEmail: false,
			enablePassword: false,
			enableNumber: false,
		}));
	}

	if (localStorage.getItem('exrc') === null) {
		localStorage.setItem('exrc', '" exrc for wasavi');
	}
}

function broadcastStorageUpdate (keys, originTabId) {
	var obj = {type:'update-storage', keys:keys};
	for (var i in tabIds) {
		i != originTabId && chrome.tabs.sendRequest(i, obj);
	}
}

function handleTabRemoved (tabId) {
	delete tabIds[tabId];
}

function handleRequest (req, sender, res) {
	if (!req || !req.type) {
		return;
	}

	switch (req.type) {
	case 'init':
		tabIds[sender.tab.id] = 1;
		res({
			tabId:sender.tab.id,
			targets:JSON.parse(localStorage.getItem('targets')),
			exrc:localStorage.getItem('exrc') || ''
		});
		break;

	case 'load':
		if ('tabId' in req) {
			chrome.tabs.executeScript(req.tabId, {file:'wasavi.js', allFrames:true}, function () {
				res({});
			});
		}
		break;

	case 'get-storage':
		if ('key' in req) {
			res({key:req.key, value:localStorage.getItem(req.key)});
		}
		else {
			res({key:req.key, value:undefined});
		}
		break;

	case 'set-storage':
		if ('tabId' in req) {
			if ('key' in req && 'value' in req) {
				localStorage.setItem(req.key, req.value);
				broadcastStorageUpdate([req.key], req.tabId);
				res({});
			}
			else if ('items' in req) {
				var keys = [];
				req.items.forEach(function (item) {
					keys.push(item.key);
					localStorage.setItem(item.key, item.value);
				});
				broadcastStorageUpdate(keys, req.tabId);
				res({});
			}
		}
		break;
	}
}

initStorage();
chrome.tabs.onRemoved.addListener(handleTabRemoved);
chrome.self.onRequest.addListener(handleRequest);

// vim:set ts=4 sw=4 fileencoding=UTF-8 fileformat=unix filetype=javascript :

