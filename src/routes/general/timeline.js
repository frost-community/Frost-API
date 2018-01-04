const timelineAsync = require('../../helpers/timelineAsync');
const v = require('validator');
const $ = require('cafy').default;

// TODO: 不完全な実装

exports.get = async (apiContext) => {
	await apiContext.proceed({
		query: {
			limit: { cafy: $().string().pipe(i => v.isInt(i, { min: 0, max: 100 })), default: '30' }
		},
		permissions: ['postRead']
	});
	if (apiContext.responsed) return;

	// convert query value
	apiContext.query.limit = v.toInt(apiContext.query.limit);

	try {
		return await timelineAsync(apiContext, 'status', null, apiContext.query.limit);
	}
	catch (err) {
		console.log(err);
	}
};
