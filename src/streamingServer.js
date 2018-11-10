const WebSocket = require('websocket');
const events = require('websocket-events');
const MongoAdapter = require('./modules/MongoAdapter');
const { DirectoryRouter } = require('./modules/directoryRouter');
const DataTypeIdHelper = require('./modules/helpers/DataTypeIdHelper');
const XevPubSub = require('./modules/XevPubSub');
const RedisEventEmitter = require('./modules/RedisEventEmitter');
const ApiContext = require('./modules/ApiContext');
const TokensService = require('./services/TokensService');
const UserFollowingsService = require('./services/UserFollowingsService');
const sanitize = require('mongo-sanitize');

/*
# 各種変数の説明
streamType: 'user-timeline-status' | 'home-timeline-status' | 'general-timeline-status'
streamPublisher: ストリームの発行者情報
streamId: DataTypeIdHelper.build(['stream', streamType, streamPublisher]) ストリームの識別子
streams: Map<streamId, LocalStream> 全てのストリーム一覧
connectedStreamIds: streamId[] 接続済みのストリーム名一覧

# streamIdの例
general-timeline-status:general generalに向けて流されたポストを受信可能なLocalStreamです
home-timeline-status:(userId) そのユーザーのホームTLに向けて流されたポストを受信可能なLocalStreamです
*/

