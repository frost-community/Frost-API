'use strict';

const apiResult = require('../../helpers/apiResult');

const authorizeRequests = require('../../collections/authorizeRequests');
const applicationModel = require('../../models/application');

exports.post = async (request, extensions) => {
	const applicationKey = request.body.applicationKey;

	if (await applicationModel.verifyKeyAsync(applicationKey))
		return apiResult(400, 'applicationKey is invalid');

	const applicationId = applicationModel.splitKey(applicationKey).applicationId;
	const doc = await (await authorizeRequests()).createAsync(applicationId);
	const key = await doc.generateRequestKeyAsync();

	return apiResult(200, 'successful', {requestKey: key});
};
