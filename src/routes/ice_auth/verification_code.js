const AuthorizeRequest = require('../../documentModels/authorizeRequest');
// const $ = require('cafy').default;

exports.get = async (apiContext) => {
	await apiContext.proceed({
		query: {},
		headers: ['x-ice-auth-key'],
		permissions: ['iceAuthHost']
	});
	if (apiContext.responsed) return;

	const iceAuthKey = apiContext.headers['x-ice-auth-key'];

	if (!await AuthorizeRequest.verifyKeyAsync(iceAuthKey, apiContext.db, apiContext.config)) {
		return apiContext.response(400, 'x-ice-auth-key header is invalid');
	}

	const authorizeRequestId = AuthorizeRequest.splitKey(iceAuthKey, apiContext.db, apiContext.config).authorizeRequestId;
	const authorizeRequest = await apiContext.db.authorizeRequests.findByIdAsync(authorizeRequestId); //TODO: move to document models

	if (authorizeRequest.document.verificationCode == null) {
		return apiContext.response(500, 'verificationCode is empty');
	}

	apiContext.response(200, { verificationCode: authorizeRequest.document.verificationCode });
};
