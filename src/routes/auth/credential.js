const ApiContext = require('../../modules/ApiContext');
const $ = require('cafy').default;

/** @param {ApiContext} apiContext */
module.exports.validate = async (apiContext) => {
	await apiContext.proceed({
		query: {
			screenName: { cafy: $().string() },
			password: { cafy: $().string() }
		},
		scopes: ['auth.host']
	});
	if (apiContext.responsed) return;

	const { screenName, password } = apiContext.query;

	if (!apiContext.usersService.validFormatScreenName(screenName)) {
		apiContext.response(200, { valid: false });
		return;
	}

	const user = await apiContext.usersService.findByScreenName(screenName);

	if (user == null) {
		apiContext.response(200, { valid: false });
		return;
	}

	const valid = apiContext.usersService.checkCorrectPassword(user, password);

	apiContext.response(200, { valid });
};
