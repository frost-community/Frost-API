const AuthorizeRequest = require('../../documentModels/authorizeRequest');
// const $ = require('cafy').default;
const { ApiError } = require('../../helpers/errors');

exports.get = async (apiContext) => {
	await apiContext.check({
		query: {},
		headers: ['x-ice-auth-key'],
		permissions: ['iceAuthHost']
	});

	const iceAuthKey = apiContext.headers['x-ice-auth-key'];

	if (!await AuthorizeRequest.verifyKeyAsync(iceAuthKey, apiContext.db, apiContext.config)) {
		throw new ApiError(400, 'x-ice-auth-key header is invalid');
	}

	const authorizeRequestId = AuthorizeRequest.splitKey(iceAuthKey, apiContext.db, apiContext.config).authorizeRequestId;
	const authorizeRequest = await apiContext.db.authorizeRequests.findByIdAsync(authorizeRequestId); //TODO: move to document models

	if (authorizeRequest.document.verificationCode == null) {
		throw new ApiError(500, 'verificationCode is empty');
	}

	apiContext.response(200, { verificationCode: authorizeRequest.document.verificationCode });
};
