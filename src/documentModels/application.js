'use strict';

const randomRange = require('../helpers/randomRange');
const applicationModelAsync = require('../models/application');
const applications = require('../helpers/collections').applications;

module.exports = async (document, config) => {
	const instance = {};

	// id加工
	document.id = document._id.toString();
	delete document._id;

	instance.document = document;
	instance.collection = await applications(config);
	const applicationModel = await applicationModelAsync(config);

	instance.hasPermissionAsync = async (permissionName) => {
		const app = await instance.collection.findIdAsync(document.id);

		if (app == null)
			throw new Error('application not found');

		return permissionName in app.permissions;
	};

	instance.generateApplicationKeyAsync = async () => {
		const keyCode = randomRange(1, 99999);
		await instance.collection.updateAsync({_id: document.id}, {keyCode: keyCode});
		const app = await instance.collection.findIdAsync(document.id);

		return applicationModel.buildKey(app._id, app.creatorId, app.keyCode);
	};

	instance.getApplicationKeyAsync = async () => {
		const app = await instance.collection.findIdAsync(document.id);

		if (app == null)
			throw new Error('application not found');

		return applicationModel.buildKey(app._id, app.creatorId, app.keyCode);
	};

	return instance;
};
