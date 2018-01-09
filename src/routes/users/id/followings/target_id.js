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
	const sourceUser = await User.findByIdAsync(apiContext.params.id, apiContext.db, apiContext.config);
	if (sourceUser == null) {
		return apiContext.response(404, 'source user as premise not found');
	}

	// target user
	const targetUser = await User.findByIdAsync(apiContext.params.target_id, apiContext.db, apiContext.config);
	if (targetUser == null) {
		return apiContext.response(404, 'target user as premise not found');
	}

	if (sourceUser.document._id.equals(targetUser.document._id)) {
		return apiContext.response(400, 'source user and target user is same');
	}

	const userFollowing = await UserFollowing.findBySrcDestIdAsync(sourceUser.document._id, targetUser.document._id, apiContext.db, apiContext.config);
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

	apiContext.body = apiContext.body || {};

	// source user
	const sourceUser = await User.findByIdAsync(apiContext.params.id, apiContext.db, apiContext.config);
	if (sourceUser == null) {
		return apiContext.response(404, 'user as premise not found');
	}
	const sourceUserId = sourceUser.document._id;

	if (!sourceUserId.equals(apiContext.user.document._id)) {
		return apiContext.response(403, 'this operation is not permitted');
	}

	// target user
	const targetUser = await User.findByIdAsync(apiContext.params.target_id, apiContext.db, apiContext.config);
	if (targetUser == null) {
		return apiContext.response(404, 'target user as premise not found');
	}
	const targetUserId = targetUser.document._id;

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
		resultUpsert = await UserFollowingsService.create(sourceUserId, targetUserId, message);
	}
	catch (err) {
		console.log(err);
	}

	if (resultUpsert.ok != 1) {
		return apiContext.response(500, 'failed to create or update userFollowing');
	}

	let userFollowing;
	try {
		userFollowing = await UserFollowing.findBySrcDestIdAsync(sourceUserId, targetUserId, apiContext.db, apiContext.config);
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
	const soruceUser = await User.findByIdAsync(apiContext.params.id, apiContext.db, apiContext.config);
	if (soruceUser == null) {
		return apiContext.response(404, 'user as premise not found');
	}
	if (!soruceUser.document._id.equals(apiContext.user.document._id)) {
		return apiContext.response(403, 'this operation is not permitted');
	}

	// target user
	const targetUser = await User.findByIdAsync(apiContext.params.target_id, apiContext.db, apiContext.config);
	if (targetUser == null) {
		return apiContext.response(404, 'target user as premise not found');
	}

	const userFollowing = await UserFollowing.findBySrcDestIdAsync(soruceUser.document._id, targetUser.document._id, apiContext.db, apiContext.config);

	// ドキュメントが存在すれば削除
	if (userFollowing != null) {
		await UserFollowingsService.remove();

		// 対象ユーザーのストリームを購読解除
		const stream = apiContext.streams.get(StreamUtil.buildStreamId('user-timeline-status', soruceUser.document._id.toString()));
		if (stream != null) {
			stream.removeSource(targetUser.document._id.toString());
		}
	}

	apiContext.response(204);
};
