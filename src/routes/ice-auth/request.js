'use strict';

const apiResult = require('../../modules/api-result');

exports.post = (request, extensions) => new Promise((resolve, reject) => (async () => {
	reject(apiResult(501, 'not implemented'));
})());
