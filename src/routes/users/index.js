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
			apiContext.response(400, 'screen_names query is limit over(100 items or less)');
			return;
		}

		if (screenNames.some(screenName => !apiContext.usersService.validFormatScreenName(screenName))) {
			apiContext.response(400, 'screen_names query is invalid');
			return;
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

/** @param {ApiContext} apiContext */
exports.post = async (apiContext) => {
	await apiContext.proceed({
		body: {
			screenName: { cafy: $().string() },
			password: { cafy: $().string() },
			description: { cafy: $().string().range(0, 256), default: '' },
			name: { cafy: $().string().range(1, 32), default: 'froster' }
		}, permissions: ['userSpecial']
	});
	if (apiContext.responsed) return;

	const {
		screenName,
		password,
		name,
		description
	} = apiContext.body;

	// screenName
	if (!apiContext.usersService.validFormatScreenName(screenName)) {
		apiContext.response(400, 'screenName is invalid format');
		return;
	}
	if (!apiContext.usersService.availableScreenName(screenName)) {
		apiContext.response(400, 'screenName is invalid');
		return;
	}
	if (!await apiContext.usersService.nonDuplicatedScreenName(screenName)) {
		apiContext.response(400, 'this screenName is already exists');
		return;
	}

	// password
	if (!apiContext.usersService.checkFormatPassword(password)) {
		apiContext.response(400, 'password is invalid format');
		return;
	}

	const user = await apiContext.usersService.create(screenName, password, name, description);
	if (user == null) {
		apiContext.response(500, 'failed to create account');
		return;
	}

	apiContext.response(200, { user: await apiContext.usersService.serialize(user) });
};
