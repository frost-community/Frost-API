'use strict';

const ApiResult = require('../../helpers/apiResult');

exports.post = async (request) => {
	const result = await request.checkRequestAsync({
		params: [],
		permissions: ['postWrite']
	});

	if (result != null)
		return result;

	return new ApiResult(501, 'not implemented');
};
