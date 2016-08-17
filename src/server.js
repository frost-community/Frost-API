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

	var r = router(app);

	const checkPermission = (req, res, next) => {
		var extensions = r.findRouteExtensions(req.method, req.path);

		if ('permissions' in extensions && extensions.permissions.length !== 0) {
			const applicationKey = req.get('X-Application-Key');
			const accessKey = req.get('X-Access-Key');

			if (applicationKey === undefined) {
				res.send({error: {message: 'X-Application-Key header is empty'}});
				return;
			}

			if (accessKey === undefined) {
				res.send({error: {message: 'X-Access-Key header is empty'}});
				return;
			}

			// TODO: varify keys
			// TODO: check permissions
		}
		next();
	};

	r.addRoutes(routes(), [checkPermission]);

	app.listen(config.api.port);
	console.log(`listen on port: ${config.api.port}`);
}
