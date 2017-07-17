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

	const userFollowing = await UserFollowing.findBySrcDestAsync(sourceUser.document._id, targetUser.document._id, request.db, request.config);
	if (userFollowing == null) {
		return new ApiResult(204);
	}

	return new ApiResult(200);
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
		return new ApiResult(404, 'user as premise not found');
	}
	if (user.document._id != request.user.document._id) {
		return new ApiResult(403, 'you do not have permission to execute');
	}
	const userId = user.document._id;

	// target user
	const targetUser = await User.findByIdAsync(request.body.target_id, request.db, request.config);
	if (targetUser == null) {
		return new ApiResult(404, 'target user as premise not found');
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

	return new ApiResult(201, {following: userFollowing.serialize()});
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
		return new ApiResult(404, 'user as premise not found');
	}
	if (user.document._id != request.user.document._id) {
		return new ApiResult(403, 'you do not have permission to execute');
	}

	// target user
	const targetUser = await User.findByIdAsync(request.params.id, request.db, request.config);
	if (targetUser == null) {
		return new ApiResult(404, 'target user as premise not found');
	}

	const userFollowing = await UserFollowing.findBySrcDestAsync(user.document._id, targetUser.document._id, request.db, request.config);

	// ドキュメントが存在すれば削除
	if (userFollowing != null) {
		await userFollowing.removeAsync();

		// 購読解除
		const subscriber = request.subscribers.get(user.document._id.toString());
		if (subscriber != null) {
			subscriber.unsubscribe(`${targetUser.document._id.toString()}:status`);
		}
	}

	return new ApiResult(204);
};
