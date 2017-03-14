'use strict';

const randomRange = require('../helpers/randomRange');
const authorizeRequestModelAsync = require('../models/authorizeRequest');
const authorizeRequestsAsync = require('../helpers/collections').authorizeRequests;

module.exports = async (document, config) => {
	const instance = {};

	instance.document = document;
	const authorizeRequests = await authorizeRequestsAsync(config);
	const authorizeRequestModel = await authorizeRequestModelAsync(config);

	instance.getVerificationKeyAsync = async () => {
		let pinCode = '';
		for (let i = 0; i < 6; i++)
			pinCode += String(randomRange(0, 9));

		await authorizeRequests.updateAsync({_id: instance.document._id}, {pinCode: pinCode});

		return pinCode;
	};

	instance.getRequestKeyAsync = async () => {
		if (instance.document.keyCode == null) {
			// 生成が必要な場合
			const keyCode = randomRange(1, 99999);
			const cmdResult = await authorizeRequests.updateIdAsync(instance.document._id, {keyCode: keyCode});
			await instance.sync();
		}

		return authorizeRequestModel.buildKey(instance.document._id, instance.document.applicationId, instance.document.keyCode);
	};

	instance.serialize = () => {
		const res = {};
		Object.assign(res, instance.document);

		// id
		res.id = res._id.toString();
		delete res._id;

		return res;
	};

	// 最新の情報を取得して同期する
	instance.sync = async () => {
		instance.document = (await authorizeRequests.findIdAsync(instance.document._id)).document;
	};

	return instance;
};
