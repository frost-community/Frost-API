'use strict';

const crypto = require('crypto');
const mongo = require('mongodb');

class Application {
	constructor(db, config) {
		if (db == null || config == null)
			throw new Error('missing arguments');

		this.db = db;
		this.config = config;
	}

	analyzePermissions() {
		// TODO

		return true;
	}

	buildKeyHash(applicationId, creatorId, keyCode) {
		if (applicationId == null || creatorId == null || keyCode == null)
			throw new Error('missing arguments');

		const sha256 = crypto.createHash('sha256');
		sha256.update(`${config.api.secretToken.application}/${creatorId}/${applicationId}/${keyCode}`);

		return sha256.digest('hex');
	}

	buildKey(applicationId, creatorId, keyCode) {
		if (applicationId == null || creatorId == null || keyCode == null)
			throw new Error('missing arguments');

		return `${applicationId}-${this.buildKeyHash(applicationId, creatorId, keyCode)}.${keyCode}`;
	}

	splitKey(key) {
		if (key == null)
			throw new Error('missing arguments');

		const reg = /([^-]+)-([^-]{64}).([0-9]+)/.exec(key);

		if (reg == null)
			throw new Error('falid to split key');

		return {applicationId: mongo.ObjectId(reg[1]), hash: reg[2], keyCode: parseInt(reg[3])};
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

		const doc = await this.db.applications.findAsync({_id: elements.applicationId, keyCode: elements.keyCode});

		if (doc == null)
			return false;

		const correctKeyHash = this.buildKeyHash(elements.applicationId, doc.document.creatorId, elements.keyCode);
		const isPassed = elements.hash === correctKeyHash && elements.keyCode === doc.document.keyCode;

		return isPassed;
	};
}
exports.Application = Application;
