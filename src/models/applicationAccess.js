'use strict';

const crypto = require('crypto');
const objectId = require('mongodb').ObjectId;

module.exports = async (db, config) => {
	const instance = {};

	if (db == null || config == null)
		throw new Error('missing arguments');

	instance.buildKeyHash = (applicationId, userId, keyCode) => {
		const sha256 = crypto.createHash('sha256');
		sha256.update(`${config.api.secretToken.applicationAccess}/${applicationId}/${userId}/${keyCode}`);

		return sha256.digest('hex');
	};

	instance.buildKey = (applicationId, userId, keyCode) => {
		return `${userId}-${instance.buildKeyHash(applicationId, userId, keyCode)}.${keyCode}`;
	};

	instance.splitKey = (key) => {
		const reg = /([^-]+)-([^-]{64}).([0-9]+)/.exec(key);

		if (reg == null)
			throw new Error('falid to split key');

		return {userId: objectId(reg[1]), hash: reg[2], keyCode: parseInt(reg[3])};
	};

	instance.verifyKeyAsync = async (key) => {
		let elements;

		try {
			elements = instance.splitKey(key);
		}
		catch (err) {
			return false;
		}

		const doc = await db.applicationAccesses.findAsync({userId: elements.userId, keyCode: elements.keyCode});

		if (doc == null)
			return false;

		const correctKeyHash = instance.buildKeyHash(doc.document.applicationId, elements.userId, elements.keyCode);
		const isPassed = elements.hash === correctKeyHash && elements.keyCode === doc.document.keyCode;

		return isPassed;
	};

	return instance;
};
