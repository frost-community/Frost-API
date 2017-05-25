'use strict';

const Application = require('./documentModels/application');
const ApplicationAccess = require('./documentModels/applicationAccess');
const ioServer = require('socket.io');
const redis = require('redis');
const methods = require('methods');

module.exports = (http, directoryRouter, subscribers, db, config) => {
	const ioServerToClient = ioServer(http);

	const checkAuthorization = async (clientManager, applicationKey, accessKey) => {
		if (applicationKey == null) {
			clientManager.stream('authorization', {success: false, message: 'applicationKey parameter is empty'});
			return null;
		}

		if (accessKey == null) {
			clientManager.stream('authorization', {success: false, message: 'accessKey parameter is empty'});
			return null;
		}

		if (!await Application.verifyKeyAsync(applicationKey, db, config)) {
			clientManager.stream('authorization', {success: false, message: 'applicationKey parameter is invalid'});
			return null;
		}

		if (!await ApplicationAccess.verifyKeyAsync(accessKey, db, config)) {
			clientManager.stream('authorization', {success: false, message: 'accessKey parameter is invalid'});
			return null;
		}

		clientManager.stream('authorization', {success: true, message: 'successful authorization'});
		return {
			applicationId: Application.splitKey(applicationKey, db, config).applicationId,
			userId: ApplicationAccess.splitKey(accessKey, db, config).userId
		};
	};

	const timelineTypes = ['public', 'home'];

	ioServerToClient.sockets.on('connection', ioServerToClientSocket => {
		(async () => {
			const clientManager = new (require('./helpers/server-streaming-manager'))(ioServerToClient, ioServerToClientSocket, {});

			const applicationKey = ioServerToClientSocket.handshake.query.applicationKey;
			const accessKey = ioServerToClientSocket.handshake.query.accessKey;
			const checkResult = await checkAuthorization(clientManager, applicationKey, accessKey);
			if (checkResult == null) {
				return clientManager.disconnect();
			}
			const userId = checkResult.userId;
			const applicationId = checkResult.applicationId;

			ioServerToClientSocket.application = (await db.applications.findByIdAsync(applicationId));
			ioServerToClientSocket.user = (await db.users.findByIdAsync(userId));

			// クライアント側からRESTリクエストを受信したとき
			clientManager.on('rest', data => {
				(async () => {
					const method = data.request.method.toLowerCase();
					const endpoint = data.request.endpoint;
					const query = data.request.query;
					const headers = data.request.headers;
					const body = data.request.body;

					if (method == null || endpoint == null) {
						return clientManager.stream('rest', {success: false, message: 'request format is invalid'});
					}

					if (endpoint.indexOf('..') != -1) {
						return clientManager.stream('rest', {success: false, message: '\'endpoint\' parameter is invalid'});
					}

					if (methods.find(i => i.toLowerCase() === method) == null) {
						return clientManager.stream('rest', {success: false, message: '\'method\' parameter is invalid'});
					}

					let routeFuncAsync;
					let params = [];
					try {
						const route = directoryRouter.findRoute(method, endpoint);
						routeFuncAsync = (require(route.getMoludePath()))[method];
						params = route.getParams(endpoint);
					}
					catch(e) {
						console.log('error: faild to parse route info');
						console.log('reason: ' + e);
					}

					if (routeFuncAsync == null) {
						return clientManager.stream('rest', {success: false, message: '\'endpoint\' parameter is invalid'});
					}

					const req = {
						method: method,
						endpoint: endpoint,
						query: query,
						params: params,
						headers: headers,
						body: body,
						db: db,
						config: config,
						user: ioServerToClientSocket.user,
						application: ioServerToClientSocket.application
					};

					require('./helpers/middlewares/checkRequest')(req);

					const apiResult = await routeFuncAsync(req);

					if (apiResult.statusCode == null) {
						apiResult.statusCode = 200;
					}

					let sendData;
					if (typeof apiResult.data == 'string') {
						sendData = {message: apiResult.data};
					}
					else if (apiResult.data != null) {
						sendData = apiResult.data;
					}
					else {
						sendData = {};
					}

					console.log(`streaming/rest: ${method} ${endpoint}, status=${apiResult.statusCode}`);
					return clientManager.stream('rest', {success: true, request: data.request, response: sendData, statusCode: apiResult.statusCode});
				})();
			});

			let publicSubscriber = null;
			let homeSubscriber = null;

			// クライアント側からタイムラインの購読リクエストを受信したとき
			clientManager.on('timeline-connect', data => {
				const timelineType = data.type;

				if (timelineType == null) {
					return clientManager.stream('timeline-connect', {success: false, message: '\'type\' parameter is require'});
				}

				if (!timelineTypes.some(i => i == timelineType)) {
					return clientManager.stream('timeline-connect', {success: false, message: '\'type\' parameter is invalid'});
				}

				// Redis: 購読状態の初期化
				if (timelineType == timelineTypes[0]) { // public
					if (publicSubscriber != null) {
						return clientManager.stream('timeline-connect', {success: false, message: 'public timeline is already subscribed'});
					}

					publicSubscriber = redis.createClient(6379, 'localhost');
					publicSubscriber.subscribe('public:status'); // パブリックを購読
					publicSubscriber.on('message', (ch, jsonData) => {
						const chInfo = ch.split(':');
						const dataType = chInfo[1];

						clientManager.data(`public:${dataType}`, JSON.parse(jsonData));
					});
					publicSubscriber.on('error', function(err) {
						console.log('redis_err(publicSubscriber): ' + String(err));
					});

					console.log('streaming/timeline-connect: public');
					clientManager.stream('timeline-connect', {success: true, message: 'connected public timeline'});
				}

				if (timelineType == timelineTypes[1]) { // home
					if (homeSubscriber != null) {
						return clientManager.stream('timeline-connect', {success: false, message: 'home timeline is already subscribed'});
					}

					homeSubscriber = redis.createClient(6379, 'localhost');
					subscribers.set(userId.toString(), homeSubscriber);
					homeSubscriber.subscribe(`${userId.toString()}:status`); // 自身を購読
					// subscriber.subscribe(`${}:status`); // TODO: フォローしている全ユーザーを購読
					homeSubscriber.on('message', (ch, jsonData) => {
						const chInfo = ch.split(':');
						const dataType = chInfo[1];

						clientManager.data(`home:${dataType}`, JSON.parse(jsonData));
					});
					homeSubscriber.on('error', function(err) {
						console.log('redis_err(homeSubscriber): ' + String(err));
					});

					console.log('streaming/timeline-connect: home');
					clientManager.stream('timeline-connect', {success: true, message: 'connected home timeline'});
				}
			});

			clientManager.on('timeline-disconnect', data => {
				const timelineType = data.type;

				if (timelineType == null) {
					return clientManager.stream('timeline-disconnect', {success: false, message: '\'type\' parameter is require'});
				}

				if (!timelineTypes.some(i => i == timelineType)) {
					return clientManager.stream('timeline-disconnect', {success: false, message: '\'type\' parameter is invalid'});
				}

				if (timelineType == timelineTypes[0]) {
					if (homeSubscriber != null)
						return clientManager.stream('timeline-disconnect', {success: false, message: 'public timeline is not subscribed'});

					publicSubscriber.quit([], () => {
						publicSubscriber = null;
						console.log('streaming/timeline-disconnect: public');
						clientManager.stream('timeline-disconnect', {success: true, message: 'disconnected public timeline'});
					});
				}

				if (timelineType == timelineTypes[1]) {
					if (homeSubscriber != null)
						return clientManager.stream('timeline-disconnect', {success: false, message: 'home timeline is not subscribed'});

					homeSubscriber.quit([], () => {
						homeSubscriber = null;
						console.log('streaming/timeline-disconnect: home');
						clientManager.stream('timeline-disconnect', {success: true, message: 'disconnected home timeline'});
					});
				}
			});

			clientManager.onDisconnect((err, res) => {
				if (homeSubscriber != null) {
					homeSubscriber.quit(() => {
						homeSubscriber = null;
					});
				}
				if (publicSubscriber != null) {
					publicSubscriber.quit((err, res) => {
						publicSubscriber = null;
					});
				}
			});
		})();
	});
};
