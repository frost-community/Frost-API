const ApiContext = require('../modules/ApiContext');
const $ = require('cafy').default;

/** @param {ApiContext} apiContext */
exports.post = async (apiContext) => {
	await apiContext.proceed({
		body: {
			screenName: { cafy: $().string() },
			password: { cafy: $().string() },
			description: { cafy: $().string().range(0, 256), default: '' },
			name: { cafy: $().string().range(1, 32), default: 'froster' }
		}, permissions: ['accountSpecial']
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
