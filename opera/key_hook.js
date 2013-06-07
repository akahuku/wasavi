(function () {
	var wasaviRunning = false;
	function isHookEvent (eventName) {return eventName == 'keydown' || eventName == 'keypress'}
	function getKey (eventName, useCapture) {return eventName + '_' + !!useCapture}
	function hook (target) {
		if (!target || !target.addEventListener || !target.removeEventListener) return;
		var addOriginal = target.addEventListener;
		var removeOriginal = target.removeEventListener;
		var listeners = [];
		target.addEventListener = function (eventName, listener, useCapture) {
			if (!isHookEvent(eventName)) {
				addOriginal.call(this, eventName, listener, useCapture);
				return;
			}
			var key = getKey(eventName, useCapture);
			if (!listeners[key]) {
				listeners[key] = [];
			}
			if (!listeners[key].some(function (o) { return o[0] == listener; })) {
				var wrappedListener = function (e) {!wasaviRunning && listener && listener(e)};
				listeners[key].push([listener, wrappedListener]);
				addOriginal.call(this, eventName, wrappedListener, useCapture);
			}
		};
		target.removeEventListener = function (eventName, listener, useCapture) {
			if (!isHookEvent(eventName)) {
				removeOriginal.call(this, eventName, listener, useCapture);
				return;
			}
			var key = getKey(eventName, useCapture);
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
	hook(window.HTMLInputElement && window.HTMLInputElement.prototype);
	hook(window.HTMLTextAreaElement && window.HTMLTextAreaElement.prototype);
	hook(window.Node && window.Node.prototype);
	document.addEventListener('WasaviStarting', function (e) {wasaviRunning = true}, false);
	document.addEventListener('WasaviTerminated', function (e) {wasaviRunning = false}, false);
})();
