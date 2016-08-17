'use strict';

const bodyParser = require('body-parser');
const express = require('express');
const co = require('co');
const router = require('./module/router');
const routes = require('./routes');
const loadConfig = require('./module/load-config');

module.exports = () => {
	console.log('--------------------');
	console.log('  Frost API Server  ');
	console.log('--------------------');

	const app = express();
	const config = loadConfig();

	const checkPermission = (req, res, next) => {
		console.log('check permission');
		// TODO: verify authentication information and permissions
		next();
	};

	var r = router(app);
	r.addRoutes(routes(), [checkPermission]);

	app.listen(config.api.port);
	console.log(`listen on port: ${config.api.port}`);
}
