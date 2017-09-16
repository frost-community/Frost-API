'use strict';

const ApiResult = require('../../helpers/apiResult');
const timelineAsync = require('../../helpers/timelineAsync');

// TODO: 不完全な実装

exports.get = async (request) => {
	const result = await request.checkRequestAsync({
		query: [
			{name: 'limit', type: 'number', require: false}
		],
		permissions: ['postRead']
	});

	if (result != null) {
		return result;
	}

	try {
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

		return await timelineAsync('status', null, limit, request.db, request.config);
	}
	catch(err) {
		console.dir(err);
	}
};
