'use strict';

const apiResult = require('../../helpers/apiResult');

const applications = require('../../collections/applications');
const authorizeRequests = require('../../collections/authorizeRequests');
const applicationModel = require('../../models/application');
const authorizeRequestsModel = require('../../models/authorizeRequest');

exports.get = async (request, extensions, config) => {
	const applicationKey = request.body.application_key;
	const requestKey = request.body.request_key;

	if (await applicationModel.verifyKeyAsync(applicationKey))
		return apiResult(400, 'application_key is invalid');

	if (await authorizeRequestsModel.verifyKeyAsync(requestKey))
		return apiResult(400, 'request_key is invalid');

	// TODO

	return apiResult(501, 'not implemented');
};
