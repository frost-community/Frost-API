const Application = require('../documentModels/application');
const ApplicationAccess = require('../documentModels/applicationAccess');

module.exports = async (request, applicationKey, accessKey, db, config) => {
	if (applicationKey == null) {
		const message = 'application_key parameter is empty';
		request.reject(400, message);
		throw new Error(message);
	}

	if (accessKey == null) {
		const message = 'access_key parameter is empty';
		request.reject(400, message);
		throw new Error(message);
	}

	if (!await Application.verifyKeyAsync(applicationKey, db, config)) {
		const message = 'application_key parameter is invalid';
		request.reject(400, message);
		throw new Error(message);
	}

	if (!await ApplicationAccess.verifyKeyAsync(accessKey, db, config)) {
		const message = 'access_key parameter is invalid';
		request.reject(400, message);
		throw new Error(message);
	}

	return {
		connection: request.accept(),
		applicationId: Application.splitKey(applicationKey, db, config).applicationId,
		meId: ApplicationAccess.splitKey(accessKey, db, config).userId
	};
};
