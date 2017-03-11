'use strict';

const dbConnector = require('../helpers/dbConnector');
const objectId = require('mongodb').ObjectID;
const type = require('../helpers/type');
const targetDocumentModel = require('../documentModels/authorizeRequest');
const collectionName = 'authorizeRequests';

module.exports = async (config) => {
	const instance = {};

	if (config == null)
		config = require('../helpers/loadConfig')();

	const dbManager = await dbConnector.connectApidbAsync(config);

	instance.createAsync = async (applicationId) => {

		const result = await dbManager.createAsync(collectionName, {applicationId: applicationId});

		return targetDocumentModel(result.ops[0], dbManager);
	};

	instance.findAsync = async (query) => {
		const document = await dbManager.findAsync(collectionName, query);

		if (document == null)
			return null;

		return targetDocumentModel(document, dbManager);
	};

	instance.findIdAsync = async (id) => {
		return await instance.findAsync({_id: type(id) == 'ObjectID' ? id : objectId(id)});
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
