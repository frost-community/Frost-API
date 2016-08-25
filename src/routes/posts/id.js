'use strict';

const apiResult = require('../../modules/api-result');
const getMissingParams = require('../../modules/get-missing-params');

exports.get = (params, extensions) => new Promise((resolve, reject) => (async () => {
	const missingParams = getMissingParams(params, []);
	if (missingParams.length) {
		return reject(apiResult(400, 'some required parameters are missing', {target_params: missingParams}));
	}

	reject(apiResult(501, 'not implemented'));
})());
