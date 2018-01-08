const { StreamPublisher } = require('../../modules/stream');
const $ = require('cafy').default;

exports.post = async (apiContext) => {
	await apiContext.proceed({
		body: {
			text: { cafy: $().string() }
		},
		permissions: ['postWrite']
	});
	if (apiContext.responsed) return;

	const userId = apiContext.user.document._id;
	const text = apiContext.body.text;

	if (/^\s*$/.test(text) || /^[\s\S]{1,256}$/.test(text) == false) {
		return apiContext.response(400, 'text is invalid format.');
	}

	let postStatus;

	try {
		postStatus = await apiContext.db.posts.createAsync({ // TODO: move to document models
			type: 'status',
			userId: userId,
			text: text
		});
	}
	catch (err) {
		console.log(err);
	}

	if (postStatus == null) {
		return apiContext.response(500, 'failed to create postStatus');
	}

	const serializedPostStatus = await postStatus.serializeAsync(true);

	const publisher = new StreamPublisher();
	publisher.publish('user-timeline-status', apiContext.user.document._id.toString(), serializedPostStatus);
	publisher.publish('general-timeline-status', 'general', serializedPostStatus);
	await publisher.quitAsync();

	apiContext.response(200, { postStatus: serializedPostStatus });
};
