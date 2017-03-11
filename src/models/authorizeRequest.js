'use strict';

const crypto = require('crypto');
const config = require('../helpers/loadConfig')();
const dbConnector = require('../helpers/dbConnector');
const objectId = require('mongodb').ObjectId;

const buildKeyHash = (authorizeRequestId, applicationId, keyCode) => {
	const sha256 = crypto.createHash('sha256');
	sha256.update(`${config.api.secretToken.authorizeRequest}/${applicationId.toString()}/${authorizeRequestId.toString()}/${keyCode}`);

	return sha256.digest('hex');
};
exports.buildKeyHash = buildKeyHash;

const buildKey = (authorizeRequestId, applicationId, keyCode) => {
	return `${authorizeRequestId}-${buildKeyHash(authorizeRequestId, applicationId, keyCode)}.${keyCode}`;
};
exports.buildKey = buildKey;

const splitKey = (key) => {
	const reg = /([^-]+)-([^-]{64}).([0-9]+)/.exec(key);

	if (reg == null)
		throw new Error('request key is invalid format');

	return {authorizeRequestId: objectId(reg[1]), hash: reg[2], keyCode: parseInt(reg[3])};
};
exports.splitKey = splitKey;

exports.verifyKeyAsync = async (key) => {
	let elements;

	try {
		elements = splitKey(key);
	}
	catch (err) {
		return false;
	}

	const dbManager = await dbConnector.connectApidbAsync();
	const doc = await dbManager.findAsync('authorizeRequests', {_id: elements.authorizeRequestId});

	if (doc == null)
		return false;

	const correctKeyHash = buildKeyHash(elements.authorizeRequestId, doc.applicationId, elements.keyCode);
	// const createdAt = doc._id.getUnixtime();
	const isAvailabilityPeriod = true; // Math.abs(Date.now() - createdAt) < config.api.request_key_expire_sec;
	const isPassed = isAvailabilityPeriod && elements.hash === correctKeyHash && elements.keyCode === doc.keyCode;

	return isPassed;
};
