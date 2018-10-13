const assert = require('assert');
const {
	XevStream,
	XevStreamPublisher,
	RedisStream,
	RedisStreamPublisher,
	StreamEventIdUtil
} = require('../src/modules/stream');
const { delay } = require('../src/modules/helpers/GeneralHelper');

const iteration = 10;

describe('xev stream tests', () => {
	const disposeStreams = [];

	for (let i = 0; i < iteration; i++) {
		it('basic streamming A: '+(i+1), async () => {
			// stream (source: A)
			const stream = new XevStream();
			disposeStreams.push(stream);
			stream.addSource(StreamEventIdUtil.buildStreamEventId('user', 'publisherA'));
			let count = 0;
			stream.addListener((data) => {
				assert.equal(data.text, 'abc');
				count++;
			});
			assert.equal(stream.getSources().length, 1);

			// publish from A
			const publisher = new XevStreamPublisher();
			const publishingData = { text: 'abc' };
			publisher.publish('user', 'publisherA', publishingData);
			publisher.dispose();

			// 配信が完了することを期待して3ms待つ
			//await delay(3);

			// expect: 1回の受信がある
			assert.equal(count, 1);
		});
	}

	for (let i = 0; i < iteration; i++) {
		it('basic streamming B: '+(i+1), async () => {
			// home stream (source: A)
			const homeStream = new XevStream();
			disposeStreams.push(homeStream);
			homeStream.setDestination(StreamEventIdUtil.buildStreamEventId('home', 'publisherA'));
			homeStream.addSource(StreamEventIdUtil.buildStreamEventId('user', 'publisherA'));
			homeStream.addSource(StreamEventIdUtil.buildStreamEventId('user', 'publisherB'));
			homeStream.removeSource(StreamEventIdUtil.buildStreamEventId('user', 'publisherB'));

			let countA = 0;
			let countB = 0;
			homeStream.addListener((data) => {
				if (data.text == 'from A') {
					countA++;
				}
				if (data.text == 'from B') {
					countB++;
				}
			});

			// publish from A
			const publisherA = new XevStreamPublisher();
			publisherA.publish('user', 'publisherA', { text: 'from A' });
			publisherA.dispose();

			// publish from B
			const publisherB = new XevStreamPublisher();
			publisherB.publish('user', 'publisherB', { text: 'from B' });
			publisherB.dispose();

			// expect: homeStreamにAとBから1回ずつ受信がある
			assert.equal(countA, 1);
			assert.equal(countB, 0);
		});
	}

	for (let i = 0; i < iteration; i++) {
		it('create a stream channel: '+(i+1), async () => {
			// home stream (source: A, B)
			const homeStream = new XevStream();
			disposeStreams.push(homeStream);
			homeStream.setDestination(StreamEventIdUtil.buildStreamEventId('home', 'publisherA'));
			homeStream.addSource(StreamEventIdUtil.buildStreamEventId('user', 'publisherA'));
			homeStream.addSource(StreamEventIdUtil.buildStreamEventId('user', 'publisherB'));

			// other stream (source: home)
			const otherStream = new XevStream();
			disposeStreams.push(otherStream);
			otherStream.addSource(StreamEventIdUtil.buildStreamEventId('home', 'publisherA'));
			let countA = 0;
			let countB = 0;
			otherStream.addListener((data) => {
				if (data.text == 'from A') {
					countA++;
				}
				if (data.text == 'from B') {
					countB++;
				}
			});

			// publish from A
			const publisherA = new XevStreamPublisher();
			publisherA.publish('user', 'publisherA', { text: 'from A' });
			publisherA.dispose();

			// publish from B
			const publisherB = new XevStreamPublisher();
			publisherB.publish('user', 'publisherB', { text: 'from B' });
			publisherB.dispose();

			// expect: otherStreamにAとBから1回ずつ受信がある
			assert.equal(countA, 1);
			assert.equal(countB, 1);
		});
	}

	afterEach(async () => {
		// dispose
		for (const stream of disposeStreams) {
			stream.dispose();
		}
		disposeStreams.splice(0, disposeStreams.length);
	});
});

