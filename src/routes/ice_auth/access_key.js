'use strict';

const ApiResult = require('../../helpers/apiResult');
const AuthorizeRequest = require('../../documentModels/authorizeRequest');

exports.post = async (request, extensions, db, config) => {
	const iceAuthKey = request.get('X-Ice-Auth-Key');
	const verificationCode = request.body.verification_code;

	if (!await AuthorizeRequest.verifyKeyAsync(iceAuthKey, db, config))
		return new ApiResult(400, 'X-Ice-Auth-Key header is invalid');

	const authorizeRequestId = AuthorizeRequest.splitKey(iceAuthKey, db, config).authorizeRequestId;
	const authorizeRequest = await db.authorizeRequests.findAsync({_id: authorizeRequestId});

	if (authorizeRequest.document.targetUserId == null)
		return new ApiResult(400, 'authorization has not been done yet');

	if (verificationCode !== authorizeRequest.document.verificationCode)
		return new ApiResult(400, 'verification_code is invalid');

	const applicationAccess = await db.applicationAccesses.createAsync({
		applicationId: authorizeRequest.document.applicationId,
		userId: authorizeRequest.document.targetUserId,
		keyCode: null
	});
	const key = await applicationAccess.generateAccessKeyAsync();

	return new ApiResult(200, null, {'access_key': key});
};
