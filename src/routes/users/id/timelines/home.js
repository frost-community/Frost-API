'use strict';

const ApiResult = require('../../../../helpers/apiResult');

exports.get = async (request) => {
	const result = await request.checkRequestAsync({
		query: [],
		permissions: ['postRead', 'userRead']
	});

	if (result != null)
		return result;

	return new ApiResult(501, 'not implemented');
};
