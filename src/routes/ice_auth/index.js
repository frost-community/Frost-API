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

	const { create, generateIceAuthKey, generateVerificationCode } = apiContext.authorizeRequestsService;
	const { verifyApplicationKey, splitApplicationKey } = apiContext.applicationsService;

	if (!await verifyApplicationKey(applicationKey)) {
		return apiContext.response(400, 'applicationKey is invalid');
	}

	const { applicationId } = splitApplicationKey(applicationKey);

	const authorizeRequest = await create(applicationId);
	if (authorizeRequest == null) {
		return apiContext.response(500, 'failed to create authorizeRequest');
	}

	const iceAuthKey = await generateIceAuthKey(authorizeRequest);
	await generateVerificationCode(authorizeRequest);

	apiContext.response(200, { iceAuthKey });
};
