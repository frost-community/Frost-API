const ApiContext = require('../../modules/ApiContext');
const $ = require('cafy').default;

/** @param {ApiContext} apiContext */
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

		if (screenNames.some(screenName => !apiContext.usersService.validFormatScreenName(screenName))) {
			return apiContext.response(400, 'screen_names query is invalid');
		}

		// TODO: screenNamesの重複チェック

		users = await apiContext.usersService.findArrayByScreenNames(screenNames);
	}
	else {
		users = await apiContext.repository.findArray('users', {});
	}

	if (users.length == 0) {
		apiContext.response(204);
		return;
	}

	const promises = users.map(user => apiContext.usersService.serialize(user));
	const serializedUsers = await Promise.all(promises);

	apiContext.response(200, { users: serializedUsers });
};
