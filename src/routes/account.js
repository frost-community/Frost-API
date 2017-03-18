'use strict';

const ApiResult = require('../helpers/apiResult');
const crypto = require('crypto');
const randomRange = require('../helpers/randomRange');

exports.post = async (request, extensions, db, config) => {
	const screenName = request.body.screenName;
	const password = request.body.password;
	let name = request.body.name;
	let description = request.body.description;

	if (name == null || name === '')
		name = 'froster';

	if (description == null)
		description = '';

	const salt = randomRange(1, 99999);

	const sha256 = crypto.createHash('sha256');
	sha256.update(`${password}.${salt}`);
	const hash = `${sha256.digest('hex')}.${salt}`;

	// screenName
	if (!/^[a-z0-9_]{4,15}$/.test(screenName) || /^(.)\1{3,}$/.test(screenName))
		return new ApiResult(400, 'screenName is invalid format');

	for (const invalidScreenName of config.api.invalidScreenNames) {
		if (screenName === invalidScreenName)
			return new ApiResult(400, 'screenName is invalid');
	}

	if (await db.users.findAsync({screenName: screenName}) != null)
		return new ApiResult(400, 'this screenName is already exists');

	// password
	if (!/^[a-z0-9_-]{6,}$/.test(password))
		return new ApiResult(400, 'password is invalid format');

	// name
	if (!/^.{1,32}$/.test(name))
		return new ApiResult(400, 'name is invalid format');

	// description
	if (!/^.{0,256}$/.test(description))
		return new ApiResult(400, 'description is invalid format');

	let user;

	try {
		user = await db.users.createAsync({
			screenName: screenName,
			passwordHash: hash,
			name: name,
			description: description
		});
	}
	catch(err) {
		console.log(err.stack);
		return new ApiResult(500, 'faild to create account');
	}

	if (user == null)
		return new ApiResult(500, 'faild to create account');

	return new ApiResult(200, 'success', {user: user.serialize()});
};
