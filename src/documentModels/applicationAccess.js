'use strict';

const randomRange = require('../helpers/randomRange');

const applicationAccessModel = require('../models/applicationAccess');

module.exports = async (documentId, dbManager) => {
	const instance = {};

	instance.documentId = documentId;
	instance.dbManager = dbManager;

	instance.generateAccessKeyAsync = async () => {

		const access = dbManager.findArrayAsync('applicationAccesses', {_id: documentId})[0];
		var keyCode, isExist, tryCount = 0;

		do {
			tryCount++;
			keyCode = randomRange(1, 99999);
			isExist = dbManager.findArrayAsync('applicationAccesses', {userId: access.userId, keyCode: keyCode}).length === 0;
		}
		while(isExist && tryCount < 4);

		if (isExist && tryCount >= 4)
			throw new Error('the number of trials for keyCode generation has reached its upper limit');

		dbManager.updateAsync('applicationAccesses', {_id: documentId}, {keyCode: keyCode});

		return applicationAccessModel.buildKey(access.applicationId, access.userId, keyCode);
	};

	instance.getAccessKeyAsync = async () => {
		const access = await dbManager.findArrayAsync('applicationAccesses', {_id: documentId})[0];

		if (access == null)
			throw new Error('applicationAccess not found');

		return applicationAccessModel.buildKey(access.applicationId, access.userId, access.keyCode);
	};

	return instance;
};
