const User = require('../../../../documentModels/user');
const timelineAsync = require('../../../../helpers/timelineAsync');
const $ = require('cafy').default;
const { ApiError } = require('../../../../helpers/errors');

// TODO: 不完全な実装

exports.get = async (apiContext) => {
	await apiContext.check({
		query: {
			limit: { cafy: $().number().range(0, 100), default: 30 }
		},
		permissions: ['postRead', 'userRead']
	});

	try {
		// user
		const user = await User.findByIdAsync(apiContext.params.id, apiContext.db, apiContext.config);
		if (user == null) {
			throw new ApiError(404, 'user as premise not found');
		}

		// limit
		let limit = apiContext.query.limit;

		return await timelineAsync('status', [user.document._id], limit, apiContext.db, apiContext.config);
	}
	catch (err) {
		console.log(err);
	}
};
