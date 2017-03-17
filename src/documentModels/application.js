'use strict';

const randomRange = require('../helpers/randomRange');
const applicationModelAsync = require('../models/application');

module.exports = async (document, db, config) => {
	const instance = {};

	if (document == null || db == null || config == null)
		throw new Error('missing arguments');

	instance.document = document;
	const applicationModel = await applicationModelAsync(db, config);

	instance.hasPermission = (permissionName) => {
		return instance.document.permissions.indexOf(permissionName) != -1;
	};

	instance.generateApplicationKeyAsync = async () => {
		const keyCode = randomRange(1, 99999);
		await db.applications.updateIdAsync(instance.document._id.toString(), {keyCode: keyCode});
		const app = await db.applications.findIdAsync(instance.document._id.toString());
		return applicationModel.buildKey(app.document._id, app.document.creatorId, app.document.keyCode);
	};

	instance.getApplicationKeyAsync = async () => {
		const app = await db.applications.findIdAsync(instance.document._id.toString());

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
		instance.document = (await db.applications.findIdAsync(instance.document._id)).document;
	};

	return instance;
};
