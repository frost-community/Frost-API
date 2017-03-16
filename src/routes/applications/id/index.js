'use strict';

const apiResult = require('../../../helpers/apiResult');

exports.get = async (request, extensions, db, config) => {
	const applicationDoc = await db.applications.findIdAsync(request.params.id);

	if (applicationDoc == null)
		return apiResult(400, 'application is not found');

	// 対象アプリケーションの所有者かどうかをチェック
	if (applicationDoc.document.creatorId.toString() !== request.user._id.toString())
		return apiResult(400, 'you do not own this application');

	return apiResult(200, 'success', {application: applicationDoc.serialize()});
};
