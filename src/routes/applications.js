'use strict';

const apiResult = require('../helpers/apiResult');
const dbConnector = require('../helpers/dbConnector');

const applicationModel = require('../models/application');

exports.post = async (request, extensions, config) => {
	const userId = request.user.id;
	const name = request.body.name;
	const description = request.body.description;
	const permissions = request.body.permissions;

	const db = await dbConnector.connectApidbAsync(config);

	// name
	if (!/^.{1,32}$/.test(name))
		return apiResult(400, 'name is invalid format');

	if ((await db.findArrayAsync('applications', {name: name})).length >= 1)
		return apiResult(400, 'already exists name');

	// description
	if (!/^.{0,256}$/.test(description))
		return apiResult(400, 'description is invalid format');

	// permissions
	if (!applicationModel.analyzePermissions(permissions))
		return apiResult(400, 'permissions is invalid format');

	let document;

	try {
		document = await db.createAsync('applications', {
			name: name,
			creatorId: userId,
			description: description,
			permissions: permissions
		});
	}
	catch(err) {
		console.log(err.stack);
		return apiResult(500, 'faild to create application');
	}

	if (!(document.result.n == 1 && document.result.ok == 1))
		return apiResult(500, 'faild to create application');

	let res = {};
	Object.assign(res, {application: document.ops[0]});

	// _idを文字列に変換し、idとして返す
	res.application.id = res.application._id.toString();
	delete res.application._id;

	return apiResult(200, 'success', res);
};
