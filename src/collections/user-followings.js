'use strict';

const dbConnector = require('../helpers/db-connector')();

const userFollowingDoc = require('../document-models/user-following');

module.exports = async () => {
	const instance = {};
	const dbManager = await dbConnector.connectApidbAsync();

	instance.createAsync = async () => {
		// TODO
		const result = await dbManager.createAsync('userFollowings', {});

		return userFollowingDoc(result.ops[0]._id, dbManager);
	};

	instance.findAsync = async (query) => {
		const doc = await dbManager.findArrayAsync('userFollowings', query);

		return userFollowingDoc(doc._id, dbManager);
	};

	return instance;
};
