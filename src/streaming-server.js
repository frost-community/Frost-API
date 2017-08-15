'use strict';

const UserFollowing = require('./documentModels/userFollowing');
const WebSocket = require('websocket');
const events = require('websocket-events');
const checkStreamingRequestAsync = require('./helpers/checkStreamingRequestAsync');
const { Stream } = require('./helpers/stream');
const methods = require('methods');
const checkRequest = require('./helpers/middlewares/checkRequest');

module.exports = (http, directoryRouter, streams, db, config) => {
	const server = new WebSocket.server({httpServer: http});

	server.on('request', request => {
		(async () => {
			const query = request.resourceURL.query;
			const applicationKey = query.application_key;
			const accessKey = query.access_key;

			// authorization
			let result;
			try {
				result = await checkStreamingRequestAsync(request, applicationKey, accessKey, db, config);
			}
			catch(err) {
				console.log('streaming authorization error:', err.message);
				return;
			}
			const { connection, meId, applicationId } = result;

			// support user events
			events(connection, {
				keys: {
					eventName: 'type',
					eventContent: 'data'
				}
			});

			const timelineStreamTypes = ['general', 'home'];
			const timelineStreams = new Map(); // memo: keyはtimelineStreamTypes

			connection.on('error', err => {
				console.log('streaming error:', err);
			});

			connection.on('close', (reasonCode, description) => {
				for (const timelineStreamType of timelineStreams.keys()) {
					const stream = timelineStreams.get(timelineStreamType);
					if (stream != null) {
						stream.quitAsync();
						timelineStreams.delete(timelineStreamType);
						streams.delete(stream.getChannelName(meId));
					}
				}

				// console.log('streaming close:', reasonCode, description);
			});

			try {
				[connection.user, connection.application] = await Promise.all([
					db.users.findByIdAsync(meId),
					db.applications.findByIdAsync(applicationId)
				]);

				// クライアント側からRESTリクエストを受信したとき
				connection.on('rest', data => {
					(async () => {
						if (data.request == null) {
							return connection.send('rest', {success: false, message: 'request format is invalid'});
						}
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
							return connection.send('rest', {success: false, message: '"endpoint" parameter is invalid'});
						}

						if (methods.find(i => i.toLowerCase() === method.toLowerCase()) == null) {
							return connection.send('rest', {success: false, message: '"method" parameter is invalid'});
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
							return connection.send('rest', {success: false, message: '"endpoint" parameter is invalid'});
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
							streams: streams
						};

						checkRequest(req);

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

				connection.on('notification-connect', data => {
					(async () => {
						return connection.send('timeline-connect', {success: false, message: 'comming soon'}); // TODO
					})();
				});

				// クライアント側からタイムラインの購読リクエストを受信したとき
				connection.on('timeline-connect', data => {
					(async () => {
						const timelineStreamType = data.type;

						if (timelineStreamType == null) {
							return connection.send('timeline-connect', {success: false, message: '"type" parameter is require'});
						}

						if (!timelineStreamTypes.some(i => i == timelineStreamType)) {
							return connection.send('timeline-connect', {success: false, message: '"type" parameter is invalid'});
						}

						// タイムラインのストリーム構築

						if (timelineStreams.get(timelineStreamType) != null) {
							return connection.send('timeline-connect', {success: false, message: `${timelineStreamType} timeline is already subscribed`});
						}

						let stream;
						if (timelineStreamType == timelineStreamTypes[0]) {
							stream = new Stream('general-timeline-status');
							stream.addSource('general');
						}
						else if (timelineStreamType == timelineStreamTypes[1]) {
							stream = new Stream('home-timeline-status');
							stream.addSource(meId);

							const followings = await UserFollowing.findTargetsAsync(meId, null, db, config); // TODO: (全て or ユーザーの購読設定によっては選択的に)
							for (const following of followings || []) {
								const followingUserId = following.document.target.toString();
								stream.addSource(followingUserId);
							}
						}
						else {
							return connection.send('timeline-connect', {success: false, message: `timeline type "${timelineStreamType}" is invalid`});
						}

						// データをwebsocketに流す
						stream.on('data', (jsonData) => {
							connection.send(`data:${stream.type}`, JSON.parse(jsonData));
						});

						streams.set(stream.getChannelName(meId), stream);
						timelineStreams.set(timelineStreamType, stream);

						console.log(`streaming/timeline-connect: ${timelineStreamType}`);
						connection.send('timeline-connect', {success: true, message: `connected ${timelineStreamType} timeline`});
					})();
				});

				connection.on('timeline-disconnect', data => {
					const timelineStreamType = data.type;

					if (timelineStreamType == null) {
						return connection.send('timeline-disconnect', {success: false, message: '"type" parameter is require'});
					}

					if (!timelineStreamTypes.some(i => i == timelineStreamType)) {
						return connection.send('timeline-disconnect', {success: false, message: '"type" parameter is invalid'});
					}

					const stream = timelineStreams.get(timelineStreamType);

					if (stream != null) {
						return connection.send('timeline-disconnect', {success: false, message: `${timelineStreamType} timeline is not subscribed`});
					}

					stream.quitAsync();
					timelineStreams.delete(timelineStreamType);
					streams.delete(stream.getChannelName(meId));
					console.log(`streaming/timeline-disconnect: ${timelineStreamType}`);
					connection.send('timeline-disconnect', {success: true, message: `disconnected ${timelineStreamType} timeline`});
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
