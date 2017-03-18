'use strict';

const ApplicationModel = require('../models/application').ApplicationModel;
const randomRange = require('../helpers/randomRange');

class Application {
	constructor(document, db, config) {
		if (document == null || db == null || config == null)
			throw new Error('missing arguments');

		this.document = document;
		this.db = db;
		this.applicationModel = ApplicationModel(db, config);
	}

	hasPermission(permissionName) {
		return this.document.permissions.indexOf(permissionName) != -1;
	}

	async generateApplicationKeyAsync() {
		const keyCode = randomRange(1, 99999);
		await this.db.applications.updateIdAsync(this.document._id.toString(), {keyCode: keyCode});
		const app = await this.db.applications.findIdAsync(this.document._id.toString());
		return this.applicationModel.buildKey(app.document._id, app.document.creatorId, app.document.keyCode);
	}

	getApplicationKey() {
		return this.applicationModel.buildKey(this.document._id, this.document.creatorId, this.document.keyCode);
	}

	serialize() {
		const res = {};
		Object.assign(res, this.document);

		// id
		res.id = res._id.toString();
		delete res._id;

		// creatorId
		res.creatorId = res.creatorId.toString();

		return res;
	}

	// 最新の情報を取得して同期する
	async fetchAsync() {
		this.document = (await db.applications.findIdAsync(this.document._id)).document;
	}
}
exports.Application = Application;