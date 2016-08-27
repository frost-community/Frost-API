'use strict';

const apiResult = require('../modules/api-result');

exports.get = (request, extensions) => new Promise((resolve, reject) => (async () => {
	resolve(apiResult(200, "Frost API Server"));
})());
