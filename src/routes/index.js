'use strict';

const apiResult = require('../modules/api-result');

exports.get = async (params, extensions) => new Promise((resolve, reject) => {
	resolve(apiResult(200, "Frost API Server"));
});
