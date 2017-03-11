'use strict';

const dbConnector = require('../helpers/dbConnector');
const postDoc = require('../documentModels/post');

module.exports = async (config) => {
	const instance = {};

	if (config == null)
		config = require('../helpers/loadConfig')();

	const dbManager = await dbConnector.connectApidbAsync(config);

	instance.createAsync = async () => {
		// TODO
		const result = await dbManager.createAsync('posts', {});

		return postDoc(result.ops[0], dbManager);
	};

	instance.findAsync = async (query) => {
		const document = await dbManager.findArrayAsync('posts', query);

		if (document == null)
			return null;

		return postDoc(document, dbManager);
	};

	instance.findIdAsync = async (id) => {
		return await instance.findAsync({_id: id});
	};

	instance.findManyAsync = async (query) => {
		const documents = await dbManager.findArrayAsync('posts', query);

		if (documents == null || documents.length === 0)
			return null;

		const res = [];
		for (const document of documents)
			res.push(postDoc(document, dbManager));

		return res;
	};

	return instance;
};
