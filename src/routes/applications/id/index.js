const ApiContext = require('../../../modules/ApiContext');
const StoreAdapter = require('../../../modules/MongoAdapter');
// const $ = require('cafy').default;

/** @param {ApiContext} apiContext */
exports.get = async (apiContext) => {
	await apiContext.proceed({
		permissions: ['application']
	});
	if (apiContext.responsed) return;

	const { serialize } = apiContext.applicationsService;

	let applicationId;
	try {
		applicationId = StoreAdapter.buildId(apiContext.params.id);
	}
	catch (err) {
		// ignore
	}

	let application;
	if (applicationId) {
		try {
			application = await apiContext.repository.findById('applications', applicationId);
		}
		catch (err) {
			console.log(err);
		}
	}

	if (application == null) {
		apiContext.response(204);
		return;
	}

	apiContext.response(200, { application: serialize(application) });
};
