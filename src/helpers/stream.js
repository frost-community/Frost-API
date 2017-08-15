const redis = require('redis');
const { EventEmitter } = require('events');

class StreamUtil {
	static getChannelName(type, publisherId) {
		return `${type}:${publisherId}`;
	}
}

class StreamPublisher {
	constructor(redisClient) {
		this.redisClient = redisClient || redis.createClient(6379, 'localhost');
		if (!(this.redisClient instanceof redis.RedisClient)) {
			throw new TypeError('3rd argument "redisClient" is not a RedisClient');
		}
		this.redisClient.on('error', (err) => {
			throw new Error(`${this.type} stream publisher: ${String(err)}`);
		});
	}
	publish(type, publisherId, data) {
		let strData = (data instanceof String) ? data : JSON.stringify(data);
		this.redisClient.publish(StreamUtil.getChannelName(type, publisherId), strData);
	}
	quitAsync() {
		return new Promise((resolve, reject) => {
			if (this.redisClient.connected) {
				this.redisClient.quit((err) => {
					if (err) return reject(err);
					resolve();
				});
			}
			else {
				resolve();
			}
		});
	}
}

class Stream extends EventEmitter {
	constructor(type, redisClient) {
		super();
		this.type = type;
		this.redisClient = redisClient || redis.createClient(6379, 'localhost');
		this.redisClient.on('message', (channel, message) => {
			this.emit('data', message);
		});
		this.redisClient.on('error', (err) => {
			throw new Error(`${this.type} stream: ${String(err)}`);
		});
	}
	getChannelName(publisherId) {
		return `${this.type}:${publisherId}`;
	}
	addSource(publisherId) {
		this.redisClient.subscribe(StreamUtil.getChannelName(this.type, publisherId));
	}
	removeSource(publisherId) {
		this.redisClient.unsubscribe(StreamUtil.getChannelName(this.type, publisherId));
	}
	quitAsync() {
		return new Promise((resolve, reject) => {
			if (this.redisClient.connected) {
				this.redisClient.quit((err) => {
					if (err) return reject(err);
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
