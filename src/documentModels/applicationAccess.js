'use strict';

const ApplicationAccessModel = require('../models/applicationAccess');
const randomRange = require('../helpers/randomRange');

class ApplicationAccess {
	constructor(document, db, config) {
		if (document == null || db == null || config == null)
			throw new Error('missing arguments');

		this.document = document;
		this.db = db;
		this.applicationAccessModel = new ApplicationAccessModel(db, config);
	}

	async generateAccessKeyAsync() {
		const access = await this.db.applicationAccesses.findIdAsync(this.document._id);
		let keyCode, isExist, tryCount = 0;

		do {
			tryCount++;
			keyCode = randomRange(1, 99999);
			isExist = await this.db.applicationAccesses.findAsync({userId: access.document.userId, keyCode: keyCode}) != null;
		}
		while(isExist && tryCount < 4);

		if (isExist && tryCount >= 4)
			throw new Error('the number of trials for keyCode generation has reached its upper limit');

		await this.db.applicationAccesses.updateAsync({_id: this.document._id}, {keyCode: keyCode});

		return this.applicationAccessModel.buildKey(access.document.applicationId, access.document.userId, keyCode);
	}

	getAccessKey() {
		return this.applicationAccessModel.buildKey(this.document.applicationId, this.document.userId, this.document.keyCode);
	}

	serialize() {
		const res = {};
		Object.assign(res, this.document);

		// id
		res.id = res._id.toString();
		delete res._id;

		return res;
	}

	// 最新の情報を取得して同期する
	async fetchAsync() {
		this.document = (await this.db.applicationAccesses.findIdAsync(this.document._id)).document;
	}
}
module.exports = ApplicationAccess;
