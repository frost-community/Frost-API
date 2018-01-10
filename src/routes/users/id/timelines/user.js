const ApiContext = require('../../../../modules/ApiContext');
const timelineAsync = require('../../../../modules/timelineAsync');
const v = require('validator');
const $ = require('cafy').default;

// TODO: 不完全な実装

/** @param {ApiContext} apiContext */
exports.get = async (apiContext) => {
	await apiContext.proceed({
		query: {
			limit: { cafy: $().string().pipe(i => v.isInt(i, { min: 0, max: 100 })), default: '30' }
		},
		permissions: ['postRead', 'userRead']
	});
	if (apiContext.responsed) return;

	// convert query value
	apiContext.query.limit = v.toInt(apiContext.query.limit);

	try {
		// user
		const user = await apiContext.repository.findById('users', apiContext.params.id);
		if (user == null) {
			return apiContext.response(404, 'user as premise not found');
		}

		return await timelineAsync(apiContext, 'status', [user._id], apiContext.query.limit);
	}
	catch (err) {
		console.log(err);
	}
};
