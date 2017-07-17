'use strict';

const ApiResult = require('../../../helpers/apiResult');
const Application = require('../../../documentModels/application');

exports.get = async (request) => {
	const result = await request.checkRequestAsync({
		permissions: ['applicationSpecial']
	});

	if (result != null) {
		return result;
	}

	const application = await Application.findByIdAsync(request.params.id, request.db, request.config);

	if (application == null) {
		return new ApiResult(404, 'application as premise not found');
	}

	// 対象アプリケーションの所有者かどうか
	if (application.document.creatorId.toString() !== request.user.document._id.toString()) {
		return new ApiResult(403, 'you do not own this application');
	}

	if (application.document.keyCode == null) {
		return new ApiResult(400, 'applicationKey has not been generated yet');
	}

	const key = application.getApplicationKey();

	return new ApiResult(200, {applicationKey: key});
};

exports.post = async (request) => {
	try {
		await request.checkRequestAsync({
			body: [],
			permissions: ['applicationSpecial']
		});
	}
	catch(e) {
		if (e instanceof Error) {
			throw e;
		}
		else {
			return e;
		}
	}

	const application = await Application.findByIdAsync(request.params.id, request.db, request.config);

	if (application == null) {
		return new ApiResult(404, 'application as premise not found');
	}

	// 対象アプリケーションの所有者かどうか
	if (application.document.creatorId.toString() !== request.user.document._id.toString()) {
		return new ApiResult(403, 'you do not own this application');
	}

	const key = await application.generateApplicationKeyAsync();

	return new ApiResult(200, {applicationKey: key});
};
