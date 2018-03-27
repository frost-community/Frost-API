const path = require('path');
const ApiContext = require('./ApiContext');
const pathToRegexp = require('path-to-regexp');
const { MissingArgumentsError } = require('./errors');

class DirectoryRouter {
	/**
	 * このモジュールを初期化します
	 *
	 * @param {e} router 対象のexpressルータまたはexpressサーバ
	 */
	constructor(router) {
		if (router == null) {
			throw new MissingArgumentsError();
		}

		this.router = router;
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

		this.routes.push(route);
		this.registerExpressRouter(route);
	}

	registerExpressRouter(route) {
		this.router[route.method](route.path, (request, response) => {
			(async () => {
				const apiContext = request.apiContext;
				try {
					apiContext.authInfo = request.authInfo;

					let routeFunc;
					try {
						routeFunc = require(route.getModulePath())[route.method];
					}
					catch (err) {
						console.log(err);
					}

					if (routeFunc == null) {
						throw new Error(`route function is not found\ntarget: ${route.method} ${route.path}`);
					}

					await routeFunc(apiContext);

					console.log(`rest: ${route.method.toUpperCase()} ${route.path}, status=${apiContext.statusCode}`);
					response.apiSend(apiContext);
				}
				catch (err) {
					if (err instanceof Error) {
						console.log('Internal Error:', err);
						apiContext.response(500, { message: 'internal error', details: err.message });
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

class Route {
	/**
	 * @param {string} method
	 * @param {string} path
	 */
	constructor(method, path) {
		if (method == null || path == null) {
			throw new MissingArgumentsError();
		}

		if (typeof method != 'string' || typeof path != 'string') {
			throw new Error('invalid type');
		}

		this.method = method;
		this.path = path;
	}

	getModulePath() {
		let modulePath = path.join(__dirname, '../routes', this.path.replace(/:/g, ''));

		if (/(\/$|^$)/.test(modulePath)) {
			modulePath += 'index';
		}

		modulePath = modulePath.replace(/\//g, path.sep);

		return modulePath;
	}

	getParams(endpoint) {
		const keys = [];
		const pathRegex = pathToRegexp(this.path, keys);
		const values = pathRegex.exec(endpoint);

		const params = [];
		for (let i = 0; i < keys.length; i++) {
			params[keys[i].name] = values[i + 1];
		}

		return params;
	}
}

module.exports = {
	DirectoryRouter,
	Route
};
