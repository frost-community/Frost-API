'use strict';

const crypto = require('crypto');
const ObjectId = require('mongodb').ObjectId;

const config = require('../helpers/load-config')();
const dbConnector = require('../helpers/db-connector')();
require('../helpers/object-id-extension')();

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
	const reg = /([^-]+)-([^-]{64}).([0-9]+)/.exec(key);

	if (reg == null)
		throw new Error('request key is invalid format');

	return {authorizeRequestId: new ObjectId(reg[1]), hash: reg[2], keyCode: parseInt(reg[3])};
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
	const doc = await dbManager.findAsync('authorizeRequests', {_id: elements.authorizeRequestId});

	if (doc == null)
		return false;

	const correctKeyHash = buildRequestKeyHash(elements.authorizeRequestId, doc.application_id, elements.keyCode);
	const createdAt = doc._id.getUnixtime();
	const isAvailabilityPeriod = Math.abs(Date.now() - createdAt) < config.api.request_key_expire_sec;
	const isPassed = isAvailabilityPeriod && elements.hash === correctKeyHash && elements.keyCode === doc.key_code;

	return isPassed;
};
