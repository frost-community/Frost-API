const AuthorizeRequest = require('../../documentModels/authorizeRequest');
const User = require('../../documentModels/user');
const $ = require('cafy').default;
const { ApiError } = require('../../helpers/errors');

exports.post = async (apiContext) => {
	await apiContext.check({
		body: {
			screenName: { cafy: $().string() },
			password: { cafy: $().string() }
		},
		headers: ['x-ice-auth-key'],
		permissions: ['iceAuthHost']
	});

	const iceAuthKey = apiContext.headers['x-ice-auth-key'];
	const screenName = apiContext.body.screenName;
	const password = apiContext.body.password;

	if (!await AuthorizeRequest.verifyKeyAsync(iceAuthKey, apiContext.db, apiContext.config)) {
		throw new ApiError(400, 'x-ice-auth-key header is invalid');
	}

	const authorizeRequestId = AuthorizeRequest.splitKey(iceAuthKey, apiContext.db, apiContext.config).authorizeRequestId;
	const authorizeRequest = await AuthorizeRequest.findByIdAsync(authorizeRequestId, apiContext.db, apiContext.config);
	const applicationId = authorizeRequest.document.applicationId;
	await authorizeRequest.removeAsync();

	if (!User.checkFormatScreenName(screenName)) {
		throw new ApiError(400, 'screenName is invalid format');
	}

	if (!User.checkFormatPassword(password)) {
		throw new ApiError(400, 'password is invalid format');
	}

	const user = await User.findByScreenNameAsync(screenName, apiContext.db, apiContext.config);

	if (user == null) {
		throw new ApiError(400, 'screenName is invalid');
	}

	if (!user.verifyPassword(password)) {
		throw new ApiError(400, 'password is invalid');
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
