'use strict';

const dbConnector = require('../modules/db-connector')();
const userFollowingDoc = require('../document-models/user-following');

module.exports = async () => {
	const instance = {};
	const dbManager = await dbConnector.connectApidbAsync();

	instance.create = async () => {
		// TODO
		const result = await dbManager.createAsync('userFollowings', {});

		return userFollowingDoc(result.ops[0]._id, dbManager);
	};

	instance.find = async () => {
		// TODO
		const doc = await dbManager.findArrayAsync('userFollowings', {});

		return userFollowingDoc(doc._id, dbManager);
	};

	return instance;
};
