'use strict';

// const userModelAsync = require('../models/user');
const usersAsync = require('../helpers/collections').users;

module.exports = async (document, config) => {
	const instance = {};

	instance.document = document;
	const users = await usersAsync(config);
	//const userModel = await userModelAsync(config);

	// TODO: 各種操作用メソッドの追加

	instance.serialize = () => {
		const res = {};
		Object.assign(res, instance.document);

		// id
		res.id = res._id.toString();
		delete res._id;

		// passwordHash
		delete res.passwordHash;

		return res;
	};

	// 最新の情報を取得して同期する
	instance.sync = async () => {
		instance.document = (await users.findIdAsync(instance.document._id)).document;
	};

	return instance;
};
