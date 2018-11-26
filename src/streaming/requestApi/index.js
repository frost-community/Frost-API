const $ = require('cafy').default;
const sanitize = require('mongo-sanitize');
const ApiContext = require('../../modules/ApiContext');
const StreamingContext = require('../modules/StreamingContext');

module.exports = (directoryRouter, repository, config) => {

	function handle(connection) {

		/**
		 * @param {StreamingContext} ctx
		*/
		async function apiHandler(ctx) {
			if ($().object().nok(ctx.reqData)) {
				return ctx.error('invalid data');
			}

			let {
				id,
				endpoint,
				params,
			} = ctx.reqData;

			// param: id

			if ($().or($().string(), $().number()).nok(id)) {
				return ctx.error('invalid property', { propertyName: 'id' });
			}

			// param: endpoint

			if ($().string().nok(endpoint)) {
				return ctx.error('invalid property', { propertyName: 'endpoint' });
			}
			if (endpoint == '') {
				endpoint = '/';
			}
			else if (endpoint != '/' && endpoint[endpoint.length - 1] == '/') {
				endpoint = endpoint.substr(0, endpoint.length - 1);
			}

			// 対象Routeのモジュールを取得
			let routeFunc;
			try {
				const route = directoryRouter.findRoute(endpoint);
				if (route != null) {
					routeFunc = (require(route.getModulePath()))[route.getFuncName()];
				}
			}
			catch (err) {
				console.error('(streaming)request:', 'failed to parse route info.');
				console.error(err);
			}
			if (routeFunc == null) {
				return ctx.error('invalid property', { propertyName: 'endpoint' });
			}

			// param: params

			if ($().optional.object().nok(params)) {
				return ctx.error('invalid property', { propertyName: 'params' });
			}
			params = sanitize(params || {});

			// ApiContextを構築
			const apiContext = new ApiContext(repository, config, {
				params: params,
				user: ctx.connection.user,
				authInfo: ctx.connection.authInfo
			});

			// 対象のRouteモジュールを実行
			await routeFunc(apiContext);

			if (!apiContext.responsed) {
				throw new Error('not responsed');
			}

			console.log(`(streaming)${ctx.eventName}: ${endpoint}, status=${apiContext.statusCode}, from=${ctx.connection.user._id}`);

			let response;
			if (typeof apiContext.data == 'string') {
				response = { message: apiContext.data };
			}
			else {
				response = (apiContext.data != null) ? apiContext.data : {};
			}

			if (ctx.connection.connected) {
				return ctx.send({
					id: id,
					success: true,
					statusCode: apiContext.statusCode,
					resource: response
				});
			}
		}

		// Streaming API: request
		connection.on('request', async (reqData) => {
			const ctx = new StreamingContext('request', connection, reqData);
			try {
				await apiHandler(ctx);
			}
			catch (err) {
				ctx.error('server error');
				console.error(err);
			}
		});
	}

	return { handle };
};
