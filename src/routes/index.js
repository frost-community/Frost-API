'use strict';

const apiResult = require('../modules/api-result');

exports.get = async (request, extensions) => {
	return apiResult(200, "Frost API Server");
};
