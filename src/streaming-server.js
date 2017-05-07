const Application = require('./documentModels/application');
const ApplicationAccess = require('./documentModels/applicationAccess');
const Route = require('./helpers/route');
const ioServer = require('socket.io');
const redis = require('redis');

module.exports = (http, subscribers, db, config) => {
	const ioServerWeb = ioServer(http);

	ioServerWeb.sockets.on('connection', ioServerWebSocket => {
		(async () => {
			const clientManager = new (require('./helpers/server-streaming-manager'))(ioServerWeb, ioServerWebSocket, {});
			const subscriber = redis.createClient(6379, 'localhost');

			const applicationKey = ioServerWebSocket.handshake.query.applicationKey;
			const accessKey = ioServerWebSocket.handshake.query.accessKey;

			if (applicationKey == null) {
				clientManager.error({message: 'applicationKey parameter is empty'});
				return ioServerWebSocket.disconnect();
			}

			if (accessKey == null) {
				clientManager.error({message: 'accessKey parameter is empty'});
				return ioServerWebSocket.disconnect();
			}

			if (!await Application.verifyKeyAsync(applicationKey, db, config)) {
				clientManager.error({message: 'applicationKey parameter is invalid'});
				return ioServerWebSocket.disconnect();
			}

			if (!await ApplicationAccess.verifyKeyAsync(accessKey, db, config)) {
				clientManager.error({message: 'accessKey parameter is invalid'});
				return ioServerWebSocket.disconnect();
			}

			const applicationId = Application.splitKey(applicationKey, db, config).applicationId;
			const userId = ApplicationAccess.splitKey(accessKey, db, config).userId;

			ioServerWebSocket.application = (await db.applications.findByIdAsync(applicationId));
			ioServerWebSocket.user = (await db.users.findByIdAsync(userId));

			// subscribersに登録
			subscribers.set(userId.toString(), subscriber);

			// redis: 購読状態の初期化
			subscriber.subscribe(userId.toString()); // 自身を購読

			// TODO: フォローしている全ユーザーを購読

			// クライアント側からRESTリクエストを受信したとき
			clientManager.on('rest', data => {
				(async () => {
					if (data.request.method == null || data.request.endpoint == null) {
						return clientManager.error({message: 'invalid request format'});
					}

					if (data.request.endpoint.indexOf('..') != -1)
						return clientManager.error({message: 'invalid endpoint'});

					const method = require('methods').find(i => i.toLowerCase() === data.request.method.toLowerCase()).toLowerCase();

					if (method == null)
						return clientManager.error({message: 'invalid method name'});

					let routeFuncAsync;
					try {
						routeFuncAsync = (require(new Route(data.request.method, data.request.endpoint).getMoludePath()))[method];
					}
					catch(e) {
						// noop
					}

					if (routeFuncAsync == null)
						return clientManager.error({message: 'invalid endpoint'});

					const req = {
						method: data.request.method,
						endpoint: data.request.endpoint,
						query: data.request.query,
						headers: data.request.headers,
						body: data.request.body,
						db: db,
						config: config,
						user: ioServerWebSocket.user,
						application: ioServerWebSocket.application
					};

					require('./helpers/middlewares/checkRequest')(req);

					const apiResult = await routeFuncAsync(req);

					let sendData = {};

					if (apiResult.statusCode == null)
						apiResult.statusCode = 200;

					if (typeof apiResult.data == 'string')
						sendData.message = apiResult.data;
					else if (apiResult.data != null)
						sendData = apiResult.data;

					if (apiResult.statusCode >= 400)
						return clientManager.rest(data.request, false, sendData);

					return clientManager.rest(data.request, true, sendData);
				})();
			});

			clientManager.onDisconnect(() => {});
		})();
	});
};
