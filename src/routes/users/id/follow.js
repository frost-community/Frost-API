'use strict';

exports.delete = (request, response, extensions) => {
	if (!request.haveParams([], response))
		return;

	response.error('not implemented', 501);
}

exports.post = (request, response, extensions) => {
	if (!request.haveParams([], response))
		return;

	response.error('not implemented', 501);
}
