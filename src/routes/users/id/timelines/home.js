'use strict';

const ApiResult = require('../../../../helpers/apiResult');
const Post = require('../../../../documentModels/post');
const UserFollowing = require('../../../../documentModels/userFollowing');

// TODO: 不完全な実装

exports.get = async (request) => {
	const result = await request.checkRequestAsync({
		permissions: ['postRead', 'userRead']
	});

	if (result != null) {
		return result;
	}

	let limit = request.query.limit;
	if (limit != null) {
		limit = parseInt(limit);
		if (isNaN(limit) || limit <= 0 || limit > 100) {
			return new ApiResult(400, 'limit is invalid');
		}
	}
	else {
		limit = 30;
	}

	let posts;

	try {
		const followings = await UserFollowing.findTargetsAsync(request.user.document._id, 30, request.db, request.config);
		const ids = followings.map(i => i.document.target);

		posts = await Post.findArrayAsync({
			$and: [
				{userId: {$in: ids}},
				{type: 'status'}
			]
		}, false, limit, request.db, request.config);
	}
	catch(err) {
		// noop
	}

	if (posts == null || posts.length == 0) {
		return new ApiResult(204);
	}

	const serializedPosts = [];

	for (const post of posts) {
		serializedPosts.push(await post.serializeAsync(true));
	}

	return new ApiResult(200, {posts: serializedPosts});
};
