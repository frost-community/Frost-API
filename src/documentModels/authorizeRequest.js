'use strict';

const randomRange = require('../helpers/randomRange');
const authorizeRequestModelAsync = require('../models/authorizeRequest');
const authorizeRequests = require('../helpers/collections').authorizeRequests;

module.exports = async (document, config) => {
	const instance = {};

	instance.document = document;
	instance.collection = await authorizeRequests(config);
	const authorizeRequestModel = await authorizeRequestModelAsync(config);

	instance.getVerificationKeyAsync = async () => {
		let pinCode = '';
		for (let i = 0; i < 6; i++)
			pinCode += String(randomRange(0, 9));

		await instance.collection.updateAsync({_id: instance.document._id}, {pinCode: pinCode});

		return pinCode;
	};

	instance.getRequestKeyAsync = async () => {
		let request = await instance.collection.findIdAsync(instance.document._id);

		if (request == null)
			throw new Error('authorizeRequest not found');

		if (request.keyCode == null)
		{
			// 生成が必要な場合
			const keyCode = randomRange(1, 99999);
			const hoge = await instance.collection.updateAsync({_id: instance.document._id}, {keyCode: keyCode});
			console.log(hoge);
			request = await instance.collection.findIdAsync(instance.document._id);
		}

		return authorizeRequestModel.buildKey(request._id, request.applicationId, request.keyCode);
	};

	instance.serialize = () => {
		const res = {};
		Object.assign(res, instance.document);

		// id
		res.id = res._id.toString();
		delete res._id;

		return res;
	};

	return instance;
};
