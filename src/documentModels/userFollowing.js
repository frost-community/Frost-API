'use strict';

module.exports = async (document, dbManager) => {
	const instance = {};

	// id加工
	document.id = document._id.toString();
	delete document._id;

	instance.document = document;
	instance.dbManager = dbManager;

	// TODO: 各種操作用メソッドの追加

	return instance;
};
