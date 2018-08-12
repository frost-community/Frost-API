const path = require('path');
//const ApiContext = require('./ApiContext');
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
		this.router.post(route.path, async (request, response) => {
			const apiContext = request.apiContext;
			try {
				apiContext.user = request.user;
				apiContext.authInfo = request.authInfo;

				let routeFunc;
				try {
					routeFunc = require(route.getModulePath())[route.getFuncName()];
				}
				catch (err) {
					console.log(err);
				}

				if (routeFunc == null) {
					throw new Error(`route function is not found\ntarget: ${route.path}`);
				}

				await routeFunc(apiContext);

				console.log(`http api: ${route.path}, status=${apiContext.statusCode}`);
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
		});
	}

	/**
	 * 該当するルートを取得します
	 *
	 * @param {string} endpoint
	 * @return {Route} Route instance
	 */
	findRoute(endpoint) {
		if (endpoint == null) {
			throw new MissingArgumentsError();
		}

		if (typeof endpoint != 'string') {
			throw new Error('invalid type');
		}

		return this.routes.find(i => pathToRegexp(i.path, []).test(endpoint));
	}
}

class Route {
	/**
	 * @param {string} path
	 */
	constructor(path) {
		if (path == null) {
			throw new MissingArgumentsError();
		}

		if (typeof path != 'string') {
			throw new Error('invalid type');
		}

		this.path = path;
	}

	getModulePath() {
		const segments = this.path.split('/');
		let modulePath = path.join(__dirname, '../routes', ...segments.slice(0, segments.length - 1));

		if (/(\/$|^$)/.test(modulePath)) {
			modulePath += 'index';
		}

		modulePath = modulePath.replace(/\//g, path.sep);

		return modulePath;
	}

	getFuncName() {
		const segments = this.path.split('/');

		return segments[segments.length - 1];
	}
}

module.exports = {
	DirectoryRouter,
	Route
};
