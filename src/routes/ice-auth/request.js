'use strict';

const apiResult = require('../../helpers/api-result');

const authorizeRequestsAsync = require('../../collections/authorize-requests');
const authorizeRequestModel = require('../../models/authorize-request');

exports.post = async (request, extensions) => {
	var doc = await (await authorizeRequestsAsync()).createAsync('appid'); // TODO

	return apiResult(200, 'request creation successful', doc);
};
