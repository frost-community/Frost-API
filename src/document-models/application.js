'use strict';

module.exports = async (documentId, dbManager) => {
	const instance = {};

	instance.documentId = documentId;
	instance.dbManager = dbManager;

	instance.isHasPermission = async (permissionName) => {
		const app = await dbManager.findArrayAsync('applications', {_id: documentId})[0];

		if (app == undefined)
			throw new Error('application not found');

		return permissionName in app.permissions;
	};

	instance.generateApplicationKey = async () => {
		// TODO
	};

	instance.getApplicationKey = async () => {
		// TODO
	};

	return instance;
};
