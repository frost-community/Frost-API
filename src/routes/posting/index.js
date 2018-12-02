const ApiContext = require('../../modules/ApiContext');
const DataTypeIdHelper = require('../../modules/helpers/DataTypeIdHelper');
const DomainEventEmitter = require('../../modules/RedisEventEmitter');
const $ = require('cafy').default;
const MongoAdapter = require('../../modules/MongoAdapter');
const { getStringSize } = require('../../modules/helpers/GeneralHelper');

/** @param {ApiContext} apiContext */
exports.get = async (apiContext) => {
	await apiContext.proceed({
		params: {
			postingId: { cafy: $().string().pipe(i => MongoAdapter.validateId(i)) }
		},
		scopes: ['post.read']
	});
	if (apiContext.responsed) return;

	const postingId = await apiContext.repository.findById('posts', apiContext.params.postingId);
	if (postingId == null) {
		apiContext.response(404, 'posting not found');
		return;
	}

	apiContext.response(200, { posting: await apiContext.postsService.serialize(postingId, true) });
};

/** @param {ApiContext} apiContext */
exports['create-chat'] = async (apiContext) => {
	await apiContext.proceed({
		params: {
			text: { cafy: $().string().range(1, 256).pipe(i => !/^\s*$/.test(i)) },
			attachments: { cafy: $().array($().string()).unique().max(4).each(i => MongoAdapter.validateId(i)), default: [] }
		},
		scopes: ['post.write']
	});
	if (apiContext.responsed) return;

	const userId = apiContext.user._id;
	const text = apiContext.params.text;
	const attachmentIds = apiContext.params.attachments.map(i => MongoAdapter.buildId(i));

	// check existing files
	const fileCount = await apiContext.repository.count('storageFiles', { _id: { $in: attachmentIds } });
	if (fileCount != attachmentIds.length) {
		apiContext.response(400, 'some attachmentIds are invalid value');
		return;
	}

	let postingChat = await apiContext.postsService.createStatusPost(userId, text, attachmentIds);
	if (postingChat == null) {
		apiContext.response(500, 'failed to create postingChat');
		return;
	}

	const serialized = await apiContext.postsService.serialize(postingChat, true);

	// DomainEvent posting.chat を発行
	const eventSender = new DomainEventEmitter('frost-api', false);
	await eventSender.emit(DataTypeIdHelper.build(['redis', 'posting', 'chat']), {
		posting: serialized
	});
	await eventSender.dispose();

	apiContext.response(200, { posting: serialized });
};

/** @param {ApiContext} apiContext */
exports['create-article'] = async (apiContext) => {
	return apiContext.response(501, 'not implemented yet');
/*
	await apiContext.proceed({
		params: {
			title: { cafy: $().string() },
			text: { cafy: $().string() }
		},
		scopes: ['post.write']
	});
	if (apiContext.responsed) return;

	const { title, text } = apiContext.params;

	if (/^\s*$/.test(title) || getStringSize(text) > 64) {
		apiContext.response(400, 'title is invalid format. max 64bytes');
		return;
	}

	if (/^\s*$/.test(text) || getStringSize(text) > 10000) {
		apiContext.response(400, 'text is invalid format. max 10,000bytes');
		return;
	}

	const postingArticle = await apiContext.postsService.createArticlePost(apiContext.user._id, text, title);
	if (postingArticle == null) {
		apiContext.response(500, 'failed to create postingArticle');
		return;
	}

	apiContext.response(200, { posting: await apiContext.postsService.serialize(postingArticle, true) });
*/
};

/** @param {ApiContext} apiContext */
exports['create-reference'] = async (apiContext) => {
	return apiContext.response(501, 'not implemented yet');
/*
	await apiContext.proceed({
		params: { },
		scopes: ['post.write']
	});
	if (apiContext.responsed) return;
*/
};
