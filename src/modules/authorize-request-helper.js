'use strict';

const crypto = require('crypto');
const config = require('./load-config')();

const buildRequestKeyHash = (authorizeRequestId, applicationId, keyCode) => {
	const sha256 = crypto.createHash('sha256');
	sha256.update(`${config.api.secret_token.authorize_request}/${applicationId}/${authorizeRequestId}/${keyCode}`);

	return sha256.digest('hex');
};
exports.buildRequestKeyHash = buildRequestKeyHash;

exports.buildRequestKey = (authorizeRequestId, applicationId, keyCode) => {
	return `${authorizeRequestId}-${buildRequestKeyHash(authorizeRequestId, applicationId, keyCode)}.${keyCode}`;
};

exports.keyToElements = (key) => {
	const reg = /([^-]+)-([^-]{64}).([^-]+)/.exec(key);

	return {authorizeRequestId: reg[1], hash: reg[2], keyCode: reg[3]};
};

exports.verifyRequestKey = (key) => {
	// TODO

	return true;
};
