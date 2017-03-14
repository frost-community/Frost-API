'use strict';

const dbConnector = require('./dbConnector');
const type = require('./type');
const mongo = require('mongodb');

const collectionBase = async (collectionName, targetDocumentModel, config) => {
	const instance = {};

	if (config == null)
		config = require('./loadConfig')();

	const dbManager = await dbConnector.connectApidbAsync(config);

	instance.createAsync = async (data) => {
		const result = await dbManager.createAsync(collectionName, data);

		return targetDocumentModel(result.ops[0], config);
	};

	instance.findAsync = async (query) => {
		const document = await dbManager.findAsync(collectionName, query);

		if (document == null)
			return null;

		return targetDocumentModel(document, config);
	};

	instance.findIdAsync = async (id) => {
		let parsedId = id;
		try {
			if (type(id) == 'String')
				parsedId = mongo.ObjectID(id);
		}
		catch(e) {
			return null;
		}

		return await instance.findAsync({_id: parsedId});
	};

	instance.findArrayAsync = async (query) => {
		const documents = await dbManager.findArrayAsync(collectionName, query);

		if (documents == null || documents.length === 0)
			return null;

		const res = [];
		for (const document of documents)
			res.push(targetDocumentModel(document, config));

		return res;
	};

	instance.updateAsync = async (query, data) => await dbManager.updateAsync(collectionName, query, data);

	instance.updateIdAsync = async (id, data) => {
		let parsedId = id;
		try {
			if (type(id) == 'String')
				parsedId = mongo.ObjectID(id);
		}
		catch(e) {
			return null;
		}

		return await instance.updateAsync({_id: parsedId}, data);
	};

	instance.removeAsync = async (query) => await dbManager.removeAsync(collectionName, query);

	return instance;
};

exports.applications = async (config) => collectionBase('applications', require('../documentModels/application'), config);

exports.applicationAccess = async (config) => collectionBase('applicationAccesses', require('../documentModels/applicationAccess'), config);

exports.authorizeRequests = async (config) => collectionBase('authorizeRequests', require('../documentModels/authorizeRequest'), config);

exports.posts = async (config) => collectionBase('posts', require('../documentModels/post'), config);

exports.users = async (config) => collectionBase('users', require('../documentModels/user'), config);

exports.userFollowings = async (config) => collectionBase('userFollowings', require('../documentModels/userFollowing'), config);
