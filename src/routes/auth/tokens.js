const ApiContext = require('../../modules/ApiContext');
const $ = require('cafy').default;

/** @param {ApiContext} apiContext */
module.exports.post = async (apiContext) => {
	await apiContext.proceed({
		body: {
			applicationId: { cafy: $().string() },
			userId: { cafy: $().string() },
			scopes: { cafy: $().array($().string()) },
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

	// 同じアプリ、ユーザー、スコープの組み合わせのトークンは生成を拒否
	if ((await apiContext.tokensService.find(applicationId, userId, scopes)) != null) {
		apiContext.response(400, 'token already exists');
		return;
	}

	const token = await apiContext.tokensService.create(application, user, scopes);

	apiContext.response(200, { token: apiContext.tokensService.serialize(token) });
};

/** @param {ApiContext} apiContext */
module.exports.get = async (apiContext) => {
	await apiContext.proceed({
		query: {
			applicationId: { cafy: $().string(), default: null },
			userId: { cafy: $().string(), default: null },
			scopes: { cafy: $().string(), default: null },
			accessToken: { cafy: $().string(), default: null },
		},
		scopes: ['auth.host']
	});
	if (apiContext.responsed) return;

	const { applicationId, userId, scopes, accessToken } = apiContext.query;

	let token;
	if (accessToken != null) {
		token = await apiContext.tokensService.findByAccessToken(accessToken);
	}
	else {
		if (applicationId == null) {
			apiContext.response(400, 'applicationId is required');
			return;
		}

		if (userId == null) {
			apiContext.response(400, 'userId is required');
			return;
		}

		if ((await apiContext.repository.findById('applications', applicationId)) == null) {
			apiContext.response(400, 'applicationId is invalid');
			return;
		}

		if ((await apiContext.repository.findById('users', userId)) == null) {
			apiContext.response(400, 'userId is invalid');
			return;
		}

		let splitedScopes = [];
		if (scopes != null && scopes != '') {
			splitedScopes = scopes.split(',');
		}

		token = await apiContext.tokensService.find(applicationId, userId, splitedScopes);
	}

	if (token == null) {
		apiContext.response(404, 'token not found');
		return;
	}

	apiContext.response(200, { token: apiContext.tokensService.serialize(token) });
};
