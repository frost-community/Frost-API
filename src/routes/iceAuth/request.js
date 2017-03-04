'use strict';

const apiResult = require('../../helpers/apiResult');

const authorizeRequestsAsync = require('../../collections/authorizeRequests');
const authorizeRequestModel = require('../../models/authorizeRequest');

exports.post = async (request, extensions) => {
	const description = request.body.applicationKey;

	const doc = await (await authorizeRequestsAsync()).createAsync('appid'); // TODO

	return apiResult(200, 'request creation successful', doc);
};
