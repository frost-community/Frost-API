'use strict';

const randomRange = require('../helpers/randomRange');
const applicationAccessModelAsync = require('../models/applicationAccess');

module.exports = async (document, db, config) => {
	const instance = {};

	if (document == null || db == null || config == null)
		throw new Error('missing arguments');

	instance.document = document;
	const applicationAccessModel = await applicationAccessModelAsync(db, config);

	instance.generateAccessKeyAsync = async () => {

		const access = await db.applicationAccesses.findIdAsync(instance.document._id);
		let keyCode, isExist, tryCount = 0;

		do {
			tryCount++;
			keyCode = randomRange(1, 99999);
			isExist = await db.applicationAccesses.findAsync({userId: access.userId, keyCode: keyCode}) != null;
		}
		while(isExist && tryCount < 4);

		if (isExist && tryCount >= 4)
			throw new Error('the number of trials for keyCode generation has reached its upper limit');

		await db.applicationAccesses.updateAsync({_id: instance.document._id}, {keyCode: keyCode});

		return applicationAccessModel.buildKey(access.applicationId, access.userId, keyCode);
	};

	instance.getAccessKeyAsync = async () => {
		const access = await db.applicationAccesses.findIdAsync(instance.document._id);

		if (access == null)
			throw new Error('applicationAccess not found');

		return applicationAccessModel.buildKey(access.document.applicationId, access.document.userId, access.document.keyCode);
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
		instance.document = (await db.applicationAccesses.findIdAsync(instance.document._id)).document;
	};

	return instance;
};
