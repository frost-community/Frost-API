'use strict';

const dbConnector = require('../helpers/dbConnector');
const targetDocumentModel = require('../documentModels/user');
const collectionName = 'users';

module.exports = async (config) => {
	const instance = {};

	if (config == null)
		config = require('../helpers/loadConfig')();

	const dbManager = await dbConnector.connectApidbAsync(config);

	instance.createAsync = async (screenName, passwordHash, description) => {
		// TODO
		const result = await dbManager.createAsync(collectionName, {});

		return targetDocumentModel(result.ops[0], dbManager);
	};

	instance.findAsync = async (query) => {
		const document = await dbManager.findArrayAsync(collectionName, query);

		if (document == null)
			return null;

		return targetDocumentModel(document, dbManager);
	};

	instance.findIdAsync = async (id) => {
		return await instance.findAsync({_id: id});
	};

	instance.findManyAsync = async (query) => {
		const documents = await dbManager.findArrayAsync(collectionName, query);

		if (documents == null || documents.length === 0)
			return null;

		const res = [];
		for (const document of documents)
			res.push(targetDocumentModel(document, dbManager));

		return res;
	};

	return instance;
};
