'use strict';

const ApiResult = require('../../helpers/apiResult');
const { StreamPublisher } = require('../../helpers/stream');

exports.post = async (request) => {
	const result = await request.checkRequestAsync({
		body: [
			{name: 'text', type: 'string'}
		],
		permissions: ['postWrite']
	});

	if (result != null) {
		return result;
	}

	const userId = request.user.document._id;
	const text = request.body.text;

	if (/^\s*$/.test(text) || /^[\s\S]{1,256}$/.test(text) == false) {
		return new ApiResult(400, 'text is invalid format.');
	}

	let postStatus;

	try {
		postStatus = await request.db.posts.createAsync({ // TODO: move to document models
			type: 'status',
			userId: userId,
			text: text
		});
	}
	catch(err) {
		console.log(err);
	}

	if (postStatus == null) {
		return new ApiResult(500, 'failed to create postStatus');
	}

	const serializedPostStatus = await postStatus.serializeAsync(true);

	const publisher = new StreamPublisher();
	publisher.publish('home-timeline-status', request.user.document._id.toString(), serializedPostStatus);
	publisher.publish('general-timeline-status', 'general', serializedPostStatus);
	await publisher.quitAsync();

	return new ApiResult(200, {postStatus: serializedPostStatus});
};
