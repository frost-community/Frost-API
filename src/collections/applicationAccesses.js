'use strict';

const dbConnector = require('../helpers/dbConnector')();

const applicationAccessDoc = require('../documentModels/applicationAccess');

module.exports = async () => {
	const instance = {};
	const dbManager = await dbConnector.connectApidbAsync();

	instance.createAsync = async () => {
		// TODO
		const result = await dbManager.createAsync('applicationAccesses', {});

		return applicationAccessDoc(result.ops[0]._id, dbManager);
	};

	instance.findAsync = async (query) => {
		const doc = await dbManager.findArrayAsync('applicationAccesses', query);

		return applicationAccessDoc(doc._id, dbManager);
	};

	return instance;
};
