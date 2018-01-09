const ApiContext = require('../../modules/ApiContext');
// const $ = require('cafy').default;

/** @param {ApiContext} apiContext */
exports.post = async (apiContext) => {
	await apiContext.proceed({
		body: {},
		permissions: ['postWrite']
	});
	if (apiContext.responsed) return;

	return apiContext.response(501, 'not implemented yet');
};
