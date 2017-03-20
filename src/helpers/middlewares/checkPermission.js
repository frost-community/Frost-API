'use strict';

const Application = require('../../documentModels/application');
const ApplicationAccess = require('../../documentModels/applicationAccess');

module.exports = (request, response, next) => {
	(async () => {
		try {
			const route = request.directoryRouter.findRoute(request.method, request.route.path);
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

				if (!await Application.verifyKeyAsync(applicationKey, request.db, request.config)) {
					response.status(400).send({error: {message: 'X-Application-Key header is invalid'}});
					return;
				}

				if (!await ApplicationAccess.verifyKeyAsync(accessKey, request.db, request.config)) {
					response.status(400).send({error: {message: 'X-Access-Key header is invalid'}});
					return;
				}

				const applicationId = Application.splitKey(applicationKey, request.db, request.config).applicationId;
				const userId = ApplicationAccess.splitKey(accessKey, request.db, request.config).userId;

				request.application = (await request.db.applications.findByIdAsync(applicationId));
				request.user = (await request.db.users.findByIdAsync(userId));

				const hasPermissions = extensions.permissions.every(p => request.application.hasPermission(p));
				if (!hasPermissions) {
					response.status(403).send({error: {message: 'you do not have any permissions'}});
					return;
				}
			}
			next();
		}
		catch(err) {
			console.log(`checkPermission failed (${err})`);
			throw err;
		}
	})();
};
