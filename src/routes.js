'use strict';

const testAction = function *(req, res) {
	console.log(`test`);
}

module.exports = () => {
	var routes = [
		['get', '/', [], testAction],
		['post', '/application', [], testAction],
		['get', '/application/:id', [], testAction],
		['post', '/application/:id/application-key', [], testAction],
		['get', '/application/:id/application-key', [], testAction],
		['get', '/user/:id', [], testAction],
	];

	return routes;
}
