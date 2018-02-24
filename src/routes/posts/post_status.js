const ApiContext = require('../../modules/ApiContext');
const { StreamPublisher } = require('../../modules/stream');
const $ = require('cafy').default;
const MongoAdapter = require('../../modules/MongoAdapter');

/** @param {ApiContext} apiContext */
exports.post = async (apiContext) => {
	await apiContext.proceed({
		body: {
			text: { cafy: $().string().range(1, 256).pipe(i => !/^\s*$/.test(i)) },
			attachments: { cafy: $().array('string').unique().max(4).each(i => MongoAdapter.validateId(i)), default: [] }
		},
		permissions: ['postWrite']
	});
	if (apiContext.responsed) return;

	const userId = apiContext.user._id;
	const text = apiContext.body.text;
	const attachmentIds = apiContext.body.attachments.map(i => MongoAdapter.buildId(i));

	// check existing files
	const fileCount = await apiContext.repository.count('storageFiles', { _id: { $in: attachmentIds } });
	if (fileCount != attachmentIds.length) {
		apiContext.response(400, 'some attachmentIds are invalid value');
		return;
	}

	let postStatus = await apiContext.postsService.createStatusPost(userId, text, attachmentIds);
	if (postStatus == null) {
		apiContext.response(500, 'failed to create postStatus');
		return;
	}

	const serializedPostStatus = await apiContext.postsService.serialize(postStatus, true);

	// 各種ストリームに発行
	const publisher = new StreamPublisher();
	publisher.publish('user-timeline-status', apiContext.user._id.toString(), serializedPostStatus);
	publisher.publish('general-timeline-status', 'general', serializedPostStatus);
	await publisher.quit();

	apiContext.response(200, { postStatus: serializedPostStatus });
};
