'use strict';

const merge = require('./merge');

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
		if (apiResult.statusCode == null)
			apiResult.statusCode = 200;

		const sendData = {};

		if (apiResult.message != null)
			sendData.message = apiResult.message;

		if (apiResult.data != null)
			merge(sendData, apiResult.data);

		response.status(apiResult.statusCode).send(sendData);
	};

	/**
	 * エラーオブジェクトをレスポンスとして返します
	 *
	 * @param  {ApiResult} apiResult APIコールの結果情報
	 */
	response.error = (apiResult) => {
		if (apiResult.statusCode == null)
			apiResult.statusCode = 400;

		const sendData = {};

		if (apiResult.message != null)
			sendData.message = apiResult.message;

		if (apiResult.data != null)
			merge(sendData, apiResult.data);

		response.status(apiResult.statusCode).send({error: sendData});
	};
};
