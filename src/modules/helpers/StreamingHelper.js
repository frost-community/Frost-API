class StreamingHelper {
	static async checkRequest(request, applicationsService, applicationAccessesService) {
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

		if (!await applicationsService.verifyApplicationKey(applicationKey)) {
			const message = 'application_key parameter is invalid';
			request.reject(400, message);
			throw new Error(message);
		}

		if (!await applicationAccessesService.verifyAccessKey(accessKey)) {
			const message = 'access_key parameter is invalid';
			request.reject(400, message);
			throw new Error(message);
		}

		return {
			applicationKey,
			accessKey,
			applicationId: applicationsService.splitApplicationKey(applicationKey).applicationId,
			meId: applicationAccessesService.splitAccessKey(accessKey).userId
		};
	}
}
module.exports = StreamingHelper;
