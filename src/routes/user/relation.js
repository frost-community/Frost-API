const ApiContext = require('../../modules/ApiContext');
const MongoAdapter = require('../../modules/MongoAdapter');
const $ = require('cafy').default;

/** @param {ApiContext} apiContext */
exports.get = async (apiContext) => {
	await apiContext.proceed({
		params: {
			sourceUserId: { cafy: $().string().pipe(i => MongoAdapter.validateId(i)) },
			targetUserId: { cafy: $().string().pipe(i => MongoAdapter.validateId(i)) }
		},
		scopes: ['user.read']
	});
	if (apiContext.responsed) return;

	const { sourceUserId, targetUserId } = apiContext.params;

	// fetch: source user
	const sourceUser = await apiContext.repository.findById('users', sourceUserId);
	if (sourceUser == null) {
		apiContext.response(404, 'source user as premise not found');
		return;
	}

	// fetch: target user
	const targetUser = await apiContext.repository.findById('users', targetUserId);
	if (targetUser == null) {
		apiContext.response(404, 'target user as premise not found');
		return;
	}

	// expect: sourceUser != targetUser
	if (sourceUser._id.equals(targetUser._id)) {
		apiContext.response(400, 'source user and target user is same');
		return;
	}

	const userFollowing = await apiContext.userFollowingsService.findBySrcDestId(sourceUser._id, targetUser._id);

	apiContext.response(200, { following: userFollowing != null });
};
