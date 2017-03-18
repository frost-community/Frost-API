'use strict';

const ApiResult = require('../../../helpers/apiResult');

exports.get = async (request, extensions, db, config) => {
	const application = await db.applications.findIdAsync(request.params.id);

	if (application == null)
		return new ApiResult(400, 'application is not found');

	// 対象アプリケーションの所有者かどうかをチェック
	if (application.document.creatorId.toString() !== request.user._id.toString())
		return new ApiResult(400, 'you do not own this application');

	return new ApiResult(200, null, {application: application.serialize()});
};
