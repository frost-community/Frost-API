'use strict';

const ApiResult = require('../../helpers/apiResult');
const AuthorizeRequest = require('../../documentModels/authorizeRequest');
const User = require('../../documentModels/user');

exports.post = async (request) => {
	const result = await request.checkRequestAsync({
		params: [
			{name: 'screenName', type: 'string'},
			{name: 'password', type: 'string'}
		],
		headers: ['X-Ice-Auth-Key'],
		permissions: ['iceAuthHost']
	});

	if (result != null)
		return result;

	const iceAuthKey = request.get('X-Ice-Auth-Key');
	const screenName = request.body.screenName;
	const password = request.body.password;

	if (!await AuthorizeRequest.verifyKeyAsync(iceAuthKey, request.db, request.config))
		return new ApiResult(400, 'X-Ice-Auth-Key header is invalid');

	const authorizeRequestId = AuthorizeRequest.splitKey(iceAuthKey, request.db, request.config).authorizeRequestId;
	const authorizeRequest = await AuthorizeRequest.findByIdAsync(authorizeRequestId, request.db, request.config);

	if (!User.checkFormatScreenName(screenName))
		return new ApiResult(400, 'screenName is invalid format');

	if (!User.checkFormatPassword(password))
		return new ApiResult(400, 'password is invalid format');

	const user = await User.findByScreenNameAsync(screenName, request.db, request.config);
	if (user == null)
		return new ApiResult(400, 'screenName is invalid');

	if (!user.verifyPassword(password))
		return new ApiResult(400, 'password is invalid');

	// TODO: refactoring(duplication)

	let applicationAccess = await request.db.applicationAccesses.findAsync({
		applicationId: authorizeRequest.document.applicationId,
		userId: user.document._id
	});

	let accessKey;
	if (applicationAccess == null) {
		try {
			applicationAccess = await request.db.applicationAccesses.createAsync({ // TODO: move to document models
				applicationId: authorizeRequest.document.applicationId,
				userId: user.document._id,
				keyCode: null
			});
		}
		catch(err) {
			console.log(err.stack);
		}

		if (applicationAccess == null)
			return new ApiResult(500, 'faild to create applicationAccess');

		try {
			accessKey = await applicationAccess.generateAccessKeyAsync();
		}
		catch(err) {
			console.log(err.stack);
		}

		if (accessKey == null)
			return new ApiResult(500, 'faild to generate accessKey');
	}
	else {
		try {
			accessKey = applicationAccess.getAccessKey();
		}
		catch(err) {
			console.log(err.stack);
		}

		if (accessKey == null)
			return new ApiResult(500, 'faild to build accessKey');
	}

	return new ApiResult(200, {accessKey: accessKey});
};
