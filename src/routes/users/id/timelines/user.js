const User = require('../../../../documentModels/user');
const timelineAsync = require('../../../../helpers/timelineAsync');
const $ = require('cafy').default;

// TODO: 不完全な実装

exports.get = async (apiContext) => {
	await apiContext.proceed({
		query: {
			limit: { cafy: $().number().range(0, 100), default: 30 }
		},
		permissions: ['postRead', 'userRead']
	});
	if (apiContext.responsed) return;

	try {
		// user
		const user = await User.findByIdAsync(apiContext.params.id, apiContext.db, apiContext.config);
		if (user == null) {
			return apiContext.response(404, 'user as premise not found');
		}

		// limit
		let limit = apiContext.query.limit;

		return await timelineAsync(apiContext, 'status', [user.document._id], limit);
	}
	catch (err) {
		console.log(err);
	}
};
