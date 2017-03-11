'use strict';

const dbConnector = require('../helpers/dbConnector')();
const authorizeRequestDoc = require('../documentModels/authorizeRequest');

module.exports = async (config) => {
	const instance = {};

	if (config == null)
		config = require('../helpers/loadConfig')();

	const dbManager = await dbConnector.connectApidbAsync(config);

	instance.createAsync = async (applicationId) => {
		const doc = await dbManager.createAsync('authorizeRequests', {applicationId: applicationId});

		return authorizeRequestDoc(doc.ops[0]._id, dbManager);
	};

	instance.findAsync = async (query) => {
		const doc = await dbManager.findArrayAsync('authorizeRequests', query);

		return authorizeRequestDoc(doc._id, dbManager);
	};

	return instance;
};
