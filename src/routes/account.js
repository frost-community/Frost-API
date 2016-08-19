'use strict';

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

	response.success({user: {id: 1, created_at:1, screen_name: screenName, name: name, description: description}});
}
