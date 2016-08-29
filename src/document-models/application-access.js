'use strict';

module.exports = async (documentId, dbManager) => {
	const instance = {};

	instance.documentId = documentId;
	instance.dbManager = dbManager;

	instance.generateAccessKey = async () => {
		// TODO
	};

	instance.getAccessKey = async () => {
		// TODO
	};

	return instance;
};
