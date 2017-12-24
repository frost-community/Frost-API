const Application = require('../../../documentModels/application');
// const $ = require('cafy').default;
const { ApiError } = require('../../../helpers/errors');

exports.get = async (apiContext) => {
	await apiContext.check({
		permissions: ['applicationSpecial']
	});

	const application = await Application.findByIdAsync(apiContext.params.id, apiContext.db, apiContext.config);

	if (application == null) {
		throw new ApiError(404, 'application as premise not found');
	}

	// 対象アプリケーションの所有者かどうか
	if (!application.document.creatorId.equals(apiContext.user.document._id)) {
		throw new ApiError(403, 'this operation is not permitted');
	}

	if (application.document.keyCode == null) {
		throw new ApiError(400, 'applicationKey has not been generated yet');
	}

	const key = application.getApplicationKey();

	apiContext.response(200, { applicationKey: key });
};

exports.post = async (apiContext) => {
	await apiContext.check({
		body: {},
		permissions: ['applicationSpecial']
	});

	const application = await Application.findByIdAsync(apiContext.params.id, apiContext.db, apiContext.config);

	if (application == null) {
		throw new ApiError(404, 'application as premise not found');
	}

	// 対象アプリケーションの所有者かどうか
	if (!application.document.creatorId.equals(apiContext.user.document._id)) {
		throw new ApiError(403, 'this operation is not permitted');
	}

	const key = await application.generateApplicationKeyAsync();

	apiContext.response(200, { applicationKey: key });
};
