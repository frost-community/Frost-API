'use strict';

const applications = require('../helpers/collections').applications;
const crypto = require('crypto');
const objectId = require('mongodb').ObjectId;

module.exports = async (config) => {
	const instance = {};

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

		return {applicationId: objectId(reg[1]), hash: reg[2], keyCode: parseInt(reg[3])};
	};

	instance.verifyKeyAsync = async (key) => {
		let elements;

		try {
			elements = instance.splitKey(key);
		}
		catch (err) {
			return false;
		}

		const collection = await applications(config);
		const doc = await collection.findAsync({_id: elements.applicationId, keyCode: elements.keyCode});

		if (doc == null)
			return false;

		const correctKeyHash = instance.buildKeyHash(elements.applicationId, doc.creatorId, elements.keyCode);
		const isPassed = elements.hash === correctKeyHash && elements.keyCode === doc.keyCode;

		return isPassed;
	};

	return instance;
};
