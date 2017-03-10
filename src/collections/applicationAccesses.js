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
		const result = await dbManager.findAsync('applicationAccesses', query);

		if (result == null)
			return null;

		return applicationAccessDoc(result._id, dbManager);
	};

	instance.findManyAsync = async (query) => {
		const results = await dbManager.findArrayAsync('applicationAccesses', query);

		if (results == null || results.length === 0)
			return null;

		const res = [];
		for (const result of results)
			res.push(applicationAccessDoc(result._id, dbManager));

		return res;
	};

	return instance;
};
