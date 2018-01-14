const ApiContext = require('../../modules/ApiContext');
const $ = require('cafy').default;

/** @param {ApiContext} apiContext */
exports.post = async (apiContext) => {
	await apiContext.proceed({
		body: {
			applicationKey: { cafy: $().string() }
		}
	});
	if (apiContext.responsed) return;

	const applicationKey = apiContext.body.applicationKey;

	if (!await apiContext.applicationsService.verifyApplicationKey(applicationKey)) {
		apiContext.response(400, 'applicationKey is invalid');
		return;
	}

	const { applicationId } = apiContext.applicationsService.splitApplicationKey(applicationKey);

	const authorizeRequest = await apiContext.authorizeRequestsService.create(applicationId);
	if (authorizeRequest == null) {
		apiContext.response(500, 'failed to create authorizeRequest');
		return;
	}

	const iceAuthKey = await apiContext.authorizeRequestsService.generateIceAuthKey(authorizeRequest);
	await apiContext.authorizeRequestsService.generateVerificationCode(authorizeRequest);

	apiContext.response(200, { iceAuthKey });
};
