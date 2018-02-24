const ApiContext = require('./ApiContext');

/**
 * @param {ApiContext} apiContext
 * @param {String} type
 * @param {[]} ids
 * @param {Number} limit
 * @param {{newer: ObjectId, older: ObjectId}} options
*/
module.exports = async (apiContext, type, ids, limit, options) => {
	// 両方のカーソルを設定することはできない
	if (options.newer != null && options.older != null) {
		apiContext.response(400, 'can not use newer and older simultaneously');
		return;
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

	// newerが指定されている時だけ昇順
	const isAscending = (options.newer != null);

	const posts = await apiContext.repository.findArray('posts', query, {
		isAscending,
		limit,
		since: options.newer,
		until: options.older
	});

	if (posts.length == 0) {
		apiContext.response(204);
		return;
	}

	// 昇順の時は順序を反転
	if (isAscending) {
		posts.reverse();
	}

	const promises = posts.map(p => apiContext.postsService.serialize(p, true));

	apiContext.response(200, {
		posts: await Promise.all(promises),
		newer: posts[0]._id,
		older: posts[posts.length-1]._id
	});
};
