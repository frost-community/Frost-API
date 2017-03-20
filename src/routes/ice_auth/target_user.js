'use strict';

const ApiResult = require('../../helpers/apiResult');
const AuthorizeRequest = require('../../documentModels/authorizeRequest');

exports.post = async (request) => {
	const iceAuthKey = request.get('X-Ice-Auth-Key');
	const userId = request.body.userId;

	if (!await AuthorizeRequest.verifyKeyAsync(iceAuthKey, request.db, request.config))
		return new ApiResult(400, 'X-Ice-Auth-Key header is invalid');

	if (request.db.users.findByIdAsync(userId) == null) //TODO: move to document models
		return new ApiResult(400, 'userId is invalid');

	const authorizeRequestId = AuthorizeRequest.splitKey(iceAuthKey, request.db, request.config).authorizeRequestId;
	const authorizeRequest = await AuthorizeRequest.findByIdAsync(authorizeRequestId, request.db, request.config);
	await authorizeRequest.setTargetUserIdAsync(userId);

	return new ApiResult(200, {'targetUserId': authorizeRequest.document.targetUserId});
};
