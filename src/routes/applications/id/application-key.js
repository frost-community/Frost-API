'use strict';

const apiResult = require('../../../modules/api-result');

exports.get = (request, extensions) => new Promise((resolve, reject) => (async () => {
	reject(apiResult(501, 'not implemented'));
})());

exports.post = (request, extensions) => new Promise((resolve, reject) => (async () => {
	reject(apiResult(501, 'not implemented'));
})());
