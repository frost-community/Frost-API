const Post = require('../../documentModels/post');
// const $ = require('cafy').default;

exports.get = async (apiContext) => {
	await apiContext.proceed({
		query: {},
		permissions: ['postRead']
	});
	if (apiContext.responsed) return;

	const post = await Post.findByIdAsync(apiContext.params.id, apiContext.db, apiContext.config);

	if (post == null) {
		apiContext.response(204);
		return;
	}

	apiContext.response(200, { post: post.serialize() });
};
