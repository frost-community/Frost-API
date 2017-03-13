'use strict';

const apiResult = require('../../../helpers/apiResult');
const applicationsAsync = require('../../../helpers/collections').applications;

exports.get = async (request, extensions, config) => {
	const applications = await applicationsAsync(config);

	const applicationDoc = await applications.findIdAsync(request.params.id);

	if (applicationDoc == null)
		return apiResult(400, 'application is not found');

	// 対象アプリケーションの所有者かどうかをチェック
	if (applicationDoc.document.creatorId !== request.user.id)
		return apiResult(400, 'you do not own this application');

	if (applicationDoc.document['key_code'] == null)
		return apiResult(400, 'application_key has not been generated yet');

	const key = await applicationDoc.getApplicationKeyAsync();

	return apiResult(200, 'success', {'application_key': key});
};

exports.post = async (request, extensions, config) => {
	const applications = await applicationsAsync(config);

	const applicationDoc = await applications.findIdAsync(request.params.id);

	if (applicationDoc == null)
		return apiResult(400, 'application is not found');

	// 対象アプリケーションの所有者かどうかをチェック
	if (applicationDoc.document.creatorId !== request.user.id)
		return apiResult(400, 'you do not own this application');

	const key = await applicationDoc.generateApplicationKeyAsync();

	return apiResult(200, 'success', {'application_key': key});
};
