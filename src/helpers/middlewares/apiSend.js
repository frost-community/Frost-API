'use strict';

module.exports = (request, response, next) => {
	/**
	 * APIリクエストのレスポンスとして返します
	 *
	 * @param  {ApiResult} apiResult APIコールの結果情報
	 */
	response.apiSend = (apiResult) => {
		let sendData = {};

		if (apiResult.statusCode == null) {
			apiResult.statusCode = 200;
		}

		if (typeof apiResult.data == 'string') {
			sendData.message = apiResult.data;
		}
		else if (apiResult.data != null) {
			sendData = apiResult.data;
		}

		sendData.statusCode = apiResult.statusCode;

		response.status(apiResult.statusCode).send(sendData);
	};

	next();
};
