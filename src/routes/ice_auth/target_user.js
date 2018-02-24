const ApiContext = require('../../modules/ApiContext');
const $ = require('cafy').default;

/** @param {ApiContext} apiContext */
exports.post = async (apiContext) => {
	await apiContext.proceed({
		body: {
			userId: { cafy: $().string() }
		},
		headers: ['x-ice-auth-key'],
		permissions: ['iceAuthHost']
	});
	if (apiContext.responsed) return;

	const iceAuthKey = apiContext.headers['x-ice-auth-key'];
	const userId = apiContext.body.userId;

	if (!await apiContext.authorizeRequestsService.verifyIceAuthKey(iceAuthKey)) {
		apiContext.response(400, 'x-ice-auth-key header is invalid');
		return;
	}

	if ((await apiContext.repository.findById('users', userId)) == null) {
		apiContext.response(400, 'userId is invalid');
		return;
	}

	const { authorizeRequestId } = apiContext.authorizeRequestsService.splitIceAuthKey(iceAuthKey);
	let authorizeRequest = await apiContext.repository.findById('authorizeRequests', authorizeRequestId);
	authorizeRequest = await apiContext.authorizeRequestsService.setTargetUserId(authorizeRequest, userId);

	apiContext.response(200, { targetUserId: authorizeRequest.targetUserId });
};
