'use strict';

const ApiResult = require('../helpers/apiResult');

exports.get = async (request) => {
	const result = await request.checkRequestAsync({
		query: [],
		permissions: []
	});

	if (result != null) {
		return result;
	}

	return new ApiResult(200, 'Frost API Server');
};
