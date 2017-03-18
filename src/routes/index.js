'use strict';

const ApiResult = require('../helpers/apiResult');

exports.get = async (request, extensions, db, config) => {
	return new ApiResult(200, 'Frost API Server');
};
