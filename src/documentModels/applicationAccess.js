'use strict';

const randomRange = require('../helpers/randomRange');
const applicationAccessModelAsync = require('../models/applicationAccess');
const applicationAccesses = require('../helpers/collections').applicationAccesses;

module.exports = async (document, config) => {
	const instance = {};

	// id加工
	document.id = document._id.toString();
	delete document._id;

	instance.document = document;
	instance.collection = await applicationAccesses(config);
	const applicationAccessModel = await applicationAccessModelAsync(config);

	instance.generateAccessKeyAsync = async () => {

		const access = await instance.collection.findIdAsync(document.id);
		let keyCode, isExist, tryCount = 0;

		do {
			tryCount++;
			keyCode = randomRange(1, 99999);
			isExist = await instance.collection.findAsync({userId: access.userId, keyCode: keyCode}) != null;
		}
		while(isExist && tryCount < 4);

		if (isExist && tryCount >= 4)
			throw new Error('the number of trials for keyCode generation has reached its upper limit');

		await instance.collection.updateAsync({_id: document.id}, {keyCode: keyCode});

		return applicationAccessModel.buildKey(access.applicationId, access.userId, keyCode);
	};

	instance.getAccessKeyAsync = async () => {
		const access = await instance.collection.findIdAsync(document.id);

		if (access == null)
			throw new Error('applicationAccess not found');

		return applicationAccessModel.buildKey(access.applicationId, access.userId, access.keyCode);
	};

	return instance;
};
