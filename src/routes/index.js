'use strict';

const ApiResult = require('../helpers/apiResult');

exports.get = async (request) => {
	return new ApiResult(200, 'Frost API Server');
};
