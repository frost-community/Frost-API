'use strict';

const dbConnector = require('../helpers/dbConnector');
const userDoc = require('../documentModels/user');

module.exports = async (config) => {
	const instance = {};

	if (config == null)
		config = require('../helpers/loadConfig')();

	const dbManager = await dbConnector.connectApidbAsync(config);

	instance.createAsync = async (screenName, passwordHash, description) => {
		// TODO
		const result = await dbManager.createAsync('users', {});

		return userDoc(result.ops[0], dbManager);
	};

	instance.findAsync = async (query) => {
		const document = await dbManager.findArrayAsync('users', query);

		if (document == null)
			return null;

		return userDoc(document, dbManager);
	};

	instance.findIdAsync = async (id) => {
		return await instance.findAsync({_id: id});
	};

	instance.findManyAsync = async (query) => {
		const documents = await dbManager.findArrayAsync('users', query);

		if (documents == null || documents.length === 0)
			return null;

		const res = [];
		for (const document of documents)
			res.push(userDoc(document, dbManager));

		return res;
	};

	return instance;
};
