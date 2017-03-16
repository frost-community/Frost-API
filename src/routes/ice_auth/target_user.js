'use strict';

const apiResult = require('../../helpers/apiResult');
const authorizeRequestsModelAsync = require('../../models/authorizeRequest');
const mongo = require('mongodb');

exports.post = async (request, extensions, db, config) => {
	const iceAuthKey = request.body.ice_auth_key;
	const userId = request.body.user_id;

	const authorizeRequestsModel = await authorizeRequestsModelAsync(db, config);
	if (!await authorizeRequestsModel.verifyKeyAsync(iceAuthKey))
		return apiResult(400, 'ice_auth_key is invalid');

	if (db.users.findIdAsync(userId) == null)
		return apiResult(400, 'user_id is invalid');

	const authorizeRequestId = authorizeRequestsModel.splitKey(iceAuthKey).authorizeRequestId;
	await db.authorizeRequests.updateIdAsync(authorizeRequestId, {targetUserId: mongo.ObjectID(userId)});

	return apiResult(200, 'success', {'target_user_id': userId});
};
