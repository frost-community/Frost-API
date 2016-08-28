'use strict';

const dbConnector = require('../modules/db-connector')();
const postDoc = require('../document-models/post');

module.exports = () => new Promise((resolve, reject) => (async () => {
	const instance = {};
	const dbManager = await dbConnector.connectApidbAsync();

	instance.create = () => new Promise((resolve, reject) => (async () => {
		// TODO
		const result = await dbManager.createAsync('posts', {});

		return postDoc(result.opt[0]._id, dbManager);
	})());

	instance.find = () => new Promise((resolve, reject) => (async () => {
		// TODO
		const doc = await dbManager.findArrayAsync('posts', {});

		return postDoc(doc._id, dbManager);
	})());

	return instance;
})());
