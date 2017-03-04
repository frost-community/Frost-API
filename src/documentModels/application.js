'use strict';

const randomRange = require('../helpers/randomRange');

const applicationModel = require('../models/application');

module.exports = async (documentId, dbManager) => {
	const instance = {};

	instance.documentId = documentId;
	instance.dbManager = dbManager;

	instance.hasPermissionAsync = async (permissionName) => {
		const app = await dbManager.findArrayAsync('applications', {_id: documentId})[0];

		if (app == null)
			throw new Error('application not found');

		return permissionName in app.permissions;
	};

	instance.generateApplicationKeyAsync = async () => {
		const keyCode = randomRange(1, 99999);
		dbManager.updateAsync('applications', {_id: documentId}, {keyCode: keyCode});
		const app = await dbManager.findArrayAsync('applications', {_id: documentId})[0];

		return applicationModel.buildKey(app._id, app.creatorId, app.keyCode);
	};

	instance.getApplicationKeyAsync = async () => {
		const app = await dbManager.findArrayAsync('applications', {_id: documentId})[0];

		if (app == null)
			throw new Error('application not found');

		return applicationModel.buildKey(app._id, app.creatorId, app.keyCode);
	};

	return instance;
};
