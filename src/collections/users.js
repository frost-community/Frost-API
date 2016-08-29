'use strict';

const dbConnector = require('../modules/db-connector')();
const userDoc = require('../document-models/user');

module.exports = async () => {
	const instance = {};
	const dbManager = await dbConnector.connectApidbAsync();

	instance.create = async () => {
		// TODO
		const result = await dbManager.createAsync('users', {});

		return userDoc(result.ops[0]._id, dbManager);
	};

	instance.find = async () => {
		// TODO
		const doc = await dbManager.findArrayAsync('users', {});

		return userDoc(doc._id, dbManager);
	};

	return instance;
};
