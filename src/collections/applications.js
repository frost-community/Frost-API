'use strict';

const dbConnector = require('../modules/db-connector')();
const applicationDoc = require('../document-models/application');

module.exports = () => new Promise((resolve, reject) => (async () => {
	const instance = {};
	const dbManager = await dbConnector.connectApidbAsync();

	instance.create = () => new Promise((resolve, reject) => (async () => {
		// TODO
		const doc = await dbManager.createAsync('applications', {});

		return applicationDoc(doc, dbManager);
	})());

	instance.find = () => new Promise((resolve, reject) => (async () => {
		// TODO
		const doc = await dbManager.findArrayAsync('applications', {});

		return applicationDoc(doc, dbManager);
	})());

	return instance;
})());
