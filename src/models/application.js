'use strict';

const crypto = require('crypto');
const ObjectId = require('mongodb').ObjectId;

const config = require('../helpers/loadConfig')();
const dbConnector = require('../helpers/dbConnector')();

exports.analyzePermissions = () => {
	// TODO

	return true;
};

const buildKeyHash = (applicationId, creatorId, keyCode) => {
	const sha256 = crypto.createHash('sha256');
	sha256.update(`${config.api.secretToken.application}/${creatorId.toString()}/${applicationId.toString()}/${keyCode}`);

	return sha256.digest('hex');
};
exports.buildKeyHash = buildKeyHash;

exports.buildKey = (applicationId, creatorId, keyCode) => {
	return `${applicationId}-${buildKeyHash(applicationId, creatorId, keyCode)}.${keyCode}`;
};

const splitKey = (key) => {
	const reg = /([^-]+)-([^-]{64}).([0-9]+)/.exec(key);

	if (reg == null)
		throw new Error('application key is invalid format');

	return {applicationId: new ObjectId(reg[1]), hash: reg[2], keyCode: parseInt(reg[3])};
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
	const doc = await dbManager.findAsync('applications', {_id: elements.applicationId, keyCode: elements.keyCode});

	if (doc == null)
		return false;

	const correctKeyHash = buildKeyHash(elements.applicationId, doc.creatorId, elements.keyCode);
	const isPassed = elements.hash === correctKeyHash && elements.keyCode === doc.keyCode;

	return isPassed;
};
