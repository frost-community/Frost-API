'use strict';

const crypto = require('crypto');
const mongo = require('mongodb');

module.exports = async (db, config) => {
	const instance = {};

	if (db == null || config == null)
		throw new Error('missing arguments');

	instance.analyzePermissions = () => {
		// TODO

		return true;
	};

	instance.buildKeyHash = (applicationId, creatorId, keyCode) => {
		const sha256 = crypto.createHash('sha256');
		sha256.update(`${config.api.secretToken.application}/${creatorId}/${applicationId}/${keyCode}`);

		return sha256.digest('hex');
	};

	instance.buildKey = (applicationId, creatorId, keyCode) => {
		return `${applicationId}-${instance.buildKeyHash(applicationId, creatorId, keyCode)}.${keyCode}`;
	};

	instance.splitKey = (key) => {
		const reg = /([^-]+)-([^-]{64}).([0-9]+)/.exec(key);

		if (reg == null)
			throw new Error('falid to split key');

		return {applicationId: mongo.ObjectId(reg[1]), hash: reg[2], keyCode: parseInt(reg[3])};
	};

	instance.verifyKeyAsync = async (key) => {
		let elements;

		try {
			elements = instance.splitKey(key);
		}
		catch (err) {
			return false;
		}

		const doc = await db.applications.findAsync({_id: elements.applicationId, keyCode: elements.keyCode});

		if (doc == null)
			return false;

		const correctKeyHash = instance.buildKeyHash(elements.applicationId, doc.document.creatorId, elements.keyCode);
		const isPassed = elements.hash === correctKeyHash && elements.keyCode === doc.document.keyCode;

		return isPassed;
	};

	return instance;
};
