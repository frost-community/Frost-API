'use strict';

const apiResult = require('../helpers/apiResult');
const applicationsAsync = require('../helpers/collections').applications;
const applicationModelAsync = require('../models/application');

exports.post = async (request, extensions, config) => {
	const userId = request.user._id;
	const name = request.body.name;
	const description = request.body.description;
	const permissions = request.body.permissions;

	const applications = await applicationsAsync(config);
	const applicationModel = await applicationModelAsync(config);

	// name
	if (!/^.{1,32}$/.test(name))
		return apiResult(400, 'name is invalid format');

	if (await applications.findAsync({name: name}) != null)
		return apiResult(400, 'already exists name');

	// description
	if (!/^.{0,256}$/.test(description))
		return apiResult(400, 'description is invalid format');

	// permissions
	if (!applicationModel.analyzePermissions(permissions))
		return apiResult(400, 'permissions is invalid format');

	let applicationDocument;

	try {
		applicationDocument = await applications.createAsync({
			name: name,
			creatorId: userId,
			description: description,
			permissions: permissions
		});
	}
	catch(err) {
		return apiResult(500, 'faild to create application');
	}

	if (applicationDocument == null)
		return apiResult(500, 'faild to create application');

	return apiResult(200, 'success', {application: applicationDocument.serialize()});
};
