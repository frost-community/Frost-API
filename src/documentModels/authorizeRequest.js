'use strict';

const randomRange = require('../helpers/randomRange');

const authorizeRequestModel = require('../models/authorizeRequest');

module.exports = async (document, dbManager) => {
	const instance = {};

	// id加工
	document.id = document._id.toString();
	delete document._id;

	instance.document = document;
	instance.dbManager = dbManager;

	instance.getVerificationKeyAsync = async () => {
		let pinCode = '';
		for (let i = 0; i < 6; i++)
			pinCode += String(randomRange(0, 9));

		dbManager.updateAsync('authorizeRequests', {_id: document.id}, {pinCode: pinCode});

		return pinCode;
	};

	instance.getRequestKeyAsync = async () => {
		const request = await dbManager.findArrayAsync('authorizeRequests', {_id: document.id})[0];

		if (request == null)
			throw new Error('authorizeRequest not found');

		if (request.keyCode == null)
		{
			// 生成が必要な場合
			const keyCode = randomRange(1, 99999);
			dbManager.updateAsync('authorizeRequests', {_id: document.id}, {keyCode: keyCode});
			const request = await dbManager.findArrayAsync('authorizeRequests', {_id: document.id})[0];
		}

		return authorizeRequestModel.buildKey(request._id, request.applicationId, request.keyCode);
	};

	return instance;
};
