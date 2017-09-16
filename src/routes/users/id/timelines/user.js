'use strict';

const ApiResult = require('../../../../helpers/apiResult');
const User = require('../../../../documentModels/user');
const timelineAsync = require('../../../../helpers/timelineAsync');

// TODO: 不完全な実装

exports.get = async (request) => {
	const result = await request.checkRequestAsync({
		query: [
			{name: 'limit', type: 'number', require: false}
		],
		permissions: ['postRead', 'userRead']
	});

	if (result != null) {
		return result;
	}

	try {
		// user
		const user = await User.findByIdAsync(request.params.id, request.db, request.config);
		if (user == null) {
			return new ApiResult(404, 'user as premise not found');
		}

		// limit
		let limit = request.query.limit;
		if (limit != null) {
			limit = parseInt(limit);
			if (isNaN(limit) || limit <= 0 || limit > 100) {
				return new ApiResult(400, 'limit is invalid');
			}
		}
		else {
			limit = 30;
		}

		return await timelineAsync('status', [user.document._id], limit, request.db, request.config);
	}
	catch(err) {
		console.dir(err);
	}
};
