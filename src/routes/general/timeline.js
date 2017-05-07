'use strict';

const ApiResult = require('../../helpers/apiResult');
const Post = require('../../documentModels/post');

exports.get = async (request) => {
	const result = await request.checkRequestAsync({
		params: [],
		permissions: ['postRead']
	});

	if (result != null)
		return result;

	let posts;
	try {
		posts = await Post.findArrayByTypeAsync({$in: ['status']}, true, 30, request.db, request.config);
	}
	catch(err) {
		// noop
	}

	if (posts == null || posts.length == 0)
		return new ApiResult(404, 'posts are empty');

	return new ApiResult(200, {posts: posts.map(i => i.serialize())});
};
