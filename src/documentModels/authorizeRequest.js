'use strict';

const randomRange = require('../helpers/randomRange');
const crypto = require('crypto');
const mongo = require('mongodb');

class AuthorizeRequest {
	constructor(document, db, config) {
		if (document == null || db == null || config == null)
			throw new Error('missing arguments');

		this.document = document;
		this.db = db;
		this.config = config;
	}

	async getVerificationCodeAsync() {
		let verificationCode = '';
		[...Array(6)].forEach(() => {
			verificationCode += String(randomRange(0, 9));
		});

		await this.db.authorizeRequests.updateAsync({_id: this.document._id}, {verificationCode: verificationCode});

		return verificationCode;
	}

	async getRequestKeyAsync() {
		if (this.document.keyCode == null) {
			// 生成が必要な場合
			const keyCode = randomRange(1, 99999);
			await this.db.authorizeRequests.updateIdAsync(this.document._id, {keyCode: keyCode});
			await this.fetchAsync();
		}

		return AuthorizeRequest.buildKey(this.document._id, this.document.applicationId, this.document.keyCode, this.db, this.config);
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
		this.document = (await this.db.authorizeRequests.findIdAsync(this.document._id)).document;
	}

	// static methods

	static buildKeyHash(authorizeRequestId, applicationId, keyCode, db, config) {
		if (authorizeRequestId == null || applicationId == null || keyCode == null)
			throw new Error('missing arguments');

		const sha256 = crypto.createHash('sha256');
		sha256.update(`${config.api.secretToken.authorizeRequest}/${applicationId}/${authorizeRequestId}/${keyCode}`);

		return sha256.digest('hex');
	}

	static buildKey(authorizeRequestId, applicationId, keyCode, db, config) {
		if (authorizeRequestId == null || applicationId == null || keyCode == null)
			throw new Error('missing arguments');

		return `${authorizeRequestId}-${AuthorizeRequest.buildKeyHash(authorizeRequestId, applicationId, keyCode, db, config)}.${keyCode}`;
	}

	static splitKey(key, db, config) {
		if (key == null)
			throw new Error('missing arguments');

		const reg = /([^-]+)-([^-]{64}).([0-9]+)/.exec(key);

		if (reg == null)
			throw new Error('falid to split key');

		return {authorizeRequestId: mongo.ObjectId(reg[1]), hash: reg[2], keyCode: parseInt(reg[3])};
	}

	static async verifyKeyAsync(key, db, config) {
		if (key == null)
			throw new Error('missing arguments');

		let elements;

		try {
			elements = AuthorizeRequest.splitKey(key, db, config);
		}
		catch (err) {
			return false;
		}

		const authorizeRequest = await db.authorizeRequests.findIdAsync(elements.authorizeRequestId);

		if (authorizeRequest == null)
			return false;

		const correctKeyHash = AuthorizeRequest.buildKeyHash(elements.authorizeRequestId, authorizeRequest.document.applicationId, elements.keyCode, db, config);
		// const createdAt = authorizeRequest._id.getUnixtime();
		const isAvailabilityPeriod = true; // Math.abs(Date.now() - createdAt) < config.api.request_key_expire_sec;
		const isPassed = isAvailabilityPeriod && elements.hash === correctKeyHash && elements.keyCode === authorizeRequest.document.keyCode;

		return isPassed;
	}
}
module.exports = AuthorizeRequest;
