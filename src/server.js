'use strict';

const bodyParser = require('body-parser');
const koa = require('koa');
const co = require('co');
const router = require('./modules/router');
const routes = require('./routes');
const loadConfig = require('./modules/load-config');

module.exports = () => {
	console.log('--------------------');
	console.log('  Frost API Server  ');
	console.log('--------------------');

	const app = koa();
	const config = loadConfig();

	const beforeAction = function *(req, res) {
		console.log('before');
		// TODO: verify authentication information and permissions
	}

	router(app, routes(), beforeAction);

	app.listen(config.api.port);
	console.log(`listen on port: ${config.api.port}`);
}
