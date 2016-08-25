'use strict';

const apiResult = require('../modules/api-result');

exports.post = async (params, extensions) => new Promise((resolve, reject) => {
	const missingParams = getMissingParams(params, []);
	if (missingParams.length) {
		return reject(apiResult(400, 'some required parameters are missing', {target_params: missingParams}));
	}

	reject(apiResult(501, 'not implemented'));
});
