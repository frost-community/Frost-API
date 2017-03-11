'use strict';

const dbConnector = require('../helpers/dbConnector');
const applicationAccessDoc = require('../documentModels/applicationAccess');

module.exports = async (config) => {
	const instance = {};

	if (config == null)
		config = require('../helpers/loadConfig')();

	const dbManager = await dbConnector.connectApidbAsync(config);

	instance.createAsync = async () => {
		// TODO
		const result = await dbManager.createAsync('applicationAccesses', {});

		return applicationAccessDoc(result.ops[0], dbManager);
	};

	instance.findAsync = async (query) => {
		const document = await dbManager.findAsync('applicationAccesses', query);

		if (document == null)
			return null;

		return applicationAccessDoc(document, dbManager);
	};

	instance.findIdAsync = async (id) => {
		return await instance.findAsync({_id: id});
	};

	instance.findManyAsync = async (query) => {
		const documents = await dbManager.findArrayAsync('applicationAccesses', query);

		if (documents == null || documents.length === 0)
			return null;

		const res = [];
		for (const document of documents)
			res.push(applicationAccessDoc(document, dbManager));

		return res;
	};

	return instance;
};
