const assert = require('assert');
const { Stream, StreamPublisher, StreamUtil } = require('../src/modules/stream');
const { delay } = require('../src/modules/helpers/GeneralHelper');

describe('Stream tests', () => {
	const disposeStreams = [];

	for (let i = 0; i < 1; i++) {
		it('basic streamming A: '+i, async () => {
			// stream (source: A)
			const stream = new Stream();
			disposeStreams.push(stream);
			await stream.addSource(StreamUtil.buildStreamId('user', 'publisherA'));
			let count = 0;
			stream.addListener((data) => {
				assert.equal(data.text, 'abc');
				count++;
			});
			assert.equal(stream.getSources().length, 1);

			// publish from A
			const publisher = new StreamPublisher();
			const publishingData = { text: 'abc' };
			await publisher.publish('user', 'publisherA', publishingData);
			await publisher.dispose();

			// 配信が完了することを期待して3ms待つ
			await delay(3);

			// expect: 1回の受信がある
			assert.equal(count, 1);
		});
	}

	for (let i = 0; i < 1; i++) {
		it('basic streamming B: '+i, async () => {
			// home stream (source: A)
			const homeStream = new Stream();
			disposeStreams.push(homeStream);
			homeStream.setDestination(StreamUtil.buildStreamId('home', 'publisherA'));
			await homeStream.addSource(StreamUtil.buildStreamId('user', 'publisherA'));
			await homeStream.addSource(StreamUtil.buildStreamId('user', 'publisherB'));
			await homeStream.removeSource(StreamUtil.buildStreamId('user', 'publisherB'));

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
			const publisherA = new StreamPublisher();
			await publisherA.publish('user', 'publisherA', { text: 'from A' });
			await publisherA.dispose();

			// publish from B
			const publisherB = new StreamPublisher();
			await publisherB.publish('user', 'publisherB', { text: 'from B' });
			await publisherB.dispose();

			// 配信が完了することを期待して3ms待つ
			await delay(3);

			// expect: homeStreamにAとBから1回ずつ受信がある
			assert.equal(countA, 1);
			assert.equal(countB, 0);
		});
	}

	for (let i = 0; i < 1; i++) {
		it('create a stream channel: '+i, async () => {
			// home stream (source: A, B)
			const homeStream = new Stream();
			disposeStreams.push(homeStream);
			homeStream.setDestination(StreamUtil.buildStreamId('home', 'publisherA'));
			await homeStream.addSource(StreamUtil.buildStreamId('user', 'publisherA'));
			await homeStream.addSource(StreamUtil.buildStreamId('user', 'publisherB'));

			// other stream (source: home)
			const otherStream = new Stream();
			disposeStreams.push(otherStream);
			await otherStream.addSource(StreamUtil.buildStreamId('home', 'publisherA'));
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
			const publisherA = new StreamPublisher();
			await publisherA.publish('user', 'publisherA', { text: 'from A' });
			await publisherA.dispose();

			// publish from B
			const publisherB = new StreamPublisher();
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
