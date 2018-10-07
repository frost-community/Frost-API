const redis = require('redis');
const { EventEmitter } = require('events');

class StreamUtil {
	/**
	 * @param {string} type
	 * @param {string} publisherId
	*/
	static buildStreamId(type, publisherId) {
		return `${type}:${publisherId}`;
	}
	/** @param {string} streamId */
	static parseStreamId(streamId) {
		const elements = streamId.split(':');
		return {
			streamType: elements[0],
			streamPublisher: elements[1]
		};
	}
}

class StreamPublisher {
	constructor(redisClient = redis.createClient(6379, 'localhost')) {
		this.redisClient = redisClient;
		if (!(this.redisClient instanceof redis.RedisClient)) {
			throw new TypeError('argument "redisClient" is not a RedisClient');
		}
		this.redisClient.on('error', (err) => {
			throw new Error(`stream publisher: ${String(err)}`);
		});
	}
	/**
	 * @param {string} type
	 * @param {string} publisherId
	 * @param {string | {[x:string]:any}} data JSON data or object
	*/
	publish(type, publisherId, data) {
		let strData = (data instanceof String) ? data : JSON.stringify(data);
		this.redisClient.publish(StreamUtil.buildStreamId(type, publisherId), strData);
	}
	dispose() {
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
			this.redisClient.removeAllListeners();
		});
	}
}

class Stream {
	/** @param {redis.RedisClient} redisClient */
	constructor(redisClient = redis.createClient(6379, 'localhost')) {
		this.sources = [];
		this.emitter = new EventEmitter();
		this.redisClient = redisClient;
		this.redisClient.on('message', (channel, message) => {
			// 自身のリスナーに対して投げる
			this.emitter.emit('data', (message instanceof String) ? message : JSON.parse(message));
			// 設定した別のStreamに投げる
			if (this.outgoingStreamId != null) {
				this.redisClient.publish(this.outgoingStreamId, message);
			}
		});
		this.redisClient.on('error', (err) => {
			throw new Error(`stream: ${String(err)}`);
		});
	}
	setDestination(streamId) {
		this.outgoingStreamId = streamId;
	}
	unsetDestination() {
		this.outgoingStreamId = null;
	}
	getSources() {
		return this.sources;
	}
	/** @param {string} streamId */
	addSource(streamId) {
		if (this.sources.indexOf(streamId) != -1) {
			throw new Error('already added');
		}
		this.sources.push(streamId);
		this.redisClient.subscribe(streamId);
	}
	/** @param {string} streamId */
	removeSource(streamId) {
		const index = this.sources.indexOf(streamId);
		if (index == -1) {
			throw new Error('not exist');
		}
		this.sources.splice(index, 1);
		this.redisClient.unsubscribe(streamId);
	}
	/** @param {(data: string | {[x:string]:any})=>void} listener */
	addListener(listener) {
		this.emitter.addListener('data', listener);
		return listener;
	}
	/** @param {(data: string | {[x:string]:any})=>void} listener */
	removeListener(listener) {
		this.emitter.removeListener('data', listener);
	}
	listenerCount() {
		return this.emitter.listenerCount('data');
	}
	/** @returns {Promise<void>} */
	dispose() {
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
			this.redisClient.removeAllListeners();
		});
	}
}

module.exports = {
	StreamUtil,
	StreamPublisher,
	Stream
};
