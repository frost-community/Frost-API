'use strict';

const ApiResult = require('../../helpers/apiResult');
const AuthorizeRequest = require('../../documentModels/authorizeRequest');

exports.post = async (request) => {
	const iceAuthKey = request.get('X-Ice-Auth-Key');
	const verificationCode = request.body.verificationCode;

	if (!await AuthorizeRequest.verifyKeyAsync(iceAuthKey, request.db, request.config))
		return new ApiResult(400, 'X-Ice-Auth-Key header is invalid');

	const authorizeRequestId = AuthorizeRequest.splitKey(iceAuthKey, request.db, request.config).authorizeRequestId;
	const authorizeRequest = await AuthorizeRequest.findByIdAsync(authorizeRequestId, request.db, request.config);

	if (authorizeRequest.document.targetUserId == null)
		return new ApiResult(400, 'authorization has not been done yet');

	if (verificationCode !== authorizeRequest.document.verificationCode)
		return new ApiResult(400, 'verificationCode is invalid');

	// TODO: refactoring(duplication)

	let applicationAccess = await request.db.applicationAccesses.findAsync({
		applicationId: authorizeRequest.document.applicationId,
		userId: authorizeRequest.document.targetUserId
	});

	let accessKey;
	if (applicationAccess == null) {
		try {
			applicationAccess = await request.db.applicationAccesses.createAsync({ // TODO: move to document models
				applicationId: authorizeRequest.document.applicationId,
				userId: authorizeRequest.document.targetUserId,
				keyCode: null
			});
		}
		catch(err) {
			console.log(err.stack);
		}

		if (applicationAccess == null)
			return new ApiResult(500, 'faild to create applicationAccess');

		try {
			accessKey = await applicationAccess.generateAccessKeyAsync();
		}
		catch(err) {
			console.log(err.stack);
		}

		if (accessKey == null)
			return new ApiResult(500, 'faild to generate accessKey');
	}
	else {
		try {
			accessKey = applicationAccess.getAccessKey();
		}
		catch(err) {
			console.log(err.stack);
		}

		if (accessKey == null)
			return new ApiResult(500, 'faild to build accessKey');
	}

	return new ApiResult(200, {accessKey: accessKey});
};
