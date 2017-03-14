'use strict';

const randomRange = require('../helpers/randomRange');
const applicationModelAsync = require('../models/application');
const applicationsAsync = require('../helpers/collections').applications;

module.exports = async (document, config) => {
	const instance = {};

	instance.document = document;
	const applications = await applicationsAsync(config);
	const applicationModel = await applicationModelAsync(config);

	instance.hasPermissionAsync = async (permissionName) => {
		const app = await applications.findIdAsync(instance.document._id);

		if (app == null)
			throw new Error('application not found');

		return permissionName in app.permissions;
	};

	instance.generateApplicationKeyAsync = async () => {
		const keyCode = randomRange(1, 99999);
		await applications.updateIdAsync(instance.document._id.toString(), {keyCode: keyCode});
		const app = await applications.findIdAsync(instance.document._id.toString());
		return applicationModel.buildKey(app.document._id, app.document.creatorId, app.document.keyCode);
	};

	instance.getApplicationKeyAsync = async () => {
		const app = await applications.findIdAsync(instance.document._id.toString());

		if (app == null)
			throw new Error('application not found');

		return applicationModel.buildKey(app.document._id, app.document.creatorId, app.document.keyCode);
	};

	instance.serialize = () => {
		const res = {};
		Object.assign(res, instance.document);

		// id
		res.id = res._id.toString();
		delete res._id;

		// creatorId
		res.creatorId = res.creatorId.toString();

		return res;
	};

	// 最新の情報を取得して同期する
	instance.sync = async () => {
		instance.document = (await applications.findIdAsync(instance.document._id)).document;
	};

	return instance;
};
