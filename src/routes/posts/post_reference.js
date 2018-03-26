const ApiContext = require('../../modules/ApiContext');
// const $ = require('cafy').default;

/** @param {ApiContext} apiContext */
exports.post = async (apiContext) => {
	await apiContext.proceed({
		body: {},
		scopes: ['post.write']
	});
	if (apiContext.responsed) return;

	apiContext.response(501, 'not implemented yet');
};
