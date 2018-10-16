const ApiContext = require('../../modules/ApiContext');
const EventIdHelper = require('../../modules/helpers/EventIdHelper');
const { RedisEventSender } = require('../../modules/redisEvent');
const $ = require('cafy').default;
const MongoAdapter = require('../../modules/MongoAdapter');

/** @param {ApiContext} apiContext */
exports.post = async (apiContext) => {
	await apiContext.proceed({
		body: {
			text: { cafy: $().string().range(1, 256).pipe(i => !/^\s*$/.test(i)) },
			attachments: { cafy: $().array($().string()).unique().max(4).each(i => MongoAdapter.validateId(i)), default: [] }
		},
		scopes: ['post.write']
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

	// event.posting.chat を発行
	const eventSender = new RedisEventSender('frost-api');
	await eventSender.publish(EventIdHelper.buildEventId(['event', 'posting', 'chat']), {
		posting: postStatus
	});
	await eventSender.dispose();

	apiContext.response(200, { postStatus: serializedPostStatus });
};
