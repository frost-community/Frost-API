const ApiContext = require('../../modules/ApiContext');
const timeline = require('../../modules/timeline');
const v = require('validator');
const $ = require('cafy').default;

// TODO: 不完全な実装

/** @param {ApiContext} apiContext */
exports.get = async (apiContext) => {
	await apiContext.proceed({
		query: {
			limit: { cafy: $().string().pipe(i => v.isInt(i, { min: 0, max: 100 })), default: '30' }
		},
		permissions: ['postRead']
	});
	if (apiContext.responsed) return;

	// convert query value
	const limit = v.toInt(apiContext.query.limit);

	try {
		return await timeline(apiContext, 'status', null, limit);
	}
	catch (err) {
		console.log(err);
	}
};
