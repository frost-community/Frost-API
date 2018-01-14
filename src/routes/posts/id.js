const ApiContext = require('../../modules/ApiContext');
// const $ = require('cafy').default;

/** @param {ApiContext} apiContext */
exports.get = async (apiContext) => {
	await apiContext.proceed({
		query: {},
		permissions: ['postRead']
	});
	if (apiContext.responsed) return;

	const post = await apiContext.repository.findById('posts', apiContext.params.id);
	if (post == null) {
		apiContext.response(204);
		return;
	}

	apiContext.response(200, { post: await apiContext.postsService.serialize(post, true) });
};
