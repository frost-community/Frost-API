'use strict';

const ApplicationModel = require('../../models/application');
const ApplicationAccessModel = require('../../models/applicationAccess');

class CheckPermission {
	constructor(directoryRouter, db, config) {
		this.directoryRouter = directoryRouter;
		this.applicationModel = new ApplicationModel(db, config);
		this.applicationAccessModel = new ApplicationAccessModel(db, config);
	}

	execute(request, response, next) {
		const f = async () => {
			try {
				const route = this.directoryRouter.findRoute(request.method, request.route.path);
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

					if (!await this.applicationModel.verifyKeyAsync(applicationKey)) {
						response.status(400).send({error: {message: 'X-Application-Key header is invalid'}});
						return;
					}

					if (!await this.applicationAccessModel.verifyKeyAsync(accessKey)) {
						response.status(400).send({error: {message: 'X-Access-Key header is invalid'}});
						return;
					}

					const applicationId = this.applicationModel.splitKey(applicationKey).applicationId;
					const userId = this.applicationAccessModel.splitKey(accessKey).userId;

					const applicationDoc = (await this.db.applications.findIdAsync(applicationId));
					request.application = applicationDoc.document;
					request.user = (await this.db.users.findIdAsync(userId)).document;

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
		};
		f.call(this, []);
	}
}
module.exports = CheckPermission;
