const redis = require('redis');
const { EventEmitter } = require('events');
const { promisify } = require('util');

class RedisEventEmitter extends EventEmitter {
	/**
	 * @param {string} namespace
	 * @param {boolean} isReceveMode
	 * @param {{host: string, port: number}} redisOptions
	*/
	constructor(namespace, isReceveMode, redisOptions = { host: 'localhost', port: 6379 }) {
		super();
		this.namespace = namespace;
		this._isReceveMode = isReceveMode;
		this._redis = redis.createClient(redisOptions);
		this._redis.on('error', (err) => {
			throw new Error(`[RedisEventEmitter] ${String(err)}`);
		});
		if (this._isReceveMode) {
			this._redis.on('message', (namespace, json) => {
				let event;
				try {
					event = JSON.parse(json);
				}
				catch (err) {
					console.warn('recieved redis event is not json format.');
					return;
				}
				if (event.event == null || event.data == null) {
					return;
				}
				super.emit(event.event, event.data);
			});
			this._redis.subscribe(this.namespace, (err) => {
				if (err) {
					throw new Error('[RedisEventEmitter] failed to subscribe');
				}
			});
		}
	}
	async emit(event, data) {
		if (this._isReceveMode) {
			throw new Error('emit is disable. this RedisEventEmitter is recieve mode.');
		}
		/** @type {(channel: string, value: string) => Promise<boolean>} */
		const publish = promisify(this._redis.publish).bind(this._redis);
		await publish(this.namespace, JSON.stringify({ event, data }));
	}
	async dispose() {
		const quit = promisify(this._redis.quit).bind(this._redis);
		const unsubscribe = promisify(this._redis.unsubscribe).bind(this._redis);
		if (this._isReceveMode) {
			await unsubscribe(this.namespace);
			this.removeAllListeners();
		}
		if (this._redis.connected) {
			await quit();
		}
		this._redis.removeAllListeners();
	}
}
module.exports = RedisEventEmitter;
