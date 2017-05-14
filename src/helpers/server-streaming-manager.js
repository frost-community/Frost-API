/**
 * SocketIO.Serverのラッパークラス
 */
class ServerStreamingManager {
	constructor(ioServer, ioServerSocket, options) {
		this.ioServer = ioServer;
		this.ioServerSocket = ioServerSocket;
		this.dataEventName = options.dataEventName != null ? options.dataEventName : 'data';
		this.restEventName = options.restEventName != null ? options.restEventName : 'rest';
		this.errorEventName = options.errorEventName != null ? options.errorEventName : 'error';
	}

	/**
	 * ストリームに基本的なイベントを発行します
	 */
	stream(arg1, arg2, arg3) {
		if (arguments.length == 3) {
			const prefix = arg1;
			const type = arg2;
			const data = arg3;

			this.stream(`${prefix}:${type}`, data);
		}
		else if (arguments.length == 2) {
			const type = arg1;
			const data = arg2;

			this.ioServer.to(this.ioServerSocket.id).emit(type, data);
		}
		else
			throw new Error('invalid arguments count');
	}

	/**
	 * ストリームにデータ送信用イベントを発行します
	 */
	data(streamType, data) {
		this.stream(this.dataEventName, streamType, data);
	}

	/**
	 * ストリームにREST APIの成功イベントを発行します
	 */
	rest(requestInfo, success, data) {
		this.stream(this.restEventName, Object.assign({request: requestInfo, success: success}, data));
	}

	/**
	 * ストリームにエラーイベントを発行します
	 */
	error(data) {
		this.stream(this.errorEventName, data);
	}

	/**
	 * イベントハンドラを登録します
	 */
	on(arg1, arg2, arg3) {
		if (arguments.length == 3) {
			const prefix = arg1;
			const type = arg2;
			const callback = arg3;

			this.on(`${prefix}:${type}`, callback);
		}
		else if (arguments.length == 2) {
			const type = arg1;
			const callback = arg2;

			this.ioServerSocket.on(type, data => {
				callback(data);
			});
		}
		else
			throw new Error('invalid arguments count');
	}

	/**
	 * ストリームを切断します
	 */
	disconnect() {
		this.ioServerSocket.disconnect();
	}

	/**
	 * ストリーム切断時のイベントハンドラを登録します
	 */
	onDisconnect(callback) {
		this.ioServerSocket.on('disconnect', callback);
	}
}

module.exports = ServerStreamingManager;
