'use strict';

module.exports = async (documentId, dbManager) => {
	const instance = {};

	instance.documentId = documentId;
	instance.dbManager = dbManager;

	// TODO: 各種操作用メソッドの追加

	return instance;
};
