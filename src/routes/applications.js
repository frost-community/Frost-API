'use strict';

const apiResult = require('../modules/api-result');
const dbConnector = require('../modules/db-connector')();
const getMissingParams = require('../modules/get-missing-params');
const type = require('../modules/type');

exports.post = (request, extensions) => new Promise((resolve, reject) => (async () => {
	const userId = request.user._id;
	const name = request.body.name;
	const description = request.body.description;
	const permissions = request.body.permissions;

	const db = await dbConnector.connectApidbAsync();

	if (await db.findArrayAsync('applications', {name: name}).length >= 1)
		return reject(apiResult(400, 'already exists name'));

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
		return reject(apiResult(500, 'faild to create application'));
	}

	return resolve(apiResult(200, null, {application: application}));
})());
