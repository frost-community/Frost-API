'use strict';

const apiResult = require('../../helpers/apiResult');
const AuthorizeRequestModel = require('../../models/AuthorizeRequest');

exports.post = async (request, extensions, db, config) => {
	const iceAuthKey = request.get('X-Ice-Auth-Key');
	const verificationCode = request.body.verification_code;

	const authorizeRequestModel = new AuthorizeRequestModel(db, config);
	if (!await authorizeRequestModel.verifyKeyAsync(iceAuthKey))
		return apiResult(400, 'X-Ice-Auth-Key header is invalid');

	const authorizeRequestId = authorizeRequestModel.splitKey(iceAuthKey).authorizeRequestId;
	const doc = await db.authorizeRequests.findAsync({_id: authorizeRequestId});

	if (doc.document.targetUserId == null)
		return apiResult(400, 'authorization has not been done yet');

	if (verificationCode !== doc.document.verificationCode)
		return apiResult(400, 'verification_code is invalid');

	const accessDoc = await db.applicationAccesses.createAsync({
		applicationId: doc.document.applicationId,
		userId: doc.document.targetUserId,
		keyCode: null
	});
	const key = await accessDoc.generateAccessKeyAsync();

	return apiResult(200, 'success', {'access_key': key});
};
