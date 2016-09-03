'use strict';

const crypto = require('crypto');
const ObjectId = require('mongodb').ObjectId;
const config = require('./load-config')();
const dbConnector = require('./db-connector')();

exports.analyzePermissions = () => {
	// TODO

	return true;
};

const buildApplicationKeyHash = (applicationId, creatorId, keyCode) => {
	const sha256 = crypto.createHash('sha256');
	sha256.update(`${config.api.secret_token.application}/${creatorId.toString()}/${applicationId.toString()}/${keyCode}`);

	return sha256.digest('hex');
};
exports.buildApplicationKeyHash = buildApplicationKeyHash;

exports.buildApplicationKey = (applicationId, creatorId, keyCode) => {
	return `${applicationId}-${buildApplicationKeyHash(applicationId, creatorId, keyCode)}.${keyCode}`;
};

const keyToElements = (key) => {
	const reg = /([^-]+)-([^-]{64}).([0-9]+)/.exec(key);

	if (reg == undefined)
		throw new Error('application key is invalid format');

	return {applicationId: new ObjectId(reg[1]), hash: reg[2], keyCode: parseInt(reg[3])};
};
exports.keyToElements = keyToElements;

exports.verifyApplicationKeyAsync = async (key) => {
	let elements;

	try {
		elements = keyToElements(key);
	}
	catch (err) {
		return false;
	}

	const dbManager = await dbConnector.connectApidbAsync();
	const doc = await dbManager.findAsync('applications', {_id: elements.applicationId, key_code: elements.keyCode});

	if (doc == undefined)
		return false;

	const correctKeyHash = buildApplicationKeyHash(elements.applicationId, doc.creator_id, elements.keyCode);
	const isPassed = elements.hash === correctKeyHash && elements.keyCode === doc.key_code;

	return isPassed;
};
