'use strict';

const crypto = require('crypto');
const config = require('./load-config')();

exports.analyzePermissions = () => {
	// TODO

	return true;
};

const buildApplicationKeyHash = (applicationId, creatorId, keyCode) => {
	const sha256 = crypto.createHash('sha256');
	sha256.update(`${config.api.secret_token.application}/${creatorId}/${applicationId}/${keyCode}`);

	return sha256.digest('hex');
};
exports.buildApplicationKeyHash = buildApplicationKeyHash;

exports.buildApplicationKey = (applicationId, creatorId, keyCode) => {
	return `${applicationId}-${buildApplicationKeyHash(applicationId, creatorId, keyCode)}.${keyCode}`;
};

const keyToElements = (key) => {
	const reg = /([^-]+)-([^-]{64}).([^-]+)/.exec(key);

	return {applicationId: reg[1], hash: reg[2], keyCode: reg[3]};
};
exports.keyToElements = keyToElements;

exports.verifyApplicationKey = (key) => {
	const elements = keyToElements(key);
	const dbManager = await dbConnector.connectApidbAsync();
	const doc = await dbManager.findArrayAsync('applications', {_id: elements.applicationId})[0];

	if (doc == undefined)
		throw new Error('application not found');

	const correctKeyHash = buildApplicationKeyHash(elements.applicationId, doc.creator_id, elements.keyCode);
	const isPassed = elements.hash === correctKeyHash && elements.keyCode === doc.key_code;

	return isPassed;
};
