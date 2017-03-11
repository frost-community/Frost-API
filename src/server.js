'use strict';

const bodyParser = require('body-parser');
const express = require('express');
const routes = require('./routes');
const loadConfig = require('./helpers/loadConfig');

module.exports = () => {
	console.log('--------------------');
	console.log('  Frost API Server  ');
	console.log('--------------------');

	const config = loadConfig();
	const app = express();
	app.disable('x-powered-by');
	app.use(bodyParser.json());
	const router = require('./helpers/router')(app, config);

	const checkParams = require('./helpers/middlewares/checkParams')(router).execute;
	const checkPermission = require('./helpers/middlewares/checkPermission')(router).execute;

	router.addRoutes(routes(), [checkPermission, checkParams]);

	app.listen(config.api.port, () => {
		console.log(`listen on port: ${config.api.port}`);
	});
};
