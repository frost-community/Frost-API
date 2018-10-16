const redis = require('redis');
const { EventEmitter } = require('events');

class RedisEventReciever {
	/** @param {redis.RedisClient} redisClient */
	constructor(namespace, redisOptions = { host: 'localhost', port: 6379 }) {
		this.namespace = namespace;
		this.emitter = new EventEmitter();
		this.redis = redis.createClient(redisOptions);

		this.redis.on('message', (channel, message) => {
			// 自身のリスナーに対して投げる
			this.emitter.emit('data', (message instanceof String) ? message : JSON.parse(message));
		});
		this.redis.on('error', (err) => {
			throw new Error(`redis(reciever): ${String(err)}`);
		});

		this.redis.subscribe(this.namespace, (err) => {
			if (err) {
				throw new Error('redis: failed to subscribe');
			}
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
		const disposeRedis = () => new Promise((resolve, reject) => {
			if (this.redis.connected) {
				this.redis.quit((err) => {
					if (err) {
						return reject(err);
					}
					resolve();
				});
			}
		});
		const unsubscribe = () => new Promise((resolve, reject) => {
			this.redis.unsubscribe(this.namespace, (err) => {
				if (err) {
					return reject(err);
				}
				resolve();
			});
		});

		await unsubscribe();
		await disposeRedis();
		this.redis.removeAllListeners();
		this.emitter.removeAllListeners();
	}
}

class RedisEventSender {
	constructor(namespace, redisOptions = { host: 'localhost', port: 6379 }) {
		this.namespace = namespace;
		this.redis = redis.createClient(redisOptions);
		this.redis.on('error', (err) => {
			throw new Error(`redis(sender): ${String(err)}`);
		});
	}
	/**
	 * @param {string} type
	 * @param {string} publisherId
	 * @param {string | {[x:string]:any}} data JSON data or object
	*/
	publish(eventId, data) {
		return new Promise((resolve, reject) => {
			let strData = JSON.stringify({ eventId, data });
			this.redis.publish(this.namespace, strData, (err) => {
				if (err) {
					return reject(err);
				}
				resolve();
			});
		});
	}
	async dispose() {
		const dispose = () => new Promise((resolve, reject) => {
			if (this.redis.connected) {
				this.redis.quit((err) => {
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
		this.redis.removeAllListeners();
	}
}

module.exports = {
	RedisEventReciever,
	RedisEventSender
};
