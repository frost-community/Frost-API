'use strict';

const applicationModel = require('../../models/application');
const applicationAccessModel = require('../../models/applicationAccess');

const applicationsAsync = require('../../collections/applications');
const usersAsync = require('../../collections/users');

module.exports = (router) => {
	let instance = {};

	instance.execute = (request, response, next) => {
		try {
			(async () => {
				try {
					let route = router.findRoute(request.method, request.route.path);
					let extensions = route.extensions;

					if ('permissions' in extensions && extensions.permissions.length !== 0) {
						const applicationKey = request.get('X-Application-Key');
						const accessKey = request.get('X-Access-Key');

						if (applicationKey == null) {
							response.status(400).send({error: {message: 'X-Application-Key header is empty'}});
							return;
						}

						if (accessKey == null) {
							response.status(400).send({error: {message: 'X-Access-Key header is empty'}});
							return;
						}

						if (!(await applicationModel.verifyKeyAsync(applicationKey))) {
							response.status(400).send({error: {message: 'X-Application-Key header is invalid'}});
							return;
						}

						if (!(await applicationAccessModel.verifyKeyAsync(accessKey))) {
							response.status(400).send({error: {message: 'X-Access-Key header is invalid'}});
							return;
						}

						const applicationId = applicationModel.splitKey(applicationKey).applicationId;
						const userId = applicationAccessModel.splitKey(accessKey).userId;

						request.application = (await applicationsAsync()).findAsync({_id: applicationId});
						request.user = await (await usersAsync()).findAsync({_id: userId});

						for (let permission of extensions.permissions) {
							if (!await request.application.hasPermissionAsync(permission)) {
								response.status(403).send({error: {message: 'you do not have any permissions'}});
								return;
							}
						}

						next();
					}
					else {
						next();
					}
				}
				catch(err) {
					console.log(`checkPermission failed A (${err})`);
					throw err;
				}
			})();
		}
		catch(err) {
			console.log('checkPermission failed B (${err})');
			throw err;
		}
	};

	return instance;
};
