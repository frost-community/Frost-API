const ApiContext = require('../../../modules/ApiContext');
// const $ = require('cafy').default;

/** @param {ApiContext} apiContext */
exports.get = async (apiContext) => {
	await apiContext.proceed({
		permissions: ['applicationSpecial']
	});
	if (apiContext.responsed) return;

	const { getApplicationKey } = apiContext.applicationsService;

	const application = await apiContext.repository.findById('applications', apiContext.params.id);
	if (application == null) {
		return apiContext.response(404, 'application as premise not found');
	}

	// 対象アプリケーションの所有者かどうか
	if (!application.creatorId.equals(apiContext.user._id)) {
		return apiContext.response(403, 'this operation is not permitted');
	}

	if (application.keyCode == null) {
		return apiContext.response(400, 'applicationKey has not been generated yet');
	}

	const applicationKey = getApplicationKey(application);

	apiContext.response(200, { applicationKey });
};

/** @param {ApiContext} apiContext */
exports.post = async (apiContext) => {
	await apiContext.proceed({
		body: {},
		permissions: ['applicationSpecial']
	});
	if (apiContext.responsed) return;

	const { generateApplicationKey } = apiContext.applicationsService;

	const application = await apiContext.repository.findById('applications', apiContext.params.id);
	if (application == null) {
		return apiContext.response(404, 'application as premise not found');
	}

	// 対象アプリケーションの所有者かどうか
	if (!application.creatorId.equals(apiContext.user._id)) {
		return apiContext.response(403, 'this operation is not permitted');
	}

	const applicationKey = generateApplicationKey(application);

	apiContext.response(200, { applicationKey });
};
