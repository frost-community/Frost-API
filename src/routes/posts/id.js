const ApiResult = require('../../helpers/apiResult');
const Post = require('../../documentModels/post');

exports.get = async (request) => {
	const result = await request.checkRequestAsync({
		query: [],
		permissions: ['postRead']
	});

	if (result != null) {
		return result;
	}

	const post = await Post.findByIdAsync(request.params.id, request.db, request.config);

	if (post == null) {
		return new ApiResult(204);
	}
	return new ApiResult(200, {post: post.serialize()});
};
