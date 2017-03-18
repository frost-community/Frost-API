'use strict';

const Application = require('../../documentModels/application');
const ApplicationAccess = require('../../documentModels/applicationAccess');

class CheckPermission {
	constructor(directoryRouter, db, config) {
		this.directoryRouter = directoryRouter;
		this._db = db;
		this._config = config;
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

					if (!await Application.verifyKeyAsync(applicationKey, this._db, this._config)) {
						response.status(400).send({error: {message: 'X-Application-Key header is invalid'}});
						return;
					}

					if (!await ApplicationAccess.verifyKeyAsync(accessKey, this._db, this._config)) {
						response.status(400).send({error: {message: 'X-Access-Key header is invalid'}});
						return;
					}

					const applicationId = Application.splitKey(applicationKey, this._db, this._config).applicationId;
					const userId = ApplicationAccess.splitKey(accessKey, this._db, this._config).userId;

					const application = (await this._db.applications.findIdAsync(applicationId));
					request.application = application.document;
					request.user = (await this._db.users.findIdAsync(userId)).document;

					for (const permission of extensions.permissions) {
						if (!application.hasPermission(permission)) {
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
