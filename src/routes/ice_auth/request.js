'use strict';

const apiResult = require('../../helpers/apiResult');
const applicationModelAsync = require('../../models/application');

exports.post = async (request, extensions, db, config) => {
	const applicationKey = request.body.application_key;

	const applicationModel = await applicationModelAsync(db, config);

	if (!await applicationModel.verifyKeyAsync(applicationKey))
		return apiResult(400, 'application_key is invalid');

	const applicationId = applicationModel.splitKey(applicationKey).applicationId;
	const doc = await db.authorizeRequests.createAsync({applicationId: applicationId});
	const key = await doc.getRequestKeyAsync();
	await doc.getVerificationCodeAsync();

	return apiResult(200, 'success', {'request_key': key});
};
