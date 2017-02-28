'use strict';

const apiResult = require('./api-result');
const resHelper = require('./response-helper');
const type = require('./type');

const _routes = [];
let _app;

/**
 * このモジュールを初期化します
 *
 * @param  {any} app 対象のサーバアプリケーション
 */
var init = app => {
	if (app == null)
		throw new Error('app is empty');

	_app = app;

	return this;
};
module.exports = init;

/**
 * ルートを追加します
 *
 * @param  {string[]} route
 * @param  {Function[]} middles
 */
var addRoute = (route, middles) => {
	if (!Array.isArray(route) || route == null)
		throw new Error('route is invalid type');

	if (middles == null)
		middles = [];

	var method = route[0];
	const path = route[1];
	var extensions = route[2];

	method = method.replace(/^del$/, 'delete');

	for (var m of require('methods')) {
		if (method.toLowerCase() === m) {
			for (var middle of middles)
				_app[m](path, middle);

			_app[m](path, (request, response) => {
				console.log(path);
				resHelper(response);
				var dirPath = '../routes';

				for (var seg of path.substring(1).split(/\//))
					dirPath += '/' + seg.replace(/:/, '');

				const route = require(dirPath)[m];

				try {
					(async () => {
						if (route == null)
							throw new Error(`endpoint not found\ntarget: ${method} ${path}`);

						const result = await require(dirPath)[m](request, extensions);
						response.success(result);
					})().catch(err => {
						if (type(err) !== 'Error')
							response.error(err);
						else {
							console.log(`Internal Error: ${err.stack}`);
							response.error(apiResult(500, 'internal error', {details: err.stack}));
						}
					});
				}
				catch (err) {
					console.log(`Internal Error (Async): ${err.stack}`);
					response.error(apiResult(500, 'internal error (async)', {details: err.stack}));
				}
			});

			_routes.push({method: m.toUpperCase(), path: path, extensions: extensions});
		}
	}
}
exports.addRoute = addRoute;

/**
 * 複数のルートを追加します
 *
 * @param  {string[][]} routes
 * @param  {Function[]} middles
 */
var addRoutes = (routes, middles) => {
	if (!Array.isArray(routes) || routes == null)
		throw new Error('routes is invalid type');

	for (var route of routes)
		addRoute(route, middles);
};
exports.addRoutes = addRoutes;

/**
 * 該当するルートを取得します
 *
 * @param  {string} method
 * @param  {string} path
 * @return {Object} ルート情報
 */
var findRoute = (method, path) => {
	for (var route of _routes)
		if (method === route.method && path === route.path)
			return route;

	return null;
};
exports.findRoute = findRoute;
