'use strict';

const Application = require('./documentModels/application');
const ApplicationAccess = require('./documentModels/applicationAccess');
const WebSocket = require('websocket');
const events = require('websocket-events');
const redis = require('redis');
const methods = require('methods');

module.exports = (http, directoryRouter, subscribers, db, config) => {
	const checkAuthorization = async (connection, applicationKey, accessKey) => {
		if (applicationKey == null) {
			const message = 'applicationKey parameter is empty';
			connection.send('authorization', {success: false, message: message});
			throw new Error(message);
		}

		if (accessKey == null) {
			const message = 'accessKey parameter is empty';
			connection.send('authorization', {success: false, message: message});
			throw new Error(message);
		}

		if (!await Application.verifyKeyAsync(applicationKey, db, config)) {
			const message = 'applicationKey parameter is invalid';
			connection.send('authorization', {success: false, message: message});
			throw new Error(message);
		}

		if (!await ApplicationAccess.verifyKeyAsync(accessKey, db, config)) {
			const message = 'accessKey parameter is invalid';
			connection.send('authorization', {success: false, message: message});
			throw new Error(message);
		}

		connection.send('authorization', {success: true, message: 'successful authorization'});
		return {
			applicationId: Application.splitKey(applicationKey, db, config).applicationId,
			userId: ApplicationAccess.splitKey(accessKey, db, config).userId
		};
	};

	const timelineTypes = ['public', 'home'];

	const server = new WebSocket.server({httpServer: http});
	server.on('request', request => {
		(async () => {
			const query = request.resourceURL.query;
			const applicationKey = query.application_key;
			const accessKey = query.access_key;

			const connection = request.accept();
			events(connection, {
				keys: {
					eventName: 'type',
					eventContent: 'data'
				}
			});

			connection.on('error', err => {
				console.log('streaming error:', err);
			});

			try {
				const {
					userId,
					applicationId
				} = await checkAuthorization(connection, applicationKey, accessKey);

				const [user, application] = await Promise.all([
					db.users.findByIdAsync(userId),
					db.applications.findByIdAsync(applicationId)
				]);

				connection.user = user;
				connection.application = application;

				// クライアント側からRESTリクエストを受信したとき
				connection.on('rest', data => {
					(async () => {
						const {
							method,
							endpoint,
							query,
							headers,
							body
						} = data.request;

						if (method == null || endpoint == null) {
							return connection.send('rest', {success: false, message: 'request format is invalid'});
						}

						if (endpoint.indexOf('..') != -1) {
							return connection.send('rest', {success: false, message: '\'endpoint\' parameter is invalid'});
						}

						if (methods.find(i => i.toLowerCase() === method.toLowerCase()) == null) {
							return connection.send('rest', {success: false, message: '\'method\' parameter is invalid'});
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
							return connection.send('rest', {success: false, message: '\'endpoint\' parameter is invalid'});
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
							user: connection.user,
							application: connection.application
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
						return connection.send('rest', {success: true, request: data.request, response: sendData, statusCode: apiResult.statusCode});
					})();
				});

				let publicSubscriber = null;
				let homeSubscriber = null;

				// クライアント側からタイムラインの購読リクエストを受信したとき
				connection.on('timeline-connect', data => {
					const timelineType = data.type;

					if (timelineType == null) {
						return connection.send('timeline-connect', {success: false, message: '\'type\' parameter is require'});
					}

					if (!timelineTypes.some(i => i == timelineType)) {
						return connection.send('timeline-connect', {success: false, message: '\'type\' parameter is invalid'});
					}

					// Redis: 購読状態の初期化
					if (timelineType == timelineTypes[0]) { // public
						if (publicSubscriber != null) {
							return connection.send('timeline-connect', {success: false, message: 'public timeline is already subscribed'});
						}

						publicSubscriber = redis.createClient(6379, 'localhost');
						publicSubscriber.subscribe('public:status'); // パブリックを購読
						publicSubscriber.on('message', (ch, jsonData) => {
							const chInfo = ch.split(':');
							const dataType = chInfo[1];

							connection.send(`data:public:${dataType}`, JSON.parse(jsonData));
						});
						publicSubscriber.on('error', function(err) {
							console.log('redis_err(publicSubscriber): ' + String(err));
						});

						console.log('streaming/timeline-connect: public');
						connection.send('timeline-connect', {success: true, message: 'connected public timeline'});
					}

					if (timelineType == timelineTypes[1]) { // home
						if (homeSubscriber != null) {
							return connection.send('timeline-connect', {success: false, message: 'home timeline is already subscribed'});
						}

						homeSubscriber = redis.createClient(6379, 'localhost');
						subscribers.set(userId.toString(), homeSubscriber);
						homeSubscriber.subscribe(`${userId.toString()}:status`); // 自身を購読
						// subscriber.subscribe(`${}:status`); // TODO: フォローしている全ユーザーを購読
						homeSubscriber.on('message', (ch, jsonData) => {
							const chInfo = ch.split(':');
							const dataType = chInfo[1];

							connection.send(`data:home:${dataType}`, JSON.parse(jsonData));
						});
						homeSubscriber.on('error', function(err) {
							console.log('redis_err(homeSubscriber): ' + String(err));
						});

						console.log('streaming/timeline-connect: home');
						connection.send('timeline-connect', {success: true, message: 'connected home timeline'});
					}
				});

				connection.on('timeline-disconnect', data => {
					const timelineType = data.type;

					if (timelineType == null) {
						return connection.send('timeline-disconnect', {success: false, message: '\'type\' parameter is require'});
					}

					if (!timelineTypes.some(i => i == timelineType)) {
						return connection.send('timeline-disconnect', {success: false, message: '\'type\' parameter is invalid'});
					}

					if (timelineType == timelineTypes[0]) {
						if (homeSubscriber != null)
							return connection.send('timeline-disconnect', {success: false, message: 'public timeline is not subscribed'});

						publicSubscriber.quit([], () => {
							publicSubscriber = null;
							console.log('streaming/timeline-disconnect: public');
							connection.send('timeline-disconnect', {success: true, message: 'disconnected public timeline'});
						});
					}

					if (timelineType == timelineTypes[1]) {
						if (homeSubscriber != null)
							return connection.send('timeline-disconnect', {success: false, message: 'home timeline is not subscribed'});

						homeSubscriber.quit([], () => {
							homeSubscriber = null;
							console.log('streaming/timeline-disconnect: home');
							connection.send('timeline-disconnect', {success: true, message: 'disconnected home timeline'});
						});
					}
				});

				connection.on('close', (reasonCode, description) => {
					console.log('streaming close:', reasonCode, description);

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
			}
			catch(err) {
				return connection.close();
			}
		})();
	});
};
