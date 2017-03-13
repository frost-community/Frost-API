'use strict';

// const userModelAsync = require('../models/user');
const users = require('../helpers/collections').users;

module.exports = async (document, config) => {
	const instance = {};

	// id加工
	document.id = document._id.toString();
	delete document._id;

	instance.document = document;
	instance.collection = await users(config);
	//const userModel = await userModelAsync(config);

	// TODO: 各種操作用メソッドの追加

	return instance;
};
