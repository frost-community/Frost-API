'use strict';

const dbConnector = require('./dbConnector');
const type = require('./type');
const mongo = require('mongodb');

module.exports = async (config) => {
	const instance = {};

	if (config == null)
		throw new Error('missing arguments');

	instance.dbProvider = await dbConnector.connectApidbAsync(config);

	const collectionBase = (collectionName, targetDocumentModel, dbProvider) => {
		const instance2 = {};

		if (collectionName == null || targetDocumentModel == null || dbProvider == null)
			throw new Error('missing arguments');

		instance2.createAsync = async (data) => {
			const result = await dbProvider.createAsync(collectionName, data);

			return targetDocumentModel(result.ops[0], instance, config);
		};

		instance2.findAsync = async (query) => {
			const document = await dbProvider.findAsync(collectionName, query);

			if (document == null)
				return null;

			return targetDocumentModel(document, instance, config);
		};

		instance2.findIdAsync = async (id) => {
			let parsedId = id;
			try {
				if (type(id) == 'String')
					parsedId = mongo.ObjectID(id);
			}
			catch(e) {
				return null;
			}

			return await instance2.findAsync({_id: parsedId});
		};

		instance2.findArrayAsync = async (query) => {
			const documents = await dbProvider.findArrayAsync(collectionName, query);

			if (documents == null || documents.length === 0)
				return null;

			const res = [];
			for (const document of documents)
				res.push(targetDocumentModel(document, instance, config));

			return res;
		};

		instance2.updateAsync = async (query, data) => await dbProvider.updateAsync(collectionName, query, data);

		instance2.updateIdAsync = async (id, data) => {
			let parsedId = id;
			try {
				if (type(id) == 'String')
					parsedId = mongo.ObjectID(id);
			}
			catch(e) {
				return null;
			}

			return await instance2.updateAsync({_id: parsedId}, data);
		};

		instance2.removeAsync = async (query) => await dbProvider.removeAsync(collectionName, query);

		return instance2;
	};

	instance.applications = collectionBase('applications', require('../documentModels/application'), instance.dbProvider);
	instance.applicationAccess = collectionBase('applicationAccesses', require('../documentModels/applicationAccess'), instance.dbProvider);
	instance.authorizeRequests = collectionBase('authorizeRequests', require('../documentModels/authorizeRequest'), instance.dbProvider);
	instance.posts = collectionBase('posts', require('../documentModels/post'), instance.dbProvider);
	instance.users = collectionBase('users', require('../documentModels/user'), instance.dbProvider);
	instance.userFollowings = collectionBase('userFollowings', require('../documentModels/userFollowing'), instance.dbProvider);

	return instance;
};
