const User = require('../../documentModels/user');
const $ = require('cafy').default;
const { ApiError } = require('../../helpers/errors');

exports.get = async (apiContext) => {
	await apiContext.check({
		query: {
			'screen_names': { cafy: $().string(), default: '' }
		},
		permissions: ['userRead']
	});

	let users;
	if (apiContext.query.screen_names != '') {
		const screenNames = apiContext.query.screen_names.split(',');

		if (screenNames.lenth > 100) {
			throw new ApiError(400, 'screen_names query is limit over(100 items or less)');
		}

		if (screenNames.every(i => User.checkFormatScreenName(i)) === false) {
			throw new ApiError(400, 'screen_names query is invalid');
		}

		// TODO: screenNamesの重複チェック

		users = await User.findArrayByScreenNamesAsync(screenNames, null, apiContext.db, apiContext.config);
	}
	else {
		users = await apiContext.db.users.findArrayAsync({});
	}

	if (users == null || users.length == 0) {
		apiContext.response(204);
		return;
	}

	apiContext.response(200, { users: users.map(user => user.serialize()) });
};
