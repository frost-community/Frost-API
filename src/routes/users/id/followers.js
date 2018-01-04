const { ObjectId } = require('mongodb');
const User = require('../../../documentModels/user');
const UserFollowing = require('../../../documentModels/userFollowing');
const v = require('validator');
const $ = require('cafy').default;

// TODO: limit指定、カーソル送り等

exports.get = async (apiContext) => {
	await apiContext.proceed({
		query: {
			limit: { cafy: $().string().pipe(i => v.isInt(i, { min: 0, max: 100 })), default: '30' }
		},
		permissions: ['userRead']
	});
	if (apiContext.responsed) return;

	// convert query value
	apiContext.query.limit = v.toInt(apiContext.query.limit);

	// user
	const user = await User.findByIdAsync(apiContext.params.id, apiContext.db, apiContext.config);
	if (user == null) {
		return apiContext.response(404, 'user as premise not found');
	}

	// このユーザーがフォロー元であるフォロー関係をすべて取得
	const userFollowings = await UserFollowing.findSourcesAsync(user.document._id, apiContext.query.limit, apiContext.db, apiContext.config);
	if (userFollowings == null || userFollowings.length == 0) {
		apiContext.response(204);
		return;
	}

	// fetch users
	const fetchPromises = userFollowings.map(following => User.findByIdAsync(following.document.source, apiContext.db, apiContext.config));
	const fetchedUsers = await Promise.all(fetchPromises);

	// sort in original order, and serialize
	const serialized = userFollowings.map(following => {
		const user = fetchedUsers.find(u => u.document._id.equals(new ObjectId(following.document.source)));
		return user.serialize();
	});

	apiContext.response(200, { users: serialized });
};
