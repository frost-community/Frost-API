'use strict';

const apiResult = require('../../helpers/apiResult');

const applications = require('../../collections/applications');
const authorizeRequests = require('../../collections/authorizeRequests');
const applicationModel = require('../../models/application');
const authorizeRequestsModel = require('../../models/authorizeRequest');

exports.get = async (request, extensions) => {
	const applicationKey = request.body['application-key'];
	const requestKey = request.body['request-key'];

	if (await applicationModel.verifyKeyAsync(applicationKey))
		return apiResult(400, 'application-key is invalid');

	if (await authorizeRequests.verifyKeyAsync(requestKey))
		return apiResult(400, 'request-key is invalid');

	// TODO

};
