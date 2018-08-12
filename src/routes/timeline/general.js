const ApiContext = require('../../modules/ApiContext');
const MongoAdapter = require('../../modules/MongoAdapter');
const v = require('validator');
const $ = require('cafy').default;
const timeline = require('../../modules/timeline');

/** @param {ApiContext} apiContext */
exports.get = async (apiContext) => {
	await apiContext.proceed({
		body: {
			limit: { cafy: $().string().pipe(i => v.isInt(i, { min: 0, max: 100 })), default: '30' },
			newer: { cafy: $().string().pipe(i => MongoAdapter.validateId(i)), default: null },
			older: { cafy: $().string().pipe(i => MongoAdapter.validateId(i)), default: null }
		},
		scopes: ['post.read']
	});
	if (apiContext.responsed) return;

	// convert body value
	const limit = apiContext.body.limit != null ? v.toInt(apiContext.body.limit) : null;
	const newer = apiContext.body.newer != null ? MongoAdapter.buildId(apiContext.body.newer) : null;
	const older = apiContext.body.older != null ? MongoAdapter.buildId(apiContext.body.older) : null;

	try {
		return await timeline(apiContext, 'status', null, limit, { newer, older });
	}
	catch (err) {
		console.log(err);
	}
};
