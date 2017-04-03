'use strict';

const ApiResult = require('../../../helpers/apiResult');
const Application = require('../../../documentModels/application');
const mongo = require('mongodb');

exports.get = async (request) => {
	const result = await request.checkRequestAsync({
		permissions: ['application']
	});

	if (result != null)
		return result;

	let application;
	try {
		const applicationId = mongo.ObjectId(request.params.id);
		application = await Application.findByIdAsync(applicationId, request.db, request.config);
	}
	catch(err) {
		// noop
	}

	if (application == null)
		return new ApiResult(404, 'application is not found');

	// 対象アプリケーションの所有者かどうか
	if (application.document.creatorId.toString() !== request.user.document._id.toString())
		return new ApiResult(400, 'you do not own this application');

	return new ApiResult(200, {application: application.serialize()});
};
