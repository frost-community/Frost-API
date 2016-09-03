'use strict';

const bodyParser = require('body-parser');
const express = require('express');
const routes = require('./routes');
const loadConfig = require('./modules/load-config');
const type = require('./modules/type');
const dbConnector = require('./modules/db-connector')();
const applicationHelper = require('./modules/application-helper');
const applicationAccessHelper = require('./modules/application-access-helper');

module.exports = () => {
	console.log('--------------------');
	console.log('  Frost API Server  ');
	console.log('--------------------');

	const config = loadConfig();
	const app = express();
	app.disable('x-powered-by');
	app.use(bodyParser.json());
	var router = require('./modules/router')(app);

	const checkParams = (request, response, next) => {
		var extensions = router.findRoute(request.method, request.route.path).extensions;

		if ('params' in extensions && extensions.params.length !== 0) {
			for (var i = 0; i < extensions.params.length; i++) {
				const param = extensions.params[i];

				if (param.type == undefined || param.name == undefined)
				{
					response.status(500).send({error: {message: 'internal error', details: 'extentions.params elements are missing'}});
					throw new Error('extentions.params elements are missing');
				}

				const paramType = param.type;
				const paramName = param.name;
				const isRequire = param.require == undefined || param.require !== false; // requireにtrueが設定されている場合は必須項目になる。デフォルトでtrue

				if (isRequire) {
					if (request.body[paramName] == undefined) {
						response.status(400).send({error: {message: `parameter '${paramName}' is require`}});
						return;
					}

					if (type(request.body[paramName]).toLowerCase() !== paramType.toLowerCase()) {
						response.status(400).send({error: {message: `type of parameter '${paramName}' is invalid`}});
						return;
					}
				}
			}
		}

		next();
	};

	const checkPermission = async (request, response, next) => {
		var extensions = router.findRoute(request.method, request.route.path).extensions;

		if ('permissions' in extensions && extensions.permissions.length !== 0) {
			const applicationKey = request.get('X-Application-Key');
			const accessKey = request.get('X-Access-Key');

			if (applicationKey == undefined) {
				response.status(400).send({error: {message: 'X-Application-Key header is empty'}});
				return;
			}

			if (accessKey == undefined) {
				response.status(400).send({error: {message: 'X-Access-Key header is empty'}});
				return;
			}

			if (!(await applicationHelper.verifyApplicationKeyAsync(applicationKey))) {
				response.status(400).send({error: {message: 'X-Application-Key header is invalid'}});
				return;
			}

			if (!(await applicationAccessHelper.verifyAccessKeyAsync(accessKey))) {
				response.status(400).send({error: {message: 'X-Access-Key header is invalid'}});
				return;
			}

			const applicationId = applicationHelper.keyToElements(applicationKey).applicationId;
			const userId = applicationAccessHelper.keyToElements(accessKey).userId;

			const dbManager = await dbConnector.connectApidbAsync();
			request.application = dbManager.findArrayAsync('applications', {_id: applicationId});
			request.user = dbManager.findArrayAsync('users', {_id: userId});

			for (var i = 0; i < request.application.permissions.length; i++) {
				if (!request.application.isHasPermission(request.application.permissions[i])) {
					response.status(403).send({error: {message: 'you don\'t have any permissions'}});
					return;
				}
			}
		}

		next();
	};

	router.addRoutes(routes(), [checkPermission, checkParams]);

	app.listen(config.api.port, () => {
		console.log(`listen on port: ${config.api.port}`);
	});
}
