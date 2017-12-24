const stringSize = require('../../helpers/stringSize');
const $ = require('cafy').default;
const { ApiError } = require('../../helpers/errors');

exports.post = async (apiContext) => {
	await apiContext.check({
		body: {
			title: { cafy: $().string() },
			text: { cafy: $().string() }
		},
		permissions: ['postWrite']
	});

	const { title, text } = apiContext.body;

	if (/^\s*$/.test(title) || stringSize(text) > 64) {
		throw new ApiError(400, 'title is invalid format. max 64bytes');
	}

	if (/^\s*$/.test(text) || stringSize(text) > 10000) {
		throw new ApiError(400, 'text is invalid format. max 10,000bytes');
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
		throw new ApiError(500, 'failed to create postArticle');
	}

	apiContext.response(200, { postArticle: postArticle.serialize() });
};
