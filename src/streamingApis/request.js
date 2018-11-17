const sanitize = require('mongo-sanitize');
const ApiContext = require('./modules/ApiContext');

module.exports = (connection, directoryRouter) => {

	/**
	 * @param {any} reqData
	*/
	async function receivedRequest(reqData) {
		try {
			if (reqData == null) {
				return connection.error('request', 'request format is invalid');
			}

			let {
				endpoint,
				body
			} = reqData;

			// パラメータを検証
			if (endpoint == null) {
				return connection.error('request', 'request format is invalid');
			}

			// endpointを整形
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
				console.error('streaming/request:', 'failed to parse route info.');
				console.error(err);
			}

			if (routeFunc == null) {
				return connection.error('request', '"endpoint" parameter is invalid');
			}

			body = sanitize(body);

			// ApiContextを構築
			const apiContext = new ApiContext(repository, config, {
				body: body,
				user: connection.user,
				authInfo: connection.authInfo
			});

			// 対象のRouteモジュールを実行
			await routeFunc(apiContext);

			if (!apiContext.responsed) {
				return apiContext.response(500, 'not responsed');
			}

			console.log('streaming/request:', `${endpoint}, status=${apiContext.statusCode}, from=${connection.user._id}`);

			let response;
			if (typeof apiContext.data == 'string') {
				response = { message: apiContext.data };
			}
			else {
				response = (apiContext.data != null) ? apiContext.data : {};
			}

			if (connection.connected) {
				return connection.send('request', {
					success: true,
					statusCode: apiContext.statusCode,
					request: { endpoint, body },
					response
				});
			}
		}
		catch (err) {
			console.error('streaming/request:', err);
			connection.error('request', 'server error');
		}
	}

	// クライアント側からrequestを受信したとき
	connection.on('request', (reqData) => receivedRequest(connection, reqData));
};
