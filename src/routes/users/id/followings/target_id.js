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

	return new ApiResult(501, 'not implemented');
};

exports.put = async (request) => {
	const result = await request.checkRequestAsync({
		body: [],
		permissions: ['userWrite']
	});

	if (result != null) {
		return result;
	}

	// user
	const user = await User.findByIdAsync(request.params.id, request.db, request.config);
	if (user == null) {
		return new ApiResult(404, 'user is not found');
	}
	if (user.document._id != request.user.document._id) {
		return new ApiResult(404, 'user is not authorized');
	}
	const userId = user.document._id;

	// targetUser
	const targetUser = await User.findByIdAsync(request.body.target_id, request.db, request.config);
	if (targetUser == null) {
		return new ApiResult(404, 'target user is not found');
	}
	const targetUserId = targetUser.document._id;

	// message
	const message = request.body.message;
	if (message != null && (/^\s*$/.test(message) || /^[\s\S]{1,64}$/.test(message) == false)) {
		return new ApiResult(400, 'message is invalid format.');
	}

	// ドキュメント作成
	let userFollowing;
	try {
		userFollowing = await request.db.userFollowings.createAsync({ // TODO: move to document models
			source: userId,
			target: targetUserId,
			message: message
		});
	}
	catch(err) {
		console.log(err.trace);
	}

	if (userFollowing == null) {
		return new ApiResult(500, 'failed to create userFollowing');
	}

	// 購読
	const meSubscriber = request.subscribers.get(userId.toString());
	if (meSubscriber != null) {
		meSubscriber.subscribe(`${targetUserId.toString()}:status`);
	}

	return new ApiResult(200, {userFollowing: userFollowing.serialize()});
};

exports.del = async (request) => {
	const result = await request.checkRequestAsync({
		query: [],
		permissions: ['userWrite']
	});

	if (result != null) {
		return result;
	}

	// user
	const user = await User.findByIdAsync(request.params.id, request.db, request.config);
	if (user == null) {
		return new ApiResult(404, 'user is not found');
	}
	if (user.document._id != request.user.document._id) {
		return new ApiResult(404, 'user is not authorized');
	}
	const userId = user.document._id;

	// targetUser
	const targetUser = await User.findByIdAsync(request.params.id, request.db, request.config);
	if (targetUser == null) {
		return new ApiResult(404, 'target user is not found');
	}
	const targetUserId = targetUser.document._id;

	const userFollowing = await UserFollowing.findBySrcDestAsync(userId, targetUserId, request.db, request.config);

	if (userFollowing == null) {
		return new ApiResult(400, 'you are not following this user');
	}

	await userFollowing.removeAsync();

	// 購読解除
	const subscriber = request.subscribers.get(userId.toString());
	if (subscriber != null) {
		subscriber.unsubscribe(`${targetUserId.toString()}:status`);
	}

	return new ApiResult(200);
};
