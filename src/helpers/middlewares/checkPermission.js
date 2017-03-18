'use strict';

const ApplicationModel = require('../../models/Application');
const ApplicationAccessModel = require('../../models/ApplicationAccess');

module.exports = (directoryRouter, db, config) => {
	const instance = {};

	const applicationModel = new ApplicationModel(db, config);
	const applicationAccessModel = new ApplicationAccessModel(db, config);

	instance.execute = (request, response, next) => {
		(async () => {
			try {
				const route = directoryRouter.findRoute(request.method, request.route.path);
				const extensions = route.extensions;

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

					if (!await applicationModel.verifyKeyAsync(applicationKey)) {
						response.status(400).send({error: {message: 'X-Application-Key header is invalid'}});
						return;
					}

					if (!await applicationAccessModel.verifyKeyAsync(accessKey)) {
						response.status(400).send({error: {message: 'X-Access-Key header is invalid'}});
						return;
					}

					const applicationId = applicationModel.splitKey(applicationKey).applicationId;
					const userId = applicationAccessModel.splitKey(accessKey).userId;

					const applicationDoc = (await db.applications.findIdAsync(applicationId));
					request.application = applicationDoc.document;
					request.user = (await db.users.findIdAsync(userId)).document;

					for (const permission of extensions.permissions) {
						if (!applicationDoc.hasPermission(permission)) {
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
				console.log(`checkPermission failed (${err})`);
				throw err;
			}
		})();
	};

	return instance;
};
