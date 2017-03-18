'use strict';

const randomRange = require('../helpers/randomRange');
const crypto = require('crypto');
const mongo = require('mongodb');

class ApplicationAccess {
	constructor(document, db, config) {
		if (document == null || db == null || config == null)
			throw new Error('missing arguments');

		this.document = document;
		this.db = db;
		this.config = config;
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

		return ApplicationAccess.buildKey(access.document.applicationId, access.document.userId, keyCode, this.db, this.config);
	}

	getAccessKey() {
		return ApplicationAccess.buildKey(this.document.applicationId, this.document.userId, this.document.keyCode, this.db, this.config);
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

	// -- static methods

	static buildKeyHash(applicationId, userId, keyCode, db, config) {
		if (applicationId == null || userId == null || keyCode == null)
			throw new Error('missing arguments');

		const sha256 = crypto.createHash('sha256');
		sha256.update(`${config.api.secretToken.applicationAccess}/${applicationId}/${userId}/${keyCode}`);

		return sha256.digest('hex');
	}

	static buildKey(applicationId, userId, keyCode, db, config) {
		if (applicationId == null || userId == null || keyCode == null)
			throw new Error('missing arguments');

		return `${userId}-${ApplicationAccess.buildKeyHash(applicationId, userId, keyCode, db, config)}.${keyCode}`;
	}

	static splitKey(key, db, config) {
		if (key == null)
			throw new Error('missing arguments');

		const reg = /([^-]+)-([^-]{64}).([0-9]+)/.exec(key);

		if (reg == null)
			throw new Error('falid to split key');

		return {userId: mongo.ObjectId(reg[1]), hash: reg[2], keyCode: parseInt(reg[3])};
	}

	static async verifyKeyAsync(key, db, config) {
		if (key == null)
			throw new Error('missing arguments');

		let elements;

		try {
			elements = ApplicationAccess.splitKey(key, db, config);
		}
		catch (err) {
			return false;
		}

		const applicationAccess = await db.applicationAccesses.findAsync({userId: elements.userId, keyCode: elements.keyCode});

		if (applicationAccess == null)
			return false;

		const correctKeyHash = ApplicationAccess.buildKeyHash(applicationAccess.document.applicationId, elements.userId, elements.keyCode, db, config);
		const isPassed = elements.hash === correctKeyHash && elements.keyCode === applicationAccess.document.keyCode;

		return isPassed;
	}
}
module.exports = ApplicationAccess;
