'use strict';

const dbConnector = require('../modules/db-connector')();
const userDoc = require('../document-models/user');

module.exports = () => new Promise((resolve, reject) => (async () => {
	const instance = {};
	const dbManager = await dbConnector.connectApidbAsync();

	instance.create = () => new Promise((resolve, reject) => (async () => {
		// TODO
		const result = await dbManager.createAsync('users', {});

		return userDoc(result.opt[0]._id, dbManager);
	})());

	instance.find = () => new Promise((resolve, reject) => (async () => {
		// TODO
		const doc = await dbManager.findArrayAsync('users', {});

		return userDoc(doc._id, dbManager);
	})());

	return instance;
})());
