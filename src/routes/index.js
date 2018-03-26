const ApiContext = require('../modules/ApiContext');

/** @param {ApiContext} apiContext */
exports.get = async (apiContext) => {
	await apiContext.proceed({
		scopes: []
	});
	if (apiContext.responsed) return;

	apiContext.response(200, 'Frost API Server');
};
