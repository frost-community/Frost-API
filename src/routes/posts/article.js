'use strict';

const apiResult = require('../../modules/api-result');

exports.post = async (request, extensions) => {
	throw new Error(apiResult(501, 'not implemented'));
};
