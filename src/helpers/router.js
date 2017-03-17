'use strict';

const apiResult = require('./apiResult');
const resHelper = require('./responseHelper');
const type = require('./type');

/**
 * このモジュールを初期化します
 *
 * @param  {any} app 対象のサーバアプリケーション
 */
module.exports = (app, db, config) => {
	const instance = {};

	if (app == null)
		throw new Error('app is empty');

	if (config == null)
		throw new Error('config is empty');

	const routes = [];

	/**
	 * ルートを追加します
	 *
	 * @param  {string[]} route
	 * @param  {Function[]} middles
	 */
	instance.addRoute = (route, middles) => {
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
				for (const middle of middles) {
					app[m](path, middle);
				}

				app[m](path, (request, response) => {
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

					(async () => {
						try {
							if (routeFuncAsync == null)
								throw new Error(`endpoint not found\ntarget: ${method} ${path}`);

							const result = await routeFuncAsync(request, extensions, db, config);
							response.success(result);
						}
						catch (err) {
							if (type(err) !== 'Error')
								response.error(err);
							else {
								console.log(`Internal Error (Async): ${err.stack}`);
								response.error(apiResult(500, 'internal error', {details: err.stack}));
							}
						}
					})();
				});

				routes.push({method: m, path: path, extensions: extensions});
			}
		}
	};

	/**
	 * 複数のルートを追加します
	 *
	 * @param  {string[][]} routes
	 * @param  {Function[]} middles
	 */
	instance.addRoutes = (routes, middles) => {
		if (!Array.isArray(routes) || routes == null)
			throw new Error('routes is invalid type');

		for (const route of routes)
			instance.addRoute(route, middles);
	};

	/**
	 * 該当するルートを取得します
	 *
	 * @param  {string} method
	 * @param  {string} path
	 * @return {Object} ルート情報
	 */
	instance.findRoute = (method, path) => {
		for (const route of routes)
			if (method.toLowerCase() === route.method && path === route.path)
				return route;

		return null;
	};

	return instance;
};
