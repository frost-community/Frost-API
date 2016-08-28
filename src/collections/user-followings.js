'use strict';

const dbConnector = require('../modules/db-connector')();
const userFollowingDoc = require('../document-models/user-following');

module.exports = () => new Promise((resolve, reject) => (async () => {
	const instance = {};
	const dbManager = await dbConnector.connectApidbAsync();

	instance.create = () => new Promise((resolve, reject) => (async () => {
		// TODO
		const doc = await dbManager.createAsync('userFollowings', {});

		return userFollowingDoc(doc);
	})());

	instance.find = () => new Promise((resolve, reject) => (async () => {
		// TODO
		const doc = await dbManager.findArrayAsync('userFollowings', {});

		return userFollowingDoc(doc);
	})());

	return instance;
})());
