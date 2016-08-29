'use strict';

const apiResult = require('../../../modules/api-result');

exports.get = async (request, extensions) => {
	throw new Error(apiResult(501, 'not implemented'));
};

exports.post = async (request, extensions) => {
	throw new Error(apiResult(501, 'not implemented'));
};
