'use strict';

const ApiResult = require('./apiResult');
const type = require('./type');

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
	addRoute(route) {
		if (!Array.isArray(route) || route == null)
			throw new Error('route is invalid type');

		let method = route[0].toLowerCase();
		const path = route[1];
		const extensions = route[2];

		method = method.replace(/^del$/, 'delete');

		for (const m of require('methods')) {
			if (method === m) {
				this.app[m](path, (request, response) => {
					console.log(`access: ${method.toUpperCase()} ${path}`);
					request.extensions = extensions;
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

				this.routes.push({method: m, path: path, extensions: extensions});
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
	addRoutes(routes, middles) {
		if (!Array.isArray(routes) || routes == null)
			throw new Error('routes is invalid type');

		for (const route of routes)
			this.addRoute(route, middles);
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
