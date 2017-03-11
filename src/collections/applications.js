'use strict';

const dbConnector = require('../helpers/dbConnector');
const applicationDoc = require('../documentModels/application');

module.exports = async (config) => {
	const instance = {};

	if (config == null)
		config = require('../helpers/loadConfig')();

	const dbManager = await dbConnector.connectApidbAsync(config);

	instance.createAsync = async (name, creatorId, description, permissions) => {

		const result = await dbManager.createAsync('applications', {name: name, creatorId: creatorId, description: description, permissions: permissions});

		return applicationDoc(result.ops[0], dbManager);
	};

	instance.findAsync = async (query) => {
		const document = await dbManager.findArrayAsync('applications', query);

		if (document == null)
			return null;

		return applicationDoc(document, dbManager);
	};

	instance.findIdAsync = async (id) => {
		return await instance.findAsync({_id: id});
	};

	instance.findManyAsync = async (query) => {
		const documents = await dbManager.findArrayAsync('applications', query);

		if (documents == null || documents.length === 0)
			return null;

		const res = [];
		for (const document of documents)
			res.push(applicationDoc(document, dbManager));

		return res;
	};

	return instance;
};
