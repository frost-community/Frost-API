'use strict';

const apiResult = require('../helpers/apiResult');

exports.get = async (request, extensions, db, config) => {
	return apiResult(200, 'Frost API Server');
};
