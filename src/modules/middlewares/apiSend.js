module.exports = (request, response, next) => {
	/**
	 * APIリクエストのレスポンスとして返します
	 *
	 * @param  {ApiContext} apiContext APIコールの結果情報
	 */
	response.apiSend = (apiContext) => {
		let sendData = {};

		if (!apiContext.responsed) {
			throw new Error('api has not responsed yet');
		}

		if (apiContext.statusCode == null) {
			apiContext.statusCode = 200;
		}

		if (typeof apiContext.data == 'string') {
			sendData.message = apiContext.data;
		}
		else if (apiContext.data != null) {
			sendData = apiContext.data;
		}

		/*if (apiContext.needStatusCode) {
			sendData.statusCode = apiContext.statusCode;
		}*/

		if (Object.keys(sendData).length == 0) {
			sendData = null;
		}

		response.status(apiContext.statusCode).send(sendData);
	};

	next();
};
