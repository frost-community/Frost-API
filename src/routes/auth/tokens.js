const ApiContext = require('../../modules/ApiContext');
const $ = require('cafy').default;

/** @param {ApiContext} apiContext */
module.exports.post = async (apiContext) => {
	await apiContext.proceed({
		body: {
			applicationId: { cafy: $().string() },
			userId: { cafy: $().string() },
			scopes: { cafy: $().array('string') },
		},
		scopes: ['auth.host']
	});
	if (apiContext.responsed) return;

	const { applicationId, userId, scopes } = apiContext.body;

	const application = await apiContext.repository.findById('applications', applicationId);
	if (application == null) {
		apiContext.response(400, 'applicationId is invalid');
		return;
	}

	const user = await apiContext.repository.findById('users', userId);
	if (user == null) {
		apiContext.response(400, 'userId is invalid');
		return;
	}

	const validScopes = scopes.every(s => apiContext.applicationsService.hasScope(application, s));
	if (!validScopes) {
		apiContext.response(400, 'scopes is invalid');
		return;
	}

	const token = await apiContext.tokensService.create(application, user, []);

	apiContext.response(200, { token: apiContext.tokensService.serialize(token) });
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

	const token = await apiContext.tokensService.findByAppAndUser(applicationId, userId);

	if (token == null) {
		apiContext.response(400, 'token has not been generated yet');
		return;
	}

	apiContext.response(200, { token });
};
