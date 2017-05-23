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
		if (app == null)
			throw new Error('missing arguments');

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
		if (route == null)
			throw new Error('missing arguments');

		this.app[route.method](route.path, (request, response) => {
			(async () => {
				console.log(`access: ${route.method.toUpperCase()} ${route.path}`);
				request.version = request.params.ver;

				try {
					let routeFuncAsync;
					try {
						routeFuncAsync = require(route.getMoludePath())[route.method];
					}
					catch(e) {
						// noop
					}

					if (routeFuncAsync == null)
						throw new Error(`route function is not found\ntarget: ${route.method} ${route.path}`);

					const result = await routeFuncAsync(request);
					response.apiSend(result);
				}
				catch (err) {
					if (err instanceof Error) {
						console.log(`Internal Error: ${err.stack}`);
						response.apiSend(new ApiResult(500, {message: 'internal error', details: err.stack}));
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
	 * @return {Object} ルート情報
	 */
	findRoute(method, endpoint, outParamsArray) {
		if (method == null || endpoint == null)
			throw new Error('missing arguments');

		if (typeof method != 'string' || typeof endpoint != 'string')
			throw new Error('invalid type');

		return this.routes.find(route => {
			return route.method === method.toLowerCase() && pathToRegexp(route.path, outParamsArray).exec(endpoint);
		});
	}
}
module.exports = DirectoryRouter;
