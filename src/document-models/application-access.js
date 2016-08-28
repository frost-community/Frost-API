'use strict';

module.exports = (documentData, dbManager) => new Promise((resolve, reject) => (async () => {
	const instance = {};

	instance.documentData = documentData;
	instance.dbManager = dbManager;

	instance.generateAccessKey = () => new Promise((resolve, reject) => (async () => {
		// TODO
	})());

	instance.getAccessKey = () => new Promise((resolve, reject) => (async () => {
		// TODO
	})());

	return instance;
})());
