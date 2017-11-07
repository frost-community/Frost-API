const ApiResult = require('../../../../helpers/apiResult');
const User = require('../../../../documentModels/user');
const UserFollowing = require('../../../../documentModels/userFollowing');
const { StreamUtil } = require('../../../../helpers/stream');

exports.get = async (request) => {
	const result = await request.checkRequestAsync({
		query: [],
		permissions: ['userRead']
	});

	if (result != null) {
		return result;
	}

	// source user
	const sourceUser = await User.findByIdAsync(request.params.id, request.db, request.config);
	if (sourceUser == null) {
		return new ApiResult(404, 'source user as premise not found');
	}

	// target user
	const targetUser = await User.findByIdAsync(request.params.target_id, request.db, request.config);
	if (targetUser == null) {
		return new ApiResult(404, 'target user as premise not found');
	}

	if (sourceUser.document._id.equals(targetUser.document._id)) {
		return new ApiResult(400, 'source user and target user is same');
	}

	const userFollowing = await UserFollowing.findBySrcDestIdAsync(sourceUser.document._id, targetUser.document._id, request.db, request.config);
	if (userFollowing == null) {
		return new ApiResult(404, 'not following', false);
	}

	return new ApiResult(204);
};

exports.put = async (request) => {
	const result = await request.checkRequestAsync({
		body: [],
		permissions: ['userWrite']
	});

	if (result != null) {
		return result;
	}

	request.body = request.body || {};

	// source user
	const sourceUser = await User.findByIdAsync(request.params.id, request.db, request.config);
	if (sourceUser == null) {
		return new ApiResult(404, 'user as premise not found');
	}
	const sourceUserId = sourceUser.document._id;

	if (!sourceUserId.equals(request.user.document._id)) {
		return new ApiResult(403, 'this operation is not permitted');
	}

	// target user
	const targetUser = await User.findByIdAsync(request.params.target_id, request.db, request.config);
	if (targetUser == null) {
		return new ApiResult(404, 'target user as premise not found');
	}
	const targetUserId = targetUser.document._id;

	if (targetUserId.equals(sourceUserId)) {
		return new ApiResult(400, 'source user and target user is same');
	}

	// message
	const message = request.body.message;
	if (message != null && (/^\s*$/.test(message) || /^[\s\S]{1,64}$/.test(message) == false)) {
		return new ApiResult(400, 'message is invalid format.');
	}

	// ドキュメント作成・更新
	let resultUpsert;
	try {
		resultUpsert = await request.db.userFollowings.upsertAsync({ // TODO: move to document models
			source: sourceUserId,
			target: targetUserId
		}, {
			source: sourceUserId,
			target: targetUserId,
			message: message
		}, {renewal: true});
	}
	catch(err) {
		console.dir(err);
	}

	if (resultUpsert.ok != 1) {
		return new ApiResult(500, 'failed to create or update userFollowing');
	}

	let userFollowing;
	try {
		userFollowing = await UserFollowing.findBySrcDestIdAsync(sourceUserId, targetUserId, request.db, request.config);
	}
	catch(err) {
		console.dir(err);
	}

	if (userFollowing == null) {
		return new ApiResult(500, 'failed to fetch userFollowing');
	}

	// 対象ユーザーのstatusチャンネルを購読
	const stream = request.streams.get(StreamUtil.getChannelName('home-timeline-status', sourceUserId.toString()));
	if (stream != null) {
		stream.addSource(targetUserId.toString()); // この操作は冪等
	}

	return new ApiResult(204);
};

exports.delete = async (request) => {
	const result = await request.checkRequestAsync({
		query: [],
		permissions: ['userWrite']
	});

	if (result != null) {
		return result;
	}

	// source user
	const soruceUser = await User.findByIdAsync(request.params.id, request.db, request.config);
	if (soruceUser == null) {
		return new ApiResult(404, 'user as premise not found');
	}
	if (!soruceUser.document._id.equals(request.user.document._id)) {
		return new ApiResult(403, 'this operation is not permitted');
	}

	// target user
	const targetUser = await User.findByIdAsync(request.params.target_id, request.db, request.config);
	if (targetUser == null) {
		return new ApiResult(404, 'target user as premise not found');
	}

	const userFollowing = await UserFollowing.findBySrcDestIdAsync(soruceUser.document._id, targetUser.document._id, request.db, request.config);

	// ドキュメントが存在すれば削除
	if (userFollowing != null) {
		await userFollowing.removeAsync();

		// 購読解除
		const stream = request.streams.get(StreamUtil.getChannelName('home-timeline-status', soruceUser.document._id.toString()));
		if (stream != null) {
			stream.removeSource(targetUser.document._id.toString());
		}
	}

	return new ApiResult(204);
};
