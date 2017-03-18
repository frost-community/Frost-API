'use strict';

const type = require('./type');

/**
 * このモジュールを初期化します
 *
 * @param  {any} response レスポンス
 */
module.exports = response => {
	/**
	 * リクエストが成功したことを示すオブジェクトをレスポンスとして返します
	 *
	 * @param  {ApiResult} apiResult APIコールの結果情報
	 */
	response.success = (apiResult) => {
		let sendData = {};

		if (apiResult.statusCode == null)
			apiResult.statusCode = 200;

		if (type(apiResult.data) == 'String')
			sendData.message = apiResult.data;
		else if (apiResult.data != null)
			sendData = apiResult.data;
		else
			sendData.message = 'success';

		response.status(apiResult.statusCode).send(sendData);
	};

	/**
	 * エラーオブジェクトをレスポンスとして返します
	 *
	 * @param  {ApiResult} apiResult APIコールの結果情報
	 */
	response.error = (apiResult) => {
		let sendData = {};

		if (apiResult.statusCode == null)
			apiResult.statusCode = 400;

		if (type(apiResult.data) == 'String')
			sendData.message = apiResult.data;
		else if (apiResult.data != null)
			sendData = apiResult.data;
		else
			apiResult.message = 'failure';

		response.status(apiResult.statusCode).send({error: sendData});
	};
};
