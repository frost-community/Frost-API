const ApiContext = require('../../../modules/ApiContext');
const mongo = require('mongodb');
// const $ = require('cafy').default;

/** @param {ApiContext} apiContext */
exports.get = async (apiContext) => {
	await apiContext.proceed({
		permissions: ['application']
	});
	if (apiContext.responsed) return;

	let applicationId;
	try {
		applicationId = mongo.ObjectId(apiContext.params.id);
	}
	catch (err) {
		// noop
	}

	let application;
	if (applicationId) {
		try {
			application = await Application.findByIdAsync(applicationId, apiContext.db, apiContext.config);
		}
		catch (err) {
			console.log(err);
		}
	}

	if (application == null) {
		apiContext.response(204);
		return;
	}

	apiContext.response(200, { application: application.serialize() });
};
