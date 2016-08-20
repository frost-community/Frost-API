'use strict';

const bodyParser = require('body-parser');
const express = require('express');
const co = require('co');
const routes = require('./routes');
const loadConfig = require('./modules/load-config');

module.exports = () => {
	console.log('--------------------');
	console.log('  Frost API Server  ');
	console.log('--------------------');

	const config = loadConfig();
	const app = express();
	app.disable('x-powered-by');
	app.use(bodyParser.json());
	var router = require('./modules/router')(app);

	const checkPermission = (request, response, next) => {
		var extensions = router.findRoute(request.method, request.route.path).extensions;

		if ('permissions' in extensions && extensions.permissions.length !== 0) {
			const applicationKey = request.get('X-Application-Key');
			const accessKey = request.get('X-Access-Key');

			if (applicationKey === undefined) {
				response.send({error: {message: 'X-Application-Key header is empty'}});
				return;
			}

			if (accessKey === undefined) {
				response.send({error: {message: 'X-Access-Key header is empty'}});
				return;
			}

			// TODO: insert user/application object in request
			request.user = {};
			request.application = {};

			// TODO: varify keys
			// TODO: check permissions
		}
		next();
	};

	router.addRoutes(routes(), [checkPermission]);

	app.listen(config.api.port, () => {
		console.log(`listen on port: ${config.api.port}`);
	});
}
