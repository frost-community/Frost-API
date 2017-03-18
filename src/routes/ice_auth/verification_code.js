'use strict';

const ApiResult = require('../../helpers/apiResult');
const AuthorizeRequestModel = require('../../models/authorizeRequest');

exports.get = async (request, extensions, db, config) => {
	const iceAuthKey = request.get('X-Ice-Auth-Key');

	const authorizeRequestModel = new AuthorizeRequestModel(db, config);
	if (!await authorizeRequestModel.verifyKeyAsync(iceAuthKey))
		return new ApiResult(400, 'X-Ice-Auth-Key header is invalid');

	const authorizeRequestId = authorizeRequestModel.splitKey(iceAuthKey).authorizeRequestId;
	const doc = await db.authorizeRequests.findAsync({_id: authorizeRequestId});

	return new ApiResult(200, 'success', {'verification_code': doc.document.verificationCode});
};
