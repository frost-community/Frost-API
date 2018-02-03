const ApiContext = require('./ApiContext');

/**
 * @param {ApiContext} apiContext
 * @param {String} type
 * @param {[]} ids
 * @param {{isAscending: Boolean, limit: Number, since: ObjectId, until: ObjectId}} findOptions
*/
module.exports = async (apiContext, type, ids, findOptions) => {

	let query = { type };
	if (ids != null) {
		query = {
			$and: [
				query,
				{ userId: { $in: ids } }
			]
		};
	}

	const posts = await apiContext.repository.findArray('posts', query, findOptions);

	if (posts.length == 0) {
		apiContext.response(204);
		return;
	}

	const promises = posts.map(p => apiContext.postsService.serialize(p, true));
	const serializedPosts = await Promise.all(promises);

	apiContext.response(200, { posts: serializedPosts });
};
