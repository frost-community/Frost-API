const ApiResult = require('./apiResult');
const Post = require('../documentModels/post');

module.exports = async (type, ids, limit, db, config) => {
	let query = {type: type};

	if (ids != null) {
		query = {$and: [
			query,
			{userId: {$in: ids}}
		]};
	}

	const posts = await Post.findArrayAsync(query, false, limit, db, config);

	if (posts == null || posts.length == 0) {
		return new ApiResult(204);
	}

	const serializedPosts = [];
	for (const post of posts) {
		serializedPosts.push(await post.serializeAsync(true));
	}

	return new ApiResult(200, {posts: serializedPosts});
};
