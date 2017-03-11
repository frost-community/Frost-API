'use strict';

const randomRange = require('../helpers/randomRange');

const applicationModel = require('../models/application');

module.exports = async (document, dbManager) => {
	const instance = {};

	// id加工
	document.id = document._id.toString();
	delete document._id;

	instance.document = document;
	instance.dbManager = dbManager;

	instance.hasPermissionAsync = async (permissionName) => {
		const app = await dbManager.findArrayAsync('applications', {_id: document.id})[0];

		if (app == null)
			throw new Error('application not found');

		return permissionName in app.permissions;
	};

	instance.generateApplicationKeyAsync = async () => {
		const keyCode = randomRange(1, 99999);
		dbManager.updateAsync('applications', {_id: document.id}, {keyCode: keyCode});
		const app = await dbManager.findArrayAsync('applications', {_id: document.id})[0];

		return applicationModel.buildKey(app._id, app.creatorId, app.keyCode);
	};

	instance.getApplicationKeyAsync = async () => {
		const app = await dbManager.findArrayAsync('applications', {_id: document.id})[0];

		if (app == null)
			throw new Error('application not found');

		return applicationModel.buildKey(app._id, app.creatorId, app.keyCode);
	};

	return instance;
};
