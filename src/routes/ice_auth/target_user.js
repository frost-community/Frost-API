'use strict';

const apiResult = require('../../helpers/apiResult');
const AuthorizeRequestModel = require('../../models/AuthorizeRequest');
const mongo = require('mongodb');

exports.post = async (request, extensions, db, config) => {
	const iceAuthKey = request.get('X-Ice-Auth-Key');
	const userId = request.body.user_id;

	const authorizeRequestModel = new AuthorizeRequestModel(db, config);
	if (!await authorizeRequestModel.verifyKeyAsync(iceAuthKey))
		return apiResult(400, 'X-Ice-Auth-Key header is invalid');

	if (db.users.findIdAsync(userId) == null)
		return apiResult(400, 'user_id is invalid');

	const authorizeRequestId = authorizeRequestModel.splitKey(iceAuthKey).authorizeRequestId;
	await db.authorizeRequests.updateIdAsync(authorizeRequestId, {targetUserId: mongo.ObjectID(userId)});

	return apiResult(200, 'success', {'target_user_id': userId});
};
