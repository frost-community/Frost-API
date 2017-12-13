const Application = require('../../documentModels/application');
const { permissionTypes } = require('../../helpers/permission');
const $ = require('cafy').default;
const { ApiError } = require('../../helpers/errors');

module.exports.post = async (apiContext) => {
	await apiContext.check({
		body: {
			name: { cafy: $().string().min(1).max(32) },
			description: { cafy: $().string().max(256), default: '' },
			permissions: { cafy: $().array('string').unique().eachQ(q => q.or(permissionTypes)), default: [] }
		},
		permissions: ['applicationSpecial']
	});

	const { name, description, permissions } = apiContext.body;

	// check name duplication
	if (await Application.findByNameAsync(name, apiContext.db, apiContext.config) != null) {
		throw new ApiError(400, 'already exists name');
	}

	// check permissions(利用を禁止された権限をが含まれていないかどうか)
	if (permissions.some(permission => apiContext.config.api.additionDisabledPermissions.indexOf(permission) != -1)) {
		throw new ApiError(400, 'some permissions use are disabled');
	}

	let application;
	try {
		application = await apiContext.db.applications.createAsync(name, apiContext.user, description, permissions);
	}
	catch(err) {
		console.log(err);
	}

	if (application == null) {
		throw new ApiError(500, 'failed to create application');
	}

	apiContext.response(200, {application: application.serialize()});
};

module.exports.get = async (apiContext) => {
	await apiContext.check({
		permissions: ['application']
	});

	let applications;
	try {
		applications = await Application.findArrayByCreatorIdAsync(apiContext.user.document._id, apiContext.db, apiContext.config);
	}
	catch(err) {
		console.log(err);
		applications = [];
	}

	if (applications.length == 0) {
		apiContext.response(204);
		return;
	}

	apiContext.response(200, {applications: applications.map(i => i.serialize())});
};
