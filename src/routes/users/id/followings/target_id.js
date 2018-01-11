const ApiContext = require('../../../../modules/ApiContext');
const { StreamUtil } = require('../../../../modules/stream');
// const $ = require('cafy').default;

/** @param {ApiContext} apiContext */
exports.get = async (apiContext) => {
	await apiContext.proceed({
		query: {},
		permissions: ['userRead']
	});
	if (apiContext.responsed) return;

	// source user
	const sourceUser = await apiContext.repository.findById('users', apiContext.params.id);
	if (sourceUser == null) {
		return apiContext.response(404, 'source user as premise not found');
	}

	// target user
	const targetUser = await apiContext.repository.findById('users', apiContext.params.target_id);
	if (targetUser == null) {
		return apiContext.response(404, 'target user as premise not found');
	}

	if (sourceUser._id.equals(targetUser._id)) {
		return apiContext.response(400, 'source user and target user is same');
	}

	const userFollowing = await apiContext.userFollowingsService.findBySrcDestId(sourceUser._id, targetUser._id);
	if (userFollowing == null) {
		return apiContext.response(404, 'not following', false);
	}

	apiContext.response(204);
};

/** @param {ApiContext} apiContext */
exports.put = async (apiContext) => {
	await apiContext.proceed({
		body: {},
		permissions: ['userWrite']
	});
	if (apiContext.responsed) return;

	// source user
	const sourceUser = await apiContext.repository.findById('users', apiContext.params.id);
	if (sourceUser == null) {
		return apiContext.response(404, 'user as premise not found');
	}
	const sourceUserId = sourceUser._id;

	if (!sourceUserId.equals(apiContext.user._id)) {
		return apiContext.response(403, 'this operation is not permitted');
	}

	// target user
	const targetUser = await apiContext.repository.findById('users', apiContext.params.target_id);
	if (targetUser == null) {
		return apiContext.response(404, 'target user as premise not found');
	}
	const targetUserId = targetUser._id;

	if (targetUserId.equals(sourceUserId)) {
		return apiContext.response(400, 'source user and target user is same');
	}

	// message
	const message = apiContext.body.message;
	if (message != null && (/^\s*$/.test(message) || /^[\s\S]{1,64}$/.test(message) == false)) {
		return apiContext.response(400, 'message is invalid format.');
	}

	// ドキュメント作成・更新
	let resultUpsert;
	try {
		resultUpsert = await apiContext.userFollowingsService.create(sourceUserId, targetUserId, message);
	}
	catch (err) {
		console.log(err);
	}

	if (resultUpsert.ok != 1) {
		return apiContext.response(500, 'failed to create or update userFollowing');
	}

	let userFollowing;
	try {
		userFollowing = await apiContext.userFollowingsService.findBySrcDestId(sourceUserId, targetUserId);
	}
	catch (err) {
		console.log(err);
	}

	if (userFollowing == null) {
		return apiContext.response(500, 'failed to fetch userFollowing');
	}

	// 対象ユーザーのストリームを購読
	const stream = apiContext.streams.get(StreamUtil.buildStreamId('user-timeline-status', sourceUserId.toString()));
	if (stream != null) {
		stream.addSource(targetUserId.toString()); // この操作は冪等
	}

	apiContext.response(204);
};

/** @param {ApiContext} apiContext */
exports.delete = async (apiContext) => {
	await apiContext.proceed({
		query: {},
		permissions: ['userWrite']
	});
	if (apiContext.responsed) return;

	// source user
	const soruceUser = await apiContext.repository.findById('users', apiContext.params.id);
	if (soruceUser == null) {
		return apiContext.response(404, 'user as premise not found');
	}
	if (!soruceUser._id.equals(apiContext.user._id)) {
		return apiContext.response(403, 'this operation is not permitted');
	}

	// target user
	const targetUser = await apiContext.repository.findById('users', apiContext.params.target_id);
	if (targetUser == null) {
		return apiContext.response(404, 'target user as premise not found');
	}

	try {
		await apiContext.userFollowingsService.removeBySrcDestId(soruceUser._id, targetUser._id);
	}
	catch (err) {
		// ignore
	}

	// 対象ユーザーのストリームを購読解除
	const stream = apiContext.streams.get(StreamUtil.buildStreamId('user-timeline-status', soruceUser._id.toString()));
	if (stream != null) {
		stream.removeSource(targetUser._id.toString());
	}

	apiContext.response(204);
};
