'use strict';

const crypto = require('crypto');

const apiResult = require('../helpers/api-result');
const config = require('../helpers/load-config')();
const dbConnector = require('../helpers/db-connector')();
const randomRange = require('../helpers/random-range');

exports.post = async (request, extensions) => {
	const screenName = params.screen_name;
	const password = params.password;
	let name = params.name;
	let description = params.description;

	if (name == null || name === '')
		name = 'froster';

	if (description == null)
		description = '';

	const salt = randomRange(1, 99999);

	const sha256 = crypto.createHash('sha256');
	sha256.update(`${password}.${salt}`);
	const hash = `${sha256.digest('hex')}.${salt}`;

	const dbManager = await dbConnector.connectApidbAsync();

	if (!/^[a-z0-9_]{4,15}$/.test(screenName) || /^(.)\1{3,}$/.test(screenName))
		throw apiResult(400, "screen_name is invalid format");

	for (var invalidScreenName of config.api.invalid_screen_names) {
		if (screenName === invalidScreenName)
			throw apiResult(400, "screen_name is invalid");
	}

	if (!/^[a-z0-9_-]{6,128}$/.test(password))
		throw apiResult(400, "password is invalid format");

	if ((await dbManager.findArrayAsync('users', {screen_name: screenName})).length !== 0)
		throw new apiResult(400, "this screen_name is already exists");

	let result;

	try {
		result = (await dbManager.createAsync('users', {screen_name: screenName, name: name, description: description, password_hash: hash})).ops[0];
	}
	catch(err) {
		console.log(err.stack);
		throw apiResult(500, "faild to create account");
	}

	delete result.password_hash;
	return apiResult(200, null, {user: result});
};
