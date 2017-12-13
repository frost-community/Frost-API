const { StreamPublisher } = require('../../helpers/stream');
const $ = require('cafy').default;
const { ApiError } = require('../../helpers/errors');

exports.post = async (apiContext) => {
	await apiContext.check({
		body: {
			text: { cafy: $().string() }
		},
		permissions: ['postWrite']
	});

	const userId = apiContext.user.document._id;
	const text = apiContext.body.text;

	if (/^\s*$/.test(text) || /^[\s\S]{1,256}$/.test(text) == false) {
		throw new ApiError(400, 'text is invalid format.');
	}

	let postStatus;

	try {
		postStatus = await apiContext.db.posts.createAsync({ // TODO: move to document models
			type: 'status',
			userId: userId,
			text: text
		});
	}
	catch(err) {
		console.log(err);
	}

	if (postStatus == null) {
		throw new ApiError(500, 'failed to create postStatus');
	}

	const serializedPostStatus = await postStatus.serializeAsync(true);

	const publisher = new StreamPublisher();
	publisher.publish('home-timeline-status', apiContext.user.document._id.toString(), serializedPostStatus);
	publisher.publish('general-timeline-status', 'general', serializedPostStatus);
	await publisher.quitAsync();

	apiContext.response(200, {postStatus: serializedPostStatus});
};
