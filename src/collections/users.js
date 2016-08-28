'use strict';

const dbConnector = require('../modules/db-connector')();
const userDoc = require('../document-models/user');

module.exports = () => new Promise((resolve, reject) => (async () => {
	const instance = {};
	const dbManager = await dbConnector.connectApidbAsync();

	instance.create = () => new Promise((resolve, reject) => (async () => {
		// TODO
		const doc = await dbManager.createAsync('user', {});

		return userDoc(doc);
	})());

	instance.find = () => new Promise((resolve, reject) => (async () => {
		// TODO
		const doc = await dbManager.findArrayAsync('user', {});

		return userDoc(doc);
	})());

	return instance;
})());
