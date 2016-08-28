'use strict';

module.exports = (documentData, dbManager) => new Promise((resolve, reject) => (async () => {
	const instance = {};

	instance.documentData = documentData;
	instance.dbManager = dbManager;

	// TODO: 各種操作用メソッドの追加

	return instance;
})());
