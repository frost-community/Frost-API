'use strict';

const apiResult = require('../helpers/api-result');

exports.get = async (request, extensions) => {
	return apiResult(200, "Frost API Server");
};
