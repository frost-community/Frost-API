'use strict';

const dbConnector = require('../helpers/dbConnector')();

const authorizeRequestDoc = require('../documentModels/authorizeRequest');

module.exports = async () => {
	const instance = {};
	const dbManager = await dbConnector.connectApidbAsync();

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
