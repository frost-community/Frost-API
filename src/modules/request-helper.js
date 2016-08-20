'use strict';

let _request;

/**
 * このモジュールを初期化します
 *
 * @param  {any} request リクエスト
 */
var init = request => {
	_request = request;
	_request.haveParams = haveParams;
};
module.exports = init;

/**
 * リクエストパラメータに不足がないかを確認します
 *
 * @param  {string[]} requireParams
 */
var haveParams = (requireParams, response) => {
	var missings = [];
	requireParams.forEach((requireParam)=>{
		if (_request.body[requireParam] == undefined || _request.body[requireParam] === '')
			missings.push(requireParam);
	});

	if (missings.length !== 0)
		response.error({message: 'some required parameters are missing', target_params: missings});

	return missings.length === 0;
};
