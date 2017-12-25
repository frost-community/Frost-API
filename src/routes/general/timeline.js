const timelineAsync = require('../../helpers/timelineAsync');
const $ = require('cafy').default;

// TODO: 不完全な実装

exports.get = async (apiContext) => {
	await apiContext.proceed({
		query: {
			limit: { cafy: $().number().range(0, 100), default: 30 }
		},
		permissions: ['postRead']
	});
	if (apiContext.responsed) return;

	try {
		return await timelineAsync(apiContext, 'status', null, apiContext.query.limit);
	}
	catch (err) {
		console.log(err);
	}
};
