'use strict';

const apiResult = require('../../helpers/apiResult');

const applications = require('../../helpers/collections').applications;
const authorizeRequests = require('../../helpers/collections').authorizeRequests;
const applicationModelAsync = require('../../models/application');
const authorizeRequestsModelAsync = require('../../models/authorizeRequest');

exports.get = async (request, extensions, config) => {
	const applicationKey = request.body.application_key;
	const requestKey = request.body.request_key;

	const applicationModel = await applicationModelAsync(config);
	const authorizeRequestsModel = await authorizeRequestsModelAsync(config);

	if (await applicationModel.verifyKeyAsync(applicationKey))
		return apiResult(400, 'application_key is invalid');

	if (await authorizeRequestsModel.verifyKeyAsync(requestKey))
		return apiResult(400, 'request_key is invalid');

	// TODO

	return apiResult(501, 'not implemented');
};
