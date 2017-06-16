'use strict';

const commander = require('commander');
const setup = require('./setup');
const server = require('./server');

commander.option('-s, --setup', 'Display setup mode').parse(process.argv);

process.on('unhandledRejection', console.dir);
Error.stackTraceLimit = 20;

if (commander.setup) {
	setup();
}
else {
	server();
}
