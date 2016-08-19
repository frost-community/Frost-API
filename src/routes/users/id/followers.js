'use strict';

exports.get = function (request, response, extensions) {
	if (!request.haveParams([], response))
		return;

	response.error('not implemented', 501);
}
