'use strict';

const dbConnector = require('../modules/db-connector')();
const authorizeRequestDoc = require('../document-models/authorize-request');

module.exports = async () => {
	const instance = {};
	const dbManager = await dbConnector.connectApidbAsync();

	instance.create = async () => {
		// TODO
		const result = await dbManager.createAsync('authorizeRequests', {});

		return authorizeRequestDoc(result.ops[0]._id, dbManager);
	};

	instance.find = async () => {
		// TODO
		const doc = await dbManager.findArrayAsync('authorizeRequests', {});

		return authorizeRequestDoc(doc._id, dbManager);
	};

	return instance;
};
