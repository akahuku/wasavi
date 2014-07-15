/**
 * main logics of options page
 *
 * @author akahuku@gmail.com
 */
/**
 * Copyright 2012-2014 akahuku, akahuku@gmail.com
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

var extension;
var enableList;

/**
 * page initializer
 * ----------------
 */

function initPage (
	req, aEnableList, exrc, shortcut, fontFamily, quickActivation
) {
	enableList = aEnableList;
	for (var i in enableList) {
		var el = document.getElementById(i);
		if (el && el.nodeName == 'INPUT' && el.type == 'checkbox') {
			el.checked = enableList[i];
		}
	}

	var el;
	el = document.getElementById('exrc');
	if (el && el.nodeName == 'TEXTAREA') {
		el.value = exrc;
	}

	el = document.getElementById('shortcut');
	if (el && el.nodeName == 'INPUT') {
		el.value = shortcut;
	}

	el = document.getElementById('font-family');
	if (el && el.nodeName == 'INPUT') {
		el.value = fontFamily;
	}

	el = document.getElementById('save');
	if (el) {
		el.addEventListener('click', handleOptionsSave, false);
	}

	el = document.getElementById('opt-init');
	if (el) {
		el.addEventListener('click', handleOptionsInit, false);
	}

	[
		'title',
		'readme', 'license', 'notice',
		'exrc_head',
		'target_elements_head',
		'starting_type_head',
		'font_family_head',
		'exrc_desc',
		'quick_activation_on',
		'quick_activation_off',
		['target_elements_desc', function (node, message) {
			node.textContent = '';
			var ul = node.appendChild(document.createElement('ul'));
			message
			.replace(/^\s*\*\s*/, '')
			.split(/\n\*\s*/)
			.map(function (line) {
				var li = ul.appendChild(document.createElement('li'));
				li.textContent = line;
			});
		}],
		'preferred_storage_head',
		'init_head',
		'init_desc',
		'init_confirm',
		'save'
	]
	.forEach(function (key) {
		if (Object.prototype.toString.call(key) != '[object Array]') {
			key = [key];
		}

		var messageId = 'option_' + key[0];
		var callback = key[1] || function (node, message) {
			node.textContent = message;
		};
		var fallbackMessage = '(translated message not found)';
		var message = req.messageCatalog ?
			(messageId in req.messageCatalog ?
				req.messageCatalog[messageId].message :
				fallbackMessage) :
			(extension.getMessage(messageId) || fallbackMessage);
		var nodes = document.evaluate(
			'//*[text()="__MSG_' + messageId + '__"]',
			document.documentElement, null,
			window.XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);

		for (var i = 0, goal = nodes.snapshotLength; i < goal; i++) {
			callback(nodes.snapshotItem(i), message);
		}
	});

	document.evaluate(
		'//*[@name="quick-activation"][@value="' + (quickActivation ? 1 : 0) + '"]',
		document.body, null,
		window.XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.checked = true;

	// transition
	var overlay = document.getElementById('overlay');
	var tend = function (e) {
		e.target.parentNode && e.target.parentNode.removeChild(e.target);
	};

	'transitionend webkitTransitionEnd oTransitionEnd msTransitionEnd'
	.split(' ')
	.forEach(function (p) {overlay.addEventListener(p, tend, false)});

	overlay.className = 'overlay';
}

/**
 * save button handler
 * ----------------
 */

function handleOptionsSave () {
	var items = [];

	(function () {
		var tmpEnableList = {};
		var count = 0;

		for (var i in enableList) {
			var el = document.getElementById(i);
			if (el && el.nodeName == 'INPUT' && el.type == 'checkbox') {
				tmpEnableList[i] = el.checked;
				count++;
			}
		}

		if (count) {
			items.push({key:'targets', value:tmpEnableList});
		}
	})();

	var el = document.getElementById('exrc');
	if (el && el.nodeName == 'TEXTAREA') {
		items.push({key:'exrc', value:el.value});
	}

	var el = document.querySelector('input[name="quick-activation"]:checked');
	if (el) {
		items.push({key:'quickActivation', value:el.value == '1' ? '1' : '0'});
	}

	var el = document.getElementById('shortcut');
	if (el) {
		items.push({key:'shortcut', value:el.value});
	}

	var el = document.getElementById('font-family');
	if (el && el.nodeName == 'INPUT') {
		items.push({key:'fontFamily', value:el.value});
	}

	(function () {
		var tmpFstab = {
			dropbox:  {enabled: false},
			gdrive:   {enabled: false},
			onedrive: {enabled: false}
		};

		for (var i in tmpFstab) {
			var el = document.getElementById('pos-' + i);
			if (el) {
				if (!el.disabled) {
					tmpFstab[i].enabled = true;
				}
				if (el.checked) {
					tmpFstab[i].isDefault = true;
				}
			}
		}

		items.push({key:'fstab', value:tmpFstab});
	})();

	items.length && extension.postMessage(
		{type:'set-storage', items:items},
		function () {
			var saveResult = document.getElementById('save-result');
			if (saveResult) {
				saveResult.textContent = 'saved.';
				setTimeout(function () {
					saveResult.textContent = '';
				}, 1000 * 2);
			}
		}
	);
}

/**
 * reset button handler
 * ----------------
 */

function handleOptionsInit () {
	var message = document.getElementById('opt-init-confirm').textContent;
	window.confirm(message) && extension.postMessage(
		{type:'reset-options'},
		function () {
			window.location.reload();
		}
	);
}

global.WasaviOptions = {
	get extension () {return extension},
	set extension (v) {extension = v},
	initPage: initPage
};

})(this);

// vim:set ts=4 sw=4 fenc=UTF-8 ff=unix ft=javascript fdm=marker :
