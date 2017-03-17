'use strict';

const apiResult = require('../../helpers/apiResult');
const authorizeRequestsModelAsync = require('../../models/authorizeRequest');

exports.post = async (request, extensions, db, config) => {
	const iceAuthKey = request.get('X-Ice-Auth-Key');
	const verificationCode = request.body.verification_code;

	const authorizeRequestsModel = await authorizeRequestsModelAsync(db, config);
	if (!await authorizeRequestsModel.verifyKeyAsync(iceAuthKey))
		return apiResult(400, 'X-Ice-Auth-Key header is invalid');

	const authorizeRequestId = authorizeRequestsModel.splitKey(iceAuthKey).authorizeRequestId;
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
