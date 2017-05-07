'use strict';

const ApiResult = require('../../helpers/apiResult');
const AuthorizeRequest = require('../../documentModels/authorizeRequest');

exports.get = async (request) => {
	const result = await request.checkRequestAsync({
		headers: ['X-Ice-Auth-Key'],
		query: [],
		permissions: ['iceAuthHost']
	});

	if (result != null)
		return result;

	const iceAuthKey = request.get('X-Ice-Auth-Key');

	if (!await AuthorizeRequest.verifyKeyAsync(iceAuthKey, request.db, request.config))
		return new ApiResult(400, 'X-Ice-Auth-Key header is invalid');

	const authorizeRequestId = AuthorizeRequest.splitKey(iceAuthKey, request.db, request.config).authorizeRequestId;
	const authorizeRequest = await request.db.authorizeRequests.findByIdAsync(authorizeRequestId); //TODO: move to document models

	if (authorizeRequest.document.verificationCode == null)
		throw new Error('verificationCode is empty');

	return new ApiResult(200, {verificationCode: authorizeRequest.document.verificationCode});
};
