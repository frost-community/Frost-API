const User = require('../../documentModels/user');
const $ = require('cafy').default;

exports.get = async (apiContext) => {
	await apiContext.proceed({
		query: {
			'screen_names': { cafy: $().string(), default: '' }
		},
		permissions: ['userRead']
	});
	if (apiContext.responsed) return;

	let users;
	if (apiContext.query.screen_names != '') {
		const screenNames = apiContext.query.screen_names.split(',');

		if (screenNames.lenth > 100) {
			return apiContext.response(400, 'screen_names query is limit over(100 items or less)');
		}

		if (screenNames.every(i => User.checkFormatScreenName(i)) === false) {
			return apiContext.response(400, 'screen_names query is invalid');
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

	const serializedUsers = [];
	for (const user of users) {
		serializedUsers.push(await user.serializeAsync());
	}

	apiContext.response(200, { users: serializedUsers });
};
