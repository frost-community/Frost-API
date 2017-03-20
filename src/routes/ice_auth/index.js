'use strict';

const ApiResult = require('../../helpers/apiResult');
const Application = require('../../documentModels/application');

exports.post = async (request) => {
	const applicationKey = request.body.applicationKey;

	if (!await Application.verifyKeyAsync(applicationKey, request.db, request.config))
		return new ApiResult(400, 'applicationKey is invalid');

	const applicationId = Application.splitKey(applicationKey, request.db, request.config).applicationId;
	const authorizeRequest = await request.db.authorizeRequests.createAsync({applicationId: applicationId}); //TODO: move to document models
	const iceAuthKey = await authorizeRequest.generateRequestKeyAsync();
	await authorizeRequest.getVerificationCodeAsync();

	return new ApiResult(200, {iceAuthKey: iceAuthKey});
};
