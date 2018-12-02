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

	const postings = await apiContext.repository.findArray('posts', query, {
		isAscending,
		limit,
		since: options.newer,
		until: options.older
	});

	if (postings.length == 0) {
		apiContext.response(200, {
			postings: [],
			newer: null,
			older: null
		});
		return;
	}

	// 昇順の時は順序を反転
	if (isAscending) {
		postings.reverse();
	}

	const serialized = await Promise.all(postings.map(p => apiContext.postsService.serialize(p, true)));

	apiContext.response(200, {
		postings: serialized,
		newer: postings[0]._id,
		older: postings[postings.length-1]._id
	});
};
