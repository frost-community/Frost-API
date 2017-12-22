const { Application } = require('../documentModels/application');
const { ApplicationAccess } = require('../documentModels/applicationAccess');

class StreamingHelpers {
	static async checkRequest (request, db, config) {
		const query = request.resourceURL.query;
		const applicationKey = query.application_key;
		const accessKey = query.access_key;

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
			applicationId: Application.splitKey(applicationKey, db, config).applicationId,
			meId: ApplicationAccess.splitKey(accessKey, db, config).userId
		};
	}
}
module.exports = StreamingHelpers;
