'use strict';

const type = require('../type');

module.exports = (request, response, next) => {
	/**
	 * APIリクエストのレスポンスとして返します
	 *
	 * @param  {ApiResult} apiResult APIコールの結果情報
	 */
	response.apiSend = (apiResult) => {
		let sendData = {};

		if (apiResult.statusCode == null)
			apiResult.statusCode = 200;

		if (type(apiResult.data) == 'String')
			sendData.message = apiResult.data;
		else if (apiResult.data != null)
			sendData = apiResult.data;

		response.status(apiResult.statusCode).send(sendData);
	};

	next();
};
