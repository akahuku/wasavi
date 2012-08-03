if (window.location.protocol == 'chrome-extension:' && window.chrome) {
	document.write('<script src="extension_wrapper.js"></scr' + 'ipt>');
	document.write('<script src="wasavi.js"></scr' + 'ipt>');
}
else if (window.location.protocol == 'widget:' && window.opera) {
	document.write('<script src="includes/001_extension_wrapper.js"></scr' + 'ipt>');
	document.write('<script src="includes/wasavi.js"></scr' + 'ipt>');
}
