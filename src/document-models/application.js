'use strict';

module.exports = (documentData, dbManager) => new Promise((resolve, reject) => (async () => {
	const instance = {};

	instance.documentData = documentData;
	instance.dbManager = dbManager;

	instance.isHasPermission = () => new Promise((resolve, reject) => (async () => {
		// TODO
	})());

	instance.generateApplicationKey = () => new Promise((resolve, reject) => (async () => {
		// TODO
	})());

	instance.getApplicationKey = () => new Promise((resolve, reject) => (async () => {
		// TODO
	})());

	return instance;
})());
