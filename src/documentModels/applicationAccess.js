'use strict';

const randomRange = require('../helpers/randomRange');
const applicationAccessModelAsync = require('../models/applicationAccess');
const applicationAccesses = require('../helpers/collections').applicationAccesses;

module.exports = async (document, config) => {
	const instance = {};

	instance.document = document;
	instance.collection = await applicationAccesses(config);
	const applicationAccessModel = await applicationAccessModelAsync(config);

	instance.generateAccessKeyAsync = async () => {

		const access = await instance.collection.findIdAsync(instance.document._id);
		let keyCode, isExist, tryCount = 0;

		do {
			tryCount++;
			keyCode = randomRange(1, 99999);
			isExist = await instance.collection.findAsync({userId: access.userId, keyCode: keyCode}) != null;
		}
		while(isExist && tryCount < 4);

		if (isExist && tryCount >= 4)
			throw new Error('the number of trials for keyCode generation has reached its upper limit');

		await instance.collection.updateAsync({_id: instance.document._id}, {keyCode: keyCode});

		return applicationAccessModel.buildKey(access.applicationId, access.userId, keyCode);
	};

	instance.getAccessKeyAsync = async () => {
		const access = await instance.collection.findIdAsync(instance.document._id);

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

	return instance;
};
