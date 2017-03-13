'use strict';

const apiResult = require('../../helpers/apiResult');

const authorizeRequests = require('../../helpers/collections').authorizeRequests;
const applicationModelAsync = require('../../models/application');

exports.post = async (request, extensions, config) => {
	const applicationKey = request.body.application_key;

	const applicationModel = await applicationModelAsync(config);

	if (!await applicationModel.verifyKeyAsync(applicationKey))
		return apiResult(400, 'application_key is invalid');

	const applicationId = applicationModel.splitKey(applicationKey).applicationId;
	const doc = await (await authorizeRequests()).createAsync({applicationId: applicationId});
	const key = await doc.getRequestKeyAsync();

	return apiResult(200, 'success', {'request_key': key});
};
