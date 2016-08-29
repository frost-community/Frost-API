'use strict';

const apiResult = require('../modules/api-result');
const dbConnector = require('../modules/db-connector')();
const type = require('../modules/type');

exports.post = async (request, extensions) => {
	const userId = request.user._id;
	const name = request.body.name;
	const description = request.body.description;
	const permissions = request.body.permissions;

	const db = await dbConnector.connectApidbAsync();

	if (await db.findArrayAsync('applications', {name: name}).length >= 1)
		throw new Error(apiResult(400, 'already exists name'));

	// TODO: analyze permissions

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
		throw new Error(apiResult(500, 'faild to create application'));
	}

	return apiResult(200, null, {application: application});
};
