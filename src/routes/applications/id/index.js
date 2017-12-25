const Application = require('../../../documentModels/application');
const mongo = require('mongodb');
// const $ = require('cafy').default;

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

	// 対象アプリケーションの所有者かどうか
	if (!application.document.creatorId.equals(apiContext.user.document._id)) {
		return apiContext.response(403, 'this operation is not permitted');
	}

	apiContext.response(200, { application: application.serialize() });
};
