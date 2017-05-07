'use strict';

const ApiResult = require('../../helpers/apiResult');

exports.post = async (request) => {
	const result = await request.checkRequestAsync({
		body: [
			{name: 'text', type: 'string'}
		],
		permissions: ['postWrite']
	});

	if (result != null)
		return result;

	const userId = request.user.document._id;
	const text = request.body.text;

	if (/^\s*$/.test(text) || /^.{1,256}$/.test(text) == false)
		return new ApiResult(400, 'text is invalid format.');

	let postStatus;
	try {
		postStatus = await request.db.posts.createAsync({ // TODO: move to document models
			type: 'status',
			userId: userId,
			text: text
		});
	}
	catch(err) {
		console.log(err.trace);
	}

	if (postStatus == null)
		return new ApiResult(500, 'faild to create postStatus');

	return new ApiResult(200, {postStatus: postStatus.serialize()});
};
