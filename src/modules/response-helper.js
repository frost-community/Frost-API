'use strict';

const merge = require('./merge');

/**
 * このモジュールを初期化します
 *
 * @param  {any} response レスポンス
 */
module.exports = response => {
	var instance = {};

	/**
	 * リクエストが成功したことを示すオブジェクトをレスポンスとして返します
	 *
	 * @param  {ApiResult} apiResult APIコールの結果情報
	 */
	instance.success = (apiResult) => {
		if (apiResult.statusCode == undefined)
			apiResult.statusCode = 200;

		var sendData = {};

		if (apiResult.message != undefined)
			sendData.message = apiResult.message;

		if (apiResult.data != undefined)
			merge(sendData, apiResult.data);

		_response.status(apiResult.statusCode).send(sendData);
	};

	/**
	 * エラーオブジェクトをレスポンスとして返します
	 *
	 * @param  {ApiResult} apiResult APIコールの結果情報
	 */
	instance.error = (apiResult) => {
		if (apiResult.statusCode == undefined)
			apiResult.statusCode = 400;

		var sendData = {};

		if (apiResult.message != undefined)
			sendData.message = apiResult.message;

		if (apiResult.data != undefined)
			merge(sendData, apiResult.data);

		_response.status(apiResult.statusCode).send({error: sendData});
	};

	return instance;
};
