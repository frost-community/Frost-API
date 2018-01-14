const ApiContext = require('../../modules/ApiContext');
const { StreamPublisher } = require('../../modules/stream');
const $ = require('cafy').default;

/** @param {ApiContext} apiContext */
exports.post = async (apiContext) => {
	await apiContext.proceed({
		body: {
			text: { cafy: $().string() }
		},
		permissions: ['postWrite']
	});
	if (apiContext.responsed) return;

	const userId = apiContext.user._id;
	const text = apiContext.body.text;

	if (/^\s*$/.test(text) || /^[\s\S]{1,256}$/.test(text) == false) {
		apiContext.response(400, 'text is invalid format.');
		return;
	}

	let postStatus = await apiContext.postsService.createStatusPost(userId, text);
	if (postStatus == null) {
		apiContext.response(500, 'failed to create postStatus');
		return;
	}

	const serializedPostStatus = await apiContext.postsService.serialize(postStatus, true);

	// 各種ストリームに発行
	const publisher = new StreamPublisher();
	publisher.publish('user-timeline-status', apiContext.user._id.toString(), serializedPostStatus);
	publisher.publish('general-timeline-status', 'general', serializedPostStatus);
	await publisher.quitAsync();

	apiContext.response(200, { postStatus: serializedPostStatus });
};
