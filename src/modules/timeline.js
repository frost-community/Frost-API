const ApiContext = require('./ApiContext');

/**
 * @param {ApiContext} apiContext
 * @param {String} type
 * @param {[]} ids
 * @param {{isAscending: Boolean, limit: Number, since: ObjectId, until: ObjectId}} findOptions
*/
module.exports = async (apiContext, type, ids, findOptions) => {
	const isFullCursor = findOptions.since != null && findOptions.until != null;

	// 両方のカーソルが設定されているときは、リミットを設定することができない
	if (findOptions.limit != null && isFullCursor) {
		apiContext.response(400, 'can not use limit, next, and prev simultaneously');
		return;
	}
	if (findOptions.limit == null && !isFullCursor) {
		findOptions.limit = 30;
	}

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

	// カーソルの範囲を確認
	if (isFullCursor && posts.length > 100) {
		apiContext.response(400, 'cursor range is limit over(100 items or less)');
		return;
	}

	const promises = posts.map(p => apiContext.postsService.serialize(p, true));
	const serializedPosts = await Promise.all(promises);

	apiContext.response(200, { posts: serializedPosts });
};
