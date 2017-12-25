const UserFollowing = require('./documentModels/userFollowing');
const WebSocket = require('websocket');
const events = require('websocket-events');
const { checkRequest } = require('./helpers/StreamingHelpers');
const { Stream, StreamUtil } = require('./helpers/stream');
const methods = require('methods');
const ApiContext = require('./helpers/ApiContext');

/*
# 各種変数の説明
streamType: 'user-timeline-status' | 'home-timeline-status' | 'general-timeline-status'
streamPublisher: ストリームの発行者情報
streamId : StreamUtil.buildStreamId(streamType, streamPublisher) ストリームの識別子
streams: Map<streamId, Stream> 全てのストリーム一覧
connectedStreamIds: streamId[] 接続済みのストリーム名一覧

# streamIdの例
general-timeline-status:general generalに向けて流されたポストを受信可能なStreamです
home-timeline-status:(userId) そのユーザーのホームTLに向けて流されたポストを受信可能なStreamです
*/

module.exports = (http, directoryRouter, streams, db, config) => {
	const server = new WebSocket.server({ httpServer: http });

	// generate stream for general timeline (global)
	const generalTimelineStream = new Stream();
	const generalTimelineStreamType = 'general-timeline-status';
	const generalTimelineStreamId = StreamUtil.buildStreamId(generalTimelineStreamType, 'general');
	generalTimelineStream.addSource(generalTimelineStreamId);
	streams.set(generalTimelineStreamId, generalTimelineStream);

	server.on('request', async request => {
		// verification
		let verification;
		try {
			verification = await checkRequest(request, db, config);
		}
		catch (err) {
			console.log('streaming verification error:', err);
			return;
		}
		const { meId, applicationKey, accessKey } = verification;

		const connection = request.accept();

		connection.on('error', err => {
			console.log('streaming error:', err);
		});

		// support user events
		events(connection, {
			keys: { eventName: 'type', eventContent: 'data' }, debug: true
		});

		// 接続されているストリームIDの一覧
		const connectedStreamIds = [];
		const connectedStreamHandlers = new Map();

		// ストリームの購読解除メソッド
		const disconnectStream = (streamId) => {
			const removeIndex = connectedStreamIds.indexOf(streamId);
			connectedStreamIds.splice(removeIndex, 1);

			let stream = streams.get(streamId);
			if (stream != null) {
				const streamHandler = connectedStreamHandlers.get(streamId);
				if (streamHandler != null) {
					stream.removeListener(streamHandler);
					connectedStreamHandlers.delete(streamId);
				}

				const { streamType } = StreamUtil.parseStreamId(streamId);
				if (streamType == 'general-timeline-status') {
					return;
				}

				stream.quitAsync();
				streams.delete(streamId);
			}
		};

		// イベントのエラー返却メソッド
		const error = (eventName, message) => {
			connection.send(eventName, { success: false, message });
		};

		connection.on('close', (reasonCode, description) => {
			// 全ての接続済みストリームを購読解除
			for (const streamId of connectedStreamIds) {
				disconnectStream(streamId);
			}
			console.log(`disconnected streaming. user: ${meId}`);
		});

		// クライアント側からRESTリクエストを受信したとき
		connection.on('rest', async data => {
			try {
				if (data == null) {
					return error('rest', 'request format is invalid');
				}

				let {
					method,
					endpoint,
					query,
					headers,
					body
				} = data;

				// パラメータを検証
				if (method == null || endpoint == null) {
					return error('rest', 'request format is invalid');
				}

				if (methods.indexOf(method.toLowerCase()) == -1) {
					return error('rest', '"method" parameter is invalid');
				}

				// endpointを整形
				if (endpoint == '') {
					endpoint = '/';
				}
				else if (endpoint != '/' && endpoint[endpoint.length - 1] == '/') {
					endpoint = endpoint.substr(0, endpoint.length - 1);
				}

				// 対象Routeのモジュールを取得
				let routeFuncAsync;
				let params = [];

				try {
					const route = directoryRouter.findRoute(method, endpoint);
					if (route != null) {
						routeFuncAsync = (require(route.getModulePath()))[method];
						params = route.getParams(endpoint);
					}
				}
				catch (err) {
					console.log('error: failed to parse route info.', 'reason:', err);
				}

				if (routeFuncAsync == null) {
					return error('rest', '"endpoint" parameter is invalid');
				}

				// ApiContextを構築
				const apiContext = new ApiContext(streams, null, db, config, {
					params,
					query,
					body,
					headers
				});
				apiContext.headers['x-application-key'] = applicationKey;
				apiContext.headers['x-access-key'] = accessKey;

				// 対象のRouteモジュールを実行
				await routeFuncAsync(apiContext);

				if (!apiContext.responsed) {
					return apiContext.response(500, 'not responsed');
				}

				console.log(`streaming/rest: ${method} ${endpoint}, status=${apiContext.statusCode}`);

				let response;
				if (typeof apiContext.data == 'string') {
					response = { message: apiContext.data };
				}
				else {
					response = (apiContext.data != null) ? apiContext.data : {};
				}

				return connection.send('rest', { success: true, statusCode: apiContext.statusCode, request: { method, endpoint, query, headers, body }, response });
			}
			catch (err) {
				console.log(err);
				error('rest', 'server error');
			}
		});

		// クライアント側から通知の購読リクエストを受信したとき
		connection.on('notification-connect', async data => {
			try {
				return error('notification-connect', 'comming soon'); // TODO
			}
			catch (err) {
				console.log(err);
				error('notification-connect', 'server error');
			}
		});

		// クライアント側からタイムラインの購読リクエストを受信したとき
		connection.on('timeline-connect', async (data) => {
			try {
				const timelineType = data.type;

				if (timelineType == null) {
					return error('timeline-connect', '"type" parameter is require');
				}

				// ストリームの取得または構築
				let stream, streamType, streamId;
				if (timelineType == 'general') {
					streamType = generalTimelineStreamType;
					streamId = generalTimelineStreamId;

					// 既に接続済みなら中断
					if (connectedStreamIds.indexOf(streamId) != -1) {
						return error('timeline-connect', `${timelineType} timeline stream is already connected`);
					}

					stream = generalTimelineStream;
				}
				else if (timelineType == 'home') {
					// memo: フォローユーザーのuser-timeline-statusストリームを統合したhome-timeline-statusストリームを生成
					streamType = 'home-timeline-status';
					streamId = StreamUtil.buildStreamId(streamType, meId);

					// 既に接続済みなら中断
					if (connectedStreamIds.indexOf(streamId) != -1) {
						return error('timeline-connect', `${timelineType} timeline stream is already connected`);
					}

					// ストリームを生成
					stream = new Stream();
					stream.addSource(StreamUtil.buildStreamId('user-timeline-status', meId));
					const followings = await UserFollowing.findTargetsAsync(meId, null, db, config); // TODO: (全て or ユーザーの購読設定によっては選択的に)
					for (const following of followings || []) {
						const followingUserId = following.document.target.toString();
						stream.addSource(StreamUtil.buildStreamId('user-timeline-status', followingUserId));
					}

					streams.set(streamId, stream);
				}
				else {
					return error('timeline-connect', `timeline type "${timelineType}" is invalid`);
				}

				// ストリームからのデータをwebsocketに流す
				const streamHandler = data => {
					if (connection.connected) {
						console.log(`streaming/stream:${streamType}`, { streamId, resource: data });
						connection.send(`stream:${streamType}`, { streamId, resource: data });
					}
				};
				stream.addListener(streamHandler);
				connectedStreamHandlers.set(streamId, streamHandler);

				// connectedStreamIdsに追加
				connectedStreamIds.push(streamId);

				console.log('streaming/timeline-connect:', timelineType);
				connection.send('timeline-connect', { success: true, message: `connected ${timelineType} timeline` });
			}
			catch (err) {
				console.log(err);
				error('timeline-disconnect', 'server error');
			}
		});

		connection.on('timeline-disconnect', data => {
			try {
				const timelineType = data.type;

				if (timelineType == null) {
					return error('timeline-disconnect', '"type" parameter is require');
				}

				// 対象タイムラインのストリームを取得
				let streamId;
				if (timelineType == 'general') {
					streamId = generalTimelineStreamId;
				}
				else if (timelineType == 'home') {
					streamId = StreamUtil.buildStreamId('home-timeline-status', meId);
				}
				else {
					return error('timeline-disconnect', `timeline type "${timelineType}" is invalid`);
				}

				disconnectStream(streamId);
				console.log('streaming/timeline-disconnect:', streamId);
				connection.send('timeline-disconnect', { success: true, message: `disconnected ${timelineType} timeline` });
			}
			catch (err) {
				console.log(err);
				error('timeline-disconnect', 'server error');
			}
		});

		connection.on('default', (eventData) => {
			error('default', 'invalid event name');
		});

		console.log(`connected streaming. user: ${meId}`);
	});

	console.log('streaming server is ready.');
};
