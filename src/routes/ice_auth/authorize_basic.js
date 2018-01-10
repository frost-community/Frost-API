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

	const { verifyKey, splitKey } = apiContext.authorizeRequestsService;

	if (!await verifyKey(iceAuthKey, apiContext.db, apiContext.config)) {
		return apiContext.response(400, 'x-ice-auth-key header is invalid');
	}

	const { authorizeRequestId } = splitKey(iceAuthKey);
	const { applicationId } = await apiContext.repository.findById('authorizeRequests', authorizeRequestId);
	await apiContext.repository.removeById('authorizeRequests', authorizeRequestId);

	if (!apiContext.usersService.validFormatScreenName(screenName)) {
		return apiContext.response(400, 'screenName is invalid format');
	}

	if (!apiContext.usersService.checkFormatPassword(password)) {
		return apiContext.response(400, 'password is invalid format');
	}

	const user = await apiContext.usersService.findByScreenName(screenName);
	if (user == null) {
		return apiContext.response(400, 'screenName is invalid');
	}

	if (!apiContext.usersService.checkCorrectPassword(user, password)) {
		return apiContext.response(400, 'password is invalid');
	}

	// TODO: refactoring(duplication)

	let applicationAccess = await apiContext.db.applicationAccesses.findAsync({
		applicationId: applicationId,
		userId: user.document._id
	});

	let accessKey;

	if (applicationAccess == null) {
		try {
			applicationAccess = await apiContext.db.applicationAccesses.createAsync({ // TODO: move to document models
				applicationId: applicationId,
				userId: user.document._id,
				keyCode: null
			});
		}
		catch (err) {
			console.log(err);
		}

		if (applicationAccess == null) {
			return apiContext.response(500, 'failed to create applicationAccess');
		}

		try {
			accessKey = await applicationAccess.generateAccessKeyAsync();
		}
		catch (err) {
			console.log(err);
		}

		if (accessKey == null) {
			return apiContext.response(500, 'failed to generate accessKey');
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
			return apiContext.response(500, 'failed to build accessKey');
		}
	}

	apiContext.response(200, { accessKey: accessKey });
};
