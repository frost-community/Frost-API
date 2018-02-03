const ApiContext = require('../../../../modules/ApiContext');
const MongoAdapter = require('../../../../modules/MongoAdapter');
const v = require('validator');
const $ = require('cafy').default;
const timeline = require('../../../../modules/timeline');

/** @param {ApiContext} apiContext */
exports.get = async (apiContext) => {
	await apiContext.proceed({
		query: {
			limit: { cafy: $().string().pipe(i => v.isInt(i, { min: 0, max: 100 })), default: '30' },
			since: { cafy: $().string().pipe(i => MongoAdapter.validateId(i)), default: null },
			until: { cafy: $().string().pipe(i => MongoAdapter.validateId(i)), default: null }
		},
		permissions: ['postRead', 'userRead']
	});
	if (apiContext.responsed) return;

	// convert query value
	const limit = v.toInt(apiContext.query.limit);
	const since = apiContext.query.since != null ? MongoAdapter.buildId(apiContext.query.since) : null;
	const until = apiContext.query.until != null ? MongoAdapter.buildId(apiContext.query.until) : null;

	try {
		// user
		const user = await apiContext.repository.findById('users', apiContext.params.id);
		if (user == null) {
			apiContext.response(404, 'user as premise not found');
			return;
		}

		return await timeline(apiContext, 'status', [user._id], { limit, since, until });
	}
	catch (err) {
		console.log(err);
	}
};
