'use strict';

const ApiResult = require('../../helpers/apiResult');
const User = require('../../documentModels/user');
const Post = require('../../documentModels/post');

// TODO: 不完全な実装

exports.get = async (request) => {
	const result = await request.checkRequestAsync({
		query: [],
		permissions: ['postRead']
	});

	if (result != null)
		return result;

	let posts;
	try {
		posts = await Post.findArrayByTypeAsync({$in: ['status']}, false, 30, request.db, request.config);
	}
	catch(err) {
		// noop
	}

	if (posts == null || posts.length == 0)
		return new ApiResult(404, 'posts are empty');

	posts.reverse();

	const serializedPosts = [];
	for (const post of posts)
		serializedPosts.push(await post.serializeAsync(true));

	return new ApiResult(200, {posts: serializedPosts});
};
