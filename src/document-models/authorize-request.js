'use strict';

module.exports = async (documentId, dbManager) => {
	const instance = {};

	instance.documentId = documentId;
	instance.dbManager = dbManager;

	instance.generatePinCode = async () => {
		// TODO
	};

	instance.generateRequestKey = async () => {
		// TODO
	};

	instance.getRequestKey = async () => {
		// TODO
	};

	return instance;
};
