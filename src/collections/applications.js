'use strict';

const dbConnector = require('../helpers/dbConnector')();

const applicationDoc = require('../documentModels/application');

module.exports = async () => {
	const instance = {};
	const dbManager = await dbConnector.connectApidbAsync();

	instance.createAsync = async () => {
		// TODO
		const result = await dbManager.createAsync('applications', {});

		return applicationDoc(result.ops[0]._id, dbManager);
	};

	instance.findAsync = async (query) => {
		const doc = await dbManager.findArrayAsync('applications', query);

		return applicationDoc(doc._id, dbManager);
	};

	return instance;
};
