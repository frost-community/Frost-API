'use strict';

const crypto = require('crypto');
const randomRange = require('../modules/random-range');
const log = require('../modules/log');
const dbConnector = require('../modules/db-connector')();

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

		try {
			result = await dbManager.createAsync('users', {screen_name: screenName, name: name, description: description, password_hash: hash});
		}
		catch(err) {
			response.error('んにゃぴ:');
			log(err);
			return;
		}

		return result;
	})().then(result => {
		response.success(result);
	}).catch(err => {
		if (typeof err == 'string')
			response.error(err);
		else
			console.error(`error: ${err.stack}`);
	});
}
