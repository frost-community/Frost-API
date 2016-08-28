'use strict';

const dbConnector = require('../modules/db-connector')();
const authorizeRequestDoc = require('../document-models/authorize-request');

module.exports = () => new Promise((resolve, reject) => (async () => {
	const instance = {};
	const dbManager = await dbConnector.connectApidbAsync();

	instance.create = () => new Promise((resolve, reject) => (async () => {
		// TODO
		const result = await dbManager.createAsync('authorizeRequests', {});

		return authorizeRequestDoc(result.opt[0]._id, dbManager);
	})());

	instance.find = () => new Promise((resolve, reject) => (async () => {
		// TODO
		const doc = await dbManager.findArrayAsync('authorizeRequests', {});

		return authorizeRequestDoc(doc._id, dbManager);
	})());

	return instance;
})());
