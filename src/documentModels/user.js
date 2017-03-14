'use strict';

// const userModelAsync = require('../models/user');
const users = require('../helpers/collections').users;

module.exports = async (document, config) => {
	const instance = {};

	instance.document = document;
	instance.collection = await users(config);
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

	return instance;
};
