'use strict';

const apiResult = require('../../helpers/apiResult');

const authorizeRequests = require('../../collections/authorizeRequests');
const applicationModel = require('../../models/application');

exports.post = async (request, extensions) => {
	const applicationKey = request.body.application_key;

	if (await applicationModel.verifyKeyAsync(applicationKey))
		return apiResult(400, 'application_key is invalid');

	const applicationId = applicationModel.splitKey(applicationKey).applicationId;
	const doc = await (await authorizeRequests()).createAsync(applicationId);
	const key = await doc.getRequestKeyAsync();

	return apiResult(200, 'successful', {'request_key': key});
};
