const ApiContext = require('./ApiContext');
const pathToRegexp = require('path-to-regexp');
const { MissingArgumentsError } = require('./errors');

class DirectoryRouter {
	/**
	 * このモジュールを初期化します
	 *
	 * @param {e} app 対象のサーバアプリケーション
	 */
	constructor(app) {
		if (app == null) {
			throw new MissingArgumentsError();
		}

		this.app = app;
		this.routes = [];
	}

	/**
	 * ルートを追加します
	 *
	 * @param {Route} route
	 * @return {void}
	 */
	addRoute(route) {
		if (route == null) {
			throw new MissingArgumentsError();
		}

		this.app[route.method](route.path, (request, response) => {
			(async () => {
				let apiContext;
				try {
					let routeFuncAsync;
					try {
						routeFuncAsync = require(route.getModulePath())[route.method];
					}
					catch (err) {
						console.log(err);
					}

					if (routeFuncAsync == null) {
						throw new Error(`route function is not found\ntarget: ${route.method} ${route.path}`);
					}

					apiContext = new ApiContext(request.streams, request.lock, request.repository, request.config, {
						params: request.params,
						query: request.query,
						body: request.body,
						headers: request.headers
					});
					await routeFuncAsync(apiContext);

					console.log(`rest: ${route.method.toUpperCase()} ${route.path}, status=${apiContext.statusCode}`);
					response.apiSend(apiContext);
				}
				catch (err) {
					if (err instanceof Error) {
						console.log('Internal Error:', err);
						apiContext.response(500, { message: 'internal error', details: err });
						response.apiSend(apiContext);
					}
					else {
						console.log('Internal Error(unknown type):', err);
						apiContext.response(500, { message: 'internal error(unknown type)', details: err });
						response.apiSend(apiContext);
					}
				}
			})();
		});

		this.routes.push(route);
	}

	/**
	 * 該当するルートを取得します
	 *
	 * @param {string} method
	 * @param {string} endpoint
	 * @return {Object} Route instance
	 */
	findRoute(method, endpoint) {
		if (method == null || endpoint == null) {
			throw new MissingArgumentsError();
		}

		if (typeof method != 'string' || typeof endpoint != 'string') {
			throw new Error('invalid type');
		}

		return this.routes.find(i => i.method === method.toLowerCase() && pathToRegexp(i.path, []).test(endpoint));
	}
}
module.exports = DirectoryRouter;
