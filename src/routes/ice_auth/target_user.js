'use strict';

const ApiResult = require('../../helpers/apiResult');
const AuthorizeRequest = require('../../documentModels/authorizeRequest');
const mongo = require('mongodb');

exports.post = async (request, extensions, db, config) => {
	const iceAuthKey = request.get('X-Ice-Auth-Key');
	const userId = request.body.user_id;

	if (!await AuthorizeRequest.verifyKeyAsync(iceAuthKey, db, config))
		return new ApiResult(400, 'X-Ice-Auth-Key header is invalid');

	if (db.users.findIdAsync(userId) == null)
		return new ApiResult(400, 'user_id is invalid');

	const authorizeRequestId = AuthorizeRequest.splitKey(iceAuthKey, db, config).authorizeRequestId;
	await db.authorizeRequests.updateIdAsync(authorizeRequestId, {targetUserId: mongo.ObjectId(userId)});

	return new ApiResult(200, null, {'target_user_id': userId});
};
