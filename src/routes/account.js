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

	const {
		validFormatScreenName,
		nonDuplicatedScreenName,
		checkFormatPassword,
		create,
		serialize
	} = apiContext.usersService;

	// screenName
	if (!validFormatScreenName(screenName)) {
		return apiContext.response(400, 'screenName is invalid format');
	}
	if (!await nonDuplicatedScreenName(screenName)) {
		return apiContext.response(400, 'this screenName is already exists');
	}

	// password
	if (!checkFormatPassword(password)) {
		return apiContext.response(400, 'password is invalid format');
	}

	const user = await create(screenName, password, name, description);
	if (user == null) {
		return apiContext.response(500, 'failed to create account');
	}

	apiContext.response(200, { user: await serialize(user) });
};
