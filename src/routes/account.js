'use strict';

const ApiResult = require('../helpers/apiResult');
const User = require('../documentModels/user');

exports.post = async (request) => {
	const result = await request.checkRequestAsync({
		body: [
			{name: 'screenName', type: 'string'},
			{name: 'password', type: 'string'},
			{name: 'description', type: 'string', require: false},
			{name: 'name', type: 'string', require: false}
		], permissions: ['accountSpecial']
	});

	if (result != null) {
		return result;
	}

	const screenName = request.body.screenName;
	const password = request.body.password;
	let name = request.body.name;
	let description = request.body.description;

	if (name == null || name === '') {
		name = 'froster';
	}

	if (description == null) {
		description = '';
	}

	// screenName
	if (!User.checkFormatScreenName(screenName)) {
		return new ApiResult(400, 'screenName is invalid format');
	}

	// check validation
	if (request.config.api.invalidScreenNames.some(invalidScreenName => screenName == invalidScreenName)) {
		return new ApiResult(400, 'screenName is invalid');
	}

	// check duplication
	if (await User.findByScreenNameAsync(screenName, request.db, request.config) != null) {
		return new ApiResult(400, 'this screenName is already exists');
	}

	// password
	if (!User.checkFormatPassword(password)) {
		return new ApiResult(400, 'password is invalid format');
	}

	// name
	if (!/^.{1,32}$/.test(name)) {
		return new ApiResult(400, 'name is invalid format');
	}

	// description
	if (!/^.{0,256}$/.test(description)) {
		return new ApiResult(400, 'description is invalid format');
	}

	let user;

	try {
		user = await request.db.users.createAsync(screenName, password, name, description);
	}
	catch(err) {
		console.dir(err);
	}

	if (user == null) {
		return new ApiResult(500, 'failed to create account');
	}

	return new ApiResult(200, {user: user.serialize()});
};
