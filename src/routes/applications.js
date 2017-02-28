'use strict';

const apiResult = require('../helpers/api-result');
const dbConnector = require('../helpers/db-connector')();
const type = require('../helpers/type');

const applicationModel = require('../models/application');

exports.post = async (request, extensions) => {
	const userId = request.user._id;
	const name = request.body.name;
	const description = request.body.description;
	const permissions = request.body.permissions;

	const db = await dbConnector.connectApidbAsync();

	if ((await db.findArrayAsync('applications', {name: name})).length >= 1)
		throw apiResult(400, 'already exists name');

	if (!applicationModel.analyzePermissions(request.application.permissions))
		throw apiResult(400, 'permissions is invalid format');

	let application;

	try {
		application = await db.createAsync('applications', {
			name: name,
			creator_id: userId,
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
