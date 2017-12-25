// const $ = require('cafy').default;

exports.post = async (apiContext) => {
	await apiContext.proceed({
		body: {},
		permissions: ['postWrite']
	});
	if (apiContext.responsed) return;

	return apiContext.response(501, 'not implemented yet');
};
