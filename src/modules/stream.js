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
		return new Promise((resolve, reject) => {
			let strData = (data instanceof String) ? data : JSON.stringify(data);
			const streamId = StreamUtil.buildStreamId(type, publisherId);
			this.redisClient.publish(streamId, strData, (err) => {
				if (err) {
					return reject(err);
				}
				resolve();
			});
		});
	}
	async dispose() {
		const dispose = () => new Promise((resolve, reject) => {
			if (this.redisClient.connected) {
				this.redisClient.quit((err) => {
					if (err) {
						return reject(err);
					}
					this.redisClient.removeAllListeners();
					resolve();
				});
			}
			else {
				resolve();
			}
		});

		await dispose();
		this.redisClient.removeAllListeners();
	}
}

class Stream {
	/** @param {redis.RedisClient} redisClient */
	constructor(redisClient = redis.createClient(6379, 'localhost'), redisPubClient = redis.createClient(6379, 'localhost')) {
		this.sources = [];
		this.emitter = new EventEmitter();
		this.redisClient = redisClient;
		this.redisPubClient = redisPubClient;
		this.redisClient.on('message', (channel, message) => {
			// 自身のリスナーに対して投げる
			this.emitter.emit('data', (message instanceof String) ? message : JSON.parse(message));
			// 設定した別のStreamに投げる
			if (this.outgoingStreamId != null) {
				this.redisPubClient.publish(this.outgoingStreamId, message);
			}
		});
		this.redisClient.on('error', (err) => {
			throw new Error(`stream: ${String(err)}`);
		});
		this.redisPubClient.on('error', (err) => {
			throw new Error(`stream(pub): ${String(err)}`);
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
		return new Promise((resolve, reject) => {
			if (this.sources.indexOf(streamId) != -1) {
				throw new Error('already added');
			}
			this.redisClient.subscribe(streamId, (err) => {
				if (err) {
					return reject(err);
				}
				this.sources.push(streamId);
				resolve();
			});
		});
	}
	/** @param {string} streamId */
	removeSource(streamId) {
		return new Promise((resolve, reject) => {
			const index = this.sources.indexOf(streamId);
			if (index == -1) {
				throw new Error('not exist');
			}
			this.redisClient.unsubscribe(streamId, (err) => {
				if (err) {
					return reject(err);
				}
				this.sources.splice(index, 1);
				resolve();
			});
		});
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
	async dispose() {
		const disposeClient = () => new Promise((resolve, reject) => {
			if (this.redisClient.connected) {
				this.redisClient.quit((err) => {
					if (err) {
						return reject(err);
					}
					resolve();
				});
				return;
			}
		});
		const disposePubClient = () => new Promise((resolve, reject) => {
			if (this.redisPubClient.connected) {
				this.redisPubClient.quit((err) => {
					if (err) {
						return reject(err);
					}
					resolve();
				});
			}
		});

		await Promise.all(this.sources.map(i => this.removeSource(i)));

		await disposeClient();
		await disposePubClient();
		this.redisClient.removeAllListeners();
		this.redisPubClient.removeAllListeners();
		this.emitter.removeAllListeners();
	}
}

module.exports = {
	StreamUtil,
	StreamPublisher,
	Stream
};
