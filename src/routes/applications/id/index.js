const ApiContext = require('../../../modules/ApiContext');
// const $ = require('cafy').default;

/** @param {ApiContext} apiContext */
exports.get = async (apiContext) => {
	await apiContext.proceed({
		scopes: ['app.read']
	});
	if (apiContext.responsed) return;

	let application;
	try {
		application = await apiContext.repository.findById('applications', apiContext.params.id);
	}
	catch (err) {
		console.log(err);
	}

	if (application == null) {
		apiContext.response(404, 'application not found');
		return;
	}

	apiContext.response(200, { application: apiContext.applicationsService.serialize(application) });
};
