'use strict';

const apiResult = require('../helpers/apiResult');
const dbConnector = require('../helpers/dbConnector')();

const applicationModel = require('../models/application');

exports.post = async (request, extensions, config) => {
	const userId = request.user._id;
	const name = request.body.name;
	const description = request.body.description;
	const permissions = request.body.permissions;

	const db = await dbConnector.connectApidbAsync(config);

	if ((await db.findArrayAsync('applications', {name: name})).length >= 1)
		throw apiResult(400, 'already exists name');

	if (!applicationModel.analyzePermissions(request.application.permissions))
		throw apiResult(400, 'permissions is invalid format');

	let application;

	try {
		application = await db.createAsync('applications', {
			name: name,
			creatorId: userId,
			description: description,
			permissions: permissions
		});
	}
	catch(err) {
		console.log(err.stack);
		throw apiResult(500, 'faild to create application');
	}

	return apiResult(200, null, {application: application});
};
