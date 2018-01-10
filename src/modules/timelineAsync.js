const Post = require('../documentModels/post');

module.exports = async (apiContext, type, ids, limit) => {
	let query = { type };

	if (ids != null) {
		query = {
			$and: [
				query,
				{ userId: { $in: ids } }
			]
		};
	}

	const posts = await Post.findArrayAsync(query, false, limit);

	if (posts == null || posts.length == 0) {
		apiContext.response(204);
		return;
	}

	const serializedPosts = [];
	for (const post of posts) {
		serializedPosts.push(await post.serializeAsync(true));
	}

	apiContext.response(200, { posts: serializedPosts });
};
