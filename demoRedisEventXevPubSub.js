const RedisEventEmitter = require('./src/modules/RedisEventEmitter');
const XevPubSub = require('./src/modules/XevPubSub');

// in streaming-server:

// 2) redisから流れてきた広域のイベントを、ローカルのpub/subにストリーミングTLの内容として投げる
const reciever = new RedisEventEmitter('piyo', true);
reciever.on('redis.user-tl', (data) => {
	console.log('recieve a redis event. publish local event');
	const publisher = new XevPubSub('hoge');
	publisher.publish('local.user-tl.user1', data);
	publisher.dispose();
});

// 3) ローカルのpub/subにストリーミングTLの内容が流れてくる
const subscriber = new XevPubSub('hoge');
subscriber.on('message', (channel, message) => {
	// 4) WebSocketにポストを投げる
	console.log('recieve local event. send by websocket');
	console.log(channel + ':', message);
});
subscriber.subscribe('local.user-tl.user1');
subscriber.subscribe('local.user-tl.user2');

// in created posting:

(async () => {
	// 1) ポストが投稿される
	console.log('post chat. send a redis event');

	const sender = new RedisEventEmitter('piyo', false);
	await sender.emit('redis.user-tl', { text: 'nya' });
	await sender.dispose();
})();
