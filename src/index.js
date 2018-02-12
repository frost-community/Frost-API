const argv = require('argv');
const setup = require('./setup');
const server = require('./server');

argv.option({
	name: 'setup',
	short: 's',
	type: 'boolean',
	description: 'Display setup mode'
});

const { options } = argv.run();

process.on('unhandledRejection', err => console.log(err));
Error.stackTraceLimit = 20;

if (options.setup) {
	setup();
}
else {
	server();
}
