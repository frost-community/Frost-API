'use strict';

const ApiResult = require('../../../../helpers/apiResult');
const User = require('../../../../documentModels/user');
const UserFollowing = require('../../../../documentModels/userFollowing');

// TODO: limit指定、カーソル送り等

exports.get = async (request) => {
	const result = await request.checkRequestAsync({
		query: [],
		permissions: ['userRead']
	});

	if (result != null) {
		return result;
	}

	// user
	const user = await User.findByIdAsync(request.params.id, request.db, request.config);
	if (user == null) {
		return new ApiResult(404, 'user as premise not found');
	}

	const userFollowings = await UserFollowing.findTargetsAsync(user.document._id, 30, request.db, request.config);
	if (userFollowings == null || userFollowings.length == 0) {
		return new ApiResult(204);
	}

	const serialized = [];
	for (const i of userFollowings) {
		serialized.push(i.document.target.toString());
	}
	return new ApiResult(200, {userfollowings: serialized});
};
