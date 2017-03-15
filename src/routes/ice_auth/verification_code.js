'use strict';

const apiResult = require('../../helpers/apiResult');
const applicationModelAsync = require('../../models/application');
const authorizeRequestsModelAsync = require('../../models/authorizeRequest');

exports.get = async (request, extensions, db, config) => {
	const applicationKey = request.body.application_key;
	const requestKey = request.body.request_key;

	const applicationModel = await applicationModelAsync(db, config);
	const authorizeRequestsModel = await authorizeRequestsModelAsync(db, config);

	if (!await applicationModel.verifyKeyAsync(applicationKey))
		return apiResult(400, 'application_key is invalid');

	if (!await authorizeRequestsModel.verifyKeyAsync(requestKey))
		return apiResult(400, 'request_key is invalid');

	const applicationId = applicationModel.splitKey(applicationKey).applicationId;
	const authorizeRequestId = authorizeRequestsModel.splitKey(requestKey).authorizeRequestId;

	const doc = await db.authorizeRequests.findAsync({_id: authorizeRequestId, applicationId: applicationId});

	return apiResult(200, 'success', {'verification_code': doc.document.verificationCode});
};
