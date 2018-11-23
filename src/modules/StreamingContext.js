class StreamingContext {
	constructor(eventName, streamingConnection, reqData) {
		this.eventName = eventName;
		this.connection = streamingConnection;
		this.reqData = reqData;
	}
	send(data) {
		this.connection.send(this.eventName, data);
	}
	error(message, details = null) {
		this.connection.error(this.eventName, message, details);
	}
}
module.exports = StreamingContext;

