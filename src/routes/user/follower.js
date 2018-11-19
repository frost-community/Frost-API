const ApiContext = require('../../modules/ApiContext');
const MongoAdapter = require('../../modules/MongoAdapter');
const v = require('validator');
const $ = require('cafy').default;

/** @param {ApiContext} apiContext */
exports.list = async (apiContext) => {
	await apiContext.proceed({
		params: {
			userId: { cafy: $().string().pipe(i => MongoAdapter.validateId(i)) },
			limit: { cafy: $().string().pipe(i => v.isInt(i, { min: 0, max: 100 })), default: '30' },
			next: { cafy: $().string().pipe(i => MongoAdapter.validateId(i)), default: null }
		},
		scopes: ['user.read']
	});
	if (apiContext.responsed) return;

	// convert params value
	const limit = v.toInt(apiContext.params.limit);
	const next = apiContext.params.next != null ? MongoAdapter.buildId(apiContext.params.next) : null;

	// user
	const user = await apiContext.repository.findById('users', apiContext.params.userId);
	if (user == null) {
		apiContext.response(404, 'user as premise not found');
		return;
	}

	// このユーザーがフォロー元であるフォロー関係をすべて取得
	const userFollowings = await apiContext.userFollowingsService.findSources(user._id, { limit, since: next });
	if (userFollowings.length == 0) {
		apiContext.response(204);
		return;
	}

	// fetch and serialize users
	const promises = userFollowings.map(async following => {
		const user = await apiContext.repository.findById('users', following.source);
		if (user == null) {
			console.log(`notfound following source userId: ${following.source.toString()}`);
			return;
		}
		return apiContext.usersService.serialize(user);
	});

	apiContext.response(200, {
		users: await Promise.all(promises),
		next: userFollowings[userFollowings.length-1]._id
	});
};
