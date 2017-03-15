'use strict';

// const userModelAsync = require('../models/user');

module.exports = async (document, db, config) => {
	const instance = {};

	if (document == null || db == null || config == null)
		throw new Error('missing arguments');

	instance.document = document;
	//const userModel = await userModelAsync(db, config);

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
		instance.document = (await db.users.findIdAsync(instance.document._id)).document;
	};

	return instance;
};
