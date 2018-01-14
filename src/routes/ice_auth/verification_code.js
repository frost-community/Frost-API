const ApiContext = require('../../modules/ApiContext');
// const $ = require('cafy').default;

/** @param {ApiContext} apiContext */
exports.get = async (apiContext) => {
	await apiContext.proceed({
		query: {},
		headers: ['x-ice-auth-key'],
		permissions: ['iceAuthHost']
	});
	if (apiContext.responsed) return;

	const iceAuthKey = apiContext.headers['x-ice-auth-key'];

	if (!await apiContext.authorizeRequestsService.verifyIceAuthKey(iceAuthKey)) {
		apiContext.response(400, 'x-ice-auth-key header is invalid');
		return;
	}

	const { authorizeRequestId } = apiContext.authorizeRequestsService.splitIceAuthKey(iceAuthKey);

	const { verificationCode } = await apiContext.repository.findById('authorizeRequests', authorizeRequestId);
	if (verificationCode == null) {
		apiContext.response(500, 'verificationCode is empty');
		return;
	}

	apiContext.response(200, { verificationCode });
};
