const ApiContext = require('../../../modules/ApiContext');
const MongoAdapter = require('../../../modules/MongoAdapter');
const { RedisEventSender } = require('../../../../modules/redisEvent');
const EventIdHelper = require('../../../../modules/helpers/EventIdHelper');
const $ = require('cafy').default;

/** @param {ApiContext} apiContext */
exports.get = async (apiContext) => {
	await apiContext.proceed({
		body: {
			sourceUserId: { cafy: $().string().pipe(i => MongoAdapter.validateId(i)) },
			targetUserId: { cafy: $().string().pipe(i => MongoAdapter.validateId(i)) }
		},
		scopes: ['user.read']
	});
	if (apiContext.responsed) return;

	const { sourceUserId, targetUserId } = apiContext.body;

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

/** @param {ApiContext} apiContext */
exports.follow = async (apiContext) => {
	await apiContext.proceed({
		body: {
			sourceUserId: { cafy: $().string().pipe(i => MongoAdapter.validateId(i)) },
			targetUserId: { cafy: $().string().pipe(i => MongoAdapter.validateId(i)) },
			message: { cafy: $().string().pipe(i => !/^\s*$/.test(i) || /^[\s\S]{1,64}$/.test(i)), default: null }
		},
		scopes: ['user.write']
	});
	if (apiContext.responsed) return;

	const { sourceUserId, targetUserId, message } = apiContext.body;

	// fetch: source user
	const sourceUser = await apiContext.repository.findById('users', sourceUserId);
	if (sourceUser == null) {
		apiContext.response(404, 'user as premise not found');
		return;
	}

	// fetch: target user
	const targetUser = await apiContext.repository.findById('users', targetUserId);
	if (targetUser == null) {
		apiContext.response(404, 'target user as premise not found');
		return;
	}

	// expect: sourceUser is you
	if (!sourceUser._id.equals(apiContext.user._id)) {
		apiContext.response(403, 'this operation is not permitted');
		return;
	}

	// expect: sourceUser != targetUser
	if (targetUser._id.equals(sourceUser._id)) {
		apiContext.response(400, 'source user and target user is same');
		return;
	}

	// ドキュメント作成・更新
	let userFollowing;
	try {
		userFollowing = await apiContext.userFollowingsService.create(sourceUser._id, targetUser._id, message);
	}
	catch (err) {
		console.log('failed follow');
		console.log(err);
	}

	if (userFollowing == null) {
		apiContext.response(500, 'failed follow');
		return;
	}

	// event.following を発行
	const eventSender = new RedisEventSender('frost-api');
	await eventSender.publish(EventIdHelper.buildEventId(['event', 'following']), {
		following: true,
		sourceId: sourceUserId,
		targetId: targetUserId
	});
	await eventSender.dispose();

	apiContext.response(200, 'following');
};

/** @param {ApiContext} apiContext */
exports.unfollow = async (apiContext) => {
	await apiContext.proceed({
		body: {
			sourceUserId: { cafy: $().string().pipe(i => MongoAdapter.validateId(i)) },
			targetUserId: { cafy: $().string().pipe(i => MongoAdapter.validateId(i)) }
		},
		scopes: ['user.write']
	});
	if (apiContext.responsed) return;

	const { sourceUserId, targetUserId, message } = apiContext.body;

	// fetch: source user
	const sourceUser = await apiContext.repository.findById('users', sourceUserId);
	if (sourceUser == null) {
		apiContext.response(404, 'user as premise not found');
		return;
	}

	// fetch: target user
	const targetUser = await apiContext.repository.findById('users', targetUserId);
	if (targetUser == null) {
		apiContext.response(404, 'target user as premise not found');
		return;
	}

	// expect: sourceUser is you
	if (!sourceUser._id.equals(apiContext.user._id)) {
		apiContext.response(403, 'this operation is not permitted');
		return;
	}

	// expect: sourceUser != targetUser
	if (targetUser._id.equals(sourceUser._id)) {
		apiContext.response(400, 'source user and target user is same');
		return;
	}

	try {
		await apiContext.userFollowingsService.removeBySrcDestId(sourceUser._id, targetUser._id);
	}
	catch (err) {
		console.log('failed unfollow');
		console.log(err);
	}

	// event.following を発行
	const eventSender = new RedisEventSender('frost-api');
	await eventSender.publish(EventIdHelper.buildEventId(['event', 'following']), {
		following: false,
		sourceUserId,
		targetUserId
	});
	await eventSender.dispose();

	apiContext.response(200, { following: false });
};
