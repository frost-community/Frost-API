'use strict';

const ApiResult = require('../../../helpers/apiResult');
const User = require('../../../documentModels/user');

exports.get = async (request) => {
	const result = await request.checkRequestAsync({
		query: [],
		permissions: ['userRead']
	});

	if (result != null) {
		return result;
	}

	const user = await User.findByIdAsync(request.params.id, request.db, request.config);

	if (user == null) {
		return new ApiResult(204);
	}

	return new ApiResult(200, {user: user.serialize()});
};
