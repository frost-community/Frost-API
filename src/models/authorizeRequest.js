'use strict';

const authorizeRequests = require('../helpers/collections').authorizeRequests;
const crypto = require('crypto');
const config = require('../helpers/loadConfig')();
const dbConnector = require('../helpers/dbConnector');
const objectId = require('mongodb').ObjectId;

module.exports = async (config) => {
	const instance = {};

	instance.buildKeyHash = (authorizeRequestId, applicationId, keyCode) => {
		const sha256 = crypto.createHash('sha256');
		sha256.update(`${config.api.secretToken.authorizeRequest}/${applicationId}/${authorizeRequestId}/${keyCode}`);

		return sha256.digest('hex');
	};

	instance.buildKey = (authorizeRequestId, applicationId, keyCode) => {
		return `${authorizeRequestId}-${instance.buildKeyHash(authorizeRequestId, applicationId, keyCode)}.${keyCode}`;
	};

	instance.splitKey = (key) => {
		const reg = /([^-]+)-([^-]{64}).([0-9]+)/.exec(key);

		if (reg == null)
			throw new Error('request key is invalid format');

		return {authorizeRequestId: objectId(reg[1]), hash: reg[2], keyCode: parseInt(reg[3])};
	};

	instance.verifyKeyAsync = async (key) => {
		let elements;

		try {
			elements = instance.splitKey(key);
		}
		catch (err) {
			return false;
		}

		const collection = await authorizeRequests(config);
		const doc = await collection.findIdAsync(elements.authorizeRequestId);

		if (doc == null)
			return false;

		const correctKeyHash = instance.buildKeyHash(elements.authorizeRequestId, doc.applicationId, elements.keyCode);
		// const createdAt = doc._id.getUnixtime();
		const isAvailabilityPeriod = true; // Math.abs(Date.now() - createdAt) < config.api.request_key_expire_sec;
		const isPassed = isAvailabilityPeriod && elements.hash === correctKeyHash && elements.keyCode === doc.keyCode;

		return isPassed;
	};

	return instance;
};
