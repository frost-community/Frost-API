const $ = require('cafy').default;
const sanitize = require('mongo-sanitize');
const ApiContext = require('../modules/ApiContext');

module.exports = (connection, directoryRouter, repository, config) => {

	/**
	 * @param {any} reqData
	*/
	async function receivedRequest(reqData) {
		try {
			if ($().object().nok(reqData)) {
				return connection.error('request', 'invalid data');
			}

			let {
				id,
				endpoint,
				params,
			} = reqData;

			// param: id

			if ($().optional.or($().string(), $().number()).nok(id)) {
				return connection.error('request', 'invalid property', { propertyName: 'id' });
			}

			// param: endpoint

			if ($().string().nok(endpoint)) {
				return connection.error('request', 'invalid property', { propertyName: 'endpoint' });
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
				return connection.error('request', 'invalid property', { propertyName: 'endpoint' });
			}

			// param: params

			if ($().optional.object().nok(params)) {
				return connection.error('request', 'invalid property', { propertyName: 'params' });
			}
			params = sanitize(params || {});

			// ApiContextを構築
			const apiContext = new ApiContext(repository, config, {
				params: params,
				user: connection.user,
				authInfo: connection.authInfo
			});

			// 対象のRouteモジュールを実行
			await routeFunc(apiContext);

			if (!apiContext.responsed) {
				return apiContext.response(500, 'not responsed');
			}

			console.log('(streaming)request:', `${endpoint}, status=${apiContext.statusCode}, from=${connection.user._id}`);

			let response;
			if (typeof apiContext.data == 'string') {
				response = { message: apiContext.data };
			}
			else {
				response = (apiContext.data != null) ? apiContext.data : {};
			}

			if (connection.connected) {
				return connection.send('request', {
					id: id,
					success: true,
					statusCode: apiContext.statusCode,
					resource: response
				});
			}
		}
		catch (err) {
			console.error('(streaming)request:', err);
			connection.error('request', 'server error');
		}
	}

	// クライアント側からrequestを受信したとき
	connection.on('request', (reqData) => receivedRequest(reqData));
};
