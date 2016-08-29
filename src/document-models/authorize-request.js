'use strict';

const randomRange = require('../modules/random-range');

module.exports = async (documentId, dbManager) => {
	const instance = {};

	instance.documentId = documentId;
	instance.dbManager = dbManager;

	instance.generatePinCode = async () => {
		var pinCode = "";
		for (var i = 0; i < 6; i++)
			pinCode += String(randomRange(0, 9));

		dbManager.updateAsync('authorizeRequests', {_id: documentId}, {pin_code: pinCode});

		return pinCode;
	};

	instance.generateRequestKey = async () => {
		// TODO
	};

	instance.getRequestKey = async () => {
		// TODO
	};

	return instance;
};
