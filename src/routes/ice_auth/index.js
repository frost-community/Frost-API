'use strict';

const ApiResult = require('../../helpers/apiResult');
const Application = require('../../documentModels/application');

exports.post = async (request) => {
	const applicationKey = request.body.application_key;

	if (!await Application.verifyKeyAsync(applicationKey, request.db, request.config))
		return new ApiResult(400, 'application_key is invalid');

	const applicationId = Application.splitKey(applicationKey, request.db, request.config).applicationId;
	const authorizeRequest = await request.db.authorizeRequests.createAsync({applicationId: applicationId});
	const iceAuthKey = await authorizeRequest.getRequestKeyAsync();
	await authorizeRequest.getVerificationCodeAsync();

	return new ApiResult(200, {'ice_auth_key': iceAuthKey});
};
