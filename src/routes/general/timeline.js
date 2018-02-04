const ApiContext = require('../../modules/ApiContext');
const MongoAdapter = require('../../modules/MongoAdapter');
const v = require('validator');
const $ = require('cafy').default;
const timeline = require('../../modules/timeline');

/** @param {ApiContext} apiContext */
exports.get = async (apiContext) => {
	await apiContext.proceed({
		query: {
			limit: { cafy: $().string().pipe(i => v.isInt(i, { min: 0, max: 100 })), default: '30' },
			since: { cafy: $().string().pipe(i => MongoAdapter.validateId(i)), default: null },
			until: { cafy: $().string().pipe(i => MongoAdapter.validateId(i)), default: null }
		},
		permissions: ['postRead']
	});
	if (apiContext.responsed) return;

	// convert query value
	let limit = apiContext.query.limit != null ? v.toInt(apiContext.query.limit) : null;
	const since = apiContext.query.since != null ? MongoAdapter.buildId(apiContext.query.since) : null;
	const until = apiContext.query.until != null ? MongoAdapter.buildId(apiContext.query.until) : null;

	try {
		return await timeline(apiContext, 'status', null, { limit, since, until });
	}
	catch (err) {
		console.log(err);
	}
};
