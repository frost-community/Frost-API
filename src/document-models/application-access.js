'use strict';

const randomRange = require('../modules/random-range');

module.exports = async (documentId, dbManager) => {
	const instance = {};

	instance.generateAccessKey = async () => {

		const access = dbManager.findArrayAsync('applicationAccesses', {_id: documentId})[0];
		var keyCode, isExist, tryCount = 0;

		do {
			tryCount++;
			keyCode = randomRange(1, 99999);
			const isExist = dbManager.findArrayAsync('applicationAccesses', {user_id: access.user_id, key_code: keyCode}).length === 0;

		} while(isExist && tryCount < 4);

		if (isExist && tryCount >= 4)
			throw new Error('the number of trials for key_code generation has reached its upper limit');

		dbManager.updateAsync('applicationAccesses', {_id: documentId}, {key_code: keyCode});

		return applicationAccessHelper.buildAccessKey(access.application_id, access.user_id, keyCode);
	};

	instance.getAccessKey = async () => {
		const access = await dbManager.findArrayAsync('applicationAccesses', {_id: documentId})[0];

		if (access == undefined)
			throw new Error('application-access not found');

		return applicationAccessHelper.buildAccessKey(access.application_id, access.user_id, access.key_code);
	};

	return instance;
};
