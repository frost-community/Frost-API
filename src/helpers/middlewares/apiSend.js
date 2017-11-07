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

		if (apiResult.needStatusCode) {
			sendData.statusCode = apiResult.statusCode;
		}

		if (Object.keys(sendData).length == 0) {
			sendData = null;
		}

		response.status(apiResult.statusCode).send(sendData);
	};

	next();
};
