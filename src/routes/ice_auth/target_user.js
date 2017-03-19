'use strict';

const ApiResult = require('../../helpers/apiResult');
const AuthorizeRequest = require('../../documentModels/authorizeRequest');
const mongo = require('mongodb');

exports.post = async (request) => {
	const iceAuthKey = request.get('X-Ice-Auth-Key');
	const userId = request.body.user_id;

	if (!await AuthorizeRequest.verifyKeyAsync(iceAuthKey, request.db, request.config))
		return new ApiResult(400, 'X-Ice-Auth-Key header is invalid');

	if (request.db.users.findIdAsync(userId) == null)
		return new ApiResult(400, 'user_id is invalid');

	const authorizeRequestId = AuthorizeRequest.splitKey(iceAuthKey, request.db, request.config).authorizeRequestId;
	await request.db.authorizeRequests.updateIdAsync(authorizeRequestId, {targetUserId: mongo.ObjectId(userId)});

	return new ApiResult(200, {'target_user_id': userId});
};
