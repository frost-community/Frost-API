'use strict';

const dbConnector = require('../helpers/dbConnector')();

const postDoc = require('../documentModels/post');

module.exports = async () => {
	const instance = {};
	const dbManager = await dbConnector.connectApidbAsync();

	instance.createAsync = async () => {
		// TODO
		const result = await dbManager.createAsync('posts', {});

		return postDoc(result.ops[0]._id, dbManager);
	};

	instance.findAsync = async (query) => {
		const doc = await dbManager.findArrayAsync('posts', query);

		return postDoc(doc._id, dbManager);
	};

	return instance;
};
