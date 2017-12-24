const AuthorizeRequest = require('../../documentModels/authorizeRequest');
const $ = require('cafy').default;
const { ApiError } = require('../../helpers/errors');

exports.post = async (apiContext) => {
	await apiContext.check({
		body: {
			userId: { cafy: $().string() }
		},
		headers: ['x-ice-auth-key'],
		permissions: ['iceAuthHost']
	});


	const iceAuthKey = apiContext.headers['x-ice-auth-key'];
	const userId = apiContext.body.userId;

	if (!await AuthorizeRequest.verifyKeyAsync(iceAuthKey, apiContext.db, apiContext.config)) {
		throw new ApiError(400, 'x-ice-auth-key header is invalid');
	}

	if ((await apiContext.db.users.findByIdAsync(userId)) == null) { //TODO: move to document models
		throw new ApiError(400, 'userId is invalid');
	}

	const authorizeRequestId = AuthorizeRequest.splitKey(iceAuthKey, apiContext.db, apiContext.config).authorizeRequestId;
	const authorizeRequest = await AuthorizeRequest.findByIdAsync(authorizeRequestId, apiContext.db, apiContext.config);
	await authorizeRequest.setTargetUserIdAsync(userId);

	apiContext.response(200, { 'targetUserId': authorizeRequest.document.targetUserId });
};
