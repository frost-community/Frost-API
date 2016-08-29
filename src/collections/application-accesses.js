'use strict';

const dbConnector = require('../modules/db-connector')();
const applicationAccessDoc = require('../document-models/application-access');

module.exports = async () => {
	const instance = {};
	const dbManager = await dbConnector.connectApidbAsync();

	instance.create = async () => {
		// TODO
		const result = await dbManager.createAsync('application-accesses', {});

		return applicationAccessDoc(result.ops[0]._id, dbManager);
	};

	instance.find = async () => {
		// TODO
		const doc = await dbManager.findArrayAsync('application-accesses', {});

		return applicationAccessDoc(doc._id, dbManager);
	};

	return instance;
};
