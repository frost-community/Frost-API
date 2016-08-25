'use strict';

const merge = require('./merge');

let _response;

/**
 * このモジュールを初期化します
 *
 * @param  {any} response レスポンス
 */
var init = response => {
	_response = response;

	_response.success = success;
	_response.error = error;
};
module.exports = init;

/**
 * リクエストが成功したことを示すオブジェクトをレスポンスとして返します
 *
 * @param  {ApiResult} apiResult APIコールの結果情報
 */
var success = (apiResult) => {
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
var error = (apiResult) => {
	if (apiResult.statusCode == undefined)
		apiResult.statusCode = 400;

	var sendData = {};

	if (apiResult.message != undefined)
		sendData.message = apiResult.message;

	if (apiResult.data != undefined)
		merge(sendData, apiResult.data);

	_response.status(apiResult.statusCode).send({error: sendData});
};