describe('redis stream tests', () => {
	const disposeStreams = [];

	for (let i = 0; i < iteration; i++) {
		it('basic streamming A: '+(i+1), async () => {
			// stream (source: A)
			const stream = new RedisStream();
			disposeStreams.push(stream);
			await stream.addSource(StreamEventIdUtil.buildStreamEventId('user', 'publisherA'));
			let count = 0;
			stream.addListener((data) => {
				assert.equal(data.text, 'abc');
				count++;
			});
			assert.equal(stream.getSources().length, 1);

			// publish from A
			const publisher = new RedisStreamPublisher();
			const publishingData = { text: 'abc' };
			await publisher.publish('user', 'publisherA', publishingData);
			await publisher.dispose();

			// 配信が完了することを期待して3ms待つ
			await delay(3);

			// expect: 1回の受信がある
			assert.equal(count, 1);
		});
	}

	for (let i = 0; i < iteration; i++) {
		it('basic streamming B: '+(i+1), async () => {
			// home stream (source: A)
			const homeStream = new RedisStream();
			disposeStreams.push(homeStream);
			homeStream.setDestination(StreamEventIdUtil.buildStreamEventId('home', 'publisherA'));
			await homeStream.addSource(StreamEventIdUtil.buildStreamEventId('user', 'publisherA'));
			await homeStream.addSource(StreamEventIdUtil.buildStreamEventId('user', 'publisherB'));
			await homeStream.removeSource(StreamEventIdUtil.buildStreamEventId('user', 'publisherB'));

			let countA = 0;
			let countB = 0;
			homeStream.addListener((data) => {
				if (data.text == 'from A') {
					countA++;
				}
				if (data.text == 'from B') {
					countB++;
				}
			});

			// publish from A
			const publisherA = new RedisStreamPublisher();
			await publisherA.publish('user', 'publisherA', { text: 'from A' });
			await publisherA.dispose();

			// publish from B
			const publisherB = new RedisStreamPublisher();
			await publisherB.publish('user', 'publisherB', { text: 'from B' });
			await publisherB.dispose();

			// 配信が完了することを期待して3ms待つ
			await delay(3);

			// expect: homeStreamにAとBから1回ずつ受信がある
			assert.equal(countA, 1);
			assert.equal(countB, 0);
		});
	}

	for (let i = 0; i < iteration; i++) {
		it('create a stream channel: '+(i+1), async () => {
			// home stream (source: A, B)
			const homeStream = new RedisStream();
			disposeStreams.push(homeStream);
			homeStream.setDestination(StreamEventIdUtil.buildStreamEventId('home', 'publisherA'));
			await homeStream.addSource(StreamEventIdUtil.buildStreamEventId('user', 'publisherA'));
			await homeStream.addSource(StreamEventIdUtil.buildStreamEventId('user', 'publisherB'));

			// other stream (source: home)
			const otherStream = new RedisStream();
			disposeStreams.push(otherStream);
			await otherStream.addSource(StreamEventIdUtil.buildStreamEventId('home', 'publisherA'));
			let countA = 0;
			let countB = 0;
			otherStream.addListener((data) => {
				if (data.text == 'from A') {
					countA++;
				}
				if (data.text == 'from B') {
					countB++;
				}
			});

			// publish from A
			const publisherA = new RedisStreamPublisher();
			await publisherA.publish('user', 'publisherA', { text: 'from A' });
			await publisherA.dispose();

			// publish from B
			const publisherB = new RedisStreamPublisher();
			await publisherB.publish('user', 'publisherB', { text: 'from B' });
			await publisherB.dispose();

			// 配信が完了することを期待して10ms待つ
			await delay(10);

			// expect: otherStreamにAとBから1回ずつ受信がある
			assert.equal(countA, 1);
			assert.equal(countB, 1);
		});
	}

	afterEach(async () => {
		// dispose
		for (const stream of disposeStreams) {
			await stream.dispose();
		}
		disposeStreams.splice(0, disposeStreams.length);
	});
});
