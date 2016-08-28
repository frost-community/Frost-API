'use strict';

module.exports = (documentId, dbManager) => new Promise((resolve, reject) => (async () => {
	const instance = {};

	instance.documentId = documentId;
	instance.dbManager = dbManager;

	// TODO: 各種操作用メソッドの追加

	return instance;
})());
