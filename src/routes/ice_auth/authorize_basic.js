const ApiContext = require('../../modules/ApiContext');
const $ = require('cafy').default;

/** @param {ApiContext} apiContext */
exports.post = async (apiContext) => {
	await apiContext.proceed({
		body: {
			screenName: { cafy: $().string() },
			password: { cafy: $().string() }
		},
		headers: ['x-ice-auth-key'],
		permissions: ['iceAuthHost']
	});
	if (apiContext.responsed) return;

	const iceAuthKey = apiContext.headers['x-ice-auth-key'];
	const { screenName, password } = apiContext.body;

	if (!await apiContext.authorizeRequestsService.verifyIceAuthKey(iceAuthKey)) {
		return apiContext.response(400, 'x-ice-auth-key header is invalid');
	}

	const { authorizeRequestId } = apiContext.authorizeRequestsService.splitIceAuthKey(iceAuthKey);
	const { applicationId } = await apiContext.repository.findById('authorizeRequests', authorizeRequestId);
	await apiContext.repository.removeById('authorizeRequests', authorizeRequestId);

	// screenName
	if (!apiContext.usersService.validFormatScreenName(screenName)) {
		return apiContext.response(400, 'screenName is invalid format');
	}
	const user = await apiContext.usersService.findByScreenName(screenName);
	if (user == null) {
		return apiContext.response(400, 'screenName is invalid');
	}

	// password
	if (!apiContext.usersService.checkFormatPassword(password)) {
		return apiContext.response(400, 'password is invalid format');
	}
	if (!apiContext.usersService.checkCorrectPassword(user, password)) {
		return apiContext.response(400, 'password is invalid');
	}

	// TODO: refactoring(duplication)

	let applicationAccess = await apiContext.repository.find('applicationAccesses', {
		applicationId: applicationId,
		userId: user._id
	});

	let accessKey;

	// まだapplicationAccessが生成されていない時
	if (applicationAccess == null) {
		applicationAccess = await apiContext.applicationAccessesService.create(applicationId, user._id);
		if (applicationAccess == null) {
			return apiContext.response(500, 'failed to create applicationAccess');
		}

		try {
			accessKey = await apiContext.applicationAccessesService.generateAccessKey(applicationAccess);
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
			accessKey = apiContext.applicationAccessesService.getAccessKey(applicationAccess);
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
