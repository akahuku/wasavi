if (window.chrome) {
	document.write('<script src="extension_wrapper.js"></scr' + 'ipt>');
	document.write('<script src="agent.js"></scr' + 'ipt>');
}
else if (window.opera) {
	document.write('<script src="includes/001_extension_wrapper.js"></scr' + 'ipt>');
	document.write('<script src="includes/agent.js"></scr' + 'ipt>');
}
