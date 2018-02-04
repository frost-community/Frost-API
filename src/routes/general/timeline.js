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
			newer: { cafy: $().string().pipe(i => MongoAdapter.validateId(i)), default: null },
			older: { cafy: $().string().pipe(i => MongoAdapter.validateId(i)), default: null }
		},
		permissions: ['postRead']
	});
	if (apiContext.responsed) return;

	// convert query value
	const limit = apiContext.query.limit != null ? v.toInt(apiContext.query.limit) : null;
	const newer = apiContext.query.newer != null ? MongoAdapter.buildId(apiContext.query.newer) : null;
	const older = apiContext.query.older != null ? MongoAdapter.buildId(apiContext.query.older) : null;

	try {
		return await timeline(apiContext, 'status', null, limit, { newer, older });
	}
	catch (err) {
		console.log(err);
	}
};
