'use strict';

const crypto = require('crypto');
const config = require('./load-config')();

const buildAccessKeyHash = (applicationId, userId, keyCode) => {
	const sha256 = crypto.createHash('sha256');
	sha256.update(`${config.api.secret_token.application_access}/${applicationId}/${userId}/${keyCode}`);

	return sha256.digest('hex');
};
exports.buildAccessKeyHash = buildAccessKeyHash;

const buildAccessKey = (applicationId, userId, keyCode) => {
	return `${userId}-${buildAccessKeyHash(applicationId, userId, keyCode)}.${keyCode}`;
};
exports.buildAccessKey = buildAccessKey;

const keyToElements = (key) => {
	const reg = /([^-]+)-([^-]{64}).([^-]+)/.exec(key);

	return {userId: reg[1], hash: reg[2], keyCode: reg[3]};
};
exports.keyToElements = keyToElements;

exports.verifyAccessKey = (key) => {
	const elements = keyToElements(key);
	const dbManager = await dbConnector.connectApidbAsync();
	const doc = await dbManager.findArrayAsync('applicationAccesses', {_id: elements.userId, key_code: elements.keyCode})[0];

	if (doc == undefined)
		throw new Error('application access not found');

	const correctKeyHash = buildAccessKeyHash(doc.application_id, elements.userId, elements.keyCode);
	const isPassed = elements.hash === correctKeyHash && elements.keyCode === doc.key_code;

	return isPassed;
};
