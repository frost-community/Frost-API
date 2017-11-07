const ApiResult = require('../../helpers/apiResult');
const AuthorizeRequest = require('../../documentModels/authorizeRequest');

exports.post = async (request) => {
	const result = await request.checkRequestAsync({
		body: [
			{name: 'userId', type: 'string'}
		],
		headers: ['X-Ice-Auth-Key'],
		permissions: ['iceAuthHost']
	});

	if (result != null) {
		return result;
	}

	const iceAuthKey = request.get('X-Ice-Auth-Key');
	const userId = request.body.userId;

	if (!await AuthorizeRequest.verifyKeyAsync(iceAuthKey, request.db, request.config)) {
		return new ApiResult(400, 'X-Ice-Auth-Key header is invalid');
	}

	if ((await request.db.users.findByIdAsync(userId)) == null) { //TODO: move to document models
		return new ApiResult(400, 'userId is invalid');
	}

	const authorizeRequestId = AuthorizeRequest.splitKey(iceAuthKey, request.db, request.config).authorizeRequestId;
	const authorizeRequest = await AuthorizeRequest.findByIdAsync(authorizeRequestId, request.db, request.config);
	await authorizeRequest.setTargetUserIdAsync(userId);

	return new ApiResult(200, {'targetUserId': authorizeRequest.document.targetUserId});
};
