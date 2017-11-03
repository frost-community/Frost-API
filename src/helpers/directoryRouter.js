'use strict';

const ApiResult = require('./apiResult');
const pathToRegexp = require('path-to-regexp');

class DirectoryRouter {
	/**
	 * このモジュールを初期化します
	 *
	 * @param  {e} app 対象のサーバアプリケーション
	 * @param  {Object} db 対象のDB
	 * @param  {[]} config 対象のconfig
	 */
	constructor(app) {
		if (app == null) {
			throw new Error('missing arguments');
		}

		this.app = app;
		this.routes = [];
	}

	/**
	 * ルートを追加します
	 *
	 * @param  {Route} route
	 * @return {void}
	 */
	addRoute(route) {
		if (route == null) {
			throw new Error('missing arguments');
		}

		this.app[route.method](route.path, (request, response) => {
			(async () => {
				request.version = request.params.ver;

				try {
					let routeFuncAsync;

					try {
						routeFuncAsync = require(route.getModulePath())[route.method];
					}
					catch(e) {
						// noop
					}

					if (routeFuncAsync == null) {
						throw new Error(`route function is not found\ntarget: ${route.method} ${route.path}`);
					}

					const result = await routeFuncAsync(request);
					console.log(`rest: ${route.method.toUpperCase()} ${route.path}, status=${result.statusCode}`);
					response.apiSend(result);
				}
				catch (err) {
					if (err instanceof Error) {
						console.log(`Internal Error: ${err}`);
						response.apiSend(new ApiResult(500, {message: 'internal error', details: err}));
					}
					else {
						response.apiSend(new ApiResult(500, {message: 'internal error(unknown type)', details: err}));
					}
				}
			})();
		});

		this.routes.push(route);
	}

	/**
	 * 該当するルートを取得します
	 *
	 * @param  {string} method
	 * @param  {string} endpoint
	 * @return {Object} Route instance
	 */
	findRoute(method, endpoint) {
		if (method == null || endpoint == null) {
			throw new Error('missing arguments');
		}

		if (typeof method != 'string' || typeof endpoint != 'string') {
			throw new Error('invalid type');
		}

		return this.routes.find(i => i.method === method.toLowerCase() && pathToRegexp(i.path, []).test(endpoint) );
	}
}
module.exports = DirectoryRouter;
