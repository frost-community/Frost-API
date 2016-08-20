'use strict';

var co = require('co');
var log = require('../modules/log');
var dbModule = require('../modules/db');

exports.post = function (request, response, extensions) {

	if (!request.haveParams(['screen_name', 'password'], response))
		return;

	var screenName = request.body.screen_name;
	var password = request.body.password;
	var name = request.body.name;
	var description = request.body.description;

	if (name == undefined)
		name = 'froster';

	if (description == undefined)
		description = '';

	co(function* () {
		var db = yield dbModule.connectApidb();

		try {
			var result = yield dbModule.createDocument(db, 'user', {screen_name: screenName, name: name, description: description});
		}
		catch(err) {
			response.error('んにゃぴ');
		}

		return result;
	}).then((result) => {
		response.success(result);
	}, (err) => {
		if (typeof err == 'string')
			response.error(err);
		else
			console.error(`error: ${err.stack}`);
	});
}
