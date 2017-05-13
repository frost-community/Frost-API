'use strict';

const ApiResult = require('../../../helpers/apiResult');
const User = require('../../../documentModels/user');

exports.post = async (request) => {
	const result = await request.checkRequestAsync({
		body: [],
		permissions: ['userWrite']
	});

	if (result != null)
		return result;

	const user = await User.findByIdAsync(request.params.id, request.db, request.config);

	if (user == null)
		return new ApiResult(404, 'user is not found');

	const userId = user.document._id.toString();

	// 購読
	const subscriber = request.subscribers.get(userId);
	if (subscriber != null) {
		subscriber.subscribe(`${userId}:status`);
	}

	return new ApiResult(501, 'not implemented');
};

exports.del = async (request) => {
	const result = await request.checkRequestAsync({
		query: [],
		permissions: ['userWrite']
	});

	if (result != null)
		return result;

	const user = await User.findByIdAsync(request.params.id, request.db, request.config);

	if (user == null)
		return new ApiResult(404, 'user is not found');

	const userId = user.document._id.toString();

	// 購読解除
	const subscriber = request.subscribers.get(userId);
	if (subscriber != null) {
		subscriber.unsubscribe(`${userId}:status`);
	}

	return new ApiResult(501, 'not implemented');
};
