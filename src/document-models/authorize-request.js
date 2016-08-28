'use strict';

module.exports = (documentId, dbManager) => new Promise((resolve, reject) => (async () => {
	const instance = {};

	instance.documentId = documentId;
	instance.dbManager = dbManager;

	instance.generatePinCode = () => new Promise((resolve, reject) => (async () => {
		// TODO
	})());

	instance.generateRequestKey = () => new Promise((resolve, reject) => (async () => {
		// TODO
	})());

	instance.getRequestKey = () => new Promise((resolve, reject) => (async () => {
		// TODO
	})());

	return instance;
})());
