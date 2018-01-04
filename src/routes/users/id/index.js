const User = require('../../../documentModels/user');
const UserFollowing = require('../../../documentModels/userFollowing');
// const $ = require('cafy').default;

exports.get = async (apiContext) => {
	await apiContext.proceed({
		query: {},
		permissions: ['userRead']
	});
	if (apiContext.responsed) return;

	const user = await User.findByIdAsync(apiContext.params.id, apiContext.db, apiContext.config);
	if (user == null) {
		apiContext.response(204);
		return;
	}
	const serialized = user.serialize();

	let [followings, followers] = await Promise.all([
		UserFollowing.findTargetsAsync(user.document._id, 1000, apiContext.db, apiContext.config),
		UserFollowing.findSourcesAsync(user.document._id, 1000, apiContext.db, apiContext.config)
	]);
	serialized.followingsCount = (followings || []).length;
	serialized.followersCount = (followers || []).length;

	apiContext.response(200, { user: serialized });
};
