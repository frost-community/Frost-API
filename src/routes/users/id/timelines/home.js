const User = require('../../../../documentModels/user');
const UserFollowing = require('../../../../documentModels/userFollowing');
const timelineAsync = require('../../../../helpers/timelineAsync');
const $ = require('cafy').default;
const { ApiError } = require('../../../../helpers/errors');

// TODO: 不完全な実装

exports.get = async (apiContext) => {
	await apiContext.check({
		query: {
			limit: { cafy: $().number().range(0, 100), default: 30 }
		},
		permissions: ['postRead', 'userRead']
	});

	try {
		// user
		const user = await User.findByIdAsync(apiContext.params.id, apiContext.db, apiContext.config);
		if (user == null) {
			throw new ApiError(404, 'user as premise not found');
		}

		// limit
		let limit = apiContext.query.limit;

		// ids
		const followings = await UserFollowing.findTargetsAsync(user.document._id, null, apiContext.db, apiContext.config);
		const ids = (followings != null) ? followings.map(i => i.document.target) : [];
		ids.push(user.document._id); // ソースユーザーを追加

		return await timelineAsync('status', ids, limit, apiContext.db, apiContext.config);
	}
	catch(err) {
		console.log(err);
	}
};
