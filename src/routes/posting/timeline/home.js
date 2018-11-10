const ApiContext = require('../../../modules/ApiContext');
const MongoAdapter = require('../../../modules/MongoAdapter');
const v = require('validator');
const $ = require('cafy').default;
const timeline = require('../../../modules/timeline');

/** @param {ApiContext} apiContext */
exports.list = async (apiContext) => {
	await apiContext.proceed({
		body: {
			userId: { cafy: $().string().pipe(i => MongoAdapter.validateId(i)) },
			limit: { cafy: $().string().pipe(i => v.isInt(i, { min: 0, max: 100 })), default: '30' },
			newer: { cafy: $().string().pipe(i => MongoAdapter.validateId(i)), default: null },
			older: { cafy: $().string().pipe(i => MongoAdapter.validateId(i)), default: null }
		},
		scopes: ['post.read', 'user.read']
	});
	if (apiContext.responsed) return;

	// convert body value
	const limit = apiContext.body.limit != null ? v.toInt(apiContext.body.limit) : null;
	const newer = apiContext.body.newer != null ? MongoAdapter.buildId(apiContext.body.newer) : null;
	const older = apiContext.body.older != null ? MongoAdapter.buildId(apiContext.body.older) : null;

	try {
		// user
		const user = await apiContext.repository.findById('users', apiContext.body.userId);
		if (user == null) {
			apiContext.response(404, 'user as premise not found');
			return;
		}

		// ids (フォロー中のユーザー + 自分自身)
		const followings = await apiContext.userFollowingsService.findTargets(user._id, { isAscending: false });
		const ids = followings.map(i => i.target);
		ids.push(user._id); // ソースユーザーを追加

		return await timeline(apiContext, 'status', ids, limit, { newer, older });
	}
	catch (err) {
		console.log(err);
	}
};