'use strict';

const randomRange = require('../helpers/randomRange');
const authorizeRequestModelAsync = require('../models/authorizeRequest');

module.exports = async (document, db, config) => {
	const instance = {};

	if (document == null || db == null || config == null)
		throw new Error('missing arguments');

	instance.document = document;
	const authorizeRequestModel = await authorizeRequestModelAsync(db, config);

	instance.getVerificationKeyAsync = async () => {
		let pinCode = '';
		for (let i = 0; i < 6; i++)
			pinCode += String(randomRange(0, 9));

		await db.authorizeRequests.updateAsync({_id: instance.document._id}, {pinCode: pinCode});

		return pinCode;
	};

	instance.getRequestKeyAsync = async () => {
		if (instance.document.keyCode == null) {
			// 生成が必要な場合
			const keyCode = randomRange(1, 99999);
			const cmdResult = await db.authorizeRequests.updateIdAsync(instance.document._id, {keyCode: keyCode});
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
		instance.document = (await db.authorizeRequests.findIdAsync(instance.document._id)).document;
	};

	return instance;
};
