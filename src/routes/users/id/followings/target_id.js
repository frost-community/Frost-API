'use strict';

const ApiResult = require('../../../../helpers/apiResult');
const User = require('../../../../documentModels/user');
const UserFollowing = require('../../../../documentModels/userFollowing');

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

	// user
	const user = await User.findByIdAsync(request.params.id, request.db, request.config);
	if (user == null) {
		return new ApiResult(404, 'user as premise not found');
	}
	const userId = user.document._id;

	if (!userId.equals(request.user.document._id)) {
		return new ApiResult(403, 'you do not have permission to execute');
	}

	// target user
	const targetUser = await User.findByIdAsync(request.params.target_id, request.db, request.config);
	if (targetUser == null) {
		return new ApiResult(404, 'target user as premise not found');
	}
	const targetUserId = targetUser.document._id;

	if (targetUserId.equals(userId)) {
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
			source: userId,
			target: targetUserId
		}, {
			source: userId,
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
		userFollowing = await UserFollowing.findBySrcDestIdAsync(userId, targetUserId, request.db, request.config);
	}
	catch(err) {
		console.dir(err);
	}

	if (userFollowing == null) {
		return new ApiResult(500, 'failed to fetch userFollowing');
	}

	// 対象ユーザーのstatusチャンネルを購読
	const meSubscriber = request.subscribers.get(userId.toString());
	if (meSubscriber != null) {
		meSubscriber.subscribe(`${targetUserId.toString()}:status`); // この操作は冪等
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
		return new ApiResult(403, 'you do not have permission to execute');
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
		const subscriber = request.subscribers.get(soruceUser.document._id.toString());
		if (subscriber != null) {
			subscriber.unsubscribe(`${targetUser.document._id.toString()}:status`);
		}
	}

	return new ApiResult(204);
};
