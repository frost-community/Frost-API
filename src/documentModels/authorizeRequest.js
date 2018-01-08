const randomRange = require('../modules/randomRange');
const objectSorter = require('../modules/objectSorter');
const crypto = require('crypto');
const mongo = require('mongodb');
const moment = require('moment');
const { MissingArgumentsError, InvalidArgumentError, InvalidOperationError } = require('../modules/errors');

class AuthorizeRequest {
	constructor(document, db, config) {
		if (document == null || db == null || config == null) {
			throw new MissingArgumentsError();
		}

		this.document = document;
		this.db = db;
		this.config = config;
	}

	async generateVerificationCodeAsync() {
		let verificationCode = '';
		for (let i = 0; i < 6; i++) {
			verificationCode += String(randomRange(0, 9));
		}
		await this.db.authorizeRequests.updateAsync({ _id: this.document._id }, { verificationCode });
		await this.fetchAsync();

		return this.getVerificationCode();
	}

	getVerificationCode() {
		if (this.document.verificationCode == null) {
			throw new InvalidOperationError('verificationCode is empty');
		}

		return this.document.verificationCode;
	}

	async generateIceAuthKeyAsync() {
		const keyCode = randomRange(1, 99999);
		await this.db.authorizeRequests.updateByIdAsync(this.document._id, { keyCode });
		await this.fetchAsync();

		return this.getIceAuthKey();
	}

	getIceAuthKey() {
		if (this.document.keyCode == null) {
			throw new InvalidOperationError('keyCode is empty');
		}

		const hash = AuthorizeRequest.buildHash(this.document._id, this.document.applicationId, this.document.keyCode, this.db, this.config);

		return `${this.document._id}-${hash}.${this.document.keyCode}`;
	}

	async setTargetUserIdAsync(userId) {
		if (userId == null) {
			throw new MissingArgumentsError();
		}

		await this.db.authorizeRequests.updateByIdAsync(this.document._id, { targetUserId: mongo.ObjectId(userId) });
		await this.fetchAsync();
	}

	serialize() {
		const res = {};
		Object.assign(res, this.document);

		// createdAt
		res.createdAt = parseInt(moment(res._id.getTimestamp()).format('X'));

		// id
		res.id = res._id.toString();
		delete res._id;

		// keyCode
		delete res.keyCode;

		return objectSorter(res);
	}

	// 最新の情報を取得して同期する
	async fetchAsync() {
		this.document = (await AuthorizeRequest.findByIdAsync(this.document._id, this.db, this.config)).document;
	}

	async removeAsync() {
		await this.db.authorizeRequests.removeAsync({ _id: this.document._id });
		this.document = null;
	}

	// static methods

	static async findByIdAsync(id, db, config) {
		if (id == null || db == null || config == null) {
			throw new MissingArgumentsError();
		}

		return db.authorizeRequests.findByIdAsync(id);
	}

	static buildHash(authorizeRequestId, applicationId, keyCode, db, config) {
		if (authorizeRequestId == null || applicationId == null || keyCode == null || db == null || config == null) {
			throw new MissingArgumentsError();
		}

		const sha256 = crypto.createHash('sha256');
		sha256.update(`${config.api.secretToken.authorizeRequest}/${applicationId}/${authorizeRequestId}/${keyCode}`);

		return sha256.digest('hex');
	}

	static splitKey(key, db, config) {
		if (key == null || db == null || config == null) {
			throw new MissingArgumentsError();
		}

		const reg = /([^-]+)-([^-]{64}).([0-9]+)/.exec(key);

		if (reg == null) {
			throw new InvalidArgumentError('key');
		}

		return { authorizeRequestId: mongo.ObjectId(reg[1]), hash: reg[2], keyCode: parseInt(reg[3]) };
	}

	static async verifyKeyAsync(key, db, config) {
		if (key == null || db == null || config == null) {
			throw new MissingArgumentsError();
		}

		let elements;

		try {
			elements = AuthorizeRequest.splitKey(key, db, config);
		}
		catch (err) {
			return false;
		}

		const authorizeRequest = await db.authorizeRequests.findByIdAsync(elements.authorizeRequestId);

		if (authorizeRequest == null) {
			return false;
		}

		const correctHash = AuthorizeRequest.buildHash(elements.authorizeRequestId, authorizeRequest.document.applicationId, elements.keyCode, db, config);
		// const createdAt = moment(authorizeRequest._id.getTimestamp());
		const isAvailabilityPeriod = true; // Math.abs(Date.now() - createdAt) < config.api.iceAuthKeyExpireSec;
		const isPassed = isAvailabilityPeriod && elements.hash === correctHash && elements.keyCode === authorizeRequest.document.keyCode;

		return isPassed;
	}
}
module.exports = AuthorizeRequest;
