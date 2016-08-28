'use strict';

const dbConnector = require('../modules/db-connector')();
const applicationAccessDoc = require('../document-models/application-access');

module.exports = () => new Promise((resolve, reject) => (async () => {
	const instance = {};
	const dbManager = await dbConnector.connectApidbAsync();

	instance.create = () => new Promise((resolve, reject) => (async () => {
		// TODO
		const doc = await dbManager.createAsync('application-accesses', {});

		return applicationAccessDoc(doc, dbManager);
	})());

	instance.find = () => new Promise((resolve, reject) => (async () => {
		// TODO
		const doc = await dbManager.findArrayAsync('application-accesses', {});

		return applicationAccessDoc(doc, dbManager);
	})());

	return instance;
})());
