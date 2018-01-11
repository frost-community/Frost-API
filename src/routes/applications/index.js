const ApiContext = require('../../modules/ApiContext');
const { permissionTypes } = require('../../modules/permission');
const $ = require('cafy').default;

/** @param {ApiContext} apiContext */
module.exports.post = async (apiContext) => {
	await apiContext.proceed({
		body: {
			name: { cafy: $().string().min(1).max(32) },
			description: { cafy: $().string().max(256), default: '' },
			permissions: { cafy: $().array('string').unique().eachQ(q => q.or(permissionTypes)), default: [] }
		},
		permissions: ['applicationSpecial']
	});
	if (apiContext.responsed) return;

	const { name, description, permissions } = apiContext.body;

	if (!await apiContext.applicationsService.nonDuplicatedName(name)) {
		return apiContext.response(400, 'already exists name');
	}
	if (!apiContext.applicationsService.availablePermissions(permissions)) {
		return apiContext.response(400, 'some permissions use are disabled');
	}

	const application = await apiContext.applicationsService.create(name, apiContext.user, description, permissions);
	if (application == null) {
		return apiContext.response(500, 'failed to create application');
	}

	apiContext.response(200, { application: apiContext.applicationsService.serialize(application) });
};

/** @param {ApiContext} apiContext */
module.exports.get = async (apiContext) => {
	await apiContext.proceed({
		permissions: ['application']
	});
	if (apiContext.responsed) return;

	const applications = await apiContext.applicationsService.findArrayByCreatorId(apiContext.user._id);
	if (applications.length == 0) {
		apiContext.response(204);
		return;
	}

	apiContext.response(200, { applications: applications.map(i => apiContext.applicationsService.serialize(i)) });
};
