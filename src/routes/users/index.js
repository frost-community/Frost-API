'use strict';

const ApiResult = require('../../helpers/apiResult');
const User = require('../../documentModels/user');

exports.get = async (request) => {
	const result = await request.checkRequestAsync({
		query: [
			{name: 'screen_names', type: 'string', require: false}
		],
		permissions: ['userRead']
	});

	if (result != null) {
		return result;
	}

	let users;
	if (request.query.screen_names != null) {
		const screenNames = request.query.screen_names.split(',');

		if (screenNames.lenth > 100) {
			return new ApiResult(400, 'screen_names query is limit over(100 items or less)');
		}

		if (screenNames.every(i => User.checkFormatScreenName(i)) === false) {
			return new ApiResult(400, 'screen_names query is invalid');
		}

		// TODO: screenNamesの重複チェック

		users = await User.findArrayByScreenNamesAsync(screenNames, null, request.db, request.config);
	}
	else {
		users = await request.db.users.findArrayAsync({});
	}

	if (users == null || users.length == 0) {
		return new ApiResult(204);
	}

	return new ApiResult(200, {users: users.map(user => user.serialize())});
};
