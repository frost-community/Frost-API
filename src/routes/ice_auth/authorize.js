const ApiContext = require('../../modules/ApiContext');
const $ = require('cafy').default;

/** @param {ApiContext} apiContext */
exports.post = async (apiContext) => {
	await apiContext.proceed({
		body: {
			verificationCode: { cafy: $().string() }
		},
		headers: ['x-ice-auth-key']
	});
	if (apiContext.responsed) return;

	const iceAuthKey = apiContext.headers['x-ice-auth-key'];
	const verificationCode = apiContext.body.verificationCode;

	const { create, generateAccessKey, getAccessKey } = apiContext.applicationAccessesService;
	const { verifyIceAuthKey, splitIceAuthKey } = apiContext.authorizeRequestsService;

	if (!await verifyIceAuthKey(iceAuthKey)) {
		return apiContext.response(400, 'x-ice-auth-key header is invalid');
	}

	const { authorizeRequestId } = splitIceAuthKey(iceAuthKey);
	const document = await apiContext.repository.findById('authorizeRequests', authorizeRequestId);
	await apiContext.repository.removeById('authorizeRequests', authorizeRequestId);

	if (document.targetUserId == null) {
		return apiContext.response(400, 'authorization has not been done yet');
	}

	if (verificationCode !== document.verificationCode) {
		return apiContext.response(400, 'verificationCode is invalid');
	}

	// TODO: refactoring(duplication)

	let applicationAccess = await apiContext.repository.find('applicationAccesses', {
		applicationId: document.applicationId,
		userId: document.targetUserId
	});

	let accessKey;

	// まだapplicationAccessが生成されていない時
	if (applicationAccess == null) {
		applicationAccess = await create(document.applicationId, document.targetUserId);
		if (applicationAccess == null) {
			return apiContext.response(500, 'failed to create applicationAccess');
		}

		try {
			accessKey = await generateAccessKey(applicationAccess);
		}
		catch (err) {
			console.log(err);
		}

		if (accessKey == null) {
			return apiContext.response(500, 'failed to generate accessKey');
		}
	}
	// 既にapplicationAccessが生成済みの時
	else {
		try {
			accessKey = getAccessKey(applicationAccess);
		}
		catch (err) {
			console.log(err);
		}

		if (accessKey == null) {
			return apiContext.response(500, 'failed to get accessKey');
		}
	}

	apiContext.response(200, { accessKey });
};
