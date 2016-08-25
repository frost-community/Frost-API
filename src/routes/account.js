'use strict';

const crypto = require('crypto');
const apiResult = require('../modules/api-result');
const config = require('../modules/load-config')();
const dbConnector = require('../modules/db-connector')();
const getMissingParams = require('../modules/get-missing-params');
const randomRange = require('../modules/random-range');

exports.post = (params, extensions) => new Promise((resolve, reject) => (async () => {
	const missingParams = getMissingParams(params, ['screen_name', 'password']);
	if (missingParams.length) {
		return reject(apiResult(400, 'some required parameters are missing', {target_params: missingParams}));
	}

	const screenName = params.screen_name;
	const password = params.password;
	let name = params.name;
	let description = params.description;

	if (name == undefined || name === '')
		name = 'froster';

	if (description == undefined)
		description = '';

	const salt = randomRange(1, 99999);

	const sha256 = crypto.createHash('sha256');
	sha256.update(`${password}.${salt}`);
	const hash = `${sha256.digest('hex')}.${salt}`;

	const dbManager = await dbConnector.connectApidbAsync();

	if (!/^[a-z0-9_]{4,15}$/.test(screenName) || /^(.)\1{3,}$/.test(screenName))
		return reject(apiResult(400, "screen_name is invalid format"));

	for (var invalidScreenName in config.api.invalid_screen_names) {
		if (screenName === invalidScreenName)
			return reject(apiResult(400, "screen_name is invalid"));
	}

	if (!/^[a-z0-9_-]{6,128}$/.test(password))
		return reject(apiResult(400, "password is invalid format"));

	if ((await dbManager.findArrayAsync('users', {screen_name: screenName})).length !== 0)
		return reject(apiResult(400, "this screen_name is already exists"));

	let result;

	try {
		result = (await dbManager.createAsync('users', {screen_name: screenName, name: name, description: description, password_hash: hash})).ops[0];
	}
	catch(err) {
		return reject(apiResult(500, "faild to create account"));
	}

	delete result.password_hash;
	resolve(apiResult(200, null, {user: result}));
})());
