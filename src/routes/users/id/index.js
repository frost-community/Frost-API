const User = require('../../../documentModels/user');
// const $ = require('cafy').default;

exports.get = async (apiContext) => {
	await apiContext.check({
		query: {},
		permissions: ['userRead']
	});

	const user = await User.findByIdAsync(apiContext.params.id, apiContext.db, apiContext.config);

	if (user == null) {
		apiContext.response(204);
		return;
	}

	apiContext.response(200, {user: user.serialize()});
};
