const RedisEventEmitter = require('./modules/RedisEventEmitter');
const XevPubSub = require('./modules/XevPubSub');

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

module.exports = (connection, userFollowingsService) => {

	const streams = new Map(); // memo: keyはChannelName

	// このコネクション上で接続されているストリーム(ID+Listener)の一覧
	const connectedStreams = [];
	// connectedStreams: [{ id: string, listener: Function }]

	// generate stream for general timeline (global)
	const generalTLStream = new XevPubSub('frost-api');
	//const generalTLStreamId = DataTypeIdHelper.build(['stream', 'general-timeline-status', 'general']);
	const generalTLStreamId = DataTypeIdHelper.build(['stream', 'timeline', 'chat', 'general']);
	const generalTLEventId = DataTypeIdHelper.build(['event', 'timeline', 'chat', 'general']);
	generalTLStream.subscribe(generalTLEventId);
	streams.set(generalTLStreamId, generalTLStream);

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
	 * ストリームの破棄
	 * @param {string} streamId
	*/
	async function disposeStream(streamId) {
		const index = connectedStreams.findIndex(stream => stream.id == streamId);
		if (index == -1) return;

		const stream = streams.get(streamId);
		if (stream == null) return;

		// dispose listener
		const { listener } = connectedStreams[index];
		stream.removeListener('message', listener);
		connectedStreams.splice(index, 1);

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

	connection.on('close', () => {
		if (connectedStreams != null) {
			// 全ての接続済みストリームを購読解除
			for (const connectedStream of connectedStreams) {
				disposeStream(connectedStream.id);
			}
		}
	});

	/**
	 * @param {any} reqData
	*/
	async function receivedSubscribe(reqData) {
		try {
			const { sourceType } = reqData;

			if (sourceType == 'notification') {
				subscribeNotification(reqData);
			}
			else if (sourceType == 'homeTimeline') {
				subscribeTimeline(reqData, 'home');
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
	 * @param {any} reqData
	*/
	async function receivedUnsubscribe(reqData) {
		try {
			const { sourceType } = reqData;

			if (sourceType == 'notification') {
				unsubscribeNotification(reqData);
			}
			else if (sourceType == 'homeTimeline') {
				unsubscribeTimeline(reqData, 'home');
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
	 * @param {any} reqData
	*/
	async function subscribeNotification(reqData) {
		return connection.error('subscribe', 'comming soon'); // TODO
	}

	/**
	 * @param {any} reqData
	*/
	async function unsubscribeNotification(reqData) {
		return connection.error('unsubscribe', 'comming soon'); // TODO
	}

	/**
	 * @param {any} reqData
	*/
	async function subscribeTimeline(reqData, timelineType) {

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

			const index = connectedStreams.findIndex(stream => stream.id == streamId);

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
		function streamListener(sourceStreamId, data) {
			if (connection.connected) {
				console.log(`streaming/${streamId}`);
				connection.send('event', { eventType: streamId, resource: data });
			}
			else {
				console.log('not subscribed');
			}
		}
		stream.addListener('message', streamListener);

		// connectedStreamsに追加
		connectedStreams.push({ id: streamId, listener: streamListener });

		console.log(`streaming/subscribe timeline.${timelineType}`);
		connection.send('subscribe', { success: true, message: `subscribed ${timelineType} timeline` });
	}

	/**
	 * @param {any} reqData
	*/
	async function unsubscribeTimeline(reqData, timelineType) {
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

			await disposeStream(streamId);
			console.log('streaming/unsubscribe:', streamId);
			connection.send('unsubscribe', { success: true, message: `unsubscribed ${timelineType} timeline` });
		}
		catch (err) {
			console.log(err);
			connection.error('unsubscribe', 'server error');
		}
	}

	// クライアント側からsubscribeを受信したとき
	connection.on('subscribe', reqData => receivedSubscribe(connection, reqData));

	// クライアント側からunsubscribeを受信したとき
	connection.on('unsubscribe', reqData => receivedUnsubscribe(connection, reqData));
};