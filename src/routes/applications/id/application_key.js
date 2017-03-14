'use strict';

const apiResult = require('../../../helpers/apiResult');
const applicationsAsync = require('../../../helpers/collections').applications;

exports.get = async (request, extensions, config) => {
	const applications = await applicationsAsync(config);

	const applicationDoc = await applications.findIdAsync(request.params.id);

	if (applicationDoc == null)
		return apiResult(400, 'application is not found');

	// 対象アプリケーションの所有者かどうか
	if (applicationDoc.document.creatorId.toString() !== request.user._id.toString())
		return apiResult(400, 'you do not own this application');

	if (applicationDoc.document.keyCode == null)
		return apiResult(400, 'application_key has not been generated yet');

	const key = await applicationDoc.getApplicationKeyAsync();

	return apiResult(200, 'success', {'application_key': key});
};

exports.post = async (request, extensions, config) => {
	const applications = await applicationsAsync(config);

	const applicationDoc = await applications.findIdAsync(request.params.id);

	if (applicationDoc == null)
		return apiResult(400, 'application is not found');

	// 対象アプリケーションの所有者かどうか
	if (applicationDoc.document.creatorId.toString() !== request.user._id.toString())
		return apiResult(400, 'you do not own this application');

	const key = await applicationDoc.generateApplicationKeyAsync();

	return apiResult(200, 'success', {'application_key': key});
};
