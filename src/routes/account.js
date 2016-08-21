'use strict';

const crypto = require('crypto');
const randomRange = require('../modules/random-range');
const log = require('../modules/log');
const dbConnector = require('../modules/db-connector')();
const config = require('../modules/load-config')();

exports.post = (request, response, extensions) => {

	if (!request.haveParams(['screen_name', 'password'], response))
		return;

	const screenName = request.body.screen_name;
	const password = request.body.password;
	let name = request.body.name;
	let description = request.body.description;

	if (name == undefined || name === '')
		name = 'froster';

	if (description == undefined)
		description = '';

	const salt = randomRange(1, 99999);

	const sha256 = crypto.createHash('sha256');
	sha256.update(`${password}.${salt}`);
	const hash = `${sha256.digest('hex')}.${salt}`;

	(async () => {
		const dbManager = await dbConnector.connectApidbAsync();
		let result;

		if (!/^[a-z0-9_]{4,15}$/.test(screenName) || /^(.)\1{3,}$/.test(screenName))
			throw "screen_name is invalid format";

		config.api.invalid_screen_names.forEach((invalidScreenName)=>{
			if (screenName === invalidScreenName)
				throw "screen_name is invalid";
		});

		if (/^[a-z0-9_-]{6,128}$/.test(password))
			throw "password is invalid format";

		if ((await dbManager.findArrayAsync('users', {screen_name: screenName})).length !== 0)
		{
			throw "this screen_name is already exists";
		}

		try {
			result = (await dbManager.createAsync('users', {screen_name: screenName, name: name, description: description, password_hash: hash})).ops[0];
		}
		catch(err) {
			throw "500:faild to create account";
		}

		delete result.password_hash;

		response.success({user: result});
	})().catch(err => {
		if (typeof err == 'string') {
			var reg = /^([0-9]+):(.+)$/.exec(err);
			if (reg == undefined)
				response.error(err);
			else
				response.error(reg[2], reg[1]);
		}
		else {
			console.error(`internal error: ${err.stack}`, 500);
		}
	});
}
