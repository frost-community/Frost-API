'use strict';

const crypto = require('crypto');
const mongo = require('mongodb');

class ApplicationAccess {
	constructor(db, config) {
		if (db == null || config == null)
			throw new Error('missing arguments');

		this.db = db;
		this.config = config;
	}

	buildKeyHash(applicationId, userId, keyCode) {
		if (applicationId == null || userId == null || keyCode == null)
			throw new Error('missing arguments');

		const sha256 = crypto.createHash('sha256');
		sha256.update(`${this.config.api.secretToken.applicationAccess}/${applicationId}/${userId}/${keyCode}`);

		return sha256.digest('hex');
	}

	buildKey(applicationId, userId, keyCode) {
		if (applicationId == null || userId == null || keyCode == null)
			throw new Error('missing arguments');

		return `${userId}-${this.buildKeyHash(applicationId, userId, keyCode)}.${keyCode}`;
	}

	splitKey(key) {
		if (key == null)
			throw new Error('missing arguments');

		const reg = /([^-]+)-([^-]{64}).([0-9]+)/.exec(key);

		if (reg == null)
			throw new Error('falid to split key');

		return {userId: mongo.ObjectId(reg[1]), hash: reg[2], keyCode: parseInt(reg[3])};
	}

	async verifyKeyAsync(key) {
		if (key == null)
			throw new Error('missing arguments');

		let elements;

		try {
			elements = this.splitKey(key);
		}
		catch (err) {
			return false;
		}

		const doc = await this.db.applicationAccesses.findAsync({userId: elements.userId, keyCode: elements.keyCode});

		if (doc == null)
			return false;

		const correctKeyHash = this.buildKeyHash(doc.document.applicationId, elements.userId, elements.keyCode);
		const isPassed = elements.hash === correctKeyHash && elements.keyCode === doc.document.keyCode;

		return isPassed;
	}
}
exports.ApplicationAccess = ApplicationAccess;
