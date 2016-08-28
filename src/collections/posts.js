'use strict';

const dbConnector = require('../modules/db-connector')();
const postDoc = require('../document-models/post');

module.exports = () => new Promise((resolve, reject) => (async () => {
	const instance = {};
	const dbManager = await dbConnector.connectApidbAsync();

	instance.create = () => new Promise((resolve, reject) => (async () => {
		// TODO
		const doc = await dbManager.createAsync('posts', {});

		return postDoc(doc);
	})());

	instance.find = () => new Promise((resolve, reject) => (async () => {
		// TODO
		const doc = await dbManager.findArrayAsync('posts', {});

		return postDoc(doc);
	})());

	return instance;
})());
