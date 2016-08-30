'use strict';

const crypto = require('crypto');
const config = require('./load-config')();

const buildAccessKeyHash = (applicationId, userId, keyCode) => {
	const sha256 = crypto.createHash('sha256');
	sha256.update(`${config.api.secret_token.application_access}/${applicationId}/${userId}/${keyCode}`);

	return sha256.digest('hex');
};
exports.buildAccessKeyHash = buildAccessKeyHash;

exports.buildAccessKey = (applicationId, userId, keyCode) => {
	return `${userId}-${buildAccessKeyHash(applicationId, userId, keyCode)}.${keyCode}`;
};

exports.keyToElements = (key) => {
	const reg = /([^-]+)-([^-]{64}).([^-]+)/.exec(key);

	return {userId: reg[1], hash: reg[2], keyCode: reg[3]};
};

exports.verifyAccessKey = (key) => {
	// TODO

	return true;
};
