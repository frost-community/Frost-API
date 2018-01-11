const ApiContext = require('../../../modules/ApiContext');
// const $ = require('cafy').default;

/** @param {ApiContext} apiContext */
exports.get = async (apiContext) => {
	await apiContext.proceed({
		query: {},
		permissions: ['userRead']
	});
	if (apiContext.responsed) return;

	const user = await apiContext.repository.findById('users', apiContext.params.id);
	if (user == null) {
		apiContext.response(204);
		return;
	}

	apiContext.response(200, { user: await apiContext.usersService.serialize(user) });
};
