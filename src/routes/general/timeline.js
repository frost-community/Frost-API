'use strict';

const ApiResult = require('../../helpers/apiResult');
const User = require('../../documentModels/user');
const Post = require('../../documentModels/post');

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

	posts = posts.map(i => i.serialize());
	for (let post of posts) {
		const user = await User.findByIdAsync(post.userId, request.db, request.config);
		post.user = user.serialize();
	}

	return new ApiResult(200, {posts: posts});
};
