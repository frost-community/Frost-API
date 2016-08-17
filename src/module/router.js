'use strict';

const _routes = [];
let _app;

const main = app => {
	if (app === null)
		throw new Error('routes is unknown type');

	_app = app;

	return this;
};

const addRoute = (route, middles) => {
	if (!Array.isArray(route) || route === undefined)
		throw new Error('routes is unknown type');

	if (middles === undefined)
		middles = [];

	var method = route[0];
	const path = route[1];
	var extensions = route[2];

	method = method.replace(/^del$/, 'delete');

	require('methods').forEach(m => {
		if (method.toLowerCase() === m) {
			middles.forEach(middle => {
				_app[m](path, middle);
			});

			_app[m](path, function (req, res) {
				var dirPath = '../routes';

				path.substring(1).split(/\//).forEach((seg, i) => {
					dirPath += '/' + seg.replace(/:/, '');
				});

				require(dirPath)[m](req, res);
			});

			_routes.push([m.toUpperCase(), path, extensions]);
		}
	});
}

const addRoutes = (routes, middles) => {
	if (!Array.isArray(routes) || routes === undefined)
		throw new Error('routes is unknown type');

	routes.forEach(route => addRoute(route, middles));
};

const findRouteExtensions = (method, path) => {
	var result;

	_routes.some((route) => {
		if (method === route[0] && path === route[1])
		{
			result = route[2];
			return true;
		}
	});

	return result;
};

module.exports = main;
exports.addRoute = addRoute;
exports.addRoutes = addRoutes;
exports.findRouteExtensions = findRouteExtensions;