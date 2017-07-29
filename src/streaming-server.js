'use strict';

const Application = require('./documentModels/application');
const ApplicationAccess = require('./documentModels/applicationAccess');
const UserFollowing = require('./documentModels/userFollowing');
const WebSocket = require('websocket');
const events = require('websocket-events');
const redis = require('redis');
const methods = require('methods');

module.exports = (http, directoryRouter, subscribers, db, config) => {
	const authorize = async (connection, applicationKey, accessKey) => {
		if (applicationKey == null) {
			const message = 'application_key parameter is empty';
			connection.send('authorization', {success: false, message: message});
			throw new Error(message);
		}

		if (accessKey == null) {
			const message = 'access_key parameter is empty';
			connection.send('authorization', {success: false, message: message});
			throw new Error(message);
		}

		if (!await Application.verifyKeyAsync(applicationKey, db, config)) {
			const message = 'application_key parameter is invalid';
			connection.send('authorization', {success: false, message: message});
			throw new Error(message);
		}

		if (!await ApplicationAccess.verifyKeyAsync(accessKey, db, config)) {
			const message = 'access_key parameter is invalid';
			connection.send('authorization', {success: false, message: message});
			throw new Error(message);
		}

		connection.send('authorization', {success: true, message: 'successful authorization'});
		return {
			applicationId: Application.splitKey(applicationKey, db, config).applicationId,
			meId: ApplicationAccess.splitKey(accessKey, db, config).userId
		};
	};

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
					meId,
					applicationId
				} = await authorize(connection, applicationKey, accessKey);

				[connection.user, connection.application] = await Promise.all([
					db.users.findByIdAsync(meId),
					db.applications.findByIdAsync(applicationId)
				]);

				// クライアント側からRESTリクエストを受信したとき
				connection.on('rest', data => {
					(async () => {
						let {
							method,
							endpoint,
							query,
							headers,
							body
						} = data.request;

						query = query || {};
						headers = headers || {};
						body = body || {};

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
							if (route != null) {
								routeFuncAsync = (require(route.getModulePath()))[method];
								params = route.getParams(endpoint);
							}
						}
						catch(err) {
							console.log('error: failed to parse route info.', 'reason:', err);
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
							application: connection.application,
							subscribers: subscribers
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

				const timelineTypes = ['general', 'home'];
				const timelineSubscribers = new Map();

				// クライアント側からタイムラインの購読リクエストを受信したとき
				connection.on('timeline-connect', data => {
					(async () => {
						const timelineType = data.type;

						if (timelineType == null) {
							return connection.send('timeline-connect', {success: false, message: '\'type\' parameter is require'});
						}

						if (!timelineTypes.some(i => i == timelineType)) {
							return connection.send('timeline-connect', {success: false, message: '\'type\' parameter is invalid'});
						}

						// タイムラインの購読(Redis subscribe)

						if (timelineSubscribers.get(timelineType) != null) {
							return connection.send('timeline-connect', {success: false, message: `${timelineType} timeline is already subscribed`});
						}

						const timelineSubscriber = redis.createClient(6379, 'localhost');

						let timelineId;
						if (timelineType == timelineTypes[0]) {
							timelineId = 'general';

							timelineSubscriber.subscribe(`${timelineId}:status`); // generalチャンネルを購読
						}
						else if (timelineType == timelineTypes[1]) {
							timelineId = meId.toString();

							timelineSubscriber.subscribe(`${timelineId}:status`); // 自身のチャンネルを購読
							const followings = await UserFollowing.findTargetsAsync(meId, null, db, config); // フォローしているユーザーを購読 // TODO: (全て or ユーザーの購読設定によっては選択的に)
							if (followings != null) {
								for (const following of followings) {
									timelineSubscriber.subscribe(`${following.document.target.toString()}:status`);
								}
							}
						}
						else {
							// TODO: 未定義のtimelineTypeに対するエラー
						}

						// 購読対象からのメッセージをストリーミングに流す
						timelineSubscriber.on('message', (ch, jsonData) => {
							const chInfo = ch.split(':');
							const dataType = chInfo[1];

							connection.send(`data:${timelineType}:${dataType}`, JSON.parse(jsonData));
						});

						timelineSubscriber.on('error', function(err) {
							console.log(`redis_err(timelineSubscriber ${timelineType}): ` + String(err));
						});

						subscribers.set(timelineId, timelineSubscriber);
						timelineSubscribers.set(timelineId, timelineSubscriber);

						console.log(`streaming/timeline-connect: ${timelineType}`);
						connection.send('timeline-connect', {success: true, message: `connected ${timelineType} timeline`});
					})();
				});

				connection.on('timeline-disconnect', data => {
					const timelineType = data.type;

					if (timelineType == null) {
						return connection.send('timeline-disconnect', {success: false, message: '\'type\' parameter is require'});
					}

					if (!timelineTypes.some(i => i == timelineType)) {
						return connection.send('timeline-disconnect', {success: false, message: '\'type\' parameter is invalid'});
					}

					const timelineSubscriber = timelineSubscribers.get(timelineType);

					if (timelineSubscriber != null) {
						return connection.send('timeline-disconnect', {success: false, message: `${timelineType} timeline is not subscribed`});
					}

					timelineSubscriber.quit([], () => {
						timelineSubscribers.delete(timelineType);
						console.log(`streaming/timeline-disconnect: ${timelineType}`);
						connection.send('timeline-disconnect', {success: true, message: `disconnected ${timelineType} timeline`});
					});
				});

				connection.on('close', (reasonCode, description) => {
					// console.log('streaming close:', reasonCode, description);

					for (const timelineType of timelineSubscribers.keys()) {
						const timelineSubscriber = timelineSubscribers.get(timelineType);
						if (timelineSubscriber != null) {
							timelineSubscriber.quit((err, res) => {
								timelineSubscribers.delete(timelineType);
							});
						}
					}
				});
			}
			catch(err) {
				console.log('streaming error:');
				console.dir(err);
				return connection.close();
			}
		})();
	});
};
