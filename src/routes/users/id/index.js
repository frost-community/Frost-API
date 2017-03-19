'use strict';

const ApiResult = require('../../../helpers/apiResult');

exports.get = async (request) => {
	const user = request.user;

	if (user == null)
		return new ApiResult(400, 'user is not found');

	return new ApiResult(200, {user: user.serialize()});
};
