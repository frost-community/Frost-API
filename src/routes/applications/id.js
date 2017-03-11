'use strict';

const apiResult = require('../../helpers/apiResult');
const applications = require('../../collections/applications');

exports.get = async (request, extensions, config) => {
	const applicationDoc = await (await applications(config)).findIdAsync(request.params.id);

	if (applicationDoc == null)
		return apiResult(400, 'application is not found');

	// 対象アプリケーションの所有者かどうかをチェック
	if (applicationDoc.document.creatorId !== request.user.id)
		return apiResult(400, 'you do not own this application');

	return apiResult(200, 'success', {application: applicationDoc.document});
};
