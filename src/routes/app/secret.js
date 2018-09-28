const ApiContext = require('../../modules/ApiContext');
const MongoAdapter = require('../../modules/MongoAdapter');
const $ = require('cafy').default;

/** @param {ApiContext} apiContext */
exports.show = async (apiContext) => {
	await apiContext.proceed({
		body: {
			applicationId: { cafy: $().string().pipe(i => MongoAdapter.validateId(i)) }
		},
		scopes: ['app.host']
	});
	if (apiContext.responsed) return;

	const application = await apiContext.repository.findById('applications', apiContext.body.applicationId);
	if (application == null) {
		apiContext.response(404, 'application as premise not found');
		return;
	}

	if (!apiContext.applicationsService.existApplicationSecret(application)) {
		apiContext.response(404, 'application secret has not been generated yet');
		return;
	}

	const secret = apiContext.applicationsService.getApplicationSecret(application);

	apiContext.response(200, { secret });
};

/** @param {ApiContext} apiContext */
exports.create = async (apiContext) => {
	await apiContext.proceed({
		body: {
			applicationId: { cafy: $().string().pipe(i => MongoAdapter.validateId(i)) }
		},
		scopes: ['app.host']
	});
	if (apiContext.responsed) return;

	const application = await apiContext.repository.findById('applications', apiContext.body.applicationId);
	if (application == null) {
		apiContext.response(404, 'application as premise not found');
		return;
	}

	if (application.root) {
		apiContext.response(400, 'cannot generate applicationSecret for root application in api');
		return;
	}

	const secret = await apiContext.applicationsService.generateApplicationSecret(application);

	apiContext.response(200, { secret });
};
