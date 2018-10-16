const ApiContext = require('../../../../modules/ApiContext');
const { RedisEventSender } = require('../../../../modules/redisEvent');
const EventIdHelper = require('../../../../modules/helpers/EventIdHelper');
// const $ = require('cafy').default;

/** @param {ApiContext} apiContext */
exports.get = async (apiContext) => {
	await apiContext.proceed({
		query: {},
		scopes: ['user.read']
	});
	if (apiContext.responsed) return;

	// source user
	const sourceUser = await apiContext.repository.findById('users', apiContext.params.id);
	if (sourceUser == null) {
		apiContext.response(404, 'source user as premise not found');
		return;
	}

	// target user
	const targetUser = await apiContext.repository.findById('users', apiContext.params.target_id);
	if (targetUser == null) {
		apiContext.response(404, 'target user as premise not found');
		return;
	}

	if (sourceUser._id.equals(targetUser._id)) {
		apiContext.response(400, 'source user and target user is same');
		return;
	}

	const userFollowing = await apiContext.userFollowingsService.findBySrcDestId(sourceUser._id, targetUser._id);
	apiContext.response(200, { following: userFollowing != null });
};

/** @param {ApiContext} apiContext */
exports.put = async (apiContext) => {
	await apiContext.proceed({
		body: {},
		scopes: ['user.write']
	});
	if (apiContext.responsed) return;

	// source user
	const sourceUser = await apiContext.repository.findById('users', apiContext.params.id);
	if (sourceUser == null) {
		apiContext.response(404, 'user as premise not found');
		return;
	}
	const sourceUserId = sourceUser._id;

	if (!sourceUserId.equals(apiContext.user._id)) {
		apiContext.response(403, 'this operation is not permitted');
		return;
	}

	// target user
	const targetUser = await apiContext.repository.findById('users', apiContext.params.target_id);
	if (targetUser == null) {
		apiContext.response(404, 'target user as premise not found');
		return;
	}
	const targetUserId = targetUser._id;

	if (targetUserId.equals(sourceUserId)) {
		apiContext.response(400, 'source user and target user is same');
		return;
	}

	// message
	const message = apiContext.body.message;
	if (message != null && (/^\s*$/.test(message) || /^[\s\S]{1,64}$/.test(message) == false)) {
		apiContext.response(400, 'message is invalid format.');
		return;
	}

	// ドキュメント作成・更新
	let userFollowing;
	try {
		userFollowing = await apiContext.userFollowingsService.create(sourceUserId, targetUserId, message);
	}
	catch (err) {
		console.log(err);
	}

	if (userFollowing == null) {
		apiContext.response(500, 'failed to create or update userFollowing');
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
exports.delete = async (apiContext) => {
	await apiContext.proceed({
		query: {},
		scopes: ['user.write']
	});
	if (apiContext.responsed) return;

	// source user
	const soruceUser = await apiContext.repository.findById('users', apiContext.params.id);
	if (soruceUser == null) {
		apiContext.response(404, 'user as premise not found');
		return;
	}
	if (!soruceUser._id.equals(apiContext.user._id)) {
		apiContext.response(403, 'this operation is not permitted');
		return;
	}

	// target user
	const targetUser = await apiContext.repository.findById('users', apiContext.params.target_id);
	if (targetUser == null) {
		apiContext.response(404, 'target user as premise not found');
		return;
	}

	try {
		await apiContext.userFollowingsService.removeBySrcDestId(soruceUser._id, targetUser._id);
	}
	catch (err) {
		// ignore
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
