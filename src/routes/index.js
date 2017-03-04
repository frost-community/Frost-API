'use strict';

const apiResult = require('../helpers/apiResult');

exports.get = async (request, extensions) => {
	return apiResult(200, 'Frost API Server');
};
