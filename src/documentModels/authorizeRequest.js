'use strict';

const randomRange = require('../helpers/randomRange');

const authorizeRequestModel = require('../models/authorizeRequest');

module.exports = async (documentId, dbManager) => {
	const instance = {};

	instance.documentId = documentId;
	instance.dbManager = dbManager;

	instance.getVerificationKeyAsync = async () => {
		let pinCode = '';
		for (let i = 0; i < 6; i++)
			pinCode += String(randomRange(0, 9));

		dbManager.updateAsync('authorizeRequests', {_id: documentId}, {pinCode: pinCode});

		return pinCode;
	};

	instance.getRequestKeyAsync = async () => {
		const request = await dbManager.findArrayAsync('authorizeRequests', {_id: documentId})[0];

		if (request == null)
			throw new Error('authorizeRequest not found');

		if (request.keyCode == null)
		{
			// 生成が必要な場合
			const keyCode = randomRange(1, 99999);
			dbManager.updateAsync('authorizeRequests', {_id: documentId}, {keyCode: keyCode});
			const request = await dbManager.findArrayAsync('authorizeRequests', {_id: documentId})[0];
		}

		return authorizeRequestModel.buildKey(request._id, request.applicationId, request.keyCode);
	};

	return instance;
};
