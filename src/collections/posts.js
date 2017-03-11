'use strict';

const dbConnector = require('../helpers/dbConnector')();
const postDoc = require('../documentModels/post');

module.exports = async (config) => {
	const instance = {};

	if (config == null)
		config = require('../helpers/loadConfig')();

	const dbManager = await dbConnector.connectApidbAsync(config);

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
