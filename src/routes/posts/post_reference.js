const ApiResult = require('../../helpers/apiResult');

exports.post = async (request) => {
	const result = await request.checkRequestAsync({
		body: [],
		permissions: ['postWrite']
	});

	if (result != null) {
		return result;
	}

	return new ApiResult(501, 'not implemented yet');
};
