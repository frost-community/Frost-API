'use strict';

const ApiResult = require('./apiResult');
const type = require('./type');
const path = require('path');

class DirectoryRouter {
	/**
	 * このモジュールを初期化します
	 *
	 * @param  {e} app 対象のサーバアプリケーション
	 * @param  {Object} db 対象のDB
	 * @param  {[]} config 対象のconfig
	 */
	constructor(app) {
		if (app == null)
			throw new Error('missing arguments');

		this.app = app;
		this.routes = [];
	}

	/**
	 * ルートを追加します
	 *
	 * @param  {string[]} route
	 * @param  {Function[]} middles
	 * @return {void}
	 */
	addRoute(route, middlewares) {
		if (!Array.isArray(route) || route == null)
			throw new Error('route is invalid type');

		let method = route[0].toLowerCase();
		const routePath = route[1];
		const extensions = route[2];

		method = method.replace(/^del$/, 'delete');

		for (const m of require('methods')) {
			if (method === m) {
				middlewares.forEach(middleware => this.app[m](routePath, middleware));

				this.app[m](routePath, (request, response) => {
					console.log(`access: ${method.toUpperCase()} ${routePath}`);

					request.extensions = extensions;

					let dirPath = path.join(__dirname, '../routes', routePath.replace(/:/, ''));

					console.log(`dirPath: ${dirPath}`);

					if (dirPath.match(/\/$/))
						dirPath += 'index';

					// == middleware for the directory
					let dirMiddlewarePath;
					if (path.basename(dirPath) == 'index') // indexは
						dirMiddlewarePath = path.join(path.dirname(dirPath), '../_every');
					else
						dirMiddlewarePath = path.join(path.dirname(dirPath), '_every');

					dirMiddlewarePath = dirMiddlewarePath.replace(/\//g, path.sep);

					console.log(`dirMiddlewarePath: ${dirMiddlewarePath}`);

					try {
						let isReturn = true;

						const dirMiddleware = require(dirMiddlewarePath);
						dirMiddleware(request, response, () => isReturn = false);

						if (isReturn)
							return;
					}
					catch(e) {
						// noop
						console.log('dirMiddleware wasnt executed');
					}

					dirPath = dirPath.replace(/\//g, path.sep);
					const routeFuncAsync = require(dirPath)[method];

					(async () => {
						try {
							if (routeFuncAsync == null)
								throw new Error(`endpoint not found\ntarget: ${method} ${routePath}`);

							const result = await routeFuncAsync(request);
							response.apiSend(result);
						}
						catch (err) {
							if (type(err) !== 'Error')
								response.apiSend(err);
							else {
								console.log(`Internal Error (Async): ${err.stack}`);
								response.apiSend(new ApiResult(500, {message: 'internal error', details: err.stack}));
							}
						}
					})();
				});

				this.routes.push({method: m, path: routePath, extensions: extensions});
			}
		}
	}

	/**
	 * 複数のルートを追加します
	 *
	 * @param  {string[][]} routes
	 * @param  {Function[]} middles
	 * @return {void}
	 */
	addRoutes(routes, middlewares) {
		if (!Array.isArray(routes) || routes == null)
			throw new Error('routes is invalid type');

		for (const route of routes)
			this.addRoute(route, middlewares);
	}

	/**
	 * 該当するルートを取得します
	 *
	 * @param  {string} method
	 * @param  {string} path
	 * @return {Object} ルート情報
	 */
	findRoute(method, path) {
		for (const route of this.routes)
			if (method.toLowerCase() === route.method && path === route.path)
				return route;

		return null;
	}
}
module.exports = DirectoryRouter;
