'use strict';

const crypto = require('crypto');

const apiResult = require('../helpers/apiResult');
const config = require('../helpers/loadConfig')();
const dbConnector = require('../helpers/dbConnector')();
const randomRange = require('../helpers/randomRange');

exports.post = async (request, extensions) => {
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

	const dbManager = await dbConnector.connectApidbAsync();

	if (!/^[a-z0-9_]{4,15}$/.test(screenName) || /^(.)\1{3,}$/.test(screenName))
		throw apiResult(400, 'screenName is invalid format');

	for (let invalidScreenName of config.api.invalidScreenNames) {
		if (screenName === invalidScreenName)
			throw apiResult(400, 'screenName is invalid');
	}

	if (!/^[a-z0-9_-]{6,128}$/.test(password))
		throw apiResult(400, 'password is invalid format');

	if ((await dbManager.findArrayAsync('users', {screenName: screenName})).length !== 0)
		throw new apiResult(400, 'this screenName is already exists');

	let result;

	try {
		result = (await dbManager.createAsync('users', {screenName: screenName, name: name, description: description, passwordHash: hash})).ops[0];
	}
	catch(err) {
		console.log(err.stack);
		throw apiResult(500, 'faild to create account');
	}

	delete result.passwordHash;
	return apiResult(200, null, {user: result});
};
