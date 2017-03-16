'use strict';

const apiResult = require('../../helpers/apiResult');
const applicationModelAsync = require('../../models/application');
const authorizeRequestsModelAsync = require('../../models/authorizeRequest');
const applicationAccessModelAsync = require('../../models/applicationAccess');

exports.post = async (request, extensions, db, config) => {
	const applicationKey = request.body.application_key;
	const requestKey = request.body.request_key;
	const verificationCode = request.body.verification_code;

	const applicationModel = await applicationModelAsync(db, config);
	if (!await applicationModel.verifyKeyAsync(applicationKey))
		return apiResult(400, 'application_key is invalid');

	const authorizeRequestsModel = await authorizeRequestsModelAsync(db, config);
	if (!await authorizeRequestsModel.verifyKeyAsync(requestKey))
		return apiResult(400, 'request_key is invalid');

	const applicationId = applicationModel.splitKey(applicationKey).applicationId;
	const authorizeRequestId = authorizeRequestsModel.splitKey(requestKey).authorizeRequestId;

	const doc = await db.authorizeRequests.findAsync({_id: authorizeRequestId, applicationId: applicationId});

	if (doc == null)
		return apiResult(400, 'combination of application_key and request_key is invalid');

	if (verificationCode !== doc.document.verificationCode)
		return apiResult(400, 'verification_code is invalid');

	// TODO: userIdどうすっかな～

	await db.applicationAccesses.createAsync({
		applicationId: applicationId,
		userId: null,
		keyCode: null
	});

	return apiResult(200, 'success', {'access_key': null});
};
