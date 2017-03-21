'use strict';

const ApiResult = require('../../../helpers/apiResult');
const Application = require('../../../documentModels/application');

exports.get = async (request) => {
	const application = await Application.findByIdAsync(request.params.id, request.db, request.config);

	if (application == null)
		return new ApiResult(400, 'application is not found');

	// 対象アプリケーションの所有者かどうか
	if (application.document.creatorId.toString() !== request.user.document._id.toString())
		return new ApiResult(400, 'you do not own this application');

	return new ApiResult(501, 'not implement');
};

exports.post = async (request) => {
	const application = await Application.findByIdAsync(request.params.id, request.db, request.config);

	if (application == null)
		return new ApiResult(400, 'application is not found');

	// 対象アプリケーションの所有者かどうか
	if (application.document.creatorId.toString() !== request.user.document._id.toString())
		return new ApiResult(400, 'you do not own this application');

	return new ApiResult(501, 'not implement');
};
