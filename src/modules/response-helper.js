'use strict';

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
 * @param  {Object|string} content レスポンスに含めるオブジェクトまたは文字列
 * @param  {Number} statusCode HTTPステータスコード
 */
var success = (content, statusCode) => {
	statusCode = statusCode || 200;

	if (typeof (content) === "string")
	{
		_response.status(statusCode).send({message: content});
	}
	else
	{
		_response.status(statusCode).send(content);
	}
};

/**
 * エラーオブジェクトをレスポンスとして返します
 *
 * @param  {Object|string} content レスポンスに含めるオブジェクトまたは文字列
 * @param  {Number} statusCode HTTPステータスコード
 */
var error = (content, statusCode) => {
	statusCode = statusCode || 400;

	if (typeof (content) === "string")
	{
		_response.status(statusCode).send({error: {message: content}});
	}
	else
	{
		_response.status(statusCode).send({error: content});
	}
};
