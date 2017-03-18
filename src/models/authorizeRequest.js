'use strict';

const crypto = require('crypto');
const mongo = require('mongodb');;

class AuthorizeRequest {
	constructor(db, config) {
		if (db == null || config == null)
			throw new Error('missing arguments');

		this.db = db;
		this.config = config;
	}

	buildKeyHash(authorizeRequestId, applicationId, keyCode) {
		if (authorizeRequestId == null || applicationId == null || keyCode == null)
			throw new Error('missing arguments');

		const sha256 = crypto.createHash('sha256');
		sha256.update(`${this.config.api.secretToken.authorizeRequest}/${applicationId}/${authorizeRequestId}/${keyCode}`);

		return sha256.digest('hex');
	}

	buildKey(authorizeRequestId, applicationId, keyCode) {
		if (authorizeRequestId == null || applicationId == null || keyCode == null)
			throw new Error('missing arguments');

		return `${authorizeRequestId}-${this.buildKeyHash(authorizeRequestId, applicationId, keyCode)}.${keyCode}`;
	}

	splitKey(key) {
		if (key == null)
			throw new Error('missing arguments');

		const reg = /([^-]+)-([^-]{64}).([0-9]+)/.exec(key);

		if (reg == null)
			throw new Error('falid to split key');

		return {authorizeRequestId: mongo.ObjectId(reg[1]), hash: reg[2], keyCode: parseInt(reg[3])};
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

		const doc = await this.db.authorizeRequests.findIdAsync(elements.authorizeRequestId);

		if (doc == null)
			return false;

		const correctKeyHash = this.buildKeyHash(elements.authorizeRequestId, doc.document.applicationId, elements.keyCode);
		// const createdAt = doc._id.getUnixtime();
		const isAvailabilityPeriod = true; // Math.abs(Date.now() - createdAt) < config.api.request_key_expire_sec;
		const isPassed = isAvailabilityPeriod && elements.hash === correctKeyHash && elements.keyCode === doc.document.keyCode;

		return isPassed;
	}
}
exports.AuthorizeRequest = AuthorizeRequest;
