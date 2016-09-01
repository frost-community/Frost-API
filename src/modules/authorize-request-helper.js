'use strict';

const crypto = require('crypto');
const config = require('./load-config')();
const dbConnector = require('./db-connector')();
require('./object-id-extension')();

const buildRequestKeyHash = (authorizeRequestId, applicationId, keyCode) => {
	const sha256 = crypto.createHash('sha256');
	sha256.update(`${config.api.secret_token.authorize_request}/${applicationId.toString()}/${authorizeRequestId.toString()}/${keyCode}`);

	return sha256.digest('hex');
};
exports.buildRequestKeyHash = buildRequestKeyHash;

const buildRequestKey = (authorizeRequestId, applicationId, keyCode) => {
	return `${authorizeRequestId}-${buildRequestKeyHash(authorizeRequestId, applicationId, keyCode)}.${keyCode}`;
};
exports.buildRequestKey = buildRequestKey;

const keyToElements = (key) => {
	const reg = /([^-]+)-([^-]{64}).([^-]+)/.exec(key);

	if (reg == undefined)
		throw new Error('request key is invalid format');

	return {authorizeRequestId: new ObjectId(reg[1]), hash: reg[2], keyCode: reg[3]};
};
exports.keyToElements = keyToElements;

exports.verifyRequestKeyAsync = async (key) => {
	let elements;

	try {
		elements = keyToElements(key);
	}
	catch (err) {
		return false;
	}

	const dbManager = await dbConnector.connectApidbAsync();
	const doc = await dbManager.findArrayAsync('authorizeRequests', {_id: elements.authorizeRequestId})[0];

	if (doc == undefined)
		return false;

	const correctKeyHash = buildRequestKeyHash(elements.authorizeRequestId, doc.application_id, elements.keyCode);
	const createdAt = doc._id.getUnixtime();
	const isAvailabilityPeriod = Math.abs(Date.now() - createdAt) < config.api.request_key_expire_sec;
	const isPassed = isAvailabilityPeriod && elements.hash === correctKeyHash && elements.keyCode === doc.key_code;

	return isPassed;
};
