const XevPubSub = require('./XevPubSub');
const redis = require('redis');
const { EventEmitter } = require('events');

class EventIdUtil {
	/**
	 * @param {string} serviceId
	 * @param {string} eventType
	 * @param {string[]} params
	*/
	static buildEventId(serviceId, eventType, ...params) {
		return `${serviceId}:${eventType}:${params.join(':')}`;
	}
	/** @param {string} eventId */
	static parseEventId(eventId) {
		const elements = eventId.split(':');
		if (elements.length < 2) {
			throw new Error(`invalid eventId: ${eventId}`);
		}
		const appendedParams = [];
		if (elements.length >= 3) {
			appendedParams.push(...elements.slice(2));
		}
		return {
			serviceId: elements[0],
			eventType: elements[1],
			appendedParams: appendedParams
		};
	}
}

class StreamEventIdUtil {
	/**
	 * @param {string} streamType
	 * @param {string} publisherId
	*/
	static buildStreamEventId(streamType, publisherId) {
		return EventIdUtil.buildEventId('frost-api', 'stream', [streamType, publisherId]);
	}
	/** @param {string} eventId */
	static parseStreamEventId(eventId) {
		const elements = EventIdUtil.parseEventId(eventId);
		if (elements.serviceId != 'frost-api') {
			throw new Error('serviceId is not frost-api');
		}
		if (elements.eventType != 'stream') {
			throw new Error('eventType is not stream');
		}
		if (elements.appendedParams.length != 2) {
			throw new Error('length of appendedParams is invalid');
		}
		return {
			serviceId: elements.appendedParams[0],
			eventType: elements.appendedParams[1]
		};
	}
}

class XevStream {
	/** @param {redis.RedisClient} redisClient */
	constructor() {
		this.sources = [];
		this.emitter = new EventEmitter();
		this.xev = new XevPubSub('frost-api');
		this.xev.on('message', (channel, message) => {
			// 自身のリスナーに対して投げる
			this.emitter.emit('data', (message instanceof String) ? message : JSON.parse(message));
			// 設定した別のStreamに投げる
			if (this.outgoingStreamId != null) {
				this.xev.publish(this.outgoingStreamId, message);
			}
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
		this.xev.subscribe(streamId);
		this.sources.push(streamId);
	}
	/** @param {string} streamId */
	removeSource(streamId) {
		const index = this.sources.indexOf(streamId);
		if (index == -1) {
			throw new Error('not exist');
		}
		this.xev.unsubscribe(streamId);
		this.sources.splice(index, 1);
	}
	/**
	 * @param {(data: string | {[x:string]:any})=>void} listener
	 * @returns listener
	*/
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
	dispose() {
		this.sources.map(i => this.removeSource(i));
		this.xev.dispose();
		this.xev.removeAllListeners();
		this.emitter.removeAllListeners();
	}
}

class XevStreamPublisher {
	constructor() {
		this.xev = new XevPubSub('frost-api');
	}
	/**
	 * @param {string} type
	 * @param {string} publisherId
	 * @param {string | {[x:string]:any}} data JSON data or object
	*/
	publish(type, publisherId, data) {
		let strData = (data instanceof String) ? data : JSON.stringify(data);
		const streamEventId = StreamEventIdUtil.buildStreamEventId(type, publisherId);
		this.xev.publish(streamEventId, strData);
	}
	dispose() {
		this.xev.removeAllListeners();
		this.xev.dispose();
	}
}

class RedisStream {
	/** @param {redis.RedisClient} redisClient */
	constructor(redisOptions = { host: 'localhost', port: 6379 }) {
		this.sources = [];
		this.emitter = new EventEmitter();
		this.redis = {
			sub: redis.createClient(redisOptions),
			pub: redis.createClient(redisOptions)
		};
		this.redis.sub.on('message', (channel, message) => {
			// 自身のリスナーに対して投げる
			this.emitter.emit('data', (message instanceof String) ? message : JSON.parse(message));
			// 設定した別のStreamに投げる
			if (this.outgoingStreamId != null) {
				this.redis.pub.publish(this.outgoingStreamId, message);
			}
		});
		this.redis.sub.on('error', (err) => {
			throw new Error(`redis(sub): ${String(err)}`);
		});
		this.redis.pub.on('error', (err) => {
			throw new Error(`redis(pub): ${String(err)}`);
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
			this.redis.sub.subscribe(streamId, (err) => {
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
			this.redis.sub.unsubscribe(streamId, (err) => {
				if (err) {
					return reject(err);
				}
				this.sources.splice(index, 1);
				resolve();
			});
		});
	}
	/**
	 * @param {(data: string | {[x:string]:any})=>void} listener
	 * @returns listener
	*/
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
		const disposeRedisSub = () => new Promise((resolve, reject) => {
			if (this.redis.sub.connected) {
				this.redis.sub.quit((err) => {
					if (err) {
						return reject(err);
					}
					resolve();
				});
			}
		});
		const disposeRedisPub = () => new Promise((resolve, reject) => {
			if (this.redis.pub.connected) {
				this.redis.pub.quit((err) => {
					if (err) {
						return reject(err);
					}
					resolve();
				});
			}
		});

		await Promise.all(this.sources.map(i => this.removeSource(i)));
		await disposeRedisSub();
		await disposeRedisPub();
		this.redis.sub.removeAllListeners();
		this.redis.pub.removeAllListeners();
		this.emitter.removeAllListeners();
	}
}

class RedisStreamPublisher {
	constructor(redisOptions = { host: 'localhost', port: 6379 }) {
		this.redisPub = redis.createClient(redisOptions);
		this.redisPub.on('error', (err) => {
			throw new Error(`stream(pub): ${String(err)}`);
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
			const streamEventId = StreamEventIdUtil.buildStreamEventId(type, publisherId);
			this.redisPub.publish(streamEventId, strData, (err) => {
				if (err) {
					return reject(err);
				}
				resolve();
			});
		});
	}
	async dispose() {
		const dispose = () => new Promise((resolve, reject) => {
			if (this.redisPub.connected) {
				this.redisPub.quit((err) => {
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

		await dispose();
		this.redisPub.removeAllListeners();
	}
}

module.exports = {
	EventIdUtil,
	StreamEventIdUtil,
	XevStream,
	XevStreamPublisher,
	RedisStream,
	RedisStreamPublisher
};
