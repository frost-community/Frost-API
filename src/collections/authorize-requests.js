'use strict';

const dbConnector = require('../modules/db-connector')();
const authorizeRequestDoc = require('../document-models/authorize-request');

module.exports = async () => {
	const instance = {};
	const dbManager = await dbConnector.connectApidbAsync();

	instance.createAsync = async () => {
		// TODO
		const result = await dbManager.createAsync('authorizeRequests', {});

		return authorizeRequestDoc(result.ops[0]._id, dbManager);
	};

	instance.findAsync = async (query) => {
		const doc = await dbManager.findArrayAsync('authorizeRequests', query);

		return authorizeRequestDoc(doc._id, dbManager);
	};

	return instance;
};
