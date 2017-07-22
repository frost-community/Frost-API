'use strict';

const ApiResult = require('../../helpers/apiResult');
const Application = require('../../documentModels/application');

exports.post = async (request) => {
	const result = await request.checkRequestAsync({
		body: [
			{name: 'name', type: 'string'},
			{name: 'description', type: 'string', require: false},
			{name: 'permissions', type: 'array'}
		],
		permissions: ['applicationSpecial']
	});

	if (result != null) {
		return result;
	}

	const name = request.body.name;
	let description = request.body.description;
	const permissions = request.body.permissions;

	// name
	if (!/^.{1,32}$/.test(name)) {
		return new ApiResult(400, 'name is invalid format');
	}

	// check name duplication
	if (await Application.findByNameAsync(name, request.db, request.config) != null) {
		return new ApiResult(400, 'already exists name');
	}

	// description
	if (description == null) {
		description = '';
	}

	if (!/^.{0,256}$/.test(description)) {
		return new ApiResult(400, 'description is invalid format');
	}

	// permissions
	if (!Application.checkFormatPermissions(permissions, request.db, request.config)) {
		return new ApiResult(400, 'permissions is invalid format. must be an array of string type.');
	}

	if (permissions.some(permission => request.config.api.additionDisabledPermissions.indexOf(permission) != -1)) { // 利用を禁止された権限を含む
		return new ApiResult(400, 'some permissions use are disabled');
	}

	let application;

	try {
		application = await request.db.applications.createAsync(name, request.user, description, permissions);
	}
	catch(err) {
		console.dir(err);
	}

	if (application == null) {
		return new ApiResult(500, 'failed to create application');
	}

	return new ApiResult(200, {application: application.serialize()});
};

exports.get = async (request) => {
	const result = await request.checkRequestAsync({
		permissions: ['application']
	});

	if (result != null) {
		return result;
	}

	let applications;

	try {
		applications = await Application.findArrayByCreatorIdAsync(request.user.document._id, request.db, request.config);
	}
	catch(err) {
		// noop
	}

	if (applications == null || applications.length == 0) {
		return new ApiResult(204);
	}

	return new ApiResult(200, {applications: applications.map(i => i.serialize())});
};
