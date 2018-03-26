const ApiContext = require('../../modules/ApiContext');
const $ = require('cafy').default;
const uid = require('uid2');

/** @param {ApiContext} apiContext */
module.exports.post = async (apiContext) => {
	await apiContext.proceed({
		body: {
			applicationId: { cafy: $().string() },
			userId: { cafy: $().string() }
		},
		scopes: ['auth.host']
	});
	if (apiContext.responsed) return;

	const { applicationId, userId } = apiContext.body;

	if ((await apiContext.repository.findById('applications', applicationId)) == null) {
		apiContext.response(400, 'applicationId is invalid');
		return;
	}

	if ((await apiContext.repository.findById('users', userId)) == null) {
		apiContext.response(400, 'userId is invalid');
		return;
	}

	const token = await apiContext.repository.create('tokens', {
		applicationId: applicationId,
		userId: userId,
		accessToken: uid(128)
	});

	apiContext.response(200, { token });
};

/** @param {ApiContext} apiContext */
module.exports.get = async (apiContext) => {
	await apiContext.proceed({
		body: {
			applicationId: { cafy: $().string() },
			userId: { cafy: $().string() }
		},
		scopes: ['auth.host']
	});
	if (apiContext.responsed) return;

	const { applicationId, userId } = apiContext.body;

	if ((await apiContext.repository.findById('applications', applicationId)) == null) {
		apiContext.response(400, 'applicationId is invalid');
		return;
	}

	if ((await apiContext.repository.findById('users', userId)) == null) {
		apiContext.response(400, 'userId is invalid');
		return;
	}

	const token = await apiContext.repository.find('tokens', {
		applicationId: applicationId,
		userId: userId
	});

	if (token == null) {
		apiContext.response(400, 'token has not been generated yet');
		return;
	}

	apiContext.response(200, { token });
};
