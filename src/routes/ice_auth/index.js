'use strict';

const ApiResult = require('../../helpers/apiResult');
const Application = require('../../documentModels/application');

exports.post = async (request) => {
	const result = await request.checkRequestAsync({
		body: [
			{name: 'applicationKey', type: 'string'}
		]
	});

	if (result != null) {
		return result;
	}

	const applicationKey = request.body.applicationKey;

	if (!await Application.verifyKeyAsync(applicationKey, request.db, request.config)) {
		return new ApiResult(400, 'applicationKey is invalid');
	}

	const applicationId = Application.splitKey(applicationKey, request.db, request.config).applicationId;

	let authorizeRequest;

	try {
		authorizeRequest = await request.db.authorizeRequests.createAsync({ // TODO: move to document models
			applicationId: applicationId
		});
	}
	catch(err) {
		console.log(err.stack);
	}

	if (authorizeRequest == null) {
		return new ApiResult(500, 'faild to create authorizeRequest');
	}

	const iceAuthKey = await authorizeRequest.generateIceAuthKeyAsync();
	await authorizeRequest.generateVerificationCodeAsync();

	return new ApiResult(200, {iceAuthKey: iceAuthKey});
};
