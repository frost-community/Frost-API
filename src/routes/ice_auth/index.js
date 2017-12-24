const Application = require('../../documentModels/application');
const $ = require('cafy').default;
const { ApiError } = require('../../helpers/errors');

exports.post = async (apiContext) => {
	await apiContext.check({
		body: {
			applicationKey: { cafy: $().string() }
		}
	});

	const applicationKey = apiContext.body.applicationKey;

	if (!await Application.verifyKeyAsync(applicationKey, apiContext.db, apiContext.config)) {
		throw new ApiError(400, 'applicationKey is invalid');
	}

	const applicationId = Application.splitKey(applicationKey, apiContext.db, apiContext.config).applicationId;

	let authorizeRequest;
	try {
		authorizeRequest = await apiContext.db.authorizeRequests.createAsync({ // TODO: move to document models
			applicationId: applicationId
		});
	}
	catch (err) {
		console.log(err);
	}

	if (authorizeRequest == null) {
		throw new ApiError(500, 'failed to create authorizeRequest');
	}

	const iceAuthKey = await authorizeRequest.generateIceAuthKeyAsync();
	await authorizeRequest.generateVerificationCodeAsync();

	apiContext.response(200, { iceAuthKey: iceAuthKey });
};
