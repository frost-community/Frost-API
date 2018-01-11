const ApiContext = require('../../modules/ApiContext');
const { getStringSize } = require('../../modules/helpers/GeneralHelper');
const $ = require('cafy').default;

/** @param {ApiContext} apiContext */
exports.post = async (apiContext) => {
	await apiContext.proceed({
		body: {
			title: { cafy: $().string() },
			text: { cafy: $().string() }
		},
		permissions: ['postWrite']
	});
	if (apiContext.responsed) return;

	const { title, text } = apiContext.body;

	if (/^\s*$/.test(title) || getStringSize(text) > 64) {
		return apiContext.response(400, 'title is invalid format. max 64bytes');
	}

	if (/^\s*$/.test(text) || getStringSize(text) > 10000) {
		return apiContext.response(400, 'text is invalid format. max 10,000bytes');
	}

	const postArticle = await apiContext.postsService.createArticlePost(apiContext.user._id, text, title);
	if (postArticle == null) {
		return apiContext.response(500, 'failed to create postArticle');
	}

	apiContext.response(200, { postArticle: await apiContext.postsService.serialize(postArticle, true) });
};
