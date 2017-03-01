'use strict';

const dbConnector = require('../helpers/db-connector')();

const applicationAccessDoc = require('../document-models/application-access');

module.exports = async () => {
	const instance = {};
	const dbManager = await dbConnector.connectApidbAsync();

	instance.createAsync = async () => {
		// TODO
		const result = await dbManager.createAsync('application-accesses', {});

		return applicationAccessDoc(result.ops[0]._id, dbManager);
	};

	instance.findAsync = async (query) => {
		const doc = await dbManager.findArrayAsync('application-accesses', query);

		return applicationAccessDoc(doc._id, dbManager);
	};

	return instance;
};
