'use strict';

const ApiResult = require('../../helpers/apiResult');
const User = require('../../documentModels/user');

exports.get = async (request) => {
	const result = await request.checkRequestAsync({
		params: [],
		queries: [
			{name: 'screen_names', type: 'string'}
		],
		permissions: ['userRead']
	});

	if (result != null)
		return result;

	const screenNames = request.query.screen_names.split(',');

	if (screenNames.lenth == 0)
		return new ApiResult(400, 'screen_names query is empty');

	if (screenNames.lenth > 100)
		return new ApiResult(400, 'screen_names query is limit over(100 items or less)');

	if (screenNames.every(i => User.checkFormatScreenName(i)) === false)
		return new ApiResult(400, 'screen_names query is invalid');

	const users = await User.findArrayByScreenNamesAsync(screenNames, null, request.db, request.config);

	if (users == null || users.length == 0)
		return new ApiResult(404, 'users are empty');

	return new ApiResult(200, {users: users.map(user => user.serialize())});
};
