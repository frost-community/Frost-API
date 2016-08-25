'use strict';

/**
 * リクエストパラメータに不足がないかを確認します
 *
 * @param  {string[]} params
 * @param  {string[]} requireParams
 */
module.exports = (params, requireParams) => {
	var missings = [];
	requireParams.forEach((requireParam) => {
		if (params[requireParam] == undefined || params[requireParam] === '')
			missings.push(requireParam);
	});

	return missings;
};
