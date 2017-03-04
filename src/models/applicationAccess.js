'use strict';

const crypto = require('crypto');
const ObjectId = require('mongodb').ObjectId;

const config = require('../helpers/loadConfig')();
const dbConnector = require('../helpers/dbConnector')();

const buildKeyHash = (applicationId, userId, keyCode) => {
	const sha256 = crypto.createHash('sha256');
	sha256.update(`${config.api.secretToken.applicationAccess}/${applicationId.toString()}/${userId.toString()}/${keyCode}`);

	return sha256.digest('hex');
};
exports.buildKeyHash = buildKeyHash;

const buildKey = (applicationId, userId, keyCode) => {
	return `${userId}-${buildKeyHash(applicationId, userId, keyCode)}.${keyCode}`;
};
exports.buildKey = buildKey;

const splitKey = (key) => {
	const reg = /([^-]+)-([^-]{64}).([0-9]+)/.exec(key);

	if (reg == null)
		throw new Error('access key is invalid format');

	return {userId: new ObjectId(reg[1]), hash: reg[2], keyCode: parseInt(reg[3])};
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
	const doc = await dbManager.findAsync('applicationAccesses', {userId: elements.userId, keyCode: elements.keyCode});

	if (doc == null)
		return false;

	const correctKeyHash = buildKeyHash(doc.applicationId, elements.userId, elements.keyCode);
	const isPassed = elements.hash === correctKeyHash && elements.keyCode === doc.keyCode;

	return isPassed;
};
