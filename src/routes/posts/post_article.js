'use strict';

const ApiResult = require('../../helpers/apiResult');
const stringSize = require('../../helpers/stringSize');

exports.post = async (request) => {
	const result = await request.checkRequestAsync({
		body: [
			{name: 'title', type: 'string'},
			{name: 'text', type: 'string'}
		],
		permissions: ['postWrite']
	});

	if (result != null)
		return result;

	const userId = request.user.document._id;
	const title = request.body.title;
	const text = request.body.text;

	if (/^\s*$/.test(title) || stringSize(text) > 64)
		return new ApiResult(400, 'title is invalid format. max 64bytes');

	if (/^\s*$/.test(text) || stringSize(text) > 10000)
		return new ApiResult(400, 'text is invalid format. max 10,000bytes');

	let postArticle;
	try {
		postArticle = await request.db.posts.createAsync({ // TODO: move to document models
			type: 'article',
			userId: userId,
			title: title,
			text: text
		});
	}
	catch(err) {
		console.log(err.trace);
	}

	if (postArticle == null)
		return new ApiResult(500, 'faild to create postArticle');

	return new ApiResult(200, {postArticle: postArticle.serialize()});
};
