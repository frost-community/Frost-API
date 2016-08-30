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

exports.keyToElements = (key) => {
	const reg = /([^-]+)-([^-]{64}).([^-]+)/.exec(key);

	return {applicationId: reg[1], hash: reg[2], keyCode: reg[3]};
};

exports.verifyApplicationKey = (key) => {
	// TODO

	return true;
};
