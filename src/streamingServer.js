const WebSocket = require('websocket');
const events = require('websocket-events');
const MongoAdapter = require('./modules/MongoAdapter');
const { Stream, StreamUtil } = require('./modules/stream');
const methods = require('methods');
const ApiContext = require('./modules/ApiContext');
const TokensService = require('./services/TokensService');
const UserFollowingsService = require('./services/UserFollowingsService');
const sanitize = require('mongo-sanitize');

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

/**
 * @param {Map<string, Stream>} streams
 * @param {MongoAdapter} repository
*/
module.exports = (http, directoryRouter, streams, repository, config) => {
	const server = new WebSocket.server({ httpServer: http });

	// generate stream for general timeline (global)
	const generalTLStream = new Stream();
	const generalTLStreamType = 'general-timeline-status';
	const generalTLStreamId = StreamUtil.buildStreamId(generalTLStreamType, 'general');
	generalTLStream.addSource(generalTLStreamId);
	streams.set(generalTLStreamId, generalTLStream);

	const tokensService = new TokensService(repository, config);
	const userFollowingsService = new UserFollowingsService(repository, config);

	// ストリームの購読解除メソッド
	const disconnectStream = async (connection, streamId) => {
		const removeIndex = connection.connectedStreamIds.indexOf(streamId);
		connection.connectedStreamIds.splice(removeIndex, 1);

		let stream = streams.get(streamId);
		if (stream != null) {
			const streamHandler = connection.connectedStreamHandlers.get(streamId);
			if (streamHandler != null) {
				stream.removeListener(streamHandler);
				connection.connectedStreamHandlers.delete(streamId);
			}

			// general-timeline-statusはストリーム自体の解放は行わない
			const { streamType } = StreamUtil.parseStreamId(streamId);
			if (streamType == 'general-timeline-status') {
				return;
			}

			// リスナが1つもなければストリーム自体を解放
			if (stream.listenerCount() == 0) {
				await stream.quit();
				streams.delete(streamId);
			}
		}
	};

	const receivedRest = async (connection, request) => {
		try {
			if (request == null) {
				return connection.error('rest', 'request format is invalid');
			}

			let {
				method,
				endpoint,
				query,
				body
			} = request;

			// パラメータを検証
			if (method == null || endpoint == null) {
				return connection.error('rest', 'request format is invalid');
			}

			method = method.toLowerCase();

			if (methods.indexOf(method) == -1) {
				return connection.error('rest', '"method" parameter is invalid');
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
			let params = [];

			try {
				const route = directoryRouter.findRoute(method, endpoint);
				if (route != null) {
					routeFunc = (require(route.getModulePath()))[method];
					params = route.getParams(endpoint);
				}
			}
			catch (err) {
				console.log('error: failed to parse route info.', 'reason:', err);
			}

			if (routeFunc == null) {
				return connection.error('rest', '"endpoint" parameter is invalid');
			}

			// TODO: この辺のqueryの処理なんとかする

			// queryを全て文字列にする
			for (const key of Object.keys(query || {})) {
				query[key] += '';
			}

			params = sanitize(params);
			query = sanitize(query);
			body = sanitize(body);

			// ApiContextを構築
			const apiContext = new ApiContext(repository, config, {
				streams: streams,
				params: params,
				query: query,
				body: body,
				user: connection.user,
				authInfo: connection.authInfo
			});

			// 対象のRouteモジュールを実行
			await routeFunc(apiContext);

			if (!apiContext.responsed) {
				return apiContext.response(500, 'not responsed');
			}

			console.log(`streaming/rest: ${method} ${endpoint}, status=${apiContext.statusCode}, from=${connection.user._id}`);

			let response;
			if (typeof apiContext.data == 'string') {
				response = { message: apiContext.data };
			}
			else {
				response = (apiContext.data != null) ? apiContext.data : {};
			}

			if (connection.connected)
				return connection.send('rest', {
					success: true,
					statusCode: apiContext.statusCode,
					request: { method, endpoint, query, body },
					response
				});
		}
		catch (err) {
			console.log(err);
			connection.error('rest', 'server error');
		}
	};

	const receivedNotificationConnect = async (connection, request) => {
		try {
			return connection.error('notification-connect', 'comming soon'); // TODO
		}
		catch (err) {
			console.log(err);
			connection.error('notification-connect', 'server error');
		}
	};
	const receivedTimelineConnect = async (connection, request) => {
		try {
			const timelineType = request.type;

			if (timelineType == null) {
				return connection.error('timeline-connect', '"type" parameter is required');
			}

			// ストリームの取得または構築
			let stream, streamType, streamId;
			if (timelineType == 'general') {
				streamType = generalTLStreamType;
				streamId = generalTLStreamId;

				// expect: Not connected to the stream yet from this connection.
				if (connection.connectedStreamIds.indexOf(streamId) != -1) {
					return connection.error('timeline-connect', `${timelineType} timeline stream is already connected`);
				}

				stream = generalTLStream;
			}
			else if (timelineType == 'home') {
				// memo: フォローユーザーのuser-timeline-statusストリームを統合したhome-timeline-statusストリームを生成
				streamType = 'home-timeline-status';
				streamId = StreamUtil.buildStreamId(streamType, connection.user._id);

				// expect: Not connected to the stream yet from this connection.
				if (connection.connectedStreamIds.indexOf(streamId) != -1) {
					return connection.error('timeline-connect', `${timelineType} timeline stream is already connected`);
				}

				stream = streams.get(streamId);
				if (stream == null) {
					// ストリームを生成
					stream = new Stream();
					stream.addSource(StreamUtil.buildStreamId('user-timeline-status', connection.user._id));
					const followings = await userFollowingsService.findTargets(connection.user._id, { isAscending: false }); // TODO: (全て or ユーザーの購読設定によっては選択的に)
					for (const following of followings || []) {
						const followingUserId = following.target.toString();
						stream.addSource(StreamUtil.buildStreamId('user-timeline-status', followingUserId));
					}
					streams.set(streamId, stream);
				}
			}
			else {
				return connection.error('timeline-connect', `timeline type "${timelineType}" is invalid`);
			}

			// ストリームからのデータをwebsocketに流す
			const streamHandler = stream.addListener(data => {
				if (connection.connected) {
					console.log(`streaming/stream:${streamType}`);
					connection.send(`stream:${streamType}`, { streamId, resource: data });
				}
				else {
					console.log('not connected');
				}
			});
			connection.connectedStreamHandlers.set(streamId, streamHandler);

			// connectedStreamIdsに追加
			connection.connectedStreamIds.push(streamId);

			console.log('streaming/timeline-connect:', timelineType);
			connection.send('timeline-connect', { success: true, message: `connected ${timelineType} timeline` });
		}
		catch (err) {
			console.log(err);
			connection.error('timeline-disconnect', 'server error');
		}
	};

	const receivedTimelineDisconnect = async (connection, request) => {
		try {
			const timelineType = request.type;

			if (timelineType == null) {
				return connection.error('timeline-disconnect', '"type" parameter is required');
			}

			// 対象タイムラインのストリームを取得
			let streamId;
			if (timelineType == 'general') {
				streamId = generalTLStreamId;
			}
			else if (timelineType == 'home') {
				streamId = StreamUtil.buildStreamId('home-timeline-status', connection.user._id);
			}
			else {
				return connection.error('timeline-disconnect', `timeline type "${timelineType}" is invalid`);
			}

			await disconnectStream(connection, streamId);
			console.log('streaming/timeline-disconnect:', streamId);
			connection.send('timeline-disconnect', { success: true, message: `disconnected ${timelineType} timeline` });
		}
		catch (err) {
			console.log(err);
			connection.error('timeline-disconnect', 'server error');
		}
	};

	server.on('request', async request => {
		const query = request.resourceURL.query;

		// verification
		const accessToken = query.access_token;
		if (accessToken == null) {
			const message = 'access_token parameter is empty';
			request.reject(400, message);
			return;
		}

		const token = await tokensService.findByAccessToken(accessToken);
		if (token == null) {
			const message = 'access_token parameter is invalid';
			request.reject(400, message);
			return;
		}

		const [user, application] = await Promise.all([
			repository.findById('users', token.userId),
			repository.findById('applications', token.applicationId)
		]);

		if (user == null) {
			const message = 'user not found';
			request.reject(500, message);
			return;
		}

		if (application == null) {
			const message = 'application not found';
			request.reject(500, message);
			return;
		}

		const connection = request.accept();

		connection.user = user;
		connection.authInfo = { scopes: token.scopes, application: application };

		// このコネクション上で接続されているストリームID/ハンドラの一覧
		connection.connectedStreamIds = [];
		connection.connectedStreamHandlers = new Map();

		// support user events
		events(connection);

		// イベントのエラー返却メソッド
		connection.error = (eventName, message) => {
			if (connection.connected)
				connection.send(eventName, { success: false, message });
		};

		connection.on('error', err => {
			if (err.message.indexOf('ECONNRESET') != -1) {
				return;
			}

			if (err.userEventError)
				connection.error('default', 'request format is invalid');
			else
				console.log('streaming error:', err);
		});

		connection.on('close', () => {
			if (connection.connectedStreamIds != null || connection.connectedStreamHandlers != null) {
				// 全ての接続済みストリームを購読解除
				for (const streamId of connection.connectedStreamIds) {
					disconnectStream(connection, streamId);
				}
			}
			console.log(`disconnected streaming. user: ${connection.user._id}`);
		});

		// クライアント側からRESTリクエストを受信したとき
		connection.on('rest', (request) => receivedRest(connection, request));

		// クライアント側から通知の購読リクエストを受信したとき
		connection.on('notification-connect', request => receivedNotificationConnect(connection, request));

		// クライアント側からタイムラインの購読リクエストを受信したとき
		connection.on('timeline-connect', request => receivedTimelineConnect(connection, request));

		// クライアント側からタイムラインの購読解除リクエストを受信したとき
		connection.on('timeline-disconnect', request => receivedTimelineDisconnect(connection, request));

		connection.on('default', (eventData) => {
			connection.error('default', 'invalid event name');
		});

		console.log(`connected streaming. user: ${connection.user._id}`);
	});

	console.log('streaming server is ready.');
};
