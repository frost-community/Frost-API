const ApiContext = require('../modules/ApiContext');
const getVersion = require('../modules/getVersion');

/** @param {ApiContext} apiContext */
exports.get = async (apiContext) => {
	await apiContext.proceed({
		scopes: []
	});
	if (apiContext.responsed) return;

	apiContext.response(200, {
		message: 'Frost API Server',
		version: getVersion().version
	});
};
