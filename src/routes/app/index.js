const ApiContext = require('../../modules/ApiContext');
const MongoAdapter = require('../../modules/MongoAdapter');
//const definedScopes = require('../../modules/scopes');
const $ = require('cafy').default;

/** @param {ApiContext} apiContext */
module.exports.create = async (apiContext) => {
	await apiContext.proceed({
		body: {
			name: { cafy: $().string().min(1).max(32) },
			description: { cafy: $().string().max(256), default: '' },
			scopes: { cafy: $().array($().string()).unique().each(scope => {
				return apiContext.applicationsService.availableScope(scope);
			}), default: [] }
		},
		scopes: ['app.create']
	});
	if (apiContext.responsed) return;

	const { name, description, scopes } = apiContext.body;

	if (!await apiContext.applicationsService.nonDuplicatedName(name)) {
		apiContext.response(400, 'already exists name');
		return;
	}

	const application = await apiContext.applicationsService.create(name, apiContext.user, description, scopes);
	if (application == null) {
		apiContext.response(500, 'failed to create application');
		return;
	}

	apiContext.response(200, { application: apiContext.applicationsService.serialize(application) });
};

/** @param {ApiContext} apiContext */
exports.show = async (apiContext) => {
	await apiContext.proceed({
		body: {
			applicationId: { cafy: $().string().pipe(i => MongoAdapter.validateId(i)) }
		},
		scopes: ['app.read']
	});
	if (apiContext.responsed) return;

	let application;
	try {
		application = await apiContext.repository.findById('applications', apiContext.body.applicationId);
	}
	catch (err) {
		console.log(err);
	}

	if (application == null) {
		apiContext.response(404, 'application not found');
		return;
	}

	apiContext.response(200, { application: apiContext.applicationsService.serialize(application) });
};

/** @param {ApiContext} apiContext */
module.exports.list = async (apiContext) => {
	await apiContext.proceed({
		scopes: ['app.read']
	});
	if (apiContext.responsed) return;

	const applications = await apiContext.applicationsService.findArrayByCreatorId(apiContext.user._id);
	if (applications.length == 0) {
		apiContext.response(204);
		return;
	}

	apiContext.response(200, { applications: applications.map(i => apiContext.applicationsService.serialize(i)) });
};
