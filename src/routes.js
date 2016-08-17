'use strict';

const testAction = function *(req, res) {
	console.log(`test`);
}

module.exports = () => {
	var routes = [
		// general
		['get',  '/',                                 {permissions:[]}],

		// applications
		['post', '/applications',                     {permissions:[]}],
		['get',  '/applications/:id',                 {permissions:[]}],
		['post', '/applications/:id/application-key', {permissions:[]}],
		['get',  '/applications/:id/application-key', {permissions:[]}],

		// users
		['get',  '/users/:id',                        {permissions:[]}],

		// account
		['post', '/account',                          {permissions:[]}],
	];

	return routes;
}
