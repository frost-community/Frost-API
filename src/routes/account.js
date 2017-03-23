'use strict';

const ApiResult = require('../helpers/apiResult');
const crypto = require('crypto');
const randomRange = require('../helpers/randomRange');
const User = require('../documentModels/user');

exports.post = async (request) => {
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
	if (!User.checkFormatScreenName(screenName))
		return new ApiResult(400, 'screenName is invalid format');

	// check validation
	if (request.config.api.invalidScreenNames.some(invalidScreenName => screenName == invalidScreenName))
		return new ApiResult(400, 'screenName is invalid');

	// check duplication
	if (await User.findByScreenNameAsync(screenName, request.db, request.config) != null)
		return new ApiResult(400, 'this screenName is already exists');

	// password
	if (!User.checkFormatPassword(password))
		return new ApiResult(400, 'password is invalid format');

	// name
	if (!/^.{1,32}$/.test(name))
		return new ApiResult(400, 'name is invalid format');

	// description
	if (!/^.{0,256}$/.test(description))
		return new ApiResult(400, 'description is invalid format');

	let user;
	try {
		user = await request.db.users.createAsync({ // TODO: move to document models
			screenName: screenName,
			passwordHash: hash,
			name: name,
			description: description
		});
	}
	catch(err) {
		console.log(err.trace);
	}

	if (user == null)
		return new ApiResult(500, 'faild to create account');

	return new ApiResult(200, {user: user.serialize()});
};
