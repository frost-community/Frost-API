'use strict';

module.exports = (documentId, dbManager) => new Promise((resolve, reject) => (async () => {
	const instance = {};

	instance.documentId = documentId;
	instance.dbManager = dbManager;

	instance.generateAccessKey = () => new Promise((resolve, reject) => (async () => {
		// TODO
	})());

	instance.getAccessKey = () => new Promise((resolve, reject) => (async () => {
		// TODO
	})());

	return instance;
})());
