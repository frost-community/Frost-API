'use strict';

const ApiResult = require('../../helpers/apiResult');
const AuthorizeRequest = require('../../documentModels/authorizeRequest');

exports.get = async (request, extensions, db, config) => {
	const iceAuthKey = request.get('X-Ice-Auth-Key');

	if (!await AuthorizeRequest.verifyKeyAsync(iceAuthKey, db, config))
		return new ApiResult(400, 'X-Ice-Auth-Key header is invalid');

	const authorizeRequestId = AuthorizeRequest.splitKey(iceAuthKey, db, config).authorizeRequestId;
	const authorizeRequest = await db.authorizeRequests.findAsync({_id: authorizeRequestId});

	return new ApiResult(200, null, {'verification_code': authorizeRequest.document.verificationCode});
};