/**
 * @param {DirectoryRouter} directoryRouter
 * @param {Map<string, XevPubSub>} streams
 * @param {MongoAdapter} repository
*/
module.exports = (http, directoryRouter, streams, repository, config) => {
	const server = new WebSocket.server({ httpServer: http });

	// generate stream for general timeline (global)
	const generalTLStream = new XevPubSub('frost-api');
	//const generalTLStreamId = DataTypeIdHelper.build(['stream', 'general-timeline-status', 'general']);
	const generalTLStreamId = DataTypeIdHelper.build(['stream', 'timeline', 'chat', 'general']);
	const generalTLEventId = DataTypeIdHelper.build(['event', 'timeline', 'chat', 'general']);
	generalTLStream.subscribe(generalTLEventId);
	streams.set(generalTLStreamId, generalTLStream);

	const tokensService = new TokensService(repository, config);
	const userFollowingsService = new UserFollowingsService(repository, config);

	const eventReciever = new RedisEventEmitter('frost-api', true);

	// (RedisEvent受信) redis.posting.chat
	eventReciever.addListener(DataTypeIdHelper.build(['redis', 'posting', 'chat']), (data) => {
		// streamに流す
		const publisher = new XevPubSub('frost-api');
		publisher.publish(DataTypeIdHelper.build(['event', 'timeline', 'chat', 'user', data.posting.userId]), data.posting);
		publisher.publish(DataTypeIdHelper.build(['event', 'timeline', 'chat', 'general']), data.posting);
		publisher.dispose();
	});

	// (RedisEvent受信) redis.posting.article
	eventReciever.addListener(DataTypeIdHelper.build(['redis', 'posting', 'article']), (data) => {
	});

	// (RedisEvent受信) redis.posting.reference
	eventReciever.addListener(DataTypeIdHelper.build(['redis', 'posting', 'reference']), (data) => {
	});

	// (RedisEvent受信) redis.following
	eventReciever.addListener(DataTypeIdHelper.build(['redis', 'following']), (data) => {
		/*

		// フォロー時
		// 対象ユーザーのストリームを購読
		const stream = apiContext.streams.get(DataTypeIdHelper.build(['stream', 'user-timeline-status', sourceUserId.toString()]));
		if (stream != null) {
			stream.addSource(targetUserId.toString()); // この操作は冪等
		}

		// アンフォロー時
		// 対象ユーザーのストリームを購読解除
		const stream = apiContext.streams.get(DataTypeIdHelper.build(['stream', 'user-timeline-status', soruceUser._id.toString()]));
		if (stream != null) {
			stream.removeSource(targetUser._id.toString());
		}

		*/
	});

	/**
	 * ストリームの購読解除メソッド
	 * @param {WebSocket.connection} connection
	 * @param {string} streamId
	*/
	async function disconnectStream(connection, streamId) {
		const index = connection.connectedStreams.findIndex(stream => stream.id == streamId);
		if (index == -1) return;

		const stream = streams.get(streamId);
		if (stream == null) return;

		// dispose listener
		const { listener } = connection.connectedStreams[index];
		stream.removeListener('message', listener);
		connection.connectedStreams.splice(index, 1);

		// dispose stream if no listeners
		if (stream.listenerCount() == 0) {

			// stream.general-timeline-statusはストリーム自体の解放は行わない
			if (DataTypeIdHelper.contain(streamId, ['stream','timeline', 'chat', 'general'])) {
				return;
			}

			await stream.dispose();
			streams.delete(streamId);
		}
	}

	/**
	 * @param {WebSocket.connection} connection
	 * @param {any} reqData
	*/
	async function receivedRequest(connection, reqData) {
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
				console.log('error: failed to parse route info.', 'reason:', err);
			}

			if (routeFunc == null) {
				return connection.error('request', '"endpoint" parameter is invalid');
			}

			body = sanitize(body);

			// ApiContextを構築
			const apiContext = new ApiContext(repository, config, {
				streams: streams,
				body: body,
				user: connection.user,
				authInfo: connection.authInfo
			});

			// 対象のRouteモジュールを実行
			await routeFunc(apiContext);

			if (!apiContext.responsed) {
				return apiContext.response(500, 'not responsed');
			}

			console.log(`streaming/request: ${endpoint}, status=${apiContext.statusCode}, from=${connection.user._id}`);

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
			console.log(err);
			connection.error('request', 'server error');
		}
	}

	/**
	 * @param {WebSocket.connection} connection
	 * @param {any} reqData
	*/
	async function receivedSubscribe(connection, reqData) {
		try {
			const { sourceType } = reqData;

			if (sourceType == 'notification') {
				subscribeNotification(connection, reqData);
			}
			else if (sourceType == 'homeTimeline') {
				subscribeTimeline(connection, reqData, 'home');
			}
			else {
				connection.error('subscribe', 'invalid sourceType');
			}
		}
		catch (err) {
			console.log(err);
			connection.error('subscribe', 'server error');
		}
	}

	/**
	 * @param {WebSocket.connection} connection
	 * @param {any} reqData
	*/
	async function receivedUnsubscribe(connection, reqData) {
		try {
			const { sourceType } = reqData;

			if (sourceType == 'notification') {
				unsubscribeNotification(connection, reqData);
			}
			else if (sourceType == 'homeTimeline') {
				unsubscribeTimeline(connection, reqData, 'home');
			}
			else {
				connection.error('unsubscribe', 'invalid sourceType');
			}
		}
		catch (err) {
			console.log(err);
			connection.error('unsubscribe', 'server error');
		}
	}

	/**
	 * @param {WebSocket.connection} connection
	 * @param {any} reqData
	*/
	async function subscribeNotification(connection, reqData) {
		return connection.error('subscribe', 'comming soon'); // TODO
	}

	/**
	 * @param {WebSocket.connection} connection
	 * @param {any} reqData
	*/
	async function unsubscribeNotification(connection, reqData) {
		return connection.error('unsubscribe', 'comming soon'); // TODO
	}

	/**
	 * @param {WebSocket.connection} connection
	 * @param {any} reqData
	*/
	async function subscribeTimeline(connection, reqData, timelineType) {

		/** @type {XevPubSub} */
		let stream;
		/** @type {string} */
		let streamId;

		// ストリームの取得または構築
		if (timelineType == 'home') {
			const candy = (reqData.candy != null);

			if (candy) {
				streamId = generalTLStreamId;
				timelineType = 'candy';
			}
			else {
				// memo: フォローユーザーのuser-timeline-statusストリームを統合したhome-timeline-statusストリームを生成
				streamId = DataTypeIdHelper.build(['stream', 'timeline', 'chat', 'home', connection.user._id]);
			}

			const index = connection.connectedStreams.findIndex(stream => stream.id == streamId);

			// expect: Not subscribed to the stream yet from this connection.
			if (index != -1) {
				return connection.error('subscribe', `${timelineType} timeline stream is already subscribed`);
			}

			if (candy) {
				stream = generalTLStream;
			}
			else {
				// Streamを取得
				stream = streams.get(streamId);

				// Streamを生成
				if (stream == null) {
					stream = new XevPubSub('frost-api');
					//stream.addSource(DataTypeIdHelper.build(['event', 'timeline', 'chat', 'user', connection.user._id]));
					stream.subscribe(DataTypeIdHelper.build(['event', 'timeline', 'chat', 'user', connection.user._id]));
					const followings = await userFollowingsService.findTargets(connection.user._id, { isAscending: false }); // TODO: (全て or ユーザーの購読設定によっては選択的に)
					for (const following of followings || []) {
						const followingUserId = following.target.toString();
						stream.subscribe(DataTypeIdHelper.build(['event', 'timeline', 'chat', 'user', followingUserId]));
					}
					streams.set(streamId, stream);
				}
			}
		}
		else {
			return connection.error('subscribe', `timeline type "${timelineType}" is invalid`);
		}

		// Streamからのデータをwebsocketに流す
		function streamHandler(sourceStreamId, data) {
			if (connection.connected) {
				console.log(`streaming/${streamId}`);
				connection.send('event', { eventType: streamId, resource: data });
			}
			else {
				console.log('not subscribed');
			}
		}
		stream.addListener('message', streamHandler);

		// connectedStreamsに追加
		connection.connectedStreams.push({ id: streamId, listener: streamHandler });

		console.log(`streaming/subscribe timeline.${timelineType}`);
		connection.send('subscribe', { success: true, message: `subscribed ${timelineType} timeline` });
	}

	/**
	 * @param {WebSocket.connection} connection
	 * @param {any} reqData
	*/
	async function unsubscribeTimeline(connection, reqData, timelineType) {
		try {
			// 対象タイムラインのストリームを取得
			let streamId;
			if (timelineType == 'home') {
				const candy = (reqData.candy != null);

				if (candy) {
					streamId = generalTLStreamId;
					timelineType = 'candy';
				}
				else {
					streamId = DataTypeIdHelper.build(['stream', 'timeline', 'chat', 'home', connection.user._id]);
				}
			}
			else {
				return connection.error('unsubscribe', `timeline type "${timelineType}" is invalid`);
			}

			await disconnectStream(connection, streamId);
			console.log('streaming/unsubscribe:', streamId);
			connection.send('unsubscribe', { success: true, message: `unsubscribed ${timelineType} timeline` });
		}
		catch (err) {
			console.log(err);
			connection.error('unsubscribe', 'server error');
		}
	}

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
		connection.connectedStreams = [];
		// connectedStreams: [{ id: string, listener: Function }]

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
			if (connection.connectedStreams != null) {
				// 全ての接続済みストリームを購読解除
				for (const connectedStream of connection.connectedStreams) {
					disconnectStream(connection, connectedStream.id);
				}
			}
			console.log(`disconnected streaming. user: ${connection.user._id}`);
		});

		// クライアント側からrequestを受信したとき
		connection.on('request', (reqData) => receivedRequest(connection, reqData));

		// クライアント側からsubscribeを受信したとき
		connection.on('subscribe', reqData => receivedSubscribe(connection, reqData));

		// クライアント側からunsubscribeを受信したとき
		connection.on('unsubscribe', reqData => receivedUnsubscribe(connection, reqData));

		connection.on('default', (reqData) => {
			connection.error('default', 'invalid event name');
		});

		console.log(`connected streaming. user: ${connection.user._id}`);
	});

	console.log('streaming server is ready.');
};
