'use strict';

const dbConnector = require('../helpers/dbConnector');
const authorizeRequestDoc = require('../documentModels/authorizeRequest');

module.exports = async (config) => {
	const instance = {};

	if (config == null)
		config = require('../helpers/loadConfig')();

	const dbManager = await dbConnector.connectApidbAsync(config);

	instance.createAsync = async (applicationId) => {

		const result = await dbManager.createAsync('authorizeRequests', {applicationId: applicationId});

		return authorizeRequestDoc(result.ops[0], dbManager);
	};

	instance.findAsync = async (query) => {
		const document = await dbManager.findArrayAsync('authorizeRequests', query);

		if (document == null)
			return null;

		return authorizeRequestDoc(document, dbManager);
	};

	instance.findIdAsync = async (id) => {
		return await instance.findAsync({_id: id});
	};

	instance.findManyAsync = async (query) => {
		const documents = await dbManager.findArrayAsync('authorizeRequests', query);

		if (documents == null || documents.length === 0)
			return null;

		const res = [];
		for (const document of documents)
			res.push(authorizeRequestDoc(document, dbManager));

		return res;
	};

	return instance;
};
