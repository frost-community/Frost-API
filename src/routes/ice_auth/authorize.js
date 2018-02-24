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

	if (!await apiContext.authorizeRequestsService.verifyIceAuthKey(iceAuthKey)) {
		apiContext.response(400, 'x-ice-auth-key header is invalid');
		return;
	}

	const { authorizeRequestId } = apiContext.authorizeRequestsService.splitIceAuthKey(iceAuthKey);
	const document = await apiContext.repository.findById('authorizeRequests', authorizeRequestId);
	await apiContext.repository.removeById('authorizeRequests', authorizeRequestId);

	if (document.targetUserId == null) {
		apiContext.response(400, 'authorization has not been done yet');
		return;
	}

	if (verificationCode !== document.verificationCode) {
		apiContext.response(400, 'verificationCode is invalid');
		return;
	}

	// TODO: refactoring(duplication)

	let applicationAccess = await apiContext.repository.find('applicationAccesses', {
		applicationId: document.applicationId,
		userId: document.targetUserId
	});

	let accessKey;

	// まだapplicationAccessが生成されていない時
	if (applicationAccess == null) {
		applicationAccess = await apiContext.applicationAccessesService.create(document.applicationId, document.targetUserId);
		if (applicationAccess == null) {
			apiContext.response(500, 'failed to create applicationAccess');
			return;
		}

		try {
			accessKey = await apiContext.applicationAccessesService.generateAccessKey(applicationAccess);
		}
		catch (err) {
			console.log(err);
		}

		if (accessKey == null) {
			apiContext.response(500, 'failed to generate accessKey');
			return;
		}
	}
	// 既にapplicationAccessが生成済みの時
	else {
		try {
			accessKey = apiContext.applicationAccessesService.getAccessKey(applicationAccess);
		}
		catch (err) {
			console.log(err);
		}

		if (accessKey == null) {
			apiContext.response(500, 'failed to get accessKey');
			return;
		}
	}

	apiContext.response(200, { accessKey });
};
