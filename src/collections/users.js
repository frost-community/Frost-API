'use strict';

const dbConnector = require('../helpers/dbConnector')();

const userDoc = require('../documentModels/user');

module.exports = async () => {
	const instance = {};
	const dbManager = await dbConnector.connectApidbAsync();

	instance.createAsync = async () => {
		// TODO
		const result = await dbManager.createAsync('users', {});

		return userDoc(result.ops[0]._id, dbManager);
	};

	instance.findAsync = async (query) => {
		const doc = await dbManager.findArrayAsync('users', query);

		return userDoc(doc._id, dbManager);
	};

	return instance;
};
