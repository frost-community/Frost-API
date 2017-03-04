'use strict';

const apiResult = require('../../helpers/apiResult');

const authorizeRequestsAsync = require('../../collections/authorizeRequests');
const applications = require('../../collections/application');

const applicationModel = require('../../models/application');

exports.post = async (request, extensions) => {
	const applicationKey = request.body.applicationKey;

	if (await applicationModel.verifyKeyAsync(applicationKey))
		return apiResult(400, 'applicationKey is invalid');

	const applicationId = applicationModel.splitKey(applicationKey).applicationId;
	const application = await (await applications).findAsync(applicationId);
	const key = await application.generateApplicationKeyAsync();

	return apiResult(200, 'successful', {requestKey: key});
};
