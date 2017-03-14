'use strict';

const applicationAccesses = require('../helpers/collections').applicationAccesses;
const crypto = require('crypto');
const config = require('../helpers/loadConfig')();
const dbConnector = require('../helpers/dbConnector');
const objectId = require('mongodb').ObjectId;

module.exports = async (config) => {
	const instance = {};

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
			return null;

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

		const collection = await applicationAccesses(config);
		const doc = await collection.findAsync({userId: elements.userId, keyCode: elements.keyCode});

		if (doc == null)
			return false;

		const correctKeyHash = instance.buildKeyHash(doc.applicationId, elements.userId, elements.keyCode);
		const isPassed = elements.hash === correctKeyHash && elements.keyCode === doc.keyCode;

		return isPassed;
	};

	return instance;
};
