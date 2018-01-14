const redis = require('redis');
const { EventEmitter } = require('events');

class StreamUtil {
	static buildStreamId(type, publisherId) {
		return `${type}:${publisherId}`;
	}
	static parseStreamId(streamId) {
		const elements = streamId.split(':');
		return {
			streamType: elements[0],
			streamPublisher: elements[1]
		};
	}
}

class StreamPublisher {
	constructor(redisClient) {
		this.redisClient = redisClient || redis.createClient(6379, 'localhost');
		if (!(this.redisClient instanceof redis.RedisClient)) {
			throw new TypeError('argument "redisClient" is not a RedisClient');
		}
		this.redisClient.on('error', (err) => {
			throw new Error(`${this.type} stream publisher: ${String(err)}`);
		});
	}
	publish(type, publisherId, data) {
		let strData = (data instanceof String) ? data : JSON.stringify(data);
		this.redisClient.publish(StreamUtil.buildStreamId(type, publisherId), strData);
	}
	quit() {
		return new Promise((resolve, reject) => {
			if (this.redisClient.connected) {
				this.redisClient.quit((err) => {
					if (err) {
						return reject(err);
					}
					resolve();
				});
			}
			else {
				resolve();
			}
		});
	}
}

class Stream {
	/**
	 * @param {redis.RedisClient?} redisClient
	*/
	constructor(redisClient) {
		this.sources = [];
		this.emitter = new EventEmitter();
		this.redisClient = redisClient || redis.createClient(6379, 'localhost');
		this.redisClient.on('message', (channel, message) => {
			this.emitter.emit('data', (message instanceof String) ? message : JSON.parse(message));
		});
		this.redisClient.on('error', (err) => {
			throw new Error(`${this.type} stream: ${String(err)}`);
		});
	}
	getSources() {
		return this.sources;
	}
	addSource(streamId) {
		const { streamType, streamPublisher } = StreamUtil.parseStreamId(streamId);
		if (this.sources.indexOf(streamId) != -1) {
			throw new Error('already added');
		}
		this.sources.push(streamId);
		this.redisClient.subscribe(StreamUtil.buildStreamId(streamType, streamPublisher));
	}
	removeSource(streamId) {
		const index = this.sources.indexOf(streamId);
		if (index == -1) {
			throw new Error('not exist');
		}
		this.sources.splice(index, 1);
		const { streamType, streamPublisher } = StreamUtil.parseStreamId(streamId);
		this.redisClient.unsubscribe(StreamUtil.buildStreamId(streamType, streamPublisher));
	}
	addListener(listener) {
		this.emitter.addListener('data', listener);
		return listener;
	}
	removeListener(listener) {
		this.emitter.removeListener('data', listener);
	}
	listenerCount() {
		return this.emitter.listenerCount('data');
	}
	quit() {
		return new Promise((resolve, reject) => {
			if (this.redisClient.connected) {
				this.redisClient.quit((err) => {
					if (err) {
						return reject(err);
					}
					resolve();
				});
			}
			else {
				resolve();
			}
		});
	}
}

module.exports = {
	StreamUtil,
	StreamPublisher,
	Stream
};
