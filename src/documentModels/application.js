'use strict';

const randomRange = require('../helpers/randomRange');
const objectSorter = require('../helpers/objectSorter');
const type = require('../helpers/type');
const permissionTypes = require('../helpers/permission').permissionTypes;
const crypto = require('crypto');
const mongo = require('mongodb');
const moment = require('moment');

class Application {
	constructor(document, db, config) {
		if (document == null || db == null || config == null)
			throw new Error('missing arguments');

		this.document = document;
		this.db = db;
		this.config = config;
	}

	hasPermission(permissionName) {
		if (permissionName == null)
			throw new Error('missing arguments');

		return this.document.permissions.indexOf(permissionName) != -1;
	}

	async generateApplicationKeyAsync() {
		const keyCode = randomRange(1, 99999);
		await this.db.applications.updateByIdAsync(this.document._id.toString(), {keyCode: keyCode});
		await this.fetchAsync();

		return this.getApplicationKey();
	}

	getApplicationKey() {
		if (this.document.keyCode == null)
			throw new Error('keyCode is empty');

		return Application.buildKey(this.document._id, this.document.creatorId, this.document.keyCode, this.db, this.config);
	}

	serialize() {
		const res = {};
		Object.assign(res, this.document);

		// createdAt
		res.createdAt = parseInt(moment(res._id.getTimestamp()).format('X'));

		// id
		res.id = res._id.toString();
		delete res._id;

		// creatorId
		res.creatorId = res.creatorId.toString();

		// keyCode
		delete res.keyCode;

		return objectSorter(res);
	}

	// 最新の情報を取得して同期する
	async fetchAsync() {
		this.document = (await Application.findByIdAsync(this.document._id, this.db, this.config)).document;
	}

	// -- static methods

	static async findByIdAsync(id, db, config) {
		if (id == null || db == null || config == null)
			throw new Error('missing arguments');

		return db.applications.findByIdAsync(id);
	}

	static async findByNameAsync(name, db, config) {
		if (name == null || db == null || config == null)
			throw new Error('missing arguments');

		return db.applications.findAsync({name: name});
	}

	static checkFormatPermissions(permissions, db, config) {
		if (permissions == null || db == null || config == null)
			throw new Error('missing arguments');

		if (!Array.isArray(permissions))
			return false;

		return permissions.every(permission =>
			type(permission) == 'String' && // それは文字列？
			permissionTypes.indexOf(permission) != -1 // それは存在する権限名？
		);
	}

	static buildKeyHash(applicationId, creatorId, keyCode, db, config) {
		if (applicationId == null || creatorId == null || keyCode == null || db == null || config == null)
			throw new Error('missing arguments');

		const sha256 = crypto.createHash('sha256');
		sha256.update(`${config.api.secretToken.application}/${creatorId}/${applicationId}/${keyCode}`);

		return sha256.digest('hex');
	}

	static buildKey(applicationId, creatorId, keyCode, db, config) {
		if (applicationId == null || creatorId == null || keyCode == null || db == null || config == null)
			throw new Error('missing arguments');

		return `${applicationId}-${Application.buildKeyHash(applicationId, creatorId, keyCode, db, config)}.${keyCode}`;
	}

	static splitKey(key, db, config) {
		if (key == null || db == null || config == null)
			throw new Error('missing arguments');

		const reg = /([^-]+)-([^-]{64}).([0-9]+)/.exec(key);

		if (reg == null)
			throw new Error('falid to split key');

		return {applicationId: mongo.ObjectId(reg[1]), hash: reg[2], keyCode: parseInt(reg[3])};
	}

	static async verifyKeyAsync(key, db, config) {
		if (key == null || db == null || config == null)
			throw new Error('missing arguments');

		let elements;

		try {
			elements = Application.splitKey(key, db, config);
		}
		catch (err) {
			return false;
		}

		const application = await db.applications.findAsync({_id: elements.applicationId, keyCode: elements.keyCode});

		if (application == null)
			return false;

		const correctKeyHash = Application.buildKeyHash(elements.applicationId, application.document.creatorId, elements.keyCode, db, config);
		const isPassed = elements.hash === correctKeyHash && elements.keyCode === application.document.keyCode;

		return isPassed;
	}
}
module.exports = Application;
