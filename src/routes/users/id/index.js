'use strict';

const ApiResult = require('../../../helpers/apiResult');
const User = require('../../../documentModels/user');

exports.get = async (request) => {
	const user = await User.findByIdAsync(request.params.id, request.db, request.config);

	if (user == null)
		return new ApiResult(400, 'user is not found');

	return new ApiResult(200, {user: user.serialize()});
};
