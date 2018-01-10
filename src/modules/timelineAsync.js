const ApiContext = require('./ApiContext');

/**
 * @param {ApiContext} apiContext
 * @param {String} type
 * @param {[]} ids
 * @param {Number} limit
*/
module.exports = async (apiContext, type, ids, limit) => {
	const { serialize } = apiContext.postsService;

	let query = { type };
	if (ids != null) {
		query = {
			$and: [
				query,
				{ userId: { $in: ids } }
			]
		};
	}

	const posts = await apiContext.repository.findArray('posts', query, false, limit);

	if (posts == null || posts.length == 0) {
		apiContext.response(204);
		return;
	}

	const promises = posts.map(p => serialize(p, true));
	const serializedPosts = await Promise.all(promises);

	apiContext.response(200, { posts: serializedPosts });
};
