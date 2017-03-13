'use strict';

const randomRange = require('../helpers/randomRange');
const authorizeRequestModelAsync = require('../models/authorizeRequest');
const authorizeRequests = require('../helpers/collections').authorizeRequests;

module.exports = async (document, config) => {
	const instance = {};

	// id加工
	document.id = document._id.toString();
	delete document._id;

	instance.document = document;
	instance.collection = await authorizeRequests(config);
	const authorizeRequestModel = await authorizeRequestModelAsync(config);

	instance.getVerificationKeyAsync = async () => {
		let pinCode = '';
		for (let i = 0; i < 6; i++)
			pinCode += String(randomRange(0, 9));

		await instance.collection.updateAsync({_id: document.id}, {pinCode: pinCode});

		return pinCode;
	};

	instance.getRequestKeyAsync = async () => {
		let request = await instance.collection.findIdAsync(document.id);

		if (request == null)
			throw new Error('authorizeRequest not found');

		if (request.keyCode == null)
		{
			// 生成が必要な場合
			const keyCode = randomRange(1, 99999);
			const hoge = await instance.collection.updateAsync({_id: document.id}, {keyCode: keyCode});
			console.log(hoge);
			request = await instance.collection.findIdAsync(document.id);
		}

		return authorizeRequestModel.buildKey(request.id, request.applicationId, request.keyCode);
	};

	return instance;
};
