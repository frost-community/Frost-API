const ApiContext = require('../../../modules/ApiContext');
// const $ = require('cafy').default;

/** @param {ApiContext} apiContext */
exports.get = async (apiContext) => {
	await apiContext.proceed({
		permissions: ['applicationSpecial']
	});
	if (apiContext.responsed) return;

	const application = await Application.findByIdAsync(apiContext.params.id, apiContext.db, apiContext.config);

	if (application == null) {
		return apiContext.response(404, 'application as premise not found');
	}

	// 対象アプリケーションの所有者かどうか
	if (!application.document.creatorId.equals(apiContext.user.document._id)) {
		return apiContext.response(403, 'this operation is not permitted');
	}

	if (application.document.keyCode == null) {
		return apiContext.response(400, 'applicationKey has not been generated yet');
	}

	const key = application.getApplicationKey();

	apiContext.response(200, { applicationKey: key });
};

/** @param {ApiContext} apiContext */
exports.post = async (apiContext) => {
	await apiContext.proceed({
		body: {},
		permissions: ['applicationSpecial']
	});
	if (apiContext.responsed) return;

	const application = await Application.findByIdAsync(apiContext.params.id, apiContext.db, apiContext.config);

	if (application == null) {
		return apiContext.response(404, 'application as premise not found');
	}

	// 対象アプリケーションの所有者かどうか
	if (!application.document.creatorId.equals(apiContext.user.document._id)) {
		return apiContext.response(403, 'this operation is not permitted');
	}

	const key = await application.generateApplicationKeyAsync();

	apiContext.response(200, { applicationKey: key });
};
