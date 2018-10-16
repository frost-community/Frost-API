const XevPubSub = require('./XevPubSub');
const { EventEmitter } = require('events');
const EventIdHelper = require('./helpers/EventIdHelper');

class LocalStream {
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

class LocalStreamPublisher {
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
		const streamEventId = EventIdHelper.buildEventId(['stream', type, publisherId]);
		this.xev.publish(streamEventId, strData);
	}
	dispose() {
		this.xev.removeAllListeners();
		this.xev.dispose();
	}
}

module.exports = {
	LocalStream,
	LocalStreamPublisher
};
