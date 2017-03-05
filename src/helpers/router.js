'use strict';

const apiResult = require('./apiResult');
const resHelper = require('./responseHelper');
const type = require('./type');

const _routes = [];
let _app;

/**
 * このモジュールを初期化します
 *
 * @param  {any} app 対象のサーバアプリケーション
 */
const init = app => {
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
const addRoute = (route, middles) => {
	if (!Array.isArray(route) || route == null)
		throw new Error('route is invalid type');

	if (middles == null)
		middles = [];

	let method = route[0].toLowerCase();
	const path = route[1];
	const extensions = route[2];

	method = method.replace(/^del$/, 'delete');

	for (const m of require('methods')) {
		if (method === m) {
			for (const middle of middles)
				_app[m](path, middle);

			_app[m](path, (request, response) => {
				console.log(`access: ${method.toUpperCase()} ${path}`);
				resHelper(response);
				let dirPath = `${__dirname}/../routes`;

				for (const seg of path.substring(1).split(/\//)) {
					dirPath += '/' + seg.replace(/:/, '');
				}

				if (dirPath.match(/\/$/))
					dirPath += 'index';

				dirPath = dirPath.replace(/\//g, require('path').sep);

				const routeFuncAsync = require(dirPath)[method];

				try {
					(async () => {
						if (routeFuncAsync == null)
							throw new Error(`endpoint not found\ntarget: ${method} ${path}`);

						const result = await routeFuncAsync(request, extensions);
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

			_routes.push({method: m, path: path, extensions: extensions});
		}
	}
};
exports.addRoute = addRoute;

/**
 * 複数のルートを追加します
 *
 * @param  {string[][]} routes
 * @param  {Function[]} middles
 */
const addRoutes = (routes, middles) => {
	if (!Array.isArray(routes) || routes == null)
		throw new Error('routes is invalid type');

	for (const route of routes)
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
const findRoute = (method, path) => {
	for (const route of _routes)
		if (method.toLowerCase() === route.method && path === route.path)
			return route;

	return null;
};
exports.findRoute = findRoute;
