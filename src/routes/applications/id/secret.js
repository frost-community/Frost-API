const ApiContext = require('../../../modules/ApiContext');
// const $ = require('cafy').default;

/** @param {ApiContext} apiContext */
exports.get = async (apiContext) => {
	await apiContext.proceed({
		scopes: ['app.host']
	});
	if (apiContext.responsed) return;

	const application = await apiContext.repository.findById('applications', apiContext.params.id);
	if (application == null) {
		apiContext.response(404, 'application as premise not found');
		return;
	}

	if (!apiContext.applicationsService.existApplicationSecret(application)) {
		apiContext.response(400, 'application secret has not been generated yet');
		return;
	}

	const secret = apiContext.applicationsService.getApplicationSecret(application);

	apiContext.response(200, { secret });
};

/** @param {ApiContext} apiContext */
exports.post = async (apiContext) => {
	await apiContext.proceed({
		body: {},
		scopes: ['app.host']
	});
	if (apiContext.responsed) return;

	const application = await apiContext.repository.findById('applications', apiContext.params.id);
	if (application == null) {
		apiContext.response(404, 'application as premise not found');
		return;
	}

	const secret = await apiContext.applicationsService.generateApplicationSecret(application);

	apiContext.response(200, { secret });
};
