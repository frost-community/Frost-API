'use strict';

var commander = require('commander');

commander
	.option('-s, --setup', 'Display setup prompt')
	.parse(process.argv);

(async () => {
	if (commander.setup) {
		await require('./setup')();
	}
	else {
		await require('./server')();
	}
	process.exit(0);
})();
