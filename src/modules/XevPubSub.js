const Xev = require('xev').default;
const { EventEmitter } = require('events');

class XevPubSub extends EventEmitter {
	constructor(namespace) {
		super();
		this.parentEmitter = new Xev(namespace);
		this.list = {};
		this.handler = (channel) => (message) => this.emit('message', channel, message);
	}
	subscribe(channelName) {
		if (this.list[channelName] == null) {
			const handler = this.handler(channelName);
			this.parentEmitter.on(channelName, handler);
			this.list[channelName] = handler;
		}
	}
	unsubscribe(channelName) {
		if (this.list[channelName] != null) {
			this.parentEmitter.removeListener(channelName, this.list[channelName]);
			this.list[channelName] = null;
		}
	}
	publish(channelName, message) {
		this.parentEmitter.emit(channelName, message);
	}
	dispose() {
		for (const channel of Object.keys(this.list)) {
			this.unsubscribe(channel);
		}
		this.parentEmitter.dispose();
	}
}
module.exports = XevPubSub;
