const $ = require('cafy').default;
const RedisEventEmitter = require('../../modules/RedisEventEmitter');
const PubSub = require('../../modules/XevPubSub');
const DataTypeIdHelper = require('../../modules/helpers/DataTypeIdHelper');
const StreamingContext = require('../modules/StreamingContext');

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

module.exports = (userFollowingsService) => {

	const streams = new Map(); // memo: keyはChannelName

	// generate stream for general timeline (global)
	const generalTLStream = new PubSub('frost-api');
	//const generalTLStreamId = DataTypeIdHelper.build(['stream', 'general-timeline-status', 'general']);
	const generalTLStreamId = DataTypeIdHelper.build(['stream', 'timeline', 'chat', 'general']);
	const generalTLEventId = DataTypeIdHelper.build(['event', 'timeline', 'chat', 'general']);
	generalTLStream.subscribe(generalTLEventId);
	streams.set(generalTLStreamId, generalTLStream);

	const eventReciever = new RedisEventEmitter('frost-api', true);

	// (RedisEvent受信) redis.posting.chat
	eventReciever.addListener(DataTypeIdHelper.build(['redis', 'posting', 'chat']), (data) => {
		// streamに流す
		const publisher = new PubSub('frost-api');
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

	function handle(connection) {

		// このコネクション上で接続されているストリーム(ID+Listener)の一覧
		const connectedStreams = [];
		// connectedStreams: [{ id: string, listener: Function }]

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
				if (DataTypeIdHelper.contain(streamId, ['stream', 'timeline', 'chat', 'general'])) {
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

		let eventSources = [];

		/**
		 * @param {StreamingContext} ctx
		*/
		async function subscribeTimeline(ctx, timelineType) {

			/** @type {PubSub} */
			let stream;

			/** @type {string} */
			let streamId;

			// ストリームの取得または構築
			if (timelineType == 'home') {
				const candy = (ctx.reqData.candy != null);

				if (candy) {
					streamId = generalTLStreamId;
					timelineType = 'candy';
				}
				else {
					// memo: フォローユーザーのuser-timeline-statusストリームを統合したhome-timeline-statusストリームを生成
					streamId = DataTypeIdHelper.build(['stream', 'timeline', 'chat', 'home', ctx.connection.user._id]);
				}

				const index = connectedStreams.findIndex(streamInfo => streamInfo.id == streamId);

				// expect: Not subscribed to the stream yet from this connection.
				if (index != -1) {
					return ctx.error(`${timelineType} timeline is already subscribed`);
				}

				if (candy) {
					stream = generalTLStream;
				}
				else {
					// Streamを取得
					stream = streams.get(streamId);

					// Streamを生成
					if (stream == null) {
						stream = new PubSub('frost-api');
						//stream.addSource(DataTypeIdHelper.build(['event', 'timeline', 'chat', 'user', connection.user._id]));
						stream.subscribe(DataTypeIdHelper.build(['event', 'timeline', 'chat', 'user', ctx.connection.user._id]));
						const followings = await userFollowingsService.findTargets(ctx.connection.user._id, { isAscending: false }); // TODO: (全て or ユーザーの購読設定によっては選択的に)
						for (const following of followings || []) {
							const followingUserId = following.target.toString();
							stream.subscribe(DataTypeIdHelper.build(['event', 'timeline', 'chat', 'user', followingUserId]));
						}
						streams.set(streamId, stream);
					}
				}
			}
			else {
				return ctx.error(`timeline type "${timelineType}" is invalid`);
			}

			// Streamからのデータをwebsocketに流す
			function streamListener(eventId, data) {
				if (ctx.connection.connected) {
					console.log(`(streaming)eventStream: ${streamId}`);
					let elements;
					const parsed = DataTypeIdHelper.parse(streamId);
					if (DataTypeIdHelper.contain(streamId, ['stream', 'timeline', 'chat'])) {
						elements = ['timeline', 'chat', parsed[3]];
					}
					else {
						throw new Error(`unknown streamId: ${streamId}`);
					}
					ctx.connection.send('eventStream', { eventType: DataTypeIdHelper.build(elements), resource: data });
				}
				else {
					console.log('not connected');
				}
			}
			stream.addListener('message', streamListener);

			// connectedStreamsに追加
			connectedStreams.push({ id: streamId, listener: streamListener });

			console.log(`(streaming)${ctx.eventName}: timeline.${timelineType}`);
			ctx.send({ success: true, message: `subscribed ${timelineType} timeline` });
		}

		/**
		 * @param {StreamingContext} ctx
		*/
		async function unsubscribeTimeline(ctx, timelineType) {
			// 対象タイムラインのストリームを取得
			let streamId;
			if (timelineType == 'home') {
				const candy = (ctx.reqData.candy != null);

				if (candy) {
					streamId = generalTLStreamId;
					timelineType = 'candy';
				}
				else {
					streamId = DataTypeIdHelper.build(['stream', 'timeline', 'chat', 'home', ctx.connection.user._id]);
				}
			}
			else {
				return ctx.error(`timeline type "${timelineType}" is invalid`);
			}

			const index = connectedStreams.findIndex(streamInfo => streamInfo.id == streamId);

			// expect: Subscribed to the stream from this connection.
			if (index == -1) {
				return ctx.error(`${timelineType} timeline is not subscribed yet`);
			}

			await disposeStream(streamId);
			console.log(`(streaming)${ctx.eventName}: ${streamId}`);
			ctx.send({ success: true, message: `unsubscribed ${timelineType} timeline` });
		}

		eventSources.push({
			sourceName: 'homeTimeline',
			subscribe: async (ctx) => {
				await subscribeTimeline(ctx, 'home');
			},
			unsubscribe: async (ctx) => {
				await unsubscribeTimeline(ctx, 'home');
			}
		});

		eventSources.push({
			sourceName: 'notification',
			subscribe: async (ctx) => {
				ctx.error('comming soon'); // TODO
			},
			unsubscribe: async (ctx) => {
				ctx.error('comming soon'); // TODO
			}
		});

		/**
		 * @param {StreamingContext} ctx
		*/
		async function eventApiHandler(ctx) {
			if ($().object().nok(ctx.reqData)) {
				return ctx.error('invalid data');
			}

			const {
				id,
				sourceName
			} = ctx.reqData;

			if ($().or($().string(), $().number()).nok(id)) {
				return ctx.error('invalid property', { propertyName: 'id' });
			}

			const eventSource = eventSources.find(s => s.sourceName == sourceName);

			if (eventSource == null) {
				return ctx.error('invalid property', { propertyName: 'sourceName' });
			}

			if (ctx.eventName == 'eventStream.subscribe') {
				await eventSource.subscribe(ctx);
			}
			if (ctx.eventName == 'eventStream.unsubscribe') {
				await eventSource.unsubscribe(ctx);
			}
		}

		// Streaming API: eventStream.subscribe
		connection.on('eventStream.subscribe', async reqData => {
			const ctx = new StreamingContext('eventStream.subscribe', connection, reqData);
			try {
				await eventApiHandler(ctx);
			}
			catch (err) {
				ctx.error('server error');
				console.error(err);
			}
		});

		// Streaming API: eventStream.unsubscribe
		connection.on('eventStream.unsubscribe', async reqData => {
			const ctx = new StreamingContext('eventStream.unsubscribe', connection, reqData);
			try {
				await eventApiHandler(ctx);
			}
			catch (err) {
				ctx.error('server error');
				console.error(err);
			}
		});
	}

	return { handle };
};
