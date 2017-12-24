const Application = require('../../../documentModels/application');
const mongo = require('mongodb');
// const $ = require('cafy').default;
const { ApiError } = require('../../../helpers/errors');

exports.get = async (apiContext) => {
	await apiContext.check({
		permissions: ['application']
	});

	let application;
	try {
		const applicationId = mongo.ObjectId(apiContext.params.id);
		application = await Application.findByIdAsync(applicationId, apiContext.db, apiContext.config);
	}
	catch (err) {
		console.log(err);
	}

	if (application == null) {
		apiContext.response(204);
		return;
	}

	// 対象アプリケーションの所有者かどうか
	if (!application.document.creatorId.equals(apiContext.user.document._id)) {
		throw new ApiError(403, 'this operation is not permitted');
	}

	apiContext.response(200, { application: application.serialize() });
};
