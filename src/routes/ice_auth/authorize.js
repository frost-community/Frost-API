const AuthorizeRequest = require('../../documentModels/authorizeRequest');
const $ = require('cafy').default;
const { ApiError } = require('../../helpers/errors');

exports.post = async (apiContext) => {
	await apiContext.check({
		body: {
			verificationCode: { cafy: $().string() }
		},
		headers: ['x-ice-auth-key']
	});

	const iceAuthKey = apiContext.headers['x-ice-auth-key'];
	const verificationCode = apiContext.body.verificationCode;

	if (!await AuthorizeRequest.verifyKeyAsync(iceAuthKey, apiContext.db, apiContext.config)) {
		throw new ApiError(400, 'x-ice-auth-key header is invalid');
	}

	const authorizeRequestId = AuthorizeRequest.splitKey(iceAuthKey, apiContext.db, apiContext.config).authorizeRequestId;
	const authorizeRequest = await AuthorizeRequest.findByIdAsync(authorizeRequestId, apiContext.db, apiContext.config);
	const document = authorizeRequest.document;
	await authorizeRequest.removeAsync();

	if (document.targetUserId == null) {
		throw new ApiError(400, 'authorization has not been done yet');
	}

	if (verificationCode !== document.verificationCode) {
		throw new ApiError(400, 'verificationCode is invalid');
	}

	// TODO: refactoring(duplication)

	let applicationAccess = await apiContext.db.applicationAccesses.findAsync({
		applicationId: document.applicationId,
		userId: document.targetUserId
	});

	let accessKey;

	if (applicationAccess == null) {
		try {
			applicationAccess = await apiContext.db.applicationAccesses.createAsync({ // TODO: move to document models
				applicationId: document.applicationId,
				userId: document.targetUserId,
				keyCode: null
			});
		}
		catch (err) {
			console.log(err);
		}

		if (applicationAccess == null) {
			throw new ApiError(500, 'failed to create applicationAccess');
		}

		try {
			accessKey = await applicationAccess.generateAccessKeyAsync();
		}
		catch (err) {
			console.log(err);
		}

		if (accessKey == null) {
			throw new ApiError(500, 'failed to generate accessKey');
		}
	}
	else {
		try {
			accessKey = applicationAccess.getAccessKey();
		}
		catch (err) {
			console.log(err);
		}

		if (accessKey == null) {
			throw new ApiError(500, 'failed to build accessKey');
		}
	}

	apiContext.response(200, { accessKey: accessKey });
};
