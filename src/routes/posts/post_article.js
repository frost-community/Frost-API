const stringSize = require('../../modules/stringSize');
const $ = require('cafy').default;

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

	if (/^\s*$/.test(title) || stringSize(text) > 64) {
		return apiContext.response(400, 'title is invalid format. max 64bytes');
	}

	if (/^\s*$/.test(text) || stringSize(text) > 10000) {
		return apiContext.response(400, 'text is invalid format. max 10,000bytes');
	}

	let postArticle;

	try {
		postArticle = await apiContext.db.posts.createAsync({ // TODO: move to document models
			type: 'article',
			userId: apiContext.user.document._id,
			title: title,
			text: text
		});
	}
	catch (err) {
		console.log(err);
	}

	if (postArticle == null) {
		return apiContext.response(500, 'failed to create postArticle');
	}

	apiContext.response(200, { postArticle: await postArticle.serializeAsync(true) });
};
