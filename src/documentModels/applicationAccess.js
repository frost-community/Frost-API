const randomRange = require('../helpers/randomRange');
const objectSorter = require('../helpers/objectSorter');
const crypto = require('crypto');
const mongo = require('mongodb');
const moment = require('moment');

class ApplicationAccess {
	constructor(document, db, config) {
		if (document == null || db == null || config == null) {
			throw new Error('missing arguments');
		}

		this.document = document;
		this.db = db;
		this.config = config;
	}

	async generateAccessKeyAsync() {
		let keyCode, isExist, tryCount = 0;

		do {
			tryCount++;
			keyCode = randomRange(1, 99999);
			isExist = await this.db.applicationAccesses.findAsync({userId: this.document.userId, keyCode: keyCode}) != null;
		}
		while (isExist && tryCount < 4);

		if (isExist && tryCount >= 4) {
			throw new Error('the number of trials for keyCode generation has reached its upper limit');
		}

		await this.db.applicationAccesses.updateByIdAsync(this.document._id, {keyCode: keyCode});
		await this.fetchAsync();

		return this.getAccessKey();
	}

	getAccessKey() {
		if (this.document.keyCode == null) {
			throw new Error('keyCode is empty');
		}

		const hash = ApplicationAccess.buildHash(this.document.applicationId, this.document.userId, this.document.keyCode, this.db, this.config);

		return `${this.document.userId}-${hash}.${this.document.keyCode}`;
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
		this.document = (await ApplicationAccess.findByIdAsync(this.document._id, this.db, this.config)).document;
	}

	// -- static methods

	static async findByIdAsync(id, db, config) {
		if (id == null || db == null || config == null) {
			throw new Error('missing arguments');
		}

		return db.applicationAccesses.findByIdAsync(id);
	}

	static buildHash(applicationId, userId, keyCode, db, config) {
		if (applicationId == null || userId == null || keyCode == null || db == null || config == null) {
			throw new Error('missing arguments');
		}

		const sha256 = crypto.createHash('sha256');
		sha256.update(`${config.api.secretToken.applicationAccess}/${applicationId}/${userId}/${keyCode}`);

		return sha256.digest('hex');
	}

	static splitKey(key, db, config) {
		if (key == null || db == null || config == null) {
			throw new Error('missing arguments');
		}

		const reg = /([^-]+)-([^-]{64}).([0-9]+)/.exec(key);

		if (reg == null) {
			throw new Error('falid to split key');
		}

		return {userId: mongo.ObjectId(reg[1]), hash: reg[2], keyCode: parseInt(reg[3])};
	}

	static async verifyKeyAsync(key, db, config) {
		if (key == null || db == null || config == null) {
			throw new Error('missing arguments');
		}

		let elements;

		try {
			elements = ApplicationAccess.splitKey(key, db, config);
		}
		catch (err) {
			return false;
		}

		const applicationAccess = await db.applicationAccesses.findAsync({userId: elements.userId, keyCode: elements.keyCode});

		if (applicationAccess == null) {
			return false;
		}

		const correctHash = ApplicationAccess.buildHash(applicationAccess.document.applicationId, elements.userId, elements.keyCode, db, config);
		const isPassed = elements.hash === correctHash && elements.keyCode === applicationAccess.document.keyCode;

		return isPassed;
	}
}
module.exports = ApplicationAccess;
