const User = require('../../../documentModels/user');
const UserFollowing = require('../../../documentModels/userFollowing');
// const $ = require('cafy').default;

// TODO: limit指定、カーソル送り等

exports.get = async (apiContext) => {
	await apiContext.proceed({
		query: {},
		permissions: ['userRead']
	});
	if (apiContext.responsed) return;

	// user
	const user = await User.findByIdAsync(apiContext.params.id, apiContext.db, apiContext.config);
	if (user == null) {
		return apiContext.response(404, 'user as premise not found');
	}

	const userFollowings = await UserFollowing.findSourcesAsync(user.document._id, 30, apiContext.db, apiContext.config);
	if (userFollowings == null || userFollowings.length == 0) {
		apiContext.response(204);
		return;
	}

	const serialized = [];
	for (const i of userFollowings) {
		serialized.push(i.document.source.toString());
	}
	apiContext.response(200, { userfollowings: serialized });
};
